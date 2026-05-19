/**
 * SATDetection — Pure collision detection math.
 * Two functions: AABB overlap and SAT axis-aligned vs rotated rect.
 */
class SATDetection {

    /** AABB overlap (both axis-aligned). */
    static rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
        return Math.abs(ax - bx) < (aw + bw) / 2 &&
               Math.abs(ay - by) < (ah + bh) / 2;
    }

    /**
     * SAT: axis-aligned rect vs rotated rect.
     * (rx,ry,rw,rh) = AABB.  (cx,cy,cw,ch,angle) = rotated rect.
     */
    static rectVsRotated(rx, ry, rw, rh, cx, cy, cw, ch, angle) {
        const hw = cw / 2, hh = ch / 2;
        const cos = Math.cos(angle), sin = Math.sin(angle);

        const corners = [
            [cx + hw * cos - hh * sin, cy + hw * sin + hh * cos],
            [cx - hw * cos - hh * sin, cy - hw * sin + hh * cos],
            [cx - hw * cos + hh * sin, cy - hw * sin - hh * cos],
            [cx + hw * cos + hh * sin, cy + hw * sin - hh * cos]
        ];

        const rMinX = rx - rw / 2, rMaxX = rx + rw / 2;
        const rMinY = ry - rh / 2, rMaxY = ry + rh / 2;
        const rCorners = [
            [rMinX, rMinY], [rMaxX, rMinY],
            [rMaxX, rMaxY], [rMinX, rMaxY]
        ];

        const axes = [[cos, sin], [-sin, cos], [1, 0], [0, 1]];

        for (const [ax, ay] of axes) {
            let cMin = Infinity, cMax = -Infinity;
            for (const p of corners) {
                const proj = p[0] * ax + p[1] * ay;
                cMin = Math.min(cMin, proj);
                cMax = Math.max(cMax, proj);
            }
            let rMin = Infinity, rMax = -Infinity;
            for (const p of rCorners) {
                const proj = p[0] * ax + p[1] * ay;
                rMin = Math.min(rMin, proj);
                rMax = Math.max(rMax, proj);
            }
            if (cMax < rMin || cMin > rMax) return false;
        }
        return true;
    }

    /**
     * OBB vs OBB — both rectangles can be at any rotation.
     * Tests 4 separating axes (2 per shape). Returns true if overlapping.
     */
    static obbVsObb(ax, ay, aw, ah, aAngle, bx, by, bw, bh, bAngle) {
        const ca = SATDetection._obbCorners(ax, ay, aw, ah, aAngle);
        const cb = SATDetection._obbCorners(bx, by, bw, bh, bAngle);
        const cosA = Math.cos(aAngle), sinA = Math.sin(aAngle);
        const cosB = Math.cos(bAngle), sinB = Math.sin(bAngle);
        const axes = [[cosA, sinA], [-sinA, cosA], [cosB, sinB], [-sinB, cosB]];
        for (const [nx, ny] of axes) {
            const [minA, maxA] = SATDetection._projectObb(ca, nx, ny);
            const [minB, maxB] = SATDetection._projectObb(cb, nx, ny);
            if (maxA < minB || maxB < minA) return false;
        }
        return true;
    }

    static _obbCorners(cx, cy, w, h, angle) {
        const hw = w / 2, hh = h / 2;
        const cos = Math.cos(angle), sin = Math.sin(angle);
        return [
            [cx + hw * cos - hh * sin, cy + hw * sin + hh * cos],
            [cx - hw * cos - hh * sin, cy - hw * sin + hh * cos],
            [cx - hw * cos + hh * sin, cy - hw * sin - hh * cos],
            [cx + hw * cos + hh * sin, cy + hw * sin - hh * cos]
        ];
    }

    static _projectObb(corners, nx, ny) {
        let min = Infinity, max = -Infinity;
        for (const [px, py] of corners) {
            const d = px * nx + py * ny;
            if (d < min) min = d;
            if (d > max) max = d;
        }
        return [min, max];
    }
}
