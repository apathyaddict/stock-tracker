// Übersicht widget — desktop stock tracker.
// Lives at ~/Library/Application Support/Übersicht/widgets/stock-widget.widget
// (symlink the repo folder there).

export const command = "node fetch.mjs";
export const refreshFrequency = 60_000;

const RANGES = { "1W": 7, "1M": 30, "3M": 90, "6M": 180 };

export const initialState = { range: "1M" };

export const updateState = (event, prev) => {
  if (event.type === "SET_RANGE") return { ...prev, range: event.range };
  return prev;
};

export const className = `
  position: absolute;
  top: 40px;
  right: 40px;
  width: 380px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif;
  -webkit-font-smoothing: antialiased;
  color: #f2f2f7;
  background: rgba(20, 20, 25, 0.78);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  border-radius: 18px;
  padding: 18px 18px 14px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35), inset 0 0 0 0.5px rgba(255,255,255,0.08);

  .err {
    color: #ff453a;
    font-size: 13px;
    padding: 8px 4px;
  }

  .totalValue {
    font-size: 32px;
    font-weight: 600;
    letter-spacing: -0.5px;
    line-height: 1;
  }

  .dayLine {
    margin-top: 4px;
    font-size: 13px;
    font-weight: 500;
  }

  .metaRow {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
    font-size: 11px;
    color: rgba(235, 235, 245, 0.55);
    text-transform: uppercase;
    letter-spacing: 0.6px;
  }

  .metaRow .vals {
    display: flex;
    justify-content: space-between;
    margin-top: 2px;
    font-size: 13px;
    color: #f2f2f7;
    text-transform: none;
    letter-spacing: 0;
    font-weight: 500;
  }

  .metaBlock { display: flex; flex-direction: column; }
  .metaBlock.right { text-align: right; align-items: flex-end; }

  .ranges {
    display: flex;
    justify-content: space-around;
    margin: 14px -4px 10px;
    background: rgba(118, 118, 128, 0.18);
    border-radius: 8px;
    padding: 3px;
  }
  .ranges span {
    flex: 1;
    text-align: center;
    padding: 5px 0;
    font-size: 12px;
    font-weight: 500;
    color: rgba(235, 235, 245, 0.6);
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .ranges span.active {
    background: rgba(99, 99, 102, 0.7);
    color: #fff;
  }

  .positions { display: flex; flex-direction: column; }
  .position {
    display: grid;
    grid-template-columns: 80px 1fr 90px;
    align-items: center;
    gap: 8px;
    padding: 10px 0;
    border-top: 0.5px solid rgba(255, 255, 255, 0.08);
  }
  .position:first-child { border-top: none; }

  .symbol { font-size: 15px; font-weight: 600; }
  .qty { font-size: 11px; color: rgba(235, 235, 245, 0.55); margin-top: 2px; }

  .pl { font-size: 14px; font-weight: 600; text-align: right; }
  .plPct { font-size: 11px; text-align: right; margin-top: 2px; }

  .up { color: #30d158; }
  .down { color: #ff453a; }
  .flat { color: rgba(235, 235, 245, 0.55); }

  .footer {
    margin-top: 10px;
    font-size: 10px;
    color: rgba(235, 235, 245, 0.45);
    text-align: right;
    letter-spacing: 0.3px;
  }
`;

const money = (n) =>
  `$${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const signedMoney = (n) => `${n >= 0 ? "+" : "−"}${money(n)}`;

const pct = (n) =>
  `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

const cls = (n) => (n > 0 ? "up" : n < 0 ? "down" : "flat");

const Sparkline = ({ series, days, width = 110, height = 32 }) => {
  if (!series || series.length < 2) {
    return <svg width={width} height={height} />;
  }
  const sliced = series.slice(-days);
  if (sliced.length < 2) {
    return <svg width={width} height={height} />;
  }
  const vals = sliced.map((s) => s.pl);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const last = vals[vals.length - 1];
  const color = last >= 0 ? "#30d158" : "#ff453a";
  const points = sliced
    .map((s, i) => {
      const x = (i / (sliced.length - 1)) * (width - 2) + 1;
      const y = height - 2 - ((s.pl - min) / range) * (height - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  // zero baseline if it crosses
  const zeroVisible = min < 0 && max > 0;
  const zeroY = zeroVisible
    ? height - 2 - ((0 - min) / range) * (height - 4)
    : null;
  return (
    <svg width={width} height={height}>
      {zeroVisible && (
        <line
          x1="0"
          x2={width}
          y1={zeroY}
          y2={zeroY}
          stroke="rgba(255,255,255,0.12)"
          strokeDasharray="2,2"
          strokeWidth="0.5"
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const render = ({ output, error, range }, dispatch) => {
  if (error) {
    return <div className="err">Widget error: {String(error)}</div>;
  }
  if (!output) {
    return <div className="err">Loading…</div>;
  }

  let data;
  try {
    data = JSON.parse(output);
  } catch {
    return <div className="err">Bad output from fetch.mjs</div>;
  }
  if (data.error) {
    return <div className="err">{data.error}</div>;
  }

  const { positions, totals, asOf } = data;
  const days = RANGES[range] || 30;

  return (
    <div>
      <div className="totalValue">{money(totals.totalValue)}</div>
      <div className={`dayLine ${cls(totals.totalDayChange)}`}>
        {signedMoney(totals.totalDayChange)} ({pct(totals.totalDayChangePct)})
        today
      </div>

      <div className="metaRow">
        <div className="metaBlock">
          <span>Invested</span>
        </div>
        <div className="metaBlock right">
          <span>All-time</span>
        </div>
      </div>
      <div className="metaRow vals">
        <div className="metaBlock">
          <span>{money(totals.totalCost)}</span>
        </div>
        <div className="metaBlock right">
          <span className={cls(totals.totalPL)}>
            {signedMoney(totals.totalPL)} ({pct(totals.totalPLPct)})
          </span>
        </div>
      </div>

      <div className="ranges">
        {Object.keys(RANGES).map((r) => (
          <span
            key={r}
            className={r === range ? "active" : ""}
            onClick={() => dispatch({ type: "SET_RANGE", range: r })}>
            {r}
          </span>
        ))}
      </div>

      <div className="positions">
        {positions.map((p) => (
          <div className="position" key={p.symbol}>
            <div>
              <div className="symbol">{p.symbol}</div>
              <div className="qty">
                {p.qty} @ ${p.buyPrice.toFixed(2)}
              </div>
            </div>
            <Sparkline series={p.series} days={days} />
            <div>
              <div className={`pl ${cls(p.pl)}`}>{signedMoney(p.pl)}</div>
              <div className={`plPct ${cls(p.pl)}`}>{pct(p.plPct)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="footer">
        Updated{" "}
        {new Date(asOf).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })}
      </div>
    </div>
  );
};
