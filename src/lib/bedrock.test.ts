import { describe, expect, it } from "vitest";
import { buildConverseInput, normalizeConverseResponse } from "@/lib/bedrock";

describe("buildConverseInput", () => {
  it("maps harness requests to Bedrock Converse input", () => {
    const input = buildConverseInput({
      modelId: "amazon.nova-lite-v1:0",
      systemPrompt: "Be direct.",
      userPrompt: "Hello",
      settings: {
        temperature: 0.3,
        topP: 0.8,
        maxTokens: 200,
        stopSequences: ["END"],
      },
    });

    expect(input).toMatchObject({
      modelId: "amazon.nova-lite-v1:0",
      system: [{ text: "Be direct." }],
      messages: [
        {
          role: "user",
          content: [{ text: "Hello" }],
        },
      ],
      inferenceConfig: {
        temperature: 0.3,
        topP: 0.8,
        maxTokens: 200,
        stopSequences: ["END"],
      },
    });
  });
});

describe("normalizeConverseResponse", () => {
  it("extracts text, usage, and latency", () => {
    const result = normalizeConverseResponse(
      "model",
      {
        output: {
          message: {
            role: "assistant",
            content: [{ text: "Hello there" }],
          },
        },
        usage: {
          inputTokens: 4,
          outputTokens: 2,
          totalTokens: 6,
        },
        metrics: {
          latencyMs: 123,
        },
        $metadata: {},
      },
      999,
    );

    expect(result).toMatchObject({
      modelId: "model",
      text: "Hello there",
      latencyMs: 123,
      usage: {
        inputTokens: 4,
        outputTokens: 2,
        totalTokens: 6,
      },
    });
  });
});
