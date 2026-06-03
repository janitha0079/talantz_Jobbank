/* global React, C, COMPANIES, RANKED, PIPELINE, EMP_JOBS, STATUS, CoLogo, Check, useReveal, useGrow, PageHero, Mesh */
const { useState: useStateEmp } = React;

function PipeCell({ item, peak, i }) {
  const meta = STATUS[item.key];
  const h = useGrow(Math.round((item.n / peak) * 100), 300 + i * 70);
  const on = item.key === 'shortlisted';
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', height: 96, width: '100%', justifyContent: 'center' }}>
        <div style={{ width: '70%', maxWidth: 56, height: h + '%', minHeight: 6, borderRadius: '8px 8px 4px 4px',
          background: on ? 'linear-gradient(180deg,#F5B800,#FFD34D)' : 'linear-gradient(180deg,#4F6EFF,#1B3DE0)',
          boxShadow: on ? '0 6px 16px rgba(245,184,0,.4)' : '0 6px 16px rgba(27,61,224,.3)', transition: 'height 1s cubic-bezier(.22,.68,0,1)', position: 'relative' }}>
          <span style={{ position: 'absolute', top: -22, left: 0, right: 0, textAlign: 'center', fontSize: 15, fontWeight: 800, color: on ? '#B4790B' : C.royal }}>{item.n}</span>
        </div>
      </div>
      <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{item.label}</span>
    </div>
  );
}

function RankRow({ c, i, go }) {
  const top = i === 0;
  const meta = STATUS[c.stage];
  const sColor = c.s >= 90 ? '#15803D' : c.s >= 80 ? C.royal : C.muted;
  return (
    <div className="card-hover row-link reveal" data-d={(i % 4) + 1}
      style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '13px 16px', borderRadius: 15,
        background: top ? 'linear-gradient(120deg,#FFFBEB,#FEF3D0)' : '#fff', border: '1.5px solid ' + (top ? C.gold : 'rgba(27,61,224,.1)'), cursor: 'pointer' }}
      onClick={() => go('job', 'senior-product-designer-dialog')}>
      <div style={{ fontSize: 13, fontWeight: 800, color: top ? '#B4790B' : C.muted, width: 18, flexShrink: 0 }}>{i + 1}</div>
      <div className="av" style={{ width: 42, height: 42, fontSize: 15 }}>{c.i}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, color: C.ink }}>{c.n}</div>
        <div style={{ fontSize: 12.5, color: C.muted }}>{c.r}<span style={{ margin: '0 6px', opacity: .5 }}>·</span>{c.loc}</div>
        <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' }} className="hide-mob">
          {c.skills.map(s => <span key={s} className="badge badge-surface" style={{ fontSize: 10.5, padding: '2px 8px' }}>{s}</span>)}
        </div>
      </div>
      <span className={'badge ' + meta.cls} style={{ flexShrink: 0 }}>{meta.label}</span>
      <div style={{ textAlign: 'center', flexShrink: 0, width: 56 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: sColor, lineHeight: 1 }}>{c.s}<span style={{ fontSize: 11 }}>%</span></div>
        <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.05em', color: sColor, opacity: .75 }}>FIT</div>
      </div>
    </div>
  );
}

function EmployerPage({ go }) {
  useReveal('emp');
  const co = COMPANIES.dialog;
  const peak = Math.max(...PIPELINE.map(p => p.n));
  const totalApps = EMP_JOBS.reduce((s, j) => s + j.applicants, 0);
  const activeJobs = EMP_JOBS.filter(j => j.status === 'active').length;

  const stats = [
    { label: 'Active roles', value: activeJobs, color: '#15803D', bg: '#E7F8EF' },
    { label: 'Total applicants', value: totalApps, color: C.royal, bg: C.pale },
    { label: 'Shortlisted', value: 8, color: '#0369A1', bg: '#E2F3FE' },
    { label: 'Avg. time to shortlist', value: '3d', color: '#B4790B', bg: '#FEF3D6' },
  ];

  return (
    <div>
      {/* hero */}
      <div className="page-hero">
        <Mesh />
        <div className="app-wrap" style={{ position: 'relative', padding: '34px 28px 64px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 30, alignItems: 'start' }} className="grid-2">
            <div>
              <div className="tag reveal in" style={{ background: 'rgba(245,184,0,.13)', color: C.goldSoft, border: '1px solid rgba(245,184,0,.3)', marginBottom: 16 }}>
                <span style={{ color: C.goldSoft }}>✓</span> Verified employer
              </div>
              <h1 style={{ fontSize: 'clamp(2rem,3.8vw,3rem)', fontWeight: 800, letterSpacing: '-.03em', color: '#fff', lineHeight: 1.06, marginBottom: 12 }}>{co.name}</h1>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,.74)', maxWidth: '52ch', marginBottom: 24, lineHeight: 1.6 }}>
                Keep hiring momentum in one place — track active roles, review AI-ranked applicants, and move faster from first application to offer.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button className="btn btn-gold">+ Post a new role</button>
                <button className="btn btn-glass" onClick={() => go('job', 'senior-product-designer-dialog')}>View public job page</button>
              </div>
            </div>
            <div className="card reveal in" style={{ padding: 22, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.16)', backdropFilter: 'blur(10px)' }}>
              <div style={{ fontSize: 11, letterSpacing: '.08em', color: C.goldSoft, fontWeight: 700, marginBottom: 8 }}>CURRENT PLAN</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Monthly Hiring</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', marginBottom: 18 }}>Unlimited postings · Full ATS pipeline · AI ranking</div>
              <div style={{ display: 'grid', gap: 9 }}>
                {['Unlimited active postings', 'AI applicant ranking', 'Team workspace seats'].map(f => (
                  <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Check color={C.goldSoft} size={15} /><span style={{ fontSize: 13, color: 'rgba(255,255,255,.85)' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="app-wrap" style={{ padding: '0 28px' }}>
        {/* stat cards (overlap hero) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginTop: -36, marginBottom: 22 }} className="stats4">
          {stats.map((s, i) => (
            <div key={s.label} className="card reveal" data-d={i + 1} style={{ padding: 22 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: s.bg, marginBottom: 14 }} />
              <div style={{ fontSize: 30, fontWeight: 800, color: s.color, lineHeight: 1, letterSpacing: '-.02em' }}>{s.value}</div>
              <div style={{ fontSize: 12.5, color: C.muted, marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18, alignItems: 'start' }} className="grid-side">
          {/* ranked applicants */}
          <div className="card reveal" style={{ padding: 26 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 11.5, letterSpacing: '.07em', color: C.royal, fontWeight: 700, marginBottom: 5 }}>AI-RANKED APPLICANTS</div>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 600, color: C.ink }}>Senior Product Designer</h2>
              </div>
              <button className="btn btn-ghost btn-sm">View all 48</button>
            </div>
            <div style={{ display: 'grid', gap: 9 }}>
              {RANKED.map((c, i) => <RankRow key={c.n} c={c} i={i} go={go} />)}
            </div>
          </div>

          {/* right column */}
          <div style={{ display: 'grid', gap: 18 }}>
            {/* pipeline chart */}
            <div className="card reveal" data-d="1" style={{ padding: 24 }}>
              <div style={{ fontSize: 11.5, letterSpacing: '.07em', color: C.royal, fontWeight: 700, marginBottom: 5 }}>HIRING PIPELINE</div>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.35rem', fontWeight: 600, color: C.ink, marginBottom: 22 }}>Applicant flow</h2>
              <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
                {PIPELINE.map((p, i) => <PipeCell key={p.key} item={p} peak={peak} i={i} />)}
              </div>
            </div>
            {/* your roles */}
            <div className="card reveal" data-d="2" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.35rem', fontWeight: 600, color: C.ink }}>Your roles</h2>
                <button className="chip">Manage</button>
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {EMP_JOBS.map(j => {
                  const cls = j.status === 'active' ? 'badge-green' : j.status === 'paused' ? 'badge-amber' : 'badge-surface';
                  return (
                    <div key={j.title} className="row-link" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 13, border: '1.5px solid rgba(27,61,224,.08)', background: '#fff', cursor: 'pointer' }}
                      onClick={() => go('job', j.slug)}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: C.ink }}>{j.title}</div>
                        <div style={{ fontSize: 11.5, color: C.muted }}>{j.type} · {j.mode}</div>
                      </div>
                      <span className={'badge ' + cls} style={{ textTransform: 'capitalize' }}>{j.status}</span>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: C.soft, width: 64, textAlign: 'right' }}>{j.applicants} appl.</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
window.EmployerPage = EmployerPage;
