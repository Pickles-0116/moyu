/**
 * 《掌柜偷闲录》- UI交互层 (v1.1 P1全量)
 * 管理：界面渲染、背包面板、店铺售卖、快捷栏、商途地图、Prestige、商情、传闻、成就、伪装多样化、存档导入导出
 */

class GameUI {
  constructor(gameEngine) {
    this.game = gameEngine;
    this.tutorialStep = 0;
    this.tutorialActive = false;
    this.activePanel = null;
    this.draggingItem = null;
    this.init();
  }

  init() {
    this.cacheDOMElements();
    this.bindEvents();
    this.bindGameEvents();
    this.renderAll();
    this.initDisguiseContent();
  }

  // ==================== DOM缓存 ====================
  cacheDOMElements() {
    this.el = {
      app: document.getElementById('app'),
      eventArea: document.getElementById('eventArea'),
      travelBtn: document.getElementById('travelBtn'),
      fastTravelBtn: document.getElementById('fastTravelBtn'),
      resourcePanel: document.getElementById('resourcePanel'),
      energyBar: document.getElementById('energyBar'),
      energyText: document.getElementById('energyText'),
      energyRecovery: document.getElementById('energyRecovery'),
      shopList: document.getElementById('shopList'),
      logList: document.getElementById('logList'),
      totalOutput: document.getElementById('totalOutput'),
      quickSlotBar: document.getElementById('quickSlotBar'),
      tutorialOverlay: document.getElementById('tutorialOverlay'),
      disguiseOverlay: document.getElementById('disguiseOverlay'),
      bossKeyBtn: document.getElementById('bossKeyBtn'),
      resetBtn: document.getElementById('resetBtn'),
      navbar: document.querySelector('.navbar'),
      // 面板按钮
      backpackBtn: document.getElementById('backpackBtn'),
      outingBtn: document.getElementById('outingBtn'),      // v2.0
      roadBtn: document.getElementById('roadBtn'),
      prestigeBtn: document.getElementById('prestigeBtn'),
      dailyBtn: document.getElementById('dailyBtn'),
      marketBtn: document.getElementById('marketBtn'),
      rumorBtn: document.getElementById('rumorBtn'),
      achievementBtn: document.getElementById('achievementBtn'),
      settingsBtn: document.getElementById('settingsBtn'),
      // 模态面板
      modalOverlay: document.getElementById('modalOverlay'),
      modalContent: document.getElementById('modalContent'),
    };
  }

  // ==================== 用户事件绑定 ====================
  bindEvents() {
    this.el.travelBtn.addEventListener('click', (e) => {
      this.createRipple(e);
      if (this.tutorialActive && this.tutorialStep === 1) this.nextTutorialStep();
      // 批量出发模式：点一次跑 10 次，事件自动选 A
      if (this.game.isBatchTravelActive()) {
        this.game.stopBatchTravel();
        return;
      }
      this.game.startTravel();
    });
    if (this.el.fastTravelBtn) {
      this.el.fastTravelBtn.addEventListener('click', (e) => {
        this.createRipple(e);
        const result = this.game.startFastTravel();
        if (!result.success) { alert(result.msg); return; }
        this.renderResources();
        this.updateFastTravelButton();
      });
    }
    this.el.bossKeyBtn.addEventListener('click', () => this.game.toggleDisguise());
    document.addEventListener('keydown', (e) => {
      // esc 永远优先触发伪装（disguiseOverlay z-index:9999 会覆盖弹窗），
      // 让用户能在任何状态下（包括打开拍卖/商情等弹窗时）一键切换伪装
      if (e.key === 'Escape') { e.preventDefault(); this.game.toggleDisguise(); }
    });
    this.el.resetBtn.addEventListener('click', () => {
      if (confirm('确定要重置游戏吗？所有进度将丢失！')) { this.game.resetGame(); }
    });
    // 面板切换
    if (this.el.outingBtn) this.el.outingBtn.addEventListener('click', () => this.togglePanel('outing'));
    if (this.el.backpackBtn) this.el.backpackBtn.addEventListener('click', () => this.togglePanel('backpack'));
    if (this.el.roadBtn) this.el.roadBtn.addEventListener('click', () => this.togglePanel('road'));
    if (this.el.prestigeBtn) this.el.prestigeBtn.addEventListener('click', () => this.togglePanel('prestige'));
    if (this.el.dailyBtn) this.el.dailyBtn.addEventListener('click', () => this.togglePanel('daily'));
    if (this.el.marketBtn) this.el.marketBtn.addEventListener('click', () => this.togglePanel('market'));
    if (this.el.rumorBtn) this.el.rumorBtn.addEventListener('click', () => this.togglePanel('rumor'));
    if (this.el.achievementBtn) this.el.achievementBtn.addEventListener('click', () => this.togglePanel('achievement'));
    if (this.el.settingsBtn) this.el.settingsBtn.addEventListener('click', () => this.togglePanel('settings'));
    // 模态关闭
    if (this.el.modalOverlay) {
      this.el.modalOverlay.addEventListener('click', (e) => { if (e.target === this.el.modalOverlay) this.closePanel(); });
    }
    // 资源面板鼠标光晕
    this.initResourceHoverEffects();
  }

  /** 资源面板鼠标跟随光晕 */
  initResourceHoverEffects() {
    if (!this.el.resourcePanel) return;
    this.el.resourcePanel.querySelectorAll('.resource-item').forEach(item => {
      item.addEventListener('mousemove', (e) => {
        const rect = item.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        item.style.setProperty('--mouse-x', `${x}%`);
        item.style.setProperty('--mouse-y', `${y}%`);
      });
    });
  }

  /** 按钮波纹效果 */
  createRipple(e) {
    const btn = e.currentTarget;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }

  // ==================== 游戏事件监听 ====================
  bindGameEvents() {
    this.game.on('resourceChange', (data) => { this.renderResources(); this.showFloatText(data); this.updateTravelButton(); });
    this.game.on('energyChange', () => { this.renderEnergy(); this.updateTravelButton(); this.updateFastTravelButton(); });
    this.game.on('travelStart', () => { this.renderTravelProgress(); this.updateTravelButton(); });
    this.game.on('batchTravelStart', () => this.updateTravelButton());
    this.game.on('batchTravelStop', () => this.updateTravelButton());
    this.game.on('batchTravelDone', () => this.updateTravelButton());
    this.game.on('travelProgress', (p) => this.updateProgressBar(p));
    this.game.on('eventTriggered', (e) => this.renderEvent(e));
    this.game.on('eventResolved', (r) => { this.renderEventResolved(r); this.renderResources(); this.renderShops(); this.updateTravelButton(); });
    this.game.on('roundEnd', () => { this.renderIdle(); this.renderResources(); this.renderShops(); this.updateTravelButton(); });
    this.game.on('logAdded', () => this.renderLogs());
    this.game.on('shopUpgraded', () => { this.renderShops(); this.renderResources(); });
    this.game.on('shopUnlocked', () => this.renderShops());
    this.game.on('disguiseToggle', (d) => this.toggleDisguise(d));
    this.game.on('disguiseTypeChanged', () => this.initDisguiseContent());
    this.game.on('offlineEarnings', (d) => this.showOfflineEarnings(d));
    this.game.on('tutorialNeeded', () => this.startTutorial());
    this.game.on('tutorialSkipped', () => {});  // 预留
    this.game.on('backpackChange', () => { this.renderBackpack(); this.renderQuickSlots(); this.updateFastTravelButton(); });
    this.game.on('itemUsed', () => { this.renderBackpack(); this.renderQuickSlots(); this.renderResources(); this.updateFastTravelButton(); });
    this.game.on('itemPurchased', () => { this.renderBackpack(); this.renderQuickSlots(); this.renderResources(); this.renderShops(); this.updateFastTravelButton(); });
    this.game.on('prestigeComplete', () => { this.renderAll(); this.closePanel(); });
    this.game.on('dailyRewardClaimed', () => this.renderDaily());
    this.game.on('marketRefreshed', () => { if (this.activePanel === 'market') this.renderMarket(); });
    this.game.on('marketTrade', () => { this.renderResources(); if (this.activePanel === 'market') this.renderMarket(); });
    this.game.on('itemSold', () => { this.renderResources(); this.renderBackpack(); });
    this.game.on('roadSwitched', () => { this.renderResources(); this.renderRoad(); });
    this.game.on('achievementUnlocked', () => this.renderAchievements());
    this.game.on('banquetDone', () => { this.renderResources(); });  // v2.0
    this.game.on('yiguanDone', () => { this.renderResources(); this.renderYiguan(); });  // v2.1
    this.game.on('yujieEventResolved', () => { this.renderResources(); });  // v2.1
    this.game.on('heishiRefreshed', () => {});  // v2.1
    this.game.on('heishiEnter', () => { this.renderResources(); });  // v2.1
    this.game.on('heishiGoodBought', () => { this.renderResources(); this.renderHeishi(); });  // v2.1
    // v2.2/v2.3 events
    this.game.on('milestoneReached', (m) => { this.renderResources(); this.showMilestone(m); });
    this.game.on('saltFieldBought', () => { this.renderResources(); this.renderYanchang(); });
    this.game.on('saltFieldSpeedChanged', () => this.renderYanchang());
    this.game.on('saltFieldCollected', () => { this.renderResources(); this.renderYanchang(); });
    this.game.on('saltFieldAbandoned', () => { this.renderResources(); this.renderYanchang(); });
    this.game.on('saltFieldConfiscated', () => { this.renderResources(); this.renderYanchang(); alert('⚠️ 盐场被官府查封没收！'); });
    this.game.on('gongfengDone', () => { this.renderResources(); this.renderGongfeng(); });
    this.game.on('shopSold', () => { this.renderResources(); this.renderShops(); });
    this.game.on('businessFlash', () => { this.renderResources(); });
    this.game.on('burnBlood', () => { this.renderResources(); }); // v2.3 燃烧精血
    this.game.on('gameOver', (d) => this.showGameOver(d)); // v2.3 游戏结束
    // v2.4 拍卖
    this.game.on('auctionUnlocked', () => { this.renderResources(); this.renderOuting(); });
    this.game.on('auctionRefreshed', () => { if (this.activePanel === 'auction') this.renderAuction(); });
    this.game.on('auctionItemBought', () => { this.renderResources(); if (this.activePanel === 'auction') this.renderAuction(); });
    this.game.on('protectionUsed', (d) => { this.renderResources(); this.renderBackpack(); });
    setInterval(() => {
      if (this.activePanel) return; // 弹窗打开时跳过，避免 backdrop-filter 重算导致闪烁
      this.renderResources();
      this.renderShops();
    }, 1000);
  }

  // ==================== 面板管理 ====================
  togglePanel(panelId) {
    if (this.activePanel === panelId) { this.closePanel(); return; }
    this.activePanel = panelId;
    this.el.modalOverlay.style.display = 'flex';
    this.renderPanel(panelId);
  }
  closePanel() {
    this.activePanel = null;
    this.el.modalOverlay.style.display = 'none';
    this.el.modalContent.innerHTML = '';
    this.renderResources(); // 补回弹窗期间跳过的刷新
    this.renderShops();
  }

  // v2.3: 燃烧精血
  showBurnBloodUI() {
    const stamina = this.game.getResource('stamina');
    const remaining = GAME_CONFIG.burnBloodLifetimeMax - this.game.state.burnBlood.totalBurned;
    const maxBurn = Math.min(remaining, stamina);
    const silverPer = GAME_CONFIG.burnBloodSilverPerStamina;
    let html = `<div class="panel-card burn-blood-panel"><div class="panel-header"><h3>🩸 燃烧精血</h3><button class="panel-close" onclick="window.gameUI.closePanel()">×</button></div>`;
    html += `<div class="burn-blood-warning">⚠️ 燃烧体力换取银两，每点体力换${silverPer}两。体力归零将<b>直接游戏结束</b>！</div>`;
    html += `<div class="burn-blood-status">当前体力：<strong>${stamina}</strong> | 整局上限：<strong>${GAME_CONFIG.burnBloodLifetimeMax}</strong>点 | 已烧：<strong>${this.game.state.burnBlood.totalBurned}</strong>点 | 可烧：<strong>${maxBurn}</strong>点</div>`;
    html += `<div class="burn-blood-input-row"><label>燃烧数量：</label><input type="number" id="burnAmount" value="1" min="1" max="${maxBurn}" oninput="window.gameUI.updateBurnPreview()"></div>`;
    html += `<div class="burn-blood-preview" id="burnPreview">将获得 <strong>${silverPer}</strong> 银两</div>`;
    // 快捷按钮
    html += '<div class="burn-blood-quick">';
    if (maxBurn >= 10) html += `<button class="btn-sm" onclick="window.gameUI.setBurnAmount(10)">烧10点</button>`;
    if (maxBurn >= 50) html += `<button class="btn-sm" onclick="window.gameUI.setBurnAmount(50)">烧50点</button>`;
    if (maxBurn >= 100) html += `<button class="btn-sm" onclick="window.gameUI.setBurnAmount(100)">烧100点</button>`;
    html += `<button class="btn-sm danger" onclick="window.gameUI.setBurnAmount(${maxBurn})">全部燃烧</button>`;
    html += '</div>';
    html += `<div class="burn-blood-confirm-row"><button class="btn-sm danger" style="width:100%;padding:12px;font-size:1rem;" onclick="window.gameUI.confirmBurnBlood()">确认燃烧</button></div>`;
    html += `<div class="burn-blood-stats">累计燃烧：${this.game.state.burnBlood.totalBurned}/${GAME_CONFIG.burnBloodLifetimeMax}点 | 累计获得：${this.game.state.burnBlood.totalSilverGained.toLocaleString()}两</div>`;
    html += '</div>';
    this.el.modalContent.innerHTML = html;
    this.el.modalOverlay.style.display = 'flex';
  }
  setBurnAmount(n) {
    const input = document.getElementById('burnAmount');
    if (input) { input.value = n; this.updateBurnPreview(); }
  }
  updateBurnPreview() {
    const input = document.getElementById('burnAmount');
    const preview = document.getElementById('burnPreview');
    if (!input || !preview) return;
    const n = parseInt(input.value) || 0;
    const silver = n * GAME_CONFIG.burnBloodSilverPerStamina;
    const willDie = n >= this.game.getResource('stamina');
    preview.innerHTML = `将获得 <strong>${silver.toLocaleString()}</strong> 银两${willDie ? ' <span class="burn-death-warn">⚠️ 体力将归零，游戏结束！</span>' : ''}`;
  }
  confirmBurnBlood() {
    const input = document.getElementById('burnAmount');
    if (!input) return;
    const amount = parseInt(input.value) || 0;
    const result = this.game.burnBlood(amount);
    if (!result.success) {
      if (result.msg) alert(result.msg);
      if (result.reason === 'lifetime_exceed') this.closePanel();
      return;
    }
    if (result.gameOver) return; // 游戏结束弹窗会自动弹出
    this.closePanel();
    this.renderResources();
  }

  // v2.3: 游戏结束
  showGameOver(data) {
    let html = `<div class="game-over-overlay"><div class="game-over-card">`;
    html += `<div class="game-over-icon">💀</div>`;
    html += `<div class="game-over-title">${LOG_TEMPLATES.gameOverTitle}</div>`;
    const gameOverDesc = data && data.reason === 'outing' ? LOG_TEMPLATES.gameOverOutingDesc : LOG_TEMPLATES.gameOverDesc;
    html += `<div class="game-over-desc">${gameOverDesc}</div>`;
    html += `<div class="game-over-stats">`;
    html += `<div class="go-stat"><span class="go-stat-label">总行走步数</span><span class="go-stat-value">${this.game.state.meta.totalTravels}</span></div>`;
    html += `<div class="go-stat"><span class="go-stat-label">总轮次数</span><span class="go-stat-value">${this.game.state.meta.totalRounds}</span></div>`;
    html += `<div class="go-stat"><span class="go-stat-label">最终声望</span><span class="go-stat-value">${this.game.state.resources.reputation.toLocaleString()}</span></div>`;
    html += `<div class="go-stat"><span class="go-stat-label">累计银两</span><span class="go-stat-value">${this.game.state.meta.totalSilverEarned.toLocaleString()}</span></div>`;
    html += `<div class="go-stat"><span class="go-stat-label">燃烧精血</span><span class="go-stat-value">${this.game.state.burnBlood.totalBurned}/${GAME_CONFIG.burnBloodLifetimeMax}点 / ${this.game.state.burnBlood.totalSilverGained.toLocaleString()}两</span></div>`;
    html += `</div>`;
    // 如果可以 Prestige 复活
    const canPrestige = this.game.canPrestige();
    html += `<div class="game-over-actions">`;
    if (canPrestige) {
      html += `<button class="btn-sm primary" style="width:100%;padding:14px;font-size:1rem;" onclick="window.gameUI.gameOverPrestige()">🔥 声望重置复活</button>`;
      html += `<p class="game-over-hint">重置声望换取传承点，体力恢复满值，重新开始</p>`;
    } else {
      html += `<p class="game-over-hint">声望不足无法重置复活。可导出存档后重新开始。</p>`;
      html += `<button class="btn-sm" style="width:100%;padding:14px;margin-top:8px;" onclick="window.gameUI.gameOverExport()">📤 导出存档</button>`;
      html += `<button class="btn-sm danger" style="width:100%;padding:14px;margin-top:8px;" onclick="window.gameUI.gameOverReset()">🗑️ 重新开始</button>`;
    }
    html += `</div></div></div>`;
    this.el.modalContent.innerHTML = html;
    this.el.modalOverlay.style.display = 'flex';
  }
  gameOverPrestige() {
    if (!this.game.doPrestige()) { alert('声望不足，无法重置复活'); return; }
    this.game.startTimers(); // 重启被triggerGameOver停止的定时器
    this.closePanel();
    this.renderAll();
  }
  gameOverExport() {
    const data = this.game.exportSave();
    if (data) {
      const ta = document.createElement('textarea');
      ta.value = data;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('存档已复制到剪贴板！');
    }
  }
  gameOverReset() {
    if (!confirm('确定重新开始？当前进度将全部丢失！')) return;
    this.game.resetGame();
  }
  renderPanel(panelId) {
    switch (panelId) {
      case 'backpack': this.renderBackpack(); break;
      case 'outing': this.renderOuting(); break;  // v2.0
      case 'road': this.renderRoad(); break;
      case 'prestige': this.renderPrestige(); break;
      case 'daily': this.renderDaily(); break;
      case 'market': this.renderMarket(); break;
      case 'rumor': this.renderRumor(); break;
      case 'achievement': this.renderAchievements(); break;
      case 'settings': this.renderSettings(); break;
    }
  }

  // ==================== 渲染函数 ====================
  renderAll() {
    this.renderResources();
    this.renderEnergy();
    this.renderShops();
    this.renderQuickSlots();
    this.renderLogs();
    this.updateTravelButton();
    this.updateFastTravelButton();
    this.renderIdle();
  }

  // --- 资源面板 ---
  renderResources() {
    const resources = [
      { key: 'silver', ...RESOURCES.silver },
      { key: 'reputation', ...RESOURCES.reputation },
      { key: 'stamina', ...RESOURCES.stamina, max: this.game.state.resources.staminaMax },
    ];
    let html = resources.map(r => {
      const val = this.game.getResource(r.key);
      let display = val.toLocaleString();
      if (r.max) display += ` / ${r.max.toLocaleString()}`;
      return `<div class="resource-item" data-resource="${r.key}"><span class="resource-icon">${r.icon}</span><div class="resource-info"><span class="resource-name">${r.name}</span><span class="resource-value" id="val-${r.key}">${display}</span></div></div>`;
    }).join('');
    const st = this.game.getResource('shangtu');
    const roundSt = this.game.state.journey.roundShangtu;
    const cap = this.game.state.journey.roundShangtuMax;
    html += `<div class="resource-item" data-resource="shangtu"><span class="resource-icon">${RESOURCES.shangtu.icon}</span><div class="resource-info"><span class="resource-name">商途值</span><span class="resource-value" id="val-shangtu">${st.toLocaleString()}</span></div></div>`;
    // 商途值软上限指示
    html += `<div class="resource-item shangtu-cap"><span class="resource-icon">📊</span><div class="resource-info"><span class="resource-name">本轮商途</span><span class="resource-value">${roundSt}/${cap}</span></div></div>`;
    // v2.2: 声望幸运加成
    const luckBonus = this.game.getLuckBonus();
    if (luckBonus > 0) html += `<div class="resource-item luck-bonus"><span class="resource-icon">🍀</span><div class="resource-info"><span class="resource-name">幸运</span><span class="resource-value">+${Math.round(luckBonus*100)}%</span></div></div>`;
    // v2.3: 活跃度指示器
    const actInfo = this.game.getActivityInfo();
    let actIcon = '🟢', actText = '全效产出', actClass = 'activity-full';
    if (actInfo.level === 'normal') { actIcon = '🟡'; actText = `产出70%（${actInfo.minutesSinceActive}min）`; actClass = 'activity-normal'; }
    else if (actInfo.level === 'low') { actIcon = '🔴'; actText = `产出50%（${actInfo.minutesSinceActive}min）`; actClass = 'activity-low'; }
    else if (actInfo.level === 'disguise') { actIcon = '🎭'; actText = '伪装70%'; actClass = 'activity-normal'; }
    html += `<div class="resource-item ${actClass}"><span class="resource-icon">${actIcon}</span><div class="resource-info"><span class="resource-name">活跃度</span><span class="resource-value">${actText}</span></div></div>`;
    // v2.3: 商机闪现
    if (actInfo.businessFlashActive) {
      const remain = Math.max(0, Math.ceil((actInfo.businessFlashEndTime - Date.now()) / 1000));
      html += `<div class="resource-item business-flash"><span class="resource-icon">✨</span><div class="resource-info"><span class="resource-name">商机闪现</span><span class="resource-value">×2 ${remain}s</span></div></div>`;
    }
    // v2.3: 燃烧精血按钮
    const stamina = this.game.getResource('stamina');
    if (stamina > 0 && !this.game.state.gameOver) {
      html += `<button class="burn-blood-btn" onclick="window.gameUI.showBurnBloodUI()" title="燃烧1点体力换取${GAME_CONFIG.burnBloodSilverPerStamina}银两，体力归零将游戏结束">🩸 燃烧精血</button>`;
    }
    this.el.resourcePanel.innerHTML = html;
  }

  // --- 精力条 ---
  renderEnergy() {
    const energy = this.game.getEnergyStatus();
    const pct = (energy.current / energy.max) * 100;
    let barClass = pct <= 15 ? 'critical' : pct <= 40 ? 'low' : '';
    this.el.energyBar.style.width = `${pct}%`;
    this.el.energyBar.className = `energy-bar-fill ${barClass}`;
    this.el.energyText.textContent = `⚡ ${energy.current}/${energy.max}`;
    if (energy.current < energy.max) {
      const mins = Math.floor(energy.nextRecovery / 60);
      const secs = energy.nextRecovery % 60;
      this.el.energyRecovery.textContent = `${mins}:${secs.toString().padStart(2, '0')}后恢复`;
    } else { this.el.energyRecovery.textContent = '精力充沛'; }
  }

  // --- 店铺面板 ---
  renderShops() {
    let html = '';
    for (const [shopId, shopDef] of Object.entries(SHOPS)) {
      const shop = this.game.state.shops[shopId];
      if (!shop.unlocked) {
        const cond = shopDef.unlockCondition;
        html += `<div class="shop-item locked"><div class="shop-item-header"><span class="shop-name">${shopDef.icon} ${shopDef.name}</span></div><div class="unlock-hint">需要${cond ? RESOURCES[cond.resource].icon + ' ' + cond.amount.toLocaleString() : ''}解锁</div></div>`;
      } else {
        const output = this.game.getShopOutput(shopId);
        const cost = this.game.getUpgradeCost(shopId);
        const canAfford = this.game.getResource('silver') >= cost;
        html += `<div class="shop-item"><div class="shop-item-header"><span class="shop-name">${shopDef.icon} ${shopDef.name}</span><span class="shop-level">Lv.${shop.level}</span></div><div class="shop-output">产出：${output} 银两/10秒</div>`;
        // 道具售卖区
        if (shopDef.items || shopDef.prestigeItems) {
          html += '<div class="shop-items-row">';
          const allItems = [...(shopDef.items || []), ...(shopDef.prestigeItems || [])];
          for (const si of allItems) {
            const itemDef = ITEM_DEFINITIONS[si.id];
            if (!itemDef) continue;
            if (itemDef.prestigeOnly && !this.game.state.prestige.shopUnlocked) continue;
            if (si.minLevel && shop.level < si.minLevel) continue;
            if (itemDef.maxPurchase === 1 && this.game.state.backpack.purchasedPermanents.includes(si.id)) continue;
            const dynamicPrice = this.game.getItemDynamicPrice(si.id);
            const priceInfo = this.game.getItemPriceInfo(si.id);
            const canBuy = this.game.getResource('silver') >= dynamicPrice;
            const itemType = itemDef.type === 'permanent' ? '永久' : '';
            // v2.4修复：始终显示划线对比价，让玩家看到每级降价
            let priceHtml = `<small><span class="price-original">${ITEM_DEFINITIONS[si.id].price.toLocaleString()}</span> ${dynamicPrice.toLocaleString()}🪙</small>`;
            if (priceInfo.isDynamic && priceInfo.discount > 0) {
              const pct = Math.round(priceInfo.discount * 100);
              priceHtml = `<small><span class="price-original">${ITEM_DEFINITIONS[si.id].price.toLocaleString()}</span> ${dynamicPrice.toLocaleString()}🪙 <span class="discount-badge">-${pct}%</span></small>`;
            }
            html += `<button class="shop-item-btn ${canBuy ? '' : 'disabled'}" onclick="window.gameUI.buyShopItem('${shopId}','${si.id}')" ${!canBuy ? 'disabled' : ''} title="${itemDef.description}">${itemDef.icon} ${itemDef.name} ${itemType}<br>${priceHtml}</button>`;
          }
          html += '</div>';
        }
        // v2.3 变卖按钮
        const sellInfo = this.game.getShopSellRecovery(shopId);
        if (sellInfo && shop.level >= 5) {
          const cooldowns = this.game.state.shopSelling.shopCooldowns || {};
          const onCooldown = cooldowns[shopId] && Date.now() < cooldowns[shopId];
          if (onCooldown) {
            const hoursLeft = Math.ceil((cooldowns[shopId] - Date.now()) / 3600000);
            html += `<button class="btn-sm sell-btn" disabled>变卖冷却中(${hoursLeft}h)</button>`;
          } else {
            html += `<button class="btn-sm sell-btn" onclick="window.gameUI.sellShopUI('${shopId}')">📉 变卖 (回收${sellInfo.recoveryAmount.toLocaleString()}🪙)</button>`;
          }
        }
        html += `<button class="upgrade-btn" onclick="window.gameUI.upgradeShop('${shopId}')" ${!canAfford ? 'disabled' : ''}>升级 ${cost.toLocaleString()}🪙</button></div>`;
      }
    }
    this.el.shopList.innerHTML = html;
    this.el.totalOutput.textContent = `总产出：${this.game.getTotalShopOutput()} 银两/10秒`;
  }

  buyShopItem(shopId, itemId) {
    const result = this.game.buyShopItem(shopId, itemId);
    if (!result.success) {
      if (result.reason === 'insufficient') this.showFloatText({ resource: 'silver', amount: 0 }, true);
      else if (result.reason === 'backpack_full') alert('行囊已满，请先整理！');
      else if (result.reason === 'already_purchased') alert('该永久道具已购买过！');
    }
  }

  upgradeShop(shopId) {
    if (this.tutorialActive && this.tutorialStep === 2) this.nextTutorialStep();
    this.game.upgradeShop(shopId);
  }

  // v2.3 店铺变卖
  sellShopUI(shopId) {
    const sellInfo = this.game.getShopSellRecovery(shopId);
    if (!sellInfo) return;
    const shopDef = SHOPS[shopId];
    const shop = this.game.state.shops[shopId];
    let html = `<div class="panel-card"><div class="panel-header"><h3>📉 变卖 ${shopDef.icon} ${shopDef.name}</h3><button class="panel-close" onclick="window.gameUI.renderShops(); window.gameUI.closePanel();">× 取消</button></div>`;
    html += `<div class="sell-confirm"><div class="sell-warn">⚠️ 变卖后店铺等级归零，需重新解锁升级！</div>`;
    html += `<div class="sell-detail"><div class="sell-row"><span>当前等级</span><strong>Lv.${shop.level}</strong></div>`;
    html += `<div class="sell-row"><span>累计投资</span><strong>${sellInfo.cumulativeInvestment.toLocaleString()}🪙</strong></div>`;
    html += `<div class="sell-row"><span>回收比率</span><strong>${Math.round(sellInfo.recoveryRate * 100)}%</strong></div>`;
    html += `<div class="sell-row"><span>回收银两</span><strong style="color:var(--gold-dark);">${sellInfo.recoveryAmount.toLocaleString()}🪙</strong></div>`;
    if (sellInfo.levelDecay > 0) html += `<div class="sell-row sell-decay"><span>等级衰减</span><span>-${Math.round(sellInfo.levelDecay * 100)}%</span></div>`;
    html += `<div class="sell-row sell-decay"><span>变卖次数</span><span>${sellInfo.sellCount}次 (每次降10%回收率)</span></div>`;
    html += `</div><button class="btn-sm danger" onclick="window.gameUI.confirmSellShop('${shopId}')" style="width:100%;margin-top:12px;">确认变卖</button></div></div>`;
    this.el.modalContent.innerHTML = html;
    this.el.modalOverlay.style.display = 'flex';
  }
  confirmSellShop(shopId) {
    const result = this.game.sellShop(shopId);
    if (result.success) {
      this.renderShops();
      this.renderResources();
      this.closePanel();
      alert(`${SHOPS[shopId].name} 已变卖，回收 ${result.recovery.recoveryAmount.toLocaleString()} 银两`);
    } else {
      if (result.reason === 'cooldown') alert(`冷却中，还需${result.hoursLeft}小时`);
      else alert('变卖失败');
    }
  }

  // --- 事件卡片 ---
  renderIdle() {
    this.el.eventArea.innerHTML = `<div class="event-idle"><div class="idle-icon">🏮</div><div class="idle-text">掌柜的，要出发经商吗？</div><div class="idle-subtitle">点击「出发」开启一段新的商途之旅</div></div>`;
  }
  renderTravelProgress() {
    this.el.eventArea.innerHTML = `<div class="travel-progress"><div class="travel-icon">🐫</div><div class="progress-text">商队行进中...</div><div class="progress-bar-container"><div class="progress-bar-fill" id="progressFill" style="width:0%"></div></div></div>`;
  }
  updateProgressBar(progress) {
    const fill = document.getElementById('progressFill');
    if (fill) fill.style.width = `${progress * 100}%`;
  }
  renderEvent(event) {
    if (!event) return;
    // C选项
    let hasItemOption = false;
    if (event.itemOption) {
      hasItemOption = this.game.hasItem(event.itemOption.item);
    }
    const optionsHtml = event.options.map((opt, idx) => {
      let disabled = false;
      if (opt.effects) {
        for (const [res, amount] of Object.entries(opt.effects)) {
          if (amount < 0 && this.game.getResource(res) < Math.abs(amount)) disabled = true;
        }
      }
      return `<button class="event-option-btn" onclick="window.gameUI.resolveEvent(${idx})" ${disabled ? 'disabled' : ''}>${disabled ? '🔒 ' : ''}${opt.text}</button>`;
    }).join('');
    // C选项按钮
    let itemOptionHtml = '';
    if (hasItemOption) {
      const io = event.itemOption;
      const def = ITEM_DEFINITIONS[io.item];
      itemOptionHtml = `<button class="event-option-btn item-option" onclick="window.gameUI.resolveEventWithItem()">${io.text} (持有${def?.icon || ''}×${this.game.getItemCount(io.item)})</button>`;
    }
    this.el.eventArea.innerHTML = `<div class="event-card"><div class="event-header"><span class="event-icon">${event.icon || '📜'}</span><span class="event-title">${event.title}</span></div><div class="event-description">${event.description}</div><div class="event-options">${optionsHtml}${itemOptionHtml}</div></div>`;
  }
  resolveEvent(idx) { this.game.resolveEvent(idx); }
  resolveEventWithItem() { this.game.resolveEventWithItem(); }
  renderEventResolved(results) {
    if (!results || !results.formattedText) { this.renderIdle(); return; }
    // v2.1: 事件跳转到地点（批量出发模式抑制跳转，避免打断 10 次行进节奏）
    if (results.jumpTo && !this.game.isBatchTravelActive()) {
      setTimeout(() => {
        this.togglePanel('outing');
        // 嵌套地域跳转 —— 需要等 outing 渲染后再进入
        setTimeout(() => this.enterLocation(results.jumpTo), 100);
      }, 1500);
    }
    // 构建效果标签
    let effectsHtml = '';
    const effects = results.effects || {};
    const effectTags = Object.entries(effects).filter(([k, v]) => v !== 0).map(([k, v]) => {
      const r = RESOURCES[k];
      const icon = r ? r.icon : (k === 'shopOutputBoost' ? '📈' : k === 'nextTravelBonus' ? '🚀' : '✨');
      const name = r ? r.name : k;
      const cls = v > 0 ? 'gain' : 'loss';
      const sign = v > 0 ? '+' : '';
      return `<span class="effect-tag ${cls}">${icon} ${name} ${sign}${v.toLocaleString()}</span>`;
    });
    if (effectTags.length > 0) effectsHtml = `<div class="event-effects">${effectTags.join('')}</div>`;
    this.el.eventArea.innerHTML = `<div class="event-idle"><div class="idle-icon">${results.resultType === 'win' ? '🎉' : results.resultType === 'lose' ? '😔' : '📜'}</div><div class="idle-text">${results.formattedText}</div>${effectsHtml}</div>`;
    setTimeout(() => { if (!this.game.state.journey.active && !this.game.state.journey.currentEvent) this.renderIdle(); }, 2000);
  }

  // --- 日志 ---
  renderLogs() {
    const logs = this.game.state.logs.slice(0, 20);
    this.el.logList.innerHTML = logs.map(l => `<div class="log-entry ${l.type}">📜 ${l.message}</div>`).join('');
  }

  // --- 出发按钮 ---
  updateTravelButton() {
    const btn = this.el.travelBtn;
    const canTravel = this.game.canTravel();
    // 批量出发激活时，按钮变为「停止」并保留可点击（不受精力影响）
    if (this.game.isBatchTravelActive()) {
      const info = this.game.getBatchTravelInfo();
      btn.disabled = false;
      btn.textContent = `⏹ 停止自动 (${info.done}/${info.total})`;
      btn.classList.add('batch-active');
      return;
    }
    btn.classList.remove('batch-active');
    btn.disabled = !canTravel;
    if (!canTravel) {
      const energy = this.game.getEnergyStatus();
      if (energy.current <= 0) btn.textContent = '精力不足，请休息';
      else if (this.game.state.resources.stamina <= 0) btn.textContent = '体力耗尽，本轮结束';
      else if (this.game.state.journey.active) btn.textContent = '行进中...';
    } else { btn.textContent = '🚩 出发经商'; }
  }

  // --- 快速行商按钮（御赐商牌专属） ---
  updateFastTravelButton() {
    if (!this.el.fastTravelBtn) return;
    const can = this.game.canFastTravel();
    const owned = this.game.state.backpack.purchasedPermanents.includes('yucishangpai');
    if (!owned) {
      this.el.fastTravelBtn.disabled = true;
      this.el.fastTravelBtn.textContent = '⚡ 行商×10 (需御赐商牌)';
      this.el.fastTravelBtn.title = '需持有「御赐商牌」才能快速行商';
    } else if (!can.ok) {
      this.el.fastTravelBtn.disabled = true;
      this.el.fastTravelBtn.textContent = `⚡ 行商×10 (${can.msg})`;
      this.el.fastTravelBtn.title = can.msg;
    } else {
      this.el.fastTravelBtn.disabled = false;
      this.el.fastTravelBtn.textContent = '⚡ 行商×10';
      this.el.fastTravelBtn.title = '一次性行商10次，加速商情/黑市/拍卖场刷新';
    }
  }

  // --- 快捷栏 ---
  renderQuickSlots() {
    if (!this.el.quickSlotBar) return;
    let html = '';
    for (let i = 0; i < GAME_CONFIG.quickSlotsCount; i++) {
      const itemId = this.game.state.backpack.quickSlots[i];
      if (itemId) {
        const def = ITEM_DEFINITIONS[itemId];
        const qty = this.game.getItemCount(itemId);
        html += `<div class="quick-slot filled" onclick="window.gameUI.useQuickSlot(${i})" title="${def?.name}: ${def?.description}">${def?.icon || '?'}<span class="quick-qty">${qty}</span></div>`;
      } else {
        html += `<div class="quick-slot empty" data-slot="${i}"></div>`;
      }
    }
    this.el.quickSlotBar.innerHTML = html;
  }
  useQuickSlot(idx) {
    const result = this.game.useQuickSlot(idx);
    if (!result.success && result.reason === 'empty') return;
    if (!result.success) this.showFloatText({ resource: 'silver', amount: 0 }, true);
  }

  // ==================== 飘字反馈 ====================
  showFloatText(data, isError = false) {
    if (!data || data.amount === 0) return;
    const targetEl = document.querySelector(`[data-resource="${data.resource}"]`);
    if (!targetEl) return;
    const valueEl = document.getElementById(`val-${data.resource}`);
    if (valueEl) { valueEl.classList.remove('pulse'); void valueEl.offsetWidth; valueEl.classList.add('pulse'); }
    const rect = targetEl.getBoundingClientRect();
    const floatEl = document.createElement('div');
    floatEl.className = 'float-text';
    floatEl.textContent = `${data.amount >= 0 ? '+' : ''}${data.amount}`;
    floatEl.classList.add(data.amount > 0 ? 'positive' : data.amount < 0 ? 'negative' : 'neutral');
    floatEl.style.left = `${rect.left + rect.width / 2 - 30}px`;
    floatEl.style.top = `${rect.top - 10}px`;
    document.body.appendChild(floatEl);
    setTimeout(() => floatEl.remove(), 1500);
  }

  // --- 离线收益 ---
  showOfflineEarnings(data) {
    const hours = Math.floor(data.duration / 3600);
    const minutes = Math.floor((data.duration % 3600) / 60);
    let timeStr = hours > 0 ? `${hours}小时` : ''; if (minutes > 0) timeStr += `${minutes}分钟`; if (!timeStr) timeStr = '片刻';
    this.el.eventArea.innerHTML = `<div class="event-idle"><div class="idle-icon">💰</div><div class="idle-text">掌柜归来！</div><div class="idle-subtitle">离线${timeStr}，店铺赚了 <strong style="color:var(--gold-dark);">${data.amount.toLocaleString()}</strong> 两银子！</div></div>`;
    setTimeout(() => this.renderIdle(), 3000);
  }

  // ==================== 各面板渲染 ====================
  // --- 背包 ---
  renderBackpack() {
    const bp = this.game.state.backpack;
    const canExpand = bp.maxSlots < GAME_CONFIG.backpackMaxSlots;
    const expandIdx = (bp.maxSlots - GAME_CONFIG.backpackInitialSlots) / GAME_CONFIG.backpackExpandStep;
    const expandCost = GAME_CONFIG.backpackExpandCosts[expandIdx] || 1500;
    const expandRep = GAME_CONFIG.backpackExpandReputation[expandIdx] || 0;
    const canAffordExpand = this.game.getResource('silver') >= expandCost && this.game.getResource('reputation') >= expandRep;
    let itemsHtml = '';
    const slotCount = bp.maxSlots;
    for (let i = 0; i < slotCount; i++) {
      if (i < bp.items.length) {
        const item = bp.items[i];
        const def = ITEM_DEFINITIONS[item.id];
        if (def) {
          itemsHtml += `<div class="bp-slot filled" onclick="window.gameUI.showItemDetail('${item.id}')"><span class="bp-icon">${def.icon}</span><span class="bp-qty">${item.quantity > 1 ? '×'+item.quantity : ''}</span><span class="bp-name">${def.name}</span></div>`;
        }
      } else {
        itemsHtml += '<div class="bp-slot empty"></div>';
      }
    }
    const collectionCount = (this.game.state.auction.collections || []).length + (this.game.state.auction.stoneCollections || []).length;
    let html = `<div class="panel-card"><div class="panel-header"><h3>🎒 行囊</h3><button class="panel-close" onclick="window.gameUI.closePanel()">×</button></div>`;
    html += `<div class="bp-info">容量：${bp.items.length}/${bp.maxSlots}`;
    if (canExpand) html += ` <button class="btn-sm gold" onclick="window.gameUI.expandBackpack()" ${!canAffordExpand ? 'disabled' : ''}>扩容 +${GAME_CONFIG.backpackExpandStep}格 (${expandCost}🪙${expandRep > 0 ? ` + 声望${expandRep}` : ''})</button>`;
    html += ` <button class="btn-sm primary" onclick="window.gameUI.renderBackpackCollections()">💠 查看藏品 (${collectionCount})</button>`;
    html += `</div><div class="bp-grid">${itemsHtml}</div>`;
    // 永久道具区（purchasedPermanents 不入背包 items，但玩家需要看到自己持有哪些永久加成）
    const permanents = bp.purchasedPermanents || [];
    if (permanents.length > 0) {
      html += `<div class="bp-permanents" style="margin-top:12px;padding:8px 12px;background:var(--bg-paper);border-radius:8px;border:1px solid var(--gold-primary);">`;
      html += `<div style="font-family:var(--font-heading);font-size:0.95rem;color:var(--gold-dark);margin-bottom:8px;">🔮 永久道具 <span style="font-size:0.75rem;color:var(--ink-muted);font-weight:normal;">(${permanents.length}件)</span></div>`;
      html += `<div style="display:flex;flex-wrap:wrap;gap:8px;">`;
      for (const pid of permanents) {
        const def = ITEM_DEFINITIONS[pid];
        if (!def) continue;
        html += `<div class="bp-slot filled" title="${def.description}" onclick="window.gameUI.showItemDetail('${pid}')" style="min-width:70px;max-width:90px;"><span class="bp-icon">${def.icon}</span><span class="bp-name">${def.name}</span></div>`;
      }
      html += `</div></div>`;
    }
    html += `<div class="bp-actions"><button class="btn-sm" onclick="window.gameUI.sortBackpack('type')">按类型排序</button><button class="btn-sm" onclick="window.gameUI.sortBackpack('rarity')">按稀有度排序</button></div>`;
    html += `<div id="itemDetail" class="item-detail" style="display:none;"></div></div>`;
    this.el.modalContent.innerHTML = html;
  }
  renderBackpackCollections() {
    const collections = [
      ...(this.game.state.auction.collections || []).map(id => {
        const collection = AUCTION_COLLECTIBLES[id];
        return collection ? { ...collection, source: '聚宝阁' } : null;
      }).filter(Boolean),
      ...(this.game.state.auction.stoneCollections || []).map(id => {
        const collection = DUFANG_CONFIG.stone.collections[id];
        return collection ? { ...collection, source: '赌玉' } : null;
      }).filter(Boolean),
    ];
    let html = `<div class="panel-card"><div class="panel-header"><h3>💠 稀世藏品</h3><button class="panel-close" onclick="window.gameUI.renderBackpack()">← 返回背包</button></div>`;
    html += `<div class="bp-info">已收藏：${collections.length}件 · 藏品不占背包格，持有效果自动生效</div>`;
    if (collections.length === 0) {
      html += `<div class="event-idle"><div class="idle-icon">💠</div><div class="idle-text">暂未获得藏品</div><div class="idle-subtitle">可从聚宝阁或赌玉中获得稀世藏品</div></div>`;
    } else {
      html += `<div class="ac-grid">`;
      for (const collection of collections) {
        html += `<div class="ac-card ac-stone"><div class="ac-icon">${collection.icon}</div><div class="ac-name">${collection.name}</div><div class="ac-category">来源：${collection.source}</div><div class="ac-desc">${collection.desc}</div><div class="ac-valuation">估价 ${(collection.valuation || collection.price || 0).toLocaleString()}🪙</div><button class="btn-sm danger" onclick="window.gameUI.sellCollectionUI('${collection.id}')">出售</button></div>`;
      }
      html += `</div>`;
    }
    html += `</div>`;
    this.el.modalContent.innerHTML = html;
  }
  sellCollectionUI(collectionId) {
    const collection = AUCTION_COLLECTIBLES[collectionId] || DUFANG_CONFIG.stone.collections[collectionId];
    if (!collection) return;
    const sellPrice = collection.valuation || collection.price || 0;
    const effectWarning = collection.effect ? '\n出售后，该藏品的持有效果将立即失效。' : '';
    if (!confirm(`确定出售「${collection.name}」并获得 ${sellPrice.toLocaleString()} 银两吗？${effectWarning}`)) return;
    const result = this.game.sellCollection(collectionId);
    if (!result.success) {
      alert(result.msg || '出售失败');
      return;
    }
    this.renderResources();
    this.renderShops();
    this.renderBackpackCollections();
  }
  showItemDetail(itemId) {
    const def = ITEM_DEFINITIONS[itemId];
    if (!def) return;
    const qty = this.game.getItemCount(itemId);
    const inQuick = this.game.state.backpack.quickSlots.includes(itemId);
    let html = `<div class="item-detail-card"><div class="detail-icon">${def.icon}</div><h4>${def.name}</h4><div class="detail-rarity ${def.rarity}">${def.rarity === 'legendary' ? '传说' : def.rarity === 'rare' ? '稀有' : '普通'}</div><p>${def.description}</p><p>数量：${qty}</p><div style="display:flex;gap:8px;flex-wrap:wrap;">`;
    // 黑市原石：直接使用会绕过赌石流程（不显示品质结果/保底/藏品掉落），改为跳赌坊
    if (itemId === 'heishi_yuanshi' || itemId === 'heishi_yuanshi_legend') {
      html += `<button class="btn-sm primary" onclick="window.gameUI.openDufangWithHeishi()">💎 去赌坊切开</button>`;
    } else if (def.type !== 'permanent') {
      html += `<button class="btn-sm primary" onclick="window.gameUI.useItemFromUI('${itemId}')">使用</button>`;
    }
    if (!inQuick) {
      html += `<button class="btn-sm" onclick="window.gameUI.setQuickSlotPrompt('${itemId}')">设为快捷</button>`;
    }
    if (def.type !== 'permanent' && def.rarity !== 'legendary') {
      html += `<button class="btn-sm danger" onclick="window.gameUI.dropItemPrompt('${itemId}')">丢弃</button>`;
      const prices = this.game.getMarketPrices();
      if (Object.keys(prices).length > 0) {
        const marketAvgMult = Object.values(prices).reduce((s, g) => s + g.multiplier, 0) / Object.keys(prices).length;
        const sellPrice = Math.floor(def.price * (0.5 + marketAvgMult * 0.5));
        html += `<button class="btn-sm gold" onclick="window.gameUI.sellItemFromUI('${itemId}', 1); window.gameUI.renderBackpack();">出售(${sellPrice}🪙)</button>`;
      }
    }
    html += `</div></div>`;
    const detailEl = document.getElementById('itemDetail');
    if (detailEl) { detailEl.innerHTML = html; detailEl.style.display = 'block'; }
  }
  useItemFromUI(itemId) {
    const result = this.game.useItem(itemId);
    if (!result.success) {
      if (result.reason === 'condition_not_met') alert(result.msg || '使用条件不满足');
      else if (result.reason === 'wrong_context') alert(result.msg || '当前场景不可使用');
    }
    this.renderBackpack();
  }
  // 黑市原石专用：从背包跳到赌坊的切原石面板
  openDufangWithHeishi() {
    this.closePanel();
    this.togglePanel('outing');
    this.renderDufangStone();
  }
  setQuickSlotPrompt(itemId) {
    const slots = this.game.state.backpack.quickSlots;
    const emptyIdx = slots.indexOf(null);
    if (emptyIdx !== -1) {
      this.game.setQuickSlot(emptyIdx, itemId);
      this.renderBackpack();
    } else {
      alert('快捷栏已满(4格)，请先清理。可在快捷栏点击已占用的格子替换。');
    }
  }
  dropItemPrompt(itemId) {
    const def = ITEM_DEFINITIONS[itemId];
    if (def && def.rarity === 'rare' && !confirm(`确定要丢弃稀有道具"${def.name}"吗？`)) return;
    this.game.removeItem(itemId, 1);
    this.renderBackpack();
  }
  expandBackpack() { this.game.expandBackpack(); this.renderBackpack(); }
  sortBackpack(mode) { this.game.sortBackpack(mode); this.renderBackpack(); }

  // --- v2.0 外出地点 ---
  renderOuting() {
    const locations = this.game.getUnlockedLocations();
    const activeLoc = locations.filter(l => l.unlocked);
    const lockedLoc = locations.filter(l => !l.unlocked);
    let html = `<div class="panel-card"><div class="panel-header"><h3>🏯 外出探索</h3><button class="panel-close" onclick="window.gameUI.closePanel()">×</button></div>`;
    html += '<div class="outing-hint">选择一处地点前往，解锁更多玩法</div><div class="outing-grid">';

    // 已解锁地点
    for (const loc of activeLoc) {
      const isBanquet = loc.id === 'jiulou';
      html += `<div class="outing-card unlocked" onclick="window.gameUI.enterOutingLocationUI('${loc.id}')"><div class="outing-icon">${loc.icon}</div><div class="outing-name">${loc.shortName || loc.name}</div><div class="outing-subtitle">${loc.name}</div><div class="outing-desc">${loc.description}</div><div class="outing-badge unlocked-badge">可前往 · 体力-1</div></div>`;
    }
    // 锁定地点
    for (const loc of lockedLoc) {
      const cond = loc.unlockCondition;
      let condText = '';
      if (cond) {
        if (cond.resource === 'reputation') condText = `需声望 ${cond.amount}`;
        else if (cond.resource === 'shangtu') condText = `需商途值 ${cond.amount}`;
        if (cond.item) condText = '需黑市令';
      }
      html += `<div class="outing-card locked"><div class="outing-icon">${loc.icon}</div><div class="outing-name">${loc.shortName || loc.name}</div><div class="outing-subtitle">${loc.name}</div><div class="outing-desc">${loc.description}</div><div class="outing-badge locked-badge">🔒 ${condText}</div></div>`;
    }
    html += '</div></div>';
    this.el.modalContent.innerHTML = html;
  }

  enterOutingLocationUI(locId) {
    const result = this.game.enterOutingLocation(locId);
    this.renderResources();
    if (!result.success) {
      if (result.msg) alert(result.msg);
      return;
    }
    if (result.dead) return;
    if (result.warning) alert(LOG_TEMPLATES.outingStaminaWarn);
    this.enterLocation(locId);
  }

  enterLocation(locId) {
    switch (locId) {
      case 'jiulou': this.renderBanquet(); break;
      case 'yiguan': this.renderYiguan(); break;
      case 'yujie': this.renderYujie(); break;
      case 'dufang': this.renderDufang(); break;
      case 'heishi': this.enterHeishiUI(); break;
      case 'yanchang': this.renderYanchang(); break;
      case 'gongfeng': this.renderGongfeng(); break;
      case 'auction': this.renderAuction(); break;
      default: alert('该地点尚未开放，敬请期待后续版本！');
    }
  }

  // --- v2.0 酒楼宴请 ---
  renderBanquet() {
    const info = this.game.getBanquetPrices();
    const remaining = info.limit - info.count;
    let html = `<div class="panel-card"><div class="panel-header"><h3>🍶 酒楼宴请</h3><button class="panel-close" onclick="window.gameUI.renderOuting()">← 返回</button></div>`;
    html += `<div class="banquet-info">今日剩余宴请次数：<strong>${remaining}/${info.limit}</strong></div>`;
    html += '<div class="banquet-grid">';
    for (const tier of BANQUET_CONFIG.tiers) {
      const price = info.prices[tier.id];
      const canAfford = this.game.getResource('silver') >= price;
      const canBanquet = remaining > 0 && canAfford;
      html += `<div class="banquet-card ${!canBanquet && remaining > 0 && !canAfford ? 'no-silver' : ''} ${remaining <= 0 ? 'no-limit' : ''}"><div class="banquet-icon">${tier.icon}</div><div class="banquet-name">${tier.name}</div><div class="banquet-desc">${tier.description}</div><div class="banquet-rewards">`;
      const rw = tier.rewards;
      const parts = [];
      if (rw.stamina) parts.push(`❤️ 体力+${rw.stamina}`);
      if (rw.reputation) parts.push(`🏆 声望+${rw.reputation}`);
      if (rw.shangtu) parts.push(`🗺️ 商途值+${rw.shangtu}`);
      if (rw.energy) parts.push(`⚡ 精力+${rw.energy}`);
      html += parts.join(' | ');
      html += `</div><div class="banquet-price">${price.toLocaleString()}🪙</div>`;
      if (remaining <= 0) html += '<button class="btn-sm" disabled>今日已满</button>';
      else if (!canAfford) html += '<button class="btn-sm" disabled>银两不足</button>';
      else html += `<button class="btn-sm primary" onclick="window.gameUI.doBanquetUI('${tier.id}')">设宴</button>`;
      html += '</div>';
    }
    html += '</div></div>';
    this.el.modalContent.innerHTML = html;
  }

  doBanquetUI(tierId) {
    const result = this.game.doBanquet(tierId);
    if (result.success) {
      this.renderBanquet();
      this.renderResources();
    } else {
      if (result.reason === 'limit') alert(result.msg);
      else if (result.reason === 'no_silver') alert(result.msg);
    }
  }

  // --- v2.1 医馆 ---
  renderYiguan() {
    const info = this.game.getYiguanInfo();
    const canHeal = info.remaining > 0 && this.game.getResource('silver') >= info.price && this.game.state.resources.stamina < this.game.state.resources.staminaMax;
    let html = `<div class="panel-card"><div class="panel-header"><h3>🏥 回春堂</h3><button class="panel-close" onclick="window.gameUI.renderOuting()">← 返回</button></div>`;
    html += `<div class="yiguan-info"><div class="yiguan-doctor">🩺 坐诊大夫："掌柜的，身子骨要紧啊！"</div><div class="yiguan-stats">今日已诊治：<strong>${info.remaining >= 0 ? (YIGUAN_CONFIG.dailyLimit - info.remaining) : 0}/${YIGUAN_CONFIG.dailyLimit}</strong>次 | 体力：<strong>${this.game.state.resources.stamina}/${this.game.state.resources.staminaMax}</strong></div></div>`;
    html += `<div class="yiguan-card"><div class="yiguan-icon">💊</div><div class="yiguan-title">针灸调理</div><div class="yiguan-desc">回复${info.stamina}点体力</div><div class="yiguan-price">${info.price.toLocaleString()}🪙</div>`;
    if (info.remaining <= 0) html += '<button class="btn-sm" disabled>今日已满</button>';
    else if (this.game.getResource('silver') < info.price) html += '<button class="btn-sm" disabled>银两不足</button>';
    else if (this.game.state.resources.stamina >= this.game.state.resources.staminaMax) html += '<button class="btn-sm" disabled>体力已满</button>';
    else html += `<button class="btn-sm primary" onclick="window.gameUI.doYiguanUI()">诊治</button>`;
    if (info.remaining < YIGUAN_CONFIG.dailyLimit) html += `<div class="yiguan-next">下次价格：${info.price * YIGUAN_CONFIG.priceMultiplier}🪙</div>`;
    html += `</div></div>`;
    this.el.modalContent.innerHTML = html;
  }
  doYiguanUI() {
    const result = this.game.doYiguanHeal();
    if (!result.success) { if (result.msg) alert(result.msg); }
  }

  // --- v2.1 御街 ---
  renderYujie() {
    let html = `<div class="panel-card"><div class="panel-header"><h3>🏛️ 御街</h3><button class="panel-close" onclick="window.gameUI.renderOuting()">← 返回</button></div>`;
    html += '<div class="yujie-desc">漫步皇家御道，处处藏着机遇与风险...</div>';
    html += `<button class="btn-primary large" onclick="window.gameUI.doYujieUI()" style="width:100%;">🚶 漫步御街</button>`;
    html += '</div>';
    this.el.modalContent.innerHTML = html;
  }
  doYujieUI() {
    const energy = this.game.getEnergyStatus();
    if (energy.current < 1) { alert('精力不足，无法探索御街！'); return; }
    this.game.consumeEnergy(1);
    const result = this.game.triggerYujieEvent();
    let html = `<div class="panel-card"><div class="panel-header"><h3>🏛️ 御街</h3><button class="panel-close" onclick="window.gameUI.renderOuting()">← 返回</button></div>`;
    html += `<div class="event-card"><div class="event-header"><span class="event-icon">${result.event.icon}</span><span class="event-title">${result.event.title}</span></div><div class="event-description">${result.event.description || ''}</div><div class="yujie-result">${result.text}</div>`;
    if (result.effects && Object.keys(result.effects).length > 0) {
      html += '<div class="yujie-effects">';
      for (const [key, val] of Object.entries(result.effects)) {
        const resDef = RESOURCES[key];
        const icon = resDef ? resDef.icon : '📦';
        const name = resDef ? resDef.name : key;
        html += `<span class="yujie-effect ${val >= 0 ? 'positive' : 'negative'}">${icon} ${name} ${val >= 0 ? '+' : ''}${val}</span>`;
      }
      html += '</div>';
    }
    if (result.itemReward) {
      const def = ITEM_DEFINITIONS[result.itemReward.id];
      html += `<div class="yujie-reward">🎁 获得：${def ? def.icon + ' ' + def.name : ''}</div>`;
    }
    html += `<button class="btn-sm primary" onclick="window.gameUI.renderYujie()" style="margin-top:12px;">继续漫步御街</button></div>`;
    this.el.modalContent.innerHTML = html;
    this.renderResources();
  }

  // --- v2.1 赌坊 ---
  renderDufang() {
    const info = this.game.getDufangInfo();
    const aa = this.game.checkDufangAntiAddiction();
    const luckBonus = this.game.getLuckBonus();
    let html = `<div class="panel-card"><div class="panel-header"><h3>🎲 福运赌坊</h3><button class="panel-close" onclick="window.gameUI.renderOuting()">← 返回</button></div>`;
    html += `<div class="dufang-info">今日剩余次数：<strong>${info.remaining}/${info.totalLimit}</strong>`;
    if (luckBonus > 0) html += ` | 🍀 幸运加成 +${Math.round(luckBonus * 100)}%`;
    html += '</div>';
    // v2.2 防沉迷提示
    if (!aa.allowed) {
      html += `<div class="dufang-cooldown">⛔ ${aa.msg}</div>`;
    } else {
      const aaState = this.game.state.dufangAntiAddiction;
      if (aaState.dailyLoss > 0) {
        html += `<div class="dufang-warning">⚠️ 今日累计亏损：${aaState.dailyLoss.toLocaleString()}🪙（上限${DUFANG_CONFIG.antiAddiction.dailyLossLimit.toLocaleString()}）</div>`;
      }
      if (aaState.consecutiveLosses >= DUFANG_CONFIG.antiAddiction.consecutiveLossWarn) {
        html += `<div class="dufang-warning">⚠️ 已连输${aaState.consecutiveLosses}次，请注意节制！</div>`;
      }
    }
    html += '<div class="dufang-menu">';
    if (aa.allowed) {
      html += `<div class="dufang-menu-item" onclick="window.gameUI.renderDufangDice()"><div class="dmi-icon">🎲</div><div class="dmi-name">掷骰子</div><div class="dmi-desc">猜大/小/豹子，赔率1:1/10</div></div>`;
      html += `<div class="dufang-menu-item" onclick="window.gameUI.renderDufangStone()"><div class="dmi-icon">💎</div><div class="dmi-name">切原石</div><div class="dmi-desc">3档原石+6品质，碰碰运气</div></div>`;
      html += `<div class="dufang-menu-item" onclick="window.gameUI.renderDufangQuiz()"><div class="dmi-icon">❓</div><div class="dmi-name">竞猜答题</div><div class="dmi-desc">${info.quizDone ? '今日已参与' : '每日1题，猜对2倍'}</div></div>`;
    } else {
      html += '<div class="dufang-menu-disabled"><p>赌坊暂时无法进入，请等待冷却结束</p></div>';
    }
    html += '</div></div>';
    this.el.modalContent.innerHTML = html;
  }

  renderDufangDice() {
    const info = this.game.getDufangInfo();
    let html = `<div class="panel-card"><div class="panel-header"><h3>🎲 掷骰子</h3><button class="panel-close" onclick="window.gameUI.renderDufang()">← 返回</button></div>`;
    html += `<div class="dufang-info">剩余次数：${info.remaining} | 大小赔率1:1 | 豹子赔率1:10 | 🍀幸运+${Math.round(this.game.getLuckBonus() * 100)}%</div>`;
    html += '<div class="dice-bets">';
    for (const [guess, label] of [['small', '小 (3~10)'], ['big', '大 (11~18)'], ['leopard', '🐆 豹子 (111~666)']]) {
      html += `<div class="dice-bet-card"><div class="dice-guess">${label}</div><div class="dice-amounts">`;
      for (const amt of [500, 2000, 5000, 20000]) {
        const canAfford = this.game.getResource('silver') >= amt && info.remaining > 0;
        html += `<button class="btn-sm ${canAfford ? 'primary' : ''}" ${!canAfford ? 'disabled' : ''} onclick="window.gameUI.doDiceUI('${guess}', ${amt})">${amt.toLocaleString()}🪙</button>`;
      }
      html += '</div></div>';
    }
    html += '</div></div>';
    this.el.modalContent.innerHTML = html;
  }
  doDiceUI(guess, amount) {
    const result = this.game.doDiceBet(guess, amount);
    if (result.success) {
      let html = `<div class="panel-card"><div class="panel-header"><h3>🎲 掷骰子</h3><button class="panel-close" onclick="window.gameUI.renderDufangDice()">← 返回</button></div>`;
      html += `<div class="dice-result ${result.won ? 'win' : 'lose'}"><div class="dice-display">${result.diceResult}</div><div class="dice-verdict">${result.diceStr}</div>`;
      if (result.won) html += `<div class="dice-win">🎉 你赢了！+${result.win}🪙</div>`;
      else html += `<div class="dice-lose">😔 你输了 -${result.loss}🪙</div>`;
      html += `<button class="btn-sm primary" onclick="window.gameUI.renderDufangDice()" style="margin-top:12px;">再来一局</button></div>`;
      this.el.modalContent.innerHTML = html;
      this.renderResources();
    } else {
      alert(result.msg || '投注失败');
    }
  }

  renderDufangStone() {
    let html = `<div class="panel-card"><div class="panel-header"><h3>💎 切原石</h3><button class="panel-close" onclick="window.gameUI.renderDufang()">← 返回</button></div>`;
    html += '<div class="stone-desc">挑选一块原石切开，品质决定价值！</div>';
    const pity = this.game.getStonePity();
    if (pity >= DUFANG_CONFIG.stone.pityThreshold) html += `<div class="stone-pity">🌟 保底触发中——已连续${pity}次未出良品！</div>`;
    // v2.4 天字号藏品展示
    const auctionInfo = this.game.getAuctionRefreshInfo();
    if (auctionInfo.stoneCollections && auctionInfo.stoneCollections.length > 0) {
      html += '<div class="stone-collections"><div class="sc-title">💠 稀世藏品</div><div class="sc-grid">';
      for (const colId of auctionInfo.stoneCollections) {
        const col = DUFANG_CONFIG.stone.collections[colId];
        if (col) html += `<div class="sc-card"><div class="sc-icon">${col.icon}</div><div class="sc-info"><div class="sc-name">${col.name}</div><div class="sc-desc">${col.desc}</div></div></div>`;
      }
      html += '</div></div>';
    }
    html += '<div class="stone-tiers">';
    for (const tier of DUFANG_CONFIG.stone.tiers) {
      const canAfford = this.game.getResource('silver') >= tier.price;
      const extraClass = tier.id === 'heaven' ? ' stone-tier-legendary-heaven' : '';
      html += `<div class="stone-card${extraClass}"><div class="stone-icon">${tier.icon}</div><div class="stone-name">${tier.name}</div><div class="stone-price">${tier.price.toLocaleString()}🪙</div><button class="btn-sm primary" ${!canAfford ? 'disabled' : ''} onclick="window.gameUI.doStoneUI('${tier.id}')">切开</button></div>`;
    }
    html += '</div>';
    // 背包中的黑市原石
    const heishiStone = this.game.getItemCount('heishi_yuanshi');
    const heishiStoneLegend = this.game.getItemCount('heishi_yuanshi_legend');
    if (heishiStone > 0) {
      html += `<div class="stone-heishi"><h4>🌑 黑市原石 (品质更优!)</h4><div class="stone-card heishi"><div class="stone-icon">💎</div><div class="stone-name">黑市原石</div><div class="stone-price">持有×${heishiStone}</div><button class="btn-sm primary" onclick="window.gameUI.doHeishiStoneUI('fine')">切开</button></div></div>`;
    }
    if (heishiStoneLegend > 0) {
      html += `<div class="stone-heishi"><div class="stone-card heishi"><div class="stone-icon">🔮</div><div class="stone-name">黑市原石(传说)</div><div class="stone-price">持有×${heishiStoneLegend}</div><button class="btn-sm primary" onclick="window.gameUI.doHeishiStoneUI('legend')">切开</button></div></div>`;
    }
    html += '</div>';
    this.el.modalContent.innerHTML = html;
  }
  doStoneUI(tierId) {
    const result = this.game.doStoneCut(tierId);
    if (result.success) {
      let html = `<div class="panel-card"><div class="panel-header"><h3>💎 切原石结果</h3><button class="panel-close" onclick="window.gameUI.renderDufangStone()">← 返回</button></div>`;
      html += `<div class="stone-result"><div class="stone-quality">${result.quality.icon} ${result.quality.name}</div><div class="stone-value">价值 ×${result.value} = ${result.silverGain.toLocaleString()}🪙</div><div class="stone-pity-count">保底计数：${result.pity}/${DUFANG_CONFIG.stone.pityThreshold}</div>`;
      // v2.4 藏品掉落
      if (result.collectionDrop) {
        html += `<div class="stone-collection-drop"><div class="scd-icon">${result.collectionDrop.icon}</div><div class="scd-title">天降奇珍！</div><div class="scd-name">${result.collectionDrop.name}</div><div class="scd-valuation">估价 ${result.collectionDrop.valuation.toLocaleString()}🪙</div></div>`;
      }
      html += `<button class="btn-sm primary" onclick="window.gameUI.renderDufangStone()" style="margin-top:12px;">再切一块</button></div>`;
      this.el.modalContent.innerHTML = html;
      this.renderResources();
    } else {
      alert(result.msg || '操作失败');
    }
  }
  doHeishiStoneUI(tierId) {
    const result = this.game.doStoneCut(tierId, true);
    if (result.success) {
      let html = `<div class="panel-card"><div class="panel-header"><h3>💎 黑市原石结果</h3><button class="panel-close" onclick="window.gameUI.renderDufangStone()">← 返回</button></div>`;
      html += `<div class="stone-result heishi"><div class="stone-quality">${result.quality.icon} ${result.quality.name}</div><div class="stone-value">价值 ×${result.value} = ${result.silverGain.toLocaleString()}🪙</div><div class="stone-pity-count">黑市保底：稀有玉及以上</div>`;
      if (result.collectionDrop) {
        html += `<div class="stone-collection-drop"><div class="scd-icon">${result.collectionDrop.icon}</div><div class="scd-title">天降奇珍！</div><div class="scd-name">${result.collectionDrop.name}</div><div class="scd-valuation">估价 ${result.collectionDrop.valuation.toLocaleString()}🪙</div></div>`;
      }
      html += `<button class="btn-sm primary" onclick="window.gameUI.renderDufangStone()" style="margin-top:12px;">继续</button></div>`;
      this.el.modalContent.innerHTML = html;
      this.renderResources();
    } else {
      alert(result.msg || '背包中没有黑市原石');
    }
  }

  renderDufangQuiz() {
    const info = this.game.getDufangInfo();
    if (info.quizDone) {
      let html = `<div class="panel-card"><div class="panel-header"><h3>❓ 竞猜答题</h3><button class="panel-close" onclick="window.gameUI.renderDufang()">← 返回</button></div>`;
      html += '<div class="quiz-done">今日竞猜已参与，明天再来挑战吧！</div></div>';
      this.el.modalContent.innerHTML = html;
      return;
    }
    const quiz = this.game.getQuizQuestion();
    let html = `<div class="panel-card"><div class="panel-header"><h3>❓ 竞猜答题</h3><button class="panel-close" onclick="window.gameUI.renderDufang()">← 返回</button></div>`;
    html += `<div class="quiz-info">赌注：${DUFANG_CONFIG.quiz.betAmount}🪙 | 猜对翻倍！</div>`;
    html += `<div class="quiz-question">${quiz.question}</div><div class="quiz-options">`;
    quiz.options.forEach((opt, idx) => {
      html += `<button class="quiz-option-btn" onclick="window.gameUI.doQuizUI('${quiz.id}', ${idx})">${opt}</button>`;
    });
    html += '</div></div>';
    this.el.modalContent.innerHTML = html;
  }
  doQuizUI(quizId, answerIdx) {
    const result = this.game.doQuizAnswer(quizId, answerIdx);
    if (result.success) {
      let html = `<div class="panel-card"><div class="panel-header"><h3>❓ 竞猜结果</h3><button class="panel-close" onclick="window.gameUI.renderDufang()">← 返回</button></div>`;
      if (result.correct) {
        html += `<div class="quiz-result correct">🎉 回答正确！获得 ${result.win}🪙</div>`;
      } else {
        html += '<div class="quiz-result wrong">😔 回答错误！</div>';
      }
      html += '</div>';
      this.el.modalContent.innerHTML = html;
      this.renderResources();
    } else {
      alert(result.msg || '操作失败');
    }
  }

  // --- v2.1 黑市 ---
  enterHeishiUI() {
    const result = this.game.enterHeishi();
    if (!result.success) { alert(result.msg); return; }
    this.renderHeishi();
  }
  renderHeishi() {
    const goods = this.game.getHeishiGoods();
    const refreshInfo = this.game.getHeishiRefreshInfo();
    const purchaseCount = this.game.state.heishi.purchaseCount || 0;
    const nextChashaoPct = Math.min(100, Math.round((0.05 + purchaseCount * 0.10) * 100));
    let html = `<div class="panel-card"><div class="panel-header"><h3>🌑 地下黑市</h3><button class="panel-close" onclick="window.gameUI.renderOuting()">← 返回</button></div>`;
    html += `<div class="heishi-info">⏱️ 下次刷新：${refreshInfo.nextRefreshStr}后（每${refreshInfo.stepsNeeded}步） | 黑市令持有：${this.game.getItemCount('heishiling')}个 | <span class="heishi-warning">⚠️ 下次购买查抄风险：${nextChashaoPct}%${purchaseCount > 0 ? ` (连续 ${purchaseCount} 次未触发)` : ''}</span></div>`;
    // 强制刷新按钮
    const canRefresh = this.game.getResource('silver') >= HEISHI_CONFIG.forceRefreshCost;
    html += `<div class="heishi-actions"><button class="btn-sm warning" ${!canRefresh ? 'disabled' : ''} onclick="window.gameUI.forceRefreshHeishiUI()">💰 强制刷新商品 (${HEISHI_CONFIG.forceRefreshCost.toLocaleString()}🪙)</button></div>`;
    if (goods.length === 0) {
      html += '<div class="heishi-empty">今日黑市暂无可售货物，等待刷新...</div>';
    } else {
      html += '<div class="heishi-grid">';
      for (const g of goods) {
        const canBuy = this.game.getResource('silver') >= g.currentPrice;
        const tierLabel = `T${g.tier}`;
        const priceMultiplier = g.fixedPrice ? '' : ` <small class="heishi-mult">×${g.priceMultiplier.toFixed(1)}</small>`;
        html += `<div class="heishi-card tier${g.tier}"><div class="heishi-tier">${tierLabel}</div><div class="heishi-icon">${g.icon}</div><div class="heishi-name">${g.name}</div><div class="heishi-price">${g.currentPrice.toLocaleString()}🪙${priceMultiplier}</div><button class="btn-sm primary" ${!canBuy ? 'disabled' : ''} onclick="window.gameUI.buyHeishiGoodUI('${g.id}')">买下</button></div>`;
      }
      html += '</div>';
    }
    html += '</div>';
    this.el.modalContent.innerHTML = html;
  }
  forceRefreshHeishiUI() {
    const result = this.game.forceRefreshHeishi();
    if (!result.success) { alert(result.msg); return; }
    this.renderHeishi();
    this.renderResources();
  }
  buyHeishiGoodUI(goodId) {
    const result = this.game.buyHeishiGood(goodId);
    if (!result.success) { if (result.msg) alert(result.msg); return; }
    this.renderHeishi();
    this.renderResources();
  }

  // --- v2.2 盐场系统 ---
  renderYanchang() {
    const info = this.game.getSaltFieldInfo();
    if (!info.unlocked) {
      let html = `<div class="panel-card"><div class="panel-header"><h3>🧂 盐场</h3><button class="panel-close" onclick="window.gameUI.renderOuting()">← 返回</button></div>`;
      html += `<div class="yanchang-locked"><div class="lock-icon">🔒</div><div class="lock-text">盐场尚未解锁</div><div class="lock-req">需要：声望≥300 且 已完成至少1次声望重置</div></div></div>`;
      this.el.modalContent.innerHTML = html;
      return;
    }
    let html = `<div class="panel-card"><div class="panel-header"><h3>🧂 盐场</h3><button class="panel-close" onclick="window.gameUI.renderOuting()">← 返回</button></div>`;
    html += `<div class="yanchang-info">持有盐场：<strong>${info.fields.length}/${info.limit}</strong> | 风险满100%将查封没收！</div>`;
    // 购买新盐场
    if (info.fields.length < info.limit) {
      const canBuy = this.game.getResource('silver') >= info.nextPrice;
      html += `<div class="yanchang-buy"><div class="buy-info">购入新盐场：${info.nextPrice.toLocaleString()}🪙</div><button class="btn-sm primary" ${!canBuy ? 'disabled' : ''} onclick="window.gameUI.buySaltFieldUI()">🧂 购入盐场</button></div>`;
    }
    // 已有盐场列表
    if (info.fields.length > 0) {
      html += '<div class="yanchang-list">';
      for (const field of info.fields) {
        const speedCfg = YANCHANG_CONFIG.speeds[field.speed];
        const riskPercent = Math.floor(field.riskAccumulated);
        const riskColor = riskPercent >= 80 ? 'danger' : riskPercent >= 50 ? 'warning' : 'safe';
        html += `<div class="yanchang-field"><div class="yf-header"><span class="yf-speed">${speedCfg.icon} ${speedCfg.name}</span><span class="yf-risk ${riskColor}">风险 ${riskPercent}%</span></div>`;
        html += `<div class="yf-output">待领：${field.pendingOutput.toLocaleString()}🪙 | 累计：${field.totalOutput.toLocaleString()}🪙</div>`;
        // 风险条
        html += `<div class="risk-bar"><div class="risk-bar-fill ${riskColor}" style="width:${riskPercent}%"></div></div>`;
        // 速度选择
        html += '<div class="yf-speeds">';
        for (const [spd, cfg] of Object.entries(YANCHANG_CONFIG.speeds)) {
          const isActive = field.speed === spd;
          html += `<button class="btn-sm ${isActive ? 'active' : ''}" onclick="window.gameUI.setSaltFieldSpeedUI('${field.id}','${spd}')" title="产出×${cfg.multiplier}，风险${cfg.riskPerMin}/分">${cfg.icon}${cfg.name}</button>`;
        }
        html += '</div>';
        // 操作按钮
        html += `<div class="yf-actions"><button class="btn-sm primary" ${field.pendingOutput <= 0 ? 'disabled' : ''} onclick="window.gameUI.collectSaltFieldUI('${field.id}')">💰 收取</button>`;
        html += `<button class="btn-sm danger" onclick="window.gameUI.abandonSaltFieldUI('${field.id}')">🚪 收手退出</button></div>`;
        html += '</div>';
      }
      html += '</div>';
    }
    html += `<div class="yanchang-tip">💡 慢速风险最低，极速产出最高但风险最大。风险达到80%会预警，100%将被官府查封！</div>`;
    html += '</div>';
    this.el.modalContent.innerHTML = html;
  }
  buySaltFieldUI() {
    const result = this.game.buySaltField();
    if (!result.success) {
      if (result.reason === 'no_silver') alert('银两不足');
      else if (result.reason === 'limit') alert('盐场数量已达上限');
      else if (result.reason === 'locked') alert('盐场尚未解锁');
      return;
    }
    this.renderYanchang();
    this.renderResources();
  }
  setSaltFieldSpeedUI(fieldId, speed) {
    this.game.setSaltFieldSpeed(fieldId, speed);
    this.renderYanchang();
  }
  collectSaltFieldUI(fieldId) {
    const result = this.game.collectSaltFieldOutput(fieldId);
    if (!result.success) { if (result.reason === 'empty') alert('暂无可收取的产出'); return; }
    this.renderYanchang();
    this.renderResources();
  }
  abandonSaltFieldUI(fieldId) {
    if (!confirm('确认收手退出？将回收50%购买费用及全部待领产出。')) return;
    const result = this.game.abandonSaltField(fieldId);
    if (result.success) {
      this.renderYanchang();
      this.renderResources();
    }
  }

  // --- v2.2 供奉系统 ---
  renderGongfeng() {
    if (!this.game.isGongfengUnlocked()) {
      let html = `<div class="panel-card"><div class="panel-header"><h3>🏯 商神庙</h3><button class="panel-close" onclick="window.gameUI.renderOuting()">← 返回</button></div>`;
      html += `<div class="gongfeng-locked"><div class="lock-icon">🔒</div><div class="lock-text">商神庙尚未显灵</div><div class="lock-req">需要：所有店铺达到 Lv.100</div></div></div>`;
      this.el.modalContent.innerHTML = html;
      return;
    }
    let html = `<div class="panel-card"><div class="panel-header"><h3>🏯 商神庙 · 供奉</h3><button class="panel-close" onclick="window.gameUI.renderOuting()">← 返回</button></div>`;
    html += `<div class="gongfeng-info">已供奉传承：<strong style="color:var(--gold-dark);">${this.game.state.prestige.legacy}</strong> | 累计供奉银两：${this.game.state.gongfeng.totalOffered.toLocaleString()}🪙</div>`;
    html += '<div class="gongfeng-desc">虔诚供奉商神，以银两换传承，世代永续</div>';
    html += '<div class="gongfeng-grid">';
    for (const tier of GONGFENG_CONFIG.tiers) {
      const canAfford = this.game.getResource('silver') >= tier.silverCost;
      html += `<div class="gongfeng-card"><div class="gf-icon">${tier.icon}</div><div class="gf-name">${tier.name}</div><div class="gf-cost">${tier.silverCost.toLocaleString()}🪙</div><div class="gf-reward">传承 +${tier.legacyGain}</div>`;
      if (!canAfford) html += '<button class="btn-sm" disabled>银两不足</button>';
      else html += `<button class="btn-sm primary" onclick="window.gameUI.doGongfengUI('${tier.id}')">供奉</button>`;
      html += '</div>';
    }
    html += '</div></div>';
    this.el.modalContent.innerHTML = html;
  }
  doGongfengUI(tierId) {
    const result = this.game.doGongfeng(tierId);
    if (!result.success) {
      if (result.msg) alert(result.msg);
      else if (result.reason === 'no_silver') alert('银两不足');
      return;
    }
    this.renderGongfeng();
    this.renderResources();
  }

  // --- v2.4 聚宝阁（拍卖） ---
  renderAuction() {
    const info = this.game.getAuctionRefreshInfo();
    if (!info.unlocked) {
      this.renderOuting();
      return;
    }
    const pct = info.stepsNeeded > 0 ? Math.min(100, Math.floor(((info.stepsNeeded - info.stepsLeft) / info.stepsNeeded) * 100)) : 100;
    let html = `<div class="panel-card"><div class="panel-header"><h3>🏛️ 聚宝阁</h3><button class="panel-close" onclick="window.gameUI.renderOuting()">← 返回</button></div>`;
    // 刷新进度条
    html += `<div class="auction-refresh-bar"><div class="arb-label">距刷新还有 <strong>${info.stepsLeft}</strong> 步</div><div class="arb-track"><div class="arb-fill" style="width:${pct}%"></div></div></div>`;
    // 收藏品展示
    if (info.collections.length > 0 || info.stoneCollections.length > 0) {
      html += `<div class="auction-collections"><div class="ac-title">🏆 收藏品</div><div class="ac-grid">`;
      const allCols = [...info.collections.map(id => {
        const c = AUCTION_COLLECTIBLES[id];
        return c ? { ...c, source: 'auction' } : null;
      }).filter(Boolean), ...info.stoneCollections.map(id => {
        const c = DUFANG_CONFIG.stone.collections[id];
        return c ? { ...c, source: 'stone' } : null;
      }).filter(Boolean)];
      for (const col of allCols) {
        html += `<div class="ac-card ${col.source === 'stone' ? 'ac-stone' : ''}"><div class="ac-icon">${col.icon}</div><div class="ac-name">${col.name}</div><div class="ac-desc">${col.desc}</div><div class="ac-valuation">估价 ${(col.valuation || col.price || 0).toLocaleString()}🪙</div></div>`;
      }
      html += `</div></div>`;
    }
    // 拍品网格
    html += `<div class="auction-grid">`;
    for (let i = 0; i < this.game.state.auction.items.length; i++) {
      const item = this.game.state.auction.items[i];
      const catLabel = item.category === 'collectibles' ? '收藏品' : item.category === 'protection' ? '保护' : item.category === 'rare' ? '稀有' : '消耗包';
      const catClass = item.category === 'collectibles' ? 'ac-cat-collectible' : item.category === 'protection' ? 'ac-cat-protection' : item.category === 'rare' ? 'ac-cat-rare' : 'ac-cat-consumable';
      html += `<div class="auction-item"><div class="ai-icon">${item.icon}</div><div class="ai-name">${item.name}</div><div class="ai-category ${catClass}">${catLabel}</div><div class="ai-price">${item.price.toLocaleString()}🪙</div><button class="btn-sm primary" onclick="window.gameUI.buyAuctionItemUI(${i})">一口价</button></div>`;
    }
    html += `</div>`;
    // 强制刷新按钮（forceRefreshMax 为 Infinity 时不限次）
    const frLeft = info.forceRefreshMax === Infinity ? '∞' : (info.forceRefreshMax - info.forceRefreshUsedToday);
    const frMaxLabel = info.forceRefreshMax === Infinity ? '∞' : info.forceRefreshMax;
    html += `<div class="auction-force-refresh"><div class="afr-info">强制刷新：${AUCTION_CONFIG.forceRefreshCost.toLocaleString()}🪙 · 今日剩余 ${frLeft}/${frMaxLabel} 次</div><button class="btn-sm warning" onclick="window.gameUI.forceRefreshAuctionUI()">💰 强制刷新</button></div>`;
    html += `</div></div>`;
    this.activePanel = 'auction';
    this.el.modalContent.innerHTML = html;
  }

  buyAuctionItemUI(idx) {
    const result = this.game.purchaseAuctionItem(idx);
    if (!result.success) {
      if (result.msg) alert(result.msg);
      return;
    }
    this.renderAuction();
    this.renderResources();
  }

  forceRefreshAuctionUI() {
    const result = this.game.forceRefreshAuction();
    if (!result.success) {
      if (result.msg) alert(result.msg);
      return;
    }
    this.renderAuction();
    this.renderResources();
  }

  // --- v2.2 里程碑庆典弹窗 ---
  showMilestone(milestone) {
    let html = `<div class="panel-card"><div class="panel-header"><h3>🎉 里程碑庆典</h3></div>`;
    html += `<div class="milestone-popup"><div class="milestone-icon">🎊</div><div class="milestone-title">${milestone.title}</div><div class="milestone-desc">声望达到 ${milestone.reputation}！</div><div class="milestone-reward">奖赏银两 +${milestone.silver.toLocaleString()}🪙</div><button class="btn-sm primary" onclick="window.gameUI.closePanel()" style="width:100%;margin-top:16px;">领取</button></div></div>`;
    this.el.modalContent.innerHTML = html;
    this.el.modalOverlay.style.display = 'flex';
  }

  // --- 商途地图 ---
  renderRoad() {
    const current = this.game.getCurrentRoad();
    const unlocked = this.game.getUnlockedRoads();
    let html = `<div class="panel-card"><div class="panel-header"><h3>🗺️ 商途地图</h3><button class="panel-close" onclick="window.gameUI.closePanel()">×</button></div>`;
    html += '<div class="road-list">';
    for (const [rid, rdef] of Object.entries(ROADS)) {
      const isUnlocked = unlocked.includes(rid);
      const isCurrent = rid === this.game.state.journey.currentRoad;
      html += `<div class="road-item ${isCurrent ? 'current' : ''} ${isUnlocked ? '' : 'locked'}"><div class="road-name">${rdef.name}</div><div class="road-desc">${rdef.description}</div><div class="road-meta">收益倍率 ×${rdef.outputMultiplier} | 需要商途值 ${rdef.unlockShangtu.toLocaleString()}</div>`;
      if (isCurrent) html += '<div class="road-current-badge">当前路段</div>';
      else if (isUnlocked) html += `<button class="btn-sm primary" onclick="window.gameUI.switchToRoad('${rid}')">切换至此</button>`;
      html += '</div>';
    }
    html += '</div></div>';
    this.el.modalContent.innerHTML = html;
  }
  switchToRoad(rid) { this.game.switchRoad(rid); this.renderRoad(); }

  // --- Prestige ---
  renderPrestige() {
    const can = this.game.canPrestige();
    const p = this.game.state.prestige;
    const legacyPct = Math.floor(p.legacy * GAME_CONFIG.legacyPerReputation * 100);
    let html = `<div class="panel-card"><div class="panel-header"><h3>🔥 声望重置</h3><button class="panel-close" onclick="window.gameUI.closePanel()">×</button></div>`;
    html += `<div class="prestige-info"><p>重置次数：${p.count}</p><p>传承点：${p.legacy} (全店铺产出+${legacyPct}%)</p><p>当前声望：${this.game.getResource('reputation').toLocaleString()} / ${GAME_CONFIG.prestigeRequirement.toLocaleString()}</p></div>`;
    html += '<div class="prestige-detail"><h4>重置后：</h4><ul><li>✅ 保留：永久道具效果、路段解锁、传闻、成就</li><li>❌ 清零：银两、店铺等级、商途值、消耗型道具、背包扩容</li><li>🌟 首次重置解锁Prestige商店</li></ul></div>';
    if (can) html += `<button class="btn-primary large" onclick="window.gameUI.doPrestigeUI()">🔥 声望重置 (消耗${GAME_CONFIG.prestigeRequirement}声望)</button>`;
    else html += `<p class="muted">声望不足，需要${GAME_CONFIG.prestigeRequirement}声望</p>`;
    html += '</div>';
    this.el.modalContent.innerHTML = html;
  }
  doPrestigeUI() {
    if (!confirm(`确定要进行声望重置吗？\n\n当前声望 ${this.game.getResource('reputation')} 点将转化为传承点。\n银两、店铺等级、商途值、消耗型道具将被清零。\n\n永久道具效果、路段解锁、传闻、成就会被保留。`)) return;
    this.game.doPrestige();
  }

  // --- 每日登录 ---
  renderDaily() {
    const cycle = GAME_CONFIG.dailyRewardCycle;
    const claimed = this.game.state.daily.claimedThisCycle;
    const today = this.game.getDateStr();
    const claimedToday = this.game.state.daily.claimedToday;
    let html = `<div class="panel-card"><div class="panel-header"><h3>📅 每日登录</h3><button class="panel-close" onclick="window.gameUI.closePanel()">×</button></div>`;
    html += '<div class="daily-grid">';
    for (let i = 0; i < cycle; i++) {
      const reward = DAILY_REWARDS[i];
      const isClaimed = claimed.includes(i + 1);
      const isToday = !claimedToday && !isClaimed && (claimed.length % cycle) === i;
      html += `<div class="daily-item ${isClaimed ? 'claimed' : ''} ${isToday ? 'today' : ''}"><div class="daily-day">第${i + 1}天</div><div class="daily-reward">${reward.desc}</div>${isClaimed ? '<div class="daily-check">✓</div>' : ''}</div>`;
    }
    html += '</div>';
    if (!claimedToday) html += `<button class="btn-primary large" onclick="window.gameUI.claimDailyUI()">🎁 领取今日奖励</button>`;
    else html += '<p class="muted">今日已领取</p>';
    html += '</div>';
    this.el.modalContent.innerHTML = html;
  }
  claimDailyUI() {
    const result = this.game.claimDailyReward();
    if (result.success) alert(`领取成功！获得：${result.given.join('、')}`);
    this.renderDaily();
  }

  // --- 每日商情 ---
  renderMarket() {
    const prices = this.game.getMarketPrices();
    const refreshInfo = this.game.getMarketRefreshInfo();
    const pricingInfo = this.game.getMarketPricingInfo();
    let html = `<div class="panel-card"><div class="panel-header"><h3>📊 商情交易</h3><button class="panel-close" onclick="window.gameUI.closePanel()">×</button></div>`;
    html += `<div class="market-info"><span>下一次行情更新：⏱️ ${refreshInfo.nextRefreshStr}后</span><span class="market-tip">每${refreshInfo.stepsNeeded}步刷新（声望越高越快）</span></div>`;
    html += `<div class="market-info"><span>本轮计价资产：${pricingInfo.assetValue.toLocaleString()}🪙</span><span class="market-tip">资产倍率 ×${pricingInfo.assetMultiplier.toFixed(2)} · 本轮价格已锁定，下次刷新按最新资产重算</span></div>`;

    // 行情表格
    html += '<div class="market-table-header"><span class="mth-goods">货物</span><span class="mth-price">单价</span><span class="mth-hold">持有</span><span class="mth-actions">操作</span></div>';
    for (const [gid, gdata] of Object.entries(prices)) {
      const hold = this.game.getCommodityCount(gid);
      const cls = gdata.multiplier >= 1.5 ? 'up' : gdata.multiplier <= 0.7 ? 'down' : '';
      const arrow = gdata.multiplier >= 1.5 ? '📈' : gdata.multiplier <= 0.7 ? '📉' : '➡️';
      const maxBuy = Math.max(0, GAME_CONFIG.marketMaxHolding - hold);
      html += `<div class="market-row ${cls}"><span class="mr-goods">${gdata.icon} ${gdata.name}<span class="mr-mult">${arrow} ×${gdata.multiplier.toFixed(1)}</span></span><span class="mr-price">${gdata.price.toLocaleString()}🪙</span><span class="mr-hold">${hold > 0 ? `📦×${hold}` : '-'}</span><span class="mr-actions">`;
      if (maxBuy > 0) {
        html += `<input type="number" id="buyQty_${gid}" value="1" min="1" max="${maxBuy}" style="width:48px;text-align:center;font-size:0.85rem;padding:4px 2px;border:1px solid var(--ink-light);border-radius:6px;background:var(--bg-panel);color:var(--ink-primary);margin-right:4px;" title="输入买入数量">`;
        html += `<button class="btn-sm primary" onclick="window.gameUI.buyCommodityUI('${gid}')" title="买入指定数量">买入</button>`;
      } else {
        html += `<span class="muted" style="font-size:0.8rem;">持仓已满</span>`;
      }
      if (hold > 0) {
        html += `<input type="number" id="sellQty_${gid}" value="1" min="1" max="${hold}" style="width:48px;text-align:center;font-size:0.85rem;padding:4px 2px;border:1px solid var(--ink-light);border-radius:6px;background:var(--bg-panel);color:var(--ink-primary);margin-left:6px;margin-right:4px;" title="输入卖出数量">`;
        html += `<button class="btn-sm gold" onclick="window.gameUI.sellCommodityUI('${gid}')" title="卖出指定数量">卖出</button>`;
        if (hold > 1) {
          html += `<button class="btn-sm gold" onclick="window.gameUI.sellCommodityUI('${gid}', ${hold})" title="全部卖出" style="margin-left:2px;">全出</button>`;
        }
      } else {
        html += `<button class="btn-sm gold" disabled title="无持仓">卖出</button>`;
      }
      html += `</span></div>`;
    }

    // 背包道具出售
    html += '<div class="market-divider"><span>💼 道具变现</span><span class="market-tip">按行情浮动价格出售背包道具</span></div>';
    const bpItems = this.game.state.backpack.items.filter(i => {
      const def = ITEM_DEFINITIONS[i.id];
      return def && def.type !== 'permanent' && def.rarity !== 'legendary';
    });
    if (bpItems.length === 0) {
      html += '<p class="muted" style="text-align:center;padding:var(--space-sm)">背包中没有可出售的道具</p>';
    } else {
      const marketAvgMult = Object.values(prices).reduce((s, g) => s + g.multiplier, 0) / Math.max(1, Object.keys(prices).length);
      html += '<div class="item-sell-grid">';
      for (const item of bpItems) {
        const def = ITEM_DEFINITIONS[item.id];
        const sellRatio = 0.5 + marketAvgMult * 0.5;
        const sellPrice = Math.floor(def.price * sellRatio);
        html += `<div class="item-sell-row"><span>${def.icon} ${def.name} ×${item.quantity}</span><span class="isr-price">${sellPrice}🪙/个</span><button class="btn-sm gold" onclick="window.gameUI.sellItemFromUI('${item.id}', 1)">出售×1</button>${item.quantity > 1 ? `<button class="btn-sm gold" onclick="window.gameUI.sellItemFromUI('${item.id}', ${item.quantity})">全部出</button>` : ''}</div>`;
      }
      html += '</div>';
    }
    html += '</div>';
    this.el.modalContent.innerHTML = html;
  }

  buyCommodityUI(goodId) {
    const qtyInput = document.getElementById(`buyQty_${goodId}`);
    const qty = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;
    const result = this.game.buyCommodity(goodId, qty);
    if (!result.success) {
      if (result.reason === 'no_silver') alert('银两不足！');
      else if (result.reason === 'full') alert(result.msg);
    }
  }
  sellCommodityUI(goodId, qty) {
    let amount = qty;
    if (amount === undefined || amount === null) {
      const qtyInput = document.getElementById(`sellQty_${goodId}`);
      amount = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;
    }
    const result = this.game.sellCommodity(goodId, amount);
    if (!result.success) {
      if (result.reason === 'no_commodity') alert('库存不足！');
    }
  }
  sellItemFromUI(itemId, qty) {
    const result = this.game.sellItem(itemId, qty);
    if (result.success) {
      if (this.activePanel === 'market') this.renderMarket();
    } else {
      if (result.reason === 'no_item') alert('道具不足！');
    }
  }

  // --- 传闻 ---
  renderRumor() {
    let html = `<div class="panel-card"><div class="panel-header"><h3>📖 江湖传闻</h3><button class="panel-close" onclick="window.gameUI.closePanel()">×</button></div>`;
    html += '<div class="rumor-list">';
    for (const rumor of RUMOR_FRAGMENTS) {
      const collected = this.game.state.rumors.collected[rumor.id] || 0;
      const completed = this.game.state.rumors.completed.includes(rumor.id);
      html += `<div class="rumor-item ${completed ? 'completed' : ''}"><div class="rumor-title">${rumor.title}</div><div class="rumor-progress">碎片：${collected}/${rumor.fragments}`;
      for (let i = 0; i < rumor.fragments; i++) html += `<span class="rumor-frag ${i < collected ? 'found' : ''}">${i < collected ? '◉' : '○'}</span>`;
      html += `</div>${completed ? `<div class="rumor-story">${rumor.story}</div>` : ''}</div>`;
    }
    html += '</div></div>';
    this.el.modalContent.innerHTML = html;
  }

  // --- 成就 ---
  renderAchievements() {
    let html = `<div class="panel-card"><div class="panel-header"><h3>🏆 成就</h3><button class="panel-close" onclick="window.gameUI.closePanel()">×</button></div>`;
    html += '<div class="achievement-list">';
    const unlocked = Object.keys(this.game.state.achievements).filter(k => this.game.state.achievements[k]);
    html += `<p>已解锁：${unlocked.length} / ${ACHIEVEMENTS.length}</p>`;
    for (const ach of ACHIEVEMENTS) {
      const isUnlocked = this.game.state.achievements[ach.id];
      html += `<div class="achievement-item ${isUnlocked ? 'unlocked' : 'locked'}"><span class="ach-icon">${ach.icon}</span><div class="ach-info"><div class="ach-name">${ach.name}</div><div class="ach-desc">${ach.desc}</div>${isUnlocked ? '<div class="ach-badge">✓ 已解锁</div>' : ''}</div></div>`;
    }
    html += '</div></div>';
    this.el.modalContent.innerHTML = html;
  }

  // --- 设置 ---
  renderSettings() {
    let html = `<div class="panel-card"><div class="panel-header"><h3>⚙️ 设置</h3><button class="panel-close" onclick="window.gameUI.closePanel()">×</button></div>`;
    // 伪装类型
    html += '<h4>伪装模式</h4><div class="disguise-select">';
    for (const [tid, tdef] of Object.entries(DISGUISE_TYPES)) {
      const isActive = this.game.state.disguiseType === tid;
      html += `<button class="btn-sm ${isActive ? 'primary' : ''}" onclick="window.gameUI.setDisguiseType('${tid}')">${tdef.icon} ${tdef.name}</button>`;
    }
    html += '</div>';
    // 存档导出导入
    html += '<h4 style="margin-top:16px;">存档管理</h4><div style="display:flex;gap:8px;flex-wrap:wrap;">';
    html += `<button class="btn-sm" onclick="window.gameUI.exportSave()">📤 导出存档</button>`;
    html += `<button class="btn-sm" onclick="window.gameUI.showImportPrompt()">📥 导入存档</button>`;
    html += `<button class="btn-sm danger" onclick="window.gameUI.confirmReset()">🔄 重置游戏</button>`;
    html += '</div>';
    // 统计
    html += '<h4 style="margin-top:16px;">游戏统计</h4>';
    html += `<p>版本：${GAME_CONFIG.version}</p>`;
    html += `<p>总行进次数：${this.game.state.meta.totalTravels}</p>`;
    html += `<p>总轮次：${this.game.state.meta.totalRounds}</p>`;
    html += `<p>总银两收入：${this.game.state.meta.totalSilverEarned.toLocaleString()}</p>`;
    html += `<p>声望重置次数：${this.game.state.prestige.count}</p>`;
    html += '</div>';
    this.el.modalContent.innerHTML = html;
  }
  setDisguiseType(type) { this.game.setDisguiseType(type); this.renderSettings(); }
  exportSave() {
    const data = this.game.exportSave();
    if (!data) { alert('导出失败：存档数据为空！'); return; }
    // 仅在安全上下文（HTTPS/localhost）下 navigator.clipboard 才存在，
    // 从 file:// 打开时它是 undefined，直接访问 .writeText 会同步抛 TypeError，
    // .catch() 接不到，整条导出路径静默失败。
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(data)
        .then(() => alert('存档已复制到剪贴板！'))
        .catch(() => this.showExportDataModal(data, true));
      return;
    }
    // file:// 等不安全上下文：直接展示存档数据让玩家手动复制
    this.showExportDataModal(data, false);
  }
  showExportDataModal(data, attemptedClipboard) {
    const html = `<div class="panel-card"><div class="panel-header"><h3>📤 导出存档</h3><button class="panel-close" onclick="window.gameUI.closePanel()">×</button></div>`
      + `<p style="margin:8px 0;color:var(--ink-muted);font-size:0.9rem;">${attemptedClipboard ? '剪贴板写入失败，请手动复制下方文本：' : '当前环境不支持自动复制，请手动复制下方文本：'}</p>`
      + `<textarea id="exportSaveText" readonly style="width:100%;height:180px;font-family:monospace;font-size:0.78rem;padding:8px;border:1px solid var(--ink-light);border-radius:6px;background:var(--bg-panel);color:var(--ink-primary);resize:vertical;word-break:break-all;" onclick="this.select();">${data.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>`
      + `<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">`
      + `<button class="btn-sm primary" onclick="(function(){const t=document.getElementById('exportSaveText');t.select();try{document.execCommand('copy');alert('已尝试复制，请检查剪贴板');}catch(e){alert('请按 Ctrl/⌘+C 复制');}})()">📋 一键复制</button>`
      + `<button class="btn-sm" onclick="window.gameUI.closePanel()">关闭</button>`
      + `</div></div>`;
    this.el.modalContent.innerHTML = html;
  }
  showImportPrompt() {
    const data = prompt('请粘贴存档码：');
    if (data) {
      const success = this.game.importSave(data);
      if (success) { alert('存档导入成功！'); this.renderAll(); this.closePanel(); }
      else alert('存档格式无效！');
    }
  }
  confirmReset() { if (confirm('确定要重置所有游戏进度吗？此操作不可撤销！')) this.game.resetGame(); }

  // ==================== 伪装 ====================
  toggleDisguise(data) {
    this.el.disguiseOverlay.classList.toggle('active', data.disguised);
    this.el.bossKeyBtn.classList.toggle('active', data.disguised);
    this.el.bossKeyBtn.textContent = data.disguised ? '🔓 切回游戏' : '🔒 老板键 [ESC]';
    if (data.disguised) this.updateDisguiseContent(data.type);
  }
  updateDisguiseContent(type) {
    if (type === 'notepad') {
      this.el.disguiseOverlay.innerHTML = `<div class="disguise-notepad"><div class="notepad-titlebar">记事本 - 无标题</div><textarea class="notepad-area">会议纪要 - ${new Date().toLocaleDateString('zh-CN')}

一、项目进度汇报
1. Q3项目开发进度正常，已完成85%
2. 预算使用情况：已使用62%，符合预期
3. 下阶段重点：完成Q3收尾，启动Q4规划

二、待办事项
□ 完成市场调研报告
□ 安排下周一团队会议
□ 审核供应商合同
□ 准备季度述职PPT

三、其他事项
- 周五团建活动确认参加人数
- 新员工入职培训安排</textarea></div>`;
    } else if (type === 'vscode') {
      this.el.disguiseOverlay.innerHTML = `<div class="disguise-vscode"><div class="vscode-sidebar"><div class="vscode-file">📁 src</div><div class="vscode-file indent">📄 index.ts</div><div class="vscode-file indent">📄 utils.ts</div><div class="vscode-file indent">📄 types.ts</div><div class="vscode-file">📁 components</div><div class="vscode-file indent">📄 Header.tsx</div><div class="vscode-file indent">📄 Sidebar.tsx</div></div><div class="vscode-main"><div class="vscode-tabs"><span class="vscode-tab active">index.ts</span></div><pre class="vscode-code"><code><span class="keyword">import</span> { useState, useEffect } <span class="keyword">from</span> <span class="string">'react'</span>;

<span class="keyword">export</span> <span class="keyword">interface</span> <span class="type">DashboardProps</span> {
  data: <span class="type">ReportData</span>;
  onRefresh: () => <span class="keyword">Promise</span>&lt;<span class="keyword">void</span>&gt;;
}

<span class="keyword">export</span> <span class="keyword">const</span> <span class="function">Dashboard</span>: <span class="type">React.FC</span>&lt;<span class="type">DashboardProps</span>&gt; = ({ data, onRefresh }) => {
  <span class="keyword">const</span> [loading, setLoading] = <span class="function">useState</span>(<span class="keyword">false</span>);

  <span class="function">useEffect</span>(() => {
    <span class="keyword">const</span> interval = <span class="function">setInterval</span>(onRefresh, 30000);
    <span class="keyword">return</span> () => <span class="function">clearInterval</span>(interval);
  }, [onRefresh]);

  <span class="keyword">return</span> (
    &lt;<span class="tag">div</span> className=<span class="string">"dashboard"</span>&gt;
      &lt;<span class="tag">Header</span> title=<span class="string">"Data Overview"</span> /&gt;
      &lt;<span class="tag">main</span>&gt;
        {loading ? (
          &lt;<span class="tag">Spinner</span> /&gt;
        ) : (
          &lt;<span class="tag">ChartGrid</span> data={data} /&gt;
        )}
      &lt;/<span class="tag">main</span>&gt;
    &lt;/<span class="tag">div</span>&gt;
  );
};</code></pre></div></div>`;
    } else if (type === 'email') {
      this.el.disguiseOverlay.innerHTML = `<div class="disguise-email"><div class="email-sidebar"><div class="email-folder active">📥 收件箱 (12)</div><div class="email-folder">📤 已发送</div><div class="email-folder">📝 草稿箱</div><div class="email-folder">🗑️ 已删除</div></div><div class="email-main"><div class="email-list"><div class="email-item unread"><span class="email-sender">张经理</span><span class="email-subject">Q3项目进度汇报</span><span class="email-date">10:30</span></div><div class="email-item"><span class="email-sender">HR部门</span><span class="email-subject">关于下周一会议通知</span><span class="email-date">09:45</span></div><div class="email-item unread"><span class="email-sender">技术部</span><span class="email-subject">新版API文档已更新</span><span class="email-date">昨天</span></div><div class="email-item"><span class="email-sender">行政</span><span class="email-subject">团建活动统计</span><span class="email-date">昨天</span></div></div></div></div>`;
    } else {
      // Excel default
      this.initDisguiseContent();
    }
  }

  initDisguiseContent() {
    this.el.disguiseOverlay.innerHTML = `<div class="disguise-excel"><div class="excel-toolbar"><span style="font-weight:bold;color:#217346;">Excel</span><span style="color:#666;font-size:11px;">文件 开始 插入 页面布局 公式 数据 审阅 视图 帮助</span></div><div class="excel-tabs"><div class="excel-tab active">Sheet1</div><div class="excel-tab">Sheet2</div><div class="excel-tab">Sheet3</div></div><div class="excel-formula-bar"><span style="color:#666;">fx</span><span style="color:#333;flex:1;border:1px solid #D1D1D1;padding:2px 8px;">=SUM(B2:B16)</span></div><div class="excel-grid">${this.generateExcelData()}</div><div class="excel-statusbar"><span>就绪</span><span>平均值: ¥228,450 | 计数: 15 | 求和: ¥3,426,750</span></div></div>`;
  }

  generateExcelData() {
    const headers = ['A','B','C','D','E','F','G','H'];
    const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    let html = '<table><thead><tr><th></th>'; headers.forEach(h => html += `<th>${h}</th>`); html += '</tr></thead><tbody>';
    for (let i = 0; i < 12; i++) {
      const rev = Math.floor(18 + Math.random() * 12), cost = Math.floor(10 + Math.random() * 8), profit = rev - cost, rate = Math.round((profit / rev) * 100);
      html += `<tr><th>${i+1}</th><td>${months[i]}</td><td style="text-align:right">¥${(rev*10000).toLocaleString()}</td><td style="text-align:right">¥${(cost*10000).toLocaleString()}</td><td style="text-align:right">¥${(profit*10000).toLocaleString()}</td><td style="text-align:right">${rate}%</td><td style="text-align:right">${i===0?'—':(Math.random()>0.5?'+':'-')+Math.floor(Math.random()*20)+'%'}</td><td style="text-align:right">¥${((rev+2)*10000).toLocaleString()}</td><td>${Math.random()>0.7?'超预算':'正常'}</td></tr>`;
    }
    html += '</tbody></table>'; return html;
  }

  // ==================== 教程 ====================
  startTutorial() { this.tutorialActive = true; this.tutorialStep = 0; this.showTutorialStep(); }
  showTutorialStep() {
    const steps = [
      { icon:'🏮', title:'欢迎掌柜！', desc:'欢迎来到《掌柜偷闲录》！古风经营摸鱼游戏。你是一位行走江湖的商队掌柜。' },
      { icon:'🚩', title:'出发经商', desc:'点击「出发」开始商途。每次消耗1点精力，行进中会遇到随机事件。' },
      { icon:'⚖️', title:'事件选择', desc:'遇到事件需做出选择。部分事件可使用道具获得额外选项。' },
      { icon:'🏪', title:'经营店铺', desc:'赚了银子记得升级店铺！店铺每10秒产出银两，还能购买各种道具。' },
      { icon:'🔒', title:'老板键', desc:'按<strong>ESC键</strong>瞬间切换伪装界面！再按切回。可在设置中选择伪装类型。' },
    ];
    const step = steps[this.tutorialStep];
    const isLast = this.tutorialStep === steps.length - 1;
    this.el.tutorialOverlay.innerHTML = `<div class="tutorial-card"><div class="tutorial-step">第${this.tutorialStep+1}/${steps.length}步</div><div class="tutorial-icon">${step.icon}</div><div class="tutorial-title">${step.title}</div><div class="tutorial-desc">${step.desc.replace(/\n/g,'<br>')}</div><div class="tutorial-actions"><button class="tutorial-btn secondary" onclick="window.gameUI.skipTutorial()">跳过</button><button class="tutorial-btn primary" onclick="window.gameUI.nextTutorialStep()">${isLast?'开始游戏！':'下一步 →'}</button></div></div>`;
    this.el.tutorialOverlay.style.display = 'flex';
  }
  nextTutorialStep() { this.tutorialStep++; if (this.tutorialStep >= 5) this.completeTutorial(); else this.showTutorialStep(); }
  skipTutorial() { this.game.skipTutorial(); this.el.tutorialOverlay.style.display = 'none'; this.tutorialActive = false; }
  completeTutorial() { this.game.completeTutorial(); this.el.tutorialOverlay.style.display = 'none'; this.tutorialActive = false; }
}

window.gameUI = null;
document.addEventListener('DOMContentLoaded', () => { window.gameUI = new GameUI(game); });
