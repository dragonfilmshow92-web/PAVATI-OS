import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { X, User, Plus, Check, Search } from 'lucide-react';

export default function QuickCustomerModal() {
  const { modalState, customers, setCustomers, cartCustomer, setCartCustomer, setModalState, showToast } = useApp();
  const prefill = modalState.data?.prefill || '';
  const isDigitPrefill = /^\d+$/.test(prefill);
  const [search, setSearch] = useState(prefill);
  const [name, setName] = useState(!isDigitPrefill ? prefill : '');
  const [phone, setPhone] = useState(isDigitPrefill ? prefill : '');
  const [showAdd, setShowAdd] = useState(Boolean(prefill));

  const filtered = customers.filter(c => 
    (c.name && c.name.toLowerCase().includes(search.toLowerCase())) || 
    (c.phone && c.phone.includes(search))
  );

  const handleSelect = (cust) => {
    setCartCustomer(cust);
    setModalState({ type: null, data: null });
    showToast(`Selected ${cust ? cust.name : 'Walk-in Retail Customer'}`, 'info');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!phone) {
      showToast("Phone number is required", "warning");
      return;
    }
    try {
      const res = await api.createCustomer({
        name: name.trim() || `Customer ${phone}`,
        phone: phone.trim()
      });
      if (res.success) {
        showToast("Customer registered!", "success");
        setCustomers(prev => [...prev, res.data]);
        setCartCustomer(res.data);
        setModalState({ type: null, data: null });
      }
    } catch (err) {
      showToast("Failed to register customer: " + err.message, "danger");
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setModalState({ type: null, data: null })}>
      <div 
        className="modal-dialog" 
        style={{ maxWidth: '480px', padding: '20px', borderRadius: '16px', background: 'var(--bg-surface)' }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '16px' }}>
            <User size={18} color="var(--accent-blue)" />
            <span>Select Customer for Bill</span>
          </div>
          <button 
            className="btn btn-secondary btn-sm" 
            style={{ borderRadius: '50%', width: '28px', height: '28px', padding: 0 }}
            onClick={() => setModalState({ type: null, data: null })}
          >
            <X size={15} />
          </button>
        </div>

        {/* Walk-in option button */}
        <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
          <button 
            className={`btn ${!cartCustomer ? 'btn-primary' : 'btn-secondary'} btn-sm`} 
            style={{ flex: 1 }}
            onClick={() => handleSelect(null)}
          >
            Walk-in (No Customer)
          </button>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => setShowAdd(!showAdd)}
          >
            <Plus size={14} /> {showAdd ? 'Cancel' : 'New Customer'}
          </button>
        </div>

        {showAdd && (
          <form onSubmit={handleCreate} style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', marginBottom: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', marginBottom: '8px' }}>Quick Customer Registration</div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Full Name" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                style={{ fontSize: '12.5px' }}
              />
              <input 
                type="tel" 
                className="form-control" 
                placeholder="Mobile Phone *" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                required 
                style={{ fontSize: '12.5px' }}
              />
            </div>
            <button type="submit" className="btn btn-success btn-sm" style={{ width: '100%' }}>
              Register & Attach to Bill
            </button>
          </form>
        )}

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search name or mobile number..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '32px', fontSize: '13px' }}
            autoFocus
          />
        </div>

        {/* Customer List */}
        <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filtered.map(c => {
            const isSelected = cartCustomer?.id === c.id;
            return (
              <div 
                key={c.id}
                onClick={() => handleSelect(c)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: isSelected ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                  background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-input)',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ fontWeight: '700', fontSize: '13px' }}>{c.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.phone} · {c.loyalty_points || 0} pts</div>
                </div>
                {isSelected && <Check size={16} color="var(--accent-blue)" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
