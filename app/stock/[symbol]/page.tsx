import { StockDetailChart } from "@/components/StockDetailChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { getStockQuote, searchStocks } from "@/lib/stock-api";
import { ArrowLeft, TrendingDown, TrendingUp } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "../../../auth";

interface PageProps {
  params: Promise<{
    symbol: string;
  }>;
}

export default async function StockDetailPage({ params }: PageProps) {
  const { symbol } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get stock name
  let stockName = symbol;
  try {
    const searchResults = await searchStocks(symbol);
    const match = searchResults.find((r) => r.symbol === symbol.toUpperCase());
    if (match) {
      stockName = match.name;
    }
  } catch (error) {
    console.error("Error fetching stock name:", error);
  }

  // Get current quote
  let currentQuote = null;
  try {
    currentQuote = await getStockQuote(symbol);
  } catch (error) {
    console.error("Error fetching quote:", error);
  }

  // Get user's transactions for this symbol
  const transactions = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
      symbol: symbol.toUpperCase(),
    },
    orderBy: [{ buyDate: "desc" }, { sellDate: "desc" }],
  });

  // Calculate position summary
  let totalQuantity = 0;
  let totalInvested = 0;
  let avgBuyPrice = 0;
  let realizedPL = 0;

  transactions.forEach((t) => {
    if (t.quantity > 0) {
      // Buy
      totalQuantity += t.quantity;
      totalInvested += t.quantity * Number(t.buyPrice);
    } else {
      // Sell
      const sellQuantity = Math.abs(t.quantity);
      const sellValue = sellQuantity * Number(t.sellPrice || 0);
      const costBasis = sellQuantity * avgBuyPrice;
      realizedPL += sellValue - costBasis;
      totalQuantity += t.quantity; // quantity is negative
    }

    if (totalQuantity > 0 && totalInvested > 0) {
      avgBuyPrice = totalInvested / totalQuantity;
    }
  });

  const currentPrice = currentQuote ? parseFloat(currentQuote.price) : null;
  const unrealizedPL = currentPrice && totalQuantity > 0 ? (currentPrice - avgBuyPrice) * totalQuantity : 0;
  const unrealizedPLPercent = avgBuyPrice > 0 ? (unrealizedPL / (avgBuyPrice * totalQuantity)) * 100 : 0;

  const totalPL = realizedPL + unrealizedPL;
  const hasPosition = totalQuantity > 0 || realizedPL !== 0;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full max-w-7xl mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold">{symbol.toUpperCase()}</h1>
            <p className="text-muted-foreground text-lg mt-1">{stockName}</p>
          </div>
        </div>

        {/* Current Quote Card */}
        {currentQuote && (
          <Card>
            <CardHeader>
              <CardTitle>Current Quote</CardTitle>
              <CardDescription>Real-time price information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="text-3xl font-bold">${parseFloat(currentQuote.price).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Change</p>
                  <div className="flex items-center gap-1">
                    {parseFloat(currentQuote.change) >= 0 ? (
                      <TrendingUp className="h-5 w-5 text-primary" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-destructive" />
                    )}
                    <p
                      className={`text-2xl font-bold ${
                        parseFloat(currentQuote.change) >= 0 ? "text-primary" : "text-destructive"
                      }`}
                    >
                      ${parseFloat(currentQuote.change).toFixed(2)} (
                      {parseFloat(currentQuote.changePercent).toFixed(2)}%)
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Day High</p>
                  <p className="text-2xl font-bold">${parseFloat(currentQuote.high).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Day Low</p>
                  <p className="text-2xl font-bold">${parseFloat(currentQuote.low).toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Your Position Card */}
        {hasPosition && (
          <Card>
            <CardHeader>
              <CardTitle>Your Position</CardTitle>
              <CardDescription>Your holdings and performance for this stock</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {totalQuantity > 0 && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Shares Owned</p>
                      <p className="text-2xl font-bold">{totalQuantity}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Buy Price</p>
                      <p className="text-2xl font-bold">${avgBuyPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Unrealized P&L</p>
                      <div className="flex items-center gap-1">
                        {unrealizedPL >= 0 ? (
                          <TrendingUp className="h-5 w-5 text-primary" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-destructive" />
                        )}
                        <p className={`text-2xl font-bold ${unrealizedPL >= 0 ? "text-primary" : "text-destructive"}`}>
                          ${Math.abs(unrealizedPL).toFixed(2)}
                        </p>
                      </div>
                      <p className={`text-sm ${unrealizedPL >= 0 ? "text-primary" : "text-destructive"}`}>
                        {unrealizedPL >= 0 ? "+" : ""}{unrealizedPLPercent.toFixed(2)}%
                      </p>
                    </div>
                  </>
                )}
                {realizedPL !== 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Realized P&L</p>
                    <div className="flex items-center gap-1">
                      {realizedPL >= 0 ? (
                        <TrendingUp className="h-5 w-5 text-primary" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-destructive" />
                      )}
                      <p className={`text-2xl font-bold ${realizedPL >= 0 ? "text-primary" : "text-destructive"}`}>
                        ${Math.abs(realizedPL).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Price Chart */}
        <StockDetailChart symbol={symbol.toUpperCase()} name={stockName} />

        {/* Transaction History */}
        {transactions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Your buy and sell transactions for this stock</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          transaction.type === "BUY"
                            ? "bg-primary/10 text-primary"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {transaction.type}
                      </div>
                      <div>
                        <p className="font-medium">{Math.abs(transaction.quantity)} shares</p>
                        <p className="text-sm text-muted-foreground">
                          {(transaction.buyDate || transaction.sellDate)?.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        ${Number(transaction.buyPrice || transaction.sellPrice || 0).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">per share</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
