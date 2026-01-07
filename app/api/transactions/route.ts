import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const transactionsPerPage = 5;
  const offset = (page - 1) * transactionsPerPage;

  // Fetch paginated transactions
  const transactions = await prisma.transaction.findMany({
    skip: offset,
    take: transactionsPerPage,
    orderBy: { date: "desc" },
    include: { user: { select: { name: true } } },
  });

  const totalTransactions = await prisma.transaction.count();
  const totalPages = Math.ceil(totalTransactions / transactionsPerPage);

  return NextResponse.json({ transactions, totalPages });
}
