"use client";

import Form from "next/form";
import { createTransaction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NewTransaction() {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Create New Transaction</CardTitle>
          <CardDescription>
            Add a new stock transaction to track your investments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form action={createTransaction} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="symbol" className="text-sm font-medium">
                Symbol <span className="text-destructive">*</span>
              </Label>
              <Input
                type="text"
                id="symbol"
                name="symbol"
                required
                placeholder="Enter stock symbol (e.g., AAPL)"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm font-medium">
                Quantity <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                id="quantity"
                name="quantity"
                required
                placeholder="Enter quantity"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm font-medium">
                Price <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                id="price"
                name="price"
                required
                placeholder="Enter price per share"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium">
                Date <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                id="date"
                name="date"
                required
                className="w-full"
              />
            </div>
            <Button type="submit" className="w-full">
              Create Transaction
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
