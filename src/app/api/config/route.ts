import { NextResponse } from "next/server";
import { AWS_REGION, DEFAULT_BEDROCK_MODEL_ID, getModelIds } from "@/lib/config";

export async function GET() {
  return NextResponse.json({
    awsRegion: AWS_REGION,
    defaultModelId: DEFAULT_BEDROCK_MODEL_ID,
    modelIds: getModelIds(),
  });
}
