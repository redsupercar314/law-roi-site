// Head-to-head school comparison: 6 categories, 1 point each, most points wins.
// - Scholarship ties whenever either school is need-based-only (HYS award no
//   merit aid, so a merit comparison would be apples-to-oranges).
// - Legal outcomes uses first-time bar passage only: bar-required employment
//   mixes in each school's mission (fellowships, academia), so it isn't a pure
//   school-quality signal the way bar passage is.
// - USNWR rank is NOT a point category — it only breaks ties, so prestige can
//   never outvote admission odds, money, or outcomes. Numeric only.

export const COMPARE_CATS = [
  { key: 'chance', name: 'Admission chance', get: (r) => r.c.chancePct, higher: true },
  { key: 'schol', name: 'Scholarship / yr', get: (r) => r.c.scholDollarY1, higher: true, meritOnly: true },
  { key: 'dti', name: 'Debt-to-income', get: (r) => r.c.dti, higher: false },
  { key: 'salary', name: 'Starting salary', get: (r) => r.c.salary, higher: true },
  { key: 'outcomes', name: 'First-time bar passage', get: (r) => r.s.barPass, higher: true },
  { key: 'biglaw', name: 'BigLaw placement (500+ attorneys)', get: (r) => r.s.pctBiglaw, higher: true },
];

export function compareRows(a, b) {
  const results = COMPARE_CATS.map((cat) => {
    const av = cat.get(a);
    const bv = cat.get(b);
    let winner = 'tie';
    if (cat.meritOnly && (a.c.needBased || b.c.needBased)) winner = 'tie';
    else if (av == null && bv == null) winner = 'tie';
    else if (av == null) winner = 'B';
    else if (bv == null) winner = 'A';
    else if (av !== bv) {
      winner = cat.higher ? (av > bv ? 'A' : 'B') : av < bv ? 'A' : 'B';
    }
    return { ...cat, av, bv, winner };
  });
  const ptsA = results.filter((r) => r.winner === 'A').length;
  const ptsB = results.filter((r) => r.winner === 'B').length;
  // Tiebreaker: better (lower) USNWR rank wins ties. Non-ranked counts as last.
  const rankOf = (r) => (r.s.nonRanked ? 999999 : r.s.usnews_rank);
  let tiebreak = null;
  if (ptsA === ptsB && rankOf(a) !== rankOf(b)) {
    tiebreak = rankOf(a) < rankOf(b) ? 'A' : 'B';
  }
  return { results, ptsA, ptsB, tiebreak };
}
