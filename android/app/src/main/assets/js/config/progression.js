// Deep Gameplay Systems: Specializations, Demand, Roles, Zones, Synergies, Achievements, Objectives
// Modular, offline-first, deterministic

export const SPECIALIZATIONS = {
  chai_stall: [
    { id: 'tea_quality', name: 'Tea Quality', desc: '+25% Income multiplier', incomeMult: 1.25, demandMod: 5, tapMod: 1.1 },
    { id: 'fast_service', name: 'Fast Service', desc: '+30% Service speed & +1 Customer capacity', incomeMult: 1.10, speedMult: 1.3, capBonus: 1 },
    { id: 'premium_chai', name: 'Premium Chai', desc: '+40% Tap bonus & +15% Income', incomeMult: 1.15, tapMod: 1.4, demandMod: 10 }
  ],
  kirana_store: [
    { id: 'daily_essentials', name: 'Daily Essentials', desc: '+15 Demand & +10% Income', incomeMult: 1.10, demandMod: 15 },
    { id: 'bulk_grocery', name: 'Bulk Grocery', desc: '+25% Income & +2 Customer capacity', incomeMult: 1.25, capBonus: 2 },
    { id: 'premium_products', name: 'Premium Products', desc: '+35% Income multiplier', incomeMult: 1.35, demandMod: -5 }
  ],
  dhaba: [
    { id: 'fast_meals', name: 'Fast Meals', desc: '+35% Service speed & +10% Income', incomeMult: 1.10, speedMult: 1.35 },
    { id: 'family_dining', name: 'Family Dining', desc: '+3 Customer capacity & +20% Income', incomeMult: 1.20, capBonus: 3, demandMod: 10 },
    { id: 'premium_thali', name: 'Premium Thali', desc: '+30% Income & +25% Tap bonus', incomeMult: 1.30, tapMod: 1.25 }
  ],
  salon: [
    { id: 'quick_cuts', name: 'Quick Cuts', desc: '+40% Service speed', incomeMult: 1.15, speedMult: 1.40 },
    { id: 'premium_styling', name: 'Premium Styling', desc: '+30% Income & +10 Demand', incomeMult: 1.30, demandMod: 10 },
    { id: 'grooming_packages', name: 'Grooming', desc: '+25% Income & +35% Tap bonus', incomeMult: 1.25, tapMod: 1.35 }
  ],
  mobile_shop: [
    { id: 'fast_repair', name: 'Fast Repair', desc: '+30% Service speed & +15% Tap bonus', incomeMult: 1.15, speedMult: 1.30, tapMod: 1.15 },
    { id: 'accessories', name: 'Accessories', desc: '+15 Demand & +2 Customer capacity', incomeMult: 1.10, demandMod: 15, capBonus: 2 },
    { id: 'premium_devices', name: 'Premium Devices', desc: '+35% Income multiplier', incomeMult: 1.35, demandMod: 5 }
  ]
};

export const EMPLOYEE_ROLES = {
  cashier: { id: 'cashier', name: 'Cashier', desc: '+5% Income & fast checkout', incomeBonus: 0.05, speedBonus: 0.1 },
  cook: { id: 'cook', name: 'Cook', desc: '+8% Income & +5 Demand', incomeBonus: 0.08, demandBonus: 5 },
  helper: { id: 'helper', name: 'Helper', desc: '+1 Customer capacity', capBonus: 1, speedBonus: 0.05 },
  salesperson: { id: 'salesperson', name: 'Salesperson', desc: '+10 Demand & +4% Income', demandBonus: 10, incomeBonus: 0.04 },
  stylist: { id: 'stylist', name: 'Stylist', desc: '+7% Income & +10% Tap bonus', incomeBonus: 0.07, tapBonus: 0.10 },
  technician: { id: 'technician', name: 'Technician', desc: '+10% Income', incomeBonus: 0.10 }
};

export const BUSINESS_ROLE_PREFERENCES = {
  chai_stall: ['cook', 'helper'],
  kirana_store: ['cashier', 'salesperson', 'helper'],
  dhaba: ['cook', 'helper', 'cashier'],
  salon: ['stylist', 'helper', 'cashier'],
  mobile_shop: ['technician', 'salesperson', 'cashier']
};

export const CITY_ZONES = [
  { id: 'zone_street', name: 'Small Street', plots: [0, 1, 2, 3, 4], desc: '+5% Tap bonus', bonusType: 'tap', bonusValue: 0.05 },
  { id: 'zone_market', name: 'Market Zone', plots: [5, 6, 7, 8], desc: '+5% Customer demand', bonusType: 'demand', bonusValue: 5 },
  { id: 'zone_neighborhood', name: 'Neighborhood', plots: [9, 10, 11], desc: '+5% Passive income', bonusType: 'income', bonusValue: 0.05 },
  { id: 'zone_city_center', name: 'City Center', plots: [12, 13, 14], desc: '+1 Customer capacity', bonusType: 'capacity', bonusValue: 1 }
];

export const SYNERGIES = [
  { id: 'food_street', name: 'Food Street', reqs: ['chai_stall', 'dhaba'], bonusDesc: '+6% Food income & +5 Demand', incomeBonus: 0.06, demandBonus: 5, target: ['chai_stall', 'dhaba'] },
  { id: 'market_hub', name: 'Market Hub', reqs: ['kirana_store', 'mobile_shop'], bonusDesc: '+5% Retail income', incomeBonus: 0.05, demandBonus: 5, target: ['kirana_store', 'mobile_shop'] },
  { id: 'main_street', name: 'Main Street Commercial', reqs: ['salon', 'mobile_shop'], bonusDesc: '+5% Commercial income & +5% Tap bonus', incomeBonus: 0.05, tapBonus: 0.05, target: ['salon', 'mobile_shop'] },
  { id: 'thriving_bazaar', name: 'Thriving Bazaar', reqs: ['chai_stall', 'kirana_store', 'dhaba', 'salon', 'mobile_shop'], bonusDesc: '+8% All businesses income', incomeBonus: 0.08, target: 'all' }
];

export const ACHIEVEMENTS = [
  { id: 'first_business', title: 'First Business', desc: 'Build your first business', target: 1, type: 'build', reward: 300 },
  { id: 'earn_1k', title: 'First ₹1,000', desc: 'Earn ₹1,000 total', target: 1000, type: 'earn', reward: 500 },
  { id: 'earn_100k', title: '₹100K Milestone', desc: 'Earn ₹100,000 total', target: 100000, type: 'earn', reward: 15000 },
  { id: 'earn_1m', title: 'Crorepati Club', desc: 'Earn ₹1,000,000 total', target: 1000000, type: 'earn', reward: 100000 },
  { id: 'first_employee', title: 'First Hire', desc: 'Hire your first employee', target: 1, type: 'hire', reward: 500 },
  { id: 'hire_5', title: 'Staffing Up', desc: 'Hire 5 employees', target: 5, type: 'hire', reward: 5000 },
  { id: 'hire_12', title: 'Big Team', desc: 'Hire 12 employees', target: 12, type: 'hire', reward: 25000 },
  { id: 'plot_expand_1', title: 'First Expansion', desc: 'Unlock Plot 2', target: 2, type: 'plots', reward: 1000 },
  { id: 'half_city', title: 'Halfway There', desc: 'Unlock 8 plots', target: 8, type: 'plots', reward: 50000 },
  { id: 'full_city', title: 'City Empire', desc: 'Unlock all 15 plots', target: 15, type: 'plots', reward: 250000 },
  { id: 'level_5_biz', title: 'Quality Shop', desc: 'Reach Level 5 with any business', target: 5, type: 'level', reward: 2000 },
  { id: 'level_10_biz', title: 'Prime Business', desc: 'Reach Level 10 with any business', target: 10, type: 'level', reward: 10000 },
  { id: 'level_20_biz', title: 'Flagship Store', desc: 'Reach Level 20 with any business', target: 20, type: 'level', reward: 100000 },
  { id: 'first_sale', title: 'First Customer', desc: 'Complete 1 customer sale', target: 1, type: 'sale', reward: 250 },
  { id: 'sales_50', title: 'Busy Counter', desc: 'Complete 50 customer sales', target: 50, type: 'sale', reward: 10000 },
  { id: 'sales_200', title: 'Crowd Favorite', desc: 'Complete 200 customer sales', target: 200, type: 'sale', reward: 50000 },
  { id: 'first_tap', title: 'Quick Fingers', desc: 'Collect 1 active tap bonus', target: 1, type: 'tap', reward: 100 },
  { id: 'taps_50', title: 'Active Hustler', desc: 'Collect 50 active tap bonuses', target: 50, type: 'tap', reward: 5000 },
  { id: 'missions_10', title: 'Go-Getter', desc: 'Complete 10 missions', target: 10, type: 'missions', reward: 20000 },
  { id: 'player_level_10', title: 'Rising Tycoon', desc: 'Reach Player Level 10', target: 10, type: 'player_level', reward: 30000 },
  { id: 'player_level_25', title: 'Urban Legend', desc: 'Reach Player Level 25', target: 25, type: 'player_level', reward: 150000 }
];

export const CITY_OBJECTIVE_TEMPLATES = [
  { id: 'earn_today', title: 'Daily Profits', desc: 'Earn ₹', type: 'earn_delta', baseAmount: 2500, rewardCash: 800, rewardXP: 40 },
  { id: 'serve_customers', title: 'Customer Rush', desc: 'Serve customers', type: 'customers_delta', baseAmount: 10, rewardCash: 1200, rewardXP: 50 },
  { id: 'tap_stores', title: 'On-Site Inspection', desc: 'Tap businesses', type: 'taps_delta', baseAmount: 8, rewardCash: 1000, rewardXP: 40 },
  { id: 'upgrade_any', title: 'Modernization', desc: 'Upgrade any business', type: 'upgrade_action', baseAmount: 1, rewardCash: 1500, rewardXP: 60 }
];
