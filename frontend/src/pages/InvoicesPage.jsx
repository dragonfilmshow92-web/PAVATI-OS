import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api';
import { Printer, Search, FileText } from 'lucide-react';
import { printA4Invoice } from '../utils/printA4Invoice';

export default function InvoicesPage() {
  const { setModalState, settings } = useApp();
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

  const totalRevenue = invoices.reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0);
  const totalTax = invoices.reduce((sum, inv) => sum + (Number(inv.total_tax) || 0), 0);
  const avgTicket = invoices.length ? Math.round(totalRevenue / invoices.length) : 0;

  const getPaymentBadge = (method) => {
    const m = String(method || '').toLowerCase();
    if (m.includes('cash')) {
      return { bg: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-emerald)', border: 'rgba(16, 185, 129, 0.25)', label: '💵 ' + (method || 'Cash') };
    }
    if (m.includes('upi')) {
      return { bg: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-indigo)', border: 'rgba(99, 102, 241, 0.25)', label: '⚡ ' + method };
    }
    if (m.includes('card')) {
      return { bg: 'rgba(59, 130, 246, 0.12)', color: 'var(--accent-blue)', border: 'rgba(59, 130, 246, 0.25)', label: '💳 ' + method };
    }
    return { bg: 'rgba(245, 158, 11, 0.12)', color: 'var(--accent-amber)', border: 'rgba(245, 158, 11, 0.25)', label: '🔄 ' + (method || 'Split') };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Executive Billing KPIs */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', 
        gap: '12px' 
      }}>
        <div style={{ 
          background: 'var(--bg-surface)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '12px', 
          padding: '14px 18px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.6px' }}>
            Total Sales Billed
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)', marginTop: '4px' }}>
            ₹{Math.round(totalRevenue).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Cumulative receipts volume
          </div>
        </div>

        <div style={{ 
          background: 'var(--bg-surface)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '12px', 
          padding: '14px 18px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.6px' }}>
            Invoices Issued
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '4px' }}>
            {invoices.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Completed checkout tickets
          </div>
        </div>

        <div style={{ 
          background: 'var(--bg-surface)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '12px', 
          padding: '14px 18px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.6px' }}>
            GST Collected
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-indigo)', marginTop: '4px' }}>
            ₹{Math.round(totalTax).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Total CGST + SGST
          </div>
        </div>

        <div style={{ 
          background: 'var(--bg-surface)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '12px', 
          padding: '14px 18px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.6px' }}>
            Average Ticket Size
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)', marginTop: '4px' }}>
            ₹{avgTicket.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Mean value per basket
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Sales Invoices & Billing Archive</h2>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Search historical sales receipts, reprint thermal bills, and handle customer item returns
          </div>
        </div>

        <div style={{ position: 'relative', width: 'min(100%, 320px)' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-control" 
            style={{ paddingLeft: '38px', fontSize: '13px' }}
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
              filtered.map(inv => {
                const pBadge = getPaymentBadge(inv.payment_method);
                return (
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
                        background: pBadge.bg,
                        color: pBadge.color,
                        padding: '3px 9px', 
                        borderRadius: '6px',
                        border: `1px solid ${pBadge.border}`
                      }}>
                        {pBadge.label}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>₹{Math.round(inv.total_tax || 0)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '900', color: 'var(--accent-emerald)', fontSize: '14px' }}>
                      ₹{(Number(inv.grand_total) || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => printA4Invoice(inv, settings)}
                          title="Print standard A4 GST Tax Invoice"
                        >
                          <FileText size={13} /> A4
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => setModalState({ type: 'receipt', data: inv })}
                          title="Reprint thermal receipt"
                        >
                          <Printer size={13} /> Thermal
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
