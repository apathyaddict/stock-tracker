export const dynamic = "force-dynamic"; // This disables SSG and ISR

import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { DollarSign, BarChart3, Activity, TrendingUp } from "lucide-react";
import { TransactionInputSection } from "@/components/TransactionInputSection";

interface Holding {
  symbol: string;
  totalQuantity: number;
  avgPrice: number;
  totalValue: number;
  lastTransaction: Date;
}

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get all transactions for the current user
  const transactions = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      date: "desc",
    },
  });

  // Calculate current holdings by grouping transactions by symbol
  const holdingsMap = new Map<string, Holding>();

  for (const transaction of transactions) {
    const symbol = transaction.symbol;
    const quantity = transaction.quantity;
    const price = Number(transaction.price);

    if (holdingsMap.has(symbol)) {
      const holding = holdingsMap.get(symbol)!;
      // Calculate new average price using weighted average
      const newTotalQuantity = holding.totalQuantity + quantity;
      if (newTotalQuantity !== 0) {
        const newTotalValue = holding.totalValue + (quantity * price);
        holding.totalQuantity = newTotalQuantity;
        holding.avgPrice = newTotalValue / Math.abs(newTotalQuantity);
        holding.totalValue = newTotalValue;
        holding.lastTransaction = transaction.date > holding.lastTransaction ? transaction.date : holding.lastTransaction;
      } else {
        // If quantity becomes 0, remove the holding
        holdingsMap.delete(symbol);
      }
    } else {
      holdingsMap.set(symbol, {
        symbol,
        totalQuantity: quantity,
        avgPrice: price,
        totalValue: quantity * price,
        lastTransaction: transaction.date,
      });
    }
  }

  const holdings = Array.from(holdingsMap.values()).filter(h => h.totalQuantity > 0);

  // Calculate portfolio summary
  const totalValue = holdings.reduce((sum, holding) => sum + holding.totalValue, 0);
  const totalHoldings = holdings.length;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full max-w-7xl mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Stock Tracker Dashboard</h1>
            <p className="text-muted-foreground text-lg mt-2">
              Welcome back, {session.user.name || session.user.email}
            </p>
          </div>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Portfolio Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Total Holdings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalHoldings}</div>
              <p className="text-sm text-muted-foreground mt-1">
                {totalHoldings === 1 ? 'stock' : 'stocks'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Total Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{transactions.length}</div>
              <p className="text-sm text-muted-foreground mt-1">
                total transactions
              </p>
            </CardContent>
          </Card>
        </div>

        <TransactionInputSection />

        {/* Current Holdings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Current Holdings
            </CardTitle>
            <CardDescription>
              Your current stock positions and average cost basis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {holdings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg mb-4">
                  You don't have any stock holdings yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {holdings.map((holding) => (
                  <div
                    key={holding.symbol}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="text-xl font-semibold">{holding.symbol}</h3>
                        <p className="text-sm text-muted-foreground">
                          {holding.totalQuantity} shares
                        </p>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-lg font-semibold">
                        ${holding.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Avg: ${holding.avgPrice.toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {holding.totalQuantity} shares
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
