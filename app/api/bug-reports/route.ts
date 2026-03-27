import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

const bugReportSchema = z.object({
  page: z.string().max(200),
  message: z.string().min(1).max(1000),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const body = await req.json();
  const parsed = bugReportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid report" }, { status: 400 });
  }

  const { page, message } = parsed.data;
  const userName = session?.user?.name || "Anonymous";
  const userEmail = session?.user?.email || "Not signed in";

  await resend.emails.send({
    from: "Trinity Library <onboarding@resend.dev>",
    to: "j.wang2216@gmail.com",
    subject: `Bug Report: ${page}`,
    text: `Bug Report\n\nPage: ${page}\nUser: ${userName} (${userEmail})\nTime: ${new Date().toISOString()}\n\nMessage:\n${message}`,
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
