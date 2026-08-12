/* Nanbi Studio — service worker.
 *
 * DEFECT RECORD, 2026-08-12: this file was 0 bytes, on this branch AND on the live
 * Nanbi-Studio deployment. An empty file registers as a valid worker, so nothing
 * errored — but its bytes never changed, so `updatefound` never fired, the update
 * bar never appeared, and there was no cache to serve offline. Every "the app is
 * not updating" report traces here. The founder was right each time he said he could
 * not see a difference.
 *
 * Strategy — deliberately network-first, not cache-first:
 *   the Studio is a governance instrument. Serving a stale ruling screen from cache
 *   is worse than showing nothing, so the network always wins when it is reachable
 *   and the cache exists only so the app opens at all when it is not.
 *
 * BUMP `VERSION` ON EVERY DEPLOY. That string is what makes the browser see a
 * changed worker and show the founder the update bar.
 */
var VERSION = "nanbi-studio-2026-08-12c";
var SHELL = ["./", "./index.html", "./manifest.webmanifest"];

self.addEventListener("install", function (e) {
  // addAll() rejects the whole install if ONE url 404s; add individually so a
  // missing icon can never brick the worker.
  e.waitUntil(
    caches.open(VERSION).then(function (c) {
      return Promise.all(SHELL.map(function (u) {
        return c.add(u).catch(function () { /* optional asset — never fatal */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION; })
                             .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;

  var url;
  try { url = new URL(req.url); } catch (_) { return; }

  // The SSOT itself is never cached. Governance data must be live or absent —
  // a cached ruling count is a wrong ruling count.
  if (url.origin !== self.location.origin) return;
  if (url.hostname === "api.github.com") return;

  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(VERSION).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) {
        if (hit) return hit;
        // A navigation with nothing cached still has to render something.
        if (req.mode === "navigate") return caches.match("./index.html");
        return new Response("", { status: 504, statusText: "Offline" });
      });
    })
  );
});
