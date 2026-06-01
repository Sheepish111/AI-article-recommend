import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const existing = await prisma.favorite.findUnique({ where: { itemId: id } });
  if (existing) {
    await prisma.favorite.delete({ where: { itemId: id } });
    return NextResponse.json({ favorite: false });
  }

  await prisma.favorite.create({ data: { itemId: id } });
  return NextResponse.json({ favorite: true });
}
