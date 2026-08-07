import http from "node:http";
import { createReadStream, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const ROOT = resolve(process.cwd());
const PORT = Number(process.env.JP_MATCH_PORT || 5173);
const HOST = process.env.JP_MATCH_HOST || "127.0.0.1";
const MIME = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function safePath(url) {
  const pathname = decodeURIComponent(new URL(url, `http://${HOST}:${PORT}`).pathname);
  const relative = normalize(pathname).replace(/^([/\\])+/, "") || "index.html";
  const target = resolve(join(ROOT, relative));
  return target.startsWith(ROOT) ? target : null;
}

http
  .createServer((request, response) => {
    let target = safePath(request.url || "/");
    if (!target) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    try {
      if (statSync(target).isDirectory()) target = join(target, "index.html");
      const stat = statSync(target);
      response.writeHead(200, {
        "content-type": MIME[extname(target).toLowerCase()] || "application/octet-stream",
        "content-length": stat.size,
        "cache-control": "no-store",
      });
      if (request.method === "HEAD") response.end();
      else createReadStream(target).pipe(response);
    } catch (_) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("Not found");
    }
  })
  .listen(PORT, HOST, () => {
    console.log(`JP Match preview: http://${HOST}:${PORT}`);
  });
