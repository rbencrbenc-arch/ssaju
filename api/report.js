// Vercel serverless function: 사주 데이터 -> Google Gemini API -> 사람 말로 풀어주는 해석 리포트
// 주제: personality(성격) / today(오늘의 운세) / match(궁합)
// 환경변수: GEMINI_API_KEY (필수), SAJU_MODEL (선택, 기본 gemini-2.5-flash)

const SYSTEM =
  "당신은 사주명리 20년 경력의 따뜻하고 현실적인 상담가입니다. " +
  "주어진 사주 데이터(만세력 계산 결과)에만 근거해 해석하고, 데이터에 없는 구체적 사건이나 미래를 단정하지 않습니다. " +
  "운명론적 단정 대신 '경향'과 '조언'으로 말합니다. 의료·법률·투자의 확정적 조언은 피하고 참고용임을 전제합니다. " +
  "한국어 존댓말로, 따뜻하지만 두루뭉술하지 않고 구체적으로 씁니다. 전문용어(십성·격국 등)는 쉬운 말로 풀어 씁니다.";

const PERSONALITY_FORMAT = `## 한마디로
(이 사람을 두 문장으로 압축)

## 타고난 기질
(일간·오행·십성 근거로 3~4문장. 왜 그런지 근거를 살짝 곁들여서)

## 강점
- (3개, 각 한 줄)

## 조심할 점
- (2~3개, 비난이 아니라 따뜻한 코칭 톤)

## 관계 속의 나
(연애·일에서 남에게 어떻게 보이고, 어떤 사람과 잘 맞는지 2~3문장)

## 한 줄 조언
(기억에 남을 응원 한 문장)`;

const TODAY_FORMAT = `## 오늘 한마디
(오늘 세운/일진과 원국의 관계로 본 총평 두 문장)

## 오늘의 흐름
- 총운: ...
- 연애: ...
- 재물: ...
- 관계/일: ...

## 오늘의 팁
(오늘 하면 좋은 것 하나 + 조심할 것 하나)`;

const MATCH_FORMAT = `## 궁합 한마디
(두 사람 관계를 두 문장으로)

## 궁합 점수
**NN / 100** — (점수 근거 한 줄. 오행 상생/상극, 일간 관계 기준)

## 잘 맞는 점
- (2~3개)

## 부딪히기 쉬운 점
- (2~3개, 부드러운 코칭 톤)

## 관계를 위한 조언
(서로를 위한 현실 조언 2~3문장)`;

function clamp(s) {
  return String(s || "").slice(0, 3500);
}

function buildPrompt(body) {
  const topic = body.topic;
  if (topic === "match") {
    const nameA = String(body.nameA || "A").slice(0, 20);
    const nameB = String(body.nameB || "B").slice(0, 20);
    return {
      title: "궁합",
      text:
        `아래는 두 사람의 사주 분석 데이터입니다. 두 데이터에만 근거해 '${nameA}'님과 '${nameB}'님의 궁합 리포트를 작성하세요.\n\n` +
        "형식(마크다운, 구조 유지하되 자연스럽게):\n" + MATCH_FORMAT +
        `\n\n--- ${nameA} 사주 ---\n` + clamp(body.compactA) +
        `\n\n--- ${nameB} 사주 ---\n` + clamp(body.compactB),
    };
  }

  const name = String(body.name || "").slice(0, 20);
  const who = name ? `'${name}'님` : "이 사람";
  if (topic === "today") {
    return {
      title: "오늘의 운세",
      text:
        `아래는 ${who}의 사주 분석 데이터입니다(세운·월운·오늘 일진 포함). 이 데이터에만 근거해 '오늘의 운세' 리포트를 작성하세요.\n\n` +
        "형식(마크다운):\n" + TODAY_FORMAT +
        "\n\n--- 사주 데이터 ---\n" + clamp(body.compact),
    };
  }
  // personality (default)
  return {
    title: "성격",
    text:
      `아래는 ${who}의 사주 분석 데이터입니다. 이 데이터에만 근거해 '성격' 리포트를 작성하세요.` +
      (name ? ` 리포트는 '${name}님은'으로 자연스럽게 부르며 씁니다.` : "") + "\n\n" +
      "형식(마크다운):\n" + PERSONALITY_FORMAT +
      "\n\n--- 사주 데이터 ---\n" + clamp(body.compact),
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method", message: "POST만 지원합니다." });
    return;
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    res.status(503).json({
      error: "no_key",
      message: "서버에 GEMINI_API_KEY가 아직 설정되지 않았습니다. Vercel 환경변수에 키를 추가해 주세요.",
    });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const topic = ["personality", "today", "match"].includes(body.topic) ? body.topic : "personality";

    if (topic === "match") {
      if (!body.compactA || !body.compactB) {
        res.status(400).json({ error: "bad_input", message: "두 사람의 사주 데이터가 필요합니다." });
        return;
      }
    } else if (!body.compact || typeof body.compact !== "string") {
      res.status(400).json({ error: "bad_input", message: "compact 사주 텍스트가 필요합니다." });
      return;
    }

    const prompt = buildPrompt({ ...body, topic });

    // 모델이 신규 사용자에게 막히거나(404) 무료 한도가 0(429)이면 다음 후보로 넘어간다.
    // '-latest' 별칭은 구글이 최신 모델로 자동 연결해줘서 모델 교체에도 안 깨진다.
    const candidates = [];
    if (process.env.SAJU_MODEL) candidates.push(process.env.SAJU_MODEL);
    for (const m of [
      "gemini-flash-latest",
      "gemini-flash-lite-latest",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
    ]) {
      if (!candidates.includes(m)) candidates.push(m);
    }

    const payload = JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: "user", parts: [{ text: prompt.text }] }],
      generationConfig: { maxOutputTokens: 1800, temperature: 0.9 },
    });

    let last = { status: 0, detail: "" };
    for (const model of candidates) {
      const upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        { method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": key }, body: payload },
      );

      if (upstream.ok) {
        const data = await upstream.json();
        const cand = (data.candidates && data.candidates[0]) || {};
        const text = ((cand.content && cand.content.parts) || []).map((p) => p.text || "").join("").trim();
        if (text) {
          res.status(200).json({ text, model, topic });
          return;
        }
        const reason = cand.finishReason || (data.promptFeedback && data.promptFeedback.blockReason) || "empty";
        res.status(502).json({ error: "empty", message: `AI가 응답을 생성하지 못했습니다 (${reason}, model ${model}).` });
        return;
      }

      const detail = await upstream.text();
      last = { status: upstream.status, detail };
      // 404(모델 없음)·429(한도 0)면 다음 모델 시도. 그 외(400 키오류·403 권한)는 모델 바꿔도 안 되므로 중단.
      if (upstream.status !== 404 && upstream.status !== 429) break;
    }

    res.status(502).json({
      error: "upstream",
      message: `AI 응답 실패 (HTTP ${last.status}) — 사용 가능한 모델을 찾지 못했습니다`,
      detail: String(last.detail).slice(0, 600),
    });
  } catch (e) {
    res.status(500).json({ error: "server", message: String((e && e.message) || e) });
  }
}
