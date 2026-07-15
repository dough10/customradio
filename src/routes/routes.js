// endpoints
const index = require('./endpoints/index.js');
const sitemap = require('./endpoints/sitemap.js');
const robots = require('./endpoints/robots.js');
const securitytxt = require('./endpoints/securitytxt.js');
const ads = require('./endpoints/ads.js');
const fourohfour = require('./endpoints/fourohfour.js');
const info = require('./endpoints/info.js');
const changelog = require('./endpoints/changeLog.js');
const trafficAdvice = require('./endpoints/trafficadvice.js');
const metrics = require('./endpoints/metrics.js');
const dashboard = require('./endpoints/dashboard.js');
const requestsData = require('./endpoints/requestsData.js');

// routers
const alerts = require('./routers/alerts.js');
const txt = require('./routers/txt.js');
// const blog = require('./routers/blog.js');
const auth = require('./routers/auth.js');
const report = require('./routers/report.js');
const stations = require('./routers/stations.js');

module.exports = async (app, register) => {
  /** 
   * robots.txt
   */
  app.get('/robots.txt', robots);

  /**
   * ads.txt
   */
  app.get(['/app-ads.txt', '/ads.txt'], ads);

  /**
   * sitemap
   */
  app.get(['/sitemap.xml', '/sitemaps.xml', '/sitemap_index.xml'], sitemap);

  /**
   * assetLinks
   */
  app.get('/.well-known/assetLinks.json', (req, res) => res.json([]));

  /**
   * security.txt
   */
  app.get('/.well-known/security.txt', securitytxt);

  /**
   * google bot chrome pre-load endpoint
   */
  app.get('/.well-known/traffic-advice', trafficAdvice);
  
  /**
   * change log
   */
  app.get('/changelog.txt', changelog);

  /**
   * sellers.json
   */
  app.get('/sellers.json', (req, res) => res.json({
    "sellers": []
  }));

  /**
   * Index
   */
  app.get('/', index);

  /**
   * index.htnml redirect to /
   */
  app.get('/index.html', (req, res) => res.redirect('/'));

  /**
   * GET /metrics
   */
  app.get('/metrics', (req, res) => metrics(req, res, register));

  /**
   * info!
   */
  app.get('/info', info);

  /**
   * /report router
   */
  app.use('/report', report);

  /**
   * database router
   */
  app.use('/stations', stations);

  /**
   * /auth router
   */
  app.use('/auth', auth);

  /**
   * /txt router
   */
  app.use('/txt', txt);

  /**
   * alerts router
   */
  app.use('/alerts', alerts);

  /**
   * gets a list of all posts
   */
  // app.use('/blog', blog);

  /**
   * admin dashboard
   */
  app.get('/dashboard', dashboard);

  /**
   * structured data for rendering graphs of http requests
   */
  app.get('/requests/:hours', requestsData);
  
  /**
   * Catch-all route for handling 404 errors.
   */
  app.get(/.*/, fourohfour);
};