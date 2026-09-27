import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createPreviewServer, resolvePreviewHost } from "../scripts/dev-server.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));

async function startServer(t, { lan = false, root = ROOT } = {}) {
  const host = resolvePreviewHost(lan ? ["--lan"] : [], {});
  const errors = [];
  const server = createPreviewServer({
    root,
    lan,
    host,
    port: 0,
    onError: (error) => errors.push(error),
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, host, resolve);
  });

  t.after(async () => {
    if (!server.listening) return;
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  const address = server.address();
  assert.ok(address && typeof address === "object");
  return {
    host,
    port: address.port,
    errors,
  };
}

function urlFor(server, pathname) {
  return `http://127.0.0.1:${server.port}${pathname}`;
}

test("local preview preserves production CSP and serves visual fixtures", async (t) => {
  const server = await startServer(t);
  assert.equal(server.host, "127.0.0.1");

  const indexResponse = await fetch(urlFor(server, "/index.html"));
  assert.equal(indexResponse.status, 200);
  const served = await indexResponse.text();
  assert.doesNotMatch(served, /http:\/\/\*:8787|ws:\/\/\*:8787/);

  const source = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.equal(served, source);

  const fixture = await fetch(urlFor(server, "/visual-tests/online-room.html"));
  assert.equal(fixture.status, 200);

  const webp = await fetch(urlFor(server, "/assets/icons/anime/db/goku.webp"), { method: "HEAD" });
  assert.equal(webp.status, 200);
  assert.equal(webp.headers.get("content-type"), "image/webp");
  assert.deepEqual(server.errors, []);
});

test("LAN preview injects CSP only for the app entry and blocks internal paths", async (t) => {
  const server = await startServer(t, { lan: true });
  assert.equal(server.host, "0.0.0.0");

  const indexResponse = await fetch(urlFor(server, "/index.html"));
  assert.equal(indexResponse.status, 200);
  const served = await indexResponse.text();
  assert.match(served, /http:\/\/\*:8787/);
  assert.match(served, /ws:\/\/\*:8787/);

  const fixtureResponse = await fetch(urlFor(server, "/visual-tests/online-opponent-left.html"));
  assert.equal(fixtureResponse.status, 200);
  assert.doesNotMatch(await fixtureResponse.text(), /http:\/\/\*:8787|ws:\/\/\*:8787/);

  for (const pathname of [
    "/.git/config",
    "/.git/HEAD",
    "/node_modules/@resvg/resvg-js/package.json",
    "/audio-candidates/build-release-anime.mjs",
    "/package.json",
    "/.env",
  ]) {
    const response = await fetch(urlFor(server, pathname));
    assert.equal(response.status, 403, pathname);
  }
  assert.deepEqual(server.errors, []);
});

test("LAN preview fails closed when the app CSP anchor is missing", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "jp-match-preview-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, "index.html"), "<!doctype html><title>fixture</title>", "utf8");

  const server = await startServer(t, { lan: true, root });
  const response = await fetch(urlFor(server, "/index.html"));
  assert.equal(response.status, 500);
  assert.equal(await response.text(), "Preview server error");
  assert.equal(server.errors.length, 1);
  assert.match(server.errors[0].message, /LAN_CSP_ANCHOR_MISMATCH:0/);
});
