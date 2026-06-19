export interface Transaction {
  id: number | string;
  symbol: string;
  quantity: number;
  buyPrice?: number | null;
  sellPrice?: number | null;
  buyDate?: Date | null;
  sellDate?: Date | null;
  userId?: string;
}

export interface Holding {
  symbol: string;
  totalQuantity: number;
  avgPrice: number;
  costBasis: number;
  marketValue: number;
  unrealizedPL: number;
  unrealizedPLPct: number;
  realizedPL: number;
  lastTransaction: Date;
  status: "Open" | "Closed";
  firstBuyDate?: Date;
  lastSellDate?: Date;
  lastSellPrice?: number;
  currentPrice?: number;
}

interface Lot {
  qty: number;
  price: number;
  date?: Date;
}

function txDate(t: Transaction): Date {
  return t.buyDate ?? t.sellDate ?? new Date(0);
}

/**
 * FIFO accounting per symbol. Handles multiple buys, partial sells, re-entries.
 */
function processSymbol(
  txs: Transaction[],
  currentPrice?: number,
): Omit<Holding, "symbol"> {
  const sorted = [...txs].sort(
    (a, b) => txDate(a).getTime() - txDate(b).getTime(),
  );

  const lots: Lot[] = [];
  let realizedPL = 0;
  let firstBuyDate: Date | undefined;
  let lastSellDate: Date | undefined;
  let lastSellPrice: number | undefined;

  for (const t of sorted) {
    const qty = t.quantity;
    const price = Number(t.buyPrice ?? t.sellPrice ?? 0);

    if (qty > 0) {
      lots.push({ qty, price, date: t.buyDate ?? undefined });
      if (!firstBuyDate && t.buyDate) firstBuyDate = t.buyDate;
    } else if (qty < 0) {
      let toSell = -qty;
      if (t.sellDate) lastSellDate = t.sellDate;
      lastSellPrice = price;
      while (toSell > 0 && lots.length > 0) {
        const lot = lots[0];
        const take = Math.min(lot.qty, toSell);
        realizedPL += take * (price - lot.price);
        lot.qty -= take;
        toSell -= take;
        if (lot.qty === 0) lots.shift();
      }
    }
  }

  const totalQuantity = lots.reduce((s, l) => s + l.qty, 0);
  const costBasis = lots.reduce((s, l) => s + l.qty * l.price, 0);
  const avgPrice = totalQuantity > 0 ? costBasis / totalQuantity : 0;
  const marketValue =
    currentPrice != null ? currentPrice * totalQuantity : costBasis;
  const unrealizedPL = currentPrice != null ? marketValue - costBasis : 0;
  const unrealizedPLPct =
    currentPrice != null && costBasis > 0 ? (unrealizedPL / costBasis) * 100 : 0;

  const last = sorted[sorted.length - 1];
  return {
    totalQuantity,
    avgPrice: round2(avgPrice),
    costBasis: round2(costBasis),
    marketValue: round2(marketValue),
    unrealizedPL: round2(unrealizedPL),
    unrealizedPLPct: round2(unrealizedPLPct),
    realizedPL: round2(realizedPL),
    lastTransaction: txDate(last),
    status: totalQuantity > 0 ? "Open" : "Closed",
    firstBuyDate,
    lastSellDate,
    lastSellPrice: lastSellPrice != null ? round2(lastSellPrice) : undefined,
    currentPrice,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calculateHoldings(
  transactions: Transaction[],
  currentPrices: Record<string, number> = {},
): Holding[] {
  const bySymbol = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const arr = bySymbol.get(t.symbol) ?? [];
    arr.push(t);
    bySymbol.set(t.symbol, arr);
  }

  const out: Holding[] = [];
  for (const [symbol, txs] of bySymbol) {
    out.push({ symbol, ...processSymbol(txs, currentPrices[symbol]) });
  }
  return out.sort(
    (a, b) => b.lastTransaction.getTime() - a.lastTransaction.getTime(),
  );
}

export interface PortfolioSummary {
  totalMarketValue: number;
  totalCostBasis: number;
  totalUnrealizedPL: number;
  totalUnrealizedPLPct: number;
  totalRealizedPL: number;
  openCount: number;
  closedCount: number;
}

export function summarizePortfolio(holdings: Holding[]): PortfolioSummary {
  const open = holdings.filter((h) => h.status === "Open");
  const totalMarketValue = open.reduce((s, h) => s + h.marketValue, 0);
  const totalCostBasis = open.reduce((s, h) => s + h.costBasis, 0);
  const totalUnrealizedPL = open.reduce((s, h) => s + h.unrealizedPL, 0);
  const totalRealizedPL = holdings.reduce((s, h) => s + h.realizedPL, 0);
  return {
    totalMarketValue: round2(totalMarketValue),
    totalCostBasis: round2(totalCostBasis),
    totalUnrealizedPL: round2(totalUnrealizedPL),
    totalUnrealizedPLPct:
      totalCostBasis > 0
        ? round2((totalUnrealizedPL / totalCostBasis) * 100)
        : 0,
    totalRealizedPL: round2(totalRealizedPL),
    openCount: open.length,
    closedCount: holdings.filter((h) => h.status === "Closed").length,
  };
}
