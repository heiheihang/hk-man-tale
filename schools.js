// Selection helpers for the sourced catalogue. No school is assigned a fake district or band.
const SCHOOL_BY_ID = new Map(SCHOOL_DATA.schools.map(school => [school.id, school]));
const SCHOOL_DISTRICT_BY_ID = new Map(SCHOOL_DATA.districts.map(district => [district.id, district]));

function schoolOptions(districtId, level, band = null, gender = null, includeFallback = false) {
  const district = SCHOOL_DISTRICT_BY_ID.get(districtId);
  if (!district) return [];
  const ids = level === 'primary' ? district.primary : (district.secondary[band] || []);
  const fallbacks = includeFallback && level === 'secondary' ? (district.secondaryFallback?.[band] || []) : [];
  return [...ids, ...fallbacks].map(id => SCHOOL_BY_ID.get(id))
    .filter(school => !gender || school.gender === gender)
    .map(school => ({ ...school, crossDistrict: school.district !== districtId }));
}

function selectGameSchool(districtId, level, band = null, gender = null) {
  // Prefer local schools of the requested gender. Only then consider other districts.
  let options = schoolOptions(districtId, level, band, gender);
  if (!options.length) options = schoolOptions(districtId, level, band, gender, true);
  if (!options.length) {
    options = SCHOOL_DATA.schools
      .filter(school => school.level === level && (!band || school.band === band) && (!gender || school.gender === gender))
      .map(school => ({ ...school, crossDistrict: school.district !== districtId }));
  }
  return options.length ? options[Math.floor(Math.random() * options.length)] : null;
}

function schoolPlacementNotes(flags, background) {
  const notes = [];
  const districtId = background.district || SCHOOL_DATA.districts[0].id;
  const describe = school => `${school.name}（${SCHOOL_DISTRICT_BY_ID.get(school.district).name}${school.crossDistrict ? '・跨區' : ''}）`;
  if (flags.primary) {
    const school = selectGameSchool(districtId, 'primary');
    if (school) {
      // Preserve the existing event category for bonuses; store real identity separately.
      flags.primarySchool = school;
      notes.push(`🏫 小一派位：${describe(school)}`);
    }
  }
  if (flags.school) {
    const school = selectGameSchool(districtId, 'secondary', flags.school.band, flags.school.key);
    if (school) {
      flags.school = { ...flags.school, ...school, key: school.gender };
      notes.push(`🏫 升中派位：${describe(school)}`);
    }
  }
  return notes;
}
