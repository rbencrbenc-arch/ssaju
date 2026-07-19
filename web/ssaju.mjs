// src/format.ts
var PILLAR_KEYS = ["hour", "day", "month", "year"];
var PILLAR_KO = { hour: "\uC2DC\uC8FC", day: "\uC77C\uC8FC", month: "\uC6D4\uC8FC", year: "\uC5F0\uC8FC" };
function pad2(n) {
  return String(n).padStart(2, "0");
}
function yinYangSign(v) {
  return v === "\uC591" ? "+" : "-";
}
function compactPillarToken(data, key, part) {
  const p = data.pillarDetails[key];
  if (part === "stem") return `${p.stem}(${p.stemKo})${p.element.stem}${yinYangSign(p.yinYang.stem)}`;
  return `${p.branch}(${p.branchKo})${p.element.branch}${yinYangSign(p.yinYang.branch)}`;
}
function compactHidden(data, key) {
  const h = data.pillarDetails[key].hiddenStems;
  return [h.\uC5EC\uAE30 || "-", h.\uC911\uAE30 || "-", h.\uC815\uAE30 || "-"].join(",");
}
function compactRow(label, values) {
  return `${label} ${values.join(" | ")}`;
}
var BRANCH_REL_KEYS = ["\uBC29\uD569", "\uC0BC\uD569", "\uBC18\uD569", "\uC721\uD569", "\uCDA9", "\uD615", "\uD30C", "\uD574", "\uC6D0\uC9C4", "\uADC0\uBB38"];
var RELATION_PRIORITY_RULES = [
  { key: "\uCDA9", label: "\uC9C0\uC9C0 \uCDA9", weight: 5, note: "\uAE09\uBCC0/\uCDA9\uB3CC \uAC00\uB2A5\uC131" },
  { key: "\uD615", label: "\uC9C0\uC9C0 \uD615", weight: 4.5, note: "\uAE34\uC7A5/\uC18C\uBAA8 \uB204\uC801 \uAC00\uB2A5\uC131" },
  { key: "\uD30C", label: "\uC9C0\uC9C0 \uD30C", weight: 3.5, note: "\uAD00\uACC4 \uADE0\uC5F4/\uACC4\uD68D \uBCC0\uB3D9 \uAC00\uB2A5\uC131" },
  { key: "\uD574", label: "\uC9C0\uC9C0 \uD574", weight: 3, note: "\uC624\uD574/\uC18C\uD1B5 \uBD88\uC77C\uCE58 \uAC00\uB2A5\uC131" },
  { key: "\uC6D0\uC9C4", label: "\uC9C0\uC9C0 \uC6D0\uC9C4", weight: 2.8, note: "\uAC10\uC815\uC801 \uD53C\uB85C \uB204\uC801 \uAC00\uB2A5\uC131" },
  { key: "\uADC0\uBB38", label: "\uC9C0\uC9C0 \uADC0\uBB38", weight: 2.8, note: "\uC2EC\uB9AC\uC801 \uC608\uBBFC/\uB0B4\uC801 \uAC08\uB4F1 \uAC00\uB2A5\uC131" },
  { key: "\uC0BC\uD569", label: "\uC9C0\uC9C0 \uC0BC\uD569", weight: 2.6, note: "\uAE30\uC6B4 \uACB0\uC9D1/\uD655\uC7A5 \uD3EC\uC778\uD2B8" },
  { key: "\uBC29\uD569", label: "\uC9C0\uC9C0 \uBC29\uD569", weight: 2.4, note: "\uBC29\uD5A5\uC131/\uC138\uB825\uD654 \uD3EC\uC778\uD2B8" },
  { key: "\uC721\uD569", label: "\uC9C0\uC9C0 \uC721\uD569", weight: 2.2, note: "\uD611\uB825/\uC644\uCDA9 \uD3EC\uC778\uD2B8" },
  { key: "\uBC18\uD569", label: "\uC9C0\uC9C0 \uBC18\uD569", weight: 1.8, note: "\uC870\uAC74\uBD80 \uD611\uB825 \uD3EC\uC778\uD2B8" }
];
function splitTokens(text) {
  return text.split(",").map((token) => token.trim()).filter(Boolean);
}
function collectRelationText(group) {
  const uniq = /* @__PURE__ */ new Set();
  for (const raw of Object.values(group)) {
    if (!raw) continue;
    for (const token of splitTokens(raw)) {
      uniq.add(token);
    }
  }
  return Array.from(uniq).join(", ");
}
function formatHiddenStemsByPillar(data) {
  return ["hour", "day", "month", "year"].map((k) => [PILLAR_KO[k], data.branchRelations.\uC9C0\uC7A5\uAC04[k]]).filter(([, v]) => Boolean(v)).map(([l, v]) => `${l} ${v}`).join(" / ");
}
function formatBranchRelationSummary(data) {
  const pieces = [];
  for (const key of BRANCH_REL_KEYS) {
    const text = collectRelationText(data.branchRelations[key]);
    if (text) pieces.push(`${key}: ${text}`);
  }
  return pieces.join(" | ");
}
function buildRelationPriorities(data) {
  const items = [];
  const stemChung = data.stemRelations.filter((r) => r.type === "\uCDA9").map((r) => r.desc);
  if (stemChung.length) {
    items.push({
      label: "\uCC9C\uAC04 \uCDA9",
      score: stemChung.length * 4.8,
      note: "\uC758\uC0AC\uACB0\uC815/\uB300\uC778 \uCDA9\uB3CC \uAC00\uB2A5\uC131",
      detail: stemChung.join("; ")
    });
  }
  const stemHap = data.stemRelations.filter((r) => r.type === "\uD569").map((r) => r.desc);
  if (stemHap.length) {
    items.push({
      label: "\uCC9C\uAC04 \uD569",
      score: stemHap.length * 2,
      note: "\uC644\uCDA9/\uD611\uB825 \uAC00\uB2A5\uC131",
      detail: stemHap.join("; ")
    });
  }
  for (const rule of RELATION_PRIORITY_RULES) {
    const text = collectRelationText(data.branchRelations[rule.key]);
    if (!text) continue;
    const count = splitTokens(text).length;
    items.push({
      label: rule.label,
      score: rule.weight * count,
      note: rule.note,
      detail: text
    });
  }
  items.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label, "ko"));
  return items;
}
function buildCautionPoints(data) {
  const out = [];
  const stemChung = data.stemRelations.filter((r) => r.type === "\uCDA9").map((r) => r.desc);
  if (stemChung.length) {
    out.push(`\uCC9C\uAC04 \uCDA9: ${stemChung.join("; ")} -> \uC758\uC0AC\uACB0\uC815\uACFC \uB300\uC778 \uB300\uC751\uC5D0\uC11C \uC815\uBA74\uCDA9\uB3CC\uC744 \uD53C\uD558\uACE0 \uC644\uCDA9 \uC7A5\uCE58\uB97C \uB450\uB294 \uAC83\uC774 \uC88B\uC2B5\uB2C8\uB2E4.`);
  }
  const branchChung = collectRelationText(data.branchRelations.\uCDA9);
  if (branchChung) {
    out.push(`\uC9C0\uC9C0 \uCDA9: ${branchChung} -> \uC77C\uC815 \uAE09\uBCC0, \uC5ED\uD560 \uCDA9\uB3CC, \uAD00\uACC4 \uAE34\uC7A5 \uAD6D\uBA74\uC5D0 \uB300\uBE44\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.`);
  }
  const branchHyung = collectRelationText(data.branchRelations.\uD615);
  if (branchHyung) {
    out.push(`\uC9C0\uC9C0 \uD615: ${branchHyung} -> \uC555\uBC15/\uD53C\uB85C \uB204\uC801 \uAD6C\uAC04\uC774 \uC0DD\uAE30\uAE30 \uC26C\uC6CC \uAC08\uB4F1 \uD655\uB300 \uC804\uC5D0 \uC870\uC815\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.`);
  }
  const branchPa = collectRelationText(data.branchRelations.\uD30C);
  if (branchPa) {
    out.push(`\uC9C0\uC9C0 \uD30C: ${branchPa} -> \uACC4\uD68D\uC758 \uADE0\uC5F4\uC774\uB098 \uAE30\uB300\uCE58 \uCC28\uC774\uB85C \uC778\uD55C \uC774\uD0C8 \uC2E0\uD638\uB97C \uC810\uAC80\uD558\uC138\uC694.`);
  }
  if (!out.length) {
    out.push("\uCDA9/\uD615 \uC911\uC2EC\uC758 \uAC15\uD55C \uCDA9\uB3CC \uC2E0\uD638\uB294 \uC0C1\uB300\uC801\uC73C\uB85C \uC57D\uD569\uB2C8\uB2E4. \uB2E4\uB9CC \uC2DC\uAE30\uC6B4(\uC138\uC6B4/\uC6D4\uC6B4) \uC911\uBCF5 \uC2DC \uC7AC\uC810\uAC80\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.");
  }
  return out;
}
function countElementsByStemBranch(data) {
  const stem = { \uBAA9: 0, \uD654: 0, \uD1A0: 0, \uAE08: 0, \uC218: 0 };
  const branch = { \uBAA9: 0, \uD654: 0, \uD1A0: 0, \uAE08: 0, \uC218: 0 };
  for (const k of PILLAR_KEYS) {
    const p = data.pillarDetails[k];
    if (p.element.stem) stem[p.element.stem]++;
    if (p.element.branch) branch[p.element.branch]++;
  }
  return { stem, branch };
}
function generateMarkdownSummary(data) {
  let md = "";
  const currentYear = data.currentYear;
  const genderText = data.input.gender === "\uB0A8" ? "\uB0A8\uC131" : "\uC5EC\uC131";
  const stemRelationText = data.stemRelations.length ? data.stemRelations.map((r) => r.desc).join("; ") : "\uC5C6\uC74C";
  const hiddenByPillar = formatHiddenStemsByPillar(data);
  const branchRelationText = formatBranchRelationSummary(data);
  const relationPriorities = buildRelationPriorities(data);
  const cautionPoints = buildCautionPoints(data);
  const dayDetail = data.pillarDetails.day;
  md += `## \uAE30\uBCF8 \uC815\uBCF4
`;
  md += `- \uC0DD\uB144\uC6D4\uC77C: ${data.input.year}\uB144 ${data.input.month}\uC6D4 ${data.input.day}\uC77C ${pad2(data.input.hour)}:${pad2(data.input.minute)}
`;
  md += `- \uC131\uBCC4: ${genderText}
`;
  md += `- \uC5ED\uBC95: ${data.input.calendar === "solar" ? "\uC591\uB825" : "\uC74C\uB825"}
`;
  md += `- \uC2DC\uAC04\uB300: ${data.input.timezone}
`;
  md += `- \uC77C\uAC04: ${data.dayStem} (${dayDetail.stemKo}${dayDetail.element.stem}, ${dayDetail.yinYang.stem})

`;
  md += `## \uC0AC\uC8FC 4\uC8FC (${genderText})
`;
  md += `| | \uC2DC\uC8FC | \uC77C\uC8FC | \uC6D4\uC8FC | \uC5F0\uC8FC |
`;
  md += `|:---:|:---:|:---:|:---:|:---:|
`;
  md += `| \uCC9C\uAC04 | ${PILLAR_KEYS.map((k) => `${data.pillarDetails[k].stem}(${data.pillarDetails[k].stemKo})`).join(" | ")} |
`;
  md += `| \uC624\uD589/\uC74C\uC591 | ${PILLAR_KEYS.map((k) => `${data.pillarDetails[k].element.stem}/${data.pillarDetails[k].yinYang.stem}`).join(" | ")} |
`;
  md += `| \uC9C0\uC9C0 | ${PILLAR_KEYS.map((k) => `${data.pillarDetails[k].branch}(${data.pillarDetails[k].branchKo})`).join(" | ")} |
`;
  md += `| \uC624\uD589/\uC74C\uC591 | ${PILLAR_KEYS.map((k) => `${data.pillarDetails[k].element.branch}/${data.pillarDetails[k].yinYang.branch}`).join(" | ")} |

`;
  md += `## \uC9C0\uC7A5\uAC04
`;
  md += `| \uAD6C\uBD84 | ${PILLAR_KEYS.map((k) => `${PILLAR_KO[k]}(${data.pillarDetails[k].branch})`).join(" | ")} |
`;
  md += `|:---:|:---:|:---:|:---:|:---:|
`;
  md += `| \uC5EC\uAE30 | ${PILLAR_KEYS.map((k) => data.pillarDetails[k].hiddenStems.\uC5EC\uAE30 || "-").join(" | ")} |
`;
  md += `| \uC911\uAE30 | ${PILLAR_KEYS.map((k) => data.pillarDetails[k].hiddenStems.\uC911\uAE30 || "-").join(" | ")} |
`;
  md += `| \uC815\uAE30 | ${PILLAR_KEYS.map((k) => data.pillarDetails[k].hiddenStems.\uC815\uAE30 || "-").join(" | ")} |

`;
  const elCounts = countElementsByStemBranch(data);
  md += `## \uC624\uD589 \uBD84\uD3EC
`;
  md += `| \uAD6C\uBD84 | \uBAA9 | \uD654 | \uD1A0 | \uAE08 | \uC218 |
`;
  md += `|:---:|:---:|:---:|:---:|:---:|:---:|
`;
  md += `| \uCC9C\uAC04 | ${elCounts.stem["\uBAA9"]} | ${elCounts.stem["\uD654"]} | ${elCounts.stem["\uD1A0"]} | ${elCounts.stem["\uAE08"]} | ${elCounts.stem["\uC218"]} |
`;
  md += `| \uC9C0\uC9C0 | ${elCounts.branch["\uBAA9"]} | ${elCounts.branch["\uD654"]} | ${elCounts.branch["\uD1A0"]} | ${elCounts.branch["\uAE08"]} | ${elCounts.branch["\uC218"]} |
`;
  md += `| \uD569\uACC4 | ${data.fiveElements["\uBAA9"]} | ${data.fiveElements["\uD654"]} | ${data.fiveElements["\uD1A0"]} | ${data.fiveElements["\uAE08"]} | ${data.fiveElements["\uC218"]} |

`;
  md += `## \uC2ED\uC131 & 12\uC6B4\uC131
`;
  md += `| \uAD6C\uBD84 | \uC2DC\uC8FC | \uC77C\uC8FC | \uC6D4\uC8FC | \uC5F0\uC8FC |
`;
  md += `|:---:|:---:|:---:|:---:|:---:|
`;
  md += `| \uCC9C\uAC04\uC2ED\uC131 | ${data.tenGods.hour.stem} | ${data.tenGods.day.stem} | ${data.tenGods.month.stem} | ${data.tenGods.year.stem} |
`;
  md += `| \uC9C0\uC9C0\uC2ED\uC131 | ${data.tenGods.hour.branch} | ${data.tenGods.day.branch} | ${data.tenGods.month.branch} | ${data.tenGods.year.branch} |
`;
  md += `| \uBD09\uBC9512\uC6B4\uC131 | ${data.stages12.bong.hour} | ${data.stages12.bong.day} | ${data.stages12.bong.month} | ${data.stages12.bong.year} |
`;
  md += `| \uAC70\uBC9512\uC6B4\uC131 | ${data.stages12.geo.hour} | ${data.stages12.geo.day} | ${data.stages12.geo.month} | ${data.stages12.geo.year} |

`;
  md += `## \uAD00\uACC4 \uD574\uC11D \uADFC\uAC70
`;
  md += `- \uCC9C\uAC04 \uAD00\uACC4: ${stemRelationText}
`;
  md += `- \uC9C0\uC7A5\uAC04: ${hiddenByPillar || "\uC5C6\uC74C"}
`;
  md += `- \uC9C0\uC9C0 \uAD00\uACC4: ${branchRelationText || "\uC5C6\uC74C"}

`;
  md += `## \uAD00\uACC4 \uAC15\uB3C4 (\uC6B0\uC120\uC21C\uC704)
`;
  if (relationPriorities.length) {
    for (let i = 0; i < relationPriorities.length; i++) {
      const item = relationPriorities[i];
      md += `- ${i + 1}\uC21C\uC704 ${item.label} (\uC810\uC218 ${item.score.toFixed(1)}): ${item.note} | ${item.detail}
`;
    }
  } else {
    md += `- \uD2B9\uC774 \uAD00\uACC4 \uC2E0\uD638 \uC5C6\uC74C
`;
  }
  md += "\n";
  md += `## \uD574\uC11D \uC2DC \uC8FC\uC758 \uD3EC\uC778\uD2B8 (\uCDA9/\uD615 \uC911\uC2EC)
`;
  for (const point of cautionPoints) {
    md += `- ${point}
`;
  }
  md += "\n";
  md += `## \uC0AC\uC8FC\uBCC4 \uC2E0\uC0B4
`;
  md += `| \uAD6C\uBD84 | \uC2DC\uC8FC | \uC77C\uC8FC | \uC6D4\uC8FC | \uC5F0\uC8FC |
`;
  md += `|:---:|:---:|:---:|:---:|:---:|
`;
  md += `| 12\uC2E0\uC0B4 | ${data.sals.hour.twelveSal} | ${data.sals.day.twelveSal} | ${data.sals.month.twelveSal} | ${data.sals.year.twelveSal} |
`;
  md += `| \uD2B9\uC218\uC2E0\uC0B4 | ${data.sals.hour.specialSals.join(", ") || "-"} | ${data.sals.day.specialSals.join(", ") || "-"} | ${data.sals.month.specialSals.join(", ") || "-"} | ${data.sals.year.specialSals.join(", ") || "-"} |

`;
  md += `## \uACF5\uB9DD (\u7A7A\u4EA1)
`;
  md += `- \uACF5\uB9DD: ${data.gongmang.branches[0]}(${data.gongmang.branchesKo[0]}), ${data.gongmang.branches[1]}(${data.gongmang.branchesKo[1]})

`;
  md += `## \uACE0\uAE09 \uBD84\uC11D
`;
  const strengthLabel = data.advanced.dayStrength.strength === "strong" ? "\uAC15\uD568" : data.advanced.dayStrength.strength === "weak" ? "\uC57D\uD568" : "\uC911\uD654";
  md += `- \uC77C\uAC04 \uAC15\uC57D: ${strengthLabel} (${data.advanced.dayStrength.score})
`;
  md += `- \uACA9\uAD6D: ${data.advanced.geukguk}
`;
  md += `- \uC6A9\uC2E0: ${data.advanced.yongsin.join(", ") || "-"}
`;
  md += `- \uAE38\uC2E0: ${data.advanced.sinsal.gilsin.join(", ") || "-"}
`;
  md += `- \uD749\uC2E0: ${data.advanced.sinsal.hyungsin.join(", ") || "-"}

`;
  md += `## \uB300\uC6B4
`;
  md += `- \uC2DC\uC791\uB098\uC774: ${data.daeun.startAge}\uC138 (\uC815\uBC00 ${data.daeun.startAgePrecise.toFixed(2)}\uC138)
`;
  if (data.daeun.current) {
    const remaining = data.daeun.current.endAge - data.currentAge;
    md += `- \uD604\uC7AC \uB300\uC6B4: ${data.daeun.current.ganzhi} (${data.daeun.current.startAge}\uC138~${data.daeun.current.endAge}\uC138, \uC794\uC5EC ${remaining}\uB144)
`;
  }
  md += `| \uB300\uC6B4\uB098\uC774 | \uAC04\uC9C0 | \uCC9C\uAC04\uC2ED\uC131 | \uC9C0\uC9C0\uC2ED\uC131 | 12\uC6B4\uC131 | \uC2E0\uC0B4 |
`;
  md += `|:---:|:---:|:---:|:---:|:---:|:---:|
`;
  for (const d of data.daeun.list) {
    const marker = data.daeun.current && d.age_range === data.daeun.current.age_range ? " \u2605" : "";
    const salText = d.sal.length ? d.sal.join(", ") : "-";
    md += `| ${d.age_range}\uC138${marker} | ${d.ganzhi} | ${d.stemTenGod} | ${d.branchTenGod} | ${d.stage12} | ${salText} |
`;
  }
  md += "\n";
  md += `## \uC138\uC6B4 (${currentYear}\uB144 \uAE30\uC900)
`;
  md += `| \uC5F0\uB3C4 | \uAC04\uC9C0 | \uCC9C\uAC04\uC2ED\uC131 | \uC9C0\uC9C0\uC2ED\uC131 | 12\uC6B4\uC131 |
`;
  md += `|:---:|:---:|:---:|:---:|:---:|
`;
  for (const s of data.seyun) {
    const marker = s.year === currentYear ? " \u2605" : "";
    md += `| ${s.year}${marker} | ${s.ganzhi} | ${s.tenGodStem} | ${s.tenGodBranch} | ${s.stage12} |
`;
  }
  md += "\n";
  md += `## \uC6D4\uC6B4 (${currentYear}\uB144)
`;
  md += `| \uC6D4 | \uAC04\uC9C0 | \uCC9C\uAC04\uC2ED\uC131 | \uC9C0\uC9C0\uC2ED\uC131 | 12\uC6B4\uC131 |
`;
  md += `|:---:|:---:|:---:|:---:|:---:|
`;
  for (const w of data.wolun) {
    md += `| ${w.monthName} | ${w.ganzhi} | ${w.stemTenGod} | ${w.branchTenGod} | ${w.stage12} |
`;
  }
  md += "\n";
  md += `## \uACC4\uC0B0 \uAE30\uC900
`;
  if (data.normalized.localMeanTime) {
    const lmt = data.normalized.localMeanTime;
    md += `- \uC9C0\uC5ED\uC2DC \uBCF4\uC815: ${lmt.year}-${pad2(lmt.month)}-${pad2(lmt.day)} ${pad2(lmt.hour)}:${pad2(lmt.minute)} (\uACBD\uB3C4 ${lmt.longitude.toFixed(4)}\xB0, ${lmt.offsetMinutes.toFixed(1)}\uBD84)
`;
  }
  const directionKo = data.daeun.basis.direction === "forward" ? "\uC21C\uD589" : "\uC5ED\uD589";
  md += `- \uB300\uC6B4 \uAE30\uC900: ${directionKo}, \uC808\uC785 ${data.daeun.basis.targetTermUtc.slice(0, 16).replace("T", " ")} UTC

`;
  md += `## \uB9CC\uC138\uB825
`;
  md += `- \uC62C\uD574: ${data.reference.codes.thisYear}
`;
  md += `- \uB0B4\uB144: ${data.reference.codes.nextYear}
`;
  md += `- \uC774\uBC88\uB2EC: ${data.reference.codes.thisMonth}
`;
  md += `- \uB2E4\uC74C\uB2EC: ${data.reference.codes.nextMonth}
`;
  md += `- \uC624\uB298: ${data.reference.codes.today}
`;
  md += `- \uB0B4\uC77C: ${data.reference.codes.tomorrow}
`;
  md += `- \uC624\uB298\uB0A0\uC9DC: ${data.reference.now.split(" ")[0]}

`;
  const p = data.advanced.personality;
  md += `## \uC131\uACA9
`;
  md += `- \uC77C\uAC04(\uBCF8\uC9C8): ${p.dayMaster.stem}(${p.dayMaster.stemKo}${p.dayMaster.element}, ${p.dayMaster.yinYang}) \u2014 ${p.dayMaster.archetype} / ${p.dayMaster.keywords.join(", ")}
`;
  md += `- ${p.dayMaster.description}
`;
  md += `- \uB300\uD45C \uAE30\uC6B4: ${p.tenGodProfile.dominant} (\uBE44\uAC81 ${p.tenGodProfile.distribution.\uBE44\uAC81} \xB7 \uC2DD\uC0C1 ${p.tenGodProfile.distribution.\uC2DD\uC0C1} \xB7 \uC7AC\uC131 ${p.tenGodProfile.distribution.\uC7AC\uC131} \xB7 \uAD00\uC131 ${p.tenGodProfile.distribution.\uAD00\uC131} \xB7 \uC778\uC131 ${p.tenGodProfile.distribution.\uC778\uC131})
`;
  md += `- ${p.tenGodProfile.description}
`;
  md += `- \uAE30\uC9C8: ${p.temperament.description}
`;
  md += `- \uAC15\uC810: ${p.strengths.join(" / ")}
`;
  md += `- \uC8FC\uC758: ${p.cautions.join(" / ")}

`;
  md += `## \uD574\uC11D
`;
  md += `${data.advanced.interpretation}
`;
  return md;
}
function generateCompactText(data) {
  const lines = [];
  const currentYear = data.currentYear;
  const dayDetail = data.pillarDetails.day;
  const pillarKeys = PILLAR_KEYS;
  const strengthChar = data.advanced.dayStrength.strength === "strong" ? "\uAC15" : data.advanced.dayStrength.strength === "weak" ? "\uC57D" : "\uC911";
  const calendarKo = data.input.calendar === "solar" ? "\uC591\uB825" : "\uC74C\uB825";
  lines.push(`## \uAE30\uBCF8`);
  lines.push(`${data.input.year}.${pad2(data.input.month)}.${pad2(data.input.day)} ${pad2(data.input.hour)}:${pad2(data.input.minute)} ${data.input.gender} ${calendarKo} ${data.input.timezone} \uB9CC ${data.currentAge}\uC138`);
  lines.push(`\uC77C\uAC04 ${data.dayStem}(${dayDetail.stemKo})${dayDetail.element.stem}${yinYangSign(dayDetail.yinYang.stem)} \uAC15\uC57D: ${strengthChar}(${data.advanced.dayStrength.score}) \uACA9: ${data.advanced.geukguk} \uC6A9\uC2E0: ${data.advanced.yongsin.join(", ") || "-"}`);
  lines.push("");
  lines.push("## \uC6D0\uAD6D");
  lines.push(compactRow("", ["\uC2DC", "\uC77C", "\uC6D4", "\uC5F0"]));
  lines.push(compactRow("\u5E72", pillarKeys.map((k) => compactPillarToken(data, k, "stem"))));
  lines.push(compactRow("\u652F", pillarKeys.map((k) => compactPillarToken(data, k, "branch"))));
  lines.push(compactRow("\uC7A5\uAC04", pillarKeys.map((k) => compactHidden(data, k))));
  lines.push(compactRow("\u5E72\uC131", pillarKeys.map((k) => data.tenGods[k].stem)));
  lines.push(compactRow("\u652F\uC131", pillarKeys.map((k) => data.tenGods[k].branch)));
  lines.push(compactRow("\uBD0912", pillarKeys.map((k) => data.stages12.bong[k])));
  lines.push(compactRow("\uAC7012", pillarKeys.map((k) => data.stages12.geo[k])));
  lines.push(compactRow("12\uC0B4", pillarKeys.map((k) => data.sals[k].twelveSal)));
  lines.push(compactRow("\uD2B9\uC0B4", pillarKeys.map((k) => data.sals[k].specialSals.join(",") || "-")));
  const el = countElementsByStemBranch(data);
  const fmtEl = (r) => `\uBAA9${r["\uBAA9"]} \uD654${r["\uD654"]} \uD1A0${r["\uD1A0"]} \uAE08${r["\uAE08"]} \uC218${r["\uC218"]}`;
  lines.push("");
  lines.push("## \uC624\uD589");
  lines.push(`\u5E72: ${fmtEl(el.stem)} | \u652F: ${fmtEl(el.branch)} | \uACC4: ${fmtEl(data.fiveElements)}`);
  lines.push(`\uACF5\uB9DD ${data.gongmang.branches[0]}(${data.gongmang.branchesKo[0]}) ${data.gongmang.branches[1]}(${data.gongmang.branchesKo[1]})`);
  lines.push(`\uAE38\uC2E0: ${data.advanced.sinsal.gilsin.join(", ") || "-"} / \uD749\uC2E0: ${data.advanced.sinsal.hyungsin.join(", ") || "-"}`);
  const relParts = [];
  const stemHap = data.stemRelations.filter((r) => r.type === "\uD569");
  const stemChung = data.stemRelations.filter((r) => r.type === "\uCDA9");
  if (stemHap.length) relParts.push(`\u5E72\uD569: ${stemHap.map((r) => r.desc.replace(/ 합/, "")).join("; ")}`);
  if (stemChung.length) relParts.push(`\u5E72\uCDA9: ${stemChung.map((r) => r.desc.replace(/ 충/, "")).join("; ")}`);
  for (const key of BRANCH_REL_KEYS) {
    const text = collectRelationText(data.branchRelations[key]);
    if (text) relParts.push(`${key}: ${text.replaceAll(` ${key}`, "")}`);
  }
  lines.push("");
  lines.push("## \uAD00\uACC4");
  lines.push(relParts.join(" | ") || "\uC5C6\uC74C");
  lines.push("");
  const dirKo = data.daeun.basis.direction === "forward" ? "\uC21C\uD589" : "\uC5ED\uD589";
  let daeunHead = `## \uB300\uC6B4 ${dirKo} \uC2DC\uC791 ${data.daeun.startAge}\uC138`;
  if (data.daeun.current) {
    const rem = data.daeun.current.endAge - data.currentAge;
    daeunHead += ` \uD604\uC7AC \u2605${data.daeun.current.ganzhi}(${data.daeun.current.startAge}~${data.daeun.current.endAge} \uC794\uC5EC ${rem}\uB144)`;
  }
  lines.push(daeunHead);
  for (const item of data.daeun.list) {
    const mark = data.daeun.current && item.age_range === data.daeun.current.age_range ? "\u2605" : " ";
    const sal = item.sal.length ? item.sal.join(",") : "-";
    lines.push(`${mark}${item.startAge}(${item.startYear}) ${item.ganzhi} ${item.stemTenGod}/${item.branchTenGod} ${item.stage12} ${sal}`);
  }
  lines.push("");
  lines.push(`## \uC138\uC6B4 ${currentYear} \uAE30\uC900`);
  for (const s of data.seyun) {
    const mark = s.year === currentYear ? "\u2605" : " ";
    lines.push(`${mark}${s.year} ${s.ganzhi} ${s.tenGodStem}/${s.tenGodBranch} ${s.stage12}`);
  }
  lines.push("");
  lines.push(`## \uC6D4\uC6B4 ${currentYear}`);
  for (const w of data.wolun) {
    lines.push(`${w.month}\uC6D4 ${w.ganzhi} ${w.stemTenGod}/${w.branchTenGod} ${w.stage12}`);
  }
  const p = data.advanced.personality;
  lines.push("");
  lines.push("## \uC131\uACA9");
  lines.push(`\uC77C\uAC04 ${p.dayMaster.stem}(${p.dayMaster.stemKo}${p.dayMaster.element}${p.dayMaster.yinYang === "\uC591" ? "+" : "-"}) ${p.dayMaster.archetype} ${p.dayMaster.keywords.join("\xB7")}`);
  lines.push(`\uB300\uD45C\uAE30\uC6B4 ${p.tenGodProfile.dominant} [\uBE44\uAC81${p.tenGodProfile.distribution.\uBE44\uAC81} \uC2DD\uC0C1${p.tenGodProfile.distribution.\uC2DD\uC0C1} \uC7AC\uC131${p.tenGodProfile.distribution.\uC7AC\uC131} \uAD00\uC131${p.tenGodProfile.distribution.\uAD00\uC131} \uC778\uC131${p.tenGodProfile.distribution.\uC778\uC131}]`);
  lines.push(`\uAC15\uC810 ${p.strengths.join(", ")}`);
  lines.push(`\uC8FC\uC758 ${p.cautions.join(", ")}`);
  const c = data.reference.codes;
  lines.push("");
  lines.push("## \uB9CC\uC138\uB825");
  lines.push(`\uC774\uB2EC ${c.thisMonth} \uB2E4\uC74C ${c.nextMonth} \uC624\uB298 ${c.today} \uB0B4\uC77C ${c.tomorrow} (${data.reference.now.split(" ")[0]})`);
  return lines.join("\n");
}

// src/constants.ts
var KOREA_TIMEZONE = "Asia/Seoul";
var STANDARD_LONGITUDE = 135;
var SEOUL_LONGITUDE = 126.9784;
var DAY_IN_MS = 24 * 60 * 60 * 1e3;
var MIN_SUPPORTED_YEAR = 1900;
var MAX_SUPPORTED_YEAR = 2099;
var BASE_KST_OFFSET_MINUTES = 9 * 60;
var KOREA_DST_PERIODS = [
  {
    start: { year: 1960, month: 5, day: 1, hour: 0, minute: 0 },
    end: { year: 1960, month: 9, day: 13, hour: 0, minute: 0 }
  },
  {
    start: { year: 1987, month: 5, day: 10, hour: 2, minute: 0 },
    end: { year: 1987, month: 10, day: 11, hour: 3, minute: 0 }
  },
  {
    start: { year: 1988, month: 5, day: 8, hour: 2, minute: 0 },
    end: { year: 1988, month: 10, day: 9, hour: 3, minute: 0 }
  }
];
var HEAVENLY_STEMS_KO = ["\uAC11", "\uC744", "\uBCD1", "\uC815", "\uBB34", "\uAE30", "\uACBD", "\uC2E0", "\uC784", "\uACC4"];
var HEAVENLY_STEMS = ["\u7532", "\u4E59", "\u4E19", "\u4E01", "\u620A", "\u5DF1", "\u5E9A", "\u8F9B", "\u58EC", "\u7678"];
var EARTHLY_BRANCHES_KO = [
  "\uC790",
  "\uCD95",
  "\uC778",
  "\uBB18",
  "\uC9C4",
  "\uC0AC",
  "\uC624",
  "\uBBF8",
  "\uC2E0",
  "\uC720",
  "\uC220",
  "\uD574"
];
var EARTHLY_BRANCHES = ["\u5B50", "\u4E11", "\u5BC5", "\u536F", "\u8FB0", "\u5DF3", "\u5348", "\u672A", "\u7533", "\u9149", "\u620C", "\u4EA5"];
var KO_TO_HANJA_STEM = Object.fromEntries(
  HEAVENLY_STEMS_KO.map((ko, i) => [ko, HEAVENLY_STEMS[i]])
);
var KO_TO_HANJA_BRANCH = Object.fromEntries(
  EARTHLY_BRANCHES_KO.map((ko, i) => [ko, EARTHLY_BRANCHES[i]])
);
var HANJA_TO_KO_BRANCH = Object.fromEntries(
  EARTHLY_BRANCHES.map((hz, i) => [hz, EARTHLY_BRANCHES_KO[i]])
);
var STEM_ELEMENT = {
  \u7532: "\uBAA9",
  \u4E59: "\uBAA9",
  \u4E19: "\uD654",
  \u4E01: "\uD654",
  \u620A: "\uD1A0",
  \u5DF1: "\uD1A0",
  \u5E9A: "\uAE08",
  \u8F9B: "\uAE08",
  \u58EC: "\uC218",
  \u7678: "\uC218"
};
var BRANCH_ELEMENT = {
  \u5B50: "\uC218",
  \u4E11: "\uD1A0",
  \u5BC5: "\uBAA9",
  \u536F: "\uBAA9",
  \u8FB0: "\uD1A0",
  \u5DF3: "\uD654",
  \u5348: "\uD654",
  \u672A: "\uD1A0",
  \u7533: "\uAE08",
  \u9149: "\uAE08",
  \u620C: "\uD1A0",
  \u4EA5: "\uC218"
};
var STEM_YINYANG = {
  \u7532: "\uC591",
  \u4E59: "\uC74C",
  \u4E19: "\uC591",
  \u4E01: "\uC74C",
  \u620A: "\uC591",
  \u5DF1: "\uC74C",
  \u5E9A: "\uC591",
  \u8F9B: "\uC74C",
  \u58EC: "\uC591",
  \u7678: "\uC74C"
};
var BRANCH_YINYANG = {
  \u5B50: "\uC591",
  \u4E11: "\uC74C",
  \u5BC5: "\uC591",
  \u536F: "\uC74C",
  \u8FB0: "\uC591",
  \u5DF3: "\uC74C",
  \u5348: "\uC591",
  \u672A: "\uC74C",
  \u7533: "\uC591",
  \u9149: "\uC74C",
  \u620C: "\uC591",
  \u4EA5: "\uC74C"
};
var TEN_GODS = {
  \u7532: {
    \u7532: "\uBE44\uACAC",
    \u4E59: "\uAC81\uC7AC",
    \u4E19: "\uC2DD\uC2E0",
    \u4E01: "\uC0C1\uAD00",
    \u620A: "\uD3B8\uC7AC",
    \u5DF1: "\uC815\uC7AC",
    \u5E9A: "\uD3B8\uAD00",
    \u8F9B: "\uC815\uAD00",
    \u58EC: "\uD3B8\uC778",
    \u7678: "\uC815\uC778"
  },
  \u4E59: {
    \u7532: "\uAC81\uC7AC",
    \u4E59: "\uBE44\uACAC",
    \u4E19: "\uC0C1\uAD00",
    \u4E01: "\uC2DD\uC2E0",
    \u620A: "\uC815\uC7AC",
    \u5DF1: "\uD3B8\uC7AC",
    \u5E9A: "\uC815\uAD00",
    \u8F9B: "\uD3B8\uAD00",
    \u58EC: "\uC815\uC778",
    \u7678: "\uD3B8\uC778"
  },
  \u4E19: {
    \u7532: "\uD3B8\uC778",
    \u4E59: "\uC815\uC778",
    \u4E19: "\uBE44\uACAC",
    \u4E01: "\uAC81\uC7AC",
    \u620A: "\uC2DD\uC2E0",
    \u5DF1: "\uC0C1\uAD00",
    \u5E9A: "\uD3B8\uC7AC",
    \u8F9B: "\uC815\uC7AC",
    \u58EC: "\uD3B8\uAD00",
    \u7678: "\uC815\uAD00"
  },
  \u4E01: {
    \u7532: "\uC815\uC778",
    \u4E59: "\uD3B8\uC778",
    \u4E19: "\uAC81\uC7AC",
    \u4E01: "\uBE44\uACAC",
    \u620A: "\uC0C1\uAD00",
    \u5DF1: "\uC2DD\uC2E0",
    \u5E9A: "\uC815\uC7AC",
    \u8F9B: "\uD3B8\uC7AC",
    \u58EC: "\uC815\uAD00",
    \u7678: "\uD3B8\uAD00"
  },
  \u620A: {
    \u7532: "\uD3B8\uAD00",
    \u4E59: "\uC815\uAD00",
    \u4E19: "\uD3B8\uC778",
    \u4E01: "\uC815\uC778",
    \u620A: "\uBE44\uACAC",
    \u5DF1: "\uAC81\uC7AC",
    \u5E9A: "\uC2DD\uC2E0",
    \u8F9B: "\uC0C1\uAD00",
    \u58EC: "\uD3B8\uC7AC",
    \u7678: "\uC815\uC7AC"
  },
  \u5DF1: {
    \u7532: "\uC815\uAD00",
    \u4E59: "\uD3B8\uAD00",
    \u4E19: "\uC815\uC778",
    \u4E01: "\uD3B8\uC778",
    \u620A: "\uAC81\uC7AC",
    \u5DF1: "\uBE44\uACAC",
    \u5E9A: "\uC0C1\uAD00",
    \u8F9B: "\uC2DD\uC2E0",
    \u58EC: "\uC815\uC7AC",
    \u7678: "\uD3B8\uC7AC"
  },
  \u5E9A: {
    \u7532: "\uD3B8\uC7AC",
    \u4E59: "\uC815\uC7AC",
    \u4E19: "\uD3B8\uAD00",
    \u4E01: "\uC815\uAD00",
    \u620A: "\uD3B8\uC778",
    \u5DF1: "\uC815\uC778",
    \u5E9A: "\uBE44\uACAC",
    \u8F9B: "\uAC81\uC7AC",
    \u58EC: "\uC2DD\uC2E0",
    \u7678: "\uC0C1\uAD00"
  },
  \u8F9B: {
    \u7532: "\uC815\uC7AC",
    \u4E59: "\uD3B8\uC7AC",
    \u4E19: "\uC815\uAD00",
    \u4E01: "\uD3B8\uAD00",
    \u620A: "\uC815\uC778",
    \u5DF1: "\uD3B8\uC778",
    \u5E9A: "\uAC81\uC7AC",
    \u8F9B: "\uBE44\uACAC",
    \u58EC: "\uC0C1\uAD00",
    \u7678: "\uC2DD\uC2E0"
  },
  \u58EC: {
    \u7532: "\uC2DD\uC2E0",
    \u4E59: "\uC0C1\uAD00",
    \u4E19: "\uD3B8\uC7AC",
    \u4E01: "\uC815\uC7AC",
    \u620A: "\uD3B8\uAD00",
    \u5DF1: "\uC815\uAD00",
    \u5E9A: "\uD3B8\uC778",
    \u8F9B: "\uC815\uC778",
    \u58EC: "\uBE44\uACAC",
    \u7678: "\uAC81\uC7AC"
  },
  \u7678: {
    \u7532: "\uC0C1\uAD00",
    \u4E59: "\uC2DD\uC2E0",
    \u4E19: "\uC815\uC7AC",
    \u4E01: "\uD3B8\uC7AC",
    \u620A: "\uC815\uAD00",
    \u5DF1: "\uD3B8\uAD00",
    \u5E9A: "\uC815\uC778",
    \u8F9B: "\uD3B8\uC778",
    \u58EC: "\uAC81\uC7AC",
    \u7678: "\uBE44\uACAC"
  }
};
var BRANCH_HIDDEN_STEMS = {
  \u5B50: { \uC5EC\uAE30: null, \uC911\uAE30: null, \uC815\uAE30: "\u7678" },
  \u4E11: { \uC5EC\uAE30: "\u7678", \uC911\uAE30: "\u8F9B", \uC815\uAE30: "\u5DF1" },
  \u5BC5: { \uC5EC\uAE30: "\u620A", \uC911\uAE30: "\u4E19", \uC815\uAE30: "\u7532" },
  \u536F: { \uC5EC\uAE30: null, \uC911\uAE30: null, \uC815\uAE30: "\u4E59" },
  \u8FB0: { \uC5EC\uAE30: "\u4E59", \uC911\uAE30: "\u7678", \uC815\uAE30: "\u620A" },
  \u5DF3: { \uC5EC\uAE30: "\u620A", \uC911\uAE30: "\u5E9A", \uC815\uAE30: "\u4E19" },
  \u5348: { \uC5EC\uAE30: null, \uC911\uAE30: "\u5DF1", \uC815\uAE30: "\u4E01" },
  \u672A: { \uC5EC\uAE30: "\u4E01", \uC911\uAE30: "\u4E59", \uC815\uAE30: "\u5DF1" },
  \u7533: { \uC5EC\uAE30: "\u620A", \uC911\uAE30: "\u58EC", \uC815\uAE30: "\u5E9A" },
  \u9149: { \uC5EC\uAE30: null, \uC911\uAE30: null, \uC815\uAE30: "\u8F9B" },
  \u620C: { \uC5EC\uAE30: "\u8F9B", \uC911\uAE30: "\u4E01", \uC815\uAE30: "\u620A" },
  \u4EA5: { \uC5EC\uAE30: null, \uC911\uAE30: "\u7532", \uC815\uAE30: "\u58EC" }
};
var TWELVE_STAGES_GEO = {
  \u7532: ["\uC7A5\uC0DD", "\uBAA9\uC695", "\uAD00\uB300", "\uAC74\uB85D", "\uC81C\uC655", "\uC1E0", "\uBCD1", "\uC0AC", "\uBB18", "\uC808", "\uD0DC", "\uC591"],
  \u4E59: ["\uC591", "\uD0DC", "\uC808", "\uBB18", "\uC0AC", "\uBCD1", "\uC1E0", "\uC81C\uC655", "\uAC74\uB85D", "\uAD00\uB300", "\uBAA9\uC695", "\uC7A5\uC0DD"],
  \u4E19: ["\uD0DC", "\uC591", "\uC7A5\uC0DD", "\uBAA9\uC695", "\uAD00\uB300", "\uAC74\uB85D", "\uC81C\uC655", "\uC1E0", "\uBCD1", "\uC0AC", "\uBB18", "\uC808"],
  \u4E01: ["\uC808", "\uBB18", "\uC0AC", "\uBCD1", "\uC1E0", "\uC81C\uC655", "\uAC74\uB85D", "\uAD00\uB300", "\uBAA9\uC695", "\uC7A5\uC0DD", "\uC591", "\uD0DC"],
  \u620A: ["\uD0DC", "\uC591", "\uC7A5\uC0DD", "\uBAA9\uC695", "\uAD00\uB300", "\uAC74\uB85D", "\uC81C\uC655", "\uC1E0", "\uBCD1", "\uC0AC", "\uBB18", "\uC808"],
  \u5DF1: ["\uC808", "\uBB18", "\uC0AC", "\uBCD1", "\uC1E0", "\uC81C\uC655", "\uAC74\uB85D", "\uAD00\uB300", "\uBAA9\uC695", "\uC7A5\uC0DD", "\uC591", "\uD0DC"],
  \u5E9A: ["\uC0AC", "\uBCD1", "\uC1E0", "\uC81C\uC655", "\uAC74\uB85D", "\uAD00\uB300", "\uBAA9\uC695", "\uC7A5\uC0DD", "\uC591", "\uD0DC", "\uC808", "\uBB18"],
  \u8F9B: ["\uC7A5\uC0DD", "\uBAA9\uC695", "\uAD00\uB300", "\uAC74\uB85D", "\uC81C\uC655", "\uC1E0", "\uBCD1", "\uC0AC", "\uBB18", "\uC808", "\uD0DC", "\uC591"],
  \u58EC: ["\uAC74\uB85D", "\uAD00\uB300", "\uBAA9\uC695", "\uC7A5\uC0DD", "\uC591", "\uD0DC", "\uC808", "\uBB18", "\uC0AC", "\uBCD1", "\uC1E0", "\uC81C\uC655"],
  \u7678: ["\uAD00\uB300", "\uBAA9\uC695", "\uC7A5\uC0DD", "\uC591", "\uD0DC", "\uC808", "\uBB18", "\uC0AC", "\uBCD1", "\uC1E0", "\uC81C\uC655", "\uAC74\uB85D"]
};
var YONGSIN_RULES = {
  \u7532: { strong: ["\u5E9A", "\u4E01", "\u7678"], weak: ["\u7678", "\u4E19", "\u5DF1"] },
  \u4E59: { strong: ["\u8F9B", "\u4E19", "\u620A"], weak: ["\u7678", "\u4E19", "\u5DF1"] },
  \u4E19: { strong: ["\u58EC", "\u5DF1", "\u5E9A"], weak: ["\u7532", "\u5E9A", "\u58EC"] },
  \u4E01: { strong: ["\u7678", "\u5E9A", "\u7532"], weak: ["\u7532", "\u5E9A", "\u58EC"] },
  \u620A: { strong: ["\u7532", "\u7678", "\u4E19"], weak: ["\u4E19", "\u7678", "\u7532"] },
  \u5DF1: { strong: ["\u7532", "\u7678", "\u4E19"], weak: ["\u4E19", "\u7678", "\u7532"] },
  \u5E9A: { strong: ["\u4E01", "\u7532", "\u58EC"], weak: ["\u5DF1", "\u4E19", "\u7678"] },
  \u8F9B: { strong: ["\u58EC", "\u7532", "\u5DF1"], weak: ["\u620A", "\u58EC", "\u4E19"] },
  \u58EC: { strong: ["\u620A", "\u4E19", "\u7532"], weak: ["\u5E9A", "\u4E59", "\u4E01"] },
  \u7678: { strong: ["\u620A", "\u4E19", "\u8F9B"], weak: ["\u5E9A", "\u7532", "\u4E01"] }
};
var ADVANCED_SINSAL = {
  \uCC9C\uC744\uADC0\uC778: {
    \u7532\u620A\u5E9A: ["\u4E11", "\u672A"],
    \u4E59\u5DF1: ["\u5B50", "\u7533"],
    \u4E19\u4E01: ["\u4EA5", "\u9149"],
    \u58EC\u7678: ["\u536F", "\u5DF3"],
    \u8F9B: ["\u5BC5", "\u5348"]
  },
  \uC6D4\uB355\uADC0\uC778: {
    \u5BC5\u5348\u620C: "\u4E19",
    \u7533\u5B50\u8FB0: "\u58EC",
    \u5DF3\u9149\u4E11: "\u5E9A",
    \u4EA5\u536F\u672A: "\u7532"
  },
  \uCC9C\uB355\uADC0\uC778: {
    \u6B63\u6708: "\u4E01",
    \u4E8C\u6708: "\u7533",
    \u4E09\u6708: "\u58EC",
    \u56DB\u6708: "\u8F9B",
    \u4E94\u6708: "\u4EA5",
    \u516D\u6708: "\u7532",
    \u4E03\u6708: "\u7678",
    \u516B\u6708: "\u5BC5",
    \u4E5D\u6708: "\u4E19",
    \u5341\u6708: "\u4E59",
    \u5341\u4E00\u6708: "\u5DF3",
    \u5341\u4E8C\u6708: "\u5E9A"
  },
  \uC591\uC778: {
    \u7532: "\u536F",
    \u4E59: "\u5BC5",
    \u4E19: "\u5348",
    \u4E01: "\u5DF3",
    \u620A: "\u5348",
    \u5DF1: "\u5DF3",
    \u5E9A: "\u9149",
    \u8F9B: "\u7533",
    \u58EC: "\u5B50",
    \u7678: "\u4EA5"
  },
  \uAC81\uC0B4: {
    \u7533\u5B50\u8FB0: "\u5DF3",
    \u5BC5\u5348\u620C: "\u4EA5",
    \u5DF3\u9149\u4E11: "\u5BC5",
    \u4EA5\u536F\u672A: "\u7533"
  },
  \uD654\uAC1C: {
    \u7533\u5B50\u8FB0: "\u8FB0",
    \u5BC5\u5348\u620C: "\u620C",
    \u5DF3\u9149\u4E11: "\u4E11",
    \u4EA5\u536F\u672A: "\u672A"
  }
};
var MONTH_BRANCHES = {
  1: "\u5BC5",
  2: "\u536F",
  3: "\u8FB0",
  4: "\u5DF3",
  5: "\u5348",
  6: "\u672A",
  7: "\u7533",
  8: "\u9149",
  9: "\u620C",
  10: "\u4EA5",
  11: "\u5B50",
  12: "\u4E11"
};
var YEAR_STEM_TO_MONTH_START_STEM_INDEX = {
  0: 2,
  1: 4,
  2: 6,
  3: 8,
  4: 0,
  5: 2,
  6: 4,
  7: 6,
  8: 8,
  9: 0
};
var WOLUN_MONTH_NAMES = [
  "\uC778\uC6D4(1\uC6D4)",
  "\uBB18\uC6D4(2\uC6D4)",
  "\uC9C4\uC6D4(3\uC6D4)",
  "\uC0AC\uC6D4(4\uC6D4)",
  "\uC624\uC6D4(5\uC6D4)",
  "\uBBF8\uC6D4(6\uC6D4)",
  "\uC2E0\uC6D4(7\uC6D4)",
  "\uC720\uC6D4(8\uC6D4)",
  "\uC220\uC6D4(9\uC6D4)",
  "\uD574\uC6D4(10\uC6D4)",
  "\uC790\uC6D4(11\uC6D4)",
  "\uCD95\uC6D4(12\uC6D4)"
];
var MONTH_LABELS = [
  "\u6B63\u6708",
  "\u4E8C\u6708",
  "\u4E09\u6708",
  "\u56DB\u6708",
  "\u4E94\u6708",
  "\u516D\u6708",
  "\u4E03\u6708",
  "\u516B\u6708",
  "\u4E5D\u6708",
  "\u5341\u6708",
  "\u5341\u4E00\u6708",
  "\u5341\u4E8C\u6708"
];
var BRANCH_TO_MONTH_INDEX = {
  \u5BC5: 1,
  \u536F: 2,
  \u8FB0: 3,
  \u5DF3: 4,
  \u5348: 5,
  \u672A: 6,
  \u7533: 7,
  \u9149: 8,
  \u620C: 9,
  \u4EA5: 10,
  \u5B50: 11,
  \u4E11: 12
};
var MAJOR_SOLAR_TERM_DEGREES = [315, 345, 15, 45, 75, 105, 135, 165, 195, 225, 255, 285];
var MAJOR_SOLAR_TERM_APPROX_DAY_OF_YEAR = {
  315: 35.85,
  345: 65.5,
  15: 95,
  45: 125.5,
  75: 156,
  105: 187,
  135: 219,
  165: 251,
  195: 283,
  225: 315,
  255: 340,
  285: 5
};
function mod(n, m) {
  return (n % m + m) % m;
}
var LUNAR_DATA = [
  19416,
  19168,
  42352,
  21717,
  53856,
  55632,
  91476,
  22176,
  39632,
  21970,
  19168,
  42422,
  42192,
  53840,
  119381,
  46400,
  54944,
  44450,
  38320,
  84343,
  18800,
  42160,
  46261,
  27216,
  27968,
  109396,
  11104,
  38256,
  21234,
  18800,
  25958,
  54432,
  59984,
  28309,
  23248,
  11104,
  100067,
  37600,
  116951,
  51536,
  54432,
  120998,
  46416,
  22176,
  107956,
  9680,
  37584,
  53938,
  43344,
  46423,
  27808,
  46416,
  86869,
  19872,
  42416,
  83315,
  21168,
  43432,
  59728,
  27296,
  44710,
  43856,
  19296,
  43748,
  42352,
  21088,
  62051,
  55632,
  23383,
  22176,
  38608,
  19925,
  19152,
  42192,
  54484,
  53840,
  54616,
  46400,
  46752,
  103846,
  38320,
  18864,
  43380,
  42160,
  45690,
  27216,
  27968,
  44870,
  43872,
  38256,
  19189,
  18800,
  25776,
  29859,
  59984,
  27480,
  21952,
  43872,
  38613,
  37600,
  51552,
  55636,
  54432,
  55888,
  30034,
  22176,
  43959,
  9680,
  37584,
  51893,
  43344,
  46240,
  47780,
  44368,
  21977,
  19360,
  42416,
  86390,
  21168,
  43312,
  31060,
  27296,
  44368,
  23378,
  19296,
  42726,
  42208,
  53856,
  60005,
  54576,
  23200,
  30371,
  38608,
  19195,
  19152,
  42192,
  118966,
  53840,
  54560,
  56645,
  46496,
  22224,
  21938,
  18864,
  42359,
  42160,
  43600,
  111189,
  27936,
  44448,
  84835,
  37744,
  18936,
  18800,
  25776,
  92326,
  59984,
  27424,
  108228,
  43744,
  41696,
  53987,
  51552,
  54615,
  54432,
  55888,
  23893,
  22176,
  42704,
  21972,
  21200,
  43448,
  43344,
  46240,
  46758,
  44368,
  21920,
  43940,
  42416,
  21168,
  45683,
  26928,
  29495,
  27296,
  44368,
  84821,
  19296,
  42352,
  21732,
  53600,
  59752,
  54560,
  55968,
  92838,
  22224,
  19168,
  43476,
  41680,
  53584,
  62034,
  54560
];

// src/manse.ts
function normalizeInput(input) {
  const now = input.now === void 0 ? void 0 : new Date(input.now);
  return {
    year: input.year,
    month: input.month,
    day: input.day,
    hour: input.hour ?? 12,
    minute: input.minute ?? 0,
    gender: input.gender ?? "\uC5EC",
    calendar: input.calendar ?? "solar",
    leap: input.leap ?? false,
    timezone: input.timezone ?? KOREA_TIMEZONE,
    longitude: input.longitude,
    applyLocalMeanTime: input.applyLocalMeanTime ?? false,
    now
  };
}
function validateInput(input) {
  if (input.gender !== "\uB0A8" && input.gender !== "\uC5EC") {
    throw new Error("gender must be '\uB0A8' or '\uC5EC'");
  }
  if (input.calendar !== "solar" && input.calendar !== "lunar") {
    throw new Error("calendar must be 'solar' or 'lunar'");
  }
  if (!isValidTimeZone(input.timezone)) {
    throw new Error("timezone must be a valid IANA timezone string");
  }
  if (input.now && Number.isNaN(input.now.getTime())) {
    throw new Error("now must be a valid Date");
  }
  if (!Number.isInteger(input.year) || input.year < MIN_SUPPORTED_YEAR || input.year > MAX_SUPPORTED_YEAR) {
    throw new Error(`year must be an integer between ${MIN_SUPPORTED_YEAR} and ${MAX_SUPPORTED_YEAR}`);
  }
  if (!Number.isInteger(input.month) || input.month < 1 || input.month > 12) {
    throw new Error("month must be an integer between 1 and 12");
  }
  if (!Number.isInteger(input.day) || input.day < 1 || input.day > 31) {
    throw new Error("day must be an integer between 1 and 31");
  }
  if (!Number.isInteger(input.hour) || input.hour < 0 || input.hour > 23) {
    throw new Error("hour must be an integer between 0 and 23");
  }
  if (!Number.isInteger(input.minute) || input.minute < 0 || input.minute > 59) {
    throw new Error("minute must be an integer between 0 and 59");
  }
  if (typeof input.longitude === "number" && (Number.isNaN(input.longitude) || input.longitude < -180 || input.longitude > 180)) {
    throw new Error("longitude must be between -180 and 180");
  }
  if (input.calendar === "solar" && !isValidSolarDate(input.year, input.month, input.day)) {
    throw new Error("invalid solar date");
  }
}
function isValidSolarDate(year, month, day) {
  const dt = new Date(Date.UTC(year, month - 1, day));
  return dt.getUTCFullYear() === year && dt.getUTCMonth() + 1 === month && dt.getUTCDate() === day;
}
function isValidTimeZone(timeZone) {
  try {
    getTimeZoneFormatter(timeZone);
    return true;
  } catch {
    return false;
  }
}
function normalizeBirthDate(args) {
  const { calendar, leap, timezone, year, month, day, hour, minute, longitude, applyLocalMeanTime } = args;
  let solar = { year, month, day };
  if (calendar === "lunar") {
    solar = lunarToSolar(year, month, day, leap);
  }
  const utcDate = zonedTimeToUtc(
    { year: solar.year, month: solar.month, day: solar.day, hour, minute },
    timezone
  );
  const kst = formatInTimeZone(utcDate, KOREA_TIMEZONE);
  const standardLongitude = getTimezoneStandardLongitude(timezone, utcDate);
  const resolvedLongitude = typeof longitude === "number" && !Number.isNaN(longitude) ? longitude : timezone === KOREA_TIMEZONE ? SEOUL_LONGITUDE : standardLongitude;
  const lmt = applyLocalMeanTime ? applyLocalMeanTimeByLongitude(
    {
      year: kst.year,
      month: kst.month,
      day: kst.day,
      hour: kst.hour,
      minute: kst.minute
    },
    resolvedLongitude,
    standardLongitude
  ) : void 0;
  const calculation = lmt ? { year: lmt.year, month: lmt.month, day: lmt.day, hour: lmt.hour, minute: lmt.minute } : { year: kst.year, month: kst.month, day: kst.day, hour: kst.hour, minute: kst.minute };
  return {
    solar,
    kst: { year: kst.year, month: kst.month, day: kst.day, hour: kst.hour, minute: kst.minute },
    calculation,
    localMeanTime: lmt ? {
      year: lmt.year,
      month: lmt.month,
      day: lmt.day,
      hour: lmt.hour,
      minute: lmt.minute,
      longitude: resolvedLongitude,
      offsetMinutes: (resolvedLongitude - standardLongitude) * 4,
      standardLongitude
    } : void 0
  };
}
function applyLocalMeanTimeByLongitude(parts, longitude, standardLongitude) {
  const offsetMinutes = (longitude - standardLongitude) * 4;
  const kstOffsetMillis = BASE_KST_OFFSET_MINUTES * 60 * 1e3;
  const utcMillis = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute) - kstOffsetMillis;
  const adjustedKst = new Date(utcMillis + offsetMinutes * 60 * 1e3 + kstOffsetMillis);
  return {
    year: adjustedKst.getUTCFullYear(),
    month: adjustedKst.getUTCMonth() + 1,
    day: adjustedKst.getUTCDate(),
    hour: adjustedKst.getUTCHours(),
    minute: adjustedKst.getUTCMinutes()
  };
}
function zonedTimeToUtc(parts, timeZone) {
  const localMillis = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0);
  let guess = new Date(localMillis);
  for (let i = 0; i < 5; i++) {
    const offset = getTimeZoneOffset(guess, timeZone);
    const candidate = new Date(localMillis - offset * 60 * 1e3);
    if (Math.abs(candidate.getTime() - guess.getTime()) < 1e3) {
      guess = candidate;
      break;
    }
    guess = candidate;
  }
  return guess;
}
var TIMEZONE_DATE_PART_OPTIONS = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
  hour12: false
};
var timezoneFormatterCache = /* @__PURE__ */ new Map();
function getTimeZoneFormatter(timeZone) {
  const cached = timezoneFormatterCache.get(timeZone);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    ...TIMEZONE_DATE_PART_OPTIONS,
    timeZone
  });
  timezoneFormatterCache.set(timeZone, formatter);
  return formatter;
}
function getDateTimePartsInTimeZone(date, timeZone) {
  const parts = getTimeZoneFormatter(timeZone).formatToParts(date);
  const values = {};
  for (const part of parts) {
    if (part.type === "literal") continue;
    values[part.type] = parseInt(part.value, 10);
  }
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second
  };
}
function formatInTimeZone(date, timeZone) {
  return getDateTimePartsInTimeZone(date, timeZone);
}
function getTimeZoneOffset(date, timeZone) {
  const map = getDateTimePartsInTimeZone(date, timeZone);
  const asUTC = Date.UTC(
    map.year,
    (map.month || 1) - 1,
    map.day || 1,
    map.hour || 0,
    map.minute || 0,
    map.second || 0
  );
  return (asUTC - date.getTime()) / (60 * 1e3);
}
function getTimezoneStandardLongitude(timeZone, referenceDate) {
  if (timeZone === KOREA_TIMEZONE) return STANDARD_LONGITUDE;
  const year = referenceDate.getUTCFullYear();
  const january = new Date(Date.UTC(year, 0, 1));
  const july = new Date(Date.UTC(year, 6, 1));
  const janOffset = getTimeZoneOffset(january, timeZone);
  const julOffset = getTimeZoneOffset(july, timeZone);
  const standardOffset = Math.min(janOffset, julOffset);
  return standardOffset / 4;
}
function getKstNowDate(reference) {
  const now = reference ? new Date(reference) : /* @__PURE__ */ new Date();
  const kst = formatInTimeZone(now, KOREA_TIMEZONE);
  return { year: kst.year, month: kst.month, day: kst.day };
}
function getLunarYearDays(year) {
  let sum = 348;
  for (let i = 32768; i > 8; i >>= 1) {
    sum += LUNAR_DATA[year - 1900] & i ? 1 : 0;
  }
  return sum + getLeapMonthDays(year);
}
function getLeapMonth(year) {
  return LUNAR_DATA[year - 1900] & 15;
}
function getLeapMonthDays(year) {
  const leapMonth = getLeapMonth(year);
  if (!leapMonth) return 0;
  return LUNAR_DATA[year - 1900] & 65536 ? 30 : 29;
}
function getLunarMonthDays(year, month) {
  return LUNAR_DATA[year - 1900] & 65536 >> month ? 30 : 29;
}
function lunarToSolar(year, month, day, isLeapMonth) {
  if (year < MIN_SUPPORTED_YEAR || year > MAX_SUPPORTED_YEAR) {
    throw new Error(`lunar year must be between ${MIN_SUPPORTED_YEAR} and ${MAX_SUPPORTED_YEAR}`);
  }
  if (month < 1 || month > 12) {
    throw new Error("lunar month must be between 1 and 12");
  }
  if (day < 1 || day > 30) {
    throw new Error("lunar day must be between 1 and 30");
  }
  const yearLeapMonth = getLeapMonth(year);
  if (isLeapMonth && yearLeapMonth !== month) {
    throw new Error(`lunar leap month mismatch: year ${year} leap month is ${yearLeapMonth || "none"}`);
  }
  const maxDays = isLeapMonth ? getLeapMonthDays(year) : getLunarMonthDays(year, month);
  if (day > maxDays) {
    throw new Error(`invalid lunar day: ${year}-${month}${isLeapMonth ? " (leap)" : ""} has at most ${maxDays} days`);
  }
  const baseDateMs = Date.UTC(1900, 0, 31);
  let offset = 0;
  for (let i = 1900; i < year; i++) {
    offset += getLunarYearDays(i);
  }
  const leapMonth = yearLeapMonth;
  let isLeap = false;
  for (let i = 1; i < month; i++) {
    if (leapMonth > 0 && i === leapMonth && !isLeap) {
      offset += getLeapMonthDays(year);
      isLeap = true;
      i--;
    } else {
      offset += getLunarMonthDays(year, i);
    }
  }
  if (isLeapMonth && leapMonth === month) {
    offset += getLunarMonthDays(year, month);
  }
  offset += day - 1;
  const solarDate = new Date(baseDateMs + offset * DAY_IN_MS);
  return {
    year: solarDate.getUTCFullYear(),
    month: solarDate.getUTCMonth() + 1,
    day: solarDate.getUTCDate()
  };
}
function solarToLunar(year, month, day) {
  if (year < MIN_SUPPORTED_YEAR || year > MAX_SUPPORTED_YEAR) {
    throw new Error(`solar year must be between ${MIN_SUPPORTED_YEAR} and ${MAX_SUPPORTED_YEAR}`);
  }
  if (month < 1 || month > 12) {
    throw new Error("solar month must be between 1 and 12");
  }
  if (day < 1 || day > 31) {
    throw new Error("solar day must be between 1 and 31");
  }
  if (!isValidSolarDate(year, month, day)) {
    throw new Error("invalid solar date");
  }
  const baseDateMs = Date.UTC(1900, 0, 31);
  const targetDateMs = Date.UTC(year, month - 1, day);
  const offset = Math.floor((targetDateMs - baseDateMs) / DAY_IN_MS);
  let lunarYear = 1900;
  let remainingDays = offset;
  for (let i = 1900; i < 2100 && remainingDays > 0; i++) {
    const yearDays = getLunarYearDays(i);
    if (remainingDays < yearDays) {
      lunarYear = i;
      break;
    }
    remainingDays -= yearDays;
  }
  const leapMonth = getLeapMonth(lunarYear);
  let lunarMonth = 1;
  let isLeapMonth = false;
  for (let i = 1; i <= 12 && remainingDays > 0; i++) {
    let monthDays;
    if (leapMonth > 0 && i === leapMonth + 1 && !isLeapMonth) {
      monthDays = getLeapMonthDays(lunarYear);
      isLeapMonth = true;
      i--;
    } else {
      monthDays = getLunarMonthDays(lunarYear, i);
      isLeapMonth = false;
    }
    if (remainingDays < monthDays) {
      lunarMonth = i;
      break;
    }
    remainingDays -= monthDays;
  }
  return {
    year: lunarYear,
    month: lunarMonth,
    day: remainingDays + 1,
    isLeapMonth
  };
}
function compareLocal(a, b) {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  if (a.day !== b.day) return a.day - b.day;
  if (a.hour !== b.hour) return a.hour - b.hour;
  return a.minute - b.minute;
}
function isDuringKoreaDST(local) {
  return KOREA_DST_PERIODS.some(({ start, end }) => compareLocal(local, start) >= 0 && compareLocal(local, end) < 0);
}
function toUTCFromKoreanLocal(year, month, day, hour, minute) {
  const local = { year, month, day, hour, minute };
  const dstOffsetMinutes = isDuringKoreaDST(local) ? 60 : 0;
  const totalOffsetMinutes = BASE_KST_OFFSET_MINUTES + dstOffsetMinutes;
  const utcMillis = Date.UTC(year, month - 1, day, hour, minute) - totalOffsetMinutes * 60 * 1e3;
  return new Date(utcMillis);
}
function getJulianDay(date) {
  return date.getTime() / DAY_IN_MS + 24405875e-1;
}
function getSolarLongitude(date) {
  const JD = getJulianDay(date);
  const T = (JD - 2451545) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 3032e-7 * T * T;
  const M = 357.52911 + 35999.05029 * T - 1537e-7 * T * T - 48e-8 * T * T * T;
  const Mrad = M * Math.PI / 180;
  const C = (1.914602 - 4817e-6 * T - 14e-6 * T * T) * Math.sin(Mrad) + (0.019993 - 101e-6 * T) * Math.sin(2 * Mrad) + 289e-6 * Math.sin(3 * Mrad);
  const trueLongitude = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const lambda = trueLongitude - 569e-5 - 478e-5 * Math.sin(omega * Math.PI / 180);
  return mod(lambda, 360);
}
function normalizeAngle(angle) {
  let normalized = angle % 360;
  if (normalized > 180) normalized -= 360;
  if (normalized < -180) normalized += 360;
  return normalized;
}
var preciseTermCache = /* @__PURE__ */ new Map();
function findSolarTermUTC(year, targetDegree, approxDayOfYear) {
  const cacheKey = `${year}:${targetDegree}`;
  const cached = preciseTermCache.get(cacheKey);
  if (cached) return new Date(cached.getTime());
  const startOfYear = Date.UTC(year, 0, 1);
  let current = new Date(startOfYear + approxDayOfYear * DAY_IN_MS);
  for (let i = 0; i < 15; i++) {
    const longitude = getSolarLongitude(current);
    const diff = normalizeAngle(targetDegree - longitude);
    if (Math.abs(diff) < 1e-6) break;
    const deltaDays = diff / 360 * 365.2422;
    current = new Date(current.getTime() + deltaDays * DAY_IN_MS);
  }
  preciseTermCache.set(cacheKey, current);
  return new Date(current.getTime());
}
function buildMajorSolarTermsUTC(year) {
  const out = [];
  for (const degree of MAJOR_SOLAR_TERM_DEGREES) {
    const approxDay = MAJOR_SOLAR_TERM_APPROX_DAY_OF_YEAR[degree] ?? 35.85;
    out.push(findSolarTermUTC(year, degree, approxDay));
  }
  out.sort((a, b) => a.getTime() - b.getTime());
  return out;
}
function resolveNearestMajorSolarTermUTC(birthUtc, forward) {
  const birthYear = birthUtc.getUTCFullYear();
  const candidates = [];
  for (let y = birthYear - 1; y <= birthYear + 2; y++) {
    candidates.push(...buildMajorSolarTermsUTC(y));
  }
  candidates.sort((a, b) => a.getTime() - b.getTime());
  if (forward) {
    for (const term of candidates) {
      if (term.getTime() > birthUtc.getTime()) return term;
    }
  } else {
    for (let i = candidates.length - 1; i >= 0; i--) {
      if (candidates[i].getTime() <= birthUtc.getTime()) return candidates[i];
    }
  }
  return candidates[Math.floor(candidates.length / 2)] ?? new Date(birthUtc);
}
var lichunCache = /* @__PURE__ */ new Map();
function getLichunUTCDate(year) {
  const cached = lichunCache.get(year);
  if (cached) return new Date(cached.getTime());
  const found = findSolarTermUTC(year, 315, MAJOR_SOLAR_TERM_APPROX_DAY_OF_YEAR[315]);
  lichunCache.set(year, found);
  return new Date(found.getTime());
}
function getAdjustedYearByLichun(year, month, day, hour, minute) {
  const inputUTC = toUTCFromKoreanLocal(year, month, day, hour, minute);
  const lichunUTC = getLichunUTCDate(year);
  return inputUTC.getTime() < lichunUTC.getTime() ? year - 1 : year;
}
function getSolarMonthIndex(year, month, day, hour, minute) {
  const inputUTC = toUTCFromKoreanLocal(year, month, day, hour, minute);
  const longitude = getSolarLongitude(inputUTC);
  const normalized = mod(longitude - 315, 360);
  return Math.floor(normalized / 30);
}
function getYearPillarByAdjustedYear(adjustedYear) {
  return {
    heavenlyStem: HEAVENLY_STEMS_KO[mod(adjustedYear - 4, 10)],
    earthlyBranch: EARTHLY_BRANCHES_KO[mod(adjustedYear - 4, 12)]
  };
}
function getMonthPillarByAdjustedYear(adjustedYear, monthIndex) {
  const yearStemIdx = mod(adjustedYear - 4, 10);
  const startStem = YEAR_STEM_TO_MONTH_START_STEM_INDEX[yearStemIdx];
  const monthStemIndex = mod(startStem + monthIndex, 10);
  const branch = MONTH_BRANCHES[monthIndex + 1] || "\u5BC5";
  return {
    heavenlyStem: HEAVENLY_STEMS_KO[monthStemIndex],
    earthlyBranch: HANJA_TO_KO_BRANCH[branch]
  };
}
function getDayPillar(year, month, day) {
  const baseDateMs = Date.UTC(1992, 9, 24);
  const baseGanjiNum = 9;
  const targetDateMs = Date.UTC(year, month - 1, day);
  const daysDiff = Math.floor((targetDateMs - baseDateMs) / DAY_IN_MS);
  const targetGanjiNum = ((baseGanjiNum + daysDiff) % 60 + 60) % 60;
  return {
    heavenlyStem: HEAVENLY_STEMS_KO[targetGanjiNum % 10],
    earthlyBranch: EARTHLY_BRANCHES_KO[targetGanjiNum % 12]
  };
}
function getHourPillar(dayPillar, hour, minute) {
  let adjustedHour = hour;
  if (hour === 23) adjustedHour = 0;
  const totalMinutes = adjustedHour * 60 + minute;
  const shichen = Math.floor((totalMinutes + 60) / 120) % 12;
  const dayStemIndex = HEAVENLY_STEMS_KO.indexOf(dayPillar.heavenlyStem);
  const hourStemBase = dayStemIndex % 5 * 2;
  const hourStemIndex = (hourStemBase + shichen) % 10;
  return {
    heavenlyStem: HEAVENLY_STEMS_KO[hourStemIndex],
    earthlyBranch: EARTHLY_BRANCHES_KO[shichen]
  };
}
function calculateFourPillars(birthInfo) {
  const { hour, minute } = birthInfo;
  const { year, month, day } = birthInfo;
  const adjustedYear = getAdjustedYearByLichun(year, month, day, hour, minute);
  const monthIndex = getSolarMonthIndex(year, month, day, hour, minute);
  const yearPillar = getYearPillarByAdjustedYear(adjustedYear);
  const monthPillar = getMonthPillarByAdjustedYear(adjustedYear, monthIndex);
  const dayPillar = getDayPillar(year, month, day);
  const hourPillar = getHourPillar(dayPillar, hour, minute);
  return {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar
  };
}
function buildReferenceCodes(referenceDate) {
  const now = formatInTimeZone(referenceDate, KOREA_TIMEZONE);
  const nextYearDate = new Date(referenceDate.getTime() + 370 * DAY_IN_MS);
  const nextMonthDate = new Date(referenceDate.getTime() + 32 * DAY_IN_MS);
  const tomorrowDate = new Date(referenceDate.getTime() + DAY_IN_MS);
  const nextYear = formatInTimeZone(nextYearDate, KOREA_TIMEZONE);
  const nextMonth = formatInTimeZone(nextMonthDate, KOREA_TIMEZONE);
  const tomorrow = formatInTimeZone(tomorrowDate, KOREA_TIMEZONE);
  const nowPillars = calculateFourPillars({
    year: now.year,
    month: now.month,
    day: now.day,
    hour: now.hour,
    minute: now.minute
  });
  const nextYearP = calculateFourPillars({
    year: nextYear.year,
    month: nextYear.month,
    day: nextYear.day,
    hour: nextYear.hour,
    minute: nextYear.minute
  });
  const nextMonthP = calculateFourPillars({
    year: nextMonth.year,
    month: nextMonth.month,
    day: nextMonth.day,
    hour: nextMonth.hour,
    minute: nextMonth.minute
  });
  const tomorrowP = calculateFourPillars({
    year: tomorrow.year,
    month: tomorrow.month,
    day: tomorrow.day,
    hour: tomorrow.hour,
    minute: tomorrow.minute
  });
  const nowLabel = `${now.year}-${String(now.month).padStart(2, "0")}-${String(now.day).padStart(2, "0")} ${String(
    now.hour
  ).padStart(2, "0")}:${String(now.minute).padStart(2, "0")} KST`;
  return {
    now: nowLabel,
    codes: {
      thisYear: `${KO_TO_HANJA_STEM[nowPillars.year.heavenlyStem]}${KO_TO_HANJA_BRANCH[nowPillars.year.earthlyBranch]}`,
      nextYear: `${KO_TO_HANJA_STEM[nextYearP.year.heavenlyStem]}${KO_TO_HANJA_BRANCH[nextYearP.year.earthlyBranch]}`,
      thisMonth: `${KO_TO_HANJA_STEM[nowPillars.month.heavenlyStem]}${KO_TO_HANJA_BRANCH[nowPillars.month.earthlyBranch]}`,
      nextMonth: `${KO_TO_HANJA_STEM[nextMonthP.month.heavenlyStem]}${KO_TO_HANJA_BRANCH[nextMonthP.month.earthlyBranch]}`,
      today: `${KO_TO_HANJA_STEM[nowPillars.day.heavenlyStem]}${KO_TO_HANJA_BRANCH[nowPillars.day.earthlyBranch]}`,
      tomorrow: `${KO_TO_HANJA_STEM[tomorrowP.day.heavenlyStem]}${KO_TO_HANJA_BRANCH[tomorrowP.day.earthlyBranch]}`
    }
  };
}

// src/analyze.ts
var PILLAR_KEYS2 = ["hour", "day", "month", "year"];
function analyzeChart(args) {
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
    hour: hourPillar.stem + hourPillar.branch
  };
  const pillarDetails = {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar
  };
  const dayStem = dayPillar.stem;
  const dayBranch = dayPillar.branch;
  const gongmang = calculateGongmang(dayPillar.stemIdx, dayPillar.branchIdx);
  const tenGods = {
    year: {
      stem: getTenGod(dayStem, yearPillar.stem),
      branch: getTenGod(dayStem, yearPillar.hiddenStems.\uC815\uAE30 || "")
    },
    month: {
      stem: getTenGod(dayStem, monthPillar.stem),
      branch: getTenGod(dayStem, monthPillar.hiddenStems.\uC815\uAE30 || "")
    },
    day: {
      stem: "(\uC77C\uAC04)",
      branch: getTenGod(dayStem, dayPillar.hiddenStems.\uC815\uAE30 || "")
    },
    hour: {
      stem: getTenGod(dayStem, hourPillar.stem),
      branch: getTenGod(dayStem, hourPillar.hiddenStems.\uC815\uAE30 || "")
    }
  };
  const stages12 = {
    bong: mapPillars((key) => get12Stage(dayStem, pillarDetails[key].branch, "bong")),
    geo: mapPillars((key) => get12Stage(dayStem, pillarDetails[key].branch, "geo"))
  };
  const stemsInPillarOrder = [
    hourPillar.stem,
    dayPillar.stem,
    monthPillar.stem,
    yearPillar.stem
  ];
  const branchesInPillarOrder = [
    hourPillar.branch,
    dayPillar.branch,
    monthPillar.branch,
    yearPillar.branch
  ];
  const stemRelations = getStemRelations(stemsInPillarOrder);
  const branchRelations = getBranchRelations(branchesInPillarOrder);
  const sals = mapPillars((key) => ({
    twelveSal: getTwelveSals(yearPillar.branch, pillarDetails[key].branch),
    specialSals: calculateSals(dayPillar.stem, dayPillar.branch, pillarDetails[key].branch)
  }));
  const fiveElements = getFiveElements({
    year: { stem: yearPillar.stem, branch: yearPillar.branch },
    month: { stem: monthPillar.stem, branch: monthPillar.branch },
    day: { stem: dayPillar.stem, branch: dayPillar.branch },
    hour: { stem: hourPillar.stem, branch: hourPillar.branch }
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
    currentAge
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
    dayPillar.stem
  );
  const personality = analyzePersonality({
    dayStem,
    tenGods,
    fiveElements,
    dayStrength,
    sinsal: advancedSinsal
  });
  const interpretation = generateInterpretation({
    geukguk,
    fiveElements,
    sinsal: advancedSinsal
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
      interpretation
    }
  };
}
function buildPillarDetail(stemKo, branchKo) {
  const stem = KO_TO_HANJA_STEM[stemKo] || stemKo;
  const branch = KO_TO_HANJA_BRANCH[branchKo] || branchKo;
  return {
    stem,
    branch,
    stemKo,
    branchKo,
    stemIdx: HEAVENLY_STEMS.indexOf(stem),
    branchIdx: EARTHLY_BRANCHES.indexOf(branch),
    element: {
      stem: STEM_ELEMENT[stem],
      branch: BRANCH_ELEMENT[branch]
    },
    yinYang: {
      stem: STEM_YINYANG[stem],
      branch: BRANCH_YINYANG[branch]
    },
    hiddenStems: {
      \uC5EC\uAE30: BRANCH_HIDDEN_STEMS[branch]?.\uC5EC\uAE30 || null,
      \uC911\uAE30: BRANCH_HIDDEN_STEMS[branch]?.\uC911\uAE30 || null,
      \uC815\uAE30: BRANCH_HIDDEN_STEMS[branch]?.\uC815\uAE30 || null
    }
  };
}
function calculateGongmang(dayStemIdx, dayBranchIdx) {
  const sunsu = mod(dayBranchIdx - dayStemIdx, 12);
  const gm1 = mod(sunsu + 10, 12);
  const gm2 = mod(sunsu + 11, 12);
  return {
    branches: [EARTHLY_BRANCHES[gm1], EARTHLY_BRANCHES[gm2]],
    branchesKo: [HANJA_TO_KO_BRANCH[EARTHLY_BRANCHES[gm1]], HANJA_TO_KO_BRANCH[EARTHLY_BRANCHES[gm2]]]
  };
}
function getTenGod(dayStem, otherStem) {
  return TEN_GODS[dayStem]?.[otherStem] || "";
}
function mapPillars(mapper) {
  const out = {};
  for (const key of PILLAR_KEYS2) out[key] = mapper(key);
  return out;
}
var TWELVE_STAGE_SEQUENCE = ["\uC7A5\uC0DD", "\uBAA9\uC695", "\uAD00\uB300", "\uAC74\uB85D", "\uC81C\uC655", "\uC1E0", "\uBCD1", "\uC0AC", "\uBB18", "\uC808", "\uD0DC", "\uC591"];
var TWELVE_STAGE_START_BRANCH = {
  \u7532: "\u4EA5",
  \u4E59: "\u5348",
  \u4E19: "\u5BC5",
  \u4E01: "\u9149",
  \u620A: "\u5BC5",
  \u5DF1: "\u9149",
  \u5E9A: "\u5DF3",
  \u8F9B: "\u5B50",
  \u58EC: "\u7533",
  \u7678: "\u536F"
};
function get12Stage(dayStem, branch, method = "bong") {
  const branchIdx = EARTHLY_BRANCHES.indexOf(branch);
  if (branchIdx < 0) return "";
  if (method === "bong") {
    const startBranch = TWELVE_STAGE_START_BRANCH[dayStem];
    const startIdx = EARTHLY_BRANCHES.indexOf(startBranch);
    if (startIdx < 0) return "";
    const isYangStem = STEM_YINYANG[dayStem] === "\uC591";
    const offset = isYangStem ? mod(branchIdx - startIdx, 12) : mod(startIdx - branchIdx, 12);
    return TWELVE_STAGE_SEQUENCE[offset] || "";
  }
  return TWELVE_STAGES_GEO[dayStem]?.[branchIdx] || "";
}
function getFiveElements(pillars) {
  const counts = { \uBAA9: 0, \uD654: 0, \uD1A0: 0, \uAE08: 0, \uC218: 0 };
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
var SAL_NAMES = ["\uD654\uAC1C\uC0B4", "\uAC81\uC0B4", "\uC7AC\uC0B4", "\uCC9C\uC0B4", "\uC9C0\uC0B4", "\uB144\uC0B4", "\uC6D4\uC0B4", "\uB9DD\uC2E0\uC0B4", "\uC7A5\uC131\uC0B4", "\uBC18\uC548\uC0B4", "\uC5ED\uB9C8\uC0B4", "\uC721\uD574\uC0B4"];
var TWELVE_SAL_GROUP_START = [
  { branches: ["\u7533", "\u5B50", "\u8FB0"], start: "\u8FB0" },
  { branches: ["\u5BC5", "\u5348", "\u620C"], start: "\u620C" },
  { branches: ["\u4EA5", "\u536F", "\u672A"], start: "\u672A" },
  { branches: ["\u5DF3", "\u9149", "\u4E11"], start: "\u4E11" }
];
var CHEON_EUL_GWIIN_MAP = {
  \u7532: ["\u4E11", "\u672A"],
  \u4E59: ["\u5B50", "\u7533"],
  \u4E19: ["\u4EA5", "\u9149"],
  \u4E01: ["\u4EA5", "\u9149"],
  \u620A: ["\u4E11", "\u672A"],
  \u5DF1: ["\u5B50", "\u7533"],
  \u5E9A: ["\u4E11", "\u672A"],
  \u8F9B: ["\u5BC5", "\u5348"],
  \u58EC: ["\u536F", "\u5DF3"],
  \u7678: ["\u536F", "\u5DF3"]
};
var YEOKMA_MAP = {
  \u5BC5: "\u7533",
  \u7533: "\u5BC5",
  \u5DF3: "\u4EA5",
  \u4EA5: "\u5DF3",
  \u5B50: "\u5348",
  \u5348: "\u5B50",
  \u536F: "\u9149",
  \u9149: "\u536F",
  \u8FB0: "\u620C",
  \u620C: "\u8FB0",
  \u4E11: "\u672A",
  \u672A: "\u4E11"
};
var DOHWA_MAP = {
  \u5BC5: "\u536F",
  \u5348: "\u536F",
  \u620C: "\u536F",
  \u7533: "\u9149",
  \u5B50: "\u9149",
  \u8FB0: "\u9149",
  \u5DF3: "\u5348",
  \u9149: "\u5348",
  \u4E11: "\u5348",
  \u4EA5: "\u5B50",
  \u536F: "\u5B50",
  \u672A: "\u5B50"
};
var HWAGAE_MAP = {
  \u5BC5: "\u620C",
  \u5348: "\u620C",
  \u620C: "\u620C",
  \u7533: "\u8FB0",
  \u5B50: "\u8FB0",
  \u8FB0: "\u8FB0",
  \u5DF3: "\u4E11",
  \u9149: "\u4E11",
  \u4E11: "\u4E11",
  \u4EA5: "\u672A",
  \u536F: "\u672A",
  \u672A: "\u672A"
};
function getTwelveSals(yearBranch, targetBranch) {
  const targetIdx = EARTHLY_BRANCHES.indexOf(targetBranch);
  if (targetIdx < 0) return "";
  const group = TWELVE_SAL_GROUP_START.find(({ branches }) => branches.includes(yearBranch));
  if (!group) return "";
  const startIdx = EARTHLY_BRANCHES.indexOf(group.start);
  if (startIdx < 0) return "";
  return SAL_NAMES[mod(targetIdx - startIdx, 12)] || "";
}
function getCheonEulGwiin(dayStem) {
  return CHEON_EUL_GWIIN_MAP[dayStem] || [];
}
function getYeokma(dayBranch) {
  return YEOKMA_MAP[dayBranch] || "";
}
function getDohwa(dayBranch) {
  return DOHWA_MAP[dayBranch] || "";
}
function getHwagae(dayBranch) {
  return HWAGAE_MAP[dayBranch] || "";
}
function calculateSals(dayStem, dayBranch, targetBranch) {
  const out = [];
  const gwiin = getCheonEulGwiin(dayStem);
  if (gwiin.includes(targetBranch)) out.push("\uCC9C\uC744\uADC0\uC778");
  if (getYeokma(dayBranch) === targetBranch) out.push("\uC5ED\uB9C8\uC0B4");
  if (getDohwa(dayBranch) === targetBranch) out.push("\uB3C4\uD654\uC0B4");
  if (getHwagae(dayBranch) === targetBranch) out.push("\uD654\uAC1C\uC0B4");
  return out;
}
function getStemRelations(stems) {
  const relations = [];
  const hapPairs = [
    ["\u7532", "\u5DF1"],
    ["\u4E59", "\u5E9A"],
    ["\u4E19", "\u8F9B"],
    ["\u4E01", "\u58EC"],
    ["\u620A", "\u7678"]
  ];
  const hapElements = ["\uD1A0", "\uAE08", "\uC218", "\uBAA9", "\uD654"];
  const chungPairs = [
    ["\u7532", "\u5E9A"],
    ["\u4E59", "\u8F9B"],
    ["\u4E19", "\u58EC"],
    ["\u4E01", "\u7678"],
    ["\u620A", "\u7532"],
    ["\u5DF1", "\u4E59"]
  ];
  const pillarNames = ["hour", "day", "month", "year"];
  for (let i = 0; i < stems.length; i++) {
    for (let j = i + 1; j < stems.length; j++) {
      for (let k = 0; k < hapPairs.length; k++) {
        const pair = hapPairs[k];
        if (stems[i] === pair[0] && stems[j] === pair[1] || stems[i] === pair[1] && stems[j] === pair[0]) {
          relations.push({
            type: "\uD569",
            pillars: [pillarNames[i], pillarNames[j]],
            desc: `${stems[i]}${stems[j]} \uD569 \u2192 ${hapElements[k]}`,
            stems: [stems[i], stems[j]]
          });
        }
      }
      for (const pair of chungPairs) {
        if (stems[i] === pair[0] && stems[j] === pair[1] || stems[i] === pair[1] && stems[j] === pair[0]) {
          relations.push({
            type: "\uCDA9",
            pillars: [pillarNames[i], pillarNames[j]],
            desc: `${stems[i]}${stems[j]} \uCDA9`,
            stems: [stems[i], stems[j]]
          });
        }
      }
    }
  }
  return relations;
}
function appendRelationSlot(target, key, text) {
  target[key] = target[key] ? `${target[key]}, ${text}` : text;
}
var BRANCH_PAIR_RELATION_RULES = [
  {
    key: "\uC721\uD569",
    suffix: "\uC721\uD569",
    pairs: [
      ["\u5B50", "\u4E11"],
      ["\u5BC5", "\u4EA5"],
      ["\u536F", "\u620C"],
      ["\u8FB0", "\u9149"],
      ["\u5DF3", "\u7533"],
      ["\u5348", "\u672A"]
    ]
  },
  {
    key: "\uCDA9",
    suffix: "\uCDA9",
    pairs: [
      ["\u5B50", "\u5348"],
      ["\u4E11", "\u672A"],
      ["\u5BC5", "\u7533"],
      ["\u536F", "\u9149"],
      ["\u8FB0", "\u620C"],
      ["\u5DF3", "\u4EA5"]
    ]
  },
  {
    key: "\uD615",
    suffix: "\uD615",
    pairs: [
      ["\u5B50", "\u536F"],
      ["\u5BC5", "\u5DF3"],
      ["\u5DF3", "\u7533"],
      ["\u7533", "\u5BC5"],
      ["\u4E11", "\u620C"],
      ["\u620C", "\u672A"],
      ["\u672A", "\u4E11"]
    ]
  },
  {
    key: "\uD30C",
    suffix: "\uD30C",
    pairs: [
      ["\u5B50", "\u9149"],
      ["\u4E11", "\u8FB0"],
      ["\u5BC5", "\u4EA5"],
      ["\u536F", "\u5348"],
      ["\u5DF3", "\u7533"],
      ["\u672A", "\u620C"]
    ]
  },
  {
    key: "\uD574",
    suffix: "\uD574",
    pairs: [
      ["\u5B50", "\u672A"],
      ["\u4E11", "\u5348"],
      ["\u5BC5", "\u5DF3"],
      ["\u536F", "\u8FB0"],
      ["\u7533", "\u4EA5"],
      ["\u9149", "\u620C"]
    ]
  },
  {
    key: "\uC6D0\uC9C4",
    suffix: "\uC6D0\uC9C4",
    pairs: [
      ["\u5B50", "\u672A"],
      ["\u4E11", "\u5348"],
      ["\u5BC5", "\u9149"],
      ["\u536F", "\u7533"],
      ["\u8FB0", "\u4EA5"],
      ["\u5DF3", "\u620C"]
    ]
  },
  {
    key: "\uADC0\uBB38",
    suffix: "\uADC0\uBB38",
    pairs: [
      ["\u5B50", "\u536F"],
      ["\u4E11", "\u5BC5"],
      ["\u5348", "\u9149"],
      ["\u672A", "\u7533"],
      ["\u8FB0", "\u5DF3"],
      ["\u620C", "\u4EA5"]
    ]
  }
];
var SAM_HAP_SETS = [
  { branches: ["\u7533", "\u5B50", "\u8FB0"], element: "\uC218\uAD6D" },
  { branches: ["\u5BC5", "\u5348", "\u620C"], element: "\uD654\uAD6D" },
  { branches: ["\u5DF3", "\u9149", "\u4E11"], element: "\uAE08\uAD6D" },
  { branches: ["\u4EA5", "\u536F", "\u672A"], element: "\uBAA9\uAD6D" }
];
var BANG_HAP_SETS = [
  { branches: ["\u5BC5", "\u536F", "\u8FB0"], name: "\uB3D9\uBC29\uBAA9\uAD6D" },
  { branches: ["\u5DF3", "\u5348", "\u672A"], name: "\uB0A8\uBC29\uD654\uAD6D" },
  { branches: ["\u7533", "\u9149", "\u620C"], name: "\uC11C\uBC29\uAE08\uAD6D" },
  { branches: ["\u4EA5", "\u5B50", "\u4E11"], name: "\uBD81\uBC29\uC218\uAD6D" }
];
function isBranchPairMatch(b1, b2, pair) {
  return b1 === pair[0] && b2 === pair[1] || b1 === pair[1] && b2 === pair[0];
}
function getBranchRelations(branches) {
  const results = {
    \uC9C0\uC7A5\uAC04: {},
    \uBC29\uD569: {},
    \uC0BC\uD569: {},
    \uBC18\uD569: {},
    \uC721\uD569: {},
    \uCDA9: {},
    \uD615: {},
    \uD30C: {},
    \uD574: {},
    \uC6D0\uC9C4: {},
    \uADC0\uBB38: {}
  };
  const pillarNames = ["hour", "day", "month", "year"];
  for (let i = 0; i < pillarNames.length; i++) {
    const hidden = BRANCH_HIDDEN_STEMS[branches[i]];
    if (!hidden) continue;
    const parts = [];
    if (hidden.\uC5EC\uAE30) parts.push(`\uC5EC\uAE30:${hidden.\uC5EC\uAE30}`);
    if (hidden.\uC911\uAE30) parts.push(`\uC911\uAE30:${hidden.\uC911\uAE30}`);
    if (hidden.\uC815\uAE30) parts.push(`\uC815\uAE30:${hidden.\uC815\uAE30}`);
    results.\uC9C0\uC7A5\uAC04[pillarNames[i]] = parts.join(" ");
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
    const matchedIndices = branches.map((b, idx) => set.branches.includes(b) ? idx : -1).filter((idx) => idx >= 0);
    const presentSet = new Set(matchedIndices.map((idx) => branches[idx]));
    const found = set.branches.filter((b) => presentSet.has(b));
    if (found.length >= 3) {
      const desc = `${found.join("")} \uC0BC\uD569 ${set.element}`;
      for (const idx of matchedIndices) {
        const pillar = pillarNames[idx];
        if (pillar) appendRelationSlot(results.\uC0BC\uD569, pillar, desc);
      }
    } else if (found.length === 2) {
      const desc = `${found.join("")} \uBC18\uD569 \u2192 ${set.element}`;
      for (const idx of matchedIndices) {
        const pillar = pillarNames[idx];
        if (pillar) appendRelationSlot(results.\uBC18\uD569, pillar, desc);
      }
    }
  }
  for (const set of BANG_HAP_SETS) {
    const matchedIndices = branches.map((b, idx) => set.branches.includes(b) ? idx : -1).filter((idx) => idx >= 0);
    const presentSet = new Set(matchedIndices.map((idx) => branches[idx]));
    const found = set.branches.filter((b) => presentSet.has(b));
    if (found.length >= 3) {
      const desc = `${found.join("")} \uBC29\uD569 ${set.name}`;
      for (const idx of matchedIndices) {
        const pillar = pillarNames[idx];
        if (pillar) appendRelationSlot(results.\uBC29\uD569, pillar, desc);
      }
    }
  }
  return results;
}
function calculateDaeun(args) {
  const yearStemIdx = HEAVENLY_STEMS.indexOf(args.yearStem);
  const isYangStem = (yearStemIdx >= 0 ? yearStemIdx : 0) % 2 === 0;
  const isMale = args.gender === "\uB0A8";
  const forward = isYangStem && isMale || !isYangStem && !isMale;
  const birthUtc = toUTCFromKoreanLocal(
    args.birthCalculation.year,
    args.birthCalculation.month,
    args.birthCalculation.day,
    args.birthCalculation.hour,
    args.birthCalculation.minute
  );
  const targetTermDate = resolveNearestMajorSolarTermUTC(birthUtc, forward);
  const diffDaysRaw = Math.abs((targetTermDate.getTime() - birthUtc.getTime()) / DAY_IN_MS);
  let startAge = Math.round(diffDaysRaw / 3);
  if (startAge < 1) startAge = 1;
  if (startAge > 10) startAge = 10;
  const monthStemIdx = HEAVENLY_STEMS.indexOf(args.monthStem);
  const monthBranchIdx = EARTHLY_BRANCHES.indexOf(args.monthBranch);
  const list = [];
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
      branchTenGod: getTenGod(args.dayStem, BRANCH_HIDDEN_STEMS[branch]?.\uC815\uAE30 || ""),
      stage12,
      "12unsung": stage12,
      sal: calculateSals(args.dayStem, args.dayBranch, branch)
    });
  }
  let current = null;
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
      diffDays: Number(diffDaysRaw.toFixed(6))
    }
  };
}
function calculateInternationalAge(birthDate, referenceDate) {
  let age = referenceDate.year - birthDate.year;
  const birthdayPassed = referenceDate.month > birthDate.month || referenceDate.month === birthDate.month && referenceDate.day >= birthDate.day;
  if (!birthdayPassed) age--;
  return age;
}
function calculateSeyun(centerYear, dayStem, count = 10) {
  const out = [];
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
      tenGodBranch: getTenGod(dayStem, BRANCH_HIDDEN_STEMS[branch]?.\uC815\uAE30 || ""),
      stage12: get12Stage(dayStem, branch, "bong")
    });
  }
  return out;
}
function calculateWolun(year, dayStem) {
  const yearStemIdx = mod(year - 4, 10);
  const startStem = YEAR_STEM_TO_MONTH_START_STEM_INDEX[yearStemIdx];
  const out = [];
  for (let i = 0; i < 12; i++) {
    const branchIdx = (2 + i) % 12;
    const stemIdx = (startStem + i) % 10;
    const stem = HEAVENLY_STEMS[stemIdx];
    const branch = EARTHLY_BRANCHES[branchIdx];
    const monthName = WOLUN_MONTH_NAMES[i];
    const stemTenGod = getTenGod(dayStem, stem);
    const branchTenGod = getTenGod(dayStem, BRANCH_HIDDEN_STEMS[branch]?.\uC815\uAE30 || "");
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
      "12unsung": stage12
    });
  }
  return out;
}
function calculateDayStrength(dayStem, monthBranch, fiveElements) {
  const dayElement = STEM_ELEMENT[dayStem];
  if (!dayElement) return { strength: "neutral", score: 50 };
  let score = 50;
  const monthElement = BRANCH_ELEMENT[monthBranch];
  if (monthElement === dayElement) score += 20;
  score += (fiveElements[dayElement] || 0) * 10;
  const supportMap = {
    \uBAA9: "\uC218",
    \uD654: "\uBAA9",
    \uD1A0: "\uD654",
    \uAE08: "\uD1A0",
    \uC218: "\uAE08"
  };
  const attackMap = {
    \uBAA9: "\uAE08",
    \uD654: "\uC218",
    \uD1A0: "\uBAA9",
    \uAE08: "\uD654",
    \uC218: "\uD1A0"
  };
  score += (fiveElements[supportMap[dayElement]] || 0) * 8;
  score -= (fiveElements[attackMap[dayElement]] || 0) * 8;
  const monthStage = get12Stage(dayStem, monthBranch, "bong");
  if (monthStage === "\uAC74\uB85D" || monthStage === "\uC81C\uC655") score += 15;
  if (monthStage === "\uC0AC" || monthStage === "\uC808" || monthStage === "\uBB18") score -= 15;
  if (score >= 70) return { strength: "strong", score };
  if (score <= 30) return { strength: "weak", score };
  return { strength: "neutral", score };
}
function determineGeukGuk(monthTenGod, score) {
  if (score >= 85) return "\uC885\uC655\uACA9";
  if (score <= 15) return "\uC885\uC57D\uACA9";
  if (["\uC815\uAD00", "\uD3B8\uAD00"].includes(monthTenGod)) return "\uAD00\uACA9";
  if (["\uC815\uC7AC", "\uD3B8\uC7AC"].includes(monthTenGod)) return "\uC7AC\uACA9";
  if (["\uC815\uC778", "\uD3B8\uC778"].includes(monthTenGod)) return "\uC778\uC218\uACA9";
  if (["\uC2DD\uC2E0", "\uC0C1\uAD00"].includes(monthTenGod)) return "\uC2DD\uC0C1\uACA9";
  if (["\uBE44\uACAC", "\uAC81\uC7AC"].includes(monthTenGod)) return "\uBE44\uAC81\uACA9";
  return "\uAE30\uD0C0";
}
function selectYongsin(dayStem, dayStrength, geukguk) {
  const rules = YONGSIN_RULES[dayStem];
  if (!rules) return [];
  if (geukguk === "\uC885\uC655\uACA9") return rules.weak;
  if (geukguk === "\uC885\uC57D\uACA9") return rules.strong;
  return dayStrength === "strong" ? rules.weak : rules.strong;
}
function calculateAdvancedSinsal(yearBranch, monthBranch, dayBranch, hourBranch, dayStem) {
  const gilsin = [];
  const hyungsin = [];
  const branches = [yearBranch, monthBranch, dayBranch, hourBranch];
  let cheonEul;
  if (["\u7532", "\u620A", "\u5E9A"].includes(dayStem)) cheonEul = ADVANCED_SINSAL.\uCC9C\uC744\uADC0\uC778["\u7532\u620A\u5E9A"];
  else if (["\u4E59", "\u5DF1"].includes(dayStem)) cheonEul = ADVANCED_SINSAL.\uCC9C\uC744\uADC0\uC778["\u4E59\u5DF1"];
  else if (["\u4E19", "\u4E01"].includes(dayStem)) cheonEul = ADVANCED_SINSAL.\uCC9C\uC744\uADC0\uC778["\u4E19\u4E01"];
  else if (["\u58EC", "\u7678"].includes(dayStem)) cheonEul = ADVANCED_SINSAL.\uCC9C\uC744\uADC0\uC778["\u58EC\u7678"];
  else if (dayStem === "\u8F9B") cheonEul = ADVANCED_SINSAL.\uCC9C\uC744\uADC0\uC778["\u8F9B"];
  if (cheonEul) {
    for (const b of branches) {
      if (cheonEul.includes(b)) gilsin.push("\uCC9C\uC744\uADC0\uC778");
    }
  }
  for (const [group, stem] of Object.entries(ADVANCED_SINSAL.\uC6D4\uB355\uADC0\uC778)) {
    if (group.includes(monthBranch) && stem === dayStem) {
      gilsin.push("\uC6D4\uB355\uADC0\uC778");
    }
  }
  const monthIndex = BRANCH_TO_MONTH_INDEX[monthBranch];
  if (monthIndex) {
    const label = MONTH_LABELS[monthIndex - 1];
    const stem = ADVANCED_SINSAL.\uCC9C\uB355\uADC0\uC778[label];
    if (stem && stem === dayStem) gilsin.push("\uCC9C\uB355\uADC0\uC778");
  }
  const yangin = ADVANCED_SINSAL.\uC591\uC778[dayStem];
  if (yangin && dayBranch === yangin) hyungsin.push("\uC591\uC778");
  for (const [group, value] of Object.entries(ADVANCED_SINSAL.\uD654\uAC1C)) {
    if (group.includes(dayBranch) && branches.includes(value)) gilsin.push("\uD654\uAC1C");
  }
  for (const [group, value] of Object.entries(ADVANCED_SINSAL.\uAC81\uC0B4)) {
    if (group.includes(dayBranch) && branches.includes(value)) hyungsin.push("\uAC81\uC0B4");
  }
  return {
    gilsin: [...new Set(gilsin)],
    hyungsin: [...new Set(hyungsin)]
  };
}
var DAY_MASTER_PROFILE = {
  \u7532: {
    archetype: "\uD070 \uB098\uBB34(\uAC70\uBAA9)",
    keywords: ["\uC8FC\uB3C4\uC801", "\uACE7\uC74C", "\uB9AC\uB354\uC2ED", "\uC131\uC7A5\uC9C0\uD5A5"],
    description: "\uC704\uB85C \uACE7\uAC8C \uBED7\uB294 \uD070 \uB098\uBB34\uCC98\uB7FC \uBA85\uBD84\uACFC \uC131\uC7A5\uC744 \uC911\uC2DC\uD558\uACE0 \uC55E\uC7A5\uC11C\uB294 \uAE30\uC9C8\uC785\uB2C8\uB2E4. \uC18C\uC2E0\uC774 \uB69C\uB837\uD55C \uB300\uC2E0 \uC735\uD1B5\uC131\uC774 \uBD80\uC871\uD574\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
  },
  \u4E59: {
    archetype: "\uD654\uCD08\xB7\uB369\uAD74",
    keywords: ["\uC720\uC5F0", "\uC12C\uC138", "\uC801\uC751\uB825", "\uC2E4\uC18D"],
    description: "\uD658\uACBD\uC5D0 \uBD80\uB4DC\uB7FD\uAC8C \uAC10\uAE30\uB294 \uB369\uAD74\uCC98\uB7FC \uC720\uC5F0\uD558\uACE0 \uD604\uC2E4\uC801\uC778 \uC801\uC751\uB825\uC774 \uAC15\uD569\uB2C8\uB2E4. \uC18D\uC740 \uAC15\uB2E8\uC774 \uC788\uC73C\uB098 \uC6B0\uC720\uBD80\uB2E8\uD574 \uBCF4\uC774\uAE30 \uC27D\uC2B5\uB2C8\uB2E4."
  },
  \u4E19: {
    archetype: "\uD0DC\uC591",
    keywords: ["\uBC1D\uC74C", "\uC5F4\uC815", "\uD45C\uD604\uB825", "\uAC1C\uBC29\uC801"],
    description: "\uB9CC\uBB3C\uC744 \uBE44\uCD94\uB294 \uD0DC\uC591\uCC98\uB7FC \uBC1D\uACE0 \uC5F4\uC815\uC801\uC774\uBA70 \uC790\uC2E0\uC744 \uC798 \uB4DC\uB7EC\uB0C5\uB2C8\uB2E4. \uC5D0\uB108\uC9C0\uAC00 \uD06C\uC9C0\uB9CC \uAE30\uBCF5\uACFC \uACFC\uC5F4\uC744 \uC870\uC2EC\uD574\uC57C \uD569\uB2C8\uB2E4."
  },
  \u4E01: {
    archetype: "\uCD1B\uBD88\xB7\uBCC4\uBE5B",
    keywords: ["\uB530\uB73B\uD568", "\uC12C\uC138", "\uC9D1\uC911", "\uD5CC\uC2E0"],
    description: "\uC5B4\uB460\uC744 \uBC1D\uD788\uB294 \uCD1B\uBD88\uCC98\uB7FC \uB530\uB73B\uD558\uACE0 \uC12C\uC138\uD558\uBA70 \uD55C\uACF3\uC5D0 \uBAB0\uC785\uD558\uB294 \uC9D1\uC911\uB825\uC774 \uC788\uC2B5\uB2C8\uB2E4. \uC608\uBBFC\uD558\uACE0 \uAC10\uC815 \uAE30\uBCF5\uC774 \uC788\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
  },
  \u620A: {
    archetype: "\uD070 \uC0B0\xB7\uB300\uC9C0",
    keywords: ["\uB4EC\uC9C1\uD568", "\uD3EC\uC6A9", "\uC2E0\uB8B0", "\uC911\uC2EC"],
    description: "\uB113\uC740 \uB300\uC9C0\uCC98\uB7FC \uB4EC\uC9C1\uD558\uACE0 \uD3EC\uC6A9\uB825\uC774 \uC788\uC5B4 \uC0AC\uB78C\uC774 \uBAA8\uC785\uB2C8\uB2E4. \uC911\uC2EC\uC744 \uC798 \uC7A1\uC9C0\uB9CC \uACE0\uC9D1\uC2A4\uB7FD\uACE0 \uBCC0\uD654\uAC00 \uB290\uB9B4 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
  },
  \u5DF1: {
    archetype: "\uB17C\uBC2D\xB7\uC815\uC6D0",
    keywords: ["\uC628\uD654", "\uD604\uC2E4\uC801", "\uC138\uC2EC", "\uC2E4\uC6A9"],
    description: "\uACE1\uC2DD\uC744 \uD0A4\uC6B0\uB294 \uBC2D\uCC98\uB7FC \uC628\uD654\uD558\uACE0 \uD604\uC2E4\uC801\uC774\uBA70 \uC138\uC2EC\uD558\uAC8C \uAD00\uB9AC\uD569\uB2C8\uB2E4. \uBC30\uB824\uC2EC\uC774 \uD06C\uC9C0\uB9CC \uAC71\uC815\uC774 \uB9CE\uACE0 \uC18C\uC2EC\uD574\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
  },
  \u5E9A: {
    archetype: "\uAC15\uCCA0\xB7\uC6D0\uC11D",
    keywords: ["\uACB0\uB2E8", "\uC758\uB9AC", "\uCD94\uC9C4\uB825", "\uAC1C\uD601"],
    description: "\uB2E4\uB4EC\uC5B4\uC9C0\uC9C0 \uC54A\uC740 \uAC15\uCCA0\uCC98\uB7FC \uACB0\uB2E8\uB825\uACFC \uC758\uB9AC\uAC00 \uAC15\uD558\uACE0 \uCD94\uC9C4\uB825\uC774 \uC88B\uC2B5\uB2C8\uB2E4. \uAC15\uC9C1\uD568\uC774 \uC9C0\uB098\uCE58\uBA74 \uCDA9\uB3CC\uC744 \uBD80\uB97C \uC218 \uC788\uC2B5\uB2C8\uB2E4."
  },
  \u8F9B: {
    archetype: "\uBCF4\uC11D\xB7\uCE7C\uB0A0",
    keywords: ["\uC608\uB9AC", "\uC138\uB828", "\uC644\uC131\uB3C4", "\uC790\uC874\uC2EC"],
    description: "\uC798 \uB2E4\uB4EC\uC5B4\uC9C4 \uBCF4\uC11D\uCC98\uB7FC \uC608\uB9AC\uD558\uACE0 \uC138\uB828\uB418\uBA70 \uC644\uC131\uB3C4\uB97C \uCD94\uAD6C\uD569\uB2C8\uB2E4. \uC790\uC874\uC2EC\uC774 \uAC15\uD558\uACE0 \uC608\uBBFC\xB7\uBE44\uD310\uC801\uC73C\uB85C \uD750\uB974\uAE30 \uC27D\uC2B5\uB2C8\uB2E4."
  },
  \u58EC: {
    archetype: "\uD070 \uBB3C\xB7\uBC14\uB2E4",
    keywords: ["\uC9C0\uD61C", "\uD3EC\uC6A9", "\uC720\uC5F0", "\uC2A4\uCF00\uC77C"],
    description: "\uD750\uB974\uB294 \uD070 \uBB3C\uCC98\uB7FC \uC9C0\uD61C\uB86D\uACE0 \uD3EC\uC6A9\uB825\uC774 \uD06C\uBA70 \uC0AC\uACE0\uC758 \uC2A4\uCF00\uC77C\uC774 \uB113\uC2B5\uB2C8\uB2E4. \uC790\uC720\uB85C\uC6B4 \uB300\uC2E0 \uC0B0\uB9CC\uD574\uC9C0\uAE30 \uC27D\uC2B5\uB2C8\uB2E4."
  },
  \u7678: {
    archetype: "\uC774\uC2AC\xB7\uBE44",
    keywords: ["\uCD1D\uBA85", "\uC9C1\uAD00", "\uC138\uC2EC", "\uD1B5\uCC30"],
    description: "\uB9CC\uBB3C\uC744 \uC801\uC2DC\uB294 \uC774\uC2AC\uBE44\uCC98\uB7FC \uCD1D\uBA85\uD558\uACE0 \uC9C1\uAD00\uC774 \uB6F0\uC5B4\uB098\uBA70 \uC138\uC2EC\uD569\uB2C8\uB2E4. \uAC10\uC815\uC774 \uC5EC\uB9AC\uACE0 \uC18C\uADF9\uC801\uC73C\uB85C \uBCF4\uC77C \uC218 \uC788\uC2B5\uB2C8\uB2E4."
  }
};
var TEN_GOD_GROUP_OF = {
  \uBE44\uACAC: "\uBE44\uAC81",
  \uAC81\uC7AC: "\uBE44\uAC81",
  \uC2DD\uC2E0: "\uC2DD\uC0C1",
  \uC0C1\uAD00: "\uC2DD\uC0C1",
  \uD3B8\uC7AC: "\uC7AC\uC131",
  \uC815\uC7AC: "\uC7AC\uC131",
  \uD3B8\uAD00: "\uAD00\uC131",
  \uC815\uAD00: "\uAD00\uC131",
  \uD3B8\uC778: "\uC778\uC131",
  \uC815\uC778: "\uC778\uC131"
};
var TEN_GOD_GROUP_PROFILE = {
  \uBE44\uAC81: {
    keywords: ["\uC8FC\uCCB4\uC131", "\uB3C5\uB9BD\uC2EC", "\uACBD\uC7C1\uC2EC", "\uCD94\uC9C4\uB825"],
    description: "\uC790\uAE30 \uC8FC\uAD00\uC774 \uB69C\uB837\uD558\uACE0 \uB3C5\uB9BD\uC801\uC774\uBA70 \uACBD\uC7C1 \uC0C1\uD669\uC5D0\uC11C \uD798\uC744 \uB0C5\uB2C8\uB2E4.",
    strength: "\uB69C\uB837\uD55C \uC790\uAE30 \uC8FC\uAD00\uACFC \uCD94\uC9C4\uB825, \uC2B9\uBD80\uC695",
    caution: "\uACE0\uC9D1\xB7\uB3C5\uC120, \uC7AC\uBB3C\uC774\uB098 \uC778\uAC04\uAD00\uACC4\uC5D0\uC11C\uC758 \uB2E4\uD23C"
  },
  \uC2DD\uC0C1: {
    keywords: ["\uD45C\uD604\uB825", "\uCC3D\uC758\uC131", "\uD65C\uB3D9\uC131", "\uC790\uC720"],
    description: "\uC7AC\uB2A5\uC744 \uBC16\uC73C\uB85C \uD45C\uD604\uD558\uACE0 \uC0C8\uB85C\uC6B4 \uAC83\uC744 \uB9CC\uB4E4\uC5B4\uB0B4\uB294 \uD65C\uB3D9\uC131\uC774 \uB3CB\uBCF4\uC785\uB2C8\uB2E4.",
    strength: "\uD48D\uBD80\uD55C \uD45C\uD604\uB825\uACFC \uCC3D\uC758\uC131, \uC21C\uBC1C\uB825",
    caution: "\uC989\uD765\uC801 \uC5B8\uD589\uACFC \uAD6C\uC124, \uB9C8\uBB34\uB9AC \uBD80\uC871"
  },
  \uC7AC\uC131: {
    keywords: ["\uD604\uC2E4\uAC10\uAC01", "\uBAA9\uD45C\uC9C0\uD5A5", "\uC2E4\uD589\uB825", "\uAD00\uB9AC"],
    description: "\uD604\uC2E4 \uAC10\uAC01\uC774 \uBC1D\uACE0 \uBAA9\uD45C\uC640 \uC790\uC6D0\uC744 \uC2E4\uC9C8\uC801\uC73C\uB85C \uB2E4\uB8E8\uB294 \uB370 \uB2A5\uD569\uB2C8\uB2E4.",
    strength: "\uD604\uC2E4\uC801 \uBAA9\uD45C \uC124\uC815\uACFC \uC790\uC6D0 \uC6B4\uC6A9\uB825",
    caution: "\uACFC\uC695\uACFC \uACC4\uC0B0\uC801 \uD0DC\uB3C4, \uC77C\uC744 \uB108\uBB34 \uBC8C\uC774\uB294 \uAC83"
  },
  \uAD00\uC131: {
    keywords: ["\uCC45\uC784\uAC10", "\uC808\uC81C", "\uBA85\uC608", "\uC870\uC9C1\uB825"],
    description: "\uCC45\uC784\uACFC \uC6D0\uCE59\uC744 \uC911\uC2DC\uD558\uACE0 \uC870\uC9C1\xB7\uADDC\uBC94 \uC548\uC5D0\uC11C \uC790\uAE30\uB97C \uAD00\uB9AC\uD569\uB2C8\uB2E4.",
    strength: "\uAC15\uD55C \uCC45\uC784\uAC10\uACFC \uC790\uAE30 \uC808\uC81C, \uC2E0\uB8B0\uAC10",
    caution: "\uACBD\uC9C1\uB428\uACFC \uC555\uBC15\uAC10, \uC9C0\uB098\uCE5C \uB208\uCE58 \uBCF4\uAE30"
  },
  \uC778\uC131: {
    keywords: ["\uC218\uC6A9\uC131", "\uD559\uC2B5", "\uC0AC\uACE0\uB825", "\uBC30\uB824"],
    description: "\uBC1B\uC544\uB4E4\uC774\uACE0 \uBC30\uC6B0\uBA70 \uAE4A\uC774 \uC0DD\uAC01\uD558\uB294 \uD798\uC774 \uAC15\uD558\uACE0 \uC815\uC2E0\uC801 \uAC00\uCE58\uB97C \uC911\uC2DC\uD569\uB2C8\uB2E4.",
    strength: "\uD0D0\uAD6C\uC2EC\uACFC \uD559\uC2B5\uB825, \uBC30\uB824\uC2EC",
    caution: "\uC0DD\uAC01 \uACFC\uC789\uACFC \uC2E4\uD589 \uC9C0\uC5F0, \uC758\uC874\uC801 \uD0DC\uB3C4"
  }
};
var ELEMENT_TEMPERAMENT = {
  \uBAA9: "\uC131\uC7A5\uACFC \uD655\uC7A5\uC744 \uCD94\uAD6C\uD558\uACE0 \uC778\uC815\uC774 \uB9CE\uC740",
  \uD654: "\uBC1D\uACE0 \uC5F4\uC815\uC801\uC774\uBA70 \uD45C\uD604\uC774 \uD65C\uBC1C\uD55C",
  \uD1A0: "\uC548\uC815\uC801\uC774\uACE0 \uD3EC\uC6A9\uB825 \uC788\uC73C\uBA70 \uC911\uC7AC\uD558\uB294",
  \uAE08: "\uC6D0\uCE59\uC801\uC774\uACE0 \uACB0\uB2E8\uB825 \uC788\uC73C\uBA70 \uC758\uB9AC\uB97C \uC911\uC2DC\uD558\uB294",
  \uC218: "\uCD1D\uBA85\uD558\uACE0 \uC720\uC5F0\uD558\uBA70 \uD1B5\uCC30\uB825 \uC788\uB294"
};
function analyzePersonality(args) {
  const { dayStem, tenGods, fiveElements, dayStrength, sinsal } = args;
  const stemIdx = HEAVENLY_STEMS.indexOf(dayStem);
  const stemKo = HEAVENLY_STEMS_KO[stemIdx] || dayStem;
  const element = STEM_ELEMENT[dayStem] || "";
  const yinYang = STEM_YINYANG[dayStem] || "\uC591";
  const dm = DAY_MASTER_PROFILE[dayStem] || {
    archetype: "-",
    keywords: [],
    description: ""
  };
  const distribution = {
    \uBE44\uAC81: 0,
    \uC2DD\uC0C1: 0,
    \uC7AC\uC131: 0,
    \uAD00\uC131: 0,
    \uC778\uC131: 0
  };
  const tenGodValues = [
    tenGods.year.stem,
    tenGods.month.stem,
    tenGods.hour.stem,
    tenGods.year.branch,
    tenGods.month.branch,
    tenGods.day.branch,
    tenGods.hour.branch
  ];
  for (const value of tenGodValues) {
    const group = TEN_GOD_GROUP_OF[value];
    if (group) distribution[group] += 1;
  }
  const groupOrder = ["\uBE44\uAC81", "\uC2DD\uC0C1", "\uC7AC\uC131", "\uAD00\uC131", "\uC778\uC131"];
  const dominant = groupOrder.reduce(
    (a, b) => distribution[a] >= distribution[b] ? a : b
  );
  const dominantProfile = TEN_GOD_GROUP_PROFILE[dominant];
  const elementOrder = ["\uBAA9", "\uD654", "\uD1A0", "\uAE08", "\uC218"];
  const strongest = elementOrder.reduce(
    (a, b) => (fiveElements[a] || 0) >= (fiveElements[b] || 0) ? a : b
  );
  const weakest = elementOrder.reduce(
    (a, b) => (fiveElements[a] || 0) <= (fiveElements[b] || 0) ? a : b
  );
  const strengths = [
    dominantProfile.strength,
    `${dm.keywords.slice(0, 2).join("\xB7")} \uAE30\uC9C8 (${dm.archetype})`
  ];
  const cautions = [dominantProfile.caution];
  if (dayStrength.strength === "strong") {
    strengths.push("\uC790\uAE30 \uD655\uC2E0\uACFC \uBC00\uC5B4\uBD99\uC774\uB294 \uD798\uC774 \uAC15\uD568");
    cautions.push("\uAE30\uC6B4\uC774 \uAC15\uD55C \uD3B8\uC774\uB77C \uC8FC\uC7A5\uC774 \uC55E\uC124 \uC218 \uC788\uC73C\uB2C8 \uD798\uC744 \uB098\uB220 \uC4F0\uB294 \uBC30\uBD84\uC774 \uD544\uC694\uD569\uB2C8\uB2E4");
  } else if (dayStrength.strength === "weak") {
    strengths.push("\uC8FC\uBCC0\uACFC \uD611\uB825\uD558\uACE0 \uD761\uC218\uD558\uB294 \uC720\uC5F0\uD568");
    cautions.push("\uAE30\uC6B4\uC774 \uC57D\uD55C \uD3B8\uC774\uB77C \uD658\uACBD\uACFC \uC870\uB825\uC790 \uC120\uD0DD\uC774 \uC911\uC694\uD569\uB2C8\uB2E4");
  }
  if (sinsal.gilsin.length) {
    strengths.push(`\uAE38\uC2E0(${sinsal.gilsin.join(", ")})\uC758 \uC870\uB825`);
  }
  if (sinsal.hyungsin.length) {
    cautions.push(`\uC8FC\uC758 \uC2E0\uC0B4(${sinsal.hyungsin.join(", ")}) \uAD00\uB828 \uAE30\uBCF5`);
  }
  const temperamentDesc = `\uC624\uD589\uC0C1 ${strongest} \uAE30\uC6B4\uC774 \uAC15\uD574 ${ELEMENT_TEMPERAMENT[strongest] || ""} \uBA74\uBAA8\uAC00 \uBD80\uAC01\uB418\uACE0, ${weakest} \uAE30\uC6B4\uC740 \uC0C1\uB300\uC801\uC73C\uB85C \uC57D\uD569\uB2C8\uB2E4.`;
  const summary = `\uC77C\uAC04\uC774 ${dayStem}(${stemKo}${element}, ${yinYang})\uC785\uB2C8\uB2E4. ${dm.description}
\uAC00\uC7A5 \uB450\uB4DC\uB7EC\uC9C4 \uAE30\uC6B4\uC740 ${dominant}\uC73C\uB85C, ${dominantProfile.description}
` + temperamentDesc;
  return {
    dayMaster: {
      stem: dayStem,
      stemKo,
      element,
      yinYang,
      archetype: dm.archetype,
      keywords: dm.keywords,
      description: dm.description
    },
    tenGodProfile: {
      dominant,
      distribution,
      keywords: dominantProfile.keywords,
      description: dominantProfile.description
    },
    temperament: {
      strongest,
      weakest,
      description: temperamentDesc
    },
    strengths,
    cautions,
    summary
  };
}
function generateInterpretation(args) {
  let text = "";
  switch (args.geukguk) {
    case "\uAD00\uACA9":
      text += "\uAD00\uACA9\uC73C\uB85C \uBD84\uB958\uB429\uB2C8\uB2E4. \uACF5\uC801 \uCC45\uC784\uACFC \uC6D0\uCE59\uC744 \uC0B4\uB9B4\uC218\uB85D \uC6B4\uC774 \uC5F4\uB9BD\uB2C8\uB2E4.\n";
      break;
    case "\uC7AC\uACA9":
      text += "\uC7AC\uACA9 \uAD6C\uC870\uC785\uB2C8\uB2E4. \uD604\uC2E4 \uAC10\uAC01\uACFC \uC790\uC6D0 \uC6B4\uC6A9\uB825\uC774 \uD575\uC2EC \uAC15\uC810\uC785\uB2C8\uB2E4.\n";
      break;
    case "\uC778\uC218\uACA9":
      text += "\uC778\uC218\uACA9 \uAD6C\uC870\uC785\uB2C8\uB2E4. \uD559\uC2B5, \uC5F0\uAD6C, \uBB38\uC11C, \uC0C1\uB2F4 \uC601\uC5ED\uC5D0\uC11C \uC7A5\uC810\uC774 \uD07D\uB2C8\uB2E4.\n";
      break;
    case "\uC2DD\uC0C1\uACA9":
      text += "\uC2DD\uC0C1\uACA9 \uAD6C\uC870\uC785\uB2C8\uB2E4. \uD45C\uD604\uB825\uACFC \uCC3D\uC758\uC131\uC758 \uBC1C\uD604\uC774 \uC911\uC694\uD569\uB2C8\uB2E4.\n";
      break;
    case "\uBE44\uAC81\uACA9":
      text += "\uBE44\uAC81\uACA9 \uAD6C\uC870\uC785\uB2C8\uB2E4. \uCD94\uC9C4\uB825\uC740 \uAC15\uD558\uC9C0\uB9CC \uD611\uC5C5 \uADE0\uD615 \uAD00\uB9AC\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.\n";
      break;
    case "\uC885\uC655\uACA9":
      text += "\uC77C\uAC04\uC774 \uB9E4\uC6B0 \uAC15\uD55C \uC885\uC655\uACA9\uC785\uB2C8\uB2E4. \uAE30\uC6B4\uC758 \uBC29\uCD9C\uACFC \uC808\uC81C\uC758 \uADE0\uD615\uC774 \uD575\uC2EC\uC785\uB2C8\uB2E4.\n";
      break;
    case "\uC885\uC57D\uACA9":
      text += "\uC77C\uAC04\uC774 \uC57D\uD55C \uC885\uC57D\uACA9\uC785\uB2C8\uB2E4. \uBCF4\uC644 \uC790\uC6D0 \uD655\uBCF4\uC640 \uD658\uACBD \uC120\uD0DD\uC774 \uC911\uC694\uD569\uB2C8\uB2E4.\n";
      break;
    default:
      text += "\uBCF5\uD569 \uAD6C\uC870\uC785\uB2C8\uB2E4. \uD2B9\uC815 \uB2E8\uC77C \uACA9\uAD6D\uBCF4\uB2E4 \uC804\uCCB4 \uADE0\uD615 \uD574\uC11D\uC774 \uC911\uC694\uD569\uB2C8\uB2E4.\n";
      break;
  }
  const strongest = Object.keys(args.fiveElements).reduce(
    (a, b) => args.fiveElements[a] >= args.fiveElements[b] ? a : b
  );
  const traits = {
    \uBAA9: "\uC131\uC7A5\xB7\uD655\uC7A5 \uC9C0\uD5A5",
    \uD654: "\uD45C\uD604\xB7\uCD94\uC9C4 \uC9C0\uD5A5",
    \uD1A0: "\uC548\uC815\xB7\uC911\uC7AC \uC9C0\uD5A5",
    \uAE08: "\uC6D0\uCE59\xB7\uACB0\uB2E8 \uC9C0\uD5A5",
    \uC218: "\uD1B5\uCC30\xB7\uC720\uC5F0 \uC9C0\uD5A5"
  };
  text += `
\uAC00\uC7A5 \uAC15\uD55C \uC624\uD589\uC740 ${strongest}(${args.fiveElements[strongest]}\uAC1C)\uC774\uBA70, ${traits[strongest]} \uC131\uD5A5\uC774 \uB450\uB4DC\uB7EC\uC9D1\uB2C8\uB2E4.`;
  if (args.sinsal.gilsin.length) {
    text += `
\uAE38\uC2E0: ${args.sinsal.gilsin.join(", ")}`;
  }
  if (args.sinsal.hyungsin.length) {
    text += `
\uC8FC\uC758 \uC2E0\uC0B4: ${args.sinsal.hyungsin.join(", ")}`;
  }
  return text;
}

// src/calculate.ts
function calculateSaju(input) {
  const normalizedInput = normalizeInput(input);
  validateInput(normalizedInput);
  const normalizedBirth = normalizeBirthDate({
    calendar: normalizedInput.calendar,
    leap: normalizedInput.leap,
    timezone: normalizedInput.timezone,
    longitude: normalizedInput.longitude,
    year: normalizedInput.year,
    month: normalizedInput.month,
    day: normalizedInput.day,
    hour: normalizedInput.hour,
    minute: normalizedInput.minute,
    applyLocalMeanTime: normalizedInput.applyLocalMeanTime
  });
  const calcBirth = normalizedBirth.calculation;
  const fourPillars = calculateFourPillars({
    year: calcBirth.year,
    month: calcBirth.month,
    day: calcBirth.day,
    hour: calcBirth.hour,
    minute: calcBirth.minute
  });
  const refNow = normalizedInput.now ? new Date(normalizedInput.now) : /* @__PURE__ */ new Date();
  const currentDate = getKstNowDate(refNow);
  const analysis = analyzeChart({
    fourPillars,
    normalizedBirth,
    normalizedInput,
    currentDate
  });
  const reference = buildReferenceCodes(refNow);
  const result = {
    input: {
      year: normalizedInput.year,
      month: normalizedInput.month,
      day: normalizedInput.day,
      hour: normalizedInput.hour,
      minute: normalizedInput.minute,
      gender: normalizedInput.gender,
      calendar: normalizedInput.calendar,
      leap: normalizedInput.leap,
      timezone: normalizedInput.timezone,
      applyLocalMeanTime: normalizedInput.applyLocalMeanTime
    },
    normalized: normalizedBirth,
    solar: { ...normalizedBirth.solar },
    pillars: analysis.pillars,
    pillarDetails: analysis.pillarDetails,
    dayStem: analysis.dayStem,
    dayBranch: analysis.dayBranch,
    gongmang: analysis.gongmang,
    fiveElements: analysis.fiveElements,
    tenGods: analysis.tenGods,
    stages12: analysis.stages12,
    stemRelations: analysis.stemRelations,
    branchRelations: analysis.branchRelations,
    sals: analysis.sals,
    currentAge: analysis.currentAge,
    currentYear: analysis.currentYear,
    daeun: analysis.daeun,
    seyun: analysis.seyun,
    wolun: analysis.wolun,
    advanced: analysis.advanced,
    reference,
    toMarkdown: null,
    toCompact: null
  };
  result.toMarkdown = () => generateMarkdownSummary(result);
  result.toCompact = () => generateCompactText(result);
  return result;
}
export {
  calculateSaju,
  lunarToSolar,
  solarToLunar
};
