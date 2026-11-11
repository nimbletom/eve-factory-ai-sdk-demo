import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import { streamSupportReply } from "../lib/chat";
import { scriptedModel } from "./mock";

const messages: UIMessage[] = [
  {
    id: "msg-1",
    role: "user",
    parts: [{ type: "text", text: "Where is order A-1001?" }],
  },
];

describe("streamSupportReply", () => {
  it("streams the answer after looking the order up", async () => {
    const model = scriptedModel([
      { toolCall: { toolName: "lookupOrder", input: { orderId: "A-1001" } }, input: 100, output: 10 },
      { text: "Order A-1001 has shipped.", input: 150, output: 40 },
    ]);
    const result = await streamSupportReply(messages, { model });
    let text = "";
    for await (const delta of result.textStream) text += delta;
    expect(text).toBe("Order A-1001 has shipped.");
  });

  it("reports only the final step's usage, not the aggregate", async () => {
    const model = scriptedModel([
      { toolCall: { toolName: "lookupOrder", input: { orderId: "A-1001" } }, input: 100, output: 10 },
      { text: "Order A-1001 has shipped.", input: 150, output: 40 },
    ]);
    let report: { inputTokens: number; outputTokens: number } | undefined;
    const result = await streamSupportReply(messages, {
      model,
      onUsage: (usage) => {
        report = usage;
      },
    });
    await result.consumeStream();
    // Final answer step only (150/40), not the aggregate across steps (250/50).
    expect(report).toMatchObject({ inputTokens: 150, outputTokens: 40 });
  });
});
