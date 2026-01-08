export interface Transaction {
  id: string;
  symbol: string;
  quantity: number;
  buyPrice?: number;
  sellPrice?: number;
  buyDate?: Date;
  sellDate?: Date;
  userId: string;
}

export interface Holding {
  symbol: string;
  totalQuantity: number;
  avgPrice: number;
  totalValue: number;
  lastTransaction: Date;
  status: "Open" | "Closed";
  sellPrice?: number;
  buyDate?: Date;
  sellDate?: Date;
  profitLoss?: number;
}

/**
 * Calculates holdings from a list of transactions
 * Groups transactions by symbol and computes portfolio metrics
 */
export function calculateHoldings(transactions: Transaction[]): Holding[] {
  const holdingsMap = new Map<string, Holding>();

  // Group transactions by symbol first
  const transactionsBySymbol = new Map<string, Transaction[]>();
  for (const transaction of transactions) {
    const symbol = transaction.symbol;
    if (!transactionsBySymbol.has(symbol)) {
      transactionsBySymbol.set(symbol, []);
    }
    transactionsBySymbol.get(symbol)!.push(transaction);
  }

  // Process each symbol
  for (const [symbol, symbolTransactions] of transactionsBySymbol) {
    // Sort transactions by date for this symbol
    symbolTransactions.sort((a, b) => {
      // Use buyDate for buys, sellDate for sells
      const aDate = a.buyDate ?? a.sellDate;
      const bDate = b.buyDate ?? b.sellDate;
      return (aDate?.getTime?.() ?? 0) - (bDate?.getTime?.() ?? 0);
    });

    const calculation = processSymbolTransactions(symbolTransactions);

    holdingsMap.set(symbol, {
      symbol,
      totalQuantity: Math.abs(calculation.totalQuantity),
      avgPrice: Number(calculation.avgPrice.toFixed(2)),
      totalValue: Number(Math.abs(calculation.totalValue).toFixed(2)),
      lastTransaction:
        symbolTransactions[symbolTransactions.length - 1].buyDate ??
        symbolTransactions[symbolTransactions.length - 1].sellDate ??
        new Date(),
      status: calculation.status,
      sellPrice: calculation.sellPrice ? Number(calculation.sellPrice.toFixed(2)) : undefined,
      buyDate: calculation.buyDate,
      sellDate: calculation.sellDate,
      profitLoss: calculation.profitLoss,
    });
  }

  return Array.from(holdingsMap.values()).sort(
    (a, b) => b.lastTransaction.getTime() - a.lastTransaction.getTime()
  );
}

/**
 * Processes transactions for a single symbol to calculate holding metrics
 */
function processSymbolTransactions(symbolTransactions: Transaction[]) {
  let totalQuantity = 0;
  let totalValue = 0;
  let buyDate: Date | undefined;
  let sellDate: Date | undefined;
  let sellPrice: number | undefined;

  for (const transaction of symbolTransactions) {
    const quantity = transaction.quantity;
    // Use buyPrice for buys, sellPrice for sells, always convert to number
    const price = Number(transaction.buyPrice ?? transaction.sellPrice ?? 0);

    // Track buy date (first positive transaction)
    if (quantity > 0 && !buyDate) {
      buyDate = transaction.buyDate;
    }

    // Track sell date and price (when selling)
    if (quantity < 0 && !sellDate) {
      if (transaction.sellDate) {
        sellDate = transaction.sellDate;
      }
      sellPrice = price;
    }

    // Only add buy transactions to total value for average price calculation
    if (quantity > 0) {
      totalValue += quantity * price;
    }

    totalQuantity += quantity;
  }

  const totalBoughtQuantity = symbolTransactions.reduce(
    (sum, t) => sum + (t.quantity > 0 ? t.quantity : 0),
    0
  );

  const avgPrice = totalBoughtQuantity > 0
    ? Number((totalValue / totalBoughtQuantity).toFixed(2))
    : 0;

  const status: "Open" | "Closed" = totalQuantity === 0 ? "Closed" : "Open";

  const profitLoss = status === "Closed" && sellPrice
    ? Number(((sellPrice - avgPrice) * totalBoughtQuantity).toFixed(2))
    : undefined;

  return {
    totalQuantity,
    totalValue,
    buyDate,
    sellDate,
    sellPrice,
    avgPrice,
    status,
    profitLoss,
  };
}