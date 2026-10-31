// Part-time / evening JD support.
//
// A part-time JD takes four years, so the calculator prices four years of
// tuition and living costs when part-time mode is active. Only schools that
// publish a part-time or evening division are listed below; schools without one
// never appear in part-time mode.
//
// Where a school publishes part-time medians, they are used verbatim. Every
// other part-time program is modeled from the full-time class profile using
// the usual part-time gaps (roughly 4 LSAT points and 0.15 GPA lower), and
// tuition is modeled at 75% of the full-time rate.

export const PART_TIME_YEARS = 4;
const PT_TUITION_RATIO = 0.75;
const PT_LSAT_SHIFT = -4;
const PT_GPA_SHIFT = -0.15;

// Schools with a published part-time / evening JD division.
export const PART_TIME_SCHOOLS = new Set([
  'Akron', 'Alabama', 'Albany', 'American', 'Arizona', 'Arizona State',
  'Arkansas-Fayetteville', 'Arkansas-Little Rock', 'Baltimore', 'Brooklyn',
  'Campbell', 'Cardozo', 'Case Western', 'Catholic', 'Chapman', 'Chicago-Kent',
  'Cincinnati', 'Cleveland State', 'Colorado', 'Connecticut', 'Creighton',
  'Dayton', 'Denver', 'DePaul', 'Detroit Mercy', 'Drake', 'Drexel', 'Duquesne',
  'Elon', 'Florida International', 'Fordham', 'George Mason', 'George Washington',
  'Georgetown', 'Georgia State', 'Gonzaga', 'Hawaii', 'Hofstra', 'Houston',
  'Howard', 'Idaho', 'Indiana (Maurer)', 'Indiana (McKinney)', 'Iowa', 'Kansas',
  'Kentucky', 'Lewis & Clark', 'Liberty', 'Louisville', 'Loyola Chicago',
  'Loyola Marymount', 'Loyola New Orleans', 'LSU', 'Marquette', 'Maryland',
  'Memphis', 'Mercer', 'Miami', 'Michigan State', 'Minnesota', 'Mississippi',
  'Missouri-Columbia', 'Missouri-Kansas City', 'Montana', 'Nebraska',
  'New Hampshire', 'New Mexico', 'New York Law School', 'Northeastern',
  'Northern Kentucky', 'Ohio State', 'Oklahoma', 'Oregon', 'Pace', 'Pepperdine',
  'Pittsburgh', 'Quinnipiac', 'Regent', 'Richmond', 'Rutgers', 'Samford',
  'San Diego', 'Santa Clara', 'Seattle', 'Seton Hall', 'SMU', 'South Carolina',
  'South Dakota', 'South Texas', 'St. John\'s', 'St. Louis', 'St. Mary\'s',
  'St. Thomas (MN)', 'Stetson', 'Suffolk', 'SUNY Buffalo', 'Syracuse', 'Temple',
  'Tennessee', 'Texas Tech', 'Toledo', 'Tulane', 'Tulsa', 'UC Davis',
  'University of Washington', 'UNLV', 'Utah', 'Villanova', 'Washburn',
  'Wayne State', 'West Virginia', 'Wisconsin', 'Wyoming',
]);

// Verified part-time medians (2026 entering class).
//
// Fordham evening: 163 / 166 / 169 LSAT, 3.55 / 3.74 / 3.86 GPA.
// Georgetown evening: 169 LSAT median, 3.77 GPA median. The 25th/75th bands
// below are modeled around the published median.
export const PART_TIME_OVERRIDES = {
  Fordham: {
    lsat25: 163, lsat50: 166, lsat75: 169,
    gpa25: 3.55, gpa50: 3.74, gpa75: 3.86,
  },
  Georgetown: {
    lsat25: 166, lsat50: 169, lsat75: 172,
    gpa25: 3.67, gpa50: 3.77, gpa75: 3.87,
  },
};

const clampLsat = (n) => Math.max(120, Math.min(180, Math.round(n)));
const clampGpa = (n) => Math.max(0, Math.min(4, Math.round(n * 100) / 100));

export function buildPartTime(school) {
  if (!PART_TIME_SCHOOLS.has(school.name)) return null;
  const o = PART_TIME_OVERRIDES[school.name] || {};

  const part = {
    tuition: Math.round(school.tuition * PT_TUITION_RATIO),
    lsat25: o.lsat25 ?? clampLsat(school.lsat25 + PT_LSAT_SHIFT),
    lsat50: o.lsat50 ?? clampLsat(school.lsat50 + PT_LSAT_SHIFT),
    lsat75: o.lsat75 ?? clampLsat(school.lsat75 + PT_LSAT_SHIFT),
    gpa25: o.gpa25 ?? clampGpa(school.gpa25 + PT_GPA_SHIFT),
    gpa50: o.gpa50 ?? clampGpa(school.gpa50 + PT_GPA_SHIFT),
    gpa75: o.gpa75 ?? clampGpa(school.gpa75 + PT_GPA_SHIFT),
    col: school.col,
    years: PART_TIME_YEARS,
    scholAvailable: true,
  };

  if (school.tuition_nonresident) {
    part.tuition_nonresident = Math.round(school.tuition_nonresident * PT_TUITION_RATIO);
  }

  return part;
}
