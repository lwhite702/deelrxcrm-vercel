// Simple inline brand mark to avoid cross-package imports from the DeelrzCRM folder
/** Renders a styled logo for DeelRx CRM. */
function TextLogo() {
  return (
    <div style={{ fontWeight: 700, color: '#111827', fontSize: 20 }}>
      DeelRx CRM
    </div>
  );
}

/**
 * Renders the main application component for DeelRx CRM.
 */
export default function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg,#f5f7fb,#eef2ff)' }}>
      <div style={{ maxWidth: 720, padding: '3rem', textAlign: 'center', background: '#fff', borderRadius: 12, boxShadow: '0 6px 30px rgba(16,24,40,0.06)' }}>
        <div style={{ marginBottom: 24 }}>
          <TextLogo />
        </div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: 8 }}>DeelRx CRM — Beta</h1>
        <p style={{ color: '#6b7280', marginBottom: 20 }}>Private beta. Access by invitation only.</p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <a href="/api/login" style={{ padding: '0.75rem 1.5rem', background: '#4338ca', color: '#fff', borderRadius: 8, textDecoration: 'none' }}>Log in</a>
          <a href="/" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }} style={{ padding: '0.75rem 1.5rem', border: '1px solid #d1d5db', borderRadius: 8, textDecoration: 'none', color: '#374151' }}>Learn more</a>
        </div>

        <p style={{ marginTop: 20, fontSize: 13, color: '#9ca3af' }}>If you reached this page in error, contact <a href="mailto:support@deelzrxcrm.com">support@deelzrxcrm.com</a></p>
      </div>
    </div>
  );
}
