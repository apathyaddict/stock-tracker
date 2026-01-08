"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { StockSearch } from "./StockSearch";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useToast } from "./Toast";
import { getErrorMessage } from "./ErrorBoundary";

interface TransactionFormProps {
  addTransaction: (formData: FormData) => Promise<void>;
}

export function TransactionForm({ addTransaction }: TransactionFormProps) {
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [selectedStockPrice, setSelectedStockPrice] = useState<string | null>(
    null
  );
  const [total, setTotal] = useState("0.00");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const qty = parseFloat(quantity) || 0;
    const prc = parseFloat(price) || 0;
    const calculatedTotal = qty * prc;
    setTotal(calculatedTotal.toFixed(2));
  }, [quantity, price]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate required fields
    if (!symbol.trim()) {
      toast.error("Please select a stock symbol");
      return;
    }
    if (!quantity.trim()) {
      toast.error("Please enter a quantity");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      // Remove old price field, add buyPrice or sellPrice
      const type = formData.get("type");
      const price = formData.get("price");
      formData.delete("price");
      if (type === "BUY") {
        formData.append("buyPrice", price as string);
      } else if (type === "SELL") {
        formData.append("sellPrice", price as string);
      }
      await addTransaction(formData);

      // Reset form on success
      setSymbol("");
      setQuantity("");
      setPrice("");
      setSelectedStockPrice(null);
      setTotal("0.00");
      toast.success("Transaction added successfully");
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast.error("Failed to add transaction");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <input type="hidden" name="type" value="BUY" />
      <input type="hidden" name="symbol" value={symbol} />
      <div className="space-y-2">
        <Label htmlFor="symbol">Stock Symbol</Label>
        <StockSearch
          value={symbol}
          onChange={setSymbol}
          onSelect={(stock, currentPrice) => {
            setSymbol(stock.symbol);
            setSelectedStockPrice(currentPrice);
            setPrice(currentPrice || "");
          }}
          placeholder="Search for AAPL, TSLA, etc."
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="quantity">Quantity</Label>
        <Input
          id="quantity"
          name="quantity"
          type="number"
          placeholder="100"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="current-price">Current Market Price</Label>
        <div
          id="current-price"
          className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
          {selectedStockPrice && selectedStockPrice.trim() !== ""
            ? `$${parseFloat(selectedStockPrice).toFixed(2)}`
            : " N/A"}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="price">Price (Override)</Label>
        <Input
          id="price"
          name="price"
          type="number"
          step="0.01"
          placeholder={
            selectedStockPrice
              ? `Override ${selectedStockPrice}`
              : "Enter price"
          }
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2 flex flex-col justify-end">
        <div className="text-sm text-muted-foreground mb-2">
          Total: $<span>{total}</span>
        </div>
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Add Transaction
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
