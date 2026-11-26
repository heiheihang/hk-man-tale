import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const elements = new Map();
const document = {
  querySelector(selector) {
    if (!elements.has(selector)) elements.set(selector, {
      innerHTML: '', textContent: '', style: {},
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    });
    return elements.get(selector);
  },
};
const files = ['data.js', 'card-editions.js', 'school-data.js', 'schools.js', 'events.js', 'game.js'];
const source = files.map(name => fs.readFileSync(root + name, 'utf8')).join('\n').replace(/wire\(\);\s*newRun\(\);\s*$/, 'newRun();');
vm.runInNewContext(source + `
assert.equal(STAGES.length, 8);
assert.equal(STAGE_EVENTS.length, STAGES.length);
assert.equal(turnsInStage(), 1);
assert.equal(S.stage, STAGE_INDEX.kinder);
assert.equal(S.turn, 1);
assert(S.queue.includes(STAGE_EVENTS[0].milestone), 'Kindergarten allocation occurs in its only round');
assert($('#week').innerHTML.includes('(1/1)'));
assert($('#modal').innerHTML.includes('1 個計劃回合'));
assert.equal((renderTimeline().match(/class="tb/g) || []).length, 30); // 8 containers + 22 round cells
for (let i = 0; i < STAGES.length; i++) {
  assert.equal(STAGES[i].turns.length, TURN_AGES[i].length);
  assert(STAGE_EVENTS[i].milestone);
}
for (const c of [...Object.values(CARDS), ...Object.values(VENUES), ...SHARED_EVENTS]) {
  assert(c.st[0] >= 0 && c.st[0] <= c.st[1] && c.st[1] < STAGES.length);
}
assert.equal(CARDS.overtime.st[0], STAGE_INDEX.grad);
assert.equal(CARDS.blind.st[0], STAGE_INDEX.early30);
assert.equal(CARDS.charm.st[1], STAGE_INDEX.forty);
assert.equal(CARDS.app.st[0], STAGE_INDEX.university);
S.modal = null;
startWeek();
assert.equal(S.modal.stage, 'report');
nextTurn();
assert.equal(S.modal.stage, 'relic');
takeRelic(S.modal.options[0]);
assert.equal(S.stage, STAGE_INDEX.primary, 'No second kindergarten round');
assert.equal(turnsInStage(), 3);

// Test zone conversion using actual inventory, preserving valid items and relocating school supplies.
newRun();
for (const grid of Object.keys(S.grids)) S.grids[grid] = [null, null, null, null];
S.bench = []; S.flags.edu = 'uni';
S.grids.bag[0] = makeCard('phone');
S.grids.bag[1] = makeCard('wax');
S.grids.weekday[0] = makeCard('gaming');
startStage(STAGE_INDEX.university);
render();
assert.equal(stageDef().labels.bag, '穿搭');
assert.equal(stageDef().labels.weekday, '交友app');
assert.equal(curAge(), 18);
assert(isKid(), 'Tertiary stage still uses allowance');
assert.equal(S.income, S.bg.finance.allowance[2] + S.perm.allowance);
assert(S.bench.some(c => c.id === 'phone'));
assert(S.grids.bag.some(c => c?.id === 'wax'));
assert(S.grids.weekend.some(c => c?.id === 'gaming'));
assert(S.grids.bag.some(c => c?.id === 'casualoutfit'));
assert(S.grids.weekday.some(c => c?.id === 'app'));
assert(fits(makeCard('casualoutfit'), 'grid:bag:0'));
assert(!fits(makeCard('phone'), 'grid:bag:0'));
assert(fits(makeCard('app'), 'grid:weekday:0'));
assert(!fits(makeCard('gaming'), 'grid:weekday:0'));
assert(!findCard('degree'), 'No diploma on admission');
assert($('#wardrobe').innerHTML.includes('三套穿搭') && $('#board').innerHTML.includes('交友app'));
assert($('#bg').innerHTML.includes('大學在讀'));
for (let i = 0; i < 30; i++) {
  rollShop();
  assert(S.shop.every(c => def(c).slot.some(g => zoneAllows(c, g))));
}
const student = createGirl(); S.partner = student; S.girls[student].aff = 100; S.money = 100000;
assert(!canPropose(student), 'Marriage remains a post-graduation action');
const graduation = STAGE_EVENTS[STAGE_INDEX.university].milestone.choices(S)[1].ok;
applyFx(graduation);
assert(findCard('degree'));
assert(S.flags.tertiaryGraduated);
startStage(STAGE_INDEX.grad);
assert(!isKid());
assert.equal(S.income, SALARY.uni + S.bg.finance.support);
assert(canPropose(student));
assert(findCard('degree'), 'Diploma survives graduation');

// Walk all rounds and real milestone effects for each education route, including the final ending.
for (const route of ['uni', 'asso', 'work']) {
  newRun();
  S.money = 1000000; S.ecMax = S.ec = 100000;
  const visited = []; let rounds = 0;
  for (let guard = 0; guard < 30; guard++) {
    const stage = S.stage;
    if (!visited.includes(stage)) visited.push(stage);
    for (const grid of Object.keys(S.grids)) S.grids[grid] = [null, null, null, null];
    S.modal = null;
    startWeek();
    assert.equal(S.modal.stage, 'report');
    rounds++;
    const last = S.turn === turnsInStage();
    if (last) {
      const milestone = STAGE_EVENTS[stage].milestone;
      if (milestone === 'finale') { ending('life'); break; }
      if (stage === STAGE_INDEX.secondary) {
        const choices = milestone.choices(S);
        applyFx(route === 'work' ? choices[2].ok : route === 'uni' ? choices[0].ok : choices[0].fail);
        assert(!findCard('degree'));
      } else applyFx(milestone.choices(S).find(c => !c.req || c.req(S)).ok);
    }
    nextTurn();
    if (S.modal?.stage === 'relic') takeRelic(S.modal.options[0]);
    if (route === 'asso' && S.stage === STAGE_INDEX.university) assert.equal(stageDef().name, '大專');
  }
  assert.equal(S.stage, STAGE_INDEX.forty);
  assert.equal(S.modal.stage, 'ending');
  assert.equal(rounds, route === 'work' ? 19 : 22);
  assert.equal(visited.includes(STAGE_INDEX.university), route !== 'work');
}
console.log('Passed: 8 stages, 1-round kindergarten, allocation timing, university zones/inventory/shop, allowance-to-salary transition, diploma timing, proposal age and complete university/associate/work routes.');
`, { assert, console, document });
