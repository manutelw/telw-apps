export async function onRequest(context){
  const response=await context.next();
  const url=new URL(context.request.url);
  if(!response.ok||!url.pathname.endsWith('/pi-lab/admin-builder.html'))return response;
  let html=await response.text();
  html=html.replace("String(s?.role||'').toUpperCase()==='ADMIN'","['ADMIN','TRAINER'].includes(String(s?.role||'').toUpperCase())");
  html=html.replace('Administrator access required','Administrator or trainer access required');
  html=html.replace('Open this page from the ASCENT Admin Hub after signing in.','Open this page from the ASCENT trainer or admin portal after signing in.');
  if(!html.includes('pi-lab/roster-upload.js'))html=html.replace('</body>','<script src="./roster-upload.js?v=20260907-roster1"></script>\n</body>');
  const headers=new Headers(response.headers);headers.set('content-type','text/html; charset=UTF-8');headers.set('cache-control','no-store, max-age=0');
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}