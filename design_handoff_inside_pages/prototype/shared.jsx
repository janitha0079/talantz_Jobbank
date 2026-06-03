/* global React */
const { useState, useEffect, useRef, useCallback } = React;

/* ============================================================
   Palette
   ============================================================ */
const C = {
  royal: '#1B3DE0', deep: '#091875', electric: '#4F6EFF', dark: '#0F27A8',
  pale: '#EEF1FD', gold: '#F5B800', goldSoft: '#FFD34D',
  ink: '#07080F', soft: '#2E3345', muted: '#7580A0',
  surface: '#F6F7FE', card: '#FFFFFF', white: '#FFFFFF',
  space0: '#05091f', space1: '#0a1146', space2: '#122a9e',
};

/* ============================================================
   Scroll reveal
   ============================================================ */
function useReveal(dep) {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal:not(.in)');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [dep]);
}

/* animate a width from 0 → target after mount */
function useGrow(target, delay = 200) {
  const [w, setW] = useState(0);
  useEffect(() => { const id = setTimeout(() => setW(target), delay); return () => clearTimeout(id); }, [target, delay]);
  return w;
}

/* ============================================================
   Mesh background (dark bands)
   ============================================================ */
function Mesh({ soft }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', top: '-40%', left: '-6%', width: 460, height: 460, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,110,255,.5), transparent 64%)', filter: 'blur(30px)', animation: 'drift1 17s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: '-60%', right: '-4%', width: 520, height: 520, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(245,184,0,${soft ? .14 : .24}), transparent 62%)`, filter: 'blur(34px)', animation: 'drift2 21s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', inset: 0, opacity: .5,
        backgroundImage: 'linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)',
        backgroundSize: '52px 52px', maskImage: 'radial-gradient(circle at 60% 0%, #000 35%, transparent 80%)' }} />
    </div>
  );
}

/* ============================================================
   Logo
   ============================================================ */
function Logo({ onClick }) {
  return (
    <a href="#jobs" onClick={onClick} style={{ display: 'flex', alignItems: 'center' }}>
      <img src="talantz-logo.png" alt="Talantz" style={{ height: 30, width: 'auto', display: 'block' }} />
    </a>
  );
}

/* ============================================================
   App navigation — switches between seeker & employer
   ============================================================ */
const SEEKER_NAV = [['Find jobs', 'jobs'], ['Applications', 'applications'], ['Profile', 'profile']];
const EMPLOYER_NAV = [['Dashboard', 'employer'], ['Candidates', 'employer'], ['Company', 'employer']];

function AppNav({ route, go, side, setSide }) {
  const links = side === 'employer' ? [['Dashboard', 'employer']] : SEEKER_NAV;
  const me = side === 'employer'
    ? { i: 'D', n: 'Dialog Axiata', r: 'Verified employer' }
    : { i: 'K', n: 'Kavindi R.', r: 'Senior Product Designer' };
  return (
    <nav className="app-nav">
      <div className="app-wrap" style={{ height: 66, display: 'flex', alignItems: 'center', gap: 28 }}>
        <Logo onClick={(e) => { e.preventDefault(); go(side === 'employer' ? 'employer' : 'jobs'); }} />
        <div className="hide-mob" style={{ display: 'flex', alignItems: 'center', gap: 26, marginLeft: 8 }}>
          {links.map(([t, r]) => (
            <a key={t} href={'#' + r} onClick={(e) => { e.preventDefault(); go(r); }}
              className={'app-navlink' + (route === r || (r === 'jobs' && route === 'job') ? ' active' : '')}>{t}</a>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="seg hide-mob">
            <button className={side === 'seeker' ? 'on seeker' : ''} onClick={() => { setSide('seeker'); go('jobs'); }}>Candidate</button>
            <button className={side === 'employer' ? 'on employer' : ''} onClick={() => { setSide('employer'); go('employer'); }}>Employer</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'right', lineHeight: 1.25 }} className="hide-mob">
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{me.n}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)' }}>{me.r}</div>
            </div>
            <div className="av" style={{ width: 38, height: 38, fontSize: 15,
              background: side === 'employer' ? 'linear-gradient(135deg,#F5B800,#FFD34D)' : 'linear-gradient(135deg,#1B3DE0,#4F6EFF)',
              color: side === 'employer' ? C.deep : '#fff' }}>{me.i}</div>
          </div>
        </div>
      </div>
    </nav>
  );
}

/* ============================================================
   Footer
   ============================================================ */
function AppFooter() {
  return (
    <footer style={{ background: C.space0, padding: '26px 0', borderTop: '1px solid rgba(255,255,255,.07)', marginTop: 64 }}>
      <div className="app-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="talantz-mark.png" alt="Talantz" style={{ width: 26, height: 26, display: 'block' }} />
          <span style={{ color: 'rgba(255,255,255,.5)', fontSize: 13 }}>Talantz — AI-first hiring for Sri Lanka</span>
        </div>
        <a href="../Talantz Landing/Talantz Landing.html" className="footlink" style={{ color: 'rgba(255,255,255,.5)', fontSize: 13 }}>← Back to home</a>
      </div>
    </footer>
  );
}

/* ============================================================
   Page hero band (compact, dark)
   ============================================================ */
function PageHero({ eyebrow, children, soft, pad = '34px 0 40px' }) {
  return (
    <div className="page-hero">
      <Mesh soft={soft} />
      <div className="app-wrap" style={{ position: 'relative', padding: pad }}>
        {eyebrow && (
          <div className="tag reveal in" style={{ background: 'rgba(245,184,0,.13)', color: C.goldSoft, border: '1px solid rgba(245,184,0,.3)', marginBottom: 16 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.gold, animation: 'pulse 2s infinite' }} />
            {eyebrow}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/* curved divider that sits at the bottom of a dark band */
function Curve() {
  return (
    <div style={{ position: 'relative', height: 44, marginTop: -1, background: C.space0 }}>
      <svg viewBox="0 0 1440 44" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}>
        <path d="M0,44 L0,22 Q720,-20 1440,22 L1440,44 Z" fill={C.surface} />
      </svg>
    </div>
  );
}

/* small check icon */
function Check({ color = '#15803D', size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="8" fill={color} opacity=".15" />
      <path d="M5 8l2 2 4-4" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* circular score ring, animates on mount */
function ScoreRing({ score, size = 132, stroke = 11, label = 'AI MATCH', dark = true }) {
  const [v, setV] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    let raf; const t0 = performance.now(); const dur = 1300;
    const tick = (t) => { const p = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - p, 3); setV(Math.round(score * e)); if (p < 1) raf = requestAnimationFrame(tick); };
    const id = setTimeout(() => { raf = requestAnimationFrame(tick); }, 220);
    return () => { clearTimeout(id); cancelAnimationFrame(raf); };
  }, [score]);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - v / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={dark ? 'rgba(255,255,255,.14)' : 'rgba(27,61,224,.12)'} strokeWidth={stroke} />
        <defs><linearGradient id={'rg' + size} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={C.gold} /><stop offset="1" stopColor={C.goldSoft} /></linearGradient></defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={'url(#rg' + size + ')'} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset .15s linear', filter: 'drop-shadow(0 0 6px rgba(245,184,0,.5))' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: size * .3, fontWeight: 800, color: dark ? '#fff' : C.ink, lineHeight: 1, letterSpacing: '-.03em' }}>{v}<span style={{ fontSize: size * .14 }}>%</span></div>
          <div style={{ fontSize: 9.5, letterSpacing: '.12em', color: dark ? 'rgba(255,255,255,.55)' : C.muted, fontWeight: 700, marginTop: 3 }}>{label}</div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SAMPLE DATA — Sri Lankan companies / roles / people
   ============================================================ */
const COMPANIES = {
  dialog:   { name: 'Dialog Axiata', initial: 'D', industry: 'Telecommunications', verified: true,  hq: 'Colombo', size: '5,000+', color: '#0A3D91',
              about: 'Sri Lanka’s largest connectivity provider, building digital products for millions across mobile, broadband, and fintech.' },
  ninex:    { name: '99x', initial: '9', industry: 'Software Engineering', verified: true, hq: 'Colombo', size: '500–1,000', color: '#1B3DE0',
              about: 'Award-winning product engineering company crafting software for Scandinavian and global scale-ups.' },
  wso2:     { name: 'WSO2', initial: 'W', industry: 'Enterprise Software', verified: true, hq: 'Colombo', size: '1,000+', color: '#FF7300',
              about: 'Open-source technology leader for API management, integration, and identity — trusted by enterprises worldwide.' },
  sysco:    { name: 'Sysco LABS', initial: 'S', industry: 'Food-tech & Logistics', verified: true, hq: 'Colombo', size: '1,000+', color: '#0F9D58',
              about: 'The innovation hub for Sysco, the global leader in food distribution — building platforms that move billions in produce.' },
  combank:  { name: 'Commercial Bank', initial: 'C', industry: 'Banking & Finance', verified: true, hq: 'Colombo', size: '5,000+', color: '#0B5D3B',
              about: 'One of Sri Lanka’s most awarded private banks, investing heavily in digital banking and data.' },
  cinnamon: { name: 'Cinnamon Hotels', initial: 'C', industry: 'Hospitality', verified: false, hq: 'Colombo', size: '2,000+', color: '#A8742C',
              about: 'A premier collection of resorts and city hotels redefining Sri Lankan hospitality.' },
  ifs:      { name: 'IFS', initial: 'I', industry: 'Enterprise Software', verified: true, hq: 'Colombo', size: '1,000+', color: '#6633CC',
              about: 'Global enterprise software company for ERP, EAM, and service management with a major R&D centre in Colombo.' },
  mas:      { name: 'MAS Holdings', initial: 'M', industry: 'Apparel & Tech', verified: true, hq: 'Colombo', size: '5,000+', color: '#C2185B',
              about: 'South Asia’s largest apparel-tech conglomerate, blending manufacturing with digital innovation.' },
};

const JOBS = [
  { slug: 'senior-product-designer-dialog', title: 'Senior Product Designer', co: 'dialog', loc: 'Colombo', type: 'Full time', mode: 'Hybrid',
    salMin: 280, salMax: 360, exp: '5–8', edu: 'Bachelor’s', posted: '2d ago', closes: '18 Jun', featured: true, applicants: 48, match: 92,
    skills: ['Figma', 'Design Systems', 'UX Research', 'Prototyping'], pref: ['Framer', 'Motion design'],
    summary: 'You lead design systems work and consistently ship strong product flows — a near-perfect fit for this role.',
    strengths: ['8+ years in product design, well above the 5-year minimum', 'Deep design-systems expertise matches the core requirement', 'Strong Figma and prototyping signal across your portfolio'],
    gaps: ['Add one quantitative research case study to reach 96%'],
    breakdown: { Skills: 95, Experience: 92, 'Title fit': 98, Location: 100, Education: 88, Profile: 84 },
    desc: 'We are looking for a Senior Product Designer to own the end-to-end experience of our consumer fintech app. You will shape our design system, mentor two designers, and partner closely with product and engineering.',
    resp: ['Own the design system and component library across web and mobile', 'Lead discovery and usability research for new features', 'Mentor junior designers and raise the craft bar', 'Partner with PMs to define product direction'],
    reqs: ['5+ years designing digital products', 'Mastery of Figma and modern prototyping tools', 'Proven track record shipping consumer apps at scale', 'Experience building or scaling a design system'] },
  { slug: 'frontend-engineer-99x', title: 'Frontend Engineer (React)', co: 'ninex', loc: 'Colombo', type: 'Full time', mode: 'Remote',
    salMin: 240, salMax: 320, exp: '3–6', edu: 'Bachelor’s', posted: '5h ago', closes: '24 Jun', featured: true, applicants: 31, match: 88,
    skills: ['React', 'TypeScript', 'CSS', 'Testing'], pref: ['Next.js', 'GraphQL'],
    summary: 'Your frontend depth maps strongly to this role; a little more TypeScript signal would push you higher.',
    strengths: ['Strong React and component architecture experience', 'Comfortable with modern build tooling and testing'],
    gaps: ['Limited TypeScript projects shown', 'No GraphQL experience listed'],
    breakdown: { Skills: 90, Experience: 86, 'Title fit': 84, Location: 100, Education: 86, Profile: 84 },
    desc: 'Join a product team building software for Scandinavian scale-ups. You will craft delightful, accessible interfaces and help define our frontend standards.',
    resp: ['Build and maintain React + TypeScript applications', 'Collaborate with designers to deliver pixel-accurate UIs', 'Write tests and contribute to our component library'],
    reqs: ['3+ years building production React apps', 'Solid TypeScript and modern CSS', 'Care for accessibility and performance'] },
  { slug: 'ux-researcher-sysco', title: 'UX Researcher', co: 'sysco', loc: 'Colombo', type: 'Full time', mode: 'Hybrid',
    salMin: 220, salMax: 300, exp: '3–5', edu: 'Bachelor’s', posted: '1d ago', closes: '20 Jun', featured: false, applicants: 22, match: 84,
    skills: ['User Research', 'Interviews', 'Usability Testing', 'Synthesis'], pref: ['Quant methods', 'SQL'],
    summary: 'Good research foundation; quantitative methods would strengthen the match.',
    strengths: ['Strong qualitative research and synthesis skills', 'Experience running end-to-end discovery'],
    gaps: ['Quantitative / survey analysis not evidenced'],
    breakdown: { Skills: 86, Experience: 84, 'Title fit': 82, Location: 100, Education: 80, Profile: 84 },
    desc: 'Help our logistics platform teams understand the people who move food across the world. You will plan and run mixed-methods studies that shape the roadmap.',
    resp: ['Plan and run interviews, usability tests, and surveys', 'Synthesize findings into clear, actionable insight', 'Partner with designers and PMs across squads'],
    reqs: ['3+ years in UX or product research', 'Strong qualitative toolkit', 'Excellent storytelling and synthesis'] },
  { slug: 'backend-engineer-wso2', title: 'Backend Engineer (Java)', co: 'wso2', loc: 'Colombo', type: 'Full time', mode: 'Hybrid',
    salMin: 260, salMax: 340, exp: '3–6', edu: 'Bachelor’s', posted: '3d ago', closes: '28 Jun', featured: false, applicants: 40, match: 71,
    skills: ['Java', 'Microservices', 'REST APIs', 'SQL'], pref: ['Ballerina', 'Kubernetes'],
    summary: 'Some overlap with your skills, but this role leans backend-heavy.',
    strengths: ['Good systems thinking from product work'],
    gaps: ['Limited backend / Java experience', 'No microservices projects listed'],
    breakdown: { Skills: 62, Experience: 78, 'Title fit': 58, Location: 100, Education: 86, Profile: 84 },
    desc: 'Build the open-source integration and identity platforms used by enterprises worldwide.',
    resp: ['Design and build scalable backend services', 'Contribute to open-source product code', 'Collaborate with global engineering teams'],
    reqs: ['3+ years in Java backend development', 'Strong grasp of APIs and microservices', 'CS fundamentals'] },
  { slug: 'data-analyst-combank', title: 'Data Analyst', co: 'combank', loc: 'Colombo', type: 'Full time', mode: 'Onsite',
    salMin: 180, salMax: 240, exp: '2–4', edu: 'Bachelor’s', posted: '4d ago', closes: '30 Jun', featured: false, applicants: 56, match: 64,
    skills: ['SQL', 'Power BI', 'Excel', 'Statistics'], pref: ['Python', 'Tableau'],
    summary: 'This role is outside your core design focus.',
    strengths: ['Comfort working with product metrics'],
    gaps: ['SQL and BI tooling not evidenced', 'Different career track'],
    breakdown: { Skills: 48, Experience: 70, 'Title fit': 44, Location: 100, Education: 84, Profile: 84 },
    desc: 'Turn banking data into decisions. Build dashboards and analyses that guide digital banking strategy.',
    resp: ['Build dashboards and reports', 'Analyse customer and product data', 'Support strategy with insight'],
    reqs: ['2+ years in analytics', 'Strong SQL and BI tools', 'Statistical literacy'] },
  { slug: 'product-manager-mas', title: 'Product Manager', co: 'mas', loc: 'Colombo', type: 'Full time', mode: 'Hybrid',
    salMin: 300, salMax: 400, exp: '5–8', edu: 'Bachelor’s', posted: '6d ago', closes: '02 Jul', featured: false, applicants: 38, match: 79,
    skills: ['Product Strategy', 'Roadmapping', 'Discovery', 'Stakeholders'], pref: ['Apparel-tech', 'Analytics'],
    summary: 'Your design-led product sense transfers well to this PM role.',
    strengths: ['Strong product discovery and stakeholder skills', 'Design background is an asset for PM craft'],
    gaps: ['Less explicit ownership of roadmap / metrics'],
    breakdown: { Skills: 80, Experience: 82, 'Title fit': 74, Location: 100, Education: 84, Profile: 84 },
    desc: 'Drive digital products that connect manufacturing with the future of apparel-tech.',
    resp: ['Own product strategy and roadmap', 'Run discovery and define requirements', 'Align engineering, design, and business'],
    reqs: ['5+ years in product management', 'Track record shipping digital products', 'Strong analytical and communication skills'] },
];

/* candidate profile */
const ME = {
  name: 'Kavindi Rajapaksa', initial: 'K', headline: 'Senior Product Designer',
  loc: 'Colombo, Sri Lanka', exp: '8 years', strength: 91, email: 'kavindi.r@email.lk',
  about: 'Product designer with 8 years shaping consumer and fintech experiences across Sri Lanka and the region. I build and scale design systems, lead discovery, and mentor growing design teams.',
  skills: ['Figma', 'Design Systems', 'UX Research', 'Prototyping', 'Interaction Design', 'Accessibility', 'Design Ops', 'Workshop Facilitation'],
  experience: [
    { role: 'Senior Product Designer', co: 'Dialog Axiata', period: '2021 — Present', loc: 'Colombo', bullets: ['Built the design system powering 6 consumer products', 'Led discovery for a fintech app reaching 1.2M users'] },
    { role: 'Product Designer', co: 'Sysco LABS', period: '2018 — 2021', loc: 'Colombo', bullets: ['Designed logistics tooling used across 12 markets', 'Introduced usability testing as a team practice'] },
    { role: 'UI/UX Designer', co: '99x', period: '2016 — 2018', loc: 'Colombo', bullets: ['Shipped interfaces for Scandinavian scale-up clients'] },
  ],
  education: [{ degree: 'BSc in Design & Multimedia', school: 'University of Moratuwa', period: '2012 — 2016' }],
  certs: ['NN/g UX Certification', 'Google UX Design Certificate'],
};

/* seeker applications */
const APPLICATIONS = [
  { job: 'senior-product-designer-dialog', status: 'shortlisted', applied: '12 May', match: 92 },
  { job: 'ux-researcher-sysco',           status: 'interview',   applied: '08 May', match: 84 },
  { job: 'product-manager-mas',           status: 'screening',   applied: '14 May', match: 79 },
  { job: 'frontend-engineer-99x',         status: 'applied',     applied: '16 May', match: 88 },
  { job: 'backend-engineer-wso2',         status: 'rejected',    applied: '02 May', match: 71 },
  { job: 'data-analyst-combank',          status: 'withdrawn',   applied: '28 Apr', match: 64 },
];

const STATUS = {
  applied:     { label: 'Applied',     cls: 'badge-royal',  step: 1 },
  screening:   { label: 'Screening',   cls: 'badge-violet', step: 2 },
  shortlisted: { label: 'Shortlisted', cls: 'badge-sky',    step: 3 },
  interview:   { label: 'Interview',   cls: 'badge-cyan',   step: 4 },
  assessment:  { label: 'Assessment',  cls: 'badge-violet', step: 4 },
  offer:       { label: 'Offer',       cls: 'badge-green',  step: 5 },
  hired:       { label: 'Hired',       cls: 'badge-green',  step: 6 },
  rejected:    { label: 'Not selected',cls: 'badge-coral',  step: 0 },
  withdrawn:   { label: 'Withdrawn',   cls: 'badge-surface',step: 0 },
};

/* employer: ranked candidates for the Sr Product Designer role */
const RANKED = [
  { i: 'A', n: 'Amara Silva',        r: 'Sr. Product Designer · 7y',  s: 96, loc: 'Colombo',  stage: 'shortlisted', skills: ['Figma', 'Design Systems', 'Research'] },
  { i: 'K', n: 'Kavindi Rajapaksa',  r: 'Senior Product Designer · 8y', s: 92, loc: 'Colombo', stage: 'shortlisted', skills: ['Figma', 'Design Systems', 'Prototyping'] },
  { i: 'N', n: 'Nuwan Jayasuriya',   r: 'Product Designer · 5y',      s: 88, loc: 'Kandy',    stage: 'interview',   skills: ['Figma', 'UX Research'] },
  { i: 'R', n: 'Rashmi Fernando',    r: 'UI/UX Designer · 4y',        s: 83, loc: 'Colombo',  stage: 'screening',   skills: ['Figma', 'Prototyping'] },
  { i: 'D', n: 'Dilini Perera',      r: 'Product Designer · 4y',      s: 79, loc: 'Galle',     stage: 'applied',     skills: ['Sketch', 'Research'] },
  { i: 'T', n: 'Tharindu Wickrama',  r: 'Visual Designer · 6y',       s: 72, loc: 'Colombo',  stage: 'applied',     skills: ['Figma', 'Branding'] },
];

const PIPELINE = [
  { key: 'applied', label: 'Applied', n: 48 },
  { key: 'screening', label: 'Screening', n: 19 },
  { key: 'shortlisted', label: 'Shortlist', n: 8 },
  { key: 'interview', label: 'Interview', n: 4 },
  { key: 'offer', label: 'Offer', n: 1 },
  { key: 'hired', label: 'Hired', n: 0 },
];

const EMP_JOBS = [
  { title: 'Senior Product Designer', type: 'Full time', mode: 'Hybrid', loc: 'Colombo', status: 'active', applicants: 48, slug: 'senior-product-designer-dialog' },
  { title: 'Flutter Engineer', type: 'Full time', mode: 'Remote', loc: 'Colombo', status: 'active', applicants: 33, slug: 'flutter' },
  { title: 'Brand Marketing Manager', type: 'Full time', mode: 'Onsite', loc: 'Colombo', status: 'active', applicants: 27, slug: 'brand' },
  { title: 'QA Automation Engineer', type: 'Contract', mode: 'Hybrid', loc: 'Colombo', status: 'paused', applicants: 14, slug: 'qa' },
  { title: 'Data Engineer', type: 'Full time', mode: 'Hybrid', loc: 'Colombo', status: 'draft', applicants: 0, slug: 'data-eng' },
];

function jobBySlug(slug) { return JOBS.find(j => j.slug === slug) || JOBS[0]; }
function salary(j) { return 'LKR ' + j.salMin + 'k–' + j.salMax + 'k'; }

Object.assign(window, {
  C, useReveal, useGrow, Mesh, Logo, AppNav, AppFooter, PageHero, Curve, Check, ScoreRing,
  COMPANIES, JOBS, ME, APPLICATIONS, STATUS, RANKED, PIPELINE, EMP_JOBS, jobBySlug, salary,
});
