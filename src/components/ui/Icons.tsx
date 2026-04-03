/**
 * 앱 전체에서 사용하는 아이콘 통합 관리 파일
 * Heroicons(@heroicons/react)를 re-export하여 일관된 아이콘 사용을 보장한다.
 * 새 아이콘이 필요하면 여기에 추가하고 매핑 표(code.rule.md)도 함께 업데이트한다.
 */

// ── outline 스타일 (기본) ──────────────────────────────────────
export { FolderIcon } from "@heroicons/react/24/outline";           // 프로젝트
export { UserIcon } from "@heroicons/react/24/outline";             // 담당자
export { CalendarIcon } from "@heroicons/react/24/outline";         // 마감기한
export { FlagIcon } from "@heroicons/react/24/outline";             // 우선순위
export { CheckCircleIcon } from "@heroicons/react/24/outline";      // 상태
export { ExclamationTriangleIcon } from "@heroicons/react/24/outline"; // 경고/지연
export { ArrowPathIcon } from "@heroicons/react/24/outline";        // 반복
export { Cog6ToothIcon } from "@heroicons/react/24/outline";        // 설정
export { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";   // 되돌리기
export { ArrowUturnRightIcon } from "@heroicons/react/24/outline";  // 다시 실행
export { TrashIcon } from "@heroicons/react/24/outline";            // 삭제
export { ChartBarIcon } from "@heroicons/react/24/outline";         // 대시보드
export { ViewColumnsIcon } from "@heroicons/react/24/outline";      // 칸반
export { ListBulletIcon } from "@heroicons/react/24/outline";       // 리스트
export { CheckIcon } from "@heroicons/react/24/outline";            // 성공 알림
export { XMarkIcon } from "@heroicons/react/24/outline";            // 오류 알림 / 닫기
export { MagnifyingGlassIcon } from "@heroicons/react/24/outline";  // 검색
export { PlusIcon } from "@heroicons/react/24/outline";             // 추가
export { DocumentTextIcon } from "@heroicons/react/24/outline";     // 메모
export { PencilSquareIcon } from "@heroicons/react/24/outline";     // 수정
export { ClipboardDocumentIcon } from "@heroicons/react/24/outline";// 복제
export { BoltIcon } from "@heroicons/react/24/outline";             // 우선순위(번개)
export { InformationCircleIcon } from "@heroicons/react/24/outline";// 정보
export { EllipsisHorizontalIcon } from "@heroicons/react/24/outline"; // 더보기(···)
export { ChevronDownIcon } from "@heroicons/react/24/outline";      // 펼치기
export { ChevronRightIcon } from "@heroicons/react/24/outline";     // 접기
export { ChevronLeftIcon } from "@heroicons/react/24/outline";      // 좁히기
export { ChevronUpIcon } from "@heroicons/react/24/outline";        // 접기(위)
export { ChevronDoubleLeftIcon } from "@heroicons/react/24/outline"; // 사이드바 완전 접기
export { ChevronDoubleRightIcon } from "@heroicons/react/24/outline"; // 사이드바 완전 펼치기
export { Bars3Icon } from "@heroicons/react/24/outline";            // 메뉴(☰)
export { FunnelIcon } from "@heroicons/react/24/outline";           // 필터
export { UserGroupIcon } from "@heroicons/react/24/outline";       // 팀
export { BookmarkIcon } from "@heroicons/react/24/outline";         // 즐겨찾기(outline)
export { AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline"; // 설정 조정
export { InboxIcon } from "@heroicons/react/24/outline";                // 빈 상태(받은함 없음)
export { EyeIcon } from "@heroicons/react/24/outline";                 // 표시/숨기기 토글
export { EyeSlashIcon } from "@heroicons/react/24/outline";            // 숨겨진 항목
export { PaperClipIcon } from "@heroicons/react/24/outline";           // 파일 첨부
export { DocumentIcon } from "@heroicons/react/24/outline";            // 문서 (PDF 등)
export { SparklesIcon } from "@heroicons/react/24/outline";            // AI 결과/자동생성
export { PencilIcon } from "@heroicons/react/24/outline";              // 수정 (인라인)

// ── solid 스타일 (강조 용도) ────────────────────────────────────
export { StarIcon } from "@heroicons/react/24/solid";               // 즐겨찾기 (활성)
// outline StarIcon이 필요한 경우 아래처럼 별도 이름으로 import
export { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline"; // 즐겨찾기 (비활성)

// ── 아이콘 기본 스타일 ──────────────────────────────────────────
// 인라인 스타일로 사용할 때 참조하는 기본 크기 상수
export const ICON_SM = { width: 14, height: 14, flexShrink: 0 } as const;
export const ICON_MD = { width: 16, height: 16, flexShrink: 0 } as const;
export const ICON_LG = { width: 20, height: 20, flexShrink: 0 } as const;

// Heroicons에 없는 커스텀 아이콘 — 키보드 아이콘
// Heroicons에 keyboard 아이콘이 없으므로 직접 SVG로 정의
export function KeyboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5a1.5 1.5 0 011.5 1.5v7.5a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5v-7.5a1.5 1.5 0 011.5-1.5zM6 14.25h12M6 10.5h.008v.008H6V10.5zm3 0h.008v.008H9V10.5zm3 0h.008v.008H12V10.5zm3 0h.008v.008H15V10.5zm3 0h.008v.008H18V10.5z" />
    </svg>
  );
}
