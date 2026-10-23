# C25 · Production Monitoring, Audit Logs and Telemetry

Projects authored request observations into local audit records; it is not a production immutable log service. Each run starts from a fresh local seed. The run journal stores results, not production workflow state.

## Concepts students will learn

- Redacted audit projection
- Append before checkpoint advancement
- Do not double count usage

## Configure and run

Use Node.js 24 or later. In PowerShell, from this repository's folder:

```powershell
node --version
npm ci
Copy-Item .env.example .env
notepad .env
```

No API key is required for the local experiment. Optional live commentary requires your own API key, agent ID and environment ID. It explains the local result; it does not activate the integration discussed in the lesson.

For the optional live path, set your API key, then run npm run setup if you do not already have resource IDs. The script creates the environment before a text-only agent, saves each ID immediately, and reuses IDs already configured. It uses CLAUDE_MODEL or the source default; choose a model available to your account. An uncertain network failure may have created a resource: inspect your account before retrying.

```powershell
npm start
```

Open `http://127.0.0.1:3025`. Navigation leads to `/guide.html#learning`, `/guide.html#run-guide`, `/architecture.html`, and the application lab. If you change `PORT`, use the configured port. Keep the terminal running; stop with Ctrl+C. `npm run dev` also starts the web application.

Select the first scenario, inspect its editable fields, press Run experiment, and compare the outcome and evidence with the table above. Select another scenario to investigate the boundary condition.

## Create your .env file

Copy `.env.example` to `.env` and enter your own values. Do not commit the real file. Restart the server after editing it. The example contains safe placeholders; optional settings may be left blank to use source defaults. Resource IDs and keys stay on the server.

```dotenv
ANTHROPIC_API_KEY=your_api_key
CLAUDE_MANAGED_AGENT_ID=your_agent_id
CLAUDE_MANAGED_ENVIRONMENT_ID=your_environment_id
PORT=3025
```

## How the app was build

### 1. Preserve unavailable usage as unknown

Negative counters stand for missing usage. The result is incomplete with null counters rather than silently reporting zero consumption.

Source: [src/lesson.ts](src/lesson.ts#L13) · selected statements

```typescript
const i = number(input, "inputTokens"),
  o = number(input, "outputTokens");

if (i < 0 || o < 0)
  return report(
    "incomplete",
    "Provider usage was unavailable",
    { inputTokens: null, outputTokens: null },
    ["Retain missing counters as unknown"],
  );
```

### 2. Append a redacted projection before marking seen

Repeated delivery shares one event ID. The loop appends only approved usage fields to audit, then marks that ID handled, so duplicates cannot double-count this observation.

Source: [src/lesson.ts](src/lesson.ts#L15) · selected statements

```typescript
const event = {
  id: "usage-1",
  type: "span.model_request_end",
  inputTokens: i,
  outputTokens: o,
};

const delivered = flag(input, "duplicateDelivery") ? [event, event] : [event],
  seen = new Set<string>(),
  audit: Input[] = [];

for (const e of delivered) {
  if (seen.has(e.id)) continue;
  audit.push({
    eventId: e.id,
    type: e.type,
    inputTokens: e.inputTokens,
    outputTokens: e.outputTokens,
  });
  seen.add(e.id);
}
```

### 3. Keep the coverage boundary visible

The report includes the usage projection and labels its authored request window. It does not store prompt or credential text, or add cumulative session snapshots to request usage.

Source: [src/lesson.ts](src/lesson.ts#L18)

```typescript
return report(
  "passed",
  "Projected usage once without storing raw prompt or credential text",
  {
    inputTokens: i,
    outputTokens: o,
    audit,
    rawSecretLogged: false,
    coverage: "authored request window",
  },
  [
    "Project only approved audit fields",
    "Append the projection before marking seen",
    "Keep cumulative snapshots separate from request spans",
  ],
);
```

### Check your understanding

Run **Project and deduplicate usage** in the application. Compare the result with these scenario expectations:

```json
{
  "input": {
    "inputTokens": 120,
    "outputTokens": 30,
    "duplicateDelivery": true,
    "includeSecret": "example-untrusted-value"
  },
  "expectedOutcome": "passed",
  "checkEvidence": {
    "inputTokens": 120,
    "outputTokens": 30
  }
}
```

Then try **Missing usage is unknown**. Its expected outcome is `incomplete`; identify the condition or evidence field that explains the difference.

## Validation

```powershell
npm test
python scripts/verify-walkthrough.py
```

The source hash check detects when walkthrough excerpts need refreshing. Browser verification covers page navigation, readable text, mobile layout, dark mode, diagram and image routes. Local scenarios and live provider calls are recorded separately in the workspace verification report; local success is not evidence of a live provider operation.

## Repository contents

Application sources, student web pages, safe configuration example and documentation images are included. `node_modules`, `presentation`, `output`, `reviewed`, `v3`, `teaching-material`, build output, local journals, credentials and local resource files are ignored. Existing teaching videos and presentations remain in the original workspace.
