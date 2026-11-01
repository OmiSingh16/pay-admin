import { getUpiRequests } from "@/lib/queries/orders";
import { UpiDesk } from "@/components/review/UpiDesk";
import { connection } from "next/server";
import { Suspense } from "react";
import { UpiSkeleton } from "@/components/ui/Skeleton"; // <-- Import

async function UpiContent() {
  await connection();
  const requests = await getUpiRequests();
  return <UpiDesk initialRequests={requests} />;
}

export default function UpiPage() {
  return (
    <Suspense fallback={<UpiSkeleton />}> {/* <-- Use karo */}
      <UpiContent />
    </Suspense>
  );
}