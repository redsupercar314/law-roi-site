import fs from 'node:fs';

const path = new URL('../src/data/schools-raw.json', import.meta.url);
const schools = JSON.parse(fs.readFileSync(path, 'utf8'));

// 2026 entering-class medians (verified from school-published class profiles).
const updates = {
  Fordham: { lsat25: 167, lsat50: 169, lsat75: 171, gpa25: 3.67, gpa50: 3.81, gpa75: 3.88 },
  // Georgetown full-time median LSAT corrected to the published 171; 25/75 kept.
  Georgetown: { lsat50: 171 },
};

let touched = 0;
for (const s of schools) {
  const u = updates[s.name];
  if (!u) continue;
  Object.assign(s, u);
  touched += 1;
}

if (touched !== Object.keys(updates).length) {
  throw new Error(`Expected to update ${Object.keys(updates).length} schools, updated ${touched}`);
}

fs.writeFileSync(path, JSON.stringify(schools, null, 2) + '\n');
console.log(`Updated ${touched} schools with 2026 medians.`);
