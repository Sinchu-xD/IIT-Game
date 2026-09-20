// Economy system - Central authority for all currency modifications
// Uses safe floating-point math, no int overflow
class EconomyManager {
  constructor() {
    this.cash = 0;
    this.totalEarned = 0;
    this.totalSpent = 0;
    this.totalOfflineEarned = 0;
    this.incomePerSecond = 0;
    this.listeners = [];
  }

  onChange(cb) { this.listeners.push(cb); }
  notify() { this.listeners.forEach(cb => cb(this.cash, this.incomePerSecond)); }

  addCash(amount, source = 'unknown') {
    const safeAmount = Math.max(0, Number(amount) || 0);
    if (safeAmount <= 0) return 0;
    this.cash += safeAmount;
    this.totalEarned += safeAmount;
    this.notify();
    return safeAmount;
  }

  spendCash(amount) {
    const cost = Math.max(0, Number(amount) || 0);
    if (cost <= 0) return true;
    if (this.cash < cost) return false;
    this.cash -= cost;
    this.totalSpent += cost;
    this.notify();
    return true;
  }

  canAfford(amount) {
    return this.cash >= (Number(amount) || 0);
  }

  formatCash(amount = 0) {
    const n = Math.floor(amount);
    if (n >= 1e12) return '₹' + (n / 1e12).toFixed(2) + 'T';
    if (n >= 1e9) return '₹' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '₹' + (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return '₹' + (n / 1e3).toFixed(1) + 'K';
    return '₹' + n.toLocaleString('en-IN');
  }

  setProgressionSystem(progression) {
    this.progression = progression;
  }

  recalcIncome(buildings) {
    let total = 0;
    for (const bid in buildings) {
      for (const b of buildings[bid]) {
        if (b.state === 'built' || b.state === 'upgrading') {
          let income = getIncomeForLevel(bid, b.level, b.employees);

          // Deep Gameplay Modifiers (if progression system is attached)
          if (this.progression) {
            const specMult = this.progression.getSpecializationMultiplier(bid, b.plotIndex);
            const demandMult = this.progression.getDemandMultiplier(bid);
            const roleBonus = this.progression.getEmployeeRoleIncomeBonus(bid, b.plotIndex);
            const zoneBonus = this.progression.getZoneIncomeBonus(b.plotIndex);
            const synergyBonus = this.progression.getSynergyIncomeBonus(bid);

            // Controlled formula: base * spec * demand * (1 + roleBonus + zoneBonus + synergyBonus)
            // Additive sum for minor bonuses to prevent runaway exponential multiplication
            const additiveBonuses = Math.min(1.0, roleBonus + zoneBonus + synergyBonus);
            income = Math.floor(income * specMult * demandMult * (1 + additiveBonuses));
          }

          total += income;
        }
      }
    }
    this.incomePerSecond = total;
    this.notify();
  }

  serialize() {
    return {
      cash: this.cash,
      totalEarned: this.totalEarned,
      totalSpent: this.totalSpent,
      totalOfflineEarned: this.totalOfflineEarned,
      incomePerSecond: this.incomePerSecond
    };
  }

  deserialize(data) {
    this.cash = data.cash || 0;
    this.totalEarned = data.totalEarned || 0;
    this.totalSpent = data.totalSpent || 0;
    this.totalOfflineEarned = data.totalOfflineEarned || 0;
    this.incomePerSecond = data.incomePerSecond || 0;
    this.notify();
  }
}
