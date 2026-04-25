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

const { setLanguage } = require("../util/i18n.js");
const { isBadActor } = require("../util/badActors.js");
const { logger, redisClient } = require("../services.js");
const isAdmin = require("../util/isAdmin.js");
const { injectSecrets } = require("../config/secrets.js");
const { badActor } = require("./../util/badActors.js");

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
    const start = performance.now();
    res.on("finish", () => {
      const hasBody = req.body && Object.keys(req.body).length > 0;
      logger.info(`${req.ip} -> [${req.method}] ${req.originalUrl},${req.user ? ` user: ${req.user.id.replace('user_', '')}, admin: ${isAdmin(req)},` : ''}${req.count !== undefined ? ` count: ${req.count}, ` : ' '}lang: ${req.loadedLang},${hasBody ? ` body: ${JSON.stringify(req.body)}, ` : ' '}status: ${res.statusCode},${res.getHeader('Content-Type') ? ` type: ${res.getHeader('Content-Type')}, ` : ''}${res.getHeader('Content-Length') ? ` bytes: ${res.getHeader('Content-Length')}, ` : ' '}id: ${req.requestId} ms: ${(performance.now() - start).toFixed(2)}`);
    });
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
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [cspProperties.SELF],
          scriptSrc: [
            cspProperties.SELF,
            cspProperties.NONCE,
            cspProperties.DYNAMIC
          ],
          scriptSrcElem: [
            cspProperties.SELF,
            cspProperties.NONCE,
            cspProperties.DYNAMIC
          ],
          styleSrc: [
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
          frameSrc: [cspProperties.SELF],
          mediaSrc: [cspProperties.SELF, cspProperties.HTTPS],
          reportUri: "/csp-report"
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