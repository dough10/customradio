const express = require('express');
const session = require('express-session');
const { createClient } = require('redis');
const { RedisStore } = require('connect-redis');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const crypto = require('crypto');

const { setLanguage } = require('../util/i18n.js');
const Logger = require('../util/logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

/**
 * Redis client setup and session configuration
 */
function initSessionStorage() {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }
  const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD,
    legacyMode: false
  });

  redisClient.connect().catch(error => {
    log.error('Redis connection error:', error);
    process.exit(1);
  });

  redisClient.on('error', err => log.error('Redis Client Error:', err));
  redisClient.on('connect', () => log.debug('Redis Connected'));

  const redisStore = new RedisStore({
    client: redisClient,
    prefix: 'customradio:'
  });
  return redisStore;
}

/**
 * Configure and apply middleware to Express application
 * 
 * @param {express.Application} app - Express application instance
 * @param {Object} httpRequestCounter - Counter for HTTP requests
 * @returns {void}
 */
module.exports = (app, httpRequestCounter) => {
  /**
   * Middleware to track request timing
   * Adds startTime to request object for response time calculation
   * 
   * @param {express.Request} req - Express request object
   * @param {express.Response} res - Express response object
   * @param {express.NextFunction} next - Express next middleware function
   */
  app.use((req, res, next) => {
    req.startTime = Date.now();
    next();
  });

  app.use(compression());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.set('trust proxy', true);
  app.disable('x-powered-by');

  /**
   * Middleware to generate nonce for CSP
   * Creates a random nonce and adds it to res.locals for use in CSP headers
   * 
   * @param {express.Request} req - Express request object
   * @param {express.Response} res - Express response object
   * @param {express.NextFunction} next - Express next middleware function
   */
  app.use((req, res, next) => {
    res.locals.nonce = crypto.randomBytes(16).toString('base64');
    next();
  });

  app.use(session({
    store: initSessionStorage(),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    }
  }));

  /**
   * CSRF token generation middleware
   * Generates and stores CSRF token in session if not present
   * Makes token available to templates via res.locals
   * 
   * @param {express.Request} req - Express request object
   * @param {express.Response} res - Express response object
   * @param {express.NextFunction} next - Express next middleware function
   */
  app.use((req, res, next) => {
    if (!req.session.csrfToken) {
      const csrfToken = crypto.randomBytes(32).toString('hex');
      req.session.csrfToken = csrfToken;
      res.locals.csrfToken = csrfToken;
    } else {
      res.locals.csrfToken = req.session.csrfToken;
    }
    next();
  });

  /**
   * CSRF token verification middleware
   * Verifies CSRF token in headers matches session token
   * Skips verification for GET requests
   * 
   * @param {express.Request} req - Express request object
   * @param {express.Response} res - Express response object
   * @param {express.NextFunction} next - Express next middleware function
   * @returns {void|Response} Returns 403 if CSRF validation fails
   */
  app.use((req, res, next) => {
    if (req.method === 'GET') {
      return next();
    }

    const token = req.headers['x-csrf-token'];
    const sessionToken = req.session?.csrfToken;

    if (!token || !sessionToken || token !== sessionToken) {
      return res.status(403).json({
        error: 'Invalid CSRF token'
      });
    }

    next();
  });

  /**
   * Serves static files
   */
  app.use(express.static(path.join(__dirname, '..', 'public')));

  /**
   * Set response language
   */
  app.use((req, res, next) => {
    const lang = req.headers['accept-language']?.split(',')[0].split('-')[0];
    req.loadedLang = setLanguage(lang);
    next();
  });

  /**
   * Middleware setting security header
   */
  app.use((req, res, next) => {
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  /**
   * Count connection requests
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
   * CORS
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
   * Client information validation middleware
   * Extracts and validates client IP addresses across headers
   * Prevents IP spoofing attempts
   * 
   * @param {express.Request} req - Express request object
   * @param {express.Response} res - Express response object
   * @param {express.NextFunction} next - Express next middleware function
   * @returns {void|Response} Returns 403 if IP validation fails
   */
  app.use((req, res, next) => {
    const clientInfo = {
      ip: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
      forwardedFor: req.headers['x-forwarded-for'],
      realIp: req.headers['x-real-ip']
    };

    if (clientInfo.forwardedFor && 
        !clientInfo.forwardedFor.includes(clientInfo.ip)) {
      return res.status(403).json({ 
        error: 'Invalid request origin' 
      });
    }
    next();
  });

  /**
   * Helmet security middleware configuration
   * Sets various HTTP headers for security
   * Configures Content Security Policy
   */
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