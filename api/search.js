export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { q, api_key, location } = req.query;

  const locationParam = location ? `&location=${encodeURIComponent(location)}` : '';
  const url = `https://serpapi.com/search.json?api_key=${api_key}&engine=google&q=${encodeURIComponent(q)}&gl=jp&hl=ja&num=20&google_domain=google.co.jp${locationParam}`;

  const response = await fetch(url);
  const data = await response.json();

  // local_results の取得（places配列とオブジェクト形式の両対応）
  let locals = [];
  if (Array.isArray(data.local_results)) {
    locals = data.local_results;
  } else if (data.local_results?.places) {
    locals = data.local_results.places;
  }

  // organic_results の取得
  const organics = data.organic_results || [];

  // local_results を優先リストとして確保
  const merged = [...locals];
  const usedDomains = new Set(
    locals.map(r => {
      try { return new URL(r.website || '').hostname; } catch { return null; }
    }).filter(Boolean)
  );
  const usedPhones = new Set(
    locals.map(r => r.phone).filter(Boolean)
  );

  // organic_results から重複しないものを追加
  for (const org of organics) {
    const orgPhone = org.phone || null;
    let orgDomain = null;
    try { orgDomain = new URL(org.link || '').hostname; } catch {}

    const phoneDupe = orgPhone && usedPhones.has(orgPhone);
    const domainDupe = orgDomain && usedDomains.has(orgDomain);

    if (!phoneDupe && !domainDupe) {
      merged.push({
        title: org.title,
        address: org.snippet || '',
        phone: orgPhone,
        website: org.link,
        // organic には評価・口コミ数・座標がないので空にする
        rating: null,
        reviews: null,
        gps_coordinates: null,
      });
      if (orgDomain) usedDomains.add(orgDomain);
      if (orgPhone) usedPhones.add(orgPhone);
    }
  }

  // フロント側が使いやすいようにラップして返す
  res.status(200).json({
    ...data,
    merged_results: merged,
  });
}