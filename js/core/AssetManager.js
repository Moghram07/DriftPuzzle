class AssetManager {
  static images = {
    desertBg: null,
    truck: null,
    blueTruck: null,
    buildings: [],
    palm: null,
    camel: null,
    camelShadow: null
  };

  static preload() {
    // CORRECT PATHS - matches YOUR actual folder structure (NO trailing spaces!)
    this.images.desertBg = loadImage('assets/images/environment/desertBackground.png');
    this.images.truck = loadImage('assets/images/vehicles/PlayerTruck.png');
    this.images.blueTruck = loadImage('assets/images/vehicles/SmugglerTruck.png');
    this.images.policeTruck = loadImage('assets/images/vehicles/PoliceTruck.png');
    
    // YOUR 8 building folders (building1 to building8)
    this.images.buildings[0] = loadImage('assets/images/environment/building1/texture.png');
    this.images.buildings[1] = loadImage('assets/images/environment/building2/texture.png');
    this.images.buildings[2] = loadImage('assets/images/environment/building3/texture.png');
    this.images.buildings[3] = loadImage('assets/images/environment/building4/texture.png');
    this.images.buildings[4] = loadImage('assets/images/environment/building5/texture.png');
    this.images.buildings[5] = loadImage('assets/images/environment/building6/texture.png');
    this.images.buildings[6] = loadImage('assets/images/environment/building7/texture.png');
    this.images.buildings[7] = loadImage('assets/images/environment/building8/texture.png');
    
    // Palm tree path (YOUR confirmed structure)
    this.images.palm = loadImage('assets/images/environment/props/palmTree/texture.png');
    
    // Camel assets (YOUR structure: characters/ folder)
    this.images.camel = loadImage('assets/images/characters/texture.png');
    this.images.camelShadow = loadImage('assets/images/characters/shadow.png');
  }

  static get(img) {
    return this.images[img];
  }
}