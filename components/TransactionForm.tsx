"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";

interface TransactionFormProps {
  addTransaction: (formData: FormData) => Promise<void>;
}

export function TransactionForm({ addTransaction }: TransactionFormProps) {
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [total, setTotal] = useState("0.00");

  useEffect(() => {
    const qty = parseFloat(quantity) || 0;
    const prc = parseFloat(price) || 0;
    const calculatedTotal = qty * prc;
    setTotal(calculatedTotal.toFixed(2));
  }, [quantity, price]);

  return (
    <form action={addTransaction} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="space-y-2">
        <Label htmlFor="symbol">Symbol</Label>
        <Input id="symbol" name="symbol" placeholder="AAPL" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select name="type" required>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BUY">Buy</SelectItem>
            <SelectItem value="SELL">Sell</SelectItem>
          </SelectContent>
        </Select>
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
        />
      </div>
      <div className="md:col-span-2 lg:col-span-4 flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Total: $<span>{total}</span>
        </div>
        <Button type="submit">Add Transaction</Button>
      </div>
    </form>
  );
}