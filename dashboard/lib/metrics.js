const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

function parseAggregateMetrics(projectsPath) {
  const metricsPath = path.join(projectsPath, 'metrics.md');
  try {
    const parsed = matter(fs.readFileSync(metricsPath, 'utf8'));
    const content = parsed.content;

    return {
      generatedAt: parsed.data.pipeline_generated_at || null,
      product: parsed.data.pipeline_product || null,
      throughput: parseThroughput(content),
      speed: parseSpeed(content),
      completedProjects: parseCompletedTable(content),
    };
  } catch {
    return { generatedAt: null, product: null, throughput: {}, speed: {}, completedProjects: [] };
  }
}

function parseThroughput(content) {
  const section = extractSection(content, 'Pipeline Throughput');
  if (!section) return {};

  const result = {};
  const rows = section.match(/\|[^|\n]+\|[^|\n]+\|/g) || [];
  for (const row of rows) {
    const cells = row.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length < 2 || cells[0].startsWith('--')) continue;
    const key = cells[0].replace(/\*\*/g, '');
    const value = cells[1].replace(/\*\*/g, '');
    if (key === 'Metric') continue;
    result[key] = value;
  }
  return result;
}

function parseSpeed(content) {
  const section = extractSection(content, 'Agent Speed Highlights');
  if (!section) return {};

  const result = {};
  const rows = section.match(/\|[^|\n]+\|[^|\n]+\|/g) || [];
  for (const row of rows) {
    const cells = row.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length < 2 || cells[0].startsWith('--')) continue;
    const key = cells[0].replace(/\*\*/g, '');
    const value = cells[1].replace(/\*\*/g, '');
    if (key === 'Metric') continue;
    result[key] = value;
  }
  return result;
}

function parseCompletedTable(content) {
  const section = extractSection(content, 'Project Summary');
  if (!section) return [];

  const projects = [];
  const rows = section.split('\n').filter(r => r.startsWith('|'));
  for (const row of rows) {
    const cells = row.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length < 7 || cells[0] === 'Project' || cells[0].startsWith('--')) continue;

    projects.push({
      project: cells[0],
      level: parseInt(cells[1], 10) || null,
      prdDate: cells[2],
      firstCommit: cells[3],
      lastCommit: cells[4],
      prCreated: cells[5],
      prMerged: cells[6],
      stage4ToPr: cells[7] || null,
    });
  }
  return projects;
}

function extractSection(content, heading) {
  const regex = new RegExp(`###?\\s+${escapeRegex(heading)}[\\s\\S]*?(?=\\n---\\n|\\n##[^#]|$)`);
  const match = content.match(regex);
  return match ? match[0] : null;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { parseAggregateMetrics };
