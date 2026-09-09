import JsBarcode from 'jsbarcode';

/**
 * Generates a PNG data URL for a Code128 barcode
 */
function generateBarcodeDataUrl(value) {
  if (!value) return null;
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, String(value), {
      format: "CODE128",
      width: 1.25,
      height: 32,
      displayValue: true,
      font: "monospace",
      fontOptions: "bold",
      fontSize: 9.5,
      margin: 2
    });
    return canvas.toDataURL('image/png');
  } catch (e) {
    console.warn("JsBarcode error in receipt printer:", e);
    return null;
  }
}

/**
 * Builds clean, high-precision thermal receipt HTML for 80mm or 58mm roll printers
 */
export function buildReceiptHtml(invoice, settings = {}, paperSize = '80mm', barcodeDataUrl = null) {
  const storeName = settings.store_name || "TIORAS";
  const tagline = settings.store_tagline || settings.tagline || "Fashion Studio";
  const address = settings.store_address || settings.address || "";
  const phone = settings.store_phone || settings.phone || "";
  const gstin = settings.store_gstin || settings.gstin || "";
  const logoUrl = settings.logo_url || "";
  const headerTitle = settings.receipt_header || "TAX INVOICE / CASH MEMO";
  const footerText = settings.receipt_footer || `Thank you for shopping at ${storeName}!\nExchange within 7 days with original bill & tag.`;

  const is58 = paperSize === '58mm';
  const printableWidth = is58 ? '48mm' : '72mm';
  const fontSize = is58 ? '9px' : '10.5px';
  const storeTitleSize = is58 ? '13px' : '15px';

  const dateStr = invoice.created_at 
    ? new Date(invoice.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
    : new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });

  const items = invoice.items || [];
  const totalQty = items.reduce((acc, i) => acc + (Number(i.qty) || 1), 0);
  const subtotal = Number(invoice.subtotal || invoice.grand_total || 0);
  const discountTotal = Number(invoice.discount_total || invoice.discount_amount || 0);
  const totalTax = Number(invoice.total_tax || 0);
  const grandTotal = Number(invoice.grand_total || 0);

  // Tax breakdown (CGST & SGST 50-50 split for intra-state standard in Indian retail)
  const cgst = totalTax > 0 ? (totalTax / 2).toFixed(2) : '0.00';
  const sgst = totalTax > 0 ? (totalTax / 2).toFixed(2) : '0.00';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt #${invoice.invoice_no || 'DRAFT'}</title>
  <style>
    @page {
      size: ${is58 ? '58mm auto' : '80mm auto'};
      margin: 0mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
      width: 100%;
    }
    .receipt-wrapper {
      width: ${printableWidth};
      margin: 0 auto;
      padding: ${is58 ? '2mm 1mm 12mm 1mm' : '3mm 2mm 15mm 2mm'};
      font-family: 'Courier New', Courier, monospace, -apple-system, sans-serif;
      font-size: ${fontSize};
      line-height: 1.25;
      color: #000000;
      background: #ffffff;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .bold { font-weight: bold; }
    .bolder { font-weight: 900; }
    
    .store-logo-img {
      max-height: ${is58 ? '45px' : '60px'};
      max-width: ${is58 ? '140px' : '180px'};
      object-fit: contain;
      display: block;
      margin: 0 auto 4px auto;
    }
    .store-name-title {
      font-size: ${storeTitleSize};
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin: 2px 0;
    }
    .store-sub {
      font-size: ${is58 ? '8px' : '9.5px'};
      color: #111;
      margin-bottom: 2px;
    }
    .header-badge {
      display: inline-block;
      border: 1px solid #000;
      padding: 1px 6px;
      font-size: ${is58 ? '8px' : '9px'};
      font-weight: bold;
      text-transform: uppercase;
      margin: 3px 0;
    }
    .dashed-line {
      border-bottom: 1px dashed #000000;
      margin: 4px 0;
      width: 100%;
    }
    .double-line {
      border-bottom: 2px solid #000000;
      margin: 5px 0;
      width: 100%;
    }
    .meta-grid {
      display: flex;
      justify-content: space-between;
      font-size: ${is58 ? '8px' : '9.5px'};
      margin-bottom: 2px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 4px 0;
    }
    .items-table th {
      border-bottom: 1px dashed #000000;
      padding: 3px 0;
      font-size: ${is58 ? '8px' : '9.5px'};
      font-weight: 900;
    }
    .items-table td {
      padding: 3px 0;
      vertical-align: top;
      font-size: ${fontSize};
    }
    .item-name-cell {
      padding-right: 4px;
      word-break: break-word;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 1.5px 0;
      font-size: ${is58 ? '8.5px' : '10px'};
    }
    .grand-total-block {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: ${is58 ? '13px' : '15px'};
      font-weight: 900;
      padding: 4px 0;
    }
    .barcode-box {
      text-align: center;
      margin: 6px 0 2px 0;
    }
    .barcode-svg-img {
      max-width: 95%;
      height: auto;
      display: block;
      margin: 0 auto;
    }
    .footer-policy {
      font-size: ${is58 ? '7.5px' : '9px'};
      text-align: center;
      white-space: pre-line;
      margin-top: 4px;
      line-height: 1.3;
    }
    .cut-spacing {
      height: 14mm;
    }
  </style>
</head>
<body>
  <div class="receipt-wrapper">
    <!-- STORE BRANDING -->
    <div class="text-center">
      ${logoUrl ? `<img src="${logoUrl}" alt="${storeName}" class="store-logo-img" />` : ''}
      <div class="store-name-title">${storeName}</div>
      ${tagline ? `<div class="store-sub bold">${tagline}</div>` : ''}
      ${address ? `<div class="store-sub">${address}</div>` : ''}
      <div class="store-sub">
        ${gstin ? `GSTIN: ${gstin}` : ''}
        ${phone ? `${gstin ? ' | ' : ''}Tel: ${phone}` : ''}
      </div>
      <div class="header-badge">${headerTitle}</div>
    </div>

    <div class="dashed-line"></div>

    <!-- INVOICE METADATA -->
    <div class="meta-grid">
      <span><strong>INV:</strong> #${invoice.invoice_no || 'WALK-IN'}</span>
      <span>${dateStr}</span>
    </div>
    <div class="meta-grid">
      <span><strong>Cashier:</strong> Counter #1</span>
      <span><strong>Pay:</strong> ${(invoice.payment_method || 'Cash').toUpperCase()}</span>
    </div>
    ${(invoice.customer_name && invoice.customer_name !== 'Walk-in Retail Customer') ? `
      <div class="meta-grid">
        <span><strong>Cust:</strong> ${invoice.customer_name}</span>
        <span>${invoice.customer_phone || ''}</span>
      </div>
    ` : ''}

    <div class="dashed-line"></div>

    <!-- ITEM DETAILS TABLE -->
    <table class="items-table">
      <thead>
        <tr>
          <th class="text-left">ITEM</th>
          <th class="text-center" style="width: 15%;">QTY</th>
          <th class="text-right" style="width: 25%;">RATE</th>
          <th class="text-right" style="width: 28%;">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td class="item-name-cell">
              <div class="bold">${item.name}</div>
              ${item.sku || item.rack_name ? `
                <div style="font-size: ${is58 ? '7px' : '8.5px'}; color: #222;">
                  ${item.sku ? `SKU: ${item.sku}` : ''} ${item.rack_name ? `[${item.rack_name}]` : ''}
                </div>
              ` : ''}
            </td>
            <td class="text-center bold">${item.qty}</td>
            <td class="text-right">₹${Number(item.selling_price || 0).toLocaleString('en-IN')}</td>
            <td class="text-right bolder">₹${Number(item.subtotal || (item.qty * item.selling_price) || 0).toLocaleString('en-IN')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="dashed-line"></div>

    <!-- SUMMARY & TOTALS -->
    <div class="totals-row">
      <span>Subtotal (${items.length} items, ${totalQty} pcs):</span>
      <span>₹${subtotal.toLocaleString('en-IN')}</span>
    </div>
    ${discountTotal > 0 ? `
      <div class="totals-row bold">
        <span>Discount Savings:</span>
        <span>-₹${discountTotal.toLocaleString('en-IN')}</span>
      </div>
    ` : ''}
    ${totalTax > 0 ? `
      <div class="totals-row" style="font-size: ${is58 ? '7.5px' : '9px'};">
        <span>CGST (Included):</span>
        <span>₹${cgst}</span>
      </div>
      <div class="totals-row" style="font-size: ${is58 ? '7.5px' : '9px'};">
        <span>SGST (Included):</span>
        <span>₹${sgst}</span>
      </div>
    ` : ''}

    <div class="double-line"></div>

    <div class="grand-total-block">
      <span>GRAND TOTAL:</span>
      <span>₹${grandTotal.toLocaleString('en-IN')}</span>
    </div>

    <div class="double-line"></div>

    <!-- TENDER & PAYMENT DETAILS -->
    ${invoice.payment_method === 'Cash' || invoice.payment_method === 'cash' ? `
      ${invoice.cash_tendered ? `
        <div class="totals-row">
          <span>Cash Tendered:</span>
          <span>₹${Number(invoice.cash_tendered).toLocaleString('en-IN')}</span>
        </div>
        <div class="totals-row bold">
          <span>Change Returned:</span>
          <span>₹${Number(invoice.change_returned || 0).toLocaleString('en-IN')}</span>
        </div>
      ` : ''}
    ` : ''}
    ${invoice.payment_details?.reference ? `
      <div class="totals-row">
        <span>Reference / Auth:</span>
        <span>${invoice.payment_details.reference}</span>
      </div>
    ` : ''}

    <!-- BARCODE FOR RETURN / AUDIT SCANNING -->
    ${barcodeDataUrl ? `
      <div class="barcode-box">
        <img src="${barcodeDataUrl}" alt="${invoice.invoice_no}" class="barcode-svg-img" />
      </div>
    ` : ''}

    <!-- FOOTER POLICY & CUT SPACE -->
    <div class="dashed-line"></div>
    <div class="footer-policy">
      ${footerText}
    </div>

    <!-- Auto-cutter clearance feed spacing -->
    <div class="cut-spacing"></div>
  </div>
</body>
</html>`;
}

/**
 * Isolated, non-destructive Thermal Receipt Printer
 * Spawns a dedicated hidden iframe, renders receipt HTML, waits for asset rendering, and calls print.
 */
export function printThermalReceipt(invoice, settings = {}, options = {}) {
  if (!invoice) {
    console.warn("printThermalReceipt called with no invoice data");
    return;
  }

  const paperSize = options.paperSize || localStorage.getItem('pos_receipt_paper_size') || '80mm';
  const barcodeDataUrl = generateBarcodeDataUrl(invoice.invoice_no);
  const receiptHtml = buildReceiptHtml(invoice, settings, paperSize, barcodeDataUrl);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.setAttribute('title', 'POS Thermal Print Runner');
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(receiptHtml);
  doc.close();

  const executePrint = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (err) {
      console.error("Iframe thermal print error, fallback to window.print:", err);
      window.print();
    } finally {
      setTimeout(() => {
        try {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        } catch (e) {}
      }, 2500);
    }
  };

  // Wait for any embedded images (logo, barcode) to decode
  const images = doc.getElementsByTagName('img');
  if (images.length > 0) {
    let pending = images.length;
    const onImgComplete = () => {
      pending--;
      if (pending <= 0) {
        setTimeout(executePrint, 60);
      }
    };
    for (let i = 0; i < images.length; i++) {
      if (images[i].complete) {
        onImgComplete();
      } else {
        images[i].onload = onImgComplete;
        images[i].onerror = onImgComplete;
      }
    }
    // Safety fallback in case image load event didn't trigger
    setTimeout(executePrint, 600);
  } else {
    setTimeout(executePrint, 80);
  }
}
