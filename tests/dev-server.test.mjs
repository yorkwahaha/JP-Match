import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));

async function fetchWhenReady(url) {
  const deadline = Date.now() + 5000;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      lastError = new Error("HTTP_" + response.status);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw lastError || new Error("preview server did not become ready");
}

test("dev server injects LAN-only CSP into served HTML", async (t) => {
  const port = 5200 + (process.pid % 1000);
  const child = spawn(process.execPath, ["scripts/dev-server.mjs"], {
    cwd: ROOT,
    env: {
      ...process.env,
      JP_MATCH_PORT: String(port),
      JP_MATCH_HOST: "127.0.0.1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  t.after(() => {
    if (!child.killed) child.kill();
  });

  const response = await fetchWhenReady("http://127.0.0.1:" + port + "/index.html");
  const served = await response.text();
  assert.match(served, /http:\/\/\*:8787/);
  assert.match(served, /ws:\/\/\*:8787/);

  const source = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.doesNotMatch(source, /http:\/\/\*:8787|ws:\/\/\*:8787/);
  assert.equal(stderr, "");
});
