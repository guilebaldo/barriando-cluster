// Carga una URL en Chrome headless via CDP y reporta consola, excepciones y crashes.
// Útil para cazar errores de hidratación (ej. módulos de servidor filtrados al
// bundle del cliente) que dejan la página en blanco/negro sin log en el servidor.
//
// 1) "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
//      --user-data-dir=/tmp/chr-cdp --remote-debugging-port=9222 about:blank &
// 2) node scripts/debug-page.mjs <url> [ms] [puerto]

const url = process.argv[2];
const waitMs = Number(process.argv[3] ?? 15000);
const port = Number(process.argv[4] ?? 9222);
if (!url) {
  console.error("uso: node scripts/debug-page.mjs <url> [ms] [puerto]");
  process.exit(1);
}

const endpoint = `http://127.0.0.1:${port}`;

async function json(path) {
  const res = await fetch(`${endpoint}${path}`);
  return res.json();
}

const targets = await json("/json/list");
const page = targets.find((t) => t.type === "page");
if (!page) {
  console.error("no hay target de tipo page");
  process.exit(1);
}

const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const send = (method, params = {}) =>
  ws.send(JSON.stringify({ id: ++id, method, params }));

const events = [];

ws.addEventListener("open", () => {
  send("Runtime.enable");
  send("Log.enable");
  send("Page.enable");
  send("Network.enable");
  send("Inspector.enable");
  send("Page.navigate", { url });
});

ws.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  if (!msg.method) return;

  if (msg.method === "Runtime.consoleAPICalled") {
    const text = (msg.params.args ?? [])
      .map((a) => a.value ?? a.description ?? a.type)
      .join(" ");
    events.push(`[console.${msg.params.type}] ${text}`);
  }
  if (msg.method === "Runtime.exceptionThrown") {
    const d = msg.params.exceptionDetails;
    events.push(
      `[exception] ${d.exception?.description ?? d.text}\n    en ${d.url ?? "?"}:${d.lineNumber}`
    );
  }
  if (msg.method === "Log.entryAdded") {
    const e = msg.params.entry;
    events.push(`[log.${e.level}] ${e.text}${e.url ? ` (${e.url})` : ""}`);
  }
  if (msg.method === "Network.loadingFailed") {
    events.push(`[net-fail] ${msg.params.errorText} type=${msg.params.type}`);
  }
  if (msg.method === "Inspector.targetCrashed") {
    events.push("[CRASH] el proceso de render murió");
  }
  if (msg.method === "Page.loadEventFired") {
    events.push("[page] load");
  }
});

setTimeout(async () => {
  try {
    send("Runtime.evaluate", {
      expression: "JSON.stringify({heap: performance.memory?.usedJSHeapSize, nodes: document.querySelectorAll('*').length})",
      returnByValue: true,
    });
  } catch {
    /* ignore */
  }
  setTimeout(() => {
    console.log(events.length ? events.join("\n") : "(sin eventos)");
    process.exit(0);
  }, 1000);
}, waitMs);
