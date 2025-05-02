const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const crypto = require('crypto');

const { setLanguage } = require('../util/i18n.js');

module.exports = (app, httpRequestCounter) => {
  /**
   * middleware for timing response times
   */
  app.use((req, res, next) => {
    req.startTime = Date.now();
    next();
  });

  app.use(compression());
  app.use(express.urlencoded({
    extended: true
  }));
  app.use(express.json());
  app.set('trust proxy', true);
  app.disable('x-powered-by');

  app.use((req, res, next) => {
    res.locals.nonce = crypto.randomBytes(16).toString('base64');
    next();
  });

  /**
   * serves static files
   */
  app.use(express.static(path.join(__dirname, '..', 'public')));

  /**
   * also sets response language
   */
  app.use((req, res, next) => {
    const lang = req.headers['accept-language']?.split(',')[0].split('-')[0];
    req.loadedLang = setLanguage(lang);
    next();
  });

  /**
   * middleware setting security header
   */
  app.use((req, res, next) => {
    res.setHeader('X-XSS-Protection', '1; mode=block');
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

  /**
   * Middleware to extract and validate client information
   */
  app.use((req, res, next) => {
    const clientInfo = {
      ip: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
      forwardedFor: req.headers['x-forwarded-for'],
      realIp: req.headers['x-real-ip']
    };

    // Check for consistent IP across headers
    if (clientInfo.forwardedFor && 
        !clientInfo.forwardedFor.includes(clientInfo.ip)) {
      return res.status(403).json({ 
        error: 'Invalid request origin' 
      });
    }
    next();
  });


  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://analytics.dough10.me", "'sha256-HnpdFfQPCyb9+3fdMfjROV7BpCSr2PERzs+rVxA3als='", (req, res) => `'nonce-${res.locals.nonce}'`],
        styleSrc: ["'self'", "'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["*"],
        fontSrc: ["'self'"],
        frameSrc: ["'self'"],
        mediaSrc: ["*"],
        styleSrcElem: ["'self'", "'unsafe-inline'"],
        styleSrcAttr: ["'self'", "'unsafe-inline'"],
        scriptSrcAttr: ["'self'", "'unsafe-inline'"],
        reportUri: "/csp-report"
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));
};