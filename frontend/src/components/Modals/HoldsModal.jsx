import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, FolderOpen, Play, Trash2, Clock, User, Package } from 'lucide-react';

export default function HoldsModal() {
  const { heldCarts, restoreHeldCart, deleteHeldCart, setModalState } = useApp();

  return (
    <div className="modal-overlay" onClick={() => setModalState({ type: null, data: null })}>
      <div 
        className="modal-dialog" 
        style={{ maxWidth: '600px', padding: '20px', borderRadius: '16px', background: 'var(--bg-surface)' }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '6px', borderRadius: '8px', color: 'var(--accent-amber)' }}>
              <FolderOpen size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '800' }}>Parked & Held Bills</h2>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {heldCarts.length} sale{heldCarts.length === 1 ? '' : 's'} on hold
              </div>
            </div>
          </div>
          <button 
            className="btn btn-secondary btn-sm" 
            style={{ borderRadius: '50%', width: '30px', height: '30px', padding: 0 }}
            onClick={() => setModalState({ type: null, data: null })}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
          {heldCarts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <FolderOpen size={36} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.3 }} />
              <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>No held sales</div>
              <div style={{ fontSize: '12px' }}>When you hold a sale using the [HOLD] button, it will be parked here for later resumption.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {heldCarts.map((hold) => (
                <div 
                  key={hold.id} 
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ 
                        fontWeight: '800', 
                        fontFamily: 'var(--font-mono)', 
                        fontSize: '12px', 
                        background: 'rgba(59, 130, 246, 0.1)', 
                        color: 'var(--accent-blue)', 
                        padding: '2px 6px', 
                        borderRadius: '4px' 
                      }}>
                        {hold.id}
                      </span>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={12} /> {hold.timestamp || hold.date}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
                      <User size={13} color="var(--text-secondary)" />
                      <span>{hold.customer ? `${hold.customer.name} (${hold.customer.phone || 'Walk-in'})` : 'Walk-in Customer'}</span>
                    </div>

                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Package size={12} />
                      <span>{hold.itemCount} items: {(hold.items || []).slice(0, 2).map(i => i.name).join(', ')}{hold.items?.length > 2 ? '...' : ''}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Bill Amount</div>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                        ₹{Number(hold.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        className="btn btn-primary btn-sm" 
                        onClick={() => restoreHeldCart(hold.id)}
                        style={{ gap: '4px' }}
                      >
                        <Play size={13} /> Resume
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => deleteHeldCart(hold.id)}
                        style={{ color: 'var(--accent-red)', padding: '6px 8px' }}
                        title="Discard this held sale"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', textAlign: 'right' }}>
          <button className="btn btn-secondary" onClick={() => setModalState({ type: null, data: null })}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
