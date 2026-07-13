export default (req, res) => {
  const CLIENT_ID = process.env.AKULAKU_CLIENT_ID || '';
  const REDIRECT_URI = process.env.AKULAKU_REDIRECT_URI || '';
  const AKU_AUTHORIZE = 'https://developer.akulaku.com/login';
  const shop = req.query.shop || 'default';
  const state = Buffer.from(JSON.stringify({ shop, ts: Date.now() })).toString('base64');
  const url = `${AKU_AUTHORIZE}?siteName=ec&clientId=${encodeURIComponent(CLIENT_ID)}&responseType=code&scope=all&redirectUri=${encodeURIComponent(REDIRECT_URI)}&state=${encodeURIComponent(state)}`;
  res.writeHead(302, { Location: url });
  res.end();
};
