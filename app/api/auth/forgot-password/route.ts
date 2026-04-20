import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { Resend } from "resend";
import { prisma } from "@/lib/db";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

const schema = z.object({
  email: z.string().email(),
});

const TOKEN_TTL_MS = 60 * 60 * 1000;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: true });
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (user && user.passwordHash) {
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    await prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });

    const baseUrl =
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

    await resend.emails.send({
      from: "Trinity Library <noreply@trinitycambridge.com>",
      to: user.email,
      subject: "Reset your Trinity Library password",
      text: `Hi ${user.name},\n\nSomeone (hopefully you) requested a password reset for your Trinity Library account.\n\nReset your password here: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can safely ignore this email.\n\nThanks,\nTrinity Library`,
    });
  }

  return NextResponse.json({ success: true });
}
