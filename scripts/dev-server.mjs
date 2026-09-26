import http from "node:http";
import { createReadStream, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(process.cwd());
const PORT = Number(process.env.JP_MATCH_PORT || 5173);
const LAN_MODE = process.argv.includes("--lan");
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
const PUBLIC_ROOTS = new Set(["assets", "css", "js", "visual-tests"]);

export function resolvePreviewHost(args = process.argv.slice(2), env = process.env) {
  return env.JP_MATCH_HOST || (args.includes("--lan") ? "0.0.0.0" : "127.0.0.1");
}

const HOST = resolvePreviewHost();

function isPublicPath(relativePath) {
  const normalized = relativePath.replace(/\\/g, "/");
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length === 1 && segments[0] === "index.html") return true;
  return (
    segments.length > 1 &&
    PUBLIC_ROOTS.has(segments[0]) &&
    segments.every((segment) => segment !== "." && segment !== ".." && !segment.startsWith("."))
  );
}

function safePath(url, { root = ROOT, host = HOST, port = PORT } = {}) {
  const pathname = decodeURIComponent(new URL(url, `http://${host}:${port}`).pathname);
  const relativePath = normalize(pathname).replace(/^([/\\])+/, "") || "index.html";
  if (!isPublicPath(relativePath)) return null;
  const baseRoot = resolve(root);
  const target = resolve(join(baseRoot, relativePath));
  return target === baseRoot || target.startsWith(baseRoot + sep) ? target : null;
}

export function injectLanCsp(html) {
  const occurrences = html.split(LAN_CSP_ANCHOR).length - 1;
  if (occurrences !== 1) {
    throw new Error("LAN_CSP_ANCHOR_MISMATCH:" + occurrences);
  }
  return html.replace(LAN_CSP_ANCHOR, LAN_CSP_REPLACEMENT);
}

export function createPreviewServer({
  root = ROOT,
  lan = LAN_MODE,
  host = HOST,
  port = PORT,
  onError = (error) => console.error("[JP Match preview]", error),
} = {}) {
  const appIndex = resolve(root, "index.html");

  return http.createServer((request, response) => {
    try {
      let target = safePath(request.url || "/", { root, host, port });
      if (!target) {
        response.writeHead(403).end("Forbidden");
        return;
      }

      if (statSync(target).isDirectory()) target = join(target, "index.html");
      const stat = statSync(target);
      const extension = extname(target).toLowerCase();
      if (extension === ".html") {
        let html = readFileSync(target, "utf8");
        if (lan && target === appIndex) html = injectLanCsp(html);
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
      if (!missing) onError(error);
      response
        .writeHead(missing ? 404 : 500, { "content-type": "text/plain; charset=utf-8" })
        .end(missing ? "Not found" : "Preview server error");
    }
  });
}

export function startPreviewServer({
  root = ROOT,
  lan = LAN_MODE,
  host = HOST,
  port = PORT,
  onError,
} = {}) {
  const server = createPreviewServer({ root, lan, host, port, onError });
  server.listen(port, host, () => {
    const address = server.address();
    const actualPort = typeof address === "object" && address ? address.port : port;
    console.log(`JP Match preview: http://${host}:${actualPort}`);
  });
  return server;
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) startPreviewServer();
