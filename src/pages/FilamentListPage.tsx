import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import type { FilamentWithRolls, FilamentPriority } from '../types';

async function fetchFilaments(): Promise<FilamentWithRolls[]> {
  const { data, error } = await supabase
    .from('filaments')
    .select('*, rolls(id, is_checked_out, archived)')
    .order('manufacturer')
    .order('type')
    .order('color');
  if (error) throw error;
  return (data ?? []).map((f: any) => ({
    ...f,
    in_use: (f.rolls ?? []).filter((r: any) => r.is_checked_out === 1 && r.archived === 0).length,
    in_inventory: (f.rolls ?? []).filter((r: any) => r.is_checked_out === 0 && r.archived === 0).length,
    archived_count: (f.rolls ?? []).filter((r: any) => r.archived === 1).length,
  }));
}

async function fetchThresholds(): Promise<Record<string, number>> {
  const { data } = await supabase.from('filament_settings').select('key, value');
  const defaults: Record<string, number> = { threshold_Low: 0, threshold_Medium: 1, threshold_High: 4 };
  if (!data) return defaults;
  const result = { ...defaults };
  for (const row of data as { key: string; value: string }[]) result[row.key] = parseInt(row.value, 10);
  return result;
}

function priorityBadgeStyle(priority: FilamentPriority) {
  switch (priority) {
    case 'High':   return { background: 'rgba(198,40,40,0.15)',   color: '#f87171', border: '1px solid rgba(198,40,40,0.3)' };
    case 'Medium': return { background: 'rgba(230,168,23,0.15)',  color: '#fbbf24', border: '1px solid rgba(230,168,23,0.3)' };
    case 'Low':    return { background: 'rgba(26,138,58,0.15)',   color: '#4ade80', border: '1px solid rgba(26,138,58,0.3)' };
    default:       return {};
  }
}

export default function FilamentListPage() {
  const navigate = useNavigate();
  const { data: filaments = [], isLoading } = useSWR('filaments', fetchFilaments);
  const { data: thresholds = {} } = useSWR('filament_settings', fetchThresholds);

  const [search, setSearch] = useState('');
  const [filterMfg, setFilterMfg] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterInUse, setFilterInUse] = useState(false);
  const [filterInInventory, setFilterInInventory] = useState(false);

  const manufacturers = useMemo(() => [...new Set(filaments.map(f => f.manufacturer))].sort(), [filaments]);
  const types = useMemo(() => [...new Set(filaments.map(f => f.type))].sort(), [filaments]);

  const isLowStock = (f: FilamentWithRolls) => {
    const total = f.in_use + f.in_inventory;
    const th = thresholds as Record<string, number>;
    if (f.priority === 'High'   && total < (th.threshold_High   ?? 4)) return true;
    if (f.priority === 'Medium' && total < (th.threshold_Medium ?? 1)) return true;
    if (f.priority === 'Low'    && total < (th.threshold_Low    ?? 0)) return true;
    return false;
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return filaments.filter(f => {
      if (q && ![f.manufacturer, f.type, f.color, f.upc].some(v => v.toLowerCase().includes(q))) return false;
      if (filterMfg  && f.manufacturer !== filterMfg)  return false;
      if (filterType && f.type         !== filterType) return false;
      if (filterInUse      && f.in_use       === 0) return false;
      if (filterInInventory && f.in_inventory === 0) return false;
      return true;
    });
  }, [filaments, search, filterMfg, filterType, filterInUse, filterInInventory]);

  const totalInUse      = filtered.reduce((s, f) => s + f.in_use, 0);
  const totalInInventory = filtered.reduce((s, f) => s + f.in_inventory, 0);
  const hasFilters = !!filterMfg || !!filterType || filterInUse || filterInInventory;

  return (
    <Layout title="Filament Inventory">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{ color: '#f0f0f0', fontSize: 18, fontWeight: 700, flex: 1 }}>Filaments</h2>
          <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => navigate('/settings')}>
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
          <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => navigate('/filaments/new')}>
            + Add Filament
          </button>
        </div>

        {/* Search */}
        <input
          type="search" className="input"
          placeholder="Search manufacturer, type, color, UPC…"
          value={search} onChange={e => setSearch(e.target.value)}
        />

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="input" style={{ width: 'auto', flex: '1 1 140px' }} value={filterMfg} onChange={e => setFilterMfg(e.target.value)}>
            <option value="">All Manufacturers</option>
            {manufacturers.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="input" style={{ width: 'auto', flex: '1 1 120px' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <FilterChip label="In Use"       active={filterInUse}      onToggle={() => setFilterInUse(v => !v)} />
          <FilterChip label="In Inventory" active={filterInInventory} onToggle={() => setFilterInInventory(v => !v)} />
          {hasFilters && (
            <button className="btn btn-danger" style={{ fontSize: 12, padding: '6px 10px' }}
              onClick={() => { setFilterMfg(''); setFilterType(''); setFilterInUse(false); setFilterInInventory(false); }}>
              Clear
            </button>
          )}
        </div>

        {/* Totals bar */}
        {filtered.length > 0 && (
          <div className="card" style={{ display: 'flex', padding: '10px 0' }}>
            <TotalsItem label="Total In Use"       value={totalInUse} />
            <div style={{ width: 1, background: '#222' }} />
            <TotalsItem label="Total In Inventory" value={totalInInventory} />
            <div style={{ width: 1, background: '#222' }} />
            <TotalsItem label="Rolls"              value={totalInUse + totalInInventory} />
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <p style={{ color: '#555', fontSize: 14, textAlign: 'center', padding: '64px 0' }}>
            {filaments.length === 0 ? 'No filaments yet. Click + Add Filament to get started.' : 'No filaments match your filters.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(f => (
              <button key={f.id} onClick={() => navigate(`/filaments/${f.id}`)}
                className="card card-interactive"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: 12,
                  width: '100%', textAlign: 'left',
                  background: isLowStock(f) ? 'rgba(239,68,68,0.07)' : '#1a1a1a',
                  borderColor: isLowStock(f) ? 'rgba(239,68,68,0.35)' : '#222',
                }}
              >
                {/* Thumbnail */}
                <div style={{ width: 52, height: 52, borderRadius: 8, background: '#111', border: '1px solid #222', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {f.photo_url
                    ? <img src={f.photo_url} alt={f.manufacturer} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 24 }}>📦</span>}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#f0f0f0', fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.manufacturer} – {f.type}
                  </p>
                  <p style={{ color: '#666', fontSize: 13, marginTop: 2 }}>{f.color}</p>
                  {f.upc && <p style={{ color: '#444', fontSize: 11, marginTop: 2 }}>UPC: {f.upc}</p>}
                </div>

                {/* Priority + badges */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  {f.priority !== 'None' && (
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 10, ...priorityBadgeStyle(f.priority) }}>
                      {f.priority.toUpperCase()}
                    </span>
                  )}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span className="badge"><span className="badge-label">USE</span><span className="badge-value">{f.in_use}</span></span>
                    <span className="badge"><span className="badge-label">INV</span><span className="badge-value">{f.in_inventory}</span></span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function FilterChip({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{
      background: active ? 'rgba(51,103,214,0.15)' : 'transparent',
      border: `1px solid ${active ? '#3367d6' : '#2a2a2a'}`,
      color: active ? '#3367d6' : '#666',
      borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 500,
      cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
    }}>
      {label}{active && ' ✕'}
    </button>
  );
}

function TotalsItem({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 0' }}>
      <span style={{ color: '#f0f0f0', fontSize: 20, fontWeight: 800 }}>{value}</span>
      <span style={{ color: '#555', fontSize: 11, marginTop: 2 }}>{label}</span>
    </div>
  );
}
