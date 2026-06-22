# AI Harness Documentation

AI Harness is a local-first command-line tool for running and comparing AWS Bedrock prompts. Its public website is a separate static product demo that never calls AWS.

## Design Goals

The project is built around four constraints:

- AWS credentials must never be shipped to the browser.
- A public portfolio deployment must not create model inference charges.
- Prompt experiments should be reproducible and inspectable.
- The CLI should work without a database server or account system.

The resulting split is intentional:

```text
Static website                          Local CLI
--------------                          ---------
Netlify-hosted                          Runs on the user's machine
Mock interaction                        Real Bedrock Converse calls
No secrets                              Standard AWS credential chain
No persistence                          Local JSON history and templates
No cloud runtime                        Explicit model invocation only
```

## Project Structure

- `src/cli/index.ts` defines the CLI commands and options.
- `src/cli/store.ts` provides atomic local persistence.
- `src/cli/aws.ts` handles AWS identity checks and optional model discovery.
- `src/lib/bedrock.ts` maps requests to Bedrock `Converse`.
- `src/lib/validation.ts` validates prompt and inference settings.
- `src/components/showcase.tsx` implements the static interactive website.
- `netlify.toml` configures the static Netlify build.

## Installation

Clone and install:

```bash
git clone https://github.com/Abdul-Burale/ai-harness.git
cd ai-harness
npm install
cp .env.example .env
```

Build the CLI:

```bash
npm run build:cli
```

Run it from the repository:

```bash
npm run cli -- --help
```

Optionally link the package while developing:

```bash
npm link
ai-harness --help
```

## AWS Configuration

The CLI uses the standard AWS SDK credential chain. Supported approaches include:

- `AWS_PROFILE` pointing to a local AWS profile.
- AWS SSO credentials.
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and optional session token.
- An IAM role when running in an AWS-managed environment.

Example `.env`:

```bash
AWS_REGION="eu-west-1"
AWS_PROFILE="your-profile"
DEFAULT_BEDROCK_MODEL_ID="amazon.nova-lite-v1:0"
BEDROCK_MODEL_IDS="amazon.nova-lite-v1:0,anthropic.claude-3-haiku-20240307-v1:0"
```

The IAM identity needs `bedrock:InvokeModel` for normal prompt runs. Future streaming support will require `bedrock:InvokeModelWithResponseStream`.

Model access must also be enabled for the selected model in the AWS Bedrock console and region.

## Command Reference

### `doctor`

Checks local configuration and calls AWS STS to verify the current identity. It does not invoke a foundation model.

```bash
ai-harness doctor
```

### `models`

Lists the model IDs configured in `BEDROCK_MODEL_IDS` without contacting AWS:

```bash
ai-harness models
```

Use `--live` to query the Bedrock foundation model catalogue:

```bash
ai-harness models --live
ai-harness models --live --json
```

### `run`

Runs a prompt through Bedrock `Converse` and stores the result:

```bash
ai-harness run "Review this API design"
```

Common options:

```text
-f, --file <path>          Read the prompt from a file
-t, --template <name>      Run a saved template
-m, --model <id>           Choose a Bedrock model
-s, --system <text>        Set the system prompt
--temperature <number>     Value from 0 to 1
--top-p <number>           Value from 0 to 1
--max-tokens <number>      Value from 1 to 4096
--json                     Print JSON output
```

Failed calls are also saved. This preserves useful IAM, region, credential, and model-access errors in local history.

### `history`

Shows recent runs:

```bash
ai-harness history
ai-harness history --limit 25
ai-harness history --json
```

### `show`

Shows a saved run using its full ID or a unique ID prefix:

```bash
ai-harness show 42ad08e1
```

### `compare`

Displays settings, usage, latency, status, and output for two saved runs:

```bash
ai-harness compare 42ad08e1 c7b191ac
```

### `templates`

Create or update a named template:

```bash
ai-harness templates save review "Review this API design" \
  --model amazon.nova-lite-v1:0 \
  --system "You are a precise technical reviewer."
```

List templates:

```bash
ai-harness templates list
```

Run a template:

```bash
ai-harness run --template review
```

## Local Persistence

By default, data is stored at:

```text
~/.ai-harness/store.json
```

The store contains:

- Up to 500 recent runs.
- Reusable named templates.
- Prompt and system prompt snapshots.
- Model and inference settings.
- Model output, usage, latency, and errors.

Writes use a temporary file followed by an atomic rename to reduce the chance of partial or corrupt data.

Override the path for automation or isolated environments:

```bash
AI_HARNESS_STORE="/tmp/harness-store.json" ai-harness history
```

## Public Website

The website is a static Next.js export. It presents an interactive mock workflow and clearly identifies itself as demo data.

Run locally:

```bash
npm run dev
```

Build:

```bash
npm run build:web
```

The result is written to `out/`. The Netlify configuration publishes that directory and does not require AWS or database environment variables.

Do not add AWS credentials to the Netlify site. Real execution belongs in the local CLI.

## Testing

Run all tests:

```bash
npm test
```

Build both products:

```bash
npm run build
```

Current automated coverage includes:

- Bedrock request mapping.
- Bedrock response normalization.
- Input validation and limits.
- Local run persistence.
- Template update behavior.
- Run lookup by short ID.

## Cost and Security Model

The public website cannot invoke a model, so normal visitors cannot generate Bedrock charges.

The CLI only makes chargeable inference calls when the user runs `ai-harness run`. `doctor` uses AWS STS, `models` is local by default, and `models --live` uses the Bedrock control plane rather than model inference.

AWS credentials are resolved locally by the AWS SDK and are never written to the AI Harness store.

## Troubleshooting

If `doctor` cannot verify AWS:

```bash
aws sts get-caller-identity
```

Check the selected profile, SSO session, region, and IAM permissions.

If a model run fails:

- Confirm model access in the Bedrock console.
- Confirm the model is available in `AWS_REGION`.
- Confirm `bedrock:InvokeModel` is allowed.
- Run `ai-harness models --live` to inspect available on-demand text models.
- Run `ai-harness history` to find the saved error.

If the static site build fails:

```bash
npm install
npm run build:web
```

If the CLI bundle fails:

```bash
npm run build:cli
node dist/cli.mjs --help
```
