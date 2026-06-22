"use client";

import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Code2,
  Copy,
  Github,
  History,
  Layers3,
  Play,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
} from "lucide-react";

const models = [
  {
    id: "nova-lite",
    label: "Nova Lite",
    provider: "Amazon",
    latency: "842ms",
    tokens: "318",
    output:
      "Start with one measurable workflow, capture a baseline, and treat every prompt change like a code change: version it, run it, compare it.",
  },
  {
    id: "claude-haiku",
    label: "Claude Haiku",
    provider: "Anthropic",
    latency: "1.2s",
    tokens: "284",
    output:
      "Choose a narrow task, define success before prompting, then preserve the prompt, settings, response, latency, and token usage as one repeatable run.",
  },
  {
    id: "claude-sonnet",
    label: "Claude Sonnet",
    provider: "Anthropic",
    latency: "2.1s",
    tokens: "426",
    output:
      "A reliable AI workflow begins with an explicit evaluation target. Keep the prompt and inference settings reproducible, compare outputs side by side, and only promote changes that improve the target.",
  },
];

const commands = [
  {
    command: "ai-harness doctor",
    note: "Validate AWS identity and configuration without invoking a model.",
  },
  {
    command: 'ai-harness run "Review this API design"',
    note: "Run Bedrock locally and save the complete result.",
  },
  {
    command: "ai-harness history",
    note: "Inspect recent runs, model settings, tokens, and status.",
  },
  {
    command: "ai-harness compare 42ad08e1 c7b191ac",
    note: "Compare two saved runs without leaving the terminal.",
  },
];

export function Showcase() {
  const [activeModel, setActiveModel] = useState(models[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(true);
  const [copied, setCopied] = useState(false);

  function runDemo() {
    setIsRunning(true);
    setHasRun(false);
    window.setTimeout(() => {
      setIsRunning(false);
      setHasRun(true);
    }, 850);
  }

  async function copyInstall() {
    await navigator.clipboard.writeText("npm install && npm run build:cli");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main>
      <div className="safe-mode-banner">
        <ShieldCheck size={15} />
        <span>
          Public demo runs on mock data. Live AWS access is intentionally disabled
          to prevent cloud charges.
        </span>
      </div>

      <nav className="site-nav">
        <a className="brand" href="#top">
          <span className="brand-mark">AH</span>
          <span>AI Harness</span>
        </a>
        <div className="nav-links">
          <a href="#workflow">Workflow</a>
          <a href="#cli">CLI</a>
          <a
            className="github-link"
            href="https://github.com/Abdul-Burale/ai-harness"
            rel="noreferrer"
            target="_blank"
          >
            <Github size={17} />
            GitHub
          </a>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow">
            <TerminalSquare size={16} />
            Local-first Bedrock tooling
          </div>
          <h1>
            AI Harness
            <span>Prompt work should feel like engineering.</span>
          </h1>
          <p className="hero-lede">
            Run AWS Bedrock prompts from your terminal. Save the evidence. Compare
            the result. Keep credentials and cloud spend under your control.
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="#cli">
              Explore the CLI
              <ArrowRight size={18} />
            </a>
            <a
              className="text-action"
              href="https://github.com/Abdul-Burale/ai-harness"
              rel="noreferrer"
              target="_blank"
            >
              View source
              <Github size={17} />
            </a>
          </div>
        </div>

        <div className="hero-stat-row" aria-label="Project characteristics">
          <div>
            <strong>Local</strong>
            <span>credentials stay on your machine</span>
          </div>
          <div>
            <strong>Repeatable</strong>
            <span>prompts, settings, usage, output</span>
          </div>
          <div>
            <strong>Cost-aware</strong>
            <span>no public model endpoint</span>
          </div>
        </div>
      </section>

      <section className="demo-section" id="workflow">
        <div className="section-heading">
          <div>
            <span className="section-number">01</span>
            <p className="section-kicker">Interactive product preview</p>
          </div>
          <h2>One prompt. Three models. A decision you can explain.</h2>
        </div>

        <div className="demo-shell">
          <div className="demo-topbar">
            <div className="window-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <span className="demo-file">launch-review.prompt</span>
            <span className="demo-status">
              <span />
              DEMO DATA
            </span>
          </div>

          <div className="demo-grid">
            <div className="model-rail">
              <p className="rail-label">Model target</p>
              {models.map((model) => (
                <button
                  className={model.id === activeModel.id ? "model active" : "model"}
                  key={model.id}
                  onClick={() => {
                    setActiveModel(model);
                    setHasRun(true);
                  }}
                  type="button"
                >
                  <span className="model-icon">{model.label.slice(0, 1)}</span>
                  <span>
                    <strong>{model.label}</strong>
                    <small>{model.provider}</small>
                  </span>
                  <ChevronRight size={16} />
                </button>
              ))}
              <div className="rail-note">
                <CircleDollarSign size={17} />
                <p>
                  <strong>Public execution off</strong>
                  No AWS request is made from this site.
                </p>
              </div>
            </div>

            <div className="prompt-pane">
              <div className="pane-heading">
                <span>Prompt</span>
                <span className="saved-state">
                  <Check size={13} />
                  saved locally
                </span>
              </div>
              <div className="system-prompt">
                <span>SYSTEM</span>
                You are a precise technical reviewer. Prefer concrete advice.
              </div>
              <div className="user-prompt">
                <span>USER</span>
                What makes an AI workflow reliable enough for a production team?
              </div>
              <div className="settings-row">
                <span>temperature <strong>0.2</strong></span>
                <span>top-p <strong>0.9</strong></span>
                <span>max tokens <strong>800</strong></span>
              </div>
              <button
                className="run-button"
                disabled={isRunning}
                onClick={runDemo}
                type="button"
              >
                <Play size={16} fill="currentColor" />
                {isRunning ? "Running demo..." : "Run demo"}
              </button>
            </div>

            <div className="output-pane">
              <div className="pane-heading">
                <span>Output</span>
                <span>{activeModel.label}</span>
              </div>
              <div className={hasRun ? "output-copy visible" : "output-copy"}>
                {isRunning ? (
                  <div className="output-loading">
                    <span />
                    <span />
                    <span />
                  </div>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <p>{activeModel.output}</p>
                  </>
                )}
              </div>
              <div className="output-metrics">
                <span>
                  <Clock3 size={14} />
                  {activeModel.latency}
                </span>
                <span>{activeModel.tokens} tokens</span>
                <span className="complete-dot">complete</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="principles">
        <article>
          <History size={22} />
          <span>01</span>
          <h3>Every run leaves a trail</h3>
          <p>
            Prompt, model, settings, output, token usage, latency, and errors are
            stored together on your machine.
          </p>
        </article>
        <article>
          <Layers3 size={22} />
          <span>02</span>
          <h3>Comparisons over hunches</h3>
          <p>
            Put two runs side by side and see exactly what changed before choosing
            the next prompt or model.
          </p>
        </article>
        <article>
          <ShieldCheck size={22} />
          <span>03</span>
          <h3>Your credentials stay yours</h3>
          <p>
            Bedrock calls happen from the local CLI through the standard AWS
            credential chain, never through the public demo.
          </p>
        </article>
      </section>

      <section className="cli-section" id="cli">
        <div className="cli-copy">
          <span className="section-number">02</span>
          <p className="section-kicker">The actual product</p>
          <h2>A focused CLI for the work between &quot;try this&quot; and &quot;ship it.&quot;</h2>
          <p>
            The website is the guided tour. The command line is where AI Harness
            does real work against your Bedrock account.
          </p>
          <button className="install-command" onClick={copyInstall} type="button">
            <code>npm install &amp;&amp; npm run build:cli</code>
            {copied ? <Check size={17} /> : <Copy size={17} />}
          </button>
          <a
            className="docs-link"
            href="https://github.com/Abdul-Burale/ai-harness#readme"
            rel="noreferrer"
            target="_blank"
          >
            Read the setup guide
            <ArrowRight size={17} />
          </a>
        </div>

        <div className="terminal-window">
          <div className="terminal-bar">
            <span>ai-harness - zsh</span>
            <Code2 size={16} />
          </div>
          <div className="terminal-body">
            {commands.map((item, index) => (
              <div className="terminal-line" key={item.command}>
                <div>
                  <span className="prompt-symbol">&gt;</span>
                  <code>{item.command}</code>
                </div>
                <p>{item.note}</p>
                {index === 0 ? (
                  <div className="doctor-output">
                    <span><Check size={13} /> Local configuration loaded</span>
                    <span><Check size={13} /> AWS credentials are valid</span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="architecture-section">
        <div className="section-heading compact">
          <div>
            <span className="section-number">03</span>
            <p className="section-kicker">Deliberately simple</p>
          </div>
          <h2>The public surface and the private execution path never meet.</h2>
        </div>
        <div className="architecture-flow">
          <div>
            <span>STATIC SITE</span>
            <strong>Netlify demo</strong>
            <small>mocked interaction, zero secrets</small>
          </div>
          <ArrowRight />
          <div className="flow-separator">
            <ShieldCheck />
            <span>separated by design</span>
          </div>
          <ArrowRight />
          <div>
            <span>LOCAL CLI</span>
            <strong>Your machine</strong>
            <small>AWS credentials + local history</small>
          </div>
          <ArrowRight />
          <div className="aws-node">
            <span>MODEL RUNTIME</span>
            <strong>AWS Bedrock</strong>
            <small>invoked only by you</small>
          </div>
        </div>
      </section>

      <footer>
        <div>
          <span className="brand-mark">AH</span>
          <p>
            Built by Abdihakim Burale as a local-first experiment in responsible
            AI tooling.
          </p>
        </div>
        <div className="footer-links">
          <a
            href="https://github.com/Abdul-Burale/ai-harness"
            rel="noreferrer"
            target="_blank"
          >
            Source
          </a>
          <a href="#top">Back to top</a>
        </div>
      </footer>
    </main>
  );
}
