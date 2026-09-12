import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import { RotateCcw, Search, Plus, FileText, CheckCircle, XCircle, ArrowLeftRight, Printer } from 'lucide-react';
import { printCreditNote } from '../utils/printCreditNote';

export default function ReturnsPage() {
  const { settings, showToast } = useApp();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoice, setInvoice] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [reason, setReason] = useState('Customer Return');
  const [refundMode, setRefundMode] = useState('Cash');
  const [isExchange, setIsExchange] = useState(false);
  const [exchangeNotes, setExchangeNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadReturns = async () => {
    setLoading(true);
    try {
      const res = await api.getReturns();
      if (res.success) setReturns(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadReturns(); }, []);

  const lookupInvoice = async () => {
    if (!invoiceNo.trim()) return;
    setLookupLoading(true);
    try {
      const res = await api.getInvoice(invoiceNo.trim());
      if (res.success) {
        setInvoice(res.data);
        setSelectedItems(res.data.items.map(i => ({ 
          item_id: i.item_id || i.id, 
          qty: i.qty, 
          name: i.name, 
          unit_price: i.unit_price || i.selling_price || 0, 
          gst_rate: i.gst_rate || 12,
          hsn_code: i.hsn_code || '',
          barcode: i.barcode || '',
          selected: false 
        })));
      } else {
        alert('Invoice not found: ' + invoiceNo);
      }
    } catch(e) { alert('Error: ' + e.message); }
    finally { setLookupLoading(false); }
  };

  const toggleItem = (idx) => setSelectedItems(prev => prev.map((it, i) => i===idx ? {...it, selected: !it.selected} : it));
  const setQty = (idx, q) => setSelectedItems(prev => prev.map((it, i) => i===idx ? {...it, qty: Math.max(1, Number(q))} : it));

  const submitReturn = async () => {
    const items = selectedItems.filter(i => i.selected);
    if (!items.length) { alert('Select at least one item to return'); return; }
    setSubmitting(true);
    try {
      const refundAmt = items.reduce((s, i) => s + i.unit_price * i.qty, 0);
      const res = await api.processReturn({ 
        invoice_no: invoice.invoice_no, 
        items, 
        reason, 
        refund_mode: refundMode, 
        refund_amount: refundAmt, 
        is_exchange: isExchange, 
        exchange_notes: exchangeNotes 
      });
      if (res.success) {
        if (showToast) {
          showToast(`Return processed! Credit Note: ${res.data.credit_note_no}`, 'success');
        } else {
          alert('Return processed! Credit Note: ' + res.data.credit_note_no);
        }
        printCreditNote(res.data, settings);
        setShowModal(false); 
        setInvoice(null); 
        setInvoiceNo(''); 
        loadReturns();
      }
    } catch(e) { alert('Error: ' + e.message); }
    finally { setSubmitting(false); }
  };

  const refundTotal = selectedItems.filter(i=>i.selected).reduce((s,i)=>s+i.unit_price*i.qty,0);

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px',flexWrap:'wrap',gap:'12px'}}>
        <div>
          <h2 style={{fontSize:'18px',fontWeight:'800'}}>Sales Returns &amp; Exchange</h2>
          <div style={{fontSize:'12px',color:'var(--text-muted)'}}>Process customer returns, issue GST credit notes, and restock inventory</div>
        </div>
        <button className="btn btn-primary" onClick={()=>setShowModal(true)}><Plus size={16}/> New Return / Exchange</button>
      </div>

      <div className="pos-table-card">
        <div className="table-responsive">
          <table className="pos-table">
          <thead><tr><th>Return ID</th><th>Credit Note</th><th>Original Invoice</th><th>Customer</th><th>Reason</th><th>Refund Mode</th><th>Refund Amount</th><th>Type</th><th>Date</th><th style={{textAlign:'center'}}>Action</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={10} style={{textAlign:'center',padding:'30px',color:'var(--text-muted)'}}>Loading returns...</td></tr>
            : returns.length === 0 ? <tr><td colSpan={10} style={{textAlign:'center',padding:'30px',color:'var(--text-muted)'}}>No returns recorded yet.</td></tr>
            : returns.map(r => (
              <tr key={r.id || r._id}>
                <td style={{fontFamily:'var(--font-mono)',fontWeight:'700'}}>{r.id}</td>
                <td style={{fontFamily:'var(--font-mono)',color:'var(--accent-purple)',fontWeight:'700'}}>{r.credit_note_no}</td>
                <td style={{fontFamily:'var(--font-mono)'}}>{r.original_invoice_no}</td>
                <td>{r.customer_name || (r.customer ? r.customer.name : 'Walk-in')}</td>
                <td>{r.reason}</td>
                <td><span style={{padding:'2px 8px',borderRadius:'10px',fontSize:'11px',fontWeight:'700',background:'rgba(59,130,246,0.1)',color:'var(--accent-blue)'}}>{r.refund_mode}</span></td>
                <td style={{fontWeight:'800',color:'var(--accent-emerald)'}}>₹{Number(r.refund_amount||0).toLocaleString('en-IN')}</td>
                <td>{r.is_exchange ? <span style={{padding:'2px 8px',borderRadius:'10px',fontSize:'11px',background:'rgba(245,158,11,0.1)',color:'var(--accent-amber)'}}>Exchange</span> : <span style={{padding:'2px 8px',borderRadius:'10px',fontSize:'11px',background:'rgba(239,68,68,0.1)',color:'var(--accent-red)'}}>Refund</span>}</td>
                <td style={{fontSize:'11.5px',color:'var(--text-muted)'}}>{new Date(r.created_at || r.date).toLocaleString('en-IN')}</td>
                <td style={{textAlign:'center'}}>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    title="Print Credit Note Voucher"
                    onClick={()=>printCreditNote(r, settings)}
                    style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'4px 8px',fontSize:'11.5px'}}
                  >
                    <Printer size={13}/> Print Slip
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e=>{ if(e.target===e.currentTarget) setShowModal(false); }}>
          <div className="modal-box modal-dialog" style={{maxWidth:'640px',width:'94%'}}>
            <div className="modal-header"><h3>New Return / Exchange</h3><button onClick={()=>{setShowModal(false);setInvoice(null);setInvoiceNo('');}}>&#10005;</button></div>
            <div className="modal-body">
              <div style={{display:'flex',gap:'10px',marginBottom:'16px',flexWrap:'wrap'}}>
                <input className="form-control" style={{flex:1,minWidth:'200px'}} placeholder="Enter Invoice Number e.g. INV-20260831-0001" value={invoiceNo} onChange={e=>setInvoiceNo(e.target.value)} onKeyDown={e=>e.key==='Enter'&&lookupInvoice()}/>
                <button className="btn btn-secondary" onClick={lookupInvoice} disabled={lookupLoading}>{lookupLoading?'Looking...':'Find Invoice'}</button>
              </div>
              {invoice && (
                <div>
                  <div style={{padding:'10px 14px',background:'var(--bg-card)',borderRadius:'var(--radius-sm)',marginBottom:'12px',fontSize:'12.5px'}}>
                    <strong>{invoice.invoice_no}</strong> &mdash; {invoice.customer ? invoice.customer.name : 'Walk-in'} &mdash; Rs.{Number(invoice.grand_total).toLocaleString('en-IN')}
                  </div>
                  <div style={{fontSize:'12px',fontWeight:'700',textTransform:'uppercase',color:'var(--text-muted)',marginBottom:'6px'}}>Select Items to Return</div>
                  {selectedItems.map((it,idx)=>(
                    <div key={idx} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px',borderRadius:'var(--radius-sm)',background:it.selected?'rgba(99,102,241,0.08)':'transparent',marginBottom:'6px'}}>
                      <input type="checkbox" checked={it.selected} onChange={()=>toggleItem(idx)} style={{width:'16px',height:'16px'}}/>
                      <span style={{flex:1,fontSize:'13px'}}>{it.name}</span>
                      <span style={{fontSize:'12px',color:'var(--text-muted)'}}>Rs.{it.unit_price}/pc</span>
                      <input type="number" min="1" max={it.qty} value={it.qty} onChange={e=>setQty(idx,e.target.value)} className="form-control" style={{width:'70px',textAlign:'center'}} disabled={!it.selected}/>
                    </div>
                  ))}
                  <div className="form-row" style={{marginTop:'14px'}}>
                    <div className="form-col form-group"><label>Reason</label>
                      <select className="form-control" value={reason} onChange={e=>setReason(e.target.value)}>
                        <option>Customer Return</option><option>Defective Product</option><option>Wrong Item Delivered</option><option>Size Exchange</option><option>Color Exchange</option><option>Customer Changed Mind</option>
                      </select>
                    </div>
                    <div className="form-col form-group"><label>Refund Mode</label>
                      <select className="form-control" value={refundMode} onChange={e=>setRefundMode(e.target.value)}>
                        <option>Cash</option><option>UPI</option><option>Store Credit</option><option>Exchange Only</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label><input type="checkbox" checked={isExchange} onChange={e=>setIsExchange(e.target.checked)} style={{marginRight:'8px'}}/>This is an Exchange (not a refund)</label>
                  </div>
                  {isExchange && <div className="form-group"><label>Exchange Notes</label><input className="form-control" value={exchangeNotes} onChange={e=>setExchangeNotes(e.target.value)} placeholder="e.g. Exchanged for Size XL, White color"/></div>}
                  <div style={{padding:'12px',background:'var(--bg-card)',borderRadius:'var(--radius-sm)',marginTop:'10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontWeight:'700'}}>Refund Amount:</span>
                    <span style={{fontSize:'20px',fontWeight:'900',color:'var(--accent-emerald)'}}>Rs.{refundTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>{setShowModal(false);setInvoice(null);setInvoiceNo('');}}>Cancel</button>
              {invoice && <button className="btn btn-primary" onClick={submitReturn} disabled={submitting}>{submitting?'Processing...':'Process Return & Generate Credit Note'}</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
