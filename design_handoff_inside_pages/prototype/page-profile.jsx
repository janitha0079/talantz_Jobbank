/* global React, C, ME, ScoreRing, Check, useReveal, useGrow, PageHero */
function ProfilePage({ go }) {
  useReveal('profile');
  const strengthW = useGrow(ME.strength, 350);

  const wins = [
    { done: true, t: 'Profile photo & headline added' },
    { done: true, t: '3 roles of experience listed' },
    { done: true, t: '8 skills tagged' },
    { done: false, t: 'Add a research case study (+5%)' },
    { done: false, t: 'Add a portfolio link (+4%)' },
  ];

  return (
    <div>
      {/* hero with identity + strength */}
      <PageHero eyebrow="Your candidate profile" pad="34px 0 56px">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 30, alignItems: 'center' }} className="grid-2">
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div className="av" style={{ width: 84, height: 84, fontSize: 34, boxShadow: '0 12px 30px rgba(27,61,224,.5)' }}>{ME.initial}</div>
            <div>
              <h1 style={{ fontSize: 'clamp(1.8rem,3.4vw,2.6rem)', fontWeight: 800, letterSpacing: '-.03em', color: '#fff', lineHeight: 1.05 }}>{ME.name}</h1>
              <p style={{ fontSize: 16, color: C.goldSoft, fontWeight: 600, marginTop: 4 }}>{ME.headline}</p>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,.62)', marginTop: 6 }}>📍 {ME.loc}<span style={{ margin: '0 8px', opacity: .4 }}>·</span>{ME.exp} experience<span style={{ margin: '0 8px', opacity: .4 }}>·</span>{ME.email}</p>
            </div>
          </div>
          <ScoreRing score={ME.strength} size={120} label="PROFILE" />
        </div>
      </PageHero>

      <div className="app-narrow detail-grid" style={{ padding: '28px 28px 0', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 22, alignItems: 'start' }}>
        {/* MAIN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
          {/* about */}
          <div className="card reveal" style={{ padding: 26 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.35rem', fontWeight: 600, color: C.ink }}>About</h2>
              <button className="chip">Edit</button>
            </div>
            <p style={{ fontSize: 14.5, lineHeight: 1.75, color: C.soft }}>{ME.about}</p>
          </div>

          {/* skills */}
          <div className="card reveal" data-d="1" style={{ padding: 26 }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.35rem', fontWeight: 600, color: C.ink, marginBottom: 16 }}>Skills</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ME.skills.map(s => <span key={s} className="skill">{s}</span>)}
              <span className="skill muted" style={{ borderStyle: 'dashed' }}>+ Add skill</span>
            </div>
          </div>

          {/* experience */}
          <div className="card reveal" data-d="2" style={{ padding: 26 }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.35rem', fontWeight: 600, color: C.ink, marginBottom: 20 }}>Experience</h2>
            <div style={{ position: 'relative', paddingLeft: 26 }}>
              <div style={{ position: 'absolute', left: 5, top: 6, bottom: 6, width: 2, background: 'linear-gradient(180deg, rgba(27,61,224,.3), rgba(27,61,224,.05))' }} />
              <div style={{ display: 'grid', gap: 22 }}>
                {ME.experience.map((e, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: -26, top: 4, width: 12, height: 12, borderRadius: '50%', background: i === 0 ? C.gold : C.royal, border: '3px solid ' + C.surface, boxShadow: '0 0 0 2px ' + (i === 0 ? 'rgba(245,184,0,.3)' : 'rgba(27,61,224,.2)') }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 15.5, color: C.ink }}>{e.role}</div>
                      <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 600 }}>{e.period}</div>
                    </div>
                    <div style={{ fontSize: 13.5, color: C.royal, fontWeight: 600, marginBottom: 8 }}>{e.co}<span style={{ color: C.muted, fontWeight: 400 }}> · {e.loc}</span></div>
                    <div style={{ display: 'grid', gap: 5 }}>
                      {e.bullets.map(b => (
                        <div key={b} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                          <span style={{ marginTop: 1 }}><Check color={C.royal} size={14} /></span>
                          <span style={{ fontSize: 13.5, color: C.soft, lineHeight: 1.55 }}>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* education + certs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }} className="grid-2">
            <div className="card reveal" style={{ padding: 24 }}>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 600, color: C.ink, marginBottom: 14 }}>Education</h2>
              {ME.education.map(e => (
                <div key={e.degree}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{e.degree}</div>
                  <div style={{ fontSize: 13, color: C.royal, fontWeight: 600, margin: '3px 0' }}>{e.school}</div>
                  <div style={{ fontSize: 12.5, color: C.muted }}>{e.period}</div>
                </div>
              ))}
            </div>
            <div className="card reveal" data-d="1" style={{ padding: 24 }}>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 600, color: C.ink, marginBottom: 14 }}>Certifications</h2>
              <div style={{ display: 'grid', gap: 9 }}>
                {ME.certs.map(c => (
                  <div key={c} style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
                    <Check color={C.gold} size={16} />
                    <span style={{ fontSize: 13.5, color: C.soft }}>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 82 }}>
          <div className="card reveal" data-d="1" style={{ padding: 22, background: 'linear-gradient(160deg,#06103f,#13288f)', color: '#fff' }}>
            <div className="tag" style={{ background: 'rgba(245,184,0,.16)', color: C.goldSoft, marginBottom: 14 }}>AI profile coach</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,.85)', marginBottom: 18 }}>
              You’re <strong style={{ color: '#fff' }}>{ME.strength}%</strong> complete. Two quick wins unlock stronger matches.
            </div>
            <div className="bar-track" style={{ background: 'rgba(255,255,255,.16)', marginBottom: 18 }}>
              <div className="bar-fill gold" style={{ width: strengthW + '%' }} />
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {wins.map(w => (
                <div key={w.t} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                  {w.done
                    ? <Check color={C.goldSoft} size={16} />
                    : <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,.4)', flexShrink: 0, marginTop: 1 }} />}
                  <span style={{ fontSize: 13, color: w.done ? 'rgba(255,255,255,.6)' : '#fff', textDecoration: w.done ? 'line-through' : 'none', lineHeight: 1.5 }}>{w.t}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card reveal" data-d="2" style={{ padding: 22, textAlign: 'center' }}>
            <div style={{ fontSize: 13.5, color: C.soft, lineHeight: 1.55, marginBottom: 14 }}>See how you score against open roles.</div>
            <button className="btn btn-royal btn-sm" style={{ width: '100%' }} onClick={() => go('jobs')}>Browse matched jobs</button>
          </div>
        </div>
      </div>
    </div>
  );
}
window.ProfilePage = ProfilePage;
