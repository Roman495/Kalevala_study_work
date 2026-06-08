import './styles/main.css';
import { exhibits } from './data/exhibits';
import { getAudioLabels, initAudioButtons } from './utils/audio';
import { hasSeenRunosingerHint, markRunosingerHintSeen } from './utils/storage';
import { scrollToElement } from './utils/scroll';
import { asset, publicAsset } from './utils/assets';
import { initLoader } from './utils/loader';

document.documentElement.style.setProperty('--hero-bg-image', `url("${publicAsset('background.png')}")`);

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

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const initMapTooltip = (container: HTMLElement): void => {
  const stage = container.querySelector<HTMLElement>('.map-section__stage');
  const tooltip = container.querySelector<HTMLElement>('.map-tooltip');
  const tooltipTitle = tooltip?.querySelector<HTMLElement>('strong');
  const tooltipDescription = tooltip?.querySelector<HTMLElement>('span');

  if (!stage || !tooltip || !tooltipTitle || !tooltipDescription) return;

  const showTooltip = (region: HTMLElement): void => {
    const exhibitId = Number(region.dataset.exhibitId);
    const exhibit = exhibits.find((item) => item.id === exhibitId);

    if (!exhibit) return;

    tooltipTitle.textContent = exhibit.regionTitle;
    tooltipDescription.textContent = exhibit.regionDescription;
    tooltip.hidden = false;
    tooltip.classList.add('is-visible');
    positionTooltip(region);
  };

  const hideTooltip = (): void => {
    tooltip.classList.remove('is-visible');
    tooltip.hidden = true;
  };

  const positionTooltip = (region: HTMLElement): void => {
    const stageRect = stage.getBoundingClientRect();
    const regionRect = region.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const gap = 12;
    const padding = 12;
    const regionCenterX = regionRect.left - stageRect.left + regionRect.width / 2;
    const preferredTop = regionRect.top - stageRect.top - tooltipRect.height - gap;
    const fallbackTop = regionRect.bottom - stageRect.top + gap;
    const maxLeft = Math.max(padding, stageRect.width - tooltipRect.width - padding);
    const left = clamp(regionCenterX - tooltipRect.width / 2, padding, maxLeft);
    const top = preferredTop >= padding ? preferredTop : Math.min(fallbackTop, stageRect.height - tooltipRect.height - padding);

    tooltip.style.setProperty('--map-tooltip-x', `${left}px`);
    tooltip.style.setProperty('--map-tooltip-y', `${Math.max(padding, top)}px`);
  };

  container.querySelectorAll<HTMLElement>('.map-section__stage .map-region').forEach((region) => {
    region.addEventListener('pointerenter', () => showTooltip(region));
    region.addEventListener('pointermove', () => {
      if (!tooltip.hidden) positionTooltip(region);
    });
    region.addEventListener('pointerleave', hideTooltip);
    region.addEventListener('focus', () => showTooltip(region));
    region.addEventListener('blur', hideTooltip);
  });

  window.addEventListener('resize', hideTooltip);
};

export const renderMapSection = (container: HTMLElement): void => {
  container.innerHTML = `
    <section class="map-section reveal-section" id="map" aria-labelledby="map-section-title">
      <div class="map-section__copy">
        <p class="section-kicker">Интерактивный маршрут</p>
        <h2 id="map-section-title">Карта путешествия</h2>
        <p class="map-section__lead">Наведите на регион, чтобы узнать о нём больше, или нажмите, чтобы перейти к\u00A0экспонату</p>
      </div>
      <div class="map-section__route" aria-label="Карта мест виртуальной экскурсии">
        <div class="map-section__stage">
          <div class="map-section__water" aria-hidden="true"></div>
          ${exhibits
            .map(
              (exhibit, index) => `
                <button
                  class="map-region map-region--${index + 1}"
                  type="button"
                  data-exhibit-id="${exhibit.id}"
                  aria-current="false"
                  aria-describedby="map-region-tooltip"
                  aria-label="${escapeHtml(exhibit.regionTitle)}. ${escapeHtml(exhibit.regionDescription)} Перейти к экспонату: ${escapeHtml(exhibit.authorCaption)}"
                >
                  <img src="${asset(exhibit.mapImage)}" alt="" loading="eager" decoding="async" data-image-fallback="${escapeHtml(exhibit.regionTitle)}" />
                </button>
              `,
            )
            .join('')}
          <div class="map-tooltip" id="map-region-tooltip" role="tooltip" hidden>
            <strong></strong>
            <span></span>
          </div>
        </div>
        <div class="map-section__mobile-list" aria-label="Список регионов карты для мобильных устройств">
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
                  <img src="${asset(exhibit.mapImage)}" alt="" loading="lazy" decoding="async" data-image-fallback="${escapeHtml(exhibit.regionTitle)}" />
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

  initMapTooltip(container);

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
        <img src="${asset(exhibit.picture)}" alt="${escapeHtml(exhibit.authorCaption)}" loading="lazy" decoding="async" data-image-fallback="${escapeHtml(exhibit.authorCaption)}" />
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
          data-audio="${asset(exhibit.audio)}"
          data-audio-state="idle"
          aria-label="${audioLabels.listen}"
          aria-pressed="false"
          aria-busy="false"
          aria-describedby="audio-message-${exhibit.id}"
        >
          <img src="${publicAsset('icon_audio.png')}" alt="" aria-hidden="true" loading="lazy" decoding="async" />
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

app.innerHTML = `
  <header class="hero" id="top">
    <div class="hero__content">
      <p class="hero__eyebrow">Интерактивная виртуальная экскурсия</p>
      <h1 class="hero__title">
        <span>По местам</span>
        <span>Вяйнямёйнена</span>
      </h1>
      <p class="hero__lead">Взаимодействуйте с картой, чтобы отправиться к\u00A0экспонатам</p>
      <a href="#map" class="button button--primary hero__cta" data-scroll-target="map">К карте</a>
    </div>
  </header>
  <main>
    <div data-map-root></div>
    <section class="intro reveal-section" aria-label="О маршруте">
      <p>
        Совершите медленную прогулку по северному эпосу. Каждый регион карты связан
        с картиной, фрагментом руны и коротким аудиокомментарием
      </p>
    </section>
    <div class="exhibits" id="exhibits" aria-label="Экспонаты маршрута">
      ${exhibits.map(createExhibit).join('')}
    </div>
  </main>
  <footer class="footer">
    <p>Проект реализован в рамках практики. Скутельник Роман Николаевич, 2026</p>
  </footer>
`;


const mapRoot = document.querySelector<HTMLElement>('[data-map-root]');
if (mapRoot) renderMapSection(mapRoot);

document.querySelector<HTMLAnchorElement>('[data-scroll-target="map"]')?.addEventListener('click', (event) => {
  event.preventDefault();
  scrollToElement('map');
});

initLoader();
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
