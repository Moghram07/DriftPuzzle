#!/usr/bin/env node
// Minimal MCP stdio client for driving pixelforge-mcp outside a host session.
// Usage:
//   node mcp-bridge.js list
//   node mcp-bridge.js call <toolName> <argsJsonPath> [outDir]
// Reads the pixelforge server config (command/env) from ~/.claude.json so the
// API key never has to appear on a command line.

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PROJECT_KEY = "C:/Users/Omar Alshehri/Desktop/DriftPuzzle";

function loadServerConfig() {
  const cfgPath = path.join(os.homedir(), ".claude.json");
  const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
  const server = cfg.projects?.[PROJECT_KEY]?.mcpServers?.pixelforge;
  if (!server) throw new Error("pixelforge server config not found in ~/.claude.json");
  return server;
}

function main() {
  const [mode, toolName, argsPath, outDir] = process.argv.slice(2);
  const server = loadServerConfig();

  const child = spawn(server.command, server.args, {
    env: { ...process.env, ...(server.env || {}) },
    shell: process.platform === "win32", // npx is npx.cmd on Windows
    stdio: ["pipe", "pipe", "pipe"],
  });

  let buf = "";
  let nextId = 1;
  const pending = new Map();

  function send(msg) {
    child.stdin.write(JSON.stringify(msg) + "\n");
  }
  function request(method, params) {
    return new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      send({ jsonrpc: "2.0", id, method, params });
    });
  }

  child.stdout.on("data", (chunk) => {
    buf += chunk.toString("utf8");
    let nl;
    while ((nl = buf.indexOf("\n")) !== -1) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      let msg;
      try { msg = JSON.parse(line); } catch { continue; } // skip non-JSON noise
      if (msg.id !== undefined && pending.has(msg.id)) {
        const p = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) p.reject(new Error(JSON.stringify(msg.error)));
        else p.resolve(msg.result);
      }
    }
  });

  child.stderr.on("data", (d) => process.stderr.write("[server] " + d));
  child.on("error", (e) => { console.error("spawn error:", e.message); process.exit(1); });

  const die = setTimeout(() => { console.error("TIMEOUT"); child.kill(); process.exit(2); }, 540000);

  (async () => {
    await request("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "claude-bridge", version: "1.0.0" },
    });
    send({ jsonrpc: "2.0", method: "notifications/initialized" });

    if (mode === "list") {
      const res = await request("tools/list", {});
      console.log(JSON.stringify(res, null, 2));
    } else if (mode === "batch") {
      // argsPath here is a manifest: [{ tool, args, label }, ...]
      const manifest = JSON.parse(fs.readFileSync(toolName, "utf8"));
      for (const job of manifest) {
        const label = job.label || job.tool;
        try {
          const res = await request("tools/call", { name: job.tool, arguments: job.args });
          const text = (res.content || [])
            .filter((b) => b.type === "text")
            .map((b) => b.text)
            .join(" | ");
          console.log(`${res.isError ? "FAIL" : "OK"} [${label}] ${text}`);
        } catch (e) {
          console.log(`FAIL [${label}] ${e.message}`);
        }
      }
    } else if (mode === "call") {
      const args = JSON.parse(fs.readFileSync(argsPath, "utf8"));
      const res = await request("tools/call", { name: toolName, arguments: args });
      // Save any base64 image blocks to files; print the rest.
      const saved = [];
      for (const [i, block] of (res.content || []).entries()) {
        if (block.type === "image" && block.data) {
          const dir = outDir || ".";
          fs.mkdirSync(dir, { recursive: true });
          const ext = (block.mimeType || "image/png").split("/")[1].replace("jpeg", "jpg");
          const file = path.join(dir, `${toolName}-${Date.now()}-${i}.${ext}`);
          fs.writeFileSync(file, Buffer.from(block.data, "base64"));
          saved.push(file);
          block.data = `<saved:${file}>`;
        }
      }
      console.log(JSON.stringify({ isError: res.isError, content: res.content, saved }, null, 2));
    } else {
      console.error("unknown mode: " + mode);
      process.exitCode = 1;
    }
    clearTimeout(die);
    child.kill();
    process.exit(0);
  })().catch((e) => {
    console.error("RPC error:", e.message);
    clearTimeout(die);
    child.kill();
    process.exit(1);
  });
}

main();
