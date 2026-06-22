import {
  BedrockClient,
  ListFoundationModelsCommand,
} from "@aws-sdk/client-bedrock";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import { AWS_REGION, getModelIds } from "../lib/config";

export async function getAwsIdentity() {
  const client = new STSClient({ region: AWS_REGION });
  return client.send(new GetCallerIdentityCommand({}));
}

export async function listLiveModels() {
  const client = new BedrockClient({ region: AWS_REGION });
  const response = await client.send(
    new ListFoundationModelsCommand({
      byOutputModality: "TEXT",
      byInferenceType: "ON_DEMAND",
    }),
  );

  return (response.modelSummaries ?? [])
    .filter((model) => model.modelId)
    .map((model) => ({
      id: model.modelId as string,
      name: model.modelName || model.modelId || "Unknown",
      provider: model.providerName || "Unknown",
    }));
}

export function listConfiguredModels() {
  return getModelIds().map((id) => ({ id }));
}
