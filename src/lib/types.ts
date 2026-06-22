export type HarnessInferenceSettings = {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  stopSequences?: string[];
};

export type HarnessRunRequest = {
  modelId: string;
  systemPrompt?: string;
  userPrompt: string;
  settings: HarnessInferenceSettings;
};

export type HarnessRunResult = {
  id?: string;
  modelId: string;
  text: string;
  latencyMs: number;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  rawResponse?: unknown;
  error?: string;
};

export type PromptTemplatePayload = {
  name: string;
  modelId: string;
  systemPrompt?: string;
  userPrompt: string;
  settings: HarnessInferenceSettings;
};
