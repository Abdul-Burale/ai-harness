# AI Harness Documentation

AI Harness is a personal Prompt Lab for AWS Bedrock. It runs locally, keeps AWS credentials on the server, saves prompt templates and run history in SQLite, and provides a clean path to a later AWS deployment.

## Architecture

The app is a Next.js TypeScript project using the App Router.

- `src/app/page.tsx` renders the Prompt Lab as the first screen.
- `src/components/prompt-lab.tsx` contains the client-side editor, template list, run history, output panel, and comparison UI.
- `src/app/api/*` contains server-side API routes for config, runs, run details, and templates.
- `src/lib/bedrock.ts` wraps AWS Bedrock Runtime and maps internal run requests to the Bedrock `Converse` API.
- `src/lib/validation.ts` validates prompt and inference settings before any Bedrock call.
- `src/lib/prisma.ts` owns the Prisma client singleton.
- `prisma/schema.prisma` defines the local SQLite persistence model.

The browser never receives AWS credentials. All Bedrock calls happen inside server-side API routes.

## Local Setup

Install dependencies:

```bash
npm install
```

Create local environment config:

```bash
cp .env.example .env
```

Generate Prisma and create the SQLite database:

```bash
npm run db:generate
npm run db:push
```

Start the local app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment Variables

The app reads these values from `.env`:

```bash
DATABASE_URL="file:./dev.db"
AWS_REGION="eu-west-1"
AWS_PROFILE="your-profile"
DEFAULT_BEDROCK_MODEL_ID="anthropic.claude-3-haiku-20240307-v1:0"
BEDROCK_MODEL_IDS="anthropic.claude-3-haiku-20240307-v1:0,anthropic.claude-3-5-sonnet-20240620-v1:0,amazon.nova-lite-v1:0"
```

`AWS_PROFILE` is optional if your AWS credentials are available through another standard AWS SDK mechanism, such as SSO or environment variables.

## AWS Bedrock Setup

Use an AWS account with Bedrock available in `eu-west-1`.

In the AWS console:

1. Open Amazon Bedrock.
2. Go to model access.
3. Enable access for the model configured as `DEFAULT_BEDROCK_MODEL_ID`.
4. Confirm the same model ID appears in `BEDROCK_MODEL_IDS` if you want it in the UI selector.

The local AWS identity needs:

```text
bedrock:InvokeModel
bedrock:InvokeModelWithResponseStream
bedrock:ListFoundationModels
```

`bedrock:ListFoundationModels` is optional for the current app, but useful for future model discovery.

## Data Model

`PromptTemplate` stores reusable prompt setups:

- `name`
- `systemPrompt`
- `userPrompt`
- `modelId`
- `settings`
- timestamps

`Run` stores every prompt execution attempt:

- prompt snapshot
- model ID
- inference settings
- output text
- usage metadata when Bedrock returns it
- latency
- raw response
- error message if the request failed
- created timestamp

Failed Bedrock calls are intentionally saved. This makes IAM, model access, region, and validation problems visible in run history.

## API Routes

`GET /api/config`

Returns region, default model ID, and configured model IDs for the UI.

`GET /api/runs`

Returns the 50 most recent runs.

`POST /api/runs`

Validates the request, calls Bedrock `Converse`, saves the result, and returns the saved run. If Bedrock fails, saves a failed run and returns status `502`.

Request shape:

```ts
{
  modelId: string;
  systemPrompt?: string;
  userPrompt: string;
  settings: {
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    stopSequences?: string[];
  };
}
```

`GET /api/runs/:id`

Returns one saved run by ID.

`GET /api/templates`

Returns saved prompt templates.

`POST /api/templates`

Saves a reusable prompt template.

## Prompt Lab Workflow

Use the center editor to configure:

- model ID
- system prompt
- user prompt
- temperature
- topP
- max tokens
- stop sequences

Use the left panel to:

- load saved templates
- inspect recent runs
- duplicate a previous run into the editor
- select two runs for comparison

Use the right panel to:

- inspect the latest output
- view latency and token usage
- compare two selected runs

## Testing

Run:

```bash
npm test
```

Current tests cover:

- mapping internal request payloads to Bedrock `Converse` input
- normalizing Bedrock responses
- validating inference settings and prompt requests

Run a production build:

```bash
npm run build
```

## Manual Smoke Test

1. Confirm `.env` points to `eu-west-1`.
2. Confirm AWS credentials are available locally.
3. Confirm the configured Bedrock model is enabled in the AWS console.
4. Run `npm run dev`.
5. Open `http://localhost:3000`.
6. Submit a short prompt.
7. Confirm output appears in Latest Output.
8. Refresh the page.
9. Confirm the run remains in Recent Runs.

If the request fails, open the failed run in Recent Runs and read the captured error.

## Deployment Notes

V1 is optimized for local use. A later AWS deployment should keep the current boundaries:

- Keep Bedrock calls server-side.
- Replace SQLite with DynamoDB or another managed store.
- Use an IAM role instead of local AWS credentials.
- Move configuration into deployment environment variables or Secrets Manager.
- Keep the current API route shapes unless a production client needs a different contract.

Recommended AWS deployment options:

- AWS Amplify for a straightforward Next.js deployment.
- ECS or App Runner if you want more control over runtime and networking.
- DynamoDB for saved templates and run history.

## Troubleshooting

If the UI loads but runs fail:

- Check `AWS_REGION`.
- Check that the model is enabled in Bedrock model access.
- Check local AWS credentials with `aws sts get-caller-identity`.
- Check IAM permissions for Bedrock Runtime.
- Try a different model ID that is enabled in your account.

If Prisma fails to create the database:

```bash
npm run db:generate
npm run db:push
```

If dependencies are missing:

```bash
npm install
```
