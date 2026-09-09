import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Tag, 
  Plus, 
  Trash2, 
  Percent, 
  DollarSign, 
  Copy, 
  Check, 
  Flame, 
  ShoppingBag, 
  Sparkles,
  Search,
  SlidersHorizontal,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ 
    code: '', 
    type: 'percent', 
    value: '', 
    description: '', 
    min_amount: '', 
    active: true 
  });
  const [saving, setSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Coupon Live Simulator State
  const [simCode, setSimCode] = useState('');
  const [simCartAmount, setSimCartAmount] = useState('1000');
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  useEffect(() => { 
    loadCoupons(); 
  }, []);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await api.getCoupons();
      if (res.success) setCoupons(res.data);
    } catch(err) {
      console.error(err);
    } finally { 
      setLoading(false); 
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.code || !form.value) return;
    setSaving(true);
    try {
      const res = await api.createCoupon({ 
        ...form, 
        value: Number(form.value), 
        min_amount: form.min_amount ? Number(form.min_amount) : null 
      });
      if (res.success) {
        setCoupons(prev => [res.data, ...prev]);
        setShowAdd(false);
        setForm({ code: '', type: 'percent', value: '', description: '', min_amount: '', active: true });
      }
    } catch(e) { 
      alert('Error creating coupon: ' + e.message); 
    } finally { 
      setSaving(false); 
    }
  };

  const toggle = async (c) => {
    try {
      const res = await api.toggleCoupon(c.id, !c.active);
      if (res.success) setCoupons(prev => prev.map(x => x.id === c.id ? res.data : x));
    } catch(e) { 
      alert(e.message); 
    }
  };

  const remove = async (c) => {
    if (!confirm(`Delete coupon "${c.code}"?`)) return;
    try {
      const res = await api.deleteCoupon(c.id);
      if (res.success) setCoupons(prev => prev.filter(x => x.id !== c.id));
    } catch(e) { 
      alert(e.message); 
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSimulate = async (e) => {
    e?.preventDefault();
    if (!simCode || !simCartAmount) return;
    setSimLoading(true);
    setSimResult(null);
    try {
      const res = await api.validateCoupon(simCode, Number(simCartAmount));
      setSimResult(res);
    } catch (err) {
      setSimResult({ success: false, message: err.message });
    } finally {
      setSimLoading(false);
    }
  };

  // KPIs
  const activeCount = coupons.filter(c => c.active).length;
  const totalUses = coupons.reduce((acc, c) => acc + (c.usage_count || 0), 0);

  // Filtered
  const filteredCoupons = coupons.filter(c => 
    String(c.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(c.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* ─── Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))', 
              padding: '6px 10px', 
              borderRadius: '8px', 
              color: 'var(--accent-purple)' 
            }}>
              <Sparkles size={18} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Promotions & Discount Engine</h2>
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Configure smart promotional coupons, percentage discounts, flat bill deductions, and min cart thresholds
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowAdd(!showAdd)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
          >
            <Plus size={16} /> 
            <span>{showAdd ? 'Close Form' : 'New Promo Code'}</span>
          </button>
        </div>
      </div>

      {/* ─── KPI Metrics ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Active Promos</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent-emerald)', marginTop: '4px' }}>
            {activeCount} <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>/ {coupons.length}</span>
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>Live in billing engine</div>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Total Redemptions</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent-blue)', marginTop: '4px' }}>
            {totalUses}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>Customer checkouts used</div>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Discount Types</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent-purple)', marginTop: '4px' }}>
            % & Flat ₹
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>Auto-validated at checkout</div>
        </div>
      </div>

      {/* ─── Create Coupon Drawer ─── */}
      {showAdd && (
        <div className="pos-table-card" style={{ padding: '22px', marginBottom: '22px', border: '1px solid var(--accent-purple)' }}>
          <form onSubmit={handleAdd}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Tag size={16} color="var(--accent-purple)" />
              <div style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-purple)' }}>
                Create New Promotional Voucher
              </div>
            </div>

            <div className="form-row">
              <div className="form-col form-group">
                <label>Coupon Code *</label>
                <input 
                  className="form-control" 
                  value={form.code} 
                  onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase().replace(/\s+/g, '') }))} 
                  placeholder="e.g. FESTIVE20 or FLAT100" 
                  required
                  style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', textTransform: 'uppercase' }}
                />
              </div>
              <div className="form-col form-group">
                <label>Discount Type</label>
                <select 
                  className="form-control" 
                  value={form.type} 
                  onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                >
                  <option value="percent">Percentage Off (%)</option>
                  <option value="flat">Flat Amount Off (₹)</option>
                </select>
              </div>
              <div className="form-col form-group">
                <label>Discount Value ({form.type === 'percent' ? '%' : '₹'}) *</label>
                <input 
                  type="number" 
                  min="1" 
                  max={form.type === 'percent' ? "100" : undefined}
                  className="form-control" 
                  value={form.value} 
                  onChange={e => setForm(p => ({ ...p, value: e.target.value }))} 
                  placeholder={form.type === 'percent' ? '15' : '150'} 
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-col form-group">
                <label>Campaign Title / Description</label>
                <input 
                  className="form-control" 
                  value={form.description} 
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))} 
                  placeholder="e.g. Festive seasonal discount on apparel"
                />
              </div>
              <div className="form-col form-group">
                <label>Minimum Cart Amount (₹)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={form.min_amount} 
                  onChange={e => setForm(p => ({ ...p, min_amount: e.target.value }))} 
                  placeholder="Optional — e.g. 1000"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Creating...' : 'Activate Coupon'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Split Layout: Coupons Table + Live Sandbox Validator ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)', gap: '18px', alignItems: 'start' }}>
        
        {/* Left: Active Coupons Table */}
        <div className="pos-table-card">
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ fontWeight: '800', fontSize: '14px' }}>All Promotional Vouchers</div>
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text"
                placeholder="Search promo codes..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px 6px 30px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '12px'
                }}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="pos-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Min Order</th>
                  <th>Description</th>
                  <th>Redeemed</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>Loading coupons...</td></tr>
                ) : filteredCoupons.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>No coupons found. Click "New Promo Code" above to create one.</td></tr>
                ) : (
                  filteredCoupons.map(c => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ 
                            fontFamily: 'var(--font-mono)', 
                            fontWeight: '900', 
                            fontSize: '13px', 
                            color: 'var(--accent-purple)', 
                            background: 'rgba(139,92,246,0.12)', 
                            padding: '3px 9px', 
                            borderRadius: '6px',
                            letterSpacing: '0.5px'
                          }}>
                            {c.code}
                          </span>
                          <button 
                            type="button"
                            onClick={() => copyToClipboard(c.code)} 
                            title="Copy code"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedCode === c.code ? 'var(--accent-emerald)' : 'var(--text-muted)', padding: '2px' }}
                          >
                            {copiedCode === c.code ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '11.5px', fontWeight: '700', color: c.type === 'percent' ? 'var(--accent-blue)' : 'var(--accent-emerald)' }}>
                          {c.type === 'percent' ? '% Off' : 'Flat ₹'}
                        </span>
                      </td>
                      <td style={{ fontWeight: '800', fontSize: '15px' }}>
                        {c.type === 'percent' ? `${c.value}%` : `₹${c.value}`}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                        {c.min_amount ? `₹${c.min_amount}` : 'Any'}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {c.description || '—'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                        {c.usage_count || 0}
                      </td>
                      <td>
                        <span style={{ 
                          padding: '3px 8px', 
                          borderRadius: '10px', 
                          fontSize: '10.5px', 
                          fontWeight: '800', 
                          background: c.active ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', 
                          color: c.active ? 'var(--accent-emerald)' : 'var(--accent-red)' 
                        }}>
                          {c.active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn-sm btn-secondary" 
                            onClick={() => toggle(c)} 
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                          >
                            {c.active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button 
                            className="btn btn-sm btn-secondary" 
                            onClick={() => remove(c)} 
                            style={{ padding: '3px 8px', color: 'var(--accent-red)' }}
                            title="Delete coupon"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Quick Validation Sandbox Simulator */}
        <div className="pos-table-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <SlidersHorizontal size={16} color="var(--accent-blue)" />
            <div style={{ fontWeight: '800', fontSize: '13.5px' }}>Coupon Live Sandbox</div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Test whether any code passes validation against a simulated cart order amount before giving to customers.
          </div>

          <form onSubmit={handleSimulate}>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11.5px' }}>Promo Code to Test</label>
              <input 
                className="form-control" 
                value={simCode} 
                onChange={e => setSimCode(e.target.value.toUpperCase())}
                placeholder="e.g. WELCOME10"
                style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11.5px' }}>Cart Total Amount (₹)</label>
              <input 
                type="number"
                min="1"
                className="form-control" 
                value={simCartAmount} 
                onChange={e => setSimCartAmount(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', fontWeight: '800' }}
              disabled={simLoading}
            >
              {simLoading ? 'Simulating...' : 'Test Validation'}
            </button>
          </form>

          {/* Simulation Result Box */}
          {simResult && (
            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              borderRadius: '8px', 
              background: simResult.success ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              border: `1px solid ${simResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: '13px', color: simResult.success ? 'var(--accent-emerald)' : 'var(--accent-red)' }}>
                {simResult.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <span>{simResult.success ? 'Coupon Eligible!' : 'Validation Failed'}</span>
              </div>
              
              {simResult.success ? (
                <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <div>Discount Type: <strong style={{ textTransform: 'capitalize' }}>{simResult.data?.discount_type}</strong></div>
                  <div>Discount Value: <strong>{simResult.data?.discount_value}{simResult.data?.discount_type === 'percent' ? '%' : '₹'}</strong></div>
                  <div style={{ marginTop: '4px', fontSize: '13px', color: 'var(--accent-emerald)', fontWeight: '800' }}>
                    Calculated Savings: ₹{simResult.data?.discount_amount}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Final Payable: ₹{Math.max(0, Number(simCartAmount) - (simResult.data?.discount_amount || 0))}
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--accent-red)' }}>
                  {simResult.message || simResult.error || 'Code invalid or minimum requirement not met'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}