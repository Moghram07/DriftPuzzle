/**
 * GameRenderer - All drawing. Uses game.camera for transforms.
 * Handles tiled background, depth-sorted entities, particles.
 */
class GameRenderer {

    static drawBackground(camera) {
        // Reuse camera transform — background tiles fill the viewport
        const bg = AssetManager.images.desertBg;
        if (bg && bg.width > 0) {
            imageMode(CORNER);
            const tw = Config.BG_TILE_SIZE, th = Config.BG_TILE_SIZE;
            const startI = floor((camera.x - width)  / tw) - 1;
            const endI   = ceil((camera.x + width * 2) / tw) + 1;
            const startJ = floor((camera.y - height) / th) - 1;
            const endJ   = ceil((camera.y + height * 2) / th) + 1;
            for (let i = startI; i <= endI; i++)
                for (let j = startJ; j <= endJ; j++)
                    image(bg, i * tw, j * th, tw, th);
            imageMode(CENTER);
        } else {
            fill(180, 160, 130); noStroke();
            for (let i = -20; i < 20; i++)
                for (let j = -20; j < 20; j++)
                    rect(i * 100, j * 100, 100, 100);
        }
    }

    static drawWorld(game) {
        const getBuildingSize = b => game.world.getBuildingDrawSize(b);

        DrawingHelpers.drawBuildingShadows(game.world.buildings, getBuildingSize);
        game.tireMarks.draw(game.player);
        game.particles.drawDrive();

        // Depth-sorted: buildings + player + camels together
        const drawables = [];
        for (const b of game.world.buildings) {
            const bs = getBuildingSize(b);
            drawables.push({ type: 'building', data: b, depth: b.y + bs.h / 2 });
        }
        drawables.push({ type: 'player', data: game.player, depth: game.player.y });
        drawables.push({ type: 'police', data: game.police, depth: game.police.y });
        for (const c of game.world.camels) {
            drawables.push({ type: 'camel', data: c, depth: c.y });
        }
        drawables.sort((a, b) => a.depth - b.depth);

        for (const d of drawables) {
            if      (d.type === 'building') DrawingHelpers.drawOneBuilding(d.data, getBuildingSize, AssetManager.images.buildings);
            else if (d.type === 'player')   d.data.draw();
            else if (d.type === 'police')   d.data.draw();
            else if (d.type === 'camel')    d.data.draw(game.world);
        }

        DrawingHelpers.drawPalms(game.world.palms, () => game.world.getPalmDrawSize(), AssetManager.images.palm);
        game.particles.drawCrash();   // crash dust on top of everything
    }

    static draw(game) {
        background(210, 190, 160);
        game.camera.begin();
            GameRenderer.drawBackground(game.camera);
            GameRenderer.drawWorld(game);
            if (game.debug) game.debug.draw(game);   // collider outlines (world-space)
        game.camera.end();
        if (game.debug) game.debug.drawHUD(game);    // FPS/stats (screen-space)
    }
}
