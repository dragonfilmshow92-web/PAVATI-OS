import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, Printer } from 'lucide-react';
import { useApp } from '../context/AppContext';

const STATUS_COLOR = { PENDING: 'var(--accent-amber)', RECEIVED: 'var(--accent-emerald)', PARTIAL: 'var(--accent-blue)', CANCELLED: 'var(--accent-red)' };

export default function PurchaseOrdersPage() {
  const { suppliers, showToast } = useApp();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [poItems, setPoItems] = useState([{ name: '', qty: 1, unit_cost: '', uom: 'Pcs' }]);
  const [saving, setSaving] = useState(false);

  const loadPOs = async () => {
    setLoading(true);
    try {
      const res = await api.getPurchaseOrders();
      if (res.success) setOrders(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadPOs(); }, []);

  const addLine = () => setPoItems(prev => [...prev, { name: '', qty: 1, unit_cost: '', uom: 'Pcs' }]);
  const removeLine = (i) => setPoItems(prev => prev.filter((_,idx)=>idx!==i));
  const updateLine = (i, key, val) => setPoItems(prev => prev.map((it,idx) => idx===i ? {...it,[key]:val} : it));

  const submit = async (e) => {
    e.preventDefault();
    if (!supplierId) { alert('Select a supplier'); return; }
    setSaving(true);
    try {
      const supplier = suppliers.find(s => s.id === supplierId);
      const res = await api.createPurchaseOrder({
        supplier_id: supplierId,
        supplier_name: supplier ? supplier.name : supplierId,
        items: poItems.map(i => ({ ...i, qty: Number(i.qty), unit_cost: Number(i.unit_cost) })),
        expected_date: expectedDate,
        notes
      });
      if (res.success) {
        showToast('Purchase Order ' + res.data.po_no + ' created!', 'success');
        setOrders(prev => [res.data, ...prev]);
        setShowModal(false);
        setSupplierId(''); setPoItems([{ name:'',qty:1,unit_cost:'',uom:'Pcs' }]); setNotes(''); setExpectedDate('');
      }
    } catch(ex) { alert('Error: ' + ex.message); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await api.updatePOStatus(id, status);
      if (res.success) setOrders(prev => prev.map(o => o.id===id ? res.data : o));
    } catch(ex) { alert(ex.message); }
  };

  const printPO = (po) => {
    const w = window.open('', '_blank', 'width=700,height=900');
    let rows = '';
    (po.items || []).forEach((it, i) => {
      rows += '<tr><td>'+(i+1)+'</td><td>'+it.name+'</td><td>'+(it.uom||'Pcs')+'</td><td>'+it.qty+'</td><td>'+Number(it.unit_cost).toFixed(2)+'</td><td>'+Number(it.qty*it.unit_cost).toFixed(2)+'</td></tr>';
    });
    w.document.write('<html><head><title>PO - '+po.po_no+'</title><style>body{font-family:Arial;padding:30px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px}th{background:#f0f0f0}h2{border-bottom:2px solid #000;padding-bottom:8px}</style></head><body><h2>PURCHASE ORDER</h2><p><b>PO No:</b> '+po.po_no+'</p><p><b>Supplier:</b> '+po.supplier_name+'</p><p><b>Date:</b> '+new Date(po.created_at).toLocaleDateString()+'</p>'+(po.expected_date?'<p><b>Expected By:</b> '+po.expected_date+'</p>':'')+'<table><thead><tr><th>#</th><th>Item</th><th>UOM</th><th>Qty</th><th>Unit Cost</th><th>Total</th></tr></thead><tbody>'+rows+'</tbody><tfoot><tr><td colspan=5 style="text-align:right;font-weight:bold">Total:</td><td><b>Rs.'+Number(po.total_amount).toFixed(2)+'</b></td></tr></tfoot></table>'+(po.notes?'<p><b>Notes:</b> '+po.notes+'</p>':'')+'<p style="margin-top:40px;color:#888;font-size:12px">PAVATI OS — Computer Generated PO</p></body></html>');
    w.document.close(); w.print();
  };

  const poTotal = poItems.reduce((s,i)=>s+(Number(i.qty)||0)*(Number(i.unit_cost)||0), 0);

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px',flexWrap:'wrap',gap:'12px'}}>
        <div>
          <h2 style={{fontSize:'18px',fontWeight:'800'}}>Purchase Orders (PO)</h2>
          <div style={{fontSize:'12px',color:'var(--text-muted)'}}>Create and send purchase orders to your vendors/suppliers</div>
        </div>
        <button className="btn btn-primary" onClick={()=>setShowModal(true)}><Plus size={16}/> New Purchase Order</button>
      </div>

      <div className="pos-table-card">
        <div className="table-responsive">
          <table className="pos-table">
          <thead><tr><th>PO Number</th><th>Supplier</th><th>Line Items</th><th>Total Amount</th><th>Expected Date</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{textAlign:'center',padding:'30px',color:'var(--text-muted)'}}>Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan="7" style={{textAlign:'center',padding:'30px',color:'var(--text-muted)'}}>No purchase orders yet. Create your first PO above.</td></tr>
            ) : orders.map(o => (
              <tr key={o.id}>
                <td style={{fontFamily:'var(--font-mono)',fontWeight:'700',color:'var(--accent-blue)'}}>{o.po_no}</td>
                <td style={{fontWeight:'700'}}>{o.supplier_name}</td>
                <td>{(o.items||[]).length} items</td>
                <td style={{fontWeight:'800'}}>&#8377;{Number(o.total_amount||0).toLocaleString('en-IN')}</td>
                <td style={{fontSize:'12px',color:'var(--text-muted)'}}>{o.expected_date || 'Not specified'}</td>
                <td>
                  <span style={{padding:'3px 10px',borderRadius:'10px',fontSize:'11px',fontWeight:'800',
                    background:(STATUS_COLOR[o.status]||'gray')+'22',color:STATUS_COLOR[o.status]||'gray'}}>
                    {o.status}
                  </span>
                </td>
                <td>
                  <div style={{display:'flex',gap:'6px'}}>
                    <button className="btn btn-sm btn-secondary" onClick={()=>printPO(o)} style={{padding:'4px 8px'}}><Printer size={14}/></button>
                    {o.status==='PENDING' && (
                      <>
                        <button className="btn btn-sm btn-secondary" onClick={()=>updateStatus(o.id,'RECEIVED')} style={{padding:'4px 8px',fontSize:'11px'}}>Received</button>
                        <button className="btn btn-sm btn-secondary" onClick={()=>updateStatus(o.id,'CANCELLED')} style={{padding:'4px 8px',fontSize:'11px',color:'var(--accent-red)'}}>Cancel</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e=>{ if(e.target===e.currentTarget) setShowModal(false); }}>
          <div className="modal-box modal-dialog" style={{maxWidth:'700px',width:'96%'}}>
            <div className="modal-header"><h3>Create Purchase Order</h3><button onClick={()=>setShowModal(false)}>&#10005;</button></div>
            <div className="modal-body">
              <form onSubmit={submit}>
                <div className="form-row">
                  <div className="form-col form-group"><label>Supplier *</label>
                    <select className="form-control" value={supplierId} onChange={e=>setSupplierId(e.target.value)} required>
                      <option value="">Select Supplier...</option>
                      {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-col form-group"><label>Expected Delivery Date</label>
                    <input type="date" className="form-control" value={expectedDate} onChange={e=>setExpectedDate(e.target.value)}/>
                  </div>
                </div>
                <div style={{fontSize:'12px',fontWeight:'800',textTransform:'uppercase',color:'var(--text-muted)',marginBottom:'8px'}}>Order Items</div>
                {poItems.map((it,i)=>(
                  <div key={i} style={{display:'flex',gap:'8px',marginBottom:'8px',alignItems:'flex-end'}}>
                    <div style={{flex:3}}><input className="form-control" placeholder="Item description" value={it.name} onChange={e=>updateLine(i,'name',e.target.value)} required/></div>
                    <div style={{flex:1}}><input type="number" className="form-control" placeholder="Qty" value={it.qty} min="1" onChange={e=>updateLine(i,'qty',e.target.value)}/></div>
                    <div style={{flex:1}}><input type="number" className="form-control" placeholder="Cost" value={it.unit_cost} min="0" onChange={e=>updateLine(i,'unit_cost',e.target.value)}/></div>
                    <div style={{flex:1}}><input className="form-control" placeholder="UOM" value={it.uom} onChange={e=>updateLine(i,'uom',e.target.value)}/></div>
                    {poItems.length>1 && <button type="button" className="btn btn-sm btn-secondary" onClick={()=>removeLine(i)}>&#10005;</button>}
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm" onClick={addLine} style={{marginBottom:'14px'}}><Plus size={14}/> Add Line</button>
                <div className="form-group"><label>Notes</label><input className="form-control" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes for supplier..."/></div>
                <div style={{padding:'12px',background:'var(--bg-card)',borderRadius:'var(--radius-sm)',display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'8px'}}>
                  <span style={{fontWeight:'700'}}>PO Total:</span>
                  <span style={{fontSize:'18px',fontWeight:'900',color:'var(--accent-blue)'}}>&#8377;{poTotal.toLocaleString('en-IN')}</span>
                </div>
                <div style={{display:'flex',gap:'10px',justifyContent:'flex-end',marginTop:'16px'}}>
                  <button type="button" className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Creating...':'Create Purchase Order'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
