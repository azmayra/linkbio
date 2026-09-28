const crypto=require('node:crypto');
function url(value){try{const parsed=new URL(value);return ['http:','https:'].includes(parsed.protocol)?parsed.href:null}catch{return null}}
module.exports=async function handler(req,res){
  if(req.method!=='POST')return res.status(405).end();
  const host=req.headers['x-forwarded-host']||req.headers.host,origin=req.headers.origin;
  if(!host||(origin&&new URL(origin).host!==host))return res.status(403).end();
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
  const id=Number(body.link_id);
  if(!['wa','lp','shopee','shopee_catalog','other'].includes(body.destination)||
     !/^[a-zA-Z\d-]{10,100}$/.test(body.event_id||'')||
     !Number.isSafeInteger(id)||id<1||
     !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(body.visitor_id||'')||
     typeof body.link_label!=='string'||body.link_label.length>120||
     typeof body.link_url!=='string'||body.link_url.length>2048)return res.status(400).end();
  const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!serviceKey)return res.status(503).end();
  const supabase=process.env.SUPABASE_URL||'https://lqhfdkggkmlorufswmhv.supabase.co';
  const headers={apikey:serviceKey,Authorization:`Bearer ${serviceKey}`};
  const destination=body.destination,linkUrl=url(body.link_url);
  if(!linkUrl)return res.status(400).end();
  try{
    const lookup=await fetch(`${supabase}/rest/v1/az_links?id=eq.${id}&select=id,label,url,link_type,active&limit=1`,{headers,signal:AbortSignal.timeout(3500)});
    if(!lookup.ok)throw Error('Link lookup failed: '+lookup.status);
    const row=(await lookup.json())[0],catalog=destination==='shopee_catalog';
    if(!row?.active||
       (catalog?(row.link_type!=='shopee'||linkUrl!==`https://${host}/shopee.html`):
         (row.link_type!==destination||url(row.url)!==linkUrl)))return res.status(400).end();
    const eventName=destination==='wa'?'Contact':catalog?'ShopeeCatalogOpen':'LinkBioClick';
    if(body.event_name!==eventName)return res.status(400).end();
    const sourceKey=catalog?'shopee_catalog':`${destination}:${id}:${crypto.createHash('sha256').update(linkUrl).digest('hex')}`;
    const visitorHash=crypto.createHash('sha256').update(body.visitor_id).digest('hex');
    const click={link_id:id,link_label:catalog?'Link Shopee':row.label,link_url:linkUrl,
      referrer:typeof body.referrer==='string'?body.referrer.slice(0,2048)||null:null,
      user_agent:(req.headers['user-agent']||'').slice(0,512),source_key:sourceKey,visitor_hash:visitorHash};
    const saved=await fetch(`${supabase}/rest/v1/az_clicks?on_conflict=source_key,visitor_hash`,{
      method:'POST',headers:{...headers,'Content-Type':'application/json','Prefer':'resolution=ignore-duplicates,return=representation'},
      body:JSON.stringify(click),signal:AbortSignal.timeout(3500)});
    if(!saved.ok)throw Error('Click insert failed: '+saved.status);
    if(!(await saved.json()).length)return res.status(200).json({recorded:false});
    const pixelId=process.env.META_PIXEL_ID,token=process.env.META_CAPI_ACCESS_TOKEN;
    if(pixelId&&token){
      const user_data={client_user_agent:req.headers['user-agent']||''};
      const ip=(req.headers['x-forwarded-for']||'').split(',')[0].trim();
      if(ip)user_data.client_ip_address=ip;
      if(typeof body.fbp==='string'&&/^fb\.1\.\d+\.\d+$/.test(body.fbp))user_data.fbp=body.fbp;
      if(typeof body.fbc==='string'&&/^fb\.1\.\d+\./.test(body.fbc)&&body.fbc.length<200)user_data.fbc=body.fbc;
      const event={event_name:eventName,event_time:Math.floor(Date.now()/1000),event_id:body.event_id,
        action_source:'website',event_source_url:`https://${host}/`,user_data,
        custom_data:{destination,link_id:String(id),link_label:click.link_label}};
      try{
        const response=await fetch(`https://graph.facebook.com/v25.0/${encodeURIComponent(pixelId)}/events`,{
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({data:[event],access_token:token}),signal:AbortSignal.timeout(3500)});
        if(!response.ok)console.error('Meta CAPI status',response.status);
      }catch(e){console.error('Meta CAPI unavailable',e.message)}
    }
    return res.status(201).json({recorded:true});
  }catch(e){console.error('Click tracking unavailable',e.message);return res.status(502).json({error:'Klik tidak dapat dicatat'})}
};
