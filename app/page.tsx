import { redirect } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";

async function RedirectToDashboard() {
  await connection();
  redirect("/dashboard");
  return null; 
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg)]" />}>
      <RedirectToDashboard />
    </Suspense>
  );
}