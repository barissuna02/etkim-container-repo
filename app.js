const http = require('http');

const port = process.env.PORT || 3000;
const version = process.env.APP_VERSION || 'v1';

const themes = {
  v1: {
    badge: 'SUFLE ETKİM',
    title: 'Sunuma Hoş Geldiniz',
    emoji: '🎤',
    tagline: 'Docker, ECR, ECS, EKS ve App Runner nedir öğreniyoruz.',
    bullets: [
      '🐳 Bu sayfa bir Docker container içinde çalışıyor.',
    ],
    gradient: 'linear-gradient(135deg, #ffffff 0%, #ffedd5 15%, #f97316 100%)',
  },
  v2: {
    badge: 'SUFLE ETKİM · v2',
    title: 'Pipeline Devreye Girdi',
    emoji: '⚙️',
    tagline: 'GitHub\'a push attık, image build oldu, ECS yeni task\'ı ayağa kaldırdı.',
    bullets: [
      '🐳 Bu sayfa bir Docker container içinde çalışıyor.',
    ],
    gradient: 'linear-gradient(135deg, #9a3412 0%, #f97316 45%, #fdba74 100%)',
  },
};

const theme = themes[version] || {
  badge: `SUFLE ETKİM · ${version}`,
  title: 'Yeni Sürüm Yayında',
  emoji: '✨',
  tagline: 'Bir deployment daha tamamlandı.',
  bullets: [
    'Container yeni image ile çalışıyor.',
    'Pipeline tüm adımları otomatik halletti.',
  ],
  gradient: 'linear-gradient(135deg, #111827 0%, #374151 50%, #6b7280 100%)',
};

function html() {
  const bullets = theme.bullets.map((b) => `<li>${b}</li>`).join('');

  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${theme.title} · SUFLE ETKİM</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 32px;
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      color: #f8fafc;
      background: ${theme.gradient};
      background-size: 220% 220%;
      animation: drift 18s ease infinite;
    }
    @keyframes drift {
      0%, 100% { background-position: 0% 50%; }
      50%      { background-position: 100% 50%; }
    }
    .card {
      width: 100%;
      max-width: 720px;
      padding: 56px 48px;
      border-radius: 28px;
      backdrop-filter: blur(20px);
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.14);
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.4);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 8px 16px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.1);
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.12em;
      margin-bottom: 28px;
    }
    .dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #4ade80;
      box-shadow: 0 0 12px #4ade80;
    }
    .emoji { font-size: 72px; margin-bottom: 16px; }
    h1 { font-size: 56px; line-height: 1.05; margin-bottom: 18px; }
    p.tagline { font-size: 19px; opacity: 0.88; margin-bottom: 32px; line-height: 1.5; }
    ul {
      list-style: none;
      display: grid;
      gap: 12px;
      margin-bottom: 28px;
    }
    ul li {
      padding: 14px 18px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 15px;
      line-height: 1.45;
    }
  </style>
</head>
<body>
  <main class="card">
    <div class="badge"><span class="dot"></span> ${theme.badge}</div>
    <div class="emoji">${theme.emoji}</div>
    <h1>${theme.title}</h1>
    <p class="tagline">${theme.tagline}</p>
    <ul>${bullets}</ul>
  </main>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', version }));
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html());
});

server.listen(port, () => {
  console.log(`[SUFLE ETKİM ${version}] listening on :${port}`);
});
