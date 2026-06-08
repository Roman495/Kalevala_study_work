import './styles/main.css';
import { exhibits } from './data/exhibits';
import { getAudioLabels, initAudioButtons } from './utils/audio';
import { hasSeenRunosingerHint, markRunosingerHintSeen } from './utils/storage';
import { scrollToElement } from './utils/scroll';
import { initLoader } from './utils/loader';

const assetPath = (path: string): string => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
document.documentElement.style.setProperty('--tour-background-image', `url("${assetPath('background.png')}")`);

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App root was not found');
}

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const publicAssetPath = (path: string): string => assetPath(path.replace(/^\.\//, ''));
const mapImagePath = publicAssetPath;
const audioLabels = getAudioLabels();

const preserveRuneLineBreaks = (value: string): string => escapeHtml(value).replaceAll('\n', '<br />');

const renderCommentParagraphs = (value: string): string =>
  value
    .split('\n')
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join('');

export const scrollToExhibit = (id: number): void => {
  scrollToElement(`exhibit-${id}`);
};

export const renderHeroMap = (container: HTMLElement): void => {
  container.innerHTML = `
    <section class="hero-map reveal-section" id="map" aria-labelledby="hero-map-title">
      <div class="hero-map__copy">
        <p class="hero__eyebrow">Интерактивная виртуальная экскурсия</p>
        <h1 id="hero-map-title">По местам Вяйнямёйнена</h1>
        <p class="hero__lead">Виртуальная экскурсия по образам “Калевалы”</p>
        <p class="hero-map__instruction">Выберите регион на карте, чтобы перейти к экспонату</p>
      </div>
      <div class="hero-map__route" aria-label="Карта мест виртуальной экскурсии">
        <div class="hero-map__stage">
          <div class="hero-map__water" aria-hidden="true"></div>
          ${exhibits
            .map(
              (exhibit, index) => `
                <button
                  class="map-region map-region--${index + 1}"
                  type="button"
                  data-exhibit-id="${exhibit.id}"
                  aria-current="false"
                  aria-describedby="map-region-tooltip-${exhibit.id}"
                  aria-label="${escapeHtml(exhibit.regionTitle)}. ${escapeHtml(exhibit.regionDescription)} Перейти к экспонату: ${escapeHtml(exhibit.authorCaption)}"
                >
                  <img src="${mapImagePath(exhibit.mapImage)}" alt="" loading="eager" decoding="async" data-image-fallback="${escapeHtml(exhibit.regionTitle)}" />
                  <span class="map-region__tooltip" id="map-region-tooltip-${exhibit.id}" role="tooltip">
                    <strong>${escapeHtml(exhibit.regionTitle)}</strong>
                    <span>${escapeHtml(exhibit.regionDescription)}</span>
                  </span>
                </button>
              `,
            )
            .join('')}
        </div>
        <div class="hero-map__mobile-list" aria-label="Список регионов карты для мобильных устройств">
          ${exhibits
            .map(
              (exhibit) => `
                <button
                  class="map-region-card"
                  type="button"
                  data-exhibit-id="${exhibit.id}"
                  aria-current="false"
                  aria-label="Перейти к экспонату: ${escapeHtml(exhibit.authorCaption)}"
                >
                  <img src="${mapImagePath(exhibit.mapImage)}" alt="" loading="lazy" decoding="async" data-image-fallback="${escapeHtml(exhibit.regionTitle)}" />
                  <span>
                    <strong>${escapeHtml(exhibit.regionTitle)}</strong>
                    <small>${escapeHtml(exhibit.regionDescription)}</small>
                  </span>
                </button>
              `,
            )
            .join('')}
        </div>
      </div>
    </section>
  `;

  container.querySelectorAll<HTMLButtonElement>('[data-exhibit-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const exhibitId = Number(button.dataset.exhibitId);
      if (Number.isInteger(exhibitId)) {
        setActiveMapRegion(exhibitId);
        scrollToExhibit(exhibitId);
      }
    });
  });
};

const createExhibit = (exhibit: (typeof exhibits)[number], index: number): string => {
  const nextExhibit = exhibits[index + 1];
  const navigationTarget = nextExhibit ? `#exhibit-${nextExhibit.id}` : '#map';
  const navigationLabel = nextExhibit ? 'Следующий экспонат' : 'Вернуться к карте';

  return `
    <section class="exhibit-section reveal-section" id="exhibit-${exhibit.id}" data-exhibit-section="${exhibit.id}" aria-labelledby="exhibit-${exhibit.id}-title">
      <div class="exhibit__number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</div>
      <figure class="exhibit__image-panel">
        <img src="${publicAssetPath(exhibit.picture)}" alt="${escapeHtml(exhibit.authorCaption)}" loading="lazy" decoding="async" data-image-fallback="${escapeHtml(exhibit.authorCaption)}" />
        <figcaption class="exhibit__caption" id="exhibit-${exhibit.id}-title">${escapeHtml(exhibit.authorCaption)}</figcaption>
      </figure>
      <div class="exhibit__rune-panel">
        <div class="exhibit__region">${escapeHtml(exhibit.regionTitle)}</div>
        <blockquote class="exhibit__runes">${preserveRuneLineBreaks(exhibit.runes)}</blockquote>
      </div>
      <div class="comment-card">
        <button
          class="audio-button"
          type="button"
          data-audio="${publicAssetPath(exhibit.audio)}"
          data-audio-state="idle"
          aria-label="${audioLabels.listen}"
          aria-pressed="false"
          aria-busy="false"
          aria-describedby="audio-message-${exhibit.id}"
        >
          <img src="${assetPath('icon_audio.png')}" alt="" aria-hidden="true" loading="lazy" decoding="async" />
          <span class="audio-button__pulse" aria-hidden="true"></span>
          <span class="audio-button__wave audio-button__wave--one" aria-hidden="true"></span>
          <span class="audio-button__wave audio-button__wave--two" aria-hidden="true"></span>
          <span class="audio-button__label" data-audio-label>${audioLabels.listen}</span>
        </button>
        <p class="audio-message" id="audio-message-${exhibit.id}" data-audio-message role="status" aria-live="polite" hidden></p>
        ${
          index === 0
            ? `<div class="runosinger-hint" data-runosinger-hint role="status">
                <p>Нажми на меня, и я расскажу об этом экспонате</p>
                <button class="runosinger-hint__close" type="button" data-runosinger-hint-close aria-label="Закрыть подсказку">×</button>
              </div>`
            : ''
        }
        <div class="comment-card__text">
          <h3>Комментарий рунопевца</h3>
          ${renderCommentParagraphs(exhibit.comment)}
        </div>
      </div>
      <nav class="exhibit-nav" aria-label="Навигация по экспонатам">
        <a class="button button--exhibit" href="${navigationTarget}">${navigationLabel}</a>
      </nav>
    </section>
  `;
};

const initImageFallbacks = (): void => {
  document.querySelectorAll<HTMLImageElement>('[data-image-fallback]').forEach((image) => {
    image.addEventListener(
      'error',
      () => {
        const fallbackText = image.dataset.imageFallback || 'Изображение временно недоступно';
        const panel = image.closest<HTMLElement>('.exhibit__image-panel, .map-region, .map-region-card');
        panel?.classList.add('has-image-error');
        image.hidden = true;
        image.insertAdjacentHTML(
          'afterend',
          `<span class="image-fallback" role="img" aria-label="${escapeHtml(fallbackText)}"><span aria-hidden="true">ᚲ</span><span>Изображение временно недоступно</span></span>`,
        );
      },
      { once: true },
    );
  });
};

const setActiveMapRegion = (id: number | null): void => {
  document.querySelectorAll<HTMLElement>('[data-exhibit-id]').forEach((button) => {
    const isActive = id !== null && Number(button.dataset.exhibitId) === id;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-current', isActive ? 'true' : 'false');
  });
};

const initScrollReveal = (): void => {
  const revealItems = Array.from(document.querySelectorAll<HTMLElement>('.reveal-section'));

  if (!('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.16 },
  );

  revealItems.forEach((item) => revealObserver.observe(item));
};

const initActiveMapRegions = (): void => {
  const exhibitSections = Array.from(document.querySelectorAll<HTMLElement>('[data-exhibit-section]'));

  if (!('IntersectionObserver' in window) || exhibitSections.length === 0) return;

  const activeObserver = new IntersectionObserver(
    (entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

      if (!visibleEntry) return;

      const exhibitId = Number((visibleEntry.target as HTMLElement).dataset.exhibitSection);
      if (Number.isInteger(exhibitId)) setActiveMapRegion(exhibitId);
    },
    { rootMargin: '-30% 0px -45% 0px', threshold: [0.12, 0.35, 0.6] },
  );

  exhibitSections.forEach((section) => activeObserver.observe(section));
};

initLoader();

app.innerHTML = `
  <header class="hero" id="top">
    <nav class="topbar" aria-label="Главная навигация">
      <a href="#top" class="brand">Kalevala Journey</a>
      <a href="#map">Карта</a>
      <a href="#exhibits">Экспонаты</a>
    </nav>
    <div data-hero-map-root></div>
  </header>
  <main>
    <section class="intro reveal-section" aria-label="О маршруте">
      <p>
        Этот маршрут собран как медленная прогулка по северному эпосу: вода, голос,
        память и изображения соединяются в единую линию. Каждый регион карты связан
        с картиной, фрагментом руны и коротким аудиокомментарием.
      </p>
    </section>
    <div class="exhibits" id="exhibits" aria-label="Экспонаты маршрута">
      ${exhibits.map(createExhibit).join('')}
    </div>
  </main>
  <footer class="footer">
    <p>«По местам Вяйнямёйнена» — статический сайт для GitHub Pages.</p>
  </footer>
`;


const heroMapRoot = document.querySelector<HTMLElement>('[data-hero-map-root]');
if (heroMapRoot) renderHeroMap(heroMapRoot);

initImageFallbacks();
initScrollReveal();
initActiveMapRegions();


const hideRunosingerHint = (): void => {
  document.querySelectorAll<HTMLElement>('[data-runosinger-hint]').forEach((hint) => {
    hint.classList.remove('runosinger-hint--visible');
    hint.classList.add('runosinger-hint--hidden');
  });
  markRunosingerHintSeen();
};

initAudioButtons(document.querySelectorAll<HTMLButtonElement>('[data-audio]'), hideRunosingerHint);

document.querySelectorAll<HTMLButtonElement>('[data-runosinger-hint-close]').forEach((button) => {
  button.addEventListener('click', hideRunosingerHint);
});

const runosingerHint = document.querySelector<HTMLElement>('[data-runosinger-hint]');
if (!runosingerHint || hasSeenRunosingerHint()) {
  runosingerHint?.classList.add('runosinger-hint--hidden');
} else {
  runosingerHint.classList.add('runosinger-hint--visible');
}
