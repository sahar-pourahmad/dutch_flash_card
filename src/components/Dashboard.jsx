import { Link } from 'react-router-dom';
import { CHAPTERS } from '../config';
import { useProgress } from '../hooks/useProgress';
import { isLearned } from '../lib/sm2';
import ChapterCard from './ChapterCard';

export default function Dashboard() {
  const { words, progressMap, streak, dueCount, loading, error, sync } = useProgress();

  return (
    <div style={{ paddingTop: 32, paddingBottom: 32 }}>
      <header style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Dutch Words</h1>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {streak > 0 ? `🔥 ${streak} day streak` : 'Start studying!'}
        </div>
      </header>

      {error && (
        <div style={{
          background: 'var(--again)',
          color: '#fff',
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          fontSize: '0.85rem',
        }}>
          {error}
        </div>
      )}

      <Link to="/review">
        <button style={{
          width: '100%',
          background: dueCount > 0 ? 'var(--accent)' : 'var(--surface2)',
          color: dueCount > 0 ? '#fff' : 'var(--text-muted)',
          fontSize: '1.1rem',
          fontWeight: 600,
          padding: '16px',
          marginBottom: 28,
        }}>
          {loading ? 'Loading...' : dueCount > 0 ? `Study Now · ${dueCount} due` : 'All caught up!'}
        </button>
      </Link>

      <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12, color: 'var(--text-muted)' }}>
        CHAPTERS
      </h2>

      {CHAPTERS.map(chapter => {
        const chapterWords = words.filter(w => w.chapter === chapter);
        const learned = chapterWords.filter(w => isLearned(progressMap[w.id] ?? {})).length;
        return (
          <ChapterCard
            key={chapter}
            name={chapter}
            total={chapterWords.length}
            learned={learned}
          />
        );
      })}

      <button
        onClick={sync}
        disabled={loading}
        style={{
          marginTop: 20,
          width: '100%',
          background: 'var(--surface)',
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
        }}
      >
        {loading ? 'Syncing...' : 'Sync from Google Sheet'}
      </button>
    </div>
  );
}
