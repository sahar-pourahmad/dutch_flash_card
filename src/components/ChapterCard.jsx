import ProgressBar from './ProgressBar';

export default function ChapterCard({ name, total, learned }) {
  const pct = total === 0 ? 0 : Math.round((learned / total) * 100);
  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 'var(--radius)',
      padding: '16px',
      marginBottom: '12px',
      boxShadow: 'var(--shadow)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontWeight: 600 }}>{name}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {learned}/{total} learned ({pct}%)
        </span>
      </div>
      <ProgressBar value={learned} max={total} />
    </div>
  );
}
