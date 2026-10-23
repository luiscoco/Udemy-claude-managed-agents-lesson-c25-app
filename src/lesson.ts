import { text, number, flag, list, object, hash, report, unique, safePath, type Lesson, type Input } from "./core";

// A focused local experiment derived from this lesson’s reviewed presentation.
export const lesson: Lesson = {
  number: 25,
  title: "Production Monitoring, Audit Logs and Telemetry",
  description: "A production incident rarely becomes clear from the final answer alone. You need to know which configuration ran, which events were observed, how tool calls were evaluated, and what the run consumed.",
  concepts: ["Redacted audit projection", "Append before checkpoint advancement", "Do not double count usage"],
  scope: "Projects authored request observations into local audit records; it is not a production immutable log service. Each run starts from a fresh local seed. The run journal stores results, not production workflow state.",
  cases: [{"id": "0", "label": "Project and deduplicate usage", "input": {"inputTokens": 120, "outputTokens": 30, "duplicateDelivery": true, "includeSecret": "example-untrusted-value"}, "expected": "passed", "checks": {"inputTokens": 120, "outputTokens": 30}}, {"id": "1", "label": "Missing usage is unknown", "input": {"inputTokens": -1, "outputTokens": -1, "duplicateDelivery": false, "includeSecret": "do not log"}, "expected": "incomplete", "checks": {"inputTokens": null}}],
  async run(input) {

const i=number(input,"inputTokens"),o=number(input,"outputTokens");
if(i<0||o<0)return report("incomplete","Provider usage was unavailable",{inputTokens:null,outputTokens:null},["Retain missing counters as unknown"]);
const event={id:"usage-1",type:"span.model_request_end",inputTokens:i,outputTokens:o};
const delivered=flag(input,"duplicateDelivery")?[event,event]:[event], seen=new Set<string>(),audit:Input[]=[];
for(const e of delivered){if(seen.has(e.id))continue;audit.push({eventId:e.id,type:e.type,inputTokens:e.inputTokens,outputTokens:e.outputTokens});seen.add(e.id);}
return report("passed","Projected usage once without storing raw prompt or credential text",{inputTokens:i,outputTokens:o,audit,rawSecretLogged:false,coverage:"authored request window"},["Project only approved audit fields","Append the projection before marking seen","Keep cumulative snapshots separate from request spans"]);

  }
};
