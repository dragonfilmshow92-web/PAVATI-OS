import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Printer, CheckCircle, Settings2, FileText } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { printThermalReceipt } from '../../utils/printReceipt';
import { printA4Invoice } from '../../utils/printA4Invoice';

export default function ReceiptModal() {
  const { modalState, setModalState, settings } = useApp();
  const invoice = modalState.data;
  const barcodeSvgRef = useRef(null);

  const [paperSize, setPaperSize] = useState(() => {
    return localStorage.getItem('pos_receipt_paper_size') || '80mm';
  });

  const [autoPrint, setAutoPrint] = useState(() => {
    return localStorage.getItem('pos_auto_print_receipt') === 'true';
  });

  const handlePaperSizeChange = (size) => {
    setPaperSize(size);
    localStorage.setItem('pos_receipt_paper_size', size);
  };

  const handleAutoPrintToggle = (val) => {
    setAutoPrint(val);
    localStorage.setItem('pos_auto_print_receipt', String(val));
  };

  useEffect(() => {
    if (invoice?.invoice_no && barcodeSvgRef.current) {
      try {
        JsBarcode(barcodeSvgRef.current, String(invoice.invoice_no), {
          format: "CODE128",
          width: paperSize === '58mm' ? 1.05 : 1.35,
          height: paperSize === '58mm' ? 26 : 34,
          displayValue: true,
          font: "monospace",
          fontOptions: "bold",
          fontSize: paperSize === '58mm' ? 8.5 : 10,
          margin: 1
        });
      } catch (e) {
        console.warn("JsBarcode render error in modal:", e);
      }
    }
  }, [invoice?.invoice_no, paperSize]);

  // Keyboard shortcut listener: Enter to print, Escape to close
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handlePrint();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setModalState({ type: null, data: null });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [invoice, settings, paperSize]);

  if (!invoice) return null;

  const handlePrint = () => {
    printThermalReceipt(invoice, settings, { paperSize });
  };

  const items = invoice.items || [];
  const totalQty = items.reduce((acc, i) => acc + (Number(i.qty) || 1), 0);
  const is58 = paperSize === '58mm';
  const subtotal = Number(invoice.subtotal || invoice.grand_total || 0);
  const discountTotal = Number(invoice.discount_total || invoice.discount_amount || 0);
  const totalTax = Number(invoice.total_tax || 0);
  const grandTotal = Number(invoice.grand_total || 0);

  const dateFormatted = invoice.created_at 
    ? new Date(invoice.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) 
    : new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });

  return (
    <div className="modal-overlay" onClick={() => setModalState({ type: null, data: null })}>
      <div 
        className="modal-dialog" 
        style={{ maxWidth: '480px', borderRadius: '16px', overflow: 'hidden' }} 
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} color="var(--accent-emerald)" />
            <div>
              <h2 className="modal-title" style={{ fontSize: '15px' }}>Sale Completed & Billed</h2>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Invoice #{invoice.invoice_no} • ₹{grandTotal.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => setModalState({ type: null, data: null })}
            title="Close (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Paper Size & Controls Toolbar */}
        <div style={{ 
          padding: '10px 18px', 
          background: 'var(--bg-card-hover)', 
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          {/* Roll Size Segmented Control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Settings2 size={13} /> Roll:
            </span>
            <div style={{ display: 'flex', background: 'var(--bg-main)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                className={`btn btn-sm ${paperSize === '80mm' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '2px 8px', fontSize: '11px', borderRadius: '4px' }}
                onClick={() => handlePaperSizeChange('80mm')}
              >
                80mm (3")
              </button>
              <button
                type="button"
                className={`btn btn-sm ${paperSize === '58mm' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '2px 8px', fontSize: '11px', borderRadius: '4px' }}
                onClick={() => handlePaperSizeChange('58mm')}
              >
                58mm (2")
              </button>
            </div>
          </div>

          {/* Auto-print toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer', margin: 0, color: 'var(--text-muted)' }}>
            <input 
              type="checkbox" 
              checked={autoPrint} 
              onChange={(e) => handleAutoPrintToggle(e.target.checked)} 
            />
            <span>Auto-print on checkout</span>
          </label>
        </div>

        {/* Modal Body: Realistic Thermal Slip Preview */}
        <div 
          className="modal-body" 
          style={{ 
            background: '#e2e8f0', 
            padding: '16px', 
            maxHeight: '440px', 
            overflowY: 'auto',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          {/* Thermal Paper Slip */}
          <div 
            style={{ 
              background: '#ffffff', 
              color: '#000000', 
              width: is58 ? '220px' : '290px', 
              padding: is58 ? '10px 8px 18px 8px' : '14px 12px 22px 12px',
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: is58 ? '9.5px' : '11px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
              borderRadius: '3px',
              lineHeight: '1.25'
            }}
          >
            {/* Store Logo */}
            {settings.logo_url && (
              <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                <img 
                  src={settings.logo_url} 
                  alt={settings.store_name || "PAVATI OS"} 
                  style={{ 
                    maxHeight: is58 ? '45px' : '60px', 
                    maxWidth: is58 ? '140px' : '180px', 
                    objectFit: 'contain', 
                    display: 'block',
                    margin: '0 auto'
                  }} 
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            )}

            {/* Store Name & Info */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: '900', fontSize: is58 ? '13px' : '15px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {settings.store_name || "PAVATI OS"}
              </div>
              <div style={{ fontSize: is58 ? '8.5px' : '10px', fontWeight: 'bold' }}>
                {settings.store_tagline || settings.tagline || "PAVATI OS"}
              </div>
              {settings.store_address && (
                <div style={{ fontSize: is58 ? '8px' : '9.5px', color: '#333' }}>
                  {settings.store_address}
                </div>
              )}
              <div style={{ fontSize: is58 ? '8px' : '9.5px', color: '#333' }}>
                {settings.store_gstin ? `GSTIN: ${settings.store_gstin}` : ''}
                {settings.store_phone ? `${settings.store_gstin ? ' | ' : ''}Tel: ${settings.store_phone}` : ''}
              </div>
              <div style={{ display: 'inline-block', border: '1px solid #000', padding: '1px 6px', fontSize: is58 ? '8px' : '9px', fontWeight: 'bold', margin: '4px 0 2px 0' }}>
                {settings.receipt_header || "TAX INVOICE / CASH MEMO"}
              </div>
            </div>

            <div style={{ borderBottom: '1px dashed #000', margin: '5px 0' }}></div>

            {/* Metadata */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: is58 ? '8.5px' : '10px' }}>
              <span>INV: #{invoice.invoice_no}</span>
              <span>{dateFormatted}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: is58 ? '8.5px' : '10px' }}>
              <span>Cashier: Counter #1</span>
              <span>Pay: {(invoice.payment_method || 'Cash').toUpperCase()}</span>
            </div>
            {invoice.customer_name && invoice.customer_name !== 'Walk-in Retail Customer' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: is58 ? '8.5px' : '10px' }}>
                <span>Cust: {invoice.customer_name}</span>
                <span>{invoice.customer_phone || ''}</span>
              </div>
            )}

            <div style={{ borderBottom: '1px dashed #000', margin: '5px 0' }}></div>

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: is58 ? '8.5px' : '10px' }}>
              <thead>
                <tr style={{ borderBottom: '1px dashed #000' }}>
                  <th style={{ textAlign: 'left', paddingBottom: '3px' }}>ITEM</th>
                  <th style={{ textAlign: 'center', width: '15%', paddingBottom: '3px' }}>QTY</th>
                  <th style={{ textAlign: 'right', width: '25%', paddingBottom: '3px' }}>RATE</th>
                  <th style={{ textAlign: 'right', width: '28%', paddingBottom: '3px' }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} style={{ verticalAlign: 'top' }}>
                    <td style={{ padding: '2px 0' }}>
                      <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                      {(item.sku || item.rack_name) && (
                        <div style={{ fontSize: is58 ? '7px' : '8.5px', color: '#444' }}>
                          {item.sku || ''} {item.rack_name ? `[${item.rack_name}]` : ''}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', padding: '2px 0', fontWeight: 'bold' }}>{item.qty}</td>
                    <td style={{ textAlign: 'right', padding: '2px 0' }}>₹{Number(item.selling_price || 0).toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right', padding: '2px 0', fontWeight: 'bold' }}>
                      ₹{Number(item.subtotal || (item.qty * item.selling_price) || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ borderBottom: '1px dashed #000', margin: '5px 0' }}></div>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: is58 ? '8.5px' : '10px', padding: '1px 0' }}>
              <span>Subtotal ({items.length} items, {totalQty} pcs):</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            {discountTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: is58 ? '8.5px' : '10px', fontWeight: 'bold', color: '#000', padding: '1px 0' }}>
                <span>Discount:</span>
                <span>-₹{discountTotal.toLocaleString('en-IN')}</span>
              </div>
            )}
            {totalTax > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: is58 ? '7.5px' : '9px', padding: '1px 0' }}>
                <span>Tax (GST Included):</span>
                <span>₹{Math.round(totalTax)}</span>
              </div>
            )}

            <div style={{ borderBottom: '2px solid #000', margin: '4px 0' }}></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: is58 ? '13px' : '15px', fontWeight: '900', padding: '2px 0' }}>
              <span>GRAND TOTAL:</span>
              <span>₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>

            <div style={{ borderBottom: '2px solid #000', margin: '4px 0' }}></div>

            {/* Cash Tendered info */}
            {invoice.payment_method === 'Cash' && invoice.cash_tendered && (
              <div style={{ fontSize: is58 ? '8.5px' : '10px', padding: '1px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Cash Tendered:</span>
                  <span>₹{Number(invoice.cash_tendered).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span>Change Returned:</span>
                  <span>₹{Number(invoice.change_returned || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            {/* Barcode SVG */}
            <div style={{ textAlign: 'center', marginTop: '6px' }}>
              <svg ref={barcodeSvgRef} style={{ maxWidth: '95%', height: 'auto' }}></svg>
            </div>

            <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }}></div>

            {/* Return Policy / Footer */}
            <div style={{ fontSize: is58 ? '7.5px' : '9px', textAlign: 'center', whiteSpace: 'pre-line', lineHeight: '1.3' }}>
              {settings.receipt_footer || `Thank you for shopping with ${settings.store_name || "us"}!\nExchange within 7 days with original tag & invoice.`}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => setModalState({ type: null, data: null })}
          >
            New Sale (Esc)
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => printA4Invoice(invoice, settings)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
              title="Print standard A4 GST Tax Invoice"
            >
              <FileText size={15} /> A4 Tax Invoice
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handlePrint}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 18px', fontWeight: '700' }}
            >
              <Printer size={16} /> Print Thermal ({paperSize})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
