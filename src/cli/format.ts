import chalk from "chalk";
import type { StoredRun } from "./store";

export function heading(value: string) {
  console.log(`\n${chalk.bold(value)}`);
}

export function label(name: string, value: unknown) {
  console.log(`${chalk.dim(name.padEnd(14))}${String(value)}`);
}

export function success(value: string) {
  console.log(chalk.green(`[ok] ${value}`));
}

export function warning(value: string) {
  console.log(chalk.yellow(`[!] ${value}`));
}

export function failure(value: string) {
  console.error(chalk.red(`[x] ${value}`));
}

export function shortId(id: string) {
  return id.slice(0, 8);
}

export function printRun(run: StoredRun) {
  heading(`Run ${shortId(run.id)}`);
  label("Status", run.error ? chalk.red("failed") : chalk.green("complete"));
  label("Model", run.modelId);
  label("Created", new Date(run.createdAt).toLocaleString());
  label("Latency", `${run.latencyMs}ms`);
  label("Tokens", run.usage?.totalTokens ?? "unavailable");
  label("Temperature", run.settings.temperature ?? "default");
  label("Max tokens", run.settings.maxTokens ?? "default");

  heading("Prompt");
  console.log(run.userPrompt);

  heading(run.error ? "Error" : "Output");
  console.log(run.error || run.text || "(empty output)");
}

export function printTable(rows: string[][]) {
  if (!rows.length) {
    return;
  }

  const widths = rows[0].map((_, column) =>
    Math.max(...rows.map((row) => visibleLength(row[column] ?? ""))),
  );

  rows.forEach((row, rowIndex) => {
    console.log(
      row
        .map((cell, column) => cell.padEnd(widths[column]))
        .join("  ")
        .trimEnd(),
    );
    if (rowIndex === 0) {
      console.log(widths.map((width) => "-".repeat(width)).join("  "));
    }
  });
}

function visibleLength(value: string) {
  return value.replace(/\u001b\[[0-9;]*m/g, "").length;
}
