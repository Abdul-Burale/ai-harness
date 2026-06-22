import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runBedrockConverse } from "@/lib/bedrock";
import { parseRunRequest } from "@/lib/validation";

export async function GET() {
  const runs = await prisma.run.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ runs });
}

export async function POST(request: Request) {
  try {
    const payload = parseRunRequest(await request.json());

    try {
      const result = await runBedrockConverse(payload);
      const run = await prisma.run.create({
        data: {
          modelId: payload.modelId,
          systemPrompt: payload.systemPrompt,
          userPrompt: payload.userPrompt,
          settings: payload.settings,
          output: result.text,
          usage: result.usage,
          latencyMs: result.latencyMs,
          rawResponse: result.rawResponse as object,
        },
      });

      return NextResponse.json({ run });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Bedrock request failed.";
      const run = await prisma.run.create({
        data: {
          modelId: payload.modelId,
          systemPrompt: payload.systemPrompt,
          userPrompt: payload.userPrompt,
          settings: payload.settings,
          output: "",
          latencyMs: 0,
          error: message,
        },
      });

      return NextResponse.json({ run }, { status: 502 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
