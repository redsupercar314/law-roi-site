// Pure admissions / ROI math ported from the original single-file build.
export function fmt(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

export function pct(n) {
  return Math.round(n) + '%';
}

export function percentileFor(score, p25, p50, p75, lowSteepness) {
  lowSteepness = lowSteepness || 1;
  function damp(raw) {
    return raw <= 25 ? raw : 25 + Math.sqrt(raw - 25) * 6;
  }
  if (score <= p25) {
    const slope = 25 / (p50 - p25 || 1);
    return 25 - damp((p25 - score) * slope * lowSteepness);
  }
  if (score <= p50) {
    const t = (score - p25) / (p50 - p25 || 1);
    return 25 + t * 25;
  }
  if (score <= p75) {
    const t = (score - p50) / (p75 - p50 || 1);
    return 50 + t * 25;
  }
  const slope = 25 / (p75 - p50 || 1);
  return 75 + damp((score - p75) * slope);
}

export function computeFor(s, profile) {
  const lsatPct = percentileFor(profile.lsat, s.lsat25, s.lsat50, s.lsat75, 1.0);
  const gpaPct = percentileFor(profile.gpa, s.gpa25, s.gpa50, s.gpa75, 1.35);
  let index = 0.62 * lsatPct + 0.38 * gpaPct;

  if (profile.gpa < 3.0) {
    const selectivityFactor = 1 + (100 - s.acceptRate) / 150;
    index -= (3.0 - profile.gpa) * 18 * selectivityFactor;
  }

  index += profile.urm ? 12 : 0;
  index += profile.softs;
  index += profile.legalwork ? Math.min(4, 2 * Math.min(profile.work, 2)) : 0;
  index = Math.max(-60, Math.min(150, index));

  const pRaw = 1 / (1 + Math.exp(-(index - 52) / 10));
  let p = pRaw * (0.45 + s.acceptRate / 100) * 1.05;
  p = Math.max(0.01, Math.min(0.95, p));
  const subThreeCap = profile.gpa < 3.0 ? 0.75 : 1.0;
  if (s.rank <= 6) p = Math.min(p, 0.32 * subThreeCap);
  else if (s.rank <= 14) p = Math.min(p, 0.5 * subThreeCap);
  else if (s.rank <= 30) p = Math.min(p, 0.72 * subThreeCap);
  const chancePct = p * 100;

  let chanceLabel, chanceClass;
  if (chancePct < 20) {
    chanceLabel = 'Reach';
    chanceClass = 'b-reach';
  } else if (chancePct < 50) {
    chanceLabel = 'Target';
    chanceClass = 'b-target';
  } else if (chancePct < 78) {
    chanceLabel = 'Likely';
    chanceClass = 'b-likely';
  } else {
    chanceLabel = 'Very Likely';
    chanceClass = 'b-verylikely';
  }

  let scholPct;
  if (index >= 92) scholPct = 0.88;
  else if (index >= 78) scholPct = 0.6;
  else if (index >= 63) scholPct = 0.35;
  else if (index >= 52) scholPct = 0.16;
  else if (index >= 38) scholPct = 0.06;
  else scholPct = 0.01;
  scholPct *= Math.min(1.3, s.grantPct / 70);
  if (profile.urm) scholPct += 0.05;
  scholPct = Math.max(0, Math.min(1, scholPct));

  // Tuition path (public residency logic). The scholarship is modeled as a
  // renewable percentage of EACH year's tuition: subtracting locked Y1
  // nonresident dollars from cheaper resident Y2/Y3 tuition would otherwise make
  // "resident all 3 years" look MORE expensive than gaining residency later —
  // an inversion real award letters avoid by recalibrating aid on residency change.
  let tuitionY1, tuitionY2, tuitionY3;
  if (s.type === 'Public' && s.tuition_nonresident) {
    tuitionY1 = profile.residency === 'res' ? s.tuition : s.tuition_nonresident;
    if (profile.residency === 'nonres') {
      tuitionY2 = s.tuition_nonresident * 1.03;
      tuitionY3 = s.tuition_nonresident * 1.03 * 1.03;
    } else {
      tuitionY2 = s.tuition * 1.03;
      tuitionY3 = s.tuition * 1.03 * 1.03;
    }
  } else {
    tuitionY1 = s.tuition;
    tuitionY2 = s.tuition * 1.03;
    tuitionY3 = s.tuition * 1.03 * 1.03;
  }
  const scholDollarY1 = tuitionY1 * scholPct;
  const netY1 = tuitionY1 * (1 - scholPct) + s.col;
  const netY2 = tuitionY2 * (1 - scholPct) + s.col * 1.03;
  const netY3 = tuitionY3 * (1 - scholPct) + s.col * 1.03 * 1.03;
  const totalCost = netY1 + netY2 + netY3;

  const rate = profile.loanRateForDebt / 100;
  const debtAtGrad = totalCost * (1 + rate * 1.5);

  let salary;
  if (profile.track === 'biglaw') salary = 225000;
  else if (profile.track === 'public') salary = 65000;
  else salary = s.salaryMedian;

  const dti = debtAtGrad / salary;

  return {
    index,
    chancePct,
    chanceLabel,
    chanceClass,
    scholPct,
    scholDollarY1,
    totalCost,
    debtAtGrad,
    salary,
    dti,
    tuitionY1,
  };
}

export function median(arr) {
  const a = Array.from(arr || []).sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

export function dtiClass(dti) {
  if (dti < 1.2) return 'dti-good';
  if (dti < 2.2) return 'dti-mid';
  return 'dti-bad';
}

export function loanSchedule(principal, annualRatePct, termYears) {
  const r = annualRatePct / 100 / 12;
  const n = termYears * 12;
  const monthly = r === 0 ? principal / n : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return { monthly, total: monthly * n, interest: monthly * n - principal };
}

export function idrMonthlyPayment(annualIncome) {
  const fpl2024_1person = 15060;
  const discretionary = Math.max(0, annualIncome - fpl2024_1person * 2.25);
  return (discretionary * 0.1) / 12;
}
