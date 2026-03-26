import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import type { FilamentPriority } from '../types';

const PRIORITIES: FilamentPriority[] = ['None', 'Low', 'Medium', 'High'];

const PRIORITY_ACTIVE: Record<FilamentPriority, React.CSSProperties> = {
  None:   { background: 'rgba(170,170,170,0.15)', color: '#aaa',    borderColor: '#555' },
  Low:    { background: 'rgba(26,138,58,0.15)',   color: '#4ade80', borderColor: '#1a8a3a' },
  Medium: { background: 'rgba(230,168,23,0.15)',  color: '#fbbf24', borderColor: '#e6a817' },
  High:   { background: 'rgba(198,40,40,0.15)',   color: '#f87171', borderColor: '#c62828' },
};

const S = {
  label: { color: '#7A7A7A', fontSize: 12, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' as const, marginBottom: 6, display: 'block' },
};

export default function FilamentAddEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [manufacturer, setManufacturer] = useState('');
  const [type, setType] = useState('');
  const [color, setColor] = useState('');
  const [upc, setUpc] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [url, setUrl] = useState('');
  const [priority, setPriority] = useState<FilamentPriority>('None');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      const { data } = await supabase.from('filaments').select('*').eq('id', id).single();
      if (data) {
        setManufacturer(data.manufacturer ?? '');
        setType(data.type ?? '');
        setColor(data.color ?? '');
        setUpc(data.upc ?? '');
        setPhotoUrl(data.photo_url ?? '');
        setUrl(data.url ?? '');
        setPriority(data.priority ?? 'None');
      }
      setLoading(false);
    })();
  }, [id, isEdit]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        manufacturer: manufacturer.trim(),
        type: type.trim(),
        color: color.trim(),
        upc: upc.trim(),
        photo_url: photoUrl.trim() || null,
        url: url.trim() || null,
        priority,
      };

      if (isEdit) {
        const { error } = await supabase.from('filaments').update(payload).eq('id', id);
        if (error) throw error;
        navigate(`/filaments/${id}`);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase.from('filaments')
          .insert({ ...payload, user_id: user!.id })
          .select().single();
        if (error) throw error;
        navigate(`/filaments/${data.id}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSaving(false);
    }
  }

  if (loading) return (
    <Layout title={isEdit ? 'Edit Filament' : 'Add Filament'}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}><div className="spinner" /></div>
    </Layout>
  );

  return (
    <Layout title={isEdit ? 'Edit Filament' : 'Add Filament'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={() => navigate(isEdit ? `/filaments/${id}` : '/filaments')} className="btn btn-ghost" style={{ fontSize: 13 }}>
            ← Back
          </button>
          <h2 style={{ color: '#f0f0f0', fontSize: 18, fontWeight: 700, flex: 1, textAlign: 'center' }}>
            {isEdit ? 'Edit Filament' : 'Add Filament'}
          </h2>
          <div style={{ width: 72 }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <Field label="Manufacturer" required>
            <input className="input" value={manufacturer} onChange={e => setManufacturer(e.target.value)} placeholder="e.g. Bambu Lab" required />
          </Field>

          <Field label="Type" required>
            <input className="input" value={type} onChange={e => setType(e.target.value)} placeholder="e.g. PLA, ABS, PETG" required />
          </Field>

          <Field label="Color" required>
            <input className="input" value={color} onChange={e => setColor(e.target.value)} placeholder="e.g. Jade White" required />
          </Field>

          <Field label="UPC">
            <input className="input" value={upc} onChange={e => setUpc(e.target.value)} placeholder="Barcode / UPC" />
          </Field>

          <Field label="Photo URL">
            <input className="input" type="url" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} placeholder="https://…" />
          </Field>

          <Field label="Product URL">
            <input className="input" type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" />
          </Field>

          <Field label="Inventory Priority">
            <div style={{ display: 'flex', gap: 8 }}>
              {PRIORITIES.map(p => (
                <button key={p} type="button" onClick={() => setPriority(p)}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    borderRadius: 8,
                    border: '1px solid #2a2a2a',
                    background: '#161616',
                    color: '#555',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    ...(priority === p ? PRIORITY_ACTIVE[p] : {}),
                  }}>
                  {p}
                </button>
              ))}
            </div>
          </Field>

          {error && (
            <p style={{ color: '#f87171', fontSize: 13, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 14px' }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={saving} className="btn btn-primary" style={{ marginTop: 8, padding: '11px' }}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Filament'}
          </button>
        </form>
      </div>
    </Layout>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label style={S.label}>{label}{required && <span style={{ color: '#f87171' }}> *</span>}</label>
      {children}
    </div>
  );
}
