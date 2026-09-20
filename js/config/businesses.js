// Business configurations - data-driven (mirrors ScriptableObject pattern for Unity port)
export const BUSINESSES = {
  chai_stall: {
    id: 'chai_stall',
    name: 'Chai Stall',
    emoji: '☕',
    baseCost: 50,
    baseIncome: 8,
    incomeInterval: 1.0,
    maxLevel: 30,
    upgradeBaseCost: 40,
    upgradeCostMultiplier: 1.55,
    maxEmployees: 3,
    employeeCost: 25,
    customerCapacity: 3,
    description: 'A cozy tapri serving cutting chai',
    colors: { primary: 0xD2691E, secondary: 0x8B4513, accent: 0xFFD700 },
    visualStages: [
      { level: 1, name: 'Tiny Stall', scale: 0.6 },
      { level: 5, name: 'Small Shop', scale: 0.8 },
      { level: 10, name: 'Popular Tapri', scale: 1.0 },
      { level: 20, name: 'Premium Chai', scale: 1.3 },
      { level: 30, name: 'Chai Empire', scale: 1.6 }
    ]
  },
  kirana_store: {
    id: 'kirana_store',
    name: 'Kirana Store',
    emoji: '🛒',
    baseCost: 150,
    baseIncome: 22,
    incomeInterval: 1.5,
    maxLevel: 30,
    upgradeBaseCost: 120,
    upgradeCostMultiplier: 1.58,
    maxEmployees: 4,
    employeeCost: 40,
    customerCapacity: 5,
    description: 'General store for daily needs',
    colors: { primary: 0x4169E1, secondary: 0x1E90FF, accent: 0xFFFFFF },
    visualStages: [
      { level: 1, name: 'Small Counter', scale: 0.6 },
      { level: 5, name: 'Corner Shop', scale: 0.8 },
      { level: 10, name: 'Full Kirana', scale: 1.0 },
      { level: 20, name: 'Super Kirana', scale: 1.3 },
      { level: 30, name: 'Mega Mart', scale: 1.6 }
    ]
  },
  dhaba: {
    id: 'dhaba',
    name: 'Dhaba',
    emoji: '🍛',
    baseCost: 500,
    baseIncome: 65,
    incomeInterval: 2.0,
    maxLevel: 30,
    upgradeBaseCost: 400,
    upgradeCostMultiplier: 1.60,
    maxEmployees: 5,
    employeeCost: 70,
    customerCapacity: 8,
    description: 'Highway food stop with authentic meals',
    colors: { primary: 0xFF8C00, secondary: 0xFF6347, accent: 0x32CD32 },
    visualStages: [
      { level: 1, name: 'Roadside Dhaba', scale: 0.7 },
      { level: 5, name: 'Famous Stop', scale: 0.9 },
      { level: 10, name: 'Full Restaurant', scale: 1.1 },
      { level: 20, name: 'Dhaba Chain', scale: 1.4 },
      { level: 30, name: 'Cuisine Palace', scale: 1.7 }
    ]
  },
  salon: {
    id: 'salon',
    name: 'Salon',
    emoji: '💇',
    baseCost: 1200,
    baseIncome: 140,
    incomeInterval: 2.5,
    maxLevel: 30,
    upgradeBaseCost: 950,
    upgradeCostMultiplier: 1.62,
    maxEmployees: 4,
    employeeCost: 110,
    customerCapacity: 4,
    description: 'Men\'s salon with grooming services',
    colors: { primary: 0xFF69B4, secondary: 0xFFB6C1, accent: 0xC0C0C0 },
    visualStages: [
      { level: 1, name: 'Chair Shop', scale: 0.6 },
      { level: 5, name: 'Basic Salon', scale: 0.8 },
      { level: 10, name: 'Modern Salon', scale: 1.0 },
      { level: 20, name: 'Unisex Studio', scale: 1.3 },
      { level: 30, name: 'Luxury Spa', scale: 1.6 }
    ]
  },
  mobile_shop: {
    id: 'mobile_shop',
    name: 'Mobile Shop',
    emoji: '📱',
    baseCost: 3000,
    baseIncome: 280,
    incomeInterval: 3.0,
    maxLevel: 30,
    upgradeBaseCost: 2400,
    upgradeCostMultiplier: 1.65,
    maxEmployees: 5,
    employeeCost: 200,
    customerCapacity: 6,
    description: 'Mobile phones, accessories, and repairs',
    colors: { primary: 0x00CED1, secondary: 0x20B2AA, accent: 0xE0FFFF },
    visualStages: [
      { level: 1, name: 'Small Counter', scale: 0.6 },
      { level: 5, name: 'Mobile Point', scale: 0.8 },
      { level: 10, name: 'Full Showroom', scale: 1.0 },
      { level: 20, name: 'Tech Hub', scale: 1.3 },
      { level: 30, name: 'Digital Empire', scale: 1.6 }
    ]
  }
};

export const BUSINESS_ORDER = ['chai_stall', 'kirana_store', 'dhaba', 'salon', 'mobile_shop'];

export function getBusinessConfig(id) {
  return BUSINESSES[id] || null;
}

export function getUpgradeCost(businessId, currentLevel) {
  const cfg = BUSINESSES[businessId];
  if (!cfg || currentLevel >= cfg.maxLevel) return Infinity;
  return Math.floor(cfg.upgradeBaseCost * Math.pow(cfg.upgradeCostMultiplier, currentLevel));
}

export function getIncomeForLevel(businessId, level, employeeCount = 0) {
  const cfg = BUSINESSES[businessId];
  if (!cfg) return 0;
  const base = cfg.baseIncome * Math.pow(1.35, level - 1);
  const empBonus = 1 + (employeeCount * 0.25);
  return Math.floor(base * empBonus);
}

export function getBuildCost(businessId) {
  return BUSINESSES[businessId]?.baseCost || Infinity;
}

export const PLOT_UNLOCK_COSTS = [
  0,        // Plot 0: Starting plot (free)
  2000,     // Plot 1: ₹2,000
  8000,     // Plot 2: ₹8,000
  25000,    // Plot 3: ₹25,000
  60000,    // Plot 4: ₹60,000
  120000,   // Plot 5: ₹120,000
  250000,   // Plot 6: ₹250,000
  500000,   // Plot 7: ₹500,000
  1000000,  // Plot 8: ₹1,000,000
  2000000,  // Plot 9: ₹2,000,000
  4000000,  // Plot 10: ₹4,000,000
  7500000,  // Plot 11: ₹7,500,000
  12000000, // Plot 12: ₹12,000,000
  20000000, // Plot 13: ₹20,000,000
  35000000  // Plot 14: ₹35,000,000
];
