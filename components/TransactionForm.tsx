"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface TransactionFormProps {
  addTransaction: (formData: FormData) => Promise<void>;
}

export function TransactionForm({ addTransaction }: TransactionFormProps) {
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
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
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      await addTransaction(formData);

      // Reset form on success
      setQuantity("");
      setPrice("");
      setTotal("0.00");
    } catch (error) {
      console.error("Error adding transaction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <input type="hidden" name="type" value="BUY" />
      <div className="space-y-2">
        <Label htmlFor="symbol">Symbol</Label>
        <Input
          id="symbol"
          name="symbol"
          placeholder="AAPL"
          required
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
        <Label htmlFor="price">Price per Share</Label>
        <Input
          id="price"
          name="price"
          type="number"
          step="0.01"
          placeholder="150.00"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      <div className="md:col-span-3 flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Total: $<span>{total}</span>
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            "Add Transaction"
          )}
        </Button>
      </div>
    </form>
  );
}