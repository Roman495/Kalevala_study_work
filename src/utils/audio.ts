let activeAudio: HTMLAudioElement | null = null;
let activeButton: HTMLButtonElement | null = null;

export const playExhibitAudio = (src: string, button: HTMLButtonElement): void => {
  if (activeAudio && activeAudio.src === new URL(src, window.location.href).href) {
    if (activeAudio.paused) {
      void activeAudio.play();
      button.classList.add('is-playing');
      button.setAttribute('aria-label', 'Поставить аудиокомментарий на паузу');
    } else {
      activeAudio.pause();
      button.classList.remove('is-playing');
      button.setAttribute('aria-label', 'Продолжить аудиокомментарий');
    }
    return;
  }

  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
  }
  if (activeButton) {
    activeButton.classList.remove('is-playing');
    activeButton.setAttribute('aria-label', 'Включить аудиокомментарий');
  }

  activeAudio = new Audio(src);
  activeButton = button;
  button.classList.add('is-playing');
  button.setAttribute('aria-label', 'Поставить аудиокомментарий на паузу');

  activeAudio.addEventListener('ended', () => {
    button.classList.remove('is-playing');
    button.setAttribute('aria-label', 'Включить аудиокомментарий');
  });

  activeAudio.addEventListener('error', () => {
    button.classList.remove('is-playing');
    button.setAttribute('aria-label', 'Аудиофайл не удалось загрузить');
  });

  void activeAudio.play().catch(() => {
    button.classList.remove('is-playing');
    button.setAttribute('aria-label', 'Включить аудиокомментарий');
  });
};
