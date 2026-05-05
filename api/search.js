export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { q, api_key, location } = req.query;

  const locationParam = location ? `&location=${encodeURIComponent(location)}` : '';
  const url = `https://serpapi.com/search.json?api_key=${api_key}&engine=google&q=${encodeURIComponent(q)}&gl=jp&hl=ja&num=10&google_domain=google.co.jp${locationParam}`;

  const response = await fetch(url);
  const data = await response.json();

  res.status(200).json(data);
}
