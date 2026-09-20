// Missions system - tracking, completion, rewards
class MissionSystem {
  constructor(economy, gameState) {
    this.economy = economy;
    this.gs = gameState;
    this.missions = MISSIONS;
    this.onMissionComplete = null;
    this.missionPopup = null;
  }

  init() {
    if (!this.gs.activeMissions || this.gs.activeMissions.length === 0) {
      this.gs.activeMissions = [0, 1];
    }
    this.advanceActiveMissions();
  }

  advanceActiveMissions() {
    const maxActive = 3;
    for (let i = 0; i < this.missions.length; i++) {
      if (this.getActiveMissions().length >= maxActive) break;
      if (!this.gs.completedMissions.includes(i) && !this.gs.activeMissions.includes(i)) {
        this.gs.activeMissions.push(i);
      }
    }
  }

  update() {
    const completed = [];
    for (const idx of [...this.gs.activeMissions]) {
      if (this.gs.completedMissions.includes(idx)) continue;
      const mission = this.missions[idx];
      if (mission && mission.check(this.gs)) {
        this.completeMission(idx);
        completed.push(idx);
      }
    }
    return completed;
  }

  completeMission(idx) {
    const mission = this.missions[idx];
    if (!mission || this.gs.completedMissions.includes(idx)) return;

    if (mission.reward.cash) {
      this.economy.addCash(mission.reward.cash, 'mission');
    }

    this.gs.completedMissions.push(idx);
    this.gs.playerXP += 50;
    this.checkLevelUp();
    this.advanceActiveMissions();

    if (this.onMissionComplete) this.onMissionComplete(mission);
  }

  checkLevelUp() {
    const xpNeeded = this.gs.playerLevel * 200;
    while (this.gs.playerXP >= xpNeeded && this.gs.playerLevel < 100) {
      this.gs.playerXP -= this.gs.playerLevel * 200;
      this.gs.playerLevel++;
      this.economy.addCash(this.gs.playerLevel * 500, 'level_up');
    }
  }

  getActiveMissions() {
    return this.gs.activeMissions
      .filter(idx => !this.gs.completedMissions.includes(idx))
      .map(idx => ({ ...this.missions[idx], index: idx }));
  }

  getProgress(idx) {
    const mission = this.missions[idx];
    if (!mission) return 0;
    switch (mission.type) {
      case 'build': return Math.min(1, (this.gs.buildings[mission.target.businessId]?.length || 0) / mission.target.count);
      case 'earn': return Math.min(1, (this.gs.totalEarned || 0) / mission.target.amount);
      case 'build_count': return Math.min(1, this.gs.totalBuildings / mission.target.count);
      case 'upgrade': {
        let maxL = 0;
        for (const bid in this.gs.buildings) for (const b of this.gs.buildings[bid]) if (b.level > maxL) maxL = b.level;
        return Math.min(1, maxL / (mission.target.minLevel || 1));
      }
      case 'hire': {
        let hired = 0;
        for (const bid in this.gs.buildings) for (const b of this.gs.buildings[bid]) hired += b.employees;
        return Math.min(1, hired / mission.target.count);
      }
      case 'offline_earn': return Math.min(1, (this.gs.totalOfflineEarned || 0) / mission.target.amount);
      case 'unlock': {
        if (mission.target.plotIndex !== undefined) {
          return this.gs.unlockedPlots > mission.target.plotIndex ? 1 : 0;
        }
        return Math.min(1, (this.gs.unlockedPlots || 1) / (mission.target.count || 1));
      }
      case 'build_all': {
        const all = BUSINESS_ORDER.every(bid => (this.gs.buildings[bid]?.length || 0) >= 1);
        return all ? 1 : 0;
      }
      case 'player_level': return Math.min(1, (this.gs.playerLevel || 1) / mission.target.level);
      case 'tap_bonus': return Math.min(1, (this.gs.tapBonusCount || 0) / (mission.target.count || 1));
      case 'customer_serve': return Math.min(1, (this.gs.customerSalesCount || 0) / (mission.target.count || 1));
      default: return 0;
    }
  }

  claimDailyReward() {
    const now = Date.now();
    const last = this.gs.lastDailyReward || 0;
    const dayGap = 24 * 3600 * 1000;

    if (now - last < dayGap * 0.9) return { claimed: false, remaining: dayGap - (now - last) };

    const day = (this.gs.dailyRewardDay || 0) + 1;
    if (day > 7) {
      this.gs.dailyRewardDay = 1;
    } else {
      this.gs.dailyRewardDay = day;
    }
    this.gs.lastDailyReward = now;

    const reward = DAILY_REWARDS[(this.gs.dailyRewardDay - 1) % DAILY_REWARDS.length];
    if (reward.reward.cash) this.economy.addCash(reward.reward.cash, 'daily');

    return { claimed: true, reward, day: this.gs.dailyRewardDay };
  }

  getNextDailyReward() {
    const day = ((this.gs.dailyRewardDay || 0) % 7) + 1;
    return { ...DAILY_REWARDS[(day - 1) % DAILY_REWARDS.length], day };
  }
}
