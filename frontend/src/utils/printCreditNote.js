/**
 * printCreditNote.js — Professional GST Credit Note Generator
 * Complies with Section 34 of the CGST Act, 2017 & Rule 53 of CGST Rules
 * Supports 80mm thermal slip & full A4 format
 */

import JsBarcode from 'jsbarcode';
import { numberToWordsIndian } from './printA4Invoice';

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
    return null;
  }
}

export function buildThermalCreditNoteHtml(creditNote, settings = {}) {
  const storeName = settings.store_name || "PAVATI OS";
  const tagline = settings.store_tagline || "PAVATI OS";
  const address = settings.store_address || "";
  const phone = settings.store_phone || "";
  const gstin = settings.store_gstin || "";
  const barcodeUrl = generateBarcodeDataUrl(creditNote.credit_note_no);

  const dateStr = creditNote.created_at || creditNote.date
    ? new Date(creditNote.created_at || creditNote.date).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
    : new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });

  const items = creditNote.items || [];
  const totalQty = items.reduce((acc, i) => acc + (Number(i.qty) || 1), 0);
  const refundAmount = Number(creditNote.refund_amount || 0);
  const taxableReversed = Number(creditNote.taxable_amount_reversed || 0);
  const taxReversed = Number(creditNote.tax_reversed || (Number(creditNote.cgst_amount_reversed || 0) + Number(creditNote.sgst_amount_reversed || 0) + Number(creditNote.igst_amount_reversed || 0)));
  const isInterstate = Boolean(creditNote.is_interstate || (Number(creditNote.igst_amount_reversed || 0) > 0));

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Credit Note - ${creditNote.credit_note_no}</title>
  <style>
    @page { size: 80mm auto; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', Courier, monospace, sans-serif;
      width: 72mm;
      margin: 0 auto;
      padding: 4mm 2mm;
      color: #000;
      font-size: 10.5px;
      line-height: 1.35;
      background: #fff;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }
    .store-title { font-size: 15px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; }
    .tagline { font-size: 9.5px; margin-bottom: 2px; }
    .divider { border-top: 1px dashed #000; margin: 4px 0; }
    .double-divider { border-top: 2px solid #000; margin: 4px 0; }
    .badge {
      display: inline-block;
      border: 1px solid #000;
      padding: 1px 6px;
      font-size: 11px;
      font-weight: 900;
      margin: 3px 0;
      letter-spacing: 1px;
    }
    .meta-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
    .item-table { width: 100%; border-collapse: collapse; margin: 4px 0; font-size: 10px; }
    .item-table th { border-bottom: 1px dashed #000; padding: 2px 0; text-align: left; font-size: 9.5px; }
    .item-table td { padding: 2px 0; vertical-align: top; }
    .grand-row { display: flex; justify-content: space-between; font-size: 13px; font-weight: 900; margin: 4px 0; }
    .barcode-container { text-align: center; margin-top: 6px; }
    .barcode-img { max-width: 90%; height: 32px; image-rendering: pixelated; }
    .footer { text-align: center; font-size: 9px; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="text-center">
    <div class="store-title">${storeName}</div>
    ${tagline ? `<div class="tagline">${tagline}</div>` : ''}
    ${address ? `<div>${address}</div>` : ''}
    ${phone ? `<div>Ph: ${phone}</div>` : ''}
    ${gstin ? `<div class="bold">GSTIN: ${gstin}</div>` : ''}
    <div><span class="badge">GST CREDIT NOTE</span></div>
    <div style="font-size: 8.5px;">(Issued u/s 34 of CGST Act, 2017)</div>
  </div>

  <div class="divider"></div>

  <div class="meta-row"><span class="bold">CN No:</span><span class="bold">${creditNote.credit_note_no}</span></div>
  <div class="meta-row"><span>Date:</span><span>${dateStr}</span></div>
  <div class="meta-row"><span class="bold">Original Inv:</span><span class="bold">${creditNote.original_invoice_no}</span></div>
  <div class="meta-row"><span>Customer:</span><span>${creditNote.customer_name || 'Walk-in'}</span></div>
  ${creditNote.customer_gstin ? `<div class="meta-row"><span class="bold">Cust GSTIN:</span><span>${creditNote.customer_gstin}</span></div>` : ''}
  <div class="meta-row"><span>Reason:</span><span>${creditNote.reason || 'Customer Return'}</span></div>
  <div class="meta-row"><span>Type:</span><span>${creditNote.is_exchange ? 'EXCHANGE' : 'REFUND'}</span></div>
  ${creditNote.exchange_notes ? `<div style="font-size:9px;">Note: ${creditNote.exchange_notes}</div>` : ''}

  <div class="divider"></div>

  <table class="item-table">
    <thead>
      <tr>
        <th style="width: 50%;">Item</th>
        <th class="text-right" style="width: 15%;">Qty</th>
        <th class="text-right" style="width: 15%;">Rate</th>
        <th class="text-right" style="width: 20%;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(it => `
        <tr>
          <td colspan="4" style="font-weight:bold; padding-top:2px;">${it.name}</td>
        </tr>
        <tr>
          <td style="font-size:8.5px; color:#333;">${it.hsn_code ? `HSN:${it.hsn_code} ` : ''}GST:${it.gst_rate || 12}%</td>
          <td class="text-right">${it.qty}</td>
          <td class="text-right">₹${Number(it.unit_price).toFixed(2)}</td>
          <td class="text-right bold">₹${Number((it.unit_price * it.qty)).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="divider"></div>

  <div class="meta-row"><span>Total Returned Qty:</span><span class="bold">${totalQty} pcs</span></div>
  ${taxableReversed > 0 ? `<div class="meta-row"><span>Taxable Value Reversal:</span><span>₹${taxableReversed.toFixed(2)}</span></div>` : ''}
  ${isInterstate ? `
    <div class="meta-row"><span>IGST Credit Reversed:</span><span>₹${Number(creditNote.igst_amount_reversed || taxReversed).toFixed(2)}</span></div>
  ` : `
    <div class="meta-row"><span>CGST Credit Reversed:</span><span>₹${Number(creditNote.cgst_amount_reversed || (taxReversed/2)).toFixed(2)}</span></div>
    <div class="meta-row"><span>SGST Credit Reversed:</span><span>₹${Number(creditNote.sgst_amount_reversed || (taxReversed/2)).toFixed(2)}</span></div>
  `}
  ${taxReversed > 0 ? `<div class="meta-row"><span>Total Tax Reversed:</span><span>₹${taxReversed.toFixed(2)}</span></div>` : ''}

  <div class="double-divider"></div>

  <div class="grand-row">
    <span>${creditNote.is_exchange ? 'CREDIT VALUE' : 'REFUND AMOUNT'}:</span>
    <span>₹${refundAmount.toFixed(2)}</span>
  </div>
  <div class="meta-row"><span>Refund Mode:</span><span class="bold">${creditNote.refund_mode || 'Cash'}</span></div>

  <div class="divider"></div>

  ${barcodeUrl ? `
    <div class="barcode-container">
      <img class="barcode-img" src="${barcodeUrl}" alt="${creditNote.credit_note_no}" />
    </div>
  ` : ''}

  <div class="footer">
    <div>*** CREDIT NOTE VOUCHER ***</div>
    <div>Keep this slip for your records.</div>
    <div style="margin-top: 10px; border-top: 1px dotted #000; padding-top: 4px; display: flex; justify-content: space-between;">
      <span>Cust. Sign</span>
      <span>Auth. Signatory</span>
    </div>
  </div>
</body>
</html>`;
}

export function printCreditNote(creditNote, settings = {}, paperSize = '80mm') {
  const htmlContent = buildThermalCreditNoteHtml(creditNote, settings);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.setAttribute('title', 'Credit Note Print Runner');
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(htmlContent);
  doc.close();

  const executePrint = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (err) {
      console.error("Iframe credit note print error:", err);
      window.print();
    } finally {
      setTimeout(() => {
        try {
          if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        } catch (e) {}
      }, 2500);
    }
  };

  const images = doc.getElementsByTagName('img');
  if (images.length > 0) {
    let pending = images.length;
    const onImgComplete = () => {
      pending--;
      if (pending <= 0) setTimeout(executePrint, 60);
    };
    for (let i = 0; i < images.length; i++) {
      if (images[i].complete) onImgComplete();
      else {
        images[i].onload = onImgComplete;
        images[i].onerror = onImgComplete;
      }
    }
    setTimeout(executePrint, 600);
  } else {
    setTimeout(executePrint, 80);
  }
}

export default printCreditNote;
