// Browser Pixel and server event share event_id for Meta deduplication.
module.exports = async function handler(req,res) {
  if(req.method!=='POST')return res.status(405).end();
  const pixelId=process.env.META_PIXEL_ID;
  const token=process.env.META_CAPI_ACCESS_TOKEN;
  if(!pixelId||!token)return res.status(204).end();
  const origin=req.headers.origin;
  const host=req.headers['x-forwarded-host']||req.headers.host;
  if(origin&&host&&new URL(origin).host!==host)return res.status(403).end();
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
  if(!['wa','lp','shopee','other'].includes(body.destination)||
     !/^[a-zA-Z\d-]{10,100}$/.test(body.event_id||'')||
     !Number.isSafeInteger(Number(body.link_id))||
     typeof body.link_label!=='string'||body.link_label.length>120)return res.status(400).end();
  const eventName=body.destination==='wa'?'Contact':'LinkBioClick';
  if(body.event_name!==eventName)return res.status(400).end();
  const user_data={client_user_agent:req.headers['user-agent']||''};
  const ip=(req.headers['x-forwarded-for']||'').split(',')[0].trim();
  if(ip)user_data.client_ip_address=ip;
  if(typeof body.fbp==='string'&&/^fb\.1\.\d+\.\d+$/.test(body.fbp))user_data.fbp=body.fbp;
  if(typeof body.fbc==='string'&&/^fb\.1\.\d+\./.test(body.fbc)&&body.fbc.length<200)user_data.fbc=body.fbc;
  const event={event_name:eventName,event_time:Math.floor(Date.now()/1000),event_id:body.event_id,
    action_source:'website',event_source_url:`https://${host}/`,user_data,
    custom_data:{destination:body.destination,link_id:String(body.link_id),link_label:body.link_label}};
  try{
    const response=await fetch(`https://graph.facebook.com/v25.0/${encodeURIComponent(pixelId)}/events`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({data:[event],access_token:token}),signal:AbortSignal.timeout(3500)});
    if(!response.ok){console.error('Meta CAPI status',response.status);return res.status(502).json({error:'Meta CAPI rejected event'})}
    return res.status(204).end();
  }catch(e){console.error('Meta CAPI unavailable',e.message);return res.status(502).end()}
};
