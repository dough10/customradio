module.exports = (req, res) => {
  res.set({
    'Content-Type': 'application/trafficadvice+json',
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=60'
  });
  return res.send([
    {
      user_agent: "prefetch-proxy",
      google_prefetch_proxy_eap: {
        fraction: 1.0
      }
    }
  ]);
};