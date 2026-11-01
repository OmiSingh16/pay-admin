import { NextResponse } from "next/server";
import { getLiveActivity } from "@/lib/queries/activity";

export async function GET() {
  const data = await getLiveActivity();
  return NextResponse.json(data);
}