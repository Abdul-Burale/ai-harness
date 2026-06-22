# AI Harness

> A local-first AWS Bedrock prompt evaluation CLI with a static, cost-safe product demo.

[![Deployment](https://img.shields.io/badge/deployment-Netlify-00c7b7)](netlify.toml)
[![CI](https://github.com/Abdul-Burale/ai-harness/actions/workflows/ci.yml/badge.svg)](https://github.com/Abdul-Burale/ai-harness/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-4b63ff)](LICENSE)

AI Harness treats prompt work like engineering work: every run captures the prompt, model, inference settings, output, latency, token usage, and error state so experiments can be reproduced and compared.

The project has two deliberately separate surfaces:

- **CLI:** the real product. It runs locally with your AWS credentials and stores history on your machine.
- **Website:** a static interactive demo for Netlify. It uses mock data and contains no AWS credentials, model endpoint, or production database.

Live AWS execution is intentionally unavailable on the public site to prevent unwanted cloud charges.

## What It Does

- Run prompts against AWS Bedrock through the `Converse` API.
- Validate AWS credentials without invoking a model.
- Keep up to 500 local runs in `~/.ai-harness/store.json`.
- Save reusable prompt templates.
- Inspect and compare previous runs by ID.
- Print human-readable output or JSON for scripts.
- Query the Bedrock model catalogue only when explicitly requested.

## Quick Start

Requirements:

- Node.js 20 or newer
- An AWS account with Bedrock model access
- AWS credentials available through a profile, SSO, or environment variables

```bash
git clone https://github.com/Abdul-Burale/ai-harness.git
cd ai-harness
npm install
cp .env.example .env
npm run build:cli
```

Run the CLI from the repository:

```bash
npm run cli -- doctor
npm run cli -- models
npm run cli -- run "Explain this architecture in three bullets"
npm run cli -- history
```

Link the built command globally while developing:

```bash
npm link
ai-harness --help
```

## CLI Examples

Check configuration without invoking a model:

```bash
ai-harness doctor
```

Run and save a prompt:

```bash
ai-harness run "Review this API design" \
  --model amazon.nova-lite-v1:0 \
  --system "You are a precise technical reviewer." \
  --temperature 0.2 \
  --max-tokens 800
```

Use a prompt file or emit JSON:

```bash
ai-harness run --file prompts/review.txt --json
```

Save and reuse a template:

```bash
ai-harness templates save review "Review this API design" \
  --model amazon.nova-lite-v1:0

ai-harness run --template review
```

Inspect and compare runs:

```bash
ai-harness history
ai-harness show 42ad08e1
ai-harness compare 42ad08e1 c7b191ac
```

Configured model IDs come from `BEDROCK_MODEL_IDS`. Query AWS only when needed:

```bash
ai-harness models
ai-harness models --live
```

## Architecture

```text
Public internet                           Developer machine

Netlify static demo                      ai-harness CLI
mock data only                           local history + templates
no secrets                               AWS credential chain
      |                                         |
      X no runtime connection                   v
                                           AWS Bedrock
```

The static site can be deployed or shared safely without attaching AWS credentials. The CLI is the only execution path to Bedrock.

## Website Development

```bash
npm run dev
```

Open `http://localhost:3000`.

Build the static Netlify output:

```bash
npm run build:web
```

Netlify uses [netlify.toml](netlify.toml) and publishes the generated `out/` directory. No Netlify environment variables are required for the demo site.

## Environment

```bash
AWS_REGION="eu-west-1"
AWS_PROFILE="your-profile"
DEFAULT_BEDROCK_MODEL_ID="amazon.nova-lite-v1:0"
BEDROCK_MODEL_IDS="amazon.nova-lite-v1:0,anthropic.claude-3-haiku-20240307-v1:0"
```

`AWS_PROFILE` is optional if another standard AWS SDK credential source is configured. Set `AI_HARNESS_STORE` to override the default local store path.

## Verification

```bash
npm test
npm run build
```

Tests cover request validation, Bedrock request/response mapping, and atomic CLI persistence. The full build produces both `dist/cli.mjs` and the static `out/` website.

Detailed setup, command reference, security notes, and deployment guidance are in [docs/ai-harness.md](docs/ai-harness.md).

## Roadmap

- Streaming Bedrock responses
- Dataset-driven evaluation runs
- Custom scorers and regression thresholds
- Exportable run reports
- Additional model providers behind the same local interface
