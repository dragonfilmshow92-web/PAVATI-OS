import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { X, Lock, Unlock, AlertTriangle } from 'lucide-react';

export default function ShiftModal() {
  const { modalState, setModalState, activeShift, refreshShift, showToast } = useApp();
  const [openingCash, setOpeningCash] = useState(activeShift?.opening_cash || 2000);
  const [closingCash, setClosingCash] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const isOpen = activeShift?.status === 'OPEN';

  const handleOpenShift = async () => {
    setLoading(true);
    try {
      await api.openShift({
        cashier: "Administrator",
        opening_cash: Number(openingCash),
        notes: notes || "Shift started"
      });
      showToast("Cashier shift opened successfully", "success");
      await refreshShift();
      setModalState({ type: null, data: null });
    } catch (err) {
      showToast("Failed to open shift: " + err.message, "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseShift = async () => {
    if (!closingCash) {
      showToast("Please enter counted physical drawer cash", "warning");
      return;
    }
    setLoading(true);
    try {
      await api.closeShift({
        closing_cash: Number(closingCash),
        notes: notes || "Shift closed and reconciled"
      });
      showToast("Cashier shift closed and reconciled", "success");
      await refreshShift();
      setModalState({ type: null, data: null });
    } catch (err) {
      showToast("Failed to close shift: " + err.message, "danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setModalState({ type: null, data: null })}>
      <div className="modal-dialog" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isOpen ? <Unlock size={18} color="var(--accent-emerald)" /> : <Lock size={18} color="var(--accent-amber)" />}
            <h2 className="modal-title">{isOpen ? "Active Cashier Shift Drawer" : "Open New Cashier Shift"}</h2>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setModalState({ type: null, data: null })}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {isOpen ? (
            <div>
              <div style={{ padding: '14px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Shift ID:</span>
                  <span style={{ fontSize: '12px', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>{activeShift.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Opening Float:</span>
                  <span style={{ fontSize: '13px', fontWeight: '700' }}>₹{activeShift.opening_cash}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Cash Sales:</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-emerald)' }}>₹{activeShift.cash_sales || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700' }}>Expected Drawer Cash:</span>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent-blue)' }}>
                    ₹{(Number(activeShift.opening_cash || 0) + Number(activeShift.cash_sales || 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label>Physical Cash Counted in Drawer (₹) *</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={closingCash} 
                  onChange={e => setClosingCash(e.target.value)} 
                  placeholder="Enter drawer cash" 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Shift Closing Notes</label>
                <textarea 
                  className="form-control" 
                  rows="2" 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  placeholder="Shift notes..." 
                />
              </div>
            </div>
          ) : (
            <div>
              <div className="form-group">
                <label>Opening Cash Float (₹) *</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={openingCash} 
                  onChange={e => setOpeningCash(e.target.value)} 
                  placeholder="2000" 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Shift Opening Notes</label>
                <textarea 
                  className="form-control" 
                  rows="2" 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  placeholder="Morning shift notes..." 
                />
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => setModalState({ type: null, data: null })}>
            Cancel
          </button>
          {isOpen ? (
            <button type="button" className="btn btn-danger" onClick={handleCloseShift} disabled={loading}>
              <Lock size={15} />
              {loading ? "Reconciling..." : "Close & Reconcile Shift"}
            </button>
          ) : (
            <button type="button" className="btn btn-success" onClick={handleOpenShift} disabled={loading}>
              <Unlock size={15} />
              {loading ? "Opening..." : "Open Cashier Shift"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
