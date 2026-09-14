import React, { useEffect, useRef, useState } from "react";

/* ---------------------------------------------------------
   Small presentational pieces
--------------------------------------------------------- */
function Pill({ label, cls, className = "" }) {
  return (
    <span className={`pill ${cls} ${className}`}>
      <span className="dot" />
      {label}
    </span>
  );
}

function StatusRow({ label, cls, desc }) {
  return (
    <div className="status-row">
      <Pill label={label} cls={cls} />
      <span className="status-desc">{desc}</span>
    </div>
  );
}

/* ---------------------------------------------------------
   Data — edit these arrays to update the SOP content
--------------------------------------------------------- */
const PHASES = [
  { label: "Phase 1 · Sourcing", cls: "teal" },
  { label: "Phase 2 · Selection", cls: "blue" },
  { label: "Phase 3 · Onboarding", cls: "purple" },
];

const STATUS_LEGEND = [
  { label: "Pending", cls: "orange", desc: "Waiting for the next action to be taken." },
  { label: "In Progress", cls: "blue", desc: "Currently being worked on." },
  { label: "Waiting for Process", cls: "yellow", desc: "Queued, not yet picked up." },
  { label: "Completed", cls: "green", desc: "This stage is finished." },
  { label: "Selected", cls: "green", desc: "Candidate passed the interview stage." },
  { label: "Hold", cls: "orange", desc: "Paused; can resume screening later." },
  { label: "Rejected", cls: "red", desc: "Candidate did not proceed." },
  { label: "Cancelled", cls: "red", desc: "Candidate withdrew or the job requisition was cancelled." },
  { label: "Sent / Resent", cls: "yellow", desc: "Offer letter emailed to the candidate." },
  { label: "To Be Verified / Submitted", cls: "blue", desc: "Candidate has uploaded documents, awaiting review." },
  { label: "Verified", cls: "green", desc: "Document confirmed valid by HR." },
  { label: "Resend", cls: "red", desc: "Document rejected; candidate must re-upload." },
  { label: "Partially Verified", cls: "amber", desc: "Some documents approved, others still pending." },
  { label: "Not Applicable / NA", cls: "slate", desc: "Document not required for this role." },
  { label: "On-Roll", cls: "green", desc: "Candidate is now an active employee." },
];

const STAGES = [
  {
    id: 1,
    phase: "phase1",
    phaseVar: "var(--teal)",
    phaseName: "Phase 1 · Sourcing",
    navLabel: "Registration",
    title: "Candidate Registration",
    goal: "Record the candidate's basic details",
    who: "HR Coordinator / Recruitment Team",
    steps: [
      <>Click <b>New</b> on the ATS dashboard.</>,
      <>Fill <b>Applicant Information</b>: Enrolled No. (auto-generated), Applicant Date, Department, Designation, Ref Mode.</>,
      <>Fill <b>Personal Information</b>: Title, Applicant Name, Father Name, Birth Date, Age (auto-calculated).</>,
      <>Fill <b>Contact Information</b>: Country Code, Mobile Number, Email ID, Aadhaar Card Number.</>,
      <>Click <b>Save</b> to store the profile.</>,
    ],
    statusNote: <div className="status-line"><Pill label="Applied" cls="green" /> is set automatically</div>,
  },
  {
    id: 2,
    phase: "phase1",
    phaseVar: "var(--teal)",
    phaseName: "Phase 1 · Sourcing",
    navLabel: "Screening",
    title: "Initial Call & Screening",
    goal: "Check eligibility and interest",
    who: "Recruiter",
    steps: [
      <>In the <b>Call</b> column, log the outcome (Connected, Switch Off, Not Reachable).</>,
      <>Add screening comments with date and time.</>,
      <>If eligible, move the candidate to <b>Interview Process</b>.</>,
    ],
    statusNote: <div className="status-line"><Pill label="Waiting for Process" cls="yellow" /> until the interview is scheduled</div>,
  },
  {
    id: 3,
    phase: "phase2",
    phaseVar: "var(--blue)",
    phaseName: "Phase 2 · Selection",
    navLabel: "Interview",
    title: "Interview Rounds & Evaluation",
    goal: "Assess technical skill and cultural fit",
    who: "Technical Panel / HR Panel",
    steps: [
      <>Recruiter schedules the interview date and time.</>,
      <><b>Technical Interview</b> — evaluator scores skills and adds comments.</>,
      <><b>HR Interview</b> — HR evaluates communication, location flexibility, notice period, culture fit.</>,
      <>Recruiter marks the candidate <b>Selected</b>, <b>Rejected</b>, or <b>Hold</b>.</>,
    ],
    statusNote: <div className="status-line"><Pill label="In Progress" cls="blue" /> while interviews are underway — decision point after, see branches above</div>,
  },
  {
    id: 4,
    phase: "phase2",
    phaseVar: "var(--blue)",
    phaseName: "Phase 2 · Selection",
    navLabel: "Salary",
    title: "Final Interview & Salary Structure",
    goal: "Final review and salary setup for selected candidates",
    who: "HOD / Management / Senior HR",
    steps: [
      <>Open the <b>Salary Structure</b> tab.</>,
      <>Enter Basic, DA, HRA, Special Allowance, Performance Incentives.</>,
      <>Check the CTC calculation.</>,
      <>Click <b>Finalize &amp; Approve</b> to lock it.</>,
    ],
    statusNote: <div className="status-line"><Pill label="Completed" cls="green" /> once approved</div>,
  },
  {
    id: 5,
    phase: "phase2",
    phaseVar: "var(--blue)",
    phaseName: "Phase 2 · Selection",
    navLabel: "Offer Letter",
    title: "Offer Letter Generation & Dispatch",
    goal: "Issue the official job offer",
    who: "HR Manager",
    steps: [
      <>Open the <b>Offer Letter</b> tab.</>,
      <>Select the approved salary structure, pick a joining date, review terms.</>,
      <>Click <b>Generate Offer Letter</b> to create the PDF.</>,
      <>Click <b>Dispatch Offer</b> to email it with a secure portal link.</>,
    ],
    statusNote: <div className="status-line"><Pill label="Sent" cls="yellow" /></div>,
  },
  {
    id: 6,
    phase: "phase3",
    phaseVar: "var(--purple)",
    phaseName: "Phase 3 · Onboarding",
    navLabel: "Documents",
    title: "Onboarding Document Submission",
    goal: "Candidate submits credentials and KYC details",
    who: "Candidate",
    steps: [
      <>Candidate logs into the portal via the secure link in the offer email.</>,
      <>Fills in self-assessment answers and personal details.</>,
      <>
        Uploads scanned copies of:
        <ul className="doc-list">
          <li>Aadhaar Card</li>
          <li>PAN Card</li>
          <li>Education / Degree Certificates</li>
          <li>Passport-size photograph</li>
          <li>Previous experience certificates / pay slips</li>
        </ul>
      </>,
      <>Clicks <b>Submit</b> to send for verification.</>,
    ],
    statusNote: <div className="status-line"><Pill label="To Be Verified" cls="blue" /></div>,
  },
  {
    id: 7,
    phase: "phase3",
    phaseVar: "var(--purple)",
    phaseName: "Phase 3 · Onboarding",
    navLabel: "Verification",
    title: "HR Document Verification",
    goal: "Confirm every uploaded document is valid",
    who: "HR Auditor",
    steps: [
      <>Find candidates marked <b>To Be Verified</b> on the dashboard.</>,
      <>Click the <b>Review (eye)</b> icon in the Offer column.</>,
      <>Preview each document alongside candidate details.</>,
      <>If valid, click <b>Approve</b>. If not, click <b>Reject</b>, enter the reason, then <b>Reject &amp; Send Email</b> to notify the candidate.</>,
    ],
    statusNote: (
      <>
        <div className="status-line">
          <Pill label="Partially Verified" cls="amber" /> while some documents are still pending, or{" "}
          <Pill label="Not Applicable" cls="slate" /> for documents this role doesn't require
        </div>
        <div className="status-line">
          Once every document is approved → <Pill label="Verified" cls="green" />
        </div>
      </>
    ),
  },
  {
    id: 8,
    phase: "phase3",
    phaseVar: "var(--purple)",
    phaseName: "Phase 3 · Onboarding",
    navLabel: "Induction",
    title: "Final Induction & Transfer to Employee Roster",
    goal: "Bring the candidate on board as an employee",
    who: "HR Executive",
    steps: [
      <>Transfer the candidate to the <b>Employee Master</b> list.</>,
      <>Allocate employee code, official email ID, reporting manager, and joining date.</>,
      <>Mark the candidate as <b>On-Roll</b> in the database.</>,
    ],
    statusNote: <div className="status-line">Final status: <Pill label="On-Roll" cls="green" /></div>,
  },
];

// Branch decisions rendered right after a given stage's box in the flow
const DECISIONS = {
  3: {
    title: "Selection Decision",
    sub: "Recruiter marks the outcome after reviewing panel comments",
    branches: [
      { label: "Rejected", cls: "red", note: "Candidate marked Rejected. Flow ends here.", main: false },
      { label: "Selected", cls: "green", note: "Continues to Stage 4 ↓", main: true },
      { label: "Hold", cls: "orange", note: "Paused. Can resume screening later.", main: false },
    ],
  },
  7: {
    branches: [
      { label: "Resend", cls: "red", note: "Candidate re-uploads the file → sent back to Stage 6", main: false },
      { label: "Verified", cls: "green", note: "Continues to Stage 8 ↓", main: true },
    ],
  },
};

/* ---------------------------------------------------------
   Main component
--------------------------------------------------------- */
export function ApplicationTrackingSystemManual() {
  const [activeStep, setActiveStep] = useState(1);
  const stepRefs = useRef({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = Number(entry.target.getAttribute("data-step-id"));
            setActiveStep(id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );
    Object.values(stepRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="sop-root">
      <style>{CSS}</style>
      <div className="wrap">

        {/* HEADER */}
        <div className="header-card">
          <div className="title-bar">
            <div className="icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                <circle cx="9" cy="7" r="4" stroke="#fff" strokeWidth="2" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h1>Application Tracking System</h1>
              <p>Standard Operating Procedure</p>
            </div>
          </div>
          <div className="header-body">
            <div className="chip-row">
              <span className="chip">Module <b>Recruitment &amp; Onboarding</b></span>
              <span className="chip">Owner <b>HR Team</b></span>
              <span className="chip">Updated <b>Aug 2026</b></span>
            </div>
            <p className="desc">
              This walks through the full path a candidate takes in the ERP — from registration to their first
              day as an employee. Check the flow below for the big picture, then open a stage card for the exact
              fields and buttons.
            </p>
          </div>
        </div>

        {/* PHASE LEGEND */}
        <div className="legend-card">
          <div className="legend-title">Recruitment phases</div>
          {PHASES.map((p) => (
            <Pill key={p.label} label={p.label} cls={p.cls} />
          ))}
        </div>

        {/* STATUS GLOSSARY */}
        <div className="status-grid">
          <div className="legend-title">Status colours (matches the dashboard exactly)</div>
          <div className="status-list">
            {STATUS_LEGEND.map((s) => (
              <StatusRow key={s.label} {...s} />
            ))}
          </div>
        </div>

        {/* QUICK NAV */}
        <div className="tabbar">
          {STAGES.map((s) => (
            <a key={s.id} className={`tab ${activeStep === s.id ? "tab-active" : ""}`} href={`#step-${s.id}`}>
              <span className="num">{s.id}</span>
              {s.navLabel}
            </a>
          ))}
        </div>

        {/* FLOW */}
        <div className="section-label"><span className="bar" />
          <h2>End-to-end Flow</h2>
        </div>
        <div className="flow-card">
          <div className="flow">
            {STAGES.map((s, idx) => (
              <React.Fragment key={s.id}>
                <a className={`box ${s.phase}`} href={`#step-${s.id}`}>
                  <span className="sq" style={{ background: s.phaseVar }}>{s.id}</span>
                  <span className="txt">
                    <span className="stage">Stage {s.id}</span><br />
                    <span className="title">{s.title}</span>
                  </span>
                </a>

                {DECISIONS[s.id] && (
                  <>
                    <div className="connector" />
                    {DECISIONS[s.id].title && (
                      <div className="decision-box">
                        <div className="title">{DECISIONS[s.id].title}</div>
                        <div className="sub">{DECISIONS[s.id].sub}</div>
                      </div>
                    )}
                    <div className="branch-row">
                      {DECISIONS[s.id].branches.map((b) => (
                        <div className={`branch ${b.main ? "main" : ""}`} key={b.label}>
                          <Pill label={b.label} cls={b.cls} />
                          <span className="note">{b.note}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {idx < STAGES.length - 1 && <div className="connector" />}
              </React.Fragment>
            ))}

            <div className="connector" />
            <Pill label="On-Roll" cls="green" className="final-badge" />
          </div>
        </div>

        {/* STAGE DETAILS */}
        <div className="section-label"><span className="bar" />
          <h2>Stage-by-stage Instructions</h2>
        </div>
        <div className="steps">
          {STAGES.map((s) => (
            <div
              className="step-card"
              id={`step-${s.id}`}
              key={s.id}
              data-step-id={s.id}
              ref={(el) => (stepRefs.current[s.id] = el)}
            >
              <div className="step-top">
                <span className="sq" style={{ background: s.phaseVar }}>{s.id}</span>
                <div>
                  <h3>{s.title}</h3>
                  <div className="phase-name">{s.phaseName}</div>
                </div>
              </div>
              <div className="step-body">
                <div className="meta-row">
                  <div><span className="k">Goal</span><span className="v">{s.goal}</span></div>
                  <div><span className="k">Who</span><span className="v">{s.who}</span></div>
                </div>
                <ol className="proc">
                  {s.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
                {s.statusNote}
              </div>
            </div>
          ))}
        </div>

        <footer>ATS · Recruitment Module · End of Procedure</footer>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Styles
--------------------------------------------------------- */
const CSS = `
.sop-root{
  --blue:#2f7fe0; --blue-dark:#1c64c9; --blue-bg:#eaf4fd;
  --green:#189a52; --green-bg:#e6f7ec;
  --orange:#c2410c; --orange-bg:#fce4d6;
  --red:#dc2626; --red-bg:#fde8e8;
  --yellow:#a68b06; --yellow-bg:#fdf6d8;
  --amber:#b45309; --amber-bg:#fdf0da;
  --slate:#475569; --slate-bg:#eef1f5;
  --purple:#7c3aed; --purple-bg:#f1eafd;
  --teal:#0d9488; --teal-bg:#e2f6f4;
  --ink:#1f2937; --ink-soft:#6b7280; --ink-faint:#9aa4b2;
  --border:#e5e9f0; --page-bg:#eef1f6; --card:#ffffff;
  font-family:'Inter',-apple-system,'Segoe UI',sans-serif;
  background:var(--page-bg);
  color:var(--ink);
}
.sop-root *{box-sizing:border-box;}
.sop-root a{color:inherit;text-decoration:none;}
.sop-root .wrap{max-width:900px;margin:0 auto;padding:24px 16px 70px;}

.header-card{background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(16,24,40,.04);margin-bottom:18px;}
.title-bar{background:var(--blue-bg);padding:16px 24px;display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--border);}
.title-bar .icon{width:34px;height:34px;border-radius:9px;background:var(--blue);display:flex;align-items:center;justify-content:center;color:#fff;flex:none;}
.title-bar h1{margin:0;font-size:18px;font-weight:700;color:var(--blue-dark);}
.title-bar p{margin:1px 0 0;font-size:12.5px;color:var(--blue-dark);opacity:.75;font-weight:500;}
.header-body{padding:18px 24px 22px;}
.chip-row{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;}
.chip{font-size:11.5px;font-weight:600;color:var(--ink-soft);background:#f4f6f9;border:1px solid var(--border);padding:4px 10px;border-radius:20px;}
.chip b{color:var(--ink);}
.header-body p.desc{margin:0;font-size:14px;line-height:1.6;color:var(--ink-soft);max-width:68ch;}

.legend-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px 20px;margin-bottom:14px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;}
.legend-title{width:100%;font-size:11.5px;font-weight:700;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px;}
.status-grid{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px 20px 18px;margin-bottom:18px;}
.status-grid .legend-title{margin-bottom:12px;}
.status-list{display:grid;grid-template-columns:repeat(2,1fr);gap:10px 20px;}
.status-row{display:flex;align-items:flex-start;gap:10px;padding:6px 0;border-top:1px solid #f1f3f7;}
.status-list .status-row:nth-child(1),.status-list .status-row:nth-child(2){border-top:none;}
.status-row .pill{flex:none;min-width:126px;justify-content:flex-start;}
.status-row .status-desc{font-size:12px;color:var(--ink-soft);line-height:1.4;padding-top:2px;}

.pill{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;padding:5px 12px;border-radius:20px;}
.pill .dot{width:6px;height:6px;border-radius:50%;background:currentColor;flex:none;}
.pill.blue{background:var(--blue-bg);color:var(--blue-dark);}
.pill.green{background:var(--green-bg);color:var(--green);}
.pill.orange{background:var(--orange-bg);color:var(--orange);}
.pill.red{background:var(--red-bg);color:var(--red);}
.pill.yellow{background:var(--yellow-bg);color:var(--yellow);}
.pill.amber{background:var(--amber-bg);color:var(--amber);}
.pill.slate{background:var(--slate-bg);color:var(--slate);}
.pill.teal{background:var(--teal-bg);color:var(--teal);}
.pill.purple{background:var(--purple-bg);color:var(--purple);}

.tabbar{display:flex;flex-wrap:wrap;gap:8px;background:var(--card);border:1px solid var(--border);border-radius:14px;padding:10px;margin-bottom:22px;}
.tab{display:flex;align-items:center;gap:7px;font-size:12.5px;font-weight:600;color:var(--ink-soft);background:#f4f6f9;border:1px solid transparent;padding:7px 12px 7px 8px;border-radius:9px;transition:background .12s ease;}
.tab:hover{background:var(--blue-bg);color:var(--blue-dark);}
.tab-active{background:var(--blue-bg);color:var(--blue-dark);border-color:var(--blue);}
.tab .num{width:19px;height:19px;border-radius:6px;background:var(--blue);color:#fff;font-size:10.5px;font-weight:700;display:flex;align-items:center;justify-content:center;flex:none;}

.section-label{display:flex;align-items:center;gap:8px;margin:0 0 14px;}
.section-label .bar{width:4px;height:16px;background:var(--blue);border-radius:3px;}
.section-label h2{margin:0;font-size:16px;font-weight:700;color:var(--ink);}

.flow-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:26px 20px 30px;margin-bottom:26px;}
.flow{display:flex;flex-direction:column;align-items:center;}
.box{width:100%;max-width:460px;display:flex;align-items:center;gap:12px;background:#fff;border:1.5px solid var(--border);border-radius:12px;padding:12px 16px;transition:border-color .12s ease,box-shadow .12s ease;}
.box:hover{border-color:var(--blue);box-shadow:0 2px 8px rgba(47,127,224,.12);}
.box .sq{width:34px;height:34px;border-radius:9px;flex:none;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:700;}
.box .txt .stage{font-size:10.5px;font-weight:700;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.03em;}
.box .txt .title{font-size:14px;font-weight:600;color:var(--ink);}

.connector{width:2px;height:22px;background:var(--border);}

.decision-box{width:100%;max-width:460px;background:var(--blue-bg);border:1.5px dashed var(--blue);border-radius:12px;padding:12px 16px;text-align:center;}
.decision-box .title{font-size:13.5px;font-weight:700;color:var(--blue-dark);}
.decision-box .sub{font-size:11.5px;color:var(--blue-dark);opacity:.75;margin-top:2px;}

.branch-row{display:flex;flex-wrap:wrap;justify-content:center;gap:14px;width:100%;max-width:640px;padding-top:18px;}
.branch{flex:1;min-width:150px;display:flex;flex-direction:column;align-items:center;gap:8px;background:#fbfcfe;border:1px solid var(--border);border-radius:12px;padding:12px 10px;text-align:center;}
.branch.main{border-color:var(--blue);}
.branch .note{font-size:11px;color:var(--ink-soft);line-height:1.4;}

.final-badge{margin-top:6px;}

.steps{display:flex;flex-direction:column;gap:14px;}
.step-card{scroll-margin-top:16px;background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:hidden;}
.step-top{display:flex;align-items:center;gap:12px;padding:16px 20px;border-bottom:1px solid var(--border);}
.step-top .sq{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;flex:none;}
.step-top h3{margin:0;font-size:15.5px;font-weight:700;color:var(--ink);}
.step-top .phase-name{font-size:11.5px;color:var(--ink-faint);font-weight:600;}

.step-body{padding:16px 20px 20px;}
.meta-row{display:flex;flex-wrap:wrap;gap:24px;margin-bottom:14px;}
.meta-row .k{font-size:10.5px;font-weight:700;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.04em;display:block;margin-bottom:3px;}
.meta-row .v{font-size:13.5px;font-weight:600;color:var(--ink);}

.proc{margin:0;padding:0;list-style:none;counter-reset:s;}
.proc li{counter-increment:s;display:flex;gap:10px;padding:8px 0;font-size:13.5px;line-height:1.55;color:var(--ink-soft);border-top:1px solid #f1f3f7;}
.proc li:first-child{border-top:none;}
.proc li::before{content:counter(s);flex:none;width:20px;height:20px;border-radius:6px;background:var(--blue-bg);color:var(--blue-dark);font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px;}
.proc li b{color:var(--ink);font-weight:600;}
.doc-list{margin:6px 0 0;padding-left:16px;font-size:13px;color:var(--ink-soft);}
.doc-list li{margin-bottom:2px;}

.status-line{margin-top:14px;display:flex;align-items:center;flex-wrap:wrap;gap:8px;font-size:12.5px;color:var(--ink-faint);}

.sop-root footer{margin-top:30px;text-align:center;font-size:11.5px;color:var(--ink-faint);}

@media (max-width:640px){
  .status-list{grid-template-columns:1fr;}
  .status-list .status-row:nth-child(2){border-top:1px solid #f1f3f7;}
  .branch-row{flex-direction:column;align-items:center;}
  .branch{max-width:280px;}
}
`;
