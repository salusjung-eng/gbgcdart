// ============================================================
// DART API용 CORS 프록시 (Vercel Serverless Function, 서울 리전)
// ============================================================
// 이 프로젝트를 GitHub에 올리고 Vercel로 배포하면 됩니다.
// vercel.json에서 리전을 icn1(서울)로 고정해뒀기 때문에,
// 해외/클라우드 IP를 차단하는 opendart.fss.or.kr도 정상 통과합니다.
//
// 배포 후 주소 예: https://프로젝트이름.vercel.app/api/proxy
// 사용 방식: {그 주소}?url=인코딩된원본URL
// ============================================================

const ALLOWED_HOSTS = ['opendart.fss.or.kr'];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const targetUrl = req.query.url;
  if (!targetUrl) {
    res.status(400).json({ error: 'url 파라미터가 필요합니다. 예: /api/proxy?url=https://opendart.fss.or.kr/...' });
    return;
  }

  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch (e) {
    res.status(400).json({ error: '유효하지 않은 url 파라미터입니다.' });
    return;
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    res.status(403).json({ error: `허용되지 않은 호스트입니다: ${parsed.hostname}` });
    return;
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });

    const contentType = upstream.headers.get('content-type') || 'application/json; charset=utf-8';
    const body = await upstream.text();

    res.status(upstream.status);
    res.setHeader('Content-Type', contentType);
    res.send(body);
  } catch (err) {
    res.status(502).json({ error: `업스트림 요청 실패: ${err.name || 'Error'} - ${err.message}` });
  }
};
