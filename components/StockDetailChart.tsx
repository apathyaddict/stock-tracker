"use client";

import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { DailyAdjustedData, getDailyAdjusted } from "@/lib/stock-api";
import { RefreshCw, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface StockDetailChartProps {
  symbol: string;
  name?: string;
}

interface ChartDataPoint {
  date: string;
  price: number;
  volume: number;
}

export function StockDetailChart({ symbol, name }: StockDetailChartProps) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"1M" | "3M" | "6M" | "1Y" | "ALL">(
    "3M",
  );

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const dailyData = await getDailyAdjusted(symbol);

      if (!dailyData || dailyData.length === 0) {
        setError("No price data available for this stock");
        setData([]);
        return;
      }

      // Sort by date ascending
      const sortedData = [...dailyData].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      // Filter by time range
      const now = new Date();
      let cutoffDate = new Date();

      switch (timeRange) {
        case "1M":
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case "3M":
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case "6M":
          cutoffDate.setMonth(now.getMonth() - 6);
          break;
        case "1Y":
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
        case "ALL":
          cutoffDate = new Date(0);
          break;
      }

      const filteredData = sortedData
        .filter((d) => new Date(d.date) >= cutoffDate)
        .map((d) => ({
          date: new Date(d.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "2-digit",
          }),
          price: d.close,
          volume: d.volume,
        }));

      setData(filteredData);
    } catch (err: any) {
      console.error("Error fetching stock data:", err);
      setError(err.message || "Failed to fetch stock data");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [symbol, timeRange]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            {symbol} Price History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            {symbol} Price History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-12 text-muted-foreground">
            No data available
          </p>
        </CardContent>
      </Card>
    );
  }

  const firstPrice = data[0]?.price || 0;
  const lastPrice = data[data.length - 1]?.price || 0;
  const priceChange = lastPrice - firstPrice;
  const priceChangePercent =
    firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  const chartConfig = {
    price: {
      label: "Price",
      color: isPositive ? "hsl(var(--chart-3))" : "hsl(var(--chart-4))",
    },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              {symbol} Price History
            </CardTitle>
            <CardDescription>{name || symbol}</CardDescription>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Current Price</p>
            <p className="text-2xl font-bold">${lastPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Price Change</p>
            <p
              className={`text-2xl font-bold ${isPositive ? "text-primary" : "text-destructive"}`}>
              {isPositive ? "+" : ""}${priceChange.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Change %</p>
            <p
              className={`text-2xl font-bold ${isPositive ? "text-primary" : "text-destructive"}`}>
              {isPositive ? "+" : ""}
              {priceChangePercent.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Time Range</p>
            <p className="text-2xl font-bold">{timeRange}</p>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {(["1M", "3M", "6M", "1Y", "ALL"] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}>
              {range}
            </Button>
          ))}
        </div>

        {/* Chart */}
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={
                    isPositive ? "hsl(var(--chart-3))" : "hsl(var(--chart-4))"
                  }
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={
                    isPositive ? "hsl(var(--chart-3))" : "hsl(var(--chart-4))"
                  }
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              interval="preserveStartEnd"
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
              domain={["dataMin - 5", "dataMax + 5"]}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value: any) => `$${Number(value).toFixed(2)}`}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={
                isPositive ? "hsl(var(--chart-3))" : "hsl(var(--chart-4))"
              }
              fill="url(#colorPrice)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
