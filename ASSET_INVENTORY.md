# Desert Drive — Visual Asset Inventory

Derived from [GAME_DESIGN.md](GAME_DESIGN.md). Staged by roadmap milestone so nothing is generated before it's needed.

**Art direction (locked):** top-down view (directly overhead, matching the existing trucks), retro/16-bit pixel style, 1950s Riyadh palette (sand, mud-brick tan, dusty ochre; color pops reserved for vehicles and the souq). All generated sprites use the hand-drawn originals as pixelforge `references` so proportions, outline weight, and palette stay consistent.

**Existing hand-drawn art (style reference set):**

| Asset | File | State |
|---|---|---|
| Player truck (red) | `assets/images/vehicles/PlayerTruck.png` | 1 static frame — missing turn/drift frames |
| Police truck (blue) | `assets/images/vehicles/PoliceTruck.png` | 1 static frame — missing turn/drift frames + beacon flash |
| Smuggler truck (tan) | `assets/images/vehicles/SmugglerTruck.png` | 1 static frame — missing turn/drift frames + loaded-cargo variants |
| Camel walk cycle | `assets/images/characters/texture.png` | 4-frame sheet + shadow — complete |
| Desert sand ground | `assets/images/environment/desertBackground.png` | complete |
| Mud-brick building roofs ×8 | `assets/images/environment/building*/texture.png` | complete |
| Palm tree | `assets/images/environment/props/palmTree/texture.png` | complete |

## M1/M2 — vehicles, environment, cargo

**Vehicles** (`assets/images/vehicles/`, 96px, refs = existing trucks)
- Smuggler/police/player steer-drift frame sets: `straight` / `turn` (front wheels angled) / `drift` (countersteer + kicked-out rear) — 3 frames × 3 trucks
- Police beacon flash: `beacon-off` / `beacon-on` (single 1950s roof dome light, 2 frames)
- Smuggler loaded variants: `smuggler-loaded-1.png` (1 crate in bed), `smuggler-loaded-3.png` (3 crates, weighted rear) — reads cargo weight at a glance

**Cargo** (`assets/images/cargo/`, 32px, batch-generated for consistency)
- Wooden crate (rope-bound) · 3-crate stack · burlap sack · golden camel statue (Golden Camel mode, generated now since it batches with the set)

**Environment** (`assets/images/environment/`)
- Tiles (64px, seamless): packed-dirt road with tire tracks · mud-brick plaza paving
- Props (48px, top-down): water well · desert boulders · handcart with clay pots · painted drop-point ground marker

**UI** (`assets/images/ui/`, 24px icons, era-appropriate)
- Police badge (bust) · handcuffs (bust timer) · coin pouch (score) · crate (cargo count) · pocket watch (round timer) · siren lamp (pursuit state)

## M3 — traps (the plan phase)

**Traps** (`assets/images/traps/`)
- Oil slick decal (48px, iridescent dark puddle on sand)
- Sand berm (64px, low ridge mound)
- Camel pen: `closed` / `open` gate frames (96px; released camels reuse the existing walk cycle)
- Souq stall: `intact` / `broken` / `debris` frames (96px, striped awning — doubles as the destructible map feature)
- Decoy crate (32px, near-identical twin of the real crate)

**Plan-phase UI** (`assets/images/ui/`, 24px)
- Trap placement icons: oil can · camel head · sand mound · stall awning

## M4+ — deferred (do not generate yet)

Map v2 tile expansion (chokepoint variants, ring-road, desert-crossing transition tiles), route-tier signage, time-trial ghost tint, cosmetic liveries/mudguards, lobby/menu backgrounds, game thumbnail (via `forge_thumbnail` with real sprites as refs — best done last, when the sprite set exists).

---

## Generation status

✅ **Complete, v2** (2026-07-02): all M1–M3 assets generated via pixelforge (nano-banana / Gemini image models), post-processed (flood-fill background removal, despeckle, shared-bbox frame cropping — see `tools/pixelforge-bridge/`). After playtest feedback, everything was regenerated at larger sizes: vehicles/traps 128px, props 96px, cargo/decoy 48px, tiles 128px, icons 32px. Buildings (final layout, 2026-07-03): **1–8 are Omar's hand-drawn originals, restored from git — do not overwrite.** The generated 1950s Riyadh set lives at **9–16**, true top-down orthographic (GTA 1 / Bomberman camera: roof plans only, no visible walls, flat ambient light, no directional shadows; required prompt language is in `tools/pixelforge-bridge/batch-buildings.json`): 9 Masmak-style fort, 10 souq parasol hall, 11 courtyard house, 12 mosque, 13 caravanserai storage bays, 14 rug-drying roof, 15 walled palm-grove plot, 16 dense old-town block.

**Building texture size is world size**: `World._computeBuildingDrawSize` draws each building at `texture pixels × worldScale`, and `WorldMap` positions assume the originals' 245–464px footprints — oversized textures overlap and choke the streets. So 9–16 `texture.png` are kept at **400×299** (downscaled ⅓ from generation size; full-res kept alongside as `texture-hires.png`). Any future building texture must stay in the ~250–460px range. Note: `forge_background` outputs JPEG bytes despite the .png name (browsers sniff it fine; pngjs won't parse it) — the downscaled 9–16 are re-encoded as real PNGs. `js/core/AssetManager.js` currently loads only 1–8; 9–16 need wiring in (plus entries in `js/data/Colliders.js`) to appear in-game. Vehicle turn/drift frames rotate the whole truck as one rigid body (prompt must describe whole-object rotation, never per-part movement). Drop-in note: `js/core/AssetManager.js` still only loads the original three trucks — new frames need wiring in.
