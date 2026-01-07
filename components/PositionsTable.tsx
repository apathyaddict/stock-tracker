"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

interface Holding {
  symbol: string;
  totalQuantity: number;
  avgPrice: number;
  totalValue: number;
  lastTransaction: Date;
  status: 'Open' | 'Closed';
  sellPrice?: number;
  buyDate?: Date;
  sellDate?: Date;
  profitLoss?: number;
}

interface PositionsTableProps {
  holdings: Holding[];
  addTransaction: (formData: FormData) => Promise<void>;
}

export function PositionsTable({ holdings, addTransaction }: PositionsTableProps) {
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);
  const [sellPrice, setSellPrice] = useState("");
  const [sellQuantity, setSellQuantity] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  return (
    <>
      {holdings.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No stock positions yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Start building your portfolio by adding your first stock transaction above.
            Track your buys and sells to monitor your investment performance.
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
              <TableHead>Sell Price</TableHead>
              <TableHead>Sell Date</TableHead>
              <TableHead>P&L</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holdings.map((holding) => (
              <TableRow key={holding.symbol} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">{holding.symbol}</TableCell>
                <TableCell>${holding.avgPrice.toFixed(2)}</TableCell>
                <TableCell>
                  {holding.buyDate ? holding.buyDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : '-'}
                </TableCell>
                <TableCell>{holding.totalQuantity}</TableCell>
                <TableCell>{holding.sellPrice ? `$${holding.sellPrice.toFixed(2)}` : '-'}</TableCell>
                <TableCell>
                  {holding.sellDate ? holding.sellDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : '-'}
                </TableCell>
                <TableCell>
                  {holding.profitLoss !== undefined ? (
                    <div className="flex items-center gap-1">
                      {holding.profitLoss >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-primary" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      )}
                      <span className={holding.profitLoss >= 0 ? 'text-primary' : 'text-destructive'}>
                        ${Math.abs(holding.profitLoss).toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={holding.status === 'Open' ? 'default' : 'secondary'}>
                    {holding.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {holding.status === 'Open' && holding.totalQuantity > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openSellDialog(holding)}
                    >
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
                    Total Sale Value: ${(parseFloat(sellPrice) * parseFloat(sellQuantity)).toFixed(2)}
                  </div>
                )}

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
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