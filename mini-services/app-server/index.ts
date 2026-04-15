import { Hono } from 'hono';

const app = new Hono();

// CORS
app.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (c.req.method === 'OPTIONS') {
    return c.text('', 200);
  }
  await next();
});

// ─── CSS from the app ─────────────────────────────────────────────────
const APP_CSS = `
@import "tailwindcss";
@import "tw-animate-css";
@custom-variant dark (&:is(.dark *));
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  ── ... (rest of CSS) ──
`;

// ─── HTML Template ──────────────────────────────────────────────────
function renderApp(activeView: string, data: any) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'compose', label: 'Compose', icon: '✏️' },
    { id: 'scheduler', label: 'Scheduler', icon: '📅' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'ai-tools', label: 'AI Tools', icon: '🤖' },
    { id: 'accounts', label: 'Accounts', icon: '🔗' },
    { id: 'team', label: 'Team', icon: '👥' },
  ];

  return \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SocialPilot AI - Smart Social Media Management</title>
  <link rel="icon" href="https://z-cdn.chatglm.cn/z-ai/static/logo.svg" />
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; font-family: 'Inter', system-ui, -apple-system, sans-serif; background: #ffffff; color: #0a0a0a; }
    .dark body { background: #0a0a0a; color: #fafafa; }
    .flex { display: flex; } .flex-col { flex-direction: column; } .flex-1 { flex: 1; }
    .items-center { align-items: center; } .justify-center { justify-content: center; }
    .justify-between { justify-content: space-between; }
    .gap-1 { gap: 0.25rem; } .gap-2 { gap: 0.5rem; } .gap-3 { gap: 0.75rem; } .gap-4 { gap: 1rem; } .gap-6 { gap: 1.5rem; }
    .p-2 { padding: 0.5rem; } .p-3 { padding: 0.75rem; } .p-4 { padding: 1rem; } .p-6 { padding: 1.5rem; }
    .min-h-screen { min-height: 100vh; } .h-screen { height: 100vh; }
    .sticky-top { position: sticky; top: 0; }
    .overflow-auto { overflow: auto; }
    .w-60 { width: 15rem; } .w-14 { width: 3.5rem; } .shrink-0 { flex-shrink: 0; }
    .rounded-lg { border-radius: 0.5rem; } .rounded-xl { border-radius: 0.75rem; }
    .bg-card { background: #ffffff; } .bg-muted { background: #f4f4f5; }
    .bg-primary { background: #0a0a0a; color: #fafafa; }
    .bg-gradient { background: linear-gradient(135deg, #7c3aed, #d946ef); }
    .text-sm { font-size: 0.875rem; } .text-xs { font-size: 0.75rem; }
    .text-lg { font-size: 1.125rem; } .text-xl { font-size: 1.25rem; } .text-2xl { font-size: 1.5rem; }
    .font-bold { font-weight: 700; } .font-semibold { font-weight: 600; } .font-medium { font-weight: 500; }
    .tracking-tight { letter-spacing: -0.025em; }
    .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .text-muted { color: #71717a; }
    .shadow-sm { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .border-b { border-bottom: 1px solid #e4e4e7; } .border-r { border-right: 1px solid #e4e4e7; }
    .transition-all { transition: all 150ms; }
    button { cursor: pointer; border: none; background: none; font-family: inherit; font-size: inherit; }
    .card { border: 1px solid #e4e4e7; border-radius: 0.75rem; padding: 1.25rem; }
    .card h3 { font-size: 1rem; font-weight: 600; margin: 0 0 0.75rem; }
    .card p { color: #71717a; font-size: 0.875rem; margin: 0; line-height: 1.5; }
    .badge { display: inline-flex; align-items: center; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.6875rem; font-weight: 600; }
    .badge-blue { background: #dbeafe; color: #1d4ed8; }
    .badge-green { background: #dcfce7; color: #15803d; }
    .badge-amber { background: #fef3c7; color: #b45309; }
    .badge-red { background: #fee2e2; color: #b91c1c; }
    .badge-violet { background: #ede9fe; color: #6d28d9; }
    .grid { display: grid; }
    .grid-2 { grid-template-columns: repeat(2, 1fr); } .grid-3 { grid-template-columns: repeat(3, 1fr); } .grid-4 { grid-template-columns: repeat(4, 1fr); }
    @media (min-width: 768px) { .md-grid-cols-2 { grid-template-columns: repeat(2, 1fr); } .md-grid-cols-3 { grid-template-columns: repeat(3, 1fr); } .md-grid-cols-4 { grid-template-columns: repeat(4, 1fr); } }
    @media (min-width: 1024px) { .lg-grid-cols-3 { grid-template-columns: repeat(3, 1fr); } .lg-grid-cols-4 { grid-template-columns: repeat(4, 1fr); } }
    @keyframes spin { to { transform: rotate(360deg); } }
    .animate-spin { animation: spin 1s linear infinite; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .fade-in { animation: fadeIn 0.3s ease-out; }
    .stat-value { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.025em; }
    .stat-label { font-size: 0.75rem; color: #71717a; }
    .stat-change-up { color: #16a34a; font-size: 0.75rem; } .stat-change-down { color: #dc2626; font-size: 0.75rem; }
    .stat-icon { width: 2.5rem; height: 2.5rem; display: flex; align-items: center; justify-content: center; border-radius: 0.5rem; }
    .trend-up { color: #16a34a; } .trend-down { color: #dc2626; }
    .activity-item { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.75rem; border-radius: 0.5rem; transition: background 150ms; }
    .activity-item:hover { background: #f4f4f5; }
    .activity-icon { width: 2rem; height: 2rem; display: flex; align-items: center; justify-content: center; border-radius: 0.5rem; flex-shrink: 0; font-size: 0.875rem; }
    .platform-dot { width: 0.5rem; height: 0.5rem; border-radius: 9999px; flex-shrink: 0; }
    .post-card { border: 1px solid #e4e4e7; border-radius: 0.75rem; padding: 1rem; transition: all 150ms; }
    .post-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .rank-badge { width: 1.5rem; height: 1.5rem; display: flex; align-items: center; justify-content: center; border-radius: 9999px; font-size: 0.6875rem; font-weight: 700; }
    .chart-placeholder { width: 100%; height: 200px; background: linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; color: #6d28d9; font-weight: 600; }
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 1rem; text-align: center; }
    .empty-state-icon { font-size: 2.5rem; margin-bottom: 1rem; }
    .empty-state h3 { font-size: 1.125rem; font-weight: 600; margin-bottom: 0.25rem; }
    .empty-state p { color: #71717a; font-size: 0.875rem; }
    .nav-btn { width: 100%; display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0.625rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; transition: all 150ms; text-align: left; }
    .nav-btn:hover { background: #f4f4f5; }
    .nav-btn.active { background: #0a0a0a; color: #fafafa; }
    .collapse-btn { width: 100%; padding: 0.375rem; border-radius: 0.375rem; font-size: 0.75rem; color: #71717a; text-align: center; transition: background 150ms; }
    .collapse-btn:hover { background: #f4f4f5; }
    .toast { position: fixed; top: 1rem; right: 1rem; z-index: 100; background: #0a0a0a; color: #fafafa; padding: 0.75rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; opacity: 0; transform: translateY(-10px); transition: all 300ms; }
    .toast.show { opacity: 1; transform: translateY(0); }
  </style>
</head>
<body>
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <aside id="sidebar" style="width:15rem;min-height:100vh;position:sticky;top:0;border-right:1px solid #e4e4e7;background:#fff;flex-shrink:0;display:flex;flex-direction:column;transition:width 300ms;">
      <div style="display:flex;align-items:center;height:3.5rem;padding:0 0.75rem;border-bottom:1px solid #e4e4e7;">
        <div class="bg-gradient" style="width:2.25rem;height:2.25rem;border-radius:0.5rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <span style="color:#fff;font-size:0.75rem;font-weight:700;">⚡</span>
        </div>
        <div style="margin-left:0.625rem;overflow:hidden;">
          <div class="font-bold text-sm truncate" style="line-height:1.2;">SocialPilot</div>
          <div class="text-xs" style="color:#71717a;font-size:0.625rem;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">AI Suite</div>
        </div>
      </div>
      <nav style="flex:1;overflow-y:auto;padding:0.75rem 0.5rem;">
        \${navItems.map(item => \`
          <button class="nav-btn \${activeView === item.id ? 'active' : ''}" onclick="navigate('\${item.id}')">
            <span>\${item.icon}</span>
            <span class="truncate">\${item.label}</span>
          </button>
        \`).join('')}
      </nav>
      <div style="border-top:1px solid #e4e4e7;padding:0.5rem;">
        <button class="collapse-btn" onclick="toggleSidebar()">◄ Collapse</button>
      </div>
    </aside>

    <!-- Main -->
    <div style="flex:1;display:flex;flex-direction:column;min-height:100vh;">
      <header style="position:sticky;top:0;z-index:30;height:3.5rem;border-bottom:1px solid #e4e4e7;background:rgba(255,255,255,0.95);backdrop-filter:blur(8px);">
        <div style="display:flex;align-items:center;justify-content:space-between;height:100%;padding:0 1.5rem;">
          <div>
            <h1 class="text-base font-semibold tracking-tight capitalize" style="margin:0;">\${activeView.replace(/-/g, ' ')}</h1>
            <p class="text-xs" style="color:#71717a;">\${navItems.find(n => n.id === activeView)?.label || 'Dashboard'}</p>
          </div>
        </div>
      </header>
      <main id="content" style="flex:1;padding:1rem 1.5rem;overflow:auto;">
        <div class="fade-in">\${renderView(activeView, data)}</div>
      </main>
    </div>
  </div>
  <div id="toast" class="toast"></div>
  <script>
    let currentView = '\${activeView}';
    let sidebarOpen = true;
    let appData = \${JSON.stringify(data || {})};

    async function fetchData() {
      try {
        const [accounts, posts, activities, team, analytics] = await Promise.all([
          fetch('/api/accounts').then(r => r.ok ? r.json() : { data: [] }),
          fetch('/api/posts?status=published&limit=20').then(r => r.ok ? r.json() : { data: [] }),
          fetch('/api/activities').then(r => r.ok ? r.json() : { data: [] }),
          fetch('/api/team').then(r => r.ok ? r.json() : { data: [] }),
          fetch('/api/analytics').then(r => r.ok ? r.json() : { data: null }),
        ]);
        appData = JSON.stringify({ accounts: accounts.data || [], posts: posts.data || [], activities: activities.data || [], teamMembers: team.data || [], analytics: analytics.data || {} });
        // Re-render current view
        if (typeof renderViewWith === 'function') renderViewWith(currentView);
      } catch (e) { console.error('Data fetch error:', e); }
    }

    function navigate(view) {
      currentView = view;
      document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick').includes(view));
      });
      if (typeof renderViewWith === 'function') renderViewWith(view);
      // Re-fetch data for certain views
      fetchData();
    }

    function toggleSidebar() {
      sidebarOpen = !sidebarOpen;
      const sb = document.getElementById('sidebar');
      sb.style.width = sidebarOpen ? '15rem' : '3.5rem';
    }

    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 3000);
    }

    function formatNum(n) {
      if (n >= 1000000) return (n/1000000).toFixed(1) + 'M';
      if (n >= 1000) return (n/1000).toFixed(1) + 'K';
      return n.toLocaleString();
    }

    function timeAgo(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      const diff = Date.now() - d.getTime();
      const mins = Math.floor(diff/60000);
      const hrs = Math.floor(diff/3600000);
      const days = Math.floor(diff/86400000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return mins + 'm ago';
      if (hrs < 24) return hrs + 'h ago';
      if (days < 7) return days + 'd ago';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    // View renderers
    function renderViewWith(view) {
      try {
        const data = JSON.parse(appData);
        const content = document.getElementById('content');
        if (view === 'dashboard') content.innerHTML = renderDashboard(data);
        else if (view === 'accounts') content.innerHTML = renderAccounts(data);
        else if (view === 'compose') content.innerHTML = renderCompose(data);
        else if (view === 'scheduler') content.innerHTML = renderScheduler(data);
        else if (view === 'analytics') content.innerHTML = renderAnalytics(data);
        else if (view === 'ai-tools') content.innerHTML = renderAITools(data);
        else if (view === 'team') content.innerHTML = renderTeam(data);
        else if (view === 'architecture') content.innerHTML = renderArchitecture(data);
        else content.innerHTML = renderDashboard(data);
        content.querySelector('.fade-in')?.classList.remove('fade-in');
        void content.querySelector('.fade-in')?.offsetWidth;
      } catch(e) { console.error('Render error:', e); }
    }

    // ── Dashboard View ──────────────────────────────────────────────
    function renderDashboard(data) {
      const analytics = data.analytics || {};
      const eng = analytics.engagement || {};
      const accs = data.accounts || [];
      const posts = data.posts || [];
      const activities = data.activities || [];
      const topPosts = posts.sort((a,b) => (b.engagement||0) - (a.engagement||0)).slice(0,5);
      const totalFollowers = accs.reduce((s,a) => s + (a.followersCount||0), 0);
      const scheduledCount = posts.filter(p => p.status === 'scheduled').length;

      return \`
        <div style="display:flex;flex-direction:column;gap:1.5rem;">
          <div class="grid grid-2 md-grid-cols-4 gap-4">
            <div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;"><span class="text-sm font-medium">Total Followers</span><div class="stat-icon" style="background:#ede9fe;color:#6d28d9;">👥</div></div><div class="stat-value">\${formatNum(totalFollowers)}</div><div class="stat-change-up">↑ 12.5%</div></div>
            <div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;"><span class="text-sm font-medium">Total Reach</span><div class="stat-icon" style="background:#dbeafe;color:#1d4ed8;">👁</div></div><div class="stat-value">\${formatNum(eng.totalReach||0)}</div><div class="stat-change-up">↑ 8.2%</div></div>
            <div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;"><span class="text-sm font-medium">Engagement</span><div class="stat-icon" style="background:#fce7f3;color:#db2777;">❤️</div></div><div class="stat-value">\${formatNum(eng.totalEngagement||0)}</div><div class="stat-change-down">↓ 2.4%</div></div>
            <div class="card"><div style="display:flex;justify-content:content:center;align-items:center;margin-bottom:0.5rem;"><span class="text-sm font-medium">Scheduled</span><div class="stat-icon" style="background:#fef3c7;color:#b45309;">📅</div></div><div class="stat-value" style="text-align:center;">\${scheduledCount}</div><div class="stat-change-up" style="text-align:center;">↑ 15%</div></div>
          </div>
          <div class="grid grid-1 md-grid-cols-2 gap-6">
            <div class="card">
              <h3 style="display:flex;justify-content:space-between;align-items:center;"><span>📈 Reach & Engagement</span><span class="badge badge-violet">Live</span></h3>
              <div class="chart-placeholder">📊 Engagement Chart (7 days)</div>
            </div>
            <div class="card">
              <h3 style="display:flex;justify-content:space-between;align-items:center;"><span>📱 Platform Breakdown</span><span class="badge badge-blue">All Time</span></h3>
              <div class="chart-placeholder">📊 Platform Bar Chart</div>
            </div>
          </div>
          <div class="grid grid-1 md-grid-cols-2 gap-6">
            <div class="card">
              <h3 style="display:flex;justify-content:space-between;align-items:center;"><span>⚡ Recent Activity</span><span class="badge" style="background:#f4f4f5;">\${activities.length} events</span></h3>
              <div style="max-height:400px;overflow-y:auto;">
                \${activities.length === 0 ? '<p style="text-align:center;color:#71717a;padding:2rem;">No recent activity</p>' : activities.slice(0,10).map(a => \`
                  <div class="activity-item">
                    <div class="activity-icon" style="background:\${a.type?.includes('publish') ? '#dcfce7' : a.type?.includes('comment') ? '#dbeafe' : a.type?.includes('like') ? '#fce7f3' : '#f4f4f5'};">\${a.type?.includes('publish') ? '🚀' : a.type?.includes('comment') ? '💬' : '📌'}</div>
                    <div style="flex:1;min-width:0;"><p style="font-size:0.875rem;line-height:1.4;margin:0;">\${a.message || 'Activity event'}</p><p style="font-size:0.6875rem;color:#71717a;margin:0;">\${timeAgo(a.createdAt)}</p></div>
                  </div>
                \`).join('')}
              </div>
            </div>
            <div class="card">
              <h3 style="display:flex;justify-content:space-between;align-items:center;"><span>🏆 Top Posts</span><span class="badge badge-violet">Top 5</span></h3>
              \${topPosts.length === 0 ? '<p style="text-align:center;color:#71717a;padding:2rem;">No published posts</p>' : topPosts.map((p, i) => \`
                <div class="post-card">
                  <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;">
                    <div class="rank-badge" style="background:\${i===0 ? '#fef3c7;color:#b45309' : '#f4f4f5'}">\${i+1}</div>
                    <span class="badge badge-blue" style="font-size:0.625rem;padding:0.1rem 0.4rem;">\${p.platform || 'post'}</span>
                    \${p.title ? \`<span style="font-size:0.8125rem;font-weight:500;">\${p.title}</span>\` : ''}
                  </div>
                  <p style="font-size:0.8125rem;color:#7171717a;line-height:1.5;margin:0 0 0.5rem;">\${(p.content || '').substring(0, 120)}...</p>
                  <div style="display:flex;gap:0.75rem;font-size:0.75rem;color:#71717a;">
                    <span>❤ \${formatNum(p.likes)}</span>
                    <span>💬 \${formatNum(p.comments)}</span>
                    <span>↗ \${formatNum(p.shares)}</span>
                    <span style="margin-left:auto;font-weight:600;">\${formatNum(p.engagement)} engaged</span>
                  </div>
                </div>
              \`).join('')}
            </div>
          </div>
        </div>
      \`;
    }

    // ── Accounts View ────────────────────────────────────────────────
    function renderAccounts(data) {
      const accs = data.accounts || [];
      const totalF = accs.reduce((s,a) => s + (a.followersCount||0), 0);
      return \`
        <div style="display:flex;flex-direction:column;gap:1.5rem;">
          <div class="grid grid-3 gap-4">
            <div class="card"><div class="stat-value">\${accs.length}</div><div class="stat-label">Connected Accounts</div></div>
            <div class="card"><div class="stat-value">\${formatNum(totalF)}</div><div class="stat-label">Total Followers</div></div>
            <div class="card"><div class="stat-value">\${accs.filter(a=>a.isActive).length}/\${accs.length}</div><div class="stat-label">Active Accounts</div></div>
          </div>
          <div class="card">
            <h3>Connected Social Accounts</h3>
            <div class="grid grid-1 md-grid-cols-2 lg-grid-cols-3 gap-4">
              \${accs.map(a => {
                const colors: Record<string,string> = { facebook:'#1877F2', instagram:'#E4405F', twitter:'#000', linkedin:'#0A66C2', tiktok:'#000', youtube:'#FF0000' };
                const color = colors[a.platform] || '#6b7280';
                return \`
                  <div style="border:1px solid #e4e4e7;border-radius:0.75rem;overflow:hidden;border-left:4px solid \${color};">
                    <div style="padding:1rem;">
                      <div style="display:flex;align-items:center;gap:0.75rem;">
                        <div style="width:2.5rem;height:2.5rem;border-radius:50%;background:\${color};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:0.875rem;">\${(a.displayName || a.username || '?').charAt(0).toUpperCase()}</div>
                        <div style="flex:1;min-width:0;">
                          <div class="font-semibold text-sm truncate">\${a.displayName || a.username}</div>
                          <div class="text-xs" style="color:#71717a;">@\${a.username}</div>
                        </div>
                        <span class="badge badge-green" style="margin-left:auto;font-size:0.625rem;">Active</span>
                      </div>
                      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.5rem;margin-top:0.75rem;">
                        <div style="text-align:center;padding:0.5rem;background:#f4f4f5;border-radius:0.375rem;"><div class="font-bold text-sm">\${formatNum(a.followersCount)}</div><div class="stat-label">Followers</div></div>
                        <div style="text-align:center;padding:0.5rem;background:#f4f4f5;border-radius:0.375rem;"><div class="font-bold text-sm">\${formatNum(a.followingCount)}</div><div class="stat-label">Following</div></div>
                        <div style="text-align:center;padding:0.5rem;background:#f4f4f5;border-radius:0.375rem;"><div class="font-bold text-sm">\${a.followersCount > 0 ? ((a.followingCount/a.followersCount)*100).toFixed(1) : 0}%</div><div class="stat-label">Ratio</div></div>
                      </div>
                    </div>
                  </div>
                \`;
              }).join('')}
            </div>
          </div>
        </div>
      \`;
    }

    // ── Compose View ──────────────────────────────────────────────
    function renderCompose() {
      const platforms = ['📘 Facebook', '📸 Instagram', '𝕏 X (Twitter)', '💼 LinkedIn', '🎵 TikTok', '▶️ YouTube'];
      return \`
        <div style="display:flex;flex-direction:column;gap:1.5rem;">
          <div>
            <h1 class="text-2xl font-bold tracking-tight">Content Composer</h1>
            <p class="text-sm" style="color:#71717a;">Create and schedule posts across platforms</p>
          </div>
          <div class="card">
            <h3 style="display:flex;align-items:center;gap:0.5rem;"><span>🌐 Select Platforms</span></h3>
            <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-top:0.75rem;">
              \${platforms.map(p => \`<button style="padding:0.5rem 1rem;border-radius:9999px;border:1px solid #e4e4e7;font-size:0.875rem;font-weight:500;cursor:pointer;transition:all 150ms;" onmouseover="this.style.background='#f4f4f5'" onmouseout="this.style.background=''">\${p}</button>\`).join('')}
            </div>
          </div>
          <div class="card">
            <h3 style="display:flex;align-items:center;gap:0.5rem;"><span>📝 Content Editor</span></h3>
            <div style="margin-top:0.75rem;">
              <input placeholder="Post title (optional)" style="width:100%;padding:0.5rem 0.75rem;border:1px solid #e4e4e7;border-radius:0.5rem;font-size:0.875rem;margin-bottom:0.5rem;" />
              <textarea placeholder="Write your post content here..." rows="8" style="width:100%;padding:0.75rem;border:1px solid #e4e4e7;border-radius:0.5rem;font-size:0.875rem;resize:vertical;min-height:160px;font-family:inherit;line-height:1.6;"></textarea>
            </div>
          </div>
          <div class="card">
            <h3 style="display:flex;align-items:center;gap:0.5rem;"><span>📅 Scheduling</span></h3>
            <div style="margin-top:0.75rem;">
              <div style="display:flex;gap:1rem;">
                <div style="flex:1;"><label style="display:block;font-size:0.75rem;color:#71717a;margin-bottom:0.25rem;">Date</label><input type="date" style="width:100%;padding:0.5rem 0.75rem;border:1px solid #e4e7;border-radius:0.5rem;font-size:0.875rem;" /></div>
                <div style="flex:1;"><label style="display:block;font-size:0.75rem;color:#71717a;margin-bottom:0.25rem;">Time</label><input type="time" value="10:00" style="width:100%;padding:0.5rem 0.75rem;border:1px solid #e4e7;border-radius:0.5rem;font-size:0.875rem;" /></div>
              </div>
            </div>
          </div>
          <div class="card" style="padding-top:1.5rem;">
            <div style="display:flex;gap:0.75rem;">
              <button style="flex:1;padding:0.625rem;border:1px solid #e4e4e7;border-radius:0.5rem;font-size:0.875rem;font-weight:500;cursor:pointer;">📄 Save Draft</button>
              <button style="flex:1;padding:0.625rem;border:1px solid #e4e7;border-radius:0.5rem;font-size:0.875rem;font-weight:500;cursor:pointer;">✉️ Submit</button>
              <button style="flex:1;padding:0.625rem;background:linear-gradient(135deg,#7c3aed,#d946ef);color:#fff;border:none;border-radius:0.5rem;font-size:0.875rem;font-weight:500;cursor:pointer;">🚀 Publish</button>
            </div>
          </div>
        </div>
      \`;
    }

    // ── Scheduler View ──────────────────────────────────────────────
    function renderScheduler(data) {
      const posts = data.posts || [];
      const scheduled = posts.filter(p => p.status === 'scheduled');
      const now = new Date();
      return \`
        <div style="display:flex;flex-direction:column;gap:1.5rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div><h1 class="text-2xl font-bold tracking-tight">📅 Smart Scheduler</h1><p class="text-sm" style="color:#71717a;">Plan and schedule your content</p></div>
            <span class="badge badge-amber">\${scheduled.length} scheduled</span>
          </div>
          <div class="card">
            <h3>Upcoming Posts</h3>
            \${scheduled.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📅</div><h3>No scheduled posts</h3><p>Click Compose to create one</p></div>' :
              scheduled.sort((a,b) => new Date(a.scheduledAt||0).getTime() - new Date(b.scheduledAt||0).getTime()).map(p => \`
                <div style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem;border:1px solid #e4e4e7;border-radius:0.5rem;">
                  <div class="platform-dot" style="background:\${{facebook:'#1877F2',instagram:'#E4405F',twitter:'#000',linkedin:'#0A66C2',tiktok:'#000',youtube:'#FF0000'}[p.platform] || '#6b7280'}"></div>
                  <div style="flex:1;min-width:0;">
                    <div class="text-sm font-medium truncate">\${p.title || 'Untitled'}</div>
                    <div class="text-xs" style="color:#71717a;">\${p.content ? p.content.substring(0,80) : 'No content'}</div>
                  </div>
                  <div class="text-xs" style="color:#71717a;white-space:nowrap;">\${p.scheduledAt ? new Date(p.scheduledAt).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : 'Not set'}</div>
                </div>
              \`).join('')}
          </div>
          <div class="card">
            <h3>AI Best Posting Times</h3>
            <div class="grid grid-2 md-grid-cols-3 gap-3">
              \${[{platform:'Facebook',time:'9:00 AM',day:'Wednesday'},{platform:'Instagram',time:'11:00 AM',day:'Tuesday'},{platform:'X (Twitter)',time:'12:00 PM',day:'Thursday'},{platform:'LinkedIn',time:'7:00 AM',day:'Tuesday'},{platform:'TikTok',time:'7:00 AM',day:'Saturday'},{platform:'YouTube',time:'2:00 PM',day:'Saturday'}].map(t => \`
                <div style="padding:0.75rem;border:1px solid #e4e7;border-radius:0.5rem;">
                  <div class="text-sm font-medium">\${t.platform}</div>
                  <div class="text-xs" style="color:#71717a;">Best: \${t.day} at \${t.time}</div>
                </div>
              \`).join('')}
            </div>
          </div>
        </div>
      \`;
    }

    // ── Analytics View ──────────────────────────────────────────────
    function renderAnalytics(data) {
      const analytics = data.analytics || {};
      const eng = analytics.engagement || {};
      const timeline = analytics.timeline || [];
      const platforms = analytics.platforms || [];
      return \`
        <div style="display:flex;flex-direction:column;gap:1.5rem;">
          <div><h1 class="text-2xl font-bold tracking-tight">📈 Analytics</h1><p class="text-sm" style="color:#71717a;">Track performance across platforms</p></div>
          <div class="grid grid-2 md-grid-cols-3 lg-grid-cols-6 gap-3">
            <div class="card" style="padding:1rem;"><div style="font-size:0.75rem;color:#71717a;">Total Reach</div><div class="stat-value" style="font-size:1.25rem;">\${formatNum(eng.totalReach||0)}</div><div class="trend-up" style="font-size:0.75rem;">↑ 12.5%</div></div>
            <div class="card" style="padding:1rem;"><div style="font-size:0.75rem;color:#71717a;">Impressions</div><div class="stat-value" style="font-size:1.25rem;">\${formatNum(timeline.reduce((s,t) => s+(t.impressions||0),0))}</div><div class="trend-up" style="font-size:0.75rem;">↑ 8.3%</div></div>
            <div class="card" style="padding:1rem;"><div style="font-size:0.75rem;color:#71717a;">Likes</div><div class="stat-value" style="font-size:1.25rem;">\${formatNum(eng.totalLikes||0)}</div><div class="trend-up" style="font-size:0.75rem;">↑ 15.2%</div></div>
            <div class="card" style="padding:1rem;"><div style="font-size:0.75rem;color:#71717a;">Comments</div><div class="stat-value" style="font-size:1.25rem;">\${formatNum(eng.totalComments||0)}</div><div class="trend-down" style="font-size:0.75rem;">↓ 3.1%</div></div>
            <div class="card" style="padding:1rem;"><div style="font-size:0.75rem;color:#71717a;">Shares</div><div class="stat-value" style="font-size:1.25rem;">\${formatNum(eng.totalShares||0)}</div><div class="trend-up" style="font-size:0.75rem;">↑ 22.4%</div></div>
            <div class="card" style="padding:1rem;"><div style="font-size:0.75rem;color:#71717a;">Clicks</div><div class="stat-value" style="font-size:1.25rem;">\${formatNum(eng.totalClicks||0)}</div><div class="trend-up" style="font-size:0.75rem;">↑ 9.7%</div></div>
          </div>
          <div class="grid grid-1 md-grid-cols-2 gap-6">
            <div class="card"><h3>📈 Engagement Over Time</h3><div class="chart-placeholder">📊 Area Chart (30 days)</div></div>
            <div class="card"><h3>📱 Platform Comparison</h3><div class="chart-placeholder">📊 Bar Chart</div></div>
          </div>
          <div class="card"><h3>📊 Platform Performance</h3>
            <table style="width:100%;border-collapse:collapse;font-size:0.875rem;">
              <tr style="border-bottom:1px solid #e4e4e7;"><th style="text-align:left;padding:0.75rem;font-weight:600;">Platform</th><th style="text-align:right;padding:0.75rem;font-weight:600;">Posts</th><th style="text-align:right;padding:0.75rem;font-weight:600;">Reach</th><th style="text-align:right;padding:0.75rem;font-weight:600;">Engagement</th></tr>
              \${platforms.map(p => \`<tr style="border-bottom:1px solid #f4f4f5;"><td style="padding:0.75rem;font-weight:500;">\${(p.platform||'Unknown').charAt(0).toUpperCase() + (p.platform||'').slice(1)}</td><td style="text-align:right;padding:0.75rem;">\${p._count||0}</td><td style="text-align:right;padding:0.75rem;">\${formatNum(p._sum?.reach||0)}</td><td style="text-align:right;padding:0.75rem;">\${formatNum(p._sum?.engagement||0)}</td></tr>\`).join('')}
            </table>
          </div>
        </div>
      \`;
    }

    // ── AI Tools View ──────────────────────────────────────────────
    function renderAITools() {
      return \`
        <div style="display:flex;flex-direction:column;gap:1.5rem;">
          <div><h1 class="text-2xl font-bold tracking-tight">🤖 AI Tools</h1><p class="text-sm" style="color:#71717a;">Supercharge your social media with AI</p></div>
          <div class="card">
            <h3>✨ Content Generator</h3>
            <div style="display:flex;flex-direction:column;gap:0.75rem;margin-top:0.75rem;">
              <input placeholder="Enter a topic (e.g., product launch tips)" style="padding:0.5rem 0.75rem;border:1px solid #e4e7;border-radius:0.5rem;font-size:0.875rem;" />
              <div style="display:flex;gap:0.5rem;">
                <select style="flex:1;padding:0.5rem 0.75rem;border:1px solid #e4e7;border-radius:0.5rem;font-size:0.875rem;"><option>Professional</option><option>Casual</option><option>Inspiring</option><option>Funny</option></select>
                <button style="flex:1;padding:0.625rem;background:linear-gradient(135deg,#7c3aed,#d946ef);color:#fff;border:none;border-radius:0.5rem;font-size:0.875rem;font-weight:500;">✨ Generate</button>
              </div>
            </div>
          </div>
          <div class="card">
            <h3>🔄 Platform Rewriter</h3>
            <div style="display:flex;flex-direction:column;gap:0.75rem;margin-top:0.75rem;">
              <textarea placeholder="Paste your content here..." rows="4" style="padding:0.75rem;border:1px solid #e4e7;border-radius:0.5rem;font-size:0.875rem;resize:vertical;min-height:100px;font-family:inherit;"></textarea>
              <div style="display:flex;gap:0.5rem;">
                <select style="flex:1;padding:0.5rem 0.75rem;border:1px solid #e4e7;border-radius:0.5rem;font-size:0.875rem;"><option>Facebook</option><option>Instagram</option><option>X (Twitter)</option><option>LinkedIn</option><option>TikTok</option><option>YouTube</option></select>
                <button style="flex:1;padding:0.625rem;border:1px solid #e4e7;border-radius:0.5rem;font-size:0.875rem;font-weight:500;">🔄 Rewrite</button>
              </div>
            </div>
          </div>
          <div class="card">
            <h3="#️ Hashtag Generator</h3>
            <div style="display:flex;gap:0.5rem;margin-top:0.75rem;">
              <input placeholder="Enter keywords for hashtags..." style="flex:1;padding:0.5rem 0.75rem;border:1px solid #e4e7;border-radius:0.5rem;font-size:0.875rem;" />
              <button style="padding:0.625rem 1rem;border:1px solid #e4e7;border-radius:0.5rem;font-size:0.875rem;font-weight:500;">#️ Generate</button>
            </div>
            <div id="hashtag-results" style="display:none;flex-wrap:wrap;gap:0.375rem;margin-top:0.75rem;"></div>
          </div>
          <div class="card">
            <h3>💬 Auto-Reply</h3>
            <p style="font-size:0.875rem;color:#71717a;margin:0.75rem 0;">AI automatically generates replies for comments across your posts.</p>
          </div>
          <div class="card">
            <h3>🔥 Trend Detector</h3>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:0.75rem;margin-top:0.75rem;">
              \${[
                {name:'AI-Powered Marketing',growth:'+340%',cat:'Technology',color:'#7c3aed',vel:'High'},
                {name:'Sustainable Fashion',growth:'+185%',cat:'Lifestyle',color:'#ec4899',vel:'High'},
                {name:'Remote Work Culture',growth:'+120%',cat:'Business',color:'#3b82f6',vel:'Medium'},
                {name:'Short-Form Video',growth:'+95%',cat:'Entertainment',color:'#f97316',vel:'Medium'},
                {name:'Plant-Based Recipes',growth:'+78%',cat:'Food',color:'#22c55e',vel:'Low'},
              ].map(t => \`
                <div style="padding:0.75rem;border:1px solid #e4e7;border-radius:0.5rem;">
                  <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;">
                    <div class="badge" style="background:\${t.color}20;color:\${t.color};font-size:0.625rem;">\${t.vel}</div>
                    <span class="text-sm font-medium">\${t.name}</span>
                  </div>
                  <div class="text-xs" style="color:#71717a;">\${t.cat} · Growth \${t.growth}</div>
                </div>
              \`).join('')}
            </div>
          </div>
        </div>
      \`;
    }

    // ── Team View ──────────────────────────────────────────────────
    function renderTeam(data) {
      const members = data.teamMembers || [];
      return \`
        <div style="display:flex;flex-direction:column;gap:1.5rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div><h1 class="text-2xl font-bold tracking-tight">👥 Team Management</h1><p class="text-sm" style="color:#71717a;">Manage team and approval workflows</p></div>
            <button style="padding:0.5rem 1rem;background:#0a0a0a;color:#fafafa;border:none;border-radius:0.5rem;font-size:0.875rem;font-weight:500;">+ Invite</button>
          </div>
          <div class="card">
            <h3>Team Members (\${members.length})</h3>
            <table style="width:100%;border-collapse:collapse;font-size:0.875rem;">
              <tr style="border-bottom:1px solid #e4e7;"><th style="text-align:left;padding:0.75rem;font-weight:600;">Member</th><th style="text-align:left;padding:0.75rem;font-weight:600;">Role</th><th style="text-align:left;padding:0.75rem;font-weight:600;">Joined</th></tr>
              \${members.map(m => \`
                <tr style="border-bottom:1px solid #f4f4f5;">
                  <td style="padding:0.75rem;"><div class="font-medium">\${m.name}</div><div class="text-xs" style="color:#71717a;">\${m.email}</div></td>
                  <td style="padding:0.75rem;"><span class="badge \${m.role === 'admin' ? 'badge-violet' : m.role === 'editor' ? 'badge-blue' : ''}" style="font-size:0.6875rem;">\${m.role}</span></td>
                  <td style="padding:0.75rem;color:#71717a;">\${m.joinedAt ? new Date(m.joinedAt).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : 'N/A'}</td>
                </tr>
              \`).join('')}
            </table>
          </div>
          <div class="card">
            <h3>Roles & Permissions</h3>
            <div class="grid grid-1 md-grid-cols-3 gap-4">
              \${[
                {role:'Admin',perm:'Full access to all features',color:'#7c3aed',perms:['Manage members','Configure accounts','Approve content','Access analytics','Manage billing']},
                {role:'Editor',perm:'Content creation and scheduling',color:'#3b82f6',perms:['Create & edit posts','Schedule content','Use AI tools','View analytics','Submit for approval']},
                {role:'Viewer',perm:'Read-only access',color:'#71717a',perms:['View dashboard','View posts','View reports','Export data']},
              ].map(r => \`
                <div style="padding:1rem;border:1px solid #e4e7;border-radius:0.5rem;border-left:4px solid \${r.color};">
                  <div class="font-semibold text-sm">\${r.role}</div>
                  <div class="text-xs" style="color:#71717a;margin-bottom:0.75rem;">\${r.perm}</div>
                  <div style="display:flex;flex-direction:column;gap:0.25rem;">
                    \${r.perms.map(p => \`<div style="display:flex;align-items:center;gap:0.375rem;font-size:0.8125rem;color:#71717a;">✓ \${p}</div>\`).join('')}
                  </div>
                </div>
              \`).join('')}
            </div>
          </div>
        </div>
      \`;
    }

    // ── Architecture View ──────────────────────────────────────────
    function renderArchitecture() {
      return \`
        <div style="display:flex;flex-direction:column;gap:1.5rem;">
          <div><h1 class="text-2xl font-bold tracking-tight">🏗️ Architecture</h1><p class="text-sm" style="color:#71717a;">System architecture and technology stack</p></div>
          <div class="card">
            <h3>Technology Stack</h3>
            <div class="grid grid-1 md-grid-cols-2 gap-4">
              <div>
                <h4 style="font-size:0.875rem;font-weight:600;margin-bottom:0.5rem;">Frontend</h4>
                \${['React 19','Next.js 16','TypeScript 5','Tailwind CSS 4','shadcn/ui','Zustand','Recharts','Framer Motion'].map(t => \`<div style="display:flex;align-items:center;gap:0.5rem;padding:0.375rem 0;background:#f4f4f5;border-radius:0.375rem;font-size:0.8125rem;"><div style="width:6px;height:6px;border-radius:50%;background:#7c3aed;"></div>\${t}</div>\`).join('')}
              </div>
              <div>
                <h4 style="font-size:0.875rem;font-weight:600;margin-bottom:0.5rem;">Backend</h4>
                \${['Next.js API','Hono','Prisma ORM','z-ai-web-dev-sdk','NextAuth.js v4','Bun','Queue System','Socket.io'].map(t => \`<div style="display:flex;align-items:center;gap:0.5rem;padding:0.375rem 0;background:#f4f4f5;border-radius:0.375rem;font-size:0.8125rem;"><div style="width:6px;height:6px;border-radius:50%;background:#10b981;"></div>\${t}</div>\`).join('')}
              </div>
              <div>
                <h4 style="font-size:0.875rem;font-weight:600;margin-bottom:0.5rem;">Data Layer</h4>
                \${['PostgreSQL','SQLite','Prisma Client','Redis','Prisma Migrate','Seed Scripts'].map(t => \`<div style="display:flex;align-items:center;gap:0.5rem;padding:0.375rem 0;background:#f4f4f5;border-radius:0.375rem;font-size:0.8125rem;"><div style="width:6px;height:6px;border-radius:50%;background:#f59e0b;"></div>\${t}</div>\`).join('')}
              </div>
            </div>
          </div>
          <div class="card">
            <h3>Database Schema (9 tables)</h3>
            <div class="text-xs" style="color:#71717a;margin-bottom:1rem;">
              User • Team • TeamMember • SocialAccount • Post • PostAnalytics • Comment • Activity • ContentTemplate • HashtagGroup
            </div>
            <div class="card" style="border-left:4px solid #f59e0b;">
              <h4 style="font-size:0.875rem;font-weight:600;">Post (Main Entity)</h4>
              <div class="text-xs" style="color:#71717a;line-height:1.6;">
                id → string · title → string? · content → string · platform → string · status → string · aiGenerated → boolean · reach → int · engagement → int · likes → int · comments → int · shares → int · clicks → int · userId → string · createdAt → datetime · updatedAt → datetime
              </div>
            </div>
          </div>
        </div>
      \`;
    }

    // Initial load
    fetchData();
  </script>
</body>
</html>\`;
}

// ─── API Routes (proxy to Next.js) ─────────────────────────────────────────
app.get('/api/*', async (c) => {
  // Try Next.js API first, fallback to local data
  try {
    const res = await fetch(\`http://localhost:3000\${c.req.path}\${c.req.querystring ? '?' + c.req.querystring : ''}\`);
    if (res.ok) {
      const contentType = res.headers.get('content-type') || 'application/json';
      const body = await res.text();
      return c.body(body, 200, { 'Content-Type': contentType });
    }
  } catch (e) {}
  return c.json({ success: false, error: 'Service unavailable' }, 503);
});

// ─── Start Server ───────────────────────────────────────────────────
const port = 3000;
console.log(\`🚀 SocialPilot AI running on http://localhost:\${port}\`);
export default app;
