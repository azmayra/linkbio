module.exports = function handler(req,res) {
  if(req.method!=='GET')return res.status(405).end();
  res.setHeader('Cache-Control','public, max-age=300');
  const pixelId=process.env.META_PIXEL_ID||'';
  return res.status(200).json({pixelId:/^\d+$/.test(pixelId)?pixelId:null});
};
