import type { LanguageModelV3StreamPart } from "@ai-sdk/provider";
import { MockLanguageModelV3 } from "ai/test";

type Step =
  | { text: string; input: number; output: number; cacheRead?: number; reasoning?: number }
  | { toolCall: { toolName: string; input: unknown }; input: number; output: number };

function stepUsage(step: Step) {
  return {
    inputTokens: {
      total: step.input,
      noCache: step.input - ("cacheRead" in step ? (step.cacheRead ?? 0) : 0),
      cacheRead: "cacheRead" in step ? step.cacheRead : undefined,
      cacheWrite: undefined,
    },
    outputTokens: {
      total: step.output,
      text: step.output,
      reasoning: "reasoning" in step ? step.reasoning : undefined,
    },
  };
}

/** A mock model that plays back one scripted step per call. */
export function scriptedModel(steps: Step[]) {
  let generateCall = 0;
  let streamCall = 0;
  return new MockLanguageModelV3({
    doGenerate: async () => {
      const call = ++generateCall;
      const step = steps[Math.min(call - 1, steps.length - 1)]!;
      const usage = stepUsage(step);
      if ("toolCall" in step) {
        return {
          content: [
            {
              type: "tool-call" as const,
              toolCallId: `call-${call}`,
              toolName: step.toolCall.toolName,
              input: JSON.stringify(step.toolCall.input),
            },
          ],
          finishReason: { unified: "tool-calls" as const, raw: undefined },
          usage,
          warnings: [],
        };
      }
      return {
        content: [{ type: "text" as const, text: step.text }],
        finishReason: { unified: "stop" as const, raw: undefined },
        usage,
        warnings: [],
      };
    },
    doStream: async () => {
      const call = ++streamCall;
      const step = steps[Math.min(call - 1, steps.length - 1)]!;
      const usage = stepUsage(step);
      const parts: LanguageModelV3StreamPart[] =
        "toolCall" in step
          ? [
              { type: "stream-start", warnings: [] },
              {
                type: "tool-call",
                toolCallId: `call-${call}`,
                toolName: step.toolCall.toolName,
                input: JSON.stringify(step.toolCall.input),
              },
              { type: "finish", finishReason: { unified: "tool-calls", raw: undefined }, usage },
            ]
          : [
              { type: "stream-start", warnings: [] },
              { type: "text-start", id: "text-1" },
              { type: "text-delta", id: "text-1", delta: step.text },
              { type: "text-end", id: "text-1" },
              { type: "finish", finishReason: { unified: "stop", raw: undefined }, usage },
            ];
      return {
        stream: new ReadableStream<LanguageModelV3StreamPart>({
          start(controller) {
            for (const part of parts) controller.enqueue(part);
            controller.close();
          },
        }),
      };
    },
  });
}
