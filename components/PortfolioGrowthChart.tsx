"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface Transaction {
  id: number;
  symbol: string;
  quantity: number;
  buyPrice: string | number;
  buyDate: Date | null;
  sellPrice: string | number | null;
  sellDate: Date | null;
  type: string;
}

interface PortfolioGrowthChartProps {
  transactions: Transaction[];
  currentPrices: Record<string, number>;
}

interface ChartDataPoint {
  date: string;
  portfolioValue: number;
  totalInvested: number;
  profitLoss: number;
  profitLossPercent: number;
}

export function PortfolioGrowthChart({
  transactions,
  currentPrices,
}: PortfolioGrowthChartProps) {
  const chartData = useMemo(() => {
    if (!transactions.length) return [];

    // Sort all transactions by date
    const sortedTransactions = [...transactions].sort((a, b) => {
      const aDate = a.buyDate || a.sellDate || new Date(0);
      const bDate = b.buyDate || b.sellDate || new Date(0);
      return aDate.getTime() - bDate.getTime();
    });

    // Track holdings over time
    const dataPoints: ChartDataPoint[] = [];
    const holdings = new Map<
      string,
      { quantity: number; avgPrice: number; totalInvested: number }
    >();
    let totalInvested = 0;
    let totalRealized = 0;

    sortedTransactions.forEach((transaction) => {
      const date = transaction.buyDate || transaction.sellDate;
      if (!date) return;

      const symbol = transaction.symbol;
      const quantity = transaction.quantity;
      const price = Number(transaction.buyPrice || transaction.sellPrice || 0);

      // Update holdings
      const holding = holdings.get(symbol) || {
        quantity: 0,
        avgPrice: 0,
        totalInvested: 0,
      };

      if (quantity > 0) {
        // Buy transaction
        const newTotalInvested = holding.totalInvested + quantity * price;
        const newQuantity = holding.quantity + quantity;
        const newAvgPrice =
          newQuantity > 0 ? newTotalInvested / newQuantity : 0;

        holdings.set(symbol, {
          quantity: newQuantity,
          avgPrice: newAvgPrice,
          totalInvested: newTotalInvested,
        });
        totalInvested += quantity * price;
      } else {
        // Sell transaction
        const sellQuantity = Math.abs(quantity);
        const sellValue = sellQuantity * price;
        const costBasis = sellQuantity * holding.avgPrice;
        const realized = sellValue - costBasis;

        totalRealized += realized;

        const newQuantity = holding.quantity + quantity; // quantity is negative
        const newTotalInvested =
          newQuantity > 0 ? holding.avgPrice * newQuantity : 0;

        if (newQuantity > 0) {
          holdings.set(symbol, {
            quantity: newQuantity,
            avgPrice: holding.avgPrice,
            totalInvested: newTotalInvested,
          });
        } else {
          holdings.delete(symbol);
        }

        // Reduce total invested by the cost basis of sold shares
        totalInvested -= costBasis;
      }

      // Calculate current portfolio value
      let portfolioValue = totalRealized;
      let currentInvestedInHoldings = 0;

      holdings.forEach((holding, sym) => {
        const currentPrice = currentPrices[sym] || holding.avgPrice;
        portfolioValue += holding.quantity * currentPrice;
        currentInvestedInHoldings += holding.totalInvested;
      });

      const profitLoss = portfolioValue - totalInvested;
      const profitLossPercent =
        totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

      dataPoints.push({
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        portfolioValue: Number(portfolioValue.toFixed(2)),
        totalInvested: Number(totalInvested.toFixed(2)),
        profitLoss: Number(profitLoss.toFixed(2)),
        profitLossPercent: Number(profitLossPercent.toFixed(2)),
      });
    });

    // If we have data, ensure we show the latest state
    if (dataPoints.length > 0) {
      const lastPoint = dataPoints[dataPoints.length - 1];

      // Recalculate final portfolio value with current prices
      let finalPortfolioValue = totalRealized;
      holdings.forEach((holding, sym) => {
        const currentPrice = currentPrices[sym] || holding.avgPrice;
        finalPortfolioValue += holding.quantity * currentPrice;
      });

      const finalProfitLoss = finalPortfolioValue - totalInvested;
      const finalProfitLossPercent =
        totalInvested > 0 ? (finalProfitLoss / totalInvested) * 100 : 0;

      dataPoints[dataPoints.length - 1] = {
        ...lastPoint,
        portfolioValue: Number(finalPortfolioValue.toFixed(2)),
        profitLoss: Number(finalProfitLoss.toFixed(2)),
        profitLossPercent: Number(finalProfitLossPercent.toFixed(2)),
      };
    }

    return dataPoints;
  }, [transactions, currentPrices]);

  if (chartData.length === 0) {
    return null;
  }

  const latestData = chartData[chartData.length - 1];
  const isPositive = latestData.profitLoss >= 0;

  const chartConfig = {
    portfolioValue: {
      label: "Portfolio Value",
      color: "hsl(var(--chart-1))",
    },
    totalInvested: {
      label: "Total Invested",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          <h2 className="card-title-main">Portfolio Performance</h2>
        </CardTitle>
        <CardDescription>
          Track your portfolio value and returns over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Portfolio Value</p>
              <p className="text-2xl font-bold">
                $
                {latestData.portfolioValue.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Invested</p>
              <p className="text-2xl font-bold">
                $
                {latestData.totalInvested.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Return</p>
              <p
                className={`text-2xl font-bold ${isPositive ? "text-primary" : "text-destructive"}`}>
                {isPositive ? "+" : ""}$
                {latestData.profitLoss.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Return %</p>
              <p
                className={`text-2xl font-bold ${isPositive ? "text-primary" : "text-destructive"}`}>
                {isPositive ? "+" : ""}
                {latestData.profitLossPercent.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Chart */}
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--chart-2))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--chart-2))"
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--chart-1))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--chart-1))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value: any) =>
                      `$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                    }
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="totalInvested"
                stroke="hsl(var(--chart-2))"
                fill="url(#colorInvested)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="portfolioValue"
                stroke="hsl(var(--chart-1))"
                fill="url(#colorValue)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
