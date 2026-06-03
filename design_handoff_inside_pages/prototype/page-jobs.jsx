/* global React, C, JOBS, COMPANIES, PageHero, Check, useReveal, salary */
const { useState: useStateJobs } = React;

function CoLogo({ co, size = 48, radius = 12 }) {
  const c = COMPANIES[co];
  return (
    <div style={{ width: size, height: size, borderRadius: radius, flexShrink: 0, display: 'grid', placeItems: 'center',
      background: `linear-gradient(140deg, ${c.color}, ${c.color}cc)`, color: '#fff', fontWeight: 800, fontSize: size * .42,
      boxShadow: `0 6px 16px ${c.color}3a` }}>
      {c.initial}
    </div>
  );
}
window.CoLogo = CoLogo;

function JobRow({ job, go, i }) {
  const c = COMPANIES[job.co];
  const matchColor = job.match >= 85 ? '#15803D' : job.match >= 70 ? C.royal : C.muted;
  const matchBg = job.match >= 85 ? '#E7F8EF' : job.match >= 70 ? C.pale : '#EEF0F7';
  return (
    <a href={'#job/' + job.slug} onClick={(e) => { e.preventDefault(); go('job', job.slug); }}
      className={'card card-hover reveal'} data-d={(i % 4) + 1}
      style={{ display: 'block', padding: '20px 22px', borderColor: job.featured ? 'rgba(245,184,0,.45)' : undefined }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <CoLogo co={job.co} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap', marginBottom: 3 }}>
            <h3 style={{ fontWeight: 700, fontSize: 17, color: C.ink, letterSpacing: '-.01em' }}>{job.title}</h3>
            {job.featured && <span className="badge badge-gold">★ Featured</span>}
          </div>
          <div style={{ fontSize: 13.5, color: C.muted, marginBottom: 12 }}>
            {c.name}{c.verified && <span style={{ color: C.royal, marginLeft: 5 }}>✓</span>}
            <span style={{ margin: '0 7px', opacity: .5 }}>·</span>{job.loc}
          </div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="badge badge-royal">{job.type}</span>
            <span className="badge badge-surface">{job.mode}</span>
            <span className="badge badge-green">{salary(job)}</span>
            <span style={{ fontSize: 12, color: C.muted, marginLeft: 'auto' }} className="hide-mob">{job.posted}</span>
          </div>
        </div>
        <div style={{ textAlign: 'center', flexShrink: 0, paddingLeft: 8 }} className="hide-mob">
          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 16px', borderRadius: 14, background: matchBg }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: matchColor, lineHeight: 1 }}>{job.match}<span style={{ fontSize: 12 }}>%</span></span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', color: matchColor, opacity: .8 }}>MATCH</span>
          </div>
        </div>
      </div>
    </a>
  );
}

function JobsPage({ go }) {
  const [q, setQ] = useStateJobs('');
  const [type, setType] = useStateJobs('All');
  const [mode, setMode] = useStateJobs('All');
  const [sort, setSort] = useStateJobs('match');
  useReveal('jobs');

  let list = JOBS.filter(j => {
    if (q && !(j.title.toLowerCase().includes(q.toLowerCase()) || COMPANIES[j.co].name.toLowerCase().includes(q.toLowerCase()))) return false;
    if (type !== 'All' && j.type !== type) return false;
    if (mode !== 'All' && j.mode !== mode) return false;
    return true;
  });
  list = [...list].sort((a, b) => sort === 'match' ? b.match - a.match : (a.featured === b.featured ? 0 : a.featured ? -1 : 1));

  return (
    <div>
      <PageHero eyebrow="For people looking for work">
        <div style={{ maxWidth: 720 }}>
          <h1 style={{ fontSize: 'clamp(2rem,3.6vw,3.1rem)', fontWeight: 800, letterSpacing: '-.03em', color: '#fff', lineHeight: 1.08, marginBottom: 12 }}>
            Find work that <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 600, color: C.goldSoft }}>fits</span> you
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.72)', marginBottom: 26 }}>
            {JOBS.length} active roles · scored against your profile in real time.
          </p>
        </div>
        {/* search */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input className="search-field" style={{ flex: '1 1 300px' }} placeholder="Job title, skill, or company" value={q} onChange={e => setQ(e.target.value)} />
          <select className="search-field" style={{ flex: '0 1 170px' }} value={type} onChange={e => setType(e.target.value)}>
            {['All', 'Full time', 'Part time', 'Contract', 'Internship'].map(o => <option key={o}>{o}</option>)}
          </select>
          <select className="search-field" style={{ flex: '0 1 150px' }} value={mode} onChange={e => setMode(e.target.value)}>
            {['All', 'Onsite', 'Remote', 'Hybrid'].map(o => <option key={o}>{o}</option>)}
          </select>
          <button className="btn btn-gold" style={{ flex: '0 0 auto' }}>Search</button>
        </div>
      </PageHero>

      <div className="app-wrap" style={{ padding: '30px 28px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
          <p style={{ fontSize: 14, color: C.muted }}>
            Showing <strong style={{ color: C.ink }}>{list.length}</strong> of {JOBS.length} roles
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: C.muted }}>Sort by</span>
            {[['match', 'Best match'], ['featured', 'Featured']].map(([k, l]) => (
              <button key={k} className={'chip' + (sort === k ? ' on' : '')} onClick={() => setSort(k)}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 12 }}>
          {list.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center', color: C.muted }}>
              <p style={{ fontSize: 17, color: C.soft, marginBottom: 6 }}>No roles match your search</p>
              <p style={{ fontSize: 14 }}>Try adjusting your filters.</p>
            </div>
          ) : list.map((j, i) => <JobRow key={j.slug} job={j} go={go} i={i} />)}
        </div>
      </div>
    </div>
  );
}
window.JobsPage = JobsPage;
