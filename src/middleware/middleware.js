const express = require("express");
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const { RedisStore } = require("connect-redis");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const path = require("path");
const crypto = require("crypto");
const cookieParser = require("cookie-parser");
const { performance } = require("perf_hooks");

const { logger, redisClient } = require("../services.js");
const { injectSecrets } = require("../config/secrets.js");
const { setLanguage } = require("../util/i18n.js");
const { isBadActor, badActor } = require("../util/badActors.js");
const isAdmin = require("../util/isAdmin.js");
const maskIP = require('../util/maskIP.js');

injectSecrets(["SESSION_SECRET"]);

const wosMiddleware = require("./workos/wosMiddleware.js");

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

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 80,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    req.headers["cf-connecting-ip"] ||
    req.headers["x-real-ip"] ||
    req.socket.remoteAddress
});

const cspLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip
});

function initSessionStorage() {
  if (process.env.NODE_ENV !== "production") return undefined;

  return new RedisStore({
    client: redisClient,
    prefix: "customradio:session:",
  });
}

/**
 * generates a HTTP request string for system logger
 * 
 * @param {Object} req 
 * @param {Object} res 
 * @param {Number} start 
 * 
 * @returns {String}
 */
function logString(req, res, start) {
  const parts = [];

  parts.push(`${maskIP(req.ip)} -> [${req.method}] ${req.originalUrl}`);

  if (req.user) {
    parts.push(`user: ${req.user.id.replace('user_', '')}, admin: ${isAdmin(req)}`);
  }

  if (req.count !== undefined) {
    parts.push(`count: ${req.count}`);
  }

  parts.push(`lang: ${req.loadedLang}`);

  if (req.body && Object.keys(req.body).length > 0) {
    parts.push(`body: ${JSON.stringify(req.body)}`);
  }

  parts.push(`status: ${res.statusCode}`);

  const contentType = res.getHeader('Content-Type');
  if (contentType) parts.push(`type: ${contentType}`);

  const contentLength = res.getHeader('Content-Length');
  if (contentLength) parts.push(`bytes: ${contentLength}`);

  // parts.push(`request-id: ${req.requestId}`);

  parts.push(`ms: ${(performance.now() - start).toFixed(2)}`);

  return parts.join(', ');
}

module.exports = (app, httpRequestCounter) => {

  /**
   * TRUST PROXY
   */
  app.set("trust proxy", 1);

  /**
   * EARLY ABUSE CHECK
   */
  app.use(async (req, res, next) => {
    try {
      if (await isBadActor(req.ip)) {
        return res.status(403).send("forbidden");
      }
      next();
    } catch (err) {
      logger.error(`badActor check error: ${err}`);
      next();
    }
  });

  /**
   * Client information validation middleware
   * Extracts and validates client IP addresses across headers
   * Prevents IP spoofing attempts
   */
  app.use(async (req, res, next) => {
    const clientInfo = {
      ip: req.ip,
      forwardedFor: req.headers["x-forwarded-for"],
      realIp: req.headers["x-real-ip"],
    };

    const forwardedIps = clientInfo.forwardedFor
      ? clientInfo.forwardedFor.split(",").map(ip => ip.trim())
      : [];

    if (forwardedIps.length && !forwardedIps.includes(clientInfo.ip)) {
      await badActor(req.ip, 5);
      return res.status(403).json({error: "Invalid request origin"});
    }

    next();
  });

  /**
   * GLOBAL RATE LIMIT
   */
  app.use(generalLimiter);

  /**
   * REQUEST ID
   */
  app.use((req, res, next) => {
    req.requestId = crypto.randomUUID();
    next();
  });

  /**
   * LOGGING
   */
  app.use((req, res, next) => {
    if (req.originalUrl === '/metrics') return next();
    const start = performance.now();
    res.on("finish", () => logger.info(logString(req, res, start)));
    next();
  });

  /**
   * CORE MIDDLEWARE
   */
  app.disable("x-powered-by");
  app.use(compression());
  app.use(cookieParser());
  app.use(cors(corsOptions));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json({ limit: "10kb" }));

  /**
   * NONCE
   */
  app.use((req, res, next) => {
    res.locals.nonce = crypto.randomBytes(16).toString("base64");
    next();
  });

  /**
   * SESSION
   */
  app.use(
    session({
      store: initSessionStorage(),
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  app.use(wosMiddleware);

  /**
   * LANGUAGE
   */
  app.use((req, res, next) => {
    const lang = req.headers["accept-language"]?.split(",")[0]?.split("-")[0];
    req.loadedLang = setLanguage(lang);
    next();
  });

  /**
   * CSRF token generation middleware
   * Generates and stores CSRF token in session if not present
   * Makes token available to templates via res.locals
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
   */
  app.use(async (req, res, next) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method) || req.path === "/csp-report") {
      return next();
    }

    const token = req.headers["x-csrf-token"];
    const sessionToken = req.session?.csrfToken;

    if (!req.session) {
      await badActor(req.ip, 5);
      return res.status(440).send("Session expired or not established");
    }

    if (!sessionToken) {
      await badActor(req.ip, 5);
      return res.status(419).send("CSRF token missing in session");
    }

    if (!token || token !== sessionToken) {
      await badActor(req.ip, 5);
      return res.status(403).send("Invalid CSRF token");
    }

    next();
  });

  /**
   * REQUEST COUNTER
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
   * CSP LIMITER
   */
  app.use("/csp-report", cspLimiter);

  /**
   * CSP BODY PARSER
   */
  app.use((req, res, next) => {
    if (!req.is("application/csp-report")) return next();

    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        req.body = JSON.parse(body);
        next();
      } catch {
        res.status(400).json({ error: "Invalid JSON" });
      }
    });
  });

  /**
   * HELMET
   */
  app.use(
    helmet({
      dnsPrefetchControl: {
        allow: true
      },
      xFrameOptions: false,
      crossOriginResourcePolicy: false,
      originAgentCluster: false,
      xssFilter: false,
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
          trustedTypes: [],
          requireTrustedTypesFor: ["script"],
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
   * STATIC FILES
   */
  app.use(express.static(path.join(__dirname, "..", "public")));

  /**
   * ERROR HANDLER
   */
  app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  });
};