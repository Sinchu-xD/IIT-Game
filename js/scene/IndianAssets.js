// IndianAssets - Procedural assets for authentic Indian street shops
class IndianAssets {
  constructor(scene) {
    this.scene = scene;
    this.materials = this.initMaterials();
    this.signTextures = {};
  }

  initMaterials() {
    return {
      kettle: new THREE.MeshLambertMaterial({ color: 0x9E9E9E }),
      stove: new THREE.MeshLambertMaterial({ color: 0x37474F }),
      canopyChai: new THREE.MeshLambertMaterial({ color: 0xFF5722, side: THREE.DoubleSide }),
      canopyDhaba: new THREE.MeshLambertMaterial({ color: 0xFF9800, side: THREE.DoubleSide }),
      bamboo: new THREE.MeshLambertMaterial({ color: 0xCD853F }),
      chairPlastic: new THREE.MeshLambertMaterial({ color: 0x1976D2 }),
      shelfWood: new THREE.MeshLambertMaterial({ color: 0x6D4C41 }),
      scaleMetal: new THREE.MeshLambertMaterial({ color: 0x78909C }),
      chulhaClay: new THREE.MeshLambertMaterial({ color: 0x5D4037 }),
      tableWood: new THREE.MeshLambertMaterial({ color: 0x8D6E63 }),
      barberPoleRed: new THREE.MeshLambertMaterial({ color: 0xD32F2F }),
      barberPoleWhite: new THREE.MeshLambertMaterial({ color: 0xFAFAFA }),
      mirrorFrame: new THREE.MeshLambertMaterial({ color: 0xFFD700 }),
      mirrorGlass: new THREE.MeshLambertMaterial({ color: 0xB0BEC5, emissive: 0x223344, emissiveIntensity: 0.2 }),
      salonChair: new THREE.MeshLambertMaterial({ color: 0x212121 }),
      mobileStand: new THREE.MeshLambertMaterial({ color: 0x263238 }),
      mobileGlass: new THREE.MeshLambertMaterial({ color: 0x80D8FF, transparent: true, opacity: 0.4 }),
      phoneBlack: new THREE.MeshLambertMaterial({ color: 0x111111, emissive: 0x0D47A1, emissiveIntensity: 0.3 }),
      sackJute: new THREE.MeshLambertMaterial({ color: 0xBCAAA4 })
    };
  }

  // ─── Procedural Bilingual Signboard Texture ───
  getSignboardTexture(businessId) {
    if (this.signTextures[businessId]) return this.signTextures[businessId];

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const signConfigs = {
      chai_stall: { textH: 'चाय टपरी', textE: 'CHAI TAPRI', bg: '#D84315', fg: '#FFF9C4', border: '#FFD54F' },
      kirana_store: { textH: 'किराना स्टोर', textE: 'KIRANA STORE', bg: '#1565C0', fg: '#FFFFFF', border: '#FFEB3B' },
      dhaba: { textH: 'पंजाबी ढाबा', textE: 'PUNJABI DHABA', bg: '#E65100', fg: '#FFFDE7', border: '#FFD700' },
      salon: { textH: 'रॉयल सैलून', textE: 'ROYAL SALON', bg: '#AD1457', fg: '#FFFFFF', border: '#FFD54F' },
      mobile_shop: { textH: 'मोबाइल रिपेयर', textE: 'MOBILE & REPAIR', bg: '#00838F', fg: '#FFFFFF', border: '#80DEEA' }
    };

    const cfg = signConfigs[businessId] || { textH: 'दुकान', textE: 'SHOP', bg: '#333333', fg: '#FFFFFF', border: '#FFD700' };

    if (ctx) {
      // Background
      ctx.fillStyle = cfg.bg;
      if (ctx.fillRect) ctx.fillRect(0, 0, 256, 64);

      // Ornate Border
      ctx.strokeStyle = cfg.border;
      ctx.lineWidth = 4;
      if (ctx.strokeRect) ctx.strokeRect(3, 3, 250, 58);

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      if (ctx.strokeRect) ctx.strokeRect(6, 6, 244, 52);

      // Hindi / Devanagari headline
      ctx.fillStyle = cfg.fg;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (ctx.fillText) ctx.fillText(cfg.textH, 128, 22);

      // English subtitle
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px sans-serif';
      if (ctx.fillText) ctx.fillText(cfg.textE, 128, 46);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    this.signTextures[businessId] = texture;
    return texture;
  }

  // ─── Chai Stall Details ───
  addChaiDetails(group, basePos) {
    const parent = group || this.scene;
    const ox = group ? 0 : (basePos?.x || 0);
    const oy = group ? 0 : (basePos?.y || 0);
    const oz = group ? 0 : (basePos?.z || 0);

    // Stove
    const stoveGeo = new THREE.BoxGeometry(0.35, 0.2, 0.3);
    const stove = new THREE.Mesh(stoveGeo, this.materials.stove);
    stove.position.set(ox - 0.35, oy + 0.45, oz + 0.55);
    parent.add(stove);

    // Kettle
    const kettleGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.2, 8);
    const kettle = new THREE.Mesh(kettleGeo, this.materials.kettle);
    kettle.position.set(ox - 0.35, oy + 0.65, oz + 0.55);
    parent.add(kettle);

    // Chai glass stand (cutting chai glasses rack)
    const rackGeo = new THREE.BoxGeometry(0.25, 0.08, 0.2);
    const rack = new THREE.Mesh(rackGeo, this.materials.scaleMetal);
    rack.position.set(ox + 0.35, oy + 0.45, oz + 0.55);
    parent.add(rack);

    // Canopy support bamboo poles
    for (const px of [-0.65, 0.65]) {
      const poleGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.4, 6);
      const pole = new THREE.Mesh(poleGeo, this.materials.bamboo);
      pole.position.set(ox + px, oy + 0.85, oz + 0.7);
      parent.add(pole);
    }

    // Slanted striped awning canopy
    const canopyGeo = new THREE.BoxGeometry(1.45, 0.04, 0.75);
    const canopy = new THREE.Mesh(canopyGeo, this.materials.canopyChai);
    canopy.position.set(ox, oy + 1.45, oz + 0.55);
    canopy.rotation.x = 0.2;
    parent.add(canopy);

    // Blue plastic tapri stools / chairs
    for (const cx of [-0.6, 0.6]) {
      const chairGeo = new THREE.BoxGeometry(0.25, 0.3, 0.25);
      const chair = new THREE.Mesh(chairGeo, this.materials.chairPlastic);
      chair.position.set(ox + cx, oy + 0.15, oz + 1.05);
      parent.add(chair);
    }
  }

  // ─── Kirana Details ───
  addKiranaDetails(group, basePos) {
    const parent = group || this.scene;
    const ox = group ? 0 : (basePos?.x || 0);
    const oy = group ? 0 : (basePos?.y || 0);
    const oz = group ? 0 : (basePos?.z || 0);

    // Wooden goods shelves at the rear counter
    for (let sy = 0; sy < 2; sy++) {
      const shelfGeo = new THREE.BoxGeometry(1.2, 0.04, 0.2);
      const shelf = new THREE.Mesh(shelfGeo, this.materials.shelfWood);
      shelf.position.set(ox, oy + 0.6 + sy * 0.28, oz + 0.35);
      parent.add(shelf);

      // Colorful packaged goods / dabbas on shelf
      const prodColors = [0xFF5252, 0x4CAF50, 0xFFEB3B, 0x448AFF, 0xFF9800];
      for (let px = -0.45; px <= 0.45; px += 0.22) {
        const prodGeo = new THREE.BoxGeometry(0.09, 0.14, 0.09);
        const col = prodColors[Math.floor(Math.random() * prodColors.length)];
        const prod = new THREE.Mesh(prodGeo, new THREE.MeshLambertMaterial({ color: col }));
        prod.position.set(ox + px, oy + 0.7 + sy * 0.28, oz + 0.35);
        parent.add(prod);
      }
    }

    // Traditional weighing scale (Taraju / digital scale)
    const scaleGeo = new THREE.BoxGeometry(0.22, 0.1, 0.18);
    const scaleMesh = new THREE.Mesh(scaleGeo, this.materials.scaleMetal);
    scaleMesh.position.set(ox - 0.45, oy + 0.45, oz + 0.65);
    parent.add(scaleMesh);

    // Jute sacks / grain bags stacked in front
    for (const sx of [0.45, 0.65]) {
      const sackGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.32, 6);
      const sack = new THREE.Mesh(sackGeo, this.materials.sackJute);
      sack.position.set(ox + sx, oy + 0.16, oz + 0.85);
      parent.add(sack);
    }
  }

  // ─── Dhaba Details ───
  addDhabaDetails(group, basePos) {
    const parent = group || this.scene;
    const ox = group ? 0 : (basePos?.x || 0);
    const oy = group ? 0 : (basePos?.y || 0);
    const oz = group ? 0 : (basePos?.z || 0);

    // Tandoor / clay chulha
    const chulhaGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.4, 8);
    const chulha = new THREE.Mesh(chulhaGeo, this.materials.chulhaClay);
    chulha.position.set(ox + 0.5, oy + 0.45, oz + 0.5);
    parent.add(chulha);

    // Awning / tent canopy extending forward
    const canopyGeo = new THREE.BoxGeometry(1.6, 0.05, 0.9);
    const canopy = new THREE.Mesh(canopyGeo, this.materials.canopyDhaba);
    canopy.position.set(ox, oy + 1.5, oz + 0.65);
    canopy.rotation.x = 0.15;
    parent.add(canopy);

    // Canopy wooden pillars
    for (const px of [-0.75, 0.75]) {
      const pilGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.45, 6);
      const pil = new THREE.Mesh(pilGeo, this.materials.tableWood);
      pil.position.set(ox + px, oy + 0.75, oz + 0.95);
      parent.add(pil);
    }

    // Wooden dining charpai / bench table
    const tableGeo = new THREE.BoxGeometry(0.7, 0.25, 0.4);
    const table = new THREE.Mesh(tableGeo, this.materials.tableWood);
    table.position.set(ox - 0.2, oy + 0.15, oz + 1.15);
    parent.add(table);
  }

  // ─── Salon Details ───
  addSalonDetails(group, basePos) {
    const parent = group || this.scene;
    const ox = group ? 0 : (basePos?.x || 0);
    const oy = group ? 0 : (basePos?.y || 0);
    const oz = group ? 0 : (basePos?.z || 0);

    // Rotating striped Barber Pole on side
    const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.9, 8);
    const pole = new THREE.Mesh(poleGeo, this.materials.barberPoleRed);
    pole.position.set(ox + 0.75, oy + 0.85, oz + 0.65);
    parent.add(pole);

    // Barber pole stripes
    for (let sy = -0.3; sy <= 0.3; sy += 0.2) {
      const stripeGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.08, 8);
      const stripe = new THREE.Mesh(stripeGeo, this.materials.barberPoleWhite);
      stripe.position.set(ox + 0.75, oy + 0.85 + sy, oz + 0.65);
      parent.add(stripe);
    }

    // Mirror on the wall
    const mirrorFrameGeo = new THREE.BoxGeometry(0.65, 0.75, 0.04);
    const mirrorFrame = new THREE.Mesh(mirrorFrameGeo, this.materials.mirrorFrame);
    mirrorFrame.position.set(ox, oy + 0.85, oz + 0.4);
    parent.add(mirrorFrame);

    const mirrorGlassGeo = new THREE.BoxGeometry(0.55, 0.65, 0.02);
    const mirrorGlass = new THREE.Mesh(mirrorGlassGeo, this.materials.mirrorGlass);
    mirrorGlass.position.set(ox, oy + 0.85, oz + 0.43);
    parent.add(mirrorGlass);

    // Swivel salon chair
    const chairBaseGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.2, 8);
    const chairBase = new THREE.Mesh(chairBaseGeo, this.materials.scaleMetal);
    chairBase.position.set(ox, oy + 0.1, oz + 0.9);
    parent.add(chairBase);

    const seatGeo = new THREE.BoxGeometry(0.3, 0.25, 0.28);
    const seat = new THREE.Mesh(seatGeo, this.materials.salonChair);
    seat.position.set(ox, oy + 0.3, oz + 0.9);
    parent.add(seat);
  }

  // ─── Mobile Shop Details ───
  addMobileShopDetails(group, basePos) {
    const parent = group || this.scene;
    const ox = group ? 0 : (basePos?.x || 0);
    const oy = group ? 0 : (basePos?.y || 0);
    const oz = group ? 0 : (basePos?.z || 0);

    // Glass display counter
    const counterGlassGeo = new THREE.BoxGeometry(1.2, 0.35, 0.25);
    const counterGlass = new THREE.Mesh(counterGlassGeo, this.materials.mobileGlass);
    counterGlass.position.set(ox, oy + 0.45, oz + 0.65);
    parent.add(counterGlass);

    // Mobile phones on miniature display stands
    for (let px = -0.35; px <= 0.35; px += 0.22) {
      const standGeo = new THREE.BoxGeometry(0.06, 0.05, 0.06);
      const stand = new THREE.Mesh(standGeo, this.materials.mobileStand);
      stand.position.set(ox + px, oy + 0.45, oz + 0.65);
      parent.add(stand);

      const phoneGeo = new THREE.BoxGeometry(0.05, 0.11, 0.015);
      const phone = new THREE.Mesh(phoneGeo, this.materials.phoneBlack);
      phone.position.set(ox + px, oy + 0.52, oz + 0.65);
      phone.rotation.x = -0.25;
      parent.add(phone);
    }

    // Colorful mobile covers / accessories hanging board
    const boardGeo = new THREE.BoxGeometry(0.8, 0.5, 0.03);
    const board = new THREE.Mesh(boardGeo, new THREE.MeshLambertMaterial({ color: 0x00ACC1 }));
    board.position.set(ox, oy + 0.85, oz + 0.38);
    parent.add(board);
  }
}

