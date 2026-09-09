import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, Trash2 } from 'lucide-react';

const EXPENSE_CATEGORIES = ['Rent', 'Electricity', 'Salary', 'Transport', 'Packaging', 'Maintenance', 'Marketing', 'Miscellaneous'];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ category: 'Rent', amount: '', description: '', date: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const res = await api.getExpenses();
      if (res.success) setExpenses(res.data);
    } catch(e) { console.warn(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadExpenses(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) { alert('Enter valid amount'); return; }
    setSaving(true);
    try {
      const res = await api.addExpense({ ...form, amount: Number(form.amount) });
      if (res.success) {
        setExpenses(prev => [res.data, ...prev]);
        setShowAdd(false);
        setForm({ category: 'Rent', amount: '', description: '', date: new Date().toISOString().slice(0, 10) });
      }
    } catch(ex) { alert('Error: ' + ex.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense entry?')) return;
    try {
      const res = await api.deleteExpense(id);
      if (res.success) setExpenses(prev => prev.filter(e => e.id !== id));
    } catch(ex) { alert(ex.message); }
  };

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  const byCat = {};
  expenses.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount || 0); });
  const catEntries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800' }}>Expense Tracking</h2>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Record daily business expenses — rent, salaries, utilities, and more</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}><Plus size={16} /> Add Expense</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '14px', marginBottom: '18px' }}>
        <div style={{ padding: '14px 18px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Total Expenses</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent-red)', marginTop: '4px' }}>Rs.{totalExpenses.toLocaleString('en-IN')}</div>
        </div>
        <div style={{ padding: '14px 18px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Total Entries</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent-blue)', marginTop: '4px' }}>{expenses.length}</div>
        </div>
        {catEntries.slice(0, 2).map(([cat, amt], i) => (
          <div key={i} style={{ padding: '14px 18px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Top: {cat}</div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--accent-amber)', marginTop: '4px' }}>Rs.{amt.toLocaleString('en-IN')}</div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="pos-table-card" style={{ padding: '18px', marginBottom: '16px' }}>
          <form onSubmit={handleAdd}>
            <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-blue)', marginBottom: '12px' }}>New Expense Entry</div>
            <div className="form-row">
              <div className="form-col form-group">
                <label>Category</label>
                <select className="form-control" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-col form-group">
                <label>Amount (Rs.) *</label>
                <input type="number" min="1" className="form-control" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="e.g. 5000" required />
              </div>
              <div className="form-col form-group">
                <label>Date</label>
                <input type="date" className="form-control" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label>Description / Notes</label>
              <input className="form-control" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Monthly rent payment for shop" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Add Expense'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="pos-table-card">
        <div className="table-responsive">
          <table className="pos-table">
          <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Loading expenses...</td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No expenses recorded yet.</td></tr>
            ) : expenses.map(exp => (
              <tr key={exp.id}>
                <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{exp.date || new Date(exp.created_at).toLocaleDateString('en-IN')}</td>
                <td><span style={{ padding: '2px 10px', borderRadius: '10px', fontSize: '11.5px', fontWeight: '700', background: 'rgba(239,68,68,0.1)', color: 'var(--accent-red)' }}>{exp.category}</span></td>
                <td style={{ fontSize: '12.5px' }}>{exp.description || '—'}</td>
                <td style={{ fontWeight: '900', fontSize: '15px', color: 'var(--accent-red)' }}>Rs.{Number(exp.amount).toLocaleString('en-IN')}</td>
                <td>
                  <button className="btn btn-sm btn-secondary" onClick={() => handleDelete(exp.id)} style={{ padding: '4px 8px' }}>
                    <Trash2 size={14} color="var(--accent-red)" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
