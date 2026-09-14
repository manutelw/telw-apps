export async function onRequest(context){
  const response=await context.next();
  if(!response.ok)return response;
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html'))return response;
  let html=await response.text();
  html=html.replace(
    '<a class="navbtn" href="/ascent/trainer-login.html">Trainer Login</a>',
    '<a id="publicTrainerLogin" class="navbtn" href="/ascent/">Trainer Login</a>'
  );
  html=html.replace(
    '<a id="publicTrainerLogin" class="navbtn" href="/ascent/trainer-login.html">Trainer Login</a>',
    '<a id="publicTrainerLogin" class="navbtn" href="/ascent/">Trainer Login</a>'
  );
  const headers=new Headers(response.headers);
  headers.set('content-type','text/html; charset=UTF-8');
  headers.set('cache-control','no-store, max-age=0');
  headers.delete('content-length');
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}
