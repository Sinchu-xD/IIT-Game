// NPC system - object pooling, customers, pedestrians, workers
class NPCSystem {
  constructor(scene, gameState) {
    this.scene = scene;
    this.gs = gameState;
    this.customers = [];
    this.pedestrians = [];
    this.workers = [];
    this.pool = [];
    this.maxNPCs = 20;
    this.npcGeo = null;
    this.npcMaterials = {};
    this.paths = [];
    this.spawnTimer = 0;
    this.spawnInterval = 3.0;
    this.customerTargets = [];
    this.onCustomerPurchase = null;
  }

  init() {
    // Shared lightweight geometries (total < 85 triangles per character)
    this.torsoGeo = new THREE.BoxGeometry(0.28, 0.38, 0.18);
    this.headGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    this.hairGeo = new THREE.BoxGeometry(0.2, 0.08, 0.2);
    this.armGeo = new THREE.BoxGeometry(0.07, 0.3, 0.07);
    this.legGeo = new THREE.BoxGeometry(0.09, 0.32, 0.09);

    // Keep reference for test assertions
    this.npcGeo = this.torsoGeo;

    // Shared material palette for Indian attire
    this.skinMat = new THREE.MeshLambertMaterial({ color: 0xD79A6D });
    this.hairMat = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
    this.turbanMat = new THREE.MeshLambertMaterial({ color: 0xFF5722 });
    this.topiMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF }); // Gandhi cap / white topi
    this.bottomMat = new THREE.MeshLambertMaterial({ color: 0x37474F });

    const outfitHexes = [
      0x2196F3, // Blue shirt
      0xFF9800, // Orange kurta
      0x4CAF50, // Green kurta
      0xE91E63, // Pink saree
      0x9C27B0, // Purple kurta
      0x00BCD4, // Cyan shirt
      0xFFEB3B, // Yellow saree
      0xFF5722, // Saffron kurta
      0xFAFAFA  // White kurta
    ];
    this.outfitMats = outfitHexes.map(c => new THREE.MeshLambertMaterial({ color: c }));

    // Pre-create material variants for backward compatibility
    this.npcMaterials = {
      customer: new THREE.MeshLambertMaterial({ color: 0xFF6B6B }),
      pedestrian: new THREE.MeshLambertMaterial({ color: 0x4ECDC4 }),
      worker: new THREE.MeshLambertMaterial({ color: 0xFFE66D }),
      male_shirt: new THREE.MeshLambertMaterial({ color: 0x3366CC }),
      female_saree: new THREE.MeshLambertMaterial({ color: 0xFF4444 }),
      kurta: new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
    };

    // Create walking paths (sidewalk waypoints)
    this.paths = [
      [{ x: -12, z: 7 }, { x: -6, z: 7 }, { x: 0, z: 7 }, { x: 6, z: 7 }, { x: 12, z: 7 }],
      [{ x: -12, z: -7 }, { x: -6, z: -7 }, { x: 0, z: -7 }, { x: 6, z: -7 }, { x: 12, z: -7 }],
      [{ x: 0, z: 12 }, { x: 0, z: 7 }, { x: 0, z: 0 }, { x: 0, z: -7 }, { x: 0, z: -12 }]
    ];

    // Seed initial pedestrians
    for (let i = 0; i < 8; i++) this.spawnPedestrian();
  }

  createCharacter(isCustomer = false) {
    const group = new THREE.Group();
    const outfitMat = this.outfitMats[Math.floor(Math.random() * this.outfitMats.length)];
    const headwearRoll = Math.random();
    let headwearMat = this.hairMat;
    let headwearType = 'hair';
    if (headwearRoll < 0.25) {
      headwearMat = this.turbanMat;
      headwearType = 'turban';
    } else if (headwearRoll < 0.45) {
      headwearMat = this.topiMat;
      headwearType = 'topi';
    }

    // Torso
    const torso = new THREE.Mesh(this.torsoGeo, outfitMat);
    torso.position.y = 0.5;
    torso.castShadow = true;
    group.add(torso);

    // Head
    const head = new THREE.Mesh(this.headGeo, this.skinMat);
    head.position.y = 0.78;
    group.add(head);

    // Headwear (Hair, Turban, or Gandhi Topi)
    const hair = new THREE.Mesh(this.hairGeo, headwearMat);
    hair.position.y = 0.88;
    group.add(hair);

    // Arms (pivot from shoulder)
    const armL = new THREE.Mesh(this.armGeo, outfitMat);
    armL.position.set(-0.19, 0.48, 0);
    group.add(armL);

    const armR = new THREE.Mesh(this.armGeo, outfitMat);
    armR.position.set(0.19, 0.48, 0);
    group.add(armR);

    // Legs (pivot from hips)
    const legL = new THREE.Mesh(this.legGeo, this.bottomMat);
    legL.position.set(-0.08, 0.16, 0);
    group.add(legL);

    const legR = new THREE.Mesh(this.legGeo, this.bottomMat);
    legR.position.set(0.08, 0.16, 0);
    group.add(legR);

    // Store limb references for walking animation
    group.userData = {
      armL,
      armR,
      legL,
      legR,
      headwearType,
      animTimer: Math.random() * 10
    };

    // Safe fallback for material disposal calls
    group.material = { dispose: () => {} };

    return group;
  }

  spawnPedestrian() {
    if (this.pedestrians.length >= 8) return;
    const pathIdx = Math.floor(Math.random() * this.paths.length);
    const path = this.paths[pathIdx];
    const wpIdx = Math.floor(Math.random() * path.length);

    const charGroup = this.createCharacter(false);
    charGroup.position.set(path[wpIdx].x, 0, path[wpIdx].z);
    Object.assign(charGroup.userData, {
      type: 'pedestrian',
      pathIdx,
      waypointIdx: wpIdx,
      speed: 1.5 + Math.random() * 2,
      direction: Math.random() > 0.5 ? 1 : -1
    });

    this.scene.add(charGroup);
    this.pedestrians.push(charGroup);
  }

  spawnCustomer() {
    if (this.customers.length >= 6) return;
    const buildings = this.getActiveBuildings();
    if (buildings.length === 0) return;

    // Demand-weighted target selection if progression system is present
    let target;
    if (this.gs?.progression) {
      // Pick based on demand weights
      const weights = buildings.map(b => this.gs.progression.getDemand(b.businessId));
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      let rand = Math.random() * totalWeight;
      for (let i = 0; i < buildings.length; i++) {
        rand -= weights[i];
        if (rand <= 0) {
          target = buildings[i];
          break;
        }
      }
    }
    if (!target) {
      target = buildings[Math.floor(Math.random() * buildings.length)];
    }

    const spawnX = target.plotX + (Math.random() - 0.5) * 10;
    const spawnZ = target.plotZ + 5 + Math.random() * 5;

    const charGroup = this.createCharacter(true);
    charGroup.position.set(spawnX, 0, spawnZ);
    Object.assign(charGroup.userData, {
      type: 'customer',
      targetPlot: target.plotIndex,
      targetBiz: target.businessId,
      state: 'walking',
      speed: 2.8 + Math.random() * 1.5
    });

    this.scene.add(charGroup);
    this.customers.push(charGroup);
  }

  getActiveBuildings() {
    const active = [];
    for (const bid in this.gs.buildings) {
      for (const b of this.gs.buildings[bid]) {
        if (b.state === 'built' && b.plotIndex < this.plotPositions?.length) {
          active.push({
            businessId: bid,
            plotIndex: b.plotIndex,
            plotX: this.plotPositions[b.plotIndex]?.x || 0,
            plotZ: this.plotPositions[b.plotIndex]?.z || 0
          });
        }
      }
    }
    return active;
  }

  setPlotPositions(positions) { this.plotPositions = positions; }

  update(deltaTime) {
    this.spawnTimer += deltaTime;
    if (this.spawnTimer > this.spawnInterval) {
      this.spawnTimer = 0;
      if (Math.random() < 0.5) this.spawnCustomer();
      if (Math.random() < 0.3) this.spawnPedestrian();
    }

    // Update customers
    for (let i = this.customers.length - 1; i >= 0; i--) {
      const npc = this.customers[i];
      if (npc.userData.state === 'walking') {
        const target = this.plotPositions[npc.userData.targetPlot];
        if (target) {
          // Calculate queue position so multiple customers do not overlap
          let queueIndex = 0;
          for (let c = 0; c < this.customers.length; c++) {
            if (this.customers[c] === npc) break;
            if (this.customers[c].userData.targetPlot === npc.userData.targetPlot) {
              queueIndex++;
            }
          }
          const slotX = (queueIndex % 2 === 1 ? -0.45 : (queueIndex > 0 ? 0.45 : 0));
          const slotZ = 1.1 + Math.floor(queueIndex / 2) * 0.45;
          const targetX = target.x + slotX;
          const targetZ = target.z + slotZ;

          const dx = targetX - npc.position.x;
          const dz = targetZ - npc.position.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist > 0.35) {
            npc.position.x += (dx / dist) * npc.userData.speed * deltaTime;
            npc.position.z += (dz / dist) * npc.userData.speed * deltaTime;
            npc.lookAt(targetX, npc.position.y, targetZ);

            // Walking swing
            npc.userData.animTimer += deltaTime * npc.userData.speed;
            const swing = Math.sin(npc.userData.animTimer * 5) * 0.35;
            if (npc.userData.legL) npc.userData.legL.rotation.x = swing;
            if (npc.userData.legR) npc.userData.legR.rotation.x = -swing;
            if (npc.userData.armL) npc.userData.armL.rotation.x = -swing;
            if (npc.userData.armR) npc.userData.armR.rotation.x = swing;
          } else {
            npc.userData.state = 'shopping';
            // Face the shop counter
            npc.lookAt(target.x, npc.position.y, target.z);
            // Service speed modifier from specializations and roles
            let speedMod = 1.0;
            if (this.gs?.progression) {
              const specId = this.gs.progression.getSpecialization(npc.userData.targetBiz, npc.userData.targetPlot);
              const spec = this.gs.progression.getSpecializationOptions(npc.userData.targetBiz).find(s => s.id === specId);
              if (spec?.speedMult) speedMod *= spec.speedMult;
              const role = this.gs.progression.getEmployeeRole(npc.userData.targetBiz, npc.userData.targetPlot);
              if (role?.speedBonus) speedMod *= (1 + role.speedBonus);
            }
            npc.userData.shopTimer = (2 + Math.random() * 3) / speedMod;
            // Reset limbs
            if (npc.userData.legL) npc.userData.legL.rotation.x = 0;
            if (npc.userData.legR) npc.userData.legR.rotation.x = 0;
            if (npc.userData.armL) npc.userData.armL.rotation.x = 0;
            if (npc.userData.armR) npc.userData.armR.rotation.x = 0;
          }
        }
      } else if (npc.userData.state === 'shopping') {
        npc.userData.shopTimer -= deltaTime;
        // Subtle shopping gesture
        npc.position.y = Math.sin(performance.now() * 0.006) * 0.05;
        if (npc.userData.armR) npc.userData.armR.rotation.x = -0.4 + Math.sin(performance.now() * 0.008) * 0.15;
        if (npc.userData.shopTimer <= 0) {
          if (this.onCustomerPurchase) {
            this.onCustomerPurchase(npc.userData.targetBiz, npc.userData.targetPlot, npc.position);
          }
          npc.userData.state = 'leaving';
          npc.position.y = 0;
          if (npc.userData.armR) npc.userData.armR.rotation.x = 0;
        }
      } else if (npc.userData.state === 'leaving') {
        // Natural exit path: walk to nearest sidewalk then leave
        const exitZ = npc.position.z >= 0 ? 7.2 : -7.2;
        const dz = exitZ - npc.position.z;
        if (Math.abs(dz) > 0.35) {
          npc.position.z += Math.sign(dz) * npc.userData.speed * deltaTime;
          npc.rotation.y = dz > 0 ? 0 : Math.PI;
        } else {
          const dir = npc.position.x >= 0 ? 1 : -1;
          npc.position.x += dir * npc.userData.speed * deltaTime;
          npc.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        }

        // Walking swing
        npc.userData.animTimer += deltaTime * npc.userData.speed;
        const swing = Math.sin(npc.userData.animTimer * 5) * 0.35;
        if (npc.userData.legL) npc.userData.legL.rotation.x = swing;
        if (npc.userData.legR) npc.userData.legR.rotation.x = -swing;
        if (npc.userData.armL) npc.userData.armL.rotation.x = -swing;
        if (npc.userData.armR) npc.userData.armR.rotation.x = swing;

        if (Math.abs(npc.position.x) > 14) {
          this.scene.remove(npc);
          if (npc.material && npc.material.dispose) npc.material.dispose();
          this.customers.splice(i, 1);
        }
      }
    }

    // Update pedestrians with sidewalk lane separation
    for (let i = this.pedestrians.length - 1; i >= 0; i--) {
      const npc = this.pedestrians[i];
      const path = this.paths[npc.userData.pathIdx];
      const wp = path[npc.userData.waypointIdx];
      const laneOffset = (npc.userData.direction > 0 ? 0.28 : -0.28);
      const targetZ = (npc.userData.pathIdx < 2) ? (wp.z + laneOffset) : wp.z;
      const dx = wp.x - npc.position.x;
      const dz = targetZ - npc.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.3) {
        npc.userData.waypointIdx += npc.userData.direction;
        if (npc.userData.waypointIdx >= path.length || npc.userData.waypointIdx < 0) {
          npc.userData.direction *= -1;
          npc.userData.waypointIdx = Math.max(0, Math.min(path.length - 1, npc.userData.waypointIdx));
        }
      } else {
        npc.position.x += (dx / dist) * npc.userData.speed * deltaTime * 0.35;
        npc.position.z += (dz / dist) * npc.userData.speed * deltaTime * 0.35;
        if (Math.abs(dx) > Math.abs(dz)) {
          npc.rotation.y = dx > 0 ? Math.PI / 2 : -Math.PI / 2;
        } else {
          npc.rotation.y = dz > 0 ? 0 : Math.PI;
        }

        // Walking swing
        npc.userData.animTimer += deltaTime * npc.userData.speed;
        const swing = Math.sin(npc.userData.animTimer * 4) * 0.35;
        if (npc.userData.legL) npc.userData.legL.rotation.x = swing;
        if (npc.userData.legR) npc.userData.legR.rotation.x = -swing;
        if (npc.userData.armL) npc.userData.armL.rotation.x = -swing;
        if (npc.userData.armR) npc.userData.armR.rotation.x = swing;
      }
    }

    // Soft physics crowd separation: prevent NPCs from clipping/walking into each other
    this.handleCrowdSeparation(deltaTime);
  }

  handleCrowdSeparation(deltaTime) {
    const all = [...this.customers, ...this.pedestrians];
    const minDist = 0.52;
    const minDistSq = minDist * minDist;

    for (let i = 0; i < all.length; i++) {
      const a = all[i];
      for (let j = i + 1; j < all.length; j++) {
        const b = all[j];
        const dx = a.position.x - b.position.x;
        const dz = a.position.z - b.position.z;
        const distSq = dx * dx + dz * dz;

        if (distSq < minDistSq && distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          const push = (minDist - dist) * 0.5;
          const nx = dx / dist;
          const nz = dz / dist;
          const pushAmount = Math.min(push, deltaTime * 2.5);

          a.position.x += nx * pushAmount;
          a.position.z += nz * pushAmount;
          b.position.x -= nx * pushAmount;
          b.position.z -= nz * pushAmount;
        }
      }
    }
  }
}
