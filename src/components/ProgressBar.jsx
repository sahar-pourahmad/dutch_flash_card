export default function ProgressBar({ value, max }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div style={{ background: 'var(--surface2)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
      <div style={{
        width: `${pct}%`,
        height: '100%',
        background: 'var(--accent)',
        transition: 'width 0.4s ease',
      }} />
    </div>
  );
}
