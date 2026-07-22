/**
 * 《掌柜偷闲录》- 游戏引擎核心 (v1.1 P1全量)
 * 管理：资源、精力、核心循环、店铺、背包道具、Prestige、商情、传闻、成就、存档、路段、伪装
 */

class GameEngine {
  constructor() {
    this.state = {
      // 核心资源
      resources: {
        silver: GAME_CONFIG.initialSilver,
        reputation: GAME_CONFIG.initialReputation,
        stamina: GAME_CONFIG.initialStamina,
        shangtu: GAME_CONFIG.initialShangtu,
        staminaMax: RESOURCES.stamina.max,
      },
      // 精力
      energy: {
        current: GAME_CONFIG.maxEnergy,
        max: GAME_CONFIG.maxEnergy,
        lastRecoveryTime: Date.now(),
      },
      // 店铺
      shops: {},
      // 商途
      journey: {
        active: false,
        progress: 0,
        travelTimer: null,
        currentEvent: null,
        nextTravelBonus: 1,
        travelBonusRounds: 0,
        incomeBoost: 1,
        incomeBoostRounds: 0,
        shangtuBoost: 1,
        shangtuBoostRounds: 0,
        luckBoost: 0,
        guaranteedGoodEvent: false,
        roundShangtu: 0,
        roundShangtuMax: GAME_CONFIG.shangtuBasePerRound,
        currentRoad: 'jiangnan',
        shopOutputBoost: 1.0,
        eventTriggeredThisRound: [],
      },
      // 背包
      backpack: {
        maxSlots: GAME_CONFIG.backpackInitialSlots,
        items: [],
        quickSlots: [null, null, null, null],
        permanentUpgrades: { staminaMaxBonus: 0, energyMaxBonus: 0, shangtuCapBonus: 0, shopOutputBoost: 0 },
        purchasedPermanents: [],
      },
      // 元数据
      meta: {
        version: GAME_CONFIG.version,
        totalSilverEarned: 0,
        totalTravels: 0,
        totalRounds: 0,
        staminaZeroCount: 0,
        sessionsToday: 0,
        lastSessionDate: '',
        firstPlayTime: Date.now(),
        lastSaveTime: Date.now(),
        lastActiveTime: Date.now(),
        tutorialCompleted: false,
      },
      // Prestige
      prestige: {
        count: 0,
        legacy: 0,
        shopUnlocked: false,
      },
      // 每日系统
      daily: {
        lastClaimDate: '',
        streak: 0,
        claimedThisCycle: [],
        banquetCount: 0,
        banquetDate: '',
        banquetPrices: {},
        // v2.1
        yiguanCount: 0,
        yiguanDate: '',
        yiguanPriceIdx: 0,
        dufangDate: '',
        dufangBets: 0,
        dufangQuizDone: false,
        dufangStonePity: 0,
      },
      // 商情
      market: { prices: {}, lastRefreshTimestamp: 0, lastRefreshStep: 0 },
      // v2.2 黑市（步数刷新）
      heishi: { goods: [], prices: {}, lastRefreshTimestamp: 0, lastRefreshStep: 0 },
      // v2.2 盐场
      saltFields: [],
      // v2.2 供奉
      gongfeng: { totalOffered: 0, totalLegacy: 0 },
      // v2.2 里程碑
      milestones: [],
      // v2.2 赌坊防沉迷
      dufangAntiAddiction: { dailyLoss: 0, consecutiveLosses: 0, cooldownUntil: 0, date: '' },
      // v2.3 操作激活
      activity: { lastActiveTimestamp: Date.now(), businessFlashActive: false, businessFlashEndTime: 0 },
      // v2.3 店铺变卖
      shopSelling: { totalSellCount: 0, shopCooldowns: {} },
      // v2.3 燃烧精血 & 游戏结束
      burnBlood: { totalBurned: 0, totalSilverGained: 0 },
      gameOver: false,
      // v2.4 聚宝阁（拍卖）
      auction: {
        unlocked: false,
        items: [],
        lastRefreshStep: 0,
        forceRefreshUsedToday: 0,
        forceRefreshDate: '',
        heishiTokensBoughtThisRound: 0,
        collections: [],
        stoneCollections: [],
      },
      // 货物库存 (囤货)
      commodities: {},
      // 传闻
      rumors: { collected: {}, completed: [] },
      // 成就
      achievements: {},
      // 日志
      logs: [],
      // 伪装
      disguised: false,
      disguiseType: 'excel',
      // 定时器
      shopTimer: null,
      energyTimer: null,
      autoSaveTimer: null,
    };

    this.eventHandlers = {};
    this.init();
  }

  // ==================== 初始化 ====================
  init() {
    for (const [key, shopDef] of Object.entries(SHOPS)) {
      this.state.shops[key] = {
        level: shopDef.unlockCondition ? 0 : 1,
        output: shopDef.baseOutput,
        unlocked: !shopDef.unlockCondition,
      };
    }
    if (this.state.shops.teahouse && this.state.shops.teahouse.level === 0) {
      this.state.shops.teahouse.level = 1;
      this.state.shops.teahouse.unlocked = true;
    }
    this.loadGame();
    this.applyPermanentUpgrades();
    this.checkDailyRefresh();
    this.calculateOfflineEarnings();
    this.startTimers();
    this.updateTutorialState();
    // v2.3: 如果存档中gameOver=true，通知UI显示游戏结束界面
    if (this.state.gameOver) {
      setTimeout(() => this.emit('gameOver', { reason: 'load' }), 100);
    }
  }

  applyPermanentUpgrades() {
    const up = this.state.backpack.permanentUpgrades;
    this.state.resources.staminaMax = RESOURCES.stamina.max + up.staminaMaxBonus;
    this.state.energy.max = GAME_CONFIG.maxEnergy + up.energyMaxBonus;
    this.state.journey.roundShangtuMax = GAME_CONFIG.shangtuBasePerRound + up.shangtuCapBonus;
    this.state.journey.shopOutputBoost = 1.0 + up.shopOutputBoost;
    // Apply shop special effects for permanent bonuses
    for (const [shopId, shopDef] of Object.entries(SHOPS)) {
      const shop = this.state.shops[shopId];
      if (shop.unlocked && shopDef.specialEffect && shopDef.specialEffect.perLevels) {
        const se = shopDef.specialEffect;
        const bonusLevels = Math.floor(shop.level / se.perLevels);
        if (se.type === 'staminaMax') {
          this.state.resources.staminaMax += se.value * bonusLevels;
        } else if (se.type === 'energyMax') {
          this.state.energy.max += se.value * bonusLevels;
        }
      }
    }
  }

  // ==================== 事件系统 ====================
  on(event, handler) {
    if (!this.eventHandlers[event]) this.eventHandlers[event] = [];
    this.eventHandlers[event].push(handler);
  }
  emit(event, data) {
    if (this.eventHandlers[event]) this.eventHandlers[event].forEach(h => h(data));
  }

  // ==================== 资源操作 ====================
  modifyResource(resource, amount) {
    if (this.state.resources[resource] !== undefined) {
      this.state.resources[resource] += amount;
      if (resource === 'stamina') {
        this.state.resources.stamina = Math.max(0, Math.min(this.state.resources.stamina, this.state.resources.staminaMax));
      }
      if (resource === 'silver' && amount > 0) {
        this.state.meta.totalSilverEarned += amount;
      }
      if (resource === 'stamina' && this.state.resources.stamina <= 0) {
        // v2.4: 免死金牌 — 防止惩罚性倒退
        if (this.checkPunitiveSetbackImmunity()) {
          // stamina already restored by the check
        } else if (this.state.journey.active) {
          // 检查化险符
          if (this.hasItemEquipped('huaxianfu')) {
            this.removeItem('huaxianfu', 1);
            this.state.resources.stamina = 1;
            this.addLog('🌀 化险符生效！体力归零时保留1点继续商途！', 'success');
          } else {
            this.state.resources.stamina = 0;
            this.endRound('stamina');
          }
        }
      }
      this.emit('resourceChange', { resource, amount, newValue: this.state.resources[resource] });
      // v2.2: 声望里程碑检查
      if (resource === 'reputation' && amount > 0) this.checkMilestone();
      // v2.4: 聚宝阁解锁检查
      if (resource === 'reputation' && amount > 0) this.checkAuctionUnlock();
      // 资源变化时检查店铺解锁（商途值/银两达标即可解锁）
      if ((resource === 'shangtu' || resource === 'silver') && amount > 0) this.checkShopUnlocks();
      this.checkAchievements();
      this.autoSave();
      return true;
    }
    return false;
  }
  getResource(r) { return this.state.resources[r] || 0; }

  // ==================== v2.3 燃烧精血 ====================
  burnBlood(amount) {
    if (this.state.gameOver) return { success: false, reason: 'game_over' };
    amount = parseInt(amount);
    if (isNaN(amount) || amount <= 0) return { success: false, reason: 'invalid', msg: '请输入有效数量' };
    // v2.3: 整局游戏最多烧100点（lifetime），重置/Prestige清零
    const remaining = GAME_CONFIG.burnBloodLifetimeMax - this.state.burnBlood.totalBurned;
    if (remaining <= 0) return { success: false, reason: 'lifetime_exceed', msg: LOG_TEMPLATES.burnBloodLifetimeExceed };
    if (amount > remaining) return { success: false, reason: 'max_exceed', msg: LOG_TEMPLATES.burnBloodMaxExceed + `剩余${remaining}点` };
    const stamina = this.state.resources.stamina;
    if (stamina <= 0) return { success: false, reason: 'no_stamina', msg: LOG_TEMPLATES.burnBloodNotEnough };
    // 实际燃烧量不超过当前体力
    const actualBurn = Math.min(amount, stamina);
    const silverGained = actualBurn * GAME_CONFIG.burnBloodSilverPerStamina;
    // 直接扣减体力（绕过 modifyResource 的 endRound 逻辑，因为我们要触发 gameOver 而非 endRound）
    this.state.resources.stamina -= actualBurn;
    this.state.resources.silver += silverGained;
    this.state.meta.totalSilverEarned += silverGained;
    this.state.burnBlood.totalBurned += actualBurn;
    this.state.burnBlood.totalSilverGained += silverGained;
    this.addLog(LOG_TEMPLATES.burnBlood.replace('{stamina}', actualBurn).replace('{silver}', silverGained.toLocaleString()), 'warning');
    this.emit('resourceChange', { resource: 'stamina', amount: -actualBurn, newValue: this.state.resources.stamina });
    this.emit('resourceChange', { resource: 'silver', amount: silverGained, newValue: this.state.resources.silver });
    this.emit('burnBlood', { burned: actualBurn, silver: silverGained });
    // 体力归零 → 游戏结束
    if (this.state.resources.stamina <= 0) {
      this.state.resources.stamina = 0;
      this.triggerGameOver('burn');
    }
    this.checkAchievements();
    this.autoSave();
    return { success: true, burned: actualBurn, silver: silverGained, gameOver: this.state.resources.stamina <= 0 };
  }

  // ==================== 游戏结束 ====================
  triggerGameOver(reason = 'burn') {
    this.state.gameOver = true;
    if (this.state.journey.travelTimer) { cancelAnimationFrame(this.state.journey.travelTimer); this.state.journey.travelTimer = null; }
    this.state.journey.active = false;
    if (this.state.energyTimer) { clearInterval(this.state.energyTimer); this.state.energyTimer = null; }
    if (this.state.shopTimer) { clearInterval(this.state.shopTimer); this.state.shopTimer = null; }
    if (this.state.autoSaveTimer) { clearInterval(this.state.autoSaveTimer); this.state.autoSaveTimer = null; }
    this.addLog(LOG_TEMPLATES.gameOverBurn, 'danger');
    this.emit('gameOver', { reason });
    this.autoSave();
  }

  // 游戏结束后重新开始（保留存档但重置gameOver标记，需要通过Prestige或重置）
  dismissGameOver() {
    this.state.gameOver = false;
    this.emit('gameOverDismissed');
  }

  // ==================== 精力系统 ====================
  getEnergyStatus() {
    this.recoverEnergy();
    return { current: this.state.energy.current, max: this.state.energy.max, nextRecovery: this.getNextEnergyRecovery() };
  }
  recoverEnergy() {
    const now = Date.now();
    const elapsed = (now - this.state.energy.lastRecoveryTime) / 1000;
    const recovered = Math.floor(elapsed / GAME_CONFIG.energyRecoveryInterval);
    if (recovered > 0 && this.state.energy.current < this.state.energy.max) {
      const actual = Math.min(recovered, this.state.energy.max - this.state.energy.current);
      this.state.energy.current += actual;
      this.state.energy.lastRecoveryTime += actual * GAME_CONFIG.energyRecoveryInterval * 1000;
      this.emit('energyChange', this.getEnergyStatus());
    }
  }
  getNextEnergyRecovery() {
    const elapsed = (Date.now() - this.state.energy.lastRecoveryTime) / 1000;
    return Math.ceil(GAME_CONFIG.energyRecoveryInterval - (elapsed % GAME_CONFIG.energyRecoveryInterval));
  }
  consumeEnergy(amount) {
    this.recoverEnergy();
    if (this.state.energy.current >= amount) { this.state.energy.current -= amount; this.emit('energyChange', this.getEnergyStatus()); return true; }
    return false;
  }
  addEnergy(amount) {
    this.state.energy.current = Math.min(this.state.energy.current + amount, this.state.energy.max);
    this.emit('energyChange', this.getEnergyStatus());
  }
  canTravel() {
    this.recoverEnergy();
    return !this.state.gameOver && this.state.energy.current >= GAME_CONFIG.energyPerTravel && this.state.resources.stamina > 0 && !this.state.journey.active;
  }

  // ==================== 核心循环 ====================
  startTravel() {
    if (!this.canTravel()) return false;
    this.refreshActivity();
    this.consumeEnergy(GAME_CONFIG.energyPerTravel);
    this.state.journey.active = true;
    this.state.journey.progress = 0;
    this.state.meta.totalTravels++;
    // v2.3: 每次行走后检查步数驱动刷新（商情/黑市）
    this.checkStepRefresh();
    const duration = GAME_CONFIG.travelDurationMin + Math.random() * (GAME_CONFIG.travelDurationMax - GAME_CONFIG.travelDurationMin);
    this.addLog(LOG_TEMPLATES.travelStart, 'info');
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      this.state.journey.progress = Math.min(elapsed / duration, 1);
      this.emit('travelProgress', this.state.journey.progress);
      if (this.state.journey.progress < 1) {
        this.state.journey.travelTimer = requestAnimationFrame(animate);
      } else {
        this.state.journey.travelTimer = null;
        this.triggerEvent();
      }
    };
    this.emit('travelStart');
    this.state.journey.travelTimer = requestAnimationFrame(animate);
    return true;
  }

  triggerEvent() {
    let shangtuGain = 5;
    // 路段倍率
    const road = ROADS[this.state.journey.currentRoad];
    if (road) shangtuGain = Math.floor(shangtuGain * road.outputMultiplier);
    // 商途值软上限
    const capped = this.state.journey.roundShangtu >= this.state.journey.roundShangtuMax;
    if (capped) shangtuGain = GAME_CONFIG.shangtuOverflowPerStep;
    // 商途加成
    if (this.state.journey.shangtuBoost > 1 && this.state.journey.shangtuBoostRounds > 0) {
      shangtuGain = Math.floor(shangtuGain * this.state.journey.shangtuBoost);
      this.state.journey.shangtuBoostRounds--;
      if (this.state.journey.shangtuBoostRounds <= 0) this.state.journey.shangtuBoost = 1;
    }
    // 收益倍率
    if (this.state.journey.nextTravelBonus !== 1) {
      shangtuGain = Math.floor(shangtuGain * this.state.journey.nextTravelBonus);
      this.state.journey.travelBonusRounds--;
      if (this.state.journey.travelBonusRounds <= 0) this.state.journey.nextTravelBonus = 1;
    }
    // 收益加成(福星高照符)
    if (this.state.journey.incomeBoost > 1 && this.state.journey.incomeBoostRounds > 0) {
      shangtuGain = Math.floor(shangtuGain * this.state.journey.incomeBoost);
      this.state.journey.incomeBoostRounds--;
      if (this.state.journey.incomeBoostRounds <= 0) this.state.journey.incomeBoost = 1;
    }
    // 应用商途值（加成道具不受上限约束）
    this.state.journey.roundShangtu += shangtuGain;
    this.modifyResource('shangtu', shangtuGain);
    if (capped && this.state.journey.shangtuBoost <= 1) {
      this.addLog(LOG_TEMPLATES.shangtuCapReached, 'warning');
    } else if (capped) {
      this.addLog(`商途值已达软上限，但加成道具不受限！(+${shangtuGain})`, 'progress');
    } else {
      this.addLog(`商队行进中…商途值+${shangtuGain}`, 'progress');
    }
    // 成就：商途值
    this.checkAchievements();
    // 选择事件
    const event = this.selectRandomEvent();
    this.state.journey.currentEvent = event;
    this.state.journey.eventTriggeredThisRound.push(event.id);
    this.addLog(LOG_TEMPLATES.travelEnd_event, 'info');
    this.emit('eventTriggered', event);
    this.state.journey.active = false;
  }

  selectRandomEvent() {
    // 保证每轮触发一次驿站补给
    const needStation = !this.state.journey.eventTriggeredThisRound.includes('station_supply');
    if (needStation && this.state.journey.eventTriggeredThisRound.length >= 3) {
      const station = EVENT_POOL.find(e => e.id === 'station_supply');
      if (station && Math.random() < 0.3) return station;
    }
    // 风水罗盘：必定正面事件
    if (this.state.journey.guaranteedGoodEvent) {
      this.state.journey.guaranteedGoodEvent = false;
      const goodEvents = EVENT_POOL.filter(e => ['trade','recovery','supply','cooperation','story'].includes(e.category));
      if (goodEvents.length > 0) return goodEvents[Math.floor(Math.random() * goodEvents.length)];
    }
    const idx = Math.floor(Math.random() * EVENT_POOL.length);
    return EVENT_POOL[idx];
  }

  // 格式化事件结果文案，替换模板变量如 {value}, {silver}, {reputation}
  _formatEventResult(text, effects, gainsMap) {
    let result = text || '';
    // 替换 {value} — 使用 gains 的第一个值（通常是银两收益）
    if (gainsMap && result.includes('{value}')) {
      const firstVal = Object.values(gainsMap)[0];
      if (firstVal !== undefined) result = result.replaceAll('{value}', firstVal.toLocaleString());
    }
    // 替换所有 {key} 为 effects 中的对应值
    for (const [key, val] of Object.entries(effects || {})) {
      const placeholder = `{${key}}`;
      if (result.includes(placeholder)) result = result.replaceAll(placeholder, val.toLocaleString());
    }
    return result;
  }

  resolveEvent(optionIndex) {
    const event = this.state.journey.currentEvent;
    if (!event) return null;
    const option = event.options[optionIndex];
    if (!option) return null;
    const results = { effects: {}, logs: [], itemRewards: [] };
    // 应用直接效果
    if (option.effects) {
      for (const [resource, amount] of Object.entries(option.effects)) {
        if (resource === 'silver_multiply') {
          const gain = Math.floor(this.state.resources.silver * (amount - 1));
          this.modifyResource('silver', gain);
          results.effects.silver = gain;
        } else if (resource === 'nextTravelBonus') {
          this.state.journey.nextTravelBonus = amount;
          this.state.journey.travelBonusRounds = 3;
          results.effects.nextTravelBonus = amount;
        } else if (resource === 'shopOutputBoost') {
          this.state.journey.shopOutputBoost += amount;
          results.effects.shopOutputBoost = amount;
        } else {
          this.modifyResource(resource, amount);
          results.effects[resource] = amount;
        }
      }
    }
    // 赌博
    let effectiveWinChance = option.gamble ? option.gamble.winChance : 0;
    // v2.2: 声望幸运加成
    if (option.gamble) effectiveWinChance = Math.min(1, effectiveWinChance + this.getLuckBonus());
    if (option.gamble && this.state.journey.luckBoost > 0) {
      effectiveWinChance = Math.min(1, effectiveWinChance + this.state.journey.luckBoost);
      this.state.journey.luckBoost = 0;
    }
    if (option.gamble) {
      const rolled = Math.random();
      if (rolled < effectiveWinChance) {
        if (option.gamble.winEffects) {
          for (const [res, amt] of Object.entries(option.gamble.winEffects)) {
            if (res === 'silver_multiply') {
              const gain = Math.floor(this.state.resources.silver * (amt - 1));
              this.modifyResource('silver', gain);
              results.effects['silver'] = (results.effects['silver'] || 0) + gain;
            } else { this.modifyResource(res, amt); results.effects[res] = (results.effects[res] || 0) + amt; }
          }
        }
        results.resultType = 'win';
        results.resultText = option.result_win || option.result;
      } else {
        if (option.gamble.loseEffects) {
          for (const [res, amt] of Object.entries(option.gamble.loseEffects)) {
            this.modifyResource(res, amt);
            results.effects[res] = (results.effects[res] || 0) + amt;
          }
        }
        results.resultType = 'lose';
        results.resultText = option.result_lose || option.result;
      }
    } else { results.resultText = option.result; }

    // 赌博包（古董摊）
    if (option.gamblePack) {
      const roll = Math.random();
      let cum = 0;
      for (const pool of option.gamblePack.pools) {
        cum += pool.chance;
        if (roll < cum) {
          this.addItem(pool.item.id, pool.item.qty);
          results.resultText = (results.resultText || '') + ` 打开锦盒获得：${pool.text}！`;
          results.itemRewards.push(pool.item);
          break;
        }
      }
    }

    // 道具奖励
    if (option.itemReward) {
      this.addItem(option.itemReward.id, option.itemReward.qty);
      results.itemRewards.push(option.itemReward);
    }
    if (option.itemRewards) {
      for (const ir of option.itemRewards) {
        this.addItem(ir.id, ir.qty);
        results.itemRewards.push(ir);
      }
    }

    // gains
    const gainsMap = {};
    if (option.gains) {
      for (const [key, value] of Object.entries(option.gains)) {
        if (typeof value === 'object' && (value.min !== undefined || value.max !== undefined)) {
          const actual = Math.floor((value.min || 0) + Math.random() * ((value.max || 0) - (value.min || 0) + 1));
          this.modifyResource(key, actual);
          results.effects[key] = (results.effects[key] || 0) + actual;
          gainsMap[key] = actual;
        } else {
          this.modifyResource(key, value);
          results.effects[key] = (results.effects[key] || 0) + value;
          gainsMap[key] = value;
        }
      }
    }

    // 格式化结果文本（替换模板变量如 {value}, {silver}, {reputation}）
    let formattedResult = this._formatEventResult(results.resultText, results.effects, gainsMap);
    if (formattedResult) this.addLog(formattedResult, results.resultType === 'win' ? 'success' : results.resultType === 'lose' ? 'danger' : 'info');
    results.formattedText = formattedResult;
    // v2.1: 跳转到地点
    if (option.jumpTo) results.jumpTo = option.jumpTo;
    // v2.1: 黑市商人事件10%掉落黑市令
    if (event.id === 'black_market' && Math.random() < 0.1) {
      this.addItem('heishiling', 1);
      this.addLog('🌑 黑市商人悄悄塞给你一枚黑市令！', 'success');
      results.heishiTokenDrop = true;
    }
    this.state.journey.currentEvent = null;
    this.checkAchievements();
    this.emit('eventResolved', results);
    this.autoSave();
    return results;
  }

  /** 使用道具处理事件（C选项） */
  resolveEventWithItem(optionIndex) {
    const event = this.state.journey.currentEvent;
    if (!event || !event.itemOption) return null;
    const results = { effects: {}, formattedText: '' };
    const io = event.itemOption;
    // 消耗道具
    const removed = this.removeItem(io.item, 1);
    if (!removed) return null;
    // 幸运符强制赢
    if (io.forceWin) {
      const gambleOption = event.options.find(o => o.gamble);
      if (gambleOption && gambleOption.gamble.winEffects) {
        for (const [res, amt] of Object.entries(gambleOption.gamble.winEffects)) {
          if (res === 'silver_multiply') {
            const gain = Math.floor(this.state.resources.silver * (amt - 1));
            this.modifyResource('silver', gain);
            results.effects['silver'] = (results.effects['silver'] || 0) + gain;
          } else { this.modifyResource(res, amt); results.effects[res] = (results.effects[res] || 0) + amt; }
        }
      }
    }
    if (io.forceWinChance) {
      const gambleOption = event.options.find(o => o.gamble);
      if (gambleOption) {
        const rolled = Math.random();
        if (rolled < io.forceWinChance) {
          if (gambleOption.gamble.winEffects) {
            for (const [res, amt] of Object.entries(gambleOption.gamble.winEffects)) {
              if (res === 'silver_multiply') {
                const gain = Math.floor(this.state.resources.silver * (amt - 1));
                this.modifyResource('silver', gain);
                results.effects['silver'] = (results.effects['silver'] || 0) + gain;
              } else { this.modifyResource(res, amt); results.effects[res] = (results.effects[res] || 0) + amt; }
            }
          }
          results.resultType = 'win';
        } else {
          if (gambleOption.gamble.loseEffects) {
            for (const [res, amt] of Object.entries(gambleOption.gamble.loseEffects)) {
              this.modifyResource(res, amt);
              results.effects[res] = (results.effects[res] || 0) + amt;
            }
          }
          results.resultType = 'lose';
        }
      }
    }
    if (io.overrideEffects) {
      for (const [res, amt] of Object.entries(io.overrideEffects)) {
        this.modifyResource(res, amt);
        results.effects[res] = (results.effects[res] || 0) + amt;
      }
    }
    if (io.forceBoost) {
      this.state.journey.shangtuBoost = io.forceBoost;
      this.state.journey.shangtuBoostRounds = 1;
    }
    results.resultText = io.result;
    this.addLog(io.result, 'success');
    results.formattedText = io.result;
    this.state.journey.currentEvent = null;
    this.emit('eventResolved', results);
    this.autoSave();
    return results;
  }

  // ==================== 轮次管理 ====================
  endRound(reason = 'complete') {
    this.state.journey.active = false;
    if (this.state.journey.travelTimer) { cancelAnimationFrame(this.state.journey.travelTimer); this.state.journey.travelTimer = null; }
    if (reason === 'stamina') {
      this.state.meta.staminaZeroCount++;
      this.addLog(LOG_TEMPLATES.staminaZero, 'warning');
    }
    if (reason === 'complete' || reason === 'force') {
      if (reason === 'complete') {
        let bonus = 50;
        if (this.state.journey.shangtuBoost > 1 && this.state.journey.shangtuBoostRounds > 0) bonus *= this.state.journey.shangtuBoost;
        this.state.journey.roundShangtu += bonus;
        this.modifyResource('shangtu', bonus);
        this.modifyResource('silver', 30);
        this.addLog(LOG_TEMPLATES.roundComplete, 'success');
        this.state.meta.totalRounds++;
      }
    }
    this.state.journey.roundShangtu = 0;
    this.state.journey.nextTravelBonus = 1;
    this.state.journey.travelBonusRounds = 0;
    this.state.journey.incomeBoost = 1;
    this.state.journey.incomeBoostRounds = 0;
    this.state.journey.shangtuBoost = 1;
    this.state.journey.shangtuBoostRounds = 0;
    this.state.journey.luckBoost = 0;
    this.state.journey.guaranteedGoodEvent = false;
    this.state.journey.eventTriggeredThisRound = [];
    this.checkShopUnlocks();
    this.checkAchievements();
    this.emit('roundEnd', { reason });
    this.autoSave();
  }

  // ==================== 店铺系统 ====================
  getShopOutput(shopId) {
    const shop = this.state.shops[shopId];
    if (!shop || !shop.unlocked) return 0;
    const shopDef = SHOPS[shopId];
    let output = shopDef.baseOutput * shop.level;
    for (const [level, mult] of Object.entries(GAME_CONFIG.milestoneMultipliers)) {
      if (shop.level >= parseInt(level)) output = Math.max(output, shopDef.baseOutput * parseInt(level) * mult);
    }
    // v2.0: 每级增量产出，消除平台期断档
    output += Math.floor(shopDef.baseOutput * 0.02 * (shop.level - 1));
    output = Math.floor(output * this.state.journey.shopOutputBoost);
    // Prestige legacy加成
    if (this.state.prestige.legacy > 0) output = Math.floor(output * (1 + this.state.prestige.legacy * GAME_CONFIG.legacyPerReputation));
    // v2.3: 操作激活系数
    output = Math.floor(output * this.getActivityMultiplier());
    // v2.3: 商机闪现×2
    if (this.state.activity.businessFlashActive) output = Math.floor(output * GAME_CONFIG.businessFlashMultiplier);
    // v2.4: 和田羊脂白玉 +3% 产出
    if (this.state.auction.stoneCollections.includes('jade_muttonFat')) {
      output = Math.floor(output * 1.03);
    }
    return Math.floor(output);
  }
  getTotalShopOutput() {
    let total = 0;
    for (const sid of Object.keys(SHOPS)) total += this.getShopOutput(sid);
    return total;
  }

  // ==================== v2.3 操作激活机制 ====================
  refreshActivity() {
    this.state.activity.lastActiveTimestamp = Date.now();
  }

  getActivityMultiplier() {
    const now = Date.now();
    const lastActive = this.state.activity.lastActiveTimestamp || now;
    const elapsed = (now - lastActive) / 1000;
    if (this.state.disguised) return GAME_CONFIG.disguiseOutputMultiplier;
    if (elapsed <= GAME_CONFIG.activeWindowDuration) return 1.0;
    if (elapsed <= GAME_CONFIG.deepInactiveThreshold) return GAME_CONFIG.inactiveOutputMultiplier;
    return GAME_CONFIG.deepInactiveOutputMultiplier;
  }

  getActivityInfo() {
    const now = Date.now();
    const lastActive = this.state.activity.lastActiveTimestamp || now;
    const elapsed = Math.floor((now - lastActive) / 1000);
    const min = Math.floor(elapsed / 60);
    let level, multiplier;
    if (this.state.disguised) { level = 'disguise'; multiplier = GAME_CONFIG.disguiseOutputMultiplier; }
    else if (elapsed <= GAME_CONFIG.activeWindowDuration) { level = 'full'; multiplier = 1.0; }
    else if (elapsed <= GAME_CONFIG.deepInactiveThreshold) { level = 'normal'; multiplier = GAME_CONFIG.inactiveOutputMultiplier; }
    else { level = 'low'; multiplier = GAME_CONFIG.deepInactiveOutputMultiplier; }
    return { level, multiplier, minutesSinceActive: min, businessFlashActive: this.state.activity.businessFlashActive, businessFlashEndTime: this.state.activity.businessFlashEndTime };
  }

  // ==================== v2.2 声望幸运加成 ====================
  getLuckBonus() {
    const rep = this.state.resources.reputation;
    const bonus = Math.floor(rep / LUCK_CONFIG.reputationPerLuck) * 0.01;
    return Math.min(bonus, LUCK_CONFIG.maxLuckBonus);
  }

  // ==================== v2.2 声望里程碑庆典 ====================
  checkMilestone() {
    const rep = this.state.resources.reputation;
    for (const m of MILESTONE_REWARDS) {
      if (rep >= m.reputation && !this.state.milestones.includes(m.reputation)) {
        this.state.milestones.push(m.reputation);
        this.modifyResource('silver', m.silver);
        this.addLog(LOG_TEMPLATES.milestoneCelebration.replace('{title}', m.title).replace('{silver}', m.silver.toLocaleString()), 'success');
        this.emit('milestoneReached', m);
      }
    }
  }

  // ==================== v2.3 道具动态定价 ====================
  getItemDynamicPrice(itemId) {
    const def = ITEM_DEFINITIONS[itemId];
    if (!def) return 0;
    const basePrice = def.price;
    const shopId = ITEM_SHOP_BINDING[itemId];
    if (!shopId) return basePrice;
    const shop = this.state.shops[shopId];
    if (!shop || !shop.unlocked || shop.level < GAME_CONFIG.itemPriceDiscountStartLevel) {
      return Math.floor(basePrice * (1 + GAME_CONFIG.itemPriceBaseMarkup));
    }
    const discountTier = Math.floor(shop.level / 10);
    const shopDiscount = Math.min(discountTier * GAME_CONFIG.itemPriceDiscountPerLevel, GAME_CONFIG.itemPriceMaxDiscount);
    const dynamicMultiplier = (1 + GAME_CONFIG.itemPriceBaseMarkup) * (1 - shopDiscount);
    return Math.floor(basePrice * dynamicMultiplier);
  }

  getItemPriceInfo(itemId) {
    const def = ITEM_DEFINITIONS[itemId];
    if (!def) return null;
    const basePrice = def.price;
    const dynamicPrice = this.getItemDynamicPrice(itemId);
    const shopId = ITEM_SHOP_BINDING[itemId];
    let discount = 0;
    if (shopId) {
      const shop = this.state.shops[shopId];
      if (shop && shop.unlocked && shop.level >= GAME_CONFIG.itemPriceDiscountStartLevel) {
        const tier = Math.floor(shop.level / 10);
        discount = Math.min(tier * GAME_CONFIG.itemPriceDiscountPerLevel, GAME_CONFIG.itemPriceMaxDiscount);
      }
    }
    return { basePrice, dynamicPrice, discount, shopId, isDynamic: !!shopId };
  }

  // ==================== v2.3 店铺变卖 ====================
  calculateCumulativeUpgradeCost(shopId, currentLevel) {
    const def = SHOPS[shopId];
    let total = 0;
    for (let lv = 1; lv < currentLevel; lv++) {
      total += Math.floor(def.upgradeBaseCost * Math.pow(def.upgradeCostMultiplier, lv - 1));
    }
    return total;
  }

  getShopSellRecovery(shopId) {
    const shop = this.state.shops[shopId];
    if (!shop || !shop.unlocked || shop.level === 0) return null;
    const cumulativeInvestment = this.calculateCumulativeUpgradeCost(shopId, shop.level);
    const sellCount = this.state.shopSelling.totalSellCount || 0;
    let baseRate = GAME_CONFIG.shopSellBaseRecoveryRate - sellCount * GAME_CONFIG.shopSellRecoveryDecayPerSell;
    baseRate = Math.max(baseRate, GAME_CONFIG.shopSellRecoveryFloor);
    let levelDecay = 0;
    if (shop.level > GAME_CONFIG.shopSellLevelDecayStartLevel) {
      levelDecay = (shop.level - GAME_CONFIG.shopSellLevelDecayStartLevel) * GAME_CONFIG.shopSellLevelDecayRate;
    }
    let finalRate = Math.max(baseRate - levelDecay, GAME_CONFIG.shopSellRecoveryFloorTotal);
    const recoveryAmount = Math.floor(cumulativeInvestment * finalRate);
    return { recoveryAmount, recoveryRate: finalRate, baseRate, levelDecay, cumulativeInvestment, sellCount };
  }

  sellShop(shopId) {
    const shop = this.state.shops[shopId];
    if (!shop || !shop.unlocked) return { success: false, reason: 'not_unlocked' };
    // 冷却检查
    const cooldowns = this.state.shopSelling.shopCooldowns || {};
    if (cooldowns[shopId] && Date.now() < cooldowns[shopId]) {
      const hoursLeft = Math.ceil((cooldowns[shopId] - Date.now()) / 3600000);
      return { success: false, reason: 'cooldown', hoursLeft };
    }
    const recovery = this.getShopSellRecovery(shopId);
    if (!recovery) return { success: false, reason: 'error' };
    // 执行变卖
    this.modifyResource('silver', recovery.recoveryAmount);
    shop.level = 0;
    shop.unlocked = false;
    shop.output = 0;
    this.state.shopSelling.totalSellCount = (this.state.shopSelling.totalSellCount || 0) + 1;
    if (!this.state.shopSelling.shopCooldowns) this.state.shopSelling.shopCooldowns = {};
    this.state.shopSelling.shopCooldowns[shopId] = Date.now() + GAME_CONFIG.shopSellCooldownHours * 3600000;
    const shopName = SHOPS[shopId].name;
    this.addLog(LOG_TEMPLATES.shopSold.replace('{shopName}', shopName).replace('{silver}', recovery.recoveryAmount.toLocaleString()).replace('{rate}', Math.round(recovery.recoveryRate * 100)), 'warning');
    this.emit('shopSold', { shopId, recovery });
    this.autoSave();
    return { success: true, recovery };
  }
  upgradeShop(shopId) {
    const shop = this.state.shops[shopId];
    const shopDef = SHOPS[shopId];
    if (!shop || !shop.unlocked) return { success: false, reason: 'locked' };
    const cost = this.getUpgradeCost(shopId);
    if (this.state.resources.silver < cost) return { success: false, reason: 'insufficient' };
    this.refreshActivity();
    this.modifyResource('silver', -cost);
    shop.level++;
    shop.output = this.getShopOutput(shopId);
    this.checkShopUnlocks();
    this.addLog(`${shopDef.icon} ${shopDef.name} 升级至 Lv.${shop.level}！`, 'success');
    this.applyPermanentUpgrades();
    this.emit('shopUpgraded', { shopId, level: shop.level });
    this.autoSave();
    return { success: true, cost, newLevel: shop.level };
  }
  getUpgradeCost(shopId) {
    const shop = this.state.shops[shopId];
    const shopDef = SHOPS[shopId];
    return Math.floor(shopDef.upgradeBaseCost * Math.pow(shopDef.upgradeCostMultiplier, shop.level - 1));
  }
  checkShopUnlocks() {
    for (const [sid, sdef] of Object.entries(SHOPS)) {
      if (sdef.unlockCondition && !this.state.shops[sid].unlocked) {
        const { resource, amount } = sdef.unlockCondition;
        if (this.state.resources[resource] >= amount) {
          this.state.shops[sid].unlocked = true;
          this.state.shops[sid].level = 1;
          this.state.shops[sid].output = this.getShopOutput(sid);
          this.addLog(`🎉 解锁新店铺：${sdef.icon} ${sdef.name}！`, 'success');
          this.emit('shopUnlocked', { shopId: sid });
        }
      }
    }
  }
  getTotalShopLevel() {
    let total = 0;
    for (const s of Object.values(this.state.shops)) { if (s.unlocked) total += s.level; }
    return total;
  }

  // ==================== 道具购买 ====================
  buyShopItem(shopId, itemId) {
    const shopDef = SHOPS[shopId];
    if (!shopDef || !this.state.shops[shopId] || !this.state.shops[shopId].unlocked) return { success: false, reason: 'locked' };
    // 查找道具
    let itemCfg = null;
    let price = 0;
    const allItems = [...(shopDef.items || []), ...(shopDef.prestigeItems || [])];
    for (const si of allItems) {
      if (si.id === itemId) {
        // 检查 prestigeOnly
        const itemDef = ITEM_DEFINITIONS[itemId];
        if (itemDef && itemDef.prestigeOnly && !this.state.prestige.shopUnlocked) continue;
        // 检查 minLevel
        if (si.minLevel && this.state.shops[shopId].level < si.minLevel) continue;
        itemCfg = si;
        price = this.getItemDynamicPrice(itemId);
        break;
      }
    }
    if (!itemCfg) return { success: false, reason: 'not_available' };
    if (this.state.resources.silver < price) return { success: false, reason: 'insufficient' };
    this.modifyResource('silver', -price);
    // 永久道具直接生效
    const itemDef = ITEM_DEFINITIONS[itemId];
    if (itemDef && itemDef.type === 'permanent') {
      if (this.state.backpack.purchasedPermanents.includes(itemId) && itemDef.maxPurchase === 1) {
        return { success: false, reason: 'already_purchased' };
      }
      this.applyPermanentItem(itemId);
      this.state.backpack.purchasedPermanents.push(itemId);
      this.addLog(`🔮 获得永久道具：${itemDef.icon} ${itemDef.name}！效果已生效。`, 'success');
    } else {
      const added = this.addItem(itemId, 1);
      if (!added) { this.modifyResource('silver', price); return { success: false, reason: 'backpack_full' }; }
    }
    this.emit('itemPurchased', { shopId, itemId, price });
    this.autoSave();
    return { success: true };
  }

  applyPermanentItem(itemId) {
    const def = ITEM_DEFINITIONS[itemId];
    if (!def || !def.effect) return;
    const eff = def.effect;
    const up = this.state.backpack.permanentUpgrades;
    if (eff.staminaMaxBonus) up.staminaMaxBonus += eff.staminaMaxBonus;
    if (eff.energyMaxBonus) up.energyMaxBonus += eff.energyMaxBonus;
    if (eff.shangtuCapBonus) up.shangtuCapBonus += eff.shangtuCapBonus;
    if (eff.shopOutputBoost) up.shopOutputBoost += eff.shopOutputBoost;
    this.applyPermanentUpgrades();
  }

  // ==================== 背包系统 ====================
  addItem(itemId, qty = 1) {
    const def = ITEM_DEFINITIONS[itemId];
    if (!def) return false;
    if (def.isExpand) {
      this.expandBackpack();
      return true;
    }
    // 永久道具直接生效
    if (def.type === 'permanent') {
      this.applyPermanentItem(itemId);
      if (!this.state.backpack.purchasedPermanents.includes(itemId))
        this.state.backpack.purchasedPermanents.push(itemId);
      this.addLog(`🔮 获得永久道具：${def.icon} ${def.name}！`, 'success');
      this.emit('backpackChange');
      return true;
    }
    // 查找已有堆叠
    if (def.stackable) {
      const existing = this.state.backpack.items.find(i => i.id === itemId);
      if (existing) {
        existing.quantity = Math.min(existing.quantity + qty, def.maxStack);
        this.emit('backpackChange');
        this.autoSave();
        return true;
      }
    }
    // 新格子
    if (this.state.backpack.items.length >= this.state.backpack.maxSlots) return false;
    this.state.backpack.items.push({ id: itemId, quantity: qty });
    this.emit('backpackChange');
    this.autoSave();
    return true;
  }

  removeItem(itemId, qty = 1) {
    const idx = this.state.backpack.items.findIndex(i => i.id === itemId);
    if (idx === -1) return false;
    const item = this.state.backpack.items[idx];
    if (item.quantity <= qty) {
      this.state.backpack.items.splice(idx, 1);
      // 清理快捷栏引用
      for (let i = 0; i < this.state.backpack.quickSlots.length; i++) {
        if (this.state.backpack.quickSlots[i] === itemId) this.state.backpack.quickSlots[i] = null;
      }
    } else {
      item.quantity -= qty;
    }
    this.emit('backpackChange');
    this.autoSave();
    return true;
  }

  getItemCount(itemId) {
    const item = this.state.backpack.items.find(i => i.id === itemId);
    return item ? item.quantity : 0;
  }

  hasItem(itemId) { return this.getItemCount(itemId) > 0; }
  hasItemEquipped(itemId) {
    // 护身符/化险符 - 检查背包中有即视为装备
    return this.hasItem(itemId);
  }

  useItem(itemId) {
    const def = ITEM_DEFINITIONS[itemId];
    if (!def) return { success: false, reason: 'not_found' };
    // 检查使用条件
    if (def.condition) {
      for (const [key, cond] of Object.entries(def.condition)) {
        if (key === 'stamina' && cond.lt === 'staminaMax') {
          if (this.state.resources.stamina >= this.state.resources.staminaMax)
            return { success: false, reason: 'condition_not_met', msg: '体力已满' };
        }
        if (key === 'energy' && cond.lt === 'energyMax') {
          if (this.state.energy.current >= this.state.energy.max)
            return { success: false, reason: 'condition_not_met', msg: '精力已满' };
        }
      }
    }
    // 检查使用场景
    if (def.useContext && !def.useContext.includes('any')) {
      const inJourney = this.state.journey.active || this.state.journey.currentEvent;
      if (def.useContext.includes('during_journey') && !inJourney)
        return { success: false, reason: 'wrong_context', msg: '只能在商途进行中使用' };
    }
    if (!this.hasItem(itemId)) return { success: false, reason: 'no_item' };
    // 应用效果
    const eff = def.effect;
    const results = { effects: {} };
    if (eff.stamina) { this.modifyResource('stamina', eff.stamina); results.effects.stamina = eff.stamina; }
    if (eff.energy) { this.addEnergy(eff.energy); results.effects.energy = eff.energy; }
    if (eff.luckBoost) { this.state.journey.luckBoost = eff.luckBoost; }
    if (eff.incomeBoost) { this.state.journey.incomeBoost = eff.incomeBoost; this.state.journey.incomeBoostRounds = eff.incomeBoostRounds || 1; }
    if (eff.shangtuBoost) { this.state.journey.shangtuBoost = eff.shangtuBoost; this.state.journey.shangtuBoostRounds = eff.shangtuBoostRounds || 1; }
    if (eff.guaranteedGoodEvent) { this.state.journey.guaranteedGoodEvent = true; }
    if (eff.forceEndRound) { this.endRound('force'); }
    this.removeItem(itemId, 1);
    this.addLog(`使用道具：${def.icon} ${def.name}`, 'info');
    this.emit('itemUsed', { itemId, effects: results.effects });
    this.autoSave();
    return { success: true, effects: results.effects, itemDef: def };
  }

  setQuickSlot(slotIndex, itemId) {
    if (slotIndex < 0 || slotIndex >= GAME_CONFIG.quickSlotsCount) return false;
    if (itemId !== null && !this.hasItem(itemId)) return false;
    this.state.backpack.quickSlots[slotIndex] = itemId;
    this.emit('backpackChange');
    this.autoSave();
    return true;
  }

  useQuickSlot(slotIndex) {
    const itemId = this.state.backpack.quickSlots[slotIndex];
    if (!itemId) return { success: false, reason: 'empty' };
    return this.useItem(itemId);
  }

  expandBackpack() {
    if (this.state.backpack.maxSlots >= GAME_CONFIG.backpackMaxSlots) return false;
    const expandIdx = (this.state.backpack.maxSlots - GAME_CONFIG.backpackInitialSlots) / GAME_CONFIG.backpackExpandStep;
    const cost = GAME_CONFIG.backpackExpandCosts[expandIdx] || 1500;
    const needRep = GAME_CONFIG.backpackExpandReputation[expandIdx] || 0;
    if (this.state.resources.silver < cost) return false;
    // v2.0: 声望门槛
    if (this.state.resources.reputation < needRep) {
      this.addLog(LOG_TEMPLATES.backpackNeedReputation.replace('{need}', needRep).replace('{current}', this.state.resources.reputation), 'warning');
      return false;
    }
    this.modifyResource('silver', -cost);
    this.state.backpack.maxSlots += GAME_CONFIG.backpackExpandStep;
    this.addLog(`📦 背包扩容至 ${this.state.backpack.maxSlots} 格！`, 'success');
    this.emit('backpackChange');
    this.autoSave();
    return true;
  }

  sortBackpack(mode) {
    if (mode === 'type') {
      const order = { heal_stamina: 1, heal_energy: 2, buff: 3, shangtu_boost: 4, protection: 5, function: 6 };
      this.state.backpack.items.sort((a, b) => {
        const da = ITEM_DEFINITIONS[a.id]; const db = ITEM_DEFINITIONS[b.id];
        return (order[da?.category] || 99) - (order[db?.category] || 99);
      });
    } else if (mode === 'rarity') {
      const order = { legendary: 1, rare: 2, common: 3 };
      this.state.backpack.items.sort((a, b) => {
        const da = ITEM_DEFINITIONS[a.id]; const db = ITEM_DEFINITIONS[b.id];
        return (order[da?.rarity] || 99) - (order[db?.rarity] || 99);
      });
    }
    this.emit('backpackChange');
    this.autoSave();
  }

  // ==================== Prestige ====================
  canPrestige() {
    return this.state.resources.reputation >= GAME_CONFIG.prestigeRequirement;
  }
  doPrestige() {
    if (!this.canPrestige()) return false;
    const legacyGain = this.state.resources.reputation;
    this.state.prestige.count++;
    this.state.prestige.legacy += legacyGain;
    if (this.state.prestige.count === 1) this.state.prestige.shopUnlocked = true;
    // 保留永久升级
    const permanentUpgrades = { ...this.state.backpack.permanentUpgrades };
    const purchasedPermanents = [...this.state.backpack.purchasedPermanents];
    // 重置资源
    this.state.resources.silver = GAME_CONFIG.initialSilver;
    this.state.resources.reputation = 0;
    this.state.resources.stamina = RESOURCES.stamina.max;
    this.state.resources.shangtu = 0;
    // 重置店铺
    for (const [key, shopDef] of Object.entries(SHOPS)) {
      this.state.shops[key] = {
        level: shopDef.unlockCondition ? 0 : 1,
        output: shopDef.baseOutput,
        unlocked: !shopDef.unlockCondition,
      };
    }
    if (this.state.shops.teahouse && this.state.shops.teahouse.level === 0) {
      this.state.shops.teahouse.level = 1; this.state.shops.teahouse.unlocked = true;
    }
    // 重置背包
    this.state.backpack.items = [];
    this.state.backpack.quickSlots = [null, null, null, null];
    this.state.backpack.maxSlots = GAME_CONFIG.backpackInitialSlots;
    this.state.backpack.permanentUpgrades = permanentUpgrades;
    this.state.backpack.purchasedPermanents = purchasedPermanents;
    // 重置商途
    this.state.journey = {
      active: false, progress: 0, travelTimer: null, currentEvent: null,
      nextTravelBonus: 1, travelBonusRounds: 0, incomeBoost: 1, incomeBoostRounds: 0,
      shangtuBoost: 1, shangtuBoostRounds: 0, luckBoost: 0, guaranteedGoodEvent: false,
      roundShangtu: 0, roundShangtuMax: GAME_CONFIG.shangtuBasePerRound,
      currentRoad: 'jiangnan', shopOutputBoost: 1.0, eventTriggeredThisRound: [],
    };
    this.state.meta.staminaZeroCount = 0;
    this.state.commodities = {}; // 清空囤货
    this.state.heishi = { goods: [], prices: {}, lastRefreshTimestamp: 0, lastRefreshStep: 0 }; // 重置黑市
    this.state.saltFields = []; // 重置盐场
    this.state.milestones = []; // 重置里程碑
    this.state.dufangAntiAddiction = { dailyLoss: 0, consecutiveLosses: 0, cooldownUntil: 0, date: '' }; // 重置防沉迷
    this.state.shopSelling = { totalSellCount: 0, shopCooldowns: {} }; // 重置变卖
    this.state.burnBlood = { totalBurned: 0, totalSilverGained: 0 }; // 重置燃烧精血
    this.state.gameOver = false; // 解除游戏结束
    // v2.4 重置拍卖（收藏品清零，保护道具保留在背包中）
    this.state.auction = {
      unlocked: false,
      items: [],
      lastRefreshStep: 0,
      forceRefreshUsedToday: 0,
      forceRefreshDate: '',
      heishiTokensBoughtThisRound: 0,
      collections: [],
      stoneCollections: [],
    };
    this.applyPermanentUpgrades();
    const legacyPct = Math.floor(this.state.prestige.legacy * GAME_CONFIG.legacyPerReputation * 100);
    this.addLog(`🔥 声望重置成功！第${this.state.prestige.count}次重置，传承点${this.state.prestige.legacy}，产出+${legacyPct}%！`, 'success');
    this.emit('prestigeComplete');
    this.checkAchievements();
    this.autoSave();
    return true;
  }

  // ==================== 每日系统 ====================
  // v2.2 根据声望获取商情刷新步数间隔
  getMarketRefreshSteps() {
    const rep = this.state.resources.reputation;
    for (const tier of MARKET_REFRESH_STEPS) {
      if (rep <= tier.maxRep) return tier.steps;
    }
    return 20; // fallback
  }
  // v2.2 根据声望获取黑市刷新步数间隔
  getHeishiRefreshSteps() {
    const rep = this.state.resources.reputation;
    for (const tier of HEISHI_REFRESH_STEPS) {
      if (rep <= tier.maxRep) return tier.steps;
    }
    return 30; // fallback
  }

  // v2.3 步数驱动刷新检查（每次行走后调用）
  checkStepRefresh() {
    const totalSteps = this.state.meta.totalTravels;
    // 商情刷新
    const marketStepsNeeded = this.getMarketRefreshSteps();
    if (!this.state.market.lastRefreshStep || (totalSteps - this.state.market.lastRefreshStep) >= marketStepsNeeded) {
      this.refreshMarket();
    }
    // 黑市刷新
    const heishiStepsNeeded = this.getHeishiRefreshSteps();
    if (!this.state.heishi.lastRefreshStep || (totalSteps - this.state.heishi.lastRefreshStep) >= heishiStepsNeeded) {
      this.refreshHeishi();
    }
    // v2.4 聚宝阁刷新
    if (this.state.auction.unlocked) {
      const auctionStepsNeeded = getAuctionRefreshSteps(this.state.resources.reputation);
      if (!this.state.auction.lastRefreshStep || (totalSteps - this.state.auction.lastRefreshStep) >= auctionStepsNeeded) {
        this.refreshAuctionItems();
      }
    }
  }

  checkDailyRefresh() {
    const today = this.getDateStr();
    if (this.state.daily.lastClaimDate !== today) {
      this.state.daily.streak = 0;
      this.state.daily.claimedThisCycle = [];
      this.state.daily.lastClaimDate = today;
    }
    // v2.2 步数驱动刷新（初始化时也检查一次）
    this.checkStepRefresh();
    // v2.4 拍卖强制刷新每日重置
    if (this.state.auction.forceRefreshDate !== today) {
      this.state.auction.forceRefreshUsedToday = 0;
      this.state.auction.forceRefreshDate = today;
    }
    // v2.1 每日重置
    if (this.state.daily.dufangDate !== today) {
      this.state.daily.dufangDate = today;
      this.state.daily.dufangBets = 0;
      this.state.daily.dufangQuizDone = false;
    }
    if (this.state.daily.yiguanDate !== today) {
      this.state.daily.yiguanDate = today;
      this.state.daily.yiguanCount = 0;
      this.state.daily.yiguanPriceIdx = 0;
    }
    // 刷新每日传闻
    if (!this.state.daily.rumorGivenDate || this.state.daily.rumorGivenDate !== today) {
      this.state.daily.rumorGivenDate = today;
      this.giveDailyRumor();
    }
    // 登录奖励
    if (!this.state.daily.claimedToday) {
      this.state.daily.showReward = true;
    }
    this.state.meta.lastActiveTime = Date.now();
    this.autoSave();
  }

  getDateStr() { return new Date().toISOString().slice(0, 10); }

  refreshMarket() {
    const prices = {};
    for (const good of DAILY_MARKET_GOODS) {
      const mult = 0.6 + Math.random() * 1.4; // v2.0: 波动 0.6~2.0
      prices[good.id] = { price: Math.floor(good.basePrice * mult), multiplier: parseFloat(mult.toFixed(2)), name: good.name, icon: good.icon, basePrice: good.basePrice };
    }
    this.state.market.prices = prices;
    this.state.market.lastRefreshStep = this.state.meta.totalTravels;
    this.state.market.lastRefreshTimestamp = Date.now();
    this.addLog(LOG_TEMPLATES.marketUpdate, 'info');
    this.emit('marketRefreshed', prices);
  }

  giveDailyRumor() {
    const available = RUMOR_FRAGMENTS.filter(r => !this.state.rumors.completed.includes(r.id) && (this.state.rumors.collected[r.id] || 0) < r.fragments);
    if (available.length === 0) return;
    const rumor = available[Math.floor(Math.random() * available.length)];
    if (!this.state.rumors.collected[rumor.id]) this.state.rumors.collected[rumor.id] = 0;
    this.state.rumors.collected[rumor.id]++;
    const collected = this.state.rumors.collected[rumor.id];
    if (collected >= rumor.fragments) {
      this.state.rumors.completed.push(rumor.id);
      this.addLog(LOG_TEMPLATES.rumorComplete.replace('{name}', rumor.title), 'success');
      this.addLog(`📖 ${rumor.story}`, 'info');
      this.modifyResource('reputation', 10);
    } else {
      this.addLog(LOG_TEMPLATES.rumorFound.replace('{name}', rumor.title).replace('{collected}', collected).replace('{total}', rumor.fragments), 'info');
    }
    this.checkAchievements();
    this.autoSave();
  }

  claimDailyReward() {
    const today = this.getDateStr();
    if (this.state.daily.claimedToday) return { success: false, reason: 'already_claimed' };
    this.state.daily.claimedToday = true;
    const dayIdx = this.state.daily.claimedThisCycle.length % GAME_CONFIG.dailyRewardCycle;
    const reward = DAILY_REWARDS[dayIdx];
    if (!reward) return { success: false };
    // 发放奖励
    const given = [];
    if (reward.rewards.silver) { this.modifyResource('silver', reward.rewards.silver); given.push(`银两+${reward.rewards.silver}`); }
    if (reward.rewards.item) { this.addItem(reward.rewards.item, reward.rewards.qty || 1); given.push(`${ITEM_DEFINITIONS[reward.rewards.item]?.icon || ''}${ITEM_DEFINITIONS[reward.rewards.item]?.name}×${reward.rewards.qty || 1}`); }
    if (reward.rewards.item2) { this.addItem(reward.rewards.item2, reward.rewards.qty2 || 1); given.push(`${ITEM_DEFINITIONS[reward.rewards.item2]?.icon || ''}${ITEM_DEFINITIONS[reward.rewards.item2]?.name}×${reward.rewards.qty2 || 1}`); }
    this.state.daily.claimedThisCycle.push(dayIdx + 1);
    this.addLog(`📅 领取每日登录奖励：第${dayIdx + 1}天——${reward.desc}`, 'success');
    this.emit('dailyRewardClaimed', { day: dayIdx + 1, reward });
    this.autoSave();
    return { success: true, day: dayIdx + 1, reward, given };
  }

  // ==================== 成就系统 ====================
  checkAchievements() {
    for (const ach of ACHIEVEMENTS) {
      if (this.state.achievements[ach.id]) continue;
      let met = false;
      const c = ach.condition;
      if (c.type === 'totalTravels') met = this.state.meta.totalTravels >= c.value;
      else if (c.type === 'totalRounds') met = this.state.meta.totalRounds >= c.value;
      else if (c.type === 'totalSilverEarned') met = this.state.meta.totalSilverEarned >= c.value;
      else if (c.type === 'reputation') met = this.state.resources.reputation >= c.value;
      else if (c.type === 'shangtu') met = this.state.resources.shangtu >= c.value;
      else if (c.type === 'staminaZeroCount') met = this.state.meta.staminaZeroCount >= c.value;
      else if (c.type === 'totalShopLevel') met = this.getTotalShopLevel() >= c.value;
      else if (c.type === 'prestigeCount') met = this.state.prestige.count >= c.value;
      else if (c.type === 'rumorsCollected') met = this.state.rumors.completed.length >= c.value;
      else if (c.type === 'maxOfflineHours') met = (this.state.meta.maxOfflineHours || 0) >= c.value;
      // v2.4: 赌石之王 — 集齐天字号藏品
      else if (c.type === 'stoneCollectionsAll') met = this.state.auction.stoneCollections.length >= 2;
      if (met) {
        this.state.achievements[ach.id] = true;
        this.addLog(LOG_TEMPLATES.achievementUnlock.replace('{name}', ach.name), 'success');
        // 发放奖励
        if (ach.reward.silver) this.modifyResource('silver', ach.reward.silver);
        if (ach.reward.item) this.addItem(ach.reward.item, ach.reward.qty || 1);
        this.emit('achievementUnlocked', ach);
      }
    }
  }

  // ==================== 存档系统 ====================
  getSaveData() {
    return {
      version: GAME_CONFIG.version,
      saveVersion: GAME_CONFIG.saveVersion,
      resources: { ...this.state.resources },
      energy: { ...this.state.energy },
      shops: { ...this.state.shops },
      journey: {
        roundShangtu: this.state.journey.roundShangtu,
        roundShangtuMax: this.state.journey.roundShangtuMax,
        nextTravelBonus: this.state.journey.nextTravelBonus,
        travelBonusRounds: this.state.journey.travelBonusRounds,
        incomeBoost: this.state.journey.incomeBoost,
        incomeBoostRounds: this.state.journey.incomeBoostRounds,
        shangtuBoost: this.state.journey.shangtuBoost,
        shangtuBoostRounds: this.state.journey.shangtuBoostRounds,
        luckBoost: this.state.journey.luckBoost,
        guaranteedGoodEvent: this.state.journey.guaranteedGoodEvent,
        currentRoad: this.state.journey.currentRoad,
        shopOutputBoost: this.state.journey.shopOutputBoost,
      },
      backpack: {
        maxSlots: this.state.backpack.maxSlots,
        items: [...this.state.backpack.items],
        quickSlots: [...this.state.backpack.quickSlots],
        permanentUpgrades: { ...this.state.backpack.permanentUpgrades },
        purchasedPermanents: [...this.state.backpack.purchasedPermanents],
      },
      meta: { ...this.state.meta },
      prestige: { ...this.state.prestige },
      daily: { ...this.state.daily },
      market: { ...this.state.market },
      heishi: { ...this.state.heishi },
      saltFields: this.state.saltFields.map(f => ({ ...f })),
      gongfeng: { ...this.state.gongfeng },
      milestones: [...this.state.milestones],
      dufangAntiAddiction: { ...this.state.dufangAntiAddiction },
      activity: { ...this.state.activity },
      shopSelling: { totalSellCount: this.state.shopSelling.totalSellCount, shopCooldowns: { ...this.state.shopSelling.shopCooldowns } },
      burnBlood: { ...this.state.burnBlood },
      gameOver: this.state.gameOver,
      auction: {
        unlocked: this.state.auction.unlocked,
        items: this.state.auction.items.map(i => ({ ...i })),
        lastRefreshStep: this.state.auction.lastRefreshStep,
        forceRefreshUsedToday: this.state.auction.forceRefreshUsedToday,
        forceRefreshDate: this.state.auction.forceRefreshDate,
        heishiTokensBoughtThisRound: this.state.auction.heishiTokensBoughtThisRound,
        collections: [...this.state.auction.collections],
        stoneCollections: [...this.state.auction.stoneCollections],
      },
      commodities: { ...this.state.commodities },
      rumors: { collected: { ...this.state.rumors.collected }, completed: [...this.state.rumors.completed] },
      achievements: { ...this.state.achievements },
      disguiseType: this.state.disguiseType,
      timestamp: Date.now(),
    };
  }

  saveGame() { this.autoSave(); }
  autoSave() {
    if (this._resetting) return; // 重置中不保存
    this.state.meta.lastSaveTime = Date.now();
    try { localStorage.setItem('zhanggui_save', JSON.stringify(this.getSaveData())); } catch (e) {}
  }

  loadGame() {
    try {
      const raw = localStorage.getItem('zhanggui_save');
      if (!raw) return;
      const d = JSON.parse(raw);
      if (!d) return;
      this.state.resources = { ...this.state.resources, ...d.resources };
      this.state.energy = { ...this.state.energy, ...d.energy };
      this.state.shops = { ...this.state.shops, ...d.shops };
      if (d.journey) Object.assign(this.state.journey, d.journey);
      if (d.backpack) {
        this.state.backpack.maxSlots = d.backpack.maxSlots || GAME_CONFIG.backpackInitialSlots;
        this.state.backpack.items = d.backpack.items || [];
        this.state.backpack.quickSlots = d.backpack.quickSlots || [null, null, null, null];
        if (d.backpack.permanentUpgrades) this.state.backpack.permanentUpgrades = d.backpack.permanentUpgrades;
        if (d.backpack.purchasedPermanents) this.state.backpack.purchasedPermanents = d.backpack.purchasedPermanents;
      }
      if (d.meta) this.state.meta = { ...this.state.meta, ...d.meta };
      if (d.prestige) this.state.prestige = { ...this.state.prestige, ...d.prestige };
      if (d.daily) this.state.daily = d.daily;
      if (d.market) this.state.market = { ...this.state.market, ...d.market };
      if (d.heishi) this.state.heishi = { ...this.state.heishi, ...d.heishi };
      if (d.saltFields) this.state.saltFields = d.saltFields;
      if (d.gongfeng) this.state.gongfeng = { ...this.state.gongfeng, ...d.gongfeng };
      if (d.milestones) this.state.milestones = d.milestones;
      if (d.dufangAntiAddiction) this.state.dufangAntiAddiction = { ...this.state.dufangAntiAddiction, ...d.dufangAntiAddiction };
      if (d.activity) this.state.activity = { ...this.state.activity, ...d.activity };
      if (d.shopSelling) this.state.shopSelling = { totalSellCount: d.shopSelling.totalSellCount || 0, shopCooldowns: d.shopSelling.shopCooldowns || {} };
      if (d.burnBlood) this.state.burnBlood = { ...this.state.burnBlood, ...d.burnBlood };
      if (d.gameOver !== undefined) this.state.gameOver = d.gameOver;
      // v2.4 拍卖迁移
      if (d.auction) this.state.auction = { ...this.state.auction, ...d.auction };
      if (d.commodities) this.state.commodities = d.commodities;
      if (d.rumors) { this.state.rumors.collected = d.rumors.collected || {}; this.state.rumors.completed = d.rumors.completed || []; }
      if (d.achievements) this.state.achievements = d.achievements;
      if (d.disguiseType) this.state.disguiseType = d.disguiseType;
    } catch (e) {}
  }

  exportSave() {
    try { return btoa(JSON.stringify(this.getSaveData())); } catch (e) { return null; }
  }

  importSave(base64) {
    try {
      const d = JSON.parse(atob(base64));
      if (!d || !d.version) return false;
      this.state.resources = { ...this.state.resources, ...d.resources };
      this.state.energy = { ...this.state.energy, ...d.energy };
      this.state.shops = { ...this.state.shops, ...d.shops };
      if (d.journey) Object.assign(this.state.journey, d.journey);
      if (d.backpack) Object.assign(this.state.backpack, d.backpack);
      if (d.meta) this.state.meta = { ...this.state.meta, ...d.meta };
      if (d.prestige) this.state.prestige = { ...this.state.prestige, ...d.prestige };
      if (d.daily) this.state.daily = d.daily;
      if (d.market) this.state.market = { ...this.state.market, ...d.market };
      if (d.heishi) this.state.heishi = { ...this.state.heishi, ...d.heishi };
      if (d.saltFields) this.state.saltFields = d.saltFields;
      if (d.gongfeng) this.state.gongfeng = { ...this.state.gongfeng, ...d.gongfeng };
      if (d.milestones) this.state.milestones = d.milestones;
      if (d.dufangAntiAddiction) this.state.dufangAntiAddiction = { ...this.state.dufangAntiAddiction, ...d.dufangAntiAddiction };
      if (d.activity) this.state.activity = { ...this.state.activity, ...d.activity };
      if (d.shopSelling) this.state.shopSelling = { totalSellCount: d.shopSelling.totalSellCount || 0, shopCooldowns: d.shopSelling.shopCooldowns || {} };
      if (d.burnBlood) this.state.burnBlood = { ...this.state.burnBlood, ...d.burnBlood };
      if (d.gameOver !== undefined) this.state.gameOver = d.gameOver;
      // v2.4 拍卖迁移
      if (d.auction) this.state.auction = { ...this.state.auction, ...d.auction };
      if (d.commodities) this.state.commodities = d.commodities;
      if (d.rumors) { this.state.rumors.collected = d.rumors.collected || {}; this.state.rumors.completed = d.rumors.completed || []; }
      if (d.achievements) this.state.achievements = d.achievements;
      this.applyPermanentUpgrades();
      this.autoSave();
      return true;
    } catch (e) { return false; }
  }

  resetGame() {
    // 停止所有定时器，防止 autoSave 在 reload 前重新写入存档
    if (this.state.autoSaveTimer) clearInterval(this.state.autoSaveTimer);
    if (this.state.shopTimer) clearInterval(this.state.shopTimer);
    if (this.state.energyTimer) clearInterval(this.state.energyTimer);
    this.state.autoSaveTimer = null;
    this._resetting = true; // 标记重置中，autoSave 直接跳过
    localStorage.removeItem('zhanggui_save');
    location.reload();
  }

  // ==================== 路段系统 ====================
  switchRoad(roadId) {
    if (!ROADS[roadId]) return false;
    if (this.state.resources.shangtu < ROADS[roadId].unlockShangtu) return false;
    this.state.journey.currentRoad = roadId;
    this.addLog(`🗺️ 切换路段：${ROADS[roadId].name}！收益倍率×${ROADS[roadId].outputMultiplier}`, 'success');
    this.emit('roadSwitched', roadId);
    this.autoSave();
    return true;
  }
  getCurrentRoad() { return ROADS[this.state.journey.currentRoad]; }
  getUnlockedRoads() {
    return Object.entries(ROADS).filter(([,r]) => this.state.resources.shangtu >= r.unlockShangtu).map(([id]) => id);
  }

  // ==================== 每日商情 ====================
  getMarketPrices() { return this.state.market.prices; }
  getMarketRefreshInfo() {
    const totalSteps = this.state.meta.totalTravels;
    const stepsNeeded = this.getMarketRefreshSteps();
    const stepsSince = totalSteps - (this.state.market.lastRefreshStep || 0);
    const stepsLeft = Math.max(0, stepsNeeded - stepsSince);
    return { stepsLeft, stepsNeeded, nextRefreshStr: stepsLeft > 0 ? `${stepsLeft}步` : '即将刷新' };
  }

  // ==================== 商情交易系统 ====================
  getCommodityCount(goodId) { return this.state.commodities[goodId] || 0; }

  buyCommodity(goodId, qty = 1) {
    const gdata = this.state.market.prices[goodId];
    if (!gdata) return { success: false, reason: 'not_found' };
    const def = DAILY_MARKET_GOODS.find(g => g.id === goodId);
    if (!def) return { success: false, reason: 'not_found' };
    this.refreshActivity();
    // v2.0: 含15%买入手续费
    const rawCost = gdata.price * qty;
    const fee = Math.floor(rawCost * GAME_CONFIG.marketBuyFeeRate);
    const totalCost = rawCost + fee;
    if (this.state.resources.silver < totalCost) return { success: false, reason: 'no_silver', msg: `银两不足（需${totalCost}，含${fee}手续费）` };
    const current = this.state.commodities[goodId] || 0;
    if (current + qty > GAME_CONFIG.marketMaxHolding) return { success: false, reason: 'full', msg: `每种货物最多持有${GAME_CONFIG.marketMaxHolding}个` };
    this.state.resources.silver -= totalCost;
    this.state.commodities[goodId] = current + qty;
    this.addLog(LOG_TEMPLATES.commodityBuy.replace('{icon}', def.icon).replace('{name}', def.name).replace('{qty}', qty).replace('{cost}', totalCost) + ` (手续费${fee}🪙)`, 'success');
    this.emit('marketTrade', { action: 'buy', goodId, qty, cost: totalCost, fee });
    this.autoSave();
    return { success: true, cost: totalCost, fee, newQty: this.state.commodities[goodId] };
  }

  sellCommodity(goodId, qty = 1) {
    const gdata = this.state.market.prices[goodId];
    if (!gdata) return { success: false, reason: 'not_found' };
    const def = DAILY_MARKET_GOODS.find(g => g.id === goodId);
    if (!def) return { success: false, reason: 'not_found' };
    const current = this.state.commodities[goodId] || 0;
    if (current < qty) return { success: false, reason: 'no_commodity', msg: '库存不足' };
    const income = gdata.price * qty;
    this.state.resources.silver += income;
    this.state.commodities[goodId] = current - qty;
    if (this.state.commodities[goodId] <= 0) delete this.state.commodities[goodId];
    const profit = income - (def.basePrice * qty);
    const tag = profit > 0 ? '📈' : profit < 0 ? '📉' : '➡️';
    this.addLog(LOG_TEMPLATES.commoditySell.replace('{icon}', def.icon).replace('{name}', def.name).replace('{qty}', qty).replace('{income}', income) + ` ${tag}`, 'success');
    this.emit('marketTrade', { action: 'sell', goodId, qty, income });
    this.autoSave();
    return { success: true, income, newQty: this.state.commodities[goodId] || 0 };
  }

  sellItem(itemId, qty = 1) {
    const def = ITEM_DEFINITIONS[itemId];
    if (!def || def.type === 'permanent') return { success: false, reason: 'cannot_sell' };
    const count = this.getItemCount(itemId);
    if (count < qty) return { success: false, reason: 'no_item' };
    // 根据市场行情浮动价格 (基价 × 当日随机倍率 × 0.5 ~ 1.5)
    const marketAvgMult = Object.values(this.state.market.prices).reduce((s, g) => s + g.multiplier, 0) / Math.max(1, Object.keys(this.state.market.prices).length);
    const sellRatio = 0.5 + marketAvgMult * 0.5; // 行情好卖价高
    const income = Math.floor(def.price * sellRatio * qty);
    this.removeItem(itemId, qty);
    this.state.resources.silver += income;
    this.addLog(LOG_TEMPLATES.itemSell.replace('{icon}', def.icon).replace('{name}', def.name).replace('{qty}', qty).replace('{income}', income), 'success');
    this.emit('itemSold', { itemId, qty, income });
    this.emit('itemUsed', {}); // 触发 UI 刷新
    this.autoSave();
    return { success: true, income, itemDef: def };
  }

  // ==================== 地点系统（v2.0） ====================
  getUnlockedLocations() {
    const result = [];
    for (const [lid, loc] of Object.entries(LOCATIONS)) {
      let unlocked = true;
      if (lid === 'gongfeng') {
        unlocked = this.isGongfengUnlocked();
      } else if (loc.unlockCondition) {
        const c = loc.unlockCondition;
        if (c.resource && this.state.resources[c.resource] < c.amount) unlocked = false;
        if (c.item && this.getItemCount(c.item) <= 0) {
          // 黑市令消耗品：持有时解锁，进入后消耗
          unlocked = false;
        }
      }
      result.push({ ...loc, unlocked });
    }
    return result;
  }

  visitLocation(locationId) {
    const loc = LOCATIONS[locationId];
    if (!loc) return { success: false, reason: 'not_found' };
    // 检查解锁
    if (loc.unlockCondition) {
      const c = loc.unlockCondition;
      if (c.resource && this.state.resources[c.resource] < c.amount)
        return { success: false, reason: 'locked', msg: `${c.resource === 'reputation' ? '声望' : '商途值'}不足${c.amount}` };
      if (c.item && this.getItemCount(c.item) <= 0)
        return { success: false, reason: 'locked', msg: '需要黑市令才能进入黑市' };
    }
    return { success: true, location: loc };
  }

  // ==================== 酒楼宴请系统（v2.0） ====================
  getBanquetPrices() {
    const today = this.getDateStr();
    if (this.state.daily.banquetDate !== today) {
      this.state.daily.banquetCount = 0;
      this.state.daily.banquetDate = today;
      this.state.daily.banquetPrices = {};
    }
    const prices = {};
    for (const tier of BANQUET_CONFIG.tiers) {
      const storedPrice = this.state.daily.banquetPrices[tier.id];
      prices[tier.id] = storedPrice || tier.basePrice;
    }
    return { prices, count: this.state.daily.banquetCount, limit: BANQUET_CONFIG.dailyLimit };
  }

  doBanquet(tierId) {
    const tier = BANQUET_CONFIG.tiers.find(t => t.id === tierId);
    if (!tier) return { success: false, reason: 'not_found' };
    const info = this.getBanquetPrices();
    if (info.count >= BANQUET_CONFIG.dailyLimit)
      return { success: false, reason: 'limit', msg: LOG_TEMPLATES.banquetLimit };
    const price = info.prices[tierId];
    if (this.state.resources.silver < price)
      return { success: false, reason: 'no_silver', msg: LOG_TEMPLATES.banquetNoSilver };
    // 扣钱
    this.state.resources.silver -= price;
    // 发奖励
    const rewards = [];
    const rw = tier.rewards;
    if (rw.stamina) { this.modifyResource('stamina', rw.stamina); rewards.push(`体力+${rw.stamina}`); }
    if (rw.reputation) { this.modifyResource('reputation', rw.reputation); rewards.push(`声望+${rw.reputation}`); }
    if (rw.shangtu) { this.modifyResource('shangtu', rw.shangtu); rewards.push(`商途值+${rw.shangtu}`); }
    if (rw.energy) { this.addEnergy(rw.energy); rewards.push(`精力+${rw.energy}`); }
    // 递增价格
    const nextPrice = Math.floor(price * (1 + BANQUET_CONFIG.priceIncrement));
    this.state.daily.banquetPrices[tierId] = nextPrice;
    this.state.daily.banquetCount++;
    const rewardsStr = rewards.join('，');
    this.addLog(LOG_TEMPLATES.banquetComplete.replace('{name}', tier.name).replace('{rewards}', rewardsStr), 'success');
    this.emit('banquetDone', { tierId, price, nextPrice, rewards: tier.rewards });
    this.autoSave();
    return { success: true, price, nextPrice, rewards: tier.rewards, rewardsStr };
  }

  // ==================== 医馆系统（v2.1） ====================
  getYiguanInfo() {
    const today = this.getDateStr();
    if (this.state.daily.yiguanDate !== today) {
      this.state.daily.yiguanCount = 0;
      this.state.daily.yiguanPriceIdx = 0;
      this.state.daily.yiguanDate = today;
    }
    const price = YIGUAN_CONFIG.basePrice * Math.pow(YIGUAN_CONFIG.priceMultiplier, this.state.daily.yiguanPriceIdx);
    const remaining = YIGUAN_CONFIG.dailyLimit - this.state.daily.yiguanCount;
    return { price, remaining, stamina: YIGUAN_CONFIG.staminaPerHeal };
  }

  doYiguanHeal() {
    const info = this.getYiguanInfo();
    if (info.remaining <= 0) return { success: false, reason: 'limit', msg: LOG_TEMPLATES.yiguanLimit };
    if (this.state.resources.silver < info.price) return { success: false, reason: 'no_silver', msg: LOG_TEMPLATES.yiguanNoSilver };
    if (this.state.resources.stamina >= this.state.resources.staminaMax) return { success: false, reason: 'full', msg: '体力已满，无需就诊！' };
    this.state.resources.silver -= info.price;
    const healed = Math.min(info.stamina, this.state.resources.staminaMax - this.state.resources.stamina);
    this.modifyResource('stamina', healed);
    this.state.daily.yiguanCount++;
    this.state.daily.yiguanPriceIdx++;
    const nextPrice = YIGUAN_CONFIG.basePrice * Math.pow(YIGUAN_CONFIG.priceMultiplier, this.state.daily.yiguanPriceIdx);
    this.addLog(LOG_TEMPLATES.yiguanHeal.replace('{stamina}', healed).replace('{cost}', info.price), 'success');
    this.emit('yiguanDone', { price: info.price, healed });
    this.autoSave();
    return { success: true, price: info.price, healed, nextPrice };
  }

  // ==================== 御街系统（v2.1） ====================
  triggerYujieEvent() {
    const roll = Math.random();
    let cumulative = 0;
    // normalize chances
    const totalChance = YUJIE_EVENTS.reduce((s, e) => s + e.chance, 0);
    for (const event of YUJIE_EVENTS) {
      cumulative += event.chance / totalChance;
      if (roll < cumulative) {
        // Process result
        const result = { event, effects: {}, text: '', gambleResult: null };
        if (event.effects) {
          for (const [res, amt] of Object.entries(event.effects)) {
            if (amt < 0 && this.state.resources[res] < Math.abs(amt)) continue; // skip if can't afford
            if (res === 'stamina') {
              this.modifyResource(res, amt);
              result.effects[res] = amt;
            } else if (res === 'reputation') {
              this.modifyResource(res, amt);
              result.effects[res] = amt;
            } else {
              this.modifyResource(res, amt);
              result.effects[res] = amt;
            }
          }
        }
        if (event.gamble) {
          const won = Math.random() < event.gamble.winChance;
          if (won && event.gamble.winEffects) {
            for (const [res, amt] of Object.entries(event.gamble.winEffects)) {
              this.modifyResource(res, amt);
              result.effects[res] = (result.effects[res] || 0) + amt;
            }
            result.gambleResult = 'win';
            result.text = event.result_win || event.result;
          } else if (!won && event.gamble.loseEffects) {
            for (const [res, amt] of Object.entries(event.gamble.loseEffects)) {
              this.modifyResource(res, amt);
              result.effects[res] = (result.effects[res] || 0) + amt;
            }
            result.gambleResult = 'lose';
            result.text = event.result_lose || event.result;
          }
        }
        if (!result.text) result.text = event.result;
        const gainsMap = {};
        if (event.gains) {
          for (const [key, value] of Object.entries(event.gains)) {
            if (typeof value === 'object' && value.min !== undefined) {
              const actual = Math.floor(value.min + Math.random() * (value.max - value.min + 1));
              this.modifyResource(key, actual);
              result.effects[key] = (result.effects[key] || 0) + actual;
              gainsMap[key] = actual;
            } else {
              this.modifyResource(key, value);
              result.effects[key] = (result.effects[key] || 0) + value;
              gainsMap[key] = value;
            }
          }
        }
        result.text = this._formatEventResult(result.text, result.effects, gainsMap);
        if (event.itemReward) {
          this.addItem(event.itemReward.id, event.itemReward.qty);
          result.itemReward = event.itemReward;
        }
        this.addLog(LOG_TEMPLATES.yujieEvent.replace('{title}', event.title), 'info');
        this.addLog(result.text, result.gambleResult === 'win' ? 'success' : result.gambleResult === 'lose' ? 'danger' : 'info');
        this.emit('yujieEventResolved', result);
        this.autoSave();
        return result;
      }
    }
    return { event: { title: '无事发生', icon: '🏛️' }, text: '御街上风平浪静，什么也没发生。' };
  }

  // ==================== 赌坊系统（v2.1） ====================
  getDufangInfo() {
    const today = this.getDateStr();
    if (this.state.daily.dufangDate !== today) {
      this.state.daily.dufangDate = today;
      this.state.daily.dufangBets = 0;
      this.state.daily.dufangQuizDone = false;
    }
    const remaining = DUFANG_CONFIG.dailyLimit - this.state.daily.dufangBets;
    return { remaining, totalLimit: DUFANG_CONFIG.dailyLimit, bets: this.state.daily.dufangBets, quizDone: this.state.daily.dufangQuizDone };
  }

  /** 掷骰子 */
  doDiceBet(guess, amount) {
    const info = this.getDufangInfo();
    if (info.remaining <= 0) return { success: false, reason: 'limit', msg: LOG_TEMPLATES.dufangLimit.replace('{limit}', DUFANG_CONFIG.dailyLimit) };
    // v2.2: 防沉迷检查
    const aa = this.checkDufangAntiAddiction();
    if (!aa.allowed) return { success: false, reason: 'cooldown', msg: aa.msg };
    if (amount < DUFANG_CONFIG.dice.minBet || amount > DUFANG_CONFIG.dice.maxBet) return { success: false, reason: 'range', msg: `赌注范围：${DUFANG_CONFIG.dice.minBet}~${DUFANG_CONFIG.dice.maxBet}` };
    if (this.state.resources.silver < amount) return { success: false, reason: 'no_silver' };
    // 掷3个骰子
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const d3 = Math.floor(Math.random() * 6) + 1;
    const sum = d1 + d2 + d3;
    const isLeopard = d1 === d2 && d2 === d3;
    const diceResult = `🎲${d1} 🎲${d2} 🎲${d3}`;
    const diceStr = isLeopard ? '豹子' : sum >= 11 ? '大' : '小';
    let won = false, payout = 0;
    if (isLeopard && guess === 'leopard') { won = true; payout = amount * DUFANG_CONFIG.dice.payoutLeopard; }
    else if (!isLeopard && guess === 'big' && sum >= 11) { won = true; payout = amount * DUFANG_CONFIG.dice.payoutBigSmall; }
    else if (!isLeopard && guess === 'small' && sum <= 10) { won = true; payout = amount * DUFANG_CONFIG.dice.payoutBigSmall; }
    this.state.resources.silver -= amount;
    this.state.daily.dufangBets++;
    const netGain = won ? (payout - amount) : -amount;
    this.recordDufangResult(netGain);
    if (won) {
      const netGain = payout - amount; // 净收益 = 赔付 - 本金
      this.state.resources.silver += payout;
      this.addLog(LOG_TEMPLATES.dufangDiceWin.replace('{result}', diceResult + '(' + diceStr + ')').replace('{guess}', guess === 'leopard' ? '豹子' : guess === 'big' ? '大' : '小').replace('{win}', netGain), 'success');
      this.autoSave();
      return { success: true, won: true, diceResult, diceStr, win: netGain };
    } else {
      this.addLog(LOG_TEMPLATES.dufangDiceLose.replace('{result}', diceResult + '(' + diceStr + ')').replace('{guess}', guess === 'leopard' ? '豹子' : guess === 'big' ? '大' : '小').replace('{bet}', amount), 'danger');
      this.autoSave();
      return { success: true, won: false, diceResult, diceStr, loss: amount };
    }
  }

  /** 赌石 */
  getStonePity() { return this.state.daily.dufangStonePity; }

  doStoneCut(tierId, isHeishiStone = false) {
    const tier = DUFANG_CONFIG.stone.tiers.find(t => t.id === tierId);
    if (!tier) return { success: false, reason: 'not_found' };
    // 消耗原石
    if (isHeishiStone) {
      const stoneId = tierId === 'legend' ? 'heishi_yuanshi_legend' : 'heishi_yuanshi';
      if (!this.hasItem(stoneId)) return { success: false, reason: 'no_stone', msg: '背包中没有黑市原石' };
      this.removeItem(stoneId, 1);
    } else {
      if (this.state.resources.silver < tier.price) return { success: false, reason: 'no_silver' };
      this.state.resources.silver -= tier.price;
    }
    // 选择品质概率表 — v2.4 天字号原石使用专属概率
    let qualityTable;
    if (tier.specialTable) {
      qualityTable = DUFANG_CONFIG.stone.heavenQualities;
    } else if (isHeishiStone) {
      qualityTable = DUFANG_CONFIG.stone.heishiQualities;
    } else {
      qualityTable = DUFANG_CONFIG.stone.qualities;
    }
    // 保底机制
    let pityBonus = 0;
    const pityThreshold = DUFANG_CONFIG.stone.pityThreshold;
    const pityPct = DUFANG_CONFIG.stone.pityBonus;
    if (this.state.daily.dufangStonePity >= pityThreshold) {
      pityBonus = pityPct;
      this.addLog(LOG_TEMPLATES.dufangStonePity.replace('{count}', this.state.daily.dufangStonePity), 'success');
    }
    // 品质修正 — v2.4 帝王绿翡翠加成
    let qualityMod = tier.qualityMod;
    if (this.state.auction.stoneCollections.includes('jade_emperor')) {
      qualityMod += 0.05;
    }
    // 加权随机
    const roll = Math.random();
    let cumulative = 0;
    let selectedQuality = qualityTable[0];
    for (const q of qualityTable) {
      let adjustedChance = q.chance + pityBonus;
      if (q.id !== 'waste') adjustedChance += qualityMod;
      cumulative += adjustedChance;
      if (roll < cumulative) { selectedQuality = q; break; }
    }
    // 判断是否为good及以上
    const qualityLevels = qualityTable.map(q => q.id);
    const goodIdx = qualityLevels.indexOf('good');
    const selectedIdx = qualityLevels.indexOf(selectedQuality.id);
    if (selectedIdx < goodIdx) {
      this.state.daily.dufangStonePity++;
    } else {
      this.state.daily.dufangStonePity = 0;
    }
    const silverGain = Math.floor(tier.price * selectedQuality.value);
    this.state.resources.silver += silverGain;
    this.addLog(LOG_TEMPLATES.dufangStoneResult.replace('{tier}', tier.name).replace('{quality}', selectedQuality.icon + selectedQuality.name).replace('{value}', selectedQuality.value).replace('{silver}', silverGain), 'success');
    // v2.4 天字号藏品掉落
    let collectionDrop = null;
    if (tier.id === 'heaven') {
      const dropRoll = Math.random();
      if (dropRoll < DUFANG_CONFIG.stone.collectionDropChance) {
        const unowned = Object.keys(DUFANG_CONFIG.stone.collections).filter(
          id => !this.state.auction.stoneCollections.includes(id)
        );
        if (unowned.length > 0) {
          const pickedId = unowned[Math.floor(Math.random() * unowned.length)];
          const colInfo = DUFANG_CONFIG.stone.collections[pickedId];
          this.state.auction.stoneCollections.push(pickedId);
          collectionDrop = colInfo;
          this.addLog(`💎 天降奇珍！从原石中开出了「${colInfo.icon}${colInfo.name}」！估价${colInfo.valuation.toLocaleString()}🪙`, 'success');
          this.applyPermanentUpgrades();
          this.checkAchievements();
        }
      }
    }
    this.autoSave();
    return { success: true, tier: tier.name, quality: selectedQuality, value: selectedQuality.value, silverGain, pity: this.state.daily.dufangStonePity, collectionDrop };
  }

  /** 竞猜 */
  getQuizQuestion() {
    return QUIZ_POOL[Math.floor(Math.random() * QUIZ_POOL.length)];
  }

  doQuizAnswer(quizId, answerIdx) {
    const info = this.getDufangInfo();
    if (info.quizDone) return { success: false, reason: 'limit', msg: LOG_TEMPLATES.dufangQuizLimit };
    const quiz = QUIZ_POOL.find(q => q.id === quizId);
    if (!quiz) return { success: false, reason: 'not_found' };
    const bet = DUFANG_CONFIG.quiz.betAmount;
    if (this.state.resources.silver < bet) return { success: false, reason: 'no_silver' };
    this.state.resources.silver -= bet;
    this.state.daily.dufangQuizDone = true;
    if (answerIdx === quiz.answer) {
      const win = bet * DUFANG_CONFIG.quiz.payout;
      this.state.resources.silver += win;
      this.addLog(LOG_TEMPLATES.dufangQuizCorrect.replace('{explanation}', quiz.explanation).replace('{amount}', win), 'success');
      this.autoSave();
      return { success: true, correct: true, win };
    } else {
      this.addLog(LOG_TEMPLATES.dufangQuizWrong.replace('{answer}', quiz.options[quiz.answer]).replace('{explanation}', quiz.explanation), 'danger');
      this.autoSave();
      return { success: true, correct: false };
    }
  }

  // ==================== 盐场投资系统（v2.2） ====================
  isYanchangUnlocked() {
    return this.state.resources.reputation >= YANCHANG_CONFIG.unlockReputation && this.state.prestige.count >= YANCHANG_CONFIG.unlockPrestige;
  }
  getSaltFieldLimit() {
    const rep = this.state.resources.reputation;
    for (const tier of YANCHANG_CONFIG.saltFieldLimits) {
      if (rep <= tier.maxRep) return tier.limit;
    }
    return 0;
  }
  getSaltFieldPrice() {
    const count = this.state.saltFields.length;
    return Math.floor(YANCHANG_CONFIG.basePrice * Math.pow(1 + YANCHANG_CONFIG.priceIncrement, count));
  }
  buySaltField() {
    if (!this.isYanchangUnlocked()) return { success: false, reason: 'locked' };
    if (this.state.saltFields.length >= this.getSaltFieldLimit()) return { success: false, reason: 'limit' };
    const price = this.getSaltFieldPrice();
    if (this.state.resources.silver < price) return { success: false, reason: 'no_silver' };
    this.modifyResource('silver', -price);
    const field = {
      id: 'sf_' + Date.now(),
      purchasePrice: price,
      speed: 'medium',
      riskAccumulated: 0,
      totalOutput: 0,
      pendingOutput: 0,
      purchaseTime: Date.now(),
      active: true,
    };
    this.state.saltFields.push(field);
    this.addLog(LOG_TEMPLATES.yanchangBuy, 'info');
    this.emit('saltFieldBought', field);
    this.autoSave();
    return { success: true, field };
  }
  setSaltFieldSpeed(fieldId, speed) {
    const field = this.state.saltFields.find(f => f.id === fieldId);
    if (!field || !field.active) return { success: false };
    field.speed = speed;
    this.addLog(LOG_TEMPLATES.yanchangSpeedChange.replace('{name}', YANCHANG_CONFIG.speeds[speed].name), 'info');
    this.emit('saltFieldSpeedChanged', field);
    this.autoSave();
    return { success: true };
  }
  collectSaltFieldOutput(fieldId) {
    const field = this.state.saltFields.find(f => f.id === fieldId);
    if (!field || !field.active) return { success: false };
    const amount = field.pendingOutput;
    if (amount <= 0) return { success: false, reason: 'empty' };
    field.pendingOutput = 0;
    field.totalOutput += amount;
    this.modifyResource('silver', amount);
    this.addLog(LOG_TEMPLATES.yanchangCollect.replace('{silver}', amount.toLocaleString()), 'success');
    this.emit('saltFieldCollected', { fieldId, amount });
    this.autoSave();
    return { success: true, amount };
  }
  abandonSaltField(fieldId) {
    const idx = this.state.saltFields.findIndex(f => f.id === fieldId);
    if (idx === -1) return { success: false };
    const field = this.state.saltFields[idx];
    const recovery = Math.floor(field.purchasePrice * YANCHANG_CONFIG.abandonRecoveryRate);
    this.modifyResource('silver', recovery);
    // 同时领取待领产出
    if (field.pendingOutput > 0) {
      this.modifyResource('silver', field.pendingOutput);
      field.totalOutput += field.pendingOutput;
    }
    this.state.saltFields.splice(idx, 1);
    this.addLog(LOG_TEMPLATES.yanchangAbandon.replace('{silver}', recovery.toLocaleString()), 'warning');
    this.emit('saltFieldAbandoned', { fieldId, recovery });
    this.autoSave();
    return { success: true, recovery };
  }
  settleSaltFields() {
    // 每10秒结算一次盐场产出和风险
    for (const field of this.state.saltFields) {
      if (!field.active) continue;
      const speedConfig = YANCHANG_CONFIG.speeds[field.speed];
      const output = Math.floor(YANCHANG_CONFIG.baseOutput * speedConfig.multiplier);
      field.pendingOutput += output;
      // 风险累积（每10秒=1/6分钟）
      field.riskAccumulated += speedConfig.riskPerMin / 6;
      // 查封检查 — v2.4 御前圣令免疫查封
      if (field.riskAccumulated >= YANCHANG_CONFIG.riskMax) {
        if (this.checkConfiscationImmunity()) {
          field.riskAccumulated = 0; // 免疫：重置风险但不没收盐场
          this.addLog(LOG_TEMPLATES.auctionImperialDecreeBlock, 'success');
        } else {
          const idx = this.state.saltFields.indexOf(field);
          this.state.saltFields.splice(idx, 1);
          this.addLog(LOG_TEMPLATES.yanchangConfiscated, 'danger');
          this.emit('saltFieldConfiscated', { fieldId: field.id });
        }
      } else if (field.riskAccumulated >= 80) {
        this.addLog(LOG_TEMPLATES.yanchangRiskWarning.replace('{risk}', Math.floor(field.riskAccumulated)), 'warning');
      }
    }
  }
  getSaltFieldInfo() {
    return {
      unlocked: this.isYanchangUnlocked(),
      fields: this.state.saltFields,
      limit: this.getSaltFieldLimit(),
      nextPrice: this.getSaltFieldPrice(),
    };
  }

  // ==================== 终局供奉系统（v2.2） ====================
  isGongfengUnlocked() {
    return Object.values(this.state.shops).every(s => s.level >= 100);
  }
  doGongfeng(tierId) {
    if (!this.isGongfengUnlocked()) return { success: false, reason: 'locked', msg: LOG_TEMPLATES.gongfengNotUnlocked };
    const tier = GONGFENG_CONFIG.tiers.find(t => t.id === tierId);
    if (!tier) return { success: false, reason: 'invalid_tier' };
    if (this.state.resources.silver < tier.silverCost) return { success: false, reason: 'no_silver', msg: LOG_TEMPLATES.gongfengNoSilver };
    this.modifyResource('silver', -tier.silverCost);
    this.state.prestige.legacy += tier.legacyGain;
    this.state.gongfeng.totalOffered += tier.silverCost;
    this.state.gongfeng.totalLegacy += tier.legacyGain;
    this.addLog(LOG_TEMPLATES.gongfengSuccess.replace('{tier}', tier.name).replace('{silver}', tier.silverCost.toLocaleString()).replace('{legacy}', tier.legacyGain), 'success');
    this.emit('gongfengDone', { tier, legacy: tier.legacyGain });
    this.autoSave();
    return { success: true, tier };
  }

  // ==================== 赌坊防沉迷（v2.2） ====================
  checkDufangAntiAddiction() {
    const aa = this.state.dufangAntiAddiction;
    // 每日重置
    const today = new Date().toDateString();
    if (aa.date !== today) {
      aa.date = today; aa.dailyLoss = 0; aa.consecutiveLosses = 0; aa.cooldownUntil = 0;
    }
    // 冷却检查
    if (aa.cooldownUntil && Date.now() < aa.cooldownUntil) {
      const hoursLeft = Math.ceil((aa.cooldownUntil - Date.now()) / 3600000);
      return { allowed: false, reason: 'cooldown', msg: `赌坊冷却中，还需${hoursLeft}小时`, hoursLeft };
    }
    return { allowed: true };
  }
  recordDufangResult(netGain) {
    const aa = this.state.dufangAntiAddiction;
    if (netGain < 0) {
      aa.dailyLoss += Math.abs(netGain);
      aa.consecutiveLosses++;
      // 日亏上限
      if (aa.dailyLoss >= DUFANG_CONFIG.antiAddiction.dailyLossLimit) {
        aa.cooldownUntil = Date.now() + DUFANG_CONFIG.antiAddiction.cooldownHours * 3600000;
        this.addLog(LOG_TEMPLATES.dufangAntiAddiction.replace('{hours}', DUFANG_CONFIG.antiAddiction.cooldownHours), 'warning');
        return { cooldown: true };
      }
      // 连输提示
      if (aa.consecutiveLosses >= DUFANG_CONFIG.antiAddiction.consecutiveLossWarn) {
        this.addLog(LOG_TEMPLATES.dufangConsecutiveLoss.replace('{count}', aa.consecutiveLosses), 'info');
      }
    } else if (netGain > 0) {
      aa.consecutiveLosses = 0;
    }
    return { cooldown: false };
  }

  // ==================== 黑市系统（v2.1） ====================
  refreshHeishi() {
    const now = Date.now();
    const available = HEISHI_GOODS.filter(g => {
      if (g.needPrestige && this.state.prestige.count < g.needPrestige) return false;
      return true;
    });
    // 加权随机选择商品
    const goods = [];
    const pool = [...available];
    for (let i = 0; i < HEISHI_CONFIG.slotsPerRefresh && pool.length > 0; i++) {
      const totalChance = pool.reduce((s, g) => s + g.chance, 0);
      let roll = Math.random() * totalChance;
      let cumulative = 0;
      let selectedIdx = -1;
      for (let j = 0; j < pool.length; j++) {
        cumulative += pool[j].chance;
        if (roll < cumulative) { selectedIdx = j; break; }
      }
      if (selectedIdx >= 0) {
        const g = pool[selectedIdx];
        const priceMult = HEISHI_CONFIG.priceMultiplierMin + Math.random() * (HEISHI_CONFIG.priceMultiplierMax - HEISHI_CONFIG.priceMultiplierMin);
        goods.push({ ...g, currentPrice: Math.floor(g.basePrice * priceMult), priceMultiplier: parseFloat(priceMult.toFixed(2)) });
        pool.splice(selectedIdx, 1);
      }
    }
    this.state.heishi.goods = goods;
    this.state.heishi.prices = {};
    for (const g of goods) { this.state.heishi.prices[g.id] = g.currentPrice; }
    this.state.heishi.lastRefreshStep = this.state.meta.totalTravels;
    this.state.heishi.lastRefreshTimestamp = Date.now();
    this.addLog(LOG_TEMPLATES.heishiRefresh, 'info');
    this.emit('heishiRefreshed', goods);
    this.autoSave();
  }

  getHeishiGoods() {
    return this.state.heishi.goods;
  }

  getHeishiRefreshInfo() {
    const totalSteps = this.state.meta.totalTravels;
    const stepsNeeded = this.getHeishiRefreshSteps();
    const stepsSince = totalSteps - (this.state.heishi.lastRefreshStep || 0);
    const stepsLeft = Math.max(0, stepsNeeded - stepsSince);
    return { stepsLeft, stepsNeeded, nextRefreshStr: stepsLeft > 0 ? `${stepsLeft}步` : '即将刷新' };
  }

  enterHeishi() {
    if (!this.hasItem('heishiling')) return { success: false, reason: 'no_token', msg: LOG_TEMPLATES.heishiNoToken };
    this.removeItem('heishiling', 1);
    // 查抄判定 — v2.4 御前圣令免疫查封
    let inspected = false, loss = 0, repGain = 0, decreeBlocked = false;
    if (Math.random() < HEISHI_CONFIG.inspectRate) {
      if (this.checkConfiscationImmunity()) {
        decreeBlocked = true;
        this.addLog(LOG_TEMPLATES.auctionImperialDecreeBlock, 'success');
      } else {
        inspected = true;
        loss = Math.floor(this.state.resources.silver * HEISHI_CONFIG.inspectSilverLoss);
        repGain = HEISHI_CONFIG.inspectReputationBonus;
        this.state.resources.silver -= loss;
        this.modifyResource('reputation', repGain);
        this.addLog(LOG_TEMPLATES.heishiInspect.replace('{loss}', loss).replace('{rep}', repGain), 'danger');
      }
    } else {
      this.addLog(LOG_TEMPLATES.heishiEnter, 'info');
    }
    if (this.state.heishi.goods.length === 0) this.refreshHeishi();
    this.emit('heishiEnter', { inspected, loss, repGain, decreeBlocked });
    this.autoSave();
    return { success: true, inspected, loss, repGain, decreeBlocked };
  }

  buyHeishiGood(goodId) {
    const good = this.state.heishi.goods.find(g => g.id === goodId);
    if (!good) return { success: false, reason: 'not_found' };
    if (this.state.resources.silver < good.currentPrice) return { success: false, reason: 'no_silver', msg: '银两不足' };
    this.state.resources.silver -= good.currentPrice;
    if (good.itemReward) {
      this.addItem(good.itemReward.id, good.itemReward.qty);
    }
    this.addLog(LOG_TEMPLATES.heishiBuy.replace('{icon}', good.icon).replace('{name}', good.name).replace('{cost}', good.currentPrice), 'success');
    // 移除已购买商品
    this.state.heishi.goods = this.state.heishi.goods.filter(g => g.id !== goodId);
    delete this.state.heishi.prices[goodId];
    this.emit('heishiGoodBought', { goodId, good });
    this.autoSave();
    return { success: true, good };
  }

  // ==================== 离线收益 ====================
  calculateOfflineEarnings() {
    const now = Date.now();
    const lastActive = this.state.meta.lastActiveTime;
    if (!lastActive || lastActive >= now) return 0;
    let elapsedSeconds = (now - lastActive) / 1000;
    // v2.0: Prestige后离线收益更优
    const isPrestige = this.state.prestige.count > 0;
    const maxSeconds = (isPrestige ? GAME_CONFIG.offlineMaxHoursPrestige : GAME_CONFIG.offlineMaxHours) * 3600;
    const ratio = isPrestige ? GAME_CONFIG.offlineRatioPrestige : GAME_CONFIG.offlineRatio;
    if (elapsedSeconds < 10) return 0;
    // 追踪离线时长
    const offlineHours = elapsedSeconds / 3600;
    if (!this.state.meta.maxOfflineHours || offlineHours > this.state.meta.maxOfflineHours) {
      this.state.meta.maxOfflineHours = offlineHours;
    }
    const cappedSeconds = Math.min(elapsedSeconds, maxSeconds);
    const totalOutput = this.getTotalShopOutput();
    const cycles = Math.floor(cappedSeconds / 10);
    const rawEarnings = cycles * totalOutput;
    const earnings = Math.floor(rawEarnings * ratio);
    if (earnings > 0) {
      this.modifyResource('silver', earnings);
      const hours = Math.floor(cappedSeconds / 3600);
      const minutes = Math.floor((cappedSeconds % 3600) / 60);
      let timeStr = '';
      if (hours > 0) timeStr += `${hours}小时`;
      if (minutes > 0) timeStr += `${minutes}分钟`;
      if (!timeStr) timeStr = `${Math.floor(cappedSeconds)}秒`;
      this.addLog(`掌柜归来！离线${timeStr}，店铺为你赚了 ${earnings} 两银子！`, 'success');
      this.emit('offlineEarnings', { amount: earnings, duration: cappedSeconds });
    }
    this.recoverEnergy();
    this.state.meta.lastActiveTime = now;
    this.autoSave();
    return earnings;
  }

  // ==================== 日志 ====================
  addLog(message, type = 'info') {
    this.state.logs.unshift({ message, type, time: Date.now() });
    if (this.state.logs.length > 50) this.state.logs.length = 50;
    this.emit('logAdded', { message, type });
  }

  // ==================== 定时器 ====================
  startTimers() {
    if (this.state.shopTimer) clearInterval(this.state.shopTimer);
    this.state.shopTimer = setInterval(() => {
      // v2.3: 商机闪现触发判定
      if (!this.state.disguised && this.getActivityMultiplier() >= 1.0 && !this.state.activity.businessFlashActive) {
        if (Math.random() < GAME_CONFIG.businessFlashChance) {
          this.state.activity.businessFlashActive = true;
          this.state.activity.businessFlashEndTime = Date.now() + GAME_CONFIG.businessFlashDuration * 1000;
          this.addLog(LOG_TEMPLATES.businessFlash, 'success');
          this.emit('businessFlash');
        }
      }
      // 商机闪现过期检查
      if (this.state.activity.businessFlashActive && Date.now() > this.state.activity.businessFlashEndTime) {
        this.state.activity.businessFlashActive = false;
      }
      const total = this.getTotalShopOutput();
      if (total > 0) { this.modifyResource('silver', total); this.state.meta.lastActiveTime = Date.now(); }
      // v2.2: 盐场结算
      this.settleSaltFields();
    }, 10000);
    if (this.state.energyTimer) clearInterval(this.state.energyTimer);
    this.state.energyTimer = setInterval(() => this.recoverEnergy(), 1000);
    if (this.state.autoSaveTimer) clearInterval(this.state.autoSaveTimer);
    this.state.autoSaveTimer = setInterval(() => this.autoSave(), GAME_CONFIG.autoSaveInterval);
  }

  // ==================== 伪装模式 ====================
  toggleDisguise() {
    this.state.disguised = !this.state.disguised;
    this.emit('disguiseToggle', { disguised: this.state.disguised, type: this.state.disguiseType });
    return this.state.disguised;
  }
  setDisguiseType(type) {
    if (!DISGUISE_TYPES[type]) return false;
    this.state.disguiseType = type;
    this.emit('disguiseTypeChanged', type);
    this.autoSave();
    return true;
  }

  // ==================== 教程 ====================
  updateTutorialState() { if (!this.state.meta.tutorialCompleted) this.emit('tutorialNeeded'); }
  completeTutorial() { this.state.meta.tutorialCompleted = true; this.autoSave(); }
  skipTutorial() { this.state.meta.tutorialCompleted = true; this.emit('tutorialSkipped'); this.autoSave(); }

  // ==================== v2.4 聚宝阁（拍卖）= ====================
  checkAuctionUnlock() {
    if (!this.state.auction.unlocked && this.state.resources.reputation >= AUCTION_CONFIG.unlockReputation) {
      this.state.auction.unlocked = true;
      this.addLog(LOG_TEMPLATES.auctionUnlock, 'success');
      this.emit('auctionUnlocked');
    }
  }

  getAuctionRefreshInfo() {
    const totalSteps = this.state.meta.totalTravels;
    const stepsNeeded = getAuctionRefreshSteps(this.state.resources.reputation);
    const stepsSince = totalSteps - (this.state.auction.lastRefreshStep || 0);
    const stepsLeft = Math.max(0, stepsNeeded - stepsSince);
    return {
      unlocked: this.state.auction.unlocked,
      stepsLeft,
      stepsNeeded,
      nextRefreshStr: stepsLeft > 0 ? `${stepsLeft}步` : '即将刷新',
      forceRefreshUsedToday: this.state.auction.forceRefreshUsedToday,
      forceRefreshMax: AUCTION_CONFIG.forceRefreshDailyLimit,
      heishiTokensBought: this.state.auction.heishiTokensBoughtThisRound,
      heishiTokenMax: AUCTION_CONFIG.heishiTokenMaxPerRefresh,
      collections: this.state.auction.collections,
      stoneCollections: this.state.auction.stoneCollections,
    };
  }

  refreshAuctionItems() {
    const items = [];
    const poolCopy = [...AUCTION_CATEGORY_POOL];
    for (let i = 0; i < AUCTION_CONFIG.itemsPerRefresh; i++) {
      const category = this.weightedPick(poolCopy, 'prob');
      let item = null;
      if (category.name === 'collectible') {
        const available = Object.values(AUCTION_COLLECTIBLES).filter(
          c => !this.state.auction.collections.includes(c.id)
        );
        if (available.length > 0) {
          const pick = available[Math.floor(Math.random() * available.length)];
          item = {
            id: `auction_col_${pick.id}`,
            name: pick.name,
            icon: pick.icon,
            category: 'collectibles',
            price: pick.price,
            data: pick,
          };
        }
      } else if (category.name === 'protection') {
        const available = Object.values(PROTECTION_ITEMS).filter(p => {
          const existing = this.state.backpack.items.find(bi => bi.id === p.id);
          return !existing || existing.qty < p.maxStack;
        });
        if (available.length > 0) {
          const pick = available[Math.floor(Math.random() * available.length)];
          item = {
            id: `auction_prot_${pick.id}_${Date.now()}`,
            name: pick.name,
            icon: pick.icon,
            category: 'protection',
            price: pick.price,
            priceLabel: pick.priceLabel || `${pick.price}🪙`,
            data: pick,
          };
        }
      } else if (category.name === 'heishiToken') {
        item = {
          id: 'auction_heishi_token',
          name: '黑市令',
          icon: '🎫',
          category: 'heishi_token',
          price: AUCTION_CONFIG.heishiTokenPrice,
          maxPerRefresh: AUCTION_CONFIG.heishiTokenMaxPerRefresh,
        };
      } else if (category.name === 'rareItem') {
        const pick = AUCTION_RARE_ITEMS[Math.floor(Math.random() * AUCTION_RARE_ITEMS.length)];
        const price = Math.floor(pick.originalPrice * AUCTION_CONFIG.rarePriceMarkup);
        item = {
          id: `auction_rare_${pick.id}_${Date.now()}`,
          name: pick.name,
          icon: pick.icon,
          category: 'rare',
          price,
          data: pick,
        };
      } else if (category.name === 'consumablePack') {
        const pick = AUCTION_CONSUMABLE_PACKS[Math.floor(Math.random() * AUCTION_CONSUMABLE_PACKS.length)];
        item = {
          id: `auction_pack_${pick.id}_${Date.now()}`,
          name: pick.name,
          icon: pick.icon,
          category: 'consumable',
          price: pick.price,
          data: pick,
        };
      }
      if (item) items.push(item);
    }
    this.state.auction.items = items;
    this.state.auction.lastRefreshStep = this.state.meta.totalTravels;
    this.state.auction.heishiTokensBoughtThisRound = 0;
    this.addLog(LOG_TEMPLATES.auctionRefreshed, 'info');
    this.emit('auctionRefreshed', { items });
    this.autoSave();
  }

  weightedPick(arr, weightKey) {
    const total = arr.reduce((sum, a) => sum + (a[weightKey] || 0), 0);
    let roll = Math.random() * total;
    for (const a of arr) {
      roll -= (a[weightKey] || 0);
      if (roll <= 0) return a;
    }
    return arr[arr.length - 1];
  }

  purchaseAuctionItem(idx) {
    if (!this.state.auction.unlocked) return { success: false, reason: 'locked' };
    if (idx < 0 || idx >= this.state.auction.items.length) return { success: false, reason: 'invalid' };
    const item = this.state.auction.items[idx];
    if (!item) return { success: false, reason: 'sold' };
    if (this.state.resources.silver < item.price) return { success: false, reason: 'no_silver', msg: LOG_TEMPLATES.auctionNoSilver };
    // 检查背包空间
    if (this.state.backpack.items.length >= this.state.backpack.maxSlots) {
      return { success: false, reason: 'bag_full', msg: LOG_TEMPLATES.auctionBagFull };
    }
    this.state.resources.silver -= item.price;
    // 根据类别处理
    if (item.category === 'collectibles') {
      if (this.state.auction.collections.includes(item.data.id)) {
        this.state.resources.silver += item.price;
        return { success: false, reason: 'already_owned' };
      }
      this.state.auction.collections.push(item.data.id);
      this.addLog(LOG_TEMPLATES.auctionBuy.replace('{name}', `${item.icon}${item.name}`).replace('{price}', item.price.toLocaleString()), 'success');
    } else if (item.category === 'protection') {
      const existing = this.state.backpack.items.find(bi => bi.id === item.data.id);
      if (existing && existing.qty >= item.data.maxStack) {
        this.state.resources.silver += item.price;
        return { success: false, reason: 'max_stack', msg: LOG_TEMPLATES.auctionProtectionMax };
      }
      this.addItem(item.data.id, 1);
      this.addLog(LOG_TEMPLATES.auctionBuy.replace('{name}', `${item.icon}${item.name}`).replace('{price}', item.price.toLocaleString()), 'success');
    } else if (item.category === 'rare') {
      this.addItem(item.data.id, item.data.qty || 1);
      this.addLog(LOG_TEMPLATES.auctionBuy.replace('{name}', `${item.icon}${item.name}`).replace('{price}', item.price.toLocaleString()), 'success');
    } else if (item.category === 'consumable') {
      for (const r of (item.data.rewards || [])) {
        if (r.type === 'item') this.addItem(r.id, r.qty || 1);
        else if (r.type === 'silver') this.state.resources.silver += r.amount;
        else if (r.type === 'reputation') this.modifyResource('reputation', r.amount);
        else if (r.type === 'stamina') this.modifyResource('stamina', r.amount);
      }
      this.addLog(LOG_TEMPLATES.auctionBuy.replace('{name}', `${item.icon}${item.name}`).replace('{price}', item.price.toLocaleString()), 'success');
    }
    this.state.auction.items.splice(idx, 1);
    this.emit('auctionItemBought', { idx, item });
    this.autoSave();
    return { success: true, item };
  }

  forceRefreshAuction() {
    if (!this.state.auction.unlocked) return { success: false, reason: 'locked' };
    const today = this.getDateStr();
    if (this.state.auction.forceRefreshDate !== today) {
      this.state.auction.forceRefreshUsedToday = 0;
      this.state.auction.forceRefreshDate = today;
    }
    if (this.state.auction.forceRefreshUsedToday >= AUCTION_CONFIG.forceRefreshDailyLimit) {
      return { success: false, reason: 'limit', msg: LOG_TEMPLATES.auctionForceRefreshLimit.replace('{limit}', AUCTION_CONFIG.forceRefreshDailyLimit) };
    }
    if (this.state.resources.silver < AUCTION_CONFIG.forceRefreshCost) {
      return { success: false, reason: 'no_silver', msg: LOG_TEMPLATES.auctionForceRefreshNoSilver };
    }
    this.state.resources.silver -= AUCTION_CONFIG.forceRefreshCost;
    this.state.auction.forceRefreshUsedToday++;
    this.addLog(LOG_TEMPLATES.auctionForceRefresh, 'info');
    this.refreshAuctionItems();
    return { success: true };
  }

  purchaseAuctionHeishiToken(qty = 1) {
    if (!this.state.auction.unlocked) return { success: false, reason: 'locked' };
    qty = Math.max(1, Math.min(qty, AUCTION_CONFIG.heishiTokenMaxPerRefresh - this.state.auction.heishiTokensBoughtThisRound));
    if (qty <= 0) return { success: false, reason: 'limit', msg: LOG_TEMPLATES.auctionHeishiTokenLimit.replace('{max}', AUCTION_CONFIG.heishiTokenMaxPerRefresh) };
    const totalPrice = AUCTION_CONFIG.heishiTokenPrice * qty;
    if (this.state.resources.silver < totalPrice) return { success: false, reason: 'no_silver', msg: LOG_TEMPLATES.auctionNoSilver };
    if (this.state.backpack.items.length >= this.state.backpack.maxSlots) {
      return { success: false, reason: 'bag_full', msg: LOG_TEMPLATES.auctionBagFull };
    }
    this.state.resources.silver -= totalPrice;
    this.addItem('heishiling', qty);
    this.state.auction.heishiTokensBoughtThisRound += qty;
    this.addLog(LOG_TEMPLATES.auctionHeishiTokenBuy.replace('{quantity}', qty).replace('{price}', totalPrice.toLocaleString()), 'success');
    this.emit('auctionHeishiBought', { qty, price: totalPrice });
    this.autoSave();
    return { success: true, qty, price: totalPrice };
  }

  checkConfiscationImmunity() {
    if (!this.state.auction) return false;
    const idx = this.state.backpack.items.findIndex(i => i.id === 'protection_imperial_decree');
    if (idx >= 0) {
      const item = this.state.backpack.items[idx];
      if (item.qty > 1) item.qty--;
      else this.state.backpack.items.splice(idx, 1);
      this.emit('protectionUsed', { type: 'imperial_decree' });
      return true;
    }
    return false;
  }

  checkPunitiveSetbackImmunity() {
    if (!this.state.auction) return false;
    const idx = this.state.backpack.items.findIndex(i => i.id === 'protection_death_medal');
    if (idx >= 0) {
      this.state.backpack.items.splice(idx, 1);
      this.state.resources.stamina = 10;
      this.addLog(LOG_TEMPLATES.auctionDeathMedalBlock, 'success');
      this.emit('protectionUsed', { type: 'death_medal' });
      return true;
    }
    return false;
  }
}

const game = new GameEngine();
