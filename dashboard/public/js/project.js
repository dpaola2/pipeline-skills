const ALL_STAGES = [
  { stage: 0, name: 'PRD' },
  { stage: 1, name: 'Discovery' },
  { stage: 2, name: 'Architecture' },
  { stage: 3, name: 'Gameplan' },
  { stage: 4, name: 'Test Gen' },
  { stage: 5, name: 'Implementation' },
  { stage: 7, name: 'QA Plan' },
];

// Load SVG sprites
fetch('/img/sprites.svg')
  .then(r => r.text())
  .then(svg => { document.getElementById('svg-sprites').innerHTML = svg; });

const slug = window.location.pathname.split('/').pop();

async function loadProject() {
  try {
    const res = await fetch(`/api/projects/${slug}`);
    if (!res.ok) throw new Error('Project not found');
    const project = await res.json();
    render(project);
    document.title = `${project.title || project.slug} — Pipeline Dashboard`;
  } catch (err) {
    document.getElementById('content').innerHTML = `<div class="loading">${err.message}</div>`;
  }
}

function render(project) {
  const content = document.getElementById('content');

  content.innerHTML = `
    <div class="page-header">
      <div class="breadcrumb"><a href="/">Dashboard</a> / ${escapeHtml(project.slug)}</div>
      <div class="page-title">${escapeHtml(project.title || project.slug)}</div>
      <div class="page-subtitle">
        ${project.level ? `<span class="level-badge level-${project.level}">Level ${project.level}</span>` : ''}
        ${project.platforms ? `<span style="margin-left:8px">${escapeHtml(project.platforms)}</span>` : ''}
        ${project.prUrl ? `<a href="${escapeHtml(project.prUrl)}" target="_blank" style="margin-left:12px;color:var(--orange)">View PR →</a>` : ''}
      </div>
    </div>

    <div class="stage-progress-bar">
      ${renderStageBar(project)}
    </div>

    <div class="detail-grid">
      <div class="stats-panel full-width">
        <div class="panel-title">Milestones</div>
        ${renderMilestoneTimeline(project)}
      </div>

      <div class="stats-panel">
        <div class="panel-title">Stage Timing (DORA)</div>
        ${renderStageTiming(project)}
      </div>

      <div class="stats-panel">
        <div class="panel-title">Code Quality</div>
        ${renderQuality(project)}
      </div>
    </div>
  `;
}

function renderStageBar(project) {
  return ALL_STAGES.map(s => {
    const stageData = project.stages[s.stage];
    let cls = 'stage-pip';
    if (stageData) {
      if (s.stage < project.currentStage || project.status === 'completed') {
        cls += ' completed';
      } else if (s.stage === project.currentStage) {
        cls += ' active';
      }
      if (stageData.approvedAt) cls += ' approved';
    }
    return `<div class="${cls}" title="S${s.stage}: ${s.name}"></div>`;
  }).join('');
}

function renderMilestoneTimeline(project) {
  const milestones = project.stages[5]?.milestones;
  if (!milestones || milestones.length === 0) {
    return '<div class="no-data">No milestones yet</div>';
  }

  const timing = project.stages[5]?.milestoneTiming || [];
  const timingMap = {};
  for (const t of timing) {
    timingMap[t.id] = t;
  }

  return `<div class="milestone-timeline">
    ${milestones.map(m => {
      const isComplete = m.complete;
      const cls = isComplete ? 'completed' : '';
      const t = timingMap[m.id] || {};

      let timingHtml = '';
      if (t.completedAt) {
        const completed = formatTimestamp(t.completedAt);
        if (t.startedAt) {
          const duration = formatDuration(t.startedAt, t.completedAt);
          timingHtml = `<div class="milestone-timing">Duration: ${duration} | Completed: ${completed}</div>`;
        } else {
          timingHtml = `<div class="milestone-timing">Completed: ${completed}</div>`;
        }
      }

      return `<div class="milestone-entry ${cls}">
        <span class="milestone-id">${escapeHtml(m.id)}</span>
        <div class="milestone-desc">${escapeHtml(m.description)}</div>
        <div class="milestone-timing">${escapeHtml(m.status)}</div>
        ${timingHtml}
      </div>`;
    }).join('')}
  </div>`;
}

function renderStageTiming(project) {
  const rows = ALL_STAGES.map(s => {
    const stageData = project.stages[s.stage];
    if (!stageData) return null;

    const completed = stageData.completedAt ? formatTimestamp(stageData.completedAt) : '—';
    const backfill = stageData.backfilled ? ' *' : '';

    return `<tr>
      <td>S${s.stage}</td>
      <td>${s.name}</td>
      <td>${completed}${backfill}</td>
    </tr>`;
  }).filter(Boolean);

  if (rows.length === 0) return '<div class="no-data">No timing data</div>';

  let prRow = '';
  if (project.prCreatedAt) {
    prRow = `<tr><td>PR</td><td>Created</td><td>${formatTimestamp(project.prCreatedAt)}</td></tr>`;
  }

  return `<table class="data-table">
    <tr><th>Stage</th><th>Name</th><th>Completed</th></tr>
    ${rows.join('')}
    ${prRow}
  </table>
  ${rows.some(r => r.includes('*')) ? '<div style="font-size:10px;color:var(--text-dim);margin-top:6px">* backfilled (day-level precision)</div>' : ''}`;
}

function renderQuality(project) {
  // Quality data from frontmatter fields like pipeline_quality_*
  // Not yet populated for any project
  return '<div class="no-data">No quality data yet.<br>Quality analysis will appear here for new projects.</div>';
}

function formatTimestamp(ts) {
  if (!ts) return '—';
  try {
    const d = new Date(ts);
    const month = d.toLocaleString('en-US', { month: 'short' });
    const day = d.getDate();
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    // If time is midnight, just show the date
    if (hours === '00' && mins === '00') return `${month} ${day}`;
    return `${month} ${day}, ${hours}:${mins}`;
  } catch {
    return ts;
  }
}

function formatDuration(start, end) {
  try {
    const ms = new Date(end) - new Date(start);
    if (ms < 0) return '—';
    const secs = Math.floor(ms / 1000);
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    if (mins < 60) return remSecs > 0 ? `${mins}m ${remSecs}s` : `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
  } catch {
    return '—';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Refresh
document.getElementById('btn-refresh').addEventListener('click', loadProject);
document.addEventListener('keydown', (e) => {
  if (e.key === 'r' || e.key === 'R') {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    loadProject();
  }
});

loadProject();
