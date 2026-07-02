# pixelforge-bridge

Drives the `pixelforge-mcp` server (configured in `~/.claude.json` for this project) directly over stdio, so asset batches can run outside a Claude session. Reads the server command and `GEMINI_API_KEY` from `~/.claude.json` — no key on the command line.

## Status (2026-07-02)

**Blocked:** the configured Gemini API key is free-tier, and every Gemini image model reports `limit: 0` there (image generation needs a billing-enabled key). Enable billing on the key's Google AI Studio project (or swap in a paid key in `~/.claude.json` under this project's `mcpServers.pixelforge.env`), then run the batches below.

## Usage

```sh
node mcp-bridge.js list                          # list pixelforge tools
node mcp-bridge.js batch batch-vehicles.json     # M1/M2: truck drift/turn frames, beacon flash, loaded variants
node mcp-bridge.js batch batch-core.json         # M2: cargo set, ground tiles, props, UI icons
node mcp-bridge.js batch batch-traps.json        # M3: oil slick, berm, camel pen, souq stall, decoy, trap icons
```

Run in that order — see [ASSET_INVENTORY.md](../../ASSET_INVENTORY.md) for the full plan. Outputs land directly in `assets/images/` (vehicles/, cargo/, environment/, traps/, ui/). Animation batches auto-split sprite sheets into per-frame PNGs with transparent backgrounds.

Notes:
- Default model alias `nano-banana` resolves to `nano-banana-pro-preview` (gemini-3-pro-image). Fallback aliases: `flash` → gemini-3.1-flash-image-preview, `25` → gemini-2.5-flash-image.
- `batch-traps.json`'s decoy-crate references `assets/images/cargo/cargo-crate.png`, which is produced by `batch-core.json` — keep the order.
- After generating, eyeball each frame set; regenerate any single job by copying it into a one-entry manifest.
