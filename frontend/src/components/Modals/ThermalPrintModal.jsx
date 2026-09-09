import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Printer, Barcode as BarcodeIcon } from 'lucide-react';
import JsBarcode from 'jsbarcode';

export default function ThermalPrintModal() {
  const { modalState, setModalState, settings } = useApp();
  const data = modalState.data || {};
  const items = data.items || [];
  const printContainerRef = useRef(null);

  useEffect(() => {
    // Generate barcodes for each item in the print container
    items.forEach((item, index) => {
      const el = document.getElementById(`thermal-barcode-${index}`);
      if (el && (item.barcode || item.sku)) {
        try {
          JsBarcode(el, String(item.barcode || item.sku), {
            format: 'CODE128',
            width: 1.3,
            height: 32,
            displayValue: true,
            fontSize: 10,
            margin: 2
          });
        } catch (e) {
          console.error('Barcode render error:', e);
        }
      }
    });
  }, [items]);

  const handlePrint = () => {
    if (!printContainerRef.current) return;

    // Isolate into iframe for thermal 80mm roll printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Stock Inward Slip</title>
  <style>
    @page { size: 80mm auto; margin: 0mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { margin: 0; padding: 3mm 2mm 15mm 2mm; width: 72mm; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #000; background: #fff; line-height: 1.25; }
    .slip-box { width: 100%; margin: 0 auto; }
    svg { max-width: 95%; height: auto; display: block; margin: 2px auto; }
  </style>
</head>
<body>
  <div class="slip-box">
    ${printContainerRef.current.innerHTML}
  </div>
</body>
</html>`);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        window.print();
      } finally {
        setTimeout(() => {
          try {
            if (iframe.parentNode) document.body.removeChild(iframe);
          } catch (err) {}
        }, 2500);
      }
    }, 150);
  };

  return (
    <div className="modal-overlay" onClick={() => setModalState({ type: null, data: null })}>
      <div 
        className="modal-dialog" 
        style={{ maxWidth: '440px', padding: '18px', borderRadius: '16px', background: 'var(--bg-surface)' }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '16px' }}>
            <Printer size={18} color="var(--accent-blue)" />
            <span>Thermal Label & Inward Slip</span>
          </div>
          <button 
            className="btn btn-secondary btn-sm" 
            style={{ borderRadius: '50%', width: '28px', height: '28px', padding: 0 }}
            onClick={() => setModalState({ type: null, data: null })}
          >
            <X size={15} />
          </button>
        </div>

        {/* Printable Thermal Container */}
        <div 
          ref={printContainerRef}
          style={{
            background: '#ffffff',
            color: '#000000',
            padding: '16px',
            borderRadius: '8px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            maxHeight: '400px',
            overflowY: 'auto',
            border: '1px solid #d1d5db',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '10px' }}>
            <div style={{ fontWeight: '900', fontSize: '14px' }}>{settings.store_name || "RETAIL STUDIO"}</div>
            <div style={{ fontSize: '10px' }}>STOCK INWARD / RECEIVING SLIP</div>
            <div style={{ fontSize: '10px' }}>Invoice: {data.invoiceNo || 'INV-RECEIVE'} | {data.date || new Date().toISOString().slice(0, 10)}</div>
            {data.vendor && <div style={{ fontSize: '10px' }}>Vendor: {data.vendor.name} ({data.vendor.gstin || ''})</div>}
          </div>

          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              No items selected for printing. Add items to the cart to preview thermal slips.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {items.map((item, idx) => (
                <div key={idx} style={{ textAlign: 'center', borderBottom: idx < items.length - 1 ? '1px dashed #ccc' : 'none', paddingBottom: '10px' }}>
                  <div style={{ fontWeight: '800', fontSize: '12px', marginBottom: '2px' }}>{item.name}</div>
                  <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span>MRP: ₹{item.mrp || item.selling_price}</span>
                    <span>SALE: ₹{item.selling_price}</span>
                    <span>QTY: {item.qty}</span>
                  </div>
                  <svg id={`thermal-barcode-${idx}`} style={{ maxWidth: '100%', height: 'auto' }}></svg>
                </div>
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', borderTop: '1px dashed #000', paddingTop: '8px', marginTop: '10px', fontSize: '9px' }}>
            Verified & Received Into Inventory
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
          <button className="btn btn-secondary" onClick={() => setModalState({ type: null, data: null })}>
            Close
          </button>
          <button className="btn btn-primary" onClick={handlePrint} disabled={items.length === 0}>
            <Printer size={15} /> Print Thermal Slip (80mm)
          </button>
        </div>
      </div>
    </div>
  );
}
