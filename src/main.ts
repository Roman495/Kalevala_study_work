import './styles/main.css';
import { exhibits } from './data/exhibits';
import { playExhibitAudio } from './utils/audio';
import { hasSeenRunosingerHint, markRunosingerHintSeen } from './utils/storage';
import { scrollToElement } from './utils/scroll';
import { initLoader } from './utils/loader';

const assetPath = (path: string): string => `${import.meta.env.BASE_URL}${path}`.replace(/\/\//g, '/');
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

const createExhibit = (exhibit: (typeof exhibits)[number], index: number): string => {
  const nextExhibit = exhibits[index + 1];
  const navigationTarget = nextExhibit ? `#exhibit-${nextExhibit.id}` : '#map';
  const navigationLabel = nextExhibit ? 'Следующий экспонат' : 'Вернуться к карте';

  return `
    <section class="exhibit-section" id="exhibit-${exhibit.id}" aria-labelledby="exhibit-${exhibit.id}-title">
      <div class="exhibit__number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</div>
      <figure class="exhibit__image-panel">
        <img src="${publicAssetPath(exhibit.picture)}" alt="${escapeHtml(exhibit.authorCaption)}" loading="lazy" />
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
          aria-label="Включить аудиокомментарий"
        >
          <img src="${assetPath('icon_audio.png')}" alt="" aria-hidden="true" />
          <span class="audio-button__pulse" aria-hidden="true"></span>
        </button>
        <div class="runosinger-hint" data-runosinger-hint>
          Нажми на меня, и я расскажу об этом экспонате
        </div>
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
    <section class="intro" aria-label="О маршруте">
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
