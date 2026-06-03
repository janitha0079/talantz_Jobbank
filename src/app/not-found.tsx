import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', system-ui, sans-serif", background: '#F8F9FF' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 72, fontWeight: 800, color: '#1B3DE0', lineHeight: 1 }}>404</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: '#07080F', marginTop: 12, marginBottom: 8 }}>Page not found</div>
        <p style={{ color: '#6B7280', marginBottom: 28 }}>The page you are looking for does not exist.</p>
        <Link href="/" style={{ padding: '10px 24px', borderRadius: 9, background: 'linear-gradient(135deg,#1B3DE0,#4F6EFF)', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
          Back to home
        </Link>
      </div>
    </div>
  )
}
