import { requireAdmin } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { ToastProvider } from "@/components/ui/Toast";

async function AdminContent({ children }: { children: React.ReactNode }) {
  await connection();

  let session;
  try {
    session = await requireAdmin();
  } catch (e) {
    redirect("/login");
  }

  return (
    <ToastProvider>
    <div className="flex min-h-screen bg-(--bg)">
  <Sidebar counts={{ deposit: 9, withdraw: 4, upi: 5 }} />
  <main className="flex-1 min-w-0">
    {children}
  </main>
</div>
    </ToastProvider>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-(--bg)" />}>
      <AdminContent>{children}</AdminContent>
    </Suspense>
  );
}