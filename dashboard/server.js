const express = require('express');
const path = require('path');
const { parseConfig } = require('./lib/config');
const { discoverProjects, getProjectDetail } = require('./lib/projects');
const { parseAggregateMetrics } = require('./lib/metrics');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;

// Parse config once at startup
let config;
try {
  config = parseConfig();
  console.log(`Pipeline: ${config.product}`);
  console.log(`Projects: ${config.projectsPath}`);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API: List all projects
app.get('/api/projects', (_req, res) => {
  try {
    const projects = discoverProjects(config.projectsPath);
    res.json({ product: config.product, projects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Project detail
app.get('/api/projects/:slug', (req, res) => {
  try {
    const project = getProjectDetail(config.projectsPath, req.params.slug);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Aggregate metrics
app.get('/api/metrics', (_req, res) => {
  try {
    const metrics = parseAggregateMetrics(config.projectsPath);
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SPA fallback for project detail pages
app.get('/project/:slug', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'project.html'));
});

const server = app.listen(PORT, () => {
  console.log(`Dashboard: http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try: PORT=${PORT + 1} bin/dashboard`);
  } else {
    console.error(err.message);
  }
  process.exit(1);
});
