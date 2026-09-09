import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api';
import { Plus, Phone, Mail, Trash2, Edit2, Truck, Search } from 'lucide-react';

export default function SuppliersPage() {
  const { suppliers, setModalState, refreshSuppliers, showToast } = useApp();
  const [search, setSearch] = useState('');

  const filtered = (suppliers || []).filter(s => 
    String(s.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (s.contact && String(s.contact).includes(search)) ||
    (s.gstin && String(s.gstin).toLowerCase().includes(search.toLowerCase()))
  );

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete supplier "${name}"?`)) return;
    try {
      await api.deleteSupplier(id);
      showToast(`Supplier ${name} deleted`, 'success');
      await refreshSuppliers();
    } catch (err) {
      showToast("Error deleting supplier: " + err.message, 'danger');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800' }}>Suppliers & Vendor Directory</h2>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Manage fabric and merchandise procurement partners and track vendor deliveries
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              style={{ paddingLeft: '32px', fontSize: '12px', height: '34px' }}
              placeholder="Search vendor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-success" onClick={() => setModalState({ type: 'receiving', data: null })}>
            <Truck size={16} /> New Stock Inward (GRN)
          </button>
          <button className="btn btn-primary" onClick={() => setModalState({ type: 'supplier', data: null })}>
            <Plus size={16} /> Add New Vendor
          </button>
        </div>
      </div>

      <div className="pos-table-card">
        <div className="table-responsive">
          <table className="pos-table">
          <thead>
            <tr>
              <th>Vendor ID</th>
              <th>Supplier Name</th>
              <th>Category</th>
              <th>Contact Phone</th>
              <th>Email</th>
              <th>GSTIN</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No suppliers registered yet.
                </td>
              </tr>
            ) : (
              filtered.map(sup => (
                <tr key={sup.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{sup.id}</td>
                  <td style={{ fontWeight: '800' }}>{sup.name}</td>
                  <td>{sup.category || 'General'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                      <Phone size={12} color="var(--text-muted)" /> {sup.contact || 'N/A'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                      <Mail size={12} color="var(--text-muted)" /> {sup.email || 'N/A'}
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{sup.gstin || 'N/A'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => setModalState({ type: 'supplier', data: sup })}
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--accent-red)' }}
                        onClick={() => handleDelete(sup.id, sup.name)}
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
    </div>
  );
}
