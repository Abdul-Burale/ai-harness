import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { findRun, readStore, saveRun, saveTemplate } from "./store";

afterEach(() => {
  delete process.env.AI_HARNESS_STORE;
});

describe("CLI store", () => {
  it("persists runs and finds them by ID prefix", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ai-harness-"));
    process.env.AI_HARNESS_STORE = join(directory, "store.json");

    const saved = await saveRun(
      {
        modelId: "test-model",
        userPrompt: "Hello",
        settings: { maxTokens: 10 },
      },
      {
        modelId: "test-model",
        text: "Hi",
        latencyMs: 12,
      },
    );

    expect((await findRun(saved.id.slice(0, 8)))?.text).toBe("Hi");
    expect((await readStore()).runs).toHaveLength(1);
  });

  it("updates templates with the same name", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ai-harness-"));
    process.env.AI_HARNESS_STORE = join(directory, "store.json");

    await saveTemplate({
      name: "Review",
      modelId: "model-a",
      userPrompt: "First",
      settings: {},
    });
    await saveTemplate({
      name: "review",
      modelId: "model-b",
      userPrompt: "Second",
      settings: {},
    });

    const store = await readStore();
    expect(store.templates).toHaveLength(1);
    expect(store.templates[0].modelId).toBe("model-b");
    expect(JSON.parse(await readFile(process.env.AI_HARNESS_STORE, "utf8"))).toBeTruthy();
  });
});
