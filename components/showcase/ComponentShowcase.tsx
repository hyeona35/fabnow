"use client";

import React, { useState, useOptimistic, useTransition, useActionState } from "react";
import dynamic from "next/dynamic";
import { Link as ViewTransitionLink } from "next-view-transitions";
import {
  Accordion,
  Alert,
  Badge,
  BottomBar,
  Breadcrumbs,
  Button,
  Calendar,
  Card,
  Carousel,
  ChatBubble,
  Checkbox,
  Collapse,
  Countdown,
  Diff,
  Divider,
  Dropdown,
  EmptyState,
  ErrorBoundary,
  Fieldset,
  FileUpload,
  Filter,
  Indicator,
  IconBellShield,
  IconChart,
  IconCompass,
  IconCopy,
  IconDownload,
  IconFolder,
  IconGrid,
  IconHeart,
  IconHome,
  IconLayers,
  IconLock,
  IconPasskey,
  IconSparkles,
  IconSpeakerMute,
  IconSpeakerWave,
  IconStar,
  IconTrash,
  IconUser,
  KBD,
  Link,
  List,
  Mask,
  Megamenu,
  OTP,
  Progress,
  RadialProgress,
  Radio,
  Rating,
  SearchField,
  Select,
  Sidebar,
  Slider,
  Stack,
  Steps,
  Swap,
  Switch,
  Tabs,
  TextField,
  Tooltip,
  type ListRowItem,
  type SearchToken,
} from "@/components/ui";

const BottomSheet = dynamic(
  () => import("@/components/ui/BottomSheet").then((mod) => mod.BottomSheet),
  { ssr: false }
);

const VirtualList = dynamic(
  () => import("@/components/ui/VirtualList").then((mod) => mod.VirtualList),
  {
    ssr: false,
    loading: () => (
      <div className="h-[360px] w-full rounded-2xl border border-base-content/15 bg-base-100 flex items-center justify-center text-xs font-semibold text-base-content/50 animate-pulse">
        가상화 목록 엔진 로딩 중…
      </div>
    ),
  }
) as typeof import("@/components/ui/VirtualList").VirtualList;

import { triggerHaptic } from "@/lib/haptics";
import { ProtectedRoute, useAuth } from "@/context/AuthContext";
import { useModal, useToast } from "@/context/OverlayContext";

function DirtyModalDemoContent() {
  const { setModalDirty, closeModal } = useModal();
  const { showToast } = useToast();
  const [noteTitle, setNoteTitle] = useState<string>("pstui 워크스페이스 초안");
  const [noteBody, setNoteBody] = useState<string>("");

  const handleTitleChange = (val: string) => {
    setNoteTitle(val);
    setModalDirty(true);
  };

  const handleBodyChange = (val: string) => {
    setNoteBody(val);
    setModalDirty(val.trim().length > 0);
  };

  return (
    <div className="space-y-4">
      <Alert
        variant="info"
        title="Dirty State(미저장 데이터) 가드 테스트"
        description="아래 텍스트 필드를 수정한 뒤 우측 상단 닫기(✕), 배경 클릭, 또는 ESC 키를 눌러보세요. 즉시 닫히지 않고 '편집 내용 삭제 / 임시 저장 / 계속 편집' 확인 시트가 호출됩니다."
      />
      <TextField
        label="문서 제목"
        value={noteTitle}
        onChange={handleTitleChange}
        placeholder="제목을 입력하세요"
      />
      <TextField
        label="세부 메모 (입력 시 Dirty 상태 활성화)"
        value={noteBody}
        onChange={handleBodyChange}
        placeholder="아무 내용이나 입력한 뒤 ESC 또는 바깥 배경을 클릭해 보세요"
      />
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-base-content/10">
        <Button variant="ghost" size="sm" onClick={() => closeModal(false)}>
          닫기 시도
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setModalDirty(false);
            closeModal(true);
            showToast({
              title: "문서가 저장되었습니다",
              description: noteTitle,
              variant: "success",
            });
          }}
        >
          변경 사항 저장
        </Button>
      </div>
    </div>
  );
}

export function ComponentShowcase({
  activeSection,
  onSelectSection,
  streamingSlot,
}: {
  activeSection: string;
  onSelectSection: (sectionId: string) => void;
  streamingSlot?: React.ReactNode;
}) {
  const { user, isConfigured, openAuthModal, signInWithPasskey, signOut } =
    useAuth();
  const { openModal, openAlertDialog, openPrePermissionModal } = useModal();
  const { showToast } = useToast();

  // Search & Scope Bar State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeScope, setActiveScope] = useState<string>("전체 (37종)");
  const [searchTokens, setSearchTokens] = useState<SearchToken[]>([
    { id: "tok-pst", category: "규격", value: "pstui Design System" },
  ]);

  // Layout & Navigation States
  const [inlineBottomTab, setInlineBottomTab] = useState<string>("home");
  const [inlineSidebarActive, setInlineSidebarActive] =
    useState<string>("dashboard");
  const [inlineSidebarCollapsed, setInlineSidebarCollapsed] =
    useState<boolean>(false);
  const [activeTabId, setActiveTabId] = useState<string>("segmented-1");
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(1);

  // Form & Input States
  const [isAsyncSaving, setIsAsyncSaving] = useState<boolean>(false);
  const [childChecks, setChildChecks] = useState<{
    design: boolean;
    a11y: boolean;
    motion: boolean;
  }>({
    design: true,
    a11y: false,
    motion: true,
  });
  const [radioValue, setRadioValue] = useState<string>("regular");
  const [useSixOptionsDemo, setUseSixOptionsDemo] = useState<boolean>(false);
  const [selectValue, setSelectValue] = useState<string>("seoul");
  const [filterSelected, setFilterSelected] = useState<string | null>(null);
  const [otpValue, setOtpValue] = useState<string>("482910");
  const [ratingValue, setRatingValue] = useState<number>(4);
  const [swapActive, setSwapActive] = useState<boolean>(false);
  const [sliderValue, setSliderValue] = useState<number>(72);
  const [emailInput, setEmailInput] = useState<string>("architect@pstui.dev");
  const [usernameInput, setUsernameInput] = useState<string>("liquid_glass_ui");

  // Data Display & Feedback States
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 9, 24));
  const [progressValue, setProgressValue] = useState<number>(68);
  const [isProgressPaused, setIsProgressPaused] = useState<boolean>(false);

  // Bottom Sheet State per Requirement 36
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState<boolean>(false);

  // Optimistic Updates (useOptimistic) per Requirement 19
  const [bookmarks, setBookmarks] = useState<string[]>(["tok-1", "tok-3"]);
  const [optimisticBookmarks, setOptimisticBookmarks] = useOptimistic(
    bookmarks,
    (current, targetId: string) =>
      current.includes(targetId)
        ? current.filter((x) => x !== targetId)
        : [...current, targetId]
  );
  const [isBookmarkPending, startBookmarkTransition] = useTransition();

  const handleToggleBookmark = (id: string) => {
    triggerHaptic("selection");
    startBookmarkTransition(async () => {
      setOptimisticBookmarks(id);
      await new Promise((r) => setTimeout(r, 650));
      setBookmarks((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    });
  };

  // Zero-Flicker Form Validation using useActionState per Requirement 26
  const [formState, formAction, isFormPending] = useActionState(
    async (
      prevState: { error?: string; success?: boolean; email?: string } | null,
      formData: FormData
    ) => {
      const email = (formData.get("verified_email") as string) || "";
      if (!email.trim() || !email.includes("@")) {
        triggerHaptic("error");
        return {
          error: "올바른 이메일 형식을 입력하십시오 (예: developer@pstui.dev)",
          email,
        };
      }
      triggerHaptic("medium");
      await new Promise((r) => setTimeout(r, 500));
      return { success: true, email };
    },
    null
  );

  // TanStack Virtual Items (500 items) per Requirement 30
  const virtualDemoItems = React.useMemo(
    () =>
      Array.from({ length: 500 }, (_, idx) => ({
        id: `token-${idx + 1}`,
        name: `Liquid Glass 토큰 규격 #${idx + 1}`,
        category: idx % 2 === 0 ? "인터랙션 레이어" : "머티리얼 표면",
        contrast: "WCAG AAA 7:1",
      })),
    []
  );

  // Inset Grouped List State (with Switch & Reversible Delete Undo Toast)
  const [notificationSwitch, setNotificationSwitch] = useState<boolean>(true);
  const [hapticSwitch, setHapticSwitch] = useState<boolean>(true);
  const [workspaceItems, setWorkspaceItems] = useState<
    { id: string; title: string; subtitle: string; meta: string }[]
  >([
    {
      id: "ws-1",
      title: "Liquid Glass 네비게이션 레이어",
      subtitle: "하단 독(BottomBar) 및 좌측 폴딩 사이드바(Sidebar)",
      meta: "정상",
    },
    {
      id: "ws-2",
      title: "Standard Material 콘텐츠 표면",
      subtitle: "일반 카드 및 리스트 행에는 블러 토큰 미사용 원칙 준수",
      meta: "검증됨",
    },
    {
      id: "ws-3",
      title: "Firebase Auth & Dirty State 가드",
      subtitle: "모달 미저장 데이터 보호 시트 및 실행 취소(Undo) 토스트",
      meta: "활성",
    },
  ]);

  // Hierarchical Checkbox Calculation (Indeterminate Dash state)
  const checkedCount = Object.values(childChecks).filter(Boolean).length;
  const allChecked = checkedCount === 3;
  const isIndeterminate = checkedCount > 0 && checkedCount < 3;

  const handleToggleAllChecks = (next: boolean) => {
    setChildChecks({ design: next, a11y: next, motion: next });
  };

  // Async Button Handler (Inline Spinner + Dynamic Label per DESIGN.md 7.1)
  const handleAsyncAction = async () => {
    setIsAsyncSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setIsAsyncSaving(false);
    showToast({
      title: "결제 및 동기화가 완료되었습니다",
      description: "전체 화면을 차단하지 않고 인라인 스피너로 처리되었습니다.",
      variant: "success",
    });
  };

  // Reversible List Item Delete (Immediate action + Bottom Toast Undo per DESIGN.md 7.2 & AGENTS.md 3)
  const handleDeleteListItem = (id: string) => {
    const targetIndex = workspaceItems.findIndex((item) => item.id === id);
    if (targetIndex === -1) return;
    const removedItem = workspaceItems[targetIndex];

    setWorkspaceItems((prev) => prev.filter((item) => item.id !== id));

    showToast({
      title: `'${removedItem.title}' 항목이 삭제됨`,
      description: "되돌릴 수 있는 동작은 경고창 없이 즉시 실행 취소(Undo)를 제공합니다.",
      variant: "info",
      undoLabel: "실행 취소",
      onUndo: () => {
        setWorkspaceItems((prev) => {
          const copy = [...prev];
          copy.splice(targetIndex, 0, removedItem);
          return copy;
        });
      },
    });
  };

  const SECTION_SEARCH_INDEX: Record<string, string[]> = {
    navigation: [
      "human-interface",
      "liquid glass",
      "44px 히트",
      "layout",
      "navigation",
      "탐색",
      "레이아웃",
      "bottombar",
      "하단바",
      "탭 막대",
      "sidebar",
      "사이드바",
      "breadcrumbs",
      "브레드크럼",
      "경로",
      "tabs",
      "탭",
      "segmentedcontrol",
      "세그먼트",
      "steps",
      "스텝",
      "단계",
      "megamenu",
      "메가메뉴",
      "divider",
      "디바이더",
      "구분선",
      "stack",
      "스택",
    ],
    containment: [
      "human-interface",
      "liquid glass",
      "44px 히트",
      "containment",
      "disclosure",
      "컨테이너",
      "점진적 노출",
      "accordion",
      "아코디언",
      "collapse",
      "콜랩스",
      "접기",
      "card",
      "카드",
      "standard material",
      "carousel",
      "캐러셀",
      "슬라이드",
      "dropdown",
      "드롭다운",
      "pulldownmenu",
      "풀다운",
      "동작 시트",
    ],
    forms: [
      "human-interface",
      "44px 히트",
      "passkey",
      "form",
      "input",
      "폼",
      "데이터 입력",
      "button",
      "버튼",
      "인라인 스피너",
      "checkbox",
      "체크박스",
      "indeterminate",
      "radio",
      "라디오",
      "select",
      "셀렉트",
      "fieldset",
      "필드셋",
      "fileupload",
      "파일 업로드",
      "filter",
      "필터",
      "otp",
      "인증번호",
      "rating",
      "레이팅",
      "별점",
      "swap",
      "스왑",
      "textfield",
      "텍스트 필드",
      "searchfield",
      "검색",
      "switch",
      "스위치",
      "togglebutton",
      "토글",
      "slider",
      "슬라이더",
    ],
    display: [
      "human-interface",
      "liquid glass",
      "44px 히트",
      "data display",
      "데이터 표시",
      "badge",
      "뱃지",
      "calendar",
      "캘린더",
      "달력",
      "chatbubble",
      "채팅버블",
      "채팅",
      "countdown",
      "카운트다운",
      "타이머",
      "diff",
      "비교",
      "kbd",
      "단축키",
      "키보드",
      "list",
      "리스트",
      "실행 취소",
      "undo",
      "mask",
      "마스크",
      "스쿼클",
      "link",
      "링크",
    ],
    feedback: [
      "human-interface",
      "liquid glass",
      "passkey",
      "44px 히트",
      "feedback",
      "status",
      "피드백",
      "상태",
      "인증",
      "alert",
      "알럿",
      "경고",
      "indicator",
      "인디케이터",
      "progress",
      "프로그레스",
      "진행률",
      "radialprogress",
      "라디얼",
      "원형 진행률",
      "tooltip",
      "툴팁",
      "modal",
      "모달",
      "dirty state",
      "toast",
      "토스트",
      "firebase",
      "oauth",
      "protectedroute",
    ],
  };

  const showSection = (sectionKey: string) => {
    if (activeSection !== "overview" && activeSection !== sectionKey) {
      return false;
    }
    if (
      activeScope === "탐색/레이아웃" &&
      sectionKey !== "navigation" &&
      sectionKey !== "containment"
    ) {
      return false;
    }
    if (activeScope === "폼/입력" && sectionKey !== "forms") {
      return false;
    }
    if (activeScope === "데이터 표시" && sectionKey !== "display") {
      return false;
    }
    if (activeScope === "피드백/인증" && sectionKey !== "feedback") {
      return false;
    }

    const keywords = SECTION_SEARCH_INDEX[sectionKey] ?? [];

    for (const token of searchTokens) {
      const tokenVal = token.value.trim().toLowerCase();
      if (
        tokenVal &&
        !keywords.some((kw) => kw.includes(tokenVal) || tokenVal.includes(kw))
      ) {
        return false;
      }
    }

    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (normalizedQuery.length > 0) {
      const queryTerms = normalizedQuery.split(/\s+/);
      const matchesAllTerms = queryTerms.every((term) =>
        keywords.some((kw) => kw.includes(term))
      );
      if (!matchesAllTerms) {
        return false;
      }
    }

    return true;
  };

  const visibleSectionKeys = [
    "navigation",
    "containment",
    "forms",
    "display",
    "feedback",
  ].filter((key) => showSection(key));

  const listRows: ListRowItem[] = [
    {
      id: "setting-notif",
      title: "실시간 푸시 알림 동기화",
      subtitle: "리스트 행 내부에서는 Switch 컴포넌트를 사용합니다",
      leading: (
        <span className="w-8 h-8 rounded-lg bg-primary/15 text-accent-primary flex items-center justify-center shrink-0">
          <IconBellShield className="w-4 h-4" />
        </span>
      ),
      trailing: (
        <Switch
          label="알림"
          checked={notificationSwitch}
          onChange={setNotificationSwitch}
        />
      ),
    },
    {
      id: "setting-haptic",
      title: "오디오-햅틱 피드백 조화 (Causality & Harmony)",
      subtitle: "조작과 동일한 프레임에 촉각·시각 피드백 전달",
      leading: (
        <span className="w-8 h-8 rounded-lg bg-secondary/15 text-accent-secondary flex items-center justify-center shrink-0">
          <IconSparkles className="w-4 h-4" />
        </span>
      ),
      trailing: (
        <Switch
          label="햅틱"
          checked={hapticSwitch}
          onChange={setHapticSwitch}
        />
      ),
    },
    ...workspaceItems.map((item, idx) => ({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      meta: item.meta,
      leading: (
        <span className="w-8 h-8 rounded-lg bg-base-content/10 text-base-content flex items-center justify-center shrink-0">
          {idx === 0 ? (
            <IconCompass className="w-4 h-4" />
          ) : idx === 1 ? (
            <IconLayers className="w-4 h-4" />
          ) : (
            <IconLock className="w-4 h-4" />
          )}
        </span>
      ),
      trailing: (
        <Button
          size="xs"
          variant="ghost"
          leadingIcon={<IconTrash className="w-3.5 h-3.5" />}
          onClick={() => handleDeleteListItem(item.id)}
        >
          즉시 삭제 (Undo 토스트)
        </Button>
      ),
    })),
  ];

  return (
    <div className="space-y-8">
      {/* Progressive Streaming Server Component Slot (Suspense Skeleton) per Requirement 20 & 23 */}
      <ErrorBoundary
        fallback={({ reset }) => (
          <div className="material-regular rounded-3xl p-5 border border-error/25 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-status-error">
                RSC 스트리밍 텔레메트리 일시 장애 격리
              </h4>
              <p className="text-xs mt-0.5" style={{ color: "var(--label-secondary)" }}>
                네트워크 또는 서버 환경을 확인해 주세요. 다른 쇼케이스 컴포넌트는 정상 동작합니다.
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="btn btn-xs btn-ghost rounded-xl border border-error/25 pst-press font-semibold shrink-0 text-status-error hover:bg-error/10"
            >
              다시 시도
            </button>
          </div>
        )}
      >
        {streamingSlot}
      </ErrorBoundary>

      {/* Top Breadcrumbs & Interactive Search Architecture (Scope Bar + Search Tokens) */}
      <section className="material-regular rounded-2xl border border-base-content/10 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Breadcrumbs
            items={[
              {
                id: "bc-root",
                label: "pstui 디자인 시스템",
                icon: <IconHome className="w-3.5 h-3.5" />,
                onClick: () => onSelectSection("overview"),
              },
              {
                id: "bc-cat",
                icon: <IconGrid className="w-3.5 h-3.5" />,
                label:
                  activeSection === "overview"
                    ? "전체 37종 쇼케이스"
                    : activeSection.toUpperCase(),
              },
            ]}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary" trend="up">
              37/37 컴포넌트 작동 중
            </Badge>
            <Badge variant="success">WCAG 고대비 · 44px 히트 영역</Badge>
          </div>
        </div>

        <SearchField
          label="컴포넌트 및 디자인 토큰 실시간 필터링"
          query={searchQuery}
          onQueryChange={setSearchQuery}
          scopes={[
            "전체 (37종)",
            "탐색/레이아웃",
            "폼/입력",
            "데이터 표시",
            "피드백/인증",
          ]}
          activeScope={activeScope}
          onScopeChange={(scope) => {
            setActiveScope(scope);
            onSelectSection("overview");
          }}
          tokens={searchTokens}
          onRemoveToken={(id) =>
            setSearchTokens((prev) => prev.filter((t) => t.id !== id))
          }
          onAddSuggestedToken={(tok) =>
            setSearchTokens((prev) =>
              prev.some((t) => t.id === tok.id) ? prev : [...prev, tok]
            )
          }
        />
      </section>

      {visibleSectionKeys.length === 0 && (
        <EmptyState
          title="일치하는 컴포넌트 또는 디자인 규칙이 없습니다"
          description={`입력하신 검색어(${searchQuery ? `'${searchQuery}'` : "없음"})나 선택된 검색 토큰·범위에 해당하는 카테고리를 찾지 못했습니다. 조건을 초기화하거나 다른 키워드를 선택해 보세요.`}
          action={
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                setSearchQuery("");
                setSearchTokens([
                  { id: "tok-pst", category: "규격", value: "pstui Design System" },
                ]);
                setActiveScope("전체 (37종)");
                onSelectSection("overview");
              }}
            >
              검색 및 필터 초기화
            </Button>
          }
        />
      )}

            {showSection("navigation") && (
        <section aria-labelledby="heading-nav" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2
                id="heading-nav"
                className="text-xl font-bold tracking-tight text-base-content"
              >
                1. Layout & Navigation (8종)
              </h2>
              <p
                className="text-xs sm:text-sm"
                style={{ color: "var(--label-secondary)" }}
              >
                BottomBar · Sidebar · Breadcrumbs · Tabs (Segmented Control) ·
                Steps · Megamenu · Divider · Stack
              </p>
            </div>
            <Badge variant="primary">8 Components</Badge>
          </div>

          {/* Megamenu */}
          <Card
            title="Megamenu (메가메뉴 & Liquid Glass 팝오버)"
            subtitle="상단 다중 열 탐색 메뉴 및 추천 워크스페이스 카드"
            badge="6/37 Megamenu"
          >
            <Megamenu
              sections={[
                {
                  id: "mega-pst",
                  label: "디자인 시스템 아키텍처",
                  columns: [
                    {
                      heading: "Liquid Glass 레이어",
                      links: [
                        {
                          id: "m1",
                          title: "Regular Liquid Glass",
                          description: "사이드바, 탭 막대, 팝오버용 고가독성 블러",
                          badge: "Default",
                          onClick: () =>
                            showToast({
                              title: "Regular Liquid Glass 선택됨",
                              variant: "info",
                            }),
                        },
                        {
                          id: "m2",
                          title: "Clear Liquid Glass",
                          description: "미디어/아트워크 위 부유 제어기 + 35% 디밍",
                          onClick: () =>
                            showToast({
                              title: "Clear Liquid Glass 선택됨",
                              variant: "info",
                            }),
                        },
                      ],
                    },
                    {
                      heading: "Standard Materials (콘텐츠 전용)",
                      links: [
                        {
                          id: "m3",
                          title: "Material Regular & Thick",
                          description: "본문 카드 및 인셋 그룹 리스트 전용 표면",
                          onClick: () =>
                            showToast({
                              title: "Standard Material 안내 확인됨",
                              variant: "success",
                            }),
                        },
                        {
                          id: "m4",
                          title: "Background Extension",
                          description: "100vw/100dvh 확장 및 내부 패딩 스크롤 투과",
                        },
                      ],
                    },
                  ],
                  featuredCard: {
                    title: "pstui 시스템 자체 검증 완료",
                    subtitle:
                      "하드코딩 색상 0건, 44x44px 최소 터치 타겟, 모달 Dirty State 가드가 모두 활성화되어 있습니다.",
                    ctaLabel: "Dirty 모달 테스트…",
                    onCtaClick: () =>
                      openModal({
                        title: "문서 편집기 (Dirty State 가드 데모)",
                        description: "수정 후 닫기를 시도하면 보호 시트가 나타납니다.",
                        content: <DirtyModalDemoContent />,
                      }),
                  },
                },
                {
                  id: "mega-tokens",
                  label: "브랜드 컬러 및 접근성",
                  columns: [
                    {
                      heading: "Vibrant Accent Tokens",
                      links: [
                        {
                          id: "m5",
                          title: "Primary (#ff00bb)",
                          description: "Display-P3 와이드 컬러 및 핵심 CTA 전용",
                          badge: "P3",
                        },
                        {
                          id: "m6",
                          title: "Secondary (#ea00ff)",
                          description: "브랜드 그라디언트 및 슬라이더 트랙 강조",
                        },
                      ],
                    },
                  ],
                },
              ]}
            />
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Tabs (Segmented Control) + Steps */}
            <Card
              title="Tabs (구분 제어기 Segmented Control) & Steps (스텝)"
              subtitle="동일 너비(flex: 1) 세그먼트 탭과 비색상 단서가 병기된 진행 단계"
              badge="4 & 5/37"
            >
              <div className="space-y-5">
                <Tabs
                  variant="segmented"
                  activeId={activeTabId}
                  onChange={setActiveTabId}
                  items={[
                    {
                      id: "segmented-1",
                      label: "디자인 원칙",
                      badge: "8",
                      content: (
                        <p className="text-xs leading-relaxed">
                          목적(Purpose), 자율성(Autonomy), 책임감(Responsibility),
                          친숙함(Familiarity), 유연성(Flexibility), 단순함(Simplicity),
                          장인 정신(Craftsmanship), 즐거움(Delight)을 준수합니다.
                        </p>
                      ),
                    },
                    {
                      id: "segmented-2",
                      label: "반응형 뷰포트",
                      content: (
                        <p className="text-xs leading-relaxed">
                          모바일(&lt; 768px)에서는 스크롤 시 축소되는 하단 플로팅 탭 막대와
                          상단 모핑 앱바가 동작하며, 태블릿/PC(&gt;= 768px)에서는 좌측 폴딩
                          사이드바와 통합 워크스페이스 프레임이 렌더링됩니다.
                        </p>
                      ),
                    },
                    {
                      id: "segmented-3",
                      label: "모션 피드백",
                      content: (
                        <p className="text-xs leading-relaxed">
                          모든 버튼은 :active 시 scale(0.96) 스프링 트랜지션으로 즉각
                          반응하며, prefers-reduced-motion 설정을 존중합니다.
                        </p>
                      ),
                    },
                  ]}
                />

                <Divider label="배포 파이프라인 단계 (Steps)" />

                <Steps
                  items={[
                    {
                      id: "st-1",
                      title: "토큰 설계",
                      description: "DESIGN.md",
                      status: currentStepIdx > 0 ? "completed" : "current",
                    },
                    {
                      id: "st-2",
                      title: "컴포넌트 구현",
                      description: "37종 모듈",
                      status:
                        currentStepIdx > 1
                          ? "completed"
                          : currentStepIdx === 1
                          ? "current"
                          : "upcoming",
                    },
                    {
                      id: "st-3",
                      title: "접근성 검증",
                      description: "Self-QA",
                      status: currentStepIdx === 2 ? "current" : "upcoming",
                    },
                  ]}
                  onStepClick={(id) => {
                    if (id === "st-1") setCurrentStepIdx(0);
                    if (id === "st-2") setCurrentStepIdx(1);
                    if (id === "st-3") setCurrentStepIdx(2);
                  }}
                />
              </div>
            </Card>

            {/* BottomBar & Sidebar Inline Interactive Previews + Stack */}
            <Card
              title="BottomBar, Sidebar (인라인 미니 프리뷰) & Stack"
              subtitle="실제 뷰포트 하단/좌측에 마운트된 내비게이션의 독립 컴포넌트 프리뷰"
              badge="1, 2, 3, 7, 8/37"
            >
              <div className="space-y-4">
                <BottomBar
                  inlinePreview
                  activeId={inlineBottomTab}
                  onSelect={setInlineBottomTab}
                  items={[
                    {
                      id: "home",
                      label: "홈",
                      icon: <IconHome className="w-5 h-5" />,
                      activeIcon: <IconHome className="w-5 h-5" filled />,
                    },
                    {
                      id: "explore",
                      label: "탐색",
                      badge: 3,
                      icon: <IconCompass className="w-5 h-5" />,
                      activeIcon: <IconCompass className="w-5 h-5" filled />,
                    },
                    {
                      id: "library",
                      label: "보관함",
                      icon: <IconFolder className="w-5 h-5" />,
                      activeIcon: <IconFolder className="w-5 h-5" filled />,
                    },
                    {
                      id: "profile",
                      label: "계정",
                      icon: <IconUser className="w-5 h-5" />,
                      activeIcon: <IconUser className="w-5 h-5" filled />,
                    },
                  ]}
                />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-3">
                    <Button
                      size="xs"
                      variant="soft"
                      onClick={() =>
                        setInlineSidebarCollapsed((prev) => !prev)
                      }
                    >
                      {inlineSidebarCollapsed
                        ? "미니 사이드바 펼치기"
                        : "미니 사이드바 접기"}
                    </Button>
                    <span
                      className="text-xs font-medium"
                      style={{ color: "var(--label-secondary)" }}
                    >
                      선택 탭: <strong className="text-base-content">{inlineSidebarActive}</strong>
                    </span>
                  </div>

                  <Stack
                    items={[
                      <div
                        key="s1"
                        className="material-thick rounded-2xl p-3 w-56 border border-base-content/15 shadow-sm"
                      >
                        <p className="text-xs font-bold text-accent-primary">
                          Layer 01 · 활성 알림
                        </p>
                        <p className="text-xs text-base-content font-medium mt-0.5">
                          Liquid Glass 아키텍처 정상 작동
                        </p>
                      </div>,
                      <div
                        key="s2"
                        className="material-regular rounded-2xl p-3 w-56 border border-base-content/15 shadow-sm"
                      >
                        <p className="text-xs font-bold text-accent-secondary">
                          Layer 02 · 동기화 큐
                        </p>
                        <p className="text-xs text-base-content font-medium mt-0.5">
                          Firebase Auth 세션 준비 완료
                        </p>
                      </div>,
                      <div
                        key="s3"
                        className="material-thin rounded-2xl p-3 w-56 border border-base-content/15 shadow-sm"
                      >
                        <p className="text-xs font-bold text-base-content">
                          Layer 03 · 백업 스냅샷
                        </p>
                        <p className="text-xs text-base-content font-medium mt-0.5">
                          클릭하여 다음 카드 전면 배치
                        </p>
                      </div>,
                    ]}
                  />
                </div>

                {/* Inline Collapsible Sidebar Preview */}
                <div className="overflow-visible p-3 -m-3">
                  <Sidebar
                    inlinePreview
                    className="!h-48"
                    isCollapsed={inlineSidebarCollapsed}
                    onToggleCollapse={() =>
                      setInlineSidebarCollapsed((prev) => !prev)
                    }
                    activeId={inlineSidebarActive}
                    onSelect={setInlineSidebarActive}
                    items={[
                      {
                        id: "dashboard",
                        label: "대시보드",
                        badge: "New",
                        icon: <IconGrid className="w-4 h-4" />,
                        activeIcon: <IconGrid className="w-4 h-4" filled />,
                      },
                      {
                        id: "analytics",
                        label: "성능 분석",
                        icon: <IconChart className="w-4 h-4" />,
                        activeIcon: <IconChart className="w-4 h-4" filled />,
                      },
                    ]}
                  />
                </div>
              </div>
            </Card>
          </div>
        </section>
      )}

            {showSection("containment") && (
        <section aria-labelledby="heading-containment" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2
                id="heading-containment"
                className="text-xl font-bold tracking-tight text-base-content"
              >
                2. Containment & Disclosure (5종)
              </h2>
              <p
                className="text-xs sm:text-sm"
                style={{ color: "var(--label-secondary)" }}
              >
                Accordion · Collapse · Card (Standard Material) · Carousel ·
                Dropdown (PullDownMenu 삭제 보호 포함)
              </p>
            </div>
            <Badge variant="primary">5 Components</Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card
              title="Accordion (단일 열림 라디오 그룹) & Collapse (개별 열림)"
              subtitle="점진적 노출(Progressive Disclosure)로 화면 복잡도를 낮춥니다"
              badge="9 & 10 & 11/37"
            >
              <div className="space-y-3">
                <Accordion
                  items={[
                    {
                      id: "acc-1",
                      title: "1. 레이어 분리 원칙 (Liquid Glass vs Standard Material)",
                      subtitle: "필수 규칙",
                      content:
                        "내비게이션 바와 모달 등 부유하는 탐색/기능 레이어에만 Liquid Glass를 적용하고, 일반 카드(Card)와 리스트 행(List)에는 반드시 Standard Material(--material-regular)을 사용합니다.",
                    },
                    {
                      id: "acc-2",
                      title: "2. 배경 확장 (Background Extension)",
                      subtitle: "Edge-to-Edge",
                      content:
                        "<main> 영역을 마진으로 잘라내지 않고 내부 패딩(padding-inline-start, padding-bottom)을 부여하여 스크롤 시 콘텐츠가 반투명한 사이드바와 탭 막대 뒤로 자연스럽게 지나갑니다.",
                    },
                    {
                      id: "acc-3",
                      title: "3. 브랜드 강조 절제 (#ff00bb & #ea00ff)",
                      subtitle: "Accent Restraint",
                      content:
                        "화면에서 가장 중요한 1~2개의 핵심 행동(Primary CTA)과 활성 상태 표시기에만 브랜드 컬러를 사용합니다.",
                    },
                  ]}
                />

                <Collapse
                  title="추가 기술 사양 펼쳐보기 (Collapse 개별 제어기)"
                  subtitle="독립 체크박스 기반"
                  iconStyle="plus"
                >
                  DaisyUI 5 + Tailwind CSS v4 + Next.js App Router 기반이며,
                  prefers-color-scheme, prefers-contrast, prefers-reduced-motion
                  미디어 쿼리에 즉시 반응합니다.
                </Collapse>
              </div>
            </Card>

            <Card
              title="Carousel (캐러셀) & Dropdown (Pull-Down Menu 삭제 보호)"
              subtitle="풀 다운 메뉴 내부의 파괴적(삭제) 항목 클릭 시 즉시 삭제하지 않고 확인 팝오버/시트를 먼저 호출합니다"
              badge="12 & 13/37"
              actions={
                <Dropdown
                  triggerLabel="워크스페이스 작업 메뉴 (3+ 항목)"
                  items={[
                    {
                      id: "dd-dup",
                      label: "워크스페이스 복제",
                      icon: <IconCopy className="w-4 h-4" />,
                      onClick: () =>
                        showToast({
                          title: "워크스페이스가 복제되었습니다",
                          variant: "success",
                        }),
                    },
                    {
                      id: "dd-export",
                      label: "디자인 토큰 내보내기…",
                      icon: <IconDownload className="w-4 h-4" />,
                      onClick: () =>
                        showToast({
                          title: "tokens.json 내보내기 준비 완료",
                          variant: "info",
                        }),
                    },
                    {
                      id: "dd-delete",
                      label: "워크스페이스 영구 삭제",
                      icon: <IconTrash className="w-4 h-4" />,
                      isDestructive: true,
                      confirmVerb: "영구 삭제",
                      confirmDescription:
                        "풀 다운 메뉴의 삭제 항목은 즉시 실행되지 않고 이 인라인 확인 창을 먼저 거칩니다.",
                      onClick: () =>
                        showToast({
                          title: "확인 절차를 거쳐 안전하게 삭제되었습니다",
                          variant: "warning",
                        }),
                    },
                  ]}
                />
              }
            >
              <Carousel
                slides={[
                  {
                    id: "sl-1",
                    tag: "Slide 01 · Physics Motion",
                    title: "즉각적인 포인터 반응과 스프링 물리",
                    subtitle:
                      "사용자의 터치 및 클릭 즉시 scale(0.96)과 cubic-bezier(0.22, 1, 0.36, 1) 곡선으로 지연 없이 반응합니다.",
                  },
                  {
                    id: "sl-2",
                    tag: "Slide 02 · Inclusive Color",
                    title: "비색상 단서(Icon & Glyph) 병행",
                    subtitle:
                      "색맹 및 고대비 모드 사용자를 위해 모든 상태 배지, 토스트, 알러트에 체크(✓), 느낌표(!), 화살표(▲/▼) 기호를 함께 렌더링합니다.",
                  },
                  {
                    id: "sl-3",
                    tag: "Slide 03 · Autonomy & Forgiveness",
                    title: "실수 방지와 관용적 실행 취소(Undo)",
                    subtitle:
                      "모달 입력 중 실수로 닫을 때는 Dirty State 시트로 보호하고, 일반 목록 삭제는 즉시 처리 후 하단 실행 취소 토스트를 띄웁니다.",
                  },
                ]}
              />
            </Card>

            <Card
              title="Card 이미지 종횡비 예약 & Blur 플레이스홀더"
              subtitle="Next.js Image와 base64 블러 데이터로 레이아웃 시프트 0 (Zero-CLS) 및 고품질 로딩 연출"
              badge="Zero-CLS 이미지 예약"
              imageUrl="/og-image.png"
              imageAlt="pstui 오픈 소스 프레임워크 프리뷰"
            >
              <div className="space-y-2">
                <p className="text-xs leading-relaxed text-base-content/85">
                  <code className="text-accent-primary font-bold">placeholder=&quot;blur&quot;</code>와 인라인 SVG base64 데이터를 적용하여 이미지가 로드되기 전 빈 공간으로 두지 않고 부드러운 블러가 깔립니다.
                </p>
                <p className="text-xs leading-relaxed text-base-content/85">
                  종횡비(Aspect Ratio)를 컨테이너 차원에서 사전에 확보하여 이미지가 다운로드 완료되는 순간 하단 텍스트가 덜컹거리며 아래로 밀리는 참사(CLS)를 완전히 차단합니다.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="badge badge-xs badge-soft badge-primary font-semibold">
                    Zero-CLS 예약
                  </span>
                  <span className="badge badge-xs badge-soft badge-secondary font-semibold">
                    Blur Preview
                  </span>
                  <span className="badge badge-xs badge-outline font-semibold">
                    Aspect Ratio 16/9
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </section>
      )}

            {showSection("forms") && (
        <section aria-labelledby="heading-forms" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2
                id="heading-forms"
                className="text-xl font-bold tracking-tight text-base-content"
              >
                3. Form & Data Input (10종 + 모바일 최적화 제어기)
              </h2>
              <p
                className="text-xs sm:text-sm"
                style={{ color: "var(--label-secondary)" }}
              >
                Button · Checkbox (Indeterminate) · Radio · Select · Fieldset ·
                FileUpload · Filter · OTP · Rating · Swap · TextField · Slider
              </p>
            </div>
            <Badge variant="primary">10+ Components</Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Button, Checkbox (Hierarchical Indeterminate), Swap, Rating */}
            <Fieldset
              legend="Button, 계층형 Checkbox (Indeterminate), Swap, Rating"
              description="모든 인터랙티브 요소는 최소 44x44px 히트 영역과 :active 스케일 피드백을 보장합니다."
            >
              {/* Buttons Row */}
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  variant="primary"
                  isLoading={isAsyncSaving}
                  loadingLabel="결제 중…"
                  onClick={handleAsyncAction}
                >
                  비동기 결제하기
                </Button>

                <Button
                  variant="soft"
                  opensModal
                  onClick={() =>
                    openModal({
                      title: "프로필 편집 모달 (Dirty State 가드 지원)",
                      description: "모달을 여는 버튼에는 생략 부호(…)가 자동 적용됩니다.",
                      content: <DirtyModalDemoContent />,
                    })
                  }
                >
                  프로필 편집
                </Button>

                <Button
                  variant="destructive"
                  onClick={() =>
                    openAlertDialog({
                      title: "선택한 캐시 데이터를 지우시겠습니까?",
                      description:
                        "경고창 확인 버튼에는 '확인(OK)' 대신 구체적인 동사('지우기')를 사용하며, 좌측에 '취소'를 배치합니다.",
                      actionVerb: "지우기",
                      isDestructive: true,
                      onAction: () => {
                        showToast({
                          title: "캐시 데이터가 지워졌습니다",
                          variant: "info",
                        });
                      },
                    })
                  }
                >
                  캐시 지우기…
                </Button>

                <Swap
                  active={swapActive}
                  onToggle={setSwapActive}
                  effect="rotate"
                  onElement={
                    <span className="inline-flex items-center gap-1.5">
                      <IconSpeakerWave className="w-4 h-4 text-accent-primary" />
                      <span>사운드 켜짐</span>
                    </span>
                  }
                  offElement={
                    <span className="inline-flex items-center gap-1.5">
                      <IconSpeakerMute className="w-4 h-4" />
                      <span>사운드 꺼짐</span>
                    </span>
                  }
                />
              </div>

              <Divider label="계층형 체크박스 (혼재 상태 Indeterminate '-' 지원)" />

              <div className="space-y-1">
                <Checkbox
                  label="전체 디자인 시스템 품질 검증 항목 선택 (부모 체크상자)"
                  description={
                    isIndeterminate
                      ? "하위 항목 일부만 선택되어 혼재 상태(indeterminate: 대시 '-')가 표시됩니다."
                      : allChecked
                      ? "모든 하위 항목이 선택되었습니다."
                      : "선택된 항목이 없습니다."
                  }
                  checked={allChecked}
                  indeterminate={isIndeterminate}
                  onChange={handleToggleAllChecks}
                />
                <div className="ps-6 grid grid-cols-1 sm:grid-cols-3 gap-1">
                  <Checkbox
                    label="Liquid Glass 분리"
                    checked={childChecks.design}
                    onChange={(v) =>
                      setChildChecks((p) => ({ ...p, design: v }))
                    }
                  />
                  <Checkbox
                    label="44px 히트 영역"
                    checked={childChecks.a11y}
                    onChange={(v) =>
                      setChildChecks((p) => ({ ...p, a11y: v }))
                    }
                  />
                  <Checkbox
                    label="스프링 트랜지션"
                    checked={childChecks.motion}
                    onChange={(v) =>
                      setChildChecks((p) => ({ ...p, motion: v }))
                    }
                  />
                </div>
              </div>

              <Divider label="Rating (별점 평가 및 초기화)" />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <Rating value={ratingValue} onChange={setRatingValue} />
                <Rating value={5} readOnly size="sm" />
              </div>
            </Fieldset>

            {/* Radio (2~5 options vs 6+ Select Auto-Fallback), Select, Filter, Slider */}
            <Fieldset
              legend="Radio (2~5개 제한 규칙), Select, Filter, Slider"
              description="상호 배타적 옵션이 6개 이상이면 Radio 대신 자동으로 Select 드롭다운으로 전환됩니다."
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-base-content">
                  옵션 개수 규칙 테스트
                </span>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setUseSixOptionsDemo((prev) => !prev)}
                >
                  {useSixOptionsDemo
                    ? "3개 옵션(Radio)으로 보기"
                    : "6개 옵션(Select 자동 전환) 테스트"}
                </Button>
              </div>

              <Radio
                legend="머티리얼 두께(Material Weight) 선택"
                value={radioValue}
                onChange={setRadioValue}
                options={
                  useSixOptionsDemo
                    ? [
                        { value: "ultra-thin", label: "Ultra-Thin Material" },
                        { value: "thin", label: "Thin Material" },
                        { value: "regular", label: "Regular Material (기본)" },
                        { value: "thick", label: "Thick Material" },
                        { value: "glass-reg", label: "Regular Liquid Glass" },
                        { value: "glass-clear", label: "Clear Liquid Glass" },
                      ]
                    : [
                        {
                          value: "thin",
                          label: "Thin Material",
                          description: "인라인 선택 항목 강조용",
                        },
                        {
                          value: "regular",
                          label: "Regular Material (권장)",
                          description: "기본 카드 및 그룹화된 섹션 배경",
                        },
                        {
                          value: "thick",
                          label: "Thick Material",
                          description: "높은 텍스트 대비가 필요한 전경 요소",
                        },
                      ]
                }
              />

              <Select
                label="리전 서버 선택 (6개 이상 옵션 전용 Select)"
                value={selectValue}
                onChange={setSelectValue}
                options={[
                  { value: "seoul", label: "ap-northeast-2 (서울)" },
                  { value: "tokyo", label: "ap-northeast-1 (도쿄)" },
                  { value: "singapore", label: "ap-southeast-1 (싱가포르)" },
                  { value: "oregon", label: "us-west-2 (오리건)" },
                  { value: "virginia", label: "us-east-1 (버지니아)" },
                  { value: "frankfurt", label: "eu-central-1 (프랑크푸르트)" },
                ]}
              />

              <div className="space-y-1">
                <span className="block text-xs font-semibold text-base-content">
                  Filter (선택 시 다른 옵션 숨김 + × 리셋 버튼)
                </span>
                <Filter
                  options={["모바일 (Mobile)", "데스크톱 (Desktop)", "태블릿 (Tablet)", "공간 컴퓨팅 (Spatial)"]}
                  selected={filterSelected}
                  onChange={setFilterSelected}
                />
              </div>

              <Slider
                label="백드롭 블러 강도 및 채도 (Brand Gradient Track + 숫자/스텝퍼)"
                value={sliderValue}
                min={0}
                max={100}
                step={2}
                unit="%"
                onChange={setSliderValue}
              />
            </Fieldset>
          </div>

          {/* TextField (onBlur vs onChange validation), OTP, FileUpload */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card
              title="TextField (고정 레이블 + 지우기 ✕ 버튼 + 유효성 검사 분리) & OTP"
              subtitle="이메일 포맷은 onBlur에서, 아이디 규칙은 onChange에서 즉시 검사합니다"
              badge="21/37 OTP & TextField"
            >
              <div className="space-y-4">
                <TextField
                  label="이메일 주소 (onBlur 포맷 검사)"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={emailInput}
                  onChange={setEmailInput}
                  validateOnBlur={(val) =>
                    !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
                      ? null
                      : "이메일 포맷이 올바르지 않습니다 (onBlur 시점 검사)."
                  }
                  helperText="다른 필드로 포커스를 이동(onBlur)할 때 포맷을 검증합니다."
                />

                <TextField
                  label="워크스페이스 슬러그 (onChange 실시간 규칙 검사)"
                  type="text"
                  value={usernameInput}
                  onChange={setUsernameInput}
                  validateOnChange={(val) =>
                    /^[a-z0-9_]{3,24}$/.test(val)
                      ? null
                      : "영문 소문자, 숫자, 밑줄(_)만 사용하여 3~24자로 입력하세요."
                  }
                  helperText="타이핑 즉시(onChange) 실시간으로 규칙 피드백을 제공합니다."
                />

                <Divider label="2단계 보안 인증 코드 (OTP)" />

                <OTP
                  length={6}
                  value={otpValue}
                  onChange={setOtpValue}
                  label="6자리 원타임 패스코드 (autoComplete='one-time-code')"
                />
              </div>
            </Card>

            <Card
              title="FileUpload (드래그 앤 드롭 & 파일 선택기)"
              subtitle="파일 드래그 앤 드롭과 파일 목록 용량 확인 및 개별 제거를 지원합니다"
              badge="19/37 FileUpload"
            >
              <FileUpload
                label="디자인 에셋 및 스펙 문서 업로드"
                emptyState={
                  <EmptyState
                    size="sm"
                    title="첨부된 파일이 없습니다"
                    description="디자인 파일(.fig, .zip) 또는 문서를 드래그하여 업로드하세요."
                  />
                }
              />
            </Card>
          </div>
        </section>
      )}

            {showSection("display") && (
        <section aria-labelledby="heading-display" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2
                id="heading-display"
                className="text-xl font-bold tracking-tight text-base-content"
              >
                4. Data Display (9종)
              </h2>
              <p
                className="text-xs sm:text-sm"
                style={{ color: "var(--label-secondary)" }}
              >
                Badge · Calendar · ChatBubble · Countdown · Diff · KBD · List
                (인셋 그룹형 Inset Grouped) · Mask · Link
              </p>
            </div>
            <Badge variant="primary">9 Components</Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Calendar & Countdown */}
            <Card
              title="Calendar (인터랙티브 달력) & Countdown (실시간 카운트다운)"
              subtitle="날짜 선택기와 CSS 변수(--value) 기반 카운트다운 트랜지션"
              badge="25 & 27/37"
            >
              <div className="space-y-4">
                <Calendar
                  selectedDate={selectedDate}
                  onSelectDate={(d) => {
                    setSelectedDate(d);
                    showToast({
                      title: `${d.getMonth() + 1}월 ${d.getDate()}일 일정이 선택됨`,
                      variant: "info",
                      durationMs: 2200,
                    });
                  }}
                />
                <Countdown />
              </div>
            </Card>

            {/* ChatBubble, Badge, KBD, Mask, Link */}
            <Card
              title="ChatBubble, Badge, KBD, Mask, Link"
              subtitle="대화형 버블, 비색상 단서 배지, 단축키 표시기, 6종 마스크 셰이프, 접근성 링크"
              badge="24, 26, 29, 31, 32/37"
            >
              <div className="space-y-4">
                <ChatBubble
                  messages={[
                    {
                      id: "c1",
                      sender: "pstui 디자인 리드",
                      time: "오후 2:14",
                      message:
                        "일반 카드나 리스트 행에 --liquid-glass-* 토큰이 들어가지 않도록 분리하셨나요?",
                      placement: "start",
                      avatarInitials: "PL",
                    },
                    {
                      id: "c2",
                      sender: "프론트엔드 엔지니어",
                      time: "오후 2:15",
                      message:
                        "네! 부유하는 탐색 레이어에만 Liquid Glass를 적용하고, 카드와 리스트는 Standard Material로 엄격히 분리했습니다.",
                      placement: "end",
                      status: "읽음 · 방금 전",
                      avatarInitials: "FE",
                    },
                  ]}
                />

                <Divider label="Badge (비색상 기호 병기) & KBD 단축키" />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="success">빌드 통과</Badge>
                    <Badge variant="warning">검토 필요</Badge>
                    <Badge variant="error">충돌 감지</Badge>
                    <Badge variant="primary" trend="up">
                      14.8%
                    </Badge>
                    <Badge variant="outline" trend="down">
                      2.1%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <KBD keys={["⌘", "Shift", "P"]} label="명령 팔레트" />
                  </div>
                </div>

                <Divider label="Mask (마스크 셰이프) & Link (링크)" />

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Mask shape="squircle" label="Squircle 마스크">
                      <IconSparkles className="w-5 h-5" />
                    </Mask>
                    <Mask shape="hexagon" label="Hexagon 마스크">
                      <IconLayers className="w-5 h-5" />
                    </Mask>
                    <Mask shape="circle" label="Circle 마스크">
                      <IconCompass className="w-5 h-5" />
                    </Mask>
                    <Mask shape="star-2" label="Star 마스크">
                      <IconStar className="w-5 h-5" />
                    </Mask>
                    <Mask shape="heart" label="Heart 마스크">
                      <IconHeart className="w-5 h-5" />
                    </Mask>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Link
                      href="#heading-feedback"
                      onClick={(e) => {
                        e.preventDefault();
                        onSelectSection("feedback");
                      }}
                    >
                      인증 및 피드백 섹션으로 이동
                    </Link>
                    <Link href="https://daisyui.com" external variant="secondary">
                      DaisyUI 공식 문서
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Diff Comparison View */}
            <Card
              title="Diff (Liquid Glass vs Standard Material 비교 뷰)"
              subtitle="가운데 슬라이더 핸들을 좌우로 드래그하여 두 레이어 아키텍처를 비교하세요"
              badge="28/37 Diff"
            >
              <Diff />
            </Card>

            {/* Inset Grouped List */}
            <Card
              title="List (인셋 그룹형 Inset Grouped 스타일 & 즉시 삭제 Undo 토스트)"
              subtitle="행 내부 Switch 제어기 및 경고창 없는 관용적 삭제(Undo 토스트 연동)"
              badge="30/37 List"
            >
              <List
                header="워크스페이스 설정 및 활성 모듈"
                footer="항목을 삭제하면 확인 모달 없이 즉시 처리되며 하단 알림 버블(Toast)에서 '실행 취소'할 수 있습니다."
                items={listRows}
                emptyState={
                  <EmptyState
                    size="sm"
                    title="남은 워크스페이스 항목이 없습니다"
                    description="모든 항목이 삭제되었습니다. 하단 실행 취소 토스트를 클릭하여 복원할 수 있습니다."
                  />
                }
              />
            </Card>

            {/* VirtualList TanStack Virtual 500 items + sessionStorage scroll restoration */}
            <Card
              title="VirtualList (TanStack Virtual & 스크롤 위치 복원)"
              subtitle="대용량 500개 디자인 토큰 리스트를 DOM 낭비 없이 렌더링하며 세션 스토리지에 스크롤 위치를 자동 복원합니다"
              badge="30/37 Virtual"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-base-content/70 px-1">
                  <span>총 {virtualDemoItems.length}개 토큰 아이템 (윈도잉 가상화)</span>
                  <Badge variant="outline" size="xs">DOM 최적화</Badge>
                </div>
                <VirtualList
                  items={virtualDemoItems}
                  itemHeight={64}
                  containerHeight="280px"
                  storageKey="pstui_showcase_virtual_scroll"
                  emptyState={
                    <EmptyState
                      size="sm"
                      title="가상화 토큰 항목이 없습니다"
                      description="표시할 대용량 데이터 항목이 비어 있습니다."
                    />
                  }
                  renderItem={(item, index) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl border border-base-content/10 bg-base-100/40 hover:bg-base-100/70 transition-colors flex items-center justify-between gap-3 mb-2"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono font-bold text-accent-primary shrink-0 w-8">
                          #{index + 1}
                        </span>
                        <div className="min-w-0 truncate">
                          <p className="text-xs font-semibold text-base-content truncate">{item.name}</p>
                          <p className="text-[11px] text-base-content/60 truncate">{item.category}</p>
                        </div>
                      </div>
                      <Badge variant="outline" size="xs">{item.contrast}</Badge>
                    </div>
                  )}
                />
              </div>
            </Card>

            {/* Intercepting Routes Modal Preview */}
            <Card
              title="Next.js 16 Intercepting Routes (앱 네이티브 모달)"
              subtitle="URL이 변경되는 동시에 현재 페이지를 배경으로 유지하며 부드러운 병렬 라우트 모달을 표시합니다"
              badge="23/37 Routes"
            >
              <div className="space-y-4">
                <p className="text-xs text-base-content/70 leading-relaxed">
                  Next.js 16 App Router의 <code className="text-accent-primary">@modal/(.)preview/[id]</code> 병렬 인터셉팅 라우트입니다. 링크 클릭 시 브라우저 히스토리와 URL이 갱신되지만 페이지 새로고침 없이 Liquid Glass 모달로 부유하며, 직접 방문 시 독립 단독 페이지(<code className="text-accent-primary">/preview/[id]</code>)로 우아하게 대체됩니다.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <ViewTransitionLink
                    href="/preview/button"
                    className="p-3.5 rounded-2xl border border-base-content/15 bg-base-100/50 hover:bg-base-100/80 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-bold text-base-content group-hover:text-accent-primary transition-colors">
                        Button 컴포넌트 미리보기
                      </p>
                      <p className="text-[11px] text-base-content/60">/preview/button</p>
                    </div>
                    <span className="text-xs text-accent-primary font-bold">열기 →</span>
                  </ViewTransitionLink>
                  <ViewTransitionLink
                    href="/preview/card"
                    className="p-3.5 rounded-2xl border border-base-content/15 bg-base-100/50 hover:bg-base-100/80 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-bold text-base-content group-hover:text-accent-primary transition-colors">
                        Card 컴포넌트 미리보기
                      </p>
                      <p className="text-[11px] text-base-content/60">/preview/card</p>
                    </div>
                    <span className="text-xs text-accent-primary font-bold">열기 →</span>
                  </ViewTransitionLink>
                </div>
              </div>
            </Card>
          </div>
        </section>
      )}

            {showSection("feedback") && (
        <section aria-labelledby="heading-feedback" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2
                id="heading-feedback"
                className="text-xl font-bold tracking-tight text-base-content"
              >
                5. Feedback & Status (5종) + 전역 오버레이 & Firebase 인증
              </h2>
              <p
                className="text-xs sm:text-sm"
                style={{ color: "var(--label-secondary)" }}
              >
                Alert · Indicator · Progress · RadialProgress · Tooltip ·
                useModal (Dirty Guard / Pre-Alert) · useToast · Firebase Auth
              </p>
            </div>
            <Badge variant="primary">5+ Components</Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Alert, Progress, RadialProgress, Indicator, Tooltip */}
            <Card
              title="Alert, Progress (확정 진행률), RadialProgress, Indicator, Tooltip"
              subtitle="구체적인 작업 설명과 일시 정지/취소 보호, 비색상 아이콘 단서를 제공합니다"
              badge="33, 34, 35, 36, 37/37"
            >
              <div className="space-y-4">
                <Alert
                  variant="warning"
                  title="로컬 스토리지 캐시 용량이 85%에 도달했습니다"
                  description="'오류 329347' 같은 모호한 코드 대신 원인과 해결 방법을 명확한 문장으로 안내합니다."
                  actionLabel="캐시 비우기"
                  onAction={() =>
                    showToast({
                      title: "임시 캐시가 정리되었습니다",
                      variant: "success",
                    })
                  }
                  onCancel={() =>
                    showToast({
                      title: "캐시 정리를 건너뛰었습니다",
                      variant: "info",
                    })
                  }
                />

                <Progress
                  value={progressValue}
                  max={100}
                  taskDescription="디자인 시스템 리소스 패키지 색인 생성 중 (142 / 208 파일)"
                  isPaused={isProgressPaused}
                  onTogglePause={() => setIsProgressPaused((p) => !p)}
                  onCancel={() => {
                    setProgressValue(0);
                    showToast({
                      title: "색인 작업이 취소되었습니다",
                      variant: "info",
                    });
                  }}
                />

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-4">
                    <RadialProgress
                      value={progressValue}
                      sizeRem={4.5}
                      label="동기화율"
                      color="primary"
                    />
                    <RadialProgress
                      value={96}
                      sizeRem={4.5}
                      label="접근성 점수"
                      color="success"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Indicator badgeText="LIVE" color="primary">
                      <div className="px-4 py-2.5 rounded-2xl material-regular border border-base-content/15 text-xs font-semibold text-base-content">
                        실시간 웹소켓 상태
                      </div>
                    </Indicator>

                    <Tooltip
                      tip="포인터 호버 시 상세 툴팁 설명을 표시합니다"
                      placement="top"
                      color="primary"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setProgressValue((v) => (v >= 100 ? 20 : v + 15))
                        }
                      >
                        진행률 +15% 증가
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </Card>

            {/* Global Modal / Dirty State / Pre-Permission / Toast & Firebase Auth Testbench */}
            <Card
              title="전역 피드백(useModal, useToast) & Firebase Auth 테스트벤치"
              subtitle="어디서든 호출 가능한 모달, 미저장 데이터 보호 시트, 사전 권한 안내, 토스트 및 인증 상태"
              badge="Overlay & Firebase"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <Button
                    variant="primary"
                    size="sm"
                    opensModal
                    onClick={() =>
                      openModal({
                        title: "미저장 데이터(Dirty State) 보호 모달",
                        description:
                          "입력 후 닫기/ESC/배경 클릭 시 확인 시트가 뜹니다.",
                        content: <DirtyModalDemoContent />,
                      })
                    }
                  >
                    Dirty State 모달 열기
                  </Button>

                  <Button
                    variant="soft"
                    size="sm"
                    opensModal
                    onClick={() =>
                      openPrePermissionModal({
                        title: "알림 권한 사전 안내 (Pre-Alert Screen)",
                        description:
                          "시스템 권한 팝업을 띄우기 전에 왜 권한이 필요한지 투명하게 설명합니다.",
                        featurePurpose:
                          "빌드 완료 및 보안 인증 요청 알림을 실시간으로 전달하기 위해 사용되며, 마케팅 목적으로 활용되지 않습니다.",
                        buttonLabel: "계속",
                        onContinue: () => {
                          showToast({
                            title: "사전 안내 확인 완료",
                            description:
                              "다크 패턴 없이 단일 '계속' 버튼만 제공되었습니다.",
                            variant: "success",
                          });
                        },
                      })
                    }
                  >
                    사전 권한 안내 모달
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      showToast({
                        title: "하단 플로팅 알림 버블 (Toast)",
                        description:
                          "Liquid Glass 머티리얼과 실행 취소 액션을 지원합니다.",
                        variant: "success",
                        undoLabel: "실행 취소",
                        onUndo: () =>
                          showToast({
                            title: "방금 작업이 실행 취소되었습니다",
                            variant: "info",
                          }),
                      })
                    }
                  >
                    하단 토스트 버블 호출
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    opensModal
                    onClick={() =>
                      openAlertDialog({
                        title: "프로젝트 스냅샷을 초기화하시겠습니까?",
                        description:
                          "되돌릴 수 없는 파괴적 작업에만 확인 다이얼로그를 표시하며 구체적인 동사('초기화')를 사용합니다.",
                        actionVerb: "초기화",
                        isDestructive: true,
                        onAction: () => {
                          showToast({
                            title: "스냅샷이 초기화되었습니다",
                            variant: "warning",
                          });
                        },
                      })
                    }
                  >
                    긴급 경고창 호출
                  </Button>

                  <Button
                    variant="soft"
                    size="sm"
                    opensModal
                    onClick={() => {
                      triggerHaptic("selection");
                      setIsBottomSheetOpen(true);
                    }}
                  >
                    바텀 시트 (BottomSheet) 열기
                  </Button>
                </div>

                <Divider label="Google Firebase Authentication & ProtectedRoute" />

                <div className="rounded-2xl material-regular p-4 space-y-3 border border-base-content/15">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-base-content">
                        SDK 상태:{" "}
                        <span className="text-accent-primary font-bold">
                          {isConfigured
                            ? "Firebase Live 연결됨"
                            : "Mock/Fallback 안전 모드 (크래시 방지)"}
                        </span>
                      </p>
                      <p
                        className="text-xs font-medium"
                        style={{ color: "var(--label-secondary)" }}
                      >
                        {user
                          ? `현재 로그인: ${user.displayName} (${user.email}) · 방식: ${user.authMethod}`
                          : "현재 비로그인 상태입니다. 아래 보호된 경로(ProtectedRoute)에서 즉시 인증을 테스트하세요."}
                      </p>
                    </div>
                    {user ? (
                      <Button size="xs" variant="ghost" onClick={() => signOut()}>
                        로그아웃
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="xs"
                          variant="soft"
                          onClick={() => signInWithPasskey()}
                        >
                          <IconPasskey className="w-3.5 h-3.5 shrink-0" />
                          <span>패스키 빠른 로그인</span>
                        </Button>
                        <Button
                          size="xs"
                          variant="primary"
                          opensModal
                          onClick={openAuthModal}
                        >
                          인증 모달
                        </Button>
                      </div>
                    )}
                  </div>

                  <ProtectedRoute>
                    <div className="material-regular rounded-xl p-3 border border-success/30 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Badge variant="success">인증됨</Badge>
                        <span className="text-xs font-semibold text-base-content">
                          보호된 워크스페이스 데이터에 접근 중입니다 ({user?.email})
                        </span>
                      </div>
                      <KBD keys={["Passkey", "OAuth"]} size="xs" />
                    </div>
                  </ProtectedRoute>
                </div>
              </div>
            </Card>

            {/* React 19 Server Actions & Optimistic State */}
            <Card
              title="React 19 비동기 상태 엔진 (useOptimistic & useActionState)"
              subtitle="네트워크 지연 없는 즉시 UI 반영과 깜빡임 없는(Zero-Flicker) 폼 검증 상태 머신"
              badge="React 19 State"
            >
              <div className="space-y-5">
                {/* useOptimistic section */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-base-content flex items-center gap-1.5">
                        <IconSparkles className="w-3.5 h-3.5 text-accent-primary" />
                        <span>useOptimistic 즉각적 북마크 반영</span>
                      </h4>
                      <p className="text-[11px] text-base-content/60">
                        서버 응답(650ms 비동기 지연)을 기다리지 않고 UI가 즉시 갱신되며 지연 완료 후 최종 상태로 수렴합니다.
                      </p>
                    </div>
                    {isBookmarkPending && (
                      <Badge variant="outline" size="xs">서버 동기화 중…</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "tok-1", label: "Liquid Glass 토큰" },
                      { id: "tok-2", label: "Zero-CLS 서체" },
                      { id: "tok-3", label: "TanStack Virtual" },
                      { id: "tok-4", label: "Web Haptics" },
                    ].map((item) => {
                      const isFavorited = optimisticBookmarks.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleToggleBookmark(item.id)}
                          className={`btn btn-sm rounded-2xl gap-2 transition-all ${
                            isFavorited
                              ? "btn-primary shadow-sm"
                              : "btn-outline border-base-content/20 text-base-content"
                          }`}
                        >
                          <IconHeart
                            className={`w-3.5 h-3.5 ${
                              isFavorited ? "fill-current text-white" : ""
                            }`}
                          />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Divider label="useActionState 깜빡임 없는 인라인 폼 검증" />

                {/* useActionState form section */}
                <form action={formAction} className="space-y-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="verified_email"
                      className="block text-xs font-semibold text-base-content"
                    >
                      엔터프라이즈 계정 검증 이메일
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="verified_email"
                        name="verified_email"
                        type="email"
                        defaultValue={formState?.email || ""}
                        placeholder="developer@pstui.dev"
                        className="input input-sm flex-1 rounded-2xl bg-base-100/50 border-base-content/20 focus:border-accent-primary"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        variant="primary"
                        isLoading={isFormPending}
                      >
                        검증하기
                      </Button>
                    </div>
                    {formState?.error && (
                      <p className="text-xs text-error font-medium flex items-center gap-1 mt-1 animate-fadeIn">
                        ⚠️ {formState.error}
                      </p>
                    )}
                    {formState?.success && (
                      <p className="text-xs text-success font-medium flex items-center gap-1 mt-1 animate-fadeIn">
                        ✓ 올바른 이메일 형식입니다. 비동기 검증이 성공적으로 완료되었습니다.
                      </p>
                    )}
                  </div>
                </form>
              </div>
            </Card>

            {/* ErrorBoundary & EmptyState Showcase */}
            <Card
              title="ErrorBoundary & EmptyState (장애 격리 및 빈 화면 UI)"
              subtitle="컴포넌트 단위 에러를 격리하여 크래시를 방지하고 일관된 복구 인터랙션을 제공합니다"
              badge="v0.2.0 Core"
            >
              <div className="space-y-4">
                <EmptyState
                  size="sm"
                  title="유니버설 EmptyState 안내"
                  description="검색 결과 0건, 빈 데이터 목록, 첨부 파일 목록 등에 표준화된 빈 화면을 표시합니다."
                  action={
                    <Button
                      size="xs"
                      variant="primary"
                      onClick={() =>
                        showToast({
                          title: "EmptyState 액션이 실행되었습니다",
                          variant: "info",
                        })
                      }
                    >
                      새 항목 생성
                    </Button>
                  }
                />

                <div className="pt-2 border-t border-base-content/10">
                  <p className="text-xs font-semibold text-base-content mb-2">
                    ErrorBoundary 격리 폴백 프리뷰
                  </p>
                  <ErrorBoundary>
                    <div className="p-3.5 rounded-2xl bg-base-100/60 border border-base-content/10 flex items-center justify-between text-xs">
                      <span className="font-medium text-base-content">
                        🛡️ 위젯/서브트리 렌더러가 정상 보호되고 있습니다
                      </span>
                      <Badge variant="success" size="xs">
                        격리 활성
                      </Badge>
                    </div>
                  </ErrorBoundary>
                </div>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Gesture-driven Bottom Sheet */}
      {isBottomSheetOpen && (
        <BottomSheet
          isOpen={isBottomSheetOpen}
          onClose={() => setIsBottomSheetOpen(false)}
          title="제스처 바텀 시트 (BottomSheet)"
          description="상단 필(Pill) 핸들을 아래로 드래그하거나 스와이프 속도에 따라 부드럽게 닫힙니다."
        >
          <div className="space-y-4 py-2">
            <p className="text-sm text-base-content/80 leading-relaxed">
              모바일 터치 제스처와 마우스 드래그를 모두 지원하며, 탄성 물리 스크롤과 촉각 햅틱 피드백(Web Vibration API)이 결합된 반응형 Liquid Glass 시트입니다.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  showToast({ title: "시트 내 작업이 완료되었습니다", variant: "success" });
                  setIsBottomSheetOpen(false);
                }}
              >
                확인 및 닫기
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBottomSheetOpen(false)}
              >
                닫기
              </Button>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
