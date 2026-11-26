#!/usr/bin/env python3
"""Build the game's school catalogue from EDB identities and sourced band estimates.

Python standard library only. Run from any directory; outputs school-data.js.
Use --cache-dir DIR to reuse downloaded source snapshots for reproducibility.
Band estimates are third-party opinions, never official EDB classifications.
Short local pools stay short; the game helper can explicitly request cross-district options.
"""
import argparse
import csv
import html
import io
import json
import re
import unicodedata
import urllib.request
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from pathlib import Path

EDB = 'https://www.edb.gov.hk/attachment/en/student-parents/sch-info/sch-search/sch-location-info/SCH_LOC_EDB.csv'
BANDS = 'https://hkschoolfacts.com/browse/secondary-schools/band-{}'
DISTRICTS = [
    ('central_western', '中西區'), ('wan_chai', '灣仔區'), ('eastern', '東區'),
    ('southern', '南區'), ('yau_tsim_mong', '油尖旺區'), ('sham_shui_po', '深水埗區'),
    ('kowloon_city', '九龍城區'), ('wong_tai_sin', '黃大仙區'), ('kwun_tong', '觀塘區'),
    ('kwai_tsing', '葵青區'), ('tsuen_wan', '荃灣區'), ('tuen_mun', '屯門區'),
    ('yuen_long', '元朗區'), ('north', '北區'), ('tai_po', '大埔區'),
    ('sha_tin', '沙田區'), ('sai_kung', '西貢區'), ('islands', '離島區'),
]
GENDER = {'CO-ED': 'coed', 'BOYS': 'boys', 'GIRLS': 'girls'}


def norm(value):
    return ''.join(c for c in unicodedata.normalize('NFKC', value).casefold() if c.isalnum())


def text(value):
    return html.unescape(re.sub('<[^>]+>', '', value)).strip()


def fetch(url, cache, filename):
    path = cache / filename if cache else None
    if path and path.exists():
        return path.read_text(encoding='utf-8-sig')
    request = urllib.request.Request(url, headers={'User-Agent': 'HKManTale school-data research/1.0'})
    with urllib.request.urlopen(request, timeout=45) as response:
        body = response.read().decode('utf-8-sig')
    if path:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(body, encoding='utf-8')
    return body


def build(cache):
    rows = list(csv.DictReader(io.StringIO(fetch(EDB, cache, 'edb.csv'))))
    district_keys = {name: key for key, name in DISTRICTS}
    # A name may have multiple premises/sessions; use one official identity per level.
    official = {}
    for row in rows:
        if row['SCHOOL LEVEL'] in ('PRIMARY', 'SECONDARY') and row['分區'] in district_keys:
            official.setdefault((row['SCHOOL LEVEL'], norm(row['中文名稱'])), row)
    secondary_by_district = defaultdict(list)
    pages = list(ThreadPoolExecutor(max_workers=3).map(
        lambda b: (b, fetch(BANDS.format(b), cache, f'band-{b}.html')), (1, 2, 3)))
    seen = set()
    for band, body in pages:
        found = 0
        for item in re.findall(r'<li\b[^>]*>(.*?)</li>', body, re.S):
            heading = re.search(r'<h2\b[^>]*>\s*<a\b[^>]*href="([^"]+)"[^>]*>(.*?)</a>', item, re.S)
            if not heading:
                continue
            source_path, raw_name = heading.groups()
            name = text(raw_name)
            row = official.get(('SECONDARY', norm(name)))
            if row is None:
                raise ValueError(f'Band source name missing from current EDB register: {name}')
            paragraphs = [text(p) for p in re.findall(r'<p\b[^>]*>(.*?)</p>', item, re.S)]
            claimed_district = next((p.split('・')[0] for p in paragraphs if '・' in p), None)
            if claimed_district != row['分區']:
                raise ValueError(f'District disagreement: {name}: {claimed_district} / {row["分區"]}')
            identity = norm(name)
            if identity in seen:
                raise ValueError(f'Duplicate or conflicting band estimate: {name}')
            seen.add(identity)
            secondary_by_district[(row['分區'], band)].append((row, source_path))
            found += 1
        if found < 40:
            raise ValueError(f'Unexpected band-{band} page structure: only {found} schools')

    catalogue = []
    districts = []
    shortages = []

    def record(row, level, band=None, source_path=None):
        school = {
            'id': f'{level}_{row["SCHOOL NO."]}', 'name': row['中文名稱'],
            'nameEn': row['ENGLISH NAME'], 'district': district_keys[row['分區']],
            'level': level, 'gender': GENDER[row['STUDENTS GENDER']],
            'financeType': row['FINANCE TYPE'], 'address': row['中文地址'],
            'website': None if row['WEBSITE'] == 'N.A.' else row['WEBSITE'],
            'edbSchoolNo': row['SCHOOL NO.'], 'identitySource': EDB,
        }
        if band:
            school.update(band=band, bandIsOfficial=False, bandSource=BANDS.format(band),
                          profileSource='https://hkschoolfacts.com' + source_path)
        catalogue.append(school)
        return school['id']

    for key, name in DISTRICTS:
        primary = [r for (level, _), r in official.items()
                   if level == 'PRIMARY' and r['分區'] == name
                   and r['STUDENTS GENDER'] in ('CO-ED', 'BOYS')
                   and r['FINANCE TYPE'] in ('GOVERNMENT', 'AIDED')]
        primary.sort(key=lambda r: (r['ENGLISH NAME'], r['SCHOOL NO.']))
        # One government school where available, then aided schools; this is sampling, not ranking.
        government = [r for r in primary if r['FINANCE TYPE'] == 'GOVERNMENT'][:1]
        choices = (government + [r for r in primary if r not in government])[:3]
        assert len(choices) == 3, f'Not enough primary schools: {name}'
        district = {'id': key, 'name': name, 'primary': [record(r, 'primary') for r in choices], 'secondary': {}}
        for band in (1, 2, 3):
            candidates = secondary_by_district[(name, band)]
            candidates.sort(key=lambda pair: (pair[0]['ENGLISH NAME'], pair[0]['SCHOOL NO.']))
            # Prefer a boys' and a co-ed school for the protagonist; retain girls' schools if needed.
            choices = []
            for gender in ('BOYS', 'CO-ED'):
                match = next((p for p in candidates if p[0]['STUDENTS GENDER'] == gender), None)
                if match:
                    choices.append(match)
            choices += [p for p in candidates if p not in choices and p[0]['STUDENTS GENDER'] != 'GIRLS']
            choices += [p for p in candidates if p not in choices]
            choices = choices[:2]
            district['secondary'][str(band)] = [record(r, 'secondary', band, path) for r, path in choices]
            if len(choices) < 2:
                shortages.append({'district': key, 'band': band, 'requested': 2,
                                  'availableInSource': len(candidates), 'selected': len(choices)})
        districts.append(district)
    # Keep actual districts intact. Supplement short pools separately, never relabel a school.
    used = {s['id'] for s in catalogue}
    for shortage in shortages:
        district = next(d for d in districts if d['id'] == shortage['district'])
        band = shortage['band']
        alternatives = []
        for district_name, candidate_band in secondary_by_district:
            if candidate_band != band or district_name == district['name']:
                continue
            alternatives.extend(secondary_by_district[(district_name, band)])
        alternatives.sort(key=lambda p: (p[0]['STUDENTS GENDER'] != 'CO-ED', p[0]['ENGLISH NAME']))
        fallback = []
        for row, path in alternatives:
            if f'secondary_{row["SCHOOL NO."]}' in used or row['STUDENTS GENDER'] == 'GIRLS':
                continue
            sid = record(row, 'secondary', band, path)
            used.add(sid)
            fallback.append(sid)
            if len(fallback) == 2 - shortage['selected']:
                break
        assert len(fallback) + shortage['selected'] == 2
        district.setdefault('secondaryFallback', {})[str(band)] = fallback
        shortage['fallbackSchoolIds'] = fallback
    assert len(catalogue) == len({s['id'] for s in catalogue})
    return {'metadata': {'retrievedOn': date.today().isoformat(),
                         'identitySource': EDB, 'bandSources': [BANDS.format(b) for b in (1, 2, 3)],
                         'bandingNote': 'Bands are unofficial third-party estimates, not Education Bureau school ratings. Sources may disagree.',
                         'samplingNote': 'Three primary schools and up to two secondary schools per band per administrative district; not a ranking. School gender is retained.',
                         'shortages': shortages}, 'districts': districts, 'schools': catalogue}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache-dir', type=Path)
    args = parser.parse_args()
    data = build(args.cache_dir)
    output = Path(__file__).resolve().parents[1] / 'school-data.js'
    output.write_text('// Generated by scripts/scrape-schools.py; do not edit records manually.\n'
                      '// District and identity: EDB. Band: unofficial, sourced estimate.\n'
                      'const SCHOOL_DATA = ' + json.dumps(data, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
    print(f'Wrote {len(data["schools"])} verified schools across {len(data["districts"])} districts.')
    print('Local shortages:', json.dumps(data['metadata']['shortages'], ensure_ascii=False))


if __name__ == '__main__':
    main()
