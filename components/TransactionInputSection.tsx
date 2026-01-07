import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { revalidatePath } from "next/cache";
import { TransactionForm } from "./TransactionForm";

async function addTransaction(formData: FormData) {
  "use server";

  const symbol = formData.get("symbol") as string;
  const quantity = parseInt(formData.get("quantity") as string);
  const price = parseFloat(formData.get("price") as string);
  const type = formData.get("type") as "BUY" | "SELL";

  // For sell transactions, make quantity negative
  const adjustedQuantity = type === "SELL" ? -Math.abs(quantity) : quantity;

  // Get the current user session
  const { getServerSession } = await import("next-auth");
  const { authOptions } = await import("../auth");
  const { default: prisma } = await import("@/lib/prisma");

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

  // Add the transaction to the database
  await prisma.transaction.create({
    data: {
      symbol: symbol.toUpperCase(),
      quantity: adjustedQuantity,
      price,
      date: new Date(), // Automatically set to current date/time
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
        <CardTitle className="text-2xl flex items-center gap-2">
          <Plus className="h-6 w-6" />
          Add Transaction
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