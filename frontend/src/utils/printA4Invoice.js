/**
 * printA4Invoice.js — Professional A4 GST Tax Invoice Generator
 * Standard Indian GST Format for B2B and B2C Retail & Wholesale
 */

/**
 * Converts a number into Indian Rupee currency words
 */
export function numberToWordsIndian(num) {
  if (num === 0) return 'Zero Rupees Only';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = ('000000000' + Math.floor(Math.abs(num))).substr(-9);
  const crore = Number(n.substr(0, 2));
  const lakh = Number(n.substr(2, 2));
  const thousand = Number(n.substr(4, 2));
  const hundred = Number(n.substr(6, 1));
  const rest = Number(n.substr(7, 2));

  let str = '';
  if (crore > 0) str += (crore < 20 ? a[crore] : b[Math.floor(crore / 10)] + ' ' + a[crore % 10]) + ' Crore ';
  if (lakh > 0) str += (lakh < 20 ? a[lakh] : b[Math.floor(lakh / 10)] + ' ' + a[lakh % 10]) + ' Lakh ';
  if (thousand > 0) str += (thousand < 20 ? a[thousand] : b[Math.floor(thousand / 10)] + ' ' + a[thousand % 10]) + ' Thousand ';
  if (hundred > 0) str += a[hundred] + ' Hundred ';
  if (rest > 0) {
    if (str !== '') str += 'and ';
    str += (rest < 20 ? a[rest] : b[Math.floor(rest / 10)] + ' ' + a[rest % 10]) + ' ';
  }

  const paise = Math.round((Math.abs(num) - Math.floor(Math.abs(num))) * 100);
  let paiseStr = '';
  if (paise > 0) {
    paiseStr = ' and ' + (paise < 20 ? a[paise] : b[Math.floor(paise / 10)] + ' ' + a[paise % 10]) + ' Paise';
  }

  return (str.trim() + ' Rupees' + paiseStr + ' Only').replace(/\s+/g, ' ');
}

/**
 * Builds HTML for A4 Tax Invoice
 */
export function buildA4InvoiceHtml(invoice, settings = {}) {
  const storeName = settings.legal_name || settings.store_name || "PAVATI OS";
  const tradeName = settings.trade_name || settings.store_name || "";
  const address = settings.store_address || "";
  const city = settings.store_city || "";
  const state = settings.store_state || "Maharashtra";
  const stateCode = settings.store_state_code || "27";
  const pincode = settings.store_pincode || "";
  const phone = settings.store_phone || "";
  const email = settings.email || "";
  const gstin = settings.store_gstin || "";
  const pan = settings.pan || "";
  const logoUrl = settings.logo_url || "";

  const isB2B = Boolean(invoice.customer_gstin || invoice.invoice_type === 'B2B');
  const invoiceTypeTitle = isB2B ? "TAX INVOICE" : "RETAIL INVOICE / CASH MEMO";

  const isInterstate = Boolean(invoice.is_interstate || (Number(invoice.igst_amount) > 0));

  const items = invoice.items || [];
  const taxableAmount = Number(invoice.taxable_amount || 0);
  const cgst = Number(invoice.cgst_amount || 0);
  const sgst = Number(invoice.sgst_amount || 0);
  const igst = Number(invoice.igst_amount || 0);
  const totalTax = Number(invoice.total_tax || invoice.tax_amount || 0);
  const discountTotal = Number(invoice.discount_total || invoice.discount_amount || 0);
  const roundOff = Number(invoice.round_off || 0);
  const grandTotal = Number(invoice.grand_total || 0);

  const dateStr = invoice.date 
    ? new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const timeStr = invoice.date 
    ? new Date(invoice.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Tax Invoice #${invoice.invoice_no || 'DRAFT'}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm;
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
      color: #1a1a1a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 11px;
      line-height: 1.4;
    }
    .invoice-box {
      width: 100%;
      max-width: 190mm;
      margin: 0 auto;
      border: 1.5px solid #333;
      padding: 12px;
      background: #ffffff;
    }
    .header-table {
      width: 100%;
      border-bottom: 1.5px solid #333;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .header-logo {
      max-height: 65px;
      max-width: 160px;
      object-fit: contain;
    }
    .company-title {
      font-size: 18px;
      font-weight: 800;
      color: #111;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .company-sub {
      font-size: 10.5px;
      color: #444;
      line-height: 1.35;
    }
    .invoice-title-badge {
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      color: #111;
      text-align: right;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }
    .meta-table td {
      border: 1px solid #ccc;
      padding: 6px 8px;
      vertical-align: top;
      font-size: 10.5px;
    }
    .meta-header {
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 2px;
    }
    .meta-val {
      font-weight: 700;
      color: #111;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }
    .items-table th {
      background: #f1f5f9;
      border: 1px solid #333;
      padding: 6px 4px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      text-align: center;
    }
    .items-table td {
      border: 1px solid #ccc;
      padding: 6px 5px;
      font-size: 10.5px;
    }
    .text-left { text-align: left; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: 700; }
    .summary-grid {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-top: 8px;
    }
    .summary-left {
      flex: 1.2;
      font-size: 10px;
    }
    .summary-right {
      flex: 1;
    }
    .totals-table {
      width: 100%;
      border-collapse: collapse;
    }
    .totals-table td {
      padding: 3px 6px;
      font-size: 11px;
    }
    .grand-total-row {
      background: #f8fafc;
      font-size: 13px !important;
      font-weight: 900;
      border-top: 1.5px solid #333;
      border-bottom: 1.5px solid #333;
    }
    .tax-analysis-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 9.5px;
    }
    .tax-analysis-table th {
      background: #f8fafc;
      border: 1px solid #bbb;
      padding: 4px;
      font-weight: 700;
      text-align: center;
    }
    .tax-analysis-table td {
      border: 1px solid #ccc;
      padding: 3px 4px;
      text-align: right;
    }
    .footer-sign {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 25px;
      padding-top: 10px;
      border-top: 1px solid #ccc;
    }
    .sign-box {
      text-align: center;
      min-width: 180px;
    }
    .sign-line {
      border-top: 1px dashed #444;
      margin-top: 40px;
      padding-top: 4px;
      font-size: 10px;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="invoice-box">
    <!-- Header -->
    <table class="header-table">
      <tr>
        <td style="width: 55%; vertical-align: top;">
          ${logoUrl ? `<img src="${logoUrl}" alt="${storeName}" class="header-logo" /><br/>` : ''}
          <div class="company-title">${storeName}</div>
          ${tradeName && tradeName !== storeName ? `<div style="font-weight:600; font-size:11px;">(Trading as: ${tradeName})</div>` : ''}
          <div class="company-sub">
            ${address ? `${address}, ` : ''}${city ? `${city} ` : ''}${pincode ? `- ${pincode}` : ''}<br/>
            State: <strong>${state}</strong> (Code: <strong>${stateCode}</strong>)<br/>
            ${gstin ? `GSTIN: <strong>${gstin}</strong> | ` : ''}${pan ? `PAN: <strong>${pan}</strong><br/>` : '<br/>'}
            ${phone ? `Phone: ${phone} ` : ''}${email ? `| Email: ${email}` : ''}
          </div>
        </td>
        <td style="width: 45%; vertical-align: top; text-align: right;">
          <div class="invoice-title-badge">${invoiceTypeTitle}</div>
          <div style="font-size: 10px; color: #555; margin-bottom: 8px;">(Original for Recipient)</div>
          <div style="font-size: 11px; line-height: 1.5;">
            Invoice No: <strong style="font-size: 13px; color: #000;">#${invoice.invoice_no || 'DRAFT'}</strong><br/>
            Date: <strong>${dateStr}</strong> (${timeStr})<br/>
            Place of Supply: <strong>${invoice.buyer_state || state}</strong> (${invoice.buyer_state_code || stateCode})<br/>
            Cashier: <strong>${invoice.cashier || 'Main Counter'}</strong>
          </div>
        </td>
      </tr>
    </table>

    <!-- Buyer Details -->
    <table class="meta-table">
      <tr>
        <td style="width: 50%;">
          <div class="meta-header">Billed To (Customer):</div>
          <div class="meta-val" style="font-size: 12px;">${invoice.customer_name || 'Walk-in Retail Customer'}</div>
          ${invoice.customer_phone ? `<div>Phone: <strong>${invoice.customer_phone}</strong></div>` : ''}
          ${invoice.customer?.address ? `<div>Address: ${invoice.customer.address}</div>` : ''}
          <div>State: <strong>${invoice.buyer_state || state}</strong> (Code: <strong>${invoice.buyer_state_code || stateCode}</strong>)</div>
          ${invoice.customer_gstin ? `<div style="margin-top:2px;">Customer GSTIN: <strong style="color: #0284c7;">${invoice.customer_gstin}</strong></div>` : ''}
        </td>
        <td style="width: 50%;">
          <div class="meta-header">Payment & Dispatch Summary:</div>
          <div>Payment Mode: <strong>${(invoice.payment_method || 'Cash').toUpperCase()}</strong></div>
          ${invoice.payment_details?.reference ? `<div>Ref / Approval: <strong>${invoice.payment_details.reference}</strong></div>` : ''}
          <div>Reverse Charge (RCM): <strong>No</strong></div>
          <div>Supply Type: <strong>${isInterstate ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}</strong></div>
        </td>
      </tr>
    </table>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 4%;">#</th>
          <th style="width: 34%;" class="text-left">Item Description</th>
          <th style="width: 10%;">HSN/SAC</th>
          <th style="width: 6%;">Qty</th>
          <th style="width: 10%;" class="text-right">Unit Rate (₹)</th>
          <th style="width: 12%;" class="text-right">Taxable Val (₹)</th>
          <th style="width: 8%;">GST %</th>
          <th style="width: 16%;" class="text-right">Total (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item, idx) => `
          <tr>
            <td class="text-center">${idx + 1}</td>
            <td>
              <div class="bold">${item.name}</div>
              ${item.sku ? `<span style="font-size: 9px; color: #666;">SKU: ${item.sku}</span>` : ''}
            </td>
            <td class="text-center font-mono">${item.hsn_code || '—'}</td>
            <td class="text-center bold">${item.qty} ${item.uom || 'Pcs'}</td>
            <td class="text-right">₹${Number(item.selling_price || item.unit_price || 0).toFixed(2)}</td>
            <td class="text-right bold">₹${Number(item.taxable_amount || item.line_total || 0).toFixed(2)}</td>
            <td class="text-center">${item.gst_rate || 12}%</td>
            <td class="text-right bold">₹${Number(item.line_total || item.subtotal || 0).toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Totals and Words -->
    <div class="summary-grid">
      <div class="summary-left">
        <div style="margin-bottom: 8px;">
          <span class="meta-header">Amount Chargeable (in words):</span>
          <div style="font-weight: 800; font-size: 11px; margin-top: 2px;">
            ${numberToWordsIndian(grandTotal)}
          </div>
        </div>

        <!-- GST Tax Analysis Breakup -->
        <div class="meta-header" style="margin-top: 10px;">Tax Breakdown Analysis:</div>
        <table class="tax-analysis-table">
          <thead>
            <tr>
              <th>GST Rate</th>
              <th>Taxable Amount</th>
              ${isInterstate ? `
                <th>IGST Amount</th>
              ` : `
                <th>CGST Amount</th>
                <th>SGST Amount</th>
              `}
              <th>Total Tax</th>
            </tr>
          </thead>
          <tbody>
            ${(invoice.tax_breakdown && invoice.tax_breakdown.length > 0) ? invoice.tax_breakdown.map(b => `
              <tr>
                <td class="text-center bold">${b.gst_rate}%</td>
                <td>₹${Number(b.taxable_amount || 0).toFixed(2)}</td>
                ${isInterstate ? `
                  <td>₹${Number(b.igst_amount || 0).toFixed(2)}</td>
                ` : `
                  <td>₹${Number(b.cgst_amount || 0).toFixed(2)}</td>
                  <td>₹${Number(b.sgst_amount || 0).toFixed(2)}</td>
                `}
                <td class="bold">₹${Number(b.total_tax || 0).toFixed(2)}</td>
              </tr>
            `).join('') : `
              <tr>
                <td class="text-center bold">Standard</td>
                <td>₹${taxableAmount.toFixed(2)}</td>
                ${isInterstate ? `
                  <td>₹${igst.toFixed(2)}</td>
                ` : `
                  <td>₹${cgst.toFixed(2)}</td>
                  <td>₹${sgst.toFixed(2)}</td>
                `}
                <td class="bold">₹${totalTax.toFixed(2)}</td>
              </tr>
            `}
          </tbody>
        </table>

        <!-- Terms -->
        <div style="margin-top: 12px; font-size: 9.5px; color: #555;">
          <strong>Terms & Conditions:</strong><br/>
          1. Goods once sold can be exchanged within 7 days with original bill and intact tags.<br/>
          2. No cash refunds. Credit notes are issued for eligible returns.<br/>
          3. Subject to local jurisdiction.
        </div>
      </div>

      <div class="summary-right">
        <table class="totals-table">
          <tr>
            <td>Subtotal (Taxable):</td>
            <td class="text-right bold">₹${taxableAmount.toFixed(2)}</td>
          </tr>
          ${discountTotal > 0 ? `
            <tr style="color: #059669;">
              <td>Discount Applied:</td>
              <td class="text-right bold">-₹${discountTotal.toFixed(2)}</td>
            </tr>
          ` : ''}
          ${isInterstate ? `
            <tr>
              <td>Integrated Tax (IGST):</td>
              <td class="text-right bold">₹${igst.toFixed(2)}</td>
            </tr>
          ` : `
            <tr>
              <td>Central Tax (CGST):</td>
              <td class="text-right bold">₹${cgst.toFixed(2)}</td>
            </tr>
            <tr>
              <td>State Tax (SGST):</td>
              <td class="text-right bold">₹${sgst.toFixed(2)}</td>
            </tr>
          `}
          <tr>
            <td>Total Tax:</td>
            <td class="text-right bold">₹${totalTax.toFixed(2)}</td>
          </tr>
          ${roundOff !== 0 ? `
            <tr>
              <td>Round Off:</td>
              <td class="text-right">${roundOff > 0 ? `+₹${roundOff.toFixed(2)}` : `-₹${Math.abs(roundOff).toFixed(2)}`}</td>
            </tr>
          ` : ''}
          <tr class="grand-total-row">
            <td><strong>TOTAL AMOUNT:</strong></td>
            <td class="text-right" style="color: #0f172a;"><strong>₹${grandTotal.toFixed(2)}</strong></td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Signatory Footer -->
    <div class="footer-sign">
      <div style="font-size: 9.5px; color: #666;">
        Electronic Invoice generated by PAVATI OS.<br/>
        Valid without physical seal.
      </div>
      <div class="sign-box">
        <div style="font-size: 10.5px; font-weight: 700;">For ${storeName}</div>
        <div class="sign-line">Authorised Signatory</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Triggers native browser print preview for A4 Tax Invoice
 */
export function printA4Invoice(invoice, settings = {}) {
  const html = buildA4InvoiceHtml(invoice, settings);
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow.focus();
  setTimeout(() => {
    try {
      iframe.contentWindow.print();
    } catch (e) {
      console.warn("Print error:", e);
    }
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1500);
  }, 350);
}
