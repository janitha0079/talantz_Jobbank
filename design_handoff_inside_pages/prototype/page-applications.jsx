/* global React, C, APPLICATIONS, JOBS, COMPANIES, CoLogo, STATUS, useReveal, PageHero, jobBySlug */
const { useState: useStateApps } = React;

const STAGES = ['Applied', 'Screening', 'Shortlist', 'Interview', 'Offer'];

function StageTrack({ step, dead }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, flex: 1, minWidth: 0 }}>
      {STAGES.map((s, i) => {
        const idx = i + 1;
        const active = !dead && idx <= step;
        const isCurrent = !dead && idx === step;
        return (
          <React.Fragment key={s}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <div style={{ width: 11, height: 11, borderRadius: '50%',
                background: active ? (dead ? C.muted : C.royal) : '#E2E5F0',
                boxShadow: isCurrent ? '0 0 0 4px rgba(27,61,224,.18)' : 'none', transition: 'all .3s' }} />
              <span style={{ fontSize: 9.5, fontWeight: 600, color: active ? C.royal : C.muted, whiteSpace: 'nowrap' }}>{s}</span>
            </div>
            {i < STAGES.length - 1 && (
              <div style={{ flex: 1, height: 2, margin: '0 4px', marginBottom: 15, borderRadius: 2, background: (!dead && idx < step) ? C.royal : '#E2E5F0', transition: 'all .3s' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function AppCard({ app, go, i }) {
  const job = jobBySlug(app.job);
  const c = COMPANIES[job.co];
  const meta = STATUS[app.status];
  const dead = meta.step === 0;
  return (
    <div className="card reveal" data-d={(i % 4) + 1} style={{ padding: '18px 22px' }}>
      <div style={{ display: 'flex', gap: 15, alignItems: 'center', marginBottom: dead ? 0 : 16 }}>
        <CoLogo co={job.co} size={46} radius={11} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <button onClick={() => go('job', job.slug)} style={{ fontWeight: 700, fontSize: 15.5, color: C.ink, display: 'block', textAlign: 'left' }}>{job.title}</button>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{c.name}<span style={{ margin: '0 7px', opacity: .5 }}>·</span>{job.loc}<span style={{ margin: '0 7px', opacity: .5 }}>·</span>Applied {app.applied}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <span className={'badge ' + meta.cls}>{meta.label}</span>
          <div style={{ fontSize: 11.5, color: C.muted, marginTop: 5 }}>{app.match}% match</div>
        </div>
      </div>
      {!dead && <StageTrack step={meta.step} dead={dead} />}
    </div>
  );
}

function ApplicationsPage({ go }) {
  const [filter, setFilter] = useStateApps('active');
  useReveal('apps' + filter);

  const active = APPLICATIONS.filter(a => STATUS[a.status].step > 0);
  const closed = APPLICATIONS.filter(a => STATUS[a.status].step === 0);
  const counts = {
    interview: APPLICATIONS.filter(a => a.status === 'interview').length,
    shortlisted: APPLICATIONS.filter(a => a.status === 'shortlisted').length,
  };
  const show = filter === 'active' ? active : filter === 'closed' ? closed : APPLICATIONS;

  return (
    <div>
      <PageHero eyebrow="Application tracker" pad="34px 0 44px">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 18 }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.8rem,3.4vw,2.7rem)', fontWeight: 800, letterSpacing: '-.03em', color: '#fff', lineHeight: 1.05, marginBottom: 10 }}>
              Track every <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 600, color: C.goldSoft }}>application</span>
            </h1>
            <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,.72)' }}>{APPLICATIONS.length} applications · {active.length} still active</p>
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            {[['Interviews', counts.interview, C.goldSoft], ['Shortlists', counts.shortlisted, '#fff']].map(([l, n, col]) => (
              <div key={l} style={{ padding: '14px 22px', borderRadius: 16, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)', textAlign: 'center', minWidth: 96 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: col, lineHeight: 1 }}>{n}</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.6)', marginTop: 6 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </PageHero>

      <div className="app-narrow" style={{ padding: '26px 28px 0' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
          {[['active', 'Active (' + active.length + ')'], ['closed', 'Closed (' + closed.length + ')'], ['all', 'All']].map(([k, l]) => (
            <button key={k} className={'chip' + (filter === k ? ' on' : '')} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 12 }}>
          {show.map((a, i) => <AppCard key={a.job} app={a} go={go} i={i} />)}
        </div>
      </div>
    </div>
  );
}
window.ApplicationsPage = ApplicationsPage;
