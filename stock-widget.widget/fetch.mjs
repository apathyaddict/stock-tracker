#!/usr/bin/env node
// Fetches live quotes + cached daily series and emits one JSON blob to stdout.
// Übersicht runs this on its refresh interval; render() parses the output.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function loadDotenv() {
  try {
    const text = await fs.readFile(path.join(__dirname, ".env"), "utf8");
    for (const raw of text.split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
    }
  } catch {
    /* no .env, rely on shell env */
  }
}

await loadDotenv();

const FINNHUB = process.env.FINNHUB_API_KEY;
const ALPHA = process.env.ALPHA_VANTAGE_API_KEY;

function emit(obj) {
  process.stdout.write(JSON.stringify(obj));
}

function bail(message) {
  emit({ error: message });
  process.exit(0);
}

if (!FINNHUB) bail("FINNHUB_API_KEY missing. Copy .env.example to .env.");

let positions;
try {
  const text = await fs.readFile(
    path.join(__dirname, "positions.json"),
    "utf8",
  );
  positions = JSON.parse(text);
} catch (e) {
  bail("positions.json missing or invalid. Copy positions.example.json.");
}

if (!Array.isArray(positions) || positions.length === 0) {
  bail("positions.json is empty.");
}

async function getQuote(symbol) {
  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB}`;
  const r = await fetch(url);
  if (!r.ok) return null;
  const d = await r.json();
  if (typeof d.c !== "number" || d.c === 0) return null;
  return {
    price: d.c,
    prevClose: d.pc,
    change: d.d,
    changePct: d.dp,
  };
}

async function getDaily(symbol) {
  const cacheDir = path.join(__dirname, "cache");
  await fs.mkdir(cacheDir, { recursive: true });
  const file = path.join(cacheDir, `${symbol}.json`);

  try {
    const stat = await fs.stat(file);
    const ageHours = (Date.now() - stat.mtimeMs) / 3_600_000;
    if (ageHours < 12) {
      return JSON.parse(await fs.readFile(file, "utf8"));
    }
  } catch {
    /* miss */
  }

  if (!ALPHA) return null;

  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(symbol)}&apikey=${ALPHA}&outputsize=full`;
  const r = await fetch(url);
  const d = await r.json();
  if (d.Note || d["Error Message"]) {
    // rate limit / bad symbol — keep whatever stale cache exists
    try {
      return JSON.parse(await fs.readFile(file, "utf8"));
    } catch {
      return null;
    }
  }
  const ts = d["Time Series (Daily)"];
  if (!ts) return null;
  const series = Object.entries(ts)
    .map(([date, v]) => ({ date, close: parseFloat(v["4. close"]) }))
    .sort((a, b) => a.date.localeCompare(b.date));
  await fs.writeFile(file, JSON.stringify(series));
  return series;
}

const todayISO = new Date().toISOString().slice(0, 10);
const sixMonthsAgo = new Date(Date.now() - 180 * 86_400_000)
  .toISOString()
  .slice(0, 10);

const enriched = await Promise.all(
  positions.map(async (p) => {
    const [quote, daily] = await Promise.all([
      getQuote(p.symbol).catch(() => null),
      getDaily(p.symbol).catch(() => null),
    ]);

    const currentPrice = quote?.price ?? p.buyPrice;
    const cost = p.qty * p.buyPrice;
    const value = p.qty * currentPrice;
    const pl = value - cost;
    const plPct = cost > 0 ? (pl / cost) * 100 : 0;
    const dayChange = quote ? (currentPrice - quote.prevClose) * p.qty : 0;
    const dayChangePct = quote?.changePct ?? 0;

    let series = [];
    if (daily && daily.length) {
      const start = p.buyDate > sixMonthsAgo ? p.buyDate : sixMonthsAgo;
      series = daily
        .filter((d) => d.date >= start)
        .map((d) => ({
          date: d.date,
          pl: (d.close - p.buyPrice) * p.qty,
        }));
      if (
        quote &&
        (series.length === 0 ||
          series[series.length - 1].date !== todayISO)
      ) {
        series.push({ date: todayISO, pl });
      }
    }

    return {
      symbol: p.symbol,
      qty: p.qty,
      buyPrice: p.buyPrice,
      buyDate: p.buyDate,
      currentPrice,
      cost,
      value,
      pl,
      plPct,
      dayChange,
      dayChangePct,
      series,
      stale: !quote,
    };
  }),
);

const totalCost = enriched.reduce((s, p) => s + p.cost, 0);
const totalValue = enriched.reduce((s, p) => s + p.value, 0);
const totalPL = totalValue - totalCost;
const totalPLPct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;
const totalDayChange = enriched.reduce((s, p) => s + p.dayChange, 0);
const yesterdayValue = totalValue - totalDayChange;
const totalDayChangePct =
  yesterdayValue > 0 ? (totalDayChange / yesterdayValue) * 100 : 0;

emit({
  asOf: new Date().toISOString(),
  totals: {
    totalCost,
    totalValue,
    totalPL,
    totalPLPct,
    totalDayChange,
    totalDayChangePct,
  },
  positions: enriched,
});
