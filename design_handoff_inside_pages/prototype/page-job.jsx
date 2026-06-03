/* global React, C, COMPANIES, CoLogo, ScoreRing, Check, useReveal, useGrow, jobBySlug, salary */
const { useState: useStateJob } = React;

function BreakdownBar({ label, value, delay }) {
  const w = useGrow(value, 300 + delay);
  const color = value >= 80 ? '#15803D' : value >= 60 ? C.royal : '#B4790B';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
        <span style={{ fontSize: 13, color: C.soft, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color }}>{value}%</span>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: w + '%', background: `linear-gradient(90deg, ${color}, ${color}aa)` }} />
      </div>
    </div>
  );
}

function JobDetailPage({ slug, go }) {
  const job = jobBySlug(slug);
  const c = COMPANIES[job.co];
  const [panel, setPanel] = useStateJob(false);
  const [applied, setApplied] = useStateJob(false);
  const [cover, setCover] = useStateJob('');
  useReveal(slug);

  return (
    <div>
      {/* breadcrumb band */}
      <div className="page-hero">
        <div className="app-wrap" style={{ position: 'relative', padding: '18px 28px' }}>
          <a href="#jobs" onClick={(e) => { e.preventDefault(); go('jobs'); }} style={{ fontSize: 13.5, color: 'rgba(255,255,255,.7)', fontWeight: 500 }}>← Back to jobs</a>
        </div>
      </div>

      <div className="app-wrap detail-grid" style={{ padding: '26px 28px 0', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 26, alignItems: 'start' }}>
        {/* MAIN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
          {/* header */}
          <div className="card reveal" style={{ padding: 28 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 18 }}>
              <CoLogo co={job.co} size={60} radius={15} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap', marginBottom: 5 }}>
                  <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 600, color: C.ink, letterSpacing: '-.01em' }}>{job.title}</h1>
                  {job.featured && <span className="badge badge-gold">★ Featured</span>}
                </div>
                <p style={{ fontSize: 14.5, color: C.muted }}>
                  <button onClick={() => go('jobs')} style={{ color: C.royal, fontWeight: 700 }}>{c.name}</button>
                  {c.verified && <span style={{ color: C.royal, marginLeft: 5 }}>✓</span>}
                  <span style={{ margin: '0 7px', opacity: .5 }}>·</span>{job.loc}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 22 }}>
              <span className="badge badge-royal">{job.type}</span>
              <span className="badge badge-surface">{job.mode}</span>
              <span className="badge badge-green">{salary(job)}</span>
              <span className="badge badge-amber">Closes {job.closes}</span>
            </div>
            {applied ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '13px 24px', borderRadius: 12, background: '#E7F8EF', color: '#15803D', fontWeight: 700, fontSize: 15 }}>
                <Check color="#15803D" /> Application submitted
              </div>
            ) : (
              <button className="btn btn-royal" onClick={() => setPanel(!panel)}>Apply now</button>
            )}
            {panel && !applied && (
              <div className="swap-in" style={{ marginTop: 20, padding: 20, background: C.pale, borderRadius: 16, border: '1.5px solid rgba(27,61,224,.14)' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 12 }}>Apply for {job.title}</div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.soft, marginBottom: 7 }}>Cover note (optional)</label>
                <textarea className="field" rows={4} value={cover} onChange={e => setCover(e.target.value)} placeholder="Tell them why you’re a great fit…" style={{ resize: 'vertical', marginBottom: 14, background: '#fff' }} />
                <div style={{ display: 'flex', gap: 9 }}>
                  <button className="btn btn-royal btn-sm" onClick={() => { setApplied(true); setPanel(false); }}>Submit application</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setPanel(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* AI MATCH — the hero of this page */}
          <div className="card reveal" data-d="1" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ position: 'relative', background: 'radial-gradient(120% 130% at 85% 0%, #15309f, #06103f)', color: '#fff', padding: '26px 28px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', position: 'relative' }}>
                <ScoreRing score={job.match} />
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div className="tag" style={{ background: 'rgba(245,184,0,.14)', color: C.goldSoft, border: '1px solid rgba(245,184,0,.3)', marginBottom: 12 }}>Your AI match</div>
                  <p style={{ fontSize: 16.5, lineHeight: 1.55, color: 'rgba(255,255,255,.9)', maxWidth: '52ch' }}>{job.summary}</p>
                </div>
              </div>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '16px 32px', marginBottom: 26 }}>
                {Object.entries(job.breakdown).map(([k, v], i) => <BreakdownBar key={k} label={k} value={v} delay={i * 90} />)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }} className="grid-2">
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#15803D', letterSpacing: '.06em', marginBottom: 11 }}>STRENGTHS</div>
                  <div style={{ display: 'grid', gap: 9 }}>
                    {job.strengths.map(s => (
                      <div key={s} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                        <span style={{ marginTop: 1 }}><Check color="#15803D" size={15} /></span>
                        <span style={{ fontSize: 13.5, color: C.soft, lineHeight: 1.5 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#B4790B', letterSpacing: '.06em', marginBottom: 11 }}>TO IMPROVE</div>
                  <div style={{ display: 'grid', gap: 9 }}>
                    {job.gaps.map(s => (
                      <div key={s} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                        <span style={{ width: 15, height: 15, borderRadius: '50%', background: 'rgba(245,184,0,.2)', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1, color: '#B4790B', fontWeight: 800, fontSize: 11 }}>!</span>
                        <span style={{ fontSize: 13.5, color: C.soft, lineHeight: 1.5 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* about */}
          <div className="card reveal" data-d="2" style={{ padding: 28 }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', fontWeight: 600, color: C.ink, marginBottom: 14 }}>About this role</h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.75, color: C.soft }}>{job.desc}</p>
          </div>

          {/* responsibilities + requirements */}
          {[['What you’ll do', job.resp], ['What we’re looking for', job.reqs]].map(([title, items]) => (
            <div key={title} className="card reveal" style={{ padding: 28 }}>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', fontWeight: 600, color: C.ink, marginBottom: 16 }}>{title}</h2>
              <div style={{ display: 'grid', gap: 11 }}>
                {items.map(r => (
                  <div key={r} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                    <span style={{ marginTop: 2 }}><Check color={C.royal} size={16} /></span>
                    <span style={{ fontSize: 14.5, color: C.soft, lineHeight: 1.6 }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* skills */}
          <div className="card reveal" style={{ padding: 28 }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', fontWeight: 600, color: C.ink, marginBottom: 16 }}>Skills</h2>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, letterSpacing: '.06em', marginBottom: 9 }}>REQUIRED</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
              {job.skills.map(s => <span key={s} className="skill">{s}</span>)}
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, letterSpacing: '.06em', marginBottom: 9 }}>NICE TO HAVE</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {job.pref.map(s => <span key={s} className="skill muted">{s}</span>)}
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 82 }}>
          <div className="card reveal" data-d="1" style={{ padding: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 14, letterSpacing: '-.01em' }}>About the company</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
              <CoLogo co={job.co} size={44} radius={11} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14.5, color: C.ink }}>{c.name}{c.verified && <span style={{ color: C.royal, marginLeft: 4 }}>✓</span>}</div>
                <div style={{ fontSize: 12.5, color: C.muted }}>{c.industry}</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: C.soft, lineHeight: 1.65, marginBottom: 14 }}>{c.about}</p>
            <div style={{ display: 'flex', gap: 16, fontSize: 12.5, color: C.muted }}>
              <span>📍 {c.hq}</span><span>👥 {c.size}</span>
            </div>
          </div>
          <div className="card reveal" data-d="2" style={{ padding: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 14 }}>Job details</div>
            <div style={{ display: 'grid', gap: 12 }}>
              {[['Type', job.type], ['Work mode', job.mode], ['Location', job.loc], ['Experience', job.exp + ' yrs'], ['Education', job.edu], ['Salary', salary(job)], ['Applicants', job.applicants], ['Posted', job.posted]].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: C.muted }}>{k}</span>
                  <span style={{ color: C.soft, fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card reveal" data-d="3" style={{ padding: 22, background: 'linear-gradient(160deg,#fff,#f4f7ff)', textAlign: 'center' }}>
            <div style={{ fontSize: 13.5, color: C.soft, marginBottom: 12, lineHeight: 1.55 }}>Ready to apply? Your profile is <strong style={{ color: C.royal }}>91% complete</strong>.</div>
            <button className="btn btn-gold btn-sm" style={{ width: '100%' }} onClick={() => go('profile')}>Polish my profile</button>
          </div>
        </div>
      </div>
    </div>
  );
}
window.JobDetailPage = JobDetailPage;
