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

const createMap = (): string => `
  <section class="map-section" id="map" aria-labelledby="map-title">
    <div class="section-kicker">Интерактивная карта</div>
    <h2 id="map-title">Выберите место сказания</h2>
    <p class="map-section__lead">
      Пять фрагментов карты покачиваются на воде. Наведите курсор или перейдите клавишей Tab,
      чтобы увидеть подсказку, и нажмите на регион для плавного перехода к экспонату.
    </p>
    <div class="map-board" aria-label="Карта мест виртуальной экскурсии">
      ${exhibits
        .map(
          (exhibit, index) => `
            <button
              class="map-region map-region--${index + 1}"
              type="button"
              data-target="${exhibit.id}"
              aria-label="${exhibit.regionTitle}. Перейти к экспонату: ${exhibit.autor}"
            >
              <img src="${assetPath(`map/${exhibit.map}`)}" alt="" loading="lazy" />
              <span class="map-region__tooltip" role="tooltip">
                <strong>${exhibit.regionTitle}</strong>
                <span>${exhibit.regionDescription}</span>
              </span>
            </button>
          `,
        )
        .join('')}
    </div>
  </section>
`;

const createExhibit = (exhibit: (typeof exhibits)[number], index: number): string => `
  <article class="exhibit" id="${exhibit.id}" aria-labelledby="${exhibit.id}-title">
    <div class="exhibit__number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</div>
    <div class="exhibit__image-panel">
      <img src="${assetPath(`pictures/${exhibit.pictures}`)}" alt="${exhibit.autor}" loading="lazy" />
      <p class="exhibit__caption" id="${exhibit.id}-title">${exhibit.autor}</p>
    </div>
    <div class="exhibit__content">
      <div class="exhibit__region">${exhibit.regionTitle}</div>
      <blockquote class="exhibit__runes">${exhibit.runes.replaceAll('\n', '<br />')}</blockquote>
      <div class="comment-card">
        <button
          class="audio-button"
          type="button"
          data-audio="${assetPath(`sound_comment/${exhibit.sound_comment}`)}"
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
          ${exhibit.comments
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
  <header class="hero">
    <nav class="topbar" aria-label="Главная навигация">
      <a href="#top" class="brand">Kalevala Journey</a>
      <a href="#map">Карта</a>
      <a href="#exhibits">Экспонаты</a>
    </nav>
    <div class="hero__content" id="top">
      <p class="hero__eyebrow">Виртуальная экскурсия-лонгрид</p>
      <h1>По местам Вяйнямёйнена</h1>
      <p class="hero__lead">
        Пять остановок по мотивам «Калевалы»: от берега Айно до горизонта,
        где старый песнопевец оставляет людям кантеле и песню.
      </p>
      <div class="hero__actions">
        <a class="button button--primary" href="#map">Открыть карту</a>
        <a class="button button--ghost" href="#exhibits">Смотреть экспонаты</a>
      </div>
    </div>
    <div class="hero__ornament" aria-hidden="true"></div>
  </header>
  <main>
    ${createMap()}
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

document.querySelectorAll<HTMLButtonElement>('[data-target]').forEach((button) => {
  button.addEventListener('click', () => {
    const target = button.dataset.target;
    if (target) scrollToElement(target);
  });
});

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
