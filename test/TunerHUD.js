/**
 * TunerHUD — Displays live physics telemetry and J-turn state.
 */
class TunerHUD {
    static update(player, hudEl) {
        const p = player;
        const mm = Math.sqrt(p.momentum.x ** 2 + p.momentum.y ** 2);
        const da = Math.abs(p._driftAngle || 0) * (180 / Math.PI);
        const dir = p.speed < 0
            ? '<span style="color:#ff6666">◀ REVERSE</span>'
            : '<span style="color:#66ff66">▶ FORWARD</span>';
        const drifting = da > 5 && mm > 2;

        hudEl.innerHTML =
            `Speed: <b>${p.speed.toFixed(2)}</b> &nbsp; |Mom|: <b>${mm.toFixed(2)}</b><br>` +
            `Phi: ${(p.phi * 180 / Math.PI).toFixed(1)}° &nbsp; Drift: <b>${da.toFixed(1)}°</b><br>` +
            `${dir}${drifting ? ' <span style="color:#ffff00">🔥 DRIFT</span>' : ''}`;
    }
}