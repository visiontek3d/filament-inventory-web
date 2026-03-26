import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import type { Filament, Roll, FilamentPriority } from '../types';

const PRIORITY_LABEL: Record<FilamentPriority, string> = { None: 'None', Low: 'Low', Medium: 'Medium', High: 'High' };
const PRIORITY_COLOR: Record<FilamentPriority, string> = { None: '#555', Low: '#4ade80', Medium: '#fbbf24', High: '#f87171' };

const S = {
  card: { background: '#1a1a1a', border: '1px solid #222', borderRadius: 10, padding: '16px 20px' } as React.CSSProperties,
  sectionLabel: { fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#555', marginBottom: 12 },
};

export default function FilamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [filament, setFilament] = useState<Filament | null>(null);
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const [{ data: f }, { data: r }] = await Promise.all([
        supabase.from('filaments').select('*').eq('id', id).single(),
        supabase.from('rolls').select('*').eq('filament_id', id)
          .order('archived').order('is_checked_out', { ascending: false }).order('created_at'),
      ]);
      if (f) setFilament(f as Filament);
      if (r) setRolls(r as Roll[]);
      setLoading(false);
    })();
  }, [id]);

  const activeRolls  = rolls.filter(r => r.archived === 0);
  const archivedRolls = rolls.filter(r => r.archived === 1);
  const inUse        = activeRolls.filter(r => r.is_checked_out === 1);
  const inInventory  = activeRolls.filter(r => r.is_checked_out === 0);

  async function addRoll() {
    if (!id) return;
    setSaving(true);
    const { data } = await supabase.from('rolls')
      .insert({ filament_id: parseInt(id), is_checked_out: 0, archived: 0 })
      .select().single();
    if (data) setRolls(prev => [...prev, data as Roll]);
    setSaving(false);
  }

  async function markInUse(rollId: number) {
    setSaving(true);
    await supabase.from('rolls').update({ is_checked_out: 1 }).eq('id', rollId);
    setRolls(prev => prev.map(r => r.id === rollId ? { ...r, is_checked_out: 1 } : r));
    setSaving(false);
  }

  async function markEmpty(rollId: number) {
    if (!confirm('Mark this spool as empty and archive it?')) return;
    setSaving(true);
    await supabase.from('rolls').update({ archived: 1, is_checked_out: 0 }).eq('id', rollId);
    setRolls(prev => prev.map(r => r.id === rollId ? { ...r, archived: 1, is_checked_out: 0 } : r));
    setSaving(false);
  }

  async function deleteRoll(rollId: number) {
    if (!confirm('Delete this roll permanently?')) return;
    await supabase.from('rolls').delete().eq('id', rollId);
    setRolls(prev => prev.filter(r => r.id !== rollId));
  }

  async function handleDelete() {
    if (!filament) return;
    if (!confirm(`Delete "${filament.manufacturer} ${filament.type} – ${filament.color}"?\nAll ${rolls.length} associated rolls will also be deleted.`)) return;
    await supabase.from('filaments').delete().eq('id', filament.id);
    navigate('/filaments');
  }

  if (loading) return (
    <Layout title="Filament">
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}><div className="spinner" /></div>
    </Layout>
  );

  if (!filament) return (
    <Layout title="Filament">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '64px 0' }}>
        <p style={{ color: '#555', fontSize: 14 }}>Filament not found.</p>
        <button onClick={() => navigate('/filaments')} className="btn btn-ghost">Back to list</button>
      </div>
    </Layout>
  );

  return (
    <Layout title={`${filament.manufacturer} ${filament.type}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => navigate('/filaments')} className="btn btn-ghost" style={{ fontSize: 13 }}>
            ← Back
          </button>
          <div style={{ flex: 1 }} />
          <button onClick={() => navigate(`/filaments/${id}/edit`)} className="btn btn-ghost" style={{ fontSize: 13 }}>
            Edit
          </button>
        </div>

        {/* Photo */}
        {filament.photo_url && (
          <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #222' }}>
            <img src={filament.photo_url} alt={filament.manufacturer} style={{ width: '100%', objectFit: 'contain', maxHeight: 260, display: 'block', background: '#111' }} />
          </div>
        )}

        {/* Info card */}
        <div style={S.card}>
          <p style={{ color: '#f0f0f0', fontWeight: 700, fontSize: 20, marginBottom: 4 }}>
            {filament.manufacturer} – {filament.type}
          </p>
          <p style={{ color: '#888', fontSize: 15, marginBottom: 12 }}>{filament.color}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {filament.upc && <InfoRow label="UPC" value={filament.upc} />}
            {filament.url && <InfoRow label="URL" value={<a href={filament.url} target="_blank" rel="noreferrer" style={{ color: '#3367d6' }}>Link</a>} />}
            <InfoRow label="Priority" value={
              <span style={{ color: PRIORITY_COLOR[filament.priority], fontWeight: 600 }}>
                {PRIORITY_LABEL[filament.priority]}
              </span>
            } />
          </div>
        </div>

        {/* Rolls: In Use */}
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <span style={S.sectionLabel}>In Use ({inUse.length})</span>
            <div style={{ flex: 1 }} />
            <button onClick={addRoll} disabled={saving} className="btn btn-primary" style={{ fontSize: 12, padding: '6px 12px' }}>
              + Add Roll
            </button>
          </div>
          {inUse.length === 0 ? (
            <p style={{ color: '#444', fontSize: 13 }}>No rolls in use.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {inUse.map((r, i) => (
                <RollRow key={r.id} label={`In Use #${i + 1}`} status="in_use"
                  onMarkEmpty={() => markEmpty(r.id)}
                  onDelete={() => deleteRoll(r.id)}
                  saving={saving} />
              ))}
            </div>
          )}
        </div>

        {/* Rolls: Inventory */}
        <div style={S.card}>
          <span style={S.sectionLabel}>Inventory ({inInventory.length})</span>
          {inInventory.length === 0 ? (
            <p style={{ color: '#444', fontSize: 13 }}>No rolls in inventory.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {inInventory.map((r, i) => (
                <RollRow key={r.id} label={`Inventory #${i + 1}`} status="inventory"
                  onMarkInUse={() => markInUse(r.id)}
                  onDelete={() => deleteRoll(r.id)}
                  saving={saving} />
              ))}
            </div>
          )}
        </div>

        {/* Archive */}
        {archivedRolls.length > 0 && (
          <div style={S.card}>
            <button onClick={() => setShowArchive(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0, marginBottom: showArchive ? 12 : 0 }}>
              <span style={S.sectionLabel}>Empty Spools ({archivedRolls.length})</span>
              <span style={{ color: '#555', fontSize: 12, marginBottom: 10 }}>{showArchive ? '▲' : '▼'}</span>
            </button>
            {showArchive && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {archivedRolls.map((r, i) => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#111', borderRadius: 8, border: '1px solid #1e1e1e' }}>
                    <span style={{ color: '#444', fontSize: 13, flex: 1 }}>Empty Spool #{i + 1}</span>
                    <span style={{ color: '#333', fontSize: 11 }}>{new Date(r.created_at).toLocaleDateString()}</span>
                    <button onClick={() => deleteRoll(r.id)} className="btn btn-danger" style={{ fontSize: 11, padding: '4px 8px' }}>Delete</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delete */}
        <button onClick={handleDelete} className="btn btn-danger" style={{ marginTop: 8 }}>
          Delete Filament
        </button>

      </div>
    </Layout>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p style={{ color: '#555', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>{label}</p>
      <p style={{ color: '#ccc', fontSize: 14 }}>{value}</p>
    </div>
  );
}

interface RollRowProps {
  label: string;
  status: 'in_use' | 'inventory';
  onMarkInUse?: () => void;
  onMarkEmpty?: () => void;
  onDelete: () => void;
  saving: boolean;
}

function RollRow({ label, status, onMarkInUse, onMarkEmpty, onDelete, saving }: RollRowProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#111', borderRadius: 8, border: `1px solid ${status === 'in_use' ? '#1e3a2a' : '#1e1e1e'}` }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: status === 'in_use' ? '#4ade80' : '#3367d6', flexShrink: 0 }} />
      <span style={{ color: '#ccc', fontSize: 13, flex: 1 }}>{label}</span>
      {status === 'inventory' && onMarkInUse && (
        <button onClick={onMarkInUse} disabled={saving} className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }}>
          → In Use
        </button>
      )}
      {status === 'in_use' && onMarkEmpty && (
        <button onClick={onMarkEmpty} disabled={saving} className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px', color: '#f87171', borderColor: '#3a1a1a' }}>
          Mark Empty
        </button>
      )}
      <button onClick={onDelete} className="btn btn-danger" style={{ fontSize: 11, padding: '4px 8px' }}>✕</button>
    </div>
  );
}
