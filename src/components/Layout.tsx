import { useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface Props {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title }: Props) {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setEmail(session?.user?.email ?? null);
    });
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: '#000', borderBottom: '1px solid #1f1f1f', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title ?? 'Filament Inventory'}
          </span>
          {email && (
            <span style={{ color: '#444', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180, display: 'none' }}
              className="sm:block">
              {email}
            </span>
          )}
          <button
            onClick={() => supabase.auth.signOut()}
            style={{ fontSize: 12, color: '#888', border: '1px solid #2a2a2a', borderRadius: 6, padding: '6px 12px', background: 'transparent', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.target as HTMLElement).style.color = '#fff'; (e.target as HTMLElement).style.borderColor = '#3367d6'; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.color = '#888'; (e.target as HTMLElement).style.borderColor = '#2a2a2a'; }}
          >
            Sign Out
          </button>
        </div>
      </header>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ maxWidth: 800, width: '100%', margin: '0 auto', padding: '24px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
