const RUNOSINGER_HINT_KEY = 'kalevala-runosinger-hint-seen';

export const hasSeenRunosingerHint = (): boolean => {
  try {
    return localStorage.getItem(RUNOSINGER_HINT_KEY) === 'true';
  } catch {
    return false;
  }
};

export const markRunosingerHintSeen = (): void => {
  try {
    localStorage.setItem(RUNOSINGER_HINT_KEY, 'true');
  } catch {
    // The tour remains usable if storage is unavailable.
  }
};
