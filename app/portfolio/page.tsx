import { PortfolioGrowthChart } from "@/components/PortfolioGrowthChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import {
  calculateHoldings,
  summarizePortfolio,
} from "@/lib/portfolio-calculations";
import { getStockQuote } from "@/lib/stock-api";
import { Activity, BarChart3, DollarSign } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../auth";

export default async function PortfolioPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user.id },
    orderBy: [{ buyDate: "desc" }, { sellDate: "desc" }],
  });

  const normalizedTxs = transactions.map((t) => ({
    ...t,
    buyPrice: t.buyPrice != null ? Number(t.buyPrice) : null,
    sellPrice: t.sellPrice != null ? Number(t.sellPrice) : null,
  }));

  const preHoldings = calculateHoldings(normalizedTxs);
  const allSymbols = preHoldings.map((h) => h.symbol);

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

  const holdings = calculateHoldings(normalizedTxs, currentPrices);
  const summary = summarizePortfolio(holdings);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full max-w-7xl mx-auto p-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold">Portfolio Analysis</h1>
          <p className="text-muted-foreground text-lg mt-2">
            View your portfolio performance over time
          </p>
        </div>

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
                {summary.totalMarketValue.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p
                className={`text-sm mt-1 ${summary.totalUnrealizedPL >= 0 ? "text-primary" : "text-destructive"}`}>
                {summary.totalUnrealizedPL >= 0 ? "+" : ""}
                {summary.totalUnrealizedPL.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                ({summary.totalUnrealizedPLPct >= 0 ? "+" : ""}
                {summary.totalUnrealizedPLPct.toFixed(2)}%) unrealized
              </p>
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
              <div className="text-3xl font-bold">{summary.openCount}</div>
              <p className="text-sm text-muted-foreground mt-1">
                {summary.openCount === 1 ? "stock" : "stocks"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Realized P/L
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-3xl font-bold ${summary.totalRealizedPL >= 0 ? "text-primary" : "text-destructive"}`}>
                {summary.totalRealizedPL >= 0 ? "+" : ""}$
                {Math.abs(summary.totalRealizedPL).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {transactions.length} transactions
              </p>
            </CardContent>
          </Card>
        </div>

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
