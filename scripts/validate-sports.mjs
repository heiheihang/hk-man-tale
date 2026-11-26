import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const files = ['data.js', 'card-editions.js', 'school-data.js', 'schools.js', 'events.js', 'game.js'];
const source = files.map(name => fs.readFileSync(root + name, 'utf8')).join('\n').replace(/wire\(\);\s*newRun\(\);\s*$/, '');
vm.runInNewContext(source + `
render = () => {};
let message = '';
flash = text => { message = text; };
const clearBoard = () => {
  for (const grid of Object.keys(S.grids)) S.grids[grid] = [null, null, null, null];
  S.bench = []; S.shop = []; S.modal = null;
};
for (const id of ['footballteam', 'basketballteam', 'tabletennisteam', 'athleticsteam', 'dance']) {
  assert.equal(CARDS[id].st[0], 1);
  assert.equal(CARDS[id].st[1], 1);
  assert.equal(CARDS[id].slot.join(), 'weekday');
  assert(CARDS[id].editionDesc.dark && CARDS[id].editionDesc.moon);
}
newRun(); startStage(1); clearBoard();
assert.equal(Object.keys(S.sports).length, 0);
assert(fits(makeCard('athleticsteam'), 'grid:weekday:0'));
assert(fits(makeCard('dance'), 'grid:weekday:0'));
for (const [team, practice, sport] of [
  ['footballteam', 'football', 'football'],
  ['basketballteam', 'basketballclass', 'basketball'],
  ['tabletennisteam', 'paddle', 'tabletennis'],
]) {
  clearBoard(); S.sports = {};
  const teamCard = makeCard(team);
  assert(!fits(teamCard, 'grid:weekday:0'));
  assert(fits(teamCard, 'bench:0'));
  S.shop = [teamCard];
  const money = S.money;
  move('shop:0', 'grid:weekday:0');
  assert.equal(S.money, money, 'Locked drag from shop must not charge money');
  assert.equal(S.shop[0], teamCard);
  assert(message.includes(SPORT_NAMES[sport]));
  // Owning or benching practice equipment is insufficient.
  S.bench = [makeCard(practice)];
  computeWeek();
  assert(!S.sports[sport]);
  assert(!fits(teamCard, 'grid:weekday:0'));
  const grid = CARDS[practice].slot.includes('bag') ? 'bag' : 'weekend';
  S.grids[grid][0] = S.bench.pop();
  const projection = computeWeek();
  assert(projection.sportsLearned.includes(sport));
  assert(!S.sports[sport], 'Preview must not learn skills');
  // A team inserted into an old/inconsistent state still cannot train or gain XP early.
  S.grids.weekday[0] = teamCard;
  const guarded = computeWeek();
  assert(guarded.lines.some(line => line.includes('要先識')));
  assert.equal(guarded.time, CARDS[practice].time || 0);
  startWeek();
  assert(S.sports[sport]);
  assert.equal(teamCard.xp, undefined, 'Skill must be learned before the team turn');
  assert(fits(teamCard, 'grid:weekday:0'));
  clearBoard();
  assert(fits(teamCard, 'grid:weekday:0'), 'Removing equipment must retain skill');
  S.grids.weekday[0] = teamCard;
  startWeek();
  assert.equal(teamCard.xp, 1, 'Qualified team earns training XP');
  assert(S.modal.lines.some(line => line.includes(CARDS[team].name)));
}
clearBoard(); S.sports = { football: true };
assert(!fits(makeCard('basketballteam'), 'grid:weekday:0'), 'Wrong sport does not qualify');
S.grids.weekend = Array.from({length: 4}, () => makeCard('team'));
S.grids.bag[0] = makeCard('paddle');
startWeek();
assert(!S.sports.tabletennis, 'Over-time schedule cannot teach a skill');
clearBoard();
S.sports = { football: true };
startStage(2);
assert(S.sports.football, 'Skills survive stage transitions');
newRun();
assert.equal(Object.keys(S.sports).length, 0, 'New run resets skills');
console.log('Passed: five primary activities; sport-specific entry gates; preview, bench and invalid-schedule guards; learned skills, training XP, stage retention and restart.');
`, { assert, console });
