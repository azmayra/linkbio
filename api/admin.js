const crypto=require('node:crypto');
const COOKIE='az_linkbio_session';
const secret=()=>process.env.LINKBIO_ADMIN_PASSWORD||'';
function sig(value){return crypto.createHmac('sha256',secret()).update(value).digest('hex')}
function authorized(req){const raw=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||'';
  const [expiry,signature]=raw.split('.');if(!expiry||!signature||Number(expiry)<Date.now())return false;
  const expected=sig(expiry);return signature.length===expected.length&&crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(expected))}
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(!secret()||!process.env.SUPABASE_SERVICE_ROLE_KEY)return res.status(503).json({error:'Admin belum dikonfigurasi di Vercel'});
  const origin=req.headers.origin,host=req.headers['x-forwarded-host']||req.headers.host;
  if(origin&&host&&new URL(origin).host!==host)return res.status(403).end();
  if(req.method==='POST'&&req.query.action==='login'){
    const supplied=String(req.body?.password||'');const expected=secret();
    if(supplied.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(supplied),Buffer.from(expected)))return res.status(401).json({error:'Kata sandi salah'});
    const expiry=String(Date.now()+8*60*60*1000);
    res.setHeader('Set-Cookie',`${COOKIE}=${expiry}.${sig(expiry)}; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=28800`);
    return res.status(200).json({ok:true});
  }
  if(!authorized(req))return res.status(401).json({error:'Silakan masuk ke panel admin'});
  if(req.method==='POST'&&req.query.action==='logout'){
    res.setHeader('Set-Cookie',`${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=0`);return res.status(200).json({ok:true});
  }
  const path=String(req.query.path||'');
  const table=path.split('?')[0];
  if(!['az_profile','az_links','az_clicks'].includes(table)||!['GET','POST','PATCH','DELETE'].includes(req.method)||
    (table==='az_clicks'&&req.method!=='GET')||(table==='az_profile'&&!['GET','PATCH'].includes(req.method))||path.length>500)
    return res.status(400).json({error:'Operasi tidak diizinkan'});
  try{
    const response=await fetch(`${process.env.SUPABASE_URL||'https://lqhfdkggkmlorufswmhv.supabase.co'}/rest/v1/${path}`,{
      method:req.method,headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json',Prefer:req.headers.prefer||'return=representation'},
      ...(req.method==='GET'?{}:{body:JSON.stringify(req.body||{})})});
    const body=await response.text();return res.status(response.status).send(body||'');
  }catch(e){console.error('Admin database error',e.message);return res.status(502).json({error:'Database tidak dapat diakses'})}
};
