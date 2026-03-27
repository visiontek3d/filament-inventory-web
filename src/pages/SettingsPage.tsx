import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';

const THRESHOLD_KEYS = [
  { key: 'threshold_Low',    label: 'Low',    default: '0' },
  { key: 'threshold_Medium', label: 'Medium', default: '1' },
  { key: 'threshold_High',   label: 'High',   default: '4' },
] as const;

export default function SettingsPage() {
  const navigate = useNavigate();
  const [thresholds, setThresholds] = useState<Record<string, string>>({
    threshold_Low: '0',
    threshold_Medium: '1',
    threshold_High: '4',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('filament_settings').select('key, value');
      if (data && data.length > 0) {
        const map: Record<string, string> = {};
        for (const row of data as { key: string; value: string }[]) map[row.key] = row.value;
        setThresholds(prev => ({ ...prev, ...map }));
      }
    })();
  }, []);

  async function saveThreshold(key: string, value: string) {
    const n = parseInt(value, 10);
    if (isNaN(n) || n < 0) return;
    await supabase.from('filament_settings')
      .upsert({ key, value: String(n) }, { onConflict: 'key' });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Layout title="Settings">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={() => navigate('/filaments')} className="btn btn-ghost" style={{ fontSize: 13 }}>
            ← Back
          </button>
          <h2 style={{ color: '#f0f0f0', fontSize: 18, fontWeight: 700, flex: 1, textAlign: 'center' }}>Settings</h2>
          <div style={{ width: 72 }} />
        </div>

        {saved && (
          <p style={{ color: '#4ade80', fontSize: 13, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 8, padding: '10px 14px' }}>
            Settings saved.
          </p>
        )}

        {/* Low-stock thresholds */}
        <div style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: 10, padding: '16px 20px' }}>
          <p style={{ color: '#f0f0f0', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Low-Stock Thresholds</p>
          <p style={{ color: '#555', fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
            A filament card highlights red when total rolls (in use + inventory) falls below the threshold for its priority level.
          </p>
          {THRESHOLD_KEYS.map(({ key, label, default: def }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ width: 72, color: '#ccc', fontSize: 14, fontWeight: 600 }}>{label}</span>
              <input
                className="input"
                type="number"
                min={0}
                style={{ width: 80 }}
                value={thresholds[key] ?? def}
                onChange={e => setThresholds(prev => ({ ...prev, [key]: e.target.value }))}
                onBlur={e => saveThreshold(key, e.target.value)}
              />
              <span style={{ color: '#444', fontSize: 13 }}>rolls or fewer</span>
            </div>
          ))}
        </div>

      </div>
    </Layout>
  );
}
