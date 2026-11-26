// ============================================================
// 港男物語 — events for all 7 life stages
// Event: { id, title, emoji, meet?: 'new'|'old', needGirl?, needPartner?, needItem?, venue?, when?(s), text(s, venueId), choices(s) }
// venue: where it happens (+1 熟悉度 on arrival, +4%/level to checks). Can be a function(s) → venue id.
// needItem: only appears when that card is on your board.
// Choice: { label, stat?, diff?, chance?, bonus?(s), use?: cardId (needs it on board: +20%, -1 耐久), req?(s), reqText?, cost?:{money,sc}, ok, fail }
// fx keys: stats, money, ec, sc, aff (event girl), paff (partner), affAll, income, item, reveal,
//          flag:{k:v}, marry, breakup, kids, gone (event girl leaves your life), meetNew,
//          loseItem: id, damage: {id: n}, upgrade: {id, ed}, loyalty: {venue: n}, venueItem (random item from this venue)
// {v} = venue name.
// Check difficulty = diff + current stage's diffAdd.  {g} = event girl's name.
// ============================================================

const hasPartner = s => s.partner !== null;
const isMarried = s => s.partner !== null && s.married;

const STAGE_EVENTS = [
  // ===================== 0 幼稚園 =====================
  {
    pool: [
      { id: 'k_park', title: '公園沙池', emoji: '🏖️', meet: 'new', venue: 'park',
        text: s => '公園沙池，有個小朋友 {g} 喺度砌緊沙城堡。',
        choices: s => [
          { label: '分享你啲玩具', stat: 'social', diff: 3, ok: { aff: 8, stats: { social: 1 }, text: '你哋即刻變咗好朋友。' }, fail: { aff: 2, text: '佢搶走咗你架車仔。' } },
          { label: '幫佢砌城堡', stat: 'art', diff: 3, ok: { aff: 8, stats: { art: 1 }, text: '城堡砌到有護城河！' }, fail: { aff: 1, ec: -1, text: '城堡塌咗，佢喊咗。' } },
          { label: '自己玩自己', ok: { ec: 1, text: '你玩得好開心，佢都係。' } },
        ] },
      { id: 'k_family', title: '父母朋友飲茶', emoji: '🥟', meet: 'new',
        text: s => '老豆老母同朋友飲茶，對方帶埋個女 {g}。',
        choices: s => [
          { label: '表演唱歌', stat: 'art', diff: 3, ok: { aff: 7, sc: 1, text: '全枱人拍手，{g} 都跟住唱。' }, fail: { ec: -1, text: '唱到一半忘記歌詞。' } },
          { label: '扮乖仔叫人', stat: 'talk', diff: 3, ok: { aff: 6, sc: 1, text: '「叔叔好、姨姨好！」大人好鍾意你。' }, fail: { aff: 1, text: '你叫錯人。' } },
          { label: '搶佢個蝦餃', ok: { aff: -3, ec: 2, text: '好味。佢瞪咗你一眼。' } },
        ] },
      { id: 'k_bday', title: '同學生日會', emoji: '🎂', needGirl: true,
        text: s => '{g} 生日會，全班都去咗麥當勞。',
        choices: s => [
          { label: '送份禮物', cost: { money: 15 }, ok: { aff: 6, text: '佢拆完即刻攬住份禮物。' } },
          { label: '帶頭唱生日歌', stat: 'social', diff: 4, ok: { aff: 5, sc: 1, text: '全場跟住你唱。' }, fail: { ec: -1, text: '冇人跟你唱。' } },
          { label: '專心食蛋糕', ok: { ec: 2, aff: -2, text: '你食咗三件。' } },
        ] },
      { id: 'k_shot', title: '打預防針', emoji: '💉',
        text: s => '阿媽帶你去打預防針。前面個細路喊到成棟樓都聽到。',
        choices: s => [
          { label: '扮勇敢唔喊', stat: 'fit', diff: 3, ok: { sc: 1, ec: 1, text: '護士姐姐獎你一張貼紙。' }, fail: { ec: -2, text: '你喊得比前面個仲大聲。' } },
          { label: '匿埋喺椅底', stat: 'wits', diff: 4, ok: { ec: 1, text: '拖到診所收工。（下次再打）' }, fail: { ec: -2, text: '阿媽一手抽你出嚟。' } },
        ] },
      { id: 'k_lost', title: '商場迷路', emoji: '🏬',
        text: s => '喺商場同阿媽失散咗。',
        choices: s => [
          { label: '搵保安叔叔', stat: 'talk', diff: 3, ok: { sc: 1, stats: { talk: 1 }, text: '廣播搵到阿媽。' }, fail: { ec: -2, text: '你講唔清楚自己叫咩名。' } },
          { label: '原地等', stat: 'wits', diff: 3, ok: { stats: { wits: 1 }, text: '阿媽好快返嚟搵到你。' }, fail: { ec: -1, text: '等咗好耐好耐。' } },
          { label: '大喊', ok: { ec: -2, text: '最後係清潔姐姐帶你返去。' } },
        ] },
    ],
    milestone: { id: 'k_ms', title: '小一派位', emoji: '🏫', milestone: true,
      text: s => '阿媽帶你去名校面試。校長望住你：「小朋友，介紹下自己啦。」',
      choices: s => [
        { label: '自我介紹', stat: 'talk', diff: 4,
          ok: { flag: { primary: '名校' }, sc: 2, stats: { brain: 1 }, text: '入咗名校！升中派位會有優勢。' },
          fail: { flag: { primary: '屋邨小學' }, ec: -1, text: '口窒窒。派咗去屋邨小學。' } },
        { label: '即場砌積木', stat: 'art', diff: 4,
          ok: { flag: { primary: '名校' }, stats: { art: 1 }, text: '校長讚你有創意。入咗名校！' },
          fail: { flag: { primary: '屋邨小學' }, text: '積木跌晒落地。派咗去屋邨小學。' } },
        { label: '叫阿爸捐座禮堂', req: s => s.bg.finance.key === 'rich', reqText: '要係富二代',
          ok: { flag: { primary: '名校' }, text: '錢搞得掂嘅事，都唔係事。' } },
        { label: '唔去面試，玩多陣', ok: { flag: { primary: '屋邨小學' }, ec: 2, text: '屋邨小學都幾好玩。' } },
      ] },
  },

  // ===================== 1 小學 =====================
  {
    pool: [
      { id: 'p_class', title: '新同學', emoji: '🎒', meet: 'new',
        text: s => '新學年，坐你隔離嘅係 {g}。',
        choices: s => [
          { label: '借佢擦膠', ok: { aff: 4, text: '佢話多謝。' } },
          { label: '講笑話', stat: 'talk', diff: 4, ok: { aff: 7, stats: { talk: 1 }, text: '佢笑到俾老師罰企。' }, fail: { aff: 1, text: '冷場。' } },
          { label: '扮酷', stat: 'look', diff: 4, ok: { aff: 5, text: '佢偷偷望你。' }, fail: { text: '佢以為你肚痛。' } },
        ] },
      { id: 'p_tutor', title: '補習社', emoji: '📝', meet: 'new', venue: 'tutor',
        text: s => '補習社識咗隔離學校嘅 {g}，佢做緊一條好難嘅數。',
        choices: s => [
          { label: '教佢做數', stat: 'brain', diff: 4, ok: { aff: 8, stats: { brain: 1 }, text: '佢話你好叻。' }, fail: { aff: 1, ec: -1, text: '你教錯咗。' } },
          { label: '請佢食魚蛋', cost: { money: 10 }, ok: { aff: 5, text: '咖喱魚蛋，加辣。' } },
          { label: '專心做自己功課', ok: { stats: { brain: 1 }, text: '你做完晒。' } },
        ] },
      { id: 'p_recess', title: '小息踢波', emoji: '⚽', venue: 'court',
        text: s => '小息，隔離班挑機踢波。',
        choices: s => [
          { label: '落場', stat: 'fit', diff: 4, use: 'football', useOptional: true, ok: { sc: 2, stats: { social: 1 }, text: '你入咗兩球，成班人膊頭膊頭。' }, fail: { ec: -2, text: '甩咗隻鞋，跌親。' } },
          { label: '做球證', stat: 'wits', diff: 3, ok: { sc: 1, text: '判得公道，兩班都服。' }, fail: { sc: -1, text: '兩班都話你偏心。' } },
          { label: '睇漫畫', ok: { ec: 1, text: '安安靜靜。' } },
        ] },
      { id: 'p_gift', title: '聖誕交換禮物', emoji: '🎁', needGirl: true,
        text: s => '聖誕聯歡會交換禮物，你抽中 {g}。',
        choices: s => [
          { label: '精心準備', cost: { money: 20 }, ok: { aff: 7, text: '佢好鍾意。' } },
          { label: '自己畫張卡', stat: 'art', diff: 4, ok: { aff: 8, text: '佢將張卡貼咗喺手冊。' }, fail: { aff: 1, text: '畫得好似一舊雲。' } },
          { label: '隨便買包糖', ok: { aff: 2, text: '佢話多謝……' } },
        ] },
      { id: 'p_test', title: '測驗派卷', emoji: '💯',
        text: s => '測驗派卷，要拎返屋企俾家長簽名。',
        choices: s => [
          { label: '對答案', stat: 'brain', diff: 4, ok: { money: 20, ec: 1, text: '一百分！阿爺俾 $20 獎勵。' }, fail: { ec: -2, text: '藤條燜豬肉。' } },
          { label: '模仿阿媽簽名', stat: 'wits', diff: 6, ok: { ec: 1, text: '天衣無縫。' }, fail: { sc: -2, ec: -3, text: '老師打電話返屋企。' } },
        ] },
      { id: 'p_friend', title: '去朋友屋企', emoji: '🏠',
        text: s => '去好朋友屋企玩，佢有部新遊戲機。',
        choices: s => [
          { label: '一齊打機', ok: { ec: 2, stats: { social: 1 }, text: '打到佢阿媽趕人。' } },
          { label: '同佢交換遊戲卡', stat: 'talk', diff: 4, ok: { item: 'tcg', text: '獲得 🃏 遊戲卡。' }, fail: { sc: -1, text: '佢話你呃佢。' } },
        ] },
    ],
    milestone: { id: 'p_ms', title: '升中派位', emoji: '📮', milestone: true,
      text: s => `升中派位。你讀${s.flags.primarySchool?.name || s.flags.primary || '小學'}${s.flags.primary === '名校' ? '，有直屬優勢（+10%）' : ''}。報邊間？`,
      choices: s => [
        { label: '報 Band 1 男校', stat: 'brain', diff: 5, bonus: s => s.flags.primary === '名校' ? 10 : 0,
          ok: { flag: { school: { key: 'boys', band: 1, name: 'Band 1 男校' } }, sc: 1, text: '入咗 Band 1 男校。身邊……全部都係男人。' },
          fail: { flag: { school: { key: 'boys', band: 2, name: 'Band 2 男校' } }, ec: -1, text: '差少少，派咗去 Band 2 男校。' } },
        { label: '報 Band 1 Co-ed', stat: 'brain', diff: 6, bonus: s => s.flags.primary === '名校' ? 10 : 0,
          ok: { flag: { school: { key: 'coed', band: 1, name: 'Band 1 Co-ed' } }, sc: 1, text: '入咗 Band 1 Co-ed！' },
          fail: { flag: { school: { key: 'coed', band: 2, name: 'Band 2 Co-ed' } }, ec: -1, text: '差少少，派咗去 Band 2 Co-ed。' } },
        { label: '隨緣派位', chance: 40,
          ok: { flag: { school: { key: 'coed', band: 1, name: 'Band 1 Co-ed' } }, text: '執到！Band 1 Co-ed。' },
          fail: { flag: { school: { key: 'coed', band: 3, name: 'Band 3 Co-ed' } }, text: 'Band 3 Co-ed。都好，自由啲。' } },
      ] },
  },

  // ===================== 2 中學 =====================
  {
    pool: [
      { id: 'first_day', title: '開學日', emoji: '🏫', meet: 'new',
        text: s => s.flags.school?.key === 'boys'
          ? '男校開學，周圍都係臭男人。放學喺補習社門口，你見到隔離女校嘅 {g}。'
          : '中一開學，班主任編位，坐你隔離嘅係 {g}。',
        choices: s => [
          { label: '主動自我介紹', stat: 'talk', diff: 4, ok: { aff: 8, stats: { talk: 1 }, text: '你講咗個冷笑話，佢竟然笑咗。' }, fail: { aff: 2, ec: -1, text: '口窒窒，講到自己個名都讀錯。' } },
          { label: '撥一撥頭髮，扮型', stat: 'look', diff: 5, ok: { aff: 6, text: '佢偷偷望咗你兩眼。' }, fail: { text: '佢根本冇留意你。' } },
          { label: '借支筆俾佢', ok: { aff: 4, sc: 1, text: '簡單直接，佢話多謝。' } },
        ] },
      { id: 'joint_school', title: '聯校學會活動', emoji: '🎪', meet: 'new',
        text: s => '聯校迎新營，分組時你同 {g} 同一組。組爸組媽叫大家「表演一個才藝」。',
        choices: s => [
          { label: '即場表演才藝', stat: 'art', diff: 5, ok: { aff: 9, sc: 1, text: '全場拍手，{g} 拍得最大力。' }, fail: { aff: 1, ec: -2, text: '你嘅 beatbox 好似漏氣嘅單車胎。' } },
          { label: '帶動氣氛', stat: 'social', diff: 5, ok: { aff: 6, sc: 2, text: '你成為咗全組嘅焦點。' }, fail: { ec: -1, text: '冷場。冷到可以雪豬肉。' } },
          { label: '靜靜幫手搬嘢', stat: 'fit', diff: 3, ok: { aff: 4, text: '{g}：「你好 nice 喎。」' }, fail: { ec: -1, text: '你閃親腰。' } },
        ] },
      { id: 'library', title: '圖書館奇遇', emoji: '📚', meet: 'new', venue: 'kt_library',
        text: s => '{v}，你同 {g} 同時伸手攞同一本書。',
        choices: s => [
          { label: '傳紙仔', stat: 'wits', diff: 5, ok: { aff: 8, text: '佢喺紙仔畫咗個笑臉。' }, fail: { aff: -2, text: '圖書館主任沒收咗你張紙仔，仲讀埋出嚟。' } },
          { label: '推介另一本更好嘅書', stat: 'art', diff: 5, ok: { aff: 7, stats: { talk: 1 }, text: '你哋講咗成個鐘。' }, fail: { aff: 1, text: '佢已經睇過，而且覺得好悶。' } },
          { label: '讓俾佢', ok: { aff: 3, text: '紳士風度。' } },
        ] },
      { id: 'sports_day', title: '陸運會', emoji: '🏅', needGirl: true,
        text: s => '陸運會，{g} 喺看台。4x100 接力仲差一個人。',
        choices: s => [
          { label: '頂上去跑最後一棒', stat: 'fit', diff: 7, ok: { affAll: 6, sc: 2, stats: { social: 1 }, text: '衝線！全場尖叫。' }, fail: { ec: -3, sc: -1, text: '跣親，成個人仆落跑道。' } },
          { label: '做啦啦隊打氣', stat: 'social', diff: 5, ok: { aff: 4, sc: 1, text: '{g} 覺得你好熱血。' }, fail: { text: '冇人理你。' } },
          { label: '喺看台溫書', ok: { stats: { brain: 1 }, text: '你係全場唯一一個溫書嘅人。' } },
        ] },
      { id: 'halloween', title: 'Halloween Party', emoji: '🎃', needGirl: true,
        text: s => '同學屋企搞 Halloween party，聽講 {g} 都會嚟。',
        choices: s => [
          { label: '買套靚 costume', cost: { money: 100 }, ok: { aff: 8, stats: { look: 1 }, text: '你扮蝙蝠俠，型到爆。' } },
          { label: '自製扮鬼', stat: 'art', diff: 6, ok: { aff: 7, sc: 1, text: '{g} 話你好有心思。' }, fail: { ec: -2, text: '大家以為你扮垃圾袋。' } },
          { label: '唔去，喺屋企打機', ok: { ec: 2, text: '你錯過咗一啲嘢，但好爽。' } },
        ] },
      { id: 'xmas', title: '聖誕派對', emoji: '🎄', needGirl: true,
        text: s => '聖誕派對。{g} 戴住聖誕帽，自己一個企喺露台。',
        choices: s => [
          { label: '送份禮物', cost: { money: 120 }, ok: { aff: 10, text: '佢打開盒，笑得好甜。' } },
          { label: '攞結他出嚟自彈自唱', use: 'guitar', stat: 'art', diff: 7,
            ok: { aff: 16, affAll: 4, sc: 2, text: '全場靜晒。呢一刻你係主角。' }, fail: { aff: -3, ec: -2, text: '走音走到天文台。' } },
          { label: '行埋去傾偈', stat: 'talk', diff: 7, ok: { aff: 10, text: '你哋傾到派對完。' }, fail: { aff: -4, ec: -1, text: '你講咗半個鐘你部遊戲機。' } },
        ] },
      { id: 'seen', title: '已讀不回', emoji: '✔️', needGirl: true,
        text: s => '你 send 咗段長 message 俾 {g}。兩個剔變藍，之後……冇然後。',
        choices: s => [
          { label: '再 send 多個 sticker', stat: 'wits', diff: 6, ok: { aff: 4, text: '個 sticker 揀得啱，佢回咗個 haha。' }, fail: { aff: -5, ec: -2, text: '佢覺得你好煩。' } },
          { label: '冷處理', ok: { ec: -1, text: '你忍住唔 send，但成晚瞓唔着。' } },
        ] },
      { id: 'rival', title: '情敵出現', emoji: '⚔️', needGirl: true,
        text: s => '籃球隊隊長都喺度追 {g}。',
        choices: s => [
          { label: '動用人脈打聽 (人脈 -2)', cost: { sc: 2 }, ok: { aff: 3, reveal: true, text: '你知道咗佢多啲嘢。' } },
          { label: '約隊長鬥波', stat: 'fit', diff: 7, ok: { aff: 8, sc: 2, text: '你入咗絕殺。' }, fail: { aff: -6, ec: -2, text: '你被蓋咗三次火鍋。' } },
          { label: '戰略性撤退', ok: { aff: -6, ec: 1, text: '好心痛，但起碼唔使出醜。' } },
        ] },
      { id: 'family_fight', title: '屋企嗌交', emoji: '💢',
        text: s => '老豆老母又為錢嗌交，嗌到隔離屋都聽到。',
        choices: s => [
          { label: '做和事佬', stat: 'talk', diff: 6, ok: { ec: 1, sc: 1, text: '你成功令佢哋笑返。' }, fail: { ec: -3, text: '兩個一齊鬧你。' } },
          { label: '出去跑步', ok: { ec: -1, stats: { fit: 1 }, text: '跑到唔記得煩。' } },
        ] },
      { id: 'money_found', title: '執到錢', emoji: '💰',
        text: s => '喺巴士站執到個銀包，入面有 $200。',
        choices: s => [
          { label: '袋袋平安', ok: { money: 200, ec: -1, text: '有錢，但良心有啲痛。' } },
          { label: '交去警署', ok: { sc: 3, stats: { social: 1 }, text: '失主係校長嘅阿媽。全校都知你係好人。' } },
        ] },
      { id: 'debate', title: '班際辯論', emoji: '🎙️',
        text: s => '班主任揀咗你做班際辯論主辯。',
        choices: s => [
          { label: '迎戰', stat: 'talk', diff: 6, ok: { sc: 2, affAll: 3, stats: { wits: 1 }, text: '最佳辯論員！' }, fail: { ec: -2, text: '你講到一半忘記咗自己係正方定反方。' } },
          { label: '詐病', stat: 'wits', diff: 4, ok: { ec: 1, text: '瞞天過海。' }, fail: { sc: -2, text: '班主任打俾你阿媽。' } },
        ] },
    ],
    milestone: { id: 's_ms', title: 'DSE 放榜', emoji: '📜', milestone: true,
      text: s => 'DSE 放榜日。成績會決定你嘅學歷同第一份人工。',
      choices: s => [
        { label: '靠實力', stat: 'brain', diff: 6,
          ok: { flag: { edu: 'uni' }, item: 'degree', text: '入到大學！四年後拎到 📜 畢業證書。' },
          fail: { flag: { edu: 'asso' }, ec: -2, text: '差少少。讀副學士。' } },
        { label: '最後衝刺上天王 cram', cost: { money: 150 }, use: 'assess', useOptional: true, stat: 'brain', diff: 4,
          ok: { flag: { edu: 'uni' }, item: 'degree', text: '天王貼中題！入到大學。' },
          fail: { flag: { edu: 'asso' }, ec: -1, text: '貼唔中。讀副學士。' } },
        { label: '唔考，直接出嚟做嘢', ok: { flag: { edu: 'work' }, money: 400, text: '早幾年出嚟搵錢，儲咗 $400。' } },
      ] },
  },

  // ===================== 3 新畢業 22–24 =====================
  {
    pool: [
      { id: 'g_colleague', title: '新同事', emoji: '🏢', meet: 'new',
        text: s => '第一份工。坐你對面嘅係同事 {g}。',
        choices: s => [
          { label: '約佢食 lunch', cost: { money: 60 }, ok: { aff: 6, text: '你哋發現大家都鍾意食車仔麵。' } },
          { label: '幫佢趕 report', stat: 'brain', diff: 5, ok: { aff: 9, text: '佢請你飲咖啡多謝你。' }, fail: { aff: 1, ec: -2, text: '你搞錯咗條 formula。' } },
          { label: '扮忙', ok: { ec: 1, text: '冇人留意你。' } },
        ] },
      { id: 'g_reunion', title: '中學同學會', emoji: '🥂', meet: 'old', venue: 'chacha',
        text: s => '中學同學會喺{v}，{g} 都嚟咗，仲靚過以前。',
        choices: s => [
          { label: '敘舊', stat: 'talk', diff: 5, ok: { aff: 10, text: '講起以前嘅事，佢笑到停唔到。' }, fail: { aff: 2, text: '佢唔太記得你。' } },
          { label: '炫耀份工', stat: 'social', diff: 5, ok: { aff: 6, sc: 2, text: '大家都好羨慕。' }, fail: { aff: -3, text: '有人話你好串。' } },
          { label: '坐埋一邊食嘢', ok: { ec: 1, text: '自助餐幾好食。' } },
        ] },
      { id: 'g_app', title: '交友App配對', emoji: '📲', meet: 'new',
        text: s => '交友App配對成功：{g}。約咗出嚟飲咖啡。',
        choices: s => [
          { label: '真誠傾偈', stat: 'talk', diff: 5, ok: { aff: 9, text: '一坐就三個鐘。' }, fail: { aff: 1, ec: -1, text: '你一直講返工。' } },
          { label: '搞笑', stat: 'wits', diff: 5, ok: { aff: 8, text: '佢笑到咖啡噴出嚟。' }, fail: { aff: -2, text: '佢話你個笑話有啲 offensive。' } },
          { label: '靠樣', stat: 'look', diff: 6, use: 'cologne', useOptional: true, ok: { aff: 7, text: '佢話你本人仲靚仔過相。' }, fail: { aff: -5, ec: -2, text: '佢話你本人同相差好遠。' } },
        ] },
      { id: 'g_scare', title: '兩條線', emoji: '🧪', needPartner: true, when: s => !s.married,
        text: s => '{g} 拎住驗孕棒，望住你。兩條線。',
        choices: s => [
          { label: '負責任，結婚！', ok: { marry: true, flag: { shotgun: true }, aff: 20, money: -800, ec: -2, text: '你哋閃婚。人生快咗幾年。' } },
          { label: '一齊面對', stat: 'talk', diff: 6, ok: { aff: 10, ec: -1, text: '原來係虛驚一場，但你哋更加親密。' }, fail: { aff: -6, ec: -3, text: '你嘅反應令佢好失望。' } },
          { label: '飛佢', ok: { breakup: true, sc: -3, ec: -4, text: '你封鎖咗佢。朋友圈都知你係咩人。' } },
        ] },
      { id: 'g_overtime', title: '通宵趕 deadline', emoji: '🌙', venue: 'central',
        text: s => '老細叫你成個禮拜通宵趕 deadline。',
        choices: s => [
          { label: '頂硬上', stat: 'fit', diff: 6, ok: { income: 100, ec: -2, text: '老細記住你。人工 +$100。' }, fail: { ec: -4, text: '你喺 office 瞓着咗。' } },
          { label: '拒絕', stat: 'talk', diff: 6, ok: { ec: 1, text: '老細竟然接受咗。' }, fail: { income: -50, sc: -1, text: '你被標籤為「冇團隊精神」。' } },
        ] },
      { id: 'g_moveout', title: '搬出去住', emoji: '📦',
        text: s => '你想搬出去住，但香港租金……',
        choices: s => [
          { label: '租劏房', cost: { money: 300 }, ok: { ec: 2, sc: 1, text: '細，但係自己嘅。' } },
          { label: '繼續住屋企', ok: { money: 200, ec: -1, text: '慳到錢，但阿媽日日問你幾點返。' } },
        ] },
    ],
    milestone: { id: 'g_ms', title: '年終考績', emoji: '📊', milestone: true,
      text: s => '年終考績。老細約你入房傾。',
      choices: s => [
        { label: '用數據說話', stat: 'brain', diff: 6, ok: { income: 250, text: '升職加薪！人工 +$250。' }, fail: { ec: -2, text: '「繼續努力。」凍薪。' } },
        { label: '擦老細鞋', stat: 'talk', diff: 6, ok: { income: 250, sc: -1, text: '老細好受落。人工 +$250。' }, fail: { ec: -2, text: '擦錯鞋。' } },
        { label: '拎 offer 跳槽', stat: 'wits', diff: 7, ok: { income: 400, text: '新公司人工 +$400！' }, fail: { income: -100, ec: -2, text: '新公司仲差。人工 -$100。' } },
      ] },
  },

  // ===================== 4 二十尾 27–29 =====================
  {
    pool: [
      { id: 'l_wedding', title: '兄弟婚禮', emoji: '💒', meet: 'new', venue: 'central',
        text: s => '好兄弟結婚，你做兄弟。伴娘 {g} 好有眼緣。',
        choices: s => [
          { label: '搭訕', stat: 'talk', diff: 6, ok: { aff: 10, text: '交換咗 IG。' }, fail: { aff: 1, ec: -1, text: '佢話佢有男朋友……其實冇。' } },
          { label: '玩新郎玩到出位', stat: 'social', diff: 6, ok: { aff: 6, sc: 2, text: '全場氣氛最高點。' }, fail: { sc: -2, text: '新娘黑晒面。' } },
          { label: '封個大利是', cost: { money: 500 }, ok: { sc: 3, aff: 3, text: '兄弟感動到喊。' } },
        ] },
      { id: 'l_nag', title: '大姑媽', emoji: '👵', when: s => !s.married,
        text: s => '屋企飯局，大姑媽問：「幾時結婚呀？」',
        choices: s => [
          { label: '帶埋女朋友嚟', req: s => hasPartner(s), reqText: '要拍緊拖', ok: { paff: 5, sc: 1, text: '大姑媽好滿意：「幾時飲？」' } },
          { label: '機智回應', stat: 'wits', diff: 6, ok: { ec: 1, text: '「等你攞到曾孫先啦。」全場大笑。' }, fail: { ec: -3, text: '佢開始介紹佢朋友個女俾你。' } },
          { label: '匿入廁所', ok: { ec: -1, text: '匿咗四十分鐘。' } },
        ] },
      { id: 'l_promo', title: '升職機會', emoji: '📈',
        text: s => '有個 manager 位出咗缺。',
        choices: s => [
          { label: '爭取', stat: 'brain', diff: 7, ok: { income: 300, ec: -1, text: '升咗 manager！人工 +$300。' }, fail: { ec: -3, text: '俾個識擦鞋嘅攞咗。' } },
          { label: '讓俾同事', ok: { sc: 2, ec: 1, text: '同事欠你一個人情。' } },
        ] },
      { id: 'l_emigrate', title: '移民潮', emoji: '🛫',
        text: s => '好幾個朋友移咗民。',
        choices: s => [
          { label: '去機場送機', ok: { ec: -1, sc: 1, text: '「保持聯絡。」' } },
          { label: '開個 farewell party', cost: { money: 200 }, ok: { sc: 2, ec: 1, text: '一齊飲到天光。' } },
        ] },
      { id: 'l_cohabit', title: '同居？', emoji: '🔑', needPartner: true, when: s => !s.married,
        text: s => '{g} 提議一齊住，慳返啲租。',
        choices: s => [
          { label: '好呀', ok: { money: 300, aff: 8, ec: 1, text: '每朝起身見到佢。' } },
          { label: '未準備好', ok: { aff: -6, text: '佢有少少失望。' } },
        ] },
      { id: 'l_exwed', title: '請柬', emoji: '💌', meet: 'old',
        text: s => '你收到 {g} 嘅結婚請柬。',
        choices: s => [
          { label: '出席祝福', cost: { money: 400 }, ok: { gone: true, sc: 2, ec: -1, text: '佢好幸福。你都替佢開心……吧。' } },
          { label: '唔去', ok: { gone: true, ec: -2, text: '你成晚望住請柬。' } },
          { label: '搶婚', stat: 'talk', diff: 9, ok: { aff: 25, sc: -3, text: '……佢跟咗你走！全場嘩然。' }, fail: { gone: true, sc: -4, ec: -4, text: '保安請你離場。' } },
        ] },
    ],
    milestone: { id: 'l_ms', title: '上車？', emoji: '🏠', milestone: true,
      text: s => '三十歲前，要唔要上車？首期要 $3000。',
      choices: s => [
        { label: '上車', cost: { money: 3000 }, ok: { item: 'deed', ec: -2, flag: { flat: true }, paff: 10, text: '獲得 🏠 樓契。供樓三十年。' } },
        { label: '繼續租樓', ok: { ec: 1, text: '自由自在，但租金年年加。' } },
        { label: '搬返屋企住', ok: { money: 500, ec: -1, paff: -5, text: '慳到錢。伴侶唔太開心。' } },
      ] },
  },

  // ===================== 5 三十頭 30–34 =====================
  {
    pool: [
      { id: 'e_blind', title: '相親', emoji: '💐', meet: 'new', when: s => !hasPartner(s),
        text: s => '阿媽安排咗相親，對方係 {g}。',
        choices: s => [
          { label: '認真傾', stat: 'talk', diff: 6, ok: { aff: 9, text: '傾得幾投契。' }, fail: { aff: 0, ec: -1, text: '冷場。兩個阿媽比你哋傾得仲多。' } },
          { label: '講份工同層樓', stat: 'brain', diff: 6, ok: { aff: 7, text: '佢媽好滿意。' }, fail: { aff: -3, text: '佢覺得你好現實。' } },
          { label: '扮冇興趣', ok: { ec: 1, aff: -3, text: '交差。' } },
        ] },
      { id: 'e_colleague', title: '新上司', emoji: '👩‍💼', meet: 'new', when: s => !isMarried(s),
        text: s => '公司嚟咗個新上司 {g}，佢第一日就搵你傾 project。',
        choices: s => [
          { label: '表現專業', stat: 'brain', diff: 6, ok: { aff: 8, income: 100, text: '佢對你印象好好。' }, fail: { ec: -2, text: '你 present 到一半部手提電腦死機。' } },
          { label: '保持距離', ok: { ec: 1, text: '公私分明。' } },
        ] },
      { id: 'e_metab', title: '褲頭緊', emoji: '👖',
        text: s => '褲頭開始緊。',
        choices: s => [
          { label: '戒宵夜', stat: 'fit', diff: 6, ok: { stats: { fit: 1, look: 1 }, text: '瘦返五磅。' }, fail: { ec: -2, stats: { look: -1 }, text: '第三晚就破戒。' } },
          { label: '買大碼褲', cost: { money: 200 }, ok: { ec: 1, text: '舒服晒。' } },
        ] },
      { id: 'e_layoff', title: '公司裁員', emoji: '📉',
        text: s => '公司宣佈裁員兩成。',
        choices: s => [
          { label: '爭取留低', stat: 'wits', diff: 7, ok: { sc: 1, text: '你留低咗。' }, fail: { income: -200, ec: -3, text: '你被炒。新工人工少咗 $200。' } },
          { label: '主動拎遣散費走', ok: { money: 1500, income: -150, ec: 1, text: '拎咗 $1500，轉咗份輕鬆啲但人工少啲嘅工。' } },
        ] },
      { id: 'e_fb', title: 'Facebook 舊同學', emoji: '👍', meet: 'old',
        text: s => '{g} 喺 Facebook 加你。',
        choices: s => [
          { label: '約食飯', cost: { money: 200 }, ok: { aff: 8, text: '好似返返去以前咁。' } },
          { label: '留言 like 相', stat: 'talk', diff: 6, ok: { aff: 5, text: '佢回咗個心心。' }, fail: { text: '佢冇回。' } },
          { label: '唔理', ok: { text: '……' } },
        ] },
      { id: 'e_hospital', title: '老豆入院', emoji: '🏥',
        text: s => '老豆入咗院。',
        choices: s => [
          { label: '請假照顧', cost: { money: 300 }, ok: { ec: -1, sc: 1, paff: 5, text: '老豆好快出院。' } },
          { label: '請工人', cost: { money: 500 }, ok: { text: '安排妥當。' } },
          { label: '太忙，去唔到', ok: { ec: -4, text: '你一直內疚。' } },
        ] },
    ],
    milestone: { id: 'e_ms', title: '三十而立', emoji: '🎯', milestone: true,
      text: s => hasPartner(s) ? `${s.girls[s.partner].name}：「我哋……係咪應該結婚？」`
        : '三十幾歲，仲係單身。阿媽落最後通牒。',
      choices: s => hasPartner(s) ? [
          { label: '即刻求婚', cost: { money: 1000 }, ok: { marry: true, paff: 15, text: '佢喊住答應咗！' } },
          { label: '再拖下', ok: { paff: -15, ec: -1, text: '佢好失望。' } },
          { label: '分手', ok: { breakup: true, ec: -3, text: '五年感情，一句完。' } },
        ] : [
          { label: '參加相親大會', ok: { meetNew: true, ec: -1, text: '識咗個新朋友。' } },
          { label: '「我自己會搵！」', ok: { ec: 1, sc: -1, text: '阿媽冇再出聲。' } },
        ] },
  },

  // ===================== 6 四十 =====================
  {
    pool: [
      { id: 'f_crisis', title: '中年危機', emoji: '🌀',
        text: s => '有一朝你望住鏡，問自己：「就係咁？」',
        choices: s => [
          { label: '買架跑車', cost: { money: 1800 }, ok: { item: 'carkey', ec: 3, text: '獲得 🏎️ 跑車鎖匙。' } },
          { label: '報名跑馬拉松', stat: 'fit', diff: 7, ok: { stats: { fit: 2 }, ec: 2, text: '完成咗！' }, fail: { ec: -3, text: '跑咗五公里就抽筋。' } },
          { label: '重新學結他', stat: 'art', diff: 6, ok: { item: 'guitar', ec: 1, text: '獲得 🎸 結他。' }, fail: { ec: -1, text: '手指太硬。' } },
        ] },
      { id: 'f_ex', title: '舊情人', emoji: '📱', meet: 'old',
        text: s => '{g} WhatsApp 你：「好耐冇見，最近點？」',
        choices: s => hasPartner(s) ? [
          { label: '禮貌回覆，唔見面', ok: { paff: 5, text: '你將對話俾伴侶睇。佢好安心。' } },
          { label: '約出嚟見個面', ok: { aff: 10, paff: -20, ec: -1, text: '你返到屋企，伴侶冇出聲。' } },
        ] : [
          { label: '約出嚟', stat: 'talk', diff: 7, ok: { aff: 12, text: '好似時光倒流。' }, fail: { aff: 2, text: '大家都變咗。' } },
          { label: '已讀不回', ok: { ec: -1, text: '算啦。' } },
        ] },
      { id: 'f_checkup', title: '驗身報告', emoji: '🩺',
        text: s => '驗身報告出咗：膽固醇高、血壓高。',
        choices: s => [
          { label: '開始做運動', stat: 'fit', diff: 7, ok: { ec: 2, stats: { fit: 1 }, text: '指數返正常。' }, fail: { ec: -3, text: '堅持唔到。' } },
          { label: '唔睇', ok: { ec: 1, text: '眼不見為乾淨。' } },
        ] },
      { id: 'f_parents', title: '父母年老', emoji: '👴',
        text: s => '老豆老母年紀大，行動開始唔方便。',
        choices: s => [
          { label: '帶佢哋去旅行', cost: { money: 800 }, ok: { ec: 3, sc: 1, text: '佢哋好開心。' } },
          { label: '請工人照顧', cost: { money: 400 }, ok: { text: '安排妥當。' } },
          { label: '冇時間', ok: { ec: -3, text: '你知道遲早會後悔。' } },
        ] },
      { id: 'f_app', title: '中年交友', emoji: '📲', meet: 'new', when: s => !hasPartner(s),
        text: s => '中年交友 App 配對：{g}。',
        choices: s => [
          { label: '約出嚟飲酒', stat: 'talk', diff: 7, ok: { aff: 10, text: '大家都有故事。' }, fail: { aff: 1, text: '佢話你講嘢好似佢阿爸。' } },
          { label: '慢慢嚟', ok: { aff: 4, text: '每日 good morning。' } },
        ] },
    ],
    milestone: 'finale',
  },
];

// ============================================================
// Shared events — appear in every stage inside their st:[from, to] range.
// Item events (needItem) only show up when that card is on your board.
// Venue events send you somewhere and build 熟悉度.
// ============================================================
const SHARED_EVENTS = [
  // ---------------- 場地 ----------------
  { id: 'v_weekend', st: [0, 6], title: '放假去邊？', emoji: '🗺️',
    text: s => '難得放假，你想去邊度？（去邊度就會熟悉嗰度：熟悉度高，商店會多啲嗰度嘅嘢，仲有折。）',
    choices: s => shuffleArr(venuesInStage()).slice(0, 3).map(v => ({
      label: `${VENUES[v].emoji} 去${VENUES[v].name}`,
      ok: { loyalty: { [v]: 2 }, stats: { [VENUES[v].stat]: 1 }, ec: 1, text: VENUES[v].desc },
    })) },
  { id: 'v_regular', st: [0, 6], title: '熟客', emoji: '🤝', venue: s => bestVenue(),
    when: s => bestVenue() && venueLevel(bestVenue()) >= 1,
    text: s => '{v}嘅職員認得你：「又係你呀！」',
    choices: s => [
      { label: '收佢送嘅小禮物', ok: { venueItem: true, text: '熟客優惠，免費送你一件。' } },
      { label: '介紹朋友嚟', stat: 'social', diff: 4, ok: { sc: 2, loyalty: { [bestVenue()]: 1 }, text: '你朋友都變咗熟客。' }, fail: { text: '朋友話太遠唔去。' } },
    ] },
  { id: 'v_library', st: [1, 3], title: '自修室', emoji: '🏛️', venue: 'kt_library', meet: 'new',
    text: s => '{v}自修室，隔離位嘅 {g} 借咗張 post-it 俾你。',
    choices: s => [
      { label: '推介本小說俾佢', use: 'novel', stat: 'talk', diff: 4, ok: { aff: 9, text: '佢話聽日還書時同你傾。' }, fail: { aff: 1, text: '佢話已經睇過。' } },
      { label: '借佢文具', use: 'stationery', ok: { aff: 6, text: '一支筆，開始一段友誼。' } },
      { label: '專心溫書', ok: { stats: { brain: 1 }, text: '效率超高。' } },
    ] },
  { id: 'v_court', st: [1, 4], title: '球場鬥牛', emoji: '🏀', venue: 'court',
    text: s => '{v}三人籃球鬥牛，輸咗請飲嘢。',
    choices: s => [
      { label: '帶自己個波落場', use: 'basketball', stat: 'fit', diff: 5, ok: { sc: 2, stats: { fit: 1 }, text: '連贏三場。' }, fail: { money: -20, ec: -1, text: '輸咗，請成隊飲維他奶。' } },
      { label: '借人個波打', stat: 'fit', diff: 6, ok: { sc: 1, text: '打得唔錯。' }, fail: { money: -20, text: '輸咗要請飲嘢。' } },
      { label: '坐場邊睇', ok: { ec: 1, text: '曬吓太陽。' } },
    ] },
  { id: 'v_ssp', st: [1, 6], title: '鴨寮街淘寶', emoji: '🔌', venue: 'ssp',
    text: s => '{v}，地攤上面乜都有。',
    choices: s => [
      { label: '同檔主講價', stat: 'talk', diff: 5, ok: { venueItem: true, text: '劈到半價，執到寶！' }, fail: { text: '檔主話：「唔買就走啦！」' } },
      { label: '買件翻新貨', cost: { money: 30 }, ok: { venueItem: 'dark', text: '平係平，但有啲古怪……（🖤 黑化）' } },
      { label: '淨係睇', ok: { stats: { wits: 1 }, text: '你識咗好多電子嘢。' } },
    ] },
  { id: 'v_temple', st: [0, 6], title: '黃大仙求籤', emoji: '🧧', venue: 'temple',
    text: s => '阿媽帶你去{v}求籤。',
    choices: s => [
      { label: '誠心求籤', chance: 50, ok: { ec: 2, stats: { wits: 1 }, text: '上上籤！心情大好。' }, fail: { ec: -1, text: '下下籤……解籤佬叫你小心。' } },
      { label: '捐香油', cost: { money: 20 }, ok: { loyalty: { temple: 2 }, ec: 1, text: '廟祝記得你。' } },
      { label: '還神', use: 'charm', ok: { loyalty: { temple: 3 }, ec: 2, text: '靈符果然靈驗，今次嚟還神。' } },
    ] },
  { id: 'v_chacha', st: [1, 6], title: '冰室老闆', emoji: '🍜', venue: 'chacha',
    text: s => '{v}好爆，老闆叫你幫手執枱。',
    choices: s => [
      { label: '幫手', ok: { sc: 1, money: 20, loyalty: { chacha: 1 }, text: '老闆送你一件西多士同 $20。' } },
      { label: '坐埋一邊睇漫畫', use: 'comic', ok: { ec: 2, text: '漫畫 + 凍檸茶 = 人生。' } },
      { label: '搭枱傾偈', stat: 'social', diff: 4, ok: { sc: 2, stats: { social: 1 }, text: '識咗班街坊。' }, fail: { text: '佢哋只係想食完快啲走。' } },
    ] },
  { id: 'v_music', st: [0, 6], title: '琴行試音', emoji: '🎼', venue: 'music',
    text: s => '行過{v}，老師叫你入去試吓。',
    choices: s => [
      { label: '彈你部琴', use: 'piano', stat: 'art', diff: 4, ok: { stats: { art: 2 }, sc: 1, text: '老師話你有天分。' }, fail: { ec: -1, text: '彈錯咗好多粒音。' } },
      { label: '攞你支結他出嚟', use: 'guitar', stat: 'art', diff: 5, ok: { stats: { art: 2 }, affAll: 2, text: '全店都停低聽。' }, fail: { ec: -1, text: '斷咗條弦。', damage: { guitar: 2 } } },
      { label: '試吓啲樂器', ok: { stats: { art: 1 }, text: '你鍾意上音樂。' } },
    ] },
  { id: 'v_mk', st: [2, 6], title: '旺角街頭', emoji: '🎤', venue: 'mk', meet: 'new',
    text: s => '{v}門口有人街頭表演，{g} 喺前面睇緊。',
    choices: s => [
      { label: '攞結他出嚟夾 band', use: 'guitar', stat: 'art', diff: 6, ok: { aff: 10, money: 80, sc: 2, text: '圍咗一大班人，{g} 拍得最大力。' }, fail: { aff: -2, ec: -2, text: '走音，有人掟咗個銀仔俾你叫你停。' } },
      { label: '行埋去搭訕', stat: 'talk', diff: 6, ok: { aff: 7, text: '你哋一齊睇到完場。' }, fail: { aff: 0, text: '佢戴住耳機，聽唔到你講嘢。' } },
      { label: '去扭蛋', cost: { money: 20 }, ok: { venueItem: true, text: '扭到一件嘢！' } },
    ] },
  { id: 'v_saikung', st: [2, 6], title: '西貢行山', emoji: '⛰️', venue: 'saikung',
    text: s => '同朋友去{v}行山，天色開始暗。',
    choices: s => [
      { label: '帶路抄近路', stat: 'wits', diff: 6, ok: { sc: 2, stats: { fit: 1 }, text: '你帶大家趕到落山食海鮮。' }, fail: { ec: -3, text: '迷路，要打 999。' } },
      { label: '跟大隊慢慢行', stat: 'fit', diff: 4, ok: { ec: 2, text: '日落好靚。' }, fail: { ec: -1, text: '行到腳軟。' } },
      { label: '撐遮擋雨', use: 'umbrella', ok: { ec: 1, sc: 1, text: '突然落雨，全隊得你有遮。' } },
    ] },
  { id: 'v_central', st: [3, 6], title: 'IFC 商業酒會', emoji: '🥂', venue: 'central',
    text: s => '{v}商業酒會，全場西裝友。',
    choices: s => [
      { label: '派卡片識人', use: 'namecard', stat: 'social', diff: 6, ok: { sc: 3, income: 100, text: '識到個大客。人工 +$100。' }, fail: { sc: -1, text: '冇人收你張卡片。' } },
      { label: '著西裝扮專業', use: 'suit', stat: 'look', diff: 6, ok: { sc: 2, text: '有個老闆問你攞聯絡。' }, fail: { ec: -1, text: '你件西裝大咗兩個碼。' } },
      { label: '食完嘢就走', ok: { ec: 1, money: 50, text: '慳咗一餐晚飯。' } },
    ] },
  { id: 'v_lkf', st: [3, 6], title: '蘭桂坊', emoji: '🍸', venue: 'lkf', meet: 'new', when: s => !isMarried(s),
    text: s => '星期五晚，{v}。吧枱隔離嘅 {g} 一個人飲緊酒。',
    choices: s => [
      { label: '請佢飲杯嘢', cost: { money: 100 }, stat: 'talk', diff: 6, use: 'cologne', useOptional: true, ok: { aff: 10, text: '佢笑咗。' }, fail: { aff: 1, text: '佢話等緊朋友。' } },
      { label: '同佢玩估拳', stat: 'wits', diff: 6, ok: { aff: 8, sc: 1, text: '玩到成間 bar 都加入。' }, fail: { ec: -2, text: '你飲醉咗。' } },
      { label: '同兄弟傾偈', ok: { sc: 1, ec: 1, text: '兄弟局。' } },
    ] },

  // ---------------- 埋單：佢揀你做老實人 ----------------
  { id: 'x_settle', st: [4, 6], title: '不如結婚啦', emoji: '🧾', meet: 'settler',
    when: s => !hasPartner(s) && !s.flags.offered && (s.flags.flat || s.money >= 3000 || s.income >= 1400),   // once per run
    text: s => `{g} 突然約你食飯。佢以前身邊啲男仔一個換一個，今晚就望住你講：「我玩夠喇。你人好、${s.flags.flat ? '有樓' : '有積蓄'}、穩定……不如我哋結婚啦。」`,
    choices: s => [
      { label: '好，結婚', ok: { marry: true, flag: { settled: true, offered: true }, text: '你哋去咗婚姻註冊處。' } },
      { label: '「你鍾意嘅係我，定係我層樓？」', stat: 'wits', diff: 6,
        ok: { aff: 10, flag: { offered: true }, text: '佢沉默咗好耐：「……可能兩樣都有。但我想試吓認真。」' },
        fail: { gone: true, flag: { offered: true }, ec: -2, text: '佢黑面走咗，之後再冇搵你。' } },
      { label: '拒絕：我想要真愛', ok: { gone: true, flag: { offered: true }, ec: 1, sc: 1, text: '你覺得自己值得被真心鍾意。' } },
    ] },

  // ---------------- 道具事件 ----------------
  { id: 'i_tablet', st: [0, 2], needItem: 'tablet', title: '平板被沒收', emoji: '📱',
    text: s => '阿媽發現你成日玩平板電腦，要沒收。',
    choices: s => [
      { label: '扮做緊網上功課', stat: 'wits', diff: 3, ok: { text: '瞞過咗阿媽。' }, fail: { loseItem: 'tablet', ec: -2, text: '被識穿，平板冇咗。' } },
      { label: '乖乖交出', ok: { loseItem: 'tablet', stats: { brain: 1 }, ec: -1, text: '冇平板，多咗時間睇書。' } },
    ] },
  { id: 'i_teddy', st: [0, 1], needItem: 'teddy', title: '公仔唔見咗', emoji: '🧸',
    text: s => '你個公仔唔見咗！瞓唔着。',
    choices: s => [
      { label: '自己搵', stat: 'wits', diff: 3, ok: { ec: 1, stats: { wits: 1 }, text: '喺床底搵返。' }, fail: { loseItem: 'teddy', ec: -2, text: '搵唔到……' } },
      { label: '叫阿媽幫手搵', ok: { ec: -1, damage: { teddy: 2 }, text: '喺洗衣機搵返，但甩咗隻耳。' } },
    ] },
  { id: 'i_blocks', st: [0, 0], needItem: 'blocks', title: '砌積木比賽', emoji: '🏆',
    text: s => '幼稚園搞砌積木比賽。',
    choices: s => [
      { label: '用你套積木參賽', use: 'blocks', stat: 'art', diff: 3, ok: { item: 'redflower', sc: 1, text: '冠軍！老師獎你一朵 🌺 小紅花。' }, fail: { ec: -1, text: '座塔倒咗。' } },
      { label: '幫隔離同學', stat: 'social', diff: 3, ok: { sc: 1, affAll: 3, text: '大家都鍾意同你玩。' }, fail: { text: '佢唔使你幫。' } },
    ] },
  { id: 'i_picbook', st: [0, 0], needItem: 'picbook', title: '講故事時間', emoji: '📕', needGirl: true,
    text: s => '老師叫你上台講故事，{g} 坐喺最前排。',
    choices: s => [
      { label: '講你本圖書入面嘅故事', use: 'picbook', stat: 'talk', diff: 3, ok: { aff: 6, sc: 1, text: '講到 {g} 拍手。' }, fail: { ec: -1, text: '口窒窒。' } },
      { label: '即興作故仔', stat: 'wits', diff: 4, ok: { aff: 5, text: '大家笑到碌地。' }, fail: { ec: -1, text: '冇人明。' } },
    ] },
  { id: 'i_toycar', st: [0, 0], needItem: 'toycar', title: '借玩具車', emoji: '🚗', meet: 'new',
    text: s => '有個小朋友 {g} 一直望住你架玩具車。',
    choices: s => [
      { label: '借俾佢玩', ok: { aff: 8, damage: { toycar: 2 }, text: '佢玩得好開心，但車轆甩咗。' } },
      { label: '一齊玩', stat: 'social', diff: 3, ok: { aff: 10, text: '你哋砌咗條跑道。' }, fail: { aff: 2, text: '你哋爭住玩。' } },
      { label: '收埋佢', ok: { aff: -2, ec: 1, text: '佢走咗。' } },
    ] },
  { id: 'i_football', st: [1, 3], needItem: 'football', title: '踢爆玻璃', emoji: '💥',
    text: s => '你一腳射門——課室玻璃碎咗。',
    choices: s => [
      { label: '主動認錯', stat: 'talk', diff: 4, ok: { sc: 1, text: '老師欣賞你誠實。' }, fail: { money: -30, ec: -2, text: '要賠錢，仲要見家長。' } },
      { label: '走佬', stat: 'fit', diff: 5, ok: { text: '冇人見到。' }, fail: { sc: -3, loseItem: 'football', text: '被捉，個波俾人沒收。' } },
      { label: '用零用錢賠', cost: { money: 30 }, ok: { sc: 1, text: '男子漢，敢作敢當。' } },
    ] },
  { id: 'i_tcg', st: [1, 2], needItem: 'tcg', title: '閃卡交易', emoji: '🃏',
    text: s => '同學話用一張超稀有閃卡換你成副卡。',
    choices: s => [
      { label: '換！', stat: 'wits', diff: 4, ok: { upgrade: { id: 'tcg', ed: 'foil' }, sc: 1, text: '你副卡變咗 ✨ Foil！' }, fail: { loseItem: 'tcg', ec: -2, text: '原來係假卡……成副冇咗。' } },
      { label: '唔換', ok: { text: '穩陣。' } },
    ] },
  { id: 'i_comic', st: [1, 2], needItem: 'comic', title: '漫畫被沒收', emoji: '📚',
    text: s => '上堂偷睇漫畫，俾老師捉到。',
    choices: s => [
      { label: '求情', stat: 'talk', diff: 4, ok: { text: '老師放你一馬。' }, fail: { loseItem: 'comic', ec: -1, text: '沒收，學期尾先還。' } },
      { label: '借俾老師睇', stat: 'wits', diff: 5, ok: { sc: 2, text: '原來老師都係漫畫迷！' }, fail: { loseItem: 'comic', sc: -1, text: '老師覺得你挑釁。' } },
    ] },
  { id: 'i_console', st: [2, 6], needItem: 'console', title: '神隊友', emoji: '🎮', meet: 'new',
    text: s => '打機時隨機配對到一個好勁嘅隊友：{g}。',
    choices: s => [
      { label: '一齊打通宵', use: 'console', stat: 'wits', diff: 5, ok: { aff: 9, ec: 1, text: '佢加咗你 friend。' }, fail: { aff: 1, ec: -2, text: '你成日拖累佢。' } },
      { label: '約佢出嚟見面', stat: 'talk', diff: 6, ok: { aff: 8, text: '佢本人好 nice。' }, fail: { aff: -2, text: '佢話網友唔見面。' } },
    ] },
  { id: 'i_phone', st: [2, 6], needItem: 'phone', title: '手機跌落馬桶', emoji: '🚽',
    text: s => '撲通一聲——你部手機跌咗落馬桶。',
    choices: s => [
      { label: '即刻撈', stat: 'wits', diff: 5, ok: { damage: { phone: 2 }, text: '撈返起身，放落米度焗乾。' }, fail: { loseItem: 'phone', ec: -2, text: '冇得救。' } },
      { label: '拎去鴨寮街整', cost: { money: 80 }, ok: { loyalty: { ssp: 2 }, text: '師傅整好咗，仲送你張保護貼。' } },
    ] },
  { id: 'i_letter', st: [2, 6], needItem: 'letter', needGirl: true, title: '寫情信', emoji: '💌',
    text: s => '你攤開情信紙，諗住寫俾 {g}。（寫咗就冇咗張紙，表白時就冇 +15%）',
    choices: s => [
      { label: '用心寫', stat: 'art', diff: 5, ok: { aff: 15, loseItem: 'letter', text: '佢睇完臉紅紅。' }, fail: { aff: -3, loseItem: 'letter', text: '錯字太多，佢笑咗出嚟。' } },
      { label: '收返好，留待表白', ok: { text: '時機未到。' } },
    ] },
  { id: 'i_wax', st: [2, 2], needItem: 'wax', title: '訓導主任突擊', emoji: '👨‍🏫',
    text: s => '訓導主任喺校門口逐個檢查頭髮。',
    choices: s => [
      { label: '扮自然捲', stat: 'wits', diff: 5, ok: { text: '主任信咗。' }, fail: { loseItem: 'wax', sc: -1, text: '髮蠟被沒收，記缺點。' } },
      { label: '即刻去洗頭', ok: { stats: { look: -1 }, text: '濕晒成個頭返課室。' } },
    ] },
  { id: 'i_suit', st: [3, 6], needItem: 'suit', title: '大客 present', emoji: '📊', venue: 'central',
    text: s => '老細臨時叫你同大客 present。',
    choices: s => [
      { label: '著好西裝上陣', use: 'suit', stat: 'talk', diff: 6, ok: { income: 150, sc: 1, text: '大客即場簽約！人工 +$150。' }, fail: { ec: -2, text: '大客打晒喊露。' } },
      { label: '推俾同事', ok: { sc: -1, ec: 1, text: '同事好嬲。' } },
    ] },
  { id: 'i_watch', st: [3, 6], needItem: 'watch', title: '名錶', emoji: '⌚',
    text: s => '地鐵好逼，有隻手摸向你隻名錶。',
    choices: s => [
      { label: '一手捉住佢', stat: 'fit', diff: 6, ok: { sc: 2, text: '捉到賊！上咗新聞。' }, fail: { loseItem: 'watch', ec: -3, text: '隻錶冇咗。' } },
      { label: '大叫', stat: 'talk', diff: 5, ok: { text: '賊仔嚇走咗。' }, fail: { damage: { watch: 5 }, text: '拉扯之間錶面花咗。' } },
    ] },
  { id: 'i_laptop', st: [3, 6], needItem: 'laptop', title: '電腦中毒', emoji: '🦠',
    text: s => '你部手提電腦彈出一堆廣告——中毒喇。',
    choices: s => [
      { label: '自己搞掂', use: 'laptop', stat: 'wits', diff: 6, ok: { stats: { wits: 1 }, text: '你成功殺毒。' }, fail: { damage: { laptop: 5 }, ec: -2, text: '份 report 冇咗。' } },
      { label: '拎去鴨寮街整', cost: { money: 200 }, ok: { loyalty: { ssp: 2 }, text: '師傅十分鐘搞掂。' } },
    ] },
  { id: 'i_carkey', st: [4, 6], needItem: 'carkey', needGirl: true, title: '兜風', emoji: '🏎️',
    text: s => '星期日，你諗住揸跑車載 {g} 出去。',
    choices: s => [
      { label: '去西貢睇日落', cost: { money: 100 }, ok: { aff: 10, loyalty: { saikung: 2 }, text: '海邊、日落、跑車。' } },
      { label: '喺中環兜圈', stat: 'look', diff: 6, ok: { aff: 6, sc: 1, text: '途人側目。' }, fail: { money: -300, text: '違例泊車，抄牌 $300。' } },
    ] },
  { id: 'i_deed', st: [4, 6], needItem: 'deed', title: '樓價跌', emoji: '📉',
    text: s => '新聞話樓價一年跌咗兩成。',
    choices: s => [
      { label: '照供，長線持有', ok: { ec: -1, text: '自住，唔理佢。' } },
      { label: '賣樓套現', ok: { loseItem: 'deed', money: 2500, flag: { flat: false }, ec: -1, text: '賣咗，袋住 $2500 再租樓住。' } },
    ] },
  { id: 'i_umbrella', st: [1, 6], needGirl: true, title: '落大雨', emoji: '🌧️',
    text: s => '突然落大雨，{g} 冇帶遮。',
    choices: s => [
      { label: '撐開縮骨遮', use: 'umbrella', ok: { aff: 10, text: '一把遮，兩個人。BGM 自動播放。' } },
      { label: '陪佢等雨停', stat: 'talk', diff: 5, ok: { aff: 5, text: '雨停咗，你都唔想佢停。' }, fail: { aff: -1, text: '尷尬地企咗四十分鐘。' } },
      { label: '衝出去', ok: { ec: -1, stats: { fit: 1 }, text: '濕晒，但練咗腳骨力。' } },
    ] },
];
