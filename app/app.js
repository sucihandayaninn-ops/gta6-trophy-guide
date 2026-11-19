'use strict';

const trophies = trophyData.trophies;
const grades = ['platinum', 'gold', 'silver', 'bronze'];
const kindNames = {
  story: 'Story', activity: 'Activity', collectible: 'Collectible',
  stranger: 'Stranger', 'free-roam': 'Free roam', completion: 'Completion'
};
const riskNames = {
  story: 'Story progression', none: 'No risk indicated',
  check: 'Availability unclear', window: 'Potentially missable'
};
const difficultyNames = ['Easy', 'Easy', 'Moderate', 'Hard', 'Very hard'];
const params = new URLSearchParams(location.search);
const demo = params.get('demo') === '1';
const read = id => document.getElementById(id);
const list = read('trophy-list');
const guide = read('guide-card');
const ledger = read('trophies');
const mobile = matchMedia('(max-width: 780px)');
const platinum = trophies.find(trophy => trophy.grade === 'platinum');
const stageIndex = new Map(trophyRoute.map((stage, index) => [stage.id, index]));
const totals = Object.fromEntries(grades.map(grade => [grade, trophies.filter(t => t.grade === grade).length]));
const validGrade = value => grades.includes(value) ? value : 'all';
const routeFromHash = () => {
  const view = location.hash.slice(1);
  return ['trophies', 'roadmap'].includes(view) ? view : null;
};
const state = {
  earned: TrophyProgress.load(trophies, demo),
  spoilers: params.has('spoilers') ? params.get('spoilers') === '1' : !demo && TrophyProgress.readSpoilers(),
  grade: validGrade(params.get('grade')),
  stage: 'all',
  detailId: Number(params.get('guide')) || (params.get('grade') === 'silver' ? 17 : null),
  detailClosed: false,
  view: routeFromHash() ?? (params.get('view') === 'roadmap' ? 'roadmap' : 'trophies')
};

const icons = {
  trophy: '<path d="M8 3h8v5a4 4 0 0 1-8 0V3ZM8 5H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4m-4 1v5m-4 3h8m-7 0v-3h6v3"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
  arrow: '<path d="m9 5 7 7-7 7"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4m-4 4v2"/>',
  check: '<path d="m5 12 4 4L19 6"/>'
};

function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" aria-hidden="true">${icons[name]}</svg>`;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function gradeName(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function isSpoiler(trophy) {
  return state.spoilers && trophy.kind === 'story' && !state.earned.has(trophy.id);
}

function trophyTitle(trophy) {
  return isSpoiler(trophy) ? 'Hidden story trophy' : trophy.name;
}

function trophyDescription(trophy) {
  return isSpoiler(trophy) ? 'Earn this trophy to reveal its name and description.' : trophy.description;
}

function normalizeSearch(value) {
  return value.toLowerCase().normalize('NFKC').replace(/[’‘]/g, "'").trim();
}

function getVisibleTrophies() {
  const query = normalizeSearch(read('search').value);
  const kind = read('kind').value;
  const risk = read('risk').value;
  const status = read('status').value;
  const sort = read('sort').value;
  const visible = trophies.filter(trophy => {
    if (state.grade !== 'all' && trophy.grade !== state.grade) return false;
    if (state.stage !== 'all' && trophy.stage !== state.stage) return false;
    if (kind !== 'all' && trophy.kind !== kind) return false;
    if (risk !== 'all' && trophy.risk !== risk) return false;
    if (status !== 'all' && state.earned.has(trophy.id) !== (status === 'earned')) return false;
    return normalizeSearch(`${trophyTitle(trophy)} ${trophyDescription(trophy)}`).includes(query);
  });

  if (sort === 'name') visible.sort((a, b) => trophyTitle(a).localeCompare(trophyTitle(b)));
  if (sort === 'difficulty') visible.sort((a, b) => a.difficulty - b.difficulty || a.id - b.id);
  if (sort === 'roadmap') visible.sort((a, b) => stageIndex.get(a.stage) - stageIndex.get(b.stage) || (a.id === 1) - (b.id === 1) || a.id - b.id);
  return visible;
}

function renderProgress() {
  const count = state.earned.size;
  const required = trophies.length - 1;
  const nonPlatinum = count - Number(state.earned.has(platinum.id));
  read('earned-count').textContent = count;
  read('completion').textContent = `${Math.round(count / trophies.length * 100)}%`;
  read('progress').value = count;
  read('platinum-count').textContent = `${nonPlatinum} / ${required}`;
  read('platinum-status').textContent = state.earned.has(platinum.id)
    ? 'Platinum marked earned'
    : nonPlatinum === required ? 'All requirements tracked' : `${required - nonPlatinum} left for platinum`;
  read('grade-counts').innerHTML = grades.filter(grade => grade !== 'platinum').map(grade => {
    const earned = trophies.filter(trophy => trophy.grade === grade && state.earned.has(trophy.id)).length;
    return `<div class="grade-stat ${grade}">
      <span class="grade-symbol">${icon('trophy')}</span>
      <div><span>${gradeName(grade)}</span><strong>${earned}<small> / ${totals[grade]}</small></strong></div>
    </div>`;
  }).join('');
}

function renderGradeFilters() {
  read('grade-filters').innerHTML = ['all', ...grades].map(grade => {
    const label = grade === 'all' ? 'All grades' : gradeName(grade);
    const total = grade === 'all' ? trophies.length : totals[grade];
    return `<button type="button" class="grade-filter ${grade}" data-grade="${grade}" aria-pressed="${state.grade === grade}">
      ${grade === 'all' ? '' : '<i></i>'}${label} <small>${total}</small>
    </button>`;
  }).join('');
}

function renderTrophyRow(trophy) {
  const earned = state.earned.has(trophy.id);
  const active = state.detailId === trophy.id && !state.detailClosed;
  const title = escapeHTML(trophyTitle(trophy));
  const badge = trophy.risk === 'window' ? '<span class="risk-pill">Potentially missable</span>' : '';
  return `<div class="trophy-row ${trophy.grade}${active ? ' active' : ''}" data-id="${trophy.id}">
    <label class="check-control">
      <input type="checkbox" data-earned="${trophy.id}" aria-label="Earned: ${title}" ${earned ? 'checked' : ''}>
      <span aria-hidden="true">${icon('check')}</span>
    </label>
    <button type="button" class="trophy-trigger" data-detail="${trophy.id}" aria-expanded="${active}" aria-controls="guide-card">
      <span class="grade-symbol" title="${gradeName(trophy.grade)}">${icon('trophy')}</span>
      <span class="trophy-copy"><strong>${title}</strong><span>${escapeHTML(trophyDescription(trophy))}</span></span>
      ${badge}<span class="row-grade">${gradeName(trophy.grade)}</span>
      <span class="row-arrow">${icon('arrow')}</span>
    </button>
  </div>`;
}

function placeGuideCard() {
  const row = mobile.matches && !state.detailClosed && list.querySelector(`[data-id="${state.detailId}"]`);
  if (row) row.after(guide);
  else ledger.querySelector('.ledger-grid').append(guide);
}

function renderGuide(trophy) {
  guide.hidden = !trophy || state.detailClosed;
  if (guide.hidden) return;
  guide.className = `guide-card ${trophy.grade}`;
  const heading = `<div class="guide-top">
    <span class="eyebrow">TROPHY GUIDE</span>
    <button type="button" class="guide-close" aria-label="Close trophy guide">${icon('close')}</button>
  </div>
  <div class="guide-title"><span class="grade-symbol">${icon(isSpoiler(trophy) ? 'lock' : 'trophy')}</span>
    <div><p>${gradeName(trophy.grade)} · ${kindNames[trophy.kind]}</p><h3>${escapeHTML(trophyTitle(trophy))}</h3></div>
  </div>`;
  if (isSpoiler(trophy)) {
    guide.innerHTML = heading + '<p class="spoiler-note">This guide is hidden until you earn the trophy or turn off the story spoiler setting.</p>';
    return;
  }
  guide.innerHTML = heading + `
    <p class="official-description">${escapeHTML(trophy.description)}</p>
    <div class="guide-meta">
      <span><b>${trophy.difficulty}/5</b> ${difficultyNames[trophy.difficulty - 1]}</span>
      <span>${icon('clock')}${escapeHTML(trophy.time)} <small>EST.</small></span>
    </div>
    <div class="guide-body">
      <p class="when"><b>Where / when</b> ${escapeHTML(trophy.when)}</p>
      <h4>How to earn it</h4>
      <p>${escapeHTML(trophy.guide)}</p>
      <div class="risk-note ${trophy.risk}">
        <h4>${riskNames[trophy.risk]}</h4><p>${escapeHTML(trophy.missable)}</p>
      </div>
    </div>
    <p class="guide-source">Source · <b>PlayStation trophy list</b><br>Exophase &amp; PSNProfiles mirrors · Route estimates by Leonida Ledger</p>`;
}

function renderLedger() {
  const visible = getVisibleTrophies();
  if (!visible.some(trophy => trophy.id === state.detailId)) state.detailId = visible[0]?.id ?? null;
  const active = visible.find(trophy => trophy.id === state.detailId);
  if (guide.parentElement === list) ledger.querySelector('.ledger-grid').append(guide);
  list.innerHTML = visible.length ? visible.map(renderTrophyRow).join('') :
    '<div class="empty-list"><h3>No matching trophies</h3><p>Try a different search or clear the filters.</p></div>';

  const stage = trophyRoute.find(stage => stage.id === state.stage);
  read('result-count').textContent = stage
    ? `${visible.length} of ${trophies.length} trophies · ${stage.short}`
    : `${visible.length} of ${trophies.length} trophies`;
  read('clear').hidden = state.grade === 'all' && !stage && ['search', 'kind', 'risk', 'status', 'sort'].every(id =>
    read(id).value === ({ search: '', kind: 'all', risk: 'all', status: 'all', sort: 'official' })[id]
  );
  renderGuide(active);
  placeGuideCard();
}

function renderRoadmap() {
  read('route-stages').innerHTML = trophyRoute.map((stage, index) => {
    const entries = trophies.filter(trophy => trophy.stage === stage.id);
    const complete = entries.filter(trophy => state.earned.has(trophy.id)).length;
    const safeStory = stage.id === 'story' && state.spoilers;
    const lead = safeStory ? stage.spoilerFree : stage.lead;
    const points = safeStory ? [stage.safePoint, stage.points[1]] : stage.points;
    return `<article class="route-card">
      <div class="route-phase"><span class="phase-number">0${index + 1}</span><span>${complete} / ${entries.length} earned</span></div>
      <h3>${stage.title}</h3><p class="route-lead">${lead}</p>
      <ul>${points.map(point => `<li>${point}</li>`).join('')}</ul>
      <button type="button" class="route-link" data-stage="${stage.id}">View trophies ${icon('arrow')}</button>
    </article>`;
  }).join('');
  const watch = trophies.filter(trophy => trophy.risk === 'window');
  read('route-watchlist').innerHTML = `<h3>Potential missables</h3>
    <p>The official list gives no confirmed lockouts. Make separate saves before these opportunities while they are available.</p>
    <div class="watch-links">${watch.map(trophy =>
      `<button type="button" class="button" data-open="${trophy.id}">${escapeHTML(trophyTitle(trophy))}${icon('arrow')}</button>`
    ).join('')}</div>`;
}

function showView(view, scroll) {
  state.view = view;
  document.body.classList.toggle('compact-header', view === 'roadmap' || validGrade(params.get('grade')) !== 'all');
  ledger.hidden = view !== 'trophies';
  read('roadmap').hidden = view !== 'roadmap';
  for (const link of document.querySelectorAll('nav [data-view]')) {
    if (link.dataset.view === view) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  if (view === 'roadmap') renderRoadmap();
  if (scroll) window.scrollTo({ top: 0 });
}

function clearFilters() {
  state.grade = 'all';
  state.stage = 'all';
  state.detailClosed = false;
  read('search').value = '';
  for (const id of ['kind', 'risk', 'status']) read(id).value = 'all';
  read('sort').value = 'official';
}

function setSpoilers(hidden) {
  state.spoilers = hidden;
  read('spoilers').checked = hidden;
  read('roadmap-spoilers').checked = hidden;
  if (!demo) TrophyProgress.saveSpoilers(hidden);
  renderLedger();
  renderRoadmap();
}

function reportSave(message, error = false) {
  const status = read('save-message');
  status.textContent = message;
  status.classList.toggle('error', error);
  status.hidden = !message;
}

function persistProgress() {
  if (demo) return true;
  return TrophyProgress.save(state.earned);
}

function exportProgress() {
  const url = URL.createObjectURL(new Blob([TrophyProgress.serialize(state.earned)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'leonida-ledger-progress.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  reportSave('Progress exported.');
}

async function importProgress(input) {
  const file = input.files[0];
  input.value = '';
  if (!file) return;
  try {
    if (file.size > 128 * 1024) throw new Error('Progress files must be under 128 KiB.');
    state.earned = TrophyProgress.readRecord(JSON.parse(await file.text()), trophies);
    const saved = persistProgress();
    reportSave(saved ? `Imported ${state.earned.size} earned trophies${demo ? ' into this demo session' : ''}.` :
      'Imported for this session. Browser storage is unavailable.', !saved);
    renderProgress();
    renderLedger();
  } catch (error) {
    reportSave(error instanceof SyntaxError ? 'Invalid JSON. Your progress is unchanged.' : error.message, true);
  }
}

read('demo-label').hidden = !demo;
read('spoilers').checked = state.spoilers;
read('roadmap-spoilers').checked = state.spoilers;
read('spoilers').addEventListener('change', event => setSpoilers(event.target.checked));
read('roadmap-spoilers').addEventListener('change', event => setSpoilers(event.target.checked));
read('export').addEventListener('click', exportProgress);
read('import').addEventListener('change', event => importProgress(event.target));
read('search').addEventListener('input', renderLedger);
for (const id of ['kind', 'risk', 'status', 'sort']) read(id).addEventListener('change', renderLedger);
read('clear').addEventListener('click', () => {
  clearFilters();
  renderGradeFilters();
  renderLedger();
  read('search').focus();
});
read('grade-filters').addEventListener('click', event => {
  const button = event.target.closest('[data-grade]');
  if (!button) return;
  state.grade = button.dataset.grade;
  state.detailClosed = false;
  renderGradeFilters();
  renderLedger();
  read('grade-filters').querySelector(`[data-grade="${state.grade}"]`).focus();
});
list.addEventListener('click', event => {
  const button = event.target.closest('[data-detail]');
  if (!button) return;
  const id = Number(button.dataset.detail);
  state.detailClosed = id === state.detailId && !state.detailClosed;
  state.detailId = id;
  renderLedger();
  list.querySelector(`[data-detail="${id}"]`)?.focus({ preventScroll: true });
});
list.addEventListener('change', event => {
  if (!event.target.matches('[data-earned]')) return;
  const id = Number(event.target.dataset.earned);
  if (event.target.checked) state.earned.add(id);
  else state.earned.delete(id);
  if (!persistProgress()) reportSave('Browser storage is unavailable. Export JSON to keep your changes.', true);
  renderProgress();
  renderLedger();
  (list.querySelector(`[data-earned="${id}"]`) ?? list.querySelector('[data-earned]') ?? read('status')).focus({ preventScroll: true });
});
guide.addEventListener('click', event => {
  if (!event.target.closest('.guide-close')) return;
  state.detailClosed = true;
  renderLedger();
  list.querySelector(`[data-detail="${state.detailId}"]`)?.focus({ preventScroll: true });
});
document.querySelectorAll('[data-view]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  const view = link.dataset.view;
  history.replaceState(null, '', `#${view}`);
  showView(view, true);
}));
read('roadmap').addEventListener('click', event => {
  const button = event.target.closest('[data-stage], [data-open]');
  if (!button) return;
  clearFilters();
  state.stage = button.dataset.stage ?? 'all';
  state.detailId = Number(button.dataset.open) || null;
  if (button.dataset.open) read('risk').value = 'window';
  renderGradeFilters();
  renderLedger();
  history.replaceState(null, '', '#trophies');
  showView('trophies', false);
  ledger.scrollIntoView();
  (list.querySelector('.active [data-detail]') ?? read('search')).focus({ preventScroll: true });
});
window.addEventListener('hashchange', () => {
  const view = routeFromHash();
  if (view) showView(view, false);
});
mobile.addEventListener('change', placeGuideCard);
renderProgress();
renderGradeFilters();
renderLedger();
showView(state.view, false);
document.documentElement.dataset.ready = 'true';
