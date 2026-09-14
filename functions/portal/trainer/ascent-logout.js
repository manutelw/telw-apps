function clearCookie(){return 'clarion_normal_trainer=; Path=/portal/trainer; Domain=.clarionprep.com; HttpOnly; Secure; SameSite=Lax; Max-Age=0';}
export async function onRequestPost(){return new Response(JSON.stringify({ok:true}),{status:200,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','set-cookie':clearCookie()}})}
export async function onRequestGet(){return new Response('Method not allowed',{status:405,headers:{'cache-control':'no-store'}})}
