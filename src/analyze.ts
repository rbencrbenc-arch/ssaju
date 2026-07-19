import { resolveNearestMajorSolarTermUTC, toUTCFromKoreanLocal } from "./manse.ts";
import {
  ADVANCED_SINSAL,
  BRANCH_ELEMENT,
  BRANCH_HIDDEN_STEMS,
  BRANCH_TO_MONTH_INDEX,
  BRANCH_YINYANG,
  DAY_IN_MS,
  EARTHLY_BRANCHES,
  HEAVENLY_STEMS,
  HEAVENLY_STEMS_KO,
  HANJA_TO_KO_BRANCH,
  KO_TO_HANJA_BRANCH,
  KO_TO_HANJA_STEM,
  MONTH_LABELS,
  STEM_ELEMENT,
  STEM_YINYANG,
  TEN_GODS,
  TWELVE_STAGES_GEO,
  WOLUN_MONTH_NAMES,
  YEAR_STEM_TO_MONTH_START_STEM_INDEX,
  YONGSIN_RULES,
  mod,
} from "./constants.ts";
import type {
  BranchRelations,
  DaeunItem,
  FourPillarsDetail,
  NormalizedBirth,
  NormalizedInput,
  Personality,
  PillarDetail,
  PillarKey,
  SeyunItem,
  StemRelation,
  SajuResult,
  TenGodGroup,
  Gender,
  WolunItem,
} from "./types.ts";

export type SajuAnalysis = Pick<
  SajuResult,
  | "pillars"
  | "pillarDetails"
  | "dayStem"
  | "dayBranch"
  | "gongmang"
  | "fiveElements"
  | "tenGods"
  | "stages12"
  | "stemRelations"
  | "branchRelations"
  | "sals"
  | "currentAge"
  | "currentYear"
  | "daeun"
  | "seyun"
  | "wolun"
  | "advanced"
>;

const PILLAR_KEYS: readonly PillarKey[] = ["hour", "day", "month", "year"];

export function analyzeChart(args: {
  fourPillars: FourPillarsDetail;
  normalizedBirth: NormalizedBirth;
  normalizedInput: NormalizedInput;
  currentDate: { year: number; month: number; day: number };
}): SajuAnalysis {
  const { fourPillars, normalizedBirth, normalizedInput, currentDate } = args;
  const currentYear = currentDate.year;

  const yearPillar = buildPillarDetail(fourPillars.year.heavenlyStem, fourPillars.year.earthlyBranch);
  const monthPillar = buildPillarDetail(fourPillars.month.heavenlyStem, fourPillars.month.earthlyBranch);
  const dayPillar = buildPillarDetail(fourPillars.day.heavenlyStem, fourPillars.day.earthlyBranch);
  const hourPillar = buildPillarDetail(fourPillars.hour.heavenlyStem, fourPillars.hour.earthlyBranch);

  const pillars = {
    year: yearPillar.stem + yearPillar.branch,
    month: monthPillar.stem + monthPillar.branch,
    day: dayPillar.stem + dayPillar.branch,
    hour: hourPillar.stem + hourPillar.branch,
  };

  const pillarDetails = {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar,
  };

  const dayStem = dayPillar.stem;
  const dayBranch = dayPillar.branch;
  const gongmang = calculateGongmang(dayPillar.stemIdx, dayPillar.branchIdx);

  const tenGods = {
    year: {
      stem: getTenGod(dayStem, yearPillar.stem),
      branch: getTenGod(dayStem, yearPillar.hiddenStems.정기 || ""),
    },
    month: {
      stem: getTenGod(dayStem, monthPillar.stem),
      branch: getTenGod(dayStem, monthPillar.hiddenStems.정기 || ""),
    },
    day: {
      stem: "(일간)",
      branch: getTenGod(dayStem, dayPillar.hiddenStems.정기 || ""),
    },
    hour: {
      stem: getTenGod(dayStem, hourPillar.stem),
      branch: getTenGod(dayStem, hourPillar.hiddenStems.정기 || ""),
    },
  };

  const stages12 = {
    bong: mapPillars((key) => get12Stage(dayStem, pillarDetails[key].branch, "bong")),
    geo: mapPillars((key) => get12Stage(dayStem, pillarDetails[key].branch, "geo")),
  };

  const stemsInPillarOrder: [string, string, string, string] = [
    hourPillar.stem,
    dayPillar.stem,
    monthPillar.stem,
    yearPillar.stem,
  ];
  const branchesInPillarOrder: [string, string, string, string] = [
    hourPillar.branch,
    dayPillar.branch,
    monthPillar.branch,
    yearPillar.branch,
  ];

  const stemRelations = getStemRelations(stemsInPillarOrder);
  const branchRelations = getBranchRelations(branchesInPillarOrder);

  const sals: Record<PillarKey, { twelveSal: string; specialSals: string[] }> = mapPillars((key) => ({
    twelveSal: getTwelveSals(yearPillar.branch, pillarDetails[key].branch),
    specialSals: calculateSals(dayPillar.stem, dayPillar.branch, pillarDetails[key].branch),
  }));

  const fiveElements = getFiveElements({
    year: { stem: yearPillar.stem, branch: yearPillar.branch },
    month: { stem: monthPillar.stem, branch: monthPillar.branch },
    day: { stem: dayPillar.stem, branch: dayPillar.branch },
    hour: { stem: hourPillar.stem, branch: hourPillar.branch },
  });

  const currentAge = calculateInternationalAge(normalizedBirth.solar, currentDate);

  const daeun = calculateDaeun({
    yearStem: yearPillar.stem,
    monthStem: monthPillar.stem,
    monthBranch: monthPillar.branch,
    gender: normalizedInput.gender,
    birthSolar: normalizedBirth.solar,
    birthCalculation: normalizedBirth.calculation,
    dayStem,
    dayBranch,
    currentAge,
  });

  const seyun = calculateSeyun(currentYear, dayStem);
  const wolun = calculateWolun(currentYear, dayStem);

  const dayStrength = calculateDayStrength(dayPillar.stem, monthPillar.branch, fiveElements);
  const geukguk = determineGeukGuk(tenGods.month.stem, dayStrength.score);
  const yongsin = selectYongsin(dayStem, dayStrength.strength, geukguk);
  const advancedSinsal = calculateAdvancedSinsal(
    yearPillar.branch,
    monthPillar.branch,
    dayPillar.branch,
    hourPillar.branch,
    dayPillar.stem,
  );
  const personality = analyzePersonality({
    dayStem,
    tenGods,
    fiveElements,
    dayStrength,
    sinsal: advancedSinsal,
  });
  const interpretation = generateInterpretation({
    geukguk,
    fiveElements,
    sinsal: advancedSinsal,
  });

  return {
    pillars,
    pillarDetails,
    dayStem,
    dayBranch,
    gongmang,
    fiveElements,
    tenGods,
    stages12,
    stemRelations,
    branchRelations,
    sals,
    currentAge,
    currentYear,
    daeun,
    seyun,
    wolun,
    advanced: {
      dayStrength,
      geukguk,
      yongsin,
      sinsal: advancedSinsal,
      personality,
      interpretation,
    },
  };
}

function buildPillarDetail(stemKo: string, branchKo: string): PillarDetail {
  const stem = KO_TO_HANJA_STEM[stemKo] || stemKo;
  const branch = KO_TO_HANJA_BRANCH[branchKo] || branchKo;

  return {
    stem,
    branch,
    stemKo,
    branchKo,
    stemIdx: HEAVENLY_STEMS.indexOf(stem as (typeof HEAVENLY_STEMS)[number]),
    branchIdx: EARTHLY_BRANCHES.indexOf(branch as (typeof EARTHLY_BRANCHES)[number]),
    element: {
      stem: STEM_ELEMENT[stem],
      branch: BRANCH_ELEMENT[branch],
    },
    yinYang: {
      stem: STEM_YINYANG[stem],
      branch: BRANCH_YINYANG[branch],
    },
    hiddenStems: {
      여기: BRANCH_HIDDEN_STEMS[branch]?.여기 || null,
      중기: BRANCH_HIDDEN_STEMS[branch]?.중기 || null,
      정기: BRANCH_HIDDEN_STEMS[branch]?.정기 || null,
    },
  };
}

function calculateGongmang(dayStemIdx: number, dayBranchIdx: number) {
  const sunsu = mod(dayBranchIdx - dayStemIdx, 12);
  const gm1 = mod(sunsu + 10, 12);
  const gm2 = mod(sunsu + 11, 12);
  return {
    branches: [EARTHLY_BRANCHES[gm1], EARTHLY_BRANCHES[gm2]] as [string, string],
    branchesKo: [HANJA_TO_KO_BRANCH[EARTHLY_BRANCHES[gm1]], HANJA_TO_KO_BRANCH[EARTHLY_BRANCHES[gm2]]] as [
      string,
      string,
    ],
  };
}

function getTenGod(dayStem: string, otherStem: string): string {
  return TEN_GODS[dayStem]?.[otherStem] || "";
}

function mapPillars<T>(mapper: (key: PillarKey) => T): Record<PillarKey, T> {
  const out = {} as Record<PillarKey, T>;
  for (const key of PILLAR_KEYS) out[key] = mapper(key);
  return out;
}

// 봉법 12운성은 장생 시작지와 음양에 따른 순행/역행으로 결정된다.
const TWELVE_STAGE_SEQUENCE = ["장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절", "태", "양"] as const;
const TWELVE_STAGE_START_BRANCH: Record<string, (typeof EARTHLY_BRANCHES)[number]> = {
  甲: "亥",
  乙: "午",
  丙: "寅",
  丁: "酉",
  戊: "寅",
  己: "酉",
  庚: "巳",
  辛: "子",
  壬: "申",
  癸: "卯",
};

function get12Stage(dayStem: string, branch: string, method: "bong" | "geo" = "bong"): string {
  const branchIdx = EARTHLY_BRANCHES.indexOf(branch as (typeof EARTHLY_BRANCHES)[number]);
  if (branchIdx < 0) return "";
  if (method === "bong") {
    const startBranch = TWELVE_STAGE_START_BRANCH[dayStem];
    const startIdx = EARTHLY_BRANCHES.indexOf(startBranch as (typeof EARTHLY_BRANCHES)[number]);
    if (startIdx < 0) return "";

    const isYangStem = STEM_YINYANG[dayStem] === "양";
    const offset = isYangStem ? mod(branchIdx - startIdx, 12) : mod(startIdx - branchIdx, 12);
    return TWELVE_STAGE_SEQUENCE[offset] || "";
  }

  return TWELVE_STAGES_GEO[dayStem]?.[branchIdx] || "";
}

function getFiveElements(pillars: {
  year: { stem: string; branch: string };
  month: { stem: string; branch: string };
  day: { stem: string; branch: string };
  hour: { stem: string; branch: string };
}): Record<string, number> {
  const counts: Record<string, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  const allStems = [pillars.year.stem, pillars.month.stem, pillars.day.stem, pillars.hour.stem];
  const allBranches = [pillars.year.branch, pillars.month.branch, pillars.day.branch, pillars.hour.branch];

  for (const stem of allStems) {
    const e = STEM_ELEMENT[stem];
    if (e) counts[e]++;
  }
  for (const branch of allBranches) {
    const e = BRANCH_ELEMENT[branch];
    if (e) counts[e]++;
  }

  return counts;
}

// 12신살은 연지의 삼합국 기준 시작지에서 순차 배치한다.
const SAL_NAMES = ["화개살", "겁살", "재살", "천살", "지살", "년살", "월살", "망신살", "장성살", "반안살", "역마살", "육해살"] as const;
const TWELVE_SAL_GROUP_START: ReadonlyArray<{ branches: readonly string[]; start: (typeof EARTHLY_BRANCHES)[number] }> = [
  { branches: ["申", "子", "辰"], start: "辰" },
  { branches: ["寅", "午", "戌"], start: "戌" },
  { branches: ["亥", "卯", "未"], start: "未" },
  { branches: ["巳", "酉", "丑"], start: "丑" },
];

const CHEON_EUL_GWIIN_MAP: Record<string, string[]> = {
  甲: ["丑", "未"],
  乙: ["子", "申"],
  丙: ["亥", "酉"],
  丁: ["亥", "酉"],
  戊: ["丑", "未"],
  己: ["子", "申"],
  庚: ["丑", "未"],
  辛: ["寅", "午"],
  壬: ["卯", "巳"],
  癸: ["卯", "巳"],
};

const YEOKMA_MAP: Record<string, string> = {
  寅: "申",
  申: "寅",
  巳: "亥",
  亥: "巳",
  子: "午",
  午: "子",
  卯: "酉",
  酉: "卯",
  辰: "戌",
  戌: "辰",
  丑: "未",
  未: "丑",
};

const DOHWA_MAP: Record<string, string> = {
  寅: "卯",
  午: "卯",
  戌: "卯",
  申: "酉",
  子: "酉",
  辰: "酉",
  巳: "午",
  酉: "午",
  丑: "午",
  亥: "子",
  卯: "子",
  未: "子",
};

const HWAGAE_MAP: Record<string, string> = {
  寅: "戌",
  午: "戌",
  戌: "戌",
  申: "辰",
  子: "辰",
  辰: "辰",
  巳: "丑",
  酉: "丑",
  丑: "丑",
  亥: "未",
  卯: "未",
  未: "未",
};

function getTwelveSals(yearBranch: string, targetBranch: string): string {
  const targetIdx = (EARTHLY_BRANCHES as readonly string[]).indexOf(targetBranch);
  if (targetIdx < 0) return "";

  const group = TWELVE_SAL_GROUP_START.find(({ branches }) => branches.includes(yearBranch));
  if (!group) return "";

  const startIdx = (EARTHLY_BRANCHES as readonly string[]).indexOf(group.start);
  if (startIdx < 0) return "";

  return SAL_NAMES[mod(targetIdx - startIdx, 12)] || "";
}

function getCheonEulGwiin(dayStem: string): string[] {
  return CHEON_EUL_GWIIN_MAP[dayStem] || [];
}

function getYeokma(dayBranch: string): string {
  return YEOKMA_MAP[dayBranch] || "";
}

function getDohwa(dayBranch: string): string {
  return DOHWA_MAP[dayBranch] || "";
}

function getHwagae(dayBranch: string): string {
  return HWAGAE_MAP[dayBranch] || "";
}

function calculateSals(dayStem: string, dayBranch: string, targetBranch: string): string[] {
  const out: string[] = [];
  const gwiin = getCheonEulGwiin(dayStem);
  if (gwiin.includes(targetBranch)) out.push("천을귀인");
  if (getYeokma(dayBranch) === targetBranch) out.push("역마살");
  if (getDohwa(dayBranch) === targetBranch) out.push("도화살");
  if (getHwagae(dayBranch) === targetBranch) out.push("화개살");
  return out;
}

function getStemRelations(stems: [string, string, string, string]): StemRelation[] {
  const relations: StemRelation[] = [];
  const hapPairs: [string, string][] = [
    ["甲", "己"],
    ["乙", "庚"],
    ["丙", "辛"],
    ["丁", "壬"],
    ["戊", "癸"],
  ];
  const hapElements = ["토", "금", "수", "목", "화"];

  const chungPairs: [string, string][] = [
    ["甲", "庚"],
    ["乙", "辛"],
    ["丙", "壬"],
    ["丁", "癸"],
    ["戊", "甲"],
    ["己", "乙"],
  ];

  const pillarNames: PillarKey[] = ["hour", "day", "month", "year"];

  for (let i = 0; i < stems.length; i++) {
    for (let j = i + 1; j < stems.length; j++) {
      for (let k = 0; k < hapPairs.length; k++) {
        const pair = hapPairs[k];
        if (
          (stems[i] === pair[0] && stems[j] === pair[1]) ||
          (stems[i] === pair[1] && stems[j] === pair[0])
        ) {
          relations.push({
            type: "합",
            pillars: [pillarNames[i], pillarNames[j]],
            desc: `${stems[i]}${stems[j]} 합 → ${hapElements[k]}`,
            stems: [stems[i], stems[j]],
          });
        }
      }

      for (const pair of chungPairs) {
        if (
          (stems[i] === pair[0] && stems[j] === pair[1]) ||
          (stems[i] === pair[1] && stems[j] === pair[0])
        ) {
          relations.push({
            type: "충",
            pillars: [pillarNames[i], pillarNames[j]],
            desc: `${stems[i]}${stems[j]} 충`,
            stems: [stems[i], stems[j]],
          });
        }
      }
    }
  }

  return relations;
}

function appendRelationSlot(target: Partial<Record<PillarKey, string>>, key: PillarKey, text: string) {
  target[key] = target[key] ? `${target[key]}, ${text}` : text;
}

type BranchPairRelationKey = "육합" | "충" | "형" | "파" | "해" | "원진" | "귀문";

const BRANCH_PAIR_RELATION_RULES: Array<{
  key: BranchPairRelationKey;
  suffix: string;
  pairs: Array<[string, string]>;
}> = [
  {
    key: "육합",
    suffix: "육합",
    pairs: [
      ["子", "丑"],
      ["寅", "亥"],
      ["卯", "戌"],
      ["辰", "酉"],
      ["巳", "申"],
      ["午", "未"],
    ],
  },
  {
    key: "충",
    suffix: "충",
    pairs: [
      ["子", "午"],
      ["丑", "未"],
      ["寅", "申"],
      ["卯", "酉"],
      ["辰", "戌"],
      ["巳", "亥"],
    ],
  },
  {
    key: "형",
    suffix: "형",
    pairs: [
      ["子", "卯"],
      ["寅", "巳"],
      ["巳", "申"],
      ["申", "寅"],
      ["丑", "戌"],
      ["戌", "未"],
      ["未", "丑"],
    ],
  },
  {
    key: "파",
    suffix: "파",
    pairs: [
      ["子", "酉"],
      ["丑", "辰"],
      ["寅", "亥"],
      ["卯", "午"],
      ["巳", "申"],
      ["未", "戌"],
    ],
  },
  {
    key: "해",
    suffix: "해",
    pairs: [
      ["子", "未"],
      ["丑", "午"],
      ["寅", "巳"],
      ["卯", "辰"],
      ["申", "亥"],
      ["酉", "戌"],
    ],
  },
  {
    key: "원진",
    suffix: "원진",
    pairs: [
      ["子", "未"],
      ["丑", "午"],
      ["寅", "酉"],
      ["卯", "申"],
      ["辰", "亥"],
      ["巳", "戌"],
    ],
  },
  {
    key: "귀문",
    suffix: "귀문",
    pairs: [
      ["子", "卯"],
      ["丑", "寅"],
      ["午", "酉"],
      ["未", "申"],
      ["辰", "巳"],
      ["戌", "亥"],
    ],
  },
];

const SAM_HAP_SETS: Array<{ branches: Array<string>; element: string }> = [
  { branches: ["申", "子", "辰"], element: "수국" },
  { branches: ["寅", "午", "戌"], element: "화국" },
  { branches: ["巳", "酉", "丑"], element: "금국" },
  { branches: ["亥", "卯", "未"], element: "목국" },
];

const BANG_HAP_SETS: Array<{ branches: Array<string>; name: string }> = [
  { branches: ["寅", "卯", "辰"], name: "동방목국" },
  { branches: ["巳", "午", "未"], name: "남방화국" },
  { branches: ["申", "酉", "戌"], name: "서방금국" },
  { branches: ["亥", "子", "丑"], name: "북방수국" },
];

function isBranchPairMatch(b1: string, b2: string, pair: [string, string]): boolean {
  return (b1 === pair[0] && b2 === pair[1]) || (b1 === pair[1] && b2 === pair[0]);
}

function getBranchRelations(branches: [string, string, string, string]): BranchRelations {
  const results: BranchRelations = {
    지장간: {},
    방합: {},
    삼합: {},
    반합: {},
    육합: {},
    충: {},
    형: {},
    파: {},
    해: {},
    원진: {},
    귀문: {},
  };

  const pillarNames: PillarKey[] = ["hour", "day", "month", "year"];

  for (let i = 0; i < pillarNames.length; i++) {
    const hidden = BRANCH_HIDDEN_STEMS[branches[i]];
    if (!hidden) continue;
    const parts: string[] = [];
    if (hidden.여기) parts.push(`여기:${hidden.여기}`);
    if (hidden.중기) parts.push(`중기:${hidden.중기}`);
    if (hidden.정기) parts.push(`정기:${hidden.정기}`);
    results.지장간[pillarNames[i]] = parts.join(" ");
  }

  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const b1 = branches[i];
      const b2 = branches[j];
      const p1 = pillarNames[i];
      const p2 = pillarNames[j];

      for (const rule of BRANCH_PAIR_RELATION_RULES) {
        for (const pair of rule.pairs) {
          if (!isBranchPairMatch(b1, b2, pair)) continue;
          const desc = `${b1}${b2} ${rule.suffix}`;
          appendRelationSlot(results[rule.key], p1, desc);
          appendRelationSlot(results[rule.key], p2, desc);
          break;
        }
      }
    }
  }

  for (const set of SAM_HAP_SETS) {
    const matchedIndices = branches
      .map((b, idx) => (set.branches.includes(b) ? idx : -1))
      .filter((idx) => idx >= 0);
    const presentSet = new Set(matchedIndices.map((idx) => branches[idx]));
    const found = set.branches.filter((b) => presentSet.has(b));

    if (found.length >= 3) {
      const desc = `${found.join("")} 삼합 ${set.element}`;
      for (const idx of matchedIndices) {
        const pillar = pillarNames[idx];
        if (pillar) appendRelationSlot(results.삼합, pillar, desc);
      }
    } else if (found.length === 2) {
      const desc = `${found.join("")} 반합 → ${set.element}`;
      for (const idx of matchedIndices) {
        const pillar = pillarNames[idx];
        if (pillar) appendRelationSlot(results.반합, pillar, desc);
      }
    }
  }

  for (const set of BANG_HAP_SETS) {
    const matchedIndices = branches
      .map((b, idx) => (set.branches.includes(b) ? idx : -1))
      .filter((idx) => idx >= 0);
    const presentSet = new Set(matchedIndices.map((idx) => branches[idx]));
    const found = set.branches.filter((b) => presentSet.has(b));

    if (found.length >= 3) {
      const desc = `${found.join("")} 방합 ${set.name}`;
      for (const idx of matchedIndices) {
        const pillar = pillarNames[idx];
        if (pillar) appendRelationSlot(results.방합, pillar, desc);
      }
    }
  }

  return results;
}

function calculateDaeun(args: {
  yearStem: string;
  monthStem: string;
  monthBranch: string;
  gender: Gender;
  birthSolar: { year: number; month: number; day: number };
  birthCalculation: { year: number; month: number; day: number; hour: number; minute: number };
  dayStem: string;
  dayBranch: string;
  currentAge: number;
}): {
  startAge: number;
  startAgePrecise: number;
  list: DaeunItem[];
  current: DaeunItem | null;
  basis: {
    direction: "forward" | "backward";
    birthUtc: string;
    targetTermUtc: string;
    diffDays: number;
  };
} {
  const yearStemIdx = HEAVENLY_STEMS.indexOf(args.yearStem as (typeof HEAVENLY_STEMS)[number]);
  const isYangStem = (yearStemIdx >= 0 ? yearStemIdx : 0) % 2 === 0;
  const isMale = args.gender === "남";
  const forward = (isYangStem && isMale) || (!isYangStem && !isMale);

  const birthUtc = toUTCFromKoreanLocal(
    args.birthCalculation.year,
    args.birthCalculation.month,
    args.birthCalculation.day,
    args.birthCalculation.hour,
    args.birthCalculation.minute,
  );

  const targetTermDate = resolveNearestMajorSolarTermUTC(birthUtc, forward);

  const diffDaysRaw = Math.abs((targetTermDate.getTime() - birthUtc.getTime()) / DAY_IN_MS);
  let startAge = Math.round(diffDaysRaw / 3);
  if (startAge < 1) startAge = 1;
  if (startAge > 10) startAge = 10;

  const monthStemIdx = HEAVENLY_STEMS.indexOf(args.monthStem as (typeof HEAVENLY_STEMS)[number]);
  const monthBranchIdx = EARTHLY_BRANCHES.indexOf(args.monthBranch as (typeof EARTHLY_BRANCHES)[number]);

  const list: DaeunItem[] = [];
  for (let i = 0; i < 10; i++) {
    const offset = forward ? i + 1 : -(i + 1);
    const stemIdx = mod(monthStemIdx + offset, 10);
    const branchIdx = mod(monthBranchIdx + offset, 12);

    const stem = HEAVENLY_STEMS[stemIdx];
    const branch = EARTHLY_BRANCHES[branchIdx];
    const age = startAge + i * 10;
    const stage12 = get12Stage(args.dayStem, branch, "bong");

    list.push({
      age_range: `${age}`,
      startAge: age,
      endAge: age + 9,
      ganzhi: stem + branch,
      stem,
      branch,
      stemIdx,
      branchIdx,
      startYear: args.birthSolar.year + age,
      stemTenGod: getTenGod(args.dayStem, stem),
      branchTenGod: getTenGod(args.dayStem, BRANCH_HIDDEN_STEMS[branch]?.정기 || ""),
      stage12,
      "12unsung": stage12,
      sal: calculateSals(args.dayStem, args.dayBranch, branch),
    });
  }

  let current: DaeunItem | null = null;
  for (const d of list) {
    if (args.currentAge >= d.startAge && args.currentAge <= d.endAge) {
      current = d;
      break;
    }
  }

  return {
    startAge,
    startAgePrecise: Number((diffDaysRaw / 3).toFixed(4)),
    list,
    current,
    basis: {
      direction: forward ? "forward" : "backward",
      birthUtc: birthUtc.toISOString(),
      targetTermUtc: targetTermDate.toISOString(),
      diffDays: Number(diffDaysRaw.toFixed(6)),
    },
  };
}

function calculateInternationalAge(
  birthDate: { year: number; month: number; day: number },
  referenceDate: { year: number; month: number; day: number },
): number {
  let age = referenceDate.year - birthDate.year;
  const birthdayPassed =
    referenceDate.month > birthDate.month ||
    (referenceDate.month === birthDate.month && referenceDate.day >= birthDate.day);
  if (!birthdayPassed) age--;
  return age;
}

function calculateSeyun(centerYear: number, dayStem: string, count = 10): SeyunItem[] {
  const out: SeyunItem[] = [];
  const half = Math.floor(count / 2);

  for (let i = 0; i < count; i++) {
    const year = centerYear - half + i;
    const stemIdx = mod(year - 4, 10);
    const branchIdx = mod(year - 4, 12);
    const stem = HEAVENLY_STEMS[stemIdx];
    const branch = EARTHLY_BRANCHES[branchIdx];

    out.push({
      year,
      ganzhi: stem + branch,
      stem,
      branch,
      tenGodStem: getTenGod(dayStem, stem),
      tenGodBranch: getTenGod(dayStem, BRANCH_HIDDEN_STEMS[branch]?.정기 || ""),
      stage12: get12Stage(dayStem, branch, "bong"),
    });
  }

  return out;
}

function calculateWolun(year: number, dayStem: string): WolunItem[] {
  const yearStemIdx = mod(year - 4, 10);
  const startStem = YEAR_STEM_TO_MONTH_START_STEM_INDEX[yearStemIdx];

  const out: WolunItem[] = [];
  for (let i = 0; i < 12; i++) {
    const branchIdx = (2 + i) % 12;
    const stemIdx = (startStem + i) % 10;
    const stem = HEAVENLY_STEMS[stemIdx];
    const branch = EARTHLY_BRANCHES[branchIdx];
    const monthName = WOLUN_MONTH_NAMES[i];
    const stemTenGod = getTenGod(dayStem, stem);
    const branchTenGod = getTenGod(dayStem, BRANCH_HIDDEN_STEMS[branch]?.정기 || "");
    const stage12 = get12Stage(dayStem, branch, "bong");

    out.push({
      month: i + 1,
      monthName,
      month_name: monthName,
      ganzhi: stem + branch,
      stem,
      branch,
      stemTenGod,
      stem_tengod: stemTenGod,
      branchTenGod,
      branch_tengod: branchTenGod,
      stage12,
      "12unsung": stage12,
    });
  }

  return out;
}

function calculateDayStrength(
  dayStem: string,
  monthBranch: string,
  fiveElements: Record<string, number>,
): { strength: "strong" | "weak" | "neutral"; score: number } {
  const dayElement = STEM_ELEMENT[dayStem];
  if (!dayElement) return { strength: "neutral", score: 50 };

  let score = 50;

  const monthElement = BRANCH_ELEMENT[monthBranch];
  if (monthElement === dayElement) score += 20;

  score += (fiveElements[dayElement] || 0) * 10;

  const supportMap: Record<string, string> = {
    목: "수",
    화: "목",
    토: "화",
    금: "토",
    수: "금",
  };
  const attackMap: Record<string, string> = {
    목: "금",
    화: "수",
    토: "목",
    금: "화",
    수: "토",
  };

  score += (fiveElements[supportMap[dayElement]] || 0) * 8;
  score -= (fiveElements[attackMap[dayElement]] || 0) * 8;

  const monthStage = get12Stage(dayStem, monthBranch, "bong");
  if (monthStage === "건록" || monthStage === "제왕") score += 15;
  if (monthStage === "사" || monthStage === "절" || monthStage === "묘") score -= 15;

  if (score >= 70) return { strength: "strong", score };
  if (score <= 30) return { strength: "weak", score };
  return { strength: "neutral", score };
}

function determineGeukGuk(
  monthTenGod: string,
  score: number,
): "관격" | "재격" | "인수격" | "식상격" | "비겁격" | "종왕격" | "종약격" | "기타" {
  if (score >= 85) return "종왕격";
  if (score <= 15) return "종약격";

  if (["정관", "편관"].includes(monthTenGod)) return "관격";
  if (["정재", "편재"].includes(monthTenGod)) return "재격";
  if (["정인", "편인"].includes(monthTenGod)) return "인수격";
  if (["식신", "상관"].includes(monthTenGod)) return "식상격";
  if (["비견", "겁재"].includes(monthTenGod)) return "비겁격";

  return "기타";
}

function selectYongsin(
  dayStem: string,
  dayStrength: "strong" | "weak" | "neutral",
  geukguk: "관격" | "재격" | "인수격" | "식상격" | "비겁격" | "종왕격" | "종약격" | "기타",
): string[] {
  const rules = YONGSIN_RULES[dayStem];
  if (!rules) return [];

  if (geukguk === "종왕격") return rules.weak;
  if (geukguk === "종약격") return rules.strong;

  return dayStrength === "strong" ? rules.weak : rules.strong;
}

function calculateAdvancedSinsal(
  yearBranch: string,
  monthBranch: string,
  dayBranch: string,
  hourBranch: string,
  dayStem: string,
): { gilsin: string[]; hyungsin: string[] } {
  const gilsin: string[] = [];
  const hyungsin: string[] = [];

  const branches = [yearBranch, monthBranch, dayBranch, hourBranch];

  let cheonEul: string[] | undefined;
  if (["甲", "戊", "庚"].includes(dayStem)) cheonEul = ADVANCED_SINSAL.천을귀인["甲戊庚"];
  else if (["乙", "己"].includes(dayStem)) cheonEul = ADVANCED_SINSAL.천을귀인["乙己"];
  else if (["丙", "丁"].includes(dayStem)) cheonEul = ADVANCED_SINSAL.천을귀인["丙丁"];
  else if (["壬", "癸"].includes(dayStem)) cheonEul = ADVANCED_SINSAL.천을귀인["壬癸"];
  else if (dayStem === "辛") cheonEul = ADVANCED_SINSAL.천을귀인["辛"];

  if (cheonEul) {
    for (const b of branches) {
      if (cheonEul.includes(b)) gilsin.push("천을귀인");
    }
  }

  for (const [group, stem] of Object.entries(ADVANCED_SINSAL.월덕귀인)) {
    if (group.includes(monthBranch) && stem === dayStem) {
      gilsin.push("월덕귀인");
    }
  }

  const monthIndex = BRANCH_TO_MONTH_INDEX[monthBranch];
  if (monthIndex) {
    const label = MONTH_LABELS[monthIndex - 1];
    const stem = ADVANCED_SINSAL.천덕귀인[label as keyof typeof ADVANCED_SINSAL.천덕귀인];
    if (stem && stem === dayStem) gilsin.push("천덕귀인");
  }

  const yangin = ADVANCED_SINSAL.양인[dayStem as keyof typeof ADVANCED_SINSAL.양인];
  if (yangin && dayBranch === yangin) hyungsin.push("양인");

  for (const [group, value] of Object.entries(ADVANCED_SINSAL.화개)) {
    if (group.includes(dayBranch) && branches.includes(value)) gilsin.push("화개");
  }
  for (const [group, value] of Object.entries(ADVANCED_SINSAL.겁살)) {
    if (group.includes(dayBranch) && branches.includes(value)) hyungsin.push("겁살");
  }

  return {
    gilsin: [...new Set(gilsin)],
    hyungsin: [...new Set(hyungsin)],
  };
}

const DAY_MASTER_PROFILE: Record<
  string,
  { archetype: string; keywords: string[]; description: string }
> = {
  甲: {
    archetype: "큰 나무(거목)",
    keywords: ["주도적", "곧음", "리더십", "성장지향"],
    description:
      "위로 곧게 뻗는 큰 나무처럼 명분과 성장을 중시하고 앞장서는 기질입니다. 소신이 뚜렷한 대신 융통성이 부족해질 수 있습니다.",
  },
  乙: {
    archetype: "화초·덩굴",
    keywords: ["유연", "섬세", "적응력", "실속"],
    description:
      "환경에 부드럽게 감기는 덩굴처럼 유연하고 현실적인 적응력이 강합니다. 속은 강단이 있으나 우유부단해 보이기 쉽습니다.",
  },
  丙: {
    archetype: "태양",
    keywords: ["밝음", "열정", "표현력", "개방적"],
    description:
      "만물을 비추는 태양처럼 밝고 열정적이며 자신을 잘 드러냅니다. 에너지가 크지만 기복과 과열을 조심해야 합니다.",
  },
  丁: {
    archetype: "촛불·별빛",
    keywords: ["따뜻함", "섬세", "집중", "헌신"],
    description:
      "어둠을 밝히는 촛불처럼 따뜻하고 섬세하며 한곳에 몰입하는 집중력이 있습니다. 예민하고 감정 기복이 있을 수 있습니다.",
  },
  戊: {
    archetype: "큰 산·대지",
    keywords: ["듬직함", "포용", "신뢰", "중심"],
    description:
      "넓은 대지처럼 듬직하고 포용력이 있어 사람이 모입니다. 중심을 잘 잡지만 고집스럽고 변화가 느릴 수 있습니다.",
  },
  己: {
    archetype: "논밭·정원",
    keywords: ["온화", "현실적", "세심", "실용"],
    description:
      "곡식을 키우는 밭처럼 온화하고 현실적이며 세심하게 관리합니다. 배려심이 크지만 걱정이 많고 소심해질 수 있습니다.",
  },
  庚: {
    archetype: "강철·원석",
    keywords: ["결단", "의리", "추진력", "개혁"],
    description:
      "다듬어지지 않은 강철처럼 결단력과 의리가 강하고 추진력이 좋습니다. 강직함이 지나치면 충돌을 부를 수 있습니다.",
  },
  辛: {
    archetype: "보석·칼날",
    keywords: ["예리", "세련", "완성도", "자존심"],
    description:
      "잘 다듬어진 보석처럼 예리하고 세련되며 완성도를 추구합니다. 자존심이 강하고 예민·비판적으로 흐르기 쉽습니다.",
  },
  壬: {
    archetype: "큰 물·바다",
    keywords: ["지혜", "포용", "유연", "스케일"],
    description:
      "흐르는 큰 물처럼 지혜롭고 포용력이 크며 사고의 스케일이 넓습니다. 자유로운 대신 산만해지기 쉽습니다.",
  },
  癸: {
    archetype: "이슬·비",
    keywords: ["총명", "직관", "세심", "통찰"],
    description:
      "만물을 적시는 이슬비처럼 총명하고 직관이 뛰어나며 세심합니다. 감정이 여리고 소극적으로 보일 수 있습니다.",
  },
};

const TEN_GOD_GROUP_OF: Record<string, TenGodGroup> = {
  비견: "비겁",
  겁재: "비겁",
  식신: "식상",
  상관: "식상",
  편재: "재성",
  정재: "재성",
  편관: "관성",
  정관: "관성",
  편인: "인성",
  정인: "인성",
};

const TEN_GOD_GROUP_PROFILE: Record<
  TenGodGroup,
  { keywords: string[]; description: string; strength: string; caution: string }
> = {
  비겁: {
    keywords: ["주체성", "독립심", "경쟁심", "추진력"],
    description: "자기 주관이 뚜렷하고 독립적이며 경쟁 상황에서 힘을 냅니다.",
    strength: "뚜렷한 자기 주관과 추진력, 승부욕",
    caution: "고집·독선, 재물이나 인간관계에서의 다툼",
  },
  식상: {
    keywords: ["표현력", "창의성", "활동성", "자유"],
    description: "재능을 밖으로 표현하고 새로운 것을 만들어내는 활동성이 돋보입니다.",
    strength: "풍부한 표현력과 창의성, 순발력",
    caution: "즉흥적 언행과 구설, 마무리 부족",
  },
  재성: {
    keywords: ["현실감각", "목표지향", "실행력", "관리"],
    description: "현실 감각이 밝고 목표와 자원을 실질적으로 다루는 데 능합니다.",
    strength: "현실적 목표 설정과 자원 운용력",
    caution: "과욕과 계산적 태도, 일을 너무 벌이는 것",
  },
  관성: {
    keywords: ["책임감", "절제", "명예", "조직력"],
    description: "책임과 원칙을 중시하고 조직·규범 안에서 자기를 관리합니다.",
    strength: "강한 책임감과 자기 절제, 신뢰감",
    caution: "경직됨과 압박감, 지나친 눈치 보기",
  },
  인성: {
    keywords: ["수용성", "학습", "사고력", "배려"],
    description: "받아들이고 배우며 깊이 생각하는 힘이 강하고 정신적 가치를 중시합니다.",
    strength: "탐구심과 학습력, 배려심",
    caution: "생각 과잉과 실행 지연, 의존적 태도",
  },
};

const ELEMENT_TEMPERAMENT: Record<string, string> = {
  목: "성장과 확장을 추구하고 인정이 많은",
  화: "밝고 열정적이며 표현이 활발한",
  토: "안정적이고 포용력 있으며 중재하는",
  금: "원칙적이고 결단력 있으며 의리를 중시하는",
  수: "총명하고 유연하며 통찰력 있는",
};

function analyzePersonality(args: {
  dayStem: string;
  tenGods: {
    year: { stem: string; branch: string };
    month: { stem: string; branch: string };
    day: { stem: string; branch: string };
    hour: { stem: string; branch: string };
  };
  fiveElements: Record<string, number>;
  dayStrength: { strength: "strong" | "weak" | "neutral"; score: number };
  sinsal: { gilsin: string[]; hyungsin: string[] };
}): Personality {
  const { dayStem, tenGods, fiveElements, dayStrength, sinsal } = args;

  const stemIdx = HEAVENLY_STEMS.indexOf(dayStem as (typeof HEAVENLY_STEMS)[number]);
  const stemKo = HEAVENLY_STEMS_KO[stemIdx] || dayStem;
  const element = STEM_ELEMENT[dayStem] || "";
  const yinYang = STEM_YINYANG[dayStem] || "양";
  const dm = DAY_MASTER_PROFILE[dayStem] || {
    archetype: "-",
    keywords: [],
    description: "",
  };

  // 십성 분포: 일간(day.stem)은 자기 자신이므로 제외, 나머지 천간 3 + 지지(정기) 4 = 7개 집계
  const distribution: Record<TenGodGroup, number> = {
    비겁: 0,
    식상: 0,
    재성: 0,
    관성: 0,
    인성: 0,
  };
  const tenGodValues = [
    tenGods.year.stem,
    tenGods.month.stem,
    tenGods.hour.stem,
    tenGods.year.branch,
    tenGods.month.branch,
    tenGods.day.branch,
    tenGods.hour.branch,
  ];
  for (const value of tenGodValues) {
    const group = TEN_GOD_GROUP_OF[value];
    if (group) distribution[group] += 1;
  }
  const groupOrder: TenGodGroup[] = ["비겁", "식상", "재성", "관성", "인성"];
  const dominant = groupOrder.reduce((a, b) =>
    distribution[a] >= distribution[b] ? a : b,
  );
  const dominantProfile = TEN_GOD_GROUP_PROFILE[dominant];

  const elementOrder = ["목", "화", "토", "금", "수"];
  const strongest = elementOrder.reduce((a, b) =>
    (fiveElements[a] || 0) >= (fiveElements[b] || 0) ? a : b,
  );
  const weakest = elementOrder.reduce((a, b) =>
    (fiveElements[a] || 0) <= (fiveElements[b] || 0) ? a : b,
  );

  const strengths: string[] = [
    dominantProfile.strength,
    `${dm.keywords.slice(0, 2).join("·")} 기질 (${dm.archetype})`,
  ];
  const cautions: string[] = [dominantProfile.caution];

  if (dayStrength.strength === "strong") {
    strengths.push("자기 확신과 밀어붙이는 힘이 강함");
    cautions.push("기운이 강한 편이라 주장이 앞설 수 있으니 힘을 나눠 쓰는 배분이 필요합니다");
  } else if (dayStrength.strength === "weak") {
    strengths.push("주변과 협력하고 흡수하는 유연함");
    cautions.push("기운이 약한 편이라 환경과 조력자 선택이 중요합니다");
  }

  if (sinsal.gilsin.length) {
    strengths.push(`길신(${sinsal.gilsin.join(", ")})의 조력`);
  }
  if (sinsal.hyungsin.length) {
    cautions.push(`주의 신살(${sinsal.hyungsin.join(", ")}) 관련 기복`);
  }

  const temperamentDesc = `오행상 ${strongest} 기운이 강해 ${ELEMENT_TEMPERAMENT[strongest] || ""} 면모가 부각되고, ${weakest} 기운은 상대적으로 약합니다.`;

  const summary =
    `일간이 ${dayStem}(${stemKo}${element}, ${yinYang})입니다. ${dm.description}\n` +
    `가장 두드러진 기운은 ${dominant}으로, ${dominantProfile.description}\n` +
    temperamentDesc;

  return {
    dayMaster: {
      stem: dayStem,
      stemKo,
      element,
      yinYang,
      archetype: dm.archetype,
      keywords: dm.keywords,
      description: dm.description,
    },
    tenGodProfile: {
      dominant,
      distribution,
      keywords: dominantProfile.keywords,
      description: dominantProfile.description,
    },
    temperament: {
      strongest,
      weakest,
      description: temperamentDesc,
    },
    strengths,
    cautions,
    summary,
  };
}

function generateInterpretation(args: {
  geukguk: "관격" | "재격" | "인수격" | "식상격" | "비겁격" | "종왕격" | "종약격" | "기타";
  fiveElements: Record<string, number>;
  sinsal: { gilsin: string[]; hyungsin: string[] };
}): string {
  let text = "";

  switch (args.geukguk) {
    case "관격":
      text += "관격으로 분류됩니다. 공적 책임과 원칙을 살릴수록 운이 열립니다.\n";
      break;
    case "재격":
      text += "재격 구조입니다. 현실 감각과 자원 운용력이 핵심 강점입니다.\n";
      break;
    case "인수격":
      text += "인수격 구조입니다. 학습, 연구, 문서, 상담 영역에서 장점이 큽니다.\n";
      break;
    case "식상격":
      text += "식상격 구조입니다. 표현력과 창의성의 발현이 중요합니다.\n";
      break;
    case "비겁격":
      text += "비겁격 구조입니다. 추진력은 강하지만 협업 균형 관리가 필요합니다.\n";
      break;
    case "종왕격":
      text += "일간이 매우 강한 종왕격입니다. 기운의 방출과 절제의 균형이 핵심입니다.\n";
      break;
    case "종약격":
      text += "일간이 약한 종약격입니다. 보완 자원 확보와 환경 선택이 중요합니다.\n";
      break;
    default:
      text += "복합 구조입니다. 특정 단일 격국보다 전체 균형 해석이 중요합니다.\n";
      break;
  }

  const strongest = Object.keys(args.fiveElements).reduce((a, b) =>
    args.fiveElements[a] >= args.fiveElements[b] ? a : b,
  );

  const traits: Record<string, string> = {
    목: "성장·확장 지향",
    화: "표현·추진 지향",
    토: "안정·중재 지향",
    금: "원칙·결단 지향",
    수: "통찰·유연 지향",
  };

  text += `\n가장 강한 오행은 ${strongest}(${args.fiveElements[strongest]}개)이며, ${traits[strongest]} 성향이 두드러집니다.`;

  if (args.sinsal.gilsin.length) {
    text += `\n길신: ${args.sinsal.gilsin.join(", ")}`;
  }
  if (args.sinsal.hyungsin.length) {
    text += `\n주의 신살: ${args.sinsal.hyungsin.join(", ")}`;
  }

  return text;
}
