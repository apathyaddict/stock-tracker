import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: [{ buyDate: "desc" }, { sellDate: "desc" }],
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const {
      symbol,
      quantity,
      buyPrice,
      buyDate,
      sellPrice,
      sellDate,
      type,
    } = data;

    // Save transaction to database
    const transaction = await prisma.transaction.create({
      data: {
        symbol,
        quantity: Number(quantity),
        buyPrice: buyPrice ? Number(buyPrice) : undefined,
        buyDate: buyDate ? new Date(buyDate) : undefined,
        sellPrice: sellPrice ? Number(sellPrice) : undefined,
        sellDate: sellDate ? new Date(sellDate) : undefined,
        type,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error("Error saving transaction:", error);
    return NextResponse.json(
      { error: "Failed to save transaction" },
      { status: 500 }
    );
  }
}
