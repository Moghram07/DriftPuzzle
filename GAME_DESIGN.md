# Desert Drive — Game Design & Development Roadmap

*1950s Riyadh. Realistic drift physics. Bomberman's planning brain in Twisted Metal's driver's seat.*

---

## 1. Vision

**One sentence:** A round-based smuggler-versus-police chase game set in a 1950s Riyadh desert city, where every advantage is earned through car control — J-turns, Scandinavian flicks, PIT maneuvers — and every round is shaped by traps and route decisions planned like a Bomberman board.

**Design pillars** (every feature must serve at least one):

1. **The car is the skill ceiling.** No guns, no power creep. Ramming angle, weight transfer, and drift control decide duels. A better driver in a stock truck beats a worse driver in anything.
2. **Plan like Bomberman, drive like a rally champion.** Strategy happens on the map: route choice, chokepoint traps, timing. Execution happens in the physics.
3. **Readable 1950s Riyadh.** Mud-brick alleys, souq stalls, palm groves, camel trains, sand. Every mechanic must be explainable in that world (no floating pickups, no neon).
4. **Rounds, not sessions.** 3–5 minute rounds with role swaps. Losing a round stings for ninety seconds, not an evening — that's the addiction loop of Bomberman and Rocket League alike.

**What we take from the inspirations — and what we don't:**

| | Take | Leave |
|---|---|---|
| **Bomberman** | Pre-round planning, chokepoint control, traps that punish predictable movement, round-swap fairness, "one more round" pacing | Grid movement, instant deaths, item RNG deciding winners |
| **Twisted Metal** | Vehicle identity, arena knowledge as skill, tactical damage (target the wheels, force the spin) | Projectile weapons, health-bar attrition, arcade physics |

---

## 2. Core Loop (the round)

```
PLAN (20s)  →  RUN (3–5 min)  →  RESOLVE (10s)  →  SWAP ROLES  →  repeat to N wins
```

**Smuggler goal:** pick up cargo at the souq, deliver it to one of 2–3 drop points across the city. Each delivery scores. Cargo has weight — a loaded truck carries more momentum and corners worse (implemented via the existing `vehicle.mass` and Config physics — realistic, not a stat).

**Police goal:** bust the smuggler — force them to a stop and hold contact/proximity until the bust timer fills (~3 s). Busting mid-delivery scores more than busting an empty truck. Ramming assists the timer; pinning against a wall is the classic finish.

**The plan phase (the Bomberman layer):** before the run, each side secretly places its purchased traps/assets on the map (smuggler: escape aids; police: interdiction). Placement is revealed only when triggered. This is where mind-games live: trap the obvious alley, then take it anyway because they knew you knew.

**Why this loop works:**
- Asymmetry makes both roles feel different (evade vs intercept), and the swap guarantees fairness — you always get your turn with the "fun" role.
- Score is per-delivery/per-bust, not binary — a losing round can still be close, which keeps players in.
- The chase itself is the existing game — this wraps objectives around what already works.

---

## 3. Combat: driving + traps (no guns)

### Physical (already largely built)
- **Ramming**: the impulse collision model already accounts for speed, angle, mass, and momentum. Frontal rams kill the victim's drive speed; rear shunts destabilize.
- **PIT maneuver**: hard side impacts already break traction (`VC_SIDE_SPIN_IMPULSE` spin-out). Making PITs the police's highest-skill bust tool needs only tuning + scoring recognition ("PIT!" bonus).
- **Drift-block**: sliding your truck broadside across an alley as a moving wall — high risk (you're side-exposed) and high reward.

### Placeable traps (era-appropriate, the Bomberman layer)
| Trap | Placed by | Effect | Counter |
|---|---|---|---|
| Oil slick | Either | Grip drops sharply for ~2 s of contact (temporary `FRICTION`/grip multiplier on the vehicle) | Slow down or line up straight before it |
| Cargo crate drop | Smuggler (while driving) | Physical obstacle behind you; costs one cargo unit — sacrifice score for escape | Swerve; hit it slow |
| Sand berm | Pre-placed | Deflects/launches at speed; a jump for experts, a spin-out for the greedy | Hit it square and slow, or use it as a shortcut |
| Camel-herd release | Either (pre-placed pen) | Opens a pen: camels wander a chokepoint (reuses camel AI + existing collision/sounds) | Patience or a wide detour |
| Souq stall (destructible) | Map feature | Smashable for a shortcut but drops debris and slows you; leaves the hole open for the rest of the round | Route knowledge |
| Decoy cargo | Smuggler | Fake pickup blip; police who "bust" it lose the bust cooldown | Watch driving behavior, not the map |

Traps are bought with points earned by skill (clean deliveries, PITs, near-miss escapes) — never random drops. **Skill earns strategy; strategy amplifies skill.**

---

## 4. Strategy over luck

- **Fixed, learnable maps.** Like Bomberman arenas: chokepoints, ring roads, alley shortcuts, and one risky desert crossing (fast, open, no cover). Map knowledge is a real skill axis.
- **Route tiers**: each delivery point pays differently based on distance/danger; the smuggler picks their own risk.
- **Cargo weight decisions**: carry 1 crate (nimble) or 3 (one big score, heavy truck). Physics does the balancing.
- **Pre-committed traps**: placement happens in the plan phase, so outcomes trace back to decisions, not reactions.
- **No RNG in outcomes**: randomness only in flavor (camel wander, dust). Every loss should be explainable.

---

## 5. Modes & win conditions

| Mode | Players | Description |
|---|---|---|
| **Contraband Run** (core) | 2 (→ 2v2, 3v1) | The smuggler/police round loop above. First to N round-wins. |
| **Convoy** | 1–4 co-op | Escort/deliver against escalating AI police waves (the pursuit AI is the content). |
| **Golden Camel** | 3–8 FFA | One golden cargo; holding it scores over time; everyone else plays police. Hot-potato brawl. |
| **Time Trial** | 1 | Delivery routes against the clock with ghost replays. The skill ladder and tutorial in disguise. |

Single-player = Convoy + Time Trial + Contraband Run vs AI (the AI already plays police; a smuggler AI is the same architecture with goals flipped).

---

## 6. Progression & replayability

- **Tuning, not upgrades**: unlock *setups* (grip vs slide bias, mass, steering rate — all existing Config axes), each a trade-off. No truck is strictly better; vetted presets keep multiplayer fair.
- **Cosmetics**: 1950s liveries, mudguards, horn sounds, roof cargo looks.
- **Mastery tracking**: per-map best delivery times, ghost replays, counters for named maneuvers (J-turn escapes, PIT busts, flick entries) — the game should *notice* skill.
- **Daily route**: a fixed seed delivery challenge with a leaderboard. Cheap to build, strong retention.
- **Round variety from the trap economy**: same map plays differently depending on what both sides bought and where they hid it.

---

## 7. Multiplayer architecture requirements (design-only this round)

The codebase is already close in one crucial way: **every vehicle is driven through the same `{throttle, steer, handbrake}` input contract** (keyboard → `VehicleInput`, AI → `PoliceAI`). A network peer is just a third input source.

Requirements to meet before online work starts:

1. **Fixed-timestep simulation.** Physics currently steps once per rendered frame (p5 `draw()`); it must step at a fixed 60 Hz independent of rendering, with interpolation for display. Prerequisite for any sync model.
2. **Determinism audit.** Same inputs + same seed ⇒ same state. Replace direct `random()`/`Date.now()` in gameplay code (particle visuals may stay random; audio cooldowns should use frame counters — partially done).
3. **Serializable state.** Per vehicle: `x, y, th, phi, speed, momentum, _impactYaw, spinOutUntil` (~10 floats); plus camels and round state. Keep it enumerated.
4. **Sync model recommendation:** deterministic **lockstep with input-delay** for 2–4 players (tiny bandwidth, exact physics — this is why #2 matters). Rollback only if input delay feels bad; a 12-float snapshot keeps that door open.
5. **Local 2-player first** (M5): split keyboard/gamepad on one machine exercises everything except netcode and is a party feature on its own.

---

## 8. Roadmap

| Milestone | Content | Exit criterion |
|---|---|---|
| **M1 — Stabilize** *(this round)* | Perf fixes, pursuit AI overhaul, this document | Stable FPS over 15+ min; AI corners, brakes, recovers, drifts believably |
| **M2 — The Run** | Cargo pickup/drop points, delivery scoring, bust timer, round timer + role swap vs AI police; cargo weight via `mass` | A full Contraband Run round vs AI is fun *without* traps |
| **M3 — The Plan** | Trap economy: oil slick, crate drop, camel release, decoy; plan phase UI; skill bonuses (PIT/J-turn recognition) | Traps change round outcomes without deciding them |
| **M4 — The City** | Purpose-built map v2 (chokepoints, ring road, desert crossing, destructible stalls), route tiers, Time Trial + ghosts | Map knowledge visibly separates players |
| **M5 — Two Chairs** | Fixed timestep + determinism audit + local 2-player split input; Golden Camel FFA vs AI | Two humans, one machine, no desync of expectations |
| **M6 — The Wire** | Lockstep online for 2–4, lobbies, Convoy co-op online | Two machines, one round, minimal divergence |

**Guiding rule for every milestone:** the chase must stay fun with everything else turned off. If a feature makes players drive *less* skillfully, it's out.
