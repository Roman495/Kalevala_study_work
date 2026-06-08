import './styles/main.css';
import { exhibits } from './data/exhibits';
import { playExhibitAudio } from './utils/audio';
import { hasSeenRunosingerHint, markRunosingerHintSeen } from './utils/storage';
import { scrollToElement } from './utils/scroll';

const assetPath = (path: string): string => `${import.meta.env.BASE_URL}${path}`.replace(/\/\//g, '/');
document.documentElement.style.setProperty('--tour-background-image', `url("${assetPath('background.png')}")`);

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App root was not found');
}

const createLoader = (): string => `
  <div class="loader" data-loader role="status" aria-live="polite">
    <div class="loader__ring" aria-hidden="true"></div>
    <p>Путь по водам Калевалы открывается…</p>
  </div>
`;

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const mapImagePath = (path: string): string => assetPath(path.replace(/^\.\//, ''));

export const scrollToExhibit = (id: number): void => {
  scrollToElement(`exhibit-${id}`);
};

export const renderHeroMap = (container: HTMLElement): void => {
  container.innerHTML = `
    <section class="hero-map" id="map" aria-labelledby="hero-map-title">
      <div class="hero-map__copy">
        <p class="hero__eyebrow">Интерактивная виртуальная экскурсия</p>
        <h1 id="hero-map-title">По местам Вяйнямёйнена</h1>
        <p class="hero__lead">Виртуальная экскурсия по образам “Калевалы”</p>
        <p class="hero-map__instruction">Выберите регион на карте, чтобы перейти к экспонату</p>
      </div>
      <div class="hero-map__stage" aria-label="Карта мест виртуальной экскурсии">
        <div class="hero-map__water" aria-hidden="true"></div>
        ${exhibits
          .map(
            (exhibit, index) => `
              <button
                class="map-region map-region--${index + 1}"
                type="button"
                data-exhibit-id="${exhibit.id}"
                aria-label="${escapeHtml(exhibit.regionTitle)}. ${escapeHtml(exhibit.regionDescription)} Перейти к экспонату: ${escapeHtml(exhibit.authorCaption)}"
              >
                <img src="${mapImagePath(exhibit.mapImage)}" alt="" loading="eager" />
                <span class="map-region__tooltip" role="tooltip">
                  <strong>${escapeHtml(exhibit.regionTitle)}</strong>
                  <span>${escapeHtml(exhibit.regionDescription)}</span>
                </span>
              </button>
            `,
          )
          .join('')}
      </div>
    </section>
  `;

  container.querySelectorAll<HTMLButtonElement>('[data-exhibit-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const exhibitId = Number(button.dataset.exhibitId);
      if (Number.isInteger(exhibitId)) scrollToExhibit(exhibitId);
    });
  });
};

const createExhibit = (exhibit: (typeof exhibits)[number], index: number): string => `
  <article class="exhibit" id="exhibit-${exhibit.id}" aria-labelledby="exhibit-${exhibit.id}-title">
    <div class="exhibit__number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</div>
    <div class="exhibit__image-panel">
      <img src="${exhibit.picture}" alt="${exhibit.authorCaption}" loading="lazy" />
      <p class="exhibit__caption" id="exhibit-${exhibit.id}-title">${exhibit.authorCaption}</p>
    </div>
    <div class="exhibit__content">
      <div class="exhibit__region">${exhibit.regionTitle}</div>
      <blockquote class="exhibit__runes">${exhibit.runes.replaceAll('\n', '<br />')}</blockquote>
      <div class="comment-card">
        <button
          class="audio-button"
          type="button"
          data-audio="${exhibit.audio}"
          aria-label="Включить аудиокомментарий"
        >
          <img src="${assetPath('icon_audio.png')}" alt="" aria-hidden="true" />
          <span class="audio-button__pulse" aria-hidden="true"></span>
        </button>
        <div class="runosinger-hint" data-runosinger-hint>
          Нажми на меня, и я расскажу об этом экспонате
        </div>
        <div>
          <h3>Комментарий рунопевца</h3>
          ${exhibit.comment
            .split('\n')
            .filter(Boolean)
            .map((paragraph) => `<p>${paragraph}</p>`)
            .join('')}
        </div>
      </div>
    </div>
  </article>
`;

app.innerHTML = `
  ${createLoader()}
  <header class="hero" id="top">
    <nav class="topbar" aria-label="Главная навигация">
      <a href="#top" class="brand">Kalevala Journey</a>
      <a href="#map">Карта</a>
      <a href="#exhibits">Экспонаты</a>
    </nav>
    <div data-hero-map-root></div>
  </header>
  <main>
    <section class="intro" aria-label="О маршруте">
      <p>
        Этот маршрут собран как медленная прогулка по северному эпосу: вода, голос,
        память и изображения соединяются в единую линию. Каждый регион карты связан
        с картиной, фрагментом руны и коротким аудиокомментарием.
      </p>
    </section>
    <section class="exhibits" id="exhibits" aria-label="Экспонаты маршрута">
      ${exhibits.map(createExhibit).join('')}
    </section>
  </main>
  <footer class="footer">
    <p>«По местам Вяйнямёйнена» — статический сайт для GitHub Pages.</p>
  </footer>
`;

window.addEventListener('load', () => {
  const loader = document.querySelector<HTMLElement>('[data-loader]');
  window.setTimeout(() => loader?.classList.add('loader--hidden'), 500);
});

const heroMapRoot = document.querySelector<HTMLElement>('[data-hero-map-root]');
if (heroMapRoot) renderHeroMap(heroMapRoot);

document.querySelectorAll<HTMLButtonElement>('[data-audio]').forEach((button) => {
  button.addEventListener('click', () => {
    const audio = button.dataset.audio;
    if (!audio) return;

    document.querySelectorAll<HTMLElement>('[data-runosinger-hint]').forEach((hint) => {
      hint.classList.add('runosinger-hint--hidden');
    });
    markRunosingerHintSeen();
    playExhibitAudio(audio, button);
  });
});

if (hasSeenRunosingerHint()) {
  document.querySelectorAll<HTMLElement>('[data-runosinger-hint]').forEach((hint) => {
    hint.classList.add('runosinger-hint--hidden');
  });
} else {
  document.querySelector<HTMLElement>('[data-runosinger-hint]')?.classList.add('runosinger-hint--visible');
}
