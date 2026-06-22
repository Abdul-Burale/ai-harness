import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseTemplatePayload } from "@/lib/validation";

export async function GET() {
  const templates = await prisma.promptTemplate.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ templates });
}

export async function POST(request: Request) {
  try {
    const payload = parseTemplatePayload(await request.json());
    const template = await prisma.promptTemplate.create({
      data: {
        name: payload.name,
        modelId: payload.modelId,
        systemPrompt: payload.systemPrompt,
        userPrompt: payload.userPrompt,
        settings: payload.settings,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid template request.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
