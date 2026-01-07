"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Transaction {
  id: number;
  symbol: string;
  quantity: number;
  price: string; // since Decimal is returned as string
  date: string;
  user?: {
    name: string;
  };
}

// Disable static generation
export const dynamic = "force-dynamic";

function TransactionsList() {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/transactions?page=${page}`);
        if (!res.ok) {
          throw new Error("Failed to fetch transactions");
        }
        const data = await res.json();
        setTransactions(data.transactions);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTransactions();
  }, [page]);

  return (
    <>
      {isLoading ? (
        <div className="flex items-center justify-center space-x-2 min-h-[200px]">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground">No transactions available.</p>
          ) : (
            <div className="space-y-8 w-full max-w-5xl mx-auto">
              {transactions.map((transaction) => (
                <Card
                  key={transaction.id}
                  className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                  <CardHeader className="pb-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-3xl">
                          <Link
                            href={`/transactions/${transaction.id}`}
                            className="hover:text-primary transition-colors">
                            {transaction.symbol}
                          </Link>
                        </CardTitle>
                        <CardDescription className="text-lg">
                          by {transaction.user?.name || "Anonymous"}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-lg text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-base text-muted-foreground">
                          Quantity
                        </p>
                        <p className="font-semibold text-xl">
                          {transaction.quantity}
                        </p>
                      </div>
                      <div>
                        <p className="text-base text-muted-foreground">Price</p>
                        <p className="font-semibold text-xl">
                          ${transaction.price}
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 pt-6 border-t">
                      <p className="text-base text-muted-foreground">
                        Total Value
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        $
                        {(
                          transaction.quantity * parseFloat(transaction.price)
                        ).toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          <div className="flex justify-center space-x-4 mt-8">
            {page > 1 && (
              <Link href={`/transactions?page=${page - 1}`}>
                <Button variant="outline">Previous</Button>
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/transactions?page=${page + 1}`}>
                <Button variant="outline">Next</Button>
              </Link>
            )}
          </div>
        </>
      )}
    </>
  );
}

export default function TransactionsPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-8">
      <div className="w-full max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold mb-2">Stock Transactions</h1>
        <p className="text-muted-foreground">Track your investment portfolio</p>
      </div>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            <p className="ml-3 text-muted-foreground">Loading page...</p>
          </div>
        }>
        <TransactionsList />
      </Suspense>
    </div>
  );
}
