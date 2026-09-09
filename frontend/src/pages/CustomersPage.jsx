import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api';
import { UserCheck, Plus, Phone, Award, CreditCard, Search } from 'lucide-react';

export default function CustomersPage() {
  const { customers, setCustomers, showToast } = useApp();
  const [search, setSearch] = useState('');
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustPhone) {
      showToast("Phone number is required", "warning");
      return;
    }
    try {
      const res = await api.createCustomer({
        name: newCustName || "Customer " + newCustPhone,
        phone: newCustPhone
      });
      if (res.success) {
        showToast("Customer registered!", "success");
        setCustomers(prev => [...prev, res.data]);
        setNewCustName('');
        setNewCustPhone('');
        setShowAdd(false);
      }
    } catch (err) {
      showToast("Failed to register customer: " + err.message, "danger");
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800' }}>Customer Club & Khata Ledger</h2>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Manage store loyalty points, customer phone records, and credit ledger
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          <Plus size={16} /> Register New Customer
        </button>
      </div>

      {showAdd && (
        <div style={{ padding: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
          <form onSubmit={handleCreateCustomer} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 'min(100%, 200px)' }}>
              <label>Customer Full Name</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. Rahul Sharma" 
                value={newCustName} 
                onChange={e => setNewCustName(e.target.value)} 
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 'min(100%, 200px)' }}>
              <label>Mobile Number *</label>
              <input 
                type="tel" 
                className="form-control" 
                placeholder="+91 98222 11223" 
                value={newCustPhone} 
                onChange={e => setNewCustPhone(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" className="btn btn-success" style={{ height: '38px' }}>
              Save Customer
            </button>
          </form>
        </div>
      )}

      <div className="pos-table-card">
        <div className="table-responsive">
          <table className="pos-table">
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Customer Name</th>
              <th>Mobile Number</th>
              <th>Loyalty Points</th>
              <th>Khata Credit Balance</th>
              <th>Total Lifetime Spent</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No customers found.</td></tr>
            ) : (
              filtered.map(c => (
                <tr key={c.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{c.id}</td>
                  <td style={{ fontWeight: '800' }}>{c.name}</td>
                  <td>{c.phone}</td>
                  <td>
                    <span style={{ 
                      fontSize: '11.5px', 
                      fontWeight: '800', 
                      color: 'var(--accent-purple)', 
                      background: 'rgba(139, 92, 246, 0.1)', 
                      padding: '2px 8px', 
                      borderRadius: '12px' 
                    }}>
                      ⭐ {c.loyalty_points || 0} pts
                    </span>
                  </td>
                  <td style={{ fontWeight: '700', color: (c.credit_balance || 0) > 0 ? 'var(--accent-red)' : 'var(--accent-emerald)' }}>
                    ₹{c.credit_balance || 0}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '800' }}>
                    ₹{Number(c.total_spent || 0).toLocaleString('en-IN')}
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
