// ============================================================
// 港男物語 — game logic + rendering (7 stages × 3 turns, 2–3 events per event phase)
// ============================================================

const $ = sel => document.querySelector(sel);
const rand = n => Math.floor(Math.random() * n);
const pick = arr => arr[rand(arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const shuffleArr = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const wpick = arr => { const tot = arr.reduce((t, x) => t + x.w, 0); let r = Math.random() * tot; for (const x of arr) { r -= x.w; if (r < 0) return x; } return arr[arr.length - 1]; };
const sign = v => (v > 0 ? '+' + v : '' + v);

const BENCH_MAX = 8;
const TURNS_PER_STAGE = 3;
const RING_COST = 1000;
const ITEM_BONUS = 5, ITEM_BONUS_MAX = 15, USE_BONUS = 20, VENUE_BONUS = 4;

let S = null;          // game state
let uid = 1;
let selected = null;   // selected location string

const stageDef = () => STAGES[S.stage];
// ---- 法寶 ----
const hasRelic = id => S.relics.includes(id);
const benchMax = () => BENCH_MAX + (hasRelic('bigbag') ? 2 : 0);
const timeMax = () => stageDef().time + (hasRelic('planner') ? 1 : 0);
const masteryEvery = () => (hasRelic('learner') ? 1 : MASTERY_EVERY);
const payday = v => Math.round(v * (hasRelic('payday') ? 1.15 : 1));
// before university you spend your parents' 零用錢; afterwards your own 💰
const isKid = () => S.stage <= 2;
const moneyIcon = () => (isKid() ? '🧧' : '💰');
const fmtPrice = v => `${isKid() ? '🧧' : '$'}${v}`;
const fmtMoneyFx = v => `${isKid() ? '零用錢' : '$'}${sign(v)}`;

// ---------------- cards ----------------
function makeCard(id, edition = null) { return { uid: uid++, id, edition, dur: CARDS[id].dur ?? null }; }
const def = card => CARDS[card.id];
function cardRequirement(card) {
  const d = def(card);
  if (d.requiresSport && !S.sports?.[d.requiresSport]) return `要先識${SPORT_NAMES[d.requiresSport]}：完成一回合相關用品練習或運動活動。`;
  if (d.requiresTeam && (S.teamTraining?.[d.requiresTeam] || 0) < NATIONAL_TEAM_TURNS) return `要先完成 ${NATIONAL_TEAM_TURNS} 回合${SPORT_NAMES[d.requiresTeam]}校隊訓練（而家 ${S.teamTraining?.[d.requiresTeam] || 0}）。`;
  if (d.requiresCard && !findCard(d.requiresCard)) return `要先持有珍藏品「${CARDS[d.requiresCard].name}」（盤上或後備區都可以）。`;
  return null;
}
function cardPrice(card) {
  const vip = venuesSelling(card.id).some(v => venueLevel(v) >= 3);
  return Math.round(def(card).price * (card.edition ? EDITIONS[card.edition].priceMul : 1) * (vip ? 0.8 : 1) * (S.relics?.includes('vip') ? 0.9 : 1));
}
function sellPrice(card) { return card.edition === 'dark' ? 0 : Math.floor(cardPrice(card) / 2); }
function inStage(id, st = S.stage) { const r = CARDS[id].st; return st >= r[0] && st <= r[1]; }

// ---------------- venues ----------------
const venuesInStage = () => Object.keys(VENUES).filter(v => S.stage >= VENUES[v].st[0] && S.stage <= VENUES[v].st[1]);
const venuesSelling = id => Object.keys(VENUES).filter(v => VENUES[v].items.includes(id));
function venueLevel(v) { const p = S.venues[v] || 0; let l = 0; LOYALTY.forEach((x, i) => { if (p >= x.min) l = i; }); return l; }
function bestVenue() {
  const vs = Object.keys(S.venues).filter(v => venueLevel(v) >= 1);
  return vs.length ? vs.sort((a, b) => S.venues[b] - S.venues[a])[0] : null;
}
function shopBoost(id) { return Math.max(0, ...venuesSelling(id).map(venueLevel)); }
function visitVenue(v, n = 1) {
  if (!v || !VENUES[v]) return null;
  const before = venueLevel(v);
  S.venues[v] = (S.venues[v] || 0) + n + (hasRelic('pathfinder') ? 1 : 0);
  const after = venueLevel(v);
  if (after > before) { const msg = `📍 ${VENUES[v].emoji}${VENUES[v].name} 升級做「${LOYALTY[after].name}」！`; log(msg); return msg; }
  return null;
}

// ---------------- new run ----------------
function newRun() {
  const finance = wpick(BACKGROUNDS.finance);
  const edu = wpick(BACKGROUNDS.edu);
  const happy = wpick(BACKGROUNDS.happy);
  const height = 158 + rand(25);   // genetic adult height; sport while growing adds up to GROWTH_MAX
  const face = 1 + rand(3);
  const overseas = Math.random() < 0.2;
  const district = pick(SCHOOL_DATA.districts).id;
  const nt = NT_DISTRICTS.includes(district);
  const housing = wpick(HOUSING.filter(h => h.w[finance.key] > 0 && (!h.nt || nt)).map(h => ({ ...h, w: h.w[finance.key] })));
  const bg = { finance, edu, happy, height, face, overseas, district, housing };

  const stats = {};
  for (const k of Object.keys(STATS)) stats[k] = 1 + rand(2);
  stats.brain += edu.brain;
  if (overseas) stats.talk += 2;
  stats.look += face - 1;

  S = {
    stage: 0, turn: 1, bg, flags: {}, stats, ecMax: happy.ecMax, ec: happy.ecMax,
    darkScore: 0, moonScore: 0, bought: 0,
    sports: {},
    teamTraining: {},
    money: finance.money, income: finance.allowance[0], sc: 1, growth: 0, venues: {}, perm: { energy: 0, allowance: 0 }, pref: {}, relics: [], uses: {},
    grids: { bag: [null, null, null, null], weekend: [null, null, null, null], weekday: [null, null, null, null], relic: [null, null, null, null] },
    bench: [], shop: [], rerollCost: 5, girls: [], target: null, partner: null, married: false, endPending: false,
    queue: [], qi: 0, used: [], eventTitles: {}, log: [], modal: null, romanceUsed: false,
  };
  S.grids.bag[0] = makeCard(finance.item);
  startStage(0, true);
  log(`新一鋪：${bg.finance.name}・${bg.housing.name}・${bg.edu.name}・${bg.happy.name}`);
  selected = null;
  render();
}

function scheduleLoad() {
  return placed().filter(p => p.grid === 'weekday' || p.grid === 'weekend')
    .reduce((t, p) => ({ time: t.time + (def(p.card).time || 0), energy: t.energy + (def(p.card).energy || 0) }), { time: 0, energy: 0 });
}

function startStage(i, first = false) {
  S.stage = i; S.turn = 1; S.used = [];
  const st = stageDef();
  // outgrown cards are auto-sold
  const gone = [];
  for (const cells of Object.values(S.grids)) cells.forEach((c, k) => { if (c && !inStage(c.id)) { gone.push(c); cells[k] = null; } });
  S.bench = S.bench.filter(c => { if (!inStage(c.id)) { gone.push(c); return false; } return true; });
  if (gone.length) {
    const refund = gone.reduce((t, c) => t + sellPrice(c), 0);
    S.money += refund;
    log(`你大個咗：${gone.map(c => def(c).emoji + def(c).name).join('、')} 收埋咗（退 ${fmtPrice(refund)}）`);
  }
  // starter cards: auto-place if a cell is free and the schedule has room, else bench
  const owned = new Set([...placed().map(p => p.card.id), ...S.bench.map(c => c.id)]);
  for (const id of st.starter) {
    if (owned.has(id)) continue;
    const card = makeCard(id);
    const load = scheduleLoad();
    const room = load.time + (CARDS[id].time || 0) <= timeMax() && load.energy + (CARDS[id].energy || 0) <= st.energy;
    const spot = room && CARDS[id].slot.map(g => [g, S.grids[g].indexOf(null)]).find(([, k]) => k >= 0);
    if (spot) S.grids[spot[0]][spot[1]] = card; else if (S.bench.length < benchMax()) S.bench.push(card);
  }
  // income
  if (i <= 2) S.income = S.bg.finance.allowance[i] + S.perm.allowance;
  else if (i === 3) {
    S.flags.edu = S.flags.edu || 'asso';
    S.income = SALARY[S.flags.edu] + S.bg.finance.support;
    log(`🧧 剩低嘅零用錢 $${S.money} 變成第一筆積蓄`);
    log(`📏 成年身高 ${finalHeight()}cm${S.growth ? `（運動多長咗 ${S.growth}cm）` : ''}`);
    if (finalHeight() >= 178) { S.stats.look += 1; log('📏 高佬：外表 +1'); }
  } else S.income += 150;
  if (!first) S.money += payday(S.income);
  S.rerollCost = st.reroll;
  S.romanceUsed = false;
  S.uses = {};   // 幸運星 / 請病假 reset every stage; 換貨券 / 免死金牌 reset every turn below
  rollShop();
  pickEvents();
  S.modal = { stage: 'chapter' };
}

function nextTurn() {
  if (S.turn < TURNS_PER_STAGE) {
    S.turn++;
    S.money += payday(S.income);
    log(`${isKid() ? '🧧 屋企俾零用錢' : '💰 出糧'} ${fmtPrice(payday(S.income))}`);
    rollShop();
    S.rerollCost = stageDef().reroll;
    S.romanceUsed = false;
    S.uses.coupon = false; S.uses.goldpass = false;
    pickEvents();
    S.modal = null;
  } else {
    // stage over: choose 1 of 3 法寶 before the next stage begins
    const pool = Object.keys(RELICS).filter(id => !S.relics.includes(id));
    if (pool.length) { S.modal = { stage: 'relic', options: shuffleArr(pool).slice(0, RELIC_CHOICES) }; return render(); }
    startStage(S.stage + 1);
  }
  render();
}
function takeRelic(id) {
  if (id) { S.relics.push(id); log(`獲得法寶 ${RELICS[id].emoji}${RELICS[id].name}`); }
  startStage(S.stage + 1);
  render();
}

// shop: draw the CATEGORY first (each of the 4 areas once + 2 random), then a card inside it.
// Within a category: rarity weight × (1 + venue 熟悉度 level). No duplicates in one shop; cards you own
// aren't offered; cards from the previous shop are less likely (fresh rerolls).
const SHOP_CATS = ['bag', 'weekday', 'weekend', 'relic'];
// 🖤 黑化率: 3% to start, +1% for every card you've ever bought (consumerism corrupts), capped at 30%
const DARK_BASE = 0.03, DARK_PER_BUY = 0.01, DARK_MAX = 0.30;
const darkChance = () => Math.min(DARK_MAX, DARK_BASE + DARK_PER_BUY * (S.bought || 0));
function rollShop() {
  const owned = new Set([...placed(), ...S.bench.map(card => ({ card }))].map(p => p.card.id));
  const prev = new Set((S.shop || []).filter(Boolean).map(c => c.id));
  const ids = Object.keys(CARDS).filter(id => inStage(id) && !CARDS[id].noshop && !stageDef().starter.includes(id)
    && !owned.has(id));   // never offer a card you already own (board or bench)
  const cats = [...shuffleArr(SHOP_CATS), pick(SHOP_CATS), pick(SHOP_CATS), ...(hasRelic('extraslot') ? [pick(SHOP_CATS)] : [])];
  const taken = new Set();
  S.shop = [];
  for (const cat of cats) {
    let pool = ids.filter(id => CARDS[id].slot.includes(cat) && !taken.has(id));
    if (!pool.length) pool = ids.filter(id => !taken.has(id));   // empty category → any category
    if (!pool.length) break;
    const id = wpick(pool.map(id => ({ id, w: RARITY[CARDS[id].rarity].weight * (1 + shopBoost(id)) * (prev.has(id) ? 0.3 : 1) }))).id;
    taken.add(id);
    const r = Math.random();
    const dc = darkChance();
    const ed = r < dc ? 'dark' : r < dc + 0.10 ? 'foil' : r < dc + 0.15 ? 'moon' : null;
    S.shop.push(makeCard(id, ed));
  }
  // keep the display in board order: 書包 → 平日 → 週末 → 珍藏
  S.shop.sort((x, y) => SHOP_CATS.indexOf(def(x).slot[0]) - SHOP_CATS.indexOf(def(y).slot[0]));
}

function log(msg) { S.log.unshift(`${stageDef().name}${S.turn}｜${msg}`); S.log = S.log.slice(0, 80); }

// ---------------- board helpers ----------------
function placed() {
  const out = [];
  for (const [g, cells] of Object.entries(S.grids)) {
    const [r0, c0] = GRIDS[g].origin;
    cells.forEach((card, i) => { if (card) out.push({ card, grid: g, idx: i, r: r0 + (i >> 1), c: c0 + (i & 1) }); });
  }
  return out;
}
function hasCard(s, id) { return placed().some(p => p.card.id === id); }
function boardTags() { const t = new Set(); placed().forEach(p => def(p.card).tags.forEach(x => t.add(x))); return t; }
function moonActive() { return placed().some(p => p.card.edition === 'moon'); }
function hasSpecial(sp) { return placed().some(p => def(p.card).special === sp); }
function luckBonus() {
  const p = placed().find(p => def(p.card).special === 'luck');
  if (!p) return 0;
  return p.card.edition === 'dark' ? 16 : p.card.edition === 'foil' ? 12 : 8;
}
// items in the 書包 whose tags match the stat being checked
function itemHelpers(stat) {
  const tags = STAT_TAGS[stat] || [];
  return placed().filter(p => p.grid === 'bag' && def(p.card).tags.some(t => tags.includes(t))).slice(0, ITEM_BONUS_MAX / ITEM_BONUS);
}
function findCard(id) {
  for (const cells of Object.values(S.grids)) { const k = cells.findIndex(c => c && c.id === id); if (k >= 0) return { cells, k }; }
  const b = S.bench.findIndex(c => c.id === id);
  return b >= 0 ? { cells: S.bench, k: b, bench: true } : null;
}
function removeCard(id) {
  const f = findCard(id); if (!f) return null;
  const card = f.cells[f.k];
  if (f.bench) f.cells.splice(f.k, 1); else f.cells[f.k] = null;
  return card;
}
function damageCard(id, n) {
  const f = findCard(id); if (!f) return null;
  const card = f.cells[f.k];
  if (card.dur === null || def(card).dur >= 99) return null;
  card.dur -= n;
  if (card.dur <= 0) { removeCard(id); return `💔 ${def(card).emoji}${def(card).name} 爛咗`; }
  return `🔧 ${def(card).emoji}${def(card).name} 耐久 -${n}`;
}
// gifted cards go straight into a free relic cell if they're relics, else the bench
function giveCard(id, edition = null) {
  const card = makeCard(id, edition);
  const k = CARDS[id].slot.includes('relic') ? S.grids.relic.indexOf(null) : -1;
  if (k >= 0) S.grids.relic[k] = card;
  else if (S.bench.length < benchMax()) S.bench.push(card);
  else { log('後備區滿咗，嘢冇位放'); return null; }
  return card;
}
// ---- 身高 ----
const curAge = () => TURN_AGES[S.stage][S.turn - 1];
const finalHeight = () => S.bg.height + S.growth;
const curHeight = () => Math.round(finalHeight() * (HEIGHT_FRAC[curAge()] || 1));
// still growing and doing sport this turn → +1cm to adult height
const growsThisTurn = () => S.stage <= 2 && S.growth < GROWTH_MAX && placed().some(p => (p.grid === 'weekday' || p.grid === 'weekend') && def(p.card).tags.includes('sport') && !cardRequirement(p.card));
function masteryLv(card) { return Math.min(MASTERY_MAX, Math.floor((card.xp || 0) / masteryEvery())); }
// who your romance cards act on: partner first, else target
function loveIdx() { return S.partner !== null ? S.partner : S.target; }

// ---------------- girls ----------------
function createGirl() {
  const used = new Set(S.girls.map(g => g.name));
  const name = pick(GIRL_NAMES.filter(n => !used.has(n))) || `神秘女子 ${S.girls.length}`;
  const arch = pick(ARCHETYPES.filter(a => a.minStage <= S.stage));
  const traits = Object.fromEntries(Object.entries(GIRL_TRAITS).map(([k, t]) => [k, pick(Object.keys(t.values))]));
  traits.history = Math.random() < (traits.commit === 'casual' ? 0.7 : 0.3) ? 'rich' : 'simple';
  S.girls.push({ name, emoji: pick(GIRL_EMOJI), arch, traits, aff: 0, revealed: [], ratings: [], metStage: S.stage, gone: false });
  const i = S.girls.length - 1;
  log(`認識咗 ${S.girls[i].emoji} ${name}（${arch.name}）`);
  if (hasRelic('mindread')) { revealOne(S.girls[i]); revealOne(S.girls[i]); }
  if (S.target === null && S.partner === null) S.target = i;
  return i;
}
// ---- 擇偶喜好 / 化學 ----
function traitKeys(g) { return [`arch:${g.arch.key}`, ...Object.entries(g.traits).filter(([k]) => S.stage >= (GIRL_TRAITS[k].fromStage || 0)).map(([k, v]) => `${k}:${v}`)]; }
function traitLabel(key) {
  const [k, v] = key.split(':');
  if (k === 'arch') return `${ARCHETYPES.find(a => a.key === v).name}`;
  return `${GIRL_TRAITS[k].name}${GIRL_TRAITS[k].values[v]}`;
}
function chem(g) { return clamp(Math.round(traitKeys(g).reduce((t, k) => t + (S.pref[k] || 0), 0) * CHEM_PER_WEIGHT), -50, 50); }
const chemMul = g => 1 + chem(g) / 100;
function pendingRating() {
  for (const { g, i } of activeGirls()) { const lv = g.ratings.length; if (lv < RATE_AT.length && g.aff >= RATE_AT[lv]) return { i, level: lv }; }
  return null;
}
// every "continue" button goes through here so a due rating interrupts first
function proceed(action) {
  if (S.endPending) return ending('married');
  const r = pendingRating();
  if (r) { S.modal = { stage: 'rate', girl: r.i, level: r.level, then: action, fav: null }; return render(); }
  if (action === 'event') return showEvent();
  if (action === 'nextev') return nextEvent();
  if (action === 'turn') return nextTurn();
  S.modal = null; render();
}
function rateGirl(stars) {
  const M = S.modal, g = S.girls[M.girl];
  const d = stars - 3;
  const changes = [];
  for (const k of traitKeys(g)) {
    const w = d * (k === M.fav ? 2 : 1) + (k === M.fav && d === 0 ? 1 : 0);
    if (!w) continue;
    S.pref[k] = clamp((S.pref[k] || 0) + w, -PREF_MAX, PREF_MAX);
    changes.push(`${traitLabel(k)} ${sign(w)}`);
  }
  g.ratings.push(stars);
  if (stars === 5) g.aff = clamp(g.aff + 3, 0, 100);
  if (stars === 1) g.aff = clamp(g.aff - 3, 0, 100);
  log(`評分 ${g.name}：${'★'.repeat(stars)}（${STAR_LABELS[stars]}）`);
  if (changes.length) flash(`擇偶喜好：${changes.join('、')}`);
  proceed(M.then);
}
function activeGirls() { return S.girls.map((g, i) => ({ g, i })).filter(x => !x.g.gone); }
function prefKeys(g) {
  const k = Object.keys(g.arch.prefs).map(s => 'stat:' + s);
  g.arch.likes.forEach(t => k.push('like:' + t));
  g.arch.dislikes.forEach(t => k.push('dislike:' + t));
  if (g.arch.tall) k.push('tall');
  if (g.arch.rich) k.push('rich');
  return k;
}
function prefLabel(g, key) {
  const [kind, v] = key.split(':');
  if (kind === 'stat') return `重視${STATS[v].name} ${'★'.repeat(g.arch.prefs[v])}`;
  if (kind === 'like') return `鍾意 ${TAG_NAMES[v]}`;
  if (kind === 'dislike') return `討厭 ${TAG_NAMES[v]}`;
  if (key === 'tall') return '鍾意高佬';
  if (key === 'rich') return '鍾意有錢仔';
  return key;
}
function revealOne(g) {
  const hidden = prefKeys(g).filter(k => !g.revealed.includes(k));
  if (!hidden.length) return null;
  const k = pick(hidden); g.revealed.push(k); return k;
}
function match(g) {
  const norm = stageDef().norm;
  let tot = 0, part = 0;
  for (const [k, w] of Object.entries(g.arch.prefs)) { tot += w; part += w * Math.min(S.stats[k] / norm, 1); }
  let score = part / tot * 70;
  const tags = boardTags();
  score += Math.min(30, g.arch.likes.filter(t => tags.has(t)).length * 12);
  score -= g.arch.dislikes.filter(t => tags.has(t)).length * 12;
  if (g.arch.tall && finalHeight() < 172) score -= 10;   // judged against your (projected) adult height, i.e. relative to peers
  if (g.arch.rich) score += S.bg.finance.key === 'rich' ? 10 : S.bg.finance.key === 'poor' ? -5 : 0;
  return Math.round(clamp(score, 0, 100));
}

// ---------------- romance actions ----------------
function confessChance(g) { return clamp(Math.round(g.aff * 0.8 + match(g) * 0.3 - 20 + chem(g) / 4 + (hasCard(S, 'letter') ? 15 : 0) + (hasRelic('charmer') ? 10 : 0) + luckBonus()), 3, 95); }
// 條件：有樓、有積蓄都會令佢更願意嫁（即使佢唔係好鍾意你）
function providerBonus() { return (S.flags.flat ? 8 : 0) + Math.min(10, Math.floor(Math.max(0, S.money) / 1000) * 2); }
function proposeChance(g) { return clamp(Math.round(g.aff * 0.9 + match(g) * 0.2 - 30 + chem(g) / 4 + providerBonus() + (hasRelic('charmer') ? 10 : 0) + luckBonus()), 5, 95); }
function canConfess(i) { return stageDef().romance && S.partner === null && S.girls[i].aff >= 40 && !S.romanceUsed; }
function canPropose(i) { return S.partner === i && !S.married && S.stage >= 3 && S.girls[i].aff >= 70 && S.money >= RING_COST && !S.romanceUsed; }

function confess(i) {
  if (!canConfess(i)) return;
  const g = S.girls[i];
  S.romanceUsed = true;
  const ok = Math.random() * 100 < confessChance(g);
  if (ok) { S.partner = i; S.target = i; g.aff = clamp(g.aff + 10, 0, 100); log(`向 ${g.name} 表白成功！`); }
  else { g.aff = clamp(g.aff - 12, 0, 100); S.ec -= 3; log(`向 ${g.name} 表白失敗`); }
  S.modal = { stage: 'romance', ok, title: ok ? '拍拖喇！💑' : '好人卡 🃏',
    text: ok ? `${g.name} 答應咗你！佢而家喺你嘅 <b>伴侶欄</b>。<br>記住要陪佢（溝女／睇戲／旅行），否則好感會跌。`
             : `${g.name}：「你係好人，但係……」<br>好感 -12、情緒 -3。` };
  if (S.ec <= 0) return ending('burnout');
  render();
}
function propose(i) {
  if (!canPropose(i)) return;
  const g = S.girls[i];
  S.romanceUsed = true;
  const ok = Math.random() * 100 < proposeChance(g);
  if (ok) { S.money -= RING_COST; marry(); g.aff = clamp(g.aff + 15, 0, 100); log(`同 ${g.name} 結婚！`); }
  else { g.aff = clamp(g.aff - 10, 0, 100); S.ec -= 3; log('求婚失敗'); }
  S.modal = { stage: 'romance', ok, title: ok ? '結婚喇！💍' : '佢話「再諗下」…',
    text: ok ? `${g.name} 答應咗！💍<br>你哋決定結婚——呢一鋪人生嘅結局到喇。` : '佢未準備好。好感 -10、情緒 -3。（戒指冇買）' };
  if (S.ec <= 0) return ending('burnout');
  render();
}
// marriage ends the run: the ending fires on the next "continue"
function marry() { S.married = true; S.endPending = true; }
function breakup(reason = '你提出分手') {
  if (S.partner === null) return '';
  const g = S.girls[S.partner];
  const wasMarried = S.married;
  g.aff = 5;
  S.partner = null; S.married = false;
  S.ec -= wasMarried ? 5 : 3;
  if (wasMarried) S.sc = Math.max(0, S.sc - 2);
  log(`${wasMarried ? '離婚' : '分手'}：${g.name}（${reason}）`);
  return `${wasMarried ? '💔 離婚' : '💔 分手'}：${g.name}——${reason}`;
}

// ---------------- effects ----------------
function emptyFx() { return { stats: {}, money: 0, ec: 0, sc: 0, aff: 0 }; }
function mulFx(fx, edition) {
  const m = edition === 'foil' ? 1.5 : edition === 'dark' ? 2 : 1;
  const f = v => (v > 0 ? Math.ceil(v * m) : v);
  const out = { stats: {} };
  for (const [k, v] of Object.entries(fx.stats || {})) out.stats[k] = f(v);
  for (const k of ['money', 'ec', 'sc', 'aff']) if (fx[k]) out[k] = f(fx[k]);
  return out;
}
function addFx(t, fx) {
  for (const [k, v] of Object.entries(fx.stats || {})) t.stats[k] = (t.stats[k] || 0) + v;
  for (const k of ['money', 'ec', 'sc', 'aff']) if (fx[k]) t[k] += fx[k];
}
function fxText(fx) {
  const p = [];
  for (const [k, v] of Object.entries(fx.stats || {})) if (v) p.push(`${STATS[k].name}${sign(v)}`);
  if (fx.money) p.push(fmtMoneyFx(fx.money));
  if (fx.ec) p.push(`情緒${sign(fx.ec)}`);
  if (fx.energy) p.push(`⚡精力上限${sign(fx.energy)}`);
  if (fx.sc) p.push(`人脈${sign(fx.sc)}`);
  if (fx.aff) p.push(`好感${sign(fx.aff)}`);
  if (fx.paff) p.push(`伴侶好感${sign(fx.paff)}`);
  if (fx.affAll) p.push(`全部女仔好感${sign(fx.affAll)}`);
  if (fx.income) p.push(`收入/回合${sign(fx.income)}`);
  if (fx.item) p.push(`獲得 ${CARDS[fx.item].emoji}${CARDS[fx.item].name}`);
  if (fx.venueItem) p.push(`獲得場地道具${fx.venueItem === 'dark' ? '（🖤）' : ''}`);
  if (fx.loseItem) p.push(`失去 ${CARDS[fx.loseItem].emoji}${CARDS[fx.loseItem].name}`);
  if (fx.damage) for (const [id, n] of Object.entries(fx.damage)) p.push(`${CARDS[id].emoji}耐久-${n}`);
  if (fx.upgrade) p.push(`${CARDS[fx.upgrade.id].emoji} 變 ${EDITIONS[fx.upgrade.ed].icon}${EDITIONS[fx.upgrade.ed].name}`);
  if (fx.loyalty) for (const [v, n] of Object.entries(fx.loyalty)) p.push(`📍${VENUES[v].name}熟悉度+${n}`);
  if (fx.reveal) p.push('得知一項喜好');
  if (fx.marry) p.push('💍 結婚');
  if (fx.breakup) p.push('💔 分手');
  if (fx.gone) p.push('佢離開咗你嘅人生');
  if (fx.meetNew) p.push('認識新女仔');
  if (fx.flag) for (const [k, v] of Object.entries(fx.flag)) {
    if (k === 'primary') p.push(`小學：${v}`);
    if (k === 'school') p.push(`中學：${v.name}`);
    if (k === 'edu') p.push(`學歷：${EDU_NAMES[v]}`);
  }
  return p.join('　');
}

function partMatch(card, part) { const [kind, v] = part.split(':'); return kind === 'id' ? card.id === v : def(card).tags.includes(v); }
function activeCombos() {
  const ps = placed();
  const out = [];
  for (const cb of COMBOS) {
    const as = ps.filter(p => partMatch(p.card, cb.a) && (!cb.aItemOnly || p.grid === 'bag'));
    const bs = ps.filter(p => partMatch(p.card, cb.b));
    let found = false, adj = false;
    for (const a of as) for (const b of bs) {
      if (a.card.uid === b.card.uid) continue;
      found = true;
      if (Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1) adj = true;
    }
    if (found) out.push({ combo: cb, adj });
  }
  return out;
}
function combosFor(cardId) {
  const tags = CARDS[cardId].tags;
  const hit = part => { const [k, v] = part.split(':'); return k === 'id' ? v === cardId : tags.includes(v); };
  return COMBOS.filter(c => hit(c.a) || hit(c.b));
}

function partnerFx() {
  if (S.partner === null) return null;
  const g = S.girls[S.partner];
  return {
    stats: { ...(g.arch.perk.stats || {}) },
    money: -Math.round(stageDef().partnerCost * (S.married ? 1.5 : 1)) + (g.arch.perk.money || 0),
    ec: (S.married ? 3 : 2) + (g.arch.perk.ec || 0), sc: g.arch.perk.sc || 0, aff: 0,
  };
}

// Pure: what will this turn's schedule do?
function computeWeek() {
  const st = stageDef();
  const t = emptyFx();
  const lines = [];
  let time = 0, energy = 0, energyBonus = 0, reveals = 0, apps = 0, blinds = 0, invests = 0;
  const visits = {}, grows = [];
  const editionScores = { dark: 0, moon: 0 };
  const sportsLearned = new Set();
  const teamPractice = new Set();
  const li = loveIdx();
  const g = li === null ? null : S.girls[li];
  const m = g ? match(g) : 0;
  for (const p of placed()) {
    const d = def(p.card);
    const requirement = cardRequirement(p.card);
    if (requirement) { lines.push(`${d.emoji} ${d.name}：${requirement}`); continue; }
    if (d.trainsSport) sportsLearned.add(d.trainsSport);
    if (p.card.edition === 'dark' || p.card.edition === 'moon') editionScores[p.card.edition]++;
    const scheduled = p.grid === 'weekday' || p.grid === 'weekend';
    if (scheduled && d.trainsTeam) teamPractice.add(d.trainsTeam);
    if (scheduled) { time += d.time || 0; energy += d.energy || 0; if (d.venue) visits[d.venue] = (visits[d.venue] || 0) + 1; }
    if (d.fx.energy) energyBonus += d.fx.energy;
    if (d.special === 'date' && !(g && g.aff >= 25)) { lines.push(`${d.emoji} ${d.name}：${g ? g.name + ' 話冇空（好感未夠 25）' : '未有目標'}`); continue; }
    if (d.special === 'pursue' && !g) { lines.push(`${d.emoji} ${d.name}：未有目標`); continue; }
    const fx = mulFx(d.fx, p.card.edition);
    const lv = scheduled ? masteryLv(p.card) : 0;
    if (lv && d.fx.stats) { const main = Object.keys(d.fx.stats)[0]; fx.stats[main] = (fx.stats[main] || 0) + lv; }
    if (d.special === 'interest') fx.money = (fx.money || 0) + mulFx({ money: Math.min(d.cap, Math.floor(Math.max(0, S.money) * d.rate)) }, p.card.edition).money;
    if (d.special === 'network') fx.money = (fx.money || 0) + S.sc * 10;
    if (d.grow && (scheduled || p.grid === 'relic')) {
      const [k, v] = Object.entries(d.grow)[0];
      const left = d.growMax - (p.card.grown || 0);
      if (left > 0) grows.push({ card: p.card, k, v: Math.min(v, left) });
    }
    if (d.special === 'pursue') { fx.aff = (fx.aff || 0) + Math.round(mulFx({ aff: 2 + Math.floor(m / 15) }, p.card.edition).aff * chemMul(g)); reveals++; }
    if (d.special === 'date') fx.aff = (fx.aff || 0) + Math.round(mulFx({ aff: 6 + Math.floor(m / 12) }, p.card.edition).aff * chemMul(g));
    if (d.special === 'app') apps++;
    if (d.special === 'blind') blinds++;
    if (d.special === 'invest') invests++;
    if (p.card.edition === 'dark') fx.ec = (fx.ec || 0) - 1;
    addFx(t, fx);
    const txt = fxText(fx);
    if (txt) lines.push(`${d.emoji} ${d.name}${p.card.edition ? EDITIONS[p.card.edition].icon : ''}${lv ? ` Lv${lv}` : ''}：${txt}`);
  }
  for (const { combo, adj } of activeCombos()) {
    const fx = mulFx(combo.fx, null);
    if (adj) { for (const k in fx.stats) fx.stats[k] *= 2; for (const k of ['money', 'ec', 'sc', 'aff']) if (fx[k]) fx[k] *= 2; }
    addFx(t, fx);
    lines.push(`🔗 ${combo.name}${adj ? '（相鄰 ×2）' : ''}：${fxText(fx)}`);
  }
  const pf = partnerFx();
  if (pf) { addFx(t, pf); lines.push(`💞 伴侶欄 ${S.girls[S.partner].name}：${fxText(pf)}`); }
  if (st.living) { const lf = { money: -Math.round(st.living * (S.flags.flat ? 0.6 : 1)) }; addFx(t, lf); lines.push(`🏠 生活開支（${S.flags.flat ? '供樓' : '租金'}・家用）：${fxText(lf)}`); }
  if (st.decay) { const df = { stats: Object.fromEntries(Object.entries(st.decay).map(([k, v]) => [k, -v])) }; addFx(t, df); lines.push(`⏳ 新陳代謝：${fxText(df)}`); }
  if (!g) t.aff = 0;
  // ⚡ energy: leftover recovers 情緒, overspending burns it
  const energyMax = st.energy + energyBonus + S.perm.energy + (hasRelic('redbull') ? 1 : 0);
  if (energy > energyMax) { const o = (energy - energyMax) * 2; t.ec -= o; lines.push(`😵 精力透支 ${energy - energyMax}：情緒-${o}`); }
  else { const rest = Math.floor((energyMax - energy) / 2); if (rest) { t.ec += rest; lines.push(`😴 精力有剩，休息：情緒+${rest}`); } }
  if (growsThisTurn()) lines.push(`📏 運動幫手長高：成年身高 +1cm（${S.growth + 1}/${GROWTH_MAX}）`);
  for (const gr of grows) lines.push(`📈 ${def(gr.card).emoji}${def(gr.card).name}：永久 ${GROW_NAMES[gr.k]} +${gr.v}（${(gr.card.grown || 0) + gr.v}/${def(gr.card).growMax}）`);
  return { fx: t, lines, time, energy, energyMax, reveals, apps, blinds, invests, visits, grows, editionScores, sportsLearned: [...sportsLearned], teamPractice: [...teamPractice] };
}

// apply an fx object. girlIdx = the event's girl, venue = the event's venue
function applyFx(fx, girlIdx, venue) {
  const notes = [];
  for (const [k, v] of Object.entries(fx.stats || {})) S.stats[k] = Math.max(0, S.stats[k] + v);
  if (fx.money) S.money += fx.money;
  if (fx.ec) S.ec = Math.min(S.ecMax, S.ec + fx.ec);
  if (fx.sc) S.sc = Math.max(0, S.sc + fx.sc);
  if (fx.income) S.income = Math.max(0, S.income + fx.income);
  if (fx.flag) {
    const flags = { ...fx.flag };
    notes.push(...schoolPlacementNotes(flags, S.bg));
    Object.assign(S.flags, flags);
  }
  const gi = girlIdx ?? loveIdx();
  const hasGirl = gi !== null && gi !== undefined;
  if (fx.aff && hasGirl) S.girls[gi].aff = clamp(S.girls[gi].aff + fx.aff, 0, 100);
  if (fx.paff && S.partner !== null) S.girls[S.partner].aff = clamp(S.girls[S.partner].aff + fx.paff, 0, 100);
  if (fx.affAll) activeGirls().forEach(({ g }) => { g.aff = clamp(g.aff + fx.affAll, 0, 100); });
  if (fx.item) giveCard(fx.item);
  if (fx.venueItem && venue) {
    const ids = VENUES[venue].items.filter(id => inStage(id) && !CARDS[id].noshop && CARDS[id].slot.some(s => s === 'bag' || s === 'relic'));
    const pool = ids.length ? ids : VENUES[venue].items.filter(id => inStage(id) && !CARDS[id].noshop);
    if (pool.length) { const c = giveCard(pick(pool), fx.venueItem === 'dark' ? 'dark' : null); if (c) notes.push(`獲得 ${def(c).emoji}${def(c).name}`); }
  }
  if (fx.loseItem) { const c = removeCard(fx.loseItem); if (c) notes.push(`失去 ${def(c).emoji}${def(c).name}`); }
  if (fx.damage) for (const [id, n] of Object.entries(fx.damage)) { const m = damageCard(id, n); if (m) notes.push(m); }
  if (fx.upgrade) { const f = findCard(fx.upgrade.id); if (f) f.cells[f.k].edition = fx.upgrade.ed; }
  if (fx.loyalty) for (const [v, n] of Object.entries(fx.loyalty)) { const m = visitVenue(v, n); if (m) notes.push(m); }
  if (fx.reveal && hasGirl) revealOne(S.girls[gi]);
  if (fx.meetNew) createGirl();
  if (fx.marry && hasGirl) { S.partner = gi; S.target = gi; marry(); }
  if (fx.breakup) breakup('事件');
  if (fx.gone && hasGirl) {
    S.girls[gi].gone = true;
    if (S.target === gi) S.target = null;
    if (S.partner === gi) { S.partner = null; S.married = false; }
  }
  return notes;
}

// ---------------- turn flow ----------------
function startWeek() {
  // A settled schedule counts once. Previewing or clicking during the report cannot add points.
  if (S.modal) return;
  const res = computeWeek();
  if (res.time > timeMax()) return;
  applyFx(res.fx);
  const lines = [...res.lines];
  S.darkScore = (S.darkScore || 0) + res.editionScores.dark;
  S.moonScore = (S.moonScore || 0) + res.editionScores.moon;
  if (res.editionScores.dark) lines.push(`🖤 黑化分 +${res.editionScores.dark}（累積 ${S.darkScore}）`);
  if (res.editionScores.moon) lines.push(`🌙 月讀分 +${res.editionScores.moon}（累積 ${S.moonScore}）`);
  const li = loveIdx();
  const g = li === null ? null : S.girls[li];
  for (let i = 0; i < res.reveals && g; i++) { const k = revealOne(g); if (k) lines.push(`🔍 得知 ${g.name}：${prefLabel(g, k)}`); }
  if (g && moonActive()) prefKeys(g).forEach(k => { if (!g.revealed.includes(k)) g.revealed.push(k); });
  for (let i = 0; i < res.apps; i++) if (Math.random() < 0.5) { const n = createGirl(); lines.push(`📲 配對成功：${S.girls[n].emoji} ${S.girls[n].name}（${S.girls[n].arch.name}）`); }
  for (let i = 0; i < res.blinds; i++) { const n = createGirl(); S.girls[n].aff = 5; lines.push(`💐 相親認識：${S.girls[n].emoji} ${S.girls[n].name}（${S.girls[n].arch.name}）`); }
  for (let i = 0; i < res.invests; i++) { const d = (rand(10) - 3) * 100; S.money += d; lines.push(`📈 股票：$${sign(d)}`); }
  if (stageDef().energyDecay && S.perm.energy > 0) { S.perm.energy = Math.max(0, S.perm.energy - stageDef().energyDecay); lines.push(`⏳ 體力走下坡：永久 ⚡精力 -${stageDef().energyDecay}`); }
  if (growsThisTurn()) S.growth++;
  for (const gr of res.grows) {
    gr.card.grown = (gr.card.grown || 0) + gr.v;
    if (gr.k === 'energy') S.perm.energy += gr.v;
    if (gr.k === 'ecMax') { S.ecMax += gr.v; S.ec += gr.v; }
    if (gr.k === 'income') S.income += gr.v;
    if (gr.k === 'allowance') { S.perm.allowance += gr.v; S.income += gr.v; }
  }
  for (const p of placed()) {
    if ((p.grid !== 'weekday' && p.grid !== 'weekend') || !def(p.card).fx.stats || cardRequirement(p.card)) continue;
    const before = masteryLv(p.card);
    p.card.xp = (p.card.xp || 0) + 1;
    if (masteryLv(p.card) > before) lines.push(`🎓 ${def(p.card).emoji}${def(p.card).name} 熟練度升到 Lv${masteryLv(p.card)}（${STATS[Object.keys(def(p.card).fx.stats)[0]].name}再 +1）`);
  }
  S.sports ||= {};
  for (const sport of res.sportsLearned) {
    if (!S.sports[sport]) lines.push(`🏅 學識${SPORT_NAMES[sport]}，可以參加相應校隊。`);
    S.sports[sport] = true;
  }
  S.teamTraining ||= {};
  for (const sport of res.teamPractice) {
    S.teamTraining[sport] = (S.teamTraining[sport] || 0) + 1;
    const progress = S.teamTraining[sport];
    lines.push(`🏅 ${SPORT_NAMES[sport]}校隊訓練累積 ${progress} 回合${progress === NATIONAL_TEAM_TURNS ? '，港隊活動已解鎖！' : ''}`);
  }
  for (const [v, n] of Object.entries(res.visits)) { lines.push(`📍 ${VENUES[v].emoji}${VENUES[v].name} 熟悉度 +${n}`); const m = visitVenue(v, n); if (m) lines.push(m); }
  // durability
  S.grids.bag.forEach((card, i) => {
    if (!card || card.dur === null) return;
    card.dur--;
    if (card.dur <= 0) { lines.push(`💔 ${def(card).emoji}${def(card).name} 爛咗`); S.grids.bag[i] = null; }
  });
  // affection decay
  const keepAll = hasSpecial('nodecay');
  activeGirls().forEach(({ g: gg, i }) => {
    if (i === S.partner) gg.aff = Math.max(0, gg.aff - Math.max(0, Math.ceil((S.married ? 2 : 3) / (hasSpecial('nodecay_partner') ? 2 : 1)) + (chem(gg) >= 25 ? -1 : chem(gg) <= -25 ? 1 : 0)));
    else if (!keepAll && gg.aff > 0) gg.aff--;
  });
  if (S.partner !== null && S.girls[S.partner].aff < 15) lines.push(breakup('佢覺得你冷落咗佢（好感 < 15）'));
  if (S.money < 0) { lines.push(`💸 冇錢！${isKid() ? '問屋企借' : '借錢周轉'}，情緒-2`); S.ec -= 2; S.money = 0; }
  log(`回合結算 ${fxText(res.fx)}`);
  selected = null;
  if (S.ec <= 0) return ending('burnout');
  S.modal = { stage: 'report', lines };
  render();
}

function eligible(ev) {
  if (ev === 'finale') return true;
  if (ev.when && !ev.when(S)) return false;
  if (ev.needPartner && S.partner === null) return false;
  if (ev.needGirl && loveIdx() === null) return false;
  if (ev.needItem && !hasCard(S, ev.needItem)) return false;
  return true;
}
const FILLER = { id: 'filler', title: '平淡嘅日子', emoji: '☁️', text: s => '呢排冇乜特別事發生。', choices: s => [{ label: '休息下', ok: { ec: 2, text: '叉咗電。' } }] };

function eventPool() {
  return [...STAGE_EVENTS[S.stage].pool, ...SHARED_EVENTS.filter(e => S.stage >= e.st[0] && S.stage <= e.st[1])];
}
function pickOne(preferMeet = false) {
  let cands = eventPool().filter(e => !S.used.includes(e.id) && !S.queue.includes(e) && eligible(e));
  if (preferMeet && cands.some(e => e.meet === 'new')) cands = cands.filter(e => e.meet === 'new');
  // item events are the most interesting when they can happen: give them extra weight
  const ev = cands.length ? wpick(cands.map(e => ({ e, w: e.needItem ? 3 : 1 }))).e : FILLER;
  if (ev !== FILLER) S.used.push(ev.id);
  return ev;
}
// 2–3 events per event phase; the 3rd turn of a stage ends with its milestone
function pickEvents() {
  S.queue = []; S.qi = 0;
  const n = 2 + (Math.random() < 0.4 ? 1 : 0);
  const randoms = S.turn === TURNS_PER_STAGE ? n - 1 : n;
  for (let i = 0; i < randoms; i++) S.queue.push(pickOne(S.turn === 1 && i === 0));
  if (S.turn === TURNS_PER_STAGE) S.queue.push(STAGE_EVENTS[S.stage].milestone);
}
const evLabel = ev => (ev === 'finale' ? '🎂 四十歲' : `${ev.emoji} ${ev.title}`);

function showEvent() {
  if (!eligible(S.queue[S.qi])) S.queue[S.qi] = pickOne();
  const ev = S.queue[S.qi];
  const key = `${S.stage}-${S.turn}`;
  (S.eventTitles[key] ||= []).push(evLabel(ev));
  if (ev === 'finale') return ending('life');
  const venue = typeof ev.venue === 'function' ? ev.venue(S) : ev.venue || null;
  const arrive = venue ? visitVenue(venue, 1) : null;
  let girl = null;
  if (ev.meet === 'new') girl = createGirl();
  else if (ev.meet === 'settler') {
    // an old acquaintance who's "played enough": prefer someone you know with a rich 情史
    const c = activeGirls().filter(x => x.i !== S.partner && x.g.traits.history === 'rich');
    girl = c.length ? pick(c).i : createGirl();
    const g = S.girls[girl];
    g.traits.history = 'rich'; g.traits.commit = 'casual';
    g.aff = Math.max(g.aff, 60);
  }
  else if (ev.meet === 'old') {
    const old = activeGirls().filter(x => x.i !== S.partner);
    const earlier = old.filter(x => x.g.metStage < S.stage);
    const c = earlier.length ? pick(earlier) : old.length ? pick(old) : null;
    girl = c ? c.i : createGirl();
  } else if (ev.needPartner) girl = S.partner;
  else girl = loveIdx();
  S.modal = { stage: 'event', ev, girl, venue, arrive, choices: ev.choices(S) };
  render();
}

// success chance + where it comes from
function choiceInfo(c, venue) {
  const parts = [];
  let p;
  if (c.stat) p = 50 + (S.stats[c.stat] - (c.diff + stageDef().diffAdd)) * 8;
  else if (c.chance) p = c.chance;
  else return { p: 100, parts };
  const add = (label, v) => { if (v) { p += v; parts.push(`${label} ${sign(v)}%`); } };
  if (c.stat) itemHelpers(c.stat).forEach(h => add(def(h.card).emoji, ITEM_BONUS));
  if (c.use && hasCard(S, c.use)) add(`用${CARDS[c.use].emoji}`, USE_BONUS);
  if (venue && venueLevel(venue)) add(`📍${LOYALTY[venueLevel(venue)].name}`, VENUE_BONUS * venueLevel(venue));
  add('🧧靈符', luckBonus());
  if (c.bonus) add('背景', c.bonus(S));
  return { p: clamp(Math.round(p), 5, 95), parts };
}
function choiceBlocked(c) {
  if (c.use && !c.useOptional && !hasCard(S, c.use)) return `要擺好 ${CARDS[c.use].emoji}${CARDS[c.use].name}`;
  if (c.req && !c.req(S)) return c.reqText;
  if (c.cost?.money && S.money < c.cost.money) return isKid() ? '零用錢唔夠' : '唔夠錢';
  if (c.cost?.sc && S.sc < c.cost.sc) return '人脈唔夠';
  return null;
}
function choose(i, force = false) {
  const { ev, girl, venue, choices } = S.modal;
  const c = choices[i];
  if (choiceBlocked(c)) return;
  if (c.cost?.money) S.money -= c.cost.money;
  if (c.cost?.sc) S.sc -= c.cost.sc;
  const p = choiceInfo(c, venue).p;
  let ok = force || Math.random() * 100 < p;
  const notes0 = [];
  if (force) { S.uses.goldpass = true; notes0.push('🛡️ 免死金牌：直接成功'); }
  if (!ok && (c.stat || c.chance) && hasRelic('star') && !S.uses.star) {
    S.uses.star = true;
    ok = Math.random() * 100 < p;
    notes0.push(`🍀 幸運星：失敗後重擲 → ${ok ? '成功！' : '都係失敗'}`);
  }
  const out = ok ? c.ok : (c.fail || c.ok);
  const name = girl !== null && girl !== undefined ? S.girls[girl].name : '';
  const notes = [...notes0];
  if (c.use && hasCard(S, c.use)) { const m = damageCard(c.use, 1); if (m) notes.push(m); }
  notes.push(...applyFx(out, girl, venue));
  log(`${ev.title}：${c.label} → ${ok ? '成功' : '失敗'}`);
  S.modal = { stage: 'outcome', ev, venue, ok: ok || !c.fail, hadCheck: c.stat || c.chance,
    text: fill(out.text, name, venue), fxt: fxText(out), notes };
  if (S.ec <= 0) return ending('burnout');
  render();
}
function nextEvent() { S.qi++; showEvent(); }
function skipEvent() {
  S.uses.skip = true;
  log(`🤒 請病假：略過「${S.modal.ev.title}」`);
  S.modal = { stage: 'outcome', ev: S.modal.ev, venue: null, ok: true, hadCheck: false, text: '你請咗病假，呢件事就咁過咗。', fxt: '', notes: [] };
  render();
}

// ---------------- endings ----------------
// The run ends when you marry (from 22 onwards) or on your 40th birthday if you never did.
function lifeScore() {
  const statSum = Object.values(S.stats).reduce((a, b) => a + b, 0);
  const p = S.partner !== null ? S.girls[S.partner] : null;
  const parts = S.married ? [
    [S.flags.settled ? '被埋單' : '結婚', S.flags.settled ? 25 : 40],
    ['化學', Math.round(chem(p) / 2.5)],
    ['好感', Math.floor(p.aff / 10)],
    ['契合', Math.floor(match(p) / 10)],
  ] : [['感情', p ? 15 : 0]];
  parts.push(
    ['財富', Math.min(20, Math.floor(Math.max(0, S.money) / 600))],
    ['心情', Math.round(S.ec / S.ecMax * 10)],
    ['人脈', Math.min(10, Math.floor(S.sc / 3))],
    ['能力', Math.min(20, Math.floor(statSum / 15))],
  );
  return { parts, total: parts.reduce((a, [, v]) => a + v, 0), max: 140 };
}
const WED_AGE = ['', '', '', '二十出頭就定落嚟。', '趕喺三十歲前。', '三十幾歲，終於等到。', '四十歲先搵到——遲到好過冇到。'];
function marriedTitle(p) {
  const c = chem(p);
  if (S.flags.shotgun) return ['奉子成婚 👶', `兩條線改寫咗你哋嘅人生。${c >= 10 ? '好彩，你哋真係啱。' : '希望你哋慢慢會啱。'}`];
  if (c >= 25 && p.aff >= 80) return ['真愛 💖', `${p.name} 就係你一直鍾意嘅類型。你哋嘅化學反應，連旁人都睇得出。`];
  if (c >= 10) return ['幸福美滿 💑', `你同 ${p.name} 好啱傾，日子會好好過。`];
  if (c <= -10) return ['將就 😐', `老實講，${p.name} 從來都唔係你杯茶。你係咪怕咗孤獨終老？`];
  return ['平平淡淡先係真 🍵', `冇轟轟烈烈，但 ${p.name} 一直喺度。`];
}
function singleTitle() {
  if (S.partner !== null) return ['長跑情侶 🏃', '拍咗好耐拖，就係未結婚。'];
  if (S.money >= 8000) return ['鑽石王老五 💎', '有錢、有自由。就係……冇人陪。'];
  if (S.sc >= 40) return ['老友記之王 🍻', '單身，但兄弟永遠喺度。'];
  return ['中年毒L 🎮', '四十歲，一個人，一部遊戲機。'];
}
function ending(kind) {
  S.endPending = false;
  if (kind === 'burnout') {
    S.modal = { stage: 'ending', kind, title: '情緒崩潰 💥', text: `你喺 <b>${stageDef().name}（${stageDef().age}）</b> 頂唔順，情緒值歸零。<br><br>記住：時間表塞得太滿，人會頂唔順。` };
  } else if (kind === 'married') {
    const p = S.girls[S.partner];
    // 埋單：佢揀咗你做老實人——佢唔係真係鍾意你（契合低），係睇中你嘅條件
    if (S.flags.settled || (!S.flags.shotgun && match(p) < 35 && (S.flags.flat || S.money >= 3000))) {
      S.flags.settled = true;
      S.modal = { stage: 'ending', kind: 'settled', title: '埋單 🧾', score: lifeScore(),
        text: `${stageDef().turns[S.turn - 1]}，${p.name} 玩夠咗，揀咗你呢個老實人埋單。<br>佢睇中嘅係你${S.flags.flat ? '層樓' : '嘅積蓄'}同穩定——至於鍾唔鍾意你……${chem(p) >= 10 ? '起碼你係鍾意佢嘅。' : '你哋都心知肚明。'}` };
      return render();
    }
    const [title, text] = marriedTitle(p);
    const sweet = p.metStage <= 1 ? `<br>由${STAGES[p.metStage].name}識到而家——青梅竹馬。` : '';
    S.modal = { stage: 'ending', kind: 'win', title, score: lifeScore(),
      text: `💍 ${stageDef().turns[S.turn - 1]}，你同 ${p.emoji} <b>${p.name}</b>（${p.arch.name}）結婚。${WED_AGE[S.stage]}${sweet}<br><br>${text}` };
  } else {
    const [title, text] = singleTitle();
    S.modal = { stage: 'ending', kind, title, score: lifeScore(), text: `四十歲生日，你仲係單身。<br><br>${text}` };
  }
  render();
}

// ---------------- moving cards ----------------
function getAt(loc) {
  const [kind, a, b] = loc.split(':');
  if (kind === 'bench') return S.bench[+a] || null;
  if (kind === 'grid') return S.grids[a][+b];
  if (kind === 'shop') return S.shop[+a] || null;
  return null;
}
function setAt(loc, card) {
  const [kind, a, b] = loc.split(':');
  if (kind === 'bench') { if (card) S.bench[+a] = card; else S.bench.splice(+a, 1); }
  if (kind === 'grid') S.grids[a][+b] = card;
}
function fits(card, loc) {
  const [kind, g] = loc.split(':');
  if (kind === 'bench') return true;
  if (kind === 'grid') return def(card).slot.includes(g) && !cardRequirement(card);
  return false;
}
function buy(i) {
  const card = S.shop[i];
  if (!card) return null;
  const price = cardPrice(card);
  if (S.money < price) { flash(isKid() ? '零用錢唔夠！' : '唔夠錢！'); return null; }
  if (S.bench.length >= benchMax()) { flash('後備區滿咗！先賣走啲嘢。'); return null; }
  S.money -= price;
  S.bought = (S.bought || 0) + 1;
  S.shop[i] = null;
  S.bench.push(card);
  log(`買咗 ${def(card).emoji}${def(card).name} ${fmtPrice(price)}`);
  return `bench:${S.bench.length - 1}`;
}
function sell(loc) {
  const card = getAt(loc);
  if (!card || loc.startsWith('shop')) return;
  const p = sellPrice(card);
  S.money += p;
  setAt(loc, null);
  log(`賣咗 ${def(card).emoji}${def(card).name} ${fmtPrice(p)}`);
}
function move(from, to) {
  if (from === to) return;
  const candidate = getAt(from);
  if (to.startsWith('grid:') && candidate && cardRequirement(candidate)) return flash(cardRequirement(candidate));
  if (from.startsWith('shop')) {
    const loc = buy(+from.split(':')[1]);
    if (!loc || to === 'bench' || to.startsWith('bench')) return;
    from = loc;
  }
  if (to === 'sell') return sell(from);
  const card = getAt(from);
  if (!card) return;
  if (to === 'bench') {
    if (from.startsWith('bench')) return;
    if (S.bench.length >= benchMax()) return flash('後備區滿咗！');
    setAt(from, null); S.bench.push(card); return;
  }
  if (!fits(card, to)) return flash(`${def(card).name} 只可以放喺：${def(card).slot.map(g => stageDef().labels[g]).join(' / ')}`);
  const other = getAt(to);
  if (other && !fits(other, from)) return flash(`${def(other).name} 唔可以換去嗰度`);
  if (from.startsWith('bench') && !other) { S.bench.splice(+from.split(':')[1], 1); setAt(to, card); return; }
  setAt(to, card);
  if (from.startsWith('bench')) S.bench[+from.split(':')[1]] = other; else setAt(from, other);
}

function onSlotClick(loc) {
  if (S.modal) return;
  const card = getAt(loc);
  if (loc.startsWith('shop')) { if (card) buy(+loc.split(':')[1]); selected = null; return render(); }
  if (selected) { const from = selected; selected = null; if (from !== loc) move(from, loc); return render(); }
  if (card) selected = loc;
  render();
}

let flashTimer = null;
function flash(msg) {
  const el = $('#flash');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(flashTimer); flashTimer = setTimeout(() => el.classList.remove('show'), 1800);
}

// ---------------- rendering ----------------
const fill = (txt, name, venue) => (txt || '').replaceAll('{g}', name || '佢').replaceAll('{v}', venue ? VENUES[venue].name : '嗰度');
// short zone names for the tags on each card (colors match the board quadrants)
const ZONE_SHORT = { bag: () => stageDef().labels.bag, weekday: () => '平日', weekend: () => '週末', relic: () => '珍藏' };

function cardHTML(card, loc, extra = '') {
  const d = def(card);
  const ed = card.edition ? `<span class="ed">${EDITIONS[card.edition].icon}</span>` : '';
  const meta = [];
  if (d.time) meta.push(`⏰${d.time}`);
  if (d.energy) meta.push(`⚡${d.energy}`);
  if (card.dur !== null && d.dur < 99) meta.push(`耐${card.dur}`);
  const lvl = masteryLv(card);
  const eng = (lvl ? `<span class="lvl">Lv${lvl}</span>` : '') + (d.grow ? `<span class="grow ${(card.grown || 0) >= d.growMax ? 'done' : ''}">📈${card.grown || 0}/${d.growMax}</span>` : '');
  const sel = selected === loc ? ' selected' : '';
  const old = S.stage < 6 && !inStage(card.id, S.stage + 1) ? '<span class="old" title="下個階段會收埋">⌛</span>' : '';
  const boost = loc.startsWith('shop') && shopBoost(card.id) ? '<span class="vboost" title="熟悉場地：出現率提升">📍</span>' : '';
  return `<div class="card r-${d.rarity}${card.edition ? ' e-' + card.edition : ''}${sel}" draggable="true" data-loc="${loc}" data-uid="${card.uid}">
    ${ed}${old}${boost}${eng}<div class="emoji">${d.emoji}</div><div class="cname">${d.name}</div>
    <div class="meta">${meta.join(' ')}</div>${extra}<div class="zones">${d.slot.map(g => `<span class="zone z-${g}">${ZONE_SHORT[g]()}</span>`).join('')}</div></div>`;
}

function renderTimeline() {
  const moon = moonActive();
  return STAGES.map((st, si) => {
    const cls = si < S.stage ? 'past' : si === S.stage ? 'now' : '';
    const ms = STAGE_EVENTS[si].milestone;
    const boxes = [1, 2, 3].map(t => {
      const key = `${si}-${t}`;
      let label, title;
      if (S.eventTitles[key]) { title = S.eventTitles[key].join('、'); label = S.eventTitles[key].map(x => x.split(' ')[0]).join(''); }
      else if (si === S.stage && t === S.turn && moon) { title = S.queue.map(evLabel).join('、'); label = S.queue.map(e => evLabel(e).split(' ')[0]).join(''); }
      else if (t === 3) { title = evLabel(ms); label = evLabel(ms); }
      else { title = st.turns[t - 1]; label = '❓'; }
      const now = si === S.stage && t === S.turn ? ' cur' : '';
      return `<div class="tb${now}" title="${st.turns[t - 1]}：${title}">${label}</div>`;
    }).join('');
    return `<div class="stg ${cls}"><div class="stn">${st.name}<small>${st.age}</small></div><div class="tbs">${boxes}</div></div>`;
  }).join('');
}

function girlCard({ g, i }) {
  const romance = stageDef().romance;
  const isLove = i === loveIdx();
  const showAll = moonActive() && isLove;
  const prefs = prefKeys(g).map(k => (g.revealed.includes(k) || showAll)
    ? `<span class="pref ${k.startsWith('dislike') ? 'neg' : ''}">${prefLabel(g, k)}</span>`
    : '<span class="pref hidden">???</span>').join('');
  const m = match(g), ch = chem(g);
  let status = '';
  if (i === S.partner) status = S.married ? '<span class="tag wed">💍 老婆</span>' : '<span class="tag love">💞 拍拖中</span>';
  else if (i === S.target && S.partner === null) status = '<span class="tag">🎯 目標</span>';
  const btns = [];
  if (S.partner === null && i !== S.target) btns.push(`<button class="small" data-target="${i}">設為目標</button>`);
  if (romance && S.partner === null) {
    const lock = g.aff < 40 ? '好感要 ≥ 40' : S.romanceUsed ? '今回合已行動' : '';
    btns.push(`<button class="small love" data-confess="${i}" ${lock ? 'disabled' : ''} title="${lock}">💌 表白 ${lock ? `<small>${lock}</small>` : confessChance(g) + '%'}</button>`);
  }
  if (i === S.partner && !S.married && S.stage >= 3) {
    const lock = g.aff < 70 ? '好感要 ≥ 70' : S.money < RING_COST ? `要 $${RING_COST}` : S.romanceUsed ? '今回合已行動' : '';
    btns.push(`<button class="small love" data-propose="${i}" ${lock ? 'disabled' : ''} title="${lock}">💍 求婚 ${lock ? `<small>${lock}</small>` : proposeChance(g) + '% ($' + RING_COST + ')'}</button>`);
  }
  if (i === S.partner) btns.push(`<button class="small" data-breakup="${i}">分手</button>`);
  return `<div class="girl ${isLove ? 'target' : ''} ${i === S.partner ? 'partner' : ''}">
    <div class="ghead"><span class="gface">${g.emoji}</span><div><b>${g.name}</b><small>${g.arch.name}・${STAGES[g.metStage].name}識</small></div>${status}</div>
    <div class="gbar"><label>${romance ? '好感' : '友情'}</label><div class="bar pink"><div style="width:${g.aff}%"></div></div><b>${g.aff}</b></div>
    <div class="gbar" title="契合：你有幾啱佢心水（佢嘅喜好）"><label>契合</label><div class="bar blue"><div style="width:${m}%"></div></div><b>${m}</b></div>
    <div class="gbar" title="化學：佢有幾啱你心水（你嘅擇偶喜好）。影響追求好感、表白/求婚成功率、伴侶好感下降速度"><label>化學</label><div class="bar chem"><div class="${ch >= 0 ? 'pos' : 'neg'}" style="left:${ch >= 0 ? 50 : 50 + ch}%;width:${Math.abs(ch)}%"></div></div><b class="${ch > 0 ? 'up' : ch < 0 ? 'down' : ''}">${sign(ch)}</b></div>
    <div class="traits">${traitKeys(g).map(k => `<span class="trait ${(S.pref[k] || 0) > 0 ? 'like' : (S.pref[k] || 0) < 0 ? 'dislike' : ''}">${traitLabel(k)}</span>`).join('')}${g.ratings.length ? `<span class="rated">${g.ratings.map(r => '★'.repeat(r)).join(' / ')}</span>` : `<span class="rated muted">好感 ${RATE_AT[0]} 時評分</span>`}</div>
    <div class="prefs">${prefs}</div>
    ${btns.length ? `<div class="gbtns">${btns.join('')}</div>` : ''}</div>`;
}

function renderVenues() {
  const vs = Object.keys(S.venues).sort((a, b) => S.venues[b] - S.venues[a]);
  if (!vs.length) return '<div class="muted">未熟悉任何場地。事件同活動會帶你去唔同地方（例如 🏛️ 九龍塘圖書館），去得多就會變熟客。</div>';
  return vs.map(v => {
    const V = VENUES[v], pts = S.venues[v], lv = venueLevel(v);
    const next = LOYALTY[lv + 1];
    const pct = next ? Math.round((pts - LOYALTY[lv].min) / (next.min - LOYALTY[lv].min) * 100) : 100;
    const items = V.items.filter(id => inStage(id) && !CARDS[id].noshop).map(id => CARDS[id].emoji).join('');
    const perks = lv ? `商店出現率 ×${1 + lv}${lv >= 3 ? '・八折' : ''}・判定 +${VENUE_BONUS * lv}%` : '再去多次變熟客';
    return `<div class="venue lv${lv}" title="${V.desc}">
      <div class="vhead"><span>${V.emoji} <b>${V.name}</b></span><span class="vlv">${LOYALTY[lv].name}</span></div>
      <div class="bar gold"><div style="width:${pct}%"></div></div>
      <div class="vinfo">${perks}${items ? `　<span class="vitems">${items}</span>` : ''}</div></div>`;
  }).join('');
}

function render() {
  const st = stageDef();
  const res = computeWeek();
  const over = res.time > timeMax();
  const eOver = res.energy > res.energyMax;

  $('#week').innerHTML = `${st.name} <small>${st.age}</small> · ${st.turns[S.turn - 1]} <small>(${S.turn}/3)</small>`;
  $('#res').innerHTML = `
    <div class="res ${over ? 'bad' : ''}" title="時間：每回合可用時數，超出唔可以開始">⏰ 時間 <b>${res.time}/${timeMax()}</b></div>
    <div class="res ${eOver ? 'bad' : ''}" title="精力：每回合可用，有剩會恢復情緒，透支會扣情緒。運動習慣會永久提升上限（而家永久 +${S.perm.energy}）">⚡ 精力 <b>${res.energy}/${res.energyMax}</b></div>
    <div class="res" title="${isKid() ? '家長俾嘅零用錢（讀大學前）' : '每回合人工'}">${moneyIcon()} ${isKid() ? '零用錢 ' : ''}<b>${fmtPrice(S.money)}</b> <small>(+${S.income}/回合)</small></div>
    <div class="res ${S.ec <= 3 ? 'bad' : ''}" title="情緒容量：歸零就崩潰">🫀 情緒 <b>${S.ec}/${S.ecMax}</b></div>
    <div class="res" title="人脈">🤝 人脈 <b>${S.sc}</b></div>`;
  $('#timeline').innerHTML = renderTimeline();
  const used = id => (id === 'coupon' && S.uses.coupon) || (id === 'goldpass' && S.uses.goldpass) || (id === 'star' && S.uses.star) || (id === 'skip' && S.uses.skip);
  $('#relics').innerHTML = `<span class="rlabel">法寶</span>` + (S.relics.length
    ? S.relics.map(id => `<span class="relic ${used(id) ? 'used' : ''}" title="${RELICS[id].name}：${RELICS[id].desc}${used(id) ? '（今次已用）' : ''}">${RELICS[id].emoji} ${RELICS[id].name}</span>`).join('')
    : '<span class="muted">每個人生階段完結，可以揀一件法寶。</span>');

  $('#stats').innerHTML = Object.entries(STATS).map(([k, s]) => {
    const d = res.fx.stats[k] || 0;
    return `<div class="stat"><span>${s.name}<small>${s.en}</small></span><b>${S.stats[k]}</b><i class="${d > 0 ? 'up' : d < 0 ? 'down' : ''}">${d ? sign(d) : ''}</i>
      <div class="bar"><div style="width:${Math.min(100, S.stats[k] / st.norm * 100)}%"></div></div></div>`;
  }).join('');

  const bg = S.bg, f = S.flags;
  $('#bg').innerHTML = `
    <div>📍 居住地區：<b>${SCHOOL_DISTRICT_BY_ID.get(bg.district)?.name || '未設定'}</b></div>
    <div>💵 家境：<b>${bg.finance.name}</b>　${bg.housing?.emoji || '🏠'} 住：<b>${bg.housing?.name || '未設定'}</b></div>
    <div>🎓 家庭教育：<b>${bg.edu.name}</b></div>
    <div>👪 家庭：<b>${bg.happy.name}</b></div>
    <div>📏 身高：<b>${curHeight()}cm</b>${S.stage <= 2 ? ` <small class="muted">（預計成年 ~${finalHeight()}cm）</small>` : ''}　😐 樣貌：<b>${'★'.repeat(bg.face)}${'☆'.repeat(3 - bg.face)}</b></div>
    ${bg.overseas ? '<div>✈️ 海外經驗：<b>有</b></div>' : ''}
    <div>🏅 運動技能：<b>${Object.keys(S.sports || {}).filter(sport => S.sports[sport]).map(sport => SPORT_NAMES[sport]).join('、') || '未學識'}</b></div>
    ${Object.keys(S.teamTraining || {}).length ? `<div>🏅 校隊訓練：<b>${Object.entries(S.teamTraining).map(([sport, turns]) => `${SPORT_NAMES[sport]} ${turns}/${NATIONAL_TEAM_TURNS}${turns >= NATIONAL_TEAM_TURNS ? '（港隊已解鎖）' : ''}`).join('、')}</b></div>` : ''}
    ${f.primary ? `<div>🏫 小學：<b>${f.primarySchool?.name || f.primary}</b></div>` : ''}
    ${f.school ? `<div>🏫 中學：<b>${f.school.name}</b></div>` : ''}
    ${f.edu && S.stage >= 3 ? `<div>📜 學歷：<b>${EDU_NAMES[f.edu]}</b></div>` : ''}
    ${f.flat ? '<div>🏠 物業：<b>有樓</b></div>' : ''}
    <div title="盤上每張黑化卡每回合 +1；跨階段累積">🖤 黑化分：<b>${S.darkScore || 0}</b>　<small class="muted" title="商店每張卡變黑化嘅機會：3% 起，每買一件 +1%（最多 30%）">黑化率 ${Math.round(darkChance() * 100)}%</small></div>
    <div title="盤上每張月讀卡每回合 +1；跨階段累積">🌙 月讀分：<b>${S.moonScore || 0}</b></div>
`;
  $('#venues').innerHTML = renderVenues();
  const prefs = Object.entries(S.pref).filter(([, w]) => w).sort((x, y) => y[1] - x[1]);
  $('#mypref').innerHTML = prefs.length
    ? prefs.map(([k, w]) => `<div class="prow"><span>${traitLabel(k)}</span><div class="bar chem"><div class="${w > 0 ? 'pos' : 'neg'}" style="left:${w > 0 ? 50 : 50 + w / PREF_MAX * 50}%;width:${Math.abs(w) / PREF_MAX * 50}%"></div></div><b class="${w > 0 ? 'up' : 'down'}">${sign(w)}</b></div>`).join('')
    : `<div class="muted">未有。同女仔好感去到 ${RATE_AT.join(' / ')} 時要幫佢評分，你嘅口味就會慢慢成形。</div>`;

  const pf = partnerFx();
  $('#partner').innerHTML = S.partner !== null
    ? `<span class="plabel">伴侶欄</span><span class="pgirl">${S.girls[S.partner].emoji} <b>${S.girls[S.partner].name}</b> ${S.married ? '💍 已婚' : '💞 拍拖中'}</span>
       <span class="pfx">每回合：${fxText(pf)}・好感 -${S.married ? 2 : 3}（<15 會分手）</span>`
    : `<span class="plabel">伴侶欄</span><span class="muted">${st.romance ? '空。好感 ≥ 40 就可以喺右邊「表白」。' : '細路仔，未到拍拖年紀。'}</span>`;

  $('#board').innerHTML = ['bag', 'weekend', 'weekday', 'relic'].map(g => `
    <div class="quad q-${g}"><div class="qlabel">${st.labels[g]}</div><div class="cells">
      ${S.grids[g].map((card, i) => {
        const loc = `grid:${g}:${i}`;
        const hint = selected && getAt(selected) && fits(getAt(selected), loc) ? ' can' : '';
        return `<div class="cell${hint}" data-loc="${loc}">${card ? cardHTML(card, loc) : `<span class="ph">${GRIDS[g].hint}</span>`}</div>`;
      }).join('')}
    </div></div>`).join('');

  $('#bench').innerHTML = S.bench.map((c, i) => `<div class="cell" data-loc="bench:${i}">${cardHTML(c, 'bench:' + i)}</div>`).join('')
    + Array(Math.max(0, benchMax() - S.bench.length)).fill(0).map(() => '<div class="cell empty" data-loc="bench"></div>').join('');

  const selCard = selected ? getAt(selected) : null;
  $('#sell').innerHTML = selCard && !selected.startsWith('shop') ? `賣出 ${def(selCard).name}：${fmtPrice(sellPrice(selCard))}` : '拖嚟呢度賣嘢';
  $('#sell').classList.toggle('active', !!selCard);

  const combos = activeCombos();
  $('#combos').innerHTML = combos.length
    ? combos.map(({ combo, adj }) => `<span class="combo ${adj ? 'adj' : ''}">🔗 ${combo.name}${adj ? ' ×2' : ''}</span>`).join('')
    : '<span class="muted">未有組合。將相關嘅卡擺埋一齊（相鄰效果 ×2，可以跨格）。</span>';
  $('#projection').innerHTML = `本回合預計：${fxText(res.fx) || '冇變化'}${res.editionScores.dark ? `・🖤 黑化分 +${res.editionScores.dark}` : ''}${res.editionScores.moon ? `・🌙 月讀分 +${res.editionScores.moon}` : ''}`;
  $('#go').disabled = over;
  $('#go').innerHTML = over ? `時間超出 ${res.time - timeMax()} 個鐘` : `開始 ${st.turns[S.turn - 1]} ▶${eOver ? '　<small>（⚡ 精力透支，會扣情緒）</small>' : ''}`;

  $('#shop').innerHTML = S.shop.map((c, i) => c
    ? `<div class="shopslot" data-loc="shop:${i}">${cardHTML(c, 'shop:' + i, `<div class="price ${S.money < cardPrice(c) ? 'cant' : ''}">${fmtPrice(cardPrice(c))}</div>`)}</div>`
    : '<div class="shopslot sold">已售</div>').join('');
  const freeRoll = hasRelic('coupon') && !S.uses.coupon;
  $('#reroll').textContent = freeRoll ? '🔄 換貨 🎟️免費' : `🔄 換貨 ${fmtPrice(S.rerollCost)}`;
  $('#reroll').disabled = !freeRoll && S.money < S.rerollCost;
  $('#wallet').innerHTML = `${moneyIcon()} ${isKid() ? '零用錢' : '你有'} <b>${fmtPrice(S.money)}</b>`;
  $('#darkrate').innerHTML = `🖤 ${Math.round(darkChance() * 100)}%`;
  $('#darkrate').title = `黑化率：商店每張卡有 ${Math.round(darkChance() * 100)}% 機會係黑化。3% 起，你每買一件 +1%（已買 ${S.bought || 0} 件，最多 30%）`;

  const gs = activeGirls().sort((a, b) => (b.i === S.partner) - (a.i === S.partner) || (b.i === S.target) - (a.i === S.target) || b.g.aff - a.g.aff);
  $('#girls').innerHTML = gs.length
    ? gs.slice(0, 5).map(girlCard).join('') + (gs.length > 5 ? `<div class="muted">仲有 ${gs.length - 5} 個（好感較低）</div>` : '')
    : '<div class="muted">未認識任何人。</div>';
  $('#girlsTitle').textContent = st.romance ? '女仔' : '朋友';

  $('#log').innerHTML = S.log.map(l => `<div>${l}</div>`).join('');
  renderModal();
}

function choiceHTML(c, i, venue) {
  const blocked = choiceBlocked(c);
  const canForce = !blocked && (c.stat || c.chance) && hasRelic('goldpass') && !S.uses.goldpass && choiceInfo(c, venue).p < 95;
  const info = choiceInfo(c, venue);
  const check = c.stat ? `${STATS[c.stat].name}判定 ${info.p}%` : c.chance ? `運氣 ${info.p}%` : '一定得';
  const useTag = c.use ? `<span class="usetag ${hasCard(S, c.use) ? 'have' : ''}">用 ${CARDS[c.use].emoji}${CARDS[c.use].name}${c.useOptional ? '（可選）' : ''}・耐久-1</span>` : '';
  const costTag = c.cost?.money ? `<span class="costtag">${fmtPrice(c.cost.money)}</span>` : '';
  return `<button class="choice" data-choice="${i}" ${blocked ? 'disabled' : ''}>
    <span>${c.label}</span> ${costTag}${useTag}<small>${blocked || check}</small>
    ${info.parts.length ? `<div class="bonus">加成：${info.parts.join('　')}</div>` : ''}
    <div class="pv">${c.fail ? '成功：' : ''}${fxText(c.ok) || '—'}${c.fail ? `<br>失敗：${fxText(c.fail) || '—'}` : ''}</div></button>${canForce ? `<button class="forcebtn" data-force="${i}">🛡️ 用免死金牌：呢個選擇直接成功</button>` : ''}`;
}

// 埋單 ending: she settled for you, and you get the bill
function receiptHTML(M) {
  const st = stageDef(), sc = M.score;
  const p = S.girls[S.partner];
  const exes = p.traits.history === 'rich' ? 4 + (p.name.length * 7) % 9 : 1;
  const row = (l, r, cls = '') => `<div class="rrow ${cls}"><span>${l}</span><span>${r}</span></div>`;
  const items = [
    row('枱號', `${st.name}・${st.turns[S.turn - 1]}`),
    row('埋單人', '你（老實人）'),
    '<div class="rline"></div>',
    row(`${p.emoji} ${p.name}（${p.arch.name}）`, '1 位'),
    row('佢嘅前度', `× ${exes}`),
    row('佢對你嘅契合', `${match(p)}`),
    row('你對佢嘅化學', sign(chem(p))),
    '<div class="rline"></div>',
    ...(S.flags.flat ? [row('🏠 你層樓', '已計')] : []),
    row('💰 你嘅積蓄', fmtPrice(S.money)),
    row('💼 你份人工', `${fmtPrice(S.income)}/回合`),
    row('💍 婚禮・酒席', '你俾'),
    '<div class="rline"></div>',
    ...sc.parts.map(([k, v]) => row(k, v)),
    '<div class="rline"></div>',
    row('合計', `${sc.total} / ${sc.max}`, 'total'),
  ];
  return `<div class="evtag">結局</div><h2 class="end-settled">${M.title}</h2>
    <div class="receipt">
    <div class="rhead">港 男 物 語 冰 室</div><div class="rsub">HK MAN TALE CAFE・埋單</div>
    <div class="rline"></div>${items.join('')}
    <p class="rnote">${M.text}</p>
    <div class="rfoot">多謝老實人　歡迎再嚟</div></div>
    <button class="big" id="m-restart">再嚟一鋪 🔁</button>`;
}

function renderModal() {
  const M = S.modal;
  const el = $('#modal');
  if (!M) { el.classList.remove('open'); el.innerHTML = ''; return; }
  el.classList.add('open');
  const st = stageDef();
  const n = S.queue.length;
  let html = '';
  if (M.stage === 'chapter') {
    html = `<div class="evtag">第 ${S.stage + 1} / 7 階段</div><h2 class="chapter">${st.name} <small>${st.age}</small></h2>
      <p class="evtext">${st.intro}</p>
      <p class="muted">每個階段：3 個計劃回合，每回合之後有 2–3 個事件（第 3 回合最後係里程碑）。⚡ 精力上限：${st.energy}・⏰ 時間：${st.time}</p>
      <button class="big" id="m-close">開始 →</button>`;
  } else if (M.stage === 'report') {
    html = `<h2>${st.turns[S.turn - 1]} 結算</h2><div class="lines">${M.lines.map(l => `<div>${l}</div>`).join('') || '<div>乜都冇做。</div>'}</div>
      <button class="big" id="m-next">今回合有 ${n} 個事件 →</button>`;
  } else if (M.stage === 'event') {
    const name = M.girl !== null && M.girl !== undefined ? S.girls[M.girl].name : '';
    const lv = M.venue ? venueLevel(M.venue) : 0;
    const venueTag = M.venue ? `<div class="vtag">📍 ${VENUES[M.venue].emoji} ${VENUES[M.venue].name}・${LOYALTY[lv].name}${lv ? `（判定 +${VENUE_BONUS * lv}%）` : ''}・熟悉度 +1${M.arrive ? `<br>${M.arrive}` : ''}</div>` : '';
    html = `<div class="evtag">${M.ev.milestone ? '⭐ 里程碑' : M.ev.needItem ? `🎒 道具事件・${CARDS[M.ev.needItem].emoji}${CARDS[M.ev.needItem].name}` : '事件'}</div><span class="evcount">事件 ${S.qi + 1} / ${n}</span>
      <h2>${M.ev.emoji} ${M.ev.title}</h2>${venueTag}
      <p class="evtext">${fill(M.ev.text(S), name, M.venue)}</p>
      <div class="choices">${M.choices.map((c, i) => choiceHTML(c, i, M.venue)).join('')}</div>
      ${hasRelic('skip') && !S.uses.skip && !M.ev.milestone ? '<button class="skipbtn" id="m-skip">🤒 請病假：略過呢個事件（每階段一次）</button>' : ''}`;
  } else if (M.stage === 'outcome') {
    const more = S.qi < n - 1;
    const last = S.turn === TURNS_PER_STAGE;
    html = `<span class="evcount">事件 ${S.qi + 1} / ${n}</span><h2>${M.ev.emoji} ${M.ev.title}</h2>
      ${M.hadCheck ? `<div class="verdict ${M.ok ? 'ok' : 'fail'}">${M.ok ? '成功！' : '失敗……'}</div>` : ''}
      <p class="evtext">${M.text}</p><p class="fx">${M.fxt}</p>
      ${M.notes.length ? `<div class="notes">${M.notes.map(x => `<div>${x}</div>`).join('')}</div>` : ''}
      ${S.endPending ? '<button class="big" id="m-turn">💍 睇結局 →</button>' : more ? `<button class="big" id="m-nextev">下一個事件（${S.qi + 2} / ${n}）→</button>`
        : `<button class="big" id="m-turn">${last ? `進入 ${STAGES[S.stage + 1].name} →` : '下一回合 →'}</button>`}`;
  } else if (M.stage === 'relic') {
    html = `<div class="evtag">🎁 ${st.name}完結</div><h2>揀一件法寶</h2>
      <p class="evtext">法寶會一直跟住你，直到呢一鋪完。</p>
      <div class="relicpick">${M.options.map(id => `<button class="relicopt" data-relic="${id}"><span class="remoji">${RELICS[id].emoji}</span><b>${RELICS[id].name}</b><small>${RELICS[id].desc}</small></button>`).join('')}</div>
      <button class="skipbtn" data-relic="">唔要，直接繼續</button>`;
  } else if (M.stage === 'rate') {
    const g = S.girls[M.girl];
    const kid = !st.romance;
    html = `<div class="evtag">💭 評分・${M.level === 0 ? (kid ? '開始熟絡' : '開始有感覺') : (kid ? '好朋友' : '越嚟越熟')}（好感 ${RATE_AT[M.level]}）</div>
      <h2>${g.emoji} 你點睇 ${g.name}？</h2>
      <p class="evtext">${kid ? '細個識嘅朋友，會影響你長大之後鍾意咩類型。' : '你嘅評分會改變你嘅擇偶喜好，影響將來同呢類女仔嘅化學反應。'}<br>
      <small class="muted">邊樣最影響你？（可以揀一樣，影響加倍）</small></p>
      <div class="traits big">${traitKeys(g).map(k => `<button class="trait-btn ${M.fav === k ? 'on' : ''} ${(S.pref[k] || 0) > 0 ? 'like' : (S.pref[k] || 0) < 0 ? 'dislike' : ''}" data-fav="${k}">${traitLabel(k)}${S.pref[k] ? ` <small>${sign(S.pref[k])}</small>` : ''}</button>`).join('')}</div>
      <p class="muted">而家化學：<b class="${chem(g) > 0 ? 'up' : chem(g) < 0 ? 'down' : ''}">${sign(chem(g))}</b>　契合：${match(g)}　好感：${g.aff}</p>
      <div class="stars">${[1, 2, 3, 4, 5].map(n => `<button class="star" data-rate="${n}"><b>${'★'.repeat(n)}</b><small>${STAR_LABELS[n]}</small></button>`).join('')}</div>`;
  } else if (M.stage === 'romance') {
    html = `<h2 class="${M.ok ? 'end-win' : 'end-reject'}">${M.title}</h2><p class="evtext">${M.text}</p><button class="big" id="m-close">${S.endPending ? '💍 睇結局 →' : '繼續'}</button>`;
  } else if (M.stage === 'ending' && M.kind === 'settled') {
    html = receiptHTML(M);
  } else if (M.stage === 'ending') {
    const sc = M.score;
    const partner = S.partner !== null ? S.girls[S.partner] : null;
    const topV = Object.keys(S.venues).sort((a, b) => S.venues[b] - S.venues[a])[0];
    html = `<div class="evtag">結局</div><h2 class="end-${M.kind}">${M.title}</h2><p class="evtext">${M.text}</p>
      <div class="recap">
        ${S.flags.primary ? `<div>🏫 小學：${S.flags.primarySchool?.name || S.flags.primary}</div>` : ''}${S.flags.school ? `<div>🏫 中學：${S.flags.school.name}</div>` : ''}
        ${S.flags.edu && S.stage >= 3 ? `<div>📜 ${EDU_NAMES[S.flags.edu]}</div>` : ''}
        <div>${partner ? `${S.married ? '💍 老婆' : '💞 女朋友'}：${partner.name}（${partner.arch.name}・${STAGES[partner.metStage].name}識・化學 ${sign(chem(partner))}）` : '💔 單身'}</div>
        ${S.flags.flat ? '<div>🏠 有樓</div>' : ''}
        ${topV ? `<div>📍 最熟悉嘅地方：${VENUES[topV].emoji}${VENUES[topV].name}（${LOYALTY[venueLevel(topV)].name}）</div>` : ''}
        <div>${moneyIcon()} ${fmtPrice(S.money)}　🤝 人脈 ${S.sc}</div>
      </div>
      ${sc ? `<div class="score"><b>人生分數：${sc.total}</b> / ${sc.max}　${sc.parts.map(([k, v]) => `<span>${k} ${v}</span>`).join('')}</div>` : ''}
      <div class="summary">${Object.entries(STATS).map(([k, s]) => `<span>${s.name} <b>${S.stats[k]}</b></span>`).join('')}</div>
      <button class="big" id="m-restart">再嚟一鋪 🔁</button>`;
  }
  el.innerHTML = `<div class="sheet">${html}</div>`;
}

// ---------------- tooltip ----------------
function tooltipFor(card) {
  const d = def(card);
  const fx = fxText({ ...mulFx(d.fx, card.edition), energy: d.fx.energy });
  const combos = combosFor(card.id).map(c => {
    const other = [c.a, c.b].map(p => { const [k, v] = p.split(':'); return k === 'id' ? `${CARDS[v].emoji}${CARDS[v].name}` : `任何「${TAG_NAMES[v]}」道具`; }).join(' + ');
    return `<div class="tcombo">🔗 ${c.name}：${other} → ${fxText(c.fx)}</div>`;
  }).join('');
  const range = d.st[0] === d.st[1] ? STAGES[d.st[0]].name : `${STAGES[d.st[0]].name} → ${STAGES[d.st[1]].name}`;
  const helps = d.slot.includes('bag') ? Object.entries(STAT_TAGS).filter(([, tags]) => d.tags.some(t => tags.includes(t))).map(([k]) => STATS[k].name) : [];
  const sold = venuesSelling(card.id).map(v => `${VENUES[v].emoji}${VENUES[v].name}${venueLevel(v) ? `（${LOYALTY[venueLevel(v)].name}）` : ''}`);
  const cost = [d.time ? `⏰ ${d.time} 個鐘` : '', d.energy ? `⚡ ${d.energy} 精力` : '', card.dur !== null && d.dur < 99 ? `🔧 耐久 ${card.dur}/${d.dur}` : ''].filter(Boolean).join('　');
  return `<div class="tt-head"><span>${d.emoji}</span><b>${d.name}</b><small class="r-${d.rarity}">${RARITY[d.rarity].name}</small></div>
    ${card.edition ? `<div class="tt-ed">${EDITIONS[card.edition].icon} ${EDITIONS[card.edition].name}：${EDITIONS[card.edition].desc}</div>` : ''}
    <div class="tt-row">📍 放：${d.slot.map(g => stageDef().labels[g]).join(' / ')}　${cost}</div>
    ${d.requiresSport ? `<div class="tt-row">🏅 入隊條件：先識${SPORT_NAMES[d.requiresSport]}（${S.sports?.[d.requiresSport] ? '已達成' : '未達成'}）。</div>` : ''}
    ${d.requiresTeam ? `<div class="tt-row">🇭🇰 遊戲入選條件：${SPORT_NAMES[d.requiresTeam]}校隊訓練 ${NATIONAL_TEAM_TURNS} 回合（已完成 ${S.teamTraining?.[d.requiresTeam] || 0}）。</div>` : ''}
    ${d.trainsTeam ? `<div class="tt-row">🏅 每完成一回合訓練，累積港隊資格 +1；同一運動每回合最多計一次。</div>` : ''}
    ${d.requiresCard ? `<div class="tt-row">🃏 需要持有：${CARDS[d.requiresCard].name}（${findCard(d.requiresCard) ? '已持有' : '未持有'}）。</div>` : ''}
    ${d.trainsSport ? `<div class="tt-row">🏅 放上盤完成一回合練習，就會學識${SPORT_NAMES[d.trainsSport]}；學識後換走用品亦會保留。</div>` : ''}
    ${fx ? `<div class="tt-row">每回合：${fx}</div>` : ''}
    ${d.grow ? `<div class="tt-row eng">📈 引擎：每回合永久 ${GROW_NAMES[Object.keys(d.grow)[0]]} +${Object.values(d.grow)[0]}（呢張卡最多 +${d.growMax}，已累積 ${card.grown || 0}）</div>` : ''}
    ${(d.time && d.fx.stats) ? `<div class="tt-row eng">🎓 熟練度：連續排 ${masteryEvery()} 回合升一級（Lv${masteryLv(card)}/${MASTERY_MAX}，每級${STATS[Object.keys(d.fx.stats)[0]].name} +1）。換走會保留，賣走就冇。</div>` : ''}
    ${d.special === 'interest' ? `<div class="tt-row eng">🐷 利息：而家每回合 +${Math.min(d.cap, Math.floor(Math.max(0, S.money) * d.rate))}</div>` : ''}
    ${d.special === 'network' ? `<div class="tt-row eng">📇 人脈變現：而家每回合 +$${S.sc * 10}</div>` : ''}
    ${d.time && d.tags.includes('sport') && S.stage <= 2 ? `<div class="tt-row eng">📏 發育期排落時間表：每回合成年身高 +1cm（最多 +${GROWTH_MAX}，而家 +${S.growth}）</div>` : ''}
    ${d.venue ? `<div class="tt-row">🗺️ 喺 ${VENUES[d.venue].emoji}${VENUES[d.venue].name} 進行：每回合熟悉度 +1</div>` : ''}
    ${helps.length ? `<div class="tt-row">🎒 放喺${stageDef().labels.bag}：${helps.join('、')}判定 +${ITEM_BONUS}%</div>` : ''}
    <div class="tt-desc">${d.editionDesc?.[card.edition] || d.desc}</div>
    ${card.edition === 'dark' || card.edition === 'moon' ? `<div class="tt-row">${card.edition === 'dark' ? '🖤 黑化分' : '🌙 月讀分'}：放上盤每回合 +1，跨階段累積。</div>` : ''}
    <div class="tt-row tags">${d.tags.map(t => `#${TAG_NAMES[t]}`).join(' ')}　⏳ ${range}</div>
    ${sold.length ? `<div class="tt-row">🏪 熟悉呢度會多啲出：${sold.join('、')}</div>` : ''}
    ${combos}`;
}

// ---------------- events wiring ----------------
function findCardByUid(u) {
  for (const p of placed()) if (p.card.uid === u) return p.card;
  return S.bench.find(c => c.uid === u) || S.shop.find(c => c && c.uid === u);
}

function wire() {
  document.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('#m-next')) return proceed('event');
    if (t.closest('#m-nextev')) return proceed('nextev');
    if (t.closest('#m-turn')) return proceed('turn');
    if (t.closest('#m-close')) return proceed('close');
    const rt = t.closest('[data-rate]'); if (rt) return rateGirl(+rt.dataset.rate);
    const fv = t.closest('[data-fav]'); if (fv) { S.modal.fav = S.modal.fav === fv.dataset.fav ? null : fv.dataset.fav; return render(); }
    if (t.closest('#m-restart')) return newRun();
    const fc = t.closest('[data-force]'); if (fc) return choose(+fc.dataset.force, true);
    const ch = t.closest('[data-choice]'); if (ch && !ch.disabled) return choose(+ch.dataset.choice);
    const rl = t.closest('[data-relic]'); if (rl) return takeRelic(rl.dataset.relic || null);
    if (t.closest('#m-skip')) return skipEvent();
    const cf = t.closest('[data-confess]'); if (cf && !cf.disabled) return confess(+cf.dataset.confess);
    const pr = t.closest('[data-propose]'); if (pr && !pr.disabled) return propose(+pr.dataset.propose);
    const br = t.closest('[data-breakup]'); if (br) { breakup(); if (S.ec <= 0) return ending('burnout'); return render(); }
    if (t.closest('#go')) return startWeek();
    if (t.closest('#reroll')) { if (hasRelic('coupon') && !S.uses.coupon) { S.uses.coupon = true; rollShop(); log('🎟️ 換貨券：免費換貨'); return render(); } if (S.money >= S.rerollCost) { S.money -= S.rerollCost; S.rerollCost += Math.ceil(stageDef().reroll / 3); rollShop(); } return render(); }
    if (t.closest('#sell')) { if (selected && !selected.startsWith('shop')) { sell(selected); selected = null; } return render(); }
    const tg = t.closest('[data-target]'); if (tg) { S.target = +tg.dataset.target; return render(); }
    const slot = t.closest('[data-loc]');
    if (slot) {
      const loc = slot.dataset.loc;
      if (loc === 'bench') { if (selected) { move(selected, 'bench'); selected = null; } return render(); }
      return onSlotClick(loc);
    }
    if (selected && !t.closest('.card')) { selected = null; render(); }
  });

  document.addEventListener('dragstart', e => {
    const c = e.target.closest?.('.card'); if (!c || S.modal) return;
    e.dataTransfer.setData('text/plain', c.dataset.loc);
    selected = c.dataset.loc;
    hideTip();
    // light up valid drop cells without re-rendering (re-rendering would cancel the drag)
    const card = getAt(selected);
    if (card) document.querySelectorAll('#board .cell').forEach(el => el.classList.toggle('can', fits(card, el.dataset.loc)));
  });
  document.addEventListener('dragover', e => { if (e.target.closest?.('[data-loc], #sell')) e.preventDefault(); });
  document.addEventListener('drop', e => {
    const from = e.dataTransfer.getData('text/plain'); if (!from) return;
    e.preventDefault();
    const dst = e.target.closest('#sell') ? 'sell' : e.target.closest('[data-loc]')?.dataset.loc;
    selected = null;
    if (dst) move(from, dst);
    render();
  });
  document.addEventListener('dragend', () => { if (selected) { selected = null; render(); } });

  const tip = $('#tip');
  document.addEventListener('mouseover', e => {
    const c = e.target.closest?.('.card');
    if (!c) return hideTip();
    const card = findCardByUid(+c.dataset.uid);
    if (!card) return;
    tip.innerHTML = tooltipFor(card);
    tip.classList.add('show');
  });
  document.addEventListener('mousemove', e => {
    if (!tip.classList.contains('show')) return;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let x = e.clientX + 16, y = e.clientY + 16;
    if (x + w > innerWidth - 8) x = e.clientX - w - 16;
    if (y + h > innerHeight - 8) y = innerHeight - h - 8;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  });
}
function hideTip() { $('#tip').classList.remove('show'); }

wire();
newRun();
