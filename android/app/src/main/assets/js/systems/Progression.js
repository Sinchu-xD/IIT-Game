// Deep Gameplay Progression Manager
// Handles Specializations, Customer Demand, Employee Roles, Zones, Synergies, Achievements, Objectives, and Daily 7-Day Cycle

export class ProgressionSystem {
  constructor(economy, gameState) {
    this.economy = economy;
    this.gs = gameState;
    this.onAchievementUnlocked = null;
    this.onObjectiveCompleted = null;
    this.specializationCooldownMs = 10000; // 10s cooldown between switching to avoid spam

    this.initDefaults();
  }

  initDefaults() {
    if (!this.gs.specializations) this.gs.specializations = {};
    if (!this.gs.employeeRoles) this.gs.employeeRoles = {};
    if (!this.gs.businessDemand) this.gs.businessDemand = {};
    if (!this.gs.businessPopularity) this.gs.businessPopularity = {};
    if (!this.gs.achievementsUnlocked) this.gs.achievementsUnlocked = [];
    if (!this.gs.dailyObjectives) this.gs.dailyObjectives = [];
    if (!this.gs.objectivesCompletedToday) this.gs.objectivesCompletedToday = [];
    if (!this.gs.lastObjectiveRefresh) this.gs.lastObjectiveRefresh = 0;
    if (!this.gs.lastSpecializationSwitch) this.gs.lastSpecializationSwitch = {};

    this.initDemand();
    this.initPopularity();
    this.refreshObjectivesIfNeeded();
  }

  // ─── 1. SPECIALIZATIONS ───
  getSpecializationOptions(businessId) {
    return (typeof SPECIALIZATIONS !== 'undefined' && SPECIALIZATIONS[businessId]) ? SPECIALIZATIONS[businessId] : [];
  }

  getSpecialization(businessId, plotIndex) {
    const key = `${businessId}_${plotIndex}`;
    return this.gs.specializations[key] || null;
  }

  setSpecialization(businessId, plotIndex, specId) {
    const options = this.getSpecializationOptions(businessId);
    const spec = options.find(s => s.id === specId);
    if (!spec) return { success: false, reason: 'invalid_specialization' };

    const building = this.getBuilding(businessId, plotIndex);
    if (!building) return { success: false, reason: 'building_not_found' };
    if (building.level < 5) return { success: false, reason: 'level_too_low' }; // Unlocks at level 5

    const key = `${businessId}_${plotIndex}`;
    const now = Date.now();
    const lastSwitch = this.gs.lastSpecializationSwitch[key] || 0;
    if (now - lastSwitch < this.specializationCooldownMs) {
      const waitSec = Math.ceil((this.specializationCooldownMs - (now - lastSwitch)) / 1000);
      return { success: false, reason: 'cooldown', waitSec };
    }

    this.gs.specializations[key] = specId;
    this.gs.lastSpecializationSwitch[key] = now;
    this.recalcDemand(businessId);
    this.economy.recalcIncome(this.gs.buildings);
    return { success: true, spec };
  }

  getSpecializationMultiplier(businessId, plotIndex) {
    const specId = this.getSpecialization(businessId, plotIndex);
    if (!specId) return 1.0;
    const options = this.getSpecializationOptions(businessId);
    const spec = options.find(s => s.id === specId);
    return spec?.incomeMult || 1.0;
  }

  getSpecializationTapBonus(businessId, plotIndex) {
    const specId = this.getSpecialization(businessId, plotIndex);
    if (!specId) return 1.0;
    const options = this.getSpecializationOptions(businessId);
    const spec = options.find(s => s.id === specId);
    return spec?.tapMod || 1.0;
  }

  // ─── 2. CUSTOMER DEMAND SYSTEM ───
  initDemand() {
    for (const bid of ['chai_stall', 'kirana_store', 'dhaba', 'salon', 'mobile_shop']) {
      if (this.gs.businessDemand[bid] === undefined) {
        this.gs.businessDemand[bid] = 50; // Neutral baseline 50 / 100
      }
    }
  }

  recalcDemand(businessId) {
    // Base 50
    let demand = 50;

    // Highest level of this business type provides up to +20 demand
    const buildings = this.gs.buildings[businessId] || [];
    let maxLevel = 0;
    let employeeCount = 0;
    for (const b of buildings) {
      if (b.level > maxLevel) maxLevel = b.level;
      employeeCount += (b.employees || 0);
    }
    demand += Math.min(20, Math.floor(maxLevel * 0.8));

    // Employee roles provide demand
    for (const b of buildings) {
      const role = this.getEmployeeRole(businessId, b.plotIndex);
      if (role && role.demandBonus) {
        demand += role.demandBonus;
      }
    }

    // Specializations modifier
    for (const b of buildings) {
      const specId = this.getSpecialization(businessId, b.plotIndex);
      if (specId) {
        const spec = this.getSpecializationOptions(businessId).find(s => s.id === specId);
        if (spec && spec.demandMod) demand += spec.demandMod;
      }
    }

    // Zone bonuses
    for (const b of buildings) {
      const zone = this.getZoneForPlot(b.plotIndex);
      if (zone && zone.bonusType === 'demand') {
        demand += zone.bonusValue;
      }
    }

    // Synergies bonus
    const synergies = this.getActiveSynergies();
    for (const syn of synergies) {
      if (syn.target === 'all' || (Array.isArray(syn.target) && syn.target.includes(businessId))) {
        if (syn.demandBonus) demand += syn.demandBonus;
      }
    }

    // Popularity modifier: each 10 points above 50 adds +1 demand, below 50 subtracts 1
    const pop = this.getPopularity(businessId);
    demand += Math.floor((pop - 50) / 10);

    // Clamped strictly between 10 and 100
    this.gs.businessDemand[businessId] = Math.max(10, Math.min(100, demand));
    return this.gs.businessDemand[businessId];
  }

  getDemand(businessId) {
    if (this.gs.businessDemand[businessId] === undefined) {
      this.recalcDemand(businessId);
    }
    return this.gs.businessDemand[businessId];
  }

  getDemandMultiplier(businessId) {
    const demand = this.getDemand(businessId);
    // 50 demand = 1.0x, 10 demand = 0.80x, 100 demand = 1.25x
    return 0.75 + (demand / 100) * 0.50;
  }

  // ─── 2B. POPULARITY SYSTEM ───
  initPopularity() {
    for (const bid of ['chai_stall', 'kirana_store', 'dhaba', 'salon', 'mobile_shop']) {
      if (this.gs.businessPopularity[bid] === undefined) {
        this.gs.businessPopularity[bid] = 50; // Neutral baseline 50 / 100
      }
    }
  }

  getPopularity(businessId) {
    if (this.gs.businessPopularity[businessId] === undefined) {
      this.gs.businessPopularity[businessId] = 50;
    }
    return Math.max(0, Math.min(100, this.gs.businessPopularity[businessId]));
  }

  recordCustomerPurchase(businessId, plotIndex) {
    const cur = this.getPopularity(businessId);
    this.gs.businessPopularity[businessId] = Math.min(100, cur + 2);
    this.recalcDemand(businessId);
    return this.gs.businessPopularity[businessId];
  }

  recalcPopularity(businessId) {
    const pop = this.getPopularity(businessId);
    this.gs.businessPopularity[businessId] = pop;
    return pop;
  }

  getPopularityMultiplier(businessId) {
    const pop = this.getPopularity(businessId);
    // 50 = 1.0x, 0 = 0.9x, 100 = 1.1x
    return 0.90 + (pop / 100) * 0.20;
  }

  // ─── 3. EMPLOYEE ROLES SYSTEM ───
  getAvailableRolesForBusiness(businessId) {
    const roleIds = (typeof BUSINESS_ROLE_PREFERENCES !== 'undefined' && BUSINESS_ROLE_PREFERENCES[businessId])
      ? BUSINESS_ROLE_PREFERENCES[businessId]
      : ['cashier', 'helper'];
    return roleIds.map(rid => EMPLOYEE_ROLES[rid]).filter(Boolean);
  }

  getEmployeeRole(businessId, plotIndex) {
    const key = `${businessId}_${plotIndex}`;
    const roleId = this.gs.employeeRoles[key];
    return (roleId && typeof EMPLOYEE_ROLES !== 'undefined' && EMPLOYEE_ROLES[roleId]) ? EMPLOYEE_ROLES[roleId] : null;
  }

  assignEmployeeRole(businessId, plotIndex, roleId) {
    const available = this.getAvailableRolesForBusiness(businessId);
    const valid = available.find(r => r.id === roleId);
    if (!valid) return { success: false, reason: 'invalid_role_for_business' };

    const building = this.getBuilding(businessId, plotIndex);
    if (!building || building.employees < 1) return { success: false, reason: 'no_employees_to_assign' };

    const key = `${businessId}_${plotIndex}`;
    this.gs.employeeRoles[key] = roleId;
    this.recalcDemand(businessId);
    this.economy.recalcIncome(this.gs.buildings);
    return { success: true, role: valid };
  }

  getEmployeeRoleIncomeBonus(businessId, plotIndex) {
    const role = this.getEmployeeRole(businessId, plotIndex);
    return role?.incomeBonus || 0;
  }

  // ─── 4. CUSTOMER SERVICE CAPACITY ───
  getServiceCapacity(businessId, plotIndex) {
    const cfg = (typeof getBusinessConfig === 'function') ? getBusinessConfig(businessId) : null;
    let cap = cfg?.customerCapacity || 3;

    const building = this.getBuilding(businessId, plotIndex);
    if (building) {
      cap += Math.floor((building.employees || 0) * 0.5);
    }

    const role = this.getEmployeeRole(businessId, plotIndex);
    if (role?.capBonus) cap += role.capBonus;

    const specId = this.getSpecialization(businessId, plotIndex);
    if (specId) {
      const spec = this.getSpecializationOptions(businessId).find(s => s.id === specId);
      if (spec?.capBonus) cap += spec.capBonus;
    }

    const zone = this.getZoneForPlot(plotIndex);
    if (zone && zone.bonusType === 'capacity') {
      cap += zone.bonusValue;
    }

    return Math.min(15, Math.max(1, cap));
  }

  // ─── 5. CITY ZONES ───
  getZoneForPlot(plotIndex) {
    if (typeof CITY_ZONES === 'undefined') return null;
    for (const z of CITY_ZONES) {
      if (z.plots.includes(plotIndex)) return z;
    }
    return null;
  }

  getZoneIncomeBonus(plotIndex) {
    const zone = this.getZoneForPlot(plotIndex);
    return (zone && zone.bonusType === 'income') ? zone.bonusValue : 0;
  }

  getZoneTapBonus(plotIndex) {
    const zone = this.getZoneForPlot(plotIndex);
    return (zone && zone.bonusType === 'tap') ? zone.bonusValue : 0;
  }

  // ─── 6. BUSINESS SYNERGIES ───
  getActiveSynergies() {
    if (typeof SYNERGIES === 'undefined') return [];
    const active = [];
    for (const syn of SYNERGIES) {
      const allBuilt = syn.reqs.every(bid => (this.gs.buildings[bid]?.length || 0) >= 1);
      if (allBuilt) active.push(syn);
    }
    return active;
  }

  getSynergyIncomeBonus(businessId) {
    const active = this.getActiveSynergies();
    let bonus = 0;
    for (const syn of active) {
      if (syn.target === 'all' || (Array.isArray(syn.target) && syn.target.includes(businessId))) {
        bonus += (syn.incomeBonus || 0);
      }
    }
    return Math.min(0.25, bonus); // Max 25% combined synergy cap
  }

  // ─── 7. ACHIEVEMENTS SYSTEM ───
  checkAchievements() {
    if (typeof ACHIEVEMENTS === 'undefined') return [];
    const unlockedNow = [];

    for (const a of ACHIEVEMENTS) {
      if (this.gs.achievementsUnlocked.includes(a.id)) continue;

      let val = 0;
      switch (a.type) {
        case 'build':
          val = this.gs.totalBuildings || 0;
          break;
        case 'earn':
          val = this.gs.totalEarned || 0;
          break;
        case 'hire': {
          let count = 0;
          for (const bid in this.gs.buildings) {
            for (const b of this.gs.buildings[bid]) count += (b.employees || 0);
          }
          val = count;
          break;
        }
        case 'plots':
          val = this.gs.unlockedPlots || 1;
          break;
        case 'level': {
          let maxL = 0;
          for (const bid in this.gs.buildings) {
            for (const b of this.gs.buildings[bid]) if (b.level > maxL) maxL = b.level;
          }
          val = maxL;
          break;
        }
        case 'sale':
          val = this.gs.customerSalesCount || 0;
          break;
        case 'tap':
          val = this.gs.tapBonusCount || 0;
          break;
        case 'missions':
          val = (this.gs.completedMissions || []).length;
          break;
        case 'player_level':
          val = this.gs.playerLevel || 1;
          break;
      }

      if (val >= a.target) {
        this.gs.achievementsUnlocked.push(a.id);
        if (a.reward > 0) {
          this.economy.addCash(a.reward, 'achievement');
        }
        unlockedNow.push(a);
        if (this.onAchievementUnlocked) this.onAchievementUnlocked(a);
      }
    }

    return unlockedNow;
  }

  getAchievementProgress(achievementId) {
    const a = (typeof ACHIEVEMENTS !== 'undefined') ? ACHIEVEMENTS.find(x => x.id === achievementId) : null;
    if (!a) return { current: 0, target: 1, unlocked: false };
    const unlocked = this.gs.achievementsUnlocked.includes(a.id);

    let val = 0;
    switch (a.type) {
      case 'build': val = this.gs.totalBuildings || 0; break;
      case 'earn': val = this.gs.totalEarned || 0; break;
      case 'hire': {
        let count = 0;
        for (const bid in this.gs.buildings) for (const b of this.gs.buildings[bid]) count += (b.employees || 0);
        val = count;
        break;
      }
      case 'plots': val = this.gs.unlockedPlots || 1; break;
      case 'level': {
        let maxL = 0;
        for (const bid in this.gs.buildings) for (const b of this.gs.buildings[bid]) if (b.level > maxL) maxL = b.level;
        val = maxL;
        break;
      }
      case 'sale': val = this.gs.customerSalesCount || 0; break;
      case 'tap': val = this.gs.tapBonusCount || 0; break;
      case 'missions': val = (this.gs.completedMissions || []).length; break;
      case 'player_level': val = this.gs.playerLevel || 1; break;
    }

    return { current: Math.min(val, a.target), target: a.target, unlocked };
  }

  // ─── 8. CITY OBJECTIVES / TASK BOARD ───
  refreshObjectivesIfNeeded() {
    const now = Date.now();
    const dayMs = 24 * 3600 * 1000;
    if (this.gs.dailyObjectives.length === 0 || (now - this.gs.lastObjectiveRefresh > dayMs)) {
      this.generateNewObjectives();
    }
  }

  generateNewObjectives() {
    if (typeof CITY_OBJECTIVE_TEMPLATES === 'undefined') return;
    this.gs.lastObjectiveRefresh = Date.now();
    this.gs.objectivesCompletedToday = [];

    this.gs.dailyObjectives = CITY_OBJECTIVE_TEMPLATES.map((tmpl, idx) => ({
      index: idx,
      id: tmpl.id,
      title: tmpl.title,
      description: tmpl.desc + (tmpl.type === 'earn_delta' ? tmpl.baseAmount.toLocaleString() : tmpl.baseAmount),
      target: tmpl.baseAmount,
      type: tmpl.type,
      startVal: this.getObjectiveMetric(tmpl.type),
      rewardCash: tmpl.rewardCash,
      rewardXP: tmpl.rewardXP,
      completed: false
    }));
  }

  getObjectiveMetric(type) {
    switch (type) {
      case 'earn_delta': return this.gs.totalEarned || 0;
      case 'customers_delta': return this.gs.customerSalesCount || 0;
      case 'taps_delta': return this.gs.tapBonusCount || 0;
      case 'upgrade_action': return this.gs.upgradeActionCount || 0;
      default: return 0;
    }
  }

  checkObjectives() {
    const completedNow = [];
    for (const obj of this.gs.dailyObjectives) {
      if (obj.completed) continue;
      const current = this.getObjectiveMetric(obj.type);
      const progress = current - obj.startVal;
      if (progress >= obj.target) {
        obj.completed = true;
        this.gs.objectivesCompletedToday.push(obj.id);
        if (obj.rewardCash) this.economy.addCash(obj.rewardCash, 'objective');
        if (obj.rewardXP) {
          this.gs.playerXP = (this.gs.playerXP || 0) + obj.rewardXP;
        }
        completedNow.push(obj);
        if (this.onObjectiveCompleted) this.onObjectiveCompleted(obj);
      }
    }
    return completedNow;
  }

  // ─── 9. DAILY 7-DAY CYCLE REWARDS ───
  claim7DayReward() {
    const now = Date.now();
    const last = this.gs.lastDailyReward || 0;
    const dayGap = 24 * 3600 * 1000;

    // Clock rollback safeguard
    if (now < last) {
      this.gs.lastDailyReward = now;
      return { claimed: false, reason: 'clock_rollback' };
    }

    // Once per calendar cycle (minimum 20 hours to be forgiving)
    if (now - last < dayGap * 0.85) {
      return { claimed: false, remainingMs: (last + dayGap) - now };
    }

    const currentDay = ((this.gs.dailyRewardDay || 0) % 7) + 1;
    this.gs.dailyRewardDay = currentDay;
    this.gs.lastDailyReward = now;

    // Deterministic 7-Day reward structure
    // Day 1: Cash 500, Day 2: 50 XP, Day 3: Cash 1500, Day 4: Cash 2000 + 75 XP
    // Day 5: Cash 5000, Day 6: 150 XP, Day 7: Cash 15000 + 250 XP
    let reward = { cash: 0, xp: 0, label: `Day ${currentDay} Reward` };
    switch (currentDay) {
      case 1: reward.cash = 500; break;
      case 2: reward.xp = 50; break;
      case 3: reward.cash = 1500; break;
      case 4: reward.cash = 2000; reward.xp = 75; break;
      case 5: reward.cash = 5000; break;
      case 6: reward.xp = 150; break;
      case 7: reward.cash = 15000; reward.xp = 250; reward.label = 'Weekly Grand Jackpot!'; break;
    }

    if (reward.cash > 0) this.economy.addCash(reward.cash, 'daily_reward');
    if (reward.xp > 0) this.gs.playerXP = (this.gs.playerXP || 0) + reward.xp;

    return { claimed: true, day: currentDay, reward };
  }

  // ─── UTILITY HELPERS ───
  getBuilding(businessId, plotIndex) {
    return this.gs.buildings[businessId]?.find(b => b.plotIndex === plotIndex) || null;
  }
}
