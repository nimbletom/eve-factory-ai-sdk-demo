import type { UIMessage } from "ai";
import { describe, expect, it, vi } from "vitest";
import { streamSupportReply } from "../lib/chat";
import { scriptedModel } from "./mock";

const messages: UIMessage[] = [
  { id: "msg-1", role: "user", parts: [{ type: "text", text: "Where is order A-1001?" }] },
];

describe("streamSupportReply", () => {
  it("streams the answer after looking the order up", async () => {
    const model = scriptedModel([
      { toolCall: { toolName: "lookupOrder", input: { orderId: "A-1001" } }, input: 100, output: 10 },
      { text: "Order A-1001 has shipped.", input: 150, output: 40 },
    ]);
    const result = await streamSupportReply(messages, { model });
    let text = "";
    for await (const part of result.textStream) text += part;
    expect(text).toBe("Order A-1001 has shipped.");
  });

  it("reports only the final answer step's usage", async () => {
    const model = scriptedModel([
      { toolCall: { toolName: "lookupOrder", input: { orderId: "A-1001" } }, input: 100, output: 10 },
      { text: "Order A-1001 has shipped.", input: 150, output: 40 },
    ]);
    const onUsage = vi.fn();
    const result = await streamSupportReply(messages, { model, onUsage });
    for await (const part of result.stream) void part;
    expect(await result.text).toBe("Order A-1001 has shipped.");
    expect(onUsage).toHaveBeenCalledTimes(1);
    expect(onUsage).toHaveBeenCalledWith({
      inputTokens: 150,
      outputTokens: 40,
      cachedInputTokens: 0,
      reasoningTokens: 0,
    });
  });
});
