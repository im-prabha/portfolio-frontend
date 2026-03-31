// ─────────────────────────────────────────────────────
//  config.js  —  loaded by every HTML page (public + admin)
//
//  Uses an IIFE so no variable leaks into global scope.
//  Only sets window.API_BASE — never declares a top-level
//  const/let/var named API, so no redeclaration errors.
//
//  Local dev  (localhost / 127.0.0.1) → http://localhost:5000
//  Production (any other hostname)    → your Render URL below
// ─────────────────────────────────────────────────────

(function () {
  var PRODUCTION_API = "https://portfolio-backend-6idp.onrender.com";

  var isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  window.API_BASE = isLocal ? "http://localhost:5000" : PRODUCTION_API;
})();