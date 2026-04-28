const promClient = require('prom-client');

const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});
const register = new promClient.Registry();
register.setDefaultLabels({
  app: 'radiotxt.site'
});
promClient.collectDefaultMetrics({
  register
});
register.registerMetric(httpRequestCounter);

module.exports = { httpRequestCounter, register };