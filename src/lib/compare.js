// Head-to-head school comparison: 5 categories, 1 point each, most points wins.
// USNWR rank is NOT a point category — it only breaks ties, so prestige can
// never outvote admission odds, money, or outcomes. Numeric only.

export function outcomeScore(r) {
  const parts = [r.s.barPass, r.s.barReqEmployment].filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (!parts.length) return null;
  return parts.reduce((x, y) => x + y, 0) / parts.length;
}

export const COMPARE_CATS = [
  { key: 'chance', name: 'Admission chance', get: (r) => r.c.chancePct, higher: true },
  { key: 'schol', name: 'Scholarship / yr', get: (r) => r.c.scholDollarY1, higher: true },
  { key: 'dti', name: 'Debt-to-income', get: (r) => r.c.dti, higher: false },
  { key: 'salary', name: 'Starting salary', get: (r) => r.c.salary, higher: true },
  { key: 'outcomes', name: 'Legal outcomes (bar + employment avg)', get: (r) => outcomeScore(r), higher: true },
];

export function compareRows(a, b) {
  const results = COMPARE_CATS.map((cat) => {
    const av = cat.get(a);
    const bv = cat.get(b);
    let winner = 'tie';
    if (av == null && bv == null) winner = 'tie';
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
