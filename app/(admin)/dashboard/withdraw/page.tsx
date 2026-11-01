import { getWithdrawOrders } from "@/lib/queries/orders";
import { WithdrawDesk } from "@/components/review/WithdrawDesk";
import { connection } from "next/server";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/ui/Skeleton"; // <-- Import

async function WithdrawContent() {
  await connection();
  const orders = await getWithdrawOrders();
  return <WithdrawDesk initialOrders={orders} />;
}

export default function WithdrawPage() {
  return (
    <Suspense fallback={<TableSkeleton />}> {/* <-- Use karo */}
      <WithdrawContent />
    </Suspense>
  );
}