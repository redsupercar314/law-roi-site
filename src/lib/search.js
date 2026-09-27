// Abbreviation-aware school search.
// Matches full names, common abbreviations (FSU, GULC, WashU...),
// word prefixes, and school initials.

const STOPWORDS = new Set(['of', 'and', 'the', 'at', 'in']);

export function normalize(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[.'’\-]/g, '')
    .replace(/&/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w))
    .join(' ');
}

// [alias, exact school name as it appears in the dataset]
const ALIAS_PAIRS = [
  ['fsu', 'Florida State'],
  ['seminoles', 'Florida State'],
  ['uva', 'Virginia'],
  ['unc', 'North Carolina'],
  ['carolina', 'North Carolina'],
  ['ut austin', 'Texas'],
  ['tamu', 'Texas A&M'],
  ['aggies', 'Texas A&M'],
  ['gulc', 'Georgetown'],
  ['gw', 'George Washington'],
  ['gwu', 'George Washington'],
  ['gmu', 'George Mason'],
  ['mason', 'George Mason'],
  ['bc', 'Boston College'],
  ['bu', 'Boston University'],
  ['washu', 'Washington University in St. Louis'],
  ['wustl', 'Washington University in St. Louis'],
  ['wl', 'Washington & Lee'],
  ['wlu', 'Washington & Lee'],
  ['wm', 'William & Mary'],
  ['uci', 'UC Irvine'],
  ['ucd', 'UC Davis'],
  ['berkeley', 'UC Berkeley'],
  ['boalt', 'UC Berkeley'],
  ['cal', 'UC Berkeley'],
  ['vandy', 'Vanderbilt'],
  ['ole miss', 'Mississippi'],
  ['olemiss', 'Mississippi'],
  ['bama', 'Alabama'],
  ['uga', 'Georgia'],
  ['gsu', 'Georgia State'],
  ['uf', 'Florida'],
  ['gators', 'Florida'],
  ['asu', 'Arizona State'],
  ['boulder', 'Colorado'],
  ['uw', 'University of Washington'],
  ['udub', 'University of Washington'],
  ['umn', 'Minnesota'],
  ['osu', 'Ohio State'],
  ['psu', 'Penn State (Dickinson)'],
  ['pitt', 'Pittsburgh'],
  ['nova', 'Villanova'],
  ['shu', 'Seton Hall'],
  ['sju', "St. John's"],
  ['nyls', 'New York Law School'],
  ['suny', 'SUNY Buffalo'],
  ['buffalo', 'SUNY Buffalo'],
  ['uconn', 'Connecticut'],
  ['cwru', 'Case Western'],
  ['csu', 'Cleveland State'],
  ['cincy', 'Cincinnati'],
  ['nd', 'Notre Dame'],
  ['umich', 'Michigan'],
  ['msu', 'Michigan State'],
  ['udm', 'Detroit Mercy'],
  ['uchicago', 'University of Chicago'],
  ['ku', 'Kansas'],
  ['mizzou', 'Missouri-Columbia'],
  ['umkc', 'Missouri-Kansas City'],
  ['unl', 'Nebraska'],
  ['ou', 'Oklahoma'],
  ['uh', 'Houston'],
  ['ttu', 'Texas Tech'],
  ['stcl', 'South Texas'],
  ['stmarys', "St. Mary's"],
  ['stmu', "St. Mary's"],
  ['lmu', 'Loyola Marymount'],
  ['luc', 'Loyola Chicago'],
  ['luno', 'Loyola New Orleans'],
  ['cua', 'Catholic'],
  ['au', 'American'],
  ['bkl', 'Brooklyn'],
  ['cuse', 'Syracuse'],
  ['unh', 'New Hampshire'],
  ['fiu', 'Florida International'],
  ['cumberland', 'Samford'],
  ['utk', 'Tennessee'],
  ['uk', 'Kentucky'],
  ['uofl', 'Louisville'],
  ['nku', 'Northern Kentucky'],
  ['chase', 'Northern Kentucky'],
  ['wvu', 'West Virginia'],
  ['umd', 'Maryland'],
  ['uark', 'Arkansas-Fayetteville'],
  ['ualr', 'Arkansas-Little Rock'],
  ['seattleu', 'Seattle'],
  ['zags', 'Gonzaga'],
  ['manoa', 'Hawaii'],
  ['uo', 'Oregon'],
  ['lclark', 'Lewis & Clark'],
  ['du', 'Denver'],
  ['unm', 'New Mexico'],
  ['usd', 'San Diego'],
  ['scu', 'Santa Clara'],
  ['slu', 'St. Louis'],
  ['ust', 'St. Thomas (MN)'],
  ['uiuc', 'Illinois'],
  ['madison', 'Wisconsin'],
  ['penn', 'Penn (Carey)'],
  ['upenn', 'Penn (Carey)'],
  ['iub', 'Indiana (Maurer)'],
  ['iui', 'Indiana (McKinney)'],
  ['iu bloomington', 'Indiana (Maurer)'],
  ['iu indianapolis', 'Indiana (McKinney)'],
  ['tu', 'Tulsa'],
];

export const ALIAS_TO_NAME = {};
const ALIASES_BY_SCHOOL = {};
for (const [alias, name] of ALIAS_PAIRS) {
  ALIAS_TO_NAME[alias] = name;
  (ALIASES_BY_SCHOOL[name] = ALIASES_BY_SCHOOL[name] || []).push(alias);
}

// Lower score = better match. Returns -1 for no match.
export function matchScore(school, rawQuery) {
  const q = normalize(rawQuery);
  if (!q || q.length < 2) return 0;
  const name = normalize(school.name);
  if (ALIAS_TO_NAME[q] === school.name || name === q) return 0;
  if (name.startsWith(q)) return 1;
  const words = name.split(' ');
  if (words.some((w) => w.startsWith(q))) return 2;
  if ((ALIASES_BY_SCHOOL[school.name] || []).some((a) => a.includes(q))) return 3;
  const qwords = q.split(' ');
  if (qwords.length > 1 && qwords.every((w) => name.includes(w))) return 4;
  if (name.includes(q)) return 5;
  const initials = words.map((w) => w[0]).join('');
  if (initials === q || initials.startsWith(q)) return 6;
  return -1;
}
