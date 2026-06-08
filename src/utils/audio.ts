export type AudioPlaybackState = 'idle' | 'loading' | 'playing' | 'paused';

let activeAudio: HTMLAudioElement | null = null;
let activeButton: HTMLButtonElement | null = null;
let activeSource = '';

const LISTEN_LABEL = 'Прослушать комментарий';
const PAUSE_LABEL = 'Поставить комментарий на паузу';
const LOADING_LABEL = 'Загрузка аудиокомментария';

const updateButtonState = (button: HTMLButtonElement, state: AudioPlaybackState): void => {
  const isPlaying = state === 'playing';
  const isLoading = state === 'loading';

  button.dataset.audioState = state;
  button.classList.toggle('is-playing', isPlaying);
  button.classList.toggle('is-loading', isLoading);
  button.classList.toggle('is-paused', state === 'paused');
  button.setAttribute('aria-pressed', String(isPlaying));
  button.setAttribute('aria-busy', String(isLoading));
  const labelText = isPlaying ? PAUSE_LABEL : isLoading ? LOADING_LABEL : LISTEN_LABEL;
  button.setAttribute('aria-label', labelText);

  const label = button.querySelector<HTMLElement>('[data-audio-label]');
  if (label) {
    label.textContent = labelText;
  }
};

const resetActiveButton = (state: AudioPlaybackState = 'idle'): void => {
  if (activeButton) {
    updateButtonState(activeButton, state);
  }
};

const isSameSource = (src: string): boolean => new URL(src, window.location.href).href === activeSource;

const stopActiveAudio = (): void => {
  if (!activeAudio) return;

  activeAudio.pause();
  activeAudio.currentTime = 0;
  resetActiveButton('idle');
};

export const stopExhibitAudio = (): void => {
  stopActiveAudio();
  activeAudio = null;
  activeButton = null;
  activeSource = '';
};

export const playExhibitAudio = (src: string, button: HTMLButtonElement): void => {
  if (activeAudio && isSameSource(src)) {
    if (activeAudio.paused) {
      updateButtonState(button, 'loading');
      void activeAudio
        .play()
        .then(() => updateButtonState(button, 'playing'))
        .catch(() => updateButtonState(button, 'paused'));
    } else {
      activeAudio.pause();
      updateButtonState(button, 'paused');
    }
    return;
  }

  stopActiveAudio();

  activeAudio = new Audio(src);
  activeButton = button;
  activeSource = new URL(src, window.location.href).href;
  activeAudio.preload = 'metadata';
  updateButtonState(button, 'loading');

  activeAudio.addEventListener('playing', () => updateButtonState(button, 'playing'));
  activeAudio.addEventListener('waiting', () => updateButtonState(button, 'loading'));
  activeAudio.addEventListener('ended', () => {
    updateButtonState(button, 'idle');
    activeAudio = null;
    activeButton = null;
    activeSource = '';
  });
  activeAudio.addEventListener('error', () => {
    updateButtonState(button, 'idle');
    activeAudio = null;
    activeButton = null;
    activeSource = '';
  });

  void activeAudio.play().catch(() => {
    updateButtonState(button, 'idle');
  });
};

export const initAudioButtons = (buttons: Iterable<HTMLButtonElement>, onFirstInteraction?: () => void): void => {
  Array.from(buttons).forEach((button) => {
    updateButtonState(button, 'idle');
    button.addEventListener('click', () => {
      const audio = button.dataset.audio;
      if (!audio) return;

      onFirstInteraction?.();
      playExhibitAudio(audio, button);
    });
  });
};

export const getAudioLabels = (): { listen: string; pause: string; loading: string } => ({
  listen: LISTEN_LABEL,
  pause: PAUSE_LABEL,
  loading: LOADING_LABEL,
});
