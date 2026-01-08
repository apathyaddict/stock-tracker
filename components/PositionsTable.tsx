"use client";

import { getStockQuote } from "@/lib/stock-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";

interface Holding {
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

interface PositionsTableProps {
  holdings: Holding[];
  addTransaction: (formData: FormData) => Promise<void>;
}

type PositionData = Holding & {
  currentPrice?: string;
  potentialPL?: number;
};

export function PositionsTable({
  holdings,
  addTransaction,
}: PositionsTableProps) {
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);
  const [sellPrice, setSellPrice] = useState("");
  const [sellQuantity, setSellQuantity] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [currentPrices, setCurrentPrices] = useState<Map<string, string>>(
    new Map()
  );

  // Fetch current prices for all holdings
  useEffect(() => {
    const fetchPrices = async () => {
      if (holdings.length === 0) return;

      const prices = new Map<string, string>();
      await Promise.all(
        holdings.map(async (holding) => {
          try {
            const quote = await getStockQuote(holding.symbol);
            if (quote?.price) {
              prices.set(holding.symbol, quote.price);
            }
          } catch (error) {
            console.error(
              `Failed to fetch price for ${holding.symbol}:`,
              error
            );
          }
        })
      );
      setCurrentPrices(prices);
    };

    fetchPrices();
  }, [holdings]);

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHolding) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("symbol", selectedHolding.symbol);
      formData.append("type", "SELL");
      formData.append("quantity", sellQuantity);
      formData.append("price", sellPrice);

      await addTransaction(formData);

      setIsDialogOpen(false);
      setSellPrice("");
      setSellQuantity("");
      setSelectedHolding(null);
      toast.success("Position sold successfully");
    } catch (error) {
      console.error("Error selling position:", error);
      toast.error("Failed to sell position");
    } finally {
      setIsLoading(false);
    }
  };

  const openSellDialog = (holding: Holding) => {
    setSelectedHolding(holding);
    setSellQuantity(holding.totalQuantity.toString());
    setSellPrice("");
    setIsDialogOpen(true);
  };

  const columns: ColumnDef<PositionData>[] = [
    {
      accessorKey: "symbol",
      header: "Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("symbol")}</div>
      ),
    },
    {
      accessorKey: "avgPrice",
      header: "Buy Price",
      cell: ({ row }) => (
        <div>${row.getValue<number>("avgPrice").toFixed(2)}</div>
      ),
    },
    {
      accessorKey: "buyDate",
      header: "Buy Date",
      cell: ({ row }) => {
        const date = row.getValue<Date | undefined>("buyDate");
        return date
          ? date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "-";
      },
    },
    {
      accessorKey: "totalQuantity",
      header: "Shares",
    },
    {
      id: "currentPrice",
      header: "Current Price",
      cell: ({ row }) => {
        const currentPrice = row.original.currentPrice;
        return currentPrice ? (
          <span className="font-medium">
            ${parseFloat(currentPrice).toFixed(2)}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "sellPrice",
      header: "Sell Price",
      cell: ({ row }) => {
        const sellPrice = row.getValue<number | undefined>("sellPrice");
        return sellPrice ? `$${sellPrice.toFixed(2)}` : "-";
      },
    },
    {
      accessorKey: "sellDate",
      header: "Sell Date",
      cell: ({ row }) => {
        const date = row.getValue<Date | undefined>("sellDate");
        return date
          ? date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "-";
      },
    },
    {
      accessorKey: "profitLoss",
      header: "Actual P&L",
      cell: ({ row }) => {
        const profitLoss = row.getValue<number | undefined>("profitLoss");
        if (profitLoss === undefined) return "-";
        return (
          <div className="flex items-center gap-1">
            {profitLoss >= 0 ? (
              <TrendingUp className="h-4 w-4 text-primary" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
            <span
              className={profitLoss >= 0 ? "text-primary" : "text-destructive"}>
              ${Math.abs(profitLoss).toFixed(2)}
            </span>
          </div>
        );
      },
    },
    {
      id: "potentialPL",
      header: "Potential P&L",
      cell: ({ row }) => {
        const currentPrice = row.original.currentPrice;
        if (!currentPrice || row.original.status === "Closed") {
          return "-";
        }

        const currentPriceNum = parseFloat(currentPrice);
        const potentialPL =
          (currentPriceNum - row.original.avgPrice) *
          row.original.totalQuantity;

        return (
          <div className="flex items-center gap-1">
            {potentialPL >= 0 ? (
              <TrendingUp className="h-4 w-4 text-primary" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
            <span
              className={
                potentialPL >= 0 ? "text-primary" : "text-destructive"
              }>
              ${Math.abs(potentialPL).toFixed(2)}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const isOpen = status === "Open";
        return (
          <Badge
            variant={isOpen ? "default" : "secondary"}
            className="flex items-center gap-2">
            {isOpen && (
              <div className="w-2 h-2 rounded-full bg-green-400 opacity-80" />
            )}
            {status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const holding = row.original;
        return holding.status === "Open" && holding.totalQuantity > 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => openSellDialog(holding)}>
            Sell
          </Button>
        ) : null;
      },
    },
  ];

  // Update data when currentPrices changes
  const memoizedData = useMemo(
    () =>
      holdings.map((holding) => ({
        ...holding,
        currentPrice: currentPrices.get(holding.symbol),
      })),
    [holdings, currentPrices]
  );

  return (
    <>
      {holdings.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No stock positions yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Start building your portfolio by adding your first stock transaction
            above. Track your buys and sells to monitor your investment
            performance.
          </p>
        </div>
      ) : (
        <DataTable columns={columns} data={memoizedData} />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sell {selectedHolding?.symbol}</DialogTitle>
          </DialogHeader>

          {selectedHolding && (
            <form onSubmit={handleSell} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sell-quantity">Quantity to Sell</Label>
                <Input
                  id="sell-quantity"
                  type="number"
                  value={sellQuantity}
                  onChange={(e) => setSellQuantity(e.target.value)}
                  max={selectedHolding.totalQuantity}
                  min="1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sell-price">Sell Price per Share</Label>
                <Input
                  id="sell-price"
                  type="number"
                  step="0.01"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  placeholder="Enter sell price"
                  required
                />
              </div>

              {sellPrice && sellQuantity && (
                <div className="text-sm text-muted-foreground">
                  Total Sale Value: $
                  {(parseFloat(sellPrice) * parseFloat(sellQuantity)).toFixed(
                    2
                  )}
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Selling...
                    </>
                  ) : (
                    "Sell Position"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
