import { useState, useRef, useEffect } from "react";
import { AiParsed, Project } from "../types";
import { td } from "../utils";
import { callAnthropicAI } from "../services/aiService";

interface UseAIOptions {
  currentUser: string | null;
  aProj: Project[];
  members: string[];
  /** 확인된 AI 파싱 결과를 실제 Todo로 등록하는 콜백 (useTodoApp의 CRUD 레이어) */
  onAddTodos: (checked: AiParsed[]) => void;
  flash: (msg: string, type?: string) => void;
}

export function useAI({ currentUser, aProj, members, onAddTodos, flash }: UseAIOptions) {
  // ── 상태 ─────────────────────────────────────────────────────────────────
  const [aiText, setAiText] = useState(() => {
    const u = localStorage.getItem("todo-current-user");
    return u ? localStorage.getItem(`todo-ai-text-${u}`) || "" : "";
  });
  const [aiFiles, setAiFiles] = useState<{ name: string; type: string; data: string; textContent?: string }[]>([]);
  const [aiLoad, setAiLoad] = useState(false);
  const [aiSt, setAiSt] = useState("");
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("team-todo-apikey") || "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"
  );
  const [aiParsed, setAiParsed] = useState<AiParsed[]>(() => {
    const u = localStorage.getItem("todo-current-user");
    if (!u) return [];
    try { return JSON.parse(localStorage.getItem(`todo-ai-parsed-${u}`) || "[]"); } catch { return []; }
  });
  const [addTab, setAddTab] = useState("manual");

  // 더블클릭 방지 가드
  const confirmingAI = useRef(false);

  // ── 유저 전환 시 AI 상태 저장/복원 ──────────────────────────────────────
  const prevUserRef = useRef<string | null>(localStorage.getItem("todo-current-user"));

  useEffect(() => {
    const prev = prevUserRef.current;
    if (prev) {
      localStorage.setItem(`todo-ai-text-${prev}`, aiText);
      try { localStorage.setItem(`todo-ai-parsed-${prev}`, JSON.stringify(aiParsed)); } catch {}
    }
    setAiFiles([]);
    setAiSt("");
    setAiText(currentUser ? localStorage.getItem(`todo-ai-text-${currentUser}`) || "" : "");
    try {
      setAiParsed(currentUser ? JSON.parse(localStorage.getItem(`todo-ai-parsed-${currentUser}`) || "[]") : []);
    } catch { setAiParsed([]); }
    prevUserRef.current = currentUser;
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── AI 상태 개인별 자동 저장 ─────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    localStorage.setItem(`todo-ai-text-${currentUser}`, aiText);
  }, [aiText, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    try { localStorage.setItem(`todo-ai-parsed-${currentUser}`, JSON.stringify(aiParsed)); } catch {}
  }, [aiParsed, currentUser]);

  // ── confirmingAI 가드 리셋 ───────────────────────────────────────────────
  useEffect(() => {
    if (!aiParsed.length) confirmingAI.current = false;
  }, [aiParsed]);

  // ── parseAI ──────────────────────────────────────────────────────────────
  const parseAI = async () => {
    if (!apiKey) { setAiSt("API 키가 설정되지 않았습니다. 설정에서 먼저 저장해 주세요."); return; }
    if (!aiText.trim() && !aiFiles.length) return;
    setAiLoad(true);
    setAiSt("AI가 업무를 분석하고 있습니다...");
    try {
      const results = await callAnthropicAI({
        apiKey,
        aiText,
        aiFiles,
        projectNames: aProj.map(p => p.name),
        memberNames: members,
        today: td(),
        onProgress: setAiSt,
      });
      setAiParsed(results.map((t: any, i: number) => ({ ...t, _chk: true, _i: i })));
      setAiSt(`ok:${results.length}건의 업무가 추출되었습니다`);
    } catch (e: any) {
      setAiSt(`err:분석 중 오류가 발생하였습니다: ${e.message}`);
    }
    setAiLoad(false);
  };

  // ── confirmAI ────────────────────────────────────────────────────────────
  const confirmAI = () => {
    if (confirmingAI.current) return;
    const checked = aiParsed.filter(t => t._chk);
    if (!checked.length) return;
    confirmingAI.current = true;
    onAddTodos(checked);
    setAiParsed([]);
    setAiText("");
    setAiSt("");
    flash(`${checked.length}건이 AI를 통해 등록되었습니다`);
  };

  return {
    aiText, setAiText,
    aiFiles, setAiFiles,
    aiLoad,
    aiSt, setAiSt,
    apiKey, setApiKey,
    aiParsed, setAiParsed,
    addTab, setAddTab,
    parseAI,
    confirmAI,
  };
}
