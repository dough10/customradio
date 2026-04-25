const crypto = require('crypto');
const { validationResult } = require('express-validator');
const version = require('../../../package.json').version;

require('dotenv').config();

const { getCollection, collections } = require('../../services.js');
const asyncHandler = require('../../util/asyncHandler.js');
const UAParser = require('ua-parser-js');

const allowedFields = [
  "document-uri",
  "referrer",
  "violated-directive",
  "effective-directive",
  "original-policy",
  "disposition",
  "blocked-uri",
  "line-number",
  "column-number",
  "source-file",
  "status-code",
  "script-sample"
];

function maskIP(ip) {
  if (!ip) return ip;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
    return ip.replace(/\.\d+$/, '.0');
  }
  if (ip.includes('::ffff:')) {
    const v4 = ip.split('::ffff:')[1];
    return '::ffff:' + v4.replace(/\.\d+$/, '.0');
  }
  if (ip.includes(':')) {
    return ip.split(':').slice(0, 4).join(':') + '::';
  }
  return ip;
}

function stripQuery(url) {
  return typeof url === 'string' ? url.split('?')[0] : url;
}

function normalizeUrl(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  } catch {
    return url;
  }
}

/**
 * @api {post} /csp-report Receive Content Security Policy Violation Reports
 * @apiName PostCspReport
 * @apiGroup Security
 * 
 * @apiDescription
 * This endpoint receives Content Security Policy (CSP) violation reports from web browsers. 
 * The reports are sent when a CSP directive is violated on the client side. 
 * The reports contain details about the violation, such as the blocked resource and the violated directive.
 * 
 * The endpoint logs the CSP report to the console for monitoring purposes. 
 * In a production environment, you might want to handle these reports differently, 
 * such as storing them in a database, sending notifications, or analyzing the data to refine CSP rules.
 * 
 * @apiParam {Object} csp-report The CSP report object sent by the browser. The structure of this object follows the CSP reporting specification.
 * 
 * @apiParamExample {json} Request-Example:
 * {
 *   "csp-report": {
 *     "document-uri": "https://example.com/page",
 *     "referrer": "",
 *     "blocked-uri": "https://evil.com/malicious.js",
 *     "violated-directive": "script-src",
 *     "original-policy": "default-src 'self'; script-src 'self'; report-uri /csp-report;",
 *     "source-file": "https://example.com/page",
 *     "status-code": 200
 *   }
 * }
 * 
 * @apiSuccess (Success 204) {String} No Content No content is returned on success.
 * 
 * @apiError (Error 400) BadRequest The request body is malformed or missing required fields.
 * 
 * @apiErrorExample {json} Error-Response:
 * {
 *   "error": "Invalid request body"
 * }
 * 
 * @apiSampleRequest /csp-report
 * 
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 204 No Content
 */
module.exports = asyncHandler(async (req, res) => {
  const parser = new UAParser(req.headers['user-agent']);
  const ua = parser.getResult();

  const baseObj = {
    'request-id': req.requestId,
    ip: maskIP(req.ip),
    'ip-hash': crypto.createHash('sha256').update(req.ip).digest('hex'),
    browser: ua.browser,
    os: ua.os,
    device: ua.device,
    headers: {
      referer: stripQuery(req.headers['referer']),
      origin: req.headers['origin'],
      host: req.headers['host'],
      'sec-fetch-site': req.headers['sec-fetch-site'],
      'sec-fetch-mode': req.headers['sec-fetch-mode']
    },
    timestamp: new Date(),
    version
  };

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = errors.array().map(e => e.msg).join(', ');
    await getCollection(collections.CSP_FAILS).insertOne({
      ...baseObj,
      error,
      body: JSON.stringify(req.body).slice(0, 2000)
    });
    res.status(400).json({ error });
    return;
  }

  const rawReport = req.body['csp-report'];
  if (!rawReport) {
    await getCollection(collections.CSP_FAILS).insertOne({
      ...baseObj,
      error: 'csp-report missing from body',
      body: JSON.stringify(req.body).slice(0, 2000)
    });
    return res.status(400).json({ error: 'csp-report missing' });
  }

  const sanitizedReport = {};

  for (const key of allowedFields) {
    if (rawReport[key] === undefined) continue;

    if (key === 'document-uri' || key === 'referrer' || key === 'source-file') {
      sanitizedReport[key] = stripQuery(rawReport[key]);
    } else if (key === 'script-sample') {
      const sample = rawReport[key];
      sanitizedReport[key] = typeof sample === 'string' ? sample.slice(0, 200) : '';
    } else {
      sanitizedReport[key] = rawReport[key];
    }
  }

  const cspReport = { ...baseObj, ...sanitizedReport };
  cspReport['effective-directive'] = cspReport['effective-directive'] || cspReport['violated-directive'];
  cspReport.fingerprint = crypto
    .createHash('sha256')
    .update(
      [
        cspReport['effective-directive'] || '',
        normalizeUrl(cspReport['blocked-uri']) || '',
        normalizeUrl(cspReport['document-uri']) || ''
      ].join('|')
    )
    .digest('hex');

  await getCollection(collections.CSP).updateOne(
    { fingerprint: cspReport.fingerprint },
    {
      $setOnInsert: cspReport,
      $inc: { count: 1 },
      $set: { lastSeen: new Date() }
    },
    { upsert: true }
  );
  res.status(204).send();
});