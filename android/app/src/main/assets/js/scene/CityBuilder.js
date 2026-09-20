// CityBuilder - Procedural Indian neighborhood scene
class CityBuilder {
  constructor(scene) {
    this.scene = scene;
    this.materials = {};
    this.streetLights = [];
    this.progressionTiers = { market: false, town: false, city: false };
    this.tierGroups = { market: null, town: null, city: null };
    this.initMaterials();
  }

  initMaterials() {
    this.materials = {
      road: new THREE.MeshLambertMaterial({ color: 0x333333 }),
      roadLine: new THREE.MeshLambertMaterial({ color: 0xFFFF00 }),
      sidewalk: new THREE.MeshLambertMaterial({ color: 0xBB9966 }),
      grass: new THREE.MeshLambertMaterial({ color: 0x228B22 }),
      wall: new THREE.MeshLambertMaterial({ color: 0xF5DEB3 }),
      roof: new THREE.MeshLambertMaterial({ color: 0x8B4513 }),
      door: new THREE.MeshLambertMaterial({ color: 0x654321 }),
      window: new THREE.MeshLambertMaterial({ color: 0x87CEEB, emissive: 0x111122, emissiveIntensity: 0.2 }),
      pole: new THREE.MeshLambertMaterial({ color: 0x444444 }),
      lamp: new THREE.MeshLambertMaterial({ color: 0xFFD700, emissive: 0x442200, emissiveIntensity: 0.1 }),
      wire: new THREE.MeshBasicMaterial({ color: 0x222222 }),
      scooter: new THREE.MeshLambertMaterial({ color: 0xCC0000 }),
      auto: new THREE.MeshLambertMaterial({ color: 0x00AA00 }),
      tree_trunk: new THREE.MeshLambertMaterial({ color: 0x8B4513 }),
      tree_leaves: new THREE.MeshLambertMaterial({ color: 0x228B22 }),
      tree_leaves2: new THREE.MeshLambertMaterial({ color: 0x2E8B57 }),
      sign_red: new THREE.MeshLambertMaterial({ color: 0xFF3333 }),
      sign_blue: new THREE.MeshLambertMaterial({ color: 0x3333FF }),
      sign_green: new THREE.MeshLambertMaterial({ color: 0x33AA33 }),
      signboard_bg: new THREE.MeshLambertMaterial({ color: 0xFFDD44 }),
      stall_canopy: new THREE.MeshLambertMaterial({ color: 0xFF6600 }),
      chai_kettle: new THREE.MeshLambertMaterial({ color: 0x888888 }),
      bench: new THREE.MeshLambertMaterial({ color: 0x8B6914 }),
      water_tap: new THREE.MeshLambertMaterial({ color: 0x6699CC }),
      antenna: new THREE.MeshLambertMaterial({ color: 0x888888 }),
      ac_unit: new THREE.MeshLambertMaterial({ color: 0xCCCCCC }),
      neon: new THREE.MeshBasicMaterial({ color: 0xFF00FF }),
      water_tank: new THREE.MeshLambertMaterial({ color: 0x4488CC })
    };
  }

  build() {
    this.buildRoad();
    this.buildSidewalks();
    this.buildBackgroundBuildings();
    this.buildStreetLights();
    this.buildElectricityPoles();
    this.buildTrees();
    this.buildScooters();
    this.buildAutoRickshaw();
    this.buildIndianSignboards();
    this.buildStreetDecorations();
  }

  buildRoad() {
    // Main road
    const roadGeo = new THREE.PlaneGeometry(24, 20);
    const road = new THREE.Mesh(roadGeo, this.materials.road);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.01, 0);
    this.scene.add(road);

    // Road divider lines
    for (let z = -8; z <= 8; z += 3) {
      const lineGeo = new THREE.PlaneGeometry(1.5, 0.3);
      const line = new THREE.Mesh(lineGeo, this.materials.roadLine);
      line.rotation.x = -Math.PI / 2;
      line.position.set(0, 0.02, z);
      this.scene.add(line);
    }

    // Road edges (white stripes)
    for (let x = -11.5; x <= 11.5; x += 23) {
      const edgeGeo = new THREE.PlaneGeometry(0.2, 20);
      const edge = new THREE.Mesh(edgeGeo, this.materials.roadLine);
      edge.rotation.x = -Math.PI / 2;
      edge.position.set(x, 0.02, 0);
      this.scene.add(edge);
    }
  }

  buildSidewalks() {
    // North sidewalk
    const swGeo = new THREE.PlaneGeometry(24, 1.5);
    const swNorth = new THREE.Mesh(swGeo, this.materials.sidewalk);
    swNorth.rotation.x = -Math.PI / 2;
    swNorth.position.set(0, 0.03, 10);
    this.scene.add(swNorth);

    const swSouth = new THREE.Mesh(swGeo, this.materials.sidewalk);
    swSouth.rotation.x = -Math.PI / 2;
    swSouth.position.set(0, 0.03, -10);
    this.scene.add(swSouth);
  }

  buildBackgroundBuildings() {
    const buildingConfigs = [
      { x: -14, z: 0, w: 3, h: 4, d: 3, color: 0xE8D4B8 },
      { x: 14, z: 0, w: 4, h: 5, d: 3, color: 0xD4C4A8 },
      { x: -14, z: 4, w: 2.5, h: 3, d: 2.5, color: 0xCCBB99 },
      { x: 14, z: -4, w: 3.5, h: 6, d: 3, color: 0xDDCCAA },
      { x: -14, z: -5, w: 3, h: 4.5, d: 3, color: 0xE0D0B0 },
      { x: 14, z: 5, w: 2.8, h: 3.5, d: 2.8, color: 0xC8B898 },
      { x: 0, z: 14, w: 5, h: 4, d: 2, color: 0xD0C0A0 },
      { x: 0, z: -14, w: 4, h: 5, d: 2.5, color: 0xE5D5B5 },
      { x: -10, z: 12, w: 3, h: 3, d: 3, color: 0xCCC0A0 },
      { x: 10, z: -12, w: 3.5, h: 4, d: 3, color: 0xD8C8A8 },
    ];

    for (const cfg of buildingConfigs) {
      this.createBuildingBlock(cfg.x, cfg.z, cfg.w, cfg.h, cfg.d, cfg.color);
    }
  }

  createBuildingBlock(x, z, w, h, d, color) {
    const group = new THREE.Group();

    // Main body
    const bodyGeo = new THREE.BoxGeometry(w, h, d);
    const bodyMat = new THREE.MeshLambertMaterial({ color });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    body.userData = { isBuildingPart: true };
    group.add(body);

    // Roof (flat with slight overhang)
    const roofGeo = new THREE.BoxGeometry(w + 0.3, 0.2, d + 0.3);
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = h + 0.1;
    roof.userData = { isBuildingPart: true };
    group.add(roof);

    // Windows
    const windowGeo = new THREE.BoxGeometry(0.5, 0.6, 0.05);
    const floors = Math.floor(h / 1.5);
    for (let f = 0; f < floors; f++) {
      for (let wx = -w / 2 + 0.6; wx < w / 2 - 0.3; wx += 1.0) {
        const win = new THREE.Mesh(windowGeo, this.materials.window);
        win.position.set(wx, 1 + f * 1.5, d / 2 + 0.01);
        win.userData = { isWindow: true, isBuildingPart: true };
        group.add(win);
      }
    }

    // Water tank on roof
    if (h > 3) {
      const tankGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8);
      const tank = new THREE.Mesh(tankGeo, this.materials.water_tank);
      tank.position.set(w / 2 - 0.5, h + 0.7, 0);
      group.add(tank);
    }

    // Antenna on tall buildings
    if (h > 4.5) {
      const antGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.5, 4);
      const ant = new THREE.Mesh(antGeo, this.materials.antenna);
      ant.position.set(0, h + 1.1, 0);
      group.add(ant);
    }

    group.position.set(x, 0, z);
    group.rotation.y = Math.random() > 0.5 ? 0 : Math.PI;
    this.scene.add(group);
  }

  buildStreetLights() {
    const positions = [
      { x: -9, z: 7 }, { x: 0, z: 7 }, { x: 9, z: 7 },
      { x: -9, z: -7 }, { x: 0, z: -7 }, { x: 9, z: -7 }
    ];

    for (const pos of positions) {
      const group = new THREE.Group();

      // Pole
      const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, 3.5, 8);
      const pole = new THREE.Mesh(poleGeo, this.materials.pole);
      pole.position.y = 1.75;
      group.add(pole);

      // Arm
      const armGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 6);
      const arm = new THREE.Mesh(armGeo, this.materials.pole);
      arm.rotation.z = Math.PI / 2;
      arm.position.set(0.7, 3.4, 0);
      group.add(arm);

      // Lamp head
      const lampGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.3, 8);
      const lamp = new THREE.Mesh(lampGeo, this.materials.lamp);
      lamp.position.set(1.4, 3.3, 0);
      group.add(lamp);

      // Light glow (small transparent sphere)
      const glowGeo = new THREE.SphereGeometry(0.3, 8, 8);
      const glowMat = new THREE.MeshBasicMaterial({ color: 0xFFFFAA, transparent: true, opacity: 0.15 });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.set(1.4, 3.1, 0);
      group.add(glow);
      this.streetLights.push(glow);

      group.position.set(pos.x, 0, pos.z);
      this.scene.add(group);
    }
  }

  buildElectricityPoles() {
    const positions = [
      { x: -5, z: 9.5 }, { x: 5, z: 9.5 },
      { x: -5, z: -9.5 }, { x: 5, z: -9.5 }
    ];

    for (const pos of positions) {
      const group = new THREE.Group();

      const poleGeo = new THREE.CylinderGeometry(0.12, 0.15, 4, 6);
      const pole = new THREE.Mesh(poleGeo, this.materials.pole);
      pole.position.y = 2;
      group.add(pole);

      // Cross arm
      const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 2, 6);
      const arm = new THREE.Mesh(armGeo, this.materials.pole);
      arm.rotation.z = Math.PI / 2;
      arm.position.set(0, 3.8, 0);
      group.add(arm);

      // Insulators
      for (let ix = -0.8; ix <= 0.8; ix += 0.8) {
        const insGeo = new THREE.SphereGeometry(0.08, 6, 6);
        const ins = new THREE.Mesh(insGeo, this.materials.pole);
        ins.position.set(ix, 3.9, 0);
        group.add(ins);
      }

      group.position.set(pos.x, 0, pos.z);
      this.scene.add(group);

      // Wires connecting to next pole
      const nextPos = positions.find(p => p.z === pos.z && p.x !== pos.x);
      if (nextPos) {
        const wireGeo = new THREE.BufferGeometry();
        const wireVerts = new Float32Array([
          pos.x, 3.85, pos.z, nextPos.x, 3.85, nextPos.z
        ]);
        wireGeo.setAttribute('position', new THREE.BufferAttribute(wireVerts, 3));
        const wire = new THREE.Line(wireGeo, new THREE.LineBasicMaterial({ color: 0x222222 }));
        this.scene.add(wire);
      }
    }

    // Cross street wires
    const wireGeoH = new THREE.BufferGeometry();
    const wireVertsH = new Float32Array([
      -11, 3.85, 9.5, 11, 3.85, 9.5,
      -11, 3.85, -9.5, 11, 3.85, -9.5
    ]);
    wireGeoH.setAttribute('position', new THREE.BufferAttribute(wireVertsH, 3));
    const wireH = new THREE.LineSegments(wireGeoH, new THREE.LineBasicMaterial({ color: 0x222222 }));
    this.scene.add(wireH);
  }

  buildTrees() {
    const treePositions = [
      { x: -8, z: 9 }, { x: -3, z: 9 }, { x: 3, z: 9 }, { x: 8, z: 9 },
      { x: -8, z: -9 }, { x: -3, z: -9 }, { x: 3, z: -9 }, { x: 8, z: -9 },
      { x: -11.5, z: 4 }, { x: -11.5, z: -3 },
      { x: 11.5, z: 3 }, { x: 11.5, z: -4 },
      { x: -11, z: 11 }, { x: 11, z: 11 },
      { x: -11, z: -11 }, { x: 11, z: -11 }
    ];

    for (const pos of treePositions) {
      const group = new THREE.Group();

      const trunkGeo = new THREE.CylinderGeometry(0.15, 0.2, 1.2, 6);
      const trunk = new THREE.Mesh(trunkGeo, this.materials.tree_trunk);
      trunk.position.y = 0.6;
      group.add(trunk);

      // Canopy layers
      const leafGeo1 = new THREE.SphereGeometry(0.8, 8, 6);
      const leaves1 = new THREE.Mesh(leafGeo1, this.materials.tree_leaves);
      leaves1.position.y = 1.5;
      leaves1.scale.y = 0.7;
      group.add(leaves1);

      const leafGeo2 = new THREE.SphereGeometry(0.6, 8, 6);
      const leaves2 = new THREE.Mesh(leafGeo2, this.materials.tree_leaves2);
      leaves2.position.y = 2.0;
      leaves2.scale.y = 0.6;
      group.add(leaves2);

      group.position.set(pos.x, 0, pos.z);
      this.scene.add(group);
    }
  }

  buildScooters() {
    // Red scooter near plot area
    this.createScooter(-3.5, 0, 2, 0, 0xFF0000);
    // Blue scooter
    this.createScooter(4.5, 0, 2, 0, 0x0066CC);
    // Black scooter
    this.createScooter(-3.5, 0, -2, Math.PI, 0x222222);
  }

  createScooter(x, y, z, rotY, color) {
    const group = new THREE.Group();

    // Body
    const bodyGeo = new THREE.BoxGeometry(0.4, 0.3, 1.0);
    const bodyMat = new THREE.MeshLambertMaterial({ color });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.35;
    group.add(body);

    // Seat
    const seatGeo = new THREE.BoxGeometry(0.3, 0.1, 0.4);
    const seatMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.set(0, 0.55, -0.1);
    group.add(seat);

    // Handles
    const handleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6);
    const handleMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0, 0.65, 0.35);
    group.add(handle);

    // Wheels
    for (let wx of [-0.3, 0.3]) {
      const wheelGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 12);
      const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, 0.15, -0.3);
      group.add(wheel);
      const wheel2 = new THREE.Mesh(wheelGeo, wheelMat);
      wheel2.rotation.z = Math.PI / 2;
      wheel2.position.set(wx, 0.15, 0.3);
      group.add(wheel2);
    }

    group.position.set(x, y, z);
    group.rotation.y = rotY;
    this.scene.add(group);
  }

  buildAutoRickshaw() {
    const group = new THREE.Group();

    // Body (green lower part)
    const bodyGeo = new THREE.BoxGeometry(1.2, 0.8, 1.6);
    const body = new THREE.Mesh(bodyGeo, this.materials.auto);
    body.position.y = 0.5;
    group.add(body);

    // Roof (beige top)
    const roofGeo = new THREE.BoxGeometry(1.0, 0.3, 1.4);
    const roofMat = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 1.05;
    group.add(roof);

    // Rear cabin (open)
    const cabinGeo = new THREE.BoxGeometry(0.8, 0.6, 0.9);
    const cabinMat = new THREE.MeshLambertMaterial({ color: 0xCCDDEE, transparent: true, opacity: 0.7 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 0.7, 0.2);
    group.add(cabin);

    // Front windshield
    const windGeo = new THREE.BoxGeometry(0.9, 0.5, 0.05);
    const windMat = new THREE.MeshLambertMaterial({ color: 0x4488AA, transparent: true, opacity: 0.6 });
    const wind = new THREE.Mesh(windGeo, windMat);
    wind.position.set(0, 0.7, -0.8);
    group.add(wind);

    // Front wheel
    const wheelGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.08, 12);
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const fw = new THREE.Mesh(wheelGeo, wheelMat);
    fw.rotation.z = Math.PI / 2;
    fw.position.set(0, 0.2, -0.5);
    group.add(fw);

    // Rear wheels (smaller)
    const rw = new THREE.Mesh(wheelGeo, wheelMat);
    rw.rotation.z = Math.PI / 2;
    rw.position.set(0, 0.2, 0.5);
    rw.scale.set(0.8, 0.8, 0.8);
    group.add(rw);

    // Yellow-black stripes
    const stripeGeo = new THREE.BoxGeometry(1.22, 0.1, 0.15);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xFFCC00 });
    for (let sz = -0.6; sz <= 0.6; sz += 0.5) {
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.set(0, 0.8, sz);
      group.add(stripe);
    }

    group.position.set(0, 0, 12.5);
    group.rotation.y = Math.PI;
    this.scene.add(group);
  }

  buildIndianSignboards() {
    // Shop signboards - Indian style colorful boards
    const signs = [
      { x: -6, z: 5.3, text: 'CHAI TAPRI', color: 0xFF6600, width: 1.2 },
      { x: -2, z: 5.3, text: 'KIRANA', color: 0x0066FF, width: 0.9 },
      { x: 2, z: 5.3, text: 'DHABA', color: 0xFFAA00, width: 0.8 },
      { x: 6, z: 5.3, text: 'SALON', color: 0xFF69B4, width: 0.7 },
      { x: 10, z: 5.3, text: 'MOBILE', color: 0x00CED1, width: 0.9 }
    ];

    for (const s of signs) {
      this.createSignboard(s.x, s.z, s.text, s.color, s.width);
    }

    // Street name sign
    this.createStreetSign(-3, 8, 'GANDHI MARG');
  }

  createSignboard(x, z, text, color, width) {
    const group = new THREE.Group();

    // Board
    const boardGeo = new THREE.BoxGeometry(width, 0.4, 0.08);
    const boardMat = new THREE.MeshLambertMaterial({ color });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.y = 3.5;
    group.add(board);

    // Border
    const borderGeo = new THREE.BoxGeometry(width + 0.1, 0.5, 0.06);
    const borderMat = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.position.y = 3.5;
    group.add(border);

    // Pole
    const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 3.5, 6);
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 1.75;
    group.add(pole);

    group.position.set(x, 0, z);
    this.scene.add(group);
  }

  createStreetSign(x, z, text) {
    const group = new THREE.Group();

    const signGeo = new THREE.BoxGeometry(3, 0.5, 0.08);
    const signMat = new THREE.MeshLambertMaterial({ color: 0x006633 });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.y = 3.5;
    group.add(sign);

    const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 3.5, 6);
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 1.75;
    group.add(pole);

    group.position.set(x, 0, z);
    this.scene.add(group);
  }

  buildStreetDecorations() {
    // Dustbins
    this.createDustbin(-9.5, 0, 8.5);
    this.createDustbin(9.5, 0, 8.5);
    this.createDustbin(-9.5, 0, -8.5);
    this.createDustbin(9.5, 0, -8.5);

    // Small park area
    this.createPark(11.5, 0, 0);
  }

  createDustbin(x, y, z) {
    const group = new THREE.Group();
    const binGeo = new THREE.CylinderGeometry(0.2, 0.15, 0.5, 8);
    const binMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const bin = new THREE.Mesh(binGeo, binMat);
    bin.position.y = 0.25;
    group.add(bin);
    group.position.set(x, y, z);
    this.scene.add(group);
  }

  createPark(x, y, z) {
    const group = new THREE.Group();

    // Grass patch
    const grassGeo = new THREE.PlaneGeometry(3, 3);
    const grass = new THREE.Mesh(grassGeo, this.materials.grass);
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(x + 2, 0.04, z);
    this.scene.add(grass);

    // Bench
    const benchGroup = new THREE.Group();
    const seatGeo = new THREE.BoxGeometry(1.2, 0.08, 0.4);
    const seat = new THREE.Mesh(seatGeo, this.materials.bench);
    seat.position.y = 0.4;
    benchGroup.add(seat);
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6);
    for (let lx of [-0.5, 0.5]) {
      const leg = new THREE.Mesh(legGeo, this.materials.bench);
      leg.position.set(lx, 0.2, 0);
      benchGroup.add(leg);
    }
    benchGroup.position.set(x + 2, 0, z + 0.8);
    benchGroup.rotation.y = Math.PI / 2;
    this.scene.add(benchGroup);

    // Small tree in park
    const treeGroup = new THREE.Group();
    const tTrunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.15, 1, 6),
      this.materials.tree_trunk
    );
    tTrunk.position.y = 0.5;
    treeGroup.add(tTrunk);
    const tLeaves = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 8, 6),
      this.materials.tree_leaves
    );
    tLeaves.position.y = 1.3;
    treeGroup.add(tLeaves);
    treeGroup.position.set(x + 2, 0, z - 0.5);
    this.scene.add(treeGroup);
  }

  updateProgression(unlockedPlots) {
    if (unlockedPlots >= 5 && !this.progressionTiers.market) {
      this.buildMarketTier();
      this.progressionTiers.market = true;
    }
    if (unlockedPlots >= 9 && !this.progressionTiers.town) {
      this.buildTownTier();
      this.progressionTiers.town = true;
    }
    if (unlockedPlots >= 12 && !this.progressionTiers.city) {
      this.buildCityTier();
      this.progressionTiers.city = true;
    }
  }

  buildMarketTier() {
    const group = new THREE.Group();
    group.userData = { isCityTier: true, tier: 'market' };

    // 1. Roadside Sabzi/Fruit vendor stall
    const stall = new THREE.Group();
    stall.userData = { tierItem: 'sabzi_stall' };
    const stallTable = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.6), this.materials.bench);
    stallTable.position.set(0, 0.2, 0);
    stall.add(stallTable);

    const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.05, 0.7), this.materials.stall_canopy);
    canopy.position.set(0, 0.8, 0);
    stall.add(canopy);

    // Fruit crates
    const crateGeo = new THREE.BoxGeometry(0.25, 0.2, 0.25);
    const crateMat1 = new THREE.MeshLambertMaterial({ color: 0xFF9800 });
    const crateMat2 = new THREE.MeshLambertMaterial({ color: 0x4CAF50 });
    const c1 = new THREE.Mesh(crateGeo, crateMat1);
    c1.position.set(-0.35, 0.45, 0.05);
    stall.add(c1);
    const c2 = new THREE.Mesh(crateGeo, crateMat2);
    c2.position.set(0.35, 0.45, 0.05);
    stall.add(c2);

    stall.position.set(-8.5, 0, 8.5);
    group.add(stall);

    // 2. Roadside wooden bench along north sidewalk
    const benchGeo = new THREE.BoxGeometry(1.0, 0.1, 0.35);
    const bench = new THREE.Mesh(benchGeo, this.materials.bench);
    bench.position.set(8.5, 0.25, 8.5);
    bench.userData = { tierItem: 'bench' };
    group.add(bench);

    this.tierGroups.market = group;
    this.scene.add(group);
  }

  buildTownTier() {
    const group = new THREE.Group();
    group.userData = { isCityTier: true, tier: 'town' };

    // 1. Two additional streetlights
    const lightPositions = [{ x: -4, z: 7.2 }, { x: 4, z: -7.2 }];
    for (const pos of lightPositions) {
      const poleGeo = new THREE.CylinderGeometry(0.06, 0.08, 3.2, 6);
      const pole = new THREE.Mesh(poleGeo, this.materials.pole);
      pole.position.set(pos.x, 1.6, pos.z);
      group.add(pole);

      const glowGeo = new THREE.SphereGeometry(0.25, 6, 6);
      const glowMat = new THREE.MeshBasicMaterial({ color: 0xFFFFAA, transparent: true, opacity: 0.2 });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.set(pos.x, 3.1, pos.z);
      group.add(glow);
      this.streetLights.push(glow);
    }

    // 2. Parked curb scooter
    const scooterBody = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.8), this.materials.scooter);
    scooterBody.position.set(5.5, 0.2, 6.8);
    scooterBody.rotation.y = 0.3;
    scooterBody.userData = { tierItem: 'parked_scooter' };
    group.add(scooterBody);

    // 3. Decorative planter with flower bush
    const potGeo = new THREE.CylinderGeometry(0.3, 0.25, 0.4, 8);
    const pot = new THREE.Mesh(potGeo, this.materials.wall);
    pot.position.set(-5.5, 0.2, -6.8);
    pot.userData = { tierItem: 'planter' };
    group.add(pot);

    const bushGeo = new THREE.SphereGeometry(0.35, 6, 6);
    const bushMat = new THREE.MeshLambertMaterial({ color: 0xE91E63 });
    const bush = new THREE.Mesh(bushGeo, bushMat);
    bush.position.set(-5.5, 0.5, -6.8);
    group.add(bush);

    this.tierGroups.town = group;
    this.scene.add(group);
  }

  buildCityTier() {
    const group = new THREE.Group();
    group.userData = { isCityTier: true, tier: 'city' };

    // 1. Roadside advertising billboard
    const billPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.8, 6), this.materials.pole);
    billPillar.position.set(11, 1.9, 7.5);
    group.add(billPillar);

    const billBoard = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.0, 0.1), this.materials.signboard_bg);
    billBoard.position.set(11, 3.8, 7.5);
    billBoard.userData = { tierItem: 'billboard' };
    group.add(billBoard);

    // 2. Decorative iron street barriers / railings separating pavement
    for (let rx = -7; rx <= -3; rx += 1.2) {
      const railGeo = new THREE.BoxGeometry(1.0, 0.5, 0.05);
      const railMat = new THREE.MeshLambertMaterial({ color: 0x37474F });
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(rx, 0.25, 6.2);
      rail.userData = { tierItem: 'railing' };
      group.add(rail);
    }

    this.tierGroups.city = group;
    this.scene.add(group);
  }

  disposeProgression() {
    for (const key in this.tierGroups) {
      const grp = this.tierGroups[key];
      if (grp) {
        this.scene.remove(grp);
        this.tierGroups[key] = null;
      }
    }
    this.progressionTiers = { market: false, town: false, city: false };
  }
}
