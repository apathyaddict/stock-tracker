"use client";

import { useQueries } from "@tanstack/react-query";
import { getStockQuote } from "@/lib/stock-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useState } from "react";

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

export function PositionsTable({
  holdings,
  addTransaction,
}: PositionsTableProps) {
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);
  const [sellPrice, setSellPrice] = useState("");
  const [sellQuantity, setSellQuantity] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  // Fetch current prices for all holdings
  const priceQueries = useQueries({
    queries: holdings.map((holding) => ({
      queryKey: ["stockQuote", holding.symbol],
      queryFn: () => getStockQuote(holding.symbol),
      staleTime: 1000 * 60 * 5, // 5 minutes
      enabled: holdings.length > 0,
    })),
  });

  // Create a map of symbol to current price
  const currentPrices = new Map<string, string>();
  priceQueries.forEach((query, index) => {
    if (query.data?.price && holdings[index]) {
      currentPrices.set(holdings[index].symbol, query.data.price);
    }
  });

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
    } catch (error) {
      console.error("Error selling position:", error);
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

  // Filter holdings by search
  const filteredHoldings = holdings.filter((h) =>
    h.symbol.toLowerCase().includes(search.toLowerCase())
  );

  // Sort holdings
  const sortedHoldings = [...filteredHoldings].sort((a, b) => {
    let compare = 0;
    if (sortField === "date") {
      compare = b.lastTransaction.getTime() - a.lastTransaction.getTime();
    } else if (sortField === "symbol") {
      compare = a.symbol.localeCompare(b.symbol);
    } else if (sortField === "price") {
      compare = b.avgPrice - a.avgPrice;
    }
    return sortOrder === "desc" ? compare : -compare;
  });

  return (
    <>
      <div className="flex flex-row justify-between items-center gap-4 mb-4">
        <Input
          placeholder="Search by symbol..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-2 items-center">
          <Label htmlFor="sort-field" className="text-sm">
            Sort by:
          </Label>
          <select
            id="sort-field"
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
            style={{ fontSize: "0.875rem" }}>
            <option value="date">Date</option>
            <option value="symbol">Symbol</option>
            <option value="price">Buy Price</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}>
            {sortOrder === "desc" ? "↓" : "↑"}
          </Button>
        </div>
      </div>
      {sortedHoldings.length === 0 ? (
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Buy Price</TableHead>
              <TableHead>Buy Date</TableHead>
              <TableHead>Shares</TableHead>
              <TableHead>Current Price</TableHead>
              <TableHead>Sell Price</TableHead>
              <TableHead>Sell Date</TableHead>
              <TableHead>Actual P&L</TableHead>
              <TableHead>Potential P&L</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedHoldings.map((holding) => (
              <TableRow
                key={holding.symbol}
                className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">{holding.symbol}</TableCell>
                <TableCell>${holding.avgPrice.toFixed(2)}</TableCell>
                <TableCell>
                  {holding.buyDate
                    ? holding.buyDate.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "-"}
                </TableCell>
                <TableCell>{holding.totalQuantity}</TableCell>
                <TableCell>
                  {currentPrices.get(holding.symbol) ? (
                    <span className="font-medium">
                      ${currentPrices.get(holding.symbol)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {holding.sellPrice ? `$${holding.sellPrice.toFixed(2)}` : "-"}
                </TableCell>
                <TableCell>
                  {holding.sellDate
                    ? holding.sellDate.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "-"}
                </TableCell>
                <TableCell>
                  {holding.profitLoss !== undefined ? (
                    <div className="flex items-center gap-1">
                      {holding.profitLoss >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-primary" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      )}
                      <span
                        className={
                          holding.profitLoss >= 0
                            ? "text-primary"
                            : "text-destructive"
                        }>
                        ${Math.abs(holding.profitLoss).toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  {(() => {
                    const currentPrice = currentPrices.get(holding.symbol);
                    if (!currentPrice || holding.status === "Closed") {
                      return "-";
                    }

                    // Calculate potential P&L for open positions
                    const currentPriceNum = parseFloat(currentPrice);
                    const potentialPL =
                      (currentPriceNum - holding.avgPrice) *
                      holding.totalQuantity;

                    return (
                      <div className="flex items-center gap-1">
                        {potentialPL >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-primary" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                        <span
                          className={
                            potentialPL >= 0
                              ? "text-primary"
                              : "text-destructive"
                          }>
                          ${Math.abs(potentialPL).toFixed(2)}
                        </span>
                      </div>
                    );
                  })()}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      holding.status === "Open" ? "default" : "secondary"
                    }>
                    {holding.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {holding.status === "Open" && holding.totalQuantity > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openSellDialog(holding)}>
                      Sell
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
