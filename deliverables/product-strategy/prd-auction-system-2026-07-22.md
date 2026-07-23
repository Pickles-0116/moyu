# 掌柜偷闲录 — 拍卖场系统（聚宝阁）PRD v1.0

> **文档编号**: PRD-AUCTION-2026-07-22  
> **版本**: v1.0  
> **撰写人**: 析客（Specky / 需求分析师）  
> **审核人**: 方向明（产品总监 / 主理人）  
> **日期**: 2026-07-22  
> **状态**: Draft — 待主理人审核  
> **依赖文档**: prd-moyu-game-v2-2026-07-22.md (v2 PRD)、v2.3-system-design-2026-07-22.md (v2.3 系统设计)  
> **上游输入**: _interim_auction_competitive-analyst-report.md (竞析报告)、_interim_auction_data-analyst-report.md (数析报告)、src/js/data.js (游戏源码数据层)  
> **游戏版本基线**: v2.3.0 → 目标版本 v2.4.0

---

## 目录

1. [TL;DR](#1-tldr)
2. [核心结论卡片](#2-核心结论卡片)
3. [产品目标](#3-产品目标)
4. [用户故事](#4-用户故事)
5. [竞品参考](#5-竞品参考)
6. [数据依据](#6-数据依据)
7. [系统设计详述](#7-系统设计详述)
8. [需求池](#8-需求池)
9. [数据结构设计](#9-数据结构设计)
10. [关键逻辑代码片段](#10-关键逻辑代码片段)
11. [经济平衡影响评估](#11-经济平衡影响评估)
12. [Non-goals](#12-nongoals)
13. [时间线](#13-时间线)
14. [待确认问题](#14-待确认问题)
15. [行动清单](#15-行动清单)
16. [数据来源索引](#16-数据来源索引)

---

## 1. TL;DR

本 PRD 定义《掌柜偷闲录》**拍卖场系统（聚宝阁）** 的完整功能规格。聚宝阁是一个以**一口价购买**为核心模式的独立地点系统，定位为**中后期银两大额消耗出口**，填补当前游戏 L3.5 阶段"大额炫耀性消耗"的设计空白。

### 核心机制一句话描述

> 玩家声望达到 300 后解锁聚宝阁，每行走一定步数（12~24 步，随声望递减）自动刷新 4 件拍品，拍品池覆盖收藏品（25%）、保护道具（10%）、黑市令（15%）、稀有道具（30%）、消耗道具包（20%）五大类，全部以一口价购买，稀有道具在原价基础上溢价 50%。玩家亦可通过消耗 10 万银两强制刷新（日限 2 次），或以 8000 银两/个的价格从专属渠道购买黑市令（100% 出现，限购 3 个/次）。

### 解决的核心问题

| 问题 | 现状 | 聚宝阁解决方案 |
|------|------|----------------|
| 中期银两堆积 | 周转率 0.73，低于目标 0.80 | 新增大额消耗出口，预计周转率提升至 0.80+ |
| 后期银两无处花 | 周转率低至 0.12 | 收藏品（最高 3000 万）提供天花板级消耗 |
| 缺乏炫耀性目标 | 无长期收集体系 | 3 件收藏品构成可视化财富象征 |
| 风险无缓冲手段 | 查封/惩罚性倒退直接生效 | 2 种保护道具提供风险对冲选项 |
| 黑市令获取渠道单一 | 仅靠事件随机获取 | 聚宝阁提供稳定获取渠道（8000/个） |

### 关键数据

- **新增需求数**: 15 项（P0: 7 项，P1: 5 项，P2: 3 项）
- **预估工作量**: 23 人日
- **新增道具**: 5 种（3 收藏品 + 2 保护道具）
- **新增地点**: 1 个（聚宝阁）
- **银两消耗天花板**: 33,500,000（收藏品总价）+ 持续性消耗（刷新/稀有道具/消耗包）

---

## 2. 核心结论卡片

```
┌─────────────────────────────────────────────────────────┐
│              聚宝阁系统 — 核心参数卡片                    │
├──────────────────┬──────────────────────────────────────┤
│ 模式             │ 一口价购买（无竞价）                    │
│ 解锁条件         │ 声望 ≥ 300                            │
│ 拍品数量/次      │ 4 件                                  │
│ 刷新驱动         │ 步数（24/20/16/12 步，声望递减四档）    │
│ 强制刷新         │ 10 万银两/次，日限 2 次                 │
├──────────────────┼──────────────────────────────────────┤
│ 收藏品（3 件）   │ 千年翡翠 50万 / 万年人参 300万 /        │
│                  │ 百万年冰红茶 3000万                    │
│ 保护道具（2 种） │ 御前圣令 15万(max3) / 免死金牌 50万(max1)│
│ 黑市令渠道       │ 8000银两/个，100%出现，限购3个/次       │
│ 稀有道具溢价     │ +50%（原价 × 1.5）                     │
├──────────────────┼──────────────────────────────────────┤
│ 拍品池概率       │ 收藏品25% 保护10% 黑市令15%            │
│                  │ 稀有道具30% 消耗包20%                  │
├──────────────────┼──────────────────────────────────────┤
│ Prestige 联动    │ 收藏品清零，保护道具保留               │
│ v2.3 风险联动    │ 御前圣令→查封免疫 / 免死金牌→倒退免疫  │
├──────────────────┼──────────────────────────────────────┤
│ 经济目标         │ 中期周转率 0.73→0.80+                  │
│                  │ 后期周转率 0.12→0.24+                  │
│                  │ 目标周转率区间 0.80~0.90               │
├──────────────────┼──────────────────────────────────────┤
│ 工作量           │ 23 人日 / 15 项需求                    │
│ 目标版本         │ v2.4.0                                │
└──────────────────┴──────────────────────────────────────┘
```

---

## 3. 产品目标

### 3.1 问题陈述

**解决什么问题？**

《掌柜偷闲录》当前版本（v2.3.0）存在显著的银两消耗缺口。根据数析报告，中期玩家银两周转率仅为 0.73（低于 0.80~0.90 的设计目标区间），后期玩家周转率更降至 0.12，意味着玩家积累的银两绝大部分既不流通也不消耗，导致：

1. **经济循环停滞** — 银两失去"货币"属性，退化为无意义数字
2. **目标感丧失** — 后期玩家缺乏大额消费目标，游戏动力衰减
3. **风险机制过硬** — v2.3 新增的查封和惩罚性倒退机制缺少缓冲手段，玩家挫败感过强

**谁的问题？**

- **中后期玩家**（声望 300+，已通关主要内容）：银两无处花、缺乏长期目标
- **风险偏好型玩家**：频繁使用黑市/盐场但缺少风险对冲工具
- **收集型玩家**：渴望可视化的成就展示和财富象征

**有多大？**

- 影响人群：声望 300+ 的活跃玩家，约占日活的 35%~45%（数析报告估算）
- 影响深度：周转率偏差 0.07~0.68，直接影响留存和付费意愿
- 紧迫性：v2.3 上线后风险机制加码，缓冲手段缺失已成为即时痛点

### 3.2 产品目标

| 编号 | 目标 | 衡量指标 | 目标值 | 衡量方式 |
|------|------|----------|--------|----------|
| PG-01 | 提升中期银两周转率 | 周转率（消耗/获取） | ≥ 0.80 | 声望 300~800 区间统计 |
| PG-02 | 提升后期银两周转率 | 周转率 | ≥ 0.24 | 声望 800+ 区间统计 |
| PG-03 | 提供长期收集目标 | 收藏品收集率 | ≥ 15% 玩家拥有 ≥1 件 | Prestige 时统计 |
| PG-04 | 提供风险缓冲手段 | 保护道具使用率 | ≥ 20% 黑市/盐场玩家使用 | 购买+使用日志 |
| PG-05 | 拓宽黑市令获取渠道 | 黑市令聚宝阁购买占比 | ≥ 30% | 渠道来源统计 |
| PG-06 | 提升中后期日活留存 | D7 留存率 | +5pp | A/B 对照 |

### 3.3 成功指标（KPI）

**一级指标（Launch + 2 周评估）：**

| KPI | 基线值 | 目标值 | 数据来源 |
|-----|--------|--------|----------|
| 中期周转率 | 0.73 | ≥ 0.80 | 埋点统计 |
| 后期周转率 | 0.12 | ≥ 0.24 | 埋点统计 |
| 聚宝阁日活渗透率 | N/A | ≥ 60%（解锁人群中） | 埋点统计 |
| 平均日消耗银两/人 | — | ≥ 50,000 | 埋点统计 |

**二级指标（Launch + 4 周评估）：**

| KPI | 目标值 | 数据来源 |
|-----|--------|----------|
| 收藏品收集率 | ≥ 15% 拥有 ≥1 件 | Prestige 统计 |
| 保护道具使用率 | ≥ 20% | 购买+使用日志 |
| 强制刷新使用率 | 30%~50% 玩家曾使用 | 埋点统计 |
| 黑市令聚宝阁渠道占比 | ≥ 30% | 渠道来源统计 |
| D7 留存提升 | +5pp | A/B 对照 |

**护栏指标（不应恶化）：**

| 指标 | 阈值 | 说明 |
|------|------|------|
| 早期玩家（声望 < 300）流失率 | 不上升 | 确保解锁门槛不造成前段枯燥 |
| 黑市/盐场使用频率 | 不下降超过 10% | 保护道具不应替代风险规避 |
| 银两获取速率 | 不变 | 聚宝阁纯消耗不改变产出端 |

---

## 4. 用户故事

### 4.1 核心用户画像

**P1：中期积累型玩家 — "老李"**
- 声望 450，银两 80 万，已经营 3 家店铺
- 痛点：银两每天涨几万但花不出去，店铺升级已经到顶，不知道钱用来干嘛
- 期望：有个地方能花钱买好东西，让钱有意义

**P2：后期收集型玩家 — "张老爷"**
- 声望 1200，银两 500 万，已经 Prestige 2 次
- 痛点：游戏内容几乎全通，缺乏长期目标
- 期望：有值得攒钱买的稀有收藏品，可以向朋友炫耀

**P3：风险偏好型玩家 — "冒险王"**
- 声望 600，频繁使用黑市和盐场
- 痛点：v2.3 查封机制太狠，一次盐场查封损失惨重，想买保险
- 期望：有道具能在关键时刻保护自己

### 4.2 用户故事

**US-01：解锁聚宝阁**
> 作为一名中期玩家，当我声望达到 300 时，我希望能够进入聚宝阁，这样我就有了一个新的消费场所来花掉积累的银两。

**US-02：浏览拍品**
> 作为一名聚宝阁访客，我希望每次进入时能看到 4 件拍品，每件标明名称、描述和一口价，这样我可以快速决定是否购买。

**US-03：步数自动刷新**
> 作为一名活跃玩家，我希望走够一定步数后拍品自动刷新，这样我不需要额外操作就能看到新的拍品。

**US-04：购买收藏品**
> 作为一名后期玩家，我希望能在聚宝阁看到并购买千年翡翠、万年人参等收藏品，这样我有一个长期攒钱的目标和财富象征。

**US-05：购买保护道具**
> 作为一名黑市/盐场常客，我希望能买到御前圣令来免疫查封，这样我可以在高风险活动中获得一层保险。

**US-06：购买免死金牌**
> 作为一名有时会体力耗尽的玩家，我希望能买到免死金牌来免除惩罚性倒退，这样我不用承受 -50% 银两和全店 -5 级的惨重损失。

**US-07：购买黑市令**
> 作为一名需要频繁进出黑市的玩家，我希望能在聚宝阁以固定价格（8000 银两）买到黑市令，这样我不完全依赖随机事件来获取。

**US-08：强制刷新拍品**
> 作为一名等不及自动刷新的玩家，我愿意花 10 万银两强制刷新拍品，这样我可以更积极地寻找想要的物品。

**US-09：稀有道具溢价购买**
> 作为一名追求效率的玩家，我接受稀有道具在拍卖场有 50% 溢价，因为这提供了在正常渠道买不到的稀有道具的获取机会。

**US-10：Prestige 后重新收集**
> 作为一名 Prestige 玩家，我知道收藏品会在 Prestige 时清零，这给了我每个轮回重新收集的动力。

**US-11：收藏品展示**
> 作为一名收集型玩家，我希望已收集的收藏品有某种展示方式，这样我的收集成果有可视化反馈。

**US-12：保护道具堆叠**
> 作为一名风险管理玩家，我希望能囤积最多 3 个御前圣令和 1 个免死金牌，这样我可以在多次高风险活动中获得保护。

---

## 5. 竞品参考

> 以下竞品分析提炼自竞析报告（_interim_auction_competitive-analyst-report.md），调研覆盖 15+ 款游戏。

### 5.1 动物森友会 — 博物馆收集系统

| 维度 | 竞品做法 | 聚宝阁借鉴 |
|------|----------|------------|
| 收集机制 | 捐赠标本→博物馆展示，按类别分区 | 收藏品按品阶展示，Prestige 清零形成轮回目标 |
| 驱动力 | 纯收集成就，无实质奖励 | 收藏品本身即高价值银两消耗，兼具炫耀与经济双重功能 |
| 反馈设计 | 展厅逐步丰富，视觉变化明显 | 收藏品展示柜（P2 功能），已收集项高亮 |

**启示**：收集系统的核心驱动力是"可视化进度"和"稀缺性"。我们的收藏品定价 50 万~3000 万跨度极大，天然形成阶梯式目标。

### 5.2 星露谷物语 — 社区中心收集包

| 维度 | 竞品做法 | 聚宝阁借鉴 |
|------|----------|------------|
| 收集机制 | 按房间提交物品包，完成解锁奖励 | 拍品池分类（5 大类），每类有不同获取概率 |
| 稀缺控制 | 部分物品季节限定/概率极低 | 收藏品 25% 出现率，但高价值收藏品权重极低 |
| 阶段感 | 房间逐个完成，进度明确 | 3 件收藏品形成 3 个阶段目标 |

**启示**：分阶段的收集目标比一次性目标更有持续动力。我们的 3 件收藏品（50 万→300 万→3000 万）天然形成三阶段。

### 5.3 Ragnarok Online — 替身护符

| 维度 | 竞品做法 | 聚宝阁借鉴 |
|------|----------|------------|
| 保护机制 | 持有护符死亡时不掉经验，消耗1个 | 免死金牌：体力归零时免除惩罚性倒退，消耗1个 |
| 堆叠限制 | 可堆叠但成本高，玩家选择性携带 | maxStack:1，每 Prestige 周期最多囤 1 个 |
| 经济影响 | 形成稳定消耗品市场 | 50 万定价形成中后期稳定银两消耗 |

**启示**：保护道具的堆叠限制是平衡关键。maxStack:1 确保免死金牌不会成为"无限保险"，而是"关键时刻的最后手段"。

### 5.4 Ultima Online — Item Insurance

| 维度 | 竞品做法 | 聚宝阁借鉴 |
|------|----------|------------|
| 保护机制 | 按件付费保险，死亡不掉装备 | 御前圣令：消耗1个免疫查封，保护黑市/盐场收益 |
| 成本控制 | 每件保险费递增，防止全保险 | maxStack:3，最多连续免疫 3 次查封 |
| 策略选择 | 玩家选择保哪些装备 | 玩家选择在哪些高风险活动中使用 |

**启示**：御前圣令的 maxStack:3 是"有限保险"设计——足以覆盖 2~3 次盐场查封，但不足以无限冒险，保持风险机制的张力。

### 5.5 大商途 — 驯鹰少女 NPC 商店

| 维度 | 竞品做法 | 聚宝阁借鉴 |
|------|----------|------------|
| 商店模式 | NPC 固定商店，限量刷新 | 聚宝阁步数刷新 + 强制刷新双模式 |
| 稀缺道具 | 高价值道具限时限量 | 稀有道具 30% 概率 + 50% 溢价，平衡稀缺与可达 |
| 银两消耗 | 驯鹰少女是后期主要银两出口 | 聚宝阁定位同理：中后期银两消耗主力出口 |

**启示**：同为商业模拟游戏，大商途的 NPC 商店验证了"固定地点+定期刷新+一口价"模式在商业游戏中的可行性。我们在此基础上增加了步数驱动的动态刷新和概率分布，使体验更丰富。

### 5.6 竞品参考总结

| 设计决策 | 竞品依据 | 聚宝阁方案 |
|----------|----------|------------|
| 一口价模式 | 大商途、UO | 不做竞价，降低操作复杂度 |
| 步数驱动刷新 | 星露谷（日期刷新）的变体 | 24/20/16/12 步四档递减 |
| 收藏品分阶 | 动森博物馆、星露谷收集包 | 50万/300万/3000万三阶 |
| 保护道具有限堆叠 | RO 替身护符、UO Insurance | 御前圣令 max3 / 免死金牌 max1 |
| 稀有道具溢价 | 大商途驯鹰少女 | +50% 溢价 |
| Prestige 清零 | Rogue-like 轮回设计 | 收藏品清零，保护道具保留 |

---

## 6. 数据依据

> 以下数据提炼自数析报告（_interim_auction_data-analyst-report.md），共 34 项参数建议。本节仅引用主理人裁决确认的参数及其数据支撑。

### 6.1 银两周转率现状与目标

| 游戏阶段 | 声望区间 | 当前周转率 | 目标周转率 | 差距 | 聚宝阁预期贡献 |
|----------|----------|------------|------------|------|----------------|
| 早期 | 0~300 | 0.85 | 0.80~0.90 | 无差距 | 不解锁（无影响） |
| 中期 | 300~800 | 0.73 | ≥ 0.80 | -0.07 | +0.07~0.10 |
| 后期 | 800~1500 | 0.35 | ≥ 0.35 | 持平 | +0.05~0.08 |
| 末期 | 1500+ | 0.12 | ≥ 0.24 | -0.12 | +0.12~0.15 |

**关键结论**：中期和末期是周转率缺口最大的两个阶段。聚宝阁在声望 300 解锁，恰好覆盖中期起点；收藏品最高 3000 万的定价，直击末期银两堆积痛点。

### 6.2 收藏品定价模型

| 收藏品 | 定价 | 定价依据 | 预计达成时间 |
|--------|------|----------|-------------|
| 千年翡翠 | 500,000 | 中期玩家 3~5 天积蓄 | 声望 300~600 阶段 |
| 万年人参 | 3,000,000 | 后期玩家 2~3 周积蓄 | 声望 600~1000 阶段 |
| 百万年冰红茶 | 30,000,000 | 末期玩家 1~2 月积蓄 | 声望 1500+ 阶段 |

**定价逻辑**：
- 千年翡翠（50 万）：中期日收入约 10~15 万，3~5 天可达成，作为"入门收藏品"降低心理门槛
- 万年人参（300 万）：后期日收入约 20~30 万，2~3 周可达成，作为"进阶收藏品"提供中期目标
- 百万年冰红茶（3000 万）：末期日收入约 50 万（含离线），2 月可达成，作为"终极收藏品"提供天花板目标

> **注意**：以上定价为主理人裁决值。数析报告原始建议为 120 万/600 万/5000 万，主理人调低以降低达成难度、提升收集率。本 PRD 全部使用裁决值。

### 6.3 保护道具定价依据

| 道具 | 定价 | 经济学依据 |
|------|------|------------|
| 御前圣令 | 150,000/个 | 单次黑市收益约 3~5 万，查封概率 5%；期望损失 = 0.05 × 40,000 = 2,000。令牌价格远高于期望损失，但玩家是风险厌恶型，愿付溢价购买"确定性" |
| 免死金牌 | 500,000/个 | 惩罚性倒退损失 = 50% 银两 + 全店 -5 级，估算总损失 100~300 万。令牌价格 50 万，约为损失的 17%~50%，符合保险定价逻辑 |

### 6.4 黑市令定价依据

| 参数 | 值 | 依据 |
|------|-----|------|
| 价格 | 8,000 银两/个 | 黑市单次期望收益约 1.5~3 万，令牌价格占收益的 27%~53%，确保黑市仍有利润但不暴利 |
| 100% 出现 | 每次 refresh 必定有购买渠道 | 解决数析报告指出的"黑市令获取渠道单一"问题 |
| 限购 3 个/次 | 防止囤积 | 3 个足以覆盖 2~3 次黑市使用，不过分囤积 |

### 6.5 拍品池概率分布依据

| 类别 | 概率 | 设计意图 |
|------|------|----------|
| 收藏品 | 25% | 中高频出现，但高价值收藏品权重极低（见下表） |
| 保护道具 | 10% | 低频出现，保持稀缺感，多数通过直接购买 |
| 黑市令 | 15% | 中频出现，辅助获取渠道 |
| 稀有道具 | 30% | 最高频，作为主要"日常消费"拍品 |
| 消耗道具包 | 20% | 中高频，提供基础物资补充 |

**收藏品内部权重**（拍品池中收藏品类别的子分布）：

| 收藏品 | 出现权重 | 实际出现概率（×25%） |
|--------|----------|---------------------|
| 千年翡翠 | 70% | 17.5% |
| 万年人参 | 25% | 6.25% |
| 百万年冰红茶 | 5% | 1.25% |

**每次刷新期望消耗分析**：

| 拍品类别 | 期望数量/次 | 期望单价 | 期望消耗/次 |
|----------|------------|----------|------------|
| 收藏品 | 4 × 25% = 1.0 | 加权平均 260万 | 260万（仅当玩家购买） |
| 保护道具 | 4 × 10% = 0.4 | 加权平均 23.3万 | 9.3万 |
| 黑市令 | 4 × 15% = 0.6 | 0.8万 | 0.48万 |
| 稀有道具 | 4 × 30% = 1.2 | ~7.5万（含溢价） | 9.0万 |
| 消耗道具包 | 4 × 20% = 0.8 | ~3.0万 | 2.4万 |
| **总计（全买）** | **4.0** | — | **~281万** |

> 注：以上为"全买"理论值。实际消耗取决于玩家购买行为，预计平均购买率 30%~50%。

### 6.6 刷新步数四档设计依据

| 声望区间 | 步数阈值 | 日均步数（估） | 日均刷新次数 | 设计意图 |
|----------|----------|---------------|-------------|----------|
| 300~600 | 24 步 | ~60 步 | ~2.5 次 | 中期刚解锁，刷新较慢，制造期待感 |
| 600~1000 | 20 步 | ~70 步 | ~3.5 次 | 中后期，频率提升，消费加速 |
| 1000~1500 | 16 步 | ~80 步 | ~5.0 次 | 后期，高频刷新，匹配高消费需求 |
| 1500+ | 12 步 | ~90 步 | ~7.5 次 | 末期，最高频，确保收藏品出现率 |

**设计逻辑**：声望越高→步数阈值越低→刷新越频繁→消费机会越多。这与后期银两堆积更严重的趋势匹配，形成自然的经济调节。

---

## 7. 系统设计详述

### 7.1 聚宝阁地点系统（解锁与入口）

#### 设计目标

为拍卖场提供一个独立的地点入口，与现有 5 个地点（集市/黑市/盐场/府邸/码头）并列，成为第 6 个地点。解锁条件为声望 ≥ 300，确保玩家在具备一定经济基础后才能进入。

#### 机制详述

1. **解锁触发**：玩家声望首次达到 300 时，触发解锁事件
2. **解锁通知**：弹出提示"声望达到 300，聚宝阁的大门为你敞开"，地点列表新增"聚宝阁"
3. **地点状态**：解锁后永久开放（Prestige 不锁定），但收藏品清零
4. **入口限制**：无体力消耗进入（聚宝阁是消费场所，不设进入门槛）

#### 参数表

| 参数 | 值 | 说明 |
|------|-----|------|
| 解锁条件 | 声望 ≥ 300 | 首次达到即解锁 |
| 地点 ID | `auction` | 新增至 LOCATIONS |
| 进入消耗 | 无 | 无体力/银两消耗 |
| Prestige 后 | 保持解锁 | 仅收藏品清零 |
| 地点名称 | 聚宝阁 | — |

#### 代码片段

```javascript
// LOCATIONS 新增条目
{
    id: 'auction',
    name: '聚宝阁',
    icon: '🏛️',
    desc: '拍卖珍奇之物，价高者得。不过这里只讲一口价，不兴竞价。',
    unlockCondition: function(state) {
        return state.reputation >= 300;
    },
    unlockText: '声望达到 300，聚宝阁的大门为你敞开！',
    staminaCost: 0,  // 进入不消耗体力
    actions: ['browse', 'forceRefresh', 'buyHeishiToken'],
}
```

#### 数据结构

```javascript
// state 中新增 auction 字段
state.auction = {
    unlocked: false,              // 是否解锁
    stepsSinceLastRefresh: 0,     // 距上次刷新步数
    currentItems: [],             // 当前 4 件拍品
    forceRefreshUsedToday: 0,     // 今日已用强制刷新次数
    lastForceRefreshResetDay: 0,  // 上次重置强制刷新的天数
    heishiTokensBoughtThisRefresh: 0,  // 本轮已购黑市令数量
    collections: {                // 收藏品收集状态
        collectible_jade: false,
        collectible_ginseng: false,
        collectible_iced_tea: false,
    },
    totalPurchased: 0,            // 累计购买次数
    totalSpent: 0,                // 累计消费银两
}
```

#### 验收标准

```
Given 玩家声望为 299
When 玩家查看地点列表
Then 聚宝阁不显示在地点列表中

Given 玩家声望首次达到 300
When 声望更新逻辑执行
Then 聚宝阁解锁，state.auction.unlocked = true
And 弹出解锁提示"声望达到 300，聚宝阁的大门为你敞开！"
And 地点列表新增"聚宝阁"条目

Given 玩家已解锁聚宝阁
When 玩家进行 Prestige 操作
Then 聚宝阁保持解锁状态（state.auction.unlocked = true）
But 收藏品状态清零（state.auction.collections 全部重置为 false）

Given 玩家已解锁聚宝阁
When 玩家点击进入聚宝阁
Then 不消耗体力
And 显示当前 4 件拍品（或首次进入触发刷新）
```

---

### 7.2 拍品刷新机制（步数驱动）

#### 设计目标

通过步数驱动实现拍品的自动刷新，使玩家在正常游戏过程中（行走、经营）自然触发刷新，无需额外操作。步数阈值随声望递减，使后期玩家获得更高刷新频率，匹配其更高的消费需求。

#### 机制详述

1. **步数计数**：玩家每行走 1 步，`state.auction.stepsSinceLastRefresh` +1
2. **阈值判定**：当步数累计达到当前声望档位的阈值时，自动触发刷新
3. **刷新行为**：生成 4 件新拍品，替换 `state.auction.currentItems`，步数计数归零
4. **声望档位**：四档递减，声望越高阈值越低
5. **黑市令购买计数重置**：每次刷新时 `heishiTokensBoughtThisRefresh` 归零
6. **首次进入**：玩家首次进入聚宝阁时，若 `currentItems` 为空，立即触发一次刷新

#### 参数表

| 声望区间 | 步数阈值 | 说明 |
|----------|----------|------|
| 300 ≤ rep < 600 | 24 步 | 第一档（刚解锁） |
| 600 ≤ rep < 1000 | 20 步 | 第二档 |
| 1000 ≤ rep < 1500 | 16 步 | 第三档 |
| rep ≥ 1500 | 12 步 | 第四档（最高频） |

#### 代码片段

```javascript
/**
 * 获取当前声望对应的刷新步数阈值
 * @param {number} reputation - 当前声望
 * @returns {number} 步数阈值
 */
function getAuctionRefreshSteps(reputation) {
    if (reputation >= 1500) return 12;
    if (reputation >= 1000) return 16;
    if (reputation >= 600) return 20;
    return 24;  // 300 <= reputation < 600
}

/**
 * 步数更新时检查是否需要刷新拍品
 * 在主游戏循环的步数更新逻辑中调用
 */
function checkAuctionRefresh(state) {
    if (!state.auction || !state.auction.unlocked) return;
    
    var threshold = getAuctionRefreshSteps(state.reputation);
    state.auction.stepsSinceLastRefresh++;
    
    if (state.auction.stepsSinceLastRefresh >= threshold) {
        refreshAuctionItems(state);
    }
}
```

#### 验收标准

```
Given 玩家声望 400，聚宝阁已解锁，距上次刷新 23 步
When 玩家行走 1 步（步数累计达 24）
Then 自动触发拍品刷新
And state.auction.currentItems 更新为 4 件新拍品
And state.auction.stepsSinceLastRefresh 归零
And state.auction.heishiTokensBoughtThisRefresh 归零

Given 玩家声望 700，距上次刷新 19 步
When 玩家行走 1 步（步数累计达 20）
Then 自动触发拍品刷新（第二档阈值）

Given 玩家声望从 599 提升至 600（跨档）
When 下一次刷新触发
Then 使用新的步数阈值 20（而非 24）

Given 玩家首次进入聚宝阁，currentItems 为空
When 进入聚宝阁界面
Then 立即触发一次刷新，生成 4 件拍品
```

---

### 7.3 拍品池与概率分布

#### 设计目标

定义 5 大类拍品的生成概率，确保每次刷新的 4 件拍品具有合理的多样性和稀缺性平衡。高价值品类（收藏品）出现频率适中但内部权重分化，日常品类（稀有道具、消耗包）频率较高以维持基础消耗。

#### 机制详述

1. **拍品生成**：每次刷新生成 4 件拍品，每件独立按概率分布抽取类别
2. **类别抽取**：使用加权随机，5 类概率合计 100%
3. **类内抽取**：确定类别后，在该类别的物品池中按内部权重抽取具体物品
4. **去重处理**：同一轮刷新中，收藏品不重复出现（已出现的收藏品不再抽取）
5. **黑市令保底**：除概率分布外，黑市令有独立的 100% 出现购买渠道（详见 7.7 节）

#### 参数表 — 类别概率

| 类别 | 概率 | 物品池 | 说明 |
|------|------|--------|------|
| 收藏品 | 25% | 3 件 | 内部权重 70%/25%/5% |
| 保护道具 | 10% | 2 件 | 内部权重 75%/25%（御前圣令/免死金牌） |
| 黑市令 | 15% | 1 件 | 固定价格 8000 |
| 稀有道具 | 30% | 稀有道具池 | 溢价 50% |
| 消耗道具包 | 20% | 消耗包池 | 标准价格 |

#### 参数表 — 收藏品内部权重

| 收藏品 | 内部权重 | 实际出现概率 | 一口价 |
|--------|----------|-------------|--------|
| 千年翡翠 | 70% | 25% × 70% = 17.5% | 500,000 |
| 万年人参 | 25% | 25% × 25% = 6.25% | 3,000,000 |
| 百万年冰红茶 | 5% | 25% × 5% = 1.25% | 30,000,000 |

#### 参数表 — 保护道具内部权重

| 道具 | 内部权重 | 实际出现概率 | 一口价 |
|------|----------|-------------|--------|
| 御前圣令 | 75% | 10% × 75% = 7.5% | 150,000 |
| 免死金牌 | 25% | 10% × 25% = 2.5% | 500,000 |

#### 代码片段

```javascript
var AUCTION_POOL = {
    collectible: {
        probability: 0.25,
        items: [
            { itemId: 'collectible_jade',       weight: 70, price: 500000 },
            { itemId: 'collectible_ginseng',     weight: 25, price: 3000000 },
            { itemId: 'collectible_iced_tea',    weight: 5,  price: 30000000 },
        ]
    },
    protection: {
        probability: 0.10,
        items: [
            { itemId: 'protection_imperial_decree', weight: 75, price: 150000 },
            { itemId: 'protection_death_medal',     weight: 25, price: 500000 },
        ]
    },
    heishiToken: {
        probability: 0.15,
        items: [
            { itemId: 'heishi_pass', weight: 100, price: 8000 },
        ]
    },
    rareItem: {
        probability: 0.30,
        items: [
            // 稀有道具池 — 详见 7.8 节
            // 价格 = 原价 × 1.5（溢价 50%）
        ]
    },
    consumablePack: {
        probability: 0.20,
        items: [
            // 消耗道具包池 — 详见下方定义
        ]
    }
};

/**
 * 生成 4 件拍卖拍品
 * @param {object} state - 游戏状态
 * @returns {array} 4 件拍品对象数组
 */
function generateAuctionItems(state) {
    var items = [];
    var usedCollectibles = [];  // 收藏品去重
    
    for (var i = 0; i < 4; i++) {
        var category = rollCategory();
        var item = rollItemInCategory(category, usedCollectibles, state);
        items.push(item);
    }
    
    return items;
}

function rollCategory() {
    var rand = Math.random();
    var cumulative = 0;
    var categories = [
        { name: 'collectible',     prob: 0.25 },
        { name: 'protection',      prob: 0.10 },
        { name: 'heishiToken',     prob: 0.15 },
        { name: 'rareItem',        prob: 0.30 },
        { name: 'consumablePack',  prob: 0.20 },
    ];
    
    for (var i = 0; i < categories.length; i++) {
        cumulative += categories[i].prob;
        if (rand < cumulative) return categories[i].name;
    }
    return 'consumablePack';  // fallback
}
```

#### 验收标准

```
Given 聚宝阁触发刷新
When generateAuctionItems() 执行
Then 返回恰好 4 件拍品
And 每件拍品属于 5 大类别之一
And 收藏品不重复（同一轮中千年翡翠不出现两次）

Given 1000 次刷新采样
When 统计各类别出现频率
Then 收藏品频率 ≈ 25%（±3%）
And 保护道具频率 ≈ 10%（±2%）
And 黑市令频率 ≈ 15%（±2%）
And 稀有道具频率 ≈ 30%（±3%）
And 消耗道具包频率 ≈ 20%（±2%）

Given 1000 次收藏品类拍品采样
When 统计各收藏品出现频率
Then 千年翡翠频率 ≈ 70%（±5%）
And 万年人参频率 ≈ 25%（±3%）
And 百万年冰红茶频率 ≈ 5%（±2%）
```

---

### 7.4 一口价购买系统

#### 设计目标

提供简洁明确的购买体验：玩家看到拍品和价格后，决定是否购买。无竞价、无倒计时、无NPC竞争，降低操作复杂度，使聚宝阁成为"轻松消费"而非"紧张博弈"的场所。

#### 机制详述

1. **购买触发**：玩家在聚宝阁界面点击拍品上的"购买"按钮
2. **银两校验**：检查当前银两是否 ≥ 拍品价格
3. **购买执行**：扣除银两，将道具加入背包，该拍品从列表中移除（标记为已售）
4. **购买后状态**：已售拍品保留在列表中但显示"已售出"，不可再次购买
5. **收藏品特殊处理**：购买收藏品后，`state.auction.collections` 对应项设为 true
6. **保护道具特殊处理**：购买后加入背包，受 maxStack 限制
7. **黑市令特殊处理**：通过专属渠道购买（详见 7.7 节），不从 4 件拍品中购买

#### 参数表

| 参数 | 值 | 说明 |
|------|-----|------|
| 购买模式 | 一口价 | 无竞价 |
| 银两不足 | 阻止购买 | 提示"银两不足" |
| 已售拍品 | 标记已售，不可再购 | 保留显示至下次刷新 |
| 购买上限 | 无（每件仅可买1次） | 每轮4件各买1次 |
| 背包满 | 阻止购买 | 提示"背包已满" |

#### 代码片段

```javascript
/**
 * 购买拍卖拍品
 * @param {object} state - 游戏状态
 * @param {number} index - 拍品在 currentItems 中的索引
 * @returns {object} { success: boolean, message: string }
 */
function purchaseAuctionItem(state, index) {
    var item = state.auction.currentItems[index];
    
    // 校验：拍品存在且未售出
    if (!item || item.sold) {
        return { success: false, message: '该拍品已售出或不存在' };
    }
    
    // 校验：银两充足
    if (state.silver < item.price) {
        return { success: false, message: '银两不足' };
    }
    
    // 校验：保护道具受 maxStack 限制
    if (item.category === 'protection') {
        var currentStack = state.inventory[item.itemId] || 0;
        var maxStack = AUCTION_ITEMS[item.itemId].maxStack;
        if (currentStack >= maxStack) {
            return { success: false, message: '该保护道具已达持有上限' };
        }
    }
    
    // 执行购买
    state.silver -= item.price;
    item.sold = true;
    
    // 加入背包或记录收藏
    if (item.category === 'collectible') {
        state.auction.collections[item.itemId] = true;
    } else {
        state.inventory[item.itemId] = (state.inventory[item.itemId] || 0) + 1;
    }
    
    // 统计
    state.auction.totalPurchased++;
    state.auction.totalSpent += item.price;
    
    return { success: true, message: '购买成功！获得 ' + item.name };
}
```

#### 验收标准

```
Given 玩家银两 60 万，拍品中有千年翡翠（50 万）
When 玩家点击购买千年翡翠
Then 银两扣除 50 万（剩余 10 万）
And state.auction.collections.collectible_jade = true
And 该拍品标记为已售出
And totalSpent 增加 500000

Given 玩家银两 40 万，拍品中有千年翡翠（50 万）
When 玩家点击购买千年翡翠
Then 购买失败，提示"银两不足"
And 银两不变，拍品状态不变

Given 玩家已持有 3 个御前圣令（maxStack=3）
When 玩家尝试购买第 4 个御前圣令
Then 购买失败，提示"该保护道具已达持有上限"

Given 拍品已标记为已售出
When 玩家点击该拍品
Then 无购买按钮或提示"已售出"
```

---

### 7.5 收藏品体系

#### 设计目标

建立 3 件阶梯式收藏品，作为中后期玩家的长期攒钱目标和财富象征。收藏品不可使用、不可变卖，纯粹作为"银两→成就"的转化载体。Prestige 时清零，为每个轮回提供重新收集的动力。

#### 机制详述

1. **收藏品属性**：不可使用、不可变卖、不可交易，购买后永久记录（直至 Prestige）
2. **收集状态**：`state.auction.collections` 记录每件收藏品的拥有状态
3. **Prestige 清零**：Prestige 时所有收藏品收集状态重置为 false
4. **展示反馈**：聚宝阁界面有收藏品展示区，已收集的高亮显示（P2 功能）
5. **重复处理**：已拥有的收藏品仍可能出现在拍品池中，但购买时提示"已拥有"（可买但不增加收集进度）

#### 参数表

| 收藏品 | ID | 价格 | 稀有度 | 出现概率 | 描述 |
|--------|-----|------|--------|----------|------|
| 千年翡翠 | collectible_jade | 500,000 | Epic | 17.5% | 历经千年沉淀的翡翠原石，通体碧绿，价值连城 |
| 万年人参 | collectible_ginseng | 3,000,000 | Legendary | 6.25% | 深山老林中采得的万年野山参，形如人形，药香扑鼻 |
| 百万年冰红茶 | collectible_iced_tea | 30,000,000 | Mythic | 1.25% | 传说中的至尊饮品，据说饮一口可通天地…但你舍不得 |

#### 代码片段

```javascript
// 收藏品定义（新增至 ITEMS）
var COLLECTIBLE_ITEMS = {
    collectible_jade: {
        id: 'collectible_jade',
        name: '千年翡翠',
        price: 500000,
        type: 'collectible',
        rarity: 'epic',
        usable: false,
        sellable: false,
        desc: '历经千年沉淀的翡翠原石，通体碧绿，价值连城。聚宝阁收藏品之一。',
    },
    collectible_ginseng: {
        id: 'collectible_ginseng',
        name: '万年人参',
        price: 3000000,
        type: 'collectible',
        rarity: 'legendary',
        usable: false,
        sellable: false,
        desc: '深山老林中采得的万年野山参，形如人形，药香扑鼻。聚宝阁收藏品之二。',
    },
    collectible_iced_tea: {
        id: 'collectible_iced_tea',
        name: '百万年冰红茶',
        price: 30000000,
        type: 'collectible',
        rarity: 'mythic',
        usable: false,
        sellable: false,
        desc: '传说中的至尊饮品，据说饮一口可通天地……但你舍不得。聚宝阁终极收藏品。',
    },
};

/**
 * Prestige 时重置收藏品
 */
function resetCollectionsOnPrestige(state) {
    if (state.auction && state.auction.collections) {
        state.auction.collections = {
            collectible_jade: false,
            collectible_ginseng: false,
            collectible_iced_tea: false,
        };
    }
}
```

#### 验收标准

```
Given 玩家未拥有千年翡翠
When 玩家购买千年翡翠
Then state.auction.collections.collectible_jade = true
And 银两扣除 500,000
And 千年翡翠不加入背包（不可使用/变卖）

Given 玩家已拥有千年翡翠
When 拍品池中再次出现千年翡翠
Then 玩家仍可购买，但提示"已拥有此收藏品"
And collections 状态不变（仍为 true）

Given 玩家拥有全部 3 件收藏品
When 玩家执行 Prestige 操作
Then state.auction.collections 全部重置为 false
And 聚宝阁保持解锁
And 保护道具不受影响（不清零）
```

---

### 7.6 保护道具系统

#### 设计目标

提供 2 种保护道具，分别对冲 v2.3 的两大风险机制：查封（御前圣令）和惩罚性倒退（免死金牌）。保护道具是"有限保险"——有堆叠上限和价格成本，不会完全消除风险，而是提供策略性的风险缓冲。

#### 7.6.1 御前圣令（查封免疫）

##### 机制详述

1. **功能**：消耗 1 个御前圣令，免疫一次查封事件（黑市 5% 查封 / 盐场 100% 风险查封）
2. **触发时机**：在查封判定通过（即原本会被查封）时，自动检查背包中是否有御前圣令
3. **消耗逻辑**：若有则自动消耗 1 个，查封不生效，显示"御前圣令护体，查封免疫！"
4. **堆叠上限**：maxStack = 3，最多同时持有 3 个
5. **覆盖范围**：同时覆盖黑市查封和盐场查封（统一版本，不分黑市版/盐场版）

> **注意**：数析报告建议分黑市版/盐场版，主理人裁决统一为一个版本，简化设计。

##### 参数表

| 参数 | 值 | 说明 |
|------|-----|------|
| 名称 | 御前圣令 | — |
| 价格 | 150,000 银两/个 | 聚宝阁购买价 |
| maxStack | 3 | 最多持有 3 个 |
| 覆盖范围 | 黑市查封 + 盐场查封 | 统一版本 |
| 触发方式 | 自动触发 | 查封判定通过时自动消耗 |
| 消耗数量 | 1 个/次 | 每次查封消耗 1 个 |

##### 代码片段

```javascript
var PROTECTION_ITEMS = {
    protection_imperial_decree: {
        id: 'protection_imperial_decree',
        name: '御前圣令',
        price: 150000,
        type: 'protection',
        maxStack: 3,
        protectionType: 'confiscation',  // 查封免疫
        usable: false,                   // 被动触发，不可主动使用
        sellable: true,
        sellPrice: 50000,                // 变卖价
        desc: '盖有御玺的圣令，可免疫一次查封（黑市/盐场）。最多持有3个。',
    },
};

/**
 * 查封免疫检查 — 插入黑市/盐场查封逻辑
 * 在查封判定通过后、查封执行前调用
 * @param {object} state - 游戏状态
 * @returns {boolean} true=免疫成功，false=无令牌可用
 */
function checkConfiscationImmunity(state) {
    var count = state.inventory['protection_imperial_decree'] || 0;
    if (count > 0) {
        state.inventory['protection_imperial_decree']--;
        return true;  // 免疫成功
    }
    return false;  // 无令牌，查封照常执行
}
```

##### 验收标准

```
Given 玩家持有 2 个御前圣令，进入黑市
When 黑市查封判定通过（5% 概率触发）
Then 自动消耗 1 个御前圣令（剩余 1 个）
And 查封不生效
And 显示提示"御前圣令护体，查封免疫！"
And 黑市收益正常获得

Given 玩家持有 0 个御前圣令，进入黑市
When 黑市查封判定通过
Then 查封照常执行（无免疫）
And 无额外提示

Given 玩家持有 1 个御前圣令，进入盐场
When 盐场查封判定通过（100% 风险查封）
Then 自动消耗 1 个御前圣令（剩余 0 个）
And 查封不生效，盐场收益正常获得

Given 玩家已持有 3 个御前圣令（maxStack=3）
When 聚宝阁中出现御前圣令
Then 玩家无法购买，提示"该保护道具已达持有上限"

Given 玩家持有 2 个御前圣令
When 连续遭遇 2 次查封
Then 第 1 次查封：消耗 1 个（剩余 1 个），免疫成功
And 第 2 次查封：消耗 1 个（剩余 0 个），免疫成功
And 第 3 次查封（如有）：无令牌，查封照常执行
```

---

#### 7.6.2 免死金牌（惩罚性倒退免疫）

##### 机制详述

1. **功能**：消耗 1 个免死金牌，免除一次惩罚性倒退（体力归零时的 -50% 银两 + 全店 -5 级）
2. **触发时机**：在 checkGameOver 逻辑判定体力归零、即将执行惩罚性倒退时，自动检查背包中是否有免死金牌
3. **消耗逻辑**：若有则自动消耗 1 个，惩罚不生效，显示"免死金牌护体，逢凶化吉！"
4. **堆叠上限**：maxStack = 1，最多同时持有 1 个
5. **特殊效果**：免除惩罚后，体力恢复至 10（避免立即再次触发）

##### 参数表

| 参数 | 值 | 说明 |
|------|-----|------|
| 名称 | 免死金牌 | — |
| 价格 | 500,000 银两/个 | 聚宝阁购买价 |
| maxStack | 1 | 最多持有 1 个 |
| 覆盖范围 | 惩罚性倒退（体力归零） | — |
| 触发方式 | 自动触发 | 体力归零判定时自动消耗 |
| 消耗数量 | 1 个/次 | 每次倒退消耗 1 个 |
| 免除后体力 | 恢复至 10 | 避免立即再次触发 |

##### 代码片段

```javascript
PROTECTION_ITEMS.protection_death_medal = {
    id: 'protection_death_medal',
    name: '免死金牌',
    price: 500000,
    type: 'protection',
    maxStack: 1,
    protectionType: 'punitiveSetback',  // 惩罚性倒退免疫
    usable: false,                      // 被动触发
    sellable: true,
    sellPrice: 200000,
    desc: '御赐免死金牌，可免除一次惩罚性倒退（体力归零时的全部惩罚）。最多持有1个。',
};

/**
 * 惩罚性倒退免疫检查 — 插入 checkGameOver 逻辑
 * 在体力归零判定后、惩罚执行前调用
 * @param {object} state - 游戏状态
 * @returns {boolean} true=免疫成功，false=无金牌可用
 */
function checkPunitiveSetbackImmunity(state) {
    var count = state.inventory['protection_death_medal'] || 0;
    if (count > 0) {
        state.inventory['protection_death_medal']--;
        state.stamina = 10;  // 恢复体力至 10，避免立即再次触发
        return true;
    }
    return false;
}
```

##### 验收标准

```
Given 玩家持有 1 个免死金牌，体力降至 0
When checkGameOver 逻辑执行
Then 自动消耗免死金牌（剩余 0 个）
And 银两不减少（无 -50% 惩罚）
And 店铺等级不降低（无 -5 级惩罚）
And 体力恢复至 10
And 显示提示"免死金牌护体，逢凶化吉！体力恢复至10。"

Given 玩家持有 0 个免死金牌，体力降至 0
When checkGameOver 逻辑执行
Then 惩罚性倒退照常执行
And 银两减少 50%
And 全店降级 5 级

Given 玩家已持有 1 个免死金牌（maxStack=1）
When 聚宝阁中出现免死金牌
Then 玩家无法购买，提示"该保护道具已达持有上限"

Given 玩家持有 1 个免死金牌
When 连续 2 次体力归零
Then 第 1 次：消耗免死金牌，免疫成功，体力恢复至 10
And 第 2 次（如有）：无金牌，惩罚性倒退照常执行
```

---

### 7.7 黑市令拍卖渠道

#### 设计目标

为黑市令提供稳定可靠的获取渠道，解决当前仅靠随机事件获取的不确定性。聚宝阁每次刷新后，黑市令以固定价格 8000 银两/个出售，100% 出现，限购 3 个/次。

#### 机制详述

1. **渠道独立性**：黑市令购买渠道独立于 4 件拍品，不影响拍品池概率分布
2. **100% 出现**：每次刷新后，黑市令购买渠道必定可用
3. **限购机制**：每次刷新后最多购买 3 个，`heishiTokensBoughtThisRefresh` 计数
4. **计数重置**：每次刷新（自动/强制）时，购买计数归零
5. **价格固定**：8000 银两/个，不受动态定价影响
6. **与拍品池的关系**：拍品池中仍有 15% 概率出现黑市令作为拍品（额外获取渠道，不占用专属渠道限购额度）

#### 参数表

| 参数 | 值 | 说明 |
|------|-----|------|
| 价格 | 8,000 银两/个 | 固定价格 |
| 出现率 | 100% | 每次刷新必定可用 |
| 限购 | 3 个/次 | 每轮刷新最多买 3 个 |
| 计数重置 | 每次刷新时 | 自动/强制刷新均重置 |
| 与拍品池关系 | 独立 | 不占用 4 件拍品名额 |

#### 代码片段

```javascript
var AUCTION_HEISHI_TOKEN_CONFIG = {
    price: 8000,
    maxPerRefresh: 3,
    alwaysAvailable: true,
};

/**
 * 购买黑市令（专属渠道）
 * @param {object} state - 游戏状态
 * @param {number} quantity - 购买数量
 * @returns {object} { success: boolean, message: string }
 */
function purchaseHeishiToken(state, quantity) {
    var config = AUCTION_HEISHI_TOKEN_CONFIG;
    var boughtThisRefresh = state.auction.heishiTokensBoughtThisRefresh || 0;
    
    // 校验：限购
    if (boughtThisRefresh + quantity > config.maxPerRefresh) {
        return { 
            success: false, 
            message: '本轮限购' + config.maxPerRefresh + '个，已购' + boughtThisRefresh + '个' 
        };
    }
    
    // 校验：银两充足
    var totalCost = config.price * quantity;
    if (state.silver < totalCost) {
        return { success: false, message: '银两不足' };
    }
    
    // 执行购买
    state.silver -= totalCost;
    state.inventory['heishi_pass'] = (state.inventory['heishi_pass'] || 0) + quantity;
    state.auction.heishiTokensBoughtThisRefresh += quantity;
    state.auction.totalPurchased += quantity;
    state.auction.totalSpent += totalCost;
    
    return { success: true, message: '购买 ' + quantity + ' 个黑市令，花费 ' + totalCost + ' 银两' };
}
```

#### 验收标准

```
Given 聚宝阁刚刷新，黑市令渠道可用
When 玩家购买 2 个黑市令
Then 银两扣除 16,000（8000 × 2）
And 背包新增 2 个黑市令
And heishiTokensBoughtThisRefresh = 2

Given 本轮已购 2 个黑市令（限购 3 个）
When 玩家尝试再买 2 个
Then 购买失败，提示"本轮限购3个，已购2个"

Given 本轮已购 2 个黑市令
When 玩家再买 1 个
Then 购买成功，heishiTokensBoughtThisRefresh = 3

Given 本轮已购 3 个黑市令（已达上限）
When 玩家尝试再买 1 个
Then 购买失败，提示"本轮限购3个，已购3个"

Given 玩家银两 5,000，尝试购买 1 个黑市令（8000）
Then 购买失败，提示"银两不足"

Given 拍品池中也出现了黑市令（15%概率）
When 玩家购买拍品池中的黑市令
Then 购买成功，但不消耗专属渠道的限购额度
And heishiTokensBoughtThisRefresh 不增加
```

---

### 7.8 稀有道具溢价机制

#### 设计目标

将现有游戏中的稀有道具引入拍卖场，以 50% 溢价出售。这为玩家提供了在正常渠道（事件/商店）之外获取稀有道具的额外途径，同时溢价机制确保拍卖场不会取代正常获取渠道的主导地位。

#### 机制详述

1. **稀有道具池**：从现有 ITEMS 中筛选 type 为稀有/高级的道具组成拍卖池
2. **溢价计算**：拍卖价格 = 原价 × 1.5（向上取整到百位）
3. **池内权重**：按道具稀有度分配出现权重（越稀有权重越低）
4. **与正常渠道并行**：拍卖场是额外获取途径，不影响事件/商店的正常掉落

#### 参数表

| 参数 | 值 | 说明 |
|------|-----|------|
| 溢价率 | 50%（×1.5） | 原价基础上加 50% |
| 取整规则 | 向上取整到百位 | 如 12345 → 18600（12345×1.5=18517.5→18600） |
| 池内权重 | 按稀有度递减 | Epic: 10, Legendary: 3, Mythic: 1 |

#### 稀有道具池示例

> 以下为基于现有 ITEMS 的示例列表，具体物品以 data.js 实际定义为准。

| 道具 | 原价 | 拍卖价（×1.5） | 稀有度 | 出现权重 |
|------|------|---------------|--------|----------|
| 精致商途图 | 30,000 | 45,000 | Epic | 10 |
| 御赐声望牌 | 50,000 | 75,000 | Epic | 10 |
| 千金方 | 80,000 | 120,000 | Legendary | 3 |
| 龙精虎猛丹 | 100,000 | 150,000 | Legendary | 3 |
| 天机商鉴 | 200,000 | 300,000 | Mythic | 1 |

#### 代码片段

```javascript
var RARE_ITEM_PREMIUM = 0.50;  // 50% 溢价

/**
 * 计算稀有道具的拍卖价格
 * @param {number} basePrice - 道具原价
 * @returns {number} 拍卖价（向上取整到百位）
 */
function calculateRareItemPrice(basePrice) {
    var auctionPrice = Math.ceil(basePrice * (1 + RARE_ITEM_PREMIUM));
    return Math.ceil(auctionPrice / 100) * 100;  // 向上取整到百位
}

/**
 * 稀有道具池定义
 * 从现有 ITEMS 中筛选，附加出现权重
 */
var RARE_ITEM_POOL = [
    { itemId: 'rare_commerce_map',   basePrice: 30000,  weight: 10 },
    { itemId: 'rare_reputation_tag', basePrice: 50000,  weight: 10 },
    { itemId: 'rare_gold_formula',   basePrice: 80000,  weight: 3 },
    { itemId: 'rare_vitality_pill',  basePrice: 100000, weight: 3 },
    { itemId: 'rare_heavenly_guide', basePrice: 200000, weight: 1 },
];

/**
 * 从稀有道具池中随机抽取一件
 * @returns {object} 拍品对象
 */
function rollRareItem() {
    var totalWeight = 0;
    for (var i = 0; i < RARE_ITEM_POOL.length; i++) {
        totalWeight += RARE_ITEM_POOL[i].weight;
    }
    
    var rand = Math.random() * totalWeight;
    var cumulative = 0;
    
    for (var i = 0; i < RARE_ITEM_POOL.length; i++) {
        cumulative += RARE_ITEM_POOL[i].weight;
        if (rand < cumulative) {
            var entry = RARE_ITEM_POOL[i];
            var itemDef = ITEMS[entry.itemId];
            return {
                category: 'rareItem',
                itemId: entry.itemId,
                name: itemDef.name,
                desc: itemDef.desc,
                price: calculateRareItemPrice(entry.basePrice),
                originalPrice: entry.basePrice,
                sold: false,
            };
        }
    }
    
    // fallback
    var fallback = RARE_ITEM_POOL[0];
    var fallbackDef = ITEMS[fallback.itemId];
    return {
        category: 'rareItem',
        itemId: fallback.itemId,
        name: fallbackDef.name,
        desc: fallbackDef.desc,
        price: calculateRareItemPrice(fallback.basePrice),
        originalPrice: fallback.basePrice,
        sold: false,
    };
}
```

#### 验收标准

```
Given 稀有道具原价 50,000
When 计算拍卖价
Then 拍卖价 = ceil(50000 × 1.5 / 100) × 100 = 75,000

Given 稀有道具原价 80,000
When 计算拍卖价
Then 拍卖价 = ceil(80000 × 1.5 / 100) × 100 = 120,000

Given 稀有道具原价 33,333
When 计算拍卖价
Then 拍卖价 = ceil(33333 × 1.5 / 100) × 100 = ceil(49999.5 / 100) × 100 = 50,000

Given 拍品池中稀有道具类别被抽中（30% 概率）
When 生成稀有道具拍品
Then 返回一件稀有道具
And 价格 = 原价 × 1.5（向上取整到百位）
And 拍品显示"拍卖价"与"原价"对比（UI 可选）

Given 玩家购买一件拍卖价为 75,000 的稀有道具
When 购买执行
Then 银两扣除 75,000
And 道具加入背包
```

---

### 7.9 强制刷新机制

#### 设计目标

为不愿等待步数刷新的玩家提供付费强制刷新选项，消耗 10 万银两立即刷新拍品。通过日限 2 次防止滥用，同时为银两消耗提供额外出口。

#### 机制详述

1. **触发方式**：玩家在聚宝阁界面点击"强制刷新"按钮
2. **银两校验**：检查银两是否 ≥ 100,000
3. **日限校验**：检查今日已用强制刷新次数 < 2
4. **执行刷新**：扣除 10 万银两，生成 4 件新拍品，步数计数归零
5. **日限重置**：每日（游戏内天数变化）重置 `forceRefreshUsedToday` 为 0
6. **与自动刷新的关系**：强制刷新后，步数计数归零，重新开始累计

#### 参数表

| 参数 | 值 | 说明 |
|------|-----|------|
| 费用 | 100,000 银两/次 | 固定费用 |
| 日限 | 2 次/天 | 游戏内每天 |
| 重置时机 | 游戏内日期变化 | day +1 时重置 |
| 刷新行为 | 与自动刷新一致 | 生成 4 件新拍品 |
| 步数影响 | 归零 | 与自动刷新一致 |

#### 代码片段

```javascript
var AUCTION_FORCE_REFRESH_CONFIG = {
    cost: 100000,
    dailyLimit: 2,
};

/**
 * 强制刷新拍品
 * @param {object} state - 游戏状态
 * @returns {object} { success: boolean, message: string }
 */
function forceRefreshAuction(state) {
    var config = AUCTION_FORCE_REFRESH_CONFIG;
    
    // 检查日限重置
    if (state.auction.lastForceRefreshResetDay !== state.day) {
        state.auction.forceRefreshUsedToday = 0;
        state.auction.lastForceRefreshResetDay = state.day;
    }
    
    // 校验：日限
    if (state.auction.forceRefreshUsedToday >= config.dailyLimit) {
        return { 
            success: false, 
            message: '今日强制刷新已用尽（上限' + config.dailyLimit + '次）' 
        };
    }
    
    // 校验：银两充足
    if (state.silver < config.cost) {
        return { success: false, message: '银两不足，需要' + config.cost + '银两' };
    }
    
    // 执行刷新
    state.silver -= config.cost;
    state.auction.forceRefreshUsedToday++;
    state.auction.totalSpent += config.cost;
    
    refreshAuctionItems(state);
    
    return { success: true, message: '强制刷新成功！获得4件新拍品。' };
}

/**
 * 刷新拍品（自动/强制共用）
 */
function refreshAuctionItems(state) {
    state.auction.currentItems = generateAuctionItems(state);
    state.auction.stepsSinceLastRefresh = 0;
    state.auction.heishiTokensBoughtThisRefresh = 0;
}
```

#### 验收标准

```
Given 玩家银两 20 万，今日已用 0 次强制刷新
When 玩家点击强制刷新
Then 银两扣除 10 万（剩余 10 万）
And 生成 4 件新拍品
And forceRefreshUsedToday = 1
And stepsSinceLastRefresh = 0

Given 玩家今日已用 2 次强制刷新（已达上限）
When 玩家点击强制刷新
Then 刷新失败，提示"今日强制刷新已用尽（上限2次）"

Given 玩家今日已用 1 次强制刷新
When 游戏内日期变化（day +1）
Then forceRefreshUsedToday 重置为 0
And 玩家可再次使用强制刷新

Given 玩家银两 5 万
When 玩家点击强制刷新（需要 10 万）
Then 刷新失败，提示"银两不足"

Given 玩家通过自动刷新步数达到阈值
When 自动刷新触发
Then stepsSinceLastRefresh 归零
And heishiTokensBoughtThisRefresh 归零
And forceRefreshUsedToday 不受影响（不重置）
```

---

### 7.10 Prestige 联动

#### 设计目标

确保聚宝阁系统与现有 Prestige 机制正确联动：聚宝阁保持解锁、收藏品清零、保护道具保留、统计数据保留。

#### 机制详述

1. **解锁状态**：Prestige 后聚宝阁保持解锁（state.auction.unlocked = true）
2. **收藏品清零**：state.auction.collections 全部重置为 false
3. **保护道具**：背包中的保护道具不受 Prestige 影响（与现有道具处理一致）
4. **当前拍品**：Prestige 后 currentItems 清空，下次进入时重新刷新
5. **统计数据**：totalPurchased 和 totalSpent 保留（跨 Prestige 累计）
6. **强制刷新计数**：重置为当日初始状态

#### 代码片段

```javascript
/**
 * Prestige 时处理聚宝阁状态
 * 在现有 Prestige 逻辑中调用
 */
function handleAuctionOnPrestige(state) {
    if (!state.auction) return;
    
    // 保持解锁（state.auction.unlocked = true 不变）
    
    // 收藏品清零
    state.auction.collections = {
        collectible_jade: false,
        collectible_ginseng: false,
        collectible_iced_tea: false,
    };
    
    // 当前拍品清空
    state.auction.currentItems = [];
    state.auction.stepsSinceLastRefresh = 0;
    state.auction.heishiTokensBoughtThisRefresh = 0;
    
    // 强制刷新计数重置
    state.auction.forceRefreshUsedToday = 0;
    state.auction.lastForceRefreshResetDay = state.day;
    
    // 统计数据保留（totalPurchased、totalSpent 不变）
    // 保护道具保留（在背包中，不受 Prestige 影响）
}
```

#### 验收标准

```
Given 玩家拥有 2 件收藏品，持有 2 个御前圣令和 1 个免死金牌
When 玩家执行 Prestige
Then 聚宝阁保持解锁（unlocked = true）
And 收藏品全部清零（collections 全部 false）
And 背包中的御前圣令和免死金牌保留
And 当前拍品清空
And totalPurchased 和 totalSpent 保留

Given Prestige 后玩家进入聚宝阁
When currentItems 为空
Then 立即触发一次刷新，生成 4 件新拍品

Given Prestige 后玩家声望低于 300
When 玩家查看地点列表
Then 聚宝阁仍显示（已解锁，不受声望降低影响）
```

---

### 7.11 v2.3 风险机制联动

#### 设计目标

将保护道具的免疫逻辑正确插入 v2.3 的两大风险机制中：查封逻辑（黑市/盐场）和惩罚性倒退逻辑（checkGameOver）。

#### 联动点 1：查封免疫（御前圣令）

**插入位置**：黑市查封判定逻辑（HEISHI_CONFIG 相关代码）、盐场查封判定逻辑（YANCHANG_CONFIG 相关代码）

**插入方式**：在查封判定通过（isConfiscated = true）后、查封执行前，插入 `checkConfiscationImmunity(state)` 调用。若返回 true，跳过查封执行并显示提示。

#### 联动点 2：惩罚性倒退免疫（免死金牌）

**插入位置**：checkGameOver 函数中体力归零判定后的惩罚执行块

**插入方式**：在 `state.stamina <= 0` 判定后、惩罚执行（扣银两+降级）前，插入 `checkPunitiveSetbackImmunity(state)` 调用。若返回 true，跳过惩罚执行并显示提示。

#### 联动关系图

```
v2.3 风险机制                    聚宝阁保护道具
─────────────                    ──────────────
                                   
黑市查封判定 ──→ 查封通过? ──→ 御前圣令? ──→ YES: 免疫（消耗1个）
(5% 概率)         │                 │
                  │                 └──→ NO: 执行查封
                  │
盐场查封判定 ──→ 查封通过? ──→ 御前圣令? ──→ YES: 免疫（消耗1个）
(100% 风险)       │                 │
                  │                 └──→ NO: 执行查封
                                   
checkGameOver ──→ 体力≤0? ───→ 免死金牌? ──→ YES: 免疫（消耗1个，体力恢复10）
                  │                 │
                  │                 └──→ NO: 执行惩罚性倒退
                                     (-50%银两, 全店-5级)
```

#### 代码片段 — 完整联动插入示例

```javascript
// ========================================
// 联动点 1：黑市查封逻辑修改
// ========================================
// 文件：游戏主逻辑（game.js 或等价文件）
// 函数：executeHeishiAction() 或等价函数

// --- 原代码 ---
// if (isConfiscated) {
//     state.silver -= confiscatedAmount;
//     showMessage('黑市货物被查封！损失' + confiscatedAmount + '银两');
// }

// --- 修改后 ---
if (isConfiscated) {
    if (checkConfiscationImmunity(state)) {
        showMessage('御前圣令护体，查封免疫！消耗御前圣令x1');
    } else {
        state.silver -= confiscatedAmount;
        showMessage('黑市货物被查封！损失' + confiscatedAmount + '银两');
    }
}

// ========================================
// 联动点 2：盐场查封逻辑修改
// ========================================
// 函数：executeYanchangAction() 或等价函数

// --- 原代码 ---
// if (isConfiscated) {
//     state.silver -= yanchangLoss;
//     showMessage('盐场被查封！损失惨重');
// }

// --- 修改后 ---
if (isConfiscated) {
    if (checkConfiscationImmunity(state)) {
        showMessage('御前圣令护体，查封免疫！消耗御前圣令x1');
    } else {
        state.silver -= yanchangLoss;
        showMessage('盐场被查封！损失惨重');
    }
}

// ========================================
// 联动点 3：checkGameOver 逻辑修改
// ========================================
// 函数：checkGameOver() 或等价函数

// --- 原代码 ---
// if (state.stamina <= 0) {
//     state.silver = Math.floor(state.silver * 0.5);
//     downgradeAllShops(state, 5);
//     state.stamina = 10;
//     showMessage('体力耗尽！银两减半，全店降级5级。');
// }

// --- 修改后 ---
if (state.stamina <= 0) {
    if (checkPunitiveSetbackImmunity(state)) {
        showMessage('免死金牌护体，逢凶化吉！消耗免死金牌x1，体力恢复至10。');
    } else {
        state.silver = Math.floor(state.silver * 0.5);
        downgradeAllShops(state, 5);
        state.stamina = 10;
        showMessage('体力耗尽！银两减半，全店降级5级。');
    }
}
```

#### 验收标准

```
Given 玩家持有 2 个御前圣令，进入黑市
When 黑市查封触发（5%概率）
Then 查封被免疫，消耗 1 个御前圣令
And 黑市收益正常获得
And 显示"御前圣令护体，查封免疫！"

Given 玩家持有 1 个御前圣令，进入盐场
When 盐场查封触发（100%风险）
Then 查封被免疫，消耗 1 个御前圣令
And 盐场收益正常获得

Given 玩家持有 1 个免死金牌，体力归零
When checkGameOver 执行
Then 惩罚性倒退被免疫，消耗 1 个免死金牌
And 体力恢复至 10
And 银两和店铺等级不变
And 显示"免死金牌护体，逢凶化吉！"

Given 玩家持有 0 个御前圣令和 0 个免死金牌
When 查封/体力归零触发
Then 查封/惩罚性倒退照常执行（与 v2.3 原逻辑一致）
And 无额外提示
```

---

### 7.12 消耗道具包设计

#### 设计目标

消耗道具包是拍品池中频率第二高的品类（20%），为玩家提供基础物资的批量获取途径。道具包以标准价格出售（无溢价），内含多件现有消耗道具的组合。

#### 机制详述

1. **包的定义**：消耗道具包是预定义的道具组合，一次性购买获得包内所有道具
2. **价格规则**：包价格 = 内含道具单价之和（无折扣、无溢价）
3. **购买后处理**：购买后包内各道具分别加入背包，包本身不占背包格

#### 参数表 — 消耗道具包示例

| 道具包 | 内含 | 总价 | 出现权重 |
|--------|------|------|----------|
| 体力补给箱 | 大还丹×5 | 25,000 | 10 |
| 商途加速箱 | 商途卷×3 | 30,000 | 10 |
| 声望提升箱 | 声望令×3 | 45,000 | 5 |
| 综合补给箱 | 大还丹×2 + 商途卷×2 + 声望令×1 | 32,000 | 8 |

> 注：以上道具名和价格为示例，具体以 data.js 中 ITEMS 实际定义为准。

#### 代码片段

```javascript
var CONSUMABLE_PACK_POOL = [
    {
        packId: 'pack_stamina',
        name: '体力补给箱',
        items: [{ itemId: 'stamina_pill_large', quantity: 5 }],
        weight: 10,
    },
    {
        packId: 'pack_commerce',
        name: '商途加速箱',
        items: [{ itemId: 'commerce_scroll', quantity: 3 }],
        weight: 10,
    },
    {
        packId: 'pack_reputation',
        name: '声望提升箱',
        items: [{ itemId: 'reputation_token', quantity: 3 }],
        weight: 5,
    },
    {
        packId: 'pack_mixed',
        name: '综合补给箱',
        items: [
            { itemId: 'stamina_pill_large', quantity: 2 },
            { itemId: 'commerce_scroll', quantity: 2 },
            { itemId: 'reputation_token', quantity: 1 },
        ],
        weight: 8,
    },
];

/**
 * 计算消耗道具包的总价
 * @param {object} pack - 道具包定义
 * @returns {number} 总价
 */
function calculatePackPrice(pack) {
    var total = 0;
    for (var i = 0; i < pack.items.length; i++) {
        var itemDef = ITEMS[pack.items[i].itemId];
        total += (itemDef ? itemDef.price : 0) * pack.items[i].quantity;
    }
    return total;
}
```

#### 验收标准

```
Given 消耗道具包类别被抽中（20% 概率）
When 生成消耗包拍品
Then 返回一个预定义的道具包
And 拍品价格 = 包内道具单价之和

Given 玩家购买"体力补给箱"（含大还丹×5，总价 25,000）
When 购买执行
Then 银两扣除 25,000
And 背包新增 5 个大还丹
And 道具包本身不占背包格
```

---

## 8. 需求池

### 8.1 需求总览

| ID | 名称 | 优先级 | 工作量(人日) | 依赖 |
|----|------|--------|-------------|------|
| AU-001 | 聚宝阁地点解锁与入口 | P0 | 1 | — |
| AU-002 | 拍品自动刷新机制（步数驱动） | P0 | 2 | AU-001 |
| AU-003 | 拍品池生成与概率分布 | P0 | 2 | AU-002 |
| AU-004 | 一口价购买系统 | P0 | 2 | AU-003 |
| AU-005 | 黑市令拍卖渠道 | P0 | 1 | AU-004 |
| AU-006 | 收藏品体系（3件收藏品） | P0 | 2 | AU-004 |
| AU-007 | Prestige 联动（收藏品清零） | P0 | 1 | AU-006 |
| AU-008 | 御前圣令（查封免疫） | P1 | 2 | AU-004 |
| AU-009 | 免死金牌（惩罚性倒退免疫） | P1 | 2 | AU-004 |
| AU-010 | 稀有道具溢价机制 | P1 | 1 | AU-003 |
| AU-011 | 强制刷新机制 | P1 | 1 | AU-002 |
| AU-012 | v2.3 风险机制联动 | P1 | 2 | AU-008, AU-009 |
| AU-013 | 聚宝阁 UI 与动效 | P2 | 2 | AU-001~AU-012 |
| AU-014 | 拍卖统计面板 | P2 | 1 | AU-004 |
| AU-015 | 收藏品展示柜 | P2 | 1 | AU-006 |

**合计**: 15 项需求 / 23 人日

---

### 8.2 详细需求

#### AU-001：聚宝阁地点解锁与入口

| 字段 | 内容 |
|------|------|
| 优先级 | P0 |
| 工作量 | 1 人日 |
| 依赖 | — |
| 描述 | 新增"聚宝阁"地点，声望 ≥ 300 时解锁，作为拍卖场系统的入口 |

**验收标准**：
- [ ] Given 玩家声望 299，When 查看地点列表，Then 聚宝阁不显示
- [ ] Given 玩家声望首次达到 300，When 声望更新，Then 聚宝阁解锁并弹出提示
- [ ] Given 聚宝阁已解锁，When 玩家进入，Then 不消耗体力
- [ ] Given Prestige 后声望 < 300，When 查看地点列表，Then 聚宝阁仍显示（保持解锁）

---

#### AU-002：拍品自动刷新机制（步数驱动）

| 字段 | 内容 |
|------|------|
| 优先级 | P0 |
| 工作量 | 2 人日 |
| 依赖 | AU-001 |
| 描述 | 步数驱动自动刷新，声望递减四档（24/20/16/12步），每次刷新 4 件拍品 |

**验收标准**：
- [ ] Given 声望 400，When 步数累计达 24，Then 自动刷新 4 件拍品
- [ ] Given 声望 700，When 步数累计达 20，Then 自动刷新（第二档）
- [ ] Given 声望 1200，When 步数累计达 16，Then 自动刷新（第三档）
- [ ] Given 声望 1600，When 步数累计达 12，Then 自动刷新（第四档）
- [ ] Given 首次进入聚宝阁，When currentItems 为空，Then 立即触发刷新
- [ ] Given 刷新触发，When 生成新拍品，Then stepsSinceLastRefresh 归零

---

#### AU-003：拍品池生成与概率分布

| 字段 | 内容 |
|------|------|
| 优先级 | P0 |
| 工作量 | 2 人日 |
| 依赖 | AU-002 |
| 描述 | 5 大类拍品按概率分布生成：收藏品25%、保护道具10%、黑市令15%、稀有道具30%、消耗道具包20% |

**验收标准**：
- [ ] Given 触发刷新，When 生成拍品，Then 恰好 4 件，每件属于 5 类之一
- [ ] Given 1000 次采样，When 统计频率，Then 各类别频率在目标值 ±3% 以内
- [ ] Given 收藏品被抽中，When 已有收藏品出现，Then 不重复（同轮去重）
- [ ] Given 收藏品被抽中，When 抽取具体物品，Then 内部权重 70/25/5 生效

---

#### AU-004：一口价购买系统

| 字段 | 内容 |
|------|------|
| 优先级 | P0 |
| 工作量 | 2 人日 |
| 依赖 | AU-003 |
| 描述 | 玩家以一口价购买拍品，无竞价，银两不足时阻止购买 |

**验收标准**：
- [ ] Given 银两充足，When 点击购买，Then 扣银两、道具入背包、拍品标记已售
- [ ] Given 银两不足，When 点击购买，Then 阻止购买并提示
- [ ] Given 拍品已售，When 点击，Then 无购买按钮
- [ ] Given 购买收藏品，When 执行，Then collections 对应项设为 true
- [ ] Given 购买保护道具且已达 maxStack，When 点击购买，Then 阻止并提示

---

#### AU-005：黑市令拍卖渠道

| 字段 | 内容 |
|------|------|
| 优先级 | P0 |
| 工作量 | 1 人日 |
| 依赖 | AU-004 |
| 描述 | 黑市令专属购买渠道，8000 银两/个，100% 出现，限购 3 个/次 |

**验收标准**：
- [ ] Given 刚刷新，When 查看聚宝阁，Then 黑市令购买渠道可用
- [ ] Given 银两充足且未达限购，When 购买 N 个，Then 扣银两 8000×N，背包+ N 个黑市令
- [ ] Given 本轮已购 3 个，When 再买 1 个，Then 阻止并提示限购
- [ ] Given 银两不足，When 购买，Then 阻止并提示
- [ ] Given 拍品池中出现黑市令，When 购买拍品池中的黑市令，Then 不消耗专属渠道限购额度

---

#### AU-006：收藏品体系（3件收藏品）

| 字段 | 内容 |
|------|------|
| 优先级 | P0 |
| 工作量 | 2 人日 |
| 依赖 | AU-004 |
| 描述 | 3 件阶梯式收藏品：千年翡翠(50万)、万年人参(300万)、百万年冰红茶(3000万) |

**验收标准**：
- [ ] Given 玩家未拥有千年翡翠，When 购买，Then collections.collectible_jade = true，银两扣 50 万
- [ ] Given 收藏品不可使用、不可变卖
- [ ] Given 已拥有某收藏品，When 再次购买，Then 提示"已拥有"但允许购买
- [ ] Given 3 件收藏品各有正确的出现概率（17.5%/6.25%/1.25%）

---

#### AU-007：Prestige 联动（收藏品清零）

| 字段 | 内容 |
|------|------|
| 优先级 | P0 |
| 工作量 | 1 人日 |
| 依赖 | AU-006 |
| 描述 | Prestige 时收藏品清零，聚宝阁保持解锁，保护道具保留，统计数据保留 |

**验收标准**：
- [ ] Given 拥有 2 件收藏品，When Prestige，Then collections 全部 false
- [ ] Given 聚宝阁已解锁，When Prestige，Then unlocked 仍为 true
- [ ] Given 持有保护道具，When Prestige，Then 保护道具保留
- [ ] Given totalSpent = 100 万，When Prestige，Then totalSpent 仍为 100 万
- [ ] Given Prestige 后进入聚宝阁，When currentItems 为空，Then 触发刷新

---

#### AU-008：御前圣令（查封免疫）

| 字段 | 内容 |
|------|------|
| 优先级 | P1 |
| 工作量 | 2 人日 |
| 依赖 | AU-004 |
| 描述 | 御前圣令：15万/个，maxStack:3，免疫一次查封（黑市/盐场），自动触发 |

**验收标准**：
- [ ] Given 持有御前圣令，When 查封判定通过，Then 消耗1个，查封免疫
- [ ] Given 未持有御前圣令，When 查封判定通过，Then 查封照常执行
- [ ] Given 持有3个（maxStack），When 尝试购买第4个，Then 阻止
- [ ] Given 覆盖黑市和盐场两种查封场景

---

#### AU-009：免死金牌（惩罚性倒退免疫）

| 字段 | 内容 |
|------|------|
| 优先级 | P1 |
| 工作量 | 2 人日 |
| 依赖 | AU-004 |
| 描述 | 免死金牌：50万/个，maxStack:1，免除一次惩罚性倒退，体力恢复至10 |

**验收标准**：
- [ ] Given 持有免死金牌，When 体力归零，Then 消耗1个，免除惩罚，体力恢复10
- [ ] Given 未持有，When 体力归零，Then 惩罚性倒退照常
- [ ] Given 持有1个（maxStack），When 尝试购买第2个，Then 阻止
- [ ] Given 免疫后体力 = 10（非满值），避免立即再次触发

---

#### AU-010：稀有道具溢价机制

| 字段 | 内容 |
|------|------|
| 优先级 | P1 |
| 工作量 | 1 人日 |
| 依赖 | AU-003 |
| 描述 | 稀有道具在拍卖场溢价 50%（原价×1.5），向上取整到百位 |

**验收标准**：
- [ ] Given 原价 50,000，When 计算拍卖价，Then = 75,000
- [ ] Given 原价 33,333，When 计算拍卖价，Then = 50,000（向上取整到百位）
- [ ] Given 稀有道具被抽中（30%概率），When 生成拍品，Then 价格含50%溢价

---

#### AU-011：强制刷新机制

| 字段 | 内容 |
|------|------|
| 优先级 | P1 |
| 工作量 | 1 人日 |
| 依赖 | AU-002 |
| 描述 | 花费 10 万银两强制刷新拍品，日限 2 次，游戏内日期变化时重置 |

**验收标准**：
- [ ] Given 银两充足且未达日限，When 强制刷新，Then 扣10万，生成4件新拍品
- [ ] Given 已用2次（日限），When 强制刷新，Then 阻止并提示
- [ ] Given 游戏内日期变化，When 检查日限，Then 重置为0
- [ ] Given 银两不足，When 强制刷新，Then 阻止并提示

---

#### AU-012：v2.3 风险机制联动

| 字段 | 内容 |
|------|------|
| 优先级 | P1 |
| 工作量 | 2 人日 |
| 依赖 | AU-008, AU-009 |
| 描述 | 将保护道具免疫逻辑插入 v2.3 的查封逻辑和 checkGameOver 逻辑 |

**验收标准**：
- [ ] Given 黑市查封判定通过，When 执行查封前，Then 检查御前圣令
- [ ] Given 盐场查封判定通过，When 执行查封前，Then 检查御前圣令
- [ ] Given 体力归零，When 执行惩罚前，Then 检查免死金牌
- [ ] Given 无保护道具，When 风险触发，Then 行为与 v2.3 原逻辑完全一致

---

#### AU-013：聚宝阁 UI 与动效

| 字段 | 内容 |
|------|------|
| 优先级 | P2 |
| 工作量 | 2 人日 |
| 依赖 | AU-001~AU-012 |
| 描述 | 聚宝阁界面设计：拍品展示区、黑市令购买区、强制刷新按钮、步数进度条 |

**验收标准**：
- [ ] Given 进入聚宝阁，When 界面加载，Then 显示4件拍品（名称/描述/价格/购买按钮）
- [ ] Given 界面显示步数进度条，When 进度达阈值，Then 视觉提示刷新
- [ ] Given 黑市令购买区独立显示，When 查看，Then 显示价格/已购数/限购数
- [ ] Given 强制刷新按钮，When 查看，Then 显示费用/今日剩余次数

---

#### AU-014：拍卖统计面板

| 字段 | 内容 |
|------|------|
| 优先级 | P2 |
| 工作量 | 1 人日 |
| 依赖 | AU-004 |
| 描述 | 在聚宝阁显示累计购买次数和累计消费银两 |

**验收标准**：
- [ ] Given 玩家累计购买 10 次花费 200 万，When 查看统计面板，Then 显示"累计购买：10次 / 累计消费：2,000,000银两"
- [ ] Given Prestige 后，When 查看统计面板，Then 数据保留（跨 Prestige 累计）

---

#### AU-015：收藏品展示柜

| 字段 | 内容 |
|------|------|
| 优先级 | P2 |
| 工作量 | 1 人日 |
| 依赖 | AU-006 |
| 描述 | 在聚宝阁展示3件收藏品的收集状态，已收集高亮，未收集灰色 |

**验收标准**：
- [ ] Given 未拥有任何收藏品，When 查看展示柜，Then 3件收藏品全部灰色
- [ ] Given 拥有千年翡翠，When 查看展示柜，Then 千年翡翠高亮，其余灰色
- [ ] Given Prestige 后，When 查看展示柜，Then 全部灰色（收藏品已清零）

---

### 8.3 停车场（Parking Lot）

以下需求暂不在当前范围内，记录备查：

| ID | 名称 | 描述 | 暂缓原因 |
|----|------|------|----------|
| PL-01 | 拍卖场限时抢购 | 特定时段出现限量稀有拍品，先到先得 | v1 不做竞价/限时，保持一口价简洁体验 |
| PL-02 | 收藏品成就系统 | 集齐3件收藏品解锁特殊称号/增益 | v1 先验证收集率，成就系统留待 v2 |
| PL-03 | 玩家间拍卖 | 玩家上架自己的道具供其他玩家购买 | 无多人系统基础设施，v1 纯单机 |
| PL-04 | 拍卖场等级 | 聚宝阁自身可升级，解锁更多拍品栏位 | 增加复杂度，v1 保持4件固定栏位 |
| PL-05 | 收藏品交易 | 多余收藏品可交易或变卖 | 与"不可变卖"设计冲突，如需引入需重新评估 |

---

## 9. 数据结构设计

### 9.1 AUCTION_CONFIG — 拍卖场全局配置

```javascript
var AUCTION_CONFIG = {
    // 解锁条件
    unlockReputation: 300,
    
    // 拍品数量
    itemsPerRefresh: 4,
    
    // 刷新步数阈值（声望递减四档）
    refreshStepsByReputation: [
        { minRep: 300,  maxRep: 600,  steps: 24 },
        { minRep: 600,  maxRep: 1000, steps: 20 },
        { minRep: 1000, maxRep: 1500, steps: 16 },
        { minRep: 1500, maxRep: Infinity, steps: 12 },
    ],
    
    // 拍品池类别概率
    categoryProbabilities: {
        collectible:    0.25,
        protection:     0.10,
        heishiToken:    0.15,
        rareItem:       0.30,
        consumablePack: 0.20,
    },
    
    // 稀有道具溢价
    rareItemPremium: 0.50,
    
    // 强制刷新
    forceRefreshCost: 100000,
    forceRefreshDailyLimit: 2,
    
    // 黑市令专属渠道
    heishiTokenPrice: 8000,
    heishiTokenMaxPerRefresh: 3,
    heishiTokenAlwaysAvailable: true,
};
```

### 9.2 新增道具定义

```javascript
// ========================================
// 收藏品（3 件）
// ========================================
var COLLECTIBLE_ITEMS = {
    collectible_jade: {
        id: 'collectible_jade',
        name: '千年翡翠',
        price: 500000,
        type: 'collectible',
        rarity: 'epic',
        usable: false,
        sellable: false,
        desc: '历经千年沉淀的翡翠原石，通体碧绿，价值连城。',
    },
    collectible_ginseng: {
        id: 'collectible_ginseng',
        name: '万年人参',
        price: 3000000,
        type: 'collectible',
        rarity: 'legendary',
        usable: false,
        sellable: false,
        desc: '深山老林中采得的万年野山参，形如人形，药香扑鼻。',
    },
    collectible_iced_tea: {
        id: 'collectible_iced_tea',
        name: '百万年冰红茶',
        price: 30000000,
        type: 'collectible',
        rarity: 'mythic',
        usable: false,
        sellable: false,
        desc: '传说中的至尊饮品，据说饮一口可通天地……但你舍不得。',
    },
};

// ========================================
// 保护道具（2 件）
// ========================================
var PROTECTION_ITEMS = {
    protection_imperial_decree: {
        id: 'protection_imperial_decree',
        name: '御前圣令',
        price: 150000,
        type: 'protection',
        maxStack: 3,
        protectionType: 'confiscation',
        usable: false,
        sellable: true,
        sellPrice: 50000,
        desc: '盖有御玺的圣令，可免疫一次查封（黑市/盐场）。最多持有3个。',
    },
    protection_death_medal: {
        id: 'protection_death_medal',
        name: '免死金牌',
        price: 500000,
        type: 'protection',
        maxStack: 1,
        protectionType: 'punitiveSetback',
        usable: false,
        sellable: true,
        sellPrice: 200000,
        desc: '御赐免死金牌，可免除一次惩罚性倒退。最多持有1个。',
    },
};

// 合并到现有 ITEMS
Object.assign(ITEMS, COLLECTIBLE_ITEMS, PROTECTION_ITEMS);
```

### 9.3 拍品池定义

```javascript
var AUCTION_POOL = {
    collectible: {
        probability: 0.25,
        items: [
            { itemId: 'collectible_jade',     weight: 70, price: 500000 },
            { itemId: 'collectible_ginseng',  weight: 25, price: 3000000 },
            { itemId: 'collectible_iced_tea', weight: 5,  price: 30000000 },
        ]
    },
    protection: {
        probability: 0.10,
        items: [
            { itemId: 'protection_imperial_decree', weight: 75, price: 150000 },
            { itemId: 'protection_death_medal',     weight: 25, price: 500000 },
        ]
    },
    heishiToken: {
        probability: 0.15,
        items: [
            { itemId: 'heishi_pass', weight: 100, price: 8000 },
        ]
    },
    rareItem: {
        probability: 0.30,
        items: [
            { itemId: 'rare_commerce_map',   basePrice: 30000,  weight: 10 },
            { itemId: 'rare_reputation_tag', basePrice: 50000,  weight: 10 },
            { itemId: 'rare_gold_formula',   basePrice: 80000,  weight: 3 },
            { itemId: 'rare_vitality_pill',  basePrice: 100000, weight: 3 },
            { itemId: 'rare_heavenly_guide', basePrice: 200000, weight: 1 },
        ]
    },
    consumablePack: {
        probability: 0.20,
        items: [
            { packId: 'pack_stamina',     weight: 10 },
            { packId: 'pack_commerce',    weight: 10 },
            { packId: 'pack_reputation',  weight: 5 },
            { packId: 'pack_mixed',       weight: 8 },
        ]
    }
};
```

### 9.4 State 新增字段

```javascript
// state.auction — 拍卖场状态
state.auction = {
    // 解锁状态
    unlocked: false,
    
    // 刷新相关
    stepsSinceLastRefresh: 0,
    currentItems: [],             // 当前4件拍品 [{category, itemId, name, desc, price, sold}]
    
    // 强制刷新
    forceRefreshUsedToday: 0,
    lastForceRefreshResetDay: 0,
    
    // 黑市令专属渠道
    heishiTokensBoughtThisRefresh: 0,
    
    // 收藏品收集状态
    collections: {
        collectible_jade: false,
        collectible_ginseng: false,
        collectible_iced_tea: false,
    },
    
    // 统计数据（跨Prestige保留）
    totalPurchased: 0,
    totalSpent: 0,
};
```

### 9.5 LOCATIONS 新增条目

```javascript
// 新增至 LOCATIONS 数组
{
    id: 'auction',
    name: '聚宝阁',
    icon: '🏛️',
    desc: '拍卖珍奇之物，价高者得。不过这里只讲一口价，不兴竞价。',
    unlockCondition: function(state) {
        return state.reputation >= 300;
    },
    unlockText: '声望达到 300，聚宝阁的大门为你敞开！',
    staminaCost: 0,
    actions: ['browse', 'forceRefresh', 'buyHeishiToken'],
}
```

### 9.6 拍品对象结构

```javascript
// 每件拍品的对象结构
{
    category: 'collectible',      // 类别：collectible/protection/heishiToken/rareItem/consumablePack
    itemId: 'collectible_jade',   // 道具ID
    name: '千年翡翠',              // 显示名称
    desc: '历经千年沉淀...',       // 描述
    price: 500000,                // 一口价
    originalPrice: null,          // 原价（仅稀有道具有，用于显示溢价对比）
    sold: false,                  // 是否已售出
    packContents: null,           // 消耗道具包内容（仅consumablePack类别）
}
```

---

## 10. 关键逻辑代码片段

### 10.1 完整刷新逻辑

```javascript
/**
 * 刷新聚宝阁拍品（自动/强制共用）
 * @param {object} state - 游戏状态
 */
function refreshAuctionItems(state) {
    state.auction.currentItems = generateAuctionItems(state);
    state.auction.stepsSinceLastRefresh = 0;
    state.auction.heishiTokensBoughtThisRefresh = 0;
}

/**
 * 生成4件拍卖拍品
 * @param {object} state - 游戏状态
 * @returns {array} 4件拍品对象
 */
function generateAuctionItems(state) {
    var items = [];
    var usedCollectibles = [];
    
    for (var i = 0; i < 4; i++) {
        var category = rollCategory();
        var item = rollItemInCategory(category, usedCollectibles, state);
        if (item) {
            items.push(item);
        }
    }
    
    return items;
}

function rollCategory() {
    var rand = Math.random();
    var cumulative = 0;
    var cats = [
        { name: 'collectible',     prob: 0.25 },
        { name: 'protection',      prob: 0.10 },
        { name: 'heishiToken',     prob: 0.15 },
        { name: 'rareItem',        prob: 0.30 },
        { name: 'consumablePack',  prob: 0.20 },
    ];
    
    for (var i = 0; i < cats.length; i++) {
        cumulative += cats[i].prob;
        if (rand < cumulative) return cats[i].name;
    }
    return 'consumablePack';
}

function rollItemInCategory(category, usedCollectibles, state) {
    var pool = AUCTION_POOL[category];
    if (!pool) return null;
    
    if (category === 'rareItem') {
        return rollRareItem();
    }
    
    if (category === 'consumablePack') {
        return rollConsumablePack();
    }
    
    // 收藏品/保护道具/黑市令的通用抽取
    var availableItems = [];
    var totalWeight = 0;
    
    for (var i = 0; i < pool.items.length; i++) {
        var entry = pool.items[i];
        // 收藏品去重
        if (category === 'collectible' && usedCollectibles.indexOf(entry.itemId) >= 0) {
            continue;
        }
        availableItems.push(entry);
        totalWeight += entry.weight;
    }
    
    if (availableItems.length === 0) return null;
    
    var rand = Math.random() * totalWeight;
    var cumulative = 0;
    
    for (var i = 0; i < availableItems.length; i++) {
        cumulative += availableItems[i].weight;
        if (rand < cumulative) {
            var chosen = availableItems[i];
            var itemDef = ITEMS[chosen.itemId];
            
            if (category === 'collectible') {
                usedCollectibles.push(chosen.itemId);
            }
            
            return {
                category: category,
                itemId: chosen.itemId,
                name: itemDef.name,
                desc: itemDef.desc,
                price: chosen.price,
                originalPrice: null,
                sold: false,
                packContents: null,
            };
        }
    }
    
    return null;
}
```

### 10.2 步数检查与自动刷新

```javascript
/**
 * 步数更新时检查聚宝阁刷新
 * 在主游戏循环的步数更新逻辑中调用
 * @param {object} state - 游戏状态
 */
function checkAuctionRefresh(state) {
    if (!state.auction || !state.auction.unlocked) return;
    
    var threshold = getAuctionRefreshSteps(state.reputation);
    state.auction.stepsSinceLastRefresh++;
    
    if (state.auction.stepsSinceLastRefresh >= threshold) {
        refreshAuctionItems(state);
        // 可选：显示通知
        // showNotification('聚宝阁拍品已刷新！');
    }
}

/**
 * 获取当前声望对应的刷新步数阈值
 * @param {number} reputation - 当前声望
 * @returns {number} 步数阈值
 */
function getAuctionRefreshSteps(reputation) {
    if (reputation >= 1500) return 12;
    if (reputation >= 1000) return 16;
    if (reputation >= 600) return 20;
    return 24;  // 300 <= reputation < 600
}
```

### 10.3 强制刷新

```javascript
/**
 * 强制刷新拍品
 * @param {object} state - 游戏状态
 * @returns {object} { success: boolean, message: string }
 */
function forceRefreshAuction(state) {
    var config = AUCTION_CONFIG;
    
    // 日限重置检查
    if (state.auction.lastForceRefreshResetDay !== state.day) {
        state.auction.forceRefreshUsedToday = 0;
        state.auction.lastForceRefreshResetDay = state.day;
    }
    
    // 校验日限
    if (state.auction.forceRefreshUsedToday >= config.forceRefreshDailyLimit) {
        return { 
            success: false, 
            message: '今日强制刷新已用尽（上限' + config.forceRefreshDailyLimit + '次）' 
        };
    }
    
    // 校验银两
    if (state.silver < config.forceRefreshCost) {
        return { success: false, message: '银两不足，需要' + config.forceRefreshCost + '银两' };
    }
    
    // 执行
    state.silver -= config.forceRefreshCost;
    state.auction.forceRefreshUsedToday++;
    state.auction.totalSpent += config.forceRefreshCost;
    refreshAuctionItems(state);
    
    return { success: true, message: '强制刷新成功！获得4件新拍品。' };
}
```

### 10.4 保护道具免疫逻辑

```javascript
/**
 * 查封免疫检查（御前圣令）
 * 在黑市/盐场查封判定通过后、查封执行前调用
 * @param {object} state - 游戏状态
 * @returns {boolean} true=免疫成功
 */
function checkConfiscationImmunity(state) {
    var count = state.inventory['protection_imperial_decree'] || 0;
    if (count > 0) {
        state.inventory['protection_imperial_decree']--;
        return true;
    }
    return false;
}

/**
 * 惩罚性倒退免疫检查（免死金牌）
 * 在 checkGameOver 中体力归零判定后、惩罚执行前调用
 * @param {object} state - 游戏状态
 * @returns {boolean} true=免疫成功
 */
function checkPunitiveSetbackImmunity(state) {
    var count = state.inventory['protection_death_medal'] || 0;
    if (count > 0) {
        state.inventory['protection_death_medal']--;
        state.stamina = 10;
        return true;
    }
    return false;
}
```

### 10.5 Prestige 联动

```javascript
/**
 * Prestige 时处理聚宝阁状态
 * 在现有 Prestige 逻辑中调用
 * @param {object} state - 游戏状态
 */
function handleAuctionOnPrestige(state) {
    if (!state.auction) return;
    
    // 保持解锁（unlocked 不变）
    
    // 收藏品清零
    state.auction.collections = {
        collectible_jade: false,
        collectible_ginseng: false,
        collectible_iced_tea: false,
    };
    
    // 当前拍品清空
    state.auction.currentItems = [];
    state.auction.stepsSinceLastRefresh = 0;
    state.auction.heishiTokensBoughtThisRefresh = 0;
    
    // 强制刷新计数重置
    state.auction.forceRefreshUsedToday = 0;
    state.auction.lastForceRefreshResetDay = state.day;
    
    // 统计数据保留（totalPurchased、totalSpent 不变）
    // 保护道具保留（在背包中，不受 Prestige 影响）
}
```

### 10.6 解锁检查

```javascript
/**
 * 检查聚宝阁解锁条件
 * 在声望更新逻辑中调用
 * @param {object} state - 游戏状态
 */
function checkAuctionUnlock(state) {
    if (!state.auction) {
        state.auction = createInitialAuctionState();
    }
    
    if (!state.auction.unlocked && state.reputation >= AUCTION_CONFIG.unlockReputation) {
        state.auction.unlocked = true;
        showNotification('声望达到 300，聚宝阁的大门为你敞开！');
    }
}

/**
 * 创建初始拍卖场状态
 * @returns {object} 初始 state.auction
 */
function createInitialAuctionState() {
    return {
        unlocked: false,
        stepsSinceLastRefresh: 0,
        currentItems: [],
        forceRefreshUsedToday: 0,
        lastForceRefreshResetDay: 0,
        heishiTokensBoughtThisRefresh: 0,
        collections: {
            collectible_jade: false,
            collectible_ginseng: false,
            collectible_iced_tea: false,
        },
        totalPurchased: 0,
        totalSpent: 0,
    };
}
```

---

## 11. 经济平衡影响评估

### 11.1 银两消耗分析

#### 一次性消耗（收藏品）

| 收藏品 | 价格 | 获取阶段 | 单次影响 |
|--------|------|----------|----------|
| 千年翡翠 | 500,000 | 中期 | 中等消耗，约3~5天积蓄 |
| 万年人参 | 3,000,000 | 后期 | 大额消耗，约2~3周积蓄 |
| 百万年冰红茶 | 30,000,000 | 末期 | 天花板消耗，约1~2月积蓄 |
| **合计** | **33,500,000** | — | 每 Prestige 周期可消耗 3350 万 |

#### 持续性消耗（每次刷新）

| 消耗项 | 期望消耗/次 | 说明 |
|--------|------------|------|
| 收藏品（如购买） | 最高 260 万 | 取决于出现哪件及是否购买 |
| 保护道具 | ~9.3 万 | 期望0.4件 × 加权均价 |
| 黑市令（专属渠道） | ~1.2 万 | 假设平均买1.5个 × 8000 |
| 稀有道具 | ~9.0 万 | 期望1.2件 × 含溢价均价 |
| 消耗道具包 | ~2.4 万 | 期望0.8件 × 均价 |
| 强制刷新 | ~5.0 万 | 假设平均每天用0.5次 × 10万 |
| **每日总消耗（估）** | **~30~80 万** | 取决于刷新频率和购买率 |

#### 日均消耗估算（按声望阶段）

| 声望阶段 | 日均刷新 | 日均消耗（保守估计） | 日均消耗（积极估计） |
|----------|----------|---------------------|---------------------|
| 300~600 | 2.5 次 | ~15 万 | ~40 万 |
| 600~1000 | 3.5 次 | ~20 万 | ~55 万 |
| 1000~1500 | 5.0 次 | ~30 万 | ~80 万 |
| 1500+ | 7.5 次 | ~45 万 | ~120 万 |

> 保守估计 = 购买率 30%；积极估计 = 购买率 50%

### 11.2 周转率影响预测

| 阶段 | 当前周转率 | 日均获取（估） | 日均消耗（估） | 新周转率 | 变化 |
|------|-----------|---------------|---------------|----------|------|
| 中期(300~800) | 0.73 | ~15 万 | +3~8 万 | 0.80~0.85 | +0.07~0.12 |
| 后期(800~1500) | 0.35 | ~30 万 | +5~15 万 | 0.40~0.48 | +0.05~0.13 |
| 末期(1500+) | 0.12 | ~50 万 | +10~30 万 | 0.24~0.36 | +0.12~0.24 |

**结论**：
- 中期周转率预计从 0.73 提升至 0.80+，达到设计目标
- 末期周转率预计从 0.12 提升至 0.24+，达到设计目标
- 后期略有提升但改善有限（该阶段本身周转率尚可）

### 11.3 保护道具经济影响

| 道具 | 单价 | maxStack | 最大投入 | 经济影响 |
|------|------|----------|---------|----------|
| 御前圣令 | 15 万 | 3 | 45 万 | 中等消耗，约3天积蓄；改变黑市/盐场风险收益比 |
| 免死金牌 | 50 万 | 1 | 50 万 | 大额消耗，约2~5天积蓄；改变体力管理策略 |

**风险机制影响评估**：

| 风险机制 | 原影响 | 保护后影响 | 平衡评估 |
|----------|--------|-----------|----------|
| 黑市查封(5%) | 损失货物+银两 | 免疫一次 | 御前圣令15万 > 期望损失2000，但风险厌恶型玩家愿付溢价。平衡。 |
| 盐场查封(100%) | 全部货物损失 | 免疫一次 | 御前圣令15万 vs 盐场收益3~5万，令牌成本占收益30~50%。盐场仍有利润但风险成本显性化。平衡。 |
| 惩罚性倒退 | -50%银两+全店-5级 | 免除一次 | 免死金牌50万 vs 损失100~300万，保险费率17~50%。合理。 |

**护栏检查**：
- 保护道具是否会让风险机制失去意义？→ 否。maxStack 限制（3/1）确保保护是有限的，非无限的。
- 玩家是否会囤积保护道具而不冒险？→ 否。maxStack 上限和 Prestige 不清零的特性，使囤积量有限。
- 黑市/盐场使用频率是否会下降？→ 预计不下降。保护道具使高风险活动更可承受，反而可能增加使用频率。

### 11.4 银两获取端影响

**聚宝阁不改变银两获取端**。所有聚宝阁功能均为纯消耗（一口价购买、强制刷新费用），不引入新的银两获取途径。

需确认：保护道具变卖（sellPrice）会少量回收银两，但变卖价远低于购买价（御前圣令 5万 vs 15万，免死金牌 20万 vs 50万），净消耗仍为正。

### 11.5 Prestige 循环经济影响

| 项目 | Prestige 前 | Prestige 后 | 净影响 |
|------|------------|------------|--------|
| 收藏品 | 已收集的保留 | 全部清零 | 玩家需重新消耗3350万收集 |
| 保护道具 | 保留 | 保留 | 无额外消耗 |
| 聚宝阁解锁 | 已解锁 | 保持解锁 | 无影响 |
| 统计数据 | 保留 | 保留 | 无影响 |

**结论**：Prestige 循环中，收藏品清零是核心经济驱动力——每个轮回都产生 3350 万的潜在银两消耗需求，持续驱动中后期经济循环。

---

## 12. Non-goals

### 12.1 原 v2 Non-goal 修改

**原 v2 PRD Non-goal**：
> "不做黑市拍卖/竞价（增加操作复杂度）"

**修改为**：
> "不做黑市内嵌拍卖；新增独立'聚宝阁'地点作为拍卖场系统。聚宝阁采用一口价模式，不做 NPC 竞价/玩家间竞价。"

**修改理由**：原 Non-goal 的核心意图是"避免在黑市系统中嵌入拍卖功能，增加操作复杂度"。聚宝阁作为独立地点不与黑市耦合，且采用一口价模式（无竞价），不违背原意图。主理人已裁决此修改。

### 12.2 本 PRD 的 Non-goals

以下内容明确不在聚宝阁 v1 范围内：

1. **不做 NPC 竞价/玩家间竞价** — 一口价模式，无竞价机制。降低操作复杂度是核心设计原则。
2. **不做限时抢购** — 拍品不设倒计时，刷新前一直可购买。避免时间压力带来的焦虑感。
3. **不做拍卖场等级系统** — 聚宝阁本身不升级，拍品栏位固定4个。避免引入额外养成线。
4. **不做玩家间交易** — v1 纯单机，无多人基础设施。玩家间拍卖留待远期版本。
5. **不做收藏品成就/增益** — v1 收藏品纯收集，不提供属性加成。成就系统留待验证收集率后评估。
6. **不做拍品预览/筛选** — v1 拍品随机生成，不提供筛选或预览功能。保持"逛拍卖场"的惊喜感。
7. **不做黑市令动态定价** — 黑市令固定 8000 银两，不受 GAME_CONFIG 动态定价影响。确保价格稳定可预期。
8. **不做保护道具主动使用** — 保护道具为被动触发（查封/体力归零时自动消耗），玩家不可主动激活。
9. **不做收藏品变卖/交易** — 收藏品不可变卖、不可交易，确保银两消耗的不可逆性。
10. **不做聚宝阁进入消耗** — 进入聚宝阁不消耗体力/银两，确保消费门槛仅在于购买行为本身。

### 12.3 范围管理原则

- 每个新增 scope 必须伴随 scope 移除或时间线延长
- v1 聚焦"一口价购买 + 收藏品 + 保护道具"三大核心
- 所有 P2 需求（UI/统计/展示柜）可在 v1 后追加，不阻塞核心功能上线
- 停车场需求（PL-01~PL-05）需在 v2 评审时重新评估

---

## 13. 时间线

### 13.1 里程碑规划

| 里程碑 | 内容 | 需求 | 工作量 | 目标日期 |
|--------|------|------|--------|----------|
| M1: 设计定稿 | 数据结构定义、配置参数确认 | — | 1 人日 | W1 D1 |
| M2: 核心系统 | 地点解锁、步数刷新、拍品池、一口价购买 | AU-001~AU-004 | 7 人日 | W1 D2~W2 D3 |
| M3: 收藏品+黑市令 | 收藏品体系、黑市令渠道、Prestige联动 | AU-005~AU-007 | 4 人日 | W2 D4~W2 D7 |
| M4: 保护道具 | 御前圣令、免死金牌、v2.3联动 | AU-008~AU-012 | 8 人日 | W3 D1~W3 D5 |
| M5: UI与打磨 | 聚宝阁UI、统计面板、收藏品展示柜 | AU-013~AU-015 | 4 人日 | W3 D6~W4 D2 |
| M6: 测试与调优 | 功能测试、概率验证、经济平衡测试 | — | 3 人日 | W4 D3~W4 D5 |
| **总计** | | **15项** | **23+4=27人日** | **4周** |

### 13.2 分阶段交付计划

**Phase 1 — MVP（W1~W2, 12人日）**
- AU-001: 聚宝阁地点解锁
- AU-002: 步数驱动刷新
- AU-003: 拍品池与概率分布
- AU-004: 一口价购买系统
- AU-005: 黑市令拍卖渠道
- AU-006: 收藏品体系
- AU-007: Prestige 联动
- 交付物：可玩的聚宝阁核心功能（无保护道具、无UI打磨）

**Phase 2 — 完整版（W3, 8人日）**
- AU-008: 御前圣令
- AU-009: 免死金牌
- AU-010: 稀有道具溢价
- AU-011: 强制刷新
- AU-012: v2.3 风险机制联动
- 交付物：功能完整的聚宝阁（含保护道具和风险联动）

**Phase 3 — 打磨版（W4, 7人日）**
- AU-013: 聚宝阁 UI 与动效
- AU-014: 拍卖统计面板
- AU-015: 收藏品展示柜
- 功能测试、概率验证、经济平衡调优
- 交付物：可上线的 v2.4.0 版本

### 13.3 依赖关系

```
AU-001 (地点解锁)
  ├── AU-002 (步数刷新)
  │     ├── AU-003 (拍品池)
  │     │     ├── AU-004 (一口价购买)
  │     │     │     ├── AU-005 (黑市令渠道)
  │     │     │     ├── AU-006 (收藏品)
  │     │     │     │     └── AU-007 (Prestige联动)
  │     │     │     ├── AU-008 (御前圣令)
  │     │     │     └── AU-009 (免死金牌)
  │     │     └── AU-010 (稀有道具溢价)
  │     └── AU-011 (强制刷新)
  └── AU-012 (v2.3联动) ← 依赖 AU-008 + AU-009
        └── AU-013 (UI) ← 依赖全部

独立需求:
  AU-014 (统计面板) ← 依赖 AU-004
  AU-015 (展示柜) ← 依赖 AU-006
```

---

## 14. 待确认问题

以下问题在本 PRD 中无法独立回答，需要主理人或开发团队决策：

| 编号 | 问题 | 影响范围 | 建议方案 | 状态 |
|------|------|----------|----------|------|
| Q-01 | 稀有道具池具体包含哪些现有 ITEMS？ | AU-010 | 需开发团队从 data.js 的 ITEMS 中筛选 type=rare/epic+ 的道具 | 待确认 |
| Q-02 | 消耗道具包内含的具体道具和数量？ | AU-003 | 需开发团队根据现有 ITEMS 定义具体组合 | 待确认 |
| Q-03 | 聚宝阁界面是复用现有地点 UI 模板还是独立设计？ | AU-013 | 建议：复用模板降低开发成本，仅拍品展示区独立设计 | 待确认 |
| Q-04 | 步数刷新时是否显示通知提示？ | AU-002 | 建议：显示轻量通知"聚宝阁拍品已刷新"，避免打扰 | 待确认 |
| Q-05 | 已拥有的收藏品在拍品池中出现时，购买行为是否允许？ | AU-006 | 本 PRD 建议允许（但提示"已拥有"），消耗银两但不增加收集进度 | 待确认 |
| Q-06 | 保护道具变卖功能是否在 v1 实现？ | AU-008/009 | 本 PRD 定义了 sellPrice，但变卖 UI 是否在 v1 实现需确认 | 待确认 |
| Q-07 | 离线期间步数是否累计触发聚宝阁刷新？ | AU-002 | 建议：离线期间不累计步数，离线收益结算后正常开始计数 | 待确认 |

---

## 15. 行动清单

| 编号 | 行动项 | 负责人 | 截止日期 | 状态 |
|------|--------|--------|----------|------|
| A-01 | 主理人审核 PRD v1.0 | 方向明 | W1 D1 | 待审核 |
| A-02 | 开发团队确认稀有道具池清单（Q-01） | 开发 | W1 D2 | 待确认 |
| A-03 | 开发团队确认消耗道具包定义（Q-02） | 开发 | W1 D2 | 待确认 |
| A-04 | UI 团队确认聚宝阁界面方案（Q-03） | UI | W1 D3 | 待确认 |
| A-05 | 解决 Q-04~Q-07 待确认问题 | 方向明 | W1 D3 | 待确认 |
| A-06 | 开始 Phase 1 开发（AU-001~AU-007） | 开发 | W1 D4 | 待启动 |
| A-07 | 设计埋点方案（KPI 追踪） | 数据 | W2 D1 | 待启动 |
| A-08 | 准备 A/B 测试方案（D7 留存对照） | 数据 | W3 D1 | 待启动 |

---

## 16. 数据来源索引

| 编号 | 来源 | 路径 | 使用章节 |
|------|------|------|----------|
| S-01 | v2 PRD 主文档 | `F:/AITool-finish/game/deliverables/product-strategy/prd-moyu-game-v2-2026-07-22.md` | §3(问题陈述), §5(竞品), §7(系统设计), §12(Non-goals) |
| S-02 | v2.3 系统设计 | `F:/AITool-finish/game/deliverables/product-strategy/v2.3-system-design-2026-07-22.md` | §7.6(保护道具), §7.11(v2.3联动), §11(经济评估) |
| S-03 | 竞析报告 | `F:/AITool-finish/game/deliverables/product-strategy/_interim_auction_competitive-analyst-report.md` | §5(竞品参考), §7(设计借鉴) |
| S-04 | 数析报告 | `F:/AITool-finish/game/deliverables/product-strategy/_interim_auction_data-analyst-report.md` | §3(KPI), §6(数据依据), §11(经济评估) |
| S-05 | 游戏源码数据层 | `F:/AITool-finish/game/src/js/data.js` | §7(代码风格), §9(数据结构), §10(代码片段) |
| S-06 | 主理人裁决 | team-lead 任务分配消息（2026-07-22） | 全文9项裁决参数 |

### 主理人裁决参数索引

| 裁决项 | 裁决值 | PRD对应章节 |
|--------|--------|------------|
| 1. 拍卖场模式 | 一口价购买 | §7.4 |
| 2. 解锁条件 | 声望≥300 | §7.1 |
| 3. 收藏品体系 | 千年翡翠50万/万年人参300万/百万年冰红茶3000万 | §7.5 |
| 4. 保护道具 | 御前圣令15万(max3)/免死金牌50万(max1) | §7.6 |
| 5. 黑市令拍卖 | 8000银两/个，100%出现，限购3个/次 | §7.7 |
| 6. 刷新机制 | 步数驱动，24/20/16/12步四档 | §7.2 |
| 7. 拍品池概率 | 收藏品25%/保护10%/黑市令15%/稀有30%/消耗包20% | §7.3 |
| 8. 稀有道具定价 | 溢价50% | §7.8 |
| 9. Non-goal修改 | "不做黑市内嵌拍卖；新增独立'聚宝阁'地点" | §12 |

---

> **文档结束**  
> 本 PRD v1.0 由析客（Specky）于 2026-07-22 撰写，基于竞析报告、数析报告、v2 PRD、v2.3 系统设计和游戏源码 data.js，所有参数均使用主理人裁决值。待主理人审核后进入开发阶段。
