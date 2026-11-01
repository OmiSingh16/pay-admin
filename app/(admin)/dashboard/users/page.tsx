import { getUsers, getUsersStats } from "@/lib/queries/users";
import { UsersDesk } from "@/components/users/UsersDesk";
import { connection } from "next/server";
import { Suspense } from "react";
import { UsersSkeleton } from "@/components/ui/Skeleton"; // <-- Import

async function UsersContent() {
  await connection();
  const [users, stats] = await Promise.all([getUsers(), getUsersStats()]);
  return <UsersDesk initialUsers={users} stats={stats} />;
}

export default function UsersPage() {
  return (
    <Suspense fallback={<UsersSkeleton />}> {/* <-- Use karo */}
      <UsersContent />
    </Suspense>
  );
}