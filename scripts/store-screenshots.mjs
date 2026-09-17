#!/usr/bin/env node
// Builds the App Store and Play Store listing images from the real app.
//
//   1. Start the API and the Expo web build (the API must allow the web origin):
//        docker compose -f docker/compose.yml up -d --wait
//        (cd api && WEB_ORIGIN=http://localhost:8097 npm run dev)
//        (cd mobile && EXPO_PUBLIC_API_URL=http://localhost:4000 npx expo start --web --port 8097)
//   2. node scripts/store-screenshots.mjs            # needs `chromium` on PATH
//
// Output: mobile/store-assets/{raw,app-store-iphone-6.9,app-store-ipad-13,play-store-phone,play-store-feature-graphic.png}
//
// Every frame is a genuine capture of the app with a short caption above it.
// Store rules this keeps to: exact pixel sizes, PNG without an alpha channel,
// the app shown in use (no splash or login shots), no prices, rankings,
// "download now" calls to action, other platforms' names, or device artwork.
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "mobile", "store-assets");
const BASE = process.env.STORE_APP_URL ?? "http://localhost:8097";
const PORT = 9335;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const serif = readFileSync(join(root, "mobile/node_modules/@expo-google-fonts/dm-serif-display/400Regular/DMSerifDisplay_400Regular.ttf")).toString("base64");
const sans = readFileSync(join(root, "web/node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2")).toString("base64");
// The web build asks for the platform's system font, which a headless Linux box lacks.
// Geist (the website's face) stands in under the names in React Native Web's font stack.
const SYSTEM_FONT_CSS = ["BlinkMacSystemFont", "Segoe UI", "Roboto"].map((name) => `@font-face{font-family:"${name}";src:url(data:font/woff2;base64,${sans}) format("woff2");font-weight:100 900;}`).join("");

/** The screens, in listing order. `prepare` runs in the page after it loads. */
const SHOTS = [
  { id: "01-identify", path: "/", eyebrow: "Identify", caption: "Hear it. Find out what it is." },
  { id: "02-results", path: "/", eyebrow: "Sung, spoken or typed", caption: "Type the words you remember", type: { placeholder: "Or type the words you remember", text: "Amazing grace, how sweet the sound", click: "Identify the words" }, scrollTo: "Best matches" },
  { id: "03-hymn", path: "/hymns/amazing-grace-how-sweet-the-sound", eyebrow: "Hymns", caption: "Every verse, with its hymn board number" },
  { id: "04-hymnal", path: "/hymns", eyebrow: "Hymnals", caption: "Find a hymn by its number", clickText: "SSS" },
  { id: "05-bible", path: "/bible/kjv/psalms/23", eyebrow: "Scripture", caption: "Read the Bible in six translations" },
  { id: "06-search", path: "/search", eyebrow: "Search", caption: "Search verses and hymns together", type: { placeholder: "A phrase, a reference, a first line", text: "the Lord is my shepherd", enter: true } },
];

const DEVICES = {
  phone: { width: 440, height: 956, scale: 3 }, // 1320 x 2868, iPhone 6.9"
  tablet: { width: 1032, height: 1376, scale: 2 }, // 2064 x 2752, iPad 13"
};

/** Listing frames: target size, which raw capture goes inside, and where. */
const FRAMES = {
  // `top` is where the capture starts; it is sized to fit whole above a `bottom` margin.
  "app-store-iphone-6.9": { width: 1320, height: 2868, device: "phone", headline: 108, eyebrow: 34, pad: 96, top: 560, bottom: 100 },
  "app-store-ipad-13": { width: 2064, height: 2752, device: "tablet", headline: 120, eyebrow: 36, pad: 140, top: 610, bottom: 120 },
  "play-store-phone": { width: 1080, height: 1920, device: "phone", headline: 80, eyebrow: 26, pad: 72, top: 400, bottom: 72 },
};

async function connect() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((target) => target.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* not up yet */ }
    await sleep(250);
  }
  throw new Error("Chromium did not start. Is `chromium` on PATH?");
}

const profile = join(out, ".chrome-profile");
rmSync(profile, { recursive: true, force: true });
for (const dir of ["raw", ...Object.keys(FRAMES)]) mkdirSync(join(out, dir), { recursive: true });
const chrome = spawn("chromium", ["--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });

try {
  const ws = new WebSocket(await connect());
  await new Promise((resolve) => (ws.onopen = resolve));
  let id = 0;
  const pending = new Map();
  ws.onmessage = (message) => {
    const data = JSON.parse(message.data);
    if (data.id && pending.has(data.id)) { pending.get(data.id)(data.result ?? {}); pending.delete(data.id); }
  };
  const send = (method, params = {}) => new Promise((resolve) => { pending.set(++id, resolve); ws.send(JSON.stringify({ id, method, params })); });
  const run = (expression) => send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  /** Waits until the app has painted real content (the first bundle can take a while). */
  const ready = async (selector) => {
    for (let i = 0; i < 80; i += 1) {
      const probe = await run(selector ? `!!document.querySelector(${JSON.stringify(selector)})` : `document.body && document.body.innerText.trim().length > 40`);
      if (probe.result?.value === true) break;
      await sleep(500);
    }
    await sleep(1800);
  };
  const png = async (file) => {
    const shot = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(file, Buffer.from(shot.data, "base64"));
  };

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }] });
  await send("Page.addScriptToEvaluateOnNewDocument", { source: `try{localStorage.setItem("scriptune.onboarded","1")}catch{};document.addEventListener("DOMContentLoaded",()=>{const s=document.createElement("style");s.textContent=${JSON.stringify(SYSTEM_FONT_CSS)};document.head.appendChild(s);});` });

  // ---- 1. Raw captures of the running app ----
  for (const [deviceName, device] of Object.entries(DEVICES)) {
    await send("Emulation.setDeviceMetricsOverride", { width: device.width, height: device.height, deviceScaleFactor: device.scale, mobile: true });
    await send("Page.navigate", { url: `${BASE}/` });
    await ready();
    for (const shot of SHOTS) {
      await send("Page.navigate", { url: `${BASE}${shot.path}` });
      await ready(shot.type ? `[placeholder=${JSON.stringify(shot.type.placeholder)}]` : undefined);
      await sleep(2500); // data
      if (shot.clickText) {
        await run(`[...document.querySelectorAll('[role="tab"],[role="button"],button')].find((el)=>el.textContent.trim().startsWith(${JSON.stringify(shot.clickText)}))?.click()`);
        await sleep(4000);
      }
      if (shot.type) {
        await run(`document.querySelector('[placeholder=${JSON.stringify(shot.type.placeholder)}]')?.focus()`);
        await send("Input.insertText", { text: shot.type.text });
        await sleep(300);
        if (shot.type.enter) {
          for (const type of ["keyDown", "keyUp"]) await send("Input.dispatchKeyEvent", { type, key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, text: type === "keyDown" ? "\r" : undefined });
        }
        if (shot.type.click) await run(`[...document.querySelectorAll('[role="button"]')].find((el)=>el.textContent.includes(${JSON.stringify(shot.type.click)}))?.click()`);
        await sleep(5000);
        await run(`document.activeElement?.blur()`);
      }
      if (shot.scrollTo) {
        // Bring the results up so the answer, not the form, is what the frame shows.
        await run(`(()=>{const el=[...document.querySelectorAll('div')].find((d)=>d.scrollHeight>d.clientHeight+40&&/(auto|scroll)/.test(getComputedStyle(d).overflowY));if(el)el.scrollTop=Math.round(el.clientHeight*0.42);})()`);
        await sleep(800);
      }
      await png(join(out, "raw", `${deviceName}-${shot.id}.png`));
      console.log("captured", deviceName, shot.id);
    }
  }

  // ---- 2. Listing frames: caption above, capture below, on the app's paper ----
  const frameId = (await send("Page.getFrameTree")).frameTree.frame.id;
  const compose = async (width, height, html, file) => {
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
    await send("Page.navigate", { url: "about:blank" });
    await send("Page.setDocumentContent", { frameId, html });
    await sleep(900);
    await png(file);
  };
  const fonts = `@font-face{font-family:"DM Serif";src:url(data:font/ttf;base64,${serif});}@font-face{font-family:"Geist";src:url(data:font/woff2;base64,${sans}) format("woff2");font-weight:100 900;}`;
  for (const [name, frame] of Object.entries(FRAMES)) {
    for (const shot of SHOTS) {
      const raw = readFileSync(join(out, "raw", `${frame.device}-${shot.id}.png`)).toString("base64");
      const device = DEVICES[frame.device];
      const shotHeight = frame.height - frame.top - frame.bottom;
      frame.shotWidth = Math.round(shotHeight * device.width / device.height);
      const radius = Math.round(frame.shotWidth * 0.07);
      const html = `<!doctype html><html><head><style>${fonts}
        html,body{margin:0;width:${frame.width}px;height:${frame.height}px;overflow:hidden;background:#f6f2e9;}
        .copy{position:absolute;left:${frame.pad}px;right:${frame.pad}px;top:${Math.round(frame.pad * 1.3)}px;text-align:center;}
        .eyebrow{font:600 ${frame.eyebrow}px/1 "Geist",sans-serif;letter-spacing:.22em;text-transform:uppercase;color:#a8883a;}
        .headline{margin-top:${Math.round(frame.eyebrow * 0.9)}px;font:400 ${frame.headline}px/1.08 "DM Serif",serif;color:#26231f;text-wrap:balance;}
        .shot{position:absolute;left:${Math.round((frame.width - frame.shotWidth) / 2)}px;top:${frame.top}px;width:${frame.shotWidth}px;border-radius:${radius}px;border:${Math.max(3, Math.round(frame.shotWidth / 220))}px solid #26231f;box-shadow:0 ${Math.round(frame.shotWidth / 18)}px ${Math.round(frame.shotWidth / 7)}px rgba(38,35,31,.22);overflow:hidden;background:#f6f2e9;}
        .shot img{display:block;width:100%;}
      </style></head><body><div class="copy"><div class="eyebrow">${shot.eyebrow}</div><div class="headline">${shot.caption}</div></div><div class="shot"><img src="data:image/png;base64,${raw}"></div></body></html>`;
      await compose(frame.width, frame.height, html, join(out, name, `${shot.id}.png`));
      console.log("composed", name, shot.id);
    }
  }

  // ---- 3. Play Store feature graphic, 1024 x 500 ----
  const icon = readFileSync(join(root, "mobile/assets/images/icon.png")).toString("base64");
  await compose(1024, 500, `<!doctype html><html><head><style>${fonts}
    html,body{margin:0;width:1024px;height:500px;overflow:hidden;background:#26231f;}
    .wrap{position:absolute;inset:0;display:flex;align-items:center;gap:56px;padding:0 88px;}
    img{width:200px;height:200px;border-radius:46px;}
    .name{font:400 92px/1 "DM Serif",serif;color:#f6f2e9;}.name b{color:#c2a24f;font-weight:400;}
    .line{margin-top:20px;font:400 30px/1.35 "Geist",sans-serif;color:#d9d2c3;max-width:560px;}
  </style></head><body><div class="wrap"><img src="data:image/png;base64,${icon}"><div><div class="name">Scriptune<b>.</b></div><div class="line">Hear a hymn or a Bible verse and find out what it is.</div></div></div></body></html>`, join(out, "play-store-feature-graphic.png"));
  console.log("composed feature graphic");
  ws.close();
} finally {
  chrome.kill();
  await sleep(500);
  rmSync(profile, { recursive: true, force: true });
}
