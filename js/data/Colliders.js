/**
 * Colliders - All sprite collision bounds in one place.
 *
 * spriteW/spriteH: the pixel dimensions of the source sprite.
 * bounds x/y/w/h:  the collision rectangle inside that sprite (pixel coords).
 * WorldCollision scales these to match the actual draw size at runtime.
 *
 * Buildings 0-3 are the four unique sprites. Buildings 4-7 reuse the same
 * sprites (same assets, different positions in WorldMap) so they share colliders.
 */
const ColliderData = {
    CAMEL: {
        spriteW: 80, spriteH: 80,
        bounds: { x: 4, y: 16, w: 66, h: 15 }
    },

    PALM: {
        spriteW: 110, spriteH: 121,
        bounds: { x: 51, y: 35, w: 17, h: 19 }
    },

    TRUCK: {
        spriteW: 73, spriteH: 124,
        bounds: { x: 10, y: 7, w: 54, h: 110 }
    },

    BLUE_TRUCK: {
        spriteW: 73, spriteH: 124,
        bounds: { x: 10, y: 7, w: 54, h: 110 }
    },

    POLICE_TRUCK: {
        spriteW: 73, spriteH: 124,
        bounds: { x: 10, y: 7, w: 54, h: 110 }
    },

    // Four unique building sprites (indices match WorldMap building.img values).
    // Buildings 4-7 reuse sprites 0-3, so map them to the same collider data.
    BUILDINGS: {
        0: { spriteW: 464, spriteH: 303, bounds: { x: 1,  y: 5,  w: 462, h: 291 } },
        1: { spriteW: 337, spriteH: 270, bounds: { x: 1,  y: 6,  w: 335, h: 257 } },
        2: { spriteW: 245, spriteH: 211, bounds: { x: 0,  y: 3,  w: 245, h: 203 } },
        3: { spriteW: 359, spriteH: 290, bounds: { x: 1,  y: 5,  w: 357, h: 277 } },
        4: { spriteW: 464, spriteH: 303, bounds: { x: 1,  y: 5,  w: 462, h: 291 } },
        5: { spriteW: 337, spriteH: 270, bounds: { x: 1,  y: 6,  w: 335, h: 257 } },
        6: { spriteW: 245, spriteH: 211, bounds: { x: 0,  y: 3,  w: 245, h: 203 } },
        7: { spriteW: 359, spriteH: 290, bounds: { x: 1,  y: 5,  w: 357, h: 277 } }
    }
};