import rawSchools from './schools-raw.json';
import { BAR_PASS_2024 } from './barpass.js';
import { BAR_REQ_EMPLOYMENT_2024 } from './barreq.js';
import { VERIFIED_OUTCOMES } from './verified.js';

// Mirror the enrichment logic from the original single-file build:
// every school gets a scalar 2024 bar-pass rate, a bar-required employment
// figure, and verified overrides where available.
function enrich(schools) {
  return schools.map((s) => {
    const out = { ...s };
    const barPass = BAR_PASS_2024[s.name];
    if (typeof barPass === 'number' && Number.isFinite(barPass)) {
      out.barPass = barPass;
      out.outcomeYear = 2024;
      out.barPassSource = 'ABA 2024 First-Time Bar Admission Data';
    }
    const barReq = BAR_REQ_EMPLOYMENT_2024[s.name];
    if (typeof barReq === 'number' && Number.isFinite(barReq)) {
      out.barReqEmployment = barReq;
      out.outcomeYear = 2024;
      out.barReqEmploymentSource = 'ILRG ABA-derived Class of 2024 outcomes (rounded)';
    }
    const verifiedKey = Object.keys(VERIFIED_OUTCOMES).find((k) => s.name.includes(k));
    if (verifiedKey) Object.assign(out, VERIFIED_OUTCOMES[verifiedKey]);
    return out;
  });
}

export const SCHOOLS = enrich(rawSchools);
