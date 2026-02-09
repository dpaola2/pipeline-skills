const fs = require('fs');
const path = require('path');

const PIPELINE_MD = path.resolve(__dirname, '../../pipeline.md');

function expandHome(p) {
  return p.startsWith('~/') ? path.join(require('os').homedir(), p.slice(2)) : p;
}

function parseConfig() {
  let content;
  try {
    content = fs.readFileSync(PIPELINE_MD, 'utf8');
  } catch {
    throw new Error(`Cannot read ${PIPELINE_MD} — is pipeline.md configured?`);
  }

  const productMatch = content.match(/^#\s+Pipeline Configuration\s*—\s*(.+)$/m);
  const product = productMatch ? productMatch[1].trim() : 'Unknown';

  const projectsMatch = content.match(/\|\s*\*\*Projects\*\*\s*\|\s*`([^`]+)`/);
  const projectsPath = projectsMatch ? expandHome(projectsMatch[1].trim().replace(/\/$/, '')) : null;
  if (!projectsPath) throw new Error('Cannot find Projects path in pipeline.md');

  const repoMatch = content.match(/\|\s*Primary\s*\|\s*`([^`]+)`/);
  const repoPath = repoMatch ? expandHome(repoMatch[1].trim().replace(/\/$/, '')) : null;

  return { product, projectsPath, repoPath };
}

module.exports = { parseConfig };
