import { useState } from 'react';
import { AGAIN, HARD, GOOD, EASY } from '../lib/sm2';
import { useVoice } from '../hooks/useVoice';

const RATINGS = [
  { label: 'Again', quality: AGAIN, color: 'var(--again)' },
  { label: 'Hard',  quality: HARD,  color: 'var(--hard)'  },
  { label: 'Good',  quality: GOOD,  color: 'var(--good)'  },
  { label: 'Easy',  quality: EASY,  color: 'var(--easy)'  },
];

export default function Flashcard({ word, onRate }) {
  const [flipped, setFlipped] = useState(false);
  const { speak } = useVoice();

  function handleFlip() {
    if (!flipped) setFlipped(true);
  }

  function handleSpeak(e) {
    e.stopPropagation();
    speak(word.word, 'nl-NL');
  }

  return (
    <div style={{ userSelect: 'none' }}>
      <div
        data-testid="flashcard"
        onClick={handleFlip}
        style={{
          position: 'relative',
          minHeight: 220,
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)',
          cursor: flipped ? 'default' : 'pointer',
          overflow: 'hidden',
        }}
      >
        {/* Front */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 24,
          visibility: flipped ? 'hidden' : 'visible',
          transition: 'visibility 0.2s',
          pointerEvents: flipped ? 'none' : 'auto',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 12 }}>
            {word.word}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            tap to reveal
          </div>
          <button
            onClick={handleSpeak}
            style={{ marginTop: 16, background: 'var(--surface2)', padding: '8px 16px', fontSize: '1.2rem' }}
            aria-label="Pronounce word"
          >
            🔊
          </button>
        </div>

        {/* Back */}
        <div
          aria-hidden={!flipped}
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 24, textAlign: 'center',
            visibility: flipped ? 'visible' : 'hidden',
            transition: 'visibility 0.3s 0.1s',
            pointerEvents: flipped ? 'auto' : 'none',
          }}
        >
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>
            {word.definition}
          </div>
          {word.example && (
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {word.example}
            </div>
          )}
          <button
            onClick={handleSpeak}
            style={{ marginTop: 16, background: 'var(--surface2)', padding: '8px 16px', fontSize: '1.2rem' }}
            aria-label="Pronounce word"
          >
            🔊
          </button>
        </div>
      </div>

      {/* Rating buttons — only shown after flip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 8,
        marginTop: 16,
        visibility: flipped ? 'visible' : 'hidden',
        pointerEvents: flipped ? 'auto' : 'none',
      }}>
        {RATINGS.map(({ label, quality, color }) => (
          <button
            key={label}
            onClick={() => onRate(quality)}
            style={{ background: color, color: '#fff', fontWeight: 600, padding: '12px 4px' }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
