"""Owner-approved Listening-only pacing versions. Never change words, pitch or keys.
Private audio remains in R2; original versions and attempt history are retained.
"""
import concurrent.futures,hashlib,json,os,pathlib,subprocess,tempfile,time,urllib.request
ROOT=pathlib.Path(__file__).resolve().parent.parent
CONFIG=json.loads((ROOT/'wrangler.local.jsonc').read_text());TOKEN=os.environ['CLOUDFLARE_API_TOKEN'].strip()
ENDPOINT='https://api.cloudflare.com/client/v4/accounts/'+CONFIG['account_id']+'/d1/database/'+CONFIG['d1_databases'][0]['database_id']+'/query'
WPM=135
# The spoken check/closing cue durations are generated assets, measured by ffprobe.
def cue_seconds(name):return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(ROOT/'public/cues'/name)],text=True))
def query(sql,params=[]):
 req=urllib.request.Request(ENDPOINT,headers={'Authorization':'Bearer '+TOKEN,'Content-Type':'application/json'},data=json.dumps({'sql':sql,'params':params}).encode())
 with urllib.request.urlopen(req,timeout=40) as r:d=json.load(r)
 if not d.get('success') or any(not x.get('success') for x in d.get('result',[])):raise RuntimeError('Listening database operation failed')
 return d['result'][0].get('results',[])
def cli(*args):
 p=subprocess.run(['npx','--yes','wrangler@4.156.0',*args],cwd=ROOT,capture_output=True,text=True)
 if p.returncode:raise RuntimeError('Private audio storage operation failed')
def seconds(path):return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(path)],text=True))
sets=query('SELECT s.* FROM listening_sets s WHERE s.published_at IS NOT NULL AND NOT EXISTS(SELECT 1 FROM listening_set_replacements r WHERE r.old_set_id=s.id) ORDER BY s.id')
assert len(sets)==5
if all(s['id'].endswith('-computer-v1') for s in sets):print('Five computer-format versions already published.');raise SystemExit
assert all(not s['id'].endswith('-computer-v1') for s in sets)
with tempfile.TemporaryDirectory(prefix='listening-computer-') as folder:
 tmp=pathlib.Path(folder);jobs=[];versions=[]
 for s in sets:
  audios=query('SELECT * FROM listening_audio WHERE set_id=? ORDER BY part',[s['id']]);groups=query('SELECT * FROM listening_groups WHERE set_id=? ORDER BY part,group_no',[s['id']])
  assert len(audios)==4 and [q for g in groups for q in range(g['from_q'],g['to_q']+1)]==list(range(1,41))
  priv=json.loads(s['private_json']);ratios={}
  for a in audios:
   count=sum(len(t['text'].split()) for t in priv['parts'][a['part']-1]['turns']);desired=count*60/WPM
   ratios[a['part']]=a['duration']/desired;assert .55<ratios[a['part']]<1.35
  version={'source':s,'id':s['id']+'-computer-v1','rows':[],'ratios':ratios};versions.append(version)
  for table,rows in [('listening_audio',audios),('listening_groups',groups)]:
   for row in rows:jobs.append((version,table,row,len(jobs)))
 def build(job):
  version,table,row,index=job;src=tmp/(str(index)+'-src.mp3');out=tmp/(str(index)+'-out.mp3')
  cli('r2','object','get','telw-ielts-listening-audio/'+row['object_key'],'--file',str(src),'--remote')
  assert hashlib.sha256(src.read_bytes()).hexdigest()==row['sha256'] and src.stat().st_size==row['size']
  ratio=version['ratios'][row['part']]
  subprocess.run(['ffmpeg','-v','error','-i',str(src),'-af','atempo='+str(ratio),'-ar','44100','-ac','1','-b:a','96k','-y',str(out)],check=True)
  check=subprocess.run(['ffmpeg','-v','error','-i',str(out),'-f','null','-'],capture_output=True,text=True,check=True);assert not check.stderr
  duration=seconds(out);assert abs(duration-row['duration']/ratio)<.25
  sha=hashlib.sha256(out.read_bytes()).hexdigest();kind='full' if table=='listening_audio' else 'group-'+str(row['group_no'])
  key='computer-v1/'+version['id']+'/part-'+str(row['part'])+'-'+kind+'-'+sha+'.mp3'
  cli('r2','object','put','telw-ielts-listening-audio/'+key,'--file',str(out),'--remote','--content-type','audio/mpeg')
  return version['id'],table,{**row,'set_id':version['id'],'object_key':key,'duration':duration,'size':out.stat().st_size,'sha256':sha}
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:built=list(pool.map(build,jobs))
 for v in versions:
  groups=[row for id,table,row in built if id==v['id'] and table=='listening_groups']
  v['schedule']=sum(g['duration']+g['reading_seconds']+g['read_cue_seconds']+g['listen_cue_seconds'] for g in groups)+3*(30+cue_seconds('check-part.mp3'))+cue_seconds('end-computer.mp3')+120
  assert 1800<=v['schedule']<=2040
 print('Verified and fully decoded '+str(len(built))+' private recordings. Every schedule is between 30 and 34 minutes.',flush=True)
 for v in versions:
  old=v['source'];pub=json.loads(old['public_json']);pub.update(id=v['id'],timingProfile='ielts-computer-v1')
  prior=query('SELECT published_at FROM listening_sets WHERE id=?',[v['id']])
  if not prior:query('INSERT INTO listening_sets(id,title,public_json,private_json,review_json,created_at) VALUES(?,?,?,?,?,?)',[v['id'],old['title'],json.dumps(pub),old['private_json'],json.dumps({'sourceSet':old['id'],'change':'Pitch-preserving natural pacing; all words, questions and answer keys unchanged','targetContentWordsPerMinute':WPM,'scheduledSeconds':v['schedule']}),int(time.time())])
  for id,table,row in built:
   if id!=v['id']:continue
   prior=query('SELECT sha256 FROM '+table+' WHERE set_id=? AND part=?'+(' AND group_no=?' if table=='listening_groups' else ''),[id,row['part']]+([row['group_no']] if table=='listening_groups' else []))
   if prior:assert prior[0]['sha256']==row['sha256']
   else:query('INSERT INTO '+table+'('+','.join(row)+') VALUES('+','.join('?' for _ in row)+')',list(row.values()))
  query('INSERT INTO listening_set_replacements VALUES(?,?,?) ON CONFLICT(old_set_id) DO NOTHING',[old['id'],v['id'],int(time.time())])
  assert query('SELECT new_set_id FROM listening_set_replacements WHERE old_set_id=?',[old['id']])[0]['new_set_id']==v['id']
  query('UPDATE listening_sets SET published_at=? WHERE id=? AND published_at IS NULL',[int(time.time()),v['id']])
  print(v['id']+': '+str(round(v['schedule'],1))+' seconds, including three part checks and two-minute final review.',flush=True)
 active=query('SELECT s.id FROM listening_sets s WHERE s.published_at IS NOT NULL AND NOT EXISTS(SELECT 1 FROM listening_set_replacements r WHERE r.old_set_id=s.id)')
 assert len(active)==5 and all(s['id'].endswith('-computer-v1') for s in active)
 print('All five computer-format versions published. Original versions, voices, keys and completed results retained.')
