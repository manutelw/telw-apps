export async function onRequest(context){
  const response=await context.next();
  const url=new URL(context.request.url);
  if(!response.ok||!['/portal/trainer/','/portal/trainer/index.html'].includes(url.pathname))return response;
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html'))return response;
  let html=await response.text();
  const scripts=[
    '/portal/trainer/access-bridge.js',
    '/portal/trainer/ld-plan-ui.js',
    '/portal/trainer/ld-plan-ascent-bridge.js'
  ];
  const missing=scripts.filter(src=>!html.includes(src)).map(src=>`<script src="${src}"></script>`).join('');
  if(missing)html=html.replace('</body>',missing+'</body>');
  const headers=new Headers(response.headers);headers.delete('content-length');headers.set('content-type','text/html; charset=UTF-8');headers.set('cache-control','no-store, max-age=0');
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}
