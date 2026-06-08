const MIN_LOADER_DURATION_MS = 3500;
const MAX_LOADER_DURATION_MS = 7000;
const LOADER_REMOVE_FALLBACK_MS = 700;

const wait = (ms: number): Promise<void> => new Promise((resolve) => window.setTimeout(resolve, ms));

const waitForDomReady = (): Promise<void> => {
  if (document.readyState !== 'loading') return Promise.resolve();

  return new Promise((resolve) => {
    document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
  });
};

const waitForImage = (image: HTMLImageElement): Promise<void> => {
  if (image.complete) return Promise.resolve();

  return new Promise((resolve) => {
    const finish = (): void => resolve();
    image.addEventListener('load', finish, { once: true });
    image.addEventListener('error', finish, { once: true });
  });
};

const waitForCriticalAssets = async (): Promise<void> => {
  await waitForDomReady();

  const criticalImages = Array.from(document.images).filter((image) => image.loading !== 'lazy');
  await Promise.allSettled(criticalImages.map(waitForImage));
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
  const criticalAssetsReady = waitForCriticalAssets();

  void Promise.race([Promise.allSettled([criticalAssetsReady, minimumDisplay]), wait(MAX_LOADER_DURATION_MS)]).then(hideLoader);
};
