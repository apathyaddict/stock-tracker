"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import { getStockQuote, StockQuote, searchStocks } from "@/lib/stock-api";
import { StockPriceOverviewSkeleton } from "./StockPriceOverviewSkeleton";

// Will accept an array of symbols and display their current price and daily change
interface StockPriceOverviewProps {
  symbols: string[];
}

type StockData = {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
  changeNum: number;
  quote: StockQuote | null;
};

export const StockPriceOverview: React.FC<StockPriceOverviewProps> = ({
  symbols,
}) => {
  const memoSymbols = useMemo(() => [...symbols], [symbols]);
  const [quotes, setQuotes] = useState<Record<string, StockQuote | null>>({});
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedSymbols, setFailedSymbols] = useState<string[]>([]);

  const fetchQuotes = async () => {
    setLoading(true);
    setError(null);
    setFailedSymbols([]);
    try {
      const results: Record<string, StockQuote | null> = {};
      const nameResults: Record<string, string> = {};
      const failures: string[] = [];
      await Promise.all(
        memoSymbols.map(async (symbol) => {
          try {
            const quote = await getStockQuote(symbol);
            results[symbol] = quote;
            // Fetch name
            const searchResults = await searchStocks(symbol);
            const name =
              searchResults.find((r) => r.symbol === symbol)?.name || symbol;
            nameResults[symbol] = name;
            if (!quote) failures.push(symbol);
          } catch {
            results[symbol] = null;
            nameResults[symbol] = symbol;
            failures.push(symbol);
          }
        })
      );
      setQuotes(results);
      setNames(nameResults);
      setFailedSymbols(failures);
    } catch (err: any) {
      setError("Failed to fetch stock prices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (memoSymbols.length > 0) {
      fetchQuotes();
    } else {
      setQuotes({});
      setNames({});
      setFailedSymbols([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoSymbols.join(",")]);

  const columns: ColumnDef<StockData>[] = [
    {
      accessorKey: "symbol",
      header: "Symbol",
      cell: ({ row }) => (
        <div className="font-semibold">{row.getValue("symbol")}</div>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => {
        const quote = row.original.quote;
        if (!quote) return <div className="text-muted-foreground">N/A</div>;
        return (
          <div className="text-lg">${parseFloat(quote.price).toFixed(2)}</div>
        );
      },
    },
    {
      accessorKey: "change",
      header: "Change",
      cell: ({ row }) => {
        const quote = row.original.quote;
        if (!quote) return <div className="text-muted-foreground">N/A</div>;
        const changeNum = parseFloat(quote.change);
        const isUp = changeNum > 0;
        const isDown = changeNum < 0;
        return (
          <div className="flex items-center gap-1">
            {isUp ? (
              <TrendingUp
                className="h-4 w-4"
                style={{ color: "var(--color-primary)" }}
              />
            ) : isDown ? (
              <TrendingDown
                className="h-4 w-4"
                style={{ color: "var(--color-destructive)" }}
              />
            ) : (
              <Minus
                className="h-4 w-4"
                style={{ color: "var(--color-muted-foreground)" }}
              />
            )}
            <span
              style={{
                color: isUp
                  ? "var(--color-primary)"
                  : isDown
                  ? "var(--color-destructive)"
                  : "var(--color-muted-foreground)",
              }}>
              {parseFloat(quote.change).toFixed(2)} (
              {parseFloat(quote.changePercent).toFixed(2)}%)
            </span>
          </div>
        );
      },
    },
  ];

  const data: StockData[] = memoSymbols.map((symbol) => {
    const quote = quotes[symbol];
    return {
      symbol,
      name: names[symbol] || symbol,
      price: quote ? quote.price : "0",
      change: quote ? quote.change : "0",
      changePercent: quote ? quote.changePercent : "0",
      changeNum: quote ? parseFloat(quote.change) : 0,
      quote,
    };
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <h3 className="card-title-main">Stock Price Overview</h3>
            </CardTitle>
            <CardDescription>
              Current price and daily change for your portfolio stocks
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchQuotes}
            disabled={loading}
            aria-label="Refresh prices">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <StockPriceOverviewSkeleton symbols={memoSymbols} />
        ) : memoSymbols.length === 0 ? (
          <p>No stocks in portfolio.</p>
        ) : (
          <>
            <DataTable columns={columns} data={data} />
          </>
        )}
        {failedSymbols.length > 0 && (
          <p className="text-muted-foreground mt-2 text-xs">
            Failed to fetch: {failedSymbols.join(", ")}
          </p>
        )}
        {error && <p className="text-destructive mt-2">{error}</p>}
      </CardContent>
    </Card>
  );
};
