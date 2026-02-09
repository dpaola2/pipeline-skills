// Pipeline stages in order
const STAGES = [
  { stage: 0, name: 'PRD', label: 'S0', icon: 'icon-prd' },
  { stage: 1, name: 'Discovery', label: 'S1', icon: 'icon-discovery' },
  { stage: 2, name: 'Architecture', label: 'S2', icon: 'icon-architecture' },
  { stage: -1, name: 'Human Review', label: 'HC', icon: 'icon-checkpoint', checkpoint: true },
  { stage: 3, name: 'Gameplan', label: 'S3', icon: 'icon-gameplan' },
  { stage: -2, name: 'Human Review', label: 'HC', icon: 'icon-checkpoint', checkpoint: true },
  { stage: 4, name: 'Test Gen', label: 'S4', icon: 'icon-testgen' },
  { stage: 5, name: 'Implement', label: 'S5', icon: 'icon-implement' },
  { stage: 7, name: 'QA Plan', label: 'S7', icon: 'icon-qa' },
  { stage: -3, name: 'Pull Request', label: 'PR', icon: 'icon-pr', pr: true },
  { stage: 99, name: 'Complete', label: '', icon: 'icon-chest', chest: true },
];

const ROW1 = STAGES.slice(0, 6);   // S0 → HC (after S2)
const ROW2 = STAGES.slice(6);      // S4 → Complete (rendered right-to-left)

let autoRefresh = false;
let autoTimer = null;

fetch('/img/sprites.svg')
  .then(r => r.text())
  .then(svg => { document.getElementById('svg-sprites').innerHTML = svg; });

async function loadData() {
  const btn = document.getElementById('btn-refresh');
  btn.textContent = '...';
  try {
    const [projRes, metRes] = await Promise.all([
      fetch('/api/projects'),
      fetch('/api/metrics'),
    ]);
    const projData = await projRes.json();
    const metData = await metRes.json();
    renderSnake(projData.projects);
    renderStats(projData.projects, metData);
  } catch (err) {
    const loading = document.getElementById('loading');
    if (loading) loading.textContent = 'Error: ' + err.message;
  } finally {
    btn.textContent = 'Refresh';
  }
}

function getProjectStageSlot(project) {
  if (project.status === 'completed') return 99;
  if (project.prUrl && project.currentStage >= 5) return -3;
  if (project.currentStage === 2 && project.waitingForHuman) return -1;
  if (project.currentStage === 3 && project.waitingForHuman) return -2;
  return project.currentStage;
}

function renderSnake(projects) {
  const container = document.getElementById('assembly-line');

  const groups = {};
  for (const p of projects) {
    const slot = getProjectStageSlot(p);
    if (!groups[slot]) groups[slot] = [];
    groups[slot].push(p);
  }

  const activeStages = new Set(
    projects.filter(p => p.status !== 'completed' && p.status !== 'draft')
      .map(p => getProjectStageSlot(p))
  );

  // Row 1: left to right, machines on top
  let html = '<div class="snake-row">';
  // Machines sub-row
  html += '<div class="snake-machines-row">';
  ROW1.forEach((s, i) => {
    if (i > 0) html += '<div class="snake-belt-h-spacer"></div>';
    html += renderMachine(s, groups, activeStages);
  });
  html += '</div>';
  // Belt sub-row
  html += '<div class="snake-belt-row">';
  ROW1.forEach((s, i) => {
    if (i > 0) html += '<div class="snake-belt-h"></div>';
    html += renderBelt(s, groups);
  });
  html += '</div>';
  html += '</div>';

  // Turn connector (right side)
  html += '<div class="snake-turn-right"><div class="snake-turn-belt"><div class="conveyor-belt-vertical"></div></div></div>';

  // Row 2: right to left, machines on bottom
  const row2Reversed = [...ROW2].reverse();
  html += '<div class="snake-row">';
  // Belt sub-row (on top for row 2)
  html += '<div class="snake-belt-row belt-reverse">';
  row2Reversed.forEach((s, i) => {
    if (i > 0) html += '<div class="snake-belt-h"></div>';
    html += renderBelt(s, groups);
  });
  html += '</div>';
  // Machines sub-row (on bottom for row 2)
  html += '<div class="snake-machines-row">';
  row2Reversed.forEach((s, i) => {
    if (i > 0) html += '<div class="snake-belt-h-spacer"></div>';
    html += renderMachine(s, groups, activeStages);
  });
  html += '</div>';
  html += '</div>';

  container.innerHTML = html;

  // Wire up item hover/click
  container.querySelectorAll('.belt-item').forEach(el => {
    el.addEventListener('click', () => {
      window.location.href = '/project/' + el.dataset.slug;
    });
  });
}

function renderMachine(s, groups, activeStages) {
  const items = groups[s.stage] || [];
  const hasActive = activeStages.has(s.stage);
  const hasItems = items.length > 0;

  let cls = 'stage-machine';
  if (s.checkpoint) {
    cls += ' checkpoint';
    if (hasActive) cls += ' waiting';
  } else if (s.chest) {
    if (hasItems) cls += ' completed';
  } else if (hasActive) {
    cls += ' active';
  }

  return `<div class="snake-machine">
    <div class="${cls}" title="${s.label ? s.label + ': ' : ''}${s.name}">
      <svg class="stage-icon"><use href="#${s.icon}"/></svg>
    </div>
    <div class="snake-machine-label">${s.label || '✓'}</div>
  </div>`;
}

function renderBelt(s, groups) {
  const items = groups[s.stage] || [];
  const hasItems = items.length > 0;

  const beltItems = items.map(p => {
    const statusClass = p.status === 'completed' ? 'item-complete' :
                        p.status === 'in_progress' ? 'item-active' :
                        p.waitingForHuman ? 'item-waiting' : 'item-draft';
    const milestones = p.totalMilestones > 0 ? ` ${p.completedMilestones}/${p.totalMilestones}` : '';
    const level = p.level ? `L${p.level}` : '';
    return `<div class="belt-item ${statusClass}" data-slug="${p.slug}" title="${escapeAttr(p.title || p.slug)}${milestones ? '\n' + milestones + ' milestones' : ''}">
      <span class="item-name">${escapeHtml(shortName(p.title || p.slug))}</span>
      ${level ? `<span class="item-level">${level}</span>` : ''}
      ${milestones ? `<span class="item-ms">${milestones.trim()}</span>` : ''}
    </div>`;
  }).join('');

  return `<div class="snake-belt-section${hasItems ? ' has-items' : ''}">
    <div class="belt-track"></div>
    <div class="belt-items">${beltItems}</div>
  </div>`;
}

function shortName(name) {
  // Abbreviate long names to fit on belt items
  if (name.length <= 16) return name;
  return name
    .replace(/^Fix /, '')
    .replace(/^Add /, '')
    .replace(/ — .*/, '')
    .replace(/ Report$/, ' Rpt')
    .replace(/ Migration$/, ' Migr.')
    .replace(/ Feature Flag$/, ' FF')
    .substring(0, 18);
}

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/\n/g, '&#10;');
}

function renderStats(projects, metrics) {
  const panel = document.getElementById('stats-panel');
  const grid = document.getElementById('stats-grid');
  panel.style.display = 'block';

  const completed = projects.filter(p => p.status === 'completed').length;
  const inProgress = projects.filter(p => p.status === 'in_progress').length;
  const draft = projects.filter(p => p.status === 'draft').length;
  const totalMilestones = projects.reduce((sum, p) => sum + p.completedMilestones, 0);
  const sp = metrics.speed || {};

  const stats = [
    { value: completed, label: 'Completed' },
    { value: inProgress, label: 'In Progress' },
    { value: draft, label: 'Draft' },
    { value: totalMilestones, label: 'Milestones' },
    { value: sp['Median milestone delta'] || '—', label: 'Median / MS' },
    { value: sp['Fastest milestone']?.split(':')[1]?.trim() || '—', label: 'Fastest MS' },
  ];

  grid.innerHTML = stats.map(s => `
    <div class="stat-card">
      <div class="stat-value">${s.value}</div>
      <div class="stat-label">${s.label}</div>
    </div>
  `).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.getElementById('btn-refresh').addEventListener('click', loadData);
document.getElementById('btn-auto').addEventListener('click', () => {
  autoRefresh = !autoRefresh;
  const btn = document.getElementById('btn-auto');
  const indicator = document.getElementById('refresh-indicator');
  if (autoRefresh) {
    btn.classList.add('active');
    indicator.classList.add('active');
    indicator.textContent = 'auto-refresh: on';
    autoTimer = setInterval(loadData, 30000);
  } else {
    btn.classList.remove('active');
    indicator.classList.remove('active');
    indicator.textContent = '';
    clearInterval(autoTimer);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'r' || e.key === 'R') {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    loadData();
  }
});

function renderLegend() {
  const container = document.getElementById('legend-stages');
  // Deduplicate: show each unique stage concept once
  const seen = new Set();
  const legendItems = STAGES.filter(s => {
    const key = s.checkpoint ? 'checkpoint' : s.pr ? 'pr' : s.chest ? 'chest' : s.stage;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  container.innerHTML = legendItems.map(s => {
    const label = s.label || '✓';
    return `<div class="legend-stage">
      <div class="legend-icon${s.checkpoint ? ' checkpoint' : ''}">
        <svg class="stage-icon"><use href="#${s.icon}"/></svg>
      </div>
      <div class="legend-stage-info">
        <span class="legend-label">${label}</span>
        <span class="legend-name">${s.name}</span>
      </div>
    </div>`;
  }).join('');
}

renderLegend();
loadData();
