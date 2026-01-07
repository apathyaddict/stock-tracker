"use server";

import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export async function createTransaction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("You must be logged in to create a transaction");
  }

  await prisma.transaction.create({
    data: {
      symbol: formData.get("symbol") as string,
      quantity: parseInt(formData.get("quantity") as string),
      price: parseFloat(formData.get("price") as string),
      date: new Date(formData.get("date") as string),
      userId: session.user.id,
    },
  });

  redirect("/transactions");
}
