const DrawingHelpers = {
    drawPalms(palms, getPalmDrawSize, palmImg) {
        const size = getPalmDrawSize();
        for (const p of palms) {
        if (palmImg && palmImg.width > 0) {
        image(palmImg, p.x, p.y, size.w, size.h);
        } else {
        fill(80, 120, 60);
        noStroke();
        ellipse(p.x, p.y, size.w * 0.6, size.h * 0.6);
        }
        }
        },
        drawBuildingShadows(buildings, getBuildingDrawSize) {
        for (const b of buildings) {
        const bs = getBuildingDrawSize(b);
        noStroke();
        fill(0, 0, 0, 80);
        rect(b.x - 5, b.y + 15, bs.w, bs.h);
        }
        },
        drawOneBuilding(building, getBuildingDrawSize, buildingImgs) {
        const bs = getBuildingDrawSize(building);
        const img = buildingImgs && buildingImgs[building.img];
        if (img && img.width > 0) {
        image(img, building.x, building.y, bs.w, bs.h);
        } else {
        fill(120, 100, 90);
        noStroke();
        rect(building.x, building.y, bs.w, bs.h);
        }
    }
};