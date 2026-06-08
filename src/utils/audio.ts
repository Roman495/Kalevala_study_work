type AudioPlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'unavailable';

const LISTEN_LABEL = 'Прослушать аудиокомментарий';
const PAUSE_LABEL = 'Поставить аудиокомментарий на паузу';
const LOADING_LABEL = 'Загружается аудиокомментарий';
const UNAVAILABLE_LABEL = 'Аудиокомментарий сейчас недоступен';

let activeAudio: HTMLAudioElement | null = null;
let activeButton: HTMLButtonElement | null = null;
let activeSource = '';

const setAudioMessage = (button: HTMLButtonElement, message = ''): void => {
  const messageElement = button.parentElement?.querySelector<HTMLElement>('[data-audio-message]');
  if (messageElement) {
    messageElement.textContent = message;
    messageElement.toggleAttribute('hidden', message.length === 0);
  }
};

const updateButtonState = (button: HTMLButtonElement, state: AudioPlaybackState): void => {
  const isPlaying = state === 'playing';
  const isLoading = state === 'loading';
  const isUnavailable = state === 'unavailable';

  button.dataset.audioState = state;
  button.classList.toggle('is-playing', isPlaying);
  button.classList.toggle('is-loading', isLoading);
  button.classList.toggle('is-paused', state === 'paused');
  button.classList.toggle('is-unavailable', isUnavailable);
  button.disabled = isUnavailable;
  button.setAttribute('aria-pressed', String(isPlaying));
  button.setAttribute('aria-busy', String(isLoading));

  const labelText = isPlaying
    ? PAUSE_LABEL
    : isLoading
      ? LOADING_LABEL
      : isUnavailable
        ? UNAVAILABLE_LABEL
        : LISTEN_LABEL;
  button.setAttribute('aria-label', labelText);

  const label = button.querySelector<HTMLElement>('[data-audio-label]');
  if (label) {
    label.textContent = labelText;
  }

  setAudioMessage(button, isUnavailable ? UNAVAILABLE_LABEL : '');
};

const resetActiveButton = (state: AudioPlaybackState = 'idle'): void => {
  if (activeButton) {
    updateButtonState(activeButton, state);
  }
};

const isSameSource = (src: string): boolean => new URL(src, window.location.href).href === activeSource;

const releaseActiveAudio = (): void => {
  activeAudio = null;
  activeButton = null;
  activeSource = '';
};

const stopActiveAudio = (): void => {
  if (!activeAudio) return;

  activeAudio.pause();
  activeAudio.removeAttribute('src');
  activeAudio.load();
  resetActiveButton('idle');
};

const markAudioUnavailable = (button: HTMLButtonElement): void => {
  if (button === activeButton) {
    releaseActiveAudio();
  }
  updateButtonState(button, 'unavailable');
};

export const stopExhibitAudio = (): void => {
  stopActiveAudio();
  releaseActiveAudio();
};

export const playExhibitAudio = (src: string, button: HTMLButtonElement): void => {
  if (button.dataset.audioState === 'unavailable') return;

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

  const audio = new Audio();
  activeAudio = audio;
  activeButton = button;
  activeSource = new URL(src, window.location.href).href;
  audio.preload = 'metadata';
  audio.src = src;
  updateButtonState(button, 'loading');

  audio.addEventListener('playing', () => updateButtonState(button, 'playing'));
  audio.addEventListener('waiting', () => updateButtonState(button, 'loading'));
  audio.addEventListener('ended', () => {
    updateButtonState(button, 'idle');
    releaseActiveAudio();
  });
  audio.addEventListener('error', () => markAudioUnavailable(button), { once: true });

  void audio.play().catch(() => {
    updateButtonState(button, 'paused');
  });
};

export const initAudioButtons = (buttons: Iterable<HTMLButtonElement>, onFirstInteraction?: () => void): void => {
  Array.from(buttons).forEach((button) => {
    updateButtonState(button, 'idle');
    button.addEventListener('click', () => {
      const audio = button.dataset.audio;
      if (!audio) {
        markAudioUnavailable(button);
        return;
      }

      onFirstInteraction?.();
      playExhibitAudio(audio, button);
    });
  });
};

export const getAudioLabels = (): { listen: string; pause: string; loading: string; unavailable: string } => ({
  listen: LISTEN_LABEL,
  pause: PAUSE_LABEL,
  loading: LOADING_LABEL,
  unavailable: UNAVAILABLE_LABEL,
});
