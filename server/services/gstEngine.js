/**
 * ============================================================================
 * Central GST Calculation Engine (server/services/gstEngine.js)
 * Compliant with Indian GST Act & Rules for Retail & Wholesale (B2C & B2B)
 * ============================================================================
 */

// Helper to round to 2 decimal places cleanly
const round2 = (num) => Math.round((Number(num) || 0) * 100) / 100;

/**
 * Standard Indian State Code Mapping (First 2 digits of GSTIN)
 */
const GST_STATE_CODES = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
  '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana',
  '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
  '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
  '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
  '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam',
  '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha',
  '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli and Daman & Diu', '27': 'Maharashtra',
  '28': 'Andhra Pradesh', '29': 'Karnataka', '30': 'Goa',
  '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu',
  '34': 'Puducherry', '35': 'Andaman & Nicobar Islands', '36': 'Telangana',
  '37': 'Andhra Pradesh (New)', '38': 'Ladakh', '97': 'Other Territory'
};

/**
 * Extract 2-digit state code from GSTIN or state string
 */
function extractStateCode(gstinOrState, stateCodeParam) {
  if (stateCodeParam && String(stateCodeParam).trim()) {
    return String(stateCodeParam).trim().padStart(2, '0');
  }

  const str = String(gstinOrState || '').trim();
  if (!str) return null;

  // Check if it's a 15-character GSTIN
  if (/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(str)) {
    return str.slice(0, 2);
  }

  // Check if it's a 2-digit number already
  if (/^\d{1,2}$/.test(str)) {
    return str.padStart(2, '0');
  }

  // Lookup by state name
  const match = Object.entries(GST_STATE_CODES).find(
    ([, name]) => name.toLowerCase() === str.toLowerCase()
  );
  return match ? match[0] : null;
}

/**
 * Calculate full GST for an invoice or cart
 * 
 * @param {Array} items - Array of line items
 * @param {Object} options - Calculation options (seller/buyer states, discounts, defaults)
 * @returns {Object} Comprehensive GST calculation result
 */
function calculateGST(items = [], options = {}) {
  const {
    seller_state = 'Maharashtra',
    seller_state_code = '27',
    seller_gstin = '',
    buyer_state = '',
    buyer_state_code = '',
    customer_gstin = '',
    discount_amount = 0, // Cart-level discount (or coupon discount)
    default_tax_rate = 12,
    default_tax_inclusive = false
  } = options;

  // Determine seller state code
  const resolvedSellerCode = extractStateCode(seller_gstin || seller_state, seller_state_code) || '27';
  
  // Determine buyer state code
  const resolvedBuyerCode = extractStateCode(customer_gstin || buyer_state, buyer_state_code);

  // Interstate check:
  // If buyer state is not specified, it's a local walk-in retail customer -> Intra-state
  // If buyer state is specified and differs from seller state -> Inter-state (IGST)
  const is_interstate = Boolean(
    resolvedBuyerCode && 
    resolvedSellerCode && 
    resolvedBuyerCode !== resolvedSellerCode
  );

  // First pass: Calculate individual line items before cart-level discounts
  let rawItems = items.map(item => {
    const qty = Math.max(0, Number(item.qty) || 1);
    const unit_price = Number(item.unit_price ?? item.selling_price) || 0;
    const gross_amount = round2(unit_price * qty);

    // Line item discount
    const discount_pct = Math.max(0, Math.min(100, Number(item.discount_percent || item.discount_pct || 0)));
    const item_discount = round2((gross_amount * discount_pct) / 100);
    const net_amount = round2(Math.max(0, gross_amount - item_discount));

    const gst_rate = Number(item.gst_rate !== undefined && !isNaN(Number(item.gst_rate)) ? item.gst_rate : default_tax_rate);
    const tax_inclusive = item.tax_inclusive !== undefined 
      ? Boolean(item.tax_inclusive) 
      : Boolean(default_tax_inclusive);

    return {
      item_id: item.id || item.item_id,
      id: item.id || item.item_id,
      name: item.name || 'Product',
      sku: item.sku || '',
      barcode: item.barcode || '',
      category: item.category || '',
      qty,
      unit_price,
      selling_price: unit_price,
      cost_price: Number(item.cost_price || 0),
      hsn_code: item.hsn_code ? String(item.hsn_code).trim() : '',
      discount_pct,
      item_discount,
      gross_amount,
      net_amount,
      gst_rate,
      tax_inclusive,
      rack_name: item.rack_name || item.rack_location || 'Rack A-01'
    };
  });

  const rawSubtotal = rawItems.reduce((sum, item) => sum + item.net_amount, 0);
  const totalCartDiscount = Math.min(rawSubtotal, Math.max(0, Number(discount_amount) || 0));

  // Second pass: Apportion cart discount pro-rata and compute precise taxable amount & taxes
  const processedItems = rawItems.map(item => {
    // Pro-rata cart-level discount share
    const cartDiscountShare = rawSubtotal > 0 
      ? round2((item.net_amount / rawSubtotal) * totalCartDiscount) 
      : 0;

    const finalLineAmount = Math.max(0, round2(item.net_amount - cartDiscountShare));

    let taxable_amount = 0;
    let tax_amount = 0;
    let line_total = 0;

    if (item.tax_inclusive) {
      // Back-calculate: Net price includes tax
      taxable_amount = round2(finalLineAmount / (1 + item.gst_rate / 100));
      tax_amount = round2(finalLineAmount - taxable_amount);
      line_total = finalLineAmount;
    } else {
      // Forward-calculate: Tax added on top of taxable value
      taxable_amount = finalLineAmount;
      tax_amount = round2(taxable_amount * (item.gst_rate / 100));
      line_total = round2(taxable_amount + tax_amount);
    }

    let cgst_rate = 0;
    let sgst_rate = 0;
    let igst_rate = 0;
    let cgst_amount = 0;
    let sgst_amount = 0;
    let igst_amount = 0;

    if (is_interstate) {
      igst_rate = item.gst_rate;
      igst_amount = tax_amount;
    } else {
      cgst_rate = round2(item.gst_rate / 2);
      sgst_rate = round2(item.gst_rate / 2);
      cgst_amount = round2(tax_amount / 2);
      sgst_amount = round2(tax_amount - cgst_amount); // preserve cents exact sum
    }

    return {
      ...item,
      cart_discount_share: cartDiscountShare,
      final_net_amount: finalLineAmount,
      taxable_amount,
      tax_amount,
      total_tax: tax_amount,
      cgst_rate,
      sgst_rate,
      igst_rate,
      cgst_amount,
      sgst_amount,
      igst_amount,
      line_total,
      subtotal: line_total
    };
  });

  // Aggregates
  const total_taxable = round2(processedItems.reduce((acc, i) => acc + i.taxable_amount, 0));
  const total_cgst = round2(processedItems.reduce((acc, i) => acc + i.cgst_amount, 0));
  const total_sgst = round2(processedItems.reduce((acc, i) => acc + i.sgst_amount, 0));
  const total_igst = round2(processedItems.reduce((acc, i) => acc + i.igst_amount, 0));
  const total_tax = round2(is_interstate ? total_igst : (total_cgst + total_sgst));

  // Invoice Subtotal (Gross before cart discount)
  const subtotal = round2(rawItems.reduce((acc, i) => acc + (i.unit_price * i.qty), 0));
  const item_discounts_total = round2(rawItems.reduce((acc, i) => acc + i.item_discount, 0));
  const total_discount_amount = round2(item_discounts_total + totalCartDiscount);

  // Exact grand total before rounding
  const raw_grand_total = processedItems.reduce((acc, i) => acc + i.line_total, 0);
  const grand_total = Math.round(raw_grand_total);
  const round_off = round2(grand_total - raw_grand_total);

  // Rate-wise summary for GST Return / Invoice Footer
  const rateMap = {};
  for (const item of processedItems) {
    const rateKey = String(item.gst_rate);
    if (!rateMap[rateKey]) {
      rateMap[rateKey] = {
        gst_rate: item.gst_rate,
        taxable_amount: 0,
        cgst_amount: 0,
        sgst_amount: 0,
        igst_amount: 0,
        total_tax: 0
      };
    }
    rateMap[rateKey].taxable_amount = round2(rateMap[rateKey].taxable_amount + item.taxable_amount);
    rateMap[rateKey].cgst_amount = round2(rateMap[rateKey].cgst_amount + item.cgst_amount);
    rateMap[rateKey].sgst_amount = round2(rateMap[rateKey].sgst_amount + item.sgst_amount);
    rateMap[rateKey].igst_amount = round2(rateMap[rateKey].igst_amount + item.igst_amount);
    rateMap[rateKey].total_tax = round2(rateMap[rateKey].total_tax + item.tax_amount);
  }

  const tax_breakdown = Object.values(rateMap).sort((a, b) => a.gst_rate - b.gst_rate);

  return {
    items: processedItems,
    subtotal,
    item_discounts_total,
    cart_discount_amount: totalCartDiscount,
    discount_amount: total_discount_amount,
    taxable_amount: total_taxable,
    cgst_amount: total_cgst,
    sgst_amount: total_sgst,
    igst_amount: total_igst,
    total_tax,
    tax_amount: total_tax,
    round_off,
    grand_total,
    is_interstate,
    seller_state_code: resolvedSellerCode,
    seller_state: GST_STATE_CODES[resolvedSellerCode] || seller_state,
    buyer_state_code: resolvedBuyerCode || '',
    buyer_state: resolvedBuyerCode ? (GST_STATE_CODES[resolvedBuyerCode] || buyer_state) : '',
    customer_gstin: customer_gstin || '',
    invoice_type: customer_gstin ? 'B2B' : 'B2C',
    tax_breakdown
  };
}

module.exports = {
  calculateGST,
  extractStateCode,
  GST_STATE_CODES
};
