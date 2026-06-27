export const AGAIN = 1;
export const HARD = 3;
export const GOOD = 4;
export const EASY = 5;
export const LEARNED_INTERVAL = 21;

export function nextReview(card, quality) {
  let { interval = 0, repetitions = 0, efactor = 2.5 } = card;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * efactor);
    repetitions += 1;
  }

  efactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  efactor = Math.max(1.3, parseFloat(efactor.toFixed(4)));

  const due = new Date();
  due.setDate(due.getDate() + interval);
  due.setHours(0, 0, 0, 0);

  return { interval, repetitions, efactor, dueDate: due.toISOString() };
}

export function isDue(card) {
  if (!card.dueDate) return true;
  return new Date(card.dueDate) <= new Date();
}

export function isLearned(card) {
  return (card.interval || 0) >= LEARNED_INTERVAL;
}
