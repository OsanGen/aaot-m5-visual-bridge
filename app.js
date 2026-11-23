'use strict';

const scenes = Array.from(document.querySelectorAll('.scene'));
const previous = document.getElementById('previous');
const next = document.getElementById('next');
const announcement = document.getElementById('scene-announcement');
let current = 0;

function showScene(index) {
  current = index;
  scenes.forEach((scene, position) => {
    scene.hidden = position !== index;
  });
  previous.setAttribute('aria-disabled', String(index === 0));
  next.setAttribute('aria-disabled', String(index === scenes.length - 1));

  const title = scenes[index].querySelector('h1').textContent;
  announcement.textContent = 'Scene ' + (index + 1) + ' of ' + scenes.length + '. ' + title;
}

function navigate(offset) {
  const index = current + offset;
  if (index < 0 || index >= scenes.length) return;

  showScene(index);
  const hash = index === 0 ? '' : '#' + scenes[index].id;
  window.history.replaceState(null, '', window.location.pathname + window.location.search + hash);
  window.scrollTo(0, 0);
}

function syncLocation() {
  const index = scenes.findIndex((scene) => '#' + scene.id === window.location.hash);
  showScene(Math.max(0, index));
}

function addFallback(img) {
  function showFallback() {
    if (img.hidden) return;
    img.hidden = true;
    img.nextElementSibling.hidden = false;
    console.warn('Teaching sticker unavailable:', img.getAttribute('src'));
  }

  img.addEventListener('error', showFallback);
  if (img.complete && img.naturalWidth === 0) showFallback();
}

previous.addEventListener('click', () => navigate(-1));
next.addEventListener('click', () => navigate(1));
window.addEventListener('hashchange', syncLocation);
document.querySelectorAll('.sticker img').forEach(addFallback);
syncLocation();
document.querySelector('.scene-controls').hidden = false;
