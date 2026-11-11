import { createUIMessageStreamResponse, toUIMessageStream, type UIMessage } from "ai";
import { streamSupportReply } from "@/lib/chat";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = await streamSupportReply(messages, {
    onUsage: (report) => console.log("usage", report),
  });
  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
