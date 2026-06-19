import { TransactionInputSection } from "@/components/TransactionInputSection";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../auth";

export default async function TransactionsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full max-w-7xl mx-auto p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold">Add Transaction</h1>
          <p className="text-muted-foreground text-lg mt-2">
            Record a new buy or sell transaction
          </p>
        </div>

        {/* Transaction Input Section */}
        <TransactionInputSection />
      </div>
    </div>
  );
}
