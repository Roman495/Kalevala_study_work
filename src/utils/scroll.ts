export const scrollToElement = (id: string): void => {
  const target = document.getElementById(id);
  if (!target) return;

  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  target.setAttribute('tabindex', '-1');
  window.setTimeout(() => target.focus({ preventScroll: true }), 500);
};
