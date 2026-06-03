/* global React, ReactDOM, AppNav, AppFooter, JobsPage, JobDetailPage, ProfilePage, ApplicationsPage, EmployerPage */
const { useState: useStateMain, useEffect: useEffectMain, useCallback: useCallbackMain } = React;

function parseHash() {
  const h = (window.location.hash || '#jobs').replace(/^#/, '');
  const [route, slug] = h.split('/');
  return { route: route || 'jobs', slug: slug || null };
}

function App() {
  const [{ route, slug }, setLoc] = useStateMain(parseHash());
  const [side, setSide] = useStateMain(parseHash().route === 'employer' ? 'employer' : 'seeker');

  useEffectMain(() => {
    const onHash = () => { const loc = parseHash(); setLoc(loc); setSide(loc.route === 'employer' ? 'employer' : 'seeker'); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = useCallbackMain((route, slug) => {
    const h = slug ? `#${route}/${slug}` : `#${route}`;
    if (('#' + (slug ? route + '/' + slug : route)) === window.location.hash) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    window.location.hash = h;
  }, []);

  let page;
  if (route === 'job') page = <JobDetailPage slug={slug} go={go} />;
  else if (route === 'profile') page = <ProfilePage go={go} />;
  else if (route === 'applications') page = <ApplicationsPage go={go} />;
  else if (route === 'employer') page = <EmployerPage go={go} />;
  else page = <JobsPage go={go} />;

  return (
    <div>
      <AppNav route={route} go={go} side={side} setSide={setSide} />
      <div key={route + (slug || '')}>{page}</div>
      <AppFooter />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
