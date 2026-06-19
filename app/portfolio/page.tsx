import { PortfolioGrowthChart } from "@/components/PortfolioGrowthChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { getStockQuote } from "@/lib/stock-api";
import { Activity, BarChart3, DollarSign } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../auth";

interface Holding {
  symbol: string;
  totalQuantity: number;
  avgPrice: number;
  totalValue: number;
  lastTransaction: Date;
  status: "Open" | "Closed";
  sellPrice?: number;
  buyDate: Date | null | undefined;
  sellDate: Date | null | undefined;
  profitLoss: number | undefined;
}

export default async function PortfolioPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get all transactions for the current user
  const transactions = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: [{ buyDate: "desc" }, { sellDate: "desc" }],
  });

  // Calculate current holdings by grouping transactions by symbol
  const holdingsMap = new Map<string, Holding>();

  // Group transactions by symbol first
  const transactionsBySymbol = new Map<string, typeof transactions>();
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
      const aDate = a.buyDate ?? a.sellDate;
      const bDate = b.buyDate ?? b.sellDate;
      return (aDate?.getTime?.() ?? 0) - (bDate?.getTime?.() ?? 0);
    });

    let totalQuantity = 0;
    let totalValue = 0;
    let buyDate: Date | null | undefined;
    let sellDate: Date | null | undefined;
    let sellPrice: number | undefined;

    for (const transaction of symbolTransactions) {
      const quantity = transaction.quantity;
      const price = Number(transaction.buyPrice ?? transaction.sellPrice ?? 0);

      if (quantity > 0 && !buyDate) {
        buyDate = transaction.buyDate;
      }

      if (quantity < 0 && !sellDate) {
        if (transaction.sellDate) {
          sellDate = transaction.sellDate;
        }
        sellPrice = price;
      }

      if (quantity > 0) {
        totalValue += quantity * price;
      }

      totalQuantity += quantity;
    }

    const totalBoughtQuantity = symbolTransactions.reduce(
      (sum, t) => sum + (t.quantity > 0 ? t.quantity : 0),
      0,
    );
    const avgPrice =
      totalBoughtQuantity > 0
        ? Number((totalValue / totalBoughtQuantity).toFixed(2))
        : 0;
    const status: "Open" | "Closed" = totalQuantity === 0 ? "Closed" : "Open";
    const profitLoss =
      status === "Closed" && sellPrice
        ? Number(((sellPrice - avgPrice) * totalBoughtQuantity).toFixed(2))
        : undefined;

    holdingsMap.set(symbol, {
      symbol,
      totalQuantity: Math.abs(totalQuantity),
      avgPrice: Number(avgPrice.toFixed(2)),
      totalValue: Number(Math.abs(totalValue).toFixed(2)),
      lastTransaction:
        symbolTransactions[symbolTransactions.length - 1].buyDate ??
        symbolTransactions[symbolTransactions.length - 1].sellDate ??
        new Date(),
      status,
      sellPrice: sellPrice ? Number(sellPrice.toFixed(2)) : undefined,
      buyDate,
      sellDate,
      profitLoss,
    });
  }

  const holdings = Array.from(holdingsMap.values()).sort(
    (a, b) => b.lastTransaction.getTime() - a.lastTransaction.getTime(),
  );

  const openHoldings = holdings.filter((h) => h.status === "Open");
  const totalValue = openHoldings.reduce(
    (sum, holding) => sum + holding.totalValue,
    0,
  );
  const totalHoldings = openHoldings.length;

  const allSymbols = holdings.map((h) => h.symbol);

  // Fetch current prices for portfolio chart
  const currentPrices: Record<string, number> = {};
  await Promise.all(
    allSymbols.map(async (symbol) => {
      try {
        const quote = await getStockQuote(symbol);
        if (quote?.price) {
          currentPrices[symbol] = parseFloat(quote.price);
        }
      } catch (error) {
        console.error(`Failed to fetch price for ${symbol}:`, error);
      }
    }),
  );

  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full max-w-7xl mx-auto p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold">Portfolio Analysis</h1>
          <p className="text-muted-foreground text-lg mt-2">
            View your portfolio performance over time
          </p>
        </div>

        {/* Portfolio Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Portfolio Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                $
                {totalValue.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Total Holdings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalHoldings}</div>
              <p className="text-sm text-muted-foreground mt-1">
                {totalHoldings === 1 ? "stock" : "stocks"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Total Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{transactions.length}</div>
              <p className="text-sm text-muted-foreground mt-1">
                total transactions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Growth Chart */}
        {transactions.length > 0 && (
          <PortfolioGrowthChart
            transactions={transactions.map((t) => ({
              ...t,
              buyPrice: Number(t.buyPrice),
              sellPrice: t.sellPrice ? Number(t.sellPrice) : null,
            }))}
            currentPrices={currentPrices}
          />
        )}
      </div>
    </div>
  );
}
