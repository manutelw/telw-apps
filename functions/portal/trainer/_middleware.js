export async function onRequest(context){
  const response=await context.next();
  const url=new URL(context.request.url);
  if(!response.ok||!['/portal/trainer/','/portal/trainer/index.html'].includes(url.pathname))return response;
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html'))return response;
  const html=await response.text();
  if(html.includes('/portal/trainer/ld-plan-ui.js'))return new Response(html,{status:response.status,statusText:response.statusText,headers:response.headers});
  const injected=html.replace('</body>','<script src="/portal/trainer/ld-plan-ui.js"></script></body>');
  const headers=new Headers(response.headers);headers.delete('content-length');headers.set('cache-control','no-store');
  return new Response(injected,{status:response.status,statusText:response.statusText,headers});
}
