// ─── AI 서비스 (Anthropic API 호출 전담) ────────────────────────────────────
// useTodoApp.ts에서 fetch + 스트리밍 로직을 분리했습니다.
// 나중에 API 엔드포인트나 모델이 바뀌어도 이 파일만 수정하면 됩니다.

export interface AiFile {
  name: string;
  type: string;
  data: string;
  textContent?: string;
}

export interface AiServiceInput {
  apiKey: string;
  aiText: string;
  aiFiles: AiFile[];
  projectNames: string[];
  memberNames: string[];
  today: string;
  /** 스트리밍 진행 상황 콜백 */
  onProgress: (msg: string) => void;
}

/**
 * Anthropic Claude API를 호출해 텍스트/파일에서 TODO 목록을 추출합니다.
 * @returns 파싱된 TODO 배열 (raw JSON)
 * @throws API 오류, max_tokens 초과, JSON 파싱 실패 시
 */
export async function callAnthropicAI(input: AiServiceInput): Promise<any[]> {
  const { apiKey, aiText, aiFiles, projectNames, memberNames, today, onProgress } = input;

  const sysPrompt = [
    "Task parser. Return ONLY a JSON array.",
    `Each item: {"task":string,"assignee":string or null,"due":"YYYY-MM-DD" or null,`,
    `"priority":"보통"|"긴급"|"높음"|"낮음","project":string or null,"detail":string or null,"repeat":"없음"|"매일"|"매주"|"매월"}.`,
    `@name=assignee. today=${today}.`,
    `projects:${projectNames.join(",")}.`,
    `members:${memberNames.join(",")}.`,
  ].join(" ");

  // 콘텐츠 파트 구성 (이미지 / PDF / 텍스트 파일)
  const contentParts: any[] = [];
  for (const f of aiFiles) {
    if (f.type.startsWith("image/")) {
      contentParts.push({ type: "image", source: { type: "base64", media_type: f.type, data: f.data } });
    } else if (f.type === "application/pdf") {
      contentParts.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: f.data } });
    } else if (f.textContent) {
      contentParts.push({ type: "text", text: `[첨부파일: ${f.name}]\n${f.textContent}` });
    }
  }
  contentParts.push({
    type: "text",
    text: aiText.trim() ? `TODO추출:\n${aiText}` : "위 첨부파일에서 TODO 업무를 추출해주세요.",
  });

  // API 호출 (스트리밍)
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      stream: true,
      system: sysPrompt,
      messages: [{ role: "user", content: contentParts }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`API ${res.status}: ${(err as any).error?.message || ""}`);
  }

  // SSE 스트림 읽기
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let raw = "";
  let stopReason = "";
  let taskCount = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value, { stream: true }).split("\n")) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (!data) continue;
      try {
        const ev = JSON.parse(data);
        if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") {
          raw += ev.delta.text;
          const cnt = (raw.match(/\{/g) || []).length;
          if (cnt !== taskCount) {
            taskCount = cnt;
            onProgress(`AI 분석 중... (${taskCount}건 발견)`);
          }
        } else if (ev.type === "message_delta") {
          stopReason = ev.delta?.stop_reason || "";
        }
      } catch {}
    }
  }

  if (stopReason === "max_tokens") {
    throw new Error("응답이 너무 길어 잘렸습니다. 파일을 나눠서 업로드해 보세요.");
  }

  const jsonMatch = raw.replace(/```json|```/g, "").trim().match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("JSON 배열을 찾을 수 없습니다");
  return JSON.parse(jsonMatch[0]);
}
