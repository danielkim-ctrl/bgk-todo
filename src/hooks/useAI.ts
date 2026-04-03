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
  flash: (msg: string, type?: string, action?: { label: string; fn: () => void }) => void;
  /** AI 등록 직후 "실행 취소" 토스트 버튼에서 호출할 undo 함수 */
  undo: () => void;
}

export function useAI({ currentUser, aProj, members, onAddTodos, flash, undo }: UseAIOptions) {
  // ── 상태 ─────────────────────────────────────────────────────────────────
  const [aiText, setAiText] = useState(() => {
    const u = localStorage.getItem("todo-current-user");
    return u ? localStorage.getItem(`todo-ai-text-${u}`) || "" : "";
  });
  const [aiFiles, setAiFiles] = useState<{ name: string; type: string; data: string; textContent?: string }[]>([]);
  const [aiLoad, setAiLoad] = useState(false);
  const [aiSt, setAiSt] = useState("");
  // API 키는 Firestore 공유 데이터에서 로드 — 초기값 빈 문자열, applyData에서 복원됨
  const [apiKey, setApiKey] = useState("");
  const [aiParsed, setAiParsed] = useState<AiParsed[]>(() => {
    const u = localStorage.getItem("todo-current-user");
    if (!u) return [];
    try { return JSON.parse(localStorage.getItem(`todo-ai-parsed-${u}`) || "[]"); } catch { return []; }
  });
  // 이전 분석 결과 1건 보관 — 재분석 시 실수로 결과를 잃었을 때 복원용
  const [aiHistory, setAiHistory] = useState<AiParsed[]>(() => {
    const u = localStorage.getItem("todo-current-user");
    if (!u) return [];
    try { return JSON.parse(localStorage.getItem(`todo-ai-history-${u}`) || "[]"); } catch { return []; }
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
    // 유저 전환 시 해당 유저의 히스토리 복원
    try {
      setAiHistory(currentUser ? JSON.parse(localStorage.getItem(`todo-ai-history-${currentUser}`) || "[]") : []);
    } catch { setAiHistory([]); }
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
      // 기존 결과가 있으면 히스토리로 백업 후 새 결과로 교체
      if (aiParsed.length > 0) {
        setAiHistory(aiParsed);
        if (currentUser) {
          try { localStorage.setItem(`todo-ai-history-${currentUser}`, JSON.stringify(aiParsed)); } catch {}
        }
      }
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
    // 등록 완료 후 5초 동안 "실행 취소" 버튼이 달린 토스트 표시
    flash(`${checked.length}건이 AI를 통해 등록되었습니다`, "ok", { label: "실행 취소", fn: undo });
  };

  // 이전 분석 결과 복원 — 재분석으로 덮어쓴 결과를 되돌림
  const restoreAiHistory = () => {
    if (!aiHistory.length) return;
    setAiParsed(aiHistory);
    setAiSt(`ok:이전 분석 결과 ${aiHistory.length}건을 복원했습니다`);
  };

  return {
    aiText, setAiText,
    aiFiles, setAiFiles,
    aiLoad,
    aiSt, setAiSt,
    apiKey, setApiKey,
    aiParsed, setAiParsed,
    aiHistory, restoreAiHistory,
    addTab, setAddTab,
    parseAI,
    confirmAI,
  };
}
