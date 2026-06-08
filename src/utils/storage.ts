const RUNOSINGER_HINT_KEY = 'kalevala-runosinger-hint-seen';

const readLocalStorage = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeLocalStorage = (key: string, value: string): void => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // The tour remains usable if storage is unavailable.
  }
};

export const hasSeenRunosingerHint = (): boolean => readLocalStorage(RUNOSINGER_HINT_KEY) === 'true';

export const markRunosingerHintSeen = (): void => {
  writeLocalStorage(RUNOSINGER_HINT_KEY, 'true');
};
