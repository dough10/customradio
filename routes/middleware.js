const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

module.exports = (app, httpRequestCounter) => {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://analytics.dough10.me", "'unsafe-inline'"],
        styleSrc: ["'self'", "'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "*"],
        fontSrc: ["'self'"],
        frameSrc: ["'self'"],
        mediaSrc: ["*"],
        styleSrcElem: ["'self'", "'unsafe-inline'"],
        styleSrcAttr: ["'self'", "'unsafe-inline'"],
        reportUri: "/csp-report"
      },
    },
  }));

  app.use(compression());
  app.use(express.urlencoded({
    extended: true
  }));
  app.use(express.json());
  app.set('trust proxy', true);
  app.disable('x-powered-by');

  /**
   * serves static files
   */
  app.use(express.static(path.join(__dirname, '..', 'public')));

  /**
   * middleware for timing response times
   */
  app.use((req, res, next) => {
    req.startTime = Date.now();
    next();
  });

  /**
   * counts connection requests
   */
  app.use((req, res, next) => {
    res.on('finish', () => {
      httpRequestCounter.inc({
        method: req.method,
        route: req.path,
        status_code: res.statusCode
      });
    });
    next();
  });

  /**
   * cors
   */
  app.use(cors({
    origin: ['https://customradio.dough10.me'],
    methods: ['GET', 'POST'],
  }));

  /**
   * Middleware to handle Content Security Policy (CSP) violation reports.
   * 
   * This middleware checks if the incoming request is of the type `application/csp-report`.
   * If so, it listens for data chunks, aggregates them into a complete body,
   * and then attempts to parse the body as JSON. If parsing succeeds, the JSON object
   * is assigned to `req.body`. If parsing fails, a 400 error response is sent back to the client.
   * For all other request types, the middleware simply calls `next()` to pass control to the next middleware.
   * 
   * @param {import('express').Request} req - The HTTP request object.
   * @param {import('express').Response} res - The HTTP response object.
   * @param {function} next - The next middleware function in the stack.
   * 
   * @returns {void} This function does not return a value, but may send a response or call next().
   */
  app.use((req, res, next) => {
    if (req.is('application/csp-report')) {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          req.body = JSON.parse(body);
          next();
        } catch (error) {
          return res.status(400).json({ error: 'Invalid JSON' });
        }
      });
    } else {
      next();
    }
  });
};