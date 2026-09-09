import React, { useState, useEffect } from 'react';
import { api } from '../api';

function BarChart({ data, valueKey, labelKey, color }) {
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '80px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'flex-end', height: '100%' }}>
          <div
            title={d[labelKey] + ': Rs.' + Number(d[valueKey] || 0).toLocaleString('en-IN')}
            style={{
              width: '100%',
              height: Math.max(2, (d[valueKey] / max) * 76) + 'px',
              background: d[valueKey] > 0 ? (color || 'var(--accent-blue)') : 'var(--border-color)',
              borderRadius: '2px 2px 0 0', cursor: 'pointer'
            }}
          />
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getChartData()
      .then(r => { if (r.success) setChartData(r.data); })
      .catch(e => console.warn('Chart error:', e))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !chartData) {
    return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading analytics data...</div>;
  }

  const last30 = chartData.daily_sales || [];
  const totalRevenue = last30.reduce((s, d) => s + (d.revenue || 0), 0);
  const totalInvoices = last30.reduce((s, d) => s + (d.invoice_count || 0), 0);
  const peakDay = [...last30].sort((a, b) => b.revenue - a.revenue)[0];
  const catData = (chartData.category_revenue || []).sort((a, b) => b.revenue - a.revenue);
  const catTotal = catData.reduce((s, c) => s + c.revenue, 0);
  const catColors = ['var(--accent-blue)', 'var(--accent-emerald)', 'var(--accent-purple)', 'var(--accent-amber)', 'var(--accent-red)', '#06b6d4'];
  const payTrend = chartData.payment_trend || {};
  const payTotal = Object.values(payTrend).reduce((s, v) => s + v, 0);
  const payColors = { UPI: 'var(--accent-blue)', Cash: 'var(--accent-emerald)', Card: 'var(--accent-purple)', Split: 'var(--accent-amber)' };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800' }}>Sales Analytics &amp; Charts</h2>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>30-day revenue trends, category breakdown, top products, and payment analysis</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '14px', marginBottom: '20px' }}>
        {[
          { label: '30-Day Revenue', value: 'Rs.' + Math.round(totalRevenue).toLocaleString('en-IN'), color: 'var(--accent-emerald)', icon: 'Rs.' },
          { label: '30-Day Invoices', value: totalInvoices, color: 'var(--accent-blue)', icon: '#' },
          { label: 'Peak Day Revenue', value: peakDay ? 'Rs.' + Math.round(peakDay.revenue).toLocaleString('en-IN') : 'Rs.0', color: 'var(--accent-purple)', icon: 'Peak', sub: peakDay && peakDay.date },
          { label: 'Avg Revenue/Day', value: 'Rs.' + Math.round(totalRevenue / 30).toLocaleString('en-IN'), color: 'var(--accent-amber)', icon: 'Avg' }
        ].map((k, i) => (
          <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>{k.label}</div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: k.color }}>{k.value}</div>
            {k.sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      <div className="pos-table-card" style={{ padding: '18px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '800' }}>30-Day Daily Revenue Trend</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Hover each bar for amount</span>
        </div>
        <BarChart data={last30} valueKey="revenue" labelKey="date" color="var(--accent-blue)" />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
          <span>{last30[0] && last30[0].date}</span>
          <span>{last30[14] && last30[14].date}</span>
          <span>{last30[29] && last30[29].date}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div className="pos-table-card" style={{ padding: '18px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '12px' }}>Category Revenue Breakdown</h3>
          {catData.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No sales data yet.</div>
          ) : catData.slice(0, 6).map((c, i) => {
            const pct = catTotal > 0 ? (c.revenue / catTotal * 100) : 0;
            return (
              <div key={i} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                  <span style={{ fontWeight: '700', textTransform: 'capitalize' }}>{c.category}</span>
                  <span style={{ fontWeight: '800' }}>Rs.{Math.round(c.revenue).toLocaleString('en-IN')} ({Math.round(pct)}%)</span>
                </div>
                <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: pct + '%', height: '100%', background: catColors[i % catColors.length], borderRadius: '3px' }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="pos-table-card" style={{ padding: '18px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '12px' }}>Top Selling Products</h3>
          {(chartData.top_products || []).length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No sales data yet.</div>
          ) : (chartData.top_products || []).slice(0, 8).map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: i < 3 ? 'var(--accent-amber)' : 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '900' }}>{i + 1}</span>
                <span style={{ fontSize: '12px', fontWeight: '700', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent-emerald)' }}>{p.qty} pcs</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rs.{Math.round(p.revenue).toLocaleString('en-IN')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pos-table-card" style={{ padding: '18px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '12px' }}>Payment Mode Split (Last 7 Days)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
          {Object.entries(payTrend).map(([mode, amount], i) => {
            const pct = payTotal > 0 ? (amount / payTotal * 100) : 0;
            return (
              <div key={i} style={{ padding: '14px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>{mode}</div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: payColors[mode] || 'var(--text-primary)', margin: '6px 0' }}>Rs.{Math.round(amount).toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '13px', fontWeight: '800' }}>{Math.round(pct)}%</div>
                <div style={{ height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden', marginTop: '8px' }}>
                  <div style={{ width: pct + '%', height: '100%', background: payColors[mode] || 'gray', borderRadius: '2px' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
