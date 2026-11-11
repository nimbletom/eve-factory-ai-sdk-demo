import { describe, expect, it } from "vitest";
import { streamSupportReply } from "../lib/chat";
import type { UsageReport } from "../lib/usage";
import { scriptedModel } from "./mock";

describe("streamSupportReply", () => {
  it("streams the reply and reports only the final step's usage", async () => {
    const model = scriptedModel([
      { toolCall: { toolName: "lookupOrder", input: { orderId: "A-1001" } }, input: 100, output: 10 },
      { text: "Order A-1001 has shipped.", input: 150, output: 40 },
    ]);
    const reports: UsageReport[] = [];
    const result = await streamSupportReply(
      [{ id: "m-1", role: "user", parts: [{ type: "text", text: "Where is order A-1001?" }] }],
      { model, onUsage: (report) => reports.push(report) },
    );
    expect(await result.text).toBe("Order A-1001 has shipped.");
    expect(reports).toHaveLength(1);
    expect(reports[0]).toEqual({
      inputTokens: 150,
      outputTokens: 40,
      cachedInputTokens: 0,
      reasoningTokens: 0,
    });
  });
});
