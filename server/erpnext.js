/**
 * ERPNext / Frappe REST API Two-Way Connector
 * Seamless integration for Items, Stock, Sales Invoices, Customers & Suppliers
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

class ERPNextClient {
  constructor(config = {}) {
    this.url = (config.url || 'http://localhost:8000').replace(/\/$/, '');
    this.apiKey = config.api_key || '';
    this.apiSecret = config.api_secret || '';
    this.company = config.company || 'PAVATI OS';
    this.warehouse = config.warehouse || 'Stores - TFS';
    this.posProfile = config.pos_profile || 'Standard POS';
    this.enabled = Boolean(config.enabled);
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    if (this.apiKey && this.apiSecret) {
      headers['Authorization'] = `token ${this.apiKey}:${this.apiSecret}`;
    }
    return headers;
  }

  // Generic HTTP request helper
  request(method, endpoint, payload = null) {
    return new Promise((resolve, reject) => {
      try {
        const fullUrl = new URL(endpoint.startsWith('http') ? endpoint : `${this.url}${endpoint}`);
        const isHttps = fullUrl.protocol === 'https:';
        const client = isHttps ? https : http;

        const options = {
          protocol: fullUrl.protocol,
          hostname: fullUrl.hostname,
          port: fullUrl.port || (isHttps ? 443 : 80),
          path: `${fullUrl.pathname}${fullUrl.search}`,
          method: method.toUpperCase(),
          headers: this.getHeaders(),
          timeout: 8000
        };

        const req = client.request(options, (res) => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            try {
              const parsed = data ? JSON.parse(data) : {};
              if (res.statusCode >= 200 && res.statusCode < 300) {
                resolve(parsed);
              } else {
                reject(new Error(parsed._server_messages || parsed.exception || `ERPNext API error: HTTP ${res.statusCode}`));
              }
            } catch (err) {
              if (res.statusCode >= 200 && res.statusCode < 300) {
                resolve({ raw: data });
              } else {
                reject(new Error(`Invalid response from ERPNext (${res.statusCode}): ${data.slice(0, 150)}`));
              }
            }
          });
        });

        req.on('error', (err) => {
          reject(new Error(`Unable to reach ERPNext at ${this.url}: ${err.message}`));
        });

        req.on('timeout', () => {
          req.destroy();
          reject(new Error(`ERPNext connection timed out after 8 seconds`));
        });

        if (payload && (method === 'POST' || method === 'PUT')) {
          req.write(JSON.stringify(payload));
        }

        req.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  // 1. Test ERPNext Connection
  async testConnection() {
    try {
      const res = await this.request('GET', '/api/method/frappe.auth.get_logged_user');
      return {
        success: true,
        connected: true,
        user: res.message || 'Administrator',
        server: this.url
      };
    } catch (err) {
      return {
        success: false,
        connected: false,
        message: err.message,
        server: this.url
      };
    }
  }

  // 2. Fetch Catalog Items from ERPNext
  async fetchItems() {
    const fields = JSON.stringify(["name", "item_name", "item_group", "stock_uom", "standard_rate", "valuation_rate", "image"]);
    const res = await this.request('GET', `/api/resource/Item?fields=${encodeURIComponent(fields)}&limit_page_length=100`);
    return res.data || [];
  }

  // 3. Push Product to ERPNext Item DocType
  async pushItem(item) {
    const payload = {
      item_code: item.sku || item.id,
      item_name: item.name,
      item_group: "All Item Groups",
      stock_uom: item.uom || "Nos",
      is_stock_item: 1,
      standard_rate: Number(item.selling_price) || 0,
      valuation_rate: Number(item.cost_price) || 0,
      description: `${item.name} (${item.size || ''} ${item.color || ''})`
    };

    try {
      return await this.request('POST', '/api/resource/Item', payload);
    } catch (err) {
      // If already exists, update it
      return await this.request('PUT', `/api/resource/Item/${encodeURIComponent(payload.item_code)}`, payload);
    }
  }

  // 4. Push Sales Invoice to ERPNext with stock update & payment
  async pushSalesInvoice(invoice) {
    const payload = {
      doctype: "Sales Invoice",
      company: this.company,
      customer: invoice.customer?.name || "Palmer Productions Ltd.",
      posting_date: invoice.created_at ? invoice.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
      update_stock: 1,
      pos_profile: this.posProfile,
      items: (invoice.items || []).map(i => ({
        item_code: i.sku || i.id,
        item_name: i.name,
        qty: i.qty,
        rate: i.unit_price || i.selling_price,
        warehouse: this.warehouse,
        income_account: `Sales - ${this.company.slice(0, 3)}`
      })),
      payments: [
        {
          mode_of_payment: invoice.payment_method === 'UPI' ? 'Bank' : (invoice.payment_method || 'Cash'),
          amount: invoice.grand_total,
          default: 1
        }
      ]
    };

    // Insert draft invoice
    const draft = await this.request('POST', '/api/resource/Sales Invoice', payload);
    
    // Submit invoice (docstatus: 1)
    if (draft && draft.data && draft.data.name) {
      try {
        await this.request('PUT', `/api/resource/Sales Invoice/${draft.data.name}`, { docstatus: 1 });
      } catch (submitErr) {
        console.warn(`[ERPNext] Draft invoice created #${draft.data.name} (auto-submit note: ${submitErr.message})`);
      }
    }

    return draft;
  }

  // 5. Push Customer to ERPNext Customer DocType
  async pushCustomer(customer) {
    const payload = {
      customer_name: customer.name,
      customer_type: "Individual",
      customer_group: "All Customer Groups",
      territory: "All Territories",
      mobile_no: customer.phone,
      email_id: customer.email || ""
    };

    try {
      return await this.request('POST', '/api/resource/Customer', payload);
    } catch (err) {
      return { note: "Customer exists or synced", message: err.message };
    }
  }

  // 6. Push Supplier to ERPNext Supplier DocType
  async pushSupplier(supplier) {
    const payload = {
      supplier_name: supplier.name,
      supplier_group: "All Supplier Groups",
      supplier_type: "Company",
      pan: supplier.gstin || ""
    };

    try {
      return await this.request('POST', '/api/resource/Supplier', payload);
    } catch (err) {
      return { note: "Supplier exists or synced", message: err.message };
    }
  }
}

module.exports = ERPNextClient;
