# Stock Widget

A macOS desktop widget that shows your portfolio P/L in real time. Apple-Stocks
look, but the chart Y-axis is **your dollars made/lost since you bought** — not
the stock price.

## What it shows

- **Total portfolio value** (live).
- **Today's $ and % change** across the whole portfolio.
- **Invested** (cost basis) and **all-time P/L** ($ and %).
- Per position: shares, your buy price, P/L $, P/L %, and a 1W / 1M / 3M / 6M
  sparkline of your gain over time.
- Click the range tabs (1W · 1M · 3M · 6M) to switch the chart window.

Refreshes every 60 seconds.

## Install

1. **Install Übersicht** — <https://tracesof.net/uebersicht/> (free, native macOS app).
2. **Get API keys:**
   - [Finnhub](https://finnhub.io/register) — required, free, 60 req/min.
   - [Alpha Vantage](https://www.alphavantage.co/support/#api-key) — required
     for the sparkline (historical daily series), free.
3. **Configure this folder:**
   ```bash
   cd stock-widget.widget
   cp .env.example .env             # then fill in your two keys
   cp positions.example.json positions.json   # then edit with your positions
   ```
4. **Symlink into Übersicht's widgets folder** (so edits here show up live):
   ```bash
   ln -s "$(pwd)" "$HOME/Library/Application Support/Übersicht/widgets/stock-widget.widget"
   ```
5. Open Übersicht. The widget appears in the top-right of your desktop.

## Editing positions

Open `positions.json` in any editor and add/remove entries:

```json
[
  { "symbol": "AAPL", "qty": 10, "buyPrice": 175.50, "buyDate": "2025-08-12" }
]
```

- `symbol` — uppercase ticker.
- `qty` — number of shares.
- `buyPrice` — your average buy price per share.
- `buyDate` — `YYYY-MM-DD`; the sparkline starts here (or 6 months ago,
  whichever is more recent).

Save the file. The widget will pick it up on the next refresh (≤ 60 s),
or right-click the widget in Übersicht → Refresh.

## Files

- `index.jsx` — the widget (UI, state, sparkline).
- `fetch.mjs` — Node script that fetches quotes + historical data and emits
  JSON. Übersicht runs this on each refresh.
- `positions.json` — your positions (git-ignored).
- `.env` — your API keys (git-ignored).
- `cache/` — daily-series cache, refreshed every 12 h (git-ignored).

## Notes

- Historical daily closes are cached on disk for 12 hours per symbol, so
  Alpha Vantage's 25/day free quota easily covers ~10 positions.
- Live quotes use Finnhub (60/min) — comfortably under the cap even with
  the 60 s refresh.
- The widget shows the cost-basis fallback if Finnhub is unreachable.
