"""Publish the owner-approved Set 3 opening edit without changing assessment content.
Original recordings and completed attempts remain immutable. No private text is logged.
"""
import concurrent.futures,hashlib,json,os,pathlib,subprocess,tempfile,time,urllib.request
ROOT=pathlib.Path(__file__).resolve().parent.parent
CONFIG=json.loads((ROOT/'wrangler.local.jsonc').read_text())
TOKEN=os.environ['CLOUDFLARE_API_TOKEN'].strip()
ENDPOINT='https://api.cloudflare.com/client/v4/accounts/'+CONFIG['account_id']+'/d1/database/'+CONFIG['d1_databases'][0]['database_id']+'/query'
OLD='listening-production-03-v1';NEW='listening-production-03-v2'
SOURCE='570fb88212c2a3d2b2d0d6c73763d5999eae211edd183b8fad14b0d69934c8f4'
def query(sql,params=[]):
 req=urllib.request.Request(ENDPOINT,headers={'Authorization':'Bearer '+TOKEN,'Content-Type':'application/json'},data=json.dumps({'sql':sql,'params':params}).encode())
 with urllib.request.urlopen(req,timeout=40) as r:d=json.load(r)
 if not d.get('success') or any(not x.get('success') for x in d.get('result',[])):raise RuntimeError('Listening database operation failed')
 return d['result'][0].get('results',[])
def cli(*args):
 p=subprocess.run(['npx','--yes','wrangler@4.156.0',*args],cwd=ROOT,capture_output=True,text=True)
 if p.returncode:raise RuntimeError('Private audio storage operation failed')
def seconds(path):return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(path)],text=True))
def decode(path):
 p=subprocess.run(['ffmpeg','-v','error','-i',str(path),'-f','null','-'],capture_output=True,text=True,check=True)
 assert not p.stderr
old=query('SELECT * FROM listening_sets WHERE id=?',[OLD])[0]
audios=query('SELECT * FROM listening_audio WHERE set_id=? ORDER BY part',[OLD])
groups=query('SELECT * FROM listening_groups WHERE set_id=? ORDER BY part,group_no',[OLD])
assert old['published_at'] and len(audios)==4 and len(groups)==5 and audios[0]['sha256']==SOURCE
existing=query('SELECT published_at FROM listening_sets WHERE id=?',[NEW])
if existing and existing[0]['published_at']:
 assert query('SELECT new_set_id FROM listening_set_replacements WHERE old_set_id=?',[OLD])[0]['new_set_id']==NEW
 print('Approved opening edit is already published.');raise SystemExit
with tempfile.TemporaryDirectory(prefix='listening-opening-') as folder:
 tmp=pathlib.Path(folder);rows=audios+groups
 def download(i):
  row=rows[i];p=tmp/(str(i)+'.mp3');cli('r2','object','get','telw-ielts-listening-audio/'+row['object_key'],'--file',str(p),'--remote')
  assert hashlib.sha256(p.read_bytes()).hexdigest()==row['sha256'] and p.stat().st_size==row['size']
  return p
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:paths=list(pool.map(download,range(len(rows))))
 out=tmp/'edited.mp3'
 # Both splice boundaries lie inside reviewed silence. Keep "Part 1" and
 # all following instructions/dialogue; remove only the intervening sentence.
 subprocess.run(['ffmpeg','-v','error','-i',str(paths[0]),'-filter_complex','[0:a]asplit=2[a][b];[a]atrim=end=1.45,asetpts=PTS-STARTPTS[a1];[b]atrim=start=6.85,asetpts=PTS-STARTPTS[b1];[a1][b1]concat=n=2:v=0:a=1[out]','-map','[out]','-ar','44100','-ac','1','-b:a','96k','-y',str(out)],check=True)
 decode(out);duration=seconds(out);assert abs(duration-(audios[0]['duration']-5.4))<0.15
 # A separate grouped copy has its own storage key; it contains the same complete Part 1.
 edited=[]
 for i,row in enumerate(rows):
  row=dict(row);path=out if row['part']==1 else paths[i];decode(path)
  row.update(set_id=NEW,object_key='opening-edit/'+NEW+'/'+('full' if i<4 else 'group')+'-'+str(row['part'])+'-'+str(row.get('group_no',0))+'.mp3',duration=seconds(path),size=path.stat().st_size,sha256=hashlib.sha256(path.read_bytes()).hexdigest())
  if row['part']!=1:assert row['sha256']==rows[i]['sha256']
  cli('r2','object','put','telw-ielts-listening-audio/'+row['object_key'],'--file',str(path),'--remote','--content-type','audio/mpeg')
  edited.append(row)
 pub=json.loads(old['public_json']);pub['id']=NEW
 if not existing:query('INSERT INTO listening_sets(id,title,public_json,private_json,review_json,created_at) VALUES(?,?,?,?,?,?)',[NEW,old['title'],json.dumps(pub),old['private_json'],json.dumps({'sourceSet':OLD,'change':'Remove one non-assessment sentence from opening; instructions, questions, evidence and dialogue unchanged','removedSeconds':5.4}),int(time.time())])
 for i,row in enumerate(edited):
  table='listening_audio' if i<4 else 'listening_groups';columns=list(row)
  prior=query('SELECT sha256 FROM '+table+' WHERE set_id=? AND part=?'+(' AND group_no=?' if i>=4 else ''),[NEW,row['part']]+([row['group_no']] if i>=4 else []))
  if prior:assert prior[0]['sha256']==row['sha256']
  else:query('INSERT INTO '+table+'('+','.join(columns)+') VALUES('+','.join('?' for _ in columns)+')',[row[k] for k in columns])
 assert sorted(q for g in edited[4:] for q in range(g['from_q'],g['to_q']+1))==list(range(1,41))
 # Replace allocation before publication; no incomplete version can be assigned.
 query('INSERT INTO listening_set_replacements VALUES(?,?,?) ON CONFLICT(old_set_id) DO NOTHING',[OLD,NEW,int(time.time())])
 assert query('SELECT new_set_id FROM listening_set_replacements WHERE old_set_id=?',[OLD])[0]['new_set_id']==NEW
 query('UPDATE listening_sets SET published_at=? WHERE id=? AND published_at IS NULL',[int(time.time()),NEW])
 active=query('SELECT s.id FROM listening_sets s WHERE s.published_at IS NOT NULL AND NOT EXISTS(SELECT 1 FROM listening_set_replacements r WHERE r.old_set_id=s.id)')
 assert len(active)==5 and NEW in [r['id'] for r in active]
 print('Opening sentence removed. All nine recordings fully decoded; other parts unchanged. Five active sets; all forty questions preserved.')
 print('Set 3 Part 1 duration: '+str(round(duration,3))+' seconds. Original versions and results retained.')
