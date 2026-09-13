const SHARE_ACCESS='https://zmopmjosykiwctrvhsmo.supabase.co/functions/v1/oracy-share-access';

export async function onRequestPost(context){
  try{
    const body=await context.request.text();
    const r=await fetch(SHARE_ACCESS,{
      method:'POST',
      headers:{'content-type':'application/json'},
      body
    });
    const headers=new Headers();
    headers.set('content-type',r.headers.get('content-type')||'application/json');
    headers.set('cache-control','no-store');
    return new Response(r.body,{status:r.status,statusText:r.statusText,headers});
  }catch(e){
    return new Response(JSON.stringify({ok:false,message:'Share service could not be reached.',detail:String(e&&e.message||e).slice(0,240)}),{
      status:502,
      headers:{'content-type':'application/json','cache-control':'no-store'}
    });
  }
}

export async function onRequestGet(){
  return new Response(JSON.stringify({ok:false,message:'Use POST.'}),{
    status:405,
    headers:{'content-type':'application/json','cache-control':'no-store'}
  });
}
