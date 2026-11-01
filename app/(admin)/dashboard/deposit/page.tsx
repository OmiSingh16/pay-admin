import { getDepositOrders } from "@/lib/queries/orders";
import { ReviewDesk } from "@/components/review/ReviewDesk";
import { connection } from "next/server";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/ui/Skeleton"; // <-- Import

async function DepositContent() {
  await connection();
  const orders = await getDepositOrders();
  return <ReviewDesk initialOrders={orders} />;
}

export default function DepositPage() {
  return (
    <Suspense fallback={<TableSkeleton />}> {/* <-- Use karo */}
      <DepositContent />
    </Suspense>
  );
}