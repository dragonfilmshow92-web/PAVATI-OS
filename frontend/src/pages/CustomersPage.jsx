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

  const totalMembers = customers.length;
  const totalPoints = customers.reduce((acc, c) => acc + (Number(c.loyalty_points) || 0), 0);
  const totalCredit = customers.reduce((acc, c) => acc + (Number(c.credit_balance) || 0), 0);
  const totalSpent = customers.reduce((acc, c) => acc + (Number(c.total_spent) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Customer KPIs */}
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
            Registered Members
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '4px' }}>
            {totalMembers}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Active club profiles
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
            Loyalty Points Pool
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)', marginTop: '4px' }}>
            ⭐ {totalPoints.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Issued rewards points
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
            Total Khata Credit
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: totalCredit > 0 ? 'var(--accent-red)' : 'var(--accent-emerald)', marginTop: '4px' }}>
            ₹{totalCredit.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Outstanding ledger balance
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
            Lifetime Sales
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)', marginTop: '4px' }}>
            ₹{Math.round(totalSpent).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Total member contribution
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Customer Club & Khata Ledger</h2>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Manage store loyalty points, customer phone records, and credit ledger
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              style={{ paddingLeft: '38px', fontSize: '13px' }}
              placeholder="Search Name or Mobile..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>

          <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
            <Plus size={16} /> Register New Customer
          </button>
        </div>
      </div>

      {showAdd && (
        <div style={{ padding: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
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
