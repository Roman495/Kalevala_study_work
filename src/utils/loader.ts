const MIN_LOADER_DURATION_MS = 900;
const MAX_LOADER_DURATION_MS = 2500;
const LOADER_REMOVE_FALLBACK_MS = 700;

const wait = (ms: number): Promise<void> => new Promise((resolve) => window.setTimeout(resolve, ms));

const waitForDomReady = (): Promise<void> => {
  if (document.readyState !== 'loading') return Promise.resolve();

  return new Promise((resolve) => {
    document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
  });
};

export const initLoader = (): void => {
  const loader = document.querySelector<HTMLElement>('[data-loader]');
  if (!loader) return;

  const startedAt = performance.now();
  document.body.setAttribute('aria-busy', 'true');

  const hideLoader = (): void => {
    if (!loader.isConnected || loader.classList.contains('loader--hidden')) return;

    loader.classList.add('loader--hidden');
    document.body.removeAttribute('aria-busy');

    const removeLoader = (): void => loader.remove();
    loader.addEventListener('transitionend', removeLoader, { once: true });
    window.setTimeout(removeLoader, LOADER_REMOVE_FALLBACK_MS);
  };

  const minimumDisplay = wait(Math.max(0, MIN_LOADER_DURATION_MS - (performance.now() - startedAt)));
  const interfaceReady = Promise.race([waitForDomReady(), wait(MAX_LOADER_DURATION_MS)]);

  void Promise.all([minimumDisplay, interfaceReady]).then(hideLoader);
};
