import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { X, Check, QrCode, Banknote, CreditCard, Split } from 'lucide-react';
import QRCode from 'qrcode';
import { printThermalReceipt } from '../../utils/printReceipt';
import soundFx from '../../utils/sounds';

export default function PaymentModal() {
  const { setModalState, cart, cartTotals, cartCustomer, clearCart, refreshItems, showToast, settings } = useApp();
  const [method, setMethod] = useState('UPI'); // UPI, Cash, Card, Split
  const [cashTendered, setCashTendered] = useState('');
  const [cardRef, setCardRef] = useState('');
  const [splitCash, setSplitCash] = useState('');
  const [splitUpi, setSplitUpi] = useState('');
  const [upiQrDataUrl, setUpiQrDataUrl] = useState('');
  const [processing, setProcessing] = useState(false);

  const totalAmount = cartTotals.grandTotal;

  // Generate UPI QR automatically
  useEffect(() => {
    async function loadUpi() {
      try {
        const invoiceNo = "POS-" + Date.now().toString().slice(-6);
        const res = await api.getUpiPayload(totalAmount, invoiceNo);
        const upiUri = res.data?.upi_uri || res.data?.upi_string;
        if (res.success && upiUri) {
          const url = await QRCode.toDataURL(upiUri, {
            width: 200,
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' }
          });
          setUpiQrDataUrl(url);
        }
      } catch (err) {
        console.warn("Error generating UPI QR:", err);
      }
    }
    if (totalAmount > 0) {
      loadUpi();
    }
  }, [totalAmount]);

  const changeDue = cashTendered ? Math.max(0, Number(cashTendered) - totalAmount) : 0;

  const handleCheckout = async () => {
    if (method === 'Cash' && (!cashTendered || Number(cashTendered) < totalAmount)) {
      showToast("Tendered cash must equal or exceed total amount", "warning");
      return;
    }

    setProcessing(true);
    try {
      const checkoutPayload = {
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          barcode: item.barcode,
          qty: item.qty,
          cost_price: item.cost_price,
          selling_price: item.selling_price,
          gst_rate: item.gst_rate,
          hsn_code: item.hsn_code || '',
          tax_inclusive: Boolean(item.tax_inclusive),
          discount_percent: item.discount_percent || 0,
          subtotal: item.subtotal
        })),
        customer_id: cartCustomer?.id || 'CUST-00',
        customer_name: cartCustomer?.name || 'Walk-in Retail Customer',
        customer_phone: cartCustomer?.phone || null,
        customer_gstin: cartCustomer?.gstin || null,
        customer_state: cartCustomer?.state || null,
        payment_method: method.toLowerCase(),
        cash_tendered: method === 'Cash' ? Number(cashTendered) : null,
        change_returned: method === 'Cash' ? changeDue : 0,
        coupon_code: cartTotals.appliedCoupon?.code || null,
        discount_amount: cartTotals.totalDiscountAmount || 0,
        payment_details: {
          reference: method === 'Card' ? cardRef : null,
          cash_amount: method === 'Split' ? Number(splitCash) : null,
          upi_amount: method === 'Split' ? Number(splitUpi) : null
        }
      };

      const res = await api.checkout(checkoutPayload);
      if (res.success) {
        soundFx.billingSuccess(); // 💵 Iconic cash register "Cha-Ching!" & bell chime
        showToast(`Checkout successful! Invoice #${res.data.invoice_no}`, 'success');
        await refreshItems();
        clearCart();
        
        // Auto-print thermal bill if enabled by cashier
        const autoPrint = localStorage.getItem('pos_auto_print_receipt') === 'true';
        if (autoPrint) {
          try {
            printThermalReceipt(res.data, settings);
          } catch (printErr) {
            console.warn("Auto-print error:", printErr);
          }
        }

        setModalState({ type: 'receipt', data: res.data });
      } else {
        showToast(res.message || res.error || "Checkout failed", 'danger');
      }
    } catch (err) {
      showToast("Error processing payment: " + err.message, 'danger');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setModalState({ type: null, data: null })}>
      <div className="modal-dialog" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Complete Payment & Checkout</h2>
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>{cartTotals.itemCount} items</span>
              {cartTotals.appliedCoupon && (
                <span style={{ 
                  background: 'rgba(16,185,129,0.12)', 
                  color: 'var(--accent-emerald)', 
                  padding: '1px 6px', 
                  borderRadius: '4px',
                  fontWeight: '700',
                  fontSize: '11px'
                }}>
                  🏷️ {cartTotals.appliedCoupon.code} (-₹{cartTotals.couponDiscount})
                </span>
              )}
              <span>Grand Total: <strong style={{ color: 'var(--accent-emerald)', fontSize: '15px' }}>₹{totalAmount.toLocaleString('en-IN')}</strong></span>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setModalState({ type: null, data: null })}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* GST & Bill Breakdown Card */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: '16px',
            fontSize: '12.5px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px dashed var(--border-color)' }}>
              <div style={{ fontWeight: '700', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📜 {cartCustomer?.gstin ? 'B2B TAX INVOICE' : 'B2C RETAIL INVOICE'}</span>
                {cartCustomer?.gstin && (
                  <span style={{ fontSize: '10px', background: 'rgba(59, 130, 246, 0.15)', padding: '1px 6px', borderRadius: '4px' }}>
                    GSTIN: {cartCustomer.gstin}
                  </span>
                )}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {cartTotals.isInterstate ? '🌐 Inter-State (IGST)' : '🏠 Intra-State (CGST + SGST)'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', color: 'var(--text-secondary)' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Taxable Value:</span>{' '}
                <strong>₹{cartTotals.taxableAmount?.toLocaleString('en-IN') ?? '0.00'}</strong>
              </div>

              {cartTotals.isInterstate ? (
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>IGST:</span>{' '}
                  <strong style={{ color: 'var(--accent-blue)' }}>₹{cartTotals.igstAmount?.toFixed(2) ?? '0.00'}</strong>
                </div>
              ) : (
                <>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>CGST:</span>{' '}
                    <strong style={{ color: 'var(--accent-blue)' }}>₹{cartTotals.cgstAmount?.toFixed(2) ?? '0.00'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>SGST:</span>{' '}
                    <strong style={{ color: 'var(--accent-blue)' }}>₹{cartTotals.sgstAmount?.toFixed(2) ?? '0.00'}</strong>
                  </div>
                </>
              )}

              {cartTotals.roundOff !== 0 && (
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Round Off:</span>{' '}
                  <span>{cartTotals.roundOff > 0 ? `+₹${cartTotals.roundOff}` : `-₹${Math.abs(cartTotals.roundOff)}`}</span>
                </div>
              )}
            </div>
          </div>

          {/* Method selector tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', marginBottom: '20px' }}>
            <button 
              type="button"
              className={`btn ${method === 'UPI' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMethod('UPI')}
              style={{ flexDirection: 'column', padding: '12px 6px', gap: '4px' }}
            >
              <QrCode size={18} />
              <span style={{ fontSize: '12px' }}>UPI QR</span>
            </button>
            <button 
              type="button"
              className={`btn ${method === 'Cash' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMethod('Cash')}
              style={{ flexDirection: 'column', padding: '12px 6px', gap: '4px' }}
            >
              <Banknote size={18} />
              <span style={{ fontSize: '12px' }}>Cash</span>
            </button>
            <button 
              type="button"
              className={`btn ${method === 'Card' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMethod('Card')}
              style={{ flexDirection: 'column', padding: '12px 6px', gap: '4px' }}
            >
              <CreditCard size={18} />
              <span style={{ fontSize: '12px' }}>Card</span>
            </button>
            <button 
              type="button"
              className={`btn ${method === 'Split' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMethod('Split')}
              style={{ flexDirection: 'column', padding: '12px 6px', gap: '4px' }}
            >
              <Split size={18} />
              <span style={{ fontSize: '12px' }}>Split Pay</span>
            </button>
          </div>

          {/* Method content */}
          {method === 'UPI' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '14px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px' }}>Scan with GPay / PhonePe / Paytm / Any UPI App</div>
              {upiQrDataUrl ? (
                <div style={{ padding: '8px', background: '#fff', borderRadius: '8px', marginBottom: '12px', display: 'inline-block' }}>
                  <img src={upiQrDataUrl} alt="UPI QR" style={{ width: '180px', height: '180px', display: 'block' }} />
                </div>
              ) : (
                <div style={{ width: '180px', height: '180px', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                  Loading QR...
                </div>
              )}
              <div style={{ fontSize: '16px', fontWeight: '900', color: 'var(--accent-emerald)' }}>
                ₹{totalAmount.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Instant direct settlement to store merchant VPA
              </div>
            </div>
          )}

          {method === 'Cash' && (
            <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)' }}>
              <div className="form-group">
                <label>Cash Received from Customer (₹) *</label>
                <input 
                  type="number" 
                  className="form-control" 
                  style={{ fontSize: '18px', fontWeight: '800' }}
                  value={cashTendered} 
                  onChange={e => setCashTendered(e.target.value)} 
                  placeholder={`Min ₹${totalAmount}`}
                  autoFocus
                />
              </div>

              {/* Quick cash buttons */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {[totalAmount, Math.ceil(totalAmount / 500) * 500, Math.ceil(totalAmount / 1000) * 1000, 2000, 5000].filter((v, i, a) => v >= totalAmount && a.indexOf(v) === i).map((amt, idx) => (
                  <button 
                    key={idx} 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    onClick={() => setCashTendered(String(amt))}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '13px', fontWeight: '700' }}>Change Return to Customer:</span>
                <span style={{ fontSize: '18px', fontWeight: '900', color: 'var(--accent-amber)' }}>
                  ₹{changeDue.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}

          {method === 'Card' && (
            <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)' }}>
              <div className="form-group">
                <label>Card Transaction / Approval Code (Optional)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={cardRef} 
                  onChange={e => setCardRef(e.target.value)} 
                  placeholder="e.g. TXN-948271" 
                />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Swipe or tap customer card on EDC POS terminal for ₹{totalAmount.toLocaleString('en-IN')}.
              </div>
            </div>
          )}

          {method === 'Split' && (
            <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)' }}>
              <div className="form-row">
                <div className="form-col form-group">
                  <label>Cash Amount (₹)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={splitCash} 
                    onChange={e => {
                      setSplitCash(e.target.value);
                      const remaining = totalAmount - Number(e.target.value || 0);
                      setSplitUpi(remaining > 0 ? String(remaining) : '0');
                    }} 
                  />
                </div>
                <div className="form-col form-group">
                  <label>UPI / Digital Amount (₹)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={splitUpi} 
                    onChange={e => setSplitUpi(e.target.value)} 
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => setModalState({ type: null, data: null })}>
            Cancel
          </button>
          <button type="button" className="btn btn-success btn-lg" onClick={handleCheckout} disabled={processing}>
            <Check size={18} />
            {processing ? "Processing Bill..." : `Confirm Payment ₹${totalAmount.toLocaleString('en-IN')}`}
          </button>
        </div>
      </div>
    </div>
  );
}
