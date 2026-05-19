/**
 * WorldMap - Static layout data for the desert town
 * Buildings, palms, and camel spawn locations
 */
const WorldMap = {
    buildings: [
        { x: 400, y: 300, img: 0 },
        { x: -500, y: -400, img: 0 },
        { x: -450, y: 250, img: 1 },
        { x: 600, y: -300, img: 1 },
        { x: 200, y: -450, img: 2 },
        { x: -200, y: 500, img: 2 },
        { x: 800, y: 100, img: 3 },
        { x: -700, y: -100, img: 3 }
    ],

    palms: [
        { x: 150, y: 150 }, { x: -150, y: -150 }, { x: -150, y: 150 }, { x: 150, y: -150 },
        { x: -100, y: -600 }, { x: 50, y: -650 }, { x: 150, y: -580 },
        { x: 100, y: 650 }, { x: -50, y: 700 }, { x: 200, y: 680 },
        { x: 900, y: -200 }, { x: 950, y: 250 }, { x: 1000, y: 50 },
        { x: -850, y: 200 }, { x: -900, y: -300 }, { x: -950, y: 0 },
        { x: 350, y: -100 }, { x: -350, y: 100 }, { x: 500, y: 500 }, { x: -500, y: -200 }
    ],

    camelSpawnAreas: [
        { x: 300, y: -200 },
        { x: -300, y: 200 },
        { x: 600, y: 450 },
        { x: -600, y: -500 },
        { x: 0, y: 350 }
    ]
};
