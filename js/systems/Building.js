// Building system - plots, construction, upgrades, visual states
class BuildingSystem {
  constructor(scene, economy, gameState) {
    this.scene = scene;
    this.economy = economy;
    this.gs = gameState;
    this.plotMeshes = [];
    this.buildingMeshes = {};
    this.selectedPlot = null;
    this.plotPositions = [];
    this.onBuildingUpdate = null;
    this.indianAssets = (typeof IndianAssets !== 'undefined') ? new IndianAssets(scene) : null;
    this.selectionIndicator = null;
    this.tapCooldown = 1200;
    this.progression = null;
  }

  setProgressionSystem(progression) {
    this.progression = progression;
  }

  initPlotPositions() {
    this.plotPositions = [
      { x: -6, z: 0 }, { x: -2, z: 0 }, { x: 2, z: 0 }, { x: 6, z: 0 }, { x: 10, z: 0 },
      { x: -6, z: 5 }, { x: -2, z: 5 }, { x: 2, z: 5 }, { x: 6, z: 5 }, { x: 10, z: 5 },
      { x: -6, z: -5 }, { x: -2, z: -5 }, { x: 2, z: -5 }, { x: 6, z: -5 }, { x: 10, z: -5 }
    ];
  }

  createSelectionIndicator() {
    if (this.selectionIndicator) return;
    this.selectionIndicator = new THREE.Group();

    // Outer highlight ring
    const ringGeo = THREE.RingGeometry
      ? new THREE.RingGeometry(1.2, 1.45, 24)
      : new THREE.CylinderGeometry(1.4, 1.4, 0.02, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    this.selectionIndicator.add(ring);

    // Inner highlight ring
    const innerGeo = THREE.RingGeometry
      ? new THREE.RingGeometry(0.35, 0.45, 16)
      : new THREE.CylinderGeometry(0.45, 0.45, 0.02, 16);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xFFEB3B,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    inner.rotation.x = -Math.PI / 2;
    this.selectionIndicator.add(inner);

    this.selectionIndicator.position.set(0, 0.12, 0);
    this.selectionIndicator.visible = false;
    this.scene.add(this.selectionIndicator);
  }

  selectPlot(plotIndex) {
    if (plotIndex === null || plotIndex === undefined || !this.plotPositions[plotIndex]) return;
    this.selectedPlot = plotIndex;
    const pos = this.plotPositions[plotIndex];
    if (this.selectionIndicator) {
      this.selectionIndicator.position.set(pos.x, 0.12, pos.z);
      this.selectionIndicator.visible = true;
    }
  }

  clearSelection() {
    this.selectedPlot = null;
    if (this.selectionIndicator) {
      this.selectionIndicator.visible = false;
    }
  }

  update(deltaTime) {
    if (this.selectionIndicator && this.selectionIndicator.visible) {
      const t = performance.now() * 0.005;
      const s = 1.0 + Math.sin(t) * 0.08;
      this.selectionIndicator.scale.set(s, 1, s);
    }
  }

  highlightNewPlot(plotIndex) {
    if (plotIndex === null || plotIndex === undefined || !this.plotMeshes[plotIndex]) return;
    const mesh = this.plotMeshes[plotIndex];
    if (mesh.material) {
      const originalHex = 0x44AA44;
      mesh.material.color.setHex(0xFFFF00);
      mesh.material.opacity = 1.0;
      setTimeout(() => {
        if (mesh.material) {
          mesh.material.color.setHex(originalHex);
          mesh.material.opacity = 0.7;
        }
      }, 700);
    }
    this.selectPlot(plotIndex);
  }

  createPlotMarkers() {
    this.initPlotPositions();
    this.createSelectionIndicator();
    const geo = new THREE.BoxGeometry(2.2, 0.15, 2.2);
    for (let i = 0; i < this.plotPositions.length; i++) {
      const pos = this.plotPositions[i];
      const mat = new THREE.MeshLambertMaterial({
        color: i < this.gs.unlockedPlots ? 0x44AA44 : 0x884444,
        transparent: true,
        opacity: 0.7
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pos.x, 0.08, pos.z);
      mesh.userData = { plotIndex: i, isPlot: true };
      this.scene.add(mesh);
      this.plotMeshes.push(mesh);

      // Plot number label using a small cylinder
      const labelGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16);
      const labelMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
      const label = new THREE.Mesh(labelGeo, labelMat);
      label.position.set(pos.x, 0.2, pos.z);
      this.scene.add(label);
    }
  }

  createBuilding(businessId, plotIndex) {
    const cfg = getBusinessConfig(businessId);
    if (!cfg) return null;

    const pos = this.plotPositions[plotIndex];
    const group = new THREE.Group();
    group.position.set(pos.x, 0.15, pos.z);
    group.scale.set(0.01, 0.01, 0.01);

    // Building body
    const stage = this.getVisualStage(cfg, 1);
    const bodyGeo = new THREE.BoxGeometry(1.6 * stage.scale, 1.2 * stage.scale, 1.6 * stage.scale);
    const bodyMat = new THREE.MeshLambertMaterial({ color: cfg.colors.primary });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.6 * stage.scale;
    body.castShadow = true;
    body.receiveShadow = true;
    body.userData = { isBuildingPart: true, plotIndex };
    group.add(body);

    // Roof
    const roofGeo = new THREE.ConeGeometry(1.2 * stage.scale, 0.5 * stage.scale, 4);
    const roofMat = new THREE.MeshLambertMaterial({ color: cfg.colors.secondary });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 1.2 * stage.scale + 0.25 * stage.scale;
    roof.rotation.y = Math.PI / 4;
    roof.userData = { isBuildingPart: true, plotIndex };
    group.add(roof);

    // Counter/shop front
    const counterGeo = new THREE.BoxGeometry(1.4 * stage.scale, 0.3 * stage.scale, 0.3 * stage.scale);
    const counterMat = new THREE.MeshLambertMaterial({ color: cfg.colors.accent });
    const counter = new THREE.Mesh(counterGeo, counterMat);
    counter.position.set(0, 0.15 * stage.scale, 0.8 * stage.scale);
    counter.userData = { isBuildingPart: true, plotIndex };
    group.add(counter);

    // Signboard with authentic bilingual texture
    const signGeo = new THREE.BoxGeometry(1.2 * stage.scale, 0.35 * stage.scale, 0.05);
    let signMat;
    if (this.indianAssets && this.indianAssets.getSignboardTexture) {
      const signTexture = this.indianAssets.getSignboardTexture(businessId);
      signMat = new THREE.MeshLambertMaterial({
        map: signTexture || null,
        color: signTexture ? 0xFFFFFF : 0xFFFF00
      });
    } else {
      signMat = new THREE.MeshLambertMaterial({ color: 0xFFFF00, emissive: 0x333300 });
    }
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 1.45 * stage.scale, 0.82 * stage.scale);
    sign.userData = { isBuildingPart: true, plotIndex };
    group.add(sign);

    // Unique Indian Props integration from IndianAssets
    if (this.indianAssets) {
      if (businessId === 'chai_stall') {
        this.indianAssets.addChaiDetails(group);
      } else if (businessId === 'kirana_store') {
        this.indianAssets.addKiranaDetails(group);
      } else if (businessId === 'dhaba') {
        this.indianAssets.addDhabaDetails(group);
      } else if (businessId === 'salon') {
        this.indianAssets.addSalonDetails(group);
      } else if (businessId === 'mobile_shop') {
        this.indianAssets.addMobileShopDetails(group);
      }
    }

    this.scene.add(group);
    this.buildingMeshes[`${businessId}_${plotIndex}`] = { group, body, roof, counter, sign, stage };
    return group;
  }

  getVisualStage(cfg, level) {
    let stage = cfg.visualStages[0];
    for (const s of cfg.visualStages) {
      if (level >= s.level) stage = s;
    }
    return stage;
  }

  getPlotUnlockCost(plotIndex) {
    if (this.gs.plotUnlockCosts && this.gs.plotUnlockCosts[plotIndex] !== undefined) {
      return this.gs.plotUnlockCosts[plotIndex];
    }
    const defaultCosts = (typeof PLOT_UNLOCK_COSTS !== 'undefined')
      ? PLOT_UNLOCK_COSTS
      : [0, 2000, 8000, 25000, 60000, 120000, 250000, 500000, 1000000, 2000000, 4000000, 7500000, 12000000, 20000000, 35000000];
    return defaultCosts[plotIndex] || 50000;
  }

  applyVisualUpgrades(group, businessId, plotIndex, level) {
    if (!group) return;
    if (!group.userData) group.userData = {};
    if (!group.userData.visualTiers) group.userData.visualTiers = {};

    // Milestone Level 5 → Improved: Festive marigold garland/lights bunting & wooden customer stool
    if (level >= 5 && !group.userData.visualTiers.tier5) {
      const tier5Group = new THREE.Group();
      tier5Group.userData = { isBuildingPart: true, plotIndex, tier: 5 };

      // Wooden customer stool in front
      const stoolGeo = new THREE.BoxGeometry(0.26, 0.22, 0.26);
      const stoolMat = new THREE.MeshLambertMaterial({ color: 0x8D6E63 });
      const stool = new THREE.Mesh(stoolGeo, stoolMat);
      stool.position.set(-0.55, 0.11, 0.95);
      stool.userData = { isBuildingPart: true, plotIndex };
      tier5Group.add(stool);

      // Festive garland lights (marigold golden/orange glow)
      const bulbGeo = new THREE.SphereGeometry(0.045, 6, 6);
      const bulbMat1 = new THREE.MeshLambertMaterial({ color: 0xFFB300 });
      const bulbMat2 = new THREE.MeshLambertMaterial({ color: 0xE65100 });
      for (let gx = -0.55; gx <= 0.55; gx += 0.22) {
        const mat = (Math.round(gx * 100) % 2 === 0) ? bulbMat1 : bulbMat2;
        const bulb = new THREE.Mesh(bulbGeo, mat);
        bulb.position.set(gx, 0.98, 0.85);
        bulb.userData = { isBuildingPart: true, plotIndex };
        tier5Group.add(bulb);
      }

      group.add(tier5Group);
      group.userData.visualTiers.tier5 = true;
    }

    // Milestone Level 10 → Developed: Front striped awning canopy, rooftop brass kalash, and stock crate
    if (level >= 10 && !group.userData.visualTiers.tier10) {
      const tier10Group = new THREE.Group();
      tier10Group.userData = { isBuildingPart: true, plotIndex, tier: 10 };

      // Front awning canopy overhang
      const awningGeo = new THREE.BoxGeometry(1.4, 0.05, 0.55);
      const awningMat = new THREE.MeshLambertMaterial({ color: 0xF57C00 });
      const awning = new THREE.Mesh(awningGeo, awningMat);
      awning.position.set(0, 1.25, 0.95);
      awning.rotation.x = 0.15;
      awning.userData = { isBuildingPart: true, plotIndex };
      tier10Group.add(awning);

      // Rooftop brass kalash / finial
      const kalashGeo = new THREE.ConeGeometry(0.14, 0.35, 8);
      const kalashMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
      const kalash = new THREE.Mesh(kalashGeo, kalashMat);
      kalash.position.set(0, 1.75, 0);
      kalash.userData = { isBuildingPart: true, plotIndex };
      tier10Group.add(kalash);

      // Stock display crate
      const crateGeo = new THREE.BoxGeometry(0.28, 0.3, 0.28);
      const crateMat = new THREE.MeshLambertMaterial({ color: 0x5D4037 });
      const crate = new THREE.Mesh(crateGeo, crateMat);
      crate.position.set(0.55, 0.15, 0.95);
      crate.userData = { isBuildingPart: true, plotIndex };
      tier10Group.add(crate);

      group.add(tier10Group);
      group.userData.visualTiers.tier10 = true;
    }

    // Milestone Level 20 → Premium: Dual golden entrance pillars, illuminated lantern, and royal crest
    if (level >= 20 && !group.userData.visualTiers.tier20) {
      const tier20Group = new THREE.Group();
      tier20Group.userData = { isBuildingPart: true, plotIndex, tier: 20 };

      // Dual ornamental golden entrance pillars
      const pillarGeo = new THREE.CylinderGeometry(0.06, 0.08, 1.3, 8);
      const goldMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });

      const pillarL = new THREE.Mesh(pillarGeo, goldMat);
      pillarL.position.set(-0.72, 0.65, 0.88);
      pillarL.userData = { isBuildingPart: true, plotIndex };
      tier20Group.add(pillarL);

      const pillarR = new THREE.Mesh(pillarGeo, goldMat);
      pillarR.position.set(0.72, 0.65, 0.88);
      pillarR.userData = { isBuildingPart: true, plotIndex };
      tier20Group.add(pillarR);

      // Front illuminated brass street lamp
      const lampGeo = new THREE.SphereGeometry(0.09, 8, 8);
      const lampMat = new THREE.MeshLambertMaterial({ color: 0xFFFF8D });
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.set(0.72, 1.35, 0.92);
      lamp.userData = { isBuildingPart: true, plotIndex };
      tier20Group.add(lamp);

      // Royal crest crown atop the signboard
      const crestGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 8);
      const crest = new THREE.Mesh(crestGeo, goldMat);
      crest.rotation.x = Math.PI / 2;
      crest.position.set(0, 1.68, 0.84);
      crest.userData = { isBuildingPart: true, plotIndex };
      tier20Group.add(crest);

      group.add(tier20Group);
      group.userData.visualTiers.tier20 = true;
    }
  }

  upgradeBuildingVisual(businessId, plotIndex, newLevel) {
    const key = `${businessId}_${plotIndex}`;
    const meshes = this.buildingMeshes[key];
    if (!meshes) return;
    const cfg = getBusinessConfig(businessId);
    const stage = this.getVisualStage(cfg, newLevel);

    // Animate scale
    const startScale = meshes.group.scale.x;
    const targetScale = stage.scale;
    this.animateScale(meshes.group, startScale, targetScale, 500);

    // Update colors for higher levels
    const brightness = Math.min(1, 0.5 + (newLevel / cfg.maxLevel) * 0.5);
    meshes.body.material.color.setRGB(
      ((cfg.colors.primary >> 16) & 0xFF) / 255 * brightness,
      ((cfg.colors.primary >> 8) & 0xFF) / 255 * brightness,
      (cfg.colors.primary & 0xFF) / 255 * brightness
    );

    // Apply procedural visual upgrade milestones (Level 5, 10, 20)
    this.applyVisualUpgrades(meshes.group, businessId, plotIndex, newLevel);
  }

  animateScale(group, from, to, duration) {
    const startTime = performance.now();
    const raf = (typeof requestAnimationFrame !== 'undefined')
      ? requestAnimationFrame
      : ((typeof window !== 'undefined' && window.requestAnimationFrame) ? window.requestAnimationFrame : setTimeout);
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const s = from + (to - from) * eased;
      group.scale.set(s, s, s);
      if (t < 1) raf(animate);
    };
    animate();
  }

  onPlotClicked(plotIndex) {
    if (plotIndex >= this.gs.unlockedPlots) {
      const cost = this.getPlotUnlockCost(plotIndex);
      if (plotIndex > this.gs.unlockedPlots) {
        return { action: 'locked', cost, plotIndex, sequential: false };
      }
      if (cost !== undefined && this.economy.canAfford(cost)) {
        if (this.economy.spendCash(cost)) {
          this.gs.unlockedPlots = plotIndex + 1;
          this.updatePlotMarker(plotIndex);
          return { action: 'unlocked', plotIndex, cost };
        }
      }
      return { action: 'locked', cost, plotIndex };
    }

    const existing = this.getBuildingAtPlot(plotIndex);
    if (existing) {
      return { action: 'select_building', businessId: existing.businessId, building: existing };
    }

    const available = this.getAvailableBusinesses();
    return { action: 'build_menu', plotIndex, available };
  }

  getBuildingAtPlot(plotIndex) {
    for (const bid in this.gs.buildings) {
      for (const b of this.gs.buildings[bid]) {
        if (b.plotIndex === plotIndex) {
          b.businessId = bid;
          return b;
        }
      }
    }
    return null;
  }

  getAvailableBusinesses() {
    return this.gs.unlockedBusinesses;
  }

  build(businessId, plotIndex) {
    const cfg = getBusinessConfig(businessId);
    if (!cfg) return false;
    if (this.getBuildingAtPlot(plotIndex)) return false;

    const cost = getBuildCost(businessId);
    if (!this.economy.spendCash(cost)) return false;

    const building = {
      plotIndex,
      level: 1,
      employees: 0,
      state: 'building',
      incomeAccum: 0
    };

    if (!this.gs.buildings[businessId]) this.gs.buildings[businessId] = [];
    this.gs.buildings[businessId].push(building);
    this.gs.totalBuildings = this.countTotalBuildings();

    // Construction animation
    setTimeout(() => {
      building.state = 'built';
      this.createBuilding(businessId, plotIndex);
      this.animateScale(this.buildingMeshes[`${businessId}_${plotIndex}`].group, 0.01, 1.0, 600);
      this.updatePlotMarker(plotIndex);
      this.economy.recalcIncome(this.gs.buildings);
      if (this.onBuildingUpdate) this.onBuildingUpdate();
    }, 800);

    return true;
  }

  upgrade(businessId, plotIndex) {
    const buildings = this.gs.buildings[businessId];
    const b = buildings?.find(x => x.plotIndex === plotIndex);
    if (!b) return false;
    if (b.level >= getBusinessConfig(businessId).maxLevel) return false;

    const cost = getUpgradeCost(businessId, b.level);
    if (!this.economy.spendCash(cost)) return false;

    b.level++;
    b.state = 'upgrading';
    this.gs.upgradeActionCount = (this.gs.upgradeActionCount || 0) + 1;
    this.upgradeBuildingVisual(businessId, plotIndex, b.level);

    setTimeout(() => {
      b.state = 'built';
      this.economy.recalcIncome(this.gs.buildings);
      if (this.onBuildingUpdate) this.onBuildingUpdate();
    }, 500);

    return true;
  }

  hireEmployee(businessId, plotIndex) {
    const buildings = this.gs.buildings[businessId];
    const b = buildings?.find(x => x.plotIndex === plotIndex);
    if (!b) return false;
    const cfg = getBusinessConfig(businessId);
    if (b.employees >= cfg.maxEmployees) return false;

    const cost = cfg.employeeCost * (b.employees + 1);
    if (!this.economy.spendCash(cost)) return false;

    b.employees++;
    this.economy.recalcIncome(this.gs.buildings);
    if (this.onBuildingUpdate) this.onBuildingUpdate();
    return true;
  }

  updatePlotMarker(plotIndex) {
    if (this.plotMeshes[plotIndex]) {
      this.plotMeshes[plotIndex].material.color.setHex(
        plotIndex < this.gs.unlockedPlots ? 0x44AA44 : 0x884444
      );
    }
  }

  countTotalBuildings() {
    let count = 0;
    for (const bid in this.gs.buildings) count += this.gs.buildings[bid].length;
    return count;
  }

  tapBuilding(plotIndex) {
    if (plotIndex === null || plotIndex === undefined || plotIndex < 0 || plotIndex >= this.plotPositions.length) {
      return { success: false, reason: 'invalid_plot' };
    }

    if (plotIndex >= this.gs.unlockedPlots) {
      return { success: false, reason: 'locked' };
    }

    const building = this.getBuildingAtPlot(plotIndex);
    if (!building) {
      return { success: false, reason: 'empty' };
    }

    if (building.state !== 'built') {
      return { success: false, reason: 'under_construction' };
    }

    const now = Date.now();
    const cooldownMs = this.tapCooldown || 1200;
    if (building.lastTapTime && (now - building.lastTapTime) < cooldownMs) {
      const remainingSec = Math.max(0.1, Number(((cooldownMs - (now - building.lastTapTime)) / 1000).toFixed(1)));
      return { success: false, reason: 'cooldown', timeLeft: remainingSec };
    }

    building.lastTapTime = now;

    // Income-scaled active tap bonus: 25% of 1s income (minimum ₹1)
    let income = getIncomeForLevel(building.businessId, building.level, building.employees || 0);

    // Apply progression modifiers to tap bonus if progression system is available
    if (this.progression) {
      const specTap = this.progression.getSpecializationTapBonus(building.businessId, plotIndex);
      const zoneTap = this.progression.getZoneTapBonus(plotIndex);
      const activeSyn = this.progression.getActiveSynergies();
      let synTap = 0;
      for (const syn of activeSyn) {
        if (syn.tapBonus && (syn.target === 'all' || (Array.isArray(syn.target) && syn.target.includes(building.businessId)))) {
          synTap += syn.tapBonus;
        }
      }
      income = Math.floor(income * specTap * (1 + zoneTap + synTap));
    }

    const bonus = Math.max(1, Math.round(income * 0.25));

    this.economy.addCash(bonus, 'tap');
    this.gs.totalEarned = (this.gs.totalEarned || 0) + bonus;

    this.bounceBuilding(plotIndex);

    return {
      success: true,
      bonus,
      businessId: building.businessId,
      plotIndex
    };
  }

  bounceBuilding(plotIndex) {
    for (const key in this.buildingMeshes) {
      if (key.endsWith(`_${plotIndex}`)) {
        const meshEntry = this.buildingMeshes[key];
        if (meshEntry && meshEntry.group) {
          const grp = meshEntry.group;
          const origY = 0.15;
          grp.position.y = origY + 0.12;
          setTimeout(() => {
            if (grp.position) grp.position.y = origY;
          }, 120);
        }
        break;
      }
    }
  }
}
