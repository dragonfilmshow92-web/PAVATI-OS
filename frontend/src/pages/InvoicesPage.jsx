import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api';
import { Printer, Search } from 'lucide-react';

export default function InvoicesPage() {
  const { setModalState } = useApp();
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.getInvoices();
      if (res.success) setInvoices(res.data);
    } catch (err) {
      console.warn("Failed to load invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const filtered = invoices.filter(inv => 
    String(inv.invoice_no || '').toLowerCase().includes(search.toLowerCase()) ||
    (inv.payment_method && String(inv.payment_method).toLowerCase().includes(search.toLowerCase())) ||
    (inv.customer_phone && String(inv.customer_phone).includes(search))
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800' }}>Sales Invoices & Billing Archive</h2>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Search historical sales receipts, reprint thermal bills, and handle customer item returns
          </div>
        </div>

        <div style={{ position: 'relative', width: 'min(100%, 320px)' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-control" 
            style={{ paddingLeft: '36px', fontSize: '13px' }}
            placeholder="Search by Invoice # or Customer Phone..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      <div className="pos-table-card">
        <div className="table-responsive">
          <table className="pos-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date & Time</th>
              <th>Items Sold</th>
              <th>Payment Method</th>
              <th>Total Tax (₹)</th>
              <th>Grand Total (₹)</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>Loading invoices...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No invoices found.</td></tr>
            ) : (
              filtered.map(inv => (
                <tr key={inv.invoice_no}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '800' }}>#{inv.invoice_no}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {inv.created_at ? new Date(inv.created_at).toLocaleString('en-IN') : 'N/A'}
                  </td>
                  <td>{(inv.items || []).length} Item(s)</td>
                  <td>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: '700', 
                      background: 'var(--bg-input)', 
                      padding: '3px 8px', 
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)' 
                    }}>
                      {inv.payment_method || 'Cash'}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>₹{Math.round(inv.total_tax || 0)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '900', color: 'var(--accent-emerald)', fontSize: '14px' }}>
                    ₹{(Number(inv.grand_total) || 0).toLocaleString('en-IN')}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => setModalState({ type: 'receipt', data: inv })}
                    >
                      <Printer size={13} /> Reprint Thermal
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
