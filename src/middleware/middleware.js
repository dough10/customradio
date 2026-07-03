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
const onFinished = require("on-finished");

const { logger, redisClient, mongo } = require("../services.js");
const { injectSecrets } = require("../config/secrets.js");
const { setLanguage } = require("../util/i18n.js");
const { isBadActor, badActor } = require("../util/badActors.js");

const logRequest = require('../util/logRequest.js');

injectSecrets(["SESSION_SECRET"]);

const wosMiddleware = require("./workos/wosMiddleware.js");

const corsOptions = {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
};

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
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

const cspProperties = {
  SELF: "'self'",
  NONCE: (req, res) => `'nonce-${res.locals.nonce}'`,
  DYNAMIC: "'strict-dynamic'",
  DATA: "data:",
  WORKOS: "https://workoscdn.com/",
  HTTPS: "https:"
};

const noCspExtensions = [".xml", ".txt"];

const cspConfig = helmet({
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
      reportUri: "/csp-report",
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

module.exports = (app, httpRequestCounter) => {
  /**
   * LOGGING
   */
  app.use((req, res, next) => {
    if (req.path === '/metrics') return next();
    const start = performance.now();
    onFinished(res, (err, res) => {
      if (req.blocked) {
        logRequest(req);
        return;
      }
      logRequest(req, res, Math.round(performance.now() - start));
    });
    next();
  });

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
        req.blocked = true;
        res.destroy();
        return;
      }
      next();
    } catch (err) {
      logger.error(`badActor check error: ${err}`);
      await mongo.logJSError(err);
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
      // await badActor(clientInfo.ip, 5);
      return res.status(403).json({ error: "Invalid request origin" });
    }

    next();
  });

  /**
   * GLOBAL RATE LIMIT
   */
  app.use(generalLimiter);

  /**
   * CSP LIMITER
   */
  app.use("/csp-report", cspLimiter);

  /**
   * REQUEST ID
   */
  app.use((req, res, next) => {
    req.requestId = crypto.randomUUID();
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
  app.use(express.json({
    type: [
      'application/json',
      'application/csp-report',
      'application/reports+json'
    ],
    limit: '50kb'
  }));

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
  app.use((req, res, next) => {
    if (req.path === "/metrics") return next();
    return session({
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
    })(req, res, next);
  });

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
    if (req.path === "/metrics") return next();
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
      // await badActor(req.ip, req, res, 5);
      return res.status(440).send("Session expired or not established");
    }

    if (!sessionToken) {
      // await badActor(req.ip, req, res, 5);
      return res.status(419).send("CSRF token missing in session");
    }

    if (!token || token !== sessionToken) {
      // await badActor(req.ip, req, res, 5);
      return res.status(403).send("Invalid CSRF token");
    }

    next();
  });

  /**
   * REQUEST COUNTER
   */
  app.use((req, res, next) => {
    if (req.path === '/metrics') return next();
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
   * HELMET
   */
  app.use((req, res, next) => {
    if (noCspExtensions.some(ext => req.path.endsWith(ext))) return next();
    return cspConfig(req, res, next)
  });

  /**
   * STATIC FILES
   */
  app.use(express.static(path.join(__dirname, "..", "public")));

  /**
   * ERROR HANDLER
   */
  app.use((err, req, res, next) => {
    logger.error(err.stack);
    mongo.logJSError(err).catch(err => logger.error(`Failed to log error: ${err}`));
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  });
};