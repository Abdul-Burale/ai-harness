import type {
  HarnessInferenceSettings,
  HarnessRunRequest,
  PromptTemplatePayload,
} from "./types";

const MAX_PROMPT_CHARS = 40_000;
const MAX_STOP_SEQUENCES = 8;

export function parseSettings(value: unknown): HarnessInferenceSettings {
  const input = isRecord(value) ? value : {};
  const settings: HarnessInferenceSettings = {};

  if (input.temperature !== undefined) {
    settings.temperature = numberInRange(input.temperature, 0, 1, "temperature");
  }

  if (input.topP !== undefined) {
    settings.topP = numberInRange(input.topP, 0, 1, "topP");
  }

  if (input.maxTokens !== undefined) {
    settings.maxTokens = integerInRange(input.maxTokens, 1, 4096, "maxTokens");
  }

  if (input.stopSequences !== undefined) {
    if (!Array.isArray(input.stopSequences)) {
      throw new Error("stopSequences must be an array.");
    }

    settings.stopSequences = input.stopSequences
      .map((item) => String(item).trim())
      .filter(Boolean)
      .slice(0, MAX_STOP_SEQUENCES);
  }

  return settings;
}

export function parseRunRequest(value: unknown): HarnessRunRequest {
  if (!isRecord(value)) {
    throw new Error("Request body must be an object.");
  }

  const modelId = requiredString(value.modelId, "modelId");
  const userPrompt = requiredString(value.userPrompt, "userPrompt");
  const systemPrompt = optionalString(value.systemPrompt);

  validatePromptLength(userPrompt, "userPrompt");
  if (systemPrompt) {
    validatePromptLength(systemPrompt, "systemPrompt");
  }

  return {
    modelId,
    systemPrompt,
    userPrompt,
    settings: parseSettings(value.settings),
  };
}

export function parseTemplatePayload(value: unknown): PromptTemplatePayload {
  const run = parseRunRequest(value);

  if (!isRecord(value)) {
    throw new Error("Request body must be an object.");
  }

  return {
    ...run,
    name: requiredString(value.name, "name"),
  };
}

function validatePromptLength(value: string, field: string) {
  if (value.length > MAX_PROMPT_CHARS) {
    throw new Error(`${field} must be ${MAX_PROMPT_CHARS} characters or fewer.`);
  }
}

function requiredString(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }

  return value.trim();
}

function optionalString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function numberInRange(
  value: unknown,
  min: number,
  max: number,
  field: string,
) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new Error(`${field} must be between ${min} and ${max}.`);
  }

  return number;
}

function integerInRange(
  value: unknown,
  min: number,
  max: number,
  field: string,
) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new Error(`${field} must be an integer between ${min} and ${max}.`);
  }

  return number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
