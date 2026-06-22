import { describe, expect, it } from "vitest";
import { parseRunRequest, parseSettings } from "@/lib/validation";

describe("parseSettings", () => {
  it("accepts valid inference settings", () => {
    expect(
      parseSettings({
        temperature: 0.5,
        topP: 0.7,
        maxTokens: 100,
        stopSequences: ["END", ""],
      }),
    ).toEqual({
      temperature: 0.5,
      topP: 0.7,
      maxTokens: 100,
      stopSequences: ["END"],
    });
  });

  it("rejects out-of-range values", () => {
    expect(() => parseSettings({ temperature: 2 })).toThrow(
      "temperature must be between 0 and 1.",
    );
    expect(() => parseSettings({ maxTokens: 0 })).toThrow(
      "maxTokens must be an integer between 1 and 4096.",
    );
  });
});

describe("parseRunRequest", () => {
  it("requires a model and user prompt", () => {
    expect(() => parseRunRequest({ modelId: "model", userPrompt: "" })).toThrow(
      "userPrompt is required.",
    );
  });

  it("normalizes a valid request", () => {
    expect(
      parseRunRequest({
        modelId: " model ",
        systemPrompt: " ",
        userPrompt: " Hello ",
        settings: { maxTokens: 12 },
      }),
    ).toEqual({
      modelId: "model",
      systemPrompt: undefined,
      userPrompt: "Hello",
      settings: { maxTokens: 12 },
    });
  });
});
