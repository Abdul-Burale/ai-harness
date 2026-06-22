import "dotenv/config";
import { readFile } from "node:fs/promises";
import { Command } from "commander";
import chalk from "chalk";
import { AWS_REGION, DEFAULT_BEDROCK_MODEL_ID } from "../lib/config";
import { runBedrockConverse } from "../lib/bedrock";
import { parseSettings } from "../lib/validation";
import { getAwsIdentity, listConfiguredModels, listLiveModels } from "./aws";
import {
  failure,
  heading,
  label,
  printRun,
  printTable,
  shortId,
  success,
  warning,
} from "./format";
import {
  findRun,
  findTemplate,
  getStorePath,
  readStore,
  saveRun,
  saveTemplate,
} from "./store";

const program = new Command();

program
  .name("ai-harness")
  .description("Run, save, and compare AWS Bedrock prompts from your terminal.")
  .version("0.1.0");

program
  .command("doctor")
  .description("Check local configuration and AWS identity without invoking a model.")
  .action(async () => {
    heading("AI Harness doctor");
    label("Region", AWS_REGION);
    label("Default model", DEFAULT_BEDROCK_MODEL_ID);
    label("Local store", getStorePath());
    success("Local configuration loaded");

    try {
      const identity = await getAwsIdentity();
      success("AWS credentials are valid");
      label("Account", identity.Account || "unknown");
      label("Identity", identity.Arn || "unknown");
    } catch (error) {
      warning("AWS credentials could not be verified");
      console.log(chalk.dim(messageFrom(error)));
      process.exitCode = 1;
    }
  });

program
  .command("models")
  .description("List configured models, or query Bedrock with --live.")
  .option("--live", "query the Bedrock model catalogue")
  .option("--json", "print machine-readable JSON")
  .action(async (options: { live?: boolean; json?: boolean }) => {
    try {
      const models = options.live
        ? await listLiveModels()
        : listConfiguredModels();

      if (options.json) {
        console.log(JSON.stringify(models, null, 2));
        return;
      }

      heading(options.live ? "Bedrock models" : "Configured models");
      printTable([
        ["MODEL ID", ...(options.live ? ["PROVIDER"] : [])],
        ...models.map((model) => [
          model.id,
          ...("provider" in model ? [String(model.provider)] : []),
        ]),
      ]);
      if (!options.live) {
        console.log(
          chalk.dim("\nUse `ai-harness models --live` to query AWS Bedrock."),
        );
      }
    } catch (error) {
      failure(messageFrom(error));
      process.exitCode = 1;
    }
  });

program
  .command("run")
  .description("Run a prompt against AWS Bedrock and save the result locally.")
  .argument("[prompt]", "prompt text")
  .option("-f, --file <path>", "read the prompt from a text file")
  .option("-t, --template <name>", "run a saved template")
  .option("-m, --model <id>", "Bedrock model ID", DEFAULT_BEDROCK_MODEL_ID)
  .option("-s, --system <text>", "system prompt")
  .option("--temperature <number>", "temperature from 0 to 1", "0.2")
  .option("--top-p <number>", "top-p from 0 to 1", "0.9")
  .option("--max-tokens <number>", "maximum output tokens", "800")
  .option("--json", "print machine-readable JSON")
  .action(
    async (
      prompt: string | undefined,
      options: {
        file?: string;
        template?: string;
        model: string;
        system?: string;
        temperature: string;
        topP: string;
        maxTokens: string;
        json?: boolean;
      },
    ) => {
      let request;

      try {
        if (options.template) {
          const template = await findTemplate(options.template);
          if (!template) {
            throw new Error(`Template "${options.template}" was not found.`);
          }
          request = {
            modelId: template.modelId,
            systemPrompt: template.systemPrompt,
            userPrompt: template.userPrompt,
            settings: template.settings,
          };
        } else {
          const userPrompt = options.file
            ? (await readFile(options.file, "utf8")).trim()
            : prompt?.trim();
          if (!userPrompt) {
            throw new Error("Provide a prompt, --file, or --template.");
          }

          request = {
            modelId: options.model,
            systemPrompt: options.system,
            userPrompt,
            settings: parseSettings({
              temperature: options.temperature,
              topP: options.topP,
              maxTokens: options.maxTokens,
            }),
          };
        }

        if (!options.json) {
          console.log(
            chalk.dim(`Running ${request.modelId} in ${AWS_REGION}...`),
          );
        }

        const result = await runBedrockConverse(request);
        const stored = await saveRun(request, result);
        if (options.json) {
          console.log(JSON.stringify(stored, null, 2));
        } else {
          printRun(stored);
          success(`Saved as ${shortId(stored.id)}`);
        }
      } catch (error) {
        const message = messageFrom(error);
        if (request) {
          await saveRun(request, {
            modelId: request.modelId,
            text: "",
            latencyMs: 0,
            error: message,
          });
        }
        failure(message);
        process.exitCode = 1;
      }
    },
  );

program
  .command("history")
  .description("Show recent local runs.")
  .option("-n, --limit <number>", "number of runs", "10")
  .option("--json", "print machine-readable JSON")
  .action(async (options: { limit: string; json?: boolean }) => {
    const store = await readStore();
    const runs = store.runs.slice(0, Number(options.limit));
    if (options.json) {
      console.log(JSON.stringify(runs, null, 2));
      return;
    }

    heading("Recent runs");
    if (!runs.length) {
      console.log(chalk.dim("No runs yet."));
      return;
    }
    printTable([
      ["ID", "STATUS", "MODEL", "TOKENS", "PROMPT"],
      ...runs.map((run) => [
        shortId(run.id),
        run.error ? "failed" : "complete",
        run.modelId,
        String(run.usage?.totalTokens ?? "n/a"),
        truncate(run.userPrompt, 44),
      ]),
    ]);
  });

program
  .command("show")
  .description("Show one saved run.")
  .argument("<id>", "full ID or ID prefix")
  .option("--json", "print machine-readable JSON")
  .action(async (id: string, options: { json?: boolean }) => {
    const run = await findRun(id);
    if (!run) {
      failure(`Run "${id}" was not found.`);
      process.exitCode = 1;
      return;
    }
    if (options.json) {
      console.log(JSON.stringify(run, null, 2));
    } else {
      printRun(run);
    }
  });

program
  .command("compare")
  .description("Compare two saved runs.")
  .argument("<first>", "first run ID or prefix")
  .argument("<second>", "second run ID or prefix")
  .action(async (firstId: string, secondId: string) => {
    const [first, second] = await Promise.all([
      findRun(firstId),
      findRun(secondId),
    ]);
    if (!first || !second) {
      failure("Both run IDs must exist in local history.");
      process.exitCode = 1;
      return;
    }

    heading("Run comparison");
    printTable([
      ["FIELD", shortId(first.id), shortId(second.id)],
      ["Model", first.modelId, second.modelId],
      ["Latency", `${first.latencyMs}ms`, `${second.latencyMs}ms`],
      [
        "Tokens",
        String(first.usage?.totalTokens ?? "n/a"),
        String(second.usage?.totalTokens ?? "n/a"),
      ],
      [
        "Temperature",
        String(first.settings.temperature ?? "default"),
        String(second.settings.temperature ?? "default"),
      ],
      ["Status", first.error ? "failed" : "complete", second.error ? "failed" : "complete"],
    ]);
    heading(shortId(first.id));
    console.log(first.error || first.text || "(empty output)");
    heading(shortId(second.id));
    console.log(second.error || second.text || "(empty output)");
  });

const templates = program
  .command("templates")
  .description("Manage reusable local prompt templates.");

templates
  .command("list")
  .description("List saved templates.")
  .action(async () => {
    const store = await readStore();
    heading("Templates");
    if (!store.templates.length) {
      console.log(chalk.dim("No templates yet."));
      return;
    }
    printTable([
      ["NAME", "MODEL", "PROMPT"],
      ...store.templates.map((template) => [
        template.name,
        template.modelId,
        truncate(template.userPrompt, 48),
      ]),
    ]);
  });

templates
  .command("save")
  .description("Create or update a prompt template.")
  .argument("<name>", "template name")
  .argument("<prompt>", "prompt text")
  .option("-m, --model <id>", "Bedrock model ID", DEFAULT_BEDROCK_MODEL_ID)
  .option("-s, --system <text>", "system prompt")
  .option("--temperature <number>", "temperature from 0 to 1", "0.2")
  .option("--top-p <number>", "top-p from 0 to 1", "0.9")
  .option("--max-tokens <number>", "maximum output tokens", "800")
  .action(
    async (
      name: string,
      prompt: string,
      options: {
        model: string;
        system?: string;
        temperature: string;
        topP: string;
        maxTokens: string;
      },
    ) => {
      try {
        const template = await saveTemplate({
          name,
          modelId: options.model,
          systemPrompt: options.system,
          userPrompt: prompt,
          settings: parseSettings({
            temperature: options.temperature,
            topP: options.topP,
            maxTokens: options.maxTokens,
          }),
        });
        success(`Template "${template.name}" saved`);
      } catch (error) {
        failure(messageFrom(error));
        process.exitCode = 1;
      }
    },
  );

program.parseAsync().catch((error) => {
  failure(messageFrom(error));
  process.exitCode = 1;
});

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function truncate(value: string, length: number) {
  return value.length > length ? `${value.slice(0, length - 3)}...` : value;
}
