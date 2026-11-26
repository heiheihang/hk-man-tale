import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = name => fs.readFileSync(root + name, 'utf8');
const context = vm.createContext({ console, assert });
vm.runInContext(read('school-data.js') + '\n' + read('schools.js') + `
assert.equal(SCHOOL_DATA.districts.length, 18);
assert.equal(SCHOOL_DATA.schools.filter(s => s.level === 'primary').length, 54);
assert.equal(SCHOOL_DATA.schools.filter(s => s.level === 'secondary').length, 108);
assert.equal(SCHOOL_BY_ID.size, SCHOOL_DATA.schools.length);
for (const school of SCHOOL_DATA.schools) {
  assert(SCHOOL_DISTRICT_BY_ID.has(school.district));
  assert(school.name && school.nameEn && school.edbSchoolNo && school.address);
  assert(school.identitySource.startsWith('https://www.edb.gov.hk/'));
  if (school.level === 'secondary') {
    assert([1, 2, 3].includes(school.band));
    assert.equal(school.bandIsOfficial, false);
    assert(school.bandSource && school.profileSource);
  }
}
let localSecondary = 0, fallbackCount = 0;
for (const district of SCHOOL_DATA.districts) {
  const primary = schoolOptions(district.id, 'primary');
  assert.equal(primary.length, 3);
  assert(primary.every(s => s.district === district.id && s.gender !== 'girls'));
  for (const band of [1, 2, 3]) {
    const local = schoolOptions(district.id, 'secondary', band);
    const full = schoolOptions(district.id, 'secondary', band, null, true);
    assert.equal(full.length, 2, district.id + ' Band ' + band);
    assert(local.every(s => s.district === district.id && !s.crossDistrict));
    assert(full.every(s => s.band === band));
    localSecondary += local.length;
    fallbackCount += full.filter(s => s.crossDistrict).length;
    for (const gender of ['boys', 'coed']) {
      const selected = selectGameSchool(district.id, 'secondary', band, gender);
      // Some bands have no boys' schools in the chosen sample; never substitute gender or band.
      if (selected) {
        assert.equal(selected.band, band);
        assert.equal(selected.gender, gender);
        assert.equal(selected.crossDistrict, selected.district !== district.id);
      }
    }
  }
  const primaryFlags = { primary: '名校' };
  schoolPlacementNotes(primaryFlags, { district: district.id });
  assert.equal(primaryFlags.primary, '名校', 'Existing admission bonus category survives');
  assert.equal(primaryFlags.primarySchool.district, district.id);
  for (const band of [1, 2, 3]) {
    const flags = { school: { key: 'coed', band, name: 'Placeholder' } };
    schoolPlacementNotes(flags, { district: district.id });
    assert.notEqual(flags.school.name, 'Placeholder');
    assert.equal(flags.school.key, 'coed');
    assert.equal(flags.school.band, band);
  }
}
assert.equal(localSecondary, 105);
assert.equal(fallbackCount, 3);
assert.equal(schoolOptions('unknown', 'primary').length, 0);
`, context);

// Exercise the real game's admission effect path without browser rendering.
const game = read('game.js').replace(/wire\(\);\s*newRun\(\);\s*$/, '');
vm.runInContext(read('data.js') + '\n' + read('card-editions.js') + '\n' + read('events.js') + '\n' + game + `
render = () => {};
newRun();
assert(SCHOOL_DISTRICT_BY_ID.has(S.bg.district));
const originalFlags = { primary: '名校' };
const primaryNotes = applyFx({ flag: originalFlags });
assert.equal(originalFlags.primarySchool, undefined, 'Do not mutate shared event definitions');
assert.equal(S.flags.primary, '名校');
assert(S.flags.primarySchool.name);
assert(primaryNotes.some(note => note.includes(S.flags.primarySchool.name)));
const schoolEffect = { flag: { school: { key: 'boys', band: 1, name: 'Band 1 男校' } } };
const secondaryNotes = applyFx(schoolEffect);
assert.equal(S.flags.school.gender, 'boys');
assert.equal(S.flags.school.band, 1);
assert.notEqual(S.flags.school.name, 'Band 1 男校');
assert.equal(schoolEffect.flag.school.name, 'Band 1 男校');
assert(secondaryNotes.some(note => note.includes(S.flags.school.name)));
`, context);
console.log('Passed: 18 districts, 54 primary + 108 secondary identities; 105 local + 3 explicit fallback entries; sources, genders, bands, selection and real admission effects.');
