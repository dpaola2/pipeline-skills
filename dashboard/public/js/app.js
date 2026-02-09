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

let autoRefresh = false;
let autoTimer = null;
let openStage = null; // currently open popover stage

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
    renderBelt(projData.projects);
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

function renderBelt(projects) {
  const container = document.getElementById('assembly-line');

  // Group projects by stage slot
  const groups = {};
  for (const p of projects) {
    const slot = getProjectStageSlot(p);
    if (!groups[slot]) groups[slot] = [];
    groups[slot].push(p);
  }

  const activeStages = new Set(
    projects
      .filter(p => p.status !== 'completed' && p.status !== 'draft')
      .map(p => getProjectStageSlot(p))
  );

  // Build the belt
  let html = '<div class="belt-line">';
  STAGES.forEach((s, i) => {
    if (i > 0) {
      html += '<div class="belt-seg"><div class="conveyor-belt"></div></div>';
    }

    const count = (groups[s.stage] || []).length;
    const hasActive = activeStages.has(s.stage);

    let cls = 'stage-machine';
    if (s.checkpoint) {
      cls += ' checkpoint';
      if (hasActive) cls += ' waiting';
    } else if (s.chest) {
      if (count > 0) cls += ' completed';
    } else if (hasActive) {
      cls += ' active';
    }

    const badge = count > 0
      ? `<span class="count-badge${s.chest ? ' badge-green' : ''}">${count}</span>`
      : '';

    html += `<div class="stage-slot" data-stage="${s.stage}">
      <div class="${cls}" title="${s.label ? s.label + ': ' : ''}${s.name}">
        <svg class="stage-icon"><use href="#${s.icon}"/></svg>
        ${badge}
      </div>
      <div class="stage-tag">${s.label || '✓'}</div>
    </div>`;
  });
  html += '</div>';

  // Popover container (rendered below the belt)
  html += '<div class="popover-area" id="popover-area"></div>';

  container.innerHTML = html;

  // Wire up click handlers
  container.querySelectorAll('.stage-slot').forEach(slot => {
    slot.addEventListener('click', (e) => {
      e.stopPropagation();
      const stage = parseInt(slot.dataset.stage, 10);
      const items = groups[stage] || [];
      if (items.length === 0) {
        closePopover();
        return;
      }
      if (openStage === stage) {
        closePopover();
      } else {
        showPopover(slot, stage, items);
      }
    });
  });
}

function showPopover(slotEl, stage, projects) {
  openStage = stage;

  // Highlight the active slot
  document.querySelectorAll('.stage-slot').forEach(s => s.classList.remove('open'));
  slotEl.classList.add('open');

  const stageInfo = STAGES.find(s => s.stage === stage);
  const area = document.getElementById('popover-area');

  area.innerHTML = `<div class="popover-panel">
    <div class="popover-header">
      <span class="popover-title">${stageInfo ? stageInfo.label + ' ' + stageInfo.name : 'Complete'}</span>
      <span class="popover-count">${projects.length} project${projects.length !== 1 ? 's' : ''}</span>
    </div>
    <div class="popover-items">
      ${projects.map(p => renderProjectItem(p)).join('')}
    </div>
  </div>`;
  area.style.display = 'block';
}

function closePopover() {
  openStage = null;
  document.querySelectorAll('.stage-slot').forEach(s => s.classList.remove('open'));
  const area = document.getElementById('popover-area');
  if (area) {
    area.style.display = 'none';
    area.innerHTML = '';
  }
}

// Close popover when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.stage-slot') && !e.target.closest('.popover-panel')) {
    closePopover();
  }
});

function renderProjectItem(project) {
  const statusClass = project.waitingForHuman ? 'waiting' : project.status;
  const levelClass = project.level ? `level-${project.level}` : '';
  const milestoneText = project.totalMilestones > 0
    ? `${project.completedMilestones}/${project.totalMilestones}`
    : '';

  // Mini stage progress bar
  const allStages = [0, 1, 2, 3, 4, 5, 7];
  const progressPips = allStages.map(s => {
    const has = project.stages && project.stages[s];
    const isCurrent = s === project.currentStage && project.status !== 'completed';
    let pipClass = 'pip';
    if (has && !isCurrent) pipClass += ' pip-done';
    if (isCurrent) pipClass += ' pip-current';
    return `<span class="${pipClass}"></span>`;
  }).join('');

  return `<a href="/project/${project.slug}" class="project-item status-${statusClass}">
    <div class="project-item-top">
      <span class="project-name">${escapeHtml(project.title || project.slug)}</span>
      ${project.level ? `<span class="level-badge ${levelClass}">L${project.level}</span>` : ''}
    </div>
    <div class="project-item-bottom">
      <span class="pip-bar">${progressPips}</span>
      ${milestoneText ? `<span class="milestone-progress">${milestoneText}</span>` : ''}
    </div>
  </a>`;
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
  if (e.key === 'Escape') closePopover();
});

loadData();
