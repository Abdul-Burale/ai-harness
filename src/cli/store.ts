import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type {
  HarnessInferenceSettings,
  HarnessRunRequest,
  HarnessRunResult,
} from "../lib/types";

export type StoredRun = HarnessRunRequest &
  HarnessRunResult & {
    id: string;
    createdAt: string;
  };

export type StoredTemplate = HarnessRunRequest & {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type HarnessStore = {
  version: 1;
  runs: StoredRun[];
  templates: StoredTemplate[];
};

const emptyStore: HarnessStore = {
  version: 1,
  runs: [],
  templates: [],
};

export function getStorePath() {
  return (
    process.env.AI_HARNESS_STORE ||
    join(homedir(), ".ai-harness", "store.json")
  );
}

export async function readStore(): Promise<HarnessStore> {
  try {
    const contents = await readFile(getStorePath(), "utf8");
    return JSON.parse(contents) as HarnessStore;
  } catch (error) {
    if (isMissingFile(error)) {
      return structuredClone(emptyStore);
    }

    throw error;
  }
}

export async function saveRun(
  request: HarnessRunRequest,
  result: HarnessRunResult,
): Promise<StoredRun> {
  const store = await readStore();
  const run: StoredRun = {
    ...request,
    ...result,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };

  store.runs.unshift(run);
  store.runs = store.runs.slice(0, 500);
  await writeStore(store);
  return run;
}

export async function saveTemplate(input: {
  name: string;
  modelId: string;
  systemPrompt?: string;
  userPrompt: string;
  settings: HarnessInferenceSettings;
}): Promise<StoredTemplate> {
  const store = await readStore();
  const existing = store.templates.find(
    (template) => template.name.toLowerCase() === input.name.toLowerCase(),
  );
  const now = new Date().toISOString();

  if (existing) {
    Object.assign(existing, input, { updatedAt: now });
    await writeStore(store);
    return existing;
  }

  const template: StoredTemplate = {
    ...input,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  store.templates.unshift(template);
  await writeStore(store);
  return template;
}

export async function findRun(id: string) {
  const store = await readStore();
  return store.runs.find((run) => run.id === id || run.id.startsWith(id));
}

export async function findTemplate(name: string) {
  const store = await readStore();
  return store.templates.find(
    (template) =>
      template.id === name ||
      template.id.startsWith(name) ||
      template.name.toLowerCase() === name.toLowerCase(),
  );
}

async function writeStore(store: HarnessStore) {
  const path = getStorePath();
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.${process.pid}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  await rename(temporaryPath, path);
}

function isMissingFile(error: unknown): error is NodeJS.ErrnoException {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}
