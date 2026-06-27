import { useNavigate } from 'react-router-dom';
import Flashcard from './Flashcard';
import { useReviewQueue } from '../hooks/useReviewQueue';

export default function ReviewSession() {
  const navigate = useNavigate();
  const { currentWord, remaining, sessionCount, done, loading, error, rate } = useReviewQueue();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading cards...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ paddingTop: 64, textAlign: 'center' }}>
        <p style={{ color: 'var(--again)', marginBottom: 24 }}>{error}</p>
        <button onClick={() => navigate('/')} style={{ background: 'var(--surface)', color: 'var(--text)', padding: '12px 24px' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!loading && !error && done && sessionCount === 0) {
    return (
      <div style={{ paddingTop: 64, textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: 16 }}>📚</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>No cards due</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
          Sync your Google Sheet from the dashboard first, or come back tomorrow!
        </p>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'var(--accent)', color: '#fff', fontWeight: 600, padding: '14px 32px' }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div style={{ paddingTop: 64, textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>✓</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>Session complete!</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
          You reviewed {sessionCount} card{sessionCount !== 1 ? 's' : ''}.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'var(--accent)', color: '#fff', fontWeight: 600, padding: '14px 32px' }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 24, paddingBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', color: 'var(--text-muted)', padding: '8px 0', fontSize: '0.9rem' }}
        >
          ← Back
        </button>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {remaining} remaining
        </div>
      </div>

      <div style={{
        height: 4,
        background: 'var(--surface2)',
        borderRadius: 2,
        marginBottom: 24,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: 'var(--accent)',
          width: `${sessionCount > 0 ? ((sessionCount / (sessionCount + remaining)) * 100) : 0}%`,
          transition: 'width 0.4s ease',
        }} />
      </div>

      <Flashcard key={currentWord?.id} word={currentWord} onRate={rate} />
    </div>
  );
}
