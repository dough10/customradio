require('dotenv').config();
const {validationResult} = require('express-validator');

const { t } = require('../../util/i18n.js');
const Logger = require('../../util/logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

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
module.exports = async (req, res) => {
  const cspReport = req.body['csp-report'];
  cspReport.time = new Date().toLocaleString();
  
  log.debug(cspReport);

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = errors.array().map(e => e.msg).join(', ');
    log.error(error);
    res.status(400).json({error});
    return; 
  }

  try {
    log.info(`${req.ip} -> /csp-report ${Date.now() - req.startTime}ms`);
    res.status(204).send();
  } catch(error) {
    const message = t('cspError', error.message);
    log.critical(message);
    res.status(500).send(message);
  }
};