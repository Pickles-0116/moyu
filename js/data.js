/**
 * 《掌柜偷闲录》- 游戏数据层 (v1.1 P1全量)
 * 包含：资源定义、店铺数据(6种)、事件池(30个含C选项)、道具(21种)、成就、每日商情、传闻、路段
 */

// ==================== 游戏常量 ====================
const GAME_CONFIG = {
  version: '2.4.0',
  // 资源初始值
  initialSilver: 100,
  initialReputation: 0,
  initialStamina: 100,
  initialShangtu: 0,

  // 精力系统
  maxEnergy: 20,
  energyRecoveryInterval: 300,
  energyPerRecovery: 1,
  energyPerTravel: 1,

  // 外出探索
  outingStaminaCost: 1,
  outingStaminaWarnThreshold: 1,

  // 核心循环
  travelDurationMin: 3000,
  travelDurationMax: 8000,

  // 离线收益 (v2.3: 基础35%/4h, Prestige后50%/6h)
  offlineMaxHours: 4,
  offlineRatio: 0.35,
  offlineMaxHoursPrestige: 6,
  offlineRatioPrestige: 0.50,

  // v2.3 操作激活机制
  activeWindowDuration: 900, // 15分钟全效窗口(秒)
  inactiveOutputMultiplier: 0.70, // 超时15min产出降至70%
  deepInactiveThreshold: 1800, // 30分钟深度衰减阈值(秒)
  deepInactiveOutputMultiplier: 0.50, // 超时30min产出降至50%
  disguiseOutputMultiplier: 0.70, // 伪装模式产出70%

  // v2.3 商机闪现
  businessFlashChance: 0.05, // 5%触发概率/次结算
  businessFlashDuration: 30, // 持续30秒
  businessFlashMultiplier: 2.0, // 产出×2

  // v2.3 道具动态定价（v2.4修复：每级递减，Lv.1起效）
  itemPriceBaseMarkup: 0.30, // 基础加价30%
  itemPriceDiscountPerLevel: 0.004, // 每级折扣0.4%（原每10级4%）
  itemPriceDiscountStartLevel: 1, // Lv.1起效（原Lv.10）
  itemPriceMaxDiscount: 0.40, // 最大店铺等级折扣40%

  // v2.3 店铺变卖
  shopSellBaseRecoveryRate: 0.40, // 首次变卖回收40%
  shopSellRecoveryDecayPerSell: 0.10, // 每次变卖递减10%
  shopSellRecoveryFloor: 0.20, // 基础回收率下限20%
  shopSellLevelDecayStartLevel: 10, // 等级衰减起始Lv.10
  shopSellLevelDecayRate: 0.002, // 每级-0.2%
  shopSellRecoveryFloorTotal: 0.10, // 最终回收率下限10%
  shopSellCooldownHours: 24, // 冷却期24h

  // v2.3 燃烧精血
  burnBloodSilverPerStamina: 200, // 每点体力换200两
  burnBloodLifetimeMax: 100, // 整局游戏最多烧100点，重置/Prestige清零

  // 保存
  autoSaveInterval: 5000,
  saveVersion: 1,

  // 里程碑倍率
  milestoneMultipliers: { 10: 2, 25: 3, 50: 5, 100: 10 },

  // 背包 (v2.0: 扩容需声望门槛 50/200/400)
  backpackInitialSlots: 12,
  backpackMaxSlots: 24,
  backpackExpandCosts: [500, 1000, 1500],
  backpackExpandReputation: [50, 200, 400], // 每次扩容所需声望
  backpackExpandStep: 4,
  quickSlotsCount: 4,

  // Prestige
  prestigeRequirement: 500,
  legacyPerReputation: 0.01,

  // 商途值
  shangtuBasePerRound: 150,
  shangtuOverflowPerStep: 1,

  // 签到
  dailyRewardCycle: 7,

  // 商情 (v2.2: 持仓999/步数刷新/手续费15%/波动0.6~2.0)
  marketMaxHolding: 999, // 每种货物最大持有量
  marketBuyFeeRate: 0.15, // 买入手续费率

  // v2.2 黑市
  heishiInspectRate: 0.05, // 查抄概率5%
};

// ==================== 快速行商（御赐商牌专属） ====================
const FAST_TRAVEL_CONFIG = {
  count: 10,                  // 一次行商10次
  energyCost: 10,             // 一次性扣10点精力（按比例：10次×1精力/次）
  requiredPermanent: 'yucishangpai', // 需要持有御赐商牌
};

// ==================== v2.2 步数刷新配置 ====================
// 根据声望区间决定商情/黑市刷新间隔步数
const MARKET_REFRESH_STEPS = [
  { maxRep: 49,   steps: 20 },
  { maxRep: 199,  steps: 16 },
  { maxRep: 399,  steps: 12 },
  { maxRep: Infinity, steps: 8 },
];
const HEISHI_REFRESH_STEPS = [
  { maxRep: 49,   steps: 30 },
  { maxRep: 199,  steps: 24 },
  { maxRep: 399,  steps: 18 },
  { maxRep: Infinity, steps: 12 },
];

// ==================== 四维资源定义 ====================
const RESOURCES = {
  silver:     { id:'silver',     name:'银两',   icon:'🪙', description:'核心经济', initial:100 },
  reputation: { id:'reputation', name:'声望',   icon:'🏆', description:'长线投资', initial:0 },
  stamina:    { id:'stamina',    name:'体力',   icon:'❤️', description:'生存约束', initial:100, max:100 },
  shangtu:    { id:'shangtu',    name:'商途值', icon:'🗺️', description:'进度可视化', initial:0 },
};

// ==================== 店铺定义（6种） ====================
const SHOPS = {
  teahouse: {
    id:'teahouse', name:'茶馆', icon:'🍵', description:'市井茶馆，人来人往',
    baseOutput:10, unlockCondition:null, upgradeBaseCost:200, upgradeCostMultiplier:1.5,
    specialEffect:null,
    items: [{ id:'xingshentang', price:100 }],
  },
  clothshop: {
    id:'clothshop', name:'布庄', icon:'🧵', description:'绫罗绸缎，应有尽有',
    baseOutput:25, unlockCondition:{resource:'silver',amount:500}, upgradeBaseCost:500, upgradeCostMultiplier:1.6,
    specialEffect:null,
    items: [{ id:'xingyunfu', price:80 }],
  },
  grainstore: {
    id:'grainstore', name:'粮铺', icon:'🌾', description:'五谷丰登，仓廪充实',
    baseOutput:60, unlockCondition:{resource:'silver',amount:2000}, upgradeBaseCost:1500, upgradeCostMultiplier:1.7,
    specialEffect:null,
    items: [{ id:'jinchuangyao', price:50 }],
  },
  jiulou: {
    id:'jiulou', name:'酒楼', icon:'🍶', description:'觥筹交错，商机暗藏',
    baseOutput:150, unlockCondition:{resource:'shangtu',amount:300}, upgradeBaseCost:3000, upgradeCostMultiplier:1.8,
    specialEffect:{type:'energyMax',value:1,perLevels:5},
    items: [{ id:'fuxinggaozhaofu', price:250 }],
  },
  yaopu: {
    id:'yaopu', name:'药铺', icon:'🏥', description:'悬壶济世，药到病除',
    baseOutput:80, unlockCondition:{resource:'shangtu',amount:200}, upgradeBaseCost:2500, upgradeCostMultiplier:1.7,
    specialEffect:{type:'staminaMax',value:10,perLevels:5},
    items: [
      { id:'renshen', price:150 },
      { id:'lingzhi', price:400 },
      { id:'qingxinwan', price:200 },
    ],
    prestigeItems: [
      { id:'qiannianrenshen', price:2000, minLevel:10 },
      { id:'juqidan', price:1500, minLevel:10 },
    ],
  },
  biaoju: {
    id:'biaoju', name:'镖局', icon:'🛡️', description:'镖行天下，一路平安',
    baseOutput:200, unlockCondition:{resource:'shangtu',amount:800}, upgradeBaseCost:5000, upgradeCostMultiplier:1.9,
    specialEffect:{type:'offlineRatio',value:0.05,perLevels:5},
    items: [
      { id:'huichengjuanzhou', price:100 },
      { id:'hushenfu', price:200 },
    ],
  },
};

// ==================== 路段定义 ====================
const ROADS = {
  jiangnan:  { id:'jiangnan',  name:'江南', description:'商贸繁华之地', unlockShangtu:0,    outputMultiplier:1.0, eventTheme:'trade' },
  zhongyuan: { id:'zhongyuan', name:'中原', description:'江湖豪杰荟萃', unlockShangtu:500,  outputMultiplier:2.0, eventTheme:'jianghu' },
  xiyu:     { id:'xiyu',     name:'西域', description:'塞外冒险之地', unlockShangtu:2000, outputMultiplier:4.0, eventTheme:'adventure' },
};

// ==================== 道具定义（21种） ====================
const ITEM_DEFINITIONS = {
  // --- 消耗型-回复体力 ---
  jinchuangyao: {
    id:'jinchuangyao', name:'金创药', icon:'💊', rarity:'common', type:'consumable', category:'heal_stamina',
    description:'寻常跌打药，回复20点体力', effect:{stamina:20}, price:50, stackable:true, maxStack:99,
    useContext:['any'], condition:{stamina:{lt:'staminaMax'}},
  },
  renshen: {
    id:'renshen', name:'人参', icon:'🌿', rarity:'common', type:'consumable', category:'heal_stamina',
    description:'大补元气，回复50点体力', effect:{stamina:50}, price:150, stackable:true, maxStack:99,
    useContext:['any'], condition:{stamina:{lt:'staminaMax'}},
  },
  lingzhi: {
    id:'lingzhi', name:'灵芝', icon:'🍄', rarity:'rare', type:'consumable', category:'heal_stamina',
    description:'仙草灵芝，回复100点体力', effect:{stamina:100}, price:400, stackable:true, maxStack:99,
    useContext:['any'], condition:{stamina:{lt:'staminaMax'}},
  },
  // --- 消耗型-回复精力 ---
  xingshentang: {
    id:'xingshentang', name:'醒神汤', icon:'🍵', rarity:'common', type:'consumable', category:'heal_energy',
    description:'一碗醒神，精力+3', effect:{energy:3}, price:100, stackable:true, maxStack:99,
    useContext:['any'], condition:{energy:{lt:'energyMax'}},
  },
  qingxinwan: {
    id:'qingxinwan', name:'清心丸', icon:'🔵', rarity:'common', type:'consumable', category:'heal_energy',
    description:'清心安神，精力+5', effect:{energy:5}, price:200, stackable:true, maxStack:99,
    useContext:['any'], condition:{energy:{lt:'energyMax'}},
  },
  xianluyin: {
    id:'xianluyin', name:'仙露饮', icon:'✨', rarity:'rare', type:'consumable', category:'heal_energy',
    description:'仙家甘露，精力+10', effect:{energy:10}, price:500, stackable:true, maxStack:10,
    useContext:['any'], condition:{energy:{lt:'energyMax'}},
  },
  // --- 消耗型-临时增益 ---
  xingyunfu: {
    id:'xingyunfu', name:'幸运符', icon:'🎲', rarity:'common', type:'consumable', category:'buff',
    description:'符布所制，下次随机事件成功率+30%', effect:{luckBoost:0.3}, price:80, stackable:true, maxStack:99,
    useContext:['any'],
  },
  fuxinggaozhaofu: {
    id:'fuxinggaozhaofu', name:'福星高照符', icon:'⭐', rarity:'rare', type:'consumable', category:'buff',
    description:'下3次行进收益×1.5', effect:{incomeBoost:1.5, incomeBoostRounds:3}, price:250, stackable:true, maxStack:10,
    useContext:['any'],
  },
  fengshuiluopan: {
    id:'fengshuiluopan', name:'风水罗盘', icon:'🧭', rarity:'rare', type:'consumable', category:'buff',
    description:'下次行进必触发正面事件', effect:{guaranteedGoodEvent:true}, price:180, stackable:true, maxStack:10,
    useContext:['any'],
  },
  // --- 消耗型-商途加成 ---
  jixingling: {
    id:'jixingling', name:'急行令', icon:'📜', rarity:'common', type:'consumable', category:'shangtu_boost',
    description:'下次行进商途值×3(不受上限约束)', effect:{shangtuBoost:3, shangtuBoostRounds:1}, price:120, stackable:true, maxStack:99,
    useContext:['any'],
  },
  shangtujinnang: {
    id:'shangtujinnang', name:'商途锦囊', icon:'🎒', rarity:'rare', type:'consumable', category:'shangtu_boost',
    description:'本轮商途值获取×2(不受上限约束)', effect:{shangtuBoost:2, shangtuBoostRounds:999}, price:350, stackable:true, maxStack:10,
    useContext:['during_journey'],
  },
  // --- 永久型-体力上限 ---
  qiannianrenshen: {
    id:'qiannianrenshen', name:'千年人参', icon:'🫚', rarity:'rare', type:'permanent', category:'stamina_max',
    description:'千年灵参，体力上限永久+20(穿透Prestige)', effect:{staminaMaxBonus:20}, price:2000, stackable:false, maxStack:1,
    useContext:['any'], maxPurchase:1,
  },
  xueshanshenwang: {
    id:'xueshanshenwang', name:'雪山参王', icon:'🏔️', rarity:'legendary', type:'permanent', category:'stamina_max',
    description:'雪山之巅的参王，体力上限永久+50', effect:{staminaMaxBonus:50}, price:6000, stackable:false, maxStack:1,
    useContext:['any'], maxPurchase:1, prestigeOnly:true,
  },
  yanshoudan: {
    id:'yanshoudan', name:'延寿丹', icon:'🧪', rarity:'rare', type:'permanent', category:'stamina_max',
    description:'延年益寿，体力上限永久+30', effect:{staminaMaxBonus:30}, price:45000, stackable:false, maxStack:1,
    useContext:['any'], maxPurchase:1,
  },
  // --- 永久型-精力上限 ---
  juqidan: {
    id:'juqidan', name:'聚气丹', icon:'🔮', rarity:'rare', type:'permanent', category:'energy_max',
    description:'凝聚真气，精力上限永久+3', effect:{energyMaxBonus:3}, price:1500, stackable:false, maxStack:1,
    useContext:['any'], maxPurchase:1,
  },
  tianyuandan: {
    id:'tianyuandan', name:'天元丹', icon:'💠', rarity:'legendary', type:'permanent', category:'energy_max',
    description:'天元至宝，精力上限永久+5', effect:{energyMaxBonus:5}, price:4000, stackable:false, maxStack:1,
    useContext:['any'], maxPurchase:1, prestigeOnly:true,
  },
  // --- 永久型-商途上限 ---
  shanglutongdie: {
    id:'shanglutongdie', name:'商路通牒', icon:'📋', rarity:'rare', type:'permanent', category:'shangtu_cap',
    description:'官方通牒，每轮商途值上限永久+50', effect:{shangtuCapBonus:50}, price:3000, stackable:false, maxStack:1,
    useContext:['any'], maxPurchase:1,
  },
  yucishangpai: {
    id:'yucishangpai', name:'御赐商牌', icon:'🏅', rarity:'legendary', type:'permanent', category:'shangtu_cap',
    description:'御赐金牌，每轮商途值上限永久+100', effect:{shangtuCapBonus:100}, price:8000, stackable:false, maxStack:1,
    useContext:['any'], maxPurchase:1, prestigeOnly:true,
  },
  jinsuanpan: {
    id:'jinsuanpan', name:'金算盘', icon:'🧮', rarity:'rare', type:'permanent', category:'shop_output',
    description:'掌柜的祖传金算盘，所有店铺产出永久+5%', effect:{shopOutputBoost:0.05}, price:8000, stackable:false, maxStack:1,
    useContext:['any'], maxPurchase:1,
  },
  zhenlianshi: {
    id:'zhenlianshi', name:'镇店石', icon:'🪨', rarity:'legendary', type:'permanent', category:'shop_output',
    description:'商海奇石，所有店铺产出永久+10%（重置后保留）', effect:{shopOutputBoost:0.10}, price:18000, stackable:false, maxStack:1,
    useContext:['any'], maxPurchase:1, prestigeOnly:true,
  },
  // --- 特殊道具 ---
  hushenfu: {
    id:'hushenfu', name:'护身符', icon:'🛡️', rarity:'common', type:'special', category:'protection',
    description:'装备后下次负面事件免疫，自动消耗', effect:{negateNegative:true}, price:200, stackable:true, maxStack:10,
    useContext:['any'],
  },
  huaxianfu: {
    id:'huaxianfu', name:'化险符', icon:'🌀', rarity:'rare', type:'special', category:'protection',
    description:'装备后体力归零时保留1点继续商途，自动消耗', effect:{preventStaminaZero:true}, price:500, stackable:true, maxStack:5,
    useContext:['any'],
  },
  huichengjuanzhou: {
    id:'huichengjuanzhou', name:'回城卷轴', icon:'🏠', rarity:'common', type:'special', category:'function',
    description:'立即结束本轮商途回城结算(保留已获资源，不触发完成奖励)', effect:{forceEndRound:true}, price:100, stackable:true, maxStack:10,
    useContext:['during_journey'],
  },
  kuorongjinnang: {
    id:'kuorongjinnang', name:'扩容锦囊', icon:'📦', rarity:'common', type:'special', category:'function',
    description:'背包容量+4格(最多24格)', effect:{expandSlots:4}, price:500, stackable:false, maxStack:1,
    useContext:['any'], condition:{}, isExpand:true,
  },
  // v2.1 黑市相关
  heishiling: {
    id:'heishiling', name:'黑市令', icon:'🌑', rarity:'rare', type:'special', category:'heishi',
    description:'地下黑市的通行令牌，消耗品。每次进入黑市消耗1个', effect:{}, price:0, stackable:true, maxStack:10,
    useContext:['any'],
  },
  heishi_yuanshi: {
    id:'heishi_yuanshi', name:'黑市原石', icon:'💎', rarity:'rare', type:'special', category:'heishi',
    description:'来自地下黑市的神秘原石，保底开出稀有玉，并有更高概率开出稀世藏品。可在赌坊切开', effect:{}, price:0, stackable:true, maxStack:5,
    useContext:['any'],
  },
  heishi_yuanshi_legend: {
    id:'heishi_yuanshi_legend', name:'黑市原石(传说)', icon:'🔮', rarity:'legendary', type:'special', category:'heishi',
    description:'地下黑市的传说级原石，保底开出稀有玉，开出稀世藏品的概率更高。可在赌坊切开', effect:{}, price:0, stackable:true, maxStack:3,
    useContext:['any'],
  },
};

// ==================== 地点系统（v2.1 古风命名） ====================
const LOCATIONS = {
  jiulou: {
    id: 'jiulou', name: '醉仙楼', shortName: '酒楼', icon: '🍶', description: '觥筹交错，以宴结交四方客',
    unlockCondition: null, // 默认解锁
    category: 'banquet',
    content: 'banquet', // 关联子系统
  },
  yujie: {
    id: 'yujie', name: '御街', shortName: '御街', icon: '🏛️', description: '皇家御道，奇遇与商机并存',
    unlockCondition: { resource: 'reputation', amount: 50 },
    category: 'event',
    content: 'yujie',
  },
  dufang: {
    id: 'dufang', name: '福运赌坊', shortName: '赌坊', icon: '🎲', description: '一掷千金，富贵险中求',
    unlockCondition: { resource: 'reputation', amount: 100 },
    category: 'gamble',
    content: 'dufang',
  },
  heishi: {
    id: 'heishi', name: '地下黑市', shortName: '黑市', icon: '🌑', description: '暗巷交易所，奇珍异宝价高者得',
    unlockCondition: { resource: 'reputation', amount: 200, item: 'heishiling' },
    category: 'shop',
    content: 'heishi',
  },
  yiguan: {
    id: 'yiguan', name: '回春堂', shortName: '医馆', icon: '🏥', description: '妙手回春，固本培元',
    unlockCondition: null, // 默认解锁
    category: 'recovery',
    content: 'yiguan',
  },
  yanchang: {
    id: 'yanchang', name: '盐场', shortName: '盐场', icon: '🧂', description: '暴利与风险并存的地下盐业',
    unlockCondition: { resource: 'shangtu', amount: 1500 },
    category: 'investment',
    content: 'yanchang',
  },
  gongfeng: {
    id: 'gongfeng', name: '商神庙', shortName: '供奉', icon: '🏯', description: '供奉商神，传承万世基业',
    unlockCondition: null, // 特殊解锁：所有店铺达到Lv.100
    category: 'endgame',
    content: 'gongfeng',
  },
  auction: {
    id: 'auction', name: '聚宝阁', shortName: '拍卖', icon: '🏛️', description: '拍卖珍奇之物，一口价无竞价',
    unlockCondition: { resource: 'reputation', amount: 300 },
    category: 'auction',
    content: 'auction',
  },
};

// ==================== 聚宝阁拍卖场（v2.4） ====================
const AUCTION_CONFIG = {
  unlockReputation: 300,
  itemsPerRefresh: 4,
  forceRefreshCost: 100000,
  forceRefreshDailyLimit: Infinity,
  rarePriceMarkup: 1.5,
};

function getAuctionRefreshSteps(reputation) {
  if (reputation >= 1500) return 12;
  if (reputation >= 1000) return 16;
  if (reputation >= 600) return 20;
  return 24;
}

const AUCTION_COLLECTIBLES = {
  collectible_jade: { id:'collectible_jade', name:'千年翡翠', icon:'💎', price:500000, weight:70, type:'collectible', rarity:'epic', desc:'历经千年沉淀的翡翠原石，通体碧绿，价值连城。' },
  collectible_ginseng: { id:'collectible_ginseng', name:'万年人参', icon:'🌿', price:3000000, weight:25, type:'collectible', rarity:'legendary', desc:'深山老林中采得的万年野山参，形如人形，药香扑鼻。' },
  collectible_iced_tea: { id:'collectible_iced_tea', name:'百万年冰红茶', icon:'🧊', price:30000000, weight:5, type:'collectible', rarity:'mythic', desc:'传说中的至尊饮品，据说饮一口可通天地……但你舍不得。' },
};

const PROTECTION_ITEMS = {
  protection_imperial_decree: { id:'protection_imperial_decree', name:'御前圣令', icon:'📜', price:150000, type:'protection', maxStack:3, protectionType:'confiscation', sellPrice:50000, desc:'盖有御玺的圣令，可免疫一次查封（黑市/盐场）。最多持有3个。' },
  protection_death_medal: { id:'protection_death_medal', name:'免死金牌', icon:'🏅', price:500000, type:'protection', maxStack:1, protectionType:'punitiveSetback', sellPrice:200000, desc:'御赐免死金牌，可免除一次惩罚性倒退（体力归零时全部惩罚）。最多持有1个。' },
};

const AUCTION_RARE_ITEMS = [
  { itemId:'lingzhi', weight:15, originalPrice:400 }, { itemId:'xianluyin', weight:15, originalPrice:500 },
  { itemId:'fuxinggaozhaofu', weight:12, originalPrice:250 }, { itemId:'fengshuiluopan', weight:12, originalPrice:180 },
  { itemId:'shangtujinnang', weight:10, originalPrice:350 }, { itemId:'qiannianrenshen', weight:8, originalPrice:2000 },
  { itemId:'juqidan', weight:8, originalPrice:1500 }, { itemId:'shanglutongdie', weight:8, originalPrice:3000 },
  { itemId:'xueshanshenwang', weight:5, originalPrice:6000 }, { itemId:'tianyuandan', weight:5, originalPrice:4000 },
  { itemId:'yucishangpai', weight:5, originalPrice:8000 }, { itemId:'huaxianfu', weight:7, originalPrice:500 },
  { itemId:'yanshoudan', weight:6, originalPrice:45000 },
  { itemId:'jinsuanpan', weight:7, originalPrice:8000 }, { itemId:'zhenlianshi', weight:3, originalPrice:18000 },
  { itemId:'heishi_yuanshi', weight:4, originalPrice:500000 }, { itemId:'heishi_yuanshi_legend', weight:2, originalPrice:500000 },
];

const AUCTION_CONSUMABLE_PACKS = [
  { id:'pack_stamina', name:'体力补给包', icon:'💊', weight:30, price:800, desc:'灵芝×1+人参×2+金创药×3', items:[{ itemId:'lingzhi',qty:1 },{ itemId:'renshen',qty:2 },{ itemId:'jinchuangyao',qty:3 }] },
  { id:'pack_energy', name:'精力补给包', icon:'🍵', weight:30, price:1000, desc:'仙露饮×1+清心丸×2+醒神汤×2', items:[{ itemId:'xianluyin',qty:1 },{ itemId:'qingxinwan',qty:2 },{ itemId:'xingshentang',qty:2 }] },
  { id:'pack_buff', name:'运势增益包', icon:'⭐', weight:25, price:550, desc:'福星高照符×1+风水罗盘×1+幸运符×2', items:[{ itemId:'fuxinggaozhaofu',qty:1 },{ itemId:'fengshuiluopan',qty:1 },{ itemId:'xingyunfu',qty:2 }] },
  { id:'pack_protection', name:'护身避险包', icon:'🛡️', weight:15, price:850, desc:'护身符×2+化险符×1', items:[{ itemId:'hushenfu',qty:2 },{ itemId:'huaxianfu',qty:1 }] },
];

const AUCTION_CATEGORY_POOL = [
  { name:'collectible', prob:0.40 }, { name:'protection', prob:0.12 },
  { name:'rareItem', prob:0.30 }, { name:'consumablePack', prob:0.18 },
];

// ==================== 酒楼宴请系统（v2.0） ====================
const BANQUET_CONFIG = {
  dailyLimit: 1, // 每日限制次数
  priceIncrement: 0.10, // 每次宴请涨价10%
  tiers: [
    {
      id: 'simple', name: '便饭', icon: '🍚',
      basePrice: 200,
      rewards: { stamina: 20, reputation: 3 },
      description: '一荤一素，简单实惠',
    },
    {
      id: 'feast', name: '酒席', icon: '🍷',
      basePrice: 600,
      rewards: { stamina: 40, reputation: 8, shangtu: 15 },
      description: '四菜一汤，觥筹交错',
    },
    {
      id: 'banquet', name: '盛宴', icon: '👑',
      basePrice: 1500,
      rewards: { stamina: 70, reputation: 15, shangtu: 30, energy: 2 },
      description: '山珍海味，宾主尽欢',
    },
  ],
};
const HEISHI_GOODS = [
  // T1 普通 (60%) — 消耗道具、增益道具
  { id:'heishi_t1a', tier:1, name:'金创药×10', icon:'💊', basePrice:1500, chance:0.15, itemReward:{id:'jinchuangyao',qty:10} },
  { id:'heishi_t1b', tier:1, name:'醒神汤×5', icon:'🍵', basePrice:1200, chance:0.15, itemReward:{id:'xingshentang',qty:5} },
  { id:'heishi_t1c', tier:1, name:'幸运符×5', icon:'🎲', basePrice:1000, chance:0.10, itemReward:{id:'xingyunfu',qty:5} },
  { id:'heishi_t1d', tier:1, name:'急行令×5', icon:'📜', basePrice:1800, chance:0.10, itemReward:{id:'jixingling',qty:5} },
  { id:'heishi_t1e', tier:1, name:'人参×3', icon:'🌿', basePrice:1300, chance:0.10, itemReward:{id:'renshen',qty:3} },
  // T2 稀有 (30%) — 永久道具、黑市原石 (需 Prestige≥1)
  { id:'heishi_t2a', tier:2, name:'千年人参', icon:'🫚', basePrice:5000, chance:0.08, itemReward:{id:'qiannianrenshen',qty:1} },
  { id:'heishi_t2b', tier:2, name:'聚气丹', icon:'🔮', basePrice:4000, chance:0.08, itemReward:{id:'juqidan',qty:1} },
  { id:'heishi_t2c', tier:2, name:'商路通牒', icon:'📋', basePrice:6000, chance:0.07, itemReward:{id:'shanglutongdie',qty:1} },
  { id:'heishi_t2d', tier:2, name:'黑市原石', icon:'💎', basePrice:500000, fixedPrice:true, chance:0.07, itemReward:{id:'heishi_yuanshi',qty:1} },
  // T3 传说 (8%) — Prestige加成道具（原需 Prestige≥3，现全时段可见）
  { id:'heishi_t3a', tier:3, name:'雪山参王', icon:'🏔️', basePrice:30000, chance:0.04, itemReward:{id:'xueshanshenwang',qty:1} },
  { id:'heishi_t3b', tier:3, name:'天元丹', icon:'💠', basePrice:25000, chance:0.04, itemReward:{id:'tianyuandan',qty:1} },
  // T4 神器 (2%) — 限定道具（原需 Prestige≥5，现全时段可见）
  { id:'heishi_t4a', tier:4, name:'御赐商牌', icon:'🏅', basePrice:80000, chance:0.01, itemReward:{id:'yucishangpai',qty:1} },
  { id:'heishi_t4b', tier:4, name:'黑市原石(传说)', icon:'🔮', basePrice:500000, fixedPrice:true, chance:0.01, itemReward:{id:'heishi_yuanshi_legend',qty:1} },
];
// ==================== 医馆配置（v2.1） ====================
const YIGUAN_CONFIG = {
  dailyLimit: 5, // 每日5次
  staminaPerHeal: 30, // 每次回复30体力
  basePrice: 500, // 基础价格
  priceMultiplier: 2, // 费用×2递增
};
// ==================== 御街事件池（v2.1 10个） ====================
const YUJIE_EVENTS = [
  // === 正面事件 55% (6个) ===
  { id:'yj_court_tribute', chance:0.12, type:'positive',
    title:'进贡赏赐', icon:'🎁', description:'路过皇宫侧门，正值使节进贡。礼官见你气度不凡，拉你一起献礼。你献上几样土特产，龙颜大悦！',
    result:'皇帝龙颜大悦，赏赐丰厚！', effects:{silver:300,reputation:8,shangtu:20} },
  { id:'yj_fair_contest', chance:0.10, type:'positive',
    title:'御前才艺', icon:'🎭', description:'御街摆下才艺擂台，围观者众多。一位官员笑道："掌柜的，你也来比试比试？"',
    result:'你的才艺惊艳四座，赢得满堂彩！', effects:{reputation:15,shangtu:30}, gamble:{winChance:0.7,winEffects:{silver:500},loseEffects:{}}, result_win:'技惊四座，还获得赏银！', result_lose:'虽未夺冠，但风度赢得尊重。' },
  { id:'yj_treasure_map', chance:0.10, type:'positive',
    title:'藏宝图纸', icon:'🗺️', description:'御街旧书摊上，一本泛黄的古籍里夹着半张藏宝图。摊主不识货，只要50两。',
    result:'你按图索骥，找到了前人埋藏的银两！', effects:{silver:-50}, gains:{silver:{min:300,max:600}} },
  { id:'yj_merchant_tip', chance:0.08, type:'positive',
    title:'贵人指路', icon:'👤', description:'一位衣着华贵的商人主动搭讪："掌柜的，南边新开了条商道，趁人少快去占个先机。"',
    result:'贵人的消息千真万确，你抢先占领了商机！', effects:{shangtu:50,reputation:5} },
  { id:'yj_rare_herb', chance:0.08, type:'positive',
    title:'御药房外', icon:'🌿', description:'御药房伙计偷偷招手："掌柜的，有些多余的药材，便宜卖你..."',
    result:'你低价买到了珍稀药材！', effects:{silver:-80}, itemReward:{id:'lingzhi',qty:1} },
  { id:'yj_guard_generous', chance:0.07, type:'positive',
    title:'御林军犒赏', icon:'⚔️', description:'御林军统领正在犒赏三军，见你经商辛苦，笑道："商道也如战场，来，喝碗酒！"',
    result:'统领赏了你一碗御酒，还给了些盘缠！', effects:{stamina:20,silver:150} },
  // === 中性事件 15% (2个) ===
  { id:'yj_rain_stall', chance:0.08, type:'neutral',
    title:'御街避雨', icon:'🌧️', description:'突然下起大雨，你躲进御街茶楼。茶博士热情招呼，一壶好茶要价30两。',
    result:'茶香袅袅，你休息了片刻。', effects:{silver:-30,stamina:10} },
  { id:'yj_procession', chance:0.07, type:'neutral',
    title:'皇家仪仗', icon:'👑', description:'皇家仪仗队经过御街，百姓跪拜。你在人群中站立，被维持秩序的御林军训斥了几句。',
    result:'被训斥了一番，但也没太大损失。', effects:{reputation:-2} },
  // === 负面事件 30% (3个) ===
  { id:'yj_pickpocket', chance:0.12, type:'negative',
    title:'御街扒手', icon:'🕵️', description:'御街人潮涌动，突然有人撞了你一下。一摸腰间——钱袋不见了！',
    result:'钱袋被偷，损失惨重！', gamble:{winChance:0.5,winEffects:{reputation:5},loseEffects:{silver:-200}}, result_win:'你眼疾手快抓住了扒手，扭送官府！声望+5！', result_lose:'扒手跑得无影无踪，丢了200两。' },
  { id:'yj_bureaucrat', chance:0.10, type:'negative',
    title:'官员刁难', icon:'📜', description:'一位巡查官员拦住你："没有通行文书，不得在御街经营！"要你交100两"办证费"。',
    result:'被官员刁难，费时又费钱。', effects:{silver:-100,stamina:-10}, gamble:{winChance:0.4,winEffects:{reputation:12},loseEffects:{silver:-50}}, result_win:'你据理力争，官员理亏，反获嘉奖！', result_lose:'被罚了50两，下次记得备好文书。' },
  { id:'yj_counterfeit', chance:0.08, type:'negative',
    title:'假银票', icon:'💸', description:'御街钱庄有人兜售"折扣银票"，面值300两只要150两。看起来很划算...',
    result:'银票是假的，亏大了！', gamble:{winChance:0.3,winEffects:{silver:300},loseEffects:{silver:-150}}, result_win:'没想到银票是真的！净赚150两！', result_lose:'果然贪便宜吃大亏，白扔150两。' },
];
// ==================== 赌坊配置（v2.1） ====================
const DUFANG_CONFIG = {
  dailyLimit: 20, // 每日限20次（所有玩法共享）
  // v2.2 防沉迷
  antiAddiction: {
    dailyLossLimit: 500000, // 日累计输满50万强制冷却
    cooldownHours: 2, // 冷却2小时
    consecutiveLossWarn: 5, // 连输5次提示
  },
  // 掷骰子
  dice: {
    minBet: 500, maxBet: 50000, step: 500,
    payoutBigSmall: 2, // 大小 1:1（返回本金+等额奖金=2倍）
    payoutLeopard: 10, // 豹子 1:10（返回10倍含本金）
    leopardChance: 6/216, // 豹子概率
    bigSmallChance: 105/216, // 大/小各105/216（含豹子判负）
  },
  // 赌石
  stone: {
    tiers: [
      { id:'ordinary', name:'普通原石', icon:'🪨', price:1000, qualityMod:0 },
      { id:'fine', name:'精品原石', icon:'💠', price:5000, qualityMod:0.15 },
      { id:'legend', name:'传说原石', icon:'💎', price:20000, qualityMod:0.35 },
      { id:'heaven', name:'天字号原石', icon:'🌅', price:100000, qualityMod:0.55, specialTable:true },
    ],
    qualities: [
      { id:'waste', name:'废料', icon:'🗑️', value:0.2, chance:0.30 },
      { id:'common', name:'普通玉', icon:'🟢', value:0.5, chance:0.25 },
      { id:'good', name:'良品玉', icon:'🔵', value:1.0, chance:0.20 },
      { id:'rare', name:'稀有玉', icon:'🟣', value:2.0, chance:0.15 },
      { id:'elite', name:'极品玉', icon:'🟡', value:4.0, chance:0.07 },
      { id:'legend', name:'传说玉', icon:'🌟', value:10.0, chance:0.03 },
    ],
    // 保底：连续5次出废料/普通玉（良品玉不++也不清零），下次+25%概率
    pityThreshold: 5, pityBonus: 0.25,
    // 黑市原石保底稀有玉，传说原石的高品质权重更高
    heishiQualities: [
      { id:'rare', name:'稀有玉', icon:'🟣', value:2.0, chance:0.55 },
      { id:'elite', name:'极品玉', icon:'🟡', value:4.0, chance:0.30 },
      { id:'legend', name:'传说玉', icon:'🌟', value:10.0, chance:0.15 },
    ],
    // 天字号原石专属概率表（v2.4）— 10万银两
    heavenQualities: [
      { id:'waste', name:'废料', icon:'🗑️', value:0.2, chance:0.05 },
      { id:'common', name:'普通玉', icon:'🟢', value:0.5, chance:0.10 },
      { id:'good', name:'良品玉', icon:'🔵', value:1.0, chance:0.15 },
      { id:'rare', name:'稀有玉', icon:'🟣', value:2.0, chance:0.25 },
      { id:'elite', name:'极品玉', icon:'🟡', value:4.0, chance:0.25 },
      { id:'legend', name:'传说玉', icon:'🌟', value:10.0, chance:0.15 },
      { id:'mythic', name:'天命神玉', icon:'✨', value:25.0, chance:0.05 },
    ],
    // 稀世藏品掉落率：天字号1%，黑市原石5%，黑市传说原石10%
    collectionDropChance: 0.01,
    heishiCollectionDropChance: 0.05,
    heishiLegendCollectionDropChance: 0.10,
    collections: {
      jade_emperor: { id:'jade_emperor', name:'帝王绿翡翠', icon:'💚', valuation:10000000, desc:'天字号原石出产，持有即生效：赌石≥良品概率+5%', effect:{ type:'stoneQualityBoost', value:0.05 } },
      jade_muttonFat: { id:'jade_muttonFat', name:'和田羊脂白玉', icon:'🤍', valuation:10000000, desc:'天字号原石出产，持有即生效：所有店铺产出+3%', effect:{ type:'shopOutputBoost', value:0.03 } },
    },
  },
  // 竞猜
  quiz: {
    dailyLimit: 1, betAmount: 1000, payout: 2,
  },
};
// ==================== 竞猜题库（v2.1） ====================
const QUIZ_POOL = [
  { id:'quiz_01', question:'茶叶在商情交易中的基价是多少？', options:['50','80','120','200'], answer:1, explanation:'茶叶基价80两' },
  { id:'quiz_02', question:'声望重置（Prestige）需要多少声望？', options:['300','400','500','1000'], answer:2, explanation:'需要500声望' },
  { id:'quiz_03', question:'以下哪个店铺默认解锁？', options:['布庄','粮铺','茶馆','酒楼'], answer:2, explanation:'茶馆默认解锁' },
  { id:'quiz_04', question:'精力上限初始是多少？', options:['10','15','20','25'], answer:2, explanation:'初始精力上限20' },
  { id:'quiz_05', question:'西域香料属于哪个商情货物？', options:['丝绸','西域香料','瓷器','药材'], answer:1, explanation:'西域香料基价200两' },
  { id:'quiz_06', question:'以下哪个路段收益倍率最高？', options:['江南','中原','西域','都一样'], answer:2, explanation:'西域×4.0' },
  { id:'quiz_07', question:'背包初始容量是多少格？', options:['8','10','12','16'], answer:2, explanation:'初始12格' },
  { id:'quiz_08', question:'化险符的效果是什么？', options:['回复体力','免疫负面事件','体力归零保留1点','增加精力'], answer:2, explanation:'体力归零时保留1点' },
  { id:'quiz_09', question:'店铺每10秒产出几次？', options:['1次','2次','3次','连续产出'], answer:0, explanation:'每10秒产出1次' },
  { id:'quiz_10', question:'粮铺的解锁条件是？', options:['声望500','银两2000','商途值300','无需解锁'], answer:1, explanation:'银两≥2000解锁粮铺' },
];
// ==================== 黑市配置（v2.2 步数刷新） ====================
const HEISHI_CONFIG = {
  inspectRate: 0.05, // 查抄率5%（进入）+ 购买时按购买次数累加
  inspectSilverLoss: 0.3, // 查抄损失30%当前银两
  inspectReputationBonus: 10, // 查抄后声望补偿
  priceMultiplierMin: 0.7, // 动态定价下限
  priceMultiplierMax: 1.5, // 动态定价上限
  slotsPerRefresh: 3, // 每次刷新3件商品
  forceRefreshCost: 5000, // 强制刷新商品：5000银两
  purchaseInspectStep: 0.10, // 每购买1件商品，下次查抄率 +10%
};

// ==================== 盐场投资配置（v2.2） ====================
const YANCHANG_CONFIG = {
  basePrice: 50000, // 基础价格50K
  priceIncrement: 0.20, // 每购买1个+20%
  baseOutput: 500, // 基础产出500银两/10s
  speeds: {
    slow:    { name:'慢速', icon:'🐢', multiplier:1.0, riskPerMin:1 },
    medium:  { name:'中速', icon:'🚶', multiplier:1.5, riskPerMin:2 },
    fast:    { name:'快速', icon:'🏃', multiplier:2.0, riskPerMin:3 },
    extreme: { name:'极速', icon:'⚡', multiplier:3.0, riskPerMin:5 },
  },
  riskDecayPerMin: 2, // 慢速时风险每分钟-2%
  stopDecayPerMin: 5, // 停止时风险每分钟-5%
  riskMax: 100, // 风险值上限100%
  abandonRecoveryRate: 0.50, // 收手退出回收50%购买费
  saltFieldLimits: [
    { maxRep: 299,  limit: 0 },
    { maxRep: 499,  limit: 1 },
    { maxRep: 799,  limit: 2 },
    { maxRep: 1199, limit: 3 },
    { maxRep: Infinity, limit: 4 },
  ],
  unlockReputation: 300,
  unlockPrestige: 1,
};

// ==================== 终局供奉配置（v2.2） ====================
const GONGFENG_CONFIG = {
  tiers: [
    { id:'xiao', name:'小奉', icon:'🕯️', silverCost: 1000000,   legacyGain: 10 },
    { id:'zhong', name:'中奉', icon:'🎋', silverCost: 5000000,   legacyGain: 60 },
    { id:'da', name:'大奉', icon:'🏮', silverCost: 20000000,  legacyGain: 300 },
    { id:'ju', name:'巨奉', icon:'🏯', silverCost: 100000000, legacyGain: 2000 },
  ],
  npcName: '商神',
  npcIcon: '🏛️',
};

// ==================== 声望幸运加成配置（v2.2） ====================
const LUCK_CONFIG = {
  reputationPerLuck: 100, // 每100声望+1%幸运
  maxLuckBonus: 0.10, // 上限+10%
};

// ==================== 声望里程碑庆典（v2.2） ====================
const MILESTONE_REWARDS = [
  { reputation: 100,  silver: 10000,   title: '小有名气' },
  { reputation: 300,  silver: 50000,   title: '声名鹊起' },
  { reputation: 500,  silver: 200000,  title: '名震一方' },
  { reputation: 1000, silver: 1000000, title: '富甲天下' },
];

// ==================== 道具-店铺绑定表（v2.3） ====================
const ITEM_SHOP_BINDING = {
  jinchuangyao: 'grainstore',
  renshen: 'yaopu',
  lingzhi: 'yaopu',
  xingshentang: 'teahouse',
  qingxinwan: 'yaopu',
  xingyunfu: 'clothshop',
  fuxinggaozhaofu: 'jiulou',
  hushenfu: 'biaoju',
  huichengjuanzhou: 'biaoju',
  qiannianrenshen: 'yaopu',
  juqidan: 'yaopu',
};

const DAILY_MARKET_GOODS = [
  { id:'silk',       name:'丝绸',     icon:'🧵', basePrice:100, volatility:0.40 },
  { id:'tea',        name:'茶叶',     icon:'🍵', basePrice:80,  volatility:0.30 },
  { id:'porcelain',  name:'瓷器',     icon:'🏺', basePrice:120, volatility:0.50 },
  { id:'grain',      name:'粮食',     icon:'🌾', basePrice:50,  volatility:0.20 },
  { id:'herb',       name:'药材',     icon:'🌿', basePrice:90,  volatility:0.35 },
  { id:'silkroad',   name:'西域香料', icon:'🕌', basePrice:200, volatility:0.60 },
  { id:'salt',       name:'青盐',     icon:'🧂', basePrice:60,  volatility:0.25 },
  { id:'wine',       name:'美酒',     icon:'🍶', basePrice:110, volatility:0.35 },
  { id:'timber',     name:'木材',     icon:'🪵', basePrice:140, volatility:0.40 },
  { id:'lacquerware',name:'漆器',     icon:'🏮', basePrice:180, volatility:0.45 },
  { id:'jade',       name:'璞玉',     icon:'💎', basePrice:300, volatility:0.60 },
  { id:'horse',      name:'良驹',     icon:'🐎', basePrice:400, volatility:0.55 },
];

// ==================== 成就定义 ====================
const ACHIEVEMENTS = [
  { id:'first_travel',    name:'初入商途',   desc:'完成首次行进',               icon:'🚩', condition:{type:'totalTravels',value:1},            reward:{silver:50} },
  { id:'first_round',     name:'初战告捷',   desc:'完成首轮商途',               icon:'🏆', condition:{type:'totalRounds',value:1},             reward:{item:'jinchuangyao',qty:3} },
  { id:'travel_50',       name:'行商老手',   desc:'累计行进50次',               icon:'🐫', condition:{type:'totalTravels',value:50},           reward:{item:'renshen',qty:2} },
  { id:'travel_100',      name:'商途行者',   desc:'累计行进100次',              icon:'🎯', condition:{type:'totalTravels',value:100},          reward:{item:'xingshentang',qty:3} },
  { id:'travel_500',      name:'江湖常客',   desc:'累计行进500次',              icon:'🗡️', condition:{type:'totalTravels',value:500},          reward:{item:'lingzhi',qty:1} },
  { id:'silver_1000',     name:'小有积蓄',   desc:'累计赚取1000银两',           icon:'💰', condition:{type:'totalSilverEarned',value:1000},     reward:{silver:200} },
  { id:'silver_10000',    name:'富甲一方',   desc:'累计赚取10000银两',          icon:'💎', condition:{type:'totalSilverEarned',value:10000},    reward:{item:'xianluyin',qty:1} },
  { id:'reputation_100',  name:'德高望重',   desc:'声望达到100',                icon:'👑', condition:{type:'reputation',value:100},             reward:{item:'shangtujinnang',qty:1} },
  { id:'stamina_zero_3',  name:'绝处逢生',   desc:'体力归零3次',                icon:'💀', condition:{type:'staminaZeroCount',value:3},         reward:{item:'huaxianfu',qty:1} },
  { id:'shangtu_500',     name:'进军中原',   desc:'商途值达到500',              icon:'🗺️', condition:{type:'shangtu',value:500},                reward:{silver:300} },
  { id:'shangtu_2000',    name:'远征西域',   desc:'商途值达到2000',             icon:'🏜️', condition:{type:'shangtu',value:2000},               reward:{item:'fengshuiluopan',qty:1} },
  { id:'shop_lv50',       name:'店铺大亨',   desc:'店铺总等级达50',             icon:'🏪', condition:{type:'totalShopLevel',value:50},          reward:{item:'qiannianrenshen',qty:1} },
  { id:'first_prestige',  name:'涅槃重生',   desc:'首次完成声望重置',           icon:'🔥', condition:{type:'prestigeCount',value:1},            reward:{item:'shanglutongdie',qty:1} },
  { id:'rumor_10',        name:'江湖百晓生', desc:'收集10个传闻碎片',           icon:'📖', condition:{type:'rumorsCollected',value:10},         reward:{item:'xianluyin',qty:1} },
  { id:'offline_8h',      name:'离线达人',   desc:'单次离线满8小时',            icon:'😴', condition:{type:'maxOfflineHours',value:8},          reward:{silver:500} },
  { id:'stone_king',      name:'赌石之王',   desc:'集齐帝王绿翡翠与和田羊脂白玉', icon:'✨', condition:{type:'stoneCollectionsAll',value:1},         reward:{item:'shanglutongdie',qty:1} },
];

// ==================== 传闻碎片 ====================
const RUMOR_FRAGMENTS = [
  { id:'rumor_01', title:'江南织造', fragments:5, story:'江南织造府曾为皇室专供丝绸，后因战乱流落民间。传闻其秘传的织法图谱藏在某处古宅之中...' },
  { id:'rumor_02', title:'西域宝藏', fragments:4, story:'西域大漠深处有座被遗忘的古城，据说埋藏着丝绸之路商队的无尽财富。不过，去过的人都没有回来...' },
  { id:'rumor_03', title:'茶圣遗书', fragments:3, story:'茶圣陆羽晚年曾留下一本从未公开的手稿，记载了失传的制茶秘法。茶商们世代追寻，却无人得见真容...' },
  { id:'rumor_04', title:'江湖第一镖', fragments:4, story:'十年前，天下第一镖局押送一批神秘货物失踪于中原。镖局自此倒闭，那批货至今下落不明...' },
  { id:'rumor_05', title:'药王谷传说', fragments:3, story:'传说在蜀地深山之中，有一处与世隔绝的药王谷，谷中灵药千年不老。只是入口变幻莫测...' },
  { id:'rumor_06', title:'商帝宝藏', fragments:5, story:'明末富可敌国的沈万三，传说在抄家前将一半家产藏于地下。后人世代寻宝，只留下一张残缺的藏宝图...' },
];

// ==================== 每日签到奖励 ====================
const DAILY_REWARDS = [
  { day:1, rewards:{item:'jinchuangyao',qty:2},                    desc:'金创药×2' },
  { day:2, rewards:{item:'xingshentang',qty:1},                   desc:'醒神汤×1' },
  { day:3, rewards:{item:'xingyunfu',qty:1,silver:100},           desc:'幸运符×1 + 银两100' },
  { day:4, rewards:{item:'jinchuangyao',qty:3,item2:'xingshentang',qty2:1}, desc:'金创药×3 + 醒神汤×1' },
  { day:5, rewards:{item:'jixingling',qty:1,silver:200},          desc:'急行令×1 + 银两200' },
  { day:6, rewards:{item:'renshen',qty:1,item2:'qingxinwan',qty2:1}, desc:'人参×1 + 清心丸×1' },
  { day:7, rewards:{item:'lingzhi',qty:1,item2:'fuxinggaozhaofu',qty2:1}, desc:'灵芝×1 + 福星高照符×1 (周大奖)' },
];

// ==================== 伪装类型 ====================
const DISGUISE_TYPES = {
  excel: { name:'Excel表格', icon:'📊' },
  notepad: { name:'记事本', icon:'📝' },
  vscode: { name:'代码编辑器', icon:'💻' },
  email: { name:'邮件客户端', icon:'📧' },
};

// ==================== 事件池（30个，含C选项） ====================
const EVENT_POOL = [
  // === 原有15个事件（5个增加C选项） ===
  {
    id:'tea_merchant', title:'路遇茶商', icon:'🍵', category:'trade',
    description:'行至山间凉亭，一位茶商正在歇脚，篓中龙井香气四溢。他笑道："客官，我这上好的龙井，八十两银子一包，带到下个城镇能卖两倍价钱。要进点货吗？"',
    options:[
      { text:'买下龙井', effects:{silver:-80}, gains:{silver:{min:150,max:200}}, result:'你花80两买下龙井茶，到了下个城镇果然卖了好价钱，赚了{value}两！' },
      { text:'婉拒赶路', effects:{}, result:'你婉拒了茶商，继续赶路。商人叹道："可惜了这好茶。"' },
    ],
  },
  {
    id:'bandit_block', title:'山贼拦路', icon:'⚔️', category:'risk',
    description:'前方山路狭窄处，几个手持刀斧的山贼拦住去路，为首者喝道："此路是我开，要想从此过，留下买路财！"',
    options:[
      { text:'破财消灾', effects:{silver:-50}, result:'你咬牙递上50两银子，山贼眉开眼笑让开道路。' },
      { text:'拼死一搏🎲', gamble:{winChance:0.5,winEffects:{reputation:8},loseEffects:{stamina:-30}}, result_win:'你怒喝一声，山贼被你的气势吓退！声望+8！', result_lose:'你冲上前去，寡不敌众，体力-30。' },
    ],
    itemOption: { item:'hushenfu', text:'🛡️使用护身符', result:'你出示护身符，山贼忌惮退去，无任何损失。' },
  },
  {
    id:'charity_porridge', title:'施粥棚前', icon:'🥣', category:'investment',
    description:'路过一座小城，城门口设着施粥棚，几个饥民排队领粥。棚主拱手道："掌柜的，可否行个方便？"',
    options:[
      { text:'慷慨解囊', effects:{silver:-30,reputation:8}, result:'你拿出30两银子，饥民感激涕零。声望+8！' },
      { text:'路过不停', effects:{}, result:'你匆匆走过，心里有些不是滋味。' },
    ],
  },
  {
    id:'temple_fortune', title:'古寺问签', icon:'🔮', category:'gamble',
    description:'山路转角出现一座古寺，老和尚手持签筒，微笑道："施主，抽一支签吧。"',
    options:[
      { text:'求签问卦🎲', gamble:{winChance:0.7,winEffects:{nextTravelBonus:2},loseEffects:{nextTravelBonus:0.5}}, result_win:'上上签！接下来收益翻倍！', result_lose:'下下签，接下来收益减半。' },
      { text:'不信此道', effects:{reputation:2}, result:'你婉拒了老和尚。' },
    ],
    itemOption: { item:'xingyunfu', text:'🎲使用幸运符', result:'你暗中使用幸运符求签，果然得上上签！接下来的商途收益×2！', forceWin:true },
  },
  {
    id:'partner_invite', title:'同行邀约', icon:'🤝', category:'cooperation',
    description:'另一支商队的掌柜主动搭话："这位掌柜，前面路途凶险，不如结伴而行？我认识一条近路，但需要50两打点驿站。"',
    options:[
      { text:'合伙同行', effects:{silver:-50}, gains:{shangtu:30,silver:{min:30,max:60}}, result:'你们结伴抄了近路，商途值+30！' },
      { text:'独自前行', effects:{}, result:'你婉拒了邀约。' },
    ],
  },
  {
    id:'official_check', title:'官差盘查', icon:'📜', category:'risk',
    description:'城门守卫拦住去路："站住！最近盗匪猖獗，有过路文书吗？"',
    options:[
      { text:'银两"通融"', effects:{silver:-80}, gains:{shangtu:20}, result:'你悄悄塞给官差80两，商途值+20。' },
      { text:'据理力争', gamble:{winChance:0.4,winEffects:{reputation:10},loseEffects:{silver:-120,stamina:-15}}, result_win:'你据理力争，乖乖放行。声望+10！', result_lose:'官差大怒，罚款120两。体力-15。' },
    ],
  },
  {
    id:'doctor_visit', title:'名医坐诊', icon:'🏥', category:'recovery',
    description:'镇口告示："京城名医李大夫今日坐诊，诊金50两。"',
    options:[
      { text:'请名医诊治', effects:{silver:-50,stamina:25}, result:'李大夫妙手回春。体力+25！' },
      { text:'忍忍继续走', effects:{}, result:'你觉得50两太贵，忍忍。' },
    ],
  },
  {
    id:'gambling_den', title:'赌坊诱惑', icon:'🎰', category:'gamble',
    description:'路过繁华街市，一家赌坊灯火通明。龟奴谄媚道："掌柜的，进来玩两把？"',
    options:[
      { text:'赌一把大的🎲', gamble:{winChance:0.3,winEffects:{silver_multiply:1.5},loseEffects:{silver:-100}}, result_win:'你手气爆棚！银两翻倍！', result_lose:'你输得精光，还搭进去100两。' },
      { text:'不屑一顾', effects:{reputation:3}, result:'你冷哼一声离开，旁人称赞。声望+3。' },
      { text:'🏯 前往赌坊', effects:{}, result:'你决定去赌坊碰碰运气！', jumpTo:'dufang' },
    ],
    itemOption: { item:'xingyunfu', text:'🎲使用幸运符', result:'你暗中使用幸运符，赌运亨通！胜率提升至70%！', forceWinChance:0.7 },
  },
  {
    id:'drowning_scholar', title:'落水书生', icon:'🌊', category:'moral',
    description:'河边传来呼救声，一个书生失足落水，正在水中挣扎。',
    options:[
      { text:'跳河救人', effects:{stamina:-20,reputation:12}, result:'你奋不顾身救起书生。体力-20，声望+12！' },
      { text:'扔绳搭救', effects:{silver:-10,reputation:5}, result:'你解下缰绳扔过去。银两-10，声望+5。' },
    ],
    itemOption: { item:'jinchuangyao', text:'💊使用金创药救治', result:'你用金创药为书生止血，他感激涕零。体力不损，声望+15！', overrideEffects:{reputation:15} },
  },
  {
    id:'market_rumor', title:'市集传闻', icon:'📢', category:'info',
    description:'茶摊上客商们议论纷纷："听说下个城镇的丝绸价格暴涨三倍！"',
    options:[
      { text:'相信传闻囤货', effects:{silver:-100}, gamble:{winChance:0.55,winEffects:{silver:180},loseEffects:{silver:-50}}, result_win:'消息是真的！净赚180两！', result_lose:'消息是假的，净亏50两。' },
      { text:'不信谣言', effects:{reputation:1}, result:'你不为所动，继续赶路。' },
    ],
  },
  {
    id:'storm_coming', title:'暴风雨至', icon:'⛈️', category:'environment',
    description:'天色骤变，暴雨将至。大路绕远安全，山间近路危险但省时间。',
    options:[
      { text:'绕行大路', effects:{stamina:-5}, gains:{shangtu:10}, result:'你绕行大路，一路平安。商途值+10。' },
      { text:'冒雨走近路', effects:{stamina:-20}, gains:{shangtu:25}, result:'你冒雨抄近路。商途值+25，体力-20。' },
    ],
    itemOption: { item:'jixingling', text:'📜使用急行令赶路', result:'你趁风雨赶路，急行令加持！商途值×3获取！', forceBoost:3 },
  },
  {
    id:'beggar_gift', title:'乞丐赠予', icon:'💎', category:'trade',
    description:'路边一个老乞丐叫住你："掌柜的，这个玉佩抵给你换20两银子。"',
    options:[
      { text:'给钱不拿玉佩', effects:{silver:-20,reputation:6}, result:'老乞丐感动落泪。声望+6。' },
      { text:'收下玉佩', effects:{silver:-20}, gamble:{winChance:0.6,winEffects:{silver:80}}, result_win:'古董商认出前朝古玉，80两收购！', result_lose:'不过是一块普通石头。' },
    ],
  },
  {
    id:'business_rival', title:'同行竞价', icon:'⚡', category:'strategy',
    description:'客栈中另一位掌柜挑衅道："前面镇上有一批好货，价高者得！"',
    options:[
      { text:'高价竞拍', effects:{silver:-120}, gamble:{winChance:0.5,winEffects:{silver:200,reputation:5},loseEffects:{silver:-40}}, result_win:'你抢到好货，赚了200两！声望+5！', result_lose:'对手出价更高，亏了40两。' },
      { text:'放弃竞价', effects:{reputation:1}, result:'你退出竞价，保持风度。' },
    ],
  },
  {
    id:'old_friend', title:'故人重逢', icon:'🍶', category:'story',
    description:'街角有人喊你，竟是多年老伙计！他已是镇上富商。',
    options:[
      { text:'把酒言欢', effects:{stamina:10,reputation:3}, result:'你们叙旧到深夜。体力+10，声望+3。' },
      { text:'借机谈生意', effects:{silver:60,reputation:-2}, result:'你推销货物，赚了60两，但他有些不快。声望-2。' },
    ],
  },
  {
    id:'crossroads', title:'迷路岔口', icon:'🔀', category:'exploration',
    description:'走到三岔路口，路牌斑驳不清。左边平坦大道，右边幽深小路。',
    options:[
      { text:'走平坦大道', gains:{shangtu:10}, result:'一路顺畅。商途值+10。' },
      { text:'探索幽深小路', gamble:{winChance:0.5,winEffects:{silver:50,shangtu:20},loseEffects:{stamina:-15}}, result_win:'小路通向隐秘集市！银两+50，商途值+20！', result_lose:'小路尽头是沼泽，绕了好久。体力-15。' },
    ],
  },

  // === 新增15个事件 ===
  {
    id:'herb_merchant', title:'路遇药商', icon:'🏥', category:'trade',
    description:'山间凉亭，一位药商竹篓里装满了各色药材。"客官，上好的人参、灵芝，市价七折优惠！"',
    options:[
      { text:'买人参(-100)', effects:{silver:-100}, itemReward:{id:'renshen',qty:1}, result:'你以优惠价买下人参，比药铺便宜50两！获得人参×1。' },
      { text:'买灵芝(-300)', effects:{silver:-300}, itemReward:{id:'lingzhi',qty:1}, result:'你以优惠价买下灵芝，比药铺便宜100两！获得灵芝×1。' },
      { text:'婉拒赶路', effects:{}, result:'你婉拒了药商继续赶路。' },
    ],
  },
  {
    id:'black_market', title:'黑市商人', icon:'🌑', category:'rare',
    description:'夜色渐浓，巷口蒙面人低声道："客官，有些稀罕物件，别处买不到的……"',
    options:[
      { text:'买仙露饮(-500)', effects:{silver:-500}, itemReward:{id:'xianluyin',qty:1}, result:'你买下仙露饮，这可是药铺不卖的珍品！获得仙露饮×1。' },
      { text:'买福星高照符(-250)', effects:{silver:-250}, itemReward:{id:'fuxinggaozhaofu',qty:1}, result:'你买下福星高照符，下3次收益×1.5！' },
      { text:'买化险符(-500)', effects:{silver:-500}, itemReward:{id:'huaxianfu',qty:1}, result:'你买下化险符，体力归零保护一次！' },
    ],
  },
  {
    id:'wandering_monk', title:'神秘行脚僧', icon:'🧘', category:'rare',
    description:'身披袈裟的行脚僧拦住去路，合十道："施主与我佛有缘，有件宝物相赠，但需以银两结缘。"',
    options:[
      { text:'结缘护身符(-100)', effects:{silver:-100}, itemReward:{id:'hushenfu',qty:1}, result:'行脚僧赠你护身符一件。下次负面事件免疫！' },
      { text:'结缘商路通牒(-2500)', effects:{silver:-2500}, itemReward:{id:'shanglutongdie',qty:1}, result:'行脚僧递给你商路通牒，比市价便宜500两！永久商途上限+50！' },
      { text:'婉拒(声望+2)', effects:{reputation:2}, result:'你婉拒了行脚僧，他微笑道："缘起缘灭，皆有定数。"声望+2。' },
    ],
  },
  {
    id:'antique_stall', title:'古董摊主', icon:'🏺', category:'gamble',
    description:'街角老者摆着古董摊，几个落满灰尘的锦盒。"每个盒子里都有宝贝，三百两开一个，碰碰运气？"',
    options:[
      { text:'开一个锦盒🎲(-300)', effects:{silver:-300}, gamblePack:{pools:[
        {chance:0.30,item:{id:'jinchuangyao',qty:3},text:'金创药×3'},
        {chance:0.25,item:{id:'xingshentang',qty:2},text:'醒神汤×2'},
        {chance:0.20,item:{id:'xingyunfu',qty:2},text:'幸运符×2'},
        {chance:0.15,item:{id:'jixingling',qty:1},text:'急行令×1'},
        {chance:0.07,item:{id:'qiannianrenshen',qty:1},text:'🎉千年人参×1'},
        {chance:0.03,item:{id:'juqidan',qty:1},text:'🌟聚气丹×1'},
      ]}, result:'你小心翼翼地打开锦盒...' },
      { text:'全买下(-1500)', effects:{silver:-1500}, itemRewards:[
        {id:'jinchuangyao',qty:3},{id:'xingshentang',qty:2},{id:'xingyunfu',qty:2},
        {id:'jixingling',qty:1},{id:'qiannianrenshen',qty:1},{id:'juqidan',qty:1},
      ], result:'你大手一挥全买下了！六折购入，物超所值！' },
      { text:'不感兴趣', effects:{}, result:'你看了看，摇摇头离开了。' },
    ],
  },
  {
    id:'station_supply', title:'驿站补给', icon:'🏚️', category:'supply',
    description:'商队行至驿站，驿卒热情招呼："客官一路辛苦，驿站备有常用物资，价格公道！"',
    options:[
      { text:'补给金创药×3(-120)', effects:{silver:-120}, itemReward:{id:'jinchuangyao',qty:3}, result:'你补给金创药3份，比粮铺便宜30两！' },
      { text:'补给醒神汤×2(-160)', effects:{silver:-160}, itemReward:{id:'xingshentang',qty:2}, result:'你补给醒神汤2份，比茶馆便宜40两！' },
      { text:'补给回城卷轴(-80)', effects:{silver:-80}, itemReward:{id:'huichengjuanzhou',qty:1}, result:'你补给回城卷轴1份，比镖局便宜20两！' },
    ],
    guaranteeOncePerRound: true,
  },
  {
    id:'flood_bridge', title:'桥梁冲毁', icon:'🌊', category:'environment',
    description:'连日暴雨冲毁了前方的桥梁，要过河只能绕远路或涉水冒险。',
    options:[
      { text:'绕远路(体力-10)', effects:{stamina:-10}, gains:{shangtu:15}, result:'你绕行远路，虽然多费体力但安全。商途值+15。' },
      { text:'涉水冒险🎲', gamble:{winChance:0.5,winEffects:{shangtu:30,silver:30},loseEffects:{stamina:-25,silver:-20}}, result_win:'你成功渡河，还发现河对岸的隐秘集市！', result_lose:'河水湍急，你损失了一些货物。' },
    ],
  },
  {
    id:'poet_encounter', title:'偶遇诗仙', icon:'✒️', category:'story',
    description:'酒楼上一位白衣书生正对月独酌，见你上楼，拱手道："相逢即是缘，不如对诗一首？"',
    options:[
      { text:'欣然对诗', effects:{reputation:5}, gamble:{winChance:0.6,winEffects:{reputation:8},loseEffects:{reputation:-1}}, result_win:'你对出了绝妙之句，书生大喜！声望+13！', result_lose:'诗句平庸，书生摇头。声望+4。' },
      { text:'敬酒结交', effects:{silver:-20,reputation:3}, result:'你敬酒结交，相谈甚欢。银两-20，声望+3。' },
    ],
  },
  {
    id:'hawker_bargain', title:'小贩砍价', icon:'💬', category:'trade',
    description:'街边小贩热情招呼："掌柜的，这批西域来的玛瑙手串，原价100两，看你有缘——你出个价？"',
    options:[
      { text:'出价60两', effects:{silver:-60}, gamble:{winChance:0.5,winEffects:{silver:80},loseEffects:{}}, result_win:'小贩一跺脚："成交！"你转手卖了140两！', result_lose:'小贩翻白眼："掌柜的真会砍价..."不卖。' },
      { text:'原价购买', effects:{silver:-100}, gains:{silver:{min:120,max:150}}, result:'你按原价买下，到城里一转手赚了差价！' },
    ],
  },
  {
    id:'fortune_teller', title:'算命先生', icon:'🔮', category:'info',
    description:'街角算命先生摇着蒲扇："客官留步！看你印堂发亮，近日必有财运——但有个劫数需化..."',
    options:[
      { text:'请他指点(银两-50)', effects:{silver:-50}, gains:{nextTravelBonus:2}, result:'算命先生掐指一算，给你指了一条路。下次行进收益×2！' },
      { text:'不信邪', effects:{}, gamble:{winChance:0.3,winEffects:{reputation:2},loseEffects:{stamina:-10}}, result_win:'你大步走过，平安无事。', result_lose:'刚走两步撞上柱子...体力-10。' },
    ],
  },
  {
    id:'merchant_guild', title:'商会招揽', icon:'🏛️', category:'cooperation',
    description:'当地商会会长亲自迎接："掌柜的，加入我们商会吧！会员费200两，但以后进货都有折扣。"',
    options:[
      { text:'加入商会', effects:{silver:-200}, gains:{shopOutputBoost:0.15,shangtu:25}, result:'你加入商会，店铺产出永久+15%！商途值+25。' },
      { text:'婉拒', effects:{}, result:'你婉拒了会长，他有些失望。' },
    ],
  },
  {
    id:'thief_chase', title:'小贼扒窃', icon:'🏃', category:'risk',
    description:'人群中突然有人撞了你一下——钱袋不见了！回头一看，一个小贼正拔腿狂奔。',
    options:[
      { text:'追赶小贼', effects:{stamina:-10}, gamble:{winChance:0.6,winEffects:{silver:80,reputation:5},loseEffects:{silver:-50}}, result_win:'你追上小贼夺回钱袋，还发现他偷的别的东西！', result_lose:'小贼跑得太快，追丢了。丢了50两。' },
      { text:'自认倒霉', effects:{silver:-40}, result:'你自认倒霉，损失了40两。以后要多加小心。' },
    ],
  },
  {
    id:'tea_competition', title:'斗茶大赛', icon:'🍵', category:'strategy',
    description:'镇上正在举办斗茶大赛，冠军可得丰厚赏金！参赛费30两。',
    options:[
      { text:'报名参赛🎲', effects:{silver:-30}, gamble:{winChance:0.4,winEffects:{silver:150,reputation:10},loseEffects:{}}, result_win:'你的茶艺惊艳全场，夺得冠军！银两+150，声望+10！', result_lose:'饮茶品鉴环节失利，未获名次。' },
      { text:'观战学习', effects:{reputation:1}, result:'你在一旁观战，学了不少茶艺。声望+1。' },
    ],
  },
  {
    id:'caravan_rest', title:'商队休整', icon:'⛺', category:'recovery',
    description:'前方有处商队营地，篝火旁几个商人正在休息。这里可以免费扎营休整一番。',
    options:[
      { text:'扎营休息', effects:{stamina:15}, result:'你在营地休息了一会儿，体力恢复15点。篝火旁还听到了一些商路趣闻。' },
      { text:'抓紧赶路', gains:{shangtu:8}, result:'你决定继续赶路，商途值+8。天色不早了。' },
    ],
  },
  {
    id:'mysterious_box', title:'神秘木匣', icon:'📦', category:'exploration',
    description:'路边草丛里有个上锁的木匣，上面刻着奇怪的符文。看起来有些年头了。',
    options:[
      { text:'撬开看看🎲', gamble:{winChance:0.4,winEffects:{silver:100,reputation:3},loseEffects:{stamina:-10}}, result_win:'木匣里装着一袋古银币和一张泛黄的地图！银两+100！', result_lose:'木匣机关弹出一根针，扎到了手。体力-10。' },
      { text:'交给官府', effects:{reputation:5}, result:'你将木匣上交官府，获得嘉奖。声望+5。' },
    ],
  },
  {
    id:'rain_shelter', title:'避雨茅屋', icon:'🏠', category:'story',
    description:'突然下起大雨，路边有座废弃茅屋。推门进去，发现里面住着一位避雨的老者。',
    options:[
      { text:'与老者攀谈', effects:{reputation:2}, gains:{shangtu:5}, result:'老者原来是位退休的老掌柜，与你分享了许多经商之道。商途值+5。' },
      { text:'等雨停就走', effects:{}, result:'你在屋里等了片刻，雨停后继续赶路。' },
    ],
  },
];

// ==================== 日志模板 ====================
const LOG_TEMPLATES = {
  travelStart: '商队启程，踏上新的商途...',
  outingEnter: '🏯 前往{name}，体力-{stamina}。',
  outingStaminaWarn: '⚠️ 体力仅剩1点！再次外出将会死亡！',
  outingStaminaDeath: '💀 外出途中体力耗尽，掌柜倒下了...游戏结束！',
  travelEnd_event: '行至半途，前方有人影晃动——',
  roundComplete: '本轮商途圆满结束！获得完成奖励：商途值+50，银两+30！',
  staminaZero: '体力耗尽，商队不得不在驿站休整。本轮商途结束。',
  energyEmpty: '今日精力已尽，掌柜的需要休息。',
  offlineReturn: '掌柜归来！离线期间，你的店铺赚了 {silver} 两银子！',
  achievementUnlock: '🏆 成就解锁：{name}！',
  rumorFound: '📖 发现传闻碎片：{name} ({collected}/{total})',
  rumorComplete: '📚 传闻收集完成：{name}！',
  prestigeComplete: '🔥 声望重置成功！获得 {legacy} 传承点，全店铺产出永久+{percent}%！',
  shangtuCapReached: '本轮商途值已达软上限，后续收益降低。',
  dailyReward: '📅 登录奖励：第{day}天——{desc}！',
  marketUpdate: '📊 商情已刷新！',
  marketRefresh: '📊 商情刷新：距离上次已过 {hours} 小时，行情已更新！',
  commodityBuy: '🛒 买入 {icon}{name} ×{qty}，花费 {cost} 银两',
  commoditySell: '💰 卖出 {icon}{name} ×{qty}，获利 {income} 银两',
  commodityNotEnough: '库存不足，无法卖出！',
  itemSell: '💸 出售道具 {icon}{name} ×{qty}，获利 {income} 银两',
  notEnoughSilver: '银两不足！',
  // v2.0 新增
  banquetComplete: '🍶 在酒楼设{name}，宾客尽欢！{rewards}',
  banquetLimit: '今日已宴请，明日再来！',
  banquetNoSilver: '银两不足，无法设宴！',
  marketFeeNote: '(含15%手续费)',
  cargoFull: '货物持有已达上限{max}个！',
  backpackNeedReputation: '声望不足！扩容需声望 {need}（当前：{current}）',
  // v2.1 新增
  yiguanHeal: '🏥 在回春堂接受诊治，体力+{stamina}！（花费{cost}银两）',
  yiguanLimit: '今日诊治次数已用完，明日再来！',
  yiguanNoSilver: '银两不足，无法就诊！',
  yujieEvent: '🏛️ 御街：{title}',
  dufangDiceWin: '🎲 骰子开出了{result}！你猜{guess}，赢了{win}银两！',
  dufangDiceLose: '🎲 骰子开出了{result}，你猜{guess}，输了{bet}银两。',
  dufangLimit: '今日赌坊次数已用完（{limit}次/天），明儿再来！',
  dufangStoneResult: '💎 切开原石（{tier}），获得：{quality}！价值{value}倍 = {silver}银两',
  dufangStonePity: '🌟 保底触发！连续{count}次未出良品，本次品质概率提升！',
  dufangQuizCorrect: '🎯 竞猜正确！{explanation}，获得{amount}银两！',
  dufangQuizWrong: '❌ 竞猜错误。正确答案是：{answer}。{explanation}',
  dufangQuizLimit: '今日竞猜已参与，明天再来！',
  heishiEnter: '🌑 消耗黑市令×1，进入了地下黑市...',
  heishiNoToken: '需要黑市令才能进入地下黑市！',
  heishiBuy: '🌑 黑市购入：{icon}{name}，花费{cost}银两',
  heishiInspect: '🚨 黑市被查抄！损失了{loss}银两，但也获得了{rep}声望的官方补偿。',
  heishiRefresh: '🌑 地下黑市已刷新，新货上架！',
  // v2.2 新增
  yanchangBuy: '🧂 你暗中买下一处私盐盐田，开始秘密开采。',
  yanchangConfiscated: '🚨 官府查获了你的私盐盐田！盐田被没收，投入尽数化为泡影。',
  yanchangAbandon: '🧂 你果断收手，遣散盐工，销毁痕迹。回收了{silver}银两。',
  yanchangCollect: '🧂 盐田产出已领取：{silver}银两。',
  yanchangSpeedChange: '🧂 盐场速度已调整为{name}。',
  yanchangRiskWarning: '⚠️ 盐田查封风险已达{risk}%，建议尽快收手！',
  gongfengSuccess: '🏛️ 向商神供奉{tier}，消耗{silver}银两，获得{legacy}传承点！',
  gongfengNoSilver: '银两不足，无法供奉！',
  gongfengNotUnlocked: '供奉系统需全部店铺达到Lv.100后解锁！',
  dufangAntiAddiction: '😴 今日赌坊累计亏损已达上限，强制冷却{hours}小时。',
  dufangConsecutiveLoss: '😅 今日手气不佳，连输{count}次，歇歇吧。',
  milestoneCelebration: '🎉 声望里程碑达成——{title}！获得{silver}银两庆典奖励！',
  luckBonusInfo: '🍀 声望幸运加成：+{percent}%',
  // v2.3 新增
  businessFlash: '✨ 商机闪现！接下来30秒店铺产出翻倍！',
  shopSold: '💸 变卖{shopName}，回收{silver}银两（回收率{rate}%）。',
  shopSellCooldown: '该店铺变卖冷却中，还需等待{hours}小时。',
  activityFull: '🟢 活跃度：全效产出',
  activityNormal: '🟡 活跃度：产出70%（已挂机{min}分钟）',
  activityLow: '🔴 活跃度：产出50%（已挂机{min}分钟）',
  // v2.3 燃烧精血
  burnBlood: '🩸 燃烧精血：消耗{stamina}点体力，获得{silver}银两！',
  burnBloodNotEnough: '体力不足，无法燃烧精血！',
  burnBloodMaxExceed: '超出剩余可燃烧上限！',
  gameOverBurn: '💀 燃烧精血过度，体力枯竭，掌柜倒下了...游戏结束！',
  gameOverOutingDesc: '外出奔波耗尽了最后一丝体力，掌柜倒在了途中...',
  burnBloodLifetimeExceed: '🩸 整局游戏最多燃烧100点精血，已达上限！',
  gameOverTitle: '游戏结束',
  gameOverDesc: '燃烧精血耗尽了最后一丝体力，掌柜的倒在了商铺中...',
  // v2.4 聚宝阁
  auctionUnlock: '🏛️ 声望达到300，聚宝阁的大门为你敞开！',
  auctionRefreshed: '🏛️ 聚宝阁新拍品已上架！',
  auctionBuy: '🏛️ 购得「{name}」，花费{price}🪙',
  auctionNoSilver: '银两不足，无法购买此拍品！',
  auctionSold: '该拍品已售出',
  auctionBagFull: '背包已满，无法购买！',
  auctionHeishiTokenBuy: '🏛️ 聚宝阁购入{quantity}个黑市令，花费{price}🪙',
  auctionHeishiTokenLimit: '本轮限购{max}个',
  auctionForceRefresh: '🏛️ 花费10万🪙强制刷新拍品！',
  auctionForceRefreshLimit: '今日强制刷新次数已用完（{limit}次/天）',
  auctionForceRefreshNoSilver: '银两不足10万，无法强制刷新',
  auctionImperialDecreeBlock: '📜 御前圣令护体，查封免疫！',
  auctionDeathMedalBlock: '🏅 免死金牌护体，逢凶化吉！体力恢复至10。',
  auctionProtectionMax: '该保护道具已达持有上限',
};
