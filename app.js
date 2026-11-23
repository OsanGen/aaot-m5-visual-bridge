'use strict';

const scenes = [
  { duration: 2100, hold: 6000, checkpoints: [1100] },
  { duration: 1800, hold: 8000, checkpoints: [], action: 'Show source roles' },
  { duration: 3550, hold: 12000, checkpoints: [650, 2250], action: 'Open the workflow' },
  { duration: 2200, hold: 10000, checkpoints: [] },
  { duration: 2100, hold: 8000, checkpoints: [650], action: 'Reveal the treatment' },
  { duration: 1400, hold: 8000, checkpoints: [] },
];

const byId = (id) => document.getElementById(id);
const pages = Array.from(document.querySelectorAll('.scene'));
const links = Array.from(document.querySelectorAll('.scene-index a'));
const previous = byId('previous');
const next = byId('next');
const reduced = byId('reduced');
const notes = byId('presenter-notes');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

const state = {
  sceneIndex: 0,
  time: 0,
  phase: 'ready',
  frame: null,
  lastTick: null,
  generation: 0,
  syncPreference: true,
};

function readMotion(element) {
  const { fadeOut, reveal, shift, direction, motion } = element.dataset;
  const [start, duration] = (fadeOut || reveal || shift).split('/').map(Number);

  return { element, start, duration, fadeOut, shift, direction, motion };
}

const motions = pages.map((page) =>
  Array.from(page.querySelectorAll('[data-reveal], [data-fade-out], [data-shift]'), readMotion),
);

function animateElement(item, time, isStatic) {
  const linear = Math.max(0, Math.min(1, (time - item.start) / item.duration));
  const eased = 1 - (1 - linear) ** 3;
  const opacity = item.shift ? 1 : item.fadeOut ? 1 - linear : linear;
  let moveX = 0;
  let moveY = 0;

  if (!isStatic) {
    if (item.motion === 'left' || item.shift) {
      const distance = item.direction === 'left' ? 25 : -18;
      moveX = (1 - eased) * distance;
    }
    if (item.motion === 'stack' || item.motion === 'insert') {
      moveY = (1 - eased) * (item.motion === 'stack' ? -13 : -16);
    }
  }

  const style = item.element.style;
  style.setProperty('--opacity', opacity.toFixed(3));
  style.setProperty('--visibility', opacity === 0 ? 'hidden' : 'visible');
  style.setProperty('--progress', eased.toFixed(3));
  style.setProperty('--move-x', moveX.toFixed(2) + 'px');
  style.setProperty('--move-y', moveY.toFixed(2) + 'px');
}

function paint() {
  const { sceneIndex, time } = state;
  const isStatic = reduced.checked;
  const scene = scenes[sceneIndex];
  pages[sceneIndex].classList.toggle('static-motion', isStatic);
  motions[sceneIndex].forEach((item) => animateElement(item, isStatic ? scene.duration : time, isStatic));
}

function updateControls() {
  const { phase, sceneIndex } = state;
  const scene = scenes[sceneIndex];
  const active = phase === 'playing';
  const stopped = phase === 'paused' || phase === 'checkpoint';
  const complete = phase === 'complete' || reduced.checked;

  previous.disabled = sceneIndex === 0;
  next.disabled = sceneIndex === scenes.length - 1;
  byId('play-label').textContent = active ? 'Pause'
    : stopped ? 'Resume'
    : complete ? 'Play again'
    : scene.action || 'Play';
  byId('play-icon').textContent = active ? 'Ⅱ' : '▶';

  let position = 'Scene ' + (sceneIndex + 1) + ' of ' + scenes.length;
  if (phase === 'checkpoint') position += ' · Paused at checkpoint';
  if (phase === 'paused') position += ' · Paused';
  if (complete) position += ' · Final state';
  const status = byId('position');
  if (status.textContent !== position) status.textContent = position;
}

function cancelFrame() {
  if (state.frame !== null) window.cancelAnimationFrame(state.frame);
  state.frame = null;
  state.lastTick = null;
  state.generation += 1;
}

function scheduleFrame() {
  const generation = state.generation;
  state.frame = window.requestAnimationFrame((timestamp) => {
    if (generation !== state.generation) return;

    state.frame = null;
    const scene = scenes[state.sceneIndex];
    const previousTime = state.time;
    const elapsed = Math.max(0, timestamp - state.lastTick);
    const end = scene.duration + scene.hold;
    const targetTime = Math.min(end, previousTime + elapsed);
    const checkpoint = scene.checkpoints.find((time) => previousTime < time && time <= targetTime);

    state.lastTick = timestamp;
    state.time = checkpoint ?? targetTime;
    if (previousTime < scene.duration) paint();

    if (checkpoint !== undefined || state.time === end) {
      state.phase = checkpoint !== undefined ? 'checkpoint' : 'complete';
      cancelFrame();
      updateControls();
      return;
    }

    scheduleFrame();
  });
}

function showFinal() {
  cancelFrame();
  state.time = scenes[state.sceneIndex].duration;
  state.phase = 'complete';
  paint();
  updateControls();
}

function play(fromStart = false) {
  if (fromStart) closeSceneDetails();

  if (reduced.checked) {
    showFinal();
    return;
  }

  if (state.phase === 'playing' && !fromStart) {
    cancelFrame();
    state.phase = 'paused';
    updateControls();
    return;
  }

  if (fromStart || state.phase === 'complete') {
    cancelFrame();
    state.time = 0;
    paint();
  }

  state.phase = 'playing';
  state.lastTick = window.performance.now();
  updateControls();
  scheduleFrame();
}

function closeSceneDetails() {
  pages[state.sceneIndex].querySelectorAll('.stage details').forEach((details) => {
    details.open = false;
  });
}

function showScene(index, focus = true) {
  if (index < 0 || index >= scenes.length) return;

  cancelFrame();
  state.sceneIndex = index;
  state.time = 0;
  state.phase = 'ready';

  pages.forEach((page, pageIndex) => {
    const current = pageIndex === index;
    page.hidden = !current;
    if (current) links[pageIndex].setAttribute('aria-current', 'step');
    else links[pageIndex].removeAttribute('aria-current');
  });

  const page = pages[index];
  closeSceneDetails();
  byId('notes-content').replaceChildren(page.querySelector('template.notes').content.cloneNode(true));
  paint();
  updateControls();

  if (focus) {
    page.querySelector('h1').focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
}

function setScene(index) {
  if (index < 0 || index >= scenes.length || index === state.sceneIndex) return;

  showScene(index);
  const hash = index > 0 ? '#scene-' + (index + 1) : '';
  if (window.location.hash !== hash) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search + hash);
  }
}

function hashIndex() {
  const active = /^#scene-([1-6])$/.exec(window.location.hash);
  return active ? Number(active[1]) - 1 : 0;
}

function applyReducedMotion() {
  cancelFrame();
  state.phase = reduced.checked ? 'complete' : 'ready';
  state.time = reduced.checked ? scenes[state.sceneIndex].duration : 0;
  paint();
  updateControls();
}

function addFallback(img) {
  const fallback = img.nextElementSibling;

  function showFallback() {
    if (img.hidden) return;
    img.hidden = true;
    fallback.hidden = false;
    console.warn('Teaching sticker unavailable:', img.getAttribute('src'));
  }

  img.addEventListener('error', showFallback);
  if (img.complete && img.naturalWidth === 0) showFallback();
}

links.forEach((link, index) => link.addEventListener('click', (event) => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  setScene(index);
}));

previous.addEventListener('click', () => setScene(state.sceneIndex - 1));
next.addEventListener('click', () => setScene(state.sceneIndex + 1));
byId('play').addEventListener('click', () => play());
byId('replay').addEventListener('click', () => play(true));
byId('show-final').addEventListener('click', showFinal);
byId('reset').addEventListener('click', () => {
  notes.open = false;
  if (state.sceneIndex === 0) showScene(0);
  else setScene(0);
});
reduced.addEventListener('change', () => {
  state.syncPreference = false;
  applyReducedMotion();
});
motionPreference.addEventListener('change', (event) => {
  if (!state.syncPreference) return;
  reduced.checked = event.matches;
  applyReducedMotion();
});
window.addEventListener('hashchange', () => showScene(hashIndex()));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && notes.open) {
    notes.open = false;
    notes.querySelector('summary').focus();
    return;
  }

  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.defaultPrevented
      || event.target.closest('button, a, summary, input, select, textarea, [contenteditable], [role="button"]')) return;

  const offset = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
  const destination = state.sceneIndex + offset;
  if (!offset || destination < 0 || destination >= scenes.length) return;

  event.preventDefault();
  setScene(destination);
});

document.querySelectorAll('.sticker img').forEach(addFallback);
reduced.checked = motionPreference.matches;
document.body.classList.add('enhanced');
showScene(hashIndex(), false);
byId('presenter-controls').hidden = false;
notes.hidden = false;
