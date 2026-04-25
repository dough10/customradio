const crypto = require('crypto');
const { validationResult } = require('express-validator');
const version = require('../../../package.json').version;

require('dotenv').config();

const { getCollection, collections } = require('../../services.js');
const asyncHandler = require('../../util/asyncHandler.js');
const UAParser = require('ua-parser-js');


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
    'request-id': req.headers['x-request-id'] || crypto.randomUUID(),
    ip: req.ip,
    browser: ua.browser,
    os: ua.os,
    device: ua.device,
    headers: {
      referer: req.headers['referer'],
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
      body: req.body
    });
    res.status(400).json({ error });
    return;
  }

  const rawReport = req.body['csp-report'];
  if (!rawReport) {
    await getCollection(collections.CSP_FAILS).insertOne({
      ...baseObj,
      error: 'csp-report missing from body',
      body: req.body
    });
    return res.status(204).send();
  }

  const cspReport = { ...baseObj, ...rawReport };
  cspReport['effective-directive'] = cspReport['effective-directive'] || cspReport['violated-directive'];
  cspReport.fingerprint = crypto
    .createHash('sha1')
    .update(
      [
        cspReport['effective-directive'] || '',
        cspReport['blocked-uri'] || '',
        cspReport['document-uri'] || ''
      ].join('|')
    )
    .digest('hex');

  await getCollection(collections.CSP).insertOne(cspReport);
  res.status(204).send();
});