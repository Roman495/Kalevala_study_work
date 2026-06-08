const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const scrollToElement = (id: string): void => {
  const target = document.getElementById(id);
  if (!target) return;

  target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  target.setAttribute('tabindex', '-1');
  window.setTimeout(() => target.focus({ preventScroll: true }), prefersReducedMotion() ? 0 : 500);
};
