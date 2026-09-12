import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { X, Save, Building } from 'lucide-react';

export default function SupplierModal() {
  const { modalState, setModalState, refreshSuppliers, showToast } = useApp();
  const editingSup = modalState.data;

  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    phone: '',
    email: '',
    gstin: '',
    state: 'Maharashtra',
    category: 'Shirts & Trousers'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingSup) {
      setFormData({
        name: editingSup.name || '',
        contact: editingSup.phone || editingSup.contact || '',
        phone: editingSup.phone || editingSup.contact || '',
        email: editingSup.email || '',
        gstin: editingSup.gstin || '',
        state: editingSup.state || 'Maharashtra',
        category: editingSup.category || 'General Retail'
      });
    }
  }, [editingSup]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value,
      ...(name === 'contact' ? { phone: value } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("Please enter vendor name", "warning");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        phone: formData.phone || formData.contact,
        contact: formData.contact || formData.phone
      };
      if (editingSup) {
        await api.updateSupplier(editingSup.id, payload);
        showToast("Vendor updated successfully", "success");
      } else {
        await api.createSupplier(payload);
        showToast("New supplier registered", "success");
      }
      await refreshSuppliers();
      setModalState({ type: null, data: null });
    } catch (err) {
      showToast("Error saving supplier: " + err.message, "danger");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setModalState({ type: null, data: null })}>
      <div className="modal-dialog" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={18} color="var(--accent-blue)" />
            <h2 className="modal-title">{editingSup ? "Edit Supplier Info" : "Register New Vendor / Supplier"}</h2>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setModalState({ type: null, data: null })}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Supplier / Company Name *</label>
              <input 
                type="text" 
                name="name" 
                className="form-control" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="e.g. Apex Global Fabrics Ltd." 
                required 
              />
            </div>

            <div className="form-row">
              <div className="form-col form-group">
                <label>Contact Phone / Mobile</label>
                <input 
                  type="text" 
                  name="contact" 
                  className="form-control" 
                  value={formData.contact} 
                  onChange={handleChange} 
                  placeholder="+91 98111 22233" 
                />
              </div>
              <div className="form-col form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  className="form-control" 
                  value={formData.email} 
                  onChange={handleChange} 
                  placeholder="orders@supplier.com" 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-col form-group">
                <label>Vendor GSTIN</label>
                <input 
                  type="text" 
                  name="gstin" 
                  className="form-control" 
                  value={formData.gstin} 
                  onChange={handleChange} 
                  placeholder="27AABCA1234F1Z1" 
                />
              </div>
              <div className="form-col form-group">
                <label>Merchandise Category</label>
                <input 
                  type="text" 
                  name="category" 
                  className="form-control" 
                  value={formData.category} 
                  onChange={handleChange} 
                  placeholder="Shirts, Fabrics, Accessories" 
                />
              </div>
            </div>

            <div className="form-group">
              <label>Vendor State / Operating Region</label>
              <input 
                type="text" 
                name="state" 
                className="form-control" 
                value={formData.state} 
                onChange={handleChange} 
                placeholder="e.g. Maharashtra, Gujarat, Delhi" 
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModalState({ type: null, data: null })}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={15} />
              {saving ? "Saving..." : (editingSup ? "Update Supplier" : "Register Supplier")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
