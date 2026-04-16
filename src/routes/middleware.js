const express = require("express");
const session = require("express-session");
const { RedisStore } = require("connect-redis");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const path = require("path");
const crypto = require("crypto");
const cookieParser = require('cookie-parser');
const { performance } = require('perf_hooks');

const { setLanguage } = require("../util/i18n.js");
const {isBadActor} = require('../util/badActors.js');
const { logger, redisClient } = require('../services.js');
const isAdmin = require('./../util/isAdmin.js');

const corsOptions = {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
};

const cspProperties = {
  SELF: "'self'",
  NONCE: (req, res) => `'nonce-${res.locals.nonce}'`,
  DYNAMIC: "'strict-dynamic'",
  DATA: "data:",
  WORKOS: "https://workoscdn.com/",
  HTTPS: "https:"
};

/**
 * Redis client setup and session configuration
 */
function initSessionStorage() {
  if (process.env.NODE_ENV !== "production") {
    return undefined;
  }

  const redisStore = new RedisStore({
    client: redisClient,
    prefix: "customradio:session:",
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
  app.use((req, res, next) => {
    const start = performance.now();
    res.on("finish", () => {
      const hasBody = req.body && Object.keys(req.body).length > 0;
      logger.info(`${req.ip} -> [${req.method}] ${req.originalUrl},${req.user ? ` user: ${req.user.id.replace('user_', '')}, admin: ${isAdmin(req)},` : ''}${req.count !== undefined ? ` count: ${req.count}, ` : ' '}lang: ${req.loadedLang},${hasBody ? ` body: ${JSON.stringify(req.body)}, ` : ' '}status: ${res.statusCode},${res.getHeader('Content-Type') ? ` type: ${res.getHeader('Content-Type')}, ` : ' '}${res.getHeader('Content-Length') ? ` bytes: ${res.getHeader('Content-Length')}, ` : ' '}ms: ${(performance.now() - start).toFixed(2)}`);
    });
    next();
  });

  app.use(async (req, res, next) => {
    try {
      if (!(await isBadActor(req.ip))) return next();
      res.status(403).send('forbidden');
    } catch (err) {
      logger.error('Rate limiter error:', err);
      res.status(500).send('rate limiter error');
    }
  });

  app.set("trust proxy", true);
  app.disable("x-powered-by");
  app.use(compression());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(cookieParser());

  /**
   * Middleware to generate nonce for CSP
   * Creates a random nonce and adds it to res.locals for use in CSP headers
   *
   * @param {express.Request} req - Express request object
   * @param {express.Response} res - Express response object
   * @param {express.NextFunction} next - Express next middleware function
   */
  app.use((req, res, next) => {
    res.locals.nonce = crypto.randomBytes(16).toString("base64");
    next();
  });

  /**
   * Helmet security middleware configuration
   * Sets various HTTP headers for security
   * Configures Content Security Policy
   */
  app.use(
    helmet({
      dnsPrefetchControl: {
        allow: true
      },
      xFrameOptions: false,
      crossOriginResourcePolicy: false,
      originAgentCluster: false,
      xssFilter: true,
      expectCt: {
        enforce: true,
        maxAge: 30 * 24 * 60 * 60,
      },
      contentSecurityPolicy: {
        directives: {
          manifestSrc: [
            cspProperties.SELF
          ],
          defaultSrc: [
            cspProperties.SELF
          ],
          scriptSrc: [
            cspProperties.NONCE,
            cspProperties.DYNAMIC
          ],
          scriptSrcElem: [
            cspProperties.NONCE,
            cspProperties.DYNAMIC
          ],
          styleSrc: [
            cspProperties.SELF,
            cspProperties.NONCE
          ],
          styleSrcElem: [
            cspProperties.SELF,
            cspProperties.NONCE
          ],
          imgSrc: [
            cspProperties.SELF,
            cspProperties.DATA,
            cspProperties.WORKOS
          ],
          connectSrc: [
            cspProperties.SELF,
            cspProperties.HTTPS
          ],
          fontSrc: [
            cspProperties.SELF,
            cspProperties.DATA
          ],
          frameSrc: [
            cspProperties.SELF
          ],
          mediaSrc: [
            cspProperties.SELF,
            cspProperties.HTTPS
          ],
          trustedTypes: ["default"],
          reportUri: "/csp-report",
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    })
  );

  /**
   * CORS
   */
  app.use(cors(corsOptions));

  app.use(
    session({
      store: initSessionStorage(),
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

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
      const csrfToken = crypto.randomBytes(32).toString("hex");
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
    if (["GET", "HEAD", "OPTIONS"].includes(req.method) || req.path === "/csp-report") {
      return next();
    }

    const token = req.headers["x-csrf-token"];
    const sessionToken = req.session?.csrfToken;

    if (!req.session) {
      logger.warning(`${req.ip} [${req.method}] ${req.originalUrl}, Missing session`);
      return res.status(440).json({ error: "Session expired or not established" });
    }

    if (!sessionToken) {
      logger.warning(`${req.ip} [${req.method}] ${req.originalUrl}, CSRF token missing from session`);
      return res.status(419).json({ error: "CSRF token missing in session" });
    }

    if (!token || token !== sessionToken) {
      logger.warning(`${req.ip} [${req.method}] ${req.originalUrl} Invalid CSRF token`);
      return res.status(403).json({ error: "Invalid CSRF token" });
    }

    next();
  });

  /**
   * Set response language
   */
  app.use((req, res, next) => {
    const lang = req.headers["accept-language"]?.split(",")[0].split("-")[0];
    req.loadedLang = setLanguage(lang);
    next();
  });

  /**
   * Count connection requests
   */
  app.use((req, res, next) => {
    res.on("finish", () => {
      httpRequestCounter.inc({
        method: req.method,
        route: req.path,
        status_code: res.statusCode,
      });
    });
    next();
  });

  /**
   * Middleware to handle Content Security Policy (CSP) violation reports.
   *
   * This middleware checks if the incoming request is of the type `application/csp-report`.
   * If so, it listens for data chunks, aggregates them into a complete body,
   * and then attempts to parse the body as JSON. If parsing succeeds, the JSON object
   * is assigned to `req.body`. If parsing fails, a 400 error response is sent back to the client.
   * For all other request types, the middleware simply calls `next()` to pass control to the next middleware.
   *
   * @param {express.Request} req - The HTTP request object.
   * @param {express.Response} res - The HTTP response object.
   * @param {function} next - The next middleware function in the stack.
   *
   * @returns {void} This function does not return a value, but may send a response or call next().
   */
  app.use((req, res, next) => {
    if (req.is("application/csp-report")) {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        try {
          req.body = JSON.parse(body);
          next();
        } catch (error) {
          return res.status(400).json({ error: "Invalid JSON" });
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
      userAgent: req.headers["user-agent"] || "unknown",
      forwardedFor: req.headers["x-forwarded-for"],
      realIp: req.headers["x-real-ip"],
    };

    const forwardedIps = clientInfo.forwardedFor
      ? clientInfo.forwardedFor.split(",").map(ip => ip.trim())
      : [];

    if (forwardedIps.length && !forwardedIps.includes(clientInfo.ip)) {
      logger.warning(`IP not in x-forwarded-for: req.ip=${clientInfo.ip}, x-forwarded-for=${clientInfo.forwardedFor}`);
      return res.status(403).json({
        error: "Invalid request origin",
      });
    }

    next();
  });

  /**
   * error handling middleware
   */
  app.use((err, req, res, next) => {
    logger.error(err.stack);

    res.status(err.status || 500).json({
      success: false,
      message: 'Internal Server Error'
    });
  });

  /**
   * Serves static files
   */
  app.use(express.static(path.join(__dirname, '..', "public")));
};
