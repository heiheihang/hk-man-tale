import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const files = ['data.js', 'card-editions.js', 'school-data.js', 'schools.js', 'events.js', 'game.js'];
const source = files.map(name => fs.readFileSync(root + name, 'utf8')).join('\n').replace(/wire\(\);\s*newRun\(\);\s*$/, '');
vm.runInNewContext(source + `
render = () => {};
flash = () => {};
const clearBoard = () => {
  for (const grid of Object.keys(S.grids)) S.grids[grid] = [null, null, null, null];
  S.bench = []; S.shop = []; S.modal = null;
};
const ids = ['mongkok', 'newaykaraoke', 'kwuntongpromenade', 'weekendfootball', 'weekendbasketball', 'weekendtabletennis', 'weekendathletics', 'hkfootball', 'hkbasketball', 'hktabletennis', 'hkathletics', 'playpokemon', 'playbattlespirits', 'gaming', 'study', 'tutor'];
for (const id of ids) {
  const c = CARDS[id];
  assert(c.st[0] <= 2 && c.st[1] >= 2 && c.slot.includes('weekend'));
  assert(c.price > 0 && c.time > 0 && c.desc && c.editionDesc.dark && c.editionDesc.moon);
}
newRun(); startStage(2); clearBoard();
for (const [activity, treasure] of [['playpokemon', 'pokemoncard'], ['playbattlespirits', 'battlespirits']]) {
  clearBoard();
  const card = makeCard(activity);
  assert(!fits(card, 'grid:weekend:0'));
  S.shop = [makeCard(treasure)];
  assert(!fits(card, 'grid:weekend:0'), 'Shop stock is not owned');
  S.bench = [makeCard(treasure)];
  assert(fits(card, 'grid:weekend:0'), 'Bench treasure qualifies');
  S.grids.relic[0] = S.bench.pop();
  assert(fits(card, 'grid:weekend:0'), 'Board treasure qualifies');
  S.grids.weekend[0] = card;
  const active = computeWeek();
  removeCard(treasure);
  assert(!fits(card, 'grid:weekend:0'), 'Selling treasure revokes access');
  const blocked = computeWeek();
  assert.equal(blocked.time, 0);
  assert(active.time > blocked.time);
  assert(blocked.lines.some(line => line.includes('要先持有')));
}
for (const [sport, team, national] of [
  ['football', 'secondaryfootball', 'hkfootball'],
  ['basketball', 'secondarybasketball', 'hkbasketball'],
  ['tabletennis', 'secondarytabletennis', 'hktabletennis'],
  ['athletics', 'secondaryathletics', 'hkathletics'],
]) {
  clearBoard(); S.sports = { [sport]: true }; S.teamTraining = {};
  const elite = makeCard(national);
  assert(!fits(elite, 'grid:weekend:0'), 'Skill alone does not unlock national team');
  S.bench = [makeCard(team)];
  computeWeek();
  assert.equal(S.teamTraining[sport], undefined, 'Bench/preview must not train');
  S.grids.weekday[0] = S.bench.pop();
  S.grids.weekend[0] = makeCard('weekend' + sport);
  const projected = computeWeek();
  assert.equal(projected.teamPractice.filter(s => s === sport).length, 1);
  assert.equal(S.teamTraining[sport], undefined);
  startWeek();
  assert.equal(S.teamTraining[sport], 1, 'Two sessions of same sport count one completed turn');
  assert(!fits(elite, 'grid:weekend:0'));
  const report = S.modal;
  startWeek();
  assert.equal(S.modal, report);
  assert.equal(S.teamTraining[sport], 1, 'Duplicate settlement cannot train twice');
  S.modal = null;
  startWeek();
  assert.equal(S.teamTraining[sport], NATIONAL_TEAM_TURNS);
  assert(fits(elite, 'grid:weekend:0'));
  clearBoard();
  S.grids.weekend[0] = elite;
  assert(computeWeek().fx.stats.fit > 0);
  const other = sport === 'football' ? 'hkbasketball' : 'hkfootball';
  assert(!fits(makeCard(other), 'grid:weekend:1'), 'Other sports remain locked');
}
clearBoard(); S.sports = {}; S.teamTraining = {};
S.grids.weekday[0] = makeCard('secondaryfootball');
startWeek();
assert.equal(S.teamTraining.football, undefined, 'Unqualified school team cannot train');
clearBoard(); S.sports = { football: true };
S.grids.weekday = Array.from({ length: 4 }, () => makeCard('secondaryfootball'));
startWeek();
assert.equal(S.teamTraining.football, undefined, 'Invalid schedule cannot count');
clearBoard(); S.teamTraining = { football: 2 };
startStage(3);
assert.equal(S.teamTraining.football, 2, 'Training survives stage changes');
newRun();
assert.equal(Object.keys(S.teamTraining).length, 0, 'Restart clears training');
console.log('Passed: 16 secondary weekend options, owned-treasure dependencies, all four national-team gates, distinct training turns, preview/bench/invalid-schedule guards, stage retention and restart.');
`, { assert, console });
