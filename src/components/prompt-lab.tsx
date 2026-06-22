"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CopyPlus,
  Eraser,
  GitCompareArrows,
  Loader2,
  Play,
  Save,
} from "lucide-react";
import type { HarnessInferenceSettings } from "@/lib/types";

type AppConfig = {
  awsRegion: string;
  defaultModelId: string;
  modelIds: string[];
};

type RunRecord = {
  id: string;
  modelId: string;
  systemPrompt?: string | null;
  userPrompt: string;
  settings: HarnessInferenceSettings;
  output: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  } | null;
  latencyMs: number;
  error?: string | null;
  createdAt: string;
};

type TemplateRecord = {
  id: string;
  name: string;
  modelId: string;
  systemPrompt?: string | null;
  userPrompt: string;
  settings: HarnessInferenceSettings;
  updatedAt: string;
};

const defaultSettings: Required<HarnessInferenceSettings> = {
  temperature: 0.2,
  topP: 0.9,
  maxTokens: 800,
  stopSequences: [],
};

export function PromptLab() {
  const [config, setConfig] = useState<AppConfig>({
    awsRegion: "eu-west-1",
    defaultModelId: "",
    modelIds: [],
  });
  const [modelId, setModelId] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(
    "You are concise, practical, and precise.",
  );
  const [userPrompt, setUserPrompt] = useState(
    "Write a three-bullet launch checklist for a Bedrock prompt lab.",
  );
  const [settings, setSettings] =
    useState<Required<HarnessInferenceSettings>>(defaultSettings);
  const [templateName, setTemplateName] = useState("Launch checklist");
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [latestRun, setLatestRun] = useState<RunRecord | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    const [configResponse, runsResponse, templatesResponse] = await Promise.all([
      fetch("/api/config"),
      fetch("/api/runs"),
      fetch("/api/templates"),
    ]);
    const nextConfig = (await configResponse.json()) as AppConfig;
    const runsPayload = (await runsResponse.json()) as { runs: RunRecord[] };
    const templatesPayload = (await templatesResponse.json()) as {
      templates: TemplateRecord[];
    };

    setConfig(nextConfig);
    setModelId((current) => current || nextConfig.defaultModelId);
    setRuns(runsPayload.runs);
    setTemplates(templatesPayload.templates);
    setLatestRun((current) => current ?? runsPayload.runs[0] ?? null);
  }

  async function runPrompt() {
    setIsRunning(true);
    setNotice(null);

    const response = await fetch("/api/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload()),
    });
    const payload = (await response.json()) as { run?: RunRecord; error?: string };

    if (payload.run) {
      setLatestRun(payload.run);
      setRuns((current) => [payload.run as RunRecord, ...current]);
      setNotice(payload.run.error ? payload.run.error : "Run saved.");
    } else {
      setNotice(payload.error || "Run failed.");
    }

    setIsRunning(false);
  }

  async function saveTemplate() {
    setNotice(null);
    const response = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...buildPayload(), name: templateName }),
    });
    const payload = (await response.json()) as {
      template?: TemplateRecord;
      error?: string;
    };

    if (payload.template) {
      setTemplates((current) => [payload.template as TemplateRecord, ...current]);
      setNotice("Template saved.");
    } else {
      setNotice(payload.error || "Template save failed.");
    }
  }

  function buildPayload() {
    return {
      modelId,
      systemPrompt,
      userPrompt,
      settings: {
        ...settings,
        stopSequences: settings.stopSequences.filter(Boolean),
      },
    };
  }

  function applyTemplate(template: TemplateRecord) {
    setTemplateName(template.name);
    setModelId(template.modelId);
    setSystemPrompt(template.systemPrompt ?? "");
    setUserPrompt(template.userPrompt);
    setSettings({ ...defaultSettings, ...template.settings });
    setNotice(`Loaded template: ${template.name}`);
  }

  function duplicateRun(run: RunRecord) {
    setModelId(run.modelId);
    setSystemPrompt(run.systemPrompt ?? "");
    setUserPrompt(run.userPrompt);
    setSettings({ ...defaultSettings, ...run.settings });
    setLatestRun(run);
    setNotice("Run duplicated into editor.");
  }

  function toggleCompare(id: string) {
    setCompareIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      return [id, ...current].slice(0, 2);
    });
  }

  function clearEditor() {
    setSystemPrompt("");
    setUserPrompt("");
    setSettings(defaultSettings);
    setTemplateName("");
    setNotice("Editor cleared.");
  }

  const compareRuns = useMemo(
    () => compareIds.map((id) => runs.find((run) => run.id === id)).filter(Boolean),
    [compareIds, runs],
  ) as RunRecord[];

  return (
    <main className="min-h-screen px-4 py-5 text-ink sm:px-5 lg:px-6">
      <div className="mx-auto grid max-w-[1680px] gap-4 xl:grid-cols-[320px_minmax(0,1fr)_420px]">
        <aside className="space-y-4">
          <section className="rounded-lg border border-line bg-white/85 p-4 shadow-panel">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold">AI Harness</h1>
                <p className="text-sm text-ink/65">{config.awsRegion} Bedrock lab</p>
              </div>
              <span className="rounded-full bg-mint px-3 py-1 text-xs font-medium text-moss">
                Local
              </span>
            </div>
            <div className="rounded-md border border-line bg-paper p-3 text-xs text-ink/70">
              Max {settings.maxTokens} tokens, temperature {settings.temperature},
              topP {settings.topP}
            </div>
          </section>

          <section className="rounded-lg border border-line bg-white/85 p-4 shadow-panel">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/60">
              Templates
            </h2>
            <div className="space-y-2">
              {templates.length === 0 ? (
                <EmptyState label="No templates yet" />
              ) : (
                templates.map((template) => (
                  <button
                    className="w-full rounded-md border border-line bg-white p-3 text-left transition hover:border-moss hover:bg-mint/40"
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                    type="button"
                  >
                    <span className="block text-sm font-medium">{template.name}</span>
                    <span className="mt-1 block truncate text-xs text-ink/55">
                      {template.modelId}
                    </span>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="rounded-lg border border-line bg-white/85 p-4 shadow-panel">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/60">
              Recent Runs
            </h2>
            <div className="max-h-[520px] space-y-2 overflow-auto pr-1">
              {runs.length === 0 ? (
                <EmptyState label="Run history will appear here" />
              ) : (
                runs.map((run) => (
                  <div
                    className="rounded-md border border-line bg-white p-3"
                    key={run.id}
                  >
                    <button
                      className="w-full text-left"
                      onClick={() => setLatestRun(run)}
                      type="button"
                    >
                      <span className="block truncate text-sm font-medium">
                        {run.userPrompt}
                      </span>
                      <span className="mt-1 block text-xs text-ink/55">
                        {new Date(run.createdAt).toLocaleString()} ·{" "}
                        {run.error ? "failed" : `${run.latencyMs}ms`}
                      </span>
                    </button>
                    <div className="mt-3 flex gap-2">
                      <IconButton
                        label="Duplicate run"
                        onClick={() => duplicateRun(run)}
                      >
                        <CopyPlus size={16} />
                      </IconButton>
                      <IconButton
                        active={compareIds.includes(run.id)}
                        label="Compare run"
                        onClick={() => toggleCompare(run.id)}
                      >
                        <GitCompareArrows size={16} />
                      </IconButton>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>

        <section className="rounded-lg border border-line bg-white/90 p-4 shadow-panel">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Model</span>
              <select
                className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none focus:border-moss"
                onChange={(event) => setModelId(event.target.value)}
                value={modelId}
              >
                {config.modelIds.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Template name</span>
              <input
                className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none focus:border-moss"
                onChange={(event) => setTemplateName(event.target.value)}
                value={templateName}
              />
            </label>
          </div>

          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-medium">System prompt</span>
            <textarea
              className="min-h-28 w-full rounded-md border border-line bg-white p-3 outline-none focus:border-moss"
              onChange={(event) => setSystemPrompt(event.target.value)}
              value={systemPrompt}
            />
          </label>

          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-medium">User prompt</span>
            <textarea
              className="min-h-56 w-full rounded-md border border-line bg-white p-3 outline-none focus:border-moss"
              onChange={(event) => setUserPrompt(event.target.value)}
              value={userPrompt}
            />
          </label>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <NumberField
              label="Temperature"
              max={1}
              min={0}
              onChange={(temperature) =>
                setSettings((current) => ({ ...current, temperature }))
              }
              step={0.1}
              value={settings.temperature}
            />
            <NumberField
              label="Top P"
              max={1}
              min={0}
              onChange={(topP) => setSettings((current) => ({ ...current, topP }))}
              step={0.05}
              value={settings.topP}
            />
            <NumberField
              label="Max tokens"
              max={4096}
              min={1}
              onChange={(maxTokens) =>
                setSettings((current) => ({ ...current, maxTokens }))
              }
              step={1}
              value={settings.maxTokens}
            />
          </div>

          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-medium">
              Stop sequences, one per line
            </span>
            <textarea
              className="min-h-20 w-full rounded-md border border-line bg-white p-3 outline-none focus:border-moss"
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  stopSequences: event.target.value.split("\n"),
                }))
              }
              value={settings.stopSequences.join("\n")}
            />
          </label>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              className="inline-flex h-11 items-center gap-2 rounded-md bg-moss px-4 font-medium text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isRunning || !userPrompt.trim() || !modelId}
              onClick={runPrompt}
              type="button"
            >
              {isRunning ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
              Run
            </button>
            <button
              className="inline-flex h-11 items-center gap-2 rounded-md border border-line bg-white px-4 font-medium transition hover:border-moss"
              onClick={saveTemplate}
              type="button"
            >
              <Save size={18} />
              Save
            </button>
            <button
              className="inline-flex h-11 items-center gap-2 rounded-md border border-line bg-white px-4 font-medium transition hover:border-clay"
              onClick={clearEditor}
              type="button"
            >
              <Eraser size={18} />
              Clear
            </button>
            {notice ? <p className="text-sm text-ink/65">{notice}</p> : null}
          </div>
        </section>

        <aside className="space-y-4">
          <OutputPanel run={latestRun} />
          <ComparePanel runs={compareRuns} />
        </aside>
      </div>
    </main>
  );
}

function NumberField({
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value?: number;
}) {
  return (
    <label className="block rounded-md border border-line bg-paper p-3">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <input
        className="w-full accent-moss"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
      <input
        className="mt-2 h-9 w-full rounded-md border border-line bg-white px-2 text-sm outline-none focus:border-moss"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="number"
        value={value}
      />
    </label>
  );
}

function OutputPanel({ run }: { run: RunRecord | null }) {
  return (
    <section className="rounded-lg border border-line bg-white/90 p-4 shadow-panel">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/60">
        Latest Output
      </h2>
      {!run ? (
        <EmptyState label="Run a prompt to see output" />
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs text-ink/60">
            <span>{run.modelId}</span>
            <span className="text-right">{run.latencyMs}ms</span>
            <span>
              {run.usage?.totalTokens
                ? `${run.usage.totalTokens} tokens`
                : "tokens unavailable"}
            </span>
            <span className="text-right">
              {new Date(run.createdAt).toLocaleTimeString()}
            </span>
          </div>
          {run.error ? (
            <pre className="max-h-[520px] whitespace-pre-wrap rounded-md border border-clay/40 bg-clay/10 p-3 text-sm text-clay">
              {run.error}
            </pre>
          ) : (
            <pre className="max-h-[520px] whitespace-pre-wrap rounded-md border border-line bg-paper p-3 text-sm leading-6">
              {run.output}
            </pre>
          )}
        </div>
      )}
    </section>
  );
}

function ComparePanel({ runs }: { runs: RunRecord[] }) {
  return (
    <section className="rounded-lg border border-line bg-white/90 p-4 shadow-panel">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/60">
        Compare
      </h2>
      {runs.length < 2 ? (
        <EmptyState label="Select two runs with the compare button" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          {runs.map((run) => (
            <article className="rounded-md border border-line bg-paper p-3" key={run.id}>
              <div className="mb-2 text-xs text-ink/55">
                {new Date(run.createdAt).toLocaleString()}
              </div>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <dt className="text-ink/55">Model</dt>
                <dd className="truncate text-right">{run.modelId}</dd>
                <dt className="text-ink/55">Latency</dt>
                <dd className="text-right">{run.latencyMs}ms</dd>
                <dt className="text-ink/55">Tokens</dt>
                <dd className="text-right">{run.usage?.totalTokens ?? "n/a"}</dd>
              </dl>
              <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-white p-3 text-xs leading-5">
                {run.error || run.output}
              </pre>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function IconButton({
  active,
  children,
  label,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border transition ${
        active
          ? "border-moss bg-mint text-moss"
          : "border-line bg-paper text-ink/70 hover:border-moss"
      }`}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-dashed border-line bg-paper p-4 text-sm text-ink/55">
      {label}
    </div>
  );
}
