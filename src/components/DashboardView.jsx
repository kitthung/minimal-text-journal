import React, { useState, useMemo } from 'react';
import { ChevronLeft, BarChart2, FileText, Type, AlignLeft, Calendar } from 'lucide-react';

const countWords = (text) => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
};

export default function DashboardView({ entries = [], onBack }) {
  const [dimension, setDimension] = useState('weekly'); // 'weekly' | 'monthly' | 'yearly'

  // Filter entries and compute breakdown buckets based on selected dimension
  const analytics = useMemo(() => {
    const now = new Date();

    if (dimension === 'weekly') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const filteredEntries = entries.filter(e => new Date(e.createdAt || e.lastEditedAt) >= sevenDaysAgo);

      // Generate 7 day buckets (from 6 days ago to today)
      const buckets = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dayStr = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
        
        const dayEntries = filteredEntries.filter(e => {
          const eDate = new Date(e.createdAt || e.lastEditedAt).toISOString().split('T')[0];
          return eDate === dayStr;
        });

        const words = dayEntries.reduce((sum, e) => sum + countWords(e.content), 0);
        buckets.push({
          label: dayLabel,
          subLabel: d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
          words,
          notes: dayEntries.length
        });
      }

      const totalWords = filteredEntries.reduce((sum, e) => sum + countWords(e.content), 0);
      const totalNotes = filteredEntries.length;
      const avgWords = totalNotes > 0 ? Math.round(totalWords / totalNotes) : 0;

      return { totalWords, totalNotes, avgWords, buckets, periodLabel: 'Last 7 Days' };
    }

    if (dimension === 'monthly') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const filteredEntries = entries.filter(e => new Date(e.createdAt || e.lastEditedAt) >= thirtyDaysAgo);

      // Generate 4 weekly buckets (Week 4, Week 3, Week 2, Week 1)
      const buckets = [];
      for (let i = 3; i >= 0; i--) {
        const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const weekEntries = filteredEntries.filter(e => {
          const eDate = new Date(e.createdAt || e.lastEditedAt);
          return eDate >= weekStart && eDate <= weekEnd;
        });

        const words = weekEntries.reduce((sum, e) => sum + countWords(e.content), 0);
        buckets.push({
          label: `W${4 - i}`,
          subLabel: `${weekStart.getDate()}/${weekStart.getMonth() + 1}-${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`,
          words,
          notes: weekEntries.length
        });
      }

      const totalWords = filteredEntries.reduce((sum, e) => sum + countWords(e.content), 0);
      const totalNotes = filteredEntries.length;
      const avgWords = totalNotes > 0 ? Math.round(totalWords / totalNotes) : 0;

      return { totalWords, totalNotes, avgWords, buckets, periodLabel: 'Last 30 Days' };
    }

    // Yearly dimension
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const filteredEntries = entries.filter(e => new Date(e.createdAt || e.lastEditedAt) >= oneYearAgo);

    // Generate 12 month buckets
    const buckets = [];
    for (let i = 11; i >= 0; i--) {
      const mDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = mDate.getFullYear();
      const month = mDate.getMonth();
      const monthLabel = mDate.toLocaleDateString('en-US', { month: 'short' });

      const monthEntries = filteredEntries.filter(e => {
        const eDate = new Date(e.createdAt || e.lastEditedAt);
        return eDate.getFullYear() === year && eDate.getMonth() === month;
      });

      const words = monthEntries.reduce((sum, e) => sum + countWords(e.content), 0);
      buckets.push({
        label: monthLabel,
        subLabel: `${year}`,
        words,
        notes: monthEntries.length
      });
    }

    const totalWords = filteredEntries.reduce((sum, e) => sum + countWords(e.content), 0);
    const totalNotes = filteredEntries.length;
    const avgWords = totalNotes > 0 ? Math.round(totalWords / totalNotes) : 0;

    return { totalWords, totalNotes, avgWords, buckets, periodLabel: 'Past 12 Months' };
  }, [entries, dimension]);

  const maxBucketWords = useMemo(() => {
    const max = Math.max(...analytics.buckets.map(b => b.words), 1);
    return max;
  }, [analytics.buckets]);

  return (
    <div className="editor-wrapper fade-in" style={{ width: '100%' }}>
      <div className="editor-header">
        <button onClick={onBack} className="editor-back-btn" aria-label="Go back to timeline">
          <ChevronLeft className="w-5 h-5" />
          <span>Timeline</span>
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart2 className="w-6 h-6" />
            <span>Writing Analytics</span>
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Overview of your journal entries and word production over time ({analytics.periodLabel}).
          </p>
        </div>

        {/* Dimension Selector Tabs */}
        <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.25rem' }}>
          <button
            type="button"
            className={`settings-tab-btn ${dimension === 'weekly' ? 'active' : ''}`}
            onClick={() => setDimension('weekly')}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
          >
            Weekly
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${dimension === 'monthly' ? 'active' : ''}`}
            onClick={() => setDimension('monthly')}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
          >
            Monthly
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${dimension === 'yearly' ? 'active' : ''}`}
            onClick={() => setDimension('yearly')}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Summary Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="dashboard-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Words Typed</span>
            <Type className="w-4 h-4" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em' }}>
            {analytics.totalWords.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Total words in {analytics.periodLabel.toLowerCase()}
          </div>
        </div>

        <div className="dashboard-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes Created</span>
            <FileText className="w-4 h-4" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em' }}>
            {analytics.totalNotes.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Journal entries in {analytics.periodLabel.toLowerCase()}
          </div>
        </div>

        <div className="dashboard-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Words / Note</span>
            <AlignLeft className="w-4 h-4" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em' }}>
            {analytics.avgWords.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Average depth per entry
          </div>
        </div>
      </div>

      {/* Visual Activity Bar Chart */}
      <div 
        style={{
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '1.75rem',
          boxShadow: '0 4px 12px var(--shadow-color)',
          marginBottom: '3rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Activity & Output</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Words per {dimension === 'weekly' ? 'day' : dimension === 'monthly' ? 'week' : 'month'}</span>
        </div>

        <div className="bar-chart-container" style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: '180px', paddingTop: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          {analytics.buckets.map((bucket, index) => {
            const heightPercent = maxBucketWords > 0 ? (bucket.words / maxBucketWords) * 100 : 0;
            const displayHeight = heightPercent > 0 ? Math.max(heightPercent, 8) : 4; // minimum bar height for visibility

            return (
              <div 
                key={index}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end'
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', opacity: bucket.words > 0 ? 1 : 0.4 }}>
                  {bucket.words}
                </div>

                <div 
                  style={{
                    width: '100%',
                    maxWidth: '42px',
                    height: `${displayHeight}%`,
                    backgroundColor: bucket.words > 0 ? 'var(--text-color)' : 'var(--border-color)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.3s ease-out'
                  }}
                  title={`${bucket.words} words across ${bucket.notes} notes`}
                />

                <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{bucket.label}</div>
                  {bucket.subLabel && (
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{bucket.subLabel}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
