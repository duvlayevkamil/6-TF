#!/usr/bin/env node
/**
 * tools/serve.mjs — platforma uchun oddiy fayl serveri (bog'liq kutubxonasiz).
 *
 *   /                      → index.html (6-sinf.html ga yo'naltiradi)
 *   /6-sinf.html           → platforma
 *   /yuklab-olish.html     → 6-sinf.html ni «saqlab olish» (Content-Disposition: attachment)
 *
 * Ishga tushirish: npm run serve   (port 8080, 0.0.0.0)
 */
import { createServer } from "node:http";
import { createReadStream, statSync, existsSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const PORT = Number(process.env.PORT || 8080);
const FILE = "6-sinf.html";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".pdf": "application/pdf",
};

const send = (res, path, attach) => {
  const abs = join(ROOT, normalize(path).replace(/^(\.\.[/\\])+/, ""));
  if (!abs.startsWith(ROOT) || !existsSync(abs) || !statSync(abs).isFile()) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("404 — topilmadi: " + path);
    return;
  }
  const head = {
    "content-type": MIME[extname(abs).toLowerCase()] || "application/octet-stream",
    "content-length": statSync(abs).size,
    "cache-control": "no-cache",
  };
  if (attach) head["content-disposition"] = `attachment; filename="${FILE}"`;
  res.writeHead(200, head);
  createReadStream(abs).pipe(res);
};

createServer((req, res) => {
  const path = decodeURIComponent((req.url || "/").split("?")[0]);
  if (path === "/" || path === "/index.html") return send(res, "index.html", false);
  if (path === "/yuklab-olish" || path === "/yuklab-olish.html") return send(res, FILE, true);
  send(res, path, false);
}).listen(PORT, "0.0.0.0", () => {
  const kb = (statSync(join(ROOT, FILE)).size / 1024).toFixed(0);
  console.log(`✓ ${FILE} (${kb} KB) — http://localhost:${PORT}/`);
  console.log(`  yuklab olish: http://localhost:${PORT}/yuklab-olish`);
});
