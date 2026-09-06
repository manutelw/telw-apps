const SUPABASE_URL='https://vtqatrhwfvzyodiftvkc.supabase.co';
const SUPABASE_KEY='sb_publishable_IJJ9AW79DhOsWlsPK_8pkg_q5Fh7643';
const OWNER_EMAILS=new Set(['manutelw@gmail.com']);

export async function verifyToken(token){
  if(!token) return {ok:false,status:401,error:'Missing session'};
  const r=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:SUPABASE_KEY,authorization:`Bearer ${token}`}});
  if(!r.ok) return {ok:false,status:401,error:'Invalid or expired session'};
  const user=await r.json();
  return {ok:true,user};
}

export async function checkCatAccess(token){
  const verified=await verifyToken(token);
  if(!verified.ok) return verified;
  const user=verified.user;
  const email=String(user.email||'').toLowerCase();
  if(OWNER_EMAILS.has(email)) return {ok:true,user,accessType:'owner'};
  if(email.endsWith('@fiib.edu.in')) return {ok:true,user,accessType:'institutional_free'};

  try{
    const q=new URL(`${SUPABASE_URL}/rest/v1/product_entitlements`);
    q.searchParams.set('select','product,active,expires_at');
    q.searchParams.set('user_id',`eq.${user.id}`);
    q.searchParams.set('product','eq.cat');
    q.searchParams.set('active','eq.true');
    q.searchParams.set('limit','1');
    const r=await fetch(q,{headers:{apikey:SUPABASE_KEY,authorization:`Bearer ${token}`}});
    if(r.ok){
      const rows=await r.json();
      const row=rows?.[0];
      if(row){
        const activeUntil=!row.expires_at || new Date(row.expires_at).getTime()>Date.now();
        if(activeUntil) return {ok:true,user,accessType:'paid'};
      }
    }
  }catch(e){
    console.error('CAT entitlement lookup failed',e?.message||e);
  }
  return {ok:false,status:403,user,reason:'payment_required',error:'CAT Simulator access is not active'};
}

export function bearerFrom(request){
  const h=request.headers.get('authorization')||'';
  return h.toLowerCase().startsWith('bearer ')?h.slice(7).trim():'';
}

export function sessionCookieFrom(request){
  const cookie=request.headers.get('cookie')||'';
  const m=cookie.match(/(?:^|;\s*)cat_session=([^;]+)/);
  return m?decodeURIComponent(m[1]):'';
}

export function setSessionCookie(token){
  return `cat_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`;
}

export function clearSessionCookie(){
  return 'cat_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}
