export const dynamic = "force-dynamic"; // This disables SSG and ISR

import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function Transaction({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const transactionId = parseInt(id);

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      user: true,
    },
  });

  if (!transaction) {
    notFound();
  }

  // Server action to delete the transaction
  async function deleteTransaction() {
    "use server";

    await prisma.transaction.delete({
      where: {
        id: transactionId,
      },
    });

    redirect("/transactions");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-12">
      <Card className="max-w-4xl w-full">
        <CardHeader className="pb-8">
          <CardTitle className="text-6xl font-extrabold leading-tight">
            {transaction.symbol}
          </CardTitle>
          <CardDescription className="text-xl mt-4">
            by{" "}
            <span className="font-medium">
              {transaction.user?.name || "Anonymous"}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-muted-foreground">
                  Quantity
                </h3>
                <p className="text-4xl font-semibold">{transaction.quantity}</p>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-muted-foreground">
                  Price
                </h3>
                <p className="text-4xl font-semibold">
                  ${transaction.price.toString()}
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-muted-foreground">
                  Date
                </h3>
                <p className="text-4xl font-semibold">
                  {transaction.date.toISOString().split("T")[0]}
                </p>
              </div>
            </div>
            <div className="pt-8 border-t">
              <h3 className="text-lg font-medium text-muted-foreground mb-4">
                Total Value
              </h3>
              <p className="text-5xl font-bold text-primary">
                $
                {(
                  transaction.quantity *
                  parseFloat(transaction.price.toString())
                ).toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form action={deleteTransaction} className="mt-12">
        <Button
          type="submit"
          variant="destructive"
          size="lg"
          className="px-8 py-3 text-lg">
          Delete Transaction
        </Button>
      </form>
    </div>
  );
}
