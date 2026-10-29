export interface LandingPageOptions {
  port: number;
  docsEnabled: boolean;
}

/**
 * Branded root page. Self-contained HTML + inline CSS (no inline JS, so it
 * works under Helmet's default CSP). The mark is public/logo-developers-mania.png;
 * swap that file to rebrand. Colours match the Next/Vue templates: the logo red
 * is #fb260b, and brand-600 is the darker shade used behind white text.
 */
export function renderLandingPage({
  port,
  docsEnabled,
}: LandingPageOptions): string {
  const docsLink = docsEnabled
    ? '<a class="button primary" href="/docs">API documentation</a>'
    : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Developers Mania · Nest API</title>
  <link rel="icon" type="image/png" href="/logo-developers-mania.png">
  <style>
    :root {
      --brand: #fb260b;
      --brand-600: oklch(0.53 0.2 29);
      --brand-700: oklch(0.46 0.17 29);
      --bg: #ffffff;
      --surface: #f9fafb;
      --border: #e5e7eb;
      --text: #111827;
      --muted: #4b5563;
      --ok: #15803d;
      color-scheme: light dark;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #030712;
        --surface: #111827;
        --border: #1f2937;
        --text: #f3f4f6;
        --muted: #9ca3af;
        --ok: #4ade80;
      }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--bg);
      color: var(--text);
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .bar { height: 6px; background: var(--brand); }
    header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 20px 24px;
      font-weight: 600;
      font-size: 1.05rem;
    }
    /* The mark's bricks are transparent and designed to read white, so back
       it with white to keep it on-brand in dark mode too. */
    .mark { display: block; background: #fff; }
    header .mark { width: 32px; height: 32px; border-radius: 4px; }
    main {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 16px 48px;
    }
    .card {
      width: 100%;
      max-width: 520px;
      text-align: center;
      background: var(--surface);
      border: 1px solid var(--border);
      border-top: 4px solid var(--brand);
      border-radius: 12px;
      padding: 40px 28px;
    }
    .card .mark { width: 88px; height: 88px; margin: 0 auto; border-radius: 10px; }
    .status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin: 24px 0 8px;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--ok);
    }
    .status::before {
      content: "";
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
      box-shadow: 0 0 0 4px color-mix(in srgb, currentColor 20%, transparent);
    }
    h1 { margin: 0; font-size: 1.6rem; line-height: 1.3; }
    .port { margin: 8px 0 0; color: var(--muted); font-size: 1.05rem; }
    .port strong {
      color: var(--text);
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
      margin-top: 28px;
    }
    .button {
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.95rem;
      text-decoration: none;
      border: 1px solid var(--border);
      color: var(--text);
    }
    .button:hover { border-color: var(--brand-600); }
    .button.primary { background: var(--brand-600); border-color: var(--brand-600); color: #fff; }
    .button.primary:hover { background: var(--brand-700); }
    .button:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
    footer { padding: 20px; text-align: center; font-size: 0.85rem; color: var(--muted); }
  </style>
</head>
<body>
  <div class="bar"></div>
  <header>
    <img class="mark" src="/logo-developers-mania.png" alt="">
    <span>Developers Mania</span>
  </header>
  <main>
    <section class="card">
      <img class="mark" src="/logo-developers-mania.png" alt="Developers Mania logo">
      <div class="status">Online</div>
      <h1>Nest server is running</h1>
      <p class="port">Listening on port <strong>${port}</strong></p>
      <div class="actions">
        ${docsLink}
        <a class="button" href="/api/health">Health check</a>
      </div>
    </section>
  </main>
  <footer>&copy; ${new Date().getFullYear()} Developers Mania</footer>
</body>
</html>`;
}
