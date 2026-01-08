import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const {
      symbol,
      quantity,
      buyPrice,
      buyDate,
      sellPrice,
      sellDate,
      type,
      userId,
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
        userId,
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
