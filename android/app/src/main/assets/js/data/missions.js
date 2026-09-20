// Mission definitions
export const MISSIONS = [
  {
    id: 'build_first_chai',
    title: 'Start Your Journey',
    description: 'Build your first Chai Stall',
    type: 'build',
    target: { businessId: 'chai_stall', count: 1 },
    reward: { cash: 200 },
    check: (gs) => (gs.buildings['chai_stall']?.length || 0) >= 1
  },
  {
    id: 'earn_1000',
    title: 'First Thousand',
    description: 'Earn ₹1,000 total',
    type: 'earn',
    target: { amount: 1000 },
    reward: { cash: 500 },
    check: (gs) => gs.totalEarned >= 1000
  },
  {
    id: 'build_3_businesses',
    title: 'Growing Fast',
    description: 'Build 3 businesses',
    type: 'build_count',
    target: { count: 3 },
    reward: { cash: 1000 },
    check: (gs) => gs.totalBuildings >= 3
  },
  {
    id: 'upgrade_level5',
    title: 'Going Premium',
    description: 'Upgrade any business to Level 5',
    type: 'upgrade',
    target: { minLevel: 5 },
    reward: { cash: 2000 },
    check: (gs) => {
      for (const bid in gs.buildings) {
        for (const b of gs.buildings[bid]) {
          if (b.level >= 5) return true;
        }
      }
      return false;
    }
  },
  {
    id: 'hire_first_employee',
    title: 'Employer',
    description: 'Hire your first employee',
    type: 'hire',
    target: { count: 1 },
    reward: { cash: 800 },
    check: (gs) => {
      for (const bid in gs.buildings) {
        for (const b of gs.buildings[bid]) {
          if (b.employees > 0) return true;
        }
      }
      return false;
    }
  },
  {
    id: 'earn_10000_offline',
    title: 'Away Earnings',
    description: 'Earn ₹10,000 from offline earnings',
    type: 'offline_earn',
    target: { amount: 10000 },
    reward: { cash: 5000 },
    check: (gs) => gs.totalOfflineEarned >= 10000
  },
  {
    id: 'unlock_plot2',
    title: 'Expand Horizons',
    description: 'Unlock the second plot',
    type: 'unlock',
    target: { plotIndex: 1 },
    reward: { cash: 3000 },
    check: (gs) => gs.unlockedPlots >= 2
  },
  {
    id: 'earn_50000',
    title: 'Fifty Grand',
    description: 'Earn ₹50,000 total',
    type: 'earn',
    target: { amount: 50000 },
    reward: { cash: 15000 },
    check: (gs) => gs.totalEarned >= 50000
  },
  {
    id: 'build_all_types',
    title: 'Diversified',
    description: 'Build at least one of each business type',
    type: 'build_all',
    target: {},
    reward: { cash: 10000 },
    check: (gs) => {
      return BUSINESS_ORDER.every(bid => (gs.buildings[bid]?.length || 0) >= 1);
    }
  },
  {
    id: 'reach_level10',
    title: 'Level Up',
    description: 'Reach Player Level 10',
    type: 'player_level',
    target: { level: 10 },
    reward: { cash: 20000 },
    check: (gs) => gs.playerLevel >= 10
  },
  {
    id: 'tap_bonus_first',
    title: 'Active Hustle',
    description: 'Collect an active tap bonus from any shop',
    type: 'tap_bonus',
    target: { count: 1 },
    reward: { cash: 1500 },
    check: (gs) => (gs.tapBonusCount || 0) >= 1
  },
  {
    id: 'build_kirana',
    title: 'Neighborhood Grocery',
    description: 'Build your first Kirana Store',
    type: 'build',
    target: { businessId: 'kirana_store', count: 1 },
    reward: { cash: 2500 },
    check: (gs) => (gs.buildings['kirana_store']?.length || 0) >= 1
  },
  {
    id: 'unlock_plot3',
    title: 'Commercial Expansion',
    description: 'Unlock Plot 3',
    type: 'unlock',
    target: { plotIndex: 2 },
    reward: { cash: 6000 },
    check: (gs) => (gs.unlockedPlots || 0) >= 3
  },
  {
    id: 'upgrade_level10',
    title: 'Popular Destination',
    description: 'Upgrade any business to Level 10',
    type: 'upgrade',
    target: { minLevel: 10 },
    reward: { cash: 8000 },
    check: (gs) => {
      for (const bid in gs.buildings) {
        for (const b of gs.buildings[bid]) {
          if (b.level >= 10) return true;
        }
      }
      return false;
    }
  },
  {
    id: 'hire_5_employees',
    title: 'Local Job Creator',
    description: 'Hire 5 workers across your businesses',
    type: 'hire',
    target: { count: 5 },
    reward: { cash: 10000 },
    check: (gs) => {
      let count = 0;
      for (const bid in gs.buildings) {
        for (const b of gs.buildings[bid]) count += b.employees;
      }
      return count >= 5;
    }
  },
  {
    id: 'customer_rush',
    title: 'Bustling Bazaar',
    description: 'Complete 10 customer sales',
    type: 'customer_serve',
    target: { count: 10 },
    reward: { cash: 12000 },
    check: (gs) => (gs.customerSalesCount || 0) >= 10
  },
  {
    id: 'build_dhaba',
    title: 'Highway Flavors',
    description: 'Build a Dhaba',
    type: 'build',
    target: { businessId: 'dhaba', count: 1 },
    reward: { cash: 15000 },
    check: (gs) => (gs.buildings['dhaba']?.length || 0) >= 1
  },
  {
    id: 'earn_100k',
    title: 'Lakhpati Milestone',
    description: 'Earn ₹100,000 total',
    type: 'earn',
    target: { amount: 100000 },
    reward: { cash: 25000 },
    check: (gs) => (gs.totalEarned || 0) >= 100000
  },
  {
    id: 'unlock_plot5',
    title: 'Town Center',
    description: 'Unlock 5 plots in the city',
    type: 'unlock',
    target: { count: 5 },
    reward: { cash: 35000 },
    check: (gs) => (gs.unlockedPlots || 0) >= 5
  },
  {
    id: 'tap_bonus_master',
    title: 'Street Smart',
    description: 'Collect 15 active tap bonuses',
    type: 'tap_bonus',
    target: { count: 15 },
    reward: { cash: 20000 },
    check: (gs) => (gs.tapBonusCount || 0) >= 15
  },
  {
    id: 'upgrade_level20',
    title: 'Flagship Establishment',
    description: 'Upgrade any business to Level 20',
    type: 'upgrade',
    target: { minLevel: 20 },
    reward: { cash: 50000 },
    check: (gs) => {
      for (const bid in gs.buildings) {
        for (const b of gs.buildings[bid]) {
          if (b.level >= 20) return true;
        }
      }
      return false;
    }
  },
  {
    id: 'earn_500k',
    title: 'Half A Million',
    description: 'Earn ₹500,000 total',
    type: 'earn',
    target: { amount: 500000 },
    reward: { cash: 75000 },
    check: (gs) => (gs.totalEarned || 0) >= 500000
  },
  {
    id: 'unlock_plot8',
    title: 'Commercial District',
    description: 'Unlock 8 plots in the city',
    type: 'unlock',
    target: { count: 8 },
    reward: { cash: 100000 },
    check: (gs) => (gs.unlockedPlots || 0) >= 8
  },
  {
    id: 'hire_12_employees',
    title: 'Empire Builder',
    description: 'Employ 12 workers in your empire',
    type: 'hire',
    target: { count: 12 },
    reward: { cash: 120000 },
    check: (gs) => {
      let count = 0;
      for (const bid in gs.buildings) {
        for (const b of gs.buildings[bid]) count += b.employees;
      }
      return count >= 12;
    }
  },
  {
    id: 'earn_1m',
    title: 'Crorepati Club',
    description: 'Earn ₹1,000,000 total',
    type: 'earn',
    target: { amount: 1000000 },
    reward: { cash: 250000 },
    check: (gs) => (gs.totalEarned || 0) >= 1000000
  },
  {
    id: 'reach_level25',
    title: 'Tycoon Legend',
    description: 'Reach Player Level 25',
    type: 'player_level',
    target: { level: 25 },
    reward: { cash: 500000 },
    check: (gs) => (gs.playerLevel || 1) >= 25
  },
  {
    id: 'unlock_all_plots',
    title: 'City Metropolis',
    description: 'Unlock all 15 plots in the city',
    type: 'unlock',
    target: { count: 15 },
    reward: { cash: 1000000 },
    check: (gs) => (gs.unlockedPlots || 0) >= 15
  }
];

export const DAILY_REWARDS = [
  { day: 1, reward: { cash: 500 }, label: 'Day 1 Bonus' },
  { day: 2, reward: { cash: 1000 }, label: 'Day 2 Bonus' },
  { day: 3, reward: { cash: 2000 }, label: 'Day 3 Bonus' },
  { day: 4, reward: { type: 'upgrade_token', count: 1 }, label: 'Upgrade Token' },
  { day: 5, reward: { cash: 5000 }, label: 'Day 5 Bonus' },
  { day: 6, reward: { type: 'decoration', id: 'fountain' }, label: 'Fountain Decoration' },
  { day: 7, reward: { cash: 15000 }, label: 'Weekly Jackpot' }
];
