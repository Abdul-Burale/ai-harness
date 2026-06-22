import {
  BedrockRuntimeClient,
  ConverseCommand,
  type ConverseCommandInput,
  type ConverseCommandOutput,
} from "@aws-sdk/client-bedrock-runtime";
import { AWS_REGION } from "@/lib/config";
import type { HarnessRunRequest, HarnessRunResult } from "@/lib/types";

export function buildConverseInput(
  request: HarnessRunRequest,
): ConverseCommandInput {
  return {
    modelId: request.modelId,
    system: request.systemPrompt
      ? [
          {
            text: request.systemPrompt,
          },
        ]
      : undefined,
    messages: [
      {
        role: "user",
        content: [
          {
            text: request.userPrompt,
          },
        ],
      },
    ],
    inferenceConfig: {
      temperature: request.settings.temperature,
      topP: request.settings.topP,
      maxTokens: request.settings.maxTokens,
      stopSequences: request.settings.stopSequences?.length
        ? request.settings.stopSequences
        : undefined,
    },
  };
}

export function normalizeConverseResponse(
  modelId: string,
  output: ConverseCommandOutput,
  fallbackLatencyMs: number,
): HarnessRunResult {
  const content = output.output?.message?.content ?? [];
  const text = content
    .map((block) => ("text" in block && block.text ? block.text : ""))
    .join("")
    .trim();

  return {
    modelId,
    text,
    latencyMs: output.metrics?.latencyMs ?? fallbackLatencyMs,
    usage: output.usage
      ? {
          inputTokens: output.usage.inputTokens,
          outputTokens: output.usage.outputTokens,
          totalTokens: output.usage.totalTokens,
        }
      : undefined,
    rawResponse: JSON.parse(JSON.stringify(output)),
  };
}

export async function runBedrockConverse(
  request: HarnessRunRequest,
): Promise<HarnessRunResult> {
  const client = new BedrockRuntimeClient({ region: AWS_REGION });
  const startedAt = Date.now();
  const output = await client.send(new ConverseCommand(buildConverseInput(request)));

  return normalizeConverseResponse(
    request.modelId,
    output,
    Date.now() - startedAt,
  );
}
