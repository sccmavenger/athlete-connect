export function renderErrorPage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Something went wrong — The HUB</title>
    <style>
      body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
        background: #0a0a0a; color: #fafafa; font-family: system-ui, -apple-system, sans-serif; padding: 1.5rem; }
      .box { max-width: 28rem; text-align: center; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #a1a1aa; font-size: 0.875rem; margin: 0 0 1.5rem; }
      a { display: inline-block; background: #1e90ff; color: #06131f; text-decoration: none;
        font-weight: 600; font-size: 0.875rem; padding: 0.625rem 1rem; border-radius: 0.5rem; }
    </style>
  </head>
  <body>
    <div class="box">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. Try refreshing or head back home.</p>
      <a href="/">Go home</a>
    </div>
  </body>
</html>`;
}
