// ============================================================
// 港男物語 — static game data (7 life stages)
// ============================================================

const STATS = {
  look:   { name: '外表', en: 'Grooming' },
  fit:    { name: '體能', en: 'Athleticism' },
  brain:  { name: '學業', en: 'Intelligence' },
  talk:   { name: '口才', en: 'Verbal' },
  art:    { name: '才藝', en: 'Artistic' },
  social: { name: '人緣', en: 'Social' },
  wits:   { name: '機智', en: 'Wits' },
};

// ---------- 人生階段 ----------
// diffAdd: added to every event check's difficulty.  norm: stat value that counts as "maxed" for 契合.
// decay: stats lost every turn (新陳代謝).  partnerCost: $ per turn while dating / married.
// living: rent + household $ per turn (×0.6 once you own a flat).
// energy: ⚡ 精力 per turn — activities spend it; unused 精力 recovers 情緒; overspending costs 情緒.
const STAGES = [
  { key: 'kinder', name: '幼稚園', age: '3–6 歲', time: 10, energy: 8, diffAdd: 0, norm: 8, reroll: 5, romance: false,
    partnerCost: 0, labels: { bag: '書包', weekday: '放學後', weekend: '週末', relic: '珍藏品' },
    turns: ['K1', 'K2', 'K3'],
    intro: '你係一個細路。識朋友、玩、學嘢——嗰陣時嘅世界好簡單。<br>🧧 讀大學之前，用嘅係<b>家長俾嘅零用錢</b>；興趣班每回合要零用錢、⏰ 時間同 ⚡ 精力。<br>第三回合嘅「小一派位」會決定你讀邊間小學。',
    starter: ['playmate', 'cartoon', 'park', 'parents'] },
  { key: 'primary', name: '小學', age: '6–12 歲', time: 10, energy: 10, diffAdd: 4, norm: 12, reroll: 8, romance: false,
    partnerCost: 0, labels: { bag: '書包', weekday: '一至五課後', weekend: '週末', relic: '珍藏品' },
    turns: ['P1–P2', 'P3–P4', 'P5–P6'],
    intro: '返小學啦！補習班、興趣班、小息踢波。<br>第三回合「升中派位」會決定你入男校定 Co-ed。',
    starter: ['gaming', 'study'] },
  { key: 'secondary', name: '中學', age: '12–18 歲', time: 10, energy: 10, diffAdd: 7, norm: 17, reroll: 15, romance: true,
    partnerCost: 40, labels: { bag: '書包', weekday: '一至五課後', weekend: '週末', relic: '珍藏品' },
    turns: ['中一–中二', '中三–中四', '中五–中六'],
    intro: '青春期。聯校、陸運會、聖誕派對……可以開始「表白」喇（好感 ≥ 40）。<br>第三回合 DSE 放榜，決定你嘅學歷同第一份人工。',
    starter: ['pursue', 'friends'] },
  { key: 'grad', name: '新畢業', age: '22–24 歲', time: 8, energy: 9, diffAdd: 8, norm: 23, reroll: 60, romance: true, living: 450,
    partnerCost: 200, labels: { bag: '公事包', weekday: '一至五放工後', weekend: '週末', relic: '珍藏品' },
    turns: ['22 歲', '23 歲', '24 歲'],
    intro: '出嚟社會做嘢。🧧 零用錢變 💰 人工（儲落嘅零用錢變積蓄），📲 交友App 解鎖。<br>💍 由呢個階段開始可以「求婚」（好感 ≥ 70，要 $1000 戒指）。<b>結婚就係呢一鋪嘅結局</b>——四十歲前搵到啱嘅人。',
    starter: ['overtime', 'app'] },
  { key: 'late20', name: '二十尾', age: '27–29 歲', time: 8, energy: 9, diffAdd: 12, norm: 28, reroll: 80, romance: true, living: 600,
    partnerCost: 300, labels: { bag: '公事包', weekday: '一至五放工後', weekend: '週末', relic: '珍藏品' },
    turns: ['27 歲', '28 歲', '29 歲'],
    intro: '朋友一個二個結婚，屋企開始催。<br>三十歲前要唔要上車？',
    starter: ['hotpot'] },
  { key: 'early30', name: '三十頭', age: '30–34 歲', time: 8, energy: 8, diffAdd: 13, norm: 32, reroll: 100, romance: true, living: 700,
    partnerCost: 350, decay: { fit: 1, look: 1 }, labels: { bag: '公事包', weekday: '一至五放工後', weekend: '週末', relic: '珍藏品' },
    turns: ['30 歲', '32 歲', '34 歲'],
    intro: '新陳代謝開始慢：每回合 體能 -1、外表 -1。<br>💐 相親 解鎖——阿媽出手。',
    starter: ['blind'] },
  { key: 'forty', name: '四十', age: '40 歲', time: 8, energy: 7, diffAdd: 15, norm: 36, reroll: 120, romance: true, living: 800,
    partnerCost: 400, decay: { fit: 2, look: 1 }, energyDecay: 1, labels: { bag: '公事包', weekday: '一至五放工後', weekend: '週末', relic: '珍藏品' },
    turns: ['38 歲', '39 歲', '40 歲'],
    intro: '中年。體能 -2、外表 -1、永久 ⚡精力 -1 每回合（要靠運動頂住）。<br>最後機會：四十歲生日前未結婚，就會以單身結局收場。',
    starter: [] },
];

// Four 2x2 grids laid out as one 4x4 board, so cards can be adjacent across grid borders.
//   書包 | 週末
//   課後 | 珍藏
const GRIDS = {
  bag:     { hint: '道具', origin: [0, 0] },
  weekend: { hint: '週末活動', origin: [0, 2] },
  weekday: { hint: '平日活動', origin: [2, 0] },
  relic:   { hint: '珍藏品', origin: [2, 2] },
};

const EDITIONS = {
  foil: { name: 'Foil',  icon: '✨', desc: '正面效果 ×1.5', priceMul: 1.3 },
  dark: { name: '黑化',  icon: '🖤', desc: '正面效果 ×2，但每回合 情緒 -1，賣唔到錢', priceMul: 0.8 },
  moon: { name: '月讀',  icon: '🌙', desc: '預知今回合事件 + 看穿目標嘅全部喜好', priceMul: 1.4 },
};

const RARITY = {
  common: { name: '普通', weight: 60 },
  rare:   { name: '稀有', weight: 30 },
  epic:   { name: '史詩', weight: 10 },
};

// st: [firstStage, lastStage] the card exists in. Outgrown cards are auto-sold at a stage change.
// slot: which grids a card may sit in.  time: hours/turn (activities).  dur: durability (items).
// fx: per-turn effect. stats / money / ec (情緒) / sc (人脈) / aff (目標好感)
const CARDS = {
  // ================= 幼稚園 =================
  blocks:    { st: [0, 0], name: '積木',     emoji: '🧱', slot: ['bag'], rarity: 'common', price: 15, dur: 6, tags: ['art'], fx: { stats: { art: 1, wits: 1 } }, desc: '砌咗座獅子山。' },
  lego:      { st: [0, 0], name: 'lego', emoji: '🧱', slot: ['bag'], rarity: 'rare', price: 30, dur: 6, tags: ['art', 'tech'], fx: { stats: { art: 1, wits: 1 } }, desc: '照說明書砌完，再拆散砌自己鍾意嘅世界。' },
  mami:      { st: [0, 0], name: 'Mami麵', emoji: '🍜', slot: ['bag'], rarity: 'common', price: 5, dur: 1, tags: ['social'], fx: { ec: 2 }, desc: '隔住個袋揑碎，落粉搖勻，小息一齊食。' },
  starsnack: { st: [0, 0], name: '童星點心麵', emoji: '🍥', slot: ['bag'], rarity: 'common', price: 5, dur: 1, tags: ['social'], fx: { ec: 1, stats: { social: 1 } }, desc: '脆卜卜，分一啖俾隔籬位就識多個朋友。' },
  chupachups: { st: [0, 0], name: '珍寶珠', emoji: '🍭', slot: ['bag'], rarity: 'common', price: 5, dur: 1, tags: ['social'], fx: { ec: 2 }, desc: '揀咗最鍾意嘅味，慢慢食，唔捨得咬碎。' },
  sailormoonbook: { st: [0, 0], name: 'Sailor Moon填顏色書', emoji: '🎨', slot: ['bag'], rarity: 'common', price: 15, dur: 4, tags: ['art', 'otaku', 'book'], fx: { stats: { art: 1 }, ec: 1 }, desc: '水手服填咩色都得，今日由我設計變身造型。' },
  wetwipes:  { st: [0, 0], name: '濕紙巾', emoji: '🧻', slot: ['bag'], rarity: 'common', price: 10, dur: 4, tags: ['family', 'style'], fx: { stats: { look: 1 } }, desc: '食完零食抹手抹嘴，阿媽塞喺書包嗰包終於有用。' },
  teddy:     { st: [0, 1], name: '公仔',     emoji: '🧸', slot: ['bag'], rarity: 'common', price: 12, dur: 6, tags: ['family'], fx: { ec: 1 }, desc: '瞓覺一定要攬住。' },
  picbook:   { st: [0, 0], name: '圖書',     emoji: '📕', slot: ['bag'], rarity: 'common', price: 10, dur: 5, tags: ['book', 'study'], fx: { stats: { brain: 1, talk: 1 } }, desc: '睇到識背。' },
  toycar:    { st: [0, 0], name: '玩具車',   emoji: '🚗', slot: ['bag'], rarity: 'common', price: 15, dur: 4, tags: ['sport'], fx: { stats: { fit: 1, social: 1 } }, desc: '同人交換玩。' },
  tablet:    { st: [0, 2], name: '平板電腦', emoji: '📱', slot: ['bag'], rarity: 'rare', price: 60, dur: 8, tags: ['otaku', 'tech'], fx: { ec: 2 }, desc: '電子奶嘴。' },
  familytime: { st: [0, 0], name: '親子時間', emoji: '👨‍👩‍👦', slot: ['weekday'], rarity: 'common', price: 5, time: 0, energy: 0, tags: ['family'], fx: { ec: 2 }, desc: '同爸爸媽媽講吓今日學咗乜，一齊玩一陣。唔佔時間額度。' },
  rest:      { st: [0, 0], name: '休息', emoji: '🛋️', slot: ['weekday'], rarity: 'common', price: 5, time: 0, energy: 0, tags: [], fx: { ec: 2 }, desc: '放低書包，坐低抖吓，乜都唔使做。唔佔時間額度。' },
  playmate:  { st: [0, 1], name: '同女同學玩', emoji: '👧', slot: ['weekday', 'weekend'], rarity: 'common', price: 5, time: 1, tags: ['romance'], fx: {}, special: 'pursue', desc: '同目標女同學一齊玩。友情 +(2 + 契合度/15)，並得知一項佢嘅喜好。' },
  boyclassmate: { st: [0, 1], name: '同男同學玩', emoji: '👦', slot: ['weekday'], rarity: 'common', price: 5, time: 1, energy: 1, tags: ['social'], fx: { stats: { social: 1 }, ec: 1 }, desc: '同男同學玩捉迷藏，笑到唔想返屋企。' },
  cartoon:   { st: [0, 1], name: '睇卡通',   emoji: '📺', slot: ['weekday', 'weekend'], rarity: 'common', price: 5, time: 1, tags: ['otaku'], fx: { ec: 2 }, desc: '麵包超人。' },
  afterschoolicu: { st: [0, 0], name: '睇放學ICU', emoji: '📺', slot: ['weekday'], rarity: 'common', price: 5, time: 1, energy: 0, tags: ['otaku'], fx: { ec: 1, stats: { talk: 1 } }, desc: '放低書包，開電視等放學ICU。聽日返學同同學傾。' },
  park:      { st: [0, 1], name: '落公園玩', emoji: '🛝', slot: ['weekday', 'weekend'], rarity: 'common', price: 5, time: 2, tags: ['sport', 'social'], fx: { stats: { fit: 1, social: 1 } }, desc: '放學落公園，玩滑梯、韆鞦同沙池。' },
  countrypark: { st: [0, 6], name: '去郊野公園', emoji: '🌳', slot: ['weekend'], rarity: 'common', price: 10, time: 2, energy: 2, tags: ['sport', 'family'], fx: { stats: { fit: 1 }, ec: 1 }, desc: '同屋企人行吓山，認識花草樹木同小動物。' },
  sleep:     { st: [0, 6], name: '訓教', emoji: '😴', slot: ['weekend'], rarity: 'common', price: 5, time: 2, energy: 0, tags: [], fx: { ec: 2 }, desc: '瞓到自然醒，攬住張被唔肯起身。' },
  community: { st: [0, 6], name: '社區中心活動', emoji: '🏘️', slot: ['weekend'], rarity: 'common', price: 10, time: 2, energy: 1, tags: ['social', 'art'], fx: { stats: { social: 1, art: 1 } }, desc: '做手工、玩集體遊戲，識多幾個街坊朋友。' },
  swim:      { st: [0, 2], name: '游水班',   emoji: '🏊', slot: ['weekday', 'weekend'], rarity: 'common', price: 25, time: 2, tags: ['sport'], fx: { stats: { fit: 2 }, money: -10 }, desc: '嗆咗幾啖水。' },
  piano:     { st: [0, 2], name: '鋼琴班',   emoji: '🎹', slot: ['weekday'], rarity: 'rare', price: 40, time: 2, tags: ['art'], fx: { stats: { art: 2 }, money: -15 }, desc: '阿媽話考到八級先准停。' },
  playgroup: { st: [0, 0], name: '英文 Playgroup', emoji: '🔤', slot: ['weekday'], rarity: 'rare', price: 40, time: 2, tags: ['talk', 'study'], fx: { stats: { talk: 2 }, money: -15 }, desc: 'Twinkle twinkle little star。' },
  interview: { st: [0, 0], name: '面試班',   emoji: '🧑‍🏫', slot: ['weekday'], rarity: 'common', price: 30, time: 2, tags: ['study'], fx: { stats: { brain: 1, talk: 1 } }, desc: '三歲就要識自我介紹。' },
  redflower: { st: [0, 6], name: '小紅花',   emoji: '🌺', slot: ['relic'], rarity: 'common', price: 20, tags: ['family'], fx: { stats: { social: 1 } }, desc: '老師獎嘅。一世記得。' },
  tintin:    { st: [0, 6], name: '丁丁歷險記全套', emoji: '📚', slot: ['relic'], rarity: 'rare', price: 60, tags: ['book', 'art'], fx: { stats: { brain: 1, art: 1 } }, desc: '跟住丁丁同白雪，喺書頁入面環遊世界。' },
  digivice:  { st: [0, 6], name: '數碼暴龍機', emoji: '👾', slot: ['relic'], rarity: 'rare', price: 50, tags: ['otaku', 'tech'], fx: { stats: { wits: 1 }, ec: 1 }, desc: '餵佢食、幫佢操，等放學同朋友對戰。' },
  classmates: { st: [0, 6], name: '同學紀念冊', emoji: '📒', slot: ['relic'], rarity: 'common', price: 25, tags: ['social', 'book'], fx: { stats: { social: 1 } }, desc: '寫低電話同夢想，約好升小學都要見。' },
  pokemoncard: { st: [0, 6], name: 'pokemon card', emoji: '🃏', slot: ['relic'], rarity: 'common', price: 25, tags: ['otaku', 'social'], fx: { stats: { wits: 1 } }, desc: '張閃卡用卡套包好，唔捨得拎出嚟玩。' },
  dadletter: { st: [0, 6], name: '爸爸的信', emoji: '✉️', slot: ['relic'], rarity: 'rare', price: 35, tags: ['family'], fx: { ec: 1 }, desc: '「慢慢嚟，爸爸會一直陪住你。」摺好收埋，一世都留住。' },

  // ================= 小學 =================
  breakthroughnotebook: { st: [1, 1], name: '突破出版筆記本', emoji: '📓', slot: ['bag'], rarity: 'common', price: 15, dur: 6, tags: ['book', 'study'], fx: { stats: { brain: 1 } }, desc: '抄低功課、金句同突然諗到嘅故事，頁角畫滿小公仔。' },
  casiocalculator: { st: [1, 1], name: 'Casio計數機', emoji: '🧮', slot: ['bag'], rarity: 'rare', price: 35, dur: 8, tags: ['study', 'tech'], fx: { stats: { wits: 1 } }, desc: '做完功課用嚟核對答案，仲有好多掣未識用。' },
  monoeraser: { st: [1, 1], name: 'Mono擦紙膠', emoji: '🧽', slot: ['bag'], rarity: 'common', price: 10, dur: 5, tags: ['study'], fx: { stats: { brain: 1 } }, desc: '擦得乾淨又唔易爛紙，唔捨得借俾人擦黑晒。' },
  correctiontape: { st: [1, 1], name: '塗改帶', emoji: '🩹', slot: ['bag'], rarity: 'common', price: 12, dur: 4, tags: ['study'], fx: { stats: { wits: 1 } }, desc: '寫錯字碌一下就遮住，最怕條帶突然鬆晒。' },
  thermos:   { st: [1, 1], name: '保溫瓶', emoji: '🫗', slot: ['bag'], rarity: 'common', price: 25, dur: 8, tags: ['family'], fx: { ec: 1 }, desc: '阿媽朝早裝嘅暖水，小息飲嗰陣仲有啲熱。' },
  gundamkeychain: { st: [1, 1], name: '高達鎖匙扣', emoji: '🤖', slot: ['bag'], rarity: 'common', price: 15, dur: 6, tags: ['otaku', 'social'], fx: { stats: { social: 1 } }, desc: '掛喺書包拉鏈度，同好一眼就認得出係邊部機。' },
  oreo:      { st: [1, 1], name: 'Oreo', emoji: '🍪', slot: ['bag'], rarity: 'common', price: 8, dur: 1, tags: ['social'], fx: { ec: 1, stats: { social: 1 } }, desc: '扭開、舔一舔，留多塊俾隔籬位一齊食。' },
  metalpencilcase: { st: [1, 1], name: '鐵筆盒', emoji: '🧰', slot: ['bag'], rarity: 'common', price: 20, dur: 8, tags: ['study'], fx: { stats: { brain: 1 } }, desc: '鉛筆擦膠排好晒，一跌落地就全班望過嚟。' },
  kumon:     { st: [1, 1], name: 'Kumon數學班', emoji: '🔢', slot: ['weekday'], rarity: 'common', price: 30, time: 2, energy: 2, tags: ['study'], fx: { stats: { brain: 2 }, money: -10, ec: -1 }, desc: '計時做練習，做完一頁仲有下一頁。' },
  spokenenglish: { st: [1, 1], name: '英文口語班', emoji: '🗣️', slot: ['weekday'], rarity: 'common', price: 35, time: 2, energy: 1, tags: ['talk', 'study'], fx: { stats: { talk: 2 }, money: -15 }, desc: '同同學練對話，由唔敢開口到大聲講 Hello。' },
  mcdonalds: { st: [1, 1], name: '去麥當勞', emoji: '🍟', slot: ['weekday'], rarity: 'common', price: 10, time: 1, energy: 0, tags: ['social'], fx: { stats: { social: 1 }, ec: 2, money: -10 }, desc: '放學同同學食薯條，傾到阿媽打電話催返屋企。' },
  television: { st: [1, 1], name: '睇電視', emoji: '📺', slot: ['weekday'], rarity: 'common', price: 5, time: 1, energy: 0, tags: ['otaku'], fx: { ec: 2 }, desc: '霸住個遙控，做完功課先准睇下一集。' },
  classmateouting: { st: [1, 1], name: '約女同學', emoji: '👧', slot: ['weekend'], rarity: 'common', price: 10, time: 2, energy: 1, tags: ['romance', 'social'], fx: { ec: 1 }, special: 'pursue', desc: '約目標女同學出嚟玩。友情 +(2 + 契合度/15)，並得知一項佢嘅喜好。' },
  basketballclass: { st: [1, 1], name: '籃球班', emoji: '🏀', slot: ['weekend'], rarity: 'common', price: 30, time: 2, energy: 2, tags: ['sport', 'social'], fx: { stats: { fit: 2 }, money: -10 }, desc: '由拍波、傳波開始學，等教練批准先可以打比賽。' },
  streetcourt: { st: [1, 1], name: '落街場', emoji: '⛹️', slot: ['weekend'], rarity: 'common', price: 5, time: 2, energy: 2, tags: ['sport', 'social'], fx: { stats: { fit: 1, social: 1 } }, desc: '孭住個波落街，問句「可唔可以加埋？」就開波。' },
  talesrunner: { st: [1, 1], name: '玩跑online', emoji: '🏃', slot: ['weekend'], rarity: 'common', price: 10, time: 1, energy: 1, tags: ['otaku', 'social'], fx: { stats: { wits: 1 }, ec: 1 }, desc: '同同學鬥快衝終點，跌落水都笑到停唔到。' },
  sdgundam:  { st: [1, 1], name: '玩sd高達online', emoji: '🤖', slot: ['weekend'], rarity: 'common', price: 15, time: 2, energy: 1, tags: ['otaku', 'tech'], fx: { stats: { wits: 1 }, ec: 2 }, desc: '儲機體、組隊出擊，今日終於用到最鍾意嗰部高達。' },
  audition:  { st: [1, 1], name: '玩勁舞團', emoji: '💃', slot: ['weekend'], rarity: 'common', price: 10, time: 1, energy: 1, tags: ['otaku', 'art', 'social'], fx: { stats: { art: 1, social: 1 } }, desc: '跟住節奏撳方向掣，約埋同學開房跳舞。' },
  leagueoflegends: { st: [1, 1], name: '玩LOL', emoji: '🎮', slot: ['weekend'], rarity: 'common', price: 15, time: 2, energy: 2, tags: ['otaku', 'social'], fx: { stats: { wits: 1, social: 1 }, ec: 1 }, desc: '約齊五個同學開一場，話好打完呢場就做功課。' },
  sticker:   { st: [1, 1], name: '心心貼紙', emoji: '💖', slot: ['bag'], rarity: 'common', price: 10, dur: 4, tags: ['romance'], fx: { aff: 1 }, desc: '貼喺佢手冊度。' },
  tcg:       { st: [1, 2], name: '遊戲卡',   emoji: '🃏', slot: ['bag'], rarity: 'common', price: 20, dur: 6, tags: ['otaku', 'social'], fx: { stats: { wits: 1, social: 1 } }, desc: '小息交換閃卡。' },
  football:  { st: [1, 3], name: '足球',     emoji: '⚽', slot: ['bag'], rarity: 'common', price: 30, dur: 8, tags: ['sport'], fx: { stats: { fit: 1 } }, desc: '踢爆咗課室玻璃。' },
  olympiad:  { st: [1, 1], name: '奧數班',   emoji: '➗', slot: ['weekday'], rarity: 'rare', price: 50, time: 2, tags: ['study'], fx: { stats: { brain: 2, wits: 1 }, money: -20, ec: -1 }, desc: '雞兔同籠。' },
  scouts:    { st: [0, 2], name: '童軍',     emoji: '⛺', slot: ['weekend'], rarity: 'common', price: 25, time: 2, tags: ['social', 'sport'], fx: { stats: { social: 1, fit: 1 }, sc: 1 }, desc: '由小童軍開始，日日行一善。' },

  // ================= 中學 =================
  stationery: { st: [1, 2], name: '無印文具', emoji: '🖊️', slot: ['bag'], rarity: 'common', price: 30, dur: 6, tags: ['study'], fx: { stats: { brain: 1 } }, desc: '簡約就是型。' },
  assess:     { st: [1, 2], name: '補充練習', emoji: '📘', slot: ['bag'], rarity: 'common', price: 40, dur: 4, tags: ['study'], fx: { stats: { brain: 2 }, ec: -1 }, desc: '做到手軟。' },
  brandbag:   { st: [2, 2], name: '名牌書包', emoji: '🎒', slot: ['bag'], rarity: 'rare', price: 150, dur: 10, tags: ['brand', 'style'], fx: { stats: { look: 1 }, sc: 1 }, desc: '個logo大過你個頭。' },
  phone:      { st: [2, 6], name: '手機',    emoji: '📱', slot: ['bag'], rarity: 'rare', price: 120, dur: 12, tags: ['tech'], fx: { money: -10 }, desc: '配「溝女」= WhatsApp 攻勢；配「交友App」更強。' },
  paddle:     { st: [1, 2], name: '乒乓球拍', emoji: '🏓', slot: ['bag'], rarity: 'common', price: 30, dur: 6, tags: ['sport'], fx: { stats: { fit: 1 } }, desc: '小息必備。' },
  basketball: { st: [2, 4], name: '籃球',    emoji: '🏀', slot: ['bag'], rarity: 'rare', price: 80, dur: 8, tags: ['sport'], fx: { stats: { fit: 1, social: 1 } }, desc: '放學球場見。' },
  wax:        { st: [2, 6], name: '髮蠟',    emoji: '💈', slot: ['bag'], rarity: 'common', price: 40, dur: 4, tags: ['style'], fx: { stats: { look: 2 } }, desc: '訓導主任睇唔到就得。' },
  cologne:    { st: [2, 6], name: '古龍水',   emoji: '🧴', slot: ['bag'], rarity: 'rare', price: 90, dur: 5, tags: ['style'], fx: { stats: { look: 1 }, aff: 1 }, desc: '唔好噴成支。' },
  comic:      { st: [1, 6], name: '漫畫',    emoji: '📚', slot: ['bag'], rarity: 'common', price: 25, dur: 3, tags: ['otaku'], fx: { ec: 1 }, desc: '上堂收埋喺書枱底。' },
  guitar:     { st: [2, 6], name: '結他',    emoji: '🎸', slot: ['bag'], rarity: 'epic', price: 220, dur: 15, tags: ['art'], fx: { stats: { art: 2 } }, desc: '聖誕派對秘密武器。' },
  umbrella:   { st: [1, 6], name: '縮骨遮',   emoji: '☂️', slot: ['bag'], rarity: 'common', price: 35, dur: 8, tags: [], fx: {}, desc: '落雨天可能有奇蹟。' },
  letter:     { st: [2, 6], name: '情信紙',   emoji: '💌', slot: ['bag'], rarity: 'rare', price: 60, dur: 99, tags: ['romance'], fx: {}, desc: '表白成功率 +15%。配「溝女」好感 +1。' },
  sketchbook: { st: [1, 3], name: '畫簿',    emoji: '✏️', slot: ['bag'], rarity: 'common', price: 35, dur: 5, tags: ['art'], fx: { stats: { art: 1 } }, desc: '畫滿佢個樣。' },
  novel:      { st: [2, 6], name: '文學小說', emoji: '📖', slot: ['bag'], rarity: 'common', price: 30, dur: 4, tags: ['book', 'art'], fx: { stats: { talk: 1 } }, desc: '扮文青入門。' },
  console:    { st: [1, 6], name: '手提遊戲機', emoji: '🎮', slot: ['bag'], rarity: 'rare', price: 180, dur: 10, tags: ['otaku'], fx: { ec: 2 }, desc: '一打就停唔到。' },

  pursue:   { st: [2, 6], name: '溝女',      emoji: '💘', slot: ['weekday', 'weekend'], rarity: 'common', price: 30, time: 1, tags: ['romance'], fx: { ec: -1 }, special: 'pursue', desc: '向目標埋身（拍拖中就係陪伴侶）。好感 +(2 + 契合度/15)，並得知一項喜好。' },
  gaming:   { st: [0, 6], name: '打機',      emoji: '🕹️', slot: ['weekday', 'weekend'], rarity: 'common', price: 20, time: 1, tags: ['otaku'], fx: { ec: 2 }, desc: '充電中。' },
  study:    { st: [1, 2], name: '溫書',      emoji: '✍️', slot: ['weekday'], rarity: 'common', price: 20, time: 2, tags: ['study'], fx: { stats: { brain: 1 } }, desc: '老老實實。' },
  run:      { st: [1, 6], name: '跑步',      emoji: '👟', slot: ['weekend'], rarity: 'common', price: 20, time: 1, tags: ['sport'], fx: { stats: { fit: 1 }, ec: 1 }, desc: '海傍跑一圈。' },
  parents:  { st: [0, 6], name: '陪老豆老母', emoji: '👨‍👩‍👦', slot: ['weekend'], rarity: 'common', price: 10, time: 2, tags: ['family'], fx: { ec: 2, money: 10 }, desc: '飲茶，順便攞多少少零用錢。' },
  friends:  { st: [2, 6], name: '約friend玩', emoji: '🍻', slot: ['weekend'], rarity: 'common', price: 20, time: 2, tags: ['social'], fx: { stats: { social: 1 }, sc: 1, money: -30 }, desc: '兄弟永遠係兄弟。' },
  tutor:    { st: [1, 2], name: '補習班',    emoji: '📝', slot: ['weekday'], rarity: 'rare', price: 80, time: 2, tags: ['study'], fx: { stats: { brain: 2 }, money: -40, ec: -1 }, desc: '天王補底。' },
  team:     { st: [1, 2], name: '運動校隊',   emoji: '🏃', slot: ['weekday'], rarity: 'rare', price: 60, time: 3, tags: ['sport'], fx: { stats: { fit: 2, social: 1 } }, desc: '操到跪。' },
  music:    { st: [2, 3], name: '樂器班',    emoji: '🎻', slot: ['weekday'], rarity: 'rare', price: 100, time: 2, tags: ['art'], fx: { stats: { art: 2 }, money: -50 }, desc: '八級先算有嘢講。' },
  debate:   { st: [2, 2], name: '辯論學會',   emoji: '🎤', slot: ['weekday'], rarity: 'common', price: 40, time: 2, tags: ['talk'], fx: { stats: { talk: 2, wits: 1 } }, desc: '主席、各位評判、各位同學。' },
  library:  { st: [1, 3], name: '圖書館溫書', emoji: '🏛️', slot: ['weekday'], rarity: 'common', price: 20, time: 2, tags: ['study', 'book'], fx: { stats: { brain: 1, wits: 1 } }, desc: '靜靜地，可能有偶遇。' },
  mall:     { st: [2, 6], name: '行街',      emoji: '🛍️', slot: ['weekend'], rarity: 'common', price: 30, time: 2, tags: ['brand'], fx: { stats: { social: 1, look: 1 }, money: -40 }, desc: '旺角朗豪坊。' },
  hike:     { st: [2, 6], name: '行山',      emoji: '⛰️', slot: ['weekend'], rarity: 'common', price: 20, time: 2, tags: ['sport'], fx: { stats: { fit: 1 }, ec: 2 }, desc: '獅子山頂望落去。' },
  volunteer:{ st: [2, 6], name: '做義工',    emoji: '🫶', slot: ['weekend'], rarity: 'common', price: 20, time: 2, tags: ['family'], fx: { stats: { social: 1 }, sc: 2 }, desc: '探訪老人院。' },
  cafe:     { st: [2, 6], name: 'Café打卡',  emoji: '☕', slot: ['weekend'], rarity: 'rare', price: 50, time: 1, tags: ['style'], fx: { stats: { look: 1, social: 1 }, money: -50 }, desc: '杯 latte 影咗十分鐘。' },
  gym:      { st: [2, 6], name: '健身室',    emoji: '💪', slot: ['weekday', 'weekend'], rarity: 'rare', price: 90, time: 2, tags: ['sport'], fx: { stats: { fit: 2, look: 1 }, money: -30 }, desc: '練胸練到成個人膨脹。' },
  movie:    { st: [2, 6], name: '約佢睇戲',   emoji: '🎬', slot: ['weekend'], rarity: 'rare', price: 40, time: 2, tags: ['romance'], fx: { money: -80 }, special: 'date', desc: '目標好感 ≥ 25 先肯出嚟。好感 +(6 + 契合度/12)。' },

  // ================= 出嚟社會 =================
  suit:      { st: [3, 6], name: '西裝',     emoji: '👔', slot: ['bag'], rarity: 'common', price: 250, dur: 8, tags: ['style', 'work'], fx: { stats: { look: 2 } }, desc: '人靠衣裝。' },
  watch:     { st: [3, 6], name: '名錶',     emoji: '⌚', slot: ['bag'], rarity: 'epic', price: 900, dur: 20, tags: ['brand', 'style'], fx: { stats: { look: 1 }, sc: 2 }, desc: '傾生意先望你隻手。' },
  laptop:    { st: [3, 6], name: '手提電腦', emoji: '💻', slot: ['bag'], rarity: 'rare', price: 400, dur: 10, tags: ['tech', 'work'], fx: { stats: { brain: 1, wits: 1 } }, desc: 'Excel 打到半夜。' },
  namecard:  { st: [3, 6], name: '卡片',     emoji: '📇', slot: ['bag'], rarity: 'common', price: 100, dur: 6, tags: ['work', 'social'], fx: { sc: 2 }, desc: 'Senior Associate（其實係 junior）。' },
  carkey:    { st: [4, 6], name: '跑車鎖匙', emoji: '🏎️', slot: ['bag'], rarity: 'epic', price: 1800, dur: 30, tags: ['brand', 'style'], fx: { stats: { look: 2 }, sc: 2, money: -150 }, desc: '泊車費比人工貴。' },
  overtime:  { st: [3, 6], name: '加班',     emoji: '💼', slot: ['weekday'], rarity: 'common', price: 50, time: 3, tags: ['work'], fx: { money: 400, ec: -2 }, desc: '老細話「今晚 send 埋俾我」。' },
  app:       { st: [3, 6], name: '交友App',  emoji: '📲', slot: ['weekday', 'weekend'], rarity: 'common', price: 50, time: 1, tags: ['romance', 'tech'], fx: { ec: -1 }, special: 'app', desc: '左碌右碌：每回合 50% 機會認識新女仔。' },
  mba:       { st: [3, 5], name: '夜校進修', emoji: '🎓', slot: ['weekday'], rarity: 'rare', price: 400, time: 2, tags: ['study', 'work'], fx: { stats: { brain: 2, talk: 1 }, money: -150, ec: -1 }, desc: '讀個 Master 加人工。' },
  happyhour: { st: [3, 6], name: 'Happy Hour', emoji: '🍺', slot: ['weekday'], rarity: 'common', price: 80, time: 1, tags: ['social'], fx: { stats: { social: 1 }, sc: 1, ec: 1, money: -100 }, desc: '蘭桂坊兩杯起。' },
  stocks:    { st: [3, 6], name: '睇股票',   emoji: '📈', slot: ['weekday'], rarity: 'rare', price: 200, time: 1, tags: ['work'], fx: {}, special: 'invest', desc: '每回合隨機 -$300 至 +$600。' },
  hotpot:    { st: [3, 6], name: '打邊爐',   emoji: '🍲', slot: ['weekend'], rarity: 'common', price: 60, time: 2, tags: ['social', 'family'], fx: { stats: { social: 1 }, sc: 1, ec: 1, money: -80 }, desc: '牛丸、魚皮餃、啤酒。' },
  travel:    { st: [3, 6], name: '去旅行',   emoji: '✈️', slot: ['weekend'], rarity: 'rare', price: 300, time: 2, tags: ['style'], fx: { ec: 3, aff: 3, money: -500 }, desc: '日本又日本。' },
  blind:     { st: [5, 6], name: '相親',     emoji: '💐', slot: ['weekend'], rarity: 'common', price: 50, time: 2, tags: ['romance', 'family'], fx: { ec: -1 }, special: 'blind', desc: '阿媽安排：每回合一定認識一個新女仔。' },
  pilates:   { st: [4, 6], name: '私人教練', emoji: '🏋️', slot: ['weekday', 'weekend'], rarity: 'rare', price: 500, time: 2, tags: ['sport'], fx: { stats: { fit: 3, look: 1 }, money: -200 }, desc: '對抗新陳代謝。' },
  wine:      { st: [4, 6], name: '紅酒品鑑', emoji: '🍷', slot: ['weekday', 'weekend'], rarity: 'rare', price: 400, time: 1, tags: ['style', 'social'], fx: { stats: { art: 1, social: 1 }, money: -200 }, desc: '識少少扮代表。' },

  // ================= 珍藏品 =================
  goset:     { st: [1, 6], name: '圍棋Set', emoji: '⚫', slot: ['relic'], rarity: 'rare', price: 45, tags: ['study', 'social'], fx: { stats: { brain: 1, wits: 1 } }, desc: '黑白棋子一粒粒落，學識睇遠幾步，唔好淨係顧住眼前。' },
  chessset:  { st: [1, 6], name: '國際象棋Set', emoji: '♟️', slot: ['relic'], rarity: 'rare', price: 45, tags: ['study', 'social'], fx: { stats: { wits: 1, social: 1 } }, desc: '記熟每隻棋點行，約同學落一盤，輸咗再研究。' },
  xiangqiset: { st: [1, 6], name: '中國象棋Set', emoji: '🎲', slot: ['relic'], rarity: 'common', price: 30, tags: ['study', 'family'], fx: { stats: { brain: 1 }, ec: 1 }, desc: '同爸爸捉棋，次次都俾佢提醒「睇住隻馬腳」。' },
  classmatepesocks: { st: [1, 6], name: '女同學PE襪', emoji: '🧦', slot: ['relic'], rarity: 'common', price: 5, tags: ['social'], fx: { stats: { social: 1 } }, desc: '體育堂後執到嘅失物，袋好交去失物招領處，等同學認領。' },
  nds:       { st: [1, 6], name: 'NDS', emoji: '🎮', slot: ['relic'], rarity: 'rare', price: 90, tags: ['otaku', 'tech'], fx: { ec: 2 }, desc: '打開雙螢幕，同同學連線，支觸控筆又唔知塞咗去邊。' },
  psp:       { st: [1, 6], name: 'PSP', emoji: '🕹️', slot: ['relic'], rarity: 'rare', price: 100, tags: ['otaku', 'social'], fx: { stats: { social: 1 }, ec: 1 }, desc: '放學約埋連線打機，部機冇電先肯收隊。' },
  battlespirits: { st: [1, 6], name: 'Battle Spirit卡', emoji: '🃏', slot: ['relic'], rarity: 'rare', price: 40, tags: ['otaku', 'social'], fx: { stats: { wits: 1, social: 1 } }, desc: '最鍾意嗰張用卡套包好，放學同同學研究點樣砌副牌。' },
  harrypotter: { st: [1, 6], name: '哈利波特書全套', emoji: '📚', slot: ['relic'], rarity: 'rare', price: 70, tags: ['book', 'art'], fx: { stats: { brain: 1, talk: 1 } }, desc: '一套排滿書架，睇到夜晚都仲唔肯熄燈。' },
  bionicles: { st: [1, 6], name: 'Bionicles模型', emoji: '🤖', slot: ['relic'], rarity: 'rare', price: 50, tags: ['otaku', 'tech', 'art'], fx: { stats: { art: 1, wits: 1 } }, desc: '換面具、砌武器，幫自己隻英雄擺個最威嘅姿勢。' },
  mariolego: { st: [1, 6], name: 'Super Mario Lego模型', emoji: '🧱', slot: ['relic'], rarity: 'rare', price: 60, tags: ['otaku', 'art'], fx: { stats: { art: 1 }, ec: 1 }, desc: '積木砌成一個蘑菇王國，書枱就係我設計嘅新關卡。' },
  charm:    { st: [0, 6], name: '黃大仙靈符', emoji: '🧧', slot: ['relic'], rarity: 'epic', price: 160, tags: [], fx: {}, special: 'luck', desc: '所有判定成功率 +8%。' },
  badge:    { st: [2, 6], name: '學生會徽章', emoji: '🏅', slot: ['relic'], rarity: 'rare', price: 120, tags: ['social'], fx: { sc: 1, stats: { social: 1 } }, desc: '「投我一票」。' },
  photo:    { st: [1, 6], name: '班相',      emoji: '📸', slot: ['relic'], rarity: 'rare', price: 100, tags: ['romance'], fx: {}, special: 'nodecay', desc: '非伴侶好感唔會每回合下降。' },
  nag:      { st: [0, 6], name: '阿媽嘅叮嚀', emoji: '🍜', slot: ['relic'], rarity: 'rare', price: 60, tags: ['family'], fx: { ec: 1 }, desc: '「早啲瞓啦！」' },
  vinyl:    { st: [2, 6], name: '黑膠唱片',   emoji: '💿', slot: ['relic'], rarity: 'rare', price: 110, tags: ['art'], fx: { stats: { art: 1 }, ec: 1 }, desc: '陳年老歌。' },
  diary:    { st: [1, 6], name: '日記簿',    emoji: '📓', slot: ['relic'], rarity: 'common', price: 40, tags: ['book'], fx: { stats: { wits: 1 } }, desc: '寫滿心事。' },
  mirror:   { st: [2, 6], name: '隨身鏡',    emoji: '🪞', slot: ['relic'], rarity: 'common', price: 70, tags: ['style'], fx: { stats: { look: 1 } }, desc: '每個鐘照三次。' },
  degree:   { st: [3, 6], name: '畢業證書',   emoji: '📜', slot: ['relic'], rarity: 'rare', price: 300, tags: ['study'], fx: { stats: { brain: 1 }, sc: 1 }, desc: '掛喺屋企最當眼位。', noshop: true },
  deed:     { st: [4, 6], name: '樓契',      emoji: '🏠', slot: ['relic'], rarity: 'epic', price: 3000, tags: ['family'], fx: { ec: 1, sc: 1 }, desc: '上咗車。供樓三十年。', noshop: true },
};

// Combos: if both parts are on the board → bonus. If orthogonally adjacent (across grids too) → ×2.
const COMBOS = [
  { name: 'WhatsApp 攻勢', a: 'id:phone',     b: 'id:pursue',   fx: { aff: 2 } },
  { name: '左碌右碌',      a: 'id:phone',     b: 'id:app',      fx: { aff: 2, ec: 1 } },
  { name: '主力球員',      a: 'tag:sport',    b: 'id:team',     fx: { stats: { fit: 1 } }, aItemOnly: true },
  { name: '樂隊夢',        a: 'id:guitar',    b: 'id:music',    fx: { stats: { art: 2 } } },
  { name: '補底',          a: 'tag:study',    b: 'id:tutor',    fx: { stats: { brain: 1 } }, aItemOnly: true },
  { name: '型到出汁',      a: 'id:wax',       b: 'id:cologne',  fx: { stats: { look: 2 } } },
  { name: '潮人',          a: 'tag:brand',    b: 'id:mall',     fx: { stats: { social: 1 }, money: -20 }, aItemOnly: true },
  { name: '毒L之路',       a: 'tag:otaku',    b: 'id:gaming',   fx: { ec: 2, stats: { social: -1 } }, aItemOnly: true },
  { name: '孝順仔',        a: 'id:parents',   b: 'id:nag',      fx: { ec: 1, sc: 1 } },
  { name: '文字攻勢',      a: 'id:letter',    b: 'id:pursue',   fx: { aff: 1 } },
  { name: '文青氣質',      a: 'id:novel',     b: 'id:library',  fx: { stats: { talk: 1, art: 1 } } },
  { name: '型男運動員',    a: 'id:gym',       b: 'id:mirror',   fx: { stats: { look: 1 } } },
  { name: '電子奶嘴',      a: 'id:tablet',    b: 'id:cartoon',  fx: { ec: 2, stats: { brain: -1 } } },
  { name: '小書蟲',        a: 'id:picbook',   b: 'id:playgroup', fx: { stats: { brain: 1, talk: 1 } } },
  { name: '天才兒童',      a: 'id:blocks',    b: 'id:interview', fx: { stats: { wits: 1, brain: 1 } } },
  { name: '小息霸主',      a: 'id:tcg',       b: 'id:football', fx: { stats: { social: 2 } } },
  { name: '精英打扮',      a: 'id:suit',      b: 'id:watch',    fx: { stats: { look: 2 }, sc: 1 } },
  { name: '效率提升',      a: 'id:laptop',    b: 'id:overtime', fx: { money: 200, ec: 1 } },
  { name: '自我增值',      a: 'id:laptop',    b: 'id:mba',      fx: { stats: { brain: 1 } } },
  { name: '人脈王',        a: 'id:namecard',  b: 'id:happyhour', fx: { sc: 2 } },
  { name: '慳家男',        a: 'id:hotpot',    b: 'id:parents',  fx: { money: 60, ec: 1 } },
  { name: '型格大叔',      a: 'id:carkey',    b: 'id:pilates',  fx: { stats: { look: 2 } } },
];

// ---------- 背景 ----------
const BACKGROUNDS = {
  finance: [
    { key: 'poor', name: '基層',   allowance: [30, 45, 60],   money: 40,  support: 0,   item: 'picbook', w: 35 },
    { key: 'mid',  name: '中產',   allowance: [50, 80, 110],  money: 80,  support: 100, item: 'blocks', w: 45 },
    { key: 'rich', name: '富二代', allowance: [90, 150, 220], money: 180, support: 400, item: 'tablet', w: 20 },
  ],
  edu: [
    { name: '家長中學畢業', brain: 0, w: 40 },
    { name: '家長大學畢業', brain: 1, w: 40 },
    { name: '家長係博士', brain: 2, w: 20 },
  ],
  happy: [
    { name: '屋企成日嗌交', ecMax: 8, w: 25 },
    { name: '普通家庭', ecMax: 10, w: 50 },
    { name: '家庭和睦', ecMax: 12, w: 25 },
  ],
};

// 住屋：由家境決定機率；村屋只會喺新界／離島出現
const HOUSING = [
  { key: 'public',  name: '公屋', emoji: '🏢', w: { poor: 70, mid: 10, rich: 0 } },
  { key: 'hos',     name: '居屋', emoji: '🏬', w: { poor: 20, mid: 35, rich: 0 } },
  { key: 'village', name: '村屋', emoji: '🏡', w: { poor: 10, mid: 15, rich: 15 }, nt: true },
  { key: 'private', name: '私樓', emoji: '🏙️', w: { poor: 0,  mid: 40, rich: 45 } },
  { key: 'luxury',  name: '豪宅', emoji: '🏰', w: { poor: 0,  mid: 0,  rich: 40 } },
];
const NT_DISTRICTS = ['kwai_tsing', 'tsuen_wan', 'tuen_mun', 'yuen_long', 'north', 'tai_po', 'sha_tin', 'sai_kung', 'islands'];

const SALARY = { uni: 1000, asso: 750, work: 650 };
const EDU_NAMES = { uni: '大學畢業', asso: '副學士', work: '中學畢業出嚟做' };

// ---------- 女仔 ----------
const GIRL_NAMES = ['Cherry 陳', 'Winnie 黃', 'Michelle 李', 'Bonnie 張', 'Fiona 何', 'Yoyo 梁', 'Joyce 林', 'Ivy 吳', 'Natalie 鄭', 'Kayan 蔡',
  'Tiffany 周', 'Hazel 馮', 'Mandy 劉', 'Gigi 曾', 'Rachel 楊', 'Sharon 麥', 'Cindy 鍾', 'Vivian 譚', 'Angel 盧', 'Jessica 葉', 'Queenie 余', 'Elaine 羅'];
const GIRL_EMOJI = ['👧', '👩', '👱‍♀️', '👩‍🦰', '🧕', '👩‍🦱'];
// perk: what she brings to the 伴侶欄 every turn while you're together
const ARCHETYPES = [
  { key: 'sporty', name: '運動型', prefs: { fit: 3, social: 2, look: 1 }, likes: ['sport'], dislikes: ['otaku'], tall: true, perk: { stats: { fit: 1 } }, minStage: 0 },
  { key: 'artsy',  name: '文青',   prefs: { art: 3, talk: 2, wits: 1 }, likes: ['art', 'book'], dislikes: ['brand'], perk: { stats: { art: 1 } }, minStage: 0 },
  { key: 'nerd',   name: '學霸',   prefs: { brain: 3, wits: 2, talk: 1 }, likes: ['study'], dislikes: ['style'], perk: { stats: { brain: 1 } }, minStage: 0 },
  { key: 'trendy', name: '潮女',   prefs: { look: 3, social: 2, wits: 1 }, likes: ['brand', 'style'], dislikes: ['otaku'], rich: true, tall: true, perk: { sc: 1, money: -50 }, minStage: 1 },
  { key: 'sweet',  name: '乖乖女', prefs: { brain: 2, talk: 2, social: 1, look: 1 }, likes: ['family'], dislikes: ['brand'], perk: { ec: 1 }, minStage: 0 },
  { key: 'boss',   name: '女強人', prefs: { brain: 2, talk: 2, wits: 2 }, likes: ['work', 'tech'], dislikes: ['otaku'], rich: true, perk: { money: 150 }, minStage: 3 },
  { key: 'chill',  name: '佛系',   prefs: { art: 2, social: 2, fit: 1 }, likes: ['family', 'art'], dislikes: ['work'], perk: { ec: 2 }, minStage: 3 },
];

const TAG_NAMES = { study: '讀書', brand: '名牌', style: '打扮', tech: '科技', sport: '運動', otaku: '毒L嘢', art: '藝術', romance: '浪漫', book: '書', family: '家庭', social: '社交', talk: '口才', work: '工作' };

// ---------- ⚡ 精力 cost per turn (activities) ----------
const ENERGY = {
  playmate: 1, park: 2, swim: 2, piano: 2, playgroup: 2, interview: 2, olympiad: 2, scouts: 2,
  pursue: 1, study: 2, run: 2, parents: 1, friends: 1, tutor: 2, team: 3, music: 2, debate: 2, library: 1,
  mall: 2, hike: 3, volunteer: 2, cafe: 1, gym: 3, movie: 1, overtime: 3, app: 1, mba: 2, happyhour: 1,
  stocks: 1, hotpot: 1, travel: 2, blind: 2, pilates: 3, wine: 1,
};
for (const [id, e] of Object.entries(ENERGY)) CARDS[id].energy = e;
// a few items/relics raise this turn's 精力 budget
CARDS.teddy.fx.energy = 1;       // 攬住公仔瞓得好
CARDS.nag.fx.energy = 1;         // 早瞓
CARDS.parents.fx.energy = 1;     // 飲完茶有力
// ---------- 場地 Venues ----------
// st: stages where you can go there.  items: cards that show up more in the shop as 熟悉度 rises.
// stat: what a casual visit trains.  Activities with a venue add +1 熟悉度 each turn they're scheduled.
const VENUES = {
  park:       { name: '屋邨遊樂場',   emoji: '🛝', st: [0, 1], stat: 'fit',    items: ['toycar', 'teddy', 'football', 'tcg', 'park'], desc: '韆鞦、滑梯、鬥快跑。' },
  kt_library: { name: '九龍塘圖書館', emoji: '🏛️', st: [0, 3], stat: 'brain',  items: ['picbook', 'novel', 'stationery', 'assess', 'sketchbook', 'diary', 'library', 'playgroup'], desc: '靜靜地，冷氣好凍。' },
  tutor:      { name: '旺角補習社',   emoji: '📝', st: [0, 2], stat: 'brain',  items: ['assess', 'stationery', 'tutor', 'olympiad', 'interview'], desc: '天王海報貼滿牆。' },
  court:      { name: '修頓球場',     emoji: '🏀', st: [1, 4], stat: 'fit',    items: ['football', 'basketball', 'paddle', 'team', 'gym', 'run'], desc: '鬥牛，輸咗請飲嘢。' },
  music:      { name: '通菜街琴行',   emoji: '🎼', st: [0, 6], stat: 'art',    items: ['piano', 'guitar', 'music', 'vinyl'], desc: '試彈咗成個下晝。' },
  temple:     { name: '黃大仙祠',     emoji: '🧧', st: [0, 6], stat: 'wits',   items: ['charm', 'redflower', 'photo', 'nag'], desc: '香火鼎盛。' },
  chacha:     { name: '街坊冰室',     emoji: '🍜', st: [1, 6], stat: 'social', items: ['comic', 'umbrella', 'nag', 'hotpot', 'friends'], desc: '凍檸茶少甜。' },
  ssp:        { name: '深水埗鴨寮街', emoji: '🔌', st: [1, 6], stat: 'wits',   items: ['tablet', 'console', 'tcg', 'phone', 'laptop', 'comic'], desc: '電子零件、二手機、平嘢。' },
  mk:         { name: '旺角朗豪坊',   emoji: '🛍️', st: [2, 6], stat: 'look',   items: ['brandbag', 'wax', 'cologne', 'mirror', 'cafe', 'phone', 'mall'], desc: '扭蛋、波鞋、行街。' },
  saikung:    { name: '西貢',         emoji: '⛰️', st: [2, 6], stat: 'fit',    items: ['hike', 'travel', 'umbrella', 'run', 'scouts'], desc: '海鮮、行山、影相。' },
  central:    { name: '中環 IFC',     emoji: '🏙️', st: [3, 6], stat: 'talk',   items: ['suit', 'watch', 'laptop', 'namecard', 'stocks', 'mba', 'overtime'], desc: '西裝友密集。' },
  lkf:        { name: '蘭桂坊',       emoji: '🍸', st: [3, 6], stat: 'social', items: ['happyhour', 'wine', 'cologne', 'carkey'], desc: '星期五晚，人山人海。' },
};
const CARD_VENUE = {
  park: 'park', piano: 'music', music: 'music', playgroup: 'kt_library', library: 'kt_library',
  interview: 'tutor', olympiad: 'tutor', tutor: 'tutor', team: 'court', mall: 'mk', cafe: 'mk',
  hike: 'saikung', scouts: 'saikung', happyhour: 'lkf', wine: 'lkf', mba: 'central', overtime: 'central',
  stocks: 'central', friends: 'chacha', hotpot: 'chacha',
};
for (const [id, v] of Object.entries(CARD_VENUE)) CARDS[id].venue = v;
const LOYALTY = [
  { name: '陌生', min: 0 },
  { name: '熟客', min: 3 },
  { name: '常客', min: 8 },
  { name: 'VIP',  min: 15 },
];
// ---------- 道具加成：書包入面有相關 tag 嘅道具，判定 +5%（最多 +15%） ----------
const STAT_TAGS = {
  fit: ['sport'], brain: ['study'], talk: ['talk', 'book'], art: ['art'],
  look: ['style', 'brand'], social: ['social', 'family'], wits: ['tech', 'otaku'],
};

// ---------- 經濟引擎 Engines ----------
// New engine cards
Object.assign(CARDS, {
  piggy:    { st: [0, 2], name: '豬仔錢罌', emoji: '🐷', slot: ['relic'], rarity: 'common', price: 15, tags: ['family'], fx: {}, special: 'interest', rate: 0.1, cap: 30, desc: '每回合：零用錢 +10% 利息（最多 +30）。早啲買，滾得耐。' },
  savings:  { st: [3, 6], name: '定期存款', emoji: '🏦', slot: ['relic'], rarity: 'rare', price: 500, tags: ['work'], fx: {}, special: 'interest', rate: 0.05, cap: 400, desc: '每回合：存款 +5% 利息（最多 +$400）。複利嘅威力。' },
  chores:   { st: [0, 2], name: '幫手做家務', emoji: '🧹', slot: ['weekday', 'weekend'], rarity: 'common', price: 5, time: 1, energy: 1, tags: ['family'], fx: { money: 5 }, desc: '阿媽見你乖，會慢慢加零用錢。' },
  parttime: { st: [2, 2], name: '暑期工',   emoji: '🍔', slot: ['weekend'], rarity: 'common', price: 20, time: 2, energy: 2, tags: ['work'], fx: { money: 50 }, desc: '快餐店炸薯條。' },
});
CARDS.namecard.fx = { sc: 1 };
CARDS.namecard.special = 'network';
CARDS.namecard.desc = '人脈變現：每回合 +$（人脈 × 10）。';

// grow: permanent gain each turn the card is scheduled (activities) or placed (relics), up to growMax for that card.
//   energy → ⚡精力上限（跨階段保留）, ecMax → 情緒上限, income → 人工/回合, allowance → 零用錢/回合（讀書時期）
const GROW = {
  team: [{ energy: 1 }, 2], run: [{ energy: 1 }, 1], swim: [{ energy: 1 }, 1], scouts: [{ energy: 1 }, 1],
  gym: [{ energy: 1 }, 2], pilates: [{ energy: 1 }, 2], park: [{ energy: 1 }, 1],
  hike: [{ ecMax: 1 }, 1], parents: [{ ecMax: 1 }, 1], volunteer: [{ ecMax: 1 }, 1],
  chores: [{ allowance: 5 }, 20], parttime: [{ allowance: 10 }, 30],
  mba: [{ income: 60 }, 180], overtime: [{ income: 30 }, 90],
};
for (const [id, [g, max]] of Object.entries(GROW)) { CARDS[id].grow = g; CARDS[id].growMax = max; }
const GROW_NAMES = { energy: '⚡精力上限', ecMax: '情緒上限', income: '人工/回合', allowance: '零用錢/回合' };

// mastery: scheduled activities that train a stat level up every 2 turns you keep them (Lv1–3, +1 to their main stat per level)
const MASTERY_EVERY = 2, MASTERY_MAX = 3;
// venues sell the new cards too
VENUES.temple.items.push('piggy'); VENUES.central.items.push('savings'); VENUES.chacha.items.push('parttime');

// ---------- 擇偶喜好 Dating preference & 化學 chemistry ----------
// Every girl has visible traits. When your 好感 with her reaches each RATE_AT threshold you must rate her (1–5★).
// Ratings move your preference weight for each of her traits; 化學 = how well a girl fits YOUR preferences.
const GIRL_TRAITS = {
  face:   { name: '樣貌',   values: { 1: '普通', 2: '清秀', 3: '靚女' } },
  height: { name: '身高',   values: { short: '細粒', mid: '中等', tall: '高挑' } },
  family: { name: '家境',   values: { poor: '基層', mid: '中產', rich: '富家女' } },
  value:  { name: '價值觀', values: { trad: '傳統', modern: '新潮' } },
  commit: { name: '感情觀', values: { serious: '認真', casual: '隨性' } },
  history: { name: '情史', values: { simple: '簡單', rich: '豐富' }, fromStage: 3 },   // only visible once you're both adults
};
const RATE_AT = [20, 50];
const PREF_MAX = 6;          // preference weight per trait is clamped to ±6
const CHEM_PER_WEIGHT = 6;   // 化學 = sum of her trait weights × 6, clamped to ±50
const STAR_LABELS = ['', '唔係我杯茶', '麻麻地', '普通', '幾鍾意', '就係佢！'];

// ---------- 身高 Height ----------
// age at each turn of each stage, and how much of adult height a boy has reached at that age
const TURN_AGES = [[4, 5, 6], [7, 9, 11], [13, 15, 17], [22, 23, 24], [27, 28, 29], [30, 32, 34], [38, 39, 40]];
const HEIGHT_FRAC = { 4: 0.59, 5: 0.63, 6: 0.66, 7: 0.69, 8: 0.72, 9: 0.75, 10: 0.78, 11: 0.80, 12: 0.83, 13: 0.87, 14: 0.91, 15: 0.95, 16: 0.97, 17: 0.99 };
const GROWTH_MAX = 5;   // cm you can add to your genetic height by doing sport while growing (幼稚園 → 中學)

// ---------- 法寶 Relics ----------
// Permanent passive perks. After each stage you pick 1 of 3 (6 picks per run). Not the same as 珍藏品 cards.
const RELICS = {
  coupon:   { name: '換貨券',     emoji: '🎟️', desc: '每個計劃回合，第一次換貨免費。' },
  goldpass: { name: '免死金牌',   emoji: '🛡️', desc: '每個事件階段，可以令一個判定直接成功。' },
  star:     { name: '幸運星',     emoji: '🍀', desc: '每個人生階段，第一次判定失敗會自動重擲一次。' },
  skip:     { name: '請病假',     emoji: '🤒', desc: '每個人生階段，可以略過一個普通事件（里程碑唔得）。' },
  bigbag:   { name: '大背囊',     emoji: '🎒', desc: '後備區 +2 格。' },
  planner:  { name: '時間管理大師', emoji: '📅', desc: '每回合 ⏰ 時間 +1。' },
  redbull:  { name: '能量飲品',   emoji: '🥫', desc: '每回合 ⚡ 精力上限 +1。' },
  vip:      { name: 'VIP 會員卡', emoji: '💳', desc: '商店所有嘢 9 折。' },
  extraslot:{ name: '多一格貨架', emoji: '🛒', desc: '商店每次多一個選擇（7 個）。' },
  learner:  { name: '過目不忘',   emoji: '🧠', desc: '熟練度每回合升一級（原本兩回合）。' },
  charmer:  { name: '情場高手',   emoji: '😎', desc: '表白同求婚成功率 +10%。' },
  mindread: { name: '讀心術',     emoji: '🔮', desc: '每認識一個新女仔，即刻知道佢 2 項喜好。' },
  pathfinder:{ name: '識路',      emoji: '🧭', desc: '每次去場地，熟悉度額外 +1。' },
  payday:   { name: '利是王',     emoji: '🧧', desc: '每回合收入（零用錢／人工）+15%。' },
};
const RELIC_CHOICES = 3;
