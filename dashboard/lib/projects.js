const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const STAGE_FILES = [
  { stage: 0, file: 'prd.md', name: 'PRD' },
  { stage: 1, file: 'discovery-report.md', name: 'Discovery' },
  { stage: 2, file: 'architecture-proposal.md', name: 'Architecture' },
  { stage: 3, file: 'gameplan.md', name: 'Gameplan' },
  { stage: 4, file: 'test-coverage-matrix.md', name: 'Test Gen' },
  { stage: 5, file: 'progress.md', name: 'Implementation' },
  { stage: 7, file: 'qa-plan.md', name: 'QA Plan' },
];

const SKIP_DIRS = new Set(['.git', '.obsidian', 'inbox', 'archive', 'node_modules']);

function discoverProjects(projectsPath) {
  let entries;
  try {
    entries = fs.readdirSync(projectsPath, { withFileTypes: true });
  } catch {
    return [];
  }

  const projects = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
    const project = parseProject(projectsPath, entry.name);
    if (project) projects.push(project);
  }

  return projects.sort((a, b) => {
    const stageOrder = b.currentStage - a.currentStage;
    if (stageOrder !== 0) return stageOrder;
    return a.slug.localeCompare(b.slug);
  });
}

function parseProject(projectsPath, slug) {
  const dir = path.join(projectsPath, slug);

  // Determine current stage by checking which files exist
  let currentStage = -1;
  let currentStageName = 'Unknown';
  const stages = {};

  for (const sf of STAGE_FILES) {
    const filePath = path.join(dir, sf.file);
    if (!fs.existsSync(filePath)) continue;

    currentStage = sf.stage;
    currentStageName = sf.name;

    try {
      const parsed = matter(fs.readFileSync(filePath, 'utf8'));
      stages[sf.stage] = {
        stage: sf.stage,
        name: sf.name,
        file: sf.file,
        completedAt: parsed.data.pipeline_completed_at || null,
        approvedAt: parsed.data.pipeline_approved_at || null,
        startedAt: parsed.data.pipeline_started_at || null,
        backfilled: parsed.data.pipeline_backfilled || false,
      };

      // For progress.md, extract extra fields
      if (sf.stage === 5) {
        stages[5].milestones = parseMilestoneTable(parsed.content);
        stages[5].prUrl = parsed.data.pipeline_pr_url || null;
        stages[5].prCreatedAt = parsed.data.pipeline_pr_created_at || null;
        stages[5].milestoneTiming = extractMilestoneTiming(parsed.data);
      }
    } catch {
      stages[sf.stage] = { stage: sf.stage, name: sf.name, file: sf.file };
    }
  }

  if (currentStage < 0) return null;

  // Extract metadata from prd.md
  const prdMeta = parsePrdMeta(path.join(dir, 'prd.md'));

  // Determine status
  let status = 'draft';
  if (stages[7]) {
    status = 'completed';
  } else if (stages[5]) {
    status = 'in_progress';
  } else if (stages[4]) {
    status = 'in_progress';
  } else if (stages[3]) {
    status = 'in_progress';
  } else if (currentStage >= 1) {
    status = 'in_progress';
  }

  // Check for waiting on human checkpoint
  let waitingForHuman = false;
  if (stages[2] && !stages[2].approvedAt && !stages[3]) {
    waitingForHuman = true;
  }
  if (stages[3] && !stages[3].approvedAt && !stages[4]) {
    // Check body for approval text
    waitingForHuman = true;
  }

  // Count milestones
  const milestones = stages[5]?.milestones || [];
  const totalMilestones = milestones.filter(m => m.id !== 'M0').length;
  const completedMilestones = milestones.filter(m => m.id !== 'M0' && m.complete).length;

  return {
    slug,
    title: prdMeta.title || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    level: prdMeta.level,
    platforms: prdMeta.platforms,
    currentStage,
    currentStageName,
    status,
    waitingForHuman,
    totalMilestones,
    completedMilestones,
    prUrl: stages[5]?.prUrl || null,
    prCreatedAt: stages[5]?.prCreatedAt || null,
    stages,
  };
}

function parsePrdMeta(prdPath) {
  const meta = { title: null, level: null, platforms: null };
  try {
    const parsed = matter(fs.readFileSync(prdPath, 'utf8'));
    const content = parsed.content;

    // Title from first heading
    const titleMatch = content.match(/^#\s+(.+?)(?:\s*—\s*PRD)?$/m);
    if (titleMatch) meta.title = titleMatch[1].trim();

    // Level from metadata table
    const levelMatch = content.match(/\*\*Level\*\*\s*\|\s*(\d+)/);
    if (levelMatch) meta.level = parseInt(levelMatch[1], 10);

    // Platforms from metadata table
    const platformsMatch = content.match(/\*\*Platforms?\*\*\s*\|\s*(.+)/);
    if (platformsMatch) meta.platforms = platformsMatch[1].trim().replace(/\s*\|$/, '');
  } catch { /* ignore */ }
  return meta;
}

function parseMilestoneTable(content) {
  const milestones = [];
  // Match the milestone status table
  const tableMatch = content.match(/## Milestone Status\s*\n\n\|[^\n]+\n\|[-| ]+\n([\s\S]*?)(?:\n---|\n##|\n$)/);
  if (!tableMatch) return milestones;

  const rows = tableMatch[1].trim().split('\n');
  for (const row of rows) {
    const cells = row.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length < 2) continue;

    // Some tables have: | Milestone | Description | Status |
    // Others have: | Milestone | Status | Commit | Date |
    // Detect format by first cell — if it contains ":" it's the combined format
    const firstCell = cells[0];
    let id, description, statusText;

    if (firstCell.includes(':')) {
      // Format: "M1: Description" | Status | ...
      const colonIdx = firstCell.indexOf(':');
      id = firstCell.substring(0, colonIdx).trim();
      description = firstCell.substring(colonIdx + 1).trim();
      statusText = cells[1] || '';
    } else {
      // Format: "M1" | "Description" | "Status"
      id = firstCell;
      description = cells.length >= 3 ? cells[1] : '';
      statusText = cells.length >= 3 ? cells[2] : cells[1];
    }

    const complete = /Complete/i.test(statusText);
    milestones.push({ id, description, status: statusText.replace(/\*\*/g, ''), complete });
  }
  return milestones;
}

function extractMilestoneTiming(frontmatter) {
  const timing = [];
  for (const [key, value] of Object.entries(frontmatter)) {
    const match = key.match(/^pipeline_(m\d+|qa_test_data)_(started_at|completed_at)$/);
    if (!match) continue;
    const milestoneKey = match[1].toUpperCase().replace('_', ' ');
    const field = match[2];
    let entry = timing.find(t => t.id === milestoneKey);
    if (!entry) {
      entry = { id: milestoneKey, startedAt: null, completedAt: null };
      timing.push(entry);
    }
    if (field === 'started_at') entry.startedAt = value;
    if (field === 'completed_at') entry.completedAt = value;
  }
  return timing.sort((a, b) => {
    const aTime = a.completedAt || a.startedAt || '';
    const bTime = b.completedAt || b.startedAt || '';
    return aTime.localeCompare(bTime);
  });
}

function getProjectDetail(projectsPath, slug) {
  return parseProject(projectsPath, slug);
}

module.exports = { discoverProjects, getProjectDetail };
