import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { revalidatePath } from "next/cache";
import { TransactionForm } from "./TransactionForm";

async function addTransaction(formData: FormData) {
  "use server";

  const symbol = formData.get("symbol") as string;
  const quantity = parseInt(formData.get("quantity") as string);
  const buyPriceInput = formData.get("buyPrice") as string;
  const sellPriceInput = formData.get("sellPrice") as string;
  const type = formData.get("type") as "BUY" | "SELL";
  const now = new Date();

  // Validate required fields
  if (!symbol || symbol.trim() === "") {
    throw new Error("Stock symbol is required");
  }
  if (!quantity || isNaN(quantity)) {
    throw new Error("Valid quantity is required");
  }

  // For sell transactions, make quantity negative
  const adjustedQuantity = type === "SELL" ? -Math.abs(quantity) : quantity;

  // Get the current user session
  const { getServerSession } = await import("next-auth");
  const { authOptions } = await import("../auth");
  const { default: prisma } = await import("@/lib/prisma");
  const { getStockQuote } = await import("@/lib/stock-api");

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // Check if user exists in database
  let user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    // Try to find user by email if ID doesn't match
    if (session.user.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
    }

    // If still no user found, create one
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: session.user.id,
          name: session.user.name || session.user.email,
          email: session.user.email,
          password: "", // This will be empty for OAuth users
        },
      });
    }
  }

  // Determine buy/sell price
  let buyPrice: number | undefined = undefined;
  let sellPrice: number | undefined = undefined;
  if (type === "BUY") {
    if (buyPriceInput && buyPriceInput.trim() !== "") {
      buyPrice = parseFloat(buyPriceInput);
    } else {
      const quote = await getStockQuote(symbol.toUpperCase());
      if (!quote) {
        throw new Error(`Could not fetch current price for ${symbol}`);
      }
      buyPrice = parseFloat(quote.price);
    }
  } else if (type === "SELL") {
    if (sellPriceInput && sellPriceInput.trim() !== "") {
      sellPrice = parseFloat(sellPriceInput);
    } else {
      const quote = await getStockQuote(symbol.toUpperCase());
      if (!quote) {
        throw new Error(`Could not fetch current price for ${symbol}`);
      }
      sellPrice = parseFloat(quote.price);
    }
  }

  // Add the transaction to the database
  await prisma.transaction.create({
    data: {
      symbol: symbol.toUpperCase(),
      quantity: adjustedQuantity,
      buyPrice,
      buyDate: type === "BUY" ? now : undefined,
      sellPrice,
      sellDate: type === "SELL" ? now : undefined,
      type,
      userId: user.id,
    },
  });

  revalidatePath("/");
}

export { addTransaction };

export function TransactionInputSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-6 w-6" />
          <h2 className="card-title-main">Add Transaction</h2>
        </CardTitle>
        <CardDescription>
          Add a buy or sell transaction to your portfolio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TransactionForm addTransaction={addTransaction} />
      </CardContent>
    </Card>
  );
}
