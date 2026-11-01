"""Owner-authorised Listening-only build. Never prints private audio or secrets."""
import concurrent.futures,hashlib,json,os,pathlib,subprocess,tempfile,urllib.request
ROOT=pathlib.Path(__file__).resolve().parent.parent
PLAN=json.loads((ROOT/'scripts/question-group-plan.json').read_text())
CONFIG=json.loads((ROOT/'wrangler.local.jsonc').read_text())
TOKEN=os.environ['CLOUDFLARE_API_TOKEN'].strip()
ENDPOINT='https://api.cloudflare.com/client/v4/accounts/'+CONFIG['account_id']+'/d1/database/'+CONFIG['d1_databases'][0]['database_id']+'/query'
def query(sql,params=[]):
 request=urllib.request.Request(ENDPOINT,headers={'Authorization':'Bearer '+TOKEN,'Content-Type':'application/json'},data=json.dumps({'sql':sql,'params':params}).encode())
 with urllib.request.urlopen(request,timeout=40) as r:data=json.load(r)
 if not data.get('success') or any(not x.get('success') for x in data.get('result',[])):raise RuntimeError('Listening database operation failed')
 return data['result'][0].get('results',[])
def wrangler(*args):
 p=subprocess.run(['npx','--yes','wrangler@4.156.0',*args],cwd=ROOT,capture_output=True,text=True)
 if p.returncode:raise RuntimeError('Private Listening storage command failed: '+args[2])
def duration(path):return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(path)],text=True))
with tempfile.TemporaryDirectory(prefix='listening-groups-') as folder:
 tmp=pathlib.Path(folder);sources={}
 for g in PLAN:
  key=(g['setId'],g['part'])
  if key in sources:continue
  rows=query('SELECT * FROM listening_audio WHERE set_id=? AND part=?',list(key))
  assert len(rows)==1 and rows[0]['sha256']==g['sourceHash']
  sources[key]=(rows[0],tmp/(key[0]+'-part-'+str(key[1])+'.mp3'))
 def download(item):
  meta,path=item;wrangler('r2','object','get','telw-ielts-listening-audio/'+meta['object_key'],'--file',str(path),'--remote')
  assert hashlib.sha256(path.read_bytes()).hexdigest()==meta['sha256'] and path.stat().st_size==meta['size']
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:list(pool.map(download,sources.values()))
 print('Verified twenty private source recordings.',flush=True)
 def build(g):
  meta,source=sources[(g['setId'],g['part'])]
  out=tmp/(g['setId']+'-'+str(g['part'])+'-'+str(g['group'])+'.mp3')
  subprocess.run(['ffmpeg','-v','error','-ss',str(g['start']),'-i',str(source),'-t',str(g['end']-g['start']),'-ar','44100','-ac','1','-b:a','96k','-y',str(out)],check=True)
  check=subprocess.run(['ffmpeg','-v','error','-i',str(out),'-f','null','-'],capture_output=True,text=True,check=True);assert not check.stderr
  seconds=duration(out);assert abs(seconds-(g['end']-g['start']))<0.2
  sha=hashlib.sha256(out.read_bytes()).hexdigest();key='groups/timing-v2/'+g['setId']+'/part-'+str(g['part'])+'-group-'+str(g['group'])+'-'+sha+'.mp3'
  wrangler('r2','object','put','telw-ielts-listening-audio/'+key,'--file',str(out),'--remote','--content-type','audio/mpeg')
  return [g['setId'],g['part'],g['group'],g['from'],g['to'],key,seconds,out.stat().st_size,sha,g['readingSeconds'],g['readCue'],g['listenCue'],g['readCueDuration'],g['listenCueDuration']]
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(build,PLAN))
 # Verify complete question coverage before making grouped playback available.
 for setid in sorted({g['setId'] for g in PLAN}):
  questions=[]
  for row in sorted([r for r in rows if r[0]==setid],key=lambda r:(r[1],r[2])):questions.extend(range(row[3],row[4]+1))
  assert questions==list(range(1,41))
 for row in rows:
  old=query('SELECT sha256 FROM listening_groups WHERE set_id=? AND part=? AND group_no=?',row[:3])
  if old:assert old[0]['sha256']==row[8]
  else:query('INSERT INTO listening_groups VALUES('+','.join('?' for _ in row)+')',row)
 print('Built and fully decoded 26 private question-group clips. All five schedules cover Questions 1–40 exactly once.',flush=True)
 for setid in sorted({g['setId'] for g in PLAN}):
  subset=[r for r in rows if r[0]==setid]
  print(setid+': '+str(len(subset))+' groups; '+str(round(sum(r[6]+r[9]+r[12]+r[13] for r in subset)+120,1))+' scheduled seconds including spoken cues, reading and final check.')
