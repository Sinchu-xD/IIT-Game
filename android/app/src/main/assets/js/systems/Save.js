// Save/Load system with versioned format, corruption recovery, offline earnings
class SaveSystem {
  constructor() {
    this.SAVE_KEY = 'indian_idle_tycoon_save';
    this.SAVE_VERSION = 1;
    this.maxOfflineHours = 24;
  }

  getTimestamp() { return Date.now(); }

  save(gameState) {
    try {
      const saveData = {
        version: this.SAVE_VERSION,
        timestamp: this.getTimestamp(),
        state: {
          cash: gameState.economy.cash,
          totalEarned: gameState.economy.totalEarned,
          totalSpent: gameState.economy.totalSpent,
          totalOfflineEarned: gameState.economy.totalOfflineEarned,
          buildings: this.serializeBuildings(gameState.buildings),
          unlockedPlots: gameState.unlockedPlots,
          unlockedBusinesses: gameState.unlockedBusinesses,
          playerLevel: gameState.playerLevel,
          playerXP: gameState.playerXP,
          completedMissions: gameState.completedMissions,
          activeMissions: gameState.activeMissions,
          dailyRewardDay: gameState.dailyRewardDay,
          lastDailyReward: gameState.lastDailyReward,
          decorations: gameState.decorations,
          settings: gameState.settings,
          plotUnlockCosts: gameState.plotUnlockCosts,
          tapBonusCount: gameState.tapBonusCount || 0,
          customerSalesCount: gameState.customerSalesCount || 0,
          upgradeActionCount: gameState.upgradeActionCount || 0,
          // Version 2 Deep Gameplay fields:
          specializations: gameState.specializations || {},
          employeeRoles: gameState.employeeRoles || {},
          businessDemand: gameState.businessDemand || {},
          businessPopularity: gameState.businessPopularity || {},
          achievementsUnlocked: gameState.achievementsUnlocked || [],
          dailyObjectives: gameState.dailyObjectives || [],
          objectivesCompletedToday: gameState.objectivesCompletedToday || [],
          lastObjectiveRefresh: gameState.lastObjectiveRefresh || 0
        }
      };
      localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
      return true;
    } catch (e) {
      console.warn('Save failed:', e);
      return false;
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(this.SAVE_KEY);
      if (!raw) return null;
      const saveData = JSON.parse(raw);
      if (!saveData.version || !saveData.state) return null;
      return this.migrate(saveData);
    } catch (e) {
      console.warn('Load failed, resetting save:', e);
      localStorage.removeItem(this.SAVE_KEY);
      return null;
    }
  }

  migrate(saveData) {
    let s = saveData.state;
    if (saveData.version < 1) {
      s.unlockedBusinesses = s.unlockedBusinesses || ['chai_stall'];
      s.settings = s.settings || { sfx: true, music: true };
      s.decorations = s.decorations || [];
    }
    if (saveData.version < 2) {
      s.specializations = s.specializations || {};
      s.employeeRoles = s.employeeRoles || {};
      s.businessDemand = s.businessDemand || {};
      s.businessPopularity = s.businessPopularity || {};
      s.upgradeActionCount = s.upgradeActionCount || 0;
      s.achievementsUnlocked = s.achievementsUnlocked || [];
      s.dailyObjectives = s.dailyObjectives || [];
      s.objectivesCompletedToday = s.objectivesCompletedToday || [];
      s.lastObjectiveRefresh = s.lastObjectiveRefresh || 0;
    }
    return { timestamp: saveData.timestamp, state: s };
  }

  serializeBuildings(buildings) {
    const out = {};
    for (const bid in buildings) {
      out[bid] = buildings[bid].map(b => ({
        plotIndex: b.plotIndex,
        level: b.level,
        employees: b.employees,
        state: b.state,
        incomeAccum: b.incomeAccum || 0
      }));
    }
    return out;
  }

  deserializeBuildings(data) {
    const out = {};
    for (const bid in data) {
      out[bid] = data[bid].map(b => ({
        plotIndex: b.plotIndex,
        level: b.level || 1,
        employees: b.employees || 0,
        state: b.state || 'built',
        incomeAccum: b.incomeAccum || 0
      }));
    }
    return out;
  }

  calcOfflineEarnings(gameState) {
    const saved = this.load();
    if (!saved) return { earnings: {}, total: 0, seconds: 0 };
    const now = Date.now();
    // Protect against clock rollback
    if (now < saved.timestamp) {
      return { earnings: {}, total: 0, seconds: 0 };
    }
    const diff = Math.min((now - saved.timestamp) / 1000, this.maxOfflineHours * 3600);
    if (diff < 5) return { earnings: {}, total: 0, seconds: 0 };

    const earnings = {};
    let total = 0;
    for (const bid in gameState.buildings) {
      const cfg = getBusinessConfig(bid);
      if (!cfg) continue;
      let bizTotal = 0;
      const count = gameState.buildings[bid].length;
      for (let i = 0; i < count; i++) {
        const b = gameState.buildings[bid][i];
        if (b.state === 'built' || b.state === 'upgrading') {
          let income = getIncomeForLevel(bid, b.level, b.employees);
          // Incorporate progression modifiers if available on gameState/economy
          if (gameState.progression) {
            const specMult = gameState.progression.getSpecializationMultiplier(bid, b.plotIndex);
            const demandMult = gameState.progression.getDemandMultiplier(bid);
            const roleBonus = gameState.progression.getEmployeeRoleIncomeBonus(bid, b.plotIndex);
            const zoneBonus = gameState.progression.getZoneIncomeBonus(b.plotIndex);
            const synergyBonus = gameState.progression.getSynergyIncomeBonus(bid);
            const additive = Math.min(1.0, roleBonus + zoneBonus + synergyBonus);
            income = Math.floor(income * specMult * demandMult * (1 + additive));
          }
          const earned = income * diff;
          bizTotal += earned;
        }
      }
      if (bizTotal > 0) {
        earnings[bid] = bizTotal;
        total += bizTotal;
      }
    }
    return { earnings, total, seconds: diff };
  }

  getDefaultState() {
    return {
      cash: 100,
      totalEarned: 0,
      totalSpent: 0,
      totalOfflineEarned: 0,
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
      plotUnlockCosts: [0, 2000, 8000, 25000, 60000]
    };
  }

  hasSave() {
    return !!localStorage.getItem(this.SAVE_KEY);
  }

  clearSave() {
    localStorage.removeItem(this.SAVE_KEY);
  }
}
