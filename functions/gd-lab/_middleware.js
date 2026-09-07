export async function onRequest(context){
  const response=await context.next();
  const url=new URL(context.request.url);
  if(!response.ok)return response;
  const isBuilder=url.pathname.endsWith('/gd-lab/admin-builder.html');
  const isDugout=url.pathname.endsWith('/gd-lab/dugout/')||url.pathname.endsWith('/gd-lab/dugout/index.html');
  if(!isBuilder&&!isDugout)return response;
  let html=await response.text();
  if(isBuilder&&!html.includes('gd-lab/roster-release.js'))html=html.replace('</body>','<script src="./roster-release.js?v=20260907-roster2"></script>\n</body>');
  if(isDugout&&!html.includes('gd-lab/roster-gate.js'))html=html.replace('</body>','<script src="../roster-gate.js?v=20260907-gate1"></script>\n</body>');
  const headers=new Headers(response.headers);headers.set('content-type','text/html; charset=UTF-8');headers.set('cache-control','no-store, max-age=0');
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}