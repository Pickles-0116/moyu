# 《掌柜偷闲录》v3.0「终局篇」产品需求文档（PRD）

**版本**：v3.0「终局篇」
**日期**：2026-07-22
**作者**：析客（Specky）— 需求分析师
**审核**：方向明（主理人/产品总监）
**状态**：待评审
**上游依赖**：竞析报告、数析报告、v2.4拍卖场PRD、game.js/data.js源码

---

## 1. TL;DR（执行摘要）

v3.0「终局篇」是《掌柜偷闲录》的首个结局系统版本，为游戏引入 **11个结局 × 4个层级** 的多结局体系，彻底改变 v2.x 时代"死亡=唯一终局"的单调收束模式。本版本新增3个物品（长生不老药/琼汁玉液/延寿丹）、归隐系统、结局图鉴、体力=寿命深化机制，并与现有 Prestige 转生、拍卖场、黑市、供奉、赌石等系统深度联动。

核心设计原则：**配置驱动结局仲裁 + 差异化死亡惩罚 + 主动归隐玩家选择权**。所有参数以主理人裁决表为最终值，数析验证成功率从 33.3% 提升至 60%，暴毙率从 67% 降至 40%（配琼汁），在风险感与可达性之间取得平衡。

**关键数字**：11结局 / 3新物品 / 4结局层级 / 5段式结局展示 / 11格结局图鉴

---

## 2. 核心结论卡片

| 维度 | 结论 |
|------|------|
| **结局架构** | 配置驱动（JSON条件矩阵），优先级链：真结局 > 名局 > 俗局 > 死局，同层内按编号仲裁 |
| **死局差异化** | 精尽人亡(保留100%Prestige) / 锒铛入狱(保留50%) / 长生药暴毙(保留75%)，三档惩罚递进 |
| **长生不老药** | 10%长生 / 15%暴毙 / 75%减寿(-200体力)；配琼汁15%/10%/75%；保底：连续暴毙2次后+10%长生(下次) |
| **延寿丹** | 递减+10/+8/+6/+4/+2，上限+30；副效果+50当前体力；Prestige清零递减计数 |
| **体力=寿命** | 基础100 + Prestige+20/转 + 延寿丹(递减) + 永久道具(穿透Prestige)；5转=200刚好扛住-200 |
| **归隐系统** | 主动触发，确认框显示可达成结局，Prestige奖励：死局0/俗局1/名局3/真结局5 |
| **免死金牌** | 不防长生药暴毙（作死不算被害）；防惩罚性倒退致死；恢复体力至10 |
| **经济影响** | 三物品日均sink~4000万/1000人，不挤占现有出口，拍卖场+黑市流量正向协同 |

---

## 3. 产品目标

### 目标1：为游戏提供多元终局收束，提升长线目标感
- **度量**：结局图鉴平均解锁数 ≥ 3/11（D30玩家）；D30留存 +2-3pp（v2.3的4-5% → 5-7%）
- **正交性**：此目标关注"结局多样性"，不涉及具体物品平衡

### 目标2：建立"赌命"高光时刻，创造传播性体验
- **度量**：长生不老结局达成率 3-6%；结局分享功能使用率 ≥ 10%（达成长生不老结局的玩家）
- **正交性**：此目标关注"极端情感体验"，不涉及常规经营结局

### 目标3：通过体力=寿命深化 + 延寿体系，为 Prestige 系统注入新维度
- **度量**：Prestige参与率 +15-20%（v2.3 → v3.0）；延寿丹购买率（终局玩家中）≥ 30%
- **正交性**：此目标关注"Prestige价值重塑"，不涉及结局触发条件

---

## 4. 用户故事

### US-1：新手玩家的第一次死亡（死局）
> 作为一个刚入坑3天的掌柜，我精力不济时疯狂燃烧精血换银两，体力归零后看到"精尽人亡"结局，明白了体力的珍贵。转生后我保留了全部传承点，下一局学会了囤恢复药。

### US-2：中期玩家的知足归隐（俗局）
> 作为一个玩了10天的掌柜，攒了60万银两但声望才200。看到归隐按钮，点开后发现自己可以触发"小富即安"，带着1个额外传承点开始了新一轮，目标是名局。

### US-3：终局玩家的赌命时刻（真结局·长生不老）
> 作为一个5转的老掌柜，攒够了200万银两买长生不老药。我先在黑市刷到琼汁玉液配药，然后深吸一口气点了"服用"——屏幕闪烁，15%的概率……成功了！"长生不老"真结局达成，这是我最刺激的游戏时刻。

### US-4：收集型玩家的终极目标（名局·珍宝满堂）
> 作为一个喜欢收藏的掌柜，我花了20天集齐了5件收藏品（千年翡翠+万年人参+百万年冰红茶+帝王绿翡翠+和田羊脂白玉）。归隐时触发了"珍宝满堂"结局，图鉴点亮的那一刻成就感满满。

### US-5：哲学玩家的隐藏发现（真结局·黄粱一梦）
> 作为一个5转的老玩家，我故意把银两花到不足1万然后归隐。没有任何提示的情况下，突然解锁了"黄粱一梦"结局——"浮生若梦，为欢几何"。我把它截图发到了群里。

---

## 5. 竞品参考（摘自竞析报告）

| 竞品 | 参考维度 | 核心借鉴点 |
|------|---------|-----------|
| **太阁立志传5DX** | 多结局分层 | 30+结局按路径分层+条件数量子分级；同结局内条件满足度决定文案差异 |
| **文明VI** | 优先级处理 | 先到先得/优先级仲裁；6种胜利条件互斥 |
| **Stardew Valley** | 软结局/归隐 | 爷爷评价积分制；可重新评价；游戏继续；结局有实际奖励 |
| **了不起的修仙模拟器** | 延寿丹递减 | 80%耐药性→大幅递减；紫阳丹"Max Qi不足则死"=赌命道具先例 |
| **D&D** | 长生不老药 | Elixir of Immortality: DC 25 Con save，成功延寿/失败即死；累计风险递增 |
| **NetHack** | 免死金牌原型 | Amulet of Life Saving：自动触发+完全治愈+消除致死条件+物品消耗 |
| **博德之门3** | 结局展示 | 可玩式后日谈（3589行对话）；Honour Mode死亡统计展示 |
| **Don't Starve** | 死亡预警 | 三仪表联动；理智值低于阈值时视觉扭曲效果 |

**关键设计决策来源**：
- 延寿丹递减机制 ← ACS耐药性系统
- 长生不老药前置预警 ← ACS紫阳丹Max Qi前置检查
- 归隐确认框 ← 太阁立志传"游戏续行？"选择框
- 结局五段式展示 ← BG3后日谈 + StoryEcho后日谈弹窗
- 免死金牌不防暴毙 ← RimWorld不死基因不防脑毁（特定死亡无法保护）

---

## 6. 数据依据（摘自数析报告）

### 6.1 长生不老药概率模型（主理人裁决参数）

| 状态 | 无琼汁 | 配琼汁 | 说明 |
|------|--------|--------|------|
| 长生 | 10% | 15% | 触发真结局 |
| 暴毙 | 15% | 10% | 体力归零=死亡 |
| 减寿 | 75% | 75% | -200当前体力 |
| **P(最终长生)** | **40.0%** | **60.0%** | p/(p+q) |
| **P(最终暴毙)** | **60.0%** | **40.0%** | q/(p+q) |
| **E[尝试次数]** | **4.00次** | **4.00次** | 1/(p+q) |

### 6.2 期望成本（配琼汁，5转）

| 成本项 | 金额 |
|--------|------|
| 期望药费 | 1,120万（4次×280万/次） |
| 延寿丹 | 0万（5转=200体力已达标） |
| 恢复成本 | ~0（金创药500银两/200体力） |
| **期望总成本/人** | **1,120万** |
| **社会成本/成功** | **1,867万**（1120万/60%） |

### 6.3 结局分布预估

| 类别 | 结局数 | 预估达成率 | 占比 |
|------|--------|-----------|------|
| 死局 | 2 | 17-27% | ~22% |
| 俗局 | 2 | 13-20% | ~15% |
| 名局 | 4 | 20-32% | ~25% |
| 真结局 | 3 | 5-9% | ~6% |
| 弃游(无结局) | — | 15-25% | ~22% |

### 6.4 三物品银两sink评估

| 物品 | 日均消耗/1000人 | 占日产出比 | 协同效应 |
|------|----------------|-----------|---------|
| 长生不老药 | 3,000万 | 0.3-0.5% | 拍卖场流量+5-10% |
| 琼汁玉液 | 960万 | 0.1-0.2% | 黑市流量+3-5% |
| 延寿丹 | 60万 | <0.1% | Prestige参与率+15-20% |

---

## 7. 系统设计详述

### 7.1 结局系统架构（11结局 × 4层级 × 优先级仲裁）

#### 7.1.1 结局层级与优先级

```
优先级（高→低）：
  Tier 1: 真结局（3种）— 商神再临 > 长生不老 > 黄粱一梦
  Tier 2: 名局（4种）  — 富甲一方 = 名满天下 = 赌坛神话 = 珍宝满堂
  Tier 3: 俗局（2种）  — 小富即安 = 泯然众人
  Tier 4: 死局（3种）  — 精尽人亡 = 锒铛入狱 = 长生药暴毙
```

**仲裁规则**：
1. 死局为**被动触发**（体力归零/惩罚性倒退致死/暴毙），不经归隐系统
2. 俗局/名局/真结局（除长生不老）为**主动触发**（玩家点击归隐按钮）
3. 长生不老为**被动触发**（服用长生不老药roll出长生效果）
4. 归隐时按优先级从高到低检测，返回第一个满足条件的结局
5. 同层内多条件满足时，按结局编号排序取第一个
6. 若归隐时无任何结局条件满足，弹出提示"当前条件不足以归隐，继续努力吧！"，不消耗归隐机会

#### 7.1.2 配置驱动架构

所有结局条件配置化，采用JSON条件矩阵，便于测试和调整：

```javascript
const ENDING_CONFIG = {
  // 死局（被动触发）
  death_burn: {
    id: 'death_burn', name: '精尽人亡', tier: 'death', priority: 41,
    trigger: 'passive', triggerType: 'stamina_zero_burn',
    prestigeRetention: 1.0, // 保留100%
    hidden: false,
  },
  death_prison: {
    id: 'death_prison', name: '锒铛入狱', tier: 'death', priority: 42,
    trigger: 'passive', triggerType: 'punitive_setback_death',
    prestigeRetention: 0.5, // 保留50%
    hidden: false,
  },
  death_elixir: {
    id: 'death_elixir', name: '走火入魔', tier: 'death', priority: 43,
    trigger: 'passive', triggerType: 'elixir_overdose',
    prestigeRetention: 0.75, // 保留75%
    hidden: false,
  },
  // 俗局（主动归隐触发）
  common_rich: {
    id: 'common_rich', name: '小富即安', tier: 'common', priority: 31,
    trigger: 'retire',
    conditions: [
      { type: 'silver_gte', value: 500000 },
      { type: 'reputation_lt', value: 300 },
      { type: 'prestige_eq', value: 0 },
    ],
    prestigeRetention: 1.0, prestigeBonus: 1,
    hidden: false,
  },
  common_ordinary: {
    id: 'common_ordinary', name: '泯然众人', tier: 'common', priority: 32,
    trigger: 'retire',
    conditions: [
      { type: 'gameDays_gte', value: 30 },
      { type: 'reputation_lt', value: 100 },
      { type: 'silver_lt', value: 50000 },
      { type: 'prestige_gte', value: 1 },
    ],
    prestigeRetention: 1.0, prestigeBonus: 1,
    hidden: false,
  },
  // 名局（主动归隐触发）
  fame_wealth: {
    id: 'fame_wealth', name: '富甲一方', tier: 'fame', priority: 21,
    trigger: 'retire',
    conditions: [
      { type: 'silver_gte', value: 10000000 },
      { type: 'reputation_gte', value: 500 },
    ],
    prestigeRetention: 1.0, prestigeBonus: 3,
    hidden: false,
  },
  fame_reputation: {
    id: 'fame_reputation', name: '名满天下', tier: 'fame', priority: 22,
    trigger: 'retire',
    conditions: [
      { type: 'reputation_gte', value: 1000 },
      { type: 'prestige_gte', value: 1 },
    ],
    prestigeRetention: 1.0, prestigeBonus: 3,
    hidden: false,
  },
  fame_gamble: {
    id: 'fame_gamble', name: '赌坛神话', tier: 'fame', priority: 23,
    trigger: 'retire',
    conditions: [
      { type: 'stoneGoodCount_gte', value: 30 },
      { type: 'dufangWinCount_gte', value: 50 },
    ],
    prestigeRetention: 1.0, prestigeBonus: 3,
    hidden: false,
  },
  fame_treasure: {
    id: 'fame_treasure', name: '珍宝满堂', tier: 'fame', priority: 24,
    trigger: 'retire',
    conditions: [
      { type: 'allCollections', value: 5 },
    ],
    prestigeRetention: 1.0, prestigeBonus: 3,
    hidden: false,
  },
  // 真结局
  true_god: {
    id: 'true_god', name: '商神再临', tier: 'true', priority: 11,
    trigger: 'retire',
    conditions: [
      { type: 'reputation_gte', value: 1000 },
      { type: 'silver_gte', value: 100000000 },
      { type: 'prestige_gte', value: 3 },
      { type: 'allCollections', value: 5 },
      { type: 'allShopsMaxLevel', value: 100 },
      { type: 'gongfengMaxTier', value: true },
    ],
    prestigeRetention: 1.0, prestigeBonus: 5,
    hidden: false,
  },
  true_dream: {
    id: 'true_dream', name: '黄粱一梦', tier: 'true', priority: 12,
    trigger: 'retire',
    conditions: [
      { type: 'prestige_gte', value: 5 },
      { type: 'silver_lt', value: 10000 },
    ],
    prestigeRetention: 1.0, prestigeBonus: 5,
    hidden: true, // 隐藏结局，不在UI提示
  },
  true_immortal: {
    id: 'true_immortal', name: '长生不老', tier: 'true', priority: 10,
    trigger: 'passive', triggerType: 'elixir_immortality',
    prestigeRetention: 1.0, prestigeBonus: 5,
    hidden: false,
  },
};
```

### 7.2 死局设计（3种，含差异化Prestige保留）

#### 7.2.1 精尽人亡（death_burn）
- **触发条件**：燃烧精血导致体力归零，且未持有免死金牌（或免死金牌已消耗）
- **触发位置**：`burnBlood()` 函数内，`stamina <= 0` 时
- **Prestige保留**：100%（现有行为不变，玩家自己的选择不额外惩罚）
- **叙事文本**：「掌柜燃尽精血，灯枯油尽，终成南柯一梦。」
- **色调**：灰暗

#### 7.2.2 锒铛入狱（death_prison）
- **触发条件**：惩罚性倒退（checkGameOver逻辑）导致体力归零致死，且未持有免死金牌
- **触发位置**：`checkPunitiveSetbackImmunity()` 返回 false 后的死亡路径
- **Prestige保留**：50%（系统惩罚，有一定惩罚力度）
- **叙事文本**：「多行不义必自毙，掌柜身陷囹圄，悔不当初。」
- **色调**：铁青

#### 7.2.3 走火入魔 / 长生药暴毙（death_elixir）
- **触发条件**：服用长生不老药roll出暴毙效果（15%/10%），体力归零
- **触发位置**：`useElixirOfImmortality()` 函数内，roll出暴毙分支
- **Prestige保留**：75%（赌命失败，惩罚中等——比入狱轻因为至少有勇气尝试）
- **叙事文本**：「仙丹化为毒药，掌柜七窍流血，含恨而终……」
- **色调**：暗紫
- **免死金牌不防**：暴毙是仙丹反噬，免死金牌无法抵抗（"作死不算被害"）

#### 7.2.4 死局处理流程

```
体力归零事件
  ├─ 检查免死金牌（protection_death_medal）
  │   ├─ 持有 → 消耗1个，体力恢复至10，继续游戏
  │   └─ 未持有 → 判定死因
  │       ├─ 燃烧精血致死 → death_burn（保留100%）
  │       ├─ 惩罚性倒退致死 → death_prison（保留50%）
  │       └─ 长生药暴毙 → death_elixir（保留75%，免死金牌不拦截）
  └─ 长生药暴毙路径 → 直接death_elixir（跳过免死金牌检查）
```

### 7.3 俗局设计（2种，含归隐系统）

#### 7.3.1 小富即安（common_rich）
- **触发条件**：归隐 + 银两≥50万 + 声望<300 + Prestige次数=0
- **定位**：新手玩家的第一次归隐，"知足常乐"路线
- **预估天数**：5-10天
- **预估达成率**：10-15%
- **叙事文本**：「掌柜急流勇退，守着半生积蓄，安享余年。市井间偶有人提起当年那位小有积蓄的掌柜，皆是会心一笑。」

#### 7.3.2 泯然众人（common_ordinary）
- **触发条件**：归隐 + 游戏天数≥30 + 声望<100 + 银两<5万 + Prestige≥1
- **定位**：经历过轮回但未能翻身的遗憾结局
- **Prestige≥1前置**：防止新玩家过早消极归隐（采纳竞析建议）
- **天数从50降至30**：50天几乎无人达成（采纳数析建议）
- **预估天数**：30天
- **预估达成率**：3-5%
- **叙事文本**：「掌柜碌碌一生，终归平凡，恰如芸芸众生。曾经的雄心壮志，都随风散去了。」

### 7.4 名局设计（4种）

#### 7.4.1 富甲一方（fame_wealth）
- **触发条件**：归隐 + 银两≥1000万 + 声望≥500
- **定位**：标准商人路线的中期成就结局
- **预估天数**：10-20天
- **预估达成率**：10-15%
- **叙事文本**：「掌柜富甲一方，金玉满堂，世人皆仰望之。商道之上，再无人不知掌柜之名。」

#### 7.4.2 名满天下（fame_reputation）
- **触发条件**：归隐 + 声望≥1000 + Prestige≥1
- **定位**：社交/名声路线，需至少1次Prestige（声望清零后重新积累1000）
- **预估天数**：15-25天
- **预估达成率**：5-8%
- **叙事文本**：「掌柜之名，传遍四海，妇孺皆知，青史留名。百年之后，仍有人传颂掌柜的传奇。」

#### 7.4.3 赌坛神话（fame_gamble）
- **触发条件**：归隐 + 赌石累计出good以上≥30次 + 赌坊累计赢≥50次
- **参数调整**：从50/100降至30/50（采纳数析建议，降低肝度）
- **预估天数**：12-15天纯赌
- **预估达成率**：2-4%
- **叙事文本**：「掌柜以命搏运，百赌百胜，终成赌坛不朽神话。江湖传言，掌柜一双慧眼，可窥天机。」

#### 7.4.4 珍宝满堂（fame_treasure）
- **触发条件**：归隐 + 集齐全部5件收藏品
  - 拍卖场收藏品3件：千年翡翠(50万) + 万年人参(300万) + 百万年冰红茶(3000万)
  - 赌石天字号藏品2件：帝王绿翡翠 + 和田羊脂白玉（各1%掉率，10万/次原石）
- **预估成本**：2350-5000万银两
- **预估天数**：15-25天
- **预估达成率**：3-5%
- **叙事文本**：「掌柜遍寻奇珍，集五宝于一堂，可谓慧眼识珠。世人皆叹：珍宝易得，掌柜难求。」

### 7.5 真结局设计（3种，含隐藏结局）

#### 7.5.1 商神再临（true_god）
- **触发条件**：归隐 + 同时满足全部6条件：
  1. 声望≥1000
  2. 银两≥1亿
  3. Prestige≥3
  4. 集齐5件收藏品
  5. 所有店铺≥Lv.100
  6. 供奉达到最高档（巨奉：1亿银两→2000传承）
- **不采积分制**：终极挑战应有门槛，全部条件满足而非积分达标（主理人裁决）
- **预估天数**：40-60天
- **预估达成率**：0.5-1%
- **叙事文本**：「掌柜通商济世，富可敌国，名满天下，供奉至诚——商神再临，非你莫属。从此商道之上，再无来者。」

#### 7.5.2 黄粱一梦（true_dream）— 隐藏结局
- **触发条件**：归隐 + Prestige≥5 + 当前银两<1万
- **隐藏设计**：不在任何UI中提示触发条件，仅在结局图鉴中标注"???"
- **设计意图**：要求玩家走反直觉路径（5次轮回但几乎不存钱），不太可能偶然触发
- **预估天数**：25-35天
- **预估达成率**：2-3%
- **叙事文本**：「五世轮回，万贯家财散尽，方知浮生若梦。掌柜莞尔一笑，归去来兮。天地之间，不过一场黄粱梦罢了。」

#### 7.5.3 长生不老（true_immortal）
- **触发条件**：服用长生不老药，roll出长生效果（被动触发）
- **触发方式**：无需归隐，直接触发结局
- **概率**：10%（无琼汁）/ 15%（配琼汁）
- **预估天数**：20-30天
- **预估达成率**：3-6%
- **叙事文本**：「掌柜服下仙丹，脱胎换骨，从此逍遥天地间，与日月同辉。凡尘俗世，再无牵挂。」

### 7.6 长生不老药系统

#### 7.6.1 物品定义

| 属性 | 值 |
|------|-----|
| 名称 | 长生不老药 |
| ID | `elixir_immortality` |
| 渠道 | 聚宝阁拍品池，归入收藏品类，子概率5%（在collectible类25%中占5%权重） |
| 价格 | 200万银两 |
| 类型 | 消耗品（点击使用） |
| 携带上限 | maxStack: 1 |

#### 7.6.2 效果概率（主理人裁决最终值）

| 结果 | 无琼汁 | 配琼汁 | 效果 |
|------|--------|--------|------|
| 长生 | 10% | 15% | 触发真结局·长生不老 |
| 暴毙 | 15% | 10% | 体力归零=死亡（走火入魔），免死金牌不防 |
| 减寿 | 75% | 75% | 当前体力-200，不够则归零=暴毙 |

#### 7.6.3 保底机制
- **触发条件**：连续暴毙2次后
- **效果**：第3次服用时长生概率+10%（无琼汁10%→20%，配琼汁15%→25%）
- **限制**：仅下次生效，使用后buff消失；暴毙计数不因减寿或长生而重置
- **Prestige清零**：暴毙计数在Prestige后清零

#### 7.6.4 减寿处理规则
- 扣除当前体力200点
- 若扣除后体力>0：扣减后继续游戏，需恢复体力后才能再次尝试
- 若扣除后体力≤0：**触发暴毙**（而非正常死亡判定）
  - 这是"药力反噬"特殊状态，不触发 `modifyResource` 的 endRound/gameOver 逻辑
  - 直接进入 death_elixir 结局路径

#### 7.6.5 前置预警
- 使用前弹出确认框，显示：
  - 当前长生概率（含琼汁加成/保底加成）
  - 当前暴毙概率
  - 当前减寿概率
  - 当前体力值（若<200则标红警告"减寿将导致暴毙"）
  - 是否持有琼汁玉液（若持有则自动配药，显示配药后概率）
  - 确认/取消按钮

#### 7.6.6 琼汁玉液联动
- 背包中持有琼汁玉液时，服用长生不老药自动消耗1个
- 琼汁玉液不单独使用，仅在服长生药时作为辅助
- 若持有多个琼汁玉液，每次服长生药仅消耗1个（不叠加效果）

### 7.7 延寿丹系统

#### 7.7.1 物品定义

| 属性 | 值 |
|------|-----|
| 名称 | 延寿丹 |
| ID | `yanshou_dan` |
| 渠道 | 黑市商品池，常驻可刷出 |
| 价格 | 30万银两 |
| 类型 | 消耗品（随时服用） |
| 携带上限 | maxStack: 10 |

#### 7.7.2 递减机制

| 服用次数 | 最大体力加成 | 累计加成 |
|---------|------------|---------|
| 第1颗 | +10 | +10 |
| 第2颗 | +8 | +18 |
| 第3颗 | +6 | +24 |
| 第4颗 | +4 | +28 |
| 第5颗 | +2 | +30 |
| 第6颗+ | +0（无效） | +30（上限） |

- **Prestige清零**：递减计数也清零（每次Prestige重置计数，可重新享受全效递减）
- **上限+30**：无论服用多少颗，最大体力加成不超过+30

#### 7.7.3 副效果
- **当前体力恢复50**：服用时立即回复50点当前体力（不超上限）
- **设计意图**：扩大客群，使延寿丹兼具"上限提升+即时恢复"双重价值（采纳数析建议）

#### 7.7.4 与Prestige的交互
- Prestige后延寿丹的体力上限加成消失（Prestige清零）
- 但Prestige本身+20最大体力（不变）
- 延寿丹递减计数也清零，可重新从+10开始
- **注意**：延寿丹加成和Prestige加成是叠加关系，计算体力上限时分别计算

### 7.8 体力=寿命机制

#### 7.8.1 体力上限计算公式

```
体力上限 = 100（基础）
         + Prestige次数 × 20（转生加成，不清零）
         + 延寿丹累计加成（递减，上限+30，Prestige清零）
         + 永久道具加成（千年人参+20/雪山参王+50，穿透Prestige）
         + 药铺等级加成（每5级+10，Prestige清零）
```

#### 7.8.2 各Prestige阶段体力上限（无永久道具）

| Prestige | 基础 | Prestige加成 | 延寿丹(满) | 体力上限 |
|----------|------|-------------|-----------|---------|
| 0转 | 100 | 0 | +30 | 130 |
| 1转 | 100 | +20 | +30 | 150 |
| 2转 | 100 | +40 | +30 | 170 |
| 3转 | 100 | +60 | +30 | 190 |
| 4转 | 100 | +80 | +30 | 210 |
| 5转 | 100 | +100 | +30 | 230 |

> 5转=200（无延寿丹）刚好扛住-200体力；有延寿丹则有30点缓冲

#### 7.8.3 体力≤20红色预警系统
- **体力≤20**：体力条变红 + 屏幕边缘红色脉动效果（CSS动画）
- **体力≤10**：弹窗预警"掌柜体力将尽！是否使用恢复道具？"
- **体力=0（非药力反噬）**：触发死局判定
- **体力=0（药力反噬）**：直接触发 death_elixir，不走正常死亡判定

### 7.9 归隐系统

#### 7.9.1 归隐按钮
- **位置**：资源面板中，与"声望重置(Prestige)"按钮并列
- **显示条件**：始终可见（但点击后可能提示条件不足）
- **图标**：🏞️

#### 7.9.2 归隐确认框
点击归隐后弹出确认框，内容：

```
┌─────────────────────────────────────┐
│          🏞️ 归隐山林？               │
│                                     │
│  归隐后将结束本局游戏，根据当前      │
│  成就触发对应结局。请确认：          │
│                                     │
│  📋 可达成的结局：                   │
│  ✅ 小富即安 — 银两≥50万 ✅          │
│               声望<300 ✅            │
│               Prestige=0 ✅          │
│  ❌ 富甲一方 — 银两≥1000万 ❌(320万) │
│               声望≥500 ✅(650)       │
│  ❌ 名满天下 — 声望≥1000 ❌(650)    │
│               Prestige≥1 ❌(0)       │
│  ??? 未知结局 — ？？？               │
│                                     │
│  💡 归隐后传承点奖励：               │
│     当前可达最高结局：小富即安(俗局)  │
│     额外传承点：+1                   │
│                                     │
│  [确认归隐]    [再想想]              │
└─────────────────────────────────────┘
```

- 已满足条件显示 ✅，未满足显示 ❌ 并标注当前值
- 隐藏结局（黄粱一梦）始终显示为"???"
- 若无任何结局条件满足，显示"当前条件不足以归隐，继续努力吧！"且确认按钮禁用

#### 7.9.3 归隐Prestige奖励

| 结局层级 | 额外传承点 | 说明 |
|---------|----------|------|
| 死局 | 0 | 被动触发，无归隐奖励 |
| 俗局 | +1 | 知足/遗憾归隐 |
| 名局 | +3 | 成就型归隐 |
| 真结局 | +5 | 终极成就 |

- 传承点奖励与结局本身的Prestige保留**叠加**
- 例：名局归隐（保留100%已有传承点 + 额外+3点）
- 死局为被动触发，不经过归隐系统，故无额外奖励

#### 7.9.4 归隐后处理
1. 触发结局展示（五段式）
2. 创建纪念存档（仅关键信息）
3. 执行Prestige转生流程（保留传承点 + 额外奖励）
4. 玩家可选择"查看图鉴"或"开始新一局"

### 7.10 结局展示

#### 7.10.1 五段式展示

```
┌─────────────────────────────────┐
│                                 │
│       ① 结局标题（2秒淡入）      │
│         「长生不老」              │
│                                 │
├─────────────────────────────────┤
│                                 │
│  ② 叙事文本（打字机效果）         │
│  「掌柜服下仙丹，脱胎换骨，       │
│   从此逍遥天地间，与日月同辉。    │
│   凡尘俗世，再无牵挂。」          │
│                                 │
├─────────────────────────────────┤
│                                 │
│  ③ 条件回顾                      │
│  ✦ 服用长生不老药                │
│  ✦ 运气逆天，roll出长生效果      │
│                                 │
├─────────────────────────────────┤
│                                 │
│  ④ 数据总结                      │
│  经营天数：28天                  │
│  累计银两：1.2亿                 │
│  声望峰值：1200                  │
│  Prestige次数：5次               │
│  收藏品数：3件                   │
│  赌石次数：45次                  │
│  传承点：8500                    │
│                                 │
├─────────────────────────────────┤
│                                 │
│  ⑤ 结局寄语                      │
│  「天地之间，唯我长生。」          │
│                                 │
│  [查看图鉴]  [复制文案]  [新一局] │
└─────────────────────────────────┘
```

- **打字机效果**：叙事文本逐字显示，每字50ms，可点击跳过
- **数据总结**：从 `state.meta` 和 `state.prestige` 中提取关键数据
- **结局寄语**：每个结局1句点睛之笔

#### 7.10.2 结局文案汇总

| 结局 | 叙事文本 | 寄语 |
|------|---------|------|
| 精尽人亡 | 掌柜燃尽精血，灯枯油尽，终成南柯一梦。 | 贪字头上一把刀。 |
| 锒铛入狱 | 多行不义必自毙，掌柜身陷囹圄，悔不当初。 | 法网恢恢，疏而不漏。 |
| 走火入魔 | 仙丹化为毒药，掌柜七窍流血，含恨而终…… | 命数如此，非战之罪。 |
| 小富即安 | 掌柜急流勇退，守着半生积蓄，安享余年。 | 知足者富。 |
| 泯然众人 | 掌柜碌碌一生，终归平凡，恰如芸芸众生。 | 芸芸众生，各有归途。 |
| 富甲一方 | 掌柜富甲一方，金玉满堂，世人皆仰望之。 | 富可敌国，不过如此。 |
| 名满天下 | 掌柜之名，传遍四海，妇孺皆知，青史留名。 | 名垂青史，万古流芳。 |
| 赌坛神话 | 掌柜以命搏运，百赌百胜，终成赌坛不朽神话。 | 人生如赌，全凭胆识。 |
| 珍宝满堂 | 掌柜遍寻奇珍，集五宝于一堂，可谓慧眼识珠。 | 珍宝易得，慧眼难求。 |
| 商神再临 | 掌柜通商济世，富可敌国，名满天下——商神再临，非你莫属。 | 此道尽矣，再无来者。 |
| 黄粱一梦 | 五世轮回，万贯家财散尽，方知浮生若梦。掌柜莞尔一笑，归去来兮。 | 浮生若梦，为欢几何。 |
| 长生不老 | 掌柜服下仙丹，脱胎换骨，从此逍遥天地间，与日月同辉。 | 天地之间，唯我长生。 |

#### 7.10.3 结局图鉴系统
- **入口**：主菜单新增"结局图鉴"按钮
- **展示**：11个结局的格子，3行4列布局（最后一格为"未完待续"或空白）
- **状态**：
  - 已达成：显示结局名称 + 图标 + 可点击查看文案
  - 未达成：显示剪影 + "?"，不可点击
  - 隐藏结局（黄粱一梦）：未达成时显示"???"，达成后显示名称
- **数据存储**：localStorage 中独立存储 `endingGallery` 数组

#### 7.10.4 纪念存档机制
- **存储内容**：仅存关键信息，不存完整存档
- **格式**：

```javascript
{
  endingId: 'true_immortal',
  endingName: '长生不老',
  endingTier: 'true',
  achievedAt: '2026-07-22T10:30:00',
  gameDays: 28,
  totalSilver: 120000000,
  maxReputation: 1200,
  prestigeCount: 5,
  collections: ['collectible_jade', 'collectible_ginseng', 'collectible_iced_tea'],
  stoneCollections: ['jade_emperor'],
  legacyPoints: 8500,
}
```

- **存储限制**：最多保留20条纪念存档，超出时覆盖最早的
- **查看**：主菜单存档列表中，纪念存档以特殊金色边框标识

### 7.11 免死金牌交互

#### 7.11.1 现有设计（v2.4，不变）
- **自动触发**：遭受惩罚性倒退致死时自动消耗1个
- **恢复效果**：体力恢复至10（当前代码 `this.state.resources.stamina = 10`）
- **一次性消耗**：消耗后需重新获取
- **携带上限**：maxStack:1

#### 7.11.2 v3.0新增规则
- **不防长生不老药暴毙**：暴毙是仙丹反噬，走独立路径 `death_elixir`，不经过 `checkPunitiveSetbackImmunity()` 检查
- **设计理由**："作死不算被害"——玩家主动选择服用高风险道具，免死金牌不应保护
- **代码实现**：`useElixirOfImmortality()` 中暴毙分支直接调用 `triggerEnding('death_elixir')`，跳过免死金牌检查

#### 7.11.3 死局与免死金牌的完整交互表

| 死亡场景 | 免死金牌是否拦截 | 拦截后效果 | 不拦截时结局 | Prestige保留 |
|---------|---------------|----------|-----------|-------------|
| 燃烧精血体力归零 | ✅ 是 | 体力→10，继续游戏 | 精尽人亡 | 100% |
| 惩罚性倒退致死 | ✅ 是 | 体力→10，继续游戏 | 锒铛入狱 | 50% |
| 长生药暴毙 | ❌ 否 | — | 走火入魔 | 75% |
| 长生药减寿后体力≤0 | ❌ 否 | — | 走火入魔 | 75% |

### 7.12 与现有系统联动

#### 7.12.1 Prestige转生系统
- **体力上限加成**：每次Prestige +20最大体力（不变）
- **结局触发**：Prestige次数作为多个结局的条件（泯然众人≥1/名满天下≥1/商神再临≥3/黄粱一梦≥5）
- **清零规则**：
  - 收藏品清零（现有行为）
  - 延寿丹递减计数清零（v3.0新增）
  - 长生药暴毙计数清零（v3.0新增）
  - 传承点保留（现有行为）
  - 永久道具保留（现有行为）
- **归隐与Prestige的关系**：归隐 = 触发结局 + Prestige转生（合二为一），归隐时额外给予传承点奖励

#### 7.12.2 拍卖场/聚宝阁
- **长生不老药上架**：归入收藏品类（collectible），在 `AUCTION_COLLECTIBLES` 中新增，子概率5%
- **购买方式**：一口价200万银两，与其他收藏品相同的购买逻辑
- **Prestige清零**：长生不老药为消耗品，不在collections数组中，Prestige不影响持有

#### 7.12.3 黑市
- **琼汁玉液上架**：新增T3级别黑市商品，常驻可刷出
- **延寿丹上架**：新增T2级别黑市商品，常驻可刷出
- **刷新机制**：沿用现有步数刷新逻辑（`HEISHI_REFRESH_STEPS`）

#### 7.12.4 供奉系统
- **商神再临条件**：供奉达到最高档（巨奉：1亿银两→2000传承）作为6条件之一
- **检测方式**：检查 `state.gongfeng.totalOffered >= 100000000` 或新增 `gongfengMaxTierDone` 标记

#### 7.12.5 赌石系统
- **赌坛神话条件**：需新增追踪字段 `stoneGoodCount`（累计出good以上次数）和 `dufangWinCount`（累计赢次数）
- **天字号藏品**：帝王绿翡翠/和田羊脂白玉作为珍宝满堂的2/5条件（现有机制不变）

#### 7.12.6 查封机制
- **锒铛入狱触发**：黑市/盐场查封风险导致的惩罚性倒退，最终致死时触发
- **现有逻辑**：`checkPunitiveSetbackImmunity()` 检查免死金牌 → 若无则死亡

#### 7.12.7 checkGameOver逻辑
- **现有**：`triggerGameOver('burn')` 统一处理所有死亡
- **v3.0变更**：`triggerGameOver` 需接收死因参数，根据死因触发不同结局
  - `'burn'` → death_burn
  - `'punitive'` → death_prison
  - `'elixir'` → death_elixir

---

## 8. 需求池

### P0（必须完成 — 核心终局体验）

| 编号 | 需求描述 | 优先级 | 验收标准 | 估算工作量 |
|------|---------|--------|---------|-----------|
| END-001 | 结局配置系统：11结局的JSON配置 + 优先级仲裁引擎 | P0 | Given游戏运行中，When体力归零/归隐/服长生药，Then按优先级链返回正确的结局ID | 2天 |
| END-002 | 死局系统：3种死局触发 + 差异化Prestige保留 | P0 | Given不同死因，When触发死亡，Then精尽保留100%/入狱保留50%/暴毙保留75% | 1天 |
| END-003 | 长生不老药物品 + 使用逻辑（概率/保底/暴毙/减寿） | P0 | Given服用长生药，Then 10%/15%/75%概率分别触发长生/暴毙/减寿；连续暴毙2次后第3次+10%长生 | 2天 |
| END-004 | 琼汁玉液物品 + 联动逻辑 | P0 | Given背包持有琼汁玉液，When服用长生药，Then自动消耗1个琼汁，长生+5%/暴毙-5% | 0.5天 |
| END-005 | 延寿丹物品 + 递减机制 + 副效果 | P0 | Given服用第N颗延寿丹，Then最大体力+递减值(10/8/6/4/2/0)+当前体力+50；Prestige清零计数 | 1天 |
| END-006 | 体力=寿命深化：上限计算公式整合 + ≤20红色预警 | P0 | Given体力≤20，Then体力条变红+屏幕红色脉动；体力上限=100+Prestige×20+延寿丹+永久道具+药铺 | 1天 |
| END-007 | 归隐系统：按钮 + 确认框 + 条件检测 + Prestige奖励 | P0 | Given点击归隐，Then弹出确认框显示可达成结局列表+条件满足状态；确认后触发结局+额外传承点 | 1.5天 |
| END-008 | 结局展示：五段式（标题/叙事/条件/数据/寄语） | P0 | Given结局触发，Then依次显示5段内容，叙事有打字机效果，可跳过 | 1.5天 |
| END-009 | triggerGameOver改造：接收死因参数 + 分流结局 | P0 | Given triggerGameOver(reason)，Then根据reason分流到对应死局结局 | 0.5天 |
| END-010 | 长生不老药前置预警确认框 | P0 | Given使用长生药前，Then弹出确认框显示当前概率/体力/琼汁持有状态 | 0.5天 |

### P1（应该完成 — 增强体验）

| 编号 | 需求描述 | 优先级 | 验收标准 | 估算工作量 |
|------|---------|--------|---------|-----------|
| END-011 | 结局图鉴系统：11格 + 点亮/未点亮 + 隐藏结局 | P1 | Given主菜单，Then可进入结局图鉴查看11个结局解锁状态，已达成可查看文案 | 1天 |
| END-012 | 纪念存档机制：结局达成时自动创建 | P1 | Given结局触发，Then自动保存关键信息到endingGallery（最多20条） | 0.5天 |
| END-013 | 拍卖场新增长生不老药拍品 | P1 | Given拍卖场刷新，Thencollectible类有5%概率刷出长生不老药(200万) | 0.5天 |
| END-014 | 黑市新增琼汁玉液 + 延寿丹商品 | P1 | Given黑市刷新，ThenT3有琼汁玉液(80万)/T2有延寿丹(30万)常驻可刷 | 0.5天 |
| END-015 | 新增追踪字段：stoneGoodCount/dufangWinCount/gameDays | P1 | Given赌石/赌坊/游戏运行，Then累计计数正确且Prestige不清零 | 0.5天 |
| END-016 | 结局文案：11结局的叙事文本+寄语 | P1 | Given结局展示，Then每个结局有独特的叙事文本和寄语 | 0.5天 |
| END-017 | 结局分享功能：复制结局文案到剪贴板 | P1 | Given结局展示页，Then可点击"复制文案"按钮复制结局信息 | 0.5天 |

### P2（可以做 — 锦上添花）

| 编号 | 需求描述 | 优先级 | 验收标准 | 估算工作量 |
|------|---------|--------|---------|-----------|
| END-018 | 结局BGM差异化：死局悲壮/俗局悠然/名局豪迈/真结局史诗 | P2 | Given不同层级结局触发，Then播放对应BGM | 1天 |
| END-019 | 首次归隐保留存档：第一次归隐时自动创建归隐前存档 | P2 | Given首次归隐，Then自动创建可读存档，允许玩家读取后继续 | 0.5天 |
| END-020 | 归隐纪念标识：存档列表中为已归隐存档添加金色标识 | P2 | Given存档列表，Then已归隐的存档显示金色印章+结局名称缩写 | 0.5天 |
| END-021 | 体力≤10弹窗预警：主动提示使用恢复道具 | P2 | Given体力≤10，Then弹窗提示"掌柜体力将尽，是否使用恢复道具？" | 0.5天 |

**总估算工作量**：P0约11.5天 + P1约4.5天 + P2约3天 = **约19天**

---

## 9. 数据结构设计

### 9.1 新增GameState字段

```javascript
// 在 state.meta 中新增
meta: {
  // ... 现有字段 ...
  // v3.0 新增追踪字段（Prestige不清零）
  stoneGoodCount: 0,      // 累计赌石出good以上品质次数
  dufangWinCount: 0,      // 累计赌坊赢次数
  gameStartTime: Date.now(), // 游戏开始时间（用于计算gameDays）
  gongfengMaxTierDone: false, // 是否已供奉最高档（巨奉）
},

// 在 state 中新增 v3.0 结局系统字段
ending: {
  gallery: [],            // 结局图鉴：已达成的结局ID数组
  memorials: [],          // 纪念存档数组（最多20条）
  currentEndingId: null,  // 当前触发的结局ID（用于展示）
},

// 在 state 中新增 v3.0 长生药/延寿丹字段
elixir: {
  consecutiveDeaths: 0,   // 连续暴毙次数（保底机制用）
  pityBuffActive: false,  // 保底buff是否激活（下次生效）
},

yanshou: {
  totalCount: 0,          // 当前周期延寿丹服用次数（递减计算用）
  staminaBonus: 0,        // 当前延寿丹累计体力上限加成
},
```

### 9.2 新增物品定义

```javascript
// 在 ITEM_DEFINITIONS 中新增

// 长生不老药
elixir_immortality: {
  id: 'elixir_immortality',
  name: '长生不老药',
  icon: '🧪',
  rarity: 'mythic',
  type: 'consumable',
  category: 'elixir',
  description: '传说中能令人长生不老的仙丹。10%长生，15%暴毙，75%减寿200体力。服用前可配琼汁玉液提升成功率。',
  effect: { useElixir: true },
  price: 2000000,
  stackable: true,
  maxStack: 1,
  useContext: ['any'],
},

// 琼汁玉液
qiongzhi_yuye: {
  id: 'qiongzhi_yuye',
  name: '琼汁玉液',
  icon: '🍶',
  rarity: 'legendary',
  type: 'consumable',
  category: 'elixir_support',
  description: '服用长生不老药前饮用，长生率+5%，暴毙率-5%。不单独使用，持有长生不老药时自动配药消耗。',
  effect: { elixirSupport: true },
  price: 800000,
  stackable: true,
  maxStack: 5,
  useContext: ['any'],
},

// 延寿丹
yanshou_dan: {
  id: 'yanshou_dan',
  name: '延寿丹',
  icon: '💊',
  rarity: 'epic',
  type: 'consumable',
  category: 'stamina_max_boost',
  description: '永久增加最大体力（递减：+10/+8/+6/+4/+2，上限+30），并恢复50点当前体力。Prestige后递减计数清零。',
  effect: { useYanshouDan: true },
  price: 300000,
  stackable: true,
  maxStack: 10,
  useContext: ['any'],
},
```

### 9.3 拍卖场收藏品扩展

```javascript
// 在 AUCTION_COLLECTIBLES 中新增长生不老药
// 注意：长生不老药不是收藏品，但通过收藏品类池刷出
// 需要新增一个独立的 elixir 子类池

const AUCTION_ELIXIR_POOL = {
  elixir_immortality: {
    id: 'elixir_immortality',
    name: '长生不老药',
    icon: '🧪',
    price: 2000000,
    weight: 5, // 在collectible类中占5%权重
    type: 'elixir',
    rarity: 'mythic',
    desc: '传说中能令人长生不老的仙丹。风险极大，非生死关头不可轻试。',
  },
};
```

### 9.4 黑市商品扩展

```javascript
// 在 HEISHI_GOODS 中新增

// 琼汁玉液 — T3级别，需Prestige≥3
{ id:'heishi_qiongzhi', tier:3, name:'琼汁玉液', icon:'🍶', basePrice:800000, chance:0.04,
  itemReward:{id:'qiongzhi_yuye',qty:1}, needPrestige:3 },

// 延寿丹 — T2级别，需Prestige≥1
{ id:'heishi_yanshou', tier:2, name:'延寿丹', icon:'💊', basePrice:300000, chance:0.06,
  itemReward:{id:'yanshou_dan',qty:1}, needPrestige:1 },
```

### 9.5 结局配置（完整JSON）

见 7.1.2 节的 `ENDING_CONFIG` 定义。

### 9.6 结局文案配置

```javascript
const ENDING_TEXTS = {
  death_burn: {
    title: '精尽人亡',
    narrative: '掌柜燃尽精血，灯枯油尽，终成南柯一梦。坊间传言，那位掌柜的最后一句遗言是："再来一局……"',
    epilogue: '贪字头上一把刀。',
    color: '#555555', // 灰暗
  },
  death_prison: {
    title: '锒铛入狱',
    narrative: '多行不义必自毙，掌柜身陷囹圄，悔不当初。铁窗之内，唯有月光作伴。',
    epilogue: '法网恢恢，疏而不漏。',
    color: '#2c3e50', // 铁青
  },
  death_elixir: {
    title: '走火入魔',
    narrative: '仙丹化为毒药，掌柜七窍流血，含恨而终……求长生者，终死于长生。',
    epilogue: '命数如此，非战之罪。',
    color: '#4a235a', // 暗紫
  },
  common_rich: {
    title: '小富即安',
    narrative: '掌柜急流勇退，守着半生积蓄，安享余年。市井间偶有人提起当年那位小有积蓄的掌柜，皆是会心一笑。',
    epilogue: '知足者富。',
    color: '#27ae60', // 温馨绿
  },
  common_ordinary: {
    title: '泯然众人',
    narrative: '掌柜碌碌一生，终归平凡，恰如芸芸众生。曾经的雄心壮志，都随风散去了。',
    epilogue: '芸芸众生，各有归途。',
    color: '#7f8c8d', // 淡灰
  },
  fame_wealth: {
    title: '富甲一方',
    narrative: '掌柜富甲一方，金玉满堂，世人皆仰望之。商道之上，再无人不知掌柜之名。',
    epilogue: '富可敌国，不过如此。',
    color: '#f39c12', // 金色
  },
  fame_reputation: {
    title: '名满天下',
    narrative: '掌柜之名，传遍四海，妇孺皆知，青史留名。百年之后，仍有人传颂掌柜的传奇。',
    epilogue: '名垂青史，万古流芳。',
    color: '#e74c3c', // 正红
  },
  fame_gamble: {
    title: '赌坛神话',
    narrative: '掌柜以命搏运，百赌百胜，终成赌坛不朽神话。江湖传言，掌柜一双慧眼，可窥天机。',
    epilogue: '人生如赌，全凭胆识。',
    color: '#8e44ad', // 紫色
  },
  fame_treasure: {
    title: '珍宝满堂',
    narrative: '掌柜遍寻奇珍，集五宝于一堂，可谓慧眼识珠。世人皆叹：珍宝易得，掌柜难求。',
    epilogue: '珍宝易得，慧眼难求。',
    color: '#1abc9c', // 翡翠绿
  },
  true_god: {
    title: '商神再临',
    narrative: '掌柜通商济世，富可敌国，名满天下，供奉至诚——商神再临，非你莫属。从此商道之上，再无来者。',
    epilogue: '此道尽矣，再无来者。',
    color: '#ffd700', // 纯金
  },
  true_dream: {
    title: '黄粱一梦',
    narrative: '五世轮回，万贯家财散尽，方知浮生若梦。掌柜莞尔一笑，归去来兮。天地之间，不过一场黄粱梦罢了。',
    epilogue: '浮生若梦，为欢几何。',
    color: '#95a5a6', // 朦胧灰
  },
  true_immortal: {
    title: '长生不老',
    narrative: '掌柜服下仙丹，脱胎换骨，从此逍遥天地间，与日月同辉。凡尘俗世，再无牵挂。',
    epilogue: '天地之间，唯我长生。',
    color: '#2ecc71', // 仙逸绿
  },
};
```

---

## 10. 关键逻辑代码片段

### 10.1 结局判定函数

```javascript
/**
 * 结局判定引擎 — 配置驱动的优先级仲裁
 * @param {string} triggerType - 'retire' | 'passive'
 * @param {string} passiveTrigger - 被动触发时的事件类型
 * @returns {object|null} 结局配置对象，null表示无匹配
 */
checkEnding(triggerType = 'retire', passiveTrigger = null) {
  // 被动触发（死局/长生不老）
  if (triggerType === 'passive') {
    for (const ending of Object.values(ENDING_CONFIG)) {
      if (ending.trigger === 'passive' && ending.triggerType === passiveTrigger) {
        return ending;
      }
    }
    return null;
  }

  // 主动归隐 — 按优先级从高到低检测
  const retireEndings = Object.values(ENDING_CONFIG)
    .filter(e => e.trigger === 'retire')
    .sort((a, b) => a.priority - b.priority); // priority数值越小优先级越高

  for (const ending of retireEndings) {
    if (this.checkEndingConditions(ending.conditions)) {
      return ending;
    }
  }
  return null;
}

/**
 * 检查单个结局的条件是否全部满足
 */
checkEndingConditions(conditions) {
  if (!conditions || conditions.length === 0) return true;
  for (const cond of conditions) {
    if (!this.checkSingleCondition(cond)) return false;
  }
  return true;
}

/**
 * 检查单个条件
 */
checkSingleCondition(cond) {
  const state = this.state;
  switch (cond.type) {
    case 'silver_gte':
      return state.resources.silver >= cond.value;
    case 'silver_lt':
      return state.resources.silver < cond.value;
    case 'reputation_gte':
      return state.resources.reputation >= cond.value;
    case 'reputation_lt':
      return state.resources.reputation < cond.value;
    case 'prestige_gte':
      return state.prestige.count >= cond.value;
    case 'prestige_eq':
      return state.prestige.count === cond.value;
    case 'gameDays_gte':
      return this.getGameDays() >= cond.value;
    case 'stoneGoodCount_gte':
      return (state.meta.stoneGoodCount || 0) >= cond.value;
    case 'dufangWinCount_gte':
      return (state.meta.dufangWinCount || 0) >= cond.value;
    case 'allCollections':
      return this.getTotalCollectionCount() >= cond.value;
    case 'allShopsMaxLevel':
      return this.getAllShopsMaxLevel() >= cond.value;
    case 'gongfengMaxTier':
      return state.meta.gongfengMaxTierDone === true;
    default:
      console.warn(`Unknown condition type: ${cond.type}`);
      return false;
  }
}

/**
 * 获取游戏天数
 */
getGameDays() {
  if (!this.state.meta.gameStartTime) return 0;
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((Date.now() - this.state.meta.gameStartTime) / msPerDay);
}

/**
 * 获取收藏品总数（拍卖场3件 + 赌石2件）
 */
getTotalCollectionCount() {
  const auctionCollections = this.state.auction.collections.length;
  const stoneCollections = this.state.auction.stoneCollections.length;
  return auctionCollections + stoneCollections;
}

/**
 * 获取所有店铺最低等级
 */
getAllShopsMaxLevel() {
  let minLevel = Infinity;
  for (const shopKey of Object.keys(SHOPS)) {
    const shop = this.state.shops[shopKey];
    if (shop && shop.level < minLevel) minLevel = shop.level;
  }
  return minLevel === Infinity ? 0 : minLevel;
}
```

### 10.2 长生不老药使用函数

```javascript
/**
 * 使用长生不老药
 * @returns {object} { success, result: 'immortal'|'death'|'lifespan_reduction', ... }
 */
useElixirOfImmortality() {
  if (this.state.gameOver) return { success: false, reason: 'game_over' };

  // 检查是否持有长生不老药
  const elixirIdx = this.state.backpack.items.findIndex(i => i.id === 'elixir_immortality');
  if (elixirIdx < 0) return { success: false, reason: 'no_elixir' };

  // 检查是否持有琼汁玉液（自动配药）
  const qiongzhiIdx = this.state.backpack.items.findIndex(i => i.id === 'qiongzhi_yuye');
  const hasQiongzhi = qiongzhiIdx >= 0;

  // 计算最终概率（主理人裁决参数）
  let immortalityChance = 0.10;  // 基础10%
  let deathChance = 0.15;        // 基础15%
  let lifespanChance = 0.75;     // 基础75%

  if (hasQiongzhi) {
    immortalityChance = 0.15;    // 配琼汁15%
    deathChance = 0.10;          // 配琼汁10%
    lifespanChance = 0.75;       // 减寿不变75%
  }

  // 保底机制：连续暴毙2次后+10%长生（仅下次生效）
  if (this.state.elixir.pityBuffActive) {
    immortalityChance += 0.10;
    lifespanChance -= 0.10; // 从减寿中扣除，暴毙率不变
    this.state.elixir.pityBuffActive = false; // 消耗buff
  }

  // 消耗长生不老药
  const elixirItem = this.state.backpack.items[elixirIdx];
  if (elixirItem.qty > 1) elixirItem.qty--;
  else this.state.backpack.items.splice(elixirIdx, 1);

  // 消耗琼汁玉液（如果持有）
  if (hasQiongzhi) {
    const qiongzhiItem = this.state.backpack.items[qiongzhiIdx];
    if (qiongzhiItem.qty > 1) qiongzhiItem.qty--;
    else this.state.backpack.items.splice(qiongzhiIdx, 1);
    this.addLog('🍶 琼汁玉液生效！长生率+5%，暴毙率-5%！', 'success');
  }

  // Roll!
  const roll = Math.random();
  let result;

  if (roll < immortalityChance) {
    // 🎉 长生！触发真结局
    result = { success: true, result: 'immortal' };
    this.state.elixir.consecutiveDeaths = 0; // 重置暴毙计数
    this.addLog('🧪 长生不老药生效！掌柜脱胎换骨，得道成仙！', 'success');
    this.triggerEnding('true_immortal');

  } else if (roll < immortalityChance + deathChance) {
    // 💀 暴毙！走火入魔
    result = { success: true, result: 'death' };
    this.state.elixir.consecutiveDeaths++;

    // 保底机制：连续暴毙2次后激活buff
    if (this.state.elixir.consecutiveDeaths >= 2) {
      this.state.elixir.pityBuffActive = true;
      this.addLog('🧪 连续暴毙2次，下次服用长生概率+10%！', 'warning');
    }

    this.addLog('💀 长生不老药反噬！掌柜走火入魔，七窍流血……', 'danger');
    // 直接触发走火入魔结局，不走免死金牌检查
    this.triggerEnding('death_elixir');

  } else {
    // ⚡ 减寿！-200当前体力
    const staminaBefore = this.state.resources.stamina;
    this.state.resources.stamina = Math.max(0, staminaBefore - 200);

    if (this.state.resources.stamina <= 0) {
      // 减寿后体力归零 = 暴毙（药力反噬特殊状态，不触发正常死亡判定）
      result = { success: true, result: 'death', cause: 'lifespan_to_zero' };
      this.state.elixir.consecutiveDeaths++;

      if (this.state.elixir.consecutiveDeaths >= 2) {
        this.state.elixir.pityBuffActive = true;
        this.addLog('🧪 连续暴毙2次，下次服用长生概率+10%！', 'warning');
      }

      this.addLog('💀 药力反噬，体力枯竭！掌柜走火入魔……', 'danger');
      this.triggerEnding('death_elixir');
    } else {
      // 存活，但体力大减
      result = {
        success: true,
        result: 'lifespan_reduction',
        staminaLost: staminaBefore - this.state.resources.stamina,
        staminaRemaining: this.state.resources.stamina,
      };
      this.addLog(`⚡ 长生不老药减寿！体力-200，剩余${this.state.resources.stamina}点。`, 'warning');
      this.emit('resourceChange', { resource: 'stamina', amount: -200, newValue: this.state.resources.stamina });
    }
  }

  this.autoSave();
  return result;
}
```

### 10.3 延寿丹递减使用函数

```javascript
/**
 * 使用延寿丹
 * 递减机制：+10/+8/+6/+4/+2，上限+30
 * 副效果：+50当前体力
 */
useYanshouDan() {
  if (this.state.gameOver) return { success: false, reason: 'game_over' };

  // 检查是否持有延寿丹
  const idx = this.state.backpack.items.findIndex(i => i.id === 'yanshou_dan');
  if (idx < 0) return { success: false, reason: 'no_item' };

  // 检查是否已达上限
  if (this.state.yanshou.staminaBonus >= 30) {
    return { success: false, reason: 'max_reached', msg: '延寿丹已达上限(+30)，再服无益。' };
  }

  // 计算递减值
  const YANSHOU_DECAY = [10, 8, 6, 4, 2]; // 第1~5颗的加成
  const count = this.state.yanshou.totalCount;
  const bonus = count < YANSHOU_DECAY.length ? YANSHOU_DECAY[count] : 0;

  if (bonus === 0) {
    return { success: false, reason: 'max_reached', msg: '延寿丹已达上限(+30)，再服无益。' };
  }

  // 消耗延寿丹
  const item = this.state.backpack.items[idx];
  if (item.qty > 1) item.qty--;
  else this.state.backpack.items.splice(idx, 1);

  // 增加最大体力
  this.state.yanshou.totalCount++;
  this.state.yanshou.staminaBonus += bonus;
  this.state.resources.staminaMax += bonus;

  // 副效果：恢复50当前体力（不超上限）
  const healAmount = Math.min(50, this.state.resources.staminaMax - this.state.resources.stamina);
  this.state.resources.stamina += healAmount;

  this.addLog(
    `💊 服用延寿丹！最大体力+${bonus}（累计+${this.state.yanshou.staminaBonus}），当前体力+${healAmount}。`,
    'success'
  );
  this.emit('resourceChange', { resource: 'stamina', amount: healAmount, newValue: this.state.resources.stamina });

  this.autoSave();
  return {
    success: true,
    maxStaminaBonus: bonus,
    totalMaxStaminaBonus: this.state.yanshou.staminaBonus,
    staminaHealed: healAmount,
  };
}
```

### 10.4 归隐检测函数

```javascript
/**
 * 归隐系统 — 玩家主动结束本局
 * @returns {object} { canRetire, availableEndings, bestEnding }
 */
getRetireInfo() {
  // 检测所有可触发的归隐结局
  const retireEndings = Object.values(ENDING_CONFIG)
    .filter(e => e.trigger === 'retire')
    .sort((a, b) => a.priority - b.priority);

  const available = [];
  const allRetireEndings = [];

  for (const ending of retireEndings) {
    const conditionsMet = this.checkEndingConditions(ending.conditions);
    const conditionDetails = this.getConditionDetails(ending.conditions);

    allRetireEndings.push({
      id: ending.id,
      name: ending.hidden ? '???' : ending.name,
      tier: ending.tier,
      hidden: ending.hidden,
      conditionsMet,
      conditions: conditionDetails,
    });

    if (conditionsMet) {
      available.push(ending);
    }
  }

  const bestEnding = available.length > 0 ? available[0] : null;

  return {
    canRetire: available.length > 0,
    availableEndings: available.map(e => ({
      id: e.id, name: e.name, tier: e.tier, prestigeBonus: e.prestigeBonus
    })),
    allEndings: allRetireEndings, // 用于确认框展示
    bestEnding: bestEnding ? {
      id: bestEnding.id, name: bestEnding.name, tier: bestEnding.tier,
      prestigeBonus: bestEnding.prestigeBonus
    } : null,
  };
}

/**
 * 获取条件详情（用于确认框展示）
 */
getConditionDetails(conditions) {
  return conditions.map(cond => {
    let met = this.checkSingleCondition(cond);
    let currentValue = '';
    let targetValue = cond.value;

    switch (cond.type) {
      case 'silver_gte':
        currentValue = this.state.resources.silver; break;
      case 'silver_lt':
        currentValue = this.state.resources.silver; break;
      case 'reputation_gte':
        currentValue = this.state.resources.reputation; break;
      case 'reputation_lt':
        currentValue = this.state.resources.reputation; break;
      case 'prestige_gte':
        currentValue = this.state.prestige.count; break;
      case 'prestige_eq':
        currentValue = this.state.prestige.count; break;
      case 'gameDays_gte':
        currentValue = this.getGameDays(); break;
      case 'stoneGoodCount_gte':
        currentValue = this.state.meta.stoneGoodCount || 0; break;
      case 'dufangWinCount_gte':
        currentValue = this.state.meta.dufangWinCount || 0; break;
      case 'allCollections':
        currentValue = this.getTotalCollectionCount(); break;
      case 'allShopsMaxLevel':
        currentValue = this.getAllShopsMaxLevel(); break;
      case 'gongfengMaxTier':
        currentValue = this.state.meta.gongfengMaxTierDone ? '✓' : '✗'; break;
    }

    return { type: cond.type, met, currentValue, targetValue };
  });
}

/**
 * 执行归隐
 */
doRetire() {
  const info = this.getRetireInfo();
  if (!info.canRetire) return { success: false, reason: 'no_ending' };

  const ending = info.bestEnding;

  // 给予额外传承点奖励
  if (ending.prestigeBonus > 0) {
    this.state.prestige.legacy += ending.prestigeBonus;
    this.addLog(`🏆 归隐奖励：额外+${ending.prestigeBonus}传承点！`, 'success');
  }

  // 触发结局展示
  this.triggerEnding(ending.id);

  return { success: true, endingId: ending.id, endingName: ending.name };
}

/**
 * 触发结局（通用入口）
 */
triggerEnding(endingId) {
  const ending = ENDING_CONFIG[endingId];
  if (!ending) {
    console.error(`Unknown ending: ${endingId}`);
    return;
  }

  this.state.ending.currentEndingId = endingId;

  // 记录到结局图鉴
  if (!this.state.ending.gallery.includes(endingId)) {
    this.state.ending.gallery.push(endingId);
  }

  // 创建纪念存档
  this.createMemorialSave(endingId);

  // 停止游戏循环
  this.state.gameOver = true;
  if (this.state.journey.travelTimer) { cancelAnimationFrame(this.state.journey.travelTimer); this.state.journey.travelTimer = null; }
  this.state.journey.active = false;
  if (this.state.energyTimer) { clearInterval(this.state.energyTimer); this.state.energyTimer = null; }
  if (this.state.shopTimer) { clearInterval(this.state.shopTimer); this.state.shopTimer = null; }
  if (this.state.autoSaveTimer) { clearInterval(this.state.autoSaveTimer); this.state.autoSaveTimer = null; }

  // 发出结局事件
  this.emit('endingTriggered', {
    endingId: endingId,
    endingName: ending.name,
    endingTier: ending.tier,
    prestigeRetention: ending.prestigeRetention,
  });

  this.autoSave();
}

/**
 * 创建纪念存档
 */
createMemorialSave(endingId) {
  const memorial = {
    endingId: endingId,
    endingName: ENDING_CONFIG[endingId].name,
    endingTier: ENDING_CONFIG[endingId].tier,
    achievedAt: new Date().toISOString(),
    gameDays: this.getGameDays(),
    totalSilver: this.state.meta.totalSilverEarned,
    maxReputation: this.state.resources.reputation,
    prestigeCount: this.state.prestige.count,
    collections: [...this.state.auction.collections],
    stoneCollections: [...this.state.auction.stoneCollections],
    legacyPoints: this.state.prestige.legacy,
  };

  this.state.ending.memorials.push(memorial);

  // 限制最多20条
  if (this.state.ending.memorials.length > 20) {
    this.state.ending.memorials.shift();
  }
}
```

### 10.5 triggerGameOver改造

```javascript
/**
 * 游戏结束 — v3.0改造：接收死因参数，分流结局
 * @param {string} reason - 'burn' | 'punitive' | 'elixir'
 */
triggerGameOver(reason = 'burn') {
  // 根据死因映射到结局ID
  const deathEndingMap = {
    'burn': 'death_burn',        // 精尽人亡
    'punitive': 'death_prison',  // 锒铛入狱
    'elixir': 'death_elixir',    // 走火入魔
  };

  const endingId = deathEndingMap[reason] || 'death_burn';
  const ending = ENDING_CONFIG[endingId];

  // 应用Prestige保留比例
  if (ending.prestigeRetention < 1.0) {
    const retainedLegacy = Math.floor(this.state.prestige.legacy * ending.prestigeRetention);
    const lostLegacy = this.state.prestige.legacy - retainedLegacy;
    this.state.prestige.legacy = retainedLegacy;
    this.addLog(`💔 传承点损失${lostLegacy}点（保留${Math.floor(ending.prestigeRetention * 100)}%）`, 'danger');
  }

  // 触发结局
  this.triggerEnding(endingId);
}
```

### 10.6 Prestige清零扩展

```javascript
// 在 doPrestige() 中新增 v3.0 清零逻辑（在现有重置代码之后添加）

// v3.0: 延寿丹递减计数清零
this.state.yanshou = { totalCount: 0, staminaBonus: 0 };

// v3.0: 长生药暴毙计数清零
this.state.elixir = { consecutiveDeaths: 0, pityBuffActive: false };

// v3.0: 重算体力上限（移除延寿丹加成，保留Prestige加成）
this.applyPermanentUpgrades(); // 已有，重新计算永久道具+药铺加成
// Prestige加成在 applyPermanentUpgrades 之后通过 staminaMax 计算
this.state.resources.staminaMax = RESOURCES.stamina.max
  + this.state.backpack.permanentUpgrades.staminaMaxBonus
  + (this.state.prestige.count * 20); // Prestige +20/转
// 药铺等级加成在 applyPermanentUpgrades 中处理
this.state.resources.stamina = this.state.resources.staminaMax; // 满体力开始
```

---

## 11. 经济平衡影响评估

### 11.1 长生不老药期望成本（引用数析数据）

| 场景 | 期望药费/人 | P(成功) | 社会成本/成功 | 评价 |
|------|-----------|---------|------------|------|
| 配琼汁(5转) | 1,120万 | 60.0% | 1,867万 | ✅ 平衡 |
| 无琼汁(5转) | 800万 | 40.0% | 2,000万 | 🟡 可接受 |
| 配琼汁(0转+10颗延寿丹) | 1,420万 | 60.0% | 2,367万 | 🟡 贵但可达 |

**与现有消耗出口对比**：
- 供奉最高档(1亿) vs 长生药社会成本(1,867万)：长生药是"穷人路线"——用生命风险换较低银两门槛
- 拍卖终极收藏品(3,000万) vs 长生药社会成本(1,867万)：长生药更便宜但有40%死亡风险

### 11.2 三物品sink评估

| 物品 | 日均消耗/1000人 | 与现有出口关系 | 评价 |
|------|----------------|-------------|------|
| 长生不老药 | 3,000万 | 拍卖场流量+5-10% | ✅ 正向协同 |
| 琼汁玉液 | 960万 | 黑市流量+3-5% | ✅ 正向协同 |
| 延寿丹 | 60万 | Prestige参与率+15-20% | ✅ 辅助Prestige |

**结论**：三物品不挤占现有消耗出口，通过增加拍卖场和黑市流量有正向协同效应。

### 11.3 体力=寿命平衡

| Prestige | 体力上限(无延寿丹) | 体力上限(满延寿丹) | 能否扛-200 | 评价 |
|----------|------------------|-------------------|-----------|------|
| 0转 | 100 | 130 | ❌ | 需5颗延寿丹(150万) |
| 3转 | 160 | 190 | ❌ | 需2颗延寿丹(60万) |
| 5转 | 200 | 230 | ✅(刚好) | 无需延寿丹 |

> 5转=200"刚好扛住"的设计具有仪式感，Prestige+20/转保持不变（主理人裁决）。

### 11.4 结局分布预估

| 类别 | 预估达成率 | 评价 |
|------|----------|------|
| 死局 | ~22% | ✅ 合理（自然淘汰+赌命失败） |
| 俗局 | ~15% | ✅ 合理（安于现状型） |
| 名局 | ~25% | ✅ 合理（标准成就型） |
| 真结局 | ~6% | ✅ 合理（稀有且特殊） |
| 弃游 | ~22% | ⚠️ 偏高，结局系统预期可降低5pp |

### 11.5 对留存的影响

| 指标 | v2.3(无结局) | v3.0(有结局) | 变化 |
|------|-----------|-----------|------|
| D7留存 | 10-11% | 12-14% | +2-3pp |
| D30留存 | 4-5% | 5-7% | +1-2pp |
| 弃游率 | 25-30% | 15-25% | -5pp |

---

## 12. Non-goals（明确不做）

1. **不做积分制商神再临**：商神再临保持6条件全满足，不改为积分制。终极挑战应有门槛（主理人裁决）。
2. **不做Prestige体力加成下调**：保持+20/转不变。5转=200的仪式感太好，不降（主理人裁决）。
3. **不做琼汁玉液叠加**：每次服长生药仅消耗1个琼汁玉液，不允许多个叠加效果。
4. **不做免死金牌防暴毙**：长生药暴毙是"作死"，免死金牌不保护（主理人裁决）。
5. **不做长生不老药概率透明显示**：确认框中显示当前概率，但不显示详细计算过程。
6. **不做结局BGM实时切换**：P2优先级，v3.0首版可不做。
7. **不做结局子分级文案**：名局内不再按银两量分档文案（竞析建议C，暂不采纳）。
8. **不做延寿丹Prestige半保留**：Prestige后延寿丹加成完全清零，不做50%保留（数析建议P2，暂不采纳）。
9. **不做首次暴毙免死**：每次暴毙都是真实的，不做"首次暴毙转为-200体力"的保护（数析建议P2，暂不采纳）。
10. **不做结局后游戏继续**：结局=本局结束，触发Prestige转生。不做Stardew Valley式的"软结局+游戏继续"。

---

## 13. 时间线 & 里程碑

### Phase 1：核心结局引擎（第1-2周）
**目标**：结局判定 + 死局 + 长生药系统可玩

| 需求 | 工作量 |
|------|--------|
| END-001 结局配置系统 + 仲裁引擎 | 2天 |
| END-002 死局系统（3种） | 1天 |
| END-009 triggerGameOver改造 | 0.5天 |
| END-003 长生不老药物品+逻辑 | 2天 |
| END-004 琼汁玉液联动 | 0.5天 |
| END-010 长生药前置预警 | 0.5天 |
| 测试+修bug | 2天 |
| **Phase 1合计** | **8.5天** |

**Phase 1验收**：3种死局可正确触发且Prestige保留正确；长生不老药概率/保底/暴毙/减寿逻辑正确；琼汁玉液自动配药生效。

### Phase 2：归隐 + 展示 + 物品上架（第3-4周）
**目标**：归隐系统 + 结局展示 + 延寿丹 + 物品上架

| 需求 | 工作量 |
|------|--------|
| END-005 延寿丹物品+递减 | 1天 |
| END-006 体力=寿命深化+预警 | 1天 |
| END-007 归隐系统 | 1.5天 |
| END-008 结局展示五段式 | 1.5天 |
| END-013 拍卖场上架长生药 | 0.5天 |
| END-014 黑市上架琼汁+延寿丹 | 0.5天 |
| END-015 追踪字段 | 0.5天 |
| END-016 结局文案 | 0.5天 |
| 测试+修bug | 2天 |
| **Phase 2合计** | **9天** |

**Phase 2验收**：归隐按钮可用，确认框正确显示条件；11结局文案完整；延寿丹递减正确；拍卖场/黑市新物品可刷出；追踪字段计数正确。

### Phase 3：图鉴 + 纪念存档 + 打磨（第5周）
**目标**：结局图鉴 + 纪念存档 + 分享 + P2项

| 需求 | 工作量 |
|------|--------|
| END-011 结局图鉴 | 1天 |
| END-012 纪念存档 | 0.5天 |
| END-017 结局分享 | 0.5天 |
| END-018 结局BGM（P2） | 1天 |
| END-019 首次归隐存档（P2） | 0.5天 |
| END-020 归隐标识（P2） | 0.5天 |
| END-021 体力≤10弹窗（P2） | 0.5天 |
| 全量测试+平衡调优 | 2天 |
| **Phase 3合计** | **6.5天** |

**Phase 3验收**：结局图鉴11格正确显示；纪念存档创建/查看正常；分享功能可用；P2项按需完成。

**总工期**：约24天（含测试），建议5-6周完成全部交付。

---

## 14. 待确认问题

1. **长生不老药在拍卖场的刷出条件**：是否需要额外解锁条件（如Prestige≥3）？还是只要拍卖场解锁（声望≥300）即可刷出？当前设计为后者，但200万银两的价格自然形成了门槛。
   - **倾向**：不需额外条件，价格自然门槛已足够。

2. **延寿丹的Prestige清零时机**：是在Prestige确认时立即清零，还是在Prestige完成后的新一局开始时清零？前者更直观，后者更安全（防止Prestige中途取消导致数据不一致）。
   - **倾向**：在 `doPrestige()` 执行时清零，与现有收藏品清零逻辑一致。

3. **结局图鉴的跨存档共享**：结局图鉴是全局共享（所有存档都能看到已解锁的结局），还是每个存档独立？前者更有收集驱动力。
   - **倾向**：全局共享，存在 localStorage 的独立 key 中。

4. **赌坊赢次数的统计口径**：是"所有赌坊玩法（骰子+赌石+竞猜）的赢次数总和"，还是仅"骰子赌大小赢的次数"？当前设计为前者（所有赢的次数）。
   - **倾向**：所有赌坊玩法的赢次数总和。

5. **供奉最高档检测方式**：是检测 `gongfeng.totalOffered >= 1亿`（累计供奉达到1亿），还是检测"是否执行过一次巨奉"（单次1亿）？后者更严格。
   - **倾向**：检测是否执行过一次巨奉，新增 `meta.gongfengMaxTierDone` 标记。

6. **游戏天数的计算方式**：是从首次游玩开始的真实天数（24小时=1天），还是游戏内的"回合天数"（每次Prestige重置）？当前设计为前者（真实天数，Prestige不清零）。
   - **倾向**：真实天数，从 `meta.gameStartTime` 计算，Prestige不清零。

---

## 15. 行动清单

| # | 行动项 | 负责人 | 优先级 | 预计完成 |
|---|--------|--------|--------|---------|
| 1 | 评审本PRD，确认待确认问题6项 | 方向明(主理人) | P0 | 评审会当天 |
| 2 | 根据评审结果更新PRD终版 | 析客(需求分析师) | P0 | 评审后1天 |
| 3 | Phase 1开发：结局引擎+死局+长生药 | 开发 | P0 | 第1-2周 |
| 4 | Phase 2开发：归隐+展示+延寿丹+物品上架 | 开发 | P0 | 第3-4周 |
| 5 | Phase 3开发：图鉴+纪念存档+打磨 | 开发 | P1 | 第5周 |
| 6 | 全量QA测试：11结局×条件组合 | QA | P0 | 第5-6周 |
| 7 | 平衡性调优：参数微调 | 方向明+数析 | P1 | 第6周 |
| 8 | v3.0版本发布 | 全员 | P0 | 第6周末 |

---

## 16. 数据来源 & 成员产出索引

| 产出物 | 作者 | 路径 | 状态 |
|--------|------|------|------|
| v3.0竞品调研报告 | 竞析(竞品分析师) | `F:/AITool-finish/game/deliverables/product-strategy/_interim_v3_competitive-analyst-report.md` | ✅ 完成 |
| v3.0经济影响评估报告 | 数析(数据分析师) | `F:/AITool-finish/game/deliverables/product-strategy/_interim_v3_data-analyst-report.md` | ✅ 完成 |
| v3.0结局系统PRD（本文档） | 析客(需求分析师) | `F:/AITool-finish/game/deliverables/product-strategy/prd-ending-system-v3-2026-07-22.md` | ✅ 完成 |
| v2.4拍卖场PRD | 析客(需求分析师) | `F:/AITool-finish/game/deliverables/product-strategy/prd-auction-system-2026-07-22.md` | ✅ 完成 |
| 游戏核心逻辑源码 | — | `F:/AITool-finish/game/src/js/game.js` | v2.4 |
| 游戏数据定义源码 | — | `F:/AITool-finish/game/src/js/data.js` | v2.4 |
| 游戏UI渲染源码 | — | `F:/AITool-finish/game/src/js/ui.js` | v2.4 |
| 游戏样式源码 | — | `F:/AITool-finish/game/src/css/style.css` | v2.4 |

---

**文档结束。以上为《掌柜偷闲录》v3.0「终局篇」完整产品需求文档，所有参数以主理人裁决表为最终值。**
