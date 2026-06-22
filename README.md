# AI Harness

A personal AWS Bedrock Prompt Lab built with Next.js, TypeScript, Prisma, SQLite, and the AWS SDK v3.

Full project documentation lives in [docs/ai-harness.md](docs/ai-harness.md).

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create local environment config:

   ```bash
   cp .env.example .env
   ```

3. Edit `.env` if needed:

   ```bash
   DATABASE_URL="file:./dev.db"
   AWS_REGION="eu-west-1"
   AWS_PROFILE="your-profile"
   DEFAULT_BEDROCK_MODEL_ID="anthropic.claude-3-haiku-20240307-v1:0"
   ```

4. Generate Prisma and create the SQLite database:

   ```bash
   npm run db:generate
   npm run db:push
   ```

5. Start the app:

   ```bash
   npm run dev
   ```

The app runs at `http://localhost:3000`.

## AWS Bedrock prerequisites

- Use an AWS account with Bedrock available in `eu-west-1`.
- Enable model access in the Bedrock console for the model ID configured in `.env`.
- Use local AWS credentials through the normal AWS SDK credential chain, such as `AWS_PROFILE`, SSO, or environment variables.
- The IAM identity needs:
  - `bedrock:InvokeModel`
  - `bedrock:InvokeModelWithResponseStream`
  - optionally `bedrock:ListFoundationModels`

Credentials are only used from server-side API routes.

## Manual smoke test

1. Run `npm run dev`.
2. Open `http://localhost:3000`.
3. Keep the default prompt or enter a short prompt.
4. Click Run.
5. Confirm output appears in Latest Output.
6. Refresh the page and confirm the run remains in Recent Runs.

If the run fails, it is still saved with the Bedrock error so model access, region, and IAM issues are visible in the UI.

## Tests

```bash
npm test
```

The tests cover Bedrock request mapping, Bedrock response normalization, and server-side request validation without calling AWS.
