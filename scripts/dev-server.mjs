import http from "node:http";
import { createReadStream, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const ROOT = resolve(process.cwd());
const PORT = Number(process.env.JP_MATCH_PORT || 5173);
const HOST = process.env.JP_MATCH_HOST || (process.argv.includes("--lan") ? "0.0.0.0" : "127.0.0.1");
const LAN_CSP_ANCHOR = " ws://localhost:8787; object-src";
const LAN_CSP_REPLACEMENT =
  " ws://localhost:8787 http://*:8787 ws://*:8787; object-src";
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

function injectLanCsp(html) {
  const occurrences = html.split(LAN_CSP_ANCHOR).length - 1;
  if (occurrences !== 1) {
    throw new Error("LAN_CSP_ANCHOR_MISMATCH:" + occurrences);
  }
  return html.replace(LAN_CSP_ANCHOR, LAN_CSP_REPLACEMENT);
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
      const extension = extname(target).toLowerCase();
      if (extension === ".html") {
        const html = injectLanCsp(readFileSync(target, "utf8"));
        const body = Buffer.from(html);
        response.writeHead(200, {
          "content-type": MIME[extension],
          "content-length": body.length,
          "cache-control": "no-store",
        });
        if (request.method === "HEAD") response.end();
        else response.end(body);
        return;
      }
      response.writeHead(200, {
        "content-type": MIME[extension] || "application/octet-stream",
        "content-length": stat.size,
        "cache-control": "no-store",
      });
      if (request.method === "HEAD") response.end();
      else createReadStream(target).pipe(response);
    } catch (error) {
      const missing = error && error.code === "ENOENT";
      if (!missing) console.error("[JP Match preview]", error);
      response
        .writeHead(missing ? 404 : 500, { "content-type": "text/plain; charset=utf-8" })
        .end(missing ? "Not found" : "Preview server error");
    }
  })
  .listen(PORT, HOST, () => {
    console.log(`JP Match preview: http://${HOST}:${PORT}`);
  });
