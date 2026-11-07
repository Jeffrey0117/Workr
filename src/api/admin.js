/**
 * Workr Admin Dashboard
 */

const queue = require('../queue');
const { CONCURRENCY } = require('../workers');

function getAdminHTML() {
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Workr Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #e0e0e0;
      min-height: 100vh;
      padding: 2rem;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { font-size: 1.75rem; font-weight: 400; margin-bottom: 2rem; display: flex; align-items: center; gap: 12px; }
    h1 span { font-size: 2rem; }
    h2 { font-size: 1rem; color: #888; font-weight: 400; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.5px; }

    /* Stats Cards */
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
    .stat-card {
      background: #151515;
      border: 1px solid #252525;
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
    }
    .stat-value { font-size: 2.5rem; font-weight: 500; color: #fff; }
    .stat-label { font-size: 0.85rem; color: #666; margin-top: 4px; }
    .stat-card.queued .stat-value { color: #fbbf24; }
    .stat-card.running .stat-value { color: #60a5fa; }
    .stat-card.completed .stat-value { color: #4ade80; }
    .stat-card.failed .stat-value { color: #f87171; }

    /* Sections */
    .section { background: #151515; border: 1px solid #252525; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }

    /* API List */
    .api-list { display: flex; flex-direction: column; gap: 8px; }
    .api-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #1a1a1a;
      border-radius: 8px;
    }
    .api-method {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      min-width: 60px;
      text-align: center;
    }
    .api-method.get { background: #14532d; color: #4ade80; }
    .api-method.post { background: #1e3a5f; color: #60a5fa; }
    .api-method.delete { background: #5c2626; color: #f87171; }
    .api-path { font-family: monospace; color: #fff; }
    .api-desc { color: #666; font-size: 0.85rem; margin-left: auto; }

    /* Jobs Table */
    .jobs-table { width: 100%; border-collapse: collapse; }
    .jobs-table th, .jobs-table td { padding: 12px; text-align: left; border-bottom: 1px solid #252525; }
    .jobs-table th { color: #666; font-weight: 400; font-size: 0.85rem; }
    .jobs-table td { font-size: 0.9rem; }
    .job-id { font-family: monospace; color: #888; }
    .job-type { background: #252525; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; }
    .job-status { padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; }
    .job-status.queued { background: #422006; color: #fbbf24; }
    .job-status.running { background: #1e3a5f; color: #60a5fa; }
    .job-status.completed { background: #14532d; color: #4ade80; }
    .job-status.failed { background: #5c2626; color: #f87171; }
    .job-time { color: #666; font-size: 0.8rem; }

    /* Workers */
    .workers { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
    .worker-card {
      background: #1a1a1a;
      border-radius: 8px;
      padding: 1rem;
    }
    .worker-name { font-weight: 500; margin-bottom: 8px; }
    .worker-bar { height: 8px; background: #252525; border-radius: 4px; overflow: hidden; }
    .worker-bar-fill { height: 100%; background: #4ade80; transition: width 0.3s; }
    .worker-text { font-size: 0.8rem; color: #666; margin-top: 6px; }

    /* Refresh */
    .refresh-btn {
      background: #252525;
      border: none;
      color: #888;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
    }
    .refresh-btn:hover { background: #333; color: #fff; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }

    @media (max-width: 768px) {
      .stats { grid-template-columns: repeat(2, 1fr); }
      .api-desc { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1><span>⚡</span> Workr Dashboard</h1>
      <button class="refresh-btn" onclick="refresh()">🔄 Refresh</button>
    </div>

    <!-- Stats -->
    <div class="stats">
      <div class="stat-card queued">
        <div class="stat-value" id="statQueued">-</div>
        <div class="stat-label">Queued</div>
      </div>
      <div class="stat-card running">
        <div class="stat-value" id="statRunning">-</div>
        <div class="stat-label">Running</div>
      </div>
      <div class="stat-card completed">
        <div class="stat-value" id="statCompleted">-</div>
        <div class="stat-label">Completed</div>
      </div>
      <div class="stat-card failed">
        <div class="stat-value" id="statFailed">-</div>
        <div class="stat-label">Failed</div>
      </div>
    </div>

    <!-- API Endpoints -->
    <div class="section">
      <h2>API Endpoints</h2>
      <div class="api-list">
        <div class="api-item">
          <span class="api-method post">POST</span>
          <span class="api-path">/api/jobs</span>
          <span class="api-desc">Submit a new job</span>
        </div>
        <div class="api-item">
          <span class="api-method get">GET</span>
          <span class="api-path">/api/jobs</span>
          <span class="api-desc">List all jobs</span>
        </div>
        <div class="api-item">
          <span class="api-method get">GET</span>
          <span class="api-path">/api/jobs/:id</span>
          <span class="api-desc">Get job status</span>
        </div>
        <div class="api-item">
          <span class="api-method delete">DELETE</span>
          <span class="api-path">/api/jobs/:id</span>
          <span class="api-desc">Cancel a job</span>
        </div>
        <div class="api-item">
          <span class="api-method get">GET</span>
          <span class="api-path">/api/stats</span>
          <span class="api-desc">Queue statistics</span>
        </div>
        <div class="api-item">
          <span class="api-method get">GET</span>
          <span class="api-path">/api/events</span>
          <span class="api-desc">SSE progress stream</span>
        </div>
      </div>
    </div>

    <!-- Job Types -->
    <div class="section">
      <h2>Job Types</h2>
      <div class="api-list">
        <div class="api-item">
          <span class="api-method post" style="background:#2d2d2d;">thumbnail</span>
          <span class="api-path">Extract video thumbnail</span>
          <span class="api-desc">ffmpeg + sharp</span>
        </div>
        <div class="api-item">
          <span class="api-method post" style="background:#2d2d2d;">webp</span>
          <span class="api-path">Convert image to WebP</span>
          <span class="api-desc">sharp</span>
        </div>
        <div class="api-item">
          <span class="api-method post" style="background:#2d2d2d;">hls</span>
          <span class="api-path">Transcode to HLS stream</span>
          <span class="api-desc">ffmpeg (coming soon)</span>
        </div>
        <div class="api-item">
          <span class="api-method post" style="background:#2d2d2d;">download</span>
          <span class="api-path">Download file with retry</span>
          <span class="api-desc">puppeteer (coming soon)</span>
        </div>
      </div>
    </div>

    <!-- Workers -->
    <div class="section">
      <h2>Workers</h2>
      <div class="workers" id="workersList">
        <div class="worker-card">
          <div class="worker-name">thumbnail</div>
          <div class="worker-bar"><div class="worker-bar-fill" style="width:0%"></div></div>
          <div class="worker-text">0/3 running</div>
        </div>
        <div class="worker-card">
          <div class="worker-name">webp</div>
          <div class="worker-bar"><div class="worker-bar-fill" style="width:0%"></div></div>
          <div class="worker-text">0/3 running</div>
        </div>
        <div class="worker-card">
          <div class="worker-name">hls</div>
          <div class="worker-bar"><div class="worker-bar-fill" style="width:0%"></div></div>
          <div class="worker-text">0/1 running</div>
        </div>
        <div class="worker-card">
          <div class="worker-name">download</div>
          <div class="worker-bar"><div class="worker-bar-fill" style="width:0%"></div></div>
          <div class="worker-text">0/5 running</div>
        </div>
      </div>
    </div>

    <!-- Recent Jobs -->
    <div class="section">
      <h2>Recent Jobs</h2>
      <table class="jobs-table">
        <thead>
          <tr>
            <th>Job ID</th>
            <th>Type</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody id="jobsList">
          <tr><td colspan="5" style="color:#666;text-align:center;">Loading...</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <script>
    // The job list needs WORKR_API_KEY. Kept in this browser only (localStorage);
    // ?key=... in the URL seeds it once and is then stripped from the address bar.
    var KEY_NAME = 'workr_api_key';
    (function seedKey() {
      var u = new URL(location.href);
      var k = u.searchParams.get('key');
      if (k) {
        try { localStorage.setItem(KEY_NAME, k); } catch (e) {}
        u.searchParams.delete('key');
        history.replaceState(null, '', u.pathname + u.search);
      }
    })();
    function getKey() {
      try { return localStorage.getItem(KEY_NAME) || ''; } catch (e) { return ''; }
    }
    function askKey() {
      var v = prompt('輸入 Workr API key（WORKR_API_KEY）');
      if (v && v.trim()) {
        try { localStorage.setItem(KEY_NAME, v.trim()); } catch (e) {}
        return true;
      }
      return false;
    }

    async function refresh() {
      try {
        const res = await fetch('/api/jobs?limit=20', { headers: { Authorization: 'Bearer ' + getKey() } });
        if (res.status === 401) {
          if (!refresh.asked) { refresh.asked = true; if (askKey()) return refresh(); }
          document.getElementById('jobsList').innerHTML = '<tr><td colspan="5" style="color:#666;text-align:center;">需要 API key 才能看工作清單（重新整理頁面再輸入）</td></tr>';
          return;
        }
        const data = await res.json();

        // Update stats
        document.getElementById('statQueued').textContent = data.queued || 0;
        document.getElementById('statRunning').textContent = data.running || 0;
        document.getElementById('statCompleted').textContent = data.completed || 0;
        document.getElementById('statFailed').textContent = data.failed || 0;

        // Update jobs table
        const tbody = document.getElementById('jobsList');
        if (data.jobs.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" style="color:#666;text-align:center;">No jobs yet</td></tr>';
        } else {
          tbody.innerHTML = data.jobs.map(job => \`
            <tr>
              <td class="job-id">\${job.id}</td>
              <td><span class="job-type">\${job.type}</span></td>
              <td><span class="job-status \${job.status}">\${job.status}</span></td>
              <td class="job-time">\${job.duration ? (job.duration / 1000).toFixed(1) + 's' : '-'}</td>
              <td class="job-time">\${new Date(job.createdAt).toLocaleTimeString()}</td>
            </tr>
          \`).join('');
        }
      } catch (e) {
        console.error('Failed to refresh:', e);
      }
    }

    // Initial load
    refresh();

    // Auto refresh every 5s (SSE removed: EventSource can't send the auth header)
    setInterval(refresh, 5000);
  </script>
</body>
</html>`;
}

module.exports = { getAdminHTML };
