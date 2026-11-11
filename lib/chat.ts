import {
  convertToModelMessages,
  isStepCount,
  streamText,
  type LanguageModel,
  type UIMessage,
} from "ai";
import { MODEL } from "./model";
import { tools } from "./tools";
import { toUsageReport, type UsageReport } from "./usage";

export const SYSTEM_PROMPT =
  "You are a support agent for an online electronics store. Look orders up before answering questions about them. Keep answers short.";

export async function streamSupportReply(
  messages: UIMessage[],
  options: { model?: LanguageModel; onUsage?: (report: UsageReport) => void } = {},
) {
  return streamText({
    model: options.model ?? MODEL,
    instructions: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: isStepCount(5),
    onEnd: ({ finalStep }) => options.onUsage?.(toUsageReport(finalStep.usage)),
  });
}
