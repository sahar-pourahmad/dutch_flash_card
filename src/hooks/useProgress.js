import { useState, useEffect, useCallback } from 'react';
import { getWords, saveWords, getAllProgress, getMeta } from '../lib/db';
import { fetchAllChapters } from '../lib/sheets';
import { isDue } from '../lib/sm2';
import { SPREADSHEET_ID, CHAPTERS } from '../config';

function computeStreak(lastStudyDate, currentStreak) {
  if (!lastStudyDate) return 0;
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const last = new Date(lastStudyDate).toDateString();
  if (last === today) return currentStreak;
  if (last === yesterday) return currentStreak;
  return 0;
}

export function useProgress() {
  const [words, setWords] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFromDB = useCallback(async () => {
    const [cachedWords, allProgress, storedStreak, lastStudy] = await Promise.all([
      getWords(),
      getAllProgress(),
      getMeta('streak'),
      getMeta('lastStudyDate'),
    ]);
    const map = Object.fromEntries(allProgress.map(p => [p.id, p]));
    setWords(cachedWords);
    setProgressMap(map);
    setStreak(computeStreak(lastStudy, storedStreak ?? 0));
    return cachedWords;
  }, []);

  const sync = useCallback(async () => {
    if (!SPREADSHEET_ID) {
      setError('Set SPREADSHEET_ID in src/config.js first');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fresh = await fetchAllChapters(SPREADSHEET_ID, CHAPTERS);
      await saveWords(fresh);
      await loadFromDB();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [loadFromDB]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    loadFromDB()
      .then(cached => {
        if (!isMounted) return;
        setLoading(false);
        if (cached.length === 0) return sync();
      })
      .catch(e => {
        if (!isMounted) return;
        setError(e.message);
        setLoading(false);
      });
    return () => { isMounted = false; };
  }, [loadFromDB, sync]);

  const dueCount = words.filter(w => isDue(progressMap[w.id] ?? {})).length;

  return { words, progressMap, streak, dueCount, loading, error, sync };
}
