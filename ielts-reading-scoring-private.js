// Private scoring keys. Never expose this module through the public asset handler.
const KEYS={"academic":[1,0,1,1,1,2,1,0,1,1,0,1,0,1,1,2,1,0,0,1,0,1,0,1,0,1,1,0,0,0,0,1,0,1,0,1,0,0,0,0],"general":[1,0,0,1,0,1,1,1,0,2,0,1,0,0,1,1,0,1,1,0,1,0,1,0,1,2,0,0,0,0,1,0,1,0,1,2,0,0,0,0]};
export async function scoreIeltsReading(request){
 if(request.method!=='POST')return new Response('Method not allowed',{status:405});
 let body;try{body=await request.json()}catch{return new Response('Invalid JSON',{status:400})}
 if(!body||!Object.hasOwn(KEYS,body.track)||!body.answers||typeof body.answers!=='object'||Array.isArray(body.answers))return new Response('Invalid request',{status:400});
 const key=KEYS[body.track];let correct=0;const parts=[0,0,0,0];
 for(let i=0;i<key.length;i++){const answer=body.answers[String(i)];if(Number.isInteger(answer)&&answer===key[i]){correct++;parts[Math.floor(i/10)]++}}
 return new Response(JSON.stringify({correct,parts,total:40}),{headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-robots-tag':'noindex, nofollow, noarchive'}});
}
