export const dynamic = "force-dynamic"; // This disables SSG and ISR

import prisma from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { checkPostTableExists } from "@/lib/db-utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function Home() {
  // Check if the post table exists
  const tableExists = await checkPostTableExists();

  // If the post table doesn't exist, redirect to setup page
  if (!tableExists) {
    redirect("/setup");
  }

  const posts = await prisma.post.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 6,
    include: {
      author: {
        select: {
          name: true,
        },
      },
    },
  });

  const transactions = await prisma.transaction.findMany({
    orderBy: {
      date: "desc",
    },
    take: 6,
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen flex flex-col items-center py-16 px-8">
      <div className="w-full max-w-7xl space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <h1 className="text-6xl font-extrabold">Welcome to Stock Tracker</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Track your investments and share your thoughts with the community
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center mt-10">
            <Link href="/posts">
              <Button size="lg" className="w-full sm:w-auto px-8 py-3 text-lg">
                View Posts
              </Button>
            </Link>
            <Link href="/transactions">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-8 py-3 text-lg">
                View Transactions
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Posts Section */}
        <section className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-4xl font-bold">Recent Posts</h2>
            <Link href="/posts">
              <Button variant="ghost" size="lg">
                View all posts →
              </Button>
            </Link>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Card
                key={post.id}
                className="hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl line-clamp-2 leading-tight">
                    <Link
                      href={`/posts/${post.id}`}
                      className="hover:text-primary transition-colors">
                      {post.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="text-base">
                    by {post.author?.name || "Anonymous"} •{" "}
                    {new Date(post.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-muted-foreground line-clamp-3 text-base leading-relaxed">
                    {post.content || "No content available."}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent Transactions Section */}
        <section className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-4xl font-bold">Recent Transactions</h2>
            <Link href="/transactions">
              <Button variant="ghost" size="lg">
                View all transactions →
              </Button>
            </Link>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {transactions.map((transaction) => (
              <Card
                key={transaction.id}
                className="hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl">
                    <Link
                      href={`/transactions/${transaction.id}`}
                      className="hover:text-primary transition-colors">
                      {transaction.symbol}
                    </Link>
                  </CardTitle>
                  <CardDescription className="text-base">
                    by {transaction.user?.name || "Anonymous"} •{" "}
                    {new Date(transaction.date).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex justify-between text-base">
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="font-medium">
                        {transaction.quantity}
                      </span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-medium">
                        ${transaction.price.toString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-semibold text-primary pt-2 border-t">
                      <span>Total:</span>
                      <span>
                        $
                        {(
                          transaction.quantity *
                          parseFloat(transaction.price.toString())
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
