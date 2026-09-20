// Indian Idle City Tycoon - Main Game
// Requires: Three.js loaded as THREE global from lib/three.min.js

const Game = (function () {
  'use strict';

  // ─── State ───
  let scene, camera, renderer, clock;
  let economy, buildingSystem, npcSystem, trafficSystem, cameraCtrl, saveSystem, missionSystem, dayNight, particles, audio, progressionSystem;
  let cityBuilder, indianAssets;
  let gameState = {};
  let currentPanel = null;
  let selectedBusiness = null;
  let selectedPlotIdx = null;
  let incomeTimer = 0;
  let saveTimer = 0;
  let autoSaveInterval = 30;
  let rafId = null;
  let isRunning = false;
  let fpsFrames = 0;
  let fpsTime = 0;

  let lastTouchTime = 0;

  // ─── Initialization ───
  async function init() {
    updateLoading(10, 'Initializing engine...');

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 30, 80);

    // Camera
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.5, 100);
    camera.position.set(0, 10, 15);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('gameCanvas').appendChild(renderer.domElement);

    clock = new THREE.Clock();

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xFFFFEE, 0.8);
    sun.position.set(15, 20, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 50;
    sun.shadow.camera.left = -20;
    sun.shadow.camera.right = 20;
    sun.shadow.camera.top = 20;
    sun.shadow.camera.bottom = -20;
    scene.add(sun);

    // Hemisphere for sky color
    const hemi = new THREE.HemisphereLight(0x87CEEB, 0x444422, 0.3);
    scene.add(hemi);

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x3a7d44 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    scene.add(ground);

    updateLoading(25, 'Building city...');

    // City
    cityBuilder = new CityBuilder(scene);
    cityBuilder.build();

    updateLoading(50, 'Loading systems...');

    // Systems
    economy = new EconomyManager();
    saveSystem = new SaveSystem();
    particles = new ParticleSystem(scene);
    audio = new AudioSystem();
    dayNight = new DayNightCycle(scene);
    dayNight.setLights(sun, ambient, scene.fog);

    gameState = {
      economy,
      buildings: {},
      unlockedPlots: 1,
      unlockedBusinesses: ['chai_stall'],
      playerLevel: 1,
      playerXP: 0,
      completedMissions: [],
      activeMissions: [0, 1],
      dailyRewardDay: 0,
      lastDailyReward: 0,
      decorations: [],
      settings: { sfx: true, music: true },
      plotUnlockCosts: (typeof PLOT_UNLOCK_COSTS !== 'undefined')
        ? [...PLOT_UNLOCK_COSTS]
        : [0, 2000, 8000, 25000, 60000, 120000, 250000, 500000, 1000000, 2000000, 4000000, 7500000, 12000000, 20000000, 35000000],
      tapBonusCount: 0,
      customerSalesCount: 0,
      totalBuildings: 0,
      totalEarned: 0,
      totalOfflineEarned: 0,
      // Deep Gameplay defaults
      specializations: {},
      employeeRoles: {},
      businessDemand: {},
      achievementsUnlocked: [],
      dailyObjectives: [],
      objectivesCompletedToday: [],
      lastObjectiveRefresh: 0
    };

    // Load or create save
    const saved = saveSystem.load();
    if (saved) {
      loadGameState(saved);
    } else {
      economy.addCash(100, 'start');
    }

    // Initialize Deep Gameplay Progression System
    progressionSystem = new ProgressionSystem(economy, gameState);
    gameState.progression = progressionSystem;
    economy.setProgressionSystem(progressionSystem);

    updateLoading(65, 'Setting up buildings...');

    buildingSystem = new BuildingSystem(scene, economy, gameState);
    buildingSystem.progression = progressionSystem;
    buildingSystem.createPlotMarkers();
    buildingSystem.onBuildingUpdate = () => {
      economy.recalcIncome(gameState.buildings);
      updateHUD();
    };

    // Rebuild existing buildings from save
    rebuildSavedBuildings();

    // Recalculate totalBuildings after loading save
    gameState.totalBuildings = buildingSystem.countTotalBuildings();
    checkBusinessUnlocks();

    updateLoading(75, 'Spawning NPCs...');

    npcSystem = new NPCSystem(scene, gameState);
    npcSystem.init();
    npcSystem.setPlotPositions(buildingSystem.plotPositions);
    npcSystem.onCustomerPurchase = (businessId, plotIndex, customerPos) => {
      gameState.customerSalesCount = (gameState.customerSalesCount || 0) + 1;
      const cfg = getBusinessConfig(businessId);
      if (!cfg) return;
      const buildings = gameState.buildings[businessId];
      const b = buildings?.find(x => x.plotIndex === plotIndex);
      const level = b ? b.level : 1;
      const empCount = b ? b.employees : 0;
      const saleAmount = Math.max(1, Math.round(getIncomeForLevel(businessId, level, empCount) * 0.25));

      economy.addCash(saleAmount, 'customer');
      if (progressionSystem && progressionSystem.recordCustomerPurchase) {
        progressionSystem.recordCustomerPurchase(businessId, plotIndex);
      }
      if (progressionSystem) {
        progressionSystem.checkAchievements();
        progressionSystem.checkObjectives();
      }

      if (particles && particles.spawnCashParticle) {
        particles.spawnCashParticle(saleAmount, customerPos || buildingSystem.plotPositions[plotIndex]);
      }
      playSound('customerSale');
    };

    updateLoading(80, 'Starting traffic...');
    trafficSystem = new TrafficSystem(scene);
    trafficSystem.init();

    updateLoading(85, 'Starting camera...');

    cameraCtrl = new CameraController(camera, renderer.domElement, {
      minX: -14, maxX: 14, minZ: -14, maxZ: 14
    });

    missionSystem = new MissionSystem(economy, gameState);
    missionSystem.init();
    missionSystem.onMissionComplete = (mission) => {
      showToast(`Mission Complete: ${mission.title}! +₹${(mission.reward.cash || 0).toLocaleString()}`);
      if (audio && audio.playMissionComplete) audio.playMissionComplete();
      else playSound('reward');
    };

    updateLoading(95, 'Finalizing...');

    // Restore street lights to day/night system
    cityBuilder.streetLights.forEach(l => dayNight.addStreetLight(l));

    // Update dynamic city progression props based on current unlocked plots
    if (cityBuilder.updateProgression) {
      cityBuilder.updateProgression(gameState.unlockedPlots);
    }

    // UI event listeners
    setupUI();

    // Android/back button handling
    setupAndroidHandlers();

    // Handle offline earnings
    handleOfflineEarnings();

    // Auto-unlock next business if criteria met
    checkBusinessUnlocks();

    updateLoading(100);

    // Hide loading screen
    setTimeout(() => {
      document.getElementById('loadingScreen').classList.add('hidden');
    }, 500);

    updateHUD();
    isRunning = true;
    gameLoop();
  }

  function rebuildSavedBuildings() {
    for (const bid in gameState.buildings) {
      for (const b of gameState.buildings[bid]) {
        if (b.state === 'built' || b.state === 'upgrading') {
          b.state = 'built';
          const group = buildingSystem.createBuilding(bid, b.plotIndex);
          if (group) {
            buildingSystem.animateScale(group, 0.01, 1.0, 300);
            buildingSystem.upgradeBuildingVisual(bid, b.plotIndex, b.level);
          }
        }
      }
    }
    buildingSystem.updatePlotMarker(0);
    economy.recalcIncome(gameState.buildings);
  }

  function handleOfflineEarnings() {
    const result = saveSystem.calcOfflineEarnings(gameState);
    if (result.total > 0) {
      gameState.totalOfflineEarned += result.total;
      economy.addCash(result.total, 'offline');
      showWelcomeBack(result);
    }
  }

  function showWelcomeBack(result) {
    const popup = document.getElementById('welcomeBackPopup');
    const earningsList = document.getElementById('welcomeBackEarnings');
    const totalEl = document.getElementById('welcomeBackTotal');
    const timeEl = document.getElementById('welcomeBackTime');

    earningsList.innerHTML = '';
    let total = 0;
    for (const bid in result.earnings) {
      const cfg = getBusinessConfig(bid);
      if (!cfg) continue;
      const row = document.createElement('div');
      row.className = 'earnings-row';
      row.innerHTML = `<span class="biz-name">${cfg.emoji} ${cfg.name}</span><span class="biz-amount">+${economy.formatCash(result.earnings[bid])}</span>`;
      earningsList.appendChild(row);
      total += result.earnings[bid];
    }

    const hrs = Math.floor(result.seconds / 3600);
    const mins = Math.floor((result.seconds % 3600) / 60);
    timeEl.textContent = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

    totalEl.textContent = economy.formatCash(total);
    popup.classList.add('active');
  }

  // ─── Game Loop ───
  function gameLoop() {
    if (!isRunning) return;
    rafId = requestAnimationFrame(gameLoop);

    const dt = Math.min(clock.getDelta(), 0.1);

    // Income tick
    incomeTimer += dt;
    if (incomeTimer >= 1.0) {
      incomeTimer = 0;
      const income = economy.incomePerSecond;
      if (income > 0) {
        economy.addCash(income, 'passive');
        gameState.totalEarned += income;
      }
    }

    // Auto-save
    saveTimer += dt;
    if (saveTimer >= autoSaveInterval) {
      saveTimer = 0;
      performSave();
    }

    // Update systems
    if (buildingSystem && buildingSystem.update) buildingSystem.update(dt);
    if (dayNight) dayNight.update(dt);
    if (npcSystem) npcSystem.update(dt);
    if (trafficSystem) trafficSystem.update(dt);
    if (particles) particles.update(dt);
    if (cameraCtrl) cameraCtrl.update();
    if (missionSystem) {
      const completed = missionSystem.update();
      if (completed.length > 0) updateMissionsPanel();
    }
    if (progressionSystem) {
      const achs = progressionSystem.checkAchievements();
      if (achs.length > 0) {
        playSound('reward');
        showToast(`Achievement Unlocked: ${achs[0].title}! +₹${achs[0].reward}`);
      }
      const objs = progressionSystem.checkObjectives();
      if (objs.length > 0) {
        playSound('reward');
        showToast(`Daily Task Complete: ${objs[0].title}! +₹${objs[0].rewardCash}`);
      }
    }

    // FPS
    fpsFrames++;
    fpsTime += dt;
    if (fpsTime >= 1) {
      document.getElementById('fpsCounter').textContent = `${fpsFrames} FPS`;
      fpsFrames = 0;
      fpsTime = 0;
    }

    renderer.render(scene, camera);
  }

  // ─── Save/Load ───
  function performSave() {
    saveSystem.save(gameState);
  }

  function loadGameState(saved) {
    gameState.cash = saved.state.cash;
    gameState.totalEarned = saved.state.totalEarned || 0;
    gameState.totalSpent = saved.state.totalSpent || 0;
    gameState.totalOfflineEarned = saved.state.totalOfflineEarned || 0;
    gameState.buildings = saveSystem.deserializeBuildings(saved.state.buildings);
    gameState.unlockedPlots = saved.state.unlockedPlots;
    gameState.unlockedBusinesses = saved.state.unlockedBusinesses;
    gameState.playerLevel = saved.state.playerLevel;
    gameState.playerXP = saved.state.playerXP;
    gameState.completedMissions = saved.state.completedMissions || [];
    gameState.activeMissions = saved.state.activeMissions || [0, 1];
    gameState.dailyRewardDay = saved.state.dailyRewardDay || 0;
    gameState.lastDailyReward = saved.state.lastDailyReward || 0;
    gameState.decorations = saved.state.decorations || [];
    gameState.settings = saved.state.settings || { sfx: true, music: true };
    const defaultCosts = (typeof PLOT_UNLOCK_COSTS !== 'undefined')
      ? PLOT_UNLOCK_COSTS
      : [0, 2000, 8000, 25000, 60000, 120000, 250000, 500000, 1000000, 2000000, 4000000, 7500000, 12000000, 20000000, 35000000];
    gameState.plotUnlockCosts = (saved.state.plotUnlockCosts && saved.state.plotUnlockCosts.length === 15)
      ? saved.state.plotUnlockCosts
      : defaultCosts;
    gameState.tapBonusCount = saved.state.tapBonusCount || 0;
    gameState.customerSalesCount = saved.state.customerSalesCount || 0;
    // Deep gameplay fields
    gameState.specializations = saved.state.specializations || {};
    gameState.employeeRoles = saved.state.employeeRoles || {};
    gameState.businessDemand = saved.state.businessDemand || {};
    gameState.achievementsUnlocked = saved.state.achievementsUnlocked || [];
    gameState.dailyObjectives = saved.state.dailyObjectives || [];
    gameState.objectivesCompletedToday = saved.state.objectivesCompletedToday || [];
    gameState.lastObjectiveRefresh = saved.state.lastObjectiveRefresh || 0;

    economy.deserialize({
      cash: gameState.cash,
      totalEarned: gameState.totalEarned,
      totalSpent: gameState.totalSpent,
      totalOfflineEarned: gameState.totalOfflineEarned,
      incomePerSecond: 0
    });
  }

  // ─── UI ───
  function setupUI() {
    // Bottom nav
    document.getElementById('navBuild').addEventListener('click', () => showPanel('buildPanel'));
    document.getElementById('navBusinesses').addEventListener('click', () => showPanel('businessesPanel'));
    document.getElementById('navUpgrade').addEventListener('click', () => showPanel('upgradePanel'));
    document.getElementById('navCity').addEventListener('click', () => showPanel('cityPanel'));
    document.getElementById('navMissions').addEventListener('click', () => showPanel('missionsPanel'));

    // Panel close buttons
    document.querySelectorAll('.panel-close').forEach(btn => {
      btn.addEventListener('click', () => hideAllPanels());
    });

    // Welcome back collect
    document.getElementById('collectOfflineBtn').addEventListener('click', () => {
      document.getElementById('welcomeBackPopup').classList.remove('active');
    });

    // Daily reward
    document.getElementById('claimDailyBtn').addEventListener('click', claimDailyReward);

    // Canvas click for building selection (use click only, prevent double-fire)
    renderer.domElement.addEventListener('click', onCanvasClick);
  }

  function showPanel(id) {
    hideAllPanels();
    const panel = document.getElementById(id);
    if (panel) {
      panel.classList.add('active');
      currentPanel = id;

      if (id === 'buildPanel') populateBuildMenu();
      if (id === 'businessesPanel') populateBusinessesList();
      if (id === 'upgradePanel') populateUpgradePanel();
      if (id === 'missionsPanel') updateMissionsPanel();
      if (id === 'cityPanel') populateCityPanel();
    }
  }

  function hideAllPanels() {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    currentPanel = null;
    selectedPlotIdx = null;
    if (buildingSystem && buildingSystem.clearSelection) buildingSystem.clearSelection();
  }

  function onCanvasClick(e) {
    if (cameraCtrl && cameraCtrl.hasDragged) return;

    const rect = renderer.domElement.getBoundingClientRect();
    const clientX = e.clientX !== undefined ? e.clientX : (e.changedTouches?.[0]?.clientX || 0);
    const clientY = e.clientY !== undefined ? e.clientY : (e.changedTouches?.[0]?.clientY || 0);
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    // Collect candidate targets (plots and building meshes; moving traffic/NPCs are never included)
    const targets = [...(buildingSystem.plotMeshes || [])];
    if (buildingSystem.buildingMeshes) {
      for (const k in buildingSystem.buildingMeshes) {
        const entry = buildingSystem.buildingMeshes[k];
        if (entry && entry.group) {
          entry.group.traverse(child => {
            if (child.isMesh && child.userData?.isBuildingPart) {
              targets.push(child);
            }
          });
        }
      }
    }

    const intersects = raycaster.intersectObjects(targets, false);

    if (intersects.length > 0) {
      for (const hit of intersects) {
        const data = hit.object.userData;
        // Hit discrimination: ignore traffic and NPCs if somehow intersected
        if (data && (data.isVehicle || data.type === 'customer' || data.type === 'pedestrian')) continue;
        if (data && typeof data.plotIndex === 'number') {
          handlePlotClick(data.plotIndex);
          break;
        }
      }
    }
  }

  function handlePlotClick(plotIndex) {
    playSound('click');
    if (buildingSystem && buildingSystem.selectPlot) buildingSystem.selectPlot(plotIndex);
    selectedPlotIdx = plotIndex;

    // Active tap bonus for built businesses
    const existing = buildingSystem.getBuildingAtPlot(plotIndex);
    if (existing && existing.state === 'built') {
      const tap = buildingSystem.tapBuilding(plotIndex);
      if (tap.success) {
        gameState.tapBonusCount = (gameState.tapBonusCount || 0) + 1;
        playSound('cash');
        if (particles && particles.spawnCashParticle) {
          particles.spawnCashParticle(tap.bonus, buildingSystem.plotPositions[plotIndex]);
        }
        updateHUD();
      }
    }

    const result = buildingSystem.onPlotClicked(plotIndex);

    if (result.action === 'unlocked') {
      showToast(`Plot ${plotIndex + 1} unlocked!`);
      playSound('unlock');
      if (buildingSystem.highlightNewPlot) buildingSystem.highlightNewPlot(plotIndex);
      if (particles && particles.spawnFloatingText) {
        particles.spawnFloatingText('PLOT UNLOCKED! 🔓', buildingSystem.plotPositions[plotIndex], '#FFD700');
      }
      particles.spawnBuildEffect(buildingSystem.plotPositions[plotIndex]);
      if (cityBuilder && cityBuilder.updateProgression) {
        cityBuilder.updateProgression(gameState.unlockedPlots);
      }
      updateHUD();
      performSave();
    } else if (result.action === 'locked') {
      if (result.sequential === false) {
        showToast(`Unlock Plot ${gameState.unlockedPlots + 1} first! (${economy.formatCash(result.cost)})`, 2500);
      } else {
        showToast(`Unlock cost: ${economy.formatCash(result.cost)}`, 2000);
      }
    } else if (result.action === 'build_menu') {
      showPanel('buildPanel');
    } else if (result.action === 'select_building') {
      selectedBusiness = result.businessId;
      showBuildingInfo(result.businessId, plotIndex);
    }
  }

  // ─── Build Menu ───
  function populateBuildMenu() {
    const grid = document.getElementById('buildGrid');
    grid.innerHTML = '';

    const available = buildingSystem.getAvailableBusinesses();
    for (const bid of available) {
      const cfg = getBusinessConfig(bid);
      if (!cfg) continue;
      const cost = getBuildCost(bid);
      const canAfford = economy.canAfford(cost);

      const item = document.createElement('div');
      item.className = 'build-item' + (canAfford ? '' : ' locked');
      item.innerHTML = `
        <div class="emoji">${cfg.emoji}</div>
        <div class="name">${cfg.name}</div>
        <div class="desc">${cfg.description}</div>
        <div class="cost">${economy.formatCash(cost)}</div>
      `;
      item.addEventListener('click', () => {
        if (selectedPlotIdx === null) {
          showToast('Tap a plot first!');
          return;
        }
        if (buildingSystem.build(bid, selectedPlotIdx)) {
          playSound('build');
          particles.spawnBuildEffect(buildingSystem.plotPositions[selectedPlotIdx]);
          hideAllPanels();
          updateHUD();
          showToast(`${cfg.name} under construction...`);
        } else {
          playSound('error');
          showToast('Not enough cash!');
        }
      });
      grid.appendChild(item);
    }
  }

  // ─── Building Info ───
  function showBuildingInfo(businessId, plotIndex) {
    const cfg = getBusinessConfig(businessId);
    if (!cfg) return;
    const buildings = gameState.buildings[businessId];
    const b = buildings?.find(x => x.plotIndex === plotIndex);
    if (!b) return;

    const income = getIncomeForLevel(businessId, b.level, b.employees);
    const nextUpgrade = getUpgradeCost(businessId, b.level);
    const nextEmpCost = cfg.employeeCost * (b.employees + 1);
    const maxed = b.level >= cfg.maxLevel;
    const maxEmp = b.employees >= cfg.maxEmployees;

    const empCapacity = progressionSystem ? progressionSystem.getServiceCapacity(businessId, plotIndex) : cfg.customerCapacity;
    const demandVal = progressionSystem ? progressionSystem.getDemand(businessId) : 50;

    document.getElementById('infoEmoji').textContent = cfg.emoji;
    document.getElementById('infoName').textContent = cfg.name;
    document.getElementById('infoLevel').textContent = `Level ${b.level}${maxed ? ' (MAX)' : ''}`;
    document.getElementById('infoIncome').textContent = economy.formatCash(income) + '/sec';
    document.getElementById('infoCustomers').textContent = `${Math.min(b.employees + 1, empCapacity)}/${empCapacity}`;

    const custPct = Math.min(100, ((b.employees + 1) / empCapacity) * 100);
    document.getElementById('custProgress').style.width = custPct + '%';

    const demandEl = document.getElementById('infoDemand');
    if (demandEl) {
      demandEl.textContent = `${demandVal}/100`;
      demandEl.style.color = demandVal >= 60 ? '#4CAF50' : (demandVal >= 40 ? '#FFEB3B' : '#FF9800');
    }

    const popVal = progressionSystem ? progressionSystem.getPopularity(businessId) : 50;
    const popEl = document.getElementById('infoPopularity');
    if (popEl) {
      popEl.textContent = `${popVal}/100`;
      popEl.style.color = popVal >= 60 ? '#4CAF50' : (popVal >= 40 ? '#FFEB3B' : '#FF9800');
    }

    // Specializations UI
    const specContainer = document.getElementById('infoSpecOptions');
    const currentSpecEl = document.getElementById('infoCurrentSpec');
    if (specContainer && progressionSystem) {
      specContainer.innerHTML = '';
      const currentSpecId = progressionSystem.getSpecialization(businessId, plotIndex);
      const options = progressionSystem.getSpecializationOptions(businessId);
      const activeSpec = options.find(s => s.id === currentSpecId);
      currentSpecEl.textContent = activeSpec ? `${activeSpec.name} (${activeSpec.desc})` : (b.level < 5 ? 'Unlocks at Level 5' : 'None Selected');

      if (b.level >= 5) {
        options.forEach(opt => {
          const btn = document.createElement('button');
          btn.className = 'action-btn ' + (opt.id === currentSpecId ? 'primary' : 'secondary');
          btn.style.cssText = 'width:auto;flex:1;min-width:75px;padding:4px 6px;font-size:0.75em;margin:2px;';
          btn.textContent = opt.name;
          btn.onclick = () => {
            const res = progressionSystem.setSpecialization(businessId, plotIndex, opt.id);
            if (res.success) {
              playSound('upgrade');
              showToast(`Specialization chosen: ${opt.name}!`);
              showBuildingInfo(businessId, plotIndex);
              updateHUD();
            } else if (res.reason === 'cooldown') {
              showToast(`Switch cooldown: wait ${res.waitSec}s`);
            }
          };
          specContainer.appendChild(btn);
        });
      }
    }

    // Employee Role UI
    const roleContainer = document.getElementById('infoRoleOptions');
    const currentRoleEl = document.getElementById('infoCurrentRole');
    if (roleContainer && progressionSystem) {
      roleContainer.innerHTML = '';
      const currentRole = progressionSystem.getEmployeeRole(businessId, plotIndex);
      currentRoleEl.textContent = currentRole ? `${currentRole.name} (${currentRole.desc})` : (b.employees < 1 ? 'Hire a worker first' : 'None Assigned');

      if (b.employees >= 1) {
        const availableRoles = progressionSystem.getAvailableRolesForBusiness(businessId);
        availableRoles.forEach(r => {
          const btn = document.createElement('button');
          btn.className = 'action-btn ' + (currentRole?.id === r.id ? 'primary' : 'secondary');
          btn.style.cssText = 'width:auto;flex:1;min-width:70px;padding:4px 6px;font-size:0.75em;margin:2px;';
          btn.textContent = r.name;
          btn.onclick = () => {
            const res = progressionSystem.assignEmployeeRole(businessId, plotIndex, r.id);
            if (res.success) {
              playSound('upgrade');
              showToast(`Worker role assigned: ${r.name}!`);
              showBuildingInfo(businessId, plotIndex);
              updateHUD();
            }
          };
          roleContainer.appendChild(btn);
        });
      }
    }

    const upgradeBtn = document.getElementById('infoUpgradeBtn');
    if (maxed) {
      upgradeBtn.textContent = 'MAX LEVEL';
      upgradeBtn.disabled = true;
    } else {
      upgradeBtn.textContent = `Upgrade - ${economy.formatCash(nextUpgrade)}`;
      upgradeBtn.disabled = !economy.canAfford(nextUpgrade);
    }

    const empBtn = document.getElementById('infoEmployeeBtn');
    if (maxEmp) {
      empBtn.textContent = `Employees: ${b.employees}/${cfg.maxEmployees} (MAX)`;
      empBtn.disabled = true;
    } else {
      empBtn.textContent = `Hire Worker - ${economy.formatCash(nextEmpCost)}`;
      empBtn.disabled = !economy.canAfford(nextEmpCost);
    }

    // Store for button handlers
    document.getElementById('infoUpgradeBtn').onclick = () => {
      if (buildingSystem.upgrade(businessId, plotIndex)) {
        playSound('upgrade');
        particles.spawnFloatingText('UPGRADED!', buildingSystem.plotPositions[plotIndex], 0xFFD700);
        showBuildingInfo(businessId, plotIndex);
        updateHUD();
      } else {
        playSound('error');
      }
    };

    document.getElementById('infoEmployeeBtn').onclick = () => {
      if (buildingSystem.hireEmployee(businessId, plotIndex)) {
        playSound('cash');
        showToast('Worker hired!');
        showBuildingInfo(businessId, plotIndex);
        updateHUD();
      } else {
        playSound('error');
      }
    };

    showPanel('buildingInfoPanel');
  }

  // ─── Businesses List ───
  function populateBusinessesList() {
    const list = document.getElementById('businessesList');
    list.innerHTML = '';

    const allBiz = gameState.unlockedBusinesses;
    for (const bid of allBiz) {
      const cfg = getBusinessConfig(bid);
      const owned = gameState.buildings[bid]?.length || 0;
      const totalIncome = gameState.buildings[bid]?.reduce((sum, b) => {
        return sum + getIncomeForLevel(bid, b.level, b.employees);
      }, 0) || 0;

      const item = document.createElement('div');
      item.className = 'mission-item';
      item.innerHTML = `
        <div class="mission-emoji">${cfg.emoji}</div>
        <div class="mission-info">
          <div class="mission-title">${cfg.name}</div>
          <div class="mission-desc">Owned: ${owned} | Income: ${economy.formatCash(totalIncome)}/sec</div>
        </div>
      `;
      list.appendChild(item);
    }
  }

  // ─── Upgrade Panel ───
  function populateUpgradePanel() {
    const list = document.getElementById('upgradeList');
    list.innerHTML = '';

    for (const bid in gameState.buildings) {
      const cfg = getBusinessConfig(bid);
      for (const b of gameState.buildings[bid]) {
        const income = getIncomeForLevel(bid, b.level, b.employees);
        const nextCost = getUpgradeCost(bid, b.level);
        const item = document.createElement('div');
        item.className = 'mission-item';
        item.innerHTML = `
          <div class="mission-emoji">${cfg.emoji}</div>
          <div class="mission-info">
            <div class="mission-title">${cfg.name} - Plot ${b.plotIndex + 1}</div>
            <div class="mission-desc">Lv.${b.level} → ${economy.formatCash(income)}/sec | Workers: ${b.employees}/${cfg.maxEmployees}</div>
            ${b.level >= cfg.maxLevel ? `<div style="color:#aaa;font-size:0.8em;margin-top:2px;">Max Level Reached</div>` : `<div style="color:#FFD700;font-size:0.8em;margin-top:2px;">Next: ${economy.formatCash(nextCost)}</div>`}
          </div>
        `;
        item.addEventListener('click', () => showBuildingInfo(bid, b.plotIndex));
        list.appendChild(item);
      }
    }

    if (list.children.length === 0) {
      list.innerHTML = '<div style="text-align:center;color:#666;padding:20px;">No buildings yet. Start building!</div>';
    }
  }

  // ─── City Panel ───
  function populateCityPanel() {
    const nextUnlock = gameState.unlockedPlots < 15;
    const cost = gameState.plotUnlockCosts[gameState.unlockedPlots];
    const cityInfo = document.getElementById('cityInfo');

    let html = `
      <div class="building-info">
        <div class="building-header">
          <div class="emoji">🏙️</div>
          <div class="name">Indian Idle City</div>
          <div class="level">Plots Unlocked: ${gameState.unlockedPlots}/15</div>
        </div>
        <div class="stat-row"><span class="stat-label">Player Level</span><span class="stat-value">${gameState.playerLevel}</span></div>
        <div class="stat-row"><span class="stat-label">Total Buildings</span><span class="stat-value">${gameState.totalBuildings}</span></div>
        <div class="stat-row"><span class="stat-label">Total Earned</span><span class="stat-value">${economy.formatCash(gameState.totalEarned)}</span></div>
        <div class="stat-row"><span class="stat-label">Income/sec</span><span class="stat-value">${economy.formatCash(economy.incomePerSecond)}</span></div>
    `;

    // Active City Zones Section
    if (typeof CITY_ZONES !== 'undefined') {
      html += `
        <div style="margin-top:14px;border-top:1px solid rgba(255,255,255,0.1);padding-top:10px;">
          <div style="font-weight:bold;color:#FFD700;font-size:0.9em;margin-bottom:6px;">🏙️ City Zones</div>
      `;
      CITY_ZONES.forEach(z => {
        const unlockedCount = z.plots.filter(p => p < gameState.unlockedPlots).length;
        const isUnlocked = unlockedCount === z.plots.length;
        html += `
          <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:0.8em;color:${isUnlocked ? '#4CAF50' : '#888'};">
            <span>${z.name} (${unlockedCount}/${z.plots.length})</span>
            <span>${z.desc}</span>
          </div>
        `;
      });
      html += `</div>`;
    }

    // Active Business Synergies Section
    if (progressionSystem) {
      const activeSyn = progressionSystem.getActiveSynergies();
      html += `
        <div style="margin-top:14px;border-top:1px solid rgba(255,255,255,0.1);padding-top:10px;">
          <div style="font-weight:bold;color:#FFD700;font-size:0.9em;margin-bottom:6px;">✨ Business Synergies (${activeSyn.length}/${typeof SYNERGIES !== 'undefined' ? SYNERGIES.length : 0})</div>
      `;
      if (activeSyn.length === 0) {
        html += `<div style="font-size:0.75em;color:#888;">Build complementary shops (e.g. Chai + Dhaba) to unlock synergy bonuses!</div>`;
      } else {
        activeSyn.forEach(syn => {
          html += `
            <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:0.8em;color:#A5D6A7;">
              <span>${syn.name}</span>
              <span>${syn.bonusDesc}</span>
            </div>
          `;
        });
      }
      html += `</div>`;
    }

    if (nextUnlock && cost) {
      html += `
        <div style="margin-top:16px;" class="unlock-banner">
          🔓 Unlock Plot ${gameState.unlockedPlots + 1} - ${economy.formatCash(cost)}
        </div>
      `;
    }

    html += `</div>`;
    cityInfo.innerHTML = html;
  }

  // ─── Missions Panel ───
  function updateMissionsPanel() {
    const list = document.getElementById('missionsList');
    if (!list) return;
    list.innerHTML = '';

    const active = missionSystem.getActiveMissions();
    if (active.length === 0) {
      list.innerHTML = '<div style="text-align:center;color:#666;padding:20px;">All missions complete! Keep building!</div>';
      return;
    }

    for (const m of active) {
      const progress = missionSystem.getProgress(m.index);
      const currentVal = Math.floor(progress * m.target);
      const item = document.createElement('div');
      item.className = 'mission-item';
      item.innerHTML = `
        <div class="mission-emoji">🎯</div>
        <div class="mission-info">
          <div class="mission-title">${m.title}</div>
          <div class="mission-desc">${m.description}</div>
          <div class="mission-progress">
            <div class="progress-bar"><div class="progress-fill" style="width:${Math.floor(progress * 100)}%"></div></div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
            <span style="color:#FFD700;font-size:0.8em;">Reward: ${m.reward.cash ? '₹' + m.reward.cash.toLocaleString() : 'Special'}</span>
            <span style="color:#A5D6A7;font-size:0.8em;">${currentVal} / ${m.target} (+50 XP)</span>
          </div>
        </div>
      `;
      list.appendChild(item);
    }
  }

  function switchMissionTab(tab) {
    const missionsList = document.getElementById('missionsList');
    const objectivesList = document.getElementById('objectivesList');
    const achievementsList = document.getElementById('achievementsList');

    if (tab === 'missions') {
      if (missionsList) missionsList.style.display = 'block';
      if (objectivesList) objectivesList.style.display = 'none';
      if (achievementsList) achievementsList.style.display = 'none';
      updateMissionsPanel();
    } else if (tab === 'objectives') {
      if (missionsList) missionsList.style.display = 'none';
      if (objectivesList) objectivesList.style.display = 'block';
      if (achievementsList) achievementsList.style.display = 'none';
      updateObjectivesPanel();
    } else if (tab === 'achievements') {
      if (missionsList) missionsList.style.display = 'none';
      if (objectivesList) objectivesList.style.display = 'none';
      if (achievementsList) achievementsList.style.display = 'block';
      updateAchievementsPanel();
    }
  }

  function updateObjectivesPanel() {
    const list = document.getElementById('objectivesList');
    if (!list || !progressionSystem) return;
    list.innerHTML = '';

    progressionSystem.refreshObjectivesIfNeeded();
    const objectives = gameState.dailyObjectives || [];
    if (objectives.length === 0) {
      list.innerHTML = '<div style="text-align:center;color:#666;padding:20px;">All daily tasks completed! Check back tomorrow.</div>';
      return;
    }

    objectives.forEach(obj => {
      const current = progressionSystem.getObjectiveMetric(obj.type);
      const progress = Math.min(obj.target, Math.max(0, current - obj.startVal));
      const pct = Math.floor((progress / obj.target) * 100);
      const item = document.createElement('div');
      item.className = 'mission-item';
      item.innerHTML = `
        <div class="mission-emoji">${obj.completed ? '✅' : '📋'}</div>
        <div class="mission-info">
          <div class="mission-title">${obj.title}</div>
          <div class="mission-desc">${obj.description}</div>
          <div class="mission-progress">
            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
            <span style="color:#FFD700;font-size:0.8em;">Reward: ₹${obj.rewardCash} (+${obj.rewardXP} XP)</span>
            <span style="color:#A5D6A7;font-size:0.8em;">${progress} / ${obj.target}${obj.completed ? ' (DONE)' : ''}</span>
          </div>
        </div>
      `;
      list.appendChild(item);
    });
  }

  function updateAchievementsPanel() {
    const list = document.getElementById('achievementsList');
    if (!list || !progressionSystem) return;
    list.innerHTML = '';

    progressionSystem.checkAchievements();
    const achievements = typeof ACHIEVEMENTS !== 'undefined' ? ACHIEVEMENTS : [];
    achievements.forEach(a => {
      const p = progressionSystem.getAchievementProgress(a.id);
      const pct = Math.floor((p.current / p.target) * 100);
      const item = document.createElement('div');
      item.className = 'mission-item';
      item.innerHTML = `
        <div class="mission-emoji">${p.unlocked ? '🏆' : '🔒'}</div>
        <div class="mission-info">
          <div class="mission-title">${a.title}${p.unlocked ? ' (Unlocked)' : ''}</div>
          <div class="mission-desc">${a.desc}</div>
          <div class="mission-progress">
            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
            <span style="color:#FFD700;font-size:0.8em;">Reward: ₹${a.reward.toLocaleString()}</span>
            <span style="color:#A5D6A7;font-size:0.8em;">${p.current.toLocaleString()} / ${p.target.toLocaleString()}</span>
          </div>
        </div>
      `;
      list.appendChild(item);
    });
  }

  // ─── Daily Reward (7-Day Cycle) ───
  function claimDailyReward() {
    let result;
    if (progressionSystem) {
      result = progressionSystem.claim7DayReward();
    } else {
      result = missionSystem.claimDailyReward();
    }

    if (!result.claimed) {
      if (result.reason === 'clock_rollback') {
        showToast('System clock updated. Try again shortly.');
        return;
      }
      const hrs = Math.ceil((result.remainingMs || 86400000) / 3600000);
      showToast(`Come back in ${hrs}h for Day ${((gameState.dailyRewardDay || 0) % 7) + 1} reward!`);
      return;
    }
    playSound('reward');
    showToast(`Day ${result.day} reward claimed!`);

    const rewardEl = document.getElementById('dailyRewardContent');
    if (result.reward) {
      rewardEl.innerHTML = `
        <div class="reward-emoji">💰</div>
        <div class="reward-amount">${result.reward.cash ? economy.formatCash(result.reward.cash) : ''}${result.reward.xp ? ' +' + result.reward.xp + ' XP' : ''}</div>
        <div class="reward-label">${result.reward.label || 'Daily Bonus'}</div>
      `;
    }
    updateHUD();
  }

  // ─── HUD Update ───
  function updateHUD() {
    document.getElementById('cashDisplay').textContent = economy.formatCash(economy.cash);
    document.getElementById('incomeDisplay').textContent = economy.formatCash(economy.incomePerSecond) + '/sec';
    document.getElementById('levelDisplay').textContent = `Lv.${gameState.playerLevel}`;
  }

  // ─── Android Handlers ───
  function setupAndroidHandlers() {
    // Native back button handled via dispatchBack() bridge
    // This handler is for browser/desktop testing only
    document.addEventListener('backbutton', (e) => {
      e.preventDefault();
      if (currentPanel) {
        hideAllPanels();
      } else {
        showToast('Press back again to exit');
      }
    });

    // Save on pause/resume (browser fallback)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) performSave();
    });

    // Resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Keyboard shortcut
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') hideAllPanels();
    });
  }

  // ─── Unlocks ───
  function checkBusinessUnlocks() {
    if (gameState.totalBuildings >= 2 && !gameState.unlockedBusinesses.includes('kirana_store')) {
      gameState.unlockedBusinesses.push('kirana_store');
      showToast('New business unlocked: Kirana Store! 🛒');
    }
    if (gameState.totalBuildings >= 4 && !gameState.unlockedBusinesses.includes('dhaba')) {
      gameState.unlockedBusinesses.push('dhaba');
      showToast('New business unlocked: Dhaba! 🍛');
    }
    if (gameState.playerLevel >= 3 && !gameState.unlockedBusinesses.includes('salon')) {
      gameState.unlockedBusinesses.push('salon');
      showToast('New business unlocked: Salon! 💇');
    }
    if (gameState.playerLevel >= 5 && !gameState.unlockedBusinesses.includes('mobile_shop')) {
      gameState.unlockedBusinesses.push('mobile_shop');
      showToast('New business unlocked: Mobile Shop! 📱');
    }
  }

  // ─── Utilities ───
  function showToast(msg, duration = 2000) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  }

  function playSound(name) {
    if (!audio) return;
    if (name === 'click') audio.playClick();
    else if (name === 'build') audio.playBuild();
    else if (name === 'upgrade') audio.playUpgrade();
    else if (name === 'cash') audio.playCash();
    else if (name === 'collect') audio.playCollect();
    else if (name === 'error') audio.playError();
    else if (name === 'reward') audio.playReward();
    else if (name === 'unlock') {
      if (audio.playUnlock) audio.playUnlock();
      else audio.playUpgrade();
    } else if (name === 'customerSale') {
      if (audio.playCustomerSale) audio.playCustomerSale();
      else audio.playCash();
    } else if (name === 'levelUp') {
      if (audio.playLevelUp) audio.playLevelUp();
      else audio.playReward();
    }
  }

  function updateLoading(pct, text) {
    const fill = document.getElementById('loadingFill');
    const txt = document.getElementById('loadingText');
    if (fill) fill.style.width = pct + '%';
    if (txt) txt.textContent = text || '';
  }

  // ─── Android bridge ───
  window.dispatchPause = function() {
    if (saveSystem) performSave();
  };
  window.dispatchResume = function() {
    if (saveSystem) handleOfflineEarnings();
    if (economy) updateHUD();
  };
  window.dispatchBack = function() {
    if (currentPanel) {
      hideAllPanels();
    } else {
      showToast('Press back again to exit');
      setTimeout(() => {
        if (!currentPanel) {
          performSave();
        }
      }, 2000);
    }
  };

  // ─── Boot ───
  function boot() {
    // Preload
    updateLoading(5, 'Loading game...');
    setTimeout(() => init().catch(e => {
      console.error('Init failed:', e);
      updateLoading(100, 'Error loading game. Please refresh.');
    }), 100);
  }

  // Expose for HTML onclick handlers
  return {
    boot,
    showPanel,
    hideAllPanels,
    performSave,
    claimDailyReward,
    switchMissionTab,
    playSound,
    checkBusinessUnlocks
  };
})();

if (typeof window !== 'undefined') window.Game = Game;
if (typeof globalThis !== 'undefined') globalThis.Game = Game;
