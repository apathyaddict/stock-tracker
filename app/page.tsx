import { PositionsTable } from "@/components/PositionsTable";
import { StockPriceOverview } from "@/components/StockPriceOverview";
import { addTransaction } from "@/components/TransactionInputSection";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import prisma from "@/lib/prisma";
import {
  calculateHoldings,
  type Holding,
} from "@/lib/portfolio-calculations";
import { Archive, TrendingUp } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../auth";

function toTableHolding(h: Holding) {
  return {
    symbol: h.symbol,
    totalQuantity: h.totalQuantity,
    avgPrice: h.avgPrice,
    totalValue: h.costBasis,
    lastTransaction: h.lastTransaction,
    status: h.status,
    sellPrice: h.lastSellPrice,
    buyDate: h.firstBuyDate ?? null,
    sellDate: h.lastSellDate ?? null,
    profitLoss: h.status === "Closed" ? h.realizedPL : undefined,
  };
}

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user.id },
    orderBy: [{ buyDate: "desc" }, { sellDate: "desc" }],
  });

  const holdings = calculateHoldings(
    transactions.map((t) => ({
      ...t,
      buyPrice: t.buyPrice != null ? Number(t.buyPrice) : null,
      sellPrice: t.sellPrice != null ? Number(t.sellPrice) : null,
    })),
  );

  const openHoldings = holdings.filter((h) => h.status === "Open");
  const closedHoldings = holdings.filter((h) => h.status === "Closed");
  const allSymbols = holdings.map((h) => h.symbol);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full max-w-7xl mx-auto p-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-muted-foreground text-lg mt-2">
              Welcome back, {session.user.name || ""}
            </p>
          </div>
        </div>

        <StockPriceOverview symbols={allSymbols} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              <h2 className="card-title-main">Positions</h2>
            </CardTitle>
            <CardDescription>
              Track your active positions and view historical transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="active" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Active Positions ({openHoldings.length})
                </TabsTrigger>
                <TabsTrigger
                  value="archived"
                  className="flex items-center gap-2">
                  <Archive className="h-4 w-4" />
                  Archived ({closedHoldings.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="mt-6">
                <PositionsTable
                  holdings={openHoldings.map(toTableHolding)}
                  addTransaction={addTransaction}
                />
              </TabsContent>

              <TabsContent value="archived" className="mt-6">
                <PositionsTable
                  holdings={closedHoldings.map(toTableHolding)}
                  addTransaction={addTransaction}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
