import { useState, useEffect, useCallback } from 'react';
import { getWords, getAllProgress, saveProgress, getMeta, setMeta } from '../lib/db';
import { isDue, nextReview } from '../lib/sm2';

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useReviewQueue() {
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progressMap, setProgressMap] = useState({});
  const [sessionCount, setSessionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [words, allProgress] = await Promise.all([getWords(), getAllProgress()]);
      const map = Object.fromEntries(allProgress.map(p => [p.id, p]));
      const due = words.filter(w => isDue(map[w.id] ?? {}));
      setQueue(shuffleArray(due));
      setProgressMap(map);
      setLoading(false);
    }
    load();
  }, []);

  const rate = useCallback(async (quality) => {
    const word = queue[currentIndex];
    if (!word) return;
    const current = progressMap[word.id] ?? {};
    const updated = { id: word.id, ...nextReview(current, quality) };
    await saveProgress(updated);
    setProgressMap(prev => ({ ...prev, [word.id]: updated }));
    setSessionCount(c => c + 1);

    // Update streak
    const today = new Date().toDateString();
    const lastStudy = await getMeta('lastStudyDate');
    if (lastStudy !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const storedStreak = (await getMeta('streak')) ?? 0;
      const newStreak = lastStudy === yesterday ? storedStreak + 1 : 1;
      await setMeta('streak', newStreak);
      await setMeta('lastStudyDate', today);
    }

    setCurrentIndex(i => i + 1);
  }, [queue, currentIndex, progressMap]);

  const currentWord = queue[currentIndex] ?? null;
  const remaining = queue.length - currentIndex;
  const done = !loading && currentIndex >= queue.length;

  return { currentWord, remaining, sessionCount, done, loading, rate };
}
