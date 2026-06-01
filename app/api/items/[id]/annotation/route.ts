import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  note: z.string().max(2000)
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = schema.parse(await request.json());
  if (!body.note.trim()) {
    await prisma.annotation.deleteMany({ where: { itemId: id } });
    return NextResponse.json({ note: "" });
  }

  const annotation = await prisma.annotation.upsert({
    where: { itemId: id },
    update: { note: body.note.trim() },
    create: { itemId: id, note: body.note.trim() }
  });
  return NextResponse.json({ note: annotation.note });
}
