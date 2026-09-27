import { useEffect, useMemo, useState } from 'react';
import { SCHOOLS } from './data/schools.js';
import {
  computeFor,
  dtiClass,
  fmt,
  idrMonthlyPayment,
  loanSchedule,
  median,
  pct,
} from './lib/calc.js';

const DEFAULT_PROFILE = {
  gpa: 3.5,
  lsat: 165,
  urm: false,
  softs: 0,
  work: 1,
  legalwork: true,
  residency: 'mixed',
  track: 'blended',
  pslf: false,
};

function outcomeClass(v) {
  if (v == null) return '';
  if (v >= 85) return 'outcome-good';
  if (v >= 75) return 'outcome-mid';
  return 'outcome-bad';
}

export default function App() {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [sortKey, setSortKey] = useState('usnews_rank');
  const [sortDir, setSortDir] = useState(1);
  const [outcomeMode, setOutcomeMode] = useState(false);
  const [dark, setDark] = useState(false);
  const [selectedName, setSelectedName] = useState(null);
  const [loan, setLoan] = useState({ rate: 8.05, term: 10, principal: 0, income: 0 });

  useEffect(() => {
    try {
      if (localStorage.getItem('lawroi-theme') === 'dark') setDark(true);
    } catch {}
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
    try {
      localStorage.setItem('lawroi-theme', dark ? 'dark' : 'light');
    } catch {}
  }, [dark]);

  const rows = useMemo(() => {
    const full = { ...profile, loanRateForDebt: 8.05 };
    const computed = SCHOOLS.map((s) => ({ s, c: computeFor(s, full) }));
    const dir = sortDir;
    computed.sort((a, b) => {
      let av, bv;
      switch (sortKey) {
        case 'name':
          return dir * a.s.name.localeCompare(b.s.name);
        case 'chance':
          av = a.c.chancePct; bv = b.c.chancePct; break;
        case 'scholarship':
          av = a.c.scholDollarY1; bv = b.c.scholDollarY1; break;
        case 'netCost':
          av = a.c.totalCost; bv = b.c.totalCost; break;
        case 'debtAtGrad':
          av = a.c.debtAtGrad; bv = b.c.debtAtGrad; break;
        case 'salary':
          av = a.c.salary; bv = b.c.salary; break;
        case 'dti':
          av = a.c.dti; bv = b.c.dti; break;
        case 'barPass':
          av = a.s.barPass ?? -1; bv = b.s.barPass ?? -1; break;
        case 'barReqEmployment':
          av = a.s.barReqEmployment ?? -1; bv = b.s.barReqEmployment ?? -1; break;
        case 'usnews_rank':
        default:
          av = a.s.nonRanked ? 999999 : a.s.usnews_rank;
          bv = b.s.nonRanked ? 999999 : b.s.usnews_rank;
          break;
      }
      return dir * (av - bv);
    });
    return computed;
  }, [profile, sortKey, sortDir]);

  const selected = rows.find((r) => r.s.name === selectedName) ?? null;

  useEffect(() => {
    if (selected) {
      setLoan((l) => ({
        ...l,
        principal: Math.round(selected.c.debtAtGrad),
        income: selected.c.salary,
      }));
    }
  }, [selectedName]); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => {
    const full = { ...profile, loanRateForDebt: 8.05 };
    const all = SCHOOLS.map((s) => ({ s, c: computeFor(s, full) }));
    return {
      likely: all.filter((r) => r.c.chancePct >= 55).length,
      total: all.length,
      reach: all.filter((r) => r.c.chancePct < 25).length,
      bestDti: Math.min(...all.map((r) => r.c.dti)),
      medianT50: median(all.filter((r) => r.s.rank <= 50).map((r) => r.c.debtAtGrad)),
    };
  }, [profile]);

  const bestRoi = rows.filter((r) => r.c.chancePct >= 40).slice().sort((a, b) => a.c.dti - b.c.dti).slice(0, 6);
  const gems = rows
    .filter((r) => r.s.usnews_rank > 50 && r.c.chancePct >= 55 && r.c.dti < 1.6)
    .slice()
    .sort((a, b) => a.c.dti - b.c.dti)
    .slice(0, 6);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setProfile((p) => ({
      ...p,
      [k]:
        k === 'gpa' || k === 'lsat' || k === 'softs' || k === 'work'
          ? parseFloat(v) || 0
          : k === 'urm'
            ? v === '1' || v === true
            : k === 'legalwork'
              ? v === '1' || v === true
              : k === 'pslf'
                ? !!v
                : v,
    }));
  };

  const onSort = (key) => {
    if (sortKey === key) setSortDir((d) => -d);
    else {
      setSortKey(key);
      setSortDir(key === 'barReqEmployment' || key === 'barPass' ? -1 : 1);
    }
  };

  const sched = loanSchedule(loan.principal || 0, loan.rate, loan.term);
  const idr = idrMonthlyPayment(loan.income || 0);

  const headers = outcomeMode
    ? [
        ['usnews_rank', 'USNWR Rank'],
        ['name', 'School'],
        ['chance', 'Admission Chance'],
        ['barPass', 'First-time Bar Pass'],
        ['barReqEmployment', 'Bar-required Employment'],
        ['netCost', 'Net Cost (3 yr)'],
        ['debtAtGrad', 'Est. Debt at Grad'],
        ['dti', 'Debt-to-Income'],
      ]
    : [
        ['usnews_rank', 'USNWR Rank'],
        ['name', 'School'],
        ['chance', 'Admission Chance'],
        ['scholarship', 'Est. Scholarship / yr'],
        ['netCost', 'Net Cost (3 yr)'],
        ['debtAtGrad', 'Est. Debt at Grad'],
        ['salary', 'Est. Starting Salary'],
        ['dti', 'Debt-to-Income'],
      ];

  return (
    <>
      <header className="hero">
        <div className="hero-inner">
          <div className="eyebrow">Law school admissions &amp; ROI modeling</div>
          <h1>Where your numbers actually land, and what they&apos;ll cost you</h1>
          <p>
            Enter a GPA and LSAT to estimate admission odds, likely scholarship, real loan payments, and
            debt-to-income ratio across the 150-school U.S. News–ranked list used by this calculator — then sort
            every school by projected return on investment.
          </p>
          <div className="stamp">
            Modeled from 2025 ABA 509 disclosures, U.S. News 2026–27 rankings, LSAC index-formula research &amp;
            NALP salary data — see methodology below
          </div>
        </div>
      </header>

      <div className="wrap">
        <section id="calc">
          <div className="section-head">
            <h2>Your profile</h2>
            <div className="note">All fields update the table below live.</div>
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="gpa">Undergraduate GPA</label>
              <input type="number" id="gpa" min="1.5" max="4" step="0.01" value={profile.gpa} onChange={set('gpa')} />
            </div>
            <div className="field">
              <label htmlFor="lsat">LSAT score</label>
              <input type="number" id="lsat" min="120" max="180" step="1" value={profile.lsat} onChange={set('lsat')} />
              <div className="hint">Use your highest score, or a target score you&apos;re studying toward.</div>
            </div>
            <div className="field">
              <label htmlFor="urm">URM / diversity status</label>
              <select id="urm" value={profile.urm ? '1' : '0'} onChange={set('urm')}>
                <option value="0">Prefer not to factor in</option>
                <option value="1">Underrepresented minority applicant</option>
              </select>
              <div className="hint">Most schools still weigh this holistically post-SFFA; effect sizes have shrunk but haven&apos;t disappeared.</div>
            </div>
            <div className="field">
              <label htmlFor="softs">Overall soft factors</label>
              <select id="softs" value={String(profile.softs)} onChange={set('softs')}>
                <option value="-8">Below average (weak LORs/PS, red flags)</option>
                <option value="0">Average</option>
                <option value="6">Strong (leadership, notable PS, great LORs)</option>
                <option value="14">Exceptional (unique narrative, major achievement)</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="work">Years of full-time work experience</label>
              <input type="number" id="work" min="0" max="20" step="1" value={profile.work} onChange={set('work')} />
            </div>
            <div className="field">
              <label htmlFor="legalwork">Is that experience legal-adjacent?</label>
              <select id="legalwork" value={profile.legalwork ? '1' : '0'} onChange={set('legalwork')}>
                <option value="0">No / not applicable</option>
                <option value="1">Yes (paralegal, compliance, military JAG-adjacent, gov&apos;t legal office, etc.)</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="residency">Residency assumption for public schools</label>
              <select id="residency" value={profile.residency} onChange={set('residency')}>
                <option value="nonres">Non-resident all 3 years</option>
                <option value="mixed">Non-resident 1L, establish residency by 2L</option>
                <option value="res">Resident all 3 years</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="track">Expected career track (for salary/DTI)</label>
              <select id="track" value={profile.track} onChange={set('track')}>
                <option value="blended">Realistic blend (school&apos;s actual outcome mix)</option>
                <option value="biglaw">Big Law track ($225k target)</option>
                <option value="public">Public interest / JAG / government (~$65k)</option>
              </select>
            </div>
          </div>
          <div className="checkrow">
            <input type="checkbox" id="pslf" checked={profile.pslf} onChange={set('pslf')} />
            <label htmlFor="pslf">I&apos;m planning on PSLF / income-driven repayment (e.g. JAG Corps, government, nonprofit)</label>
          </div>
          <div className="index-readout">
            <div className="stat-card">
              <div className="label">Schools at Likely+ odds</div>
              <div className="value">{stats.likely} <span style={{ fontSize: 14, color: '#8a8371' }}>of {stats.total}</span></div>
            </div>
            <div className="stat-card">
              <div className="label">Schools still a Reach</div>
              <div className="value">{stats.reach}</div>
            </div>
            <div className="stat-card">
              <div className="label">Best modeled DTI</div>
              <div className="value">{stats.bestDti.toFixed(2)}×</div>
            </div>
            <div className="stat-card">
              <div className="label">Median debt at grad, T50</div>
              <div className="value">{fmt(stats.medianT50)}</div>
            </div>
          </div>
        </section>

        <section id="tableSection">
          <div className="modebar">
            <div><b>View:</b> switch between the calculator model and documented legal outcomes.</div>
            <div className="mode-buttons">
              <button
                className={'mode-btn' + (!outcomeMode ? ' active' : '')}
                type="button"
                onClick={() => { setOutcomeMode(false); setSortKey('usnews_rank'); setSortDir(1); }}
              >
                ROI / Admissions Model
              </button>
              <button
                className={'mode-btn' + (outcomeMode ? ' active' : '')}
                type="button"
                onClick={() => { setOutcomeMode(true); setSortKey('barReqEmployment'); setSortDir(-1); }}
              >
                Actual Legal Outcomes
              </button>
            </div>
          </div>
          <div className="section-head">
            <h2>All {SCHOOLS.length} schools, ranked by your numbers</h2>
            <div className="note">Click any row for the full loan calculator. Click a column header to sort.</div>
          </div>
          <div className="table-scroll">
            <table id="schoolTable">
              <thead>
                <tr>
                  {headers.map(([key, label]) => (
                    <th key={key} data-key={key} className={sortKey === key ? 'active' : ''} onClick={() => onSort(key)}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.s.name} onClick={() => setSelectedName(r.s.name)}>
                    <td>{r.s.nonRanked ? 'NR' : '#' + r.s.usnews_rank}</td>
                    <td><div className="school-name">{r.s.name}</div><div className="school-sub">{r.s.type}</div></td>
                    <td>
                      <span className={'badge ' + r.c.chanceClass}>{r.c.chanceLabel}</span>{' '}
                      <span style={{ fontSize: 11.5, color: '#8a8371' }}>{Math.round(r.c.chancePct)}%</span>
                    </td>
                    {outcomeMode ? (
                      <>
                        <td>{r.s.barPass == null ? '—' : <span className={outcomeClass(r.s.barPass)}>{r.s.barPass.toFixed(1)}%</span>}</td>
                        <td>{r.s.barReqEmployment == null ? '—' : <span className={outcomeClass(r.s.barReqEmployment)}>{r.s.barReqEmployment.toFixed(1)}%</span>}</td>
                        <td>{fmt(r.c.totalCost)}</td>
                        <td>{fmt(r.c.debtAtGrad)}</td>
                        <td className={dtiClass(r.c.dti)}>{r.c.dti.toFixed(2)}×</td>
                      </>
                    ) : (
                      <>
                        <td>{fmt(r.c.scholDollarY1)}</td>
                        <td>{fmt(r.c.totalCost)}</td>
                        <td>{fmt(r.c.debtAtGrad)}</td>
                        <td>{fmt(r.c.salary)}</td>
                        <td className={dtiClass(r.c.dti)}>{r.c.dti.toFixed(2)}×</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selected && (
            <div id="detail" className="open">
              <button id="closeDetail" onClick={() => setSelectedName(null)}>Close ×</button>
              <h3>{selected.s.name}</h3>
              <div className="detail-grid">
                <div>
                  <div className="line-item"><span>USNWR rank</span><span>{selected.s.nonRanked ? 'NR' : '#' + selected.s.usnews_rank}</span></div>
                  <div className="line-item"><span>Type</span><span>{selected.s.type}</span></div>
                  <div className="line-item"><span>LSAT 25 / 50 / 75</span><span>{selected.s.lsat25} / {selected.s.lsat50} / {selected.s.lsat75}</span></div>
                  <div className="line-item"><span>GPA 25 / 50 / 75</span><span>{selected.s.gpa25.toFixed(2)} / {selected.s.gpa50.toFixed(2)} / {selected.s.gpa75.toFixed(2)}</span></div>
                  <div className="line-item"><span>Sticker tuition (yr 1)</span><span>{fmt(selected.c.tuitionY1) + (selected.s.type === 'Public' ? ' (residency-adjusted)' : '')}</span></div>
                  <div className="line-item"><span>Est. living costs / yr</span><span>{fmt(selected.s.col)}</span></div>
                  <div className="line-item"><span>Est. admission chance</span><span><span className={'badge ' + selected.c.chanceClass}>{selected.c.chanceLabel}</span> {Math.round(selected.c.chancePct)}%</span></div>
                  <div className="line-item"><span>Est. scholarship / yr</span><span>{fmt(selected.c.scholDollarY1) + ' (' + Math.round(selected.c.scholPct * 100) + '% of tuition)'}</span></div>
                  <div className="line-item"><span>Est. total cost, 3 yrs</span><span>{fmt(selected.c.totalCost)}</span></div>
                  <div className="line-item"><span>Est. debt at graduation (with accrued interest)</span><span>{fmt(selected.c.debtAtGrad)}</span></div>
                  <div className="line-item"><span>Grads at firms of 500+ lawyers</span><span>{pct(selected.s.pctBiglaw)}</span></div>
                  <div className="line-item"><span>First-time bar passage</span><span>{selected.s.barPass == null ? 'Not available' : selected.s.barPass.toFixed(1) + '% (2024)'}</span></div>
                  <div className="line-item"><span>Bar-required employment</span><span>{selected.s.barReqEmployment == null ? 'Not yet loaded for this school' : selected.s.barReqEmployment.toFixed(1) + '%'}</span></div>
                  <div className="outcome-note">
                    {selected.s.barReqEmployment == null
                      ? 'First-time bar passage is loaded from the ABA 2024 bar-admission data. Bar-required employment is only shown where a verified school-level record is loaded; JD Advantage is excluded from that metric.'
                      : 'Outcome data shown for the school-reported 2024 employment/bar cohort in this build. Bar-required employment excludes JD Advantage roles.'}
                  </div>
                  <div className="line-item"><span>Est. starting salary (your track)</span><span>{fmt(selected.c.salary)}</span></div>
                  <div className="line-item"><span>Debt-to-income ratio</span><span className={dtiClass(selected.c.dti)}>{selected.c.dti.toFixed(2)}×</span></div>
                </div>
                <div>
                  <h3 style={{ fontSize: 16 }}>Loan calculator</h3>
                  <div className="loan-row">
                    <label htmlFor="loanPrincipal">Loan amount</label>
                    <input type="number" id="loanPrincipal" step="500" value={loan.principal} onChange={(e) => setLoan((l) => ({ ...l, principal: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div className="loan-row">
                    <label htmlFor="loanRate">Interest rate</label>
                    <input type="range" id="loanRate" min="3" max="14" step="0.05" value={loan.rate} onChange={(e) => setLoan((l) => ({ ...l, rate: parseFloat(e.target.value) }))} />
                    <span className="range-val">{loan.rate.toFixed(2)}%</span>
                  </div>
                  <div className="loan-row">
                    <label htmlFor="loanTerm">Term (years)</label>
                    <input type="range" id="loanTerm" min="5" max="30" step="1" value={loan.term} onChange={(e) => setLoan((l) => ({ ...l, term: parseInt(e.target.value) }))} />
                    <span className="range-val">{loan.term} yr</span>
                  </div>
                  <div className="line-item"><span>Monthly payment (standard amortization)</span><span>{fmt(sched.monthly)}</span></div>
                  <div className="line-item"><span>Total repaid over term</span><span>{fmt(sched.total)}</span></div>
                  <div className="line-item"><span>Total interest paid</span><span>{fmt(sched.interest)}</span></div>
                  {profile.pslf && (
                    <div id="pslfBlock" style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
                      <h3 style={{ fontSize: 15 }}>PSLF / IDR snapshot (directional, not a projection)</h3>
                      <div className="loan-row">
                        <label htmlFor="idrIncome">Starting salary for IDR</label>
                        <input type="number" id="idrIncome" step="1000" value={loan.income} onChange={(e) => setLoan((l) => ({ ...l, income: parseFloat(e.target.value) || 0 }))} />
                      </div>
                      <div className="line-item"><span>Est. IDR monthly payment (10% discretionary, SAVE-style)</span><span>{fmt(idr)}</span></div>
                      <div className="line-item"><span>Payments needed for 120-payment PSLF forgiveness</span><span>120 (10 yrs), if in qualifying employment continuously</span></div>
                      <div className="footnote">This is a rough snapshot at today&apos;s income and today&apos;s rules, not a 10-year projection — your payment rises as your salary rises, and IDR/PSLF program rules have changed several times in recent years and may change again.</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        <section id="suggestions">
          <div className="section-head">
            <h2>Best ROI given your numbers</h2>
            <div className="note">Ranked by lowest debt-to-income ratio among schools where you&apos;re at Target odds or better.</div>
          </div>
          <div className="pick-grid">
            {bestRoi.map((r) => (
              <div className="pick-card" key={r.s.name}>
                <div className="rank-tag">{r.s.nonRanked ? 'Non-ranked' : 'USNWR #' + r.s.usnews_rank} · {r.s.type}</div>
                <h4>{r.s.name}</h4>
                <div className="metric">Admission odds: <b>{r.c.chanceLabel} ({Math.round(r.c.chancePct)}%)</b></div>
                <div className="metric">Est. scholarship: <b>{fmt(r.c.scholDollarY1)}/yr</b></div>
                <div className="metric">Debt-to-income: <b>{r.c.dti.toFixed(2)}×</b></div>
                <div className="metric">Est. starting salary: <b>{fmt(r.c.salary)}</b></div>
              </div>
            ))}
          </div>
        </section>

        <section id="hiddengems">
          <div className="section-head">
            <h2>Schools worth a second look</h2>
            <div className="note">Outside the top 50 by prestige, but strong odds, generous aid, and a favorable debt load for you specifically.</div>
          </div>
          <div className="pick-grid">
            {gems.map((r) => (
              <div className="pick-card" key={r.s.name}>
                <div className="rank-tag">{r.s.nonRanked ? 'Non-ranked' : 'USNWR #' + r.s.usnews_rank} · {r.s.type}</div>
                <h4>{r.s.name}</h4>
                <div className="metric">Admission odds: <b>{r.c.chanceLabel} ({Math.round(r.c.chancePct)}%)</b></div>
                <div className="metric">Est. scholarship: <b>{fmt(r.c.scholDollarY1)}/yr</b></div>
                <div className="metric">Debt-to-income: <b>{r.c.dti.toFixed(2)}×</b></div>
                <div className="metric">Est. starting salary: <b>{fmt(r.c.salary)}</b></div>
              </div>
            ))}
          </div>
        </section>

        <section id="methodology">
          <div className="section-head"><h2>Methodology &amp; honest limitations</h2></div>
          <div className="methodology">
            <h3>What&apos;s real, what&apos;s modeled</h3>
            <p>LSAT/GPA medians and splits, acceptance rates, and grant-recipient rates for roughly 20 anchor schools come directly from each school&apos;s 2025 ABA Standard 509 Information Report. See the original build for the full per-school notes.</p>
            <ul>
              <li><b>Admission chance</b> weights the LSAT at roughly 1.6x the GPA (62/38), matching school-published LSAC ACES2 index formulas.</li>
              <li><b>Scholarship estimate</b> scales with the same index, so a below-band GPA earns less modeled merit money too.</li>
              <li><b>Debt at graduation</b> assumes 3% annual tuition growth, borrowing 100% of net cost each year, capitalizing ~1.5 years of accrued interest.</li>
              <li><b>Salary / DTI</b> uses a bimodal model blended by each school&apos;s modeled % placing in Big Law.</li>
              <li><b>Actual Legal Outcomes toggle</b> uses first-time bar passage plus bar-admission-required employment (JD Advantage excluded).</li>
            </ul>
            <p>Use this to build intuition about ranges and trade-offs, not as your final number for any one school — pull that school&apos;s real, current 509 report and its actual financial aid offer before deciding anything.</p>
          </div>
        </section>
      </div>

      <button
        className="theme-fab"
        type="button"
        onClick={() => setDark((d) => !d)}
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {dark ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>
    </>
  );
}
