export const INIT_MEMBERS = ["김대윤","김현지","복경민","박정찬","이연수","김혜민"];
export const INIT_PRI = ["긴급","높음","보통","낮음"];
export const INIT_ST = ["대기","진행중","검토","완료"];
export const INIT_PRI_C: Record<string,string> = {긴급:"#dc2626",높음:"#d97706",보통:"#2563eb",낮음:"#94a3b8"};
export const INIT_PRI_BG: Record<string,string> = {긴급:"#fef2f2",높음:"#fff7ed",보통:"#eff6ff",낮음:"#f8fafc"};
export const INIT_ST_C: Record<string,string> = {대기:"#64748b",진행중:"#2563eb",검토:"#d97706",완료:"#16a34a"};
export const INIT_ST_BG: Record<string,string> = {대기:"#f1f5f9",진행중:"#dbeafe",검토:"#fef3c7",완료:"#dcfce7"};
export const REPEAT_OPTS = ["없음","매일","매주","매월"];
export const PROJ_PALETTE = ["#8b5cf6","#14b8a6","#2563eb","#f59e0b","#ef4444","#10b981","#f97316","#ec4899","#6366f1","#84cc16","#06b6d4","#a855f7","#0ea5e9","#d946ef","#f43f5e","#64748b"];
export const REPEAT_LABEL: Record<string,string> = {없음:"",매일:"🔁 매일",매주:"🔁 매주",매월:"🔁 매월"};

export const AVATAR_COLORS = ["#2563eb","#16a34a","#d97706","#9333ea","#dc2626","#0d9488","#db2777","#ea580c"];

export const initProj = [
  {id:1,name:"만화웹툰2026아시아",color:"#8b5cf6",status:"활성"},
  {id:2,name:"유녹2026아시아",color:"#14b8a6",status:"활성"},
  {id:3,name:"WATER2026구매",color:"#2563eb",status:"활성"},
  {id:4,name:"WATER2026수출",color:"#f59e0b",status:"활성"}
];

export const initTodos = [
  {id:1,pid:1,task:"중국 시안 디자인 확인",who:"김현지",due:"2026-04-02",pri:"긴급",st:"진행중",det:"착수보고 전까지 완료 필요",cre:"2026-03-26",done:null,repeat:"없음",progress:60},
  {id:2,pid:1,task:"참가기업 배포 메일 작성",who:"김대윤",due:"2026-04-07",pri:"높음",st:"대기",det:"강하나 차장에게 전달",cre:"2026-03-26",done:null,repeat:"없음",progress:0},
  {id:3,pid:1,task:"중국 샘플북 인쇄 발주",who:"복경민",due:"2026-04-14",pri:"보통",st:"대기",det:"기업별 3권씩 별도 제작",cre:"2026-03-26",done:null,repeat:"없음",progress:0},
  {id:4,pid:2,task:"니카이 컨퍼런스 장소 컨펌",who:"김혜민",due:"2026-03-30",pri:"긴급",st:"검토",det:"CKL도쿄 대관 가능 여부 확인",cre:"2026-03-26",done:null,repeat:"없음",progress:75},
  {id:5,pid:2,task:"일본 사전간담회 자료 준비",who:"김현지",due:"2026-04-17",pri:"높음",st:"대기",det:"4월 21일 역삼 간담회용",cre:"2026-03-26",done:null,repeat:"없음",progress:0},
  {id:6,pid:2,task:"일본 자료제작 방향 정리",who:"이연수",due:"2026-04-10",pri:"보통",st:"진행중",det:"내부 논의 후 결정",cre:"2026-03-26",done:null,repeat:"없음",progress:40},
  {id:7,pid:3,task:"해외 바이어 리스트 정리",who:"박정찬",due:"2026-04-05",pri:"높음",st:"진행중",det:"아시아 지역 우선",cre:"2026-03-26",done:null,repeat:"없음",progress:55},
  {id:8,pid:3,task:"구매상담회 부스 배치안 작성",who:"김대윤",due:"2026-04-12",pri:"보통",st:"대기",det:"",cre:"2026-03-26",done:null,repeat:"없음",progress:0},
  {id:9,pid:3,task:"통역 인력 섭외",who:"이연수",due:"2026-04-08",pri:"낮음",st:"완료",det:"중국어/일본어 각 2명",cre:"2026-03-26",done:"2026-03-25",repeat:"없음",progress:100},
  {id:10,pid:4,task:"수출 상담 매칭 시스템 점검",who:"복경민",due:"2026-04-03",pri:"긴급",st:"진행중",det:"매칭 알고리즘 테스트",cre:"2026-03-26",done:null,repeat:"없음",progress:30},
  {id:11,pid:4,task:"참가기업 홍보물 제작 지원",who:"박정찬",due:"2026-04-18",pri:"보통",st:"대기",det:"굿즈 vs 자체 프로모션 결정 필요",cre:"2026-03-26",done:null,repeat:"없음",progress:0},
  {id:12,pid:4,task:"수출 성과보고서 양식 작성",who:"김혜민",due:"2026-04-22",pri:"낮음",st:"대기",det:"전년도 양식 기반 업데이트",cre:"2026-03-26",done:null,repeat:"없음",progress:0},
  {id:13,pid:1,task:"토/일 프로그램 기획안",who:"김대윤",due:"2026-04-09",pri:"높음",st:"대기",det:"주말 프로그램 구성 고민",cre:"2026-03-26",done:null,repeat:"없음",progress:10},
  {id:14,pid:2,task:"CKL 착수보고 자료 준비",who:"복경민",due:"2026-04-10",pri:"긴급",st:"대기",det:"4월 10일 금요일 보고",cre:"2026-03-26",done:null,repeat:"없음",progress:0},
  {id:15,pid:3,task:"중국 사전간담회 장소 예약",who:"김혜민",due:"2026-04-14",pri:"보통",st:"완료",det:"4월 14일 화 역삼",cre:"2026-03-26",done:"2026-03-26",repeat:"없음",progress:100},
  {id:16,pid:4,task:"북경센터 컨택포인트 연락",who:"이연수",due:"2026-03-28",pri:"긴급",st:"검토",det:"153㎡ 변경건 소통",cre:"2026-03-26",done:null,repeat:"없음",progress:50},
  {id:17,pid:2,task:"가예약 장소 기한 확인",who:"김혜민",due:"2026-03-29",pri:"높음",st:"진행중",det:"니카이 + 대체장소",cre:"2026-03-26",done:null,repeat:"없음",progress:70},
  {id:18,pid:4,task:"전시장 브로셔 컨택 정리",who:"김현지",due:"2026-04-01",pri:"보통",st:"대기",det:"브릿징 통해 직접 연락",cre:"2026-03-26",done:null,repeat:"없음",progress:0},
  {id:19,pid:1,task:"주간 진행상황 팀 공유",who:"김대윤",due:"2026-03-31",pri:"보통",st:"대기",det:"매주 월요일 슬랙 보고",cre:"2026-03-26",done:null,repeat:"매주",progress:0},
  {id:20,pid:3,task:"일일 바이어 문의 확인",who:"박정찬",due:"2026-03-26",pri:"높음",st:"대기",det:"이메일 및 메신저 확인",cre:"2026-03-26",done:null,repeat:"매일",progress:0},
];
