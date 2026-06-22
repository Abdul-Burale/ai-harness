export const AWS_REGION = process.env.AWS_REGION || "eu-west-1";

export const DEFAULT_BEDROCK_MODEL_ID =
  process.env.DEFAULT_BEDROCK_MODEL_ID ||
  "anthropic.claude-3-haiku-20240307-v1:0";

export function getModelIds() {
  const configured = process.env.BEDROCK_MODEL_IDS?.split(",")
    .map((modelId) => modelId.trim())
    .filter(Boolean);

  return configured?.length
    ? configured
    : [
        DEFAULT_BEDROCK_MODEL_ID,
        "anthropic.claude-3-5-sonnet-20240620-v1:0",
        "amazon.nova-lite-v1:0",
      ];
}
