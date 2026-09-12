import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

export default function BarcodeSticker({ 
  item, 
  storeName = "PAVATI OS", 
  showStoreName = true,
  showMRP = true,
  showSalePrice = true,
  showDiscount = true,
  showStock = true,
  showRack = true,
  showSku = true,
  printBorder = false,
  stickerSize = 'halett-6up' // 'halett-6up' | 'citizen-2up' | 'citizen' | 'citizen-1up' | 'standard' | 'compact' | 'shelf'
}) {
  const barcodeRef = useRef(null);

  const mrp = Number(item?.mrp || item?.selling_price || 0);
  const salePrice = Number(item?.selling_price || item?.mrp || 0);
  const hasDiscount = mrp > salePrice;
  const saveAmount = mrp - salePrice;
  const discountPercent = hasDiscount && mrp > 0 ? Math.round((saveAmount / mrp) * 100) : 0;

  useEffect(() => {
    const rawBarcode = item?.barcode || item?.sku;
    if (barcodeRef.current && rawBarcode) {
      try {
        let barWidth = 1.45;
        let barHeight = 36;
        let fontSize = 11;

        if (stickerSize === 'halett-6up' || stickerSize === 'halett') {
          // Halett 4" x 6" 6-up sticker (~48mm x 48mm in 2x3 grid)
          // Generous height & width for ultra-reliable scanner gun reading
          barWidth = 1.35;
          barHeight = 38;
          fontSize = 11;
        } else if (stickerSize === 'citizen-2up' || stickerSize === '2up') {
          // Compact 2-up parallel sticker (48mm x 25.4mm)
          barWidth = 1.05;
          barHeight = 22;
          fontSize = 8;
        } else if (stickerSize === 'citizen' || stickerSize === 'citizen-1up') {
          // Citizen 1-up wide label (101.6x25.4mm)
          barWidth = 1.32;
          barHeight = 40;
          fontSize = 9.5;
        } else if (stickerSize === 'compact') {
          barWidth = 1.2;
          barHeight = 26;
          fontSize = 9.5;
        } else if (stickerSize === 'shelf') {
          barWidth = 1.7;
          barHeight = 44;
          fontSize = 12;
        }

        JsBarcode(barcodeRef.current, String(rawBarcode), {
          format: "CODE128",
          width: barWidth,
          height: barHeight,
          displayValue: true,
          font: "monospace",
          fontOptions: "bold",
          fontSize: fontSize,
          margin: 0,
          textMargin: 1
        });
      } catch (err) {
        console.warn("JsBarcode render error:", err);
      }
    }
  }, [item?.barcode, item?.sku, stickerSize]);

  if (!item) return null;

  // Halett 4" x 6" Label Sheet (6 Stickers per Label: 2 Columns x 3 Rows, ~48mm x 48mm each)
  if (stickerSize === 'halett-6up' || stickerSize === 'halett') {
    return (
      <div className={`barcode-sticker size-halett-6up print-border-${printBorder ? 'yes' : 'no'}`}>
        {/* Top Header: Brand Name + SKU */}
        <div className="sticker-halett-header">
          {showStoreName && (
            <span className="sticker-halett-store">
              {storeName || "PAVATI OS"}
            </span>
          )}
          {showSku && item.sku && (
            <span className="sticker-halett-sku">
              {item.sku}
            </span>
          )}
        </div>

        {/* Product Title & Size */}
        <div className="sticker-halett-title" title={item.name}>
          {item.name} {item.size && item.size !== 'Standard' && item.size !== 'Default' ? `(${item.size})` : ''}
        </div>

        {/* Location & Stock Badges */}
        {(showRack || showStock) && (
          <div className="sticker-halett-meta">
            {showRack && (item.rack_location || item.rack_name) && (
              <span className="sticker-halett-rack">
                📍 {item.rack_location || item.rack_name}
              </span>
            )}
            {showStock && (
              <span className="sticker-halett-stock">
                Stock: {item.stock_qty ?? 0} {item.uom || 'Pcs'}
              </span>
            )}
          </div>
        )}

        {/* Pricing Matrix */}
        {(showMRP || showSalePrice) && (
          <div className="sticker-halett-pricing">
            <div className="sticker-halett-price-left">
              {showMRP && (
                <div className="sticker-halett-mrp">
                  MRP: <span className={hasDiscount ? 'struck' : ''}>₹{mrp.toLocaleString('en-IN')}</span>
                </div>
              )}
              {hasDiscount && showDiscount && (
                <div className="sticker-halett-discount">
                  SAVE ₹{saveAmount} ({discountPercent}%)
                </div>
              )}
            </div>
            {showSalePrice && (
              <div className="sticker-halett-sale">
                <span className="sticker-halett-sale-label">SALE:</span>
                <span className="sticker-halett-sale-val">₹{salePrice.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        )}

        {/* Centered Barcode SVG with Monospace Text */}
        <div className="sticker-halett-barcode-wrapper">
          <svg ref={barcodeRef} className="sticker-halett-barcode-svg"></svg>
        </div>
      </div>
    );
  }

  // Citizen 2-Up Parallel Layout (Each sticker ~48mm x 25.4mm, 2 per row across 101.6mm roll)
  if (stickerSize === 'citizen-2up' || stickerSize === '2up') {
    return (
      <div className={`barcode-sticker size-2up print-border-${printBorder ? 'yes' : 'no'}`}>
        {/* Row 1: Store & SKU / Rack */}
        <div className="sticker-2up-header">
          {showStoreName && (
            <span className="sticker-2up-store">
              {storeName || "PAVATI OS"}
            </span>
          )}
          {showSku && item.sku && (
            <span className="sticker-2up-sku">
              {item.sku}
            </span>
          )}
          {showRack && (item.rack_location || item.rack_name) && (
            <span className="sticker-2up-rack">
              {item.rack_location || item.rack_name}
            </span>
          )}
        </div>

        {/* Row 2: Product Name */}
        <div className="sticker-2up-title" title={item.name}>
          {item.name} {item.size && item.size !== 'Standard' && item.size !== 'Default' ? `(${item.size})` : ''}
        </div>

        {/* Row 3: Pricing & Stock */}
        {(showMRP || showSalePrice || showStock) && (
          <div className="sticker-2up-pricing">
            {showMRP && (
              <span className="sticker-2up-mrp">
                MRP: <span className={hasDiscount ? 'struck' : ''}>₹{mrp.toLocaleString('en-IN')}</span>
              </span>
            )}
            {hasDiscount && showDiscount && (
              <span className="sticker-2up-save">
                -₹{saveAmount}
              </span>
            )}
            {showSalePrice && (
              <span className="sticker-2up-sale">
                <span style={{ fontSize: '7.5px', fontWeight: '800', color: '#475569', marginRight: '2px' }}>SALE:</span>
                ₹{salePrice.toLocaleString('en-IN')}
              </span>
            )}
            {showStock && (
              <span className="sticker-2up-stock">
                Qty:{item.stock_qty ?? 0}
              </span>
            )}
          </div>
        )}

        {/* Row 4: Barcode SVG with human-readable numbers */}
        <div className="sticker-2up-barcode-wrapper">
          <svg ref={barcodeRef} className="sticker-2up-barcode-svg"></svg>
        </div>
      </div>
    );
  }

  // Citizen CL-E321 (101.6mm x 25.4mm / 4" x 1") Horizontal 2-Column Layout
  if (stickerSize === 'citizen') {
    return (
      <div className={`barcode-sticker size-citizen print-border-${printBorder ? 'yes' : 'no'}`}>
        {/* Left Column: Product Info & Commercial Details */}
        <div className="sticker-left-col">
          {/* Header Row: Store Name + SKU + Rack */}
          {(showStoreName || showSku || showRack) && (
            <div className="sticker-header-line">
              {showStoreName && (
                <span className="sticker-store-name-inline">
                  {storeName || "PAVATI OS"}
                </span>
              )}
              {showSku && item.sku && (
                <span className="sticker-sku-inline">
                  SKU: {item.sku}
                </span>
              )}
              {showRack && (
                <span className="sticker-rack-inline">
                  📍 {item.rack_location || item.rack_name || "A-01"}
                </span>
              )}
            </div>
          )}

          {/* Product Title */}
          <div className="sticker-product-title-citizen" title={item.name}>
            {item.name} {item.size && item.size !== 'Standard' && item.size !== 'Default' ? `(${item.size})` : ''}
          </div>

          {/* Bottom Row: MRP, Offer/Sale Price, Savings, Stock */}
          <div className="sticker-bottom-citizen">
            {(showMRP || showSalePrice) && (
              <div className="sticker-prices-citizen">
                {showMRP && (
                  <span className="sticker-mrp-citizen">
                    MRP: <span className={hasDiscount ? 'struck' : ''}>₹{mrp.toLocaleString('en-IN')}</span>
                  </span>
                )}
                {hasDiscount && showDiscount && (
                  <span className="sticker-save-citizen">
                    SAVE ₹{saveAmount}
                  </span>
                )}
                {showSalePrice && (
                  <span className="sticker-sale-citizen">
                    <span className="sticker-sale-tag">SALE:</span>
                    ₹{salePrice.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            )}
            {showStock && (
              <span className="sticker-stock-citizen">
                📦 {item.stock_qty ?? 0} {item.uom || 'Pcs'}
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Code-128 Barcode with readable text */}
        <div className="sticker-right-col">
          <svg ref={barcodeRef} className="sticker-barcode-svg-citizen"></svg>
        </div>
      </div>
    );
  }

  // Standard, Compact & Shelf Tag Layouts (Single Column Stack)
  return (
    <div className={`barcode-sticker size-${stickerSize} print-border-${printBorder ? 'yes' : 'no'}`}>
      {/* Store Header */}
      {showStoreName && (
        <div className="sticker-store-name">
          {storeName || "PAVATI OS"}
        </div>
      )}

      {/* Product Title */}
      <div className="sticker-product-title" title={item.name}>
        {item.name} {item.size && item.size !== 'Standard' && item.size !== 'Default' ? `(${item.size})` : ''}
      </div>

      {/* Inventory Stock & Rack Location Metadata */}
      {(showStock || showRack || showSku) && (
        <div className="sticker-meta-row">
          {showStock && (
            <span className="sticker-stock-badge">
              📦 Stock: {item.stock_qty ?? 0} {item.uom || 'Pcs'}
            </span>
          )}
          {showRack && (
            <span className="sticker-rack-badge">
              📍 {item.rack_location || item.rack_name || "Rack A-01"}
            </span>
          )}
          {showSku && item.sku && (
            <span className="sticker-sku-badge">
              SKU: {item.sku}
            </span>
          )}
        </div>
      )}

      {/* Pricing Section: MRP & Sale Price */}
      {(showMRP || showSalePrice) && (
        <div className="sticker-price-block">
          {/* MRP Display */}
          {showMRP && (
            <div className="sticker-mrp-row">
              <span className="sticker-label">MRP:</span>
              <span className={`sticker-mrp-val ${hasDiscount ? 'struck' : ''}`}>
                ₹{mrp.toLocaleString('en-IN')}
              </span>
              {hasDiscount && showDiscount && (
                <span className="sticker-save-pill">SAVE ₹{saveAmount} ({discountPercent}%)</span>
              )}
            </div>
          )}

          {/* Sale Price Display */}
          {showSalePrice && (
            <div className="sticker-sale-row">
              <span className="sticker-sale-label">
                SALE PRICE:
              </span>
              <span className="sticker-sale-val">
                ₹{salePrice.toLocaleString('en-IN')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Barcode SVG with Human-Readable Monospace Digits */}
      <svg ref={barcodeRef} className="sticker-barcode-svg"></svg>
    </div>
  );
}

