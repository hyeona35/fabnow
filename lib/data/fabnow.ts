/**
 * fabnow — Semiconductor Supply & AI Compute Demand Intelligence Dataset
 *
 * Pure isomorphic TypeScript models, curated 2025 Q1 – 2026 Q2 telemetry dataset,
 * and deterministic utility helpers for static/edge-cached RSC & client UIs.
 */

export type FabnowSectionId =
  | "overview"
  | "fabs"
  | "labs"
  | "neoclouds"
  | "bottlenecks";

export type RiskLevel = "tight" | "constrained" | "balanced";

export type FabCompany =
  | "TSMC"
  | "SK hynix"
  | "Samsung Electronics"
  | "Micron"
  | "Intel Foundry";

export type FabCategory = "foundry" | "memory" | "packaging";
export type YieldTrend = "improving" | "stable" | "ramping";
export type CustomerSegment = "frontier-lab" | "neocloud";
export type DeploymentStatus = "scaling" | "backlog-capped" | "ramping";
export type BottleneckDomain = "packaging" | "memory" | "wafer" | "substrate";

export interface QuarterlyPoint {
  quarter: string;
  shipmentOrDemand: number;
  utilizationOrAllocationPct: number;
}

export interface FabShipmentRecord {
  id: string;
  slug: string;
  company: FabCompany;
  companyKo: string;
  category: FabCategory;
  lineName: string;
  nodeOrProduct: string;
  primarySites: string;
  monthlyOutputValue: number;
  unitLabel: string;
  momDeltaPct: number;
  qoqDeltaPct: number;
  yoyDeltaPct: number;
  utilizationPct: number;
  yieldPct: number;
  yieldTrend: YieldTrend;
  leadTimeWeeks: number;
  aiAllocationPct: number;
  bottleneckStage: string;
  riskLevel: RiskLevel;
  keyCustomers: string[];
  quarterlyHistory: QuarterlyPoint[];
  summaryKo: string;
  lastUpdated: string;
}

export interface DemandCustomerRecord {
  id: string;
  slug: string;
  name: string;
  nameKo: string;
  segment: CustomerSegment;
  focusCompute: string;
  monthlyGpuEquivalentK: number;
  monthlyHbmDemandTB: number;
  momDemandDeltaPct: number;
  qoqDemandDeltaPct: number;
  backlogMonths: number;
  committedPowerMW: number;
  /**
   * Supply gap indicator in percent.
   * Negative values represent unmet demand / supply deficit (e.g. -18.4 = 18.4% unmet demand).
   */
  supplyGapPct: number;
  preferredNodes: string[];
  primarySuppliers: string[];
  deploymentStatus: DeploymentStatus;
  quarterlyDemand: QuarterlyPoint[];
  summaryKo: string;
}

export interface BottleneckStageRecord {
  id: string;
  slug: string;
  stageName: string;
  stageNameKo: string;
  domain: BottleneckDomain;
  saturationPct: number;
  leadTimeWeeks: number;
  momPressureDeltaPct: number;
  primarySuppliers: string[];
  primaryDrivers: string[];
  riskLevel: RiskLevel;
  mitigationKo: string;
}

export interface SupplyDemandLink {
  id: string;
  supplierId: string;
  supplierLabel: string;
  technologyLabel: string;
  customerId: string;
  customerLabel: string;
  customerSegment: CustomerSegment;
  monthlyCommittedUnits: number;
  monthlyActualShippedUnits: number;
  gapPct: number;
  unitLabel: string;
  bottleneckRisk: RiskLevel;
}

export type FabnowEntity =
  | {
      kind: "fab";
      slug: string;
      title: string;
      subtitle: string;
      riskLevel: RiskLevel;
      record: FabShipmentRecord;
      links: SupplyDemandLink[];
    }
  | {
      kind: "customer";
      slug: string;
      title: string;
      subtitle: string;
      riskLevel: RiskLevel;
      record: DemandCustomerRecord;
      links: SupplyDemandLink[];
    }
  | {
      kind: "bottleneck";
      slug: string;
      title: string;
      subtitle: string;
      riskLevel: RiskLevel;
      record: BottleneckStageRecord;
      links: SupplyDemandLink[];
    };

export interface SupplyDemandSummary {
  asOf: string;
  totalFabLines: number;
  avgFabUtilizationPct: number;
  avgAiAllocationPct: number;
  avgFabLeadTimeWeeks: number;
  avgLeadTimeMomDeltaWeeks: number;
  totalMonthlyWaferKpm: number;
  totalMonthlyHbmKStacks: number;
  totalMonthlyPackagingK: number;
  totalDemandCustomers: number;
  frontierLabCount: number;
  neocloudCount: number;
  totalMonthlyGpuEquivalentK: number;
  totalMonthlyHbmDemandTB: number;
  totalCommittedPowerMW: number;
  avgBacklogMonths: number;
  frontierLabAvgBacklogMonths: number;
  neocloudAvgBacklogMonths: number;
  weightedSupplyGapPct: number;
  unmetPackagingAndHbmGapPct: number;
  criticalBottleneckCount: number;
  peakBottleneck: {
    slug: string;
    stageName: string;
    stageNameKo: string;
    saturationPct: number;
    leadTimeWeeks: number;
  };
  totalLinkCommittedUnits: number;
  totalLinkShippedUnits: number;
}

export const DATA_SYNC_LABEL = "실시간 자동 동기화";

export interface PublicTickerMeta {
  entityKey: string;
  symbol: string;
  displayNameKo: string;
  exchange: string;
  segment: "supplier" | "frontier-lab" | "neocloud" | "benchmark";
}

export const PUBLIC_TICKERS: PublicTickerMeta[] = [
  {
    entityKey: "TSMC",
    symbol: "TSM",
    displayNameKo: "TSMC",
    exchange: "NYSE",
    segment: "supplier",
  },
  {
    entityKey: "SK hynix",
    symbol: "000660.KS",
    displayNameKo: "SK하이닉스",
    exchange: "KRX",
    segment: "supplier",
  },
  {
    entityKey: "Samsung Electronics",
    symbol: "005930.KS",
    displayNameKo: "삼성전자",
    exchange: "KRX",
    segment: "supplier",
  },
  {
    entityKey: "Micron",
    symbol: "MU",
    displayNameKo: "마이크론",
    exchange: "NASDAQ",
    segment: "supplier",
  },
  {
    entityKey: "Intel Foundry",
    symbol: "INTC",
    displayNameKo: "인텔",
    exchange: "NASDAQ",
    segment: "supplier",
  },
  {
    entityKey: "NVIDIA",
    symbol: "NVDA",
    displayNameKo: "NVIDIA (GPU)",
    exchange: "NASDAQ",
    segment: "benchmark",
  },
  {
    entityKey: "CoreWeave",
    symbol: "CRWV",
    displayNameKo: "CoreWeave",
    exchange: "NASDAQ",
    segment: "neocloud",
  },
  {
    entityKey: "Nebius",
    symbol: "NBIS",
    displayNameKo: "Nebius",
    exchange: "NASDAQ",
    segment: "neocloud",
  },
  {
    entityKey: "Google DeepMind",
    symbol: "GOOGL",
    displayNameKo: "Alphabet (DeepMind)",
    exchange: "NASDAQ",
    segment: "frontier-lab",
  },
  {
    entityKey: "Meta AI",
    symbol: "META",
    displayNameKo: "Meta (Meta AI)",
    exchange: "NASDAQ",
    segment: "frontier-lab",
  },
  {
    entityKey: "OpenAI",
    symbol: "MSFT",
    displayNameKo: "Microsoft (OpenAI Infra)",
    exchange: "NASDAQ",
    segment: "frontier-lab",
  },
];

export const TICKER_BY_ENTITY: Record<string, PublicTickerMeta> = Object.fromEntries(
  PUBLIC_TICKERS.map((item) => [item.entityKey, item])
);

export const FABNOW_SECTIONS: Record<
  FabnowSectionId,
  { title: string; badge: string; description: string }
> = {
  overview: {
    title: "통합 수급 현황",
    badge: "LIVE",
    description:
      "글로벌 AI 선단 파운드리·HBM·CoWoS 공급량과 프론티어 랩·네오클라우드 컴퓨팅 수요 간의 실시간 수급 갭을 한눈에 조망합니다.",
  },
  fabs: {
    title: "파운드리·메모리 출하",
    badge: "10개 핵심 라인",
    description:
      "TSMC, SK하이닉스, 삼성전자 DS, 마이크론, 인텔 파운드리의 선단 공정·HBM·어드밴스드 패키징 월간 출하량과 수율·가동률 추이를 추적합니다.",
  },
  labs: {
    title: "프론티어 랩 수요",
    badge: "5대 AI 랩",
    description:
      "OpenAI, Anthropic, Google DeepMind, xAI, Meta AI의 차세대 학습·추론 클러스터 GPU 환산 수요와 전력·HBM 확보율을 비교합니다.",
  },
  neoclouds: {
    title: "네오클라우드 수요",
    badge: "5대 GPU 클라우드",
    description:
      "CoreWeave, Nebius, Lambda, Crusoe, TensorWave의 베어메탈 AI 클러스터 수주 잔고와 공급 제약으로 인한 미충족 갭을 분석합니다.",
  },
  bottlenecks: {
    title: "병목·리드타임",
    badge: "6대 병목 공정",
    description:
      "CoWoS-L, HBM3E 12-Hi, HBM4 Base Die, N2/N3P EUV, ABF/글래스 기판, 액체냉각 랙 전력 등 핵심 병목 구간의 포화도와 완화 전략을 점검합니다.",
  },
};

export const FAB_SHIPMENTS: FabShipmentRecord[] = [
  {
    id: "fab-tsmc-n3p",
    slug: "tsmc-n3p-logic",
    company: "TSMC",
    companyKo: "TSMC (대만반도체)",
    category: "foundry",
    lineName: "Fab 18 (Tainan) · Fab 21 Ph.1 (Arizona)",
    nodeOrProduct: "N3E / N3P Logic",
    primarySites: "Tainan (TW), Phoenix AZ (US)",
    monthlyOutputValue: 165,
    unitLabel: "kWPM",
    momDeltaPct: 2.5,
    qoqDeltaPct: 6.5,
    yoyDeltaPct: 28.9,
    utilizationPct: 98.5,
    yieldPct: 89.4,
    yieldTrend: "stable",
    leadTimeWeeks: 20,
    aiAllocationPct: 64,
    bottleneckStage: "N3P EUV 리소그래피 & 웨이퍼 배정 한계",
    riskLevel: "tight",
    keyCustomers: ["NVIDIA", "Broadcom", "AMD", "Apple", "OpenAI ASIC"],
    quarterlyHistory: [
      { quarter: "2025 Q1", shipmentOrDemand: 112, utilizationOrAllocationPct: 94.0 },
      { quarter: "2025 Q2", shipmentOrDemand: 124, utilizationOrAllocationPct: 95.5 },
      { quarter: "2025 Q3", shipmentOrDemand: 136, utilizationOrAllocationPct: 96.8 },
      { quarter: "2025 Q4", shipmentOrDemand: 148, utilizationOrAllocationPct: 97.6 },
      { quarter: "2026 Q1", shipmentOrDemand: 155, utilizationOrAllocationPct: 98.1 },
      { quarter: "2026 Q2", shipmentOrDemand: 165, utilizationOrAllocationPct: 98.5 },
    ],
    summaryKo:
      "B300/GB300 GPU 컴퓨트 다이와 하이퍼스케일러 자체 ASIC(TPU v7·Trainium3) 양산이 겹치며 가동률 98.5%의 극심한 공급 타이트 상태를 유지 중입니다.",
    lastUpdated: "Live Edge Sync",
  },
  {
    id: "fab-tsmc-n2",
    slug: "tsmc-n2-ramp",
    company: "TSMC",
    companyKo: "TSMC (대만반도체)",
    category: "foundry",
    lineName: "Fab 20 (Baoshan) · Fab 22 (Kaohsiung)",
    nodeOrProduct: "N2 / N2P Nanosheet GAA",
    primarySites: "Hsinchu Baoshan, Kaohsiung (TW)",
    monthlyOutputValue: 48,
    unitLabel: "kWPM",
    momDeltaPct: 11.6,
    qoqDeltaPct: 33.3,
    yoyDeltaPct: 242.9,
    utilizationPct: 91.0,
    yieldPct: 74.5,
    yieldTrend: "ramping",
    leadTimeWeeks: 24,
    aiAllocationPct: 58,
    bottleneckStage: "GAA 나노시트 식각 공정 및 EUV 툴 셋업",
    riskLevel: "constrained",
    keyCustomers: ["Apple", "NVIDIA Rubin-Next", "AMD Zen 6", "Google TPU v8"],
    quarterlyHistory: [
      { quarter: "2025 Q1", shipmentOrDemand: 6, utilizationOrAllocationPct: 48.0 },
      { quarter: "2025 Q2", shipmentOrDemand: 10, utilizationOrAllocationPct: 58.0 },
      { quarter: "2025 Q3", shipmentOrDemand: 14, utilizationOrAllocationPct: 67.5 },
      { quarter: "2025 Q4", shipmentOrDemand: 24, utilizationOrAllocationPct: 76.0 },
      { quarter: "2026 Q1", shipmentOrDemand: 36, utilizationOrAllocationPct: 84.5 },
      { quarter: "2026 Q2", shipmentOrDemand: 48, utilizationOrAllocationPct: 91.0 },
    ],
    summaryKo:
      "바오산 Fab 20과 가오슝 Fab 22가 동시에 초기 램프업에 진입하며 월 48kWPM까지 빠르게 확대되고 있으나, 초기 파일럿 물량이 선예약으로 소진되었습니다.",
    lastUpdated: "Live Edge Sync",
  },
  {
    id: "fab-tsmc-cowos",
    slug: "tsmc-cowos-l",
    company: "TSMC",
    companyKo: "TSMC (대만반도체)",
    category: "packaging",
    lineName: "AP6 (Zhunan) · AP7/AP8 (Chiayi · Tainan)",
    nodeOrProduct: "CoWoS-L / CoWoS-S",
    primarySites: "Zhunan, Chiayi, Tainan (TW)",
    monthlyOutputValue: 92,
    unitLabel: "k Interposers/mo",
    momDeltaPct: 4.5,
    qoqDeltaPct: 13.6,
    yoyDeltaPct: 76.9,
    utilizationPct: 99.4,
    yieldPct: 91.2,
    yieldTrend: "improving",
    leadTimeWeeks: 34,
    aiAllocationPct: 97,
    bottleneckStage: "3.3x+ 대형 RDL 인터포저 평탄도 및 LSI 브리지 다이 본딩",
    riskLevel: "tight",
    keyCustomers: ["NVIDIA Blackwell/Rubin", "AMD MI355X", "Broadcom XPU", "AWS Trainium3"],
    quarterlyHistory: [
      { quarter: "2025 Q1", shipmentOrDemand: 44, utilizationOrAllocationPct: 98.2 },
      { quarter: "2025 Q2", shipmentOrDemand: 52, utilizationOrAllocationPct: 98.6 },
      { quarter: "2025 Q3", shipmentOrDemand: 62, utilizationOrAllocationPct: 98.9 },
      { quarter: "2025 Q4", shipmentOrDemand: 71, utilizationOrAllocationPct: 99.1 },
      { quarter: "2026 Q1", shipmentOrDemand: 81, utilizationOrAllocationPct: 99.2 },
      { quarter: "2026 Q2", shipmentOrDemand: 92, utilizationOrAllocationPct: 99.4 },
    ],
    summaryKo:
      "AI 가속기 출하의 절대적 병목 지점입니다. AP8 증설에도 불구하고 CoWoS-L 전환 비중이 75%를 넘어서며 리드타임 34주, 가동률 99.4%를 기록하고 있습니다.",
    lastUpdated: "Live Edge Sync",
  },
  {
    id: "fab-skhynix-hbm3e",
    slug: "sk-hynix-hbm3e-12hi",
    company: "SK hynix",
    companyKo: "SK하이닉스",
    category: "memory",
    lineName: "Icheon M16 · Cheongju M15 MR-MUF Line",
    nodeOrProduct: "HBM3E 12-Hi (36GB)",
    primarySites: "Icheon, Cheongju (KR)",
    monthlyOutputValue: 138,
    unitLabel: "k Stacks/mo",
    momDeltaPct: 3.8,
    qoqDeltaPct: 11.3,
    yoyDeltaPct: 46.8,
    utilizationPct: 99.1,
    yieldPct: 86.8,
    yieldTrend: "improving",
    leadTimeWeeks: 28,
    aiAllocationPct: 100,
    bottleneckStage: "1b DRAM 웨이퍼 배분 및 Advanced MR-MUF 열압착",
    riskLevel: "tight",
    keyCustomers: ["NVIDIA B200/GB200", "NVIDIA GB300", "AWS Trainium2", "Microsoft Maia"],
    quarterlyHistory: [
      { quarter: "2025 Q1", shipmentOrDemand: 76, utilizationOrAllocationPct: 97.5 },
      { quarter: "2025 Q2", shipmentOrDemand: 90, utilizationOrAllocationPct: 98.0 },
      { quarter: "2025 Q3", shipmentOrDemand: 104, utilizationOrAllocationPct: 98.4 },
      { quarter: "2025 Q4", shipmentOrDemand: 115, utilizationOrAllocationPct: 98.7 },
      { quarter: "2026 Q1", shipmentOrDemand: 124, utilizationOrAllocationPct: 98.9 },
      { quarter: "2026 Q2", shipmentOrDemand: 138, utilizationOrAllocationPct: 99.1 },
    ],
    summaryKo:
      "GB200·GB300 NVL72의 주력 메모리인 12단 HBM3E의 86%대 안정 수율을 바탕으로 사실상 2026년 연간 물량이 장기 공급 계약(LTA)으로 전량 완판되었습니다.",
    lastUpdated: "Live Edge Sync",
  },
  {
    id: "fab-skhynix-hbm4",
    slug: "sk-hynix-hbm4",
    company: "SK hynix",
    companyKo: "SK하이닉스",
    category: "memory",
    lineName: "Cheongju M15X · TSMC Logic Base Die Line",
    nodeOrProduct: "HBM4 12-Hi / 16-Hi",
    primarySites: "Cheongju M15X (KR), Hsinchu Base-Die Co-Op",
    monthlyOutputValue: 46,
    unitLabel: "k Stacks/mo",
    momDeltaPct: 15.0,
    qoqDeltaPct: 43.8,
    yoyDeltaPct: 360.0,
    utilizationPct: 94.2,
    yieldPct: 72.4,
    yieldTrend: "ramping",
    leadTimeWeeks: 32,
    aiAllocationPct: 100,
    bottleneckStage: "2048-bit I/O 로직 베이스 다이 수급 및 16단 하이브리드 본딩",
    riskLevel: "tight",
    keyCustomers: ["NVIDIA Rubin R100", "Google TPU v7", "OpenAI Next-Gen ASIC"],
    quarterlyHistory: [
      { quarter: "2025 Q1", shipmentOrDemand: 4, utilizationOrAllocationPct: 52.0 },
      { quarter: "2025 Q2", shipmentOrDemand: 8, utilizationOrAllocationPct: 64.0 },
      { quarter: "2025 Q3", shipmentOrDemand: 14, utilizationOrAllocationPct: 74.0 },
      { quarter: "2025 Q4", shipmentOrDemand: 22, utilizationOrAllocationPct: 82.0 },
      { quarter: "2026 Q1", shipmentOrDemand: 32, utilizationOrAllocationPct: 89.5 },
      { quarter: "2026 Q2", shipmentOrDemand: 46, utilizationOrAllocationPct: 94.2 },
    ],
    summaryKo:
      "청주 M15X 조기 가동과 TSMC 선단 로직 베이스 다이 협업을 통해 Rubin 및 차세대 커스텀 ASIC향 HBM4 양산 출하를 분기 +43.8% 속도로 끌어올리고 있습니다.",
    lastUpdated: "Live Edge Sync",
  },
  {
    id: "fab-samsung-hbm",
    slug: "samsung-hbm3e-hbm4",
    company: "Samsung Electronics",
    companyKo: "삼성전자 DS",
    category: "memory",
    lineName: "Pyeongtaek P3/P4 · Onyang TC-NCF Packaging",
    nodeOrProduct: "HBM3E 12-Hi / HBM4 (1c)",
    primarySites: "Pyeongtaek, Cheonan-Onyang (KR)",
    monthlyOutputValue: 104,
    unitLabel: "k Stacks/mo",
    momDeltaPct: 6.1,
    qoqDeltaPct: 16.9,
    yoyDeltaPct: 57.6,
    utilizationPct: 93.5,
    yieldPct: 79.6,
    yieldTrend: "improving",
    leadTimeWeeks: 25,
    aiAllocationPct: 96,
    bottleneckStage: "1c nm 코어 다이 수율 안정화 및 턴키 베이스 다이 정합",
    riskLevel: "constrained",
    keyCustomers: ["AMD MI325X/MI355X", "NVIDIA GB300 (Dual-Source)", "Google TPU", "Broadcom"],
    quarterlyHistory: [
      { quarter: "2025 Q1", shipmentOrDemand: 52, utilizationOrAllocationPct: 81.0 },
      { quarter: "2025 Q2", shipmentOrDemand: 60, utilizationOrAllocationPct: 84.5 },
      { quarter: "2025 Q3", shipmentOrDemand: 70, utilizationOrAllocationPct: 87.2 },
      { quarter: "2025 Q4", shipmentOrDemand: 80, utilizationOrAllocationPct: 89.8 },
      { quarter: "2026 Q1", shipmentOrDemand: 89, utilizationOrAllocationPct: 91.8 },
      { quarter: "2026 Q2", shipmentOrDemand: 104, utilizationOrAllocationPct: 93.5 },
    ],
    summaryKo:
      "1c DRAM 공정 기반 HBM4와 12단 HBM3E 퀄 테스트 확대에 힘입어 AMD MI355X·구글 TPU 및 주요 GPU 듀얼 벤더 출하 비중을 빠르게 회복 중입니다.",
    lastUpdated: "Live Edge Sync",
  },
  {
    id: "fab-samsung-foundry",
    slug: "samsung-sf4x-sf2",
    company: "Samsung Electronics",
    companyKo: "삼성전자 DS",
    category: "foundry",
    lineName: "Pyeongtaek S5 · Hwaseong V1 · Taylor Fab 1",
    nodeOrProduct: "SF4X / SF3 / SF2 GAA",
    primarySites: "Pyeongtaek, Hwaseong (KR), Taylor TX (US)",
    monthlyOutputValue: 54,
    unitLabel: "kWPM",
    momDeltaPct: 3.8,
    qoqDeltaPct: 10.2,
    yoyDeltaPct: 25.6,
    utilizationPct: 78.4,
    yieldPct: 71.8,
    yieldTrend: "improving",
    leadTimeWeeks: 18,
    aiAllocationPct: 47,
    bottleneckStage: "2세대 MBCFET GAA 수율 편차 축소 및 I-Cube 2.5D 적층",
    riskLevel: "balanced",
    keyCustomers: ["Preferred Networks", "Rebellions", "Qualcomm Edge", "HBM4 Base Die (Turnkey)"],
    quarterlyHistory: [
      { quarter: "2025 Q1", shipmentOrDemand: 39, utilizationOrAllocationPct: 68.5 },
      { quarter: "2025 Q2", shipmentOrDemand: 42, utilizationOrAllocationPct: 70.2 },
      { quarter: "2025 Q3", shipmentOrDemand: 44, utilizationOrAllocationPct: 72.0 },
      { quarter: "2025 Q4", shipmentOrDemand: 46, utilizationOrAllocationPct: 74.1 },
      { quarter: "2026 Q1", shipmentOrDemand: 49, utilizationOrAllocationPct: 76.3 },
      { quarter: "2026 Q2", shipmentOrDemand: 54, utilizationOrAllocationPct: 78.4 },
    ],
    summaryKo:
      "파운드리·메모리·I-Cube 패키징 턴키 전략으로 자체 HBM4 베이스 다이 및 AI NPU 수주를 확대 중이며, 유휴 캐파 여유 덕분에 리드타임이 경쟁사 대비 짧습니다.",
    lastUpdated: "Live Edge Sync",
  },
  {
    id: "fab-micron-hbm",
    slug: "micron-hbm3e-hbm4",
    company: "Micron",
    companyKo: "마이크론",
    category: "memory",
    lineName: "Taichung Fab 16 · Hiroshima Fab 15",
    nodeOrProduct: "HBM3E 12-Hi / HBM4",
    primarySites: "Taichung (TW), Hiroshima (JP), Boise ID (US)",
    monthlyOutputValue: 64,
    unitLabel: "k Stacks/mo",
    momDeltaPct: 6.7,
    qoqDeltaPct: 20.8,
    yoyDeltaPct: 88.2,
    utilizationPct: 97.6,
    yieldPct: 83.5,
    yieldTrend: "improving",
    leadTimeWeeks: 26,
    aiAllocationPct: 100,
    bottleneckStage: "1-beta / 1-gamma DRAM TSV 후공정 클린룸 캐파 부족",
    riskLevel: "constrained",
    keyCustomers: ["NVIDIA H200/B200/GB300", "AMD MI355X", "US Sovereign AI"],
    quarterlyHistory: [
      { quarter: "2025 Q1", shipmentOrDemand: 26, utilizationOrAllocationPct: 92.0 },
      { quarter: "2025 Q2", shipmentOrDemand: 32, utilizationOrAllocationPct: 94.0 },
      { quarter: "2025 Q3", shipmentOrDemand: 39, utilizationOrAllocationPct: 95.4 },
      { quarter: "2025 Q4", shipmentOrDemand: 46, utilizationOrAllocationPct: 96.3 },
      { quarter: "2026 Q1", shipmentOrDemand: 53, utilizationOrAllocationPct: 97.0 },
      { quarter: "2026 Q2", shipmentOrDemand: 64, utilizationOrAllocationPct: 97.6 },
    ],
    summaryKo:
      "저전력 강점을 앞세워 GB300·MI355X향 HBM3E 12단 공급 점유율을 22% 수준까지 끌어올렸으며, 타이중·히로시마 후공정 증설이 순차 반영되고 있습니다.",
    lastUpdated: "Live Edge Sync",
  },
  {
    id: "fab-intel-18a",
    slug: "intel-18a-foveros",
    company: "Intel Foundry",
    companyKo: "인텔 파운드리",
    category: "foundry",
    lineName: "Oregon D1X · Arizona Fab 52",
    nodeOrProduct: "18A RibbonFET / PowerVia",
    primarySites: "Hillsboro OR, Chandler AZ (US)",
    monthlyOutputValue: 38,
    unitLabel: "kWPM",
    momDeltaPct: 8.6,
    qoqDeltaPct: 26.7,
    yoyDeltaPct: 111.1,
    utilizationPct: 76.2,
    yieldPct: 68.9,
    yieldTrend: "ramping",
    leadTimeWeeks: 19,
    aiAllocationPct: 42,
    bottleneckStage: "PowerVia 후면 전력전달(BSPDN) 수율 검증 및 PDK 성숙도",
    riskLevel: "balanced",
    keyCustomers: ["AWS Custom Fabric", "Microsoft Maia-Next", "Intel Xeon 6+", "US DoD"],
    quarterlyHistory: [
      { quarter: "2025 Q1", shipmentOrDemand: 14, utilizationOrAllocationPct: 54.0 },
      { quarter: "2025 Q2", shipmentOrDemand: 18, utilizationOrAllocationPct: 59.5 },
      { quarter: "2025 Q3", shipmentOrDemand: 22, utilizationOrAllocationPct: 64.0 },
      { quarter: "2025 Q4", shipmentOrDemand: 25, utilizationOrAllocationPct: 68.2 },
      { quarter: "2026 Q1", shipmentOrDemand: 30, utilizationOrAllocationPct: 72.5 },
      { quarter: "2026 Q2", shipmentOrDemand: 38, utilizationOrAllocationPct: 76.2 },
    ],
    summaryKo:
      "애리조나 Fab 52의 18A 양산 램프업이 본궤도에 오르며 북미 현지 제조를 원하는 빅테크 AI 패브릭·커스텀 가속기 다이버시피케이션 대안으로 부상하고 있습니다.",
    lastUpdated: "Live Edge Sync",
  },
  {
    id: "fab-intel-foveros",
    slug: "intel-foveros-emib",
    company: "Intel Foundry",
    companyKo: "인텔 파운드리",
    category: "packaging",
    lineName: "Rio Rancho Fab 9/11X · Kulim Packaging",
    nodeOrProduct: "Foveros Direct 3D / EMIB-T",
    primarySites: "Rio Rancho NM (US), Kulim (MY)",
    monthlyOutputValue: 26,
    unitLabel: "k Interposers/mo",
    momDeltaPct: 8.3,
    qoqDeltaPct: 23.8,
    yoyDeltaPct: 85.7,
    utilizationPct: 84.5,
    yieldPct: 82.1,
    yieldTrend: "improving",
    leadTimeWeeks: 21,
    aiAllocationPct: 68,
    bottleneckStage: "CoWoS-L 대체 대형 EMIB-T 실리콘 브리지 테스트 인프라",
    riskLevel: "constrained",
    keyCustomers: ["AWS Networking/AI", "Cisco Silicon One", "Qualcomm Datacenter"],
    quarterlyHistory: [
      { quarter: "2025 Q1", shipmentOrDemand: 11, utilizationOrAllocationPct: 66.0 },
      { quarter: "2025 Q2", shipmentOrDemand: 14, utilizationOrAllocationPct: 71.0 },
      { quarter: "2025 Q3", shipmentOrDemand: 16, utilizationOrAllocationPct: 75.5 },
      { quarter: "2025 Q4", shipmentOrDemand: 19, utilizationOrAllocationPct: 79.0 },
      { quarter: "2026 Q1", shipmentOrDemand: 21, utilizationOrAllocationPct: 81.8 },
      { quarter: "2026 Q2", shipmentOrDemand: 26, utilizationOrAllocationPct: 84.5 },
    ],
    summaryKo:
      "TSMC CoWoS-L 공급 병목이 장기화되면서 리오랜초 Foveros Direct와 쿨림 EMIB-T 단독 패키징(Foundry-agnostic Packaging) 수주가 빠르게 증가하고 있습니다.",
    lastUpdated: "Live Edge Sync",
  },
];

export const DEMAND_CUSTOMERS: DemandCustomerRecord[] = [
  // Frontier Labs (5)
  {
    id: "cust-openai",
    slug: "openai",
    name: "OpenAI",
    nameKo: "오픈AI",
    segment: "frontier-lab",
    focusCompute: "GB200/GB300 NVL72 + Custom Inference ASIC",
    monthlyGpuEquivalentK: 185,
    monthlyHbmDemandTB: 29600,
    momDemandDeltaPct: 7.6,
    qoqDemandDeltaPct: 21.7,
    backlogMonths: 11.4,
    committedPowerMW: 1850,
    supplyGapPct: -21.5,
    preferredNodes: ["TSMC N3P", "CoWoS-L", "HBM3E 12-Hi", "HBM4"],
    primarySuppliers: ["TSMC", "SK hynix", "Micron"],
    deploymentStatus: "backlog-capped",
    quarterlyDemand: [
      { quarter: "2025 Q1", shipmentOrDemand: 88, utilizationOrAllocationPct: 84.0 },
      { quarter: "2025 Q2", shipmentOrDemand: 104, utilizationOrAllocationPct: 82.5 },
      { quarter: "2025 Q3", shipmentOrDemand: 122, utilizationOrAllocationPct: 80.8 },
      { quarter: "2025 Q4", shipmentOrDemand: 138, utilizationOrAllocationPct: 79.4 },
      { quarter: "2026 Q1", shipmentOrDemand: 152, utilizationOrAllocationPct: 78.9 },
      { quarter: "2026 Q2", shipmentOrDemand: 185, utilizationOrAllocationPct: 78.5 },
    ],
    summaryKo:
      "차세대 프론티어 추론·멀티모달 모델 확장으로 월 185k GPUeq 수요가 발생하고 있으나, CoWoS-L·HBM3E 12단 인도 지연으로 약 21.5%의 미충족 갭이 지속 중입니다.",
  },
  {
    id: "cust-anthropic",
    slug: "anthropic",
    name: "Anthropic",
    nameKo: "앤스로픽",
    segment: "frontier-lab",
    focusCompute: "Trainium2/3 + TPU v6e/v7 + B200/GB200",
    monthlyGpuEquivalentK: 122,
    monthlyHbmDemandTB: 18400,
    momDemandDeltaPct: 6.1,
    qoqDemandDeltaPct: 18.4,
    backlogMonths: 9.2,
    committedPowerMW: 1120,
    supplyGapPct: -16.8,
    preferredNodes: ["TSMC N3E/N3P", "CoWoS-L", "HBM3E 12-Hi"],
    primarySuppliers: ["TSMC", "SK hynix", "Samsung Electronics"],
    deploymentStatus: "scaling",
    quarterlyDemand: [
      { quarter: "2025 Q1", shipmentOrDemand: 58, utilizationOrAllocationPct: 86.2 },
      { quarter: "2025 Q2", shipmentOrDemand: 69, utilizationOrAllocationPct: 85.4 },
      { quarter: "2025 Q3", shipmentOrDemand: 81, utilizationOrAllocationPct: 84.6 },
      { quarter: "2025 Q4", shipmentOrDemand: 92, utilizationOrAllocationPct: 84.0 },
      { quarter: "2026 Q1", shipmentOrDemand: 103, utilizationOrAllocationPct: 83.5 },
      { quarter: "2026 Q2", shipmentOrDemand: 122, utilizationOrAllocationPct: 83.2 },
    ],
    summaryKo:
      "AWS Trainium2/3·구글 TPU·엔비디아 GPU의 3중 멀티실리콘 아키텍처를 채택해 단일 칩 의존도를 낮췄으나, 기업용 코딩 에이전트 트래픽 급증으로 공급 타이트 상태입니다.",
  },
  {
    id: "cust-deepmind",
    slug: "google-deepmind",
    name: "Google DeepMind",
    nameKo: "구글 딥마인드",
    segment: "frontier-lab",
    focusCompute: "TPU v6 Trillium / TPU v7 Ironwood + B200",
    monthlyGpuEquivalentK: 164,
    monthlyHbmDemandTB: 24200,
    momDemandDeltaPct: 4.5,
    qoqDemandDeltaPct: 13.1,
    backlogMonths: 7.5,
    committedPowerMW: 1680,
    supplyGapPct: -8.4,
    preferredNodes: ["TSMC N3P", "TSMC N2", "CoWoS-S/L", "HBM3E / HBM4"],
    primarySuppliers: ["TSMC", "SK hynix", "Samsung Electronics"],
    deploymentStatus: "scaling",
    quarterlyDemand: [
      { quarter: "2025 Q1", shipmentOrDemand: 96, utilizationOrAllocationPct: 92.5 },
      { quarter: "2025 Q2", shipmentOrDemand: 108, utilizationOrAllocationPct: 92.2 },
      { quarter: "2025 Q3", shipmentOrDemand: 121, utilizationOrAllocationPct: 91.9 },
      { quarter: "2025 Q4", shipmentOrDemand: 133, utilizationOrAllocationPct: 91.7 },
      { quarter: "2026 Q1", shipmentOrDemand: 145, utilizationOrAllocationPct: 91.6 },
      { quarter: "2026 Q2", shipmentOrDemand: 164, utilizationOrAllocationPct: 91.6 },
    ],
    summaryKo:
      "자체 TPU v7과 다변화된 HBM 공급망 덕분에 프론티어 랩 중 가장 낮은 공급 갭(-8.4%)을 유지하며 안정적인 대규모 증설 사이클을 이어가고 있습니다.",
  },
  {
    id: "cust-xai",
    slug: "xai",
    name: "xAI",
    nameKo: "xAI (콜로서스)",
    segment: "frontier-lab",
    focusCompute: "Colossus B200 / GB200 NVL72 Supercluster",
    monthlyGpuEquivalentK: 140,
    monthlyHbmDemandTB: 22800,
    momDemandDeltaPct: 9.4,
    qoqDemandDeltaPct: 27.3,
    backlogMonths: 10.8,
    committedPowerMW: 1350,
    supplyGapPct: -23.2,
    preferredNodes: ["TSMC N4P/N3P", "CoWoS-L", "HBM3E 12-Hi"],
    primarySuppliers: ["TSMC", "SK hynix", "Micron"],
    deploymentStatus: "ramping",
    quarterlyDemand: [
      { quarter: "2025 Q1", shipmentOrDemand: 54, utilizationOrAllocationPct: 81.5 },
      { quarter: "2025 Q2", shipmentOrDemand: 68, utilizationOrAllocationPct: 80.4 },
      { quarter: "2025 Q3", shipmentOrDemand: 84, utilizationOrAllocationPct: 79.1 },
      { quarter: "2025 Q4", shipmentOrDemand: 98, utilizationOrAllocationPct: 78.2 },
      { quarter: "2026 Q1", shipmentOrDemand: 110, utilizationOrAllocationPct: 77.5 },
      { quarter: "2026 Q2", shipmentOrDemand: 140, utilizationOrAllocationPct: 76.8 },
    ],
    summaryKo:
      "멤피스 콜로서스 클러스터의 100만 GPU 확장 로드맵에 따라 분기 +27.3%의 가파른 수요 증가를 보이고 있으며, 액체냉각 랙 전력 및 CoWoS-L 배정이 핵심 변수입니다.",
  },
  {
    id: "cust-meta",
    slug: "meta-ai",
    name: "Meta AI",
    nameKo: "메타 AI",
    segment: "frontier-lab",
    focusCompute: "GB200/GB300 NVL72 + MTIA v2/v3 ASIC",
    monthlyGpuEquivalentK: 156,
    monthlyHbmDemandTB: 23400,
    momDemandDeltaPct: 5.4,
    qoqDemandDeltaPct: 15.6,
    backlogMonths: 8.6,
    committedPowerMW: 1540,
    supplyGapPct: -14.1,
    preferredNodes: ["TSMC N3P", "CoWoS-L", "HBM3E 12-Hi", "HBM4"],
    primarySuppliers: ["TSMC", "SK hynix", "Samsung Electronics"],
    deploymentStatus: "scaling",
    quarterlyDemand: [
      { quarter: "2025 Q1", shipmentOrDemand: 86, utilizationOrAllocationPct: 88.2 },
      { quarter: "2025 Q2", shipmentOrDemand: 98, utilizationOrAllocationPct: 87.8 },
      { quarter: "2025 Q3", shipmentOrDemand: 111, utilizationOrAllocationPct: 87.1 },
      { quarter: "2025 Q4", shipmentOrDemand: 123, utilizationOrAllocationPct: 86.7 },
      { quarter: "2026 Q1", shipmentOrDemand: 135, utilizationOrAllocationPct: 86.2 },
      { quarter: "2026 Q2", shipmentOrDemand: 156, utilizationOrAllocationPct: 85.9 },
    ],
    summaryKo:
      "자체 MTIA 추론 칩 비중 확대로 범용 GPU 병목 일부를 흡수했으나, Llama 차세대 거대 모델 학습용 GB300 및 HBM4 선점 수요가 강하게 유지되고 있습니다.",
  },

  // Neoclouds (5)
  {
    id: "cust-coreweave",
    slug: "coreweave",
    name: "CoreWeave",
    nameKo: "코어위브",
    segment: "neocloud",
    focusCompute: "GB200/GB300 NVL72 InfiniBand Bare-Metal",
    monthlyGpuEquivalentK: 96,
    monthlyHbmDemandTB: 15360,
    momDemandDeltaPct: 8.2,
    qoqDemandDeltaPct: 24.7,
    backlogMonths: 12.6,
    committedPowerMW: 980,
    supplyGapPct: -24.6,
    preferredNodes: ["TSMC N4P/N3P", "CoWoS-L", "HBM3E 12-Hi"],
    primarySuppliers: ["TSMC", "SK hynix", "Micron"],
    deploymentStatus: "backlog-capped",
    quarterlyDemand: [
      { quarter: "2025 Q1", shipmentOrDemand: 42, utilizationOrAllocationPct: 79.0 },
      { quarter: "2025 Q2", shipmentOrDemand: 51, utilizationOrAllocationPct: 78.2 },
      { quarter: "2025 Q3", shipmentOrDemand: 60, utilizationOrAllocationPct: 77.4 },
      { quarter: "2025 Q4", shipmentOrDemand: 69, utilizationOrAllocationPct: 76.6 },
      { quarter: "2026 Q1", shipmentOrDemand: 77, utilizationOrAllocationPct: 75.9 },
      { quarter: "2026 Q2", shipmentOrDemand: 96, utilizationOrAllocationPct: 75.4 },
    ],
    summaryKo:
      "프론티어 랩·엔터프라이즈 장기 예약 물량이 12.6개월치까지 누적되어 있으나, NVL72 랙 통합 출하 및 12단 HBM3E 납품 지연이 매출 인식 상한을 결정하고 있습니다.",
  },
  {
    id: "cust-nebius",
    slug: "nebius",
    name: "Nebius",
    nameKo: "네비우스",
    segment: "neocloud",
    focusCompute: "H200 / B200 / GB200 Sovereign AI Pods",
    monthlyGpuEquivalentK: 42,
    monthlyHbmDemandTB: 6480,
    momDemandDeltaPct: 7.7,
    qoqDemandDeltaPct: 23.5,
    backlogMonths: 9.8,
    committedPowerMW: 420,
    supplyGapPct: -17.5,
    preferredNodes: ["TSMC N4P", "CoWoS-L", "HBM3E 12-Hi"],
    primarySuppliers: ["TSMC", "SK hynix", "Micron"],
    deploymentStatus: "ramping",
    quarterlyDemand: [
      { quarter: "2025 Q1", shipmentOrDemand: 17, utilizationOrAllocationPct: 85.0 },
      { quarter: "2025 Q2", shipmentOrDemand: 21, utilizationOrAllocationPct: 84.4 },
      { quarter: "2025 Q3", shipmentOrDemand: 25, utilizationOrAllocationPct: 83.8 },
      { quarter: "2025 Q4", shipmentOrDemand: 29, utilizationOrAllocationPct: 83.2 },
      { quarter: "2026 Q1", shipmentOrDemand: 34, utilizationOrAllocationPct: 82.8 },
      { quarter: "2026 Q2", shipmentOrDemand: 42, utilizationOrAllocationPct: 82.5 },
    ],
    summaryKo:
      "유럽(핀란드) 및 북미(뉴저지·캔자스시티) 소버린 AI 클러스터 확장에 따라 B200·GB200 랙 인도 물량을 빠르게 확대 중인 고성장 네오클라우드입니다.",
  },
  {
    id: "cust-lambda",
    slug: "lambda",
    name: "Lambda",
    nameKo: "람다",
    segment: "neocloud",
    focusCompute: "H200 / B200 / B300 On-Demand & 1-Click Clusters",
    monthlyGpuEquivalentK: 38,
    monthlyHbmDemandTB: 5890,
    momDemandDeltaPct: 5.6,
    qoqDemandDeltaPct: 16.9,
    backlogMonths: 8.9,
    committedPowerMW: 360,
    supplyGapPct: -15.8,
    preferredNodes: ["TSMC N4P/N3P", "CoWoS-L", "HBM3E"],
    primarySuppliers: ["TSMC", "SK hynix", "Samsung Electronics"],
    deploymentStatus: "scaling",
    quarterlyDemand: [
      { quarter: "2025 Q1", shipmentOrDemand: 19, utilizationOrAllocationPct: 86.4 },
      { quarter: "2025 Q2", shipmentOrDemand: 22, utilizationOrAllocationPct: 85.9 },
      { quarter: "2025 Q3", shipmentOrDemand: 26, utilizationOrAllocationPct: 85.3 },
      { quarter: "2025 Q4", shipmentOrDemand: 29, utilizationOrAllocationPct: 84.9 },
      { quarter: "2026 Q1", shipmentOrDemand: 32.5, utilizationOrAllocationPct: 84.5 },
      { quarter: "2026 Q2", shipmentOrDemand: 38, utilizationOrAllocationPct: 84.2 },
    ],
    summaryKo:
      "중견 AI 스타트업·파인튜닝 개발자 수요가 견조하며, 온디맨드 GPU 가용성을 확보하기 위해 B200/B300 예약 배정을 지속적으로 상향하고 있습니다.",
  },
  {
    id: "cust-crusoe",
    slug: "crusoe",
    name: "Crusoe",
    nameKo: "크루소",
    segment: "neocloud",
    focusCompute: "Abilene Stargate 1.2GW GB200/GB300 Pods",
    monthlyGpuEquivalentK: 68,
    monthlyHbmDemandTB: 10880,
    momDemandDeltaPct: 11.5,
    qoqDemandDeltaPct: 36.0,
    backlogMonths: 13.2,
    committedPowerMW: 1200,
    supplyGapPct: -26.4,
    preferredNodes: ["TSMC N3P", "CoWoS-L", "HBM3E 12-Hi"],
    primarySuppliers: ["TSMC", "SK hynix", "Micron"],
    deploymentStatus: "backlog-capped",
    quarterlyDemand: [
      { quarter: "2025 Q1", shipmentOrDemand: 22, utilizationOrAllocationPct: 77.5 },
      { quarter: "2025 Q2", shipmentOrDemand: 29, utilizationOrAllocationPct: 76.8 },
      { quarter: "2025 Q3", shipmentOrDemand: 36, utilizationOrAllocationPct: 75.9 },
      { quarter: "2025 Q4", shipmentOrDemand: 43, utilizationOrAllocationPct: 75.1 },
      { quarter: "2026 Q1", shipmentOrDemand: 50, utilizationOrAllocationPct: 74.3 },
      { quarter: "2026 Q2", shipmentOrDemand: 68, utilizationOrAllocationPct: 73.6 },
    ],
    summaryKo:
      "텍사스 애빌린 1.2GW 대형 AI 데이터센터 전력이 선제 확보된 반면 실리콘·액체냉각 랙 조달이 뒤따라오면서 네오클라우드 중 가장 긴 13.2개월 수주 잔고를 기록 중입니다.",
  },
  {
    id: "cust-tensorwave",
    slug: "tensorwave",
    name: "TensorWave",
    nameKo: "텐서웨이브",
    segment: "neocloud",
    focusCompute: "AMD Instinct MI325X / MI355X HBM3E Clusters",
    monthlyGpuEquivalentK: 29,
    monthlyHbmDemandTB: 6960,
    momDemandDeltaPct: 6.9,
    qoqDemandDeltaPct: 20.8,
    backlogMonths: 7.9,
    committedPowerMW: 240,
    supplyGapPct: -11.3,
    preferredNodes: ["TSMC N3P", "CoWoS-S/L", "HBM3E 12-Hi"],
    primarySuppliers: ["TSMC", "Samsung Electronics", "Micron"],
    deploymentStatus: "ramping",
    quarterlyDemand: [
      { quarter: "2025 Q1", shipmentOrDemand: 12, utilizationOrAllocationPct: 90.2 },
      { quarter: "2025 Q2", shipmentOrDemand: 15, utilizationOrAllocationPct: 89.8 },
      { quarter: "2025 Q3", shipmentOrDemand: 18, utilizationOrAllocationPct: 89.4 },
      { quarter: "2025 Q4", shipmentOrDemand: 21, utilizationOrAllocationPct: 89.1 },
      { quarter: "2026 Q1", shipmentOrDemand: 24, utilizationOrAllocationPct: 88.9 },
      { quarter: "2026 Q2", shipmentOrDemand: 29, utilizationOrAllocationPct: 88.7 },
    ],
    summaryKo:
      "칩당 대용량(256~288GB) HBM3E를 탑재한 AMD MI325X/MI355X 전용 클라우드 전략으로 추론 메모리 대역폭 수요를 공략하며 상대적으로 양호한 납기를 유지 중입니다.",
  },
];

export const BOTTLENECK_STAGES: BottleneckStageRecord[] = [
  {
    id: "bn-cowos-l",
    slug: "cowos-l",
    stageName: "CoWoS-L",
    stageNameKo: "CoWoS-L 대형 인터포저 패키징",
    domain: "packaging",
    saturationPct: 99.4,
    leadTimeWeeks: 34,
    momPressureDeltaPct: 4.8,
    primarySuppliers: ["TSMC AP6/AP7/AP8", "ASE (OSAT CoWoS-oS Assist)"],
    primaryDrivers: ["NVIDIA GB200/GB300", "Broadcom XPU", "AWS Trainium3"],
    riskLevel: "tight",
    mitigationKo:
      "TSMC 자이(Chiayi) AP7 및 타이난 AP8 클린룸 조기 가동과 더불어 ASE·Amkor 등 OSAT 외주 oS(on-Substrate) 공정을 병행해 월 100k+ 캐파 돌파를 추진 중입니다.",
  },
  {
    id: "bn-hbm3e-12hi",
    slug: "hbm3e-12hi",
    stageName: "HBM3E 12-Hi",
    stageNameKo: "HBM3E 12단 초고대역폭 메모리 적층",
    domain: "memory",
    saturationPct: 98.2,
    leadTimeWeeks: 28,
    momPressureDeltaPct: 3.6,
    primarySuppliers: ["SK hynix", "Micron", "Samsung Electronics"],
    primaryDrivers: ["GB300 NVL72 (288GB)", "AMD MI355X", "TPU v7"],
    riskLevel: "tight",
    mitigationKo:
      "12단 적층 웨이퍼 소모율이 일반 DDR5 대비 3배에 달해 SK하이닉스 M16·M15X 증설과 삼성전자·마이크론 12단 듀얼소싱 확대로 적층 병목을 분산하고 있습니다.",
  },
  {
    id: "bn-hbm4-base-die",
    slug: "hbm4-base-die",
    stageName: "HBM4 Base Die",
    stageNameKo: "HBM4 로직 베이스 다이 · 하이브리드 본딩",
    domain: "memory",
    saturationPct: 95.6,
    leadTimeWeeks: 32,
    momPressureDeltaPct: 8.4,
    primarySuppliers: ["TSMC (Base Die) + SK hynix", "Samsung DS Turnkey", "Micron"],
    primaryDrivers: ["NVIDIA Rubin R100", "OpenAI Custom ASIC", "Google TPU v8"],
    riskLevel: "tight",
    mitigationKo:
      "2048-bit I/O 로직 다이의 선단 파운드리-메모리 간 테스트 동기화가 핵심입니다. SK하이닉스-TSMC 원팀 및 삼성 Turnkey 1c 공정으로 KGD(양품 다이) 선별 수율을 높이고 있습니다.",
  },
  {
    id: "bn-n2-n3p-euv",
    slug: "n2-n3p-euv",
    stageName: "N2 / N3P EUV",
    stageNameKo: "N2 · N3P 선단 EUV 노광 공정",
    domain: "wafer",
    saturationPct: 94.8,
    leadTimeWeeks: 22,
    momPressureDeltaPct: 2.9,
    primarySuppliers: ["TSMC Fab 18/20/22", "Intel Foundry Fab 52 (18A)"],
    primaryDrivers: ["GPU Compute Dies", "Hyperscaler Custom ASIC", "Mobile SoC"],
    riskLevel: "constrained",
    mitigationKo:
      "애리조나 Fab 21 및 가오슝 Fab 22 램프업으로 웨이퍼 캐파는 점진적 증가 추세이나, 다층 EUV 마스크 공정 시간 장기화로 N3P/N2 간 라인 전환 최적화가 필수적입니다.",
  },
  {
    id: "bn-abf-glass-substrate",
    slug: "abf-glass-substrate",
    stageName: "ABF / Glass Substrate",
    stageNameKo: "초대형 ABF · 글래스 코어 패키징 기판",
    domain: "substrate",
    saturationPct: 91.5,
    leadTimeWeeks: 24,
    momPressureDeltaPct: 5.1,
    primarySuppliers: ["Ibiden", "Shinko Electric", "Unimicron", "SEMCO"],
    primaryDrivers: ["100mm+ Multi-Reticle AI Packages", "NVLink Switch Trays"],
    riskLevel: "constrained",
    mitigationKo:
      "패키지 면적이 100x100mm를 초과하면서 ABF 다층 휨(Warpage) 불량이 급증해 이비덴·삼성전기 중심의 대면적 글래스 코어 기판 파일럿 전환이 가속화되고 있습니다.",
  },
  {
    id: "bn-liquid-rack-power",
    slug: "liquid-cooled-rack-power",
    stageName: "Liquid-Cooled Rack Power",
    stageNameKo: "액체냉각 랙 전력 · 매니폴드 시스템 통합",
    domain: "packaging",
    saturationPct: 93.7,
    leadTimeWeeks: 27,
    momPressureDeltaPct: 6.2,
    primarySuppliers: ["Vertiv", "Schneider Electric", "Delta Electronics", "CoolIT"],
    primaryDrivers: ["120kW+ NVL72 Racks", "1GW+ AI Campuses", "CDU Manifolds"],
    riskLevel: "tight",
    mitigationKo:
      "칩이 생산되어도 130kW급 랙 단위 직수냉(DLC) CDU와 누수 방지 퀵디스커넥트(UQD) 수급이 지연되면 클러스터 가동이 멈춥니다. 모듈형 프리패브 랙 조립으로 납기를 단축 중입니다.",
  },
];

export const SUPPLY_DEMAND_LINKS: SupplyDemandLink[] = [
  {
    id: "link-1",
    supplierId: "fab-tsmc-cowos",
    supplierLabel: "TSMC CoWoS-L",
    technologyLabel: "CoWoS-L + N3P Compute Die",
    customerId: "cust-openai",
    customerLabel: "OpenAI",
    customerSegment: "frontier-lab",
    monthlyCommittedUnits: 24.5,
    monthlyActualShippedUnits: 19.2,
    gapPct: -21.6,
    unitLabel: "k Interposers/mo",
    bottleneckRisk: "tight",
  },
  {
    id: "link-2",
    supplierId: "fab-skhynix-hbm3e",
    supplierLabel: "SK hynix M16/M15",
    technologyLabel: "HBM3E 12-Hi (36GB)",
    customerId: "cust-openai",
    customerLabel: "OpenAI",
    customerSegment: "frontier-lab",
    monthlyCommittedUnits: 38.0,
    monthlyActualShippedUnits: 30.1,
    gapPct: -20.8,
    unitLabel: "k Stacks/mo",
    bottleneckRisk: "tight",
  },
  {
    id: "link-3",
    supplierId: "fab-tsmc-n3p",
    supplierLabel: "TSMC Fab 18",
    technologyLabel: "N3E/N3P Custom ASIC & Trainium3",
    customerId: "cust-anthropic",
    customerLabel: "Anthropic",
    customerSegment: "frontier-lab",
    monthlyCommittedUnits: 26.0,
    monthlyActualShippedUnits: 21.6,
    gapPct: -16.9,
    unitLabel: "kWPM eq",
    bottleneckRisk: "constrained",
  },
  {
    id: "link-4",
    supplierId: "fab-skhynix-hbm4",
    supplierLabel: "SK hynix M15X",
    technologyLabel: "HBM4 12-Hi / TPU v7-Next",
    customerId: "cust-deepmind",
    customerLabel: "Google DeepMind",
    customerSegment: "frontier-lab",
    monthlyCommittedUnits: 18.0,
    monthlyActualShippedUnits: 16.5,
    gapPct: -8.3,
    unitLabel: "k Stacks/mo",
    bottleneckRisk: "constrained",
  },
  {
    id: "link-5",
    supplierId: "fab-samsung-hbm",
    supplierLabel: "Samsung DS P3/P4",
    technologyLabel: "HBM3E 12-Hi Dual-Source",
    customerId: "cust-deepmind",
    customerLabel: "Google DeepMind",
    customerSegment: "frontier-lab",
    monthlyCommittedUnits: 28.0,
    monthlyActualShippedUnits: 25.6,
    gapPct: -8.6,
    unitLabel: "k Stacks/mo",
    bottleneckRisk: "balanced",
  },
  {
    id: "link-6",
    supplierId: "fab-tsmc-cowos",
    supplierLabel: "TSMC CoWoS-L",
    technologyLabel: "GB200/B200 Supercluster Allocation",
    customerId: "cust-xai",
    customerLabel: "xAI",
    customerSegment: "frontier-lab",
    monthlyCommittedUnits: 19.0,
    monthlyActualShippedUnits: 14.6,
    gapPct: -23.2,
    unitLabel: "k Interposers/mo",
    bottleneckRisk: "tight",
  },
  {
    id: "link-7",
    supplierId: "fab-micron-hbm",
    supplierLabel: "Micron Fab 16",
    technologyLabel: "HBM3E 12-Hi Low-Power",
    customerId: "cust-xai",
    customerLabel: "xAI",
    customerSegment: "frontier-lab",
    monthlyCommittedUnits: 24.0,
    monthlyActualShippedUnits: 18.9,
    gapPct: -21.3,
    unitLabel: "k Stacks/mo",
    bottleneckRisk: "tight",
  },
  {
    id: "link-8",
    supplierId: "fab-tsmc-n3p",
    supplierLabel: "TSMC Fab 18/21",
    technologyLabel: "N3P MTIA v3 + GB300 Die",
    customerId: "cust-meta",
    customerLabel: "Meta AI",
    customerSegment: "frontier-lab",
    monthlyCommittedUnits: 31.0,
    monthlyActualShippedUnits: 26.6,
    gapPct: -14.2,
    unitLabel: "kWPM eq",
    bottleneckRisk: "constrained",
  },
  {
    id: "link-9",
    supplierId: "fab-tsmc-cowos",
    supplierLabel: "TSMC CoWoS-L",
    technologyLabel: "GB200/GB300 NVL72 Bare-Metal",
    customerId: "cust-coreweave",
    customerLabel: "CoreWeave",
    customerSegment: "neocloud",
    monthlyCommittedUnits: 16.5,
    monthlyActualShippedUnits: 12.4,
    gapPct: -24.8,
    unitLabel: "k Interposers/mo",
    bottleneckRisk: "tight",
  },
  {
    id: "link-10",
    supplierId: "fab-skhynix-hbm3e",
    supplierLabel: "SK hynix M16",
    technologyLabel: "HBM3E 12-Hi (NVL72 Allocation)",
    customerId: "cust-coreweave",
    customerLabel: "CoreWeave",
    customerSegment: "neocloud",
    monthlyCommittedUnits: 25.0,
    monthlyActualShippedUnits: 19.0,
    gapPct: -24.0,
    unitLabel: "k Stacks/mo",
    bottleneckRisk: "tight",
  },
  {
    id: "link-11",
    supplierId: "fab-micron-hbm",
    supplierLabel: "Micron Fab 15/16",
    technologyLabel: "HBM3E 12-Hi Sovereign AI Pods",
    customerId: "cust-nebius",
    customerLabel: "Nebius",
    customerSegment: "neocloud",
    monthlyCommittedUnits: 11.4,
    monthlyActualShippedUnits: 9.4,
    gapPct: -17.5,
    unitLabel: "k Stacks/mo",
    bottleneckRisk: "constrained",
  },
  {
    id: "link-12",
    supplierId: "fab-samsung-hbm",
    supplierLabel: "Samsung DS",
    technologyLabel: "HBM3E 12-Hi On-Demand Pods",
    customerId: "cust-lambda",
    customerLabel: "Lambda",
    customerSegment: "neocloud",
    monthlyCommittedUnits: 10.8,
    monthlyActualShippedUnits: 9.1,
    gapPct: -15.7,
    unitLabel: "k Stacks/mo",
    bottleneckRisk: "constrained",
  },
  {
    id: "link-13",
    supplierId: "fab-tsmc-cowos",
    supplierLabel: "TSMC CoWoS-L",
    technologyLabel: "Abilene 1.2GW GB200/GB300 Cluster",
    customerId: "cust-crusoe",
    customerLabel: "Crusoe",
    customerSegment: "neocloud",
    monthlyCommittedUnits: 12.5,
    monthlyActualShippedUnits: 9.2,
    gapPct: -26.4,
    unitLabel: "k Interposers/mo",
    bottleneckRisk: "tight",
  },
  {
    id: "link-14",
    supplierId: "fab-samsung-hbm",
    supplierLabel: "Samsung DS",
    technologyLabel: "MI325X/MI355X 288GB HBM3E",
    customerId: "cust-tensorwave",
    customerLabel: "TensorWave",
    customerSegment: "neocloud",
    monthlyCommittedUnits: 14.2,
    monthlyActualShippedUnits: 12.6,
    gapPct: -11.3,
    unitLabel: "k Stacks/mo",
    bottleneckRisk: "balanced",
  },
];

function roundTo(val: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

function deriveCustomerRisk(customer: DemandCustomerRecord): RiskLevel {
  if (customer.supplyGapPct <= -20 || customer.deploymentStatus === "backlog-capped") {
    return "tight";
  }
  if (customer.supplyGapPct <= -12 || customer.deploymentStatus === "ramping") {
    return "constrained";
  }
  return "balanced";
}

export function formatSignedPercent(val: number): string {
  const rounded = roundTo(val, 1);
  if (Math.abs(rounded) < 0.05) {
    return "0.0%";
  }
  return rounded > 0 ? `+${rounded.toFixed(1)}%` : `${rounded.toFixed(1)}%`;
}

export function getAllEntitySlugs(): string[] {
  return [
    ...FAB_SHIPMENTS.map((fab) => fab.slug),
    ...DEMAND_CUSTOMERS.map((cust) => cust.slug),
    ...BOTTLENECK_STAGES.map((bn) => bn.slug),
  ];
}

const ENTITY_SLUG_ALIASES: Record<string, string> = {
  tsmc: "tsmc-n3p-logic",
  "sk-hynix": "sk-hynix-hbm3e-12hi",
  "samsung-electronics": "samsung-hbm3e-hbm4",
  samsung: "samsung-hbm3e-hbm4",
  micron: "micron-hbm3e-hbm4",
  "intel-foundry": "intel-18a-foveros",
  intel: "intel-18a-foveros",
  hbm4: "sk-hynix-hbm4",
  hbm3e: "sk-hynix-hbm3e-12hi",
  cowos: "cowos-l",
};

export function getEntityBySlug(slug: string): FabnowEntity | null {
  const raw = slug.trim().toLowerCase();
  if (!raw) return null;
  const normalized = ENTITY_SLUG_ALIASES[raw] ?? raw;

  const fab = FAB_SHIPMENTS.find((item) => item.slug.toLowerCase() === normalized);
  if (fab) {
    return {
      kind: "fab",
      slug: fab.slug,
      title: `${fab.company} · ${fab.nodeOrProduct}`,
      subtitle: `${fab.companyKo} · ${fab.lineName}`,
      riskLevel: fab.riskLevel,
      record: fab,
      links: SUPPLY_DEMAND_LINKS.filter((link) => link.supplierId === fab.id),
    };
  }

  const customer = DEMAND_CUSTOMERS.find(
    (item) => item.slug.toLowerCase() === normalized
  );
  if (customer) {
    return {
      kind: "customer",
      slug: customer.slug,
      title: `${customer.name} (${customer.nameKo})`,
      subtitle: `${customer.segment === "frontier-lab" ? "프론티어 AI 랩" : "네오클라우드"} · ${customer.focusCompute}`,
      riskLevel: deriveCustomerRisk(customer),
      record: customer,
      links: SUPPLY_DEMAND_LINKS.filter((link) => link.customerId === customer.id),
    };
  }

  const bottleneck = BOTTLENECK_STAGES.find(
    (item) => item.slug.toLowerCase() === normalized
  );
  if (bottleneck) {
    const relatedLinks = SUPPLY_DEMAND_LINKS.filter((link) => {
      if (bottleneck.domain === "packaging") {
        return link.unitLabel.includes("Interposers");
      }
      if (bottleneck.domain === "memory") {
        return link.unitLabel.includes("Stacks");
      }
      if (bottleneck.domain === "wafer") {
        return link.unitLabel.includes("kWPM");
      }
      return link.bottleneckRisk === "tight";
    });

    return {
      kind: "bottleneck",
      slug: bottleneck.slug,
      title: `${bottleneck.stageName} · ${bottleneck.stageNameKo}`,
      subtitle: `병목 도메인: ${bottleneck.domain.toUpperCase()} · 포화도 ${bottleneck.saturationPct.toFixed(1)}%`,
      riskLevel: bottleneck.riskLevel,
      record: bottleneck,
      links: relatedLinks,
    };
  }

  return null;
}

export function getSupplyDemandSummary(): SupplyDemandSummary {
  const totalFabLines = FAB_SHIPMENTS.length;
  const avgFabUtilizationPct = roundTo(
    FAB_SHIPMENTS.reduce((sum, item) => sum + item.utilizationPct, 0) /
      totalFabLines,
    1
  );
  const avgAiAllocationPct = roundTo(
    FAB_SHIPMENTS.reduce((sum, item) => sum + item.aiAllocationPct, 0) /
      totalFabLines,
    1
  );
  const avgFabLeadTimeWeeks = roundTo(
    FAB_SHIPMENTS.reduce((sum, item) => sum + item.leadTimeWeeks, 0) /
      totalFabLines,
    1
  );

  // Derive weighted monthly lead-time pressure shift (in weeks) from bottleneck MoM pressure
  const avgPressurePct =
    BOTTLENECK_STAGES.reduce((sum, bn) => sum + bn.momPressureDeltaPct, 0) /
    BOTTLENECK_STAGES.length;
  const avgLeadTimeMomDeltaWeeks = roundTo(
    (avgFabLeadTimeWeeks * avgPressurePct) / 100,
    1
  );

  const totalMonthlyWaferKpm = FAB_SHIPMENTS.filter(
    (item) => item.unitLabel === "kWPM"
  ).reduce((sum, item) => sum + item.monthlyOutputValue, 0);

  const totalMonthlyHbmKStacks = FAB_SHIPMENTS.filter(
    (item) => item.unitLabel === "k Stacks/mo"
  ).reduce((sum, item) => sum + item.monthlyOutputValue, 0);

  const totalMonthlyPackagingK = FAB_SHIPMENTS.filter(
    (item) => item.unitLabel === "k Interposers/mo"
  ).reduce((sum, item) => sum + item.monthlyOutputValue, 0);

  const frontierLabs = DEMAND_CUSTOMERS.filter(
    (item) => item.segment === "frontier-lab"
  );
  const neoclouds = DEMAND_CUSTOMERS.filter(
    (item) => item.segment === "neocloud"
  );

  const totalMonthlyGpuEquivalentK = DEMAND_CUSTOMERS.reduce(
    (sum, item) => sum + item.monthlyGpuEquivalentK,
    0
  );
  const totalMonthlyHbmDemandTB = DEMAND_CUSTOMERS.reduce(
    (sum, item) => sum + item.monthlyHbmDemandTB,
    0
  );
  const totalCommittedPowerMW = DEMAND_CUSTOMERS.reduce(
    (sum, item) => sum + item.committedPowerMW,
    0
  );

  const avgBacklogMonths = roundTo(
    DEMAND_CUSTOMERS.reduce((sum, item) => sum + item.backlogMonths, 0) /
      DEMAND_CUSTOMERS.length,
    1
  );
  const frontierLabAvgBacklogMonths = roundTo(
    frontierLabs.reduce((sum, item) => sum + item.backlogMonths, 0) /
      frontierLabs.length,
    1
  );
  const neocloudAvgBacklogMonths = roundTo(
    neoclouds.reduce((sum, item) => sum + item.backlogMonths, 0) /
      neoclouds.length,
    1
  );

  const weightedSupplyGapPct = roundTo(
    DEMAND_CUSTOMERS.reduce(
      (sum, item) => sum + item.supplyGapPct * item.monthlyGpuEquivalentK,
      0
    ) / totalMonthlyGpuEquivalentK,
    1
  );

  const packagingAndHbmLinks = SUPPLY_DEMAND_LINKS.filter(
    (link) =>
      link.unitLabel.includes("Interposers") || link.unitLabel.includes("Stacks")
  );
  const linkCommitted = packagingAndHbmLinks.reduce(
    (sum, link) => sum + link.monthlyCommittedUnits,
    0
  );
  const linkShipped = packagingAndHbmLinks.reduce(
    (sum, link) => sum + link.monthlyActualShippedUnits,
    0
  );
  const unmetPackagingAndHbmGapPct = roundTo(
    ((linkShipped - linkCommitted) / linkCommitted) * 100,
    1
  );

  const sortedBottlenecks = [...BOTTLENECK_STAGES].sort(
    (a, b) => b.saturationPct - a.saturationPct
  );
  const peak = sortedBottlenecks[0];

  const totalLinkCommittedUnits = roundTo(
    SUPPLY_DEMAND_LINKS.reduce(
      (sum, link) => sum + link.monthlyCommittedUnits,
      0
    ),
    1
  );
  const totalLinkShippedUnits = roundTo(
    SUPPLY_DEMAND_LINKS.reduce(
      (sum, link) => sum + link.monthlyActualShippedUnits,
      0
    ),
    1
  );

  return {
    asOf: DATA_SYNC_LABEL,
    totalFabLines,
    avgFabUtilizationPct,
    avgAiAllocationPct,
    avgFabLeadTimeWeeks,
    avgLeadTimeMomDeltaWeeks,
    totalMonthlyWaferKpm,
    totalMonthlyHbmKStacks,
    totalMonthlyPackagingK,
    totalDemandCustomers: DEMAND_CUSTOMERS.length,
    frontierLabCount: frontierLabs.length,
    neocloudCount: neoclouds.length,
    totalMonthlyGpuEquivalentK,
    totalMonthlyHbmDemandTB,
    totalCommittedPowerMW,
    avgBacklogMonths,
    frontierLabAvgBacklogMonths,
    neocloudAvgBacklogMonths,
    weightedSupplyGapPct,
    unmetPackagingAndHbmGapPct,
    criticalBottleneckCount: BOTTLENECK_STAGES.filter(
      (item) => item.riskLevel === "tight"
    ).length,
    peakBottleneck: {
      slug: peak.slug,
      stageName: peak.stageName,
      stageNameKo: peak.stageNameKo,
      saturationPct: peak.saturationPct,
      leadTimeWeeks: peak.leadTimeWeeks,
    },
    totalLinkCommittedUnits,
    totalLinkShippedUnits,
  };
}

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildFabnowCsvReport(): string {
  const summary = getSupplyDemandSummary();
  const rows: string[] = [];

  rows.push(
    [
      "ReportType",
      "EntityID",
      "Slug",
      "Name",
      "SegmentOrCategory",
      "PrimaryMetricValue",
      "Unit",
      "MoMDeltaPct",
      "UtilizationOrSaturationPct",
      "SecondaryMetric",
      "LeadTimeOrBacklog",
      "RiskOrStatus",
      "Notes",
    ]
      .map(escapeCsvCell)
      .join(",")
  );

  rows.push(
    [
      "SUMMARY",
      "global-briefing",
      "overview",
      `fabnow Global Intelligence (${summary.asOf})`,
      "summary",
      summary.avgFabUtilizationPct,
      "% avg utilization",
      formatSignedPercent(summary.unmetPackagingAndHbmGapPct),
      summary.avgAiAllocationPct,
      `${summary.totalMonthlyGpuEquivalentK}k GPUeq/mo`,
      `${summary.avgFabLeadTimeWeeks}w lead / ${summary.avgBacklogMonths}m backlog`,
      `${summary.criticalBottleneckCount} tight stages`,
      `Peak bottleneck: ${summary.peakBottleneck.stageName} (${summary.peakBottleneck.saturationPct}%)`,
    ]
      .map(escapeCsvCell)
      .join(",")
  );

  for (const fab of FAB_SHIPMENTS) {
    rows.push(
      [
        "FAB_SHIPMENT",
        fab.id,
        fab.slug,
        `${fab.company} (${fab.companyKo}) - ${fab.nodeOrProduct}`,
        fab.category,
        fab.monthlyOutputValue,
        fab.unitLabel,
        formatSignedPercent(fab.momDeltaPct),
        fab.utilizationPct,
        `Yield ${fab.yieldPct}% (${fab.yieldTrend})`,
        `${fab.leadTimeWeeks} weeks`,
        fab.riskLevel,
        fab.bottleneckStage,
      ]
        .map(escapeCsvCell)
        .join(",")
    );
  }

  for (const cust of DEMAND_CUSTOMERS) {
    rows.push(
      [
        "AI_DEMAND",
        cust.id,
        cust.slug,
        `${cust.name} (${cust.nameKo})`,
        cust.segment,
        cust.monthlyGpuEquivalentK,
        "k GPUeq/mo",
        formatSignedPercent(cust.momDemandDeltaPct),
        formatSignedPercent(cust.supplyGapPct),
        `${cust.monthlyHbmDemandTB} TB HBM / ${cust.committedPowerMW} MW`,
        `${cust.backlogMonths} months`,
        cust.deploymentStatus,
        cust.focusCompute,
      ]
        .map(escapeCsvCell)
        .join(",")
    );
  }

  for (const bn of BOTTLENECK_STAGES) {
    rows.push(
      [
        "BOTTLENECK",
        bn.id,
        bn.slug,
        `${bn.stageName} (${bn.stageNameKo})`,
        bn.domain,
        bn.saturationPct,
        "% saturation",
        formatSignedPercent(bn.momPressureDeltaPct),
        bn.saturationPct,
        bn.primaryDrivers.join(" / "),
        `${bn.leadTimeWeeks} weeks`,
        bn.riskLevel,
        bn.mitigationKo,
      ]
        .map(escapeCsvCell)
        .join(",")
    );
  }

  return `\uFEFF${rows.join("\n")}`;
}
