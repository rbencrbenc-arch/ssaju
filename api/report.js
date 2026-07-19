// Vercel serverless function: 사주 데이터 -> Claude API -> 사람 말로 풀어주는 해석 리포트
// 환경변수: ANTHROPIC_API_KEY (필수), SAJU_MODEL (선택, 기본 haiku 4.5)

const TOPIC_GUIDE = {
  personality: {
    title: "성격",
    format: `## 한마디로
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
(기억에 남을 응원 한 문장)`,
  },
  today: {
    title: "오늘의 운세",
    format: `## 오늘 한마디
(오늘 세운/일진 기준 총평 두 문장)

## 총운 / 연애 / 재물 / 관계
- 총운: ...
- 연애: ...
- 재물: ...
- 관계: ...

## 오늘의 팁
(행동 하나 + 조심할 것 하나)`,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method", message: "POST만 지원합니다." });
    return;
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    res.status(503).json({
      error: "no_key",
      message: "서버에 ANTHROPIC_API_KEY가 아직 설정되지 않았습니다. Vercel 환경변수에 키를 추가해 주세요.",
    });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const compact = body.compact;
    const topic = TOPIC_GUIDE[body.topic] ? body.topic : "personality";
    if (!compact || typeof compact !== "string") {
      res.status(400).json({ error: "bad_input", message: "compact 사주 텍스트가 필요합니다." });
      return;
    }

    const guide = TOPIC_GUIDE[topic];
    const model = process.env.SAJU_MODEL || "claude-haiku-4-5-20251001";

    const system =
      "당신은 사주명리 20년 경력의 따뜻하고 현실적인 상담가입니다. " +
      "주어진 사주 데이터(만세력 계산 결과)에만 근거해 해석하고, 데이터에 없는 구체적 사건이나 미래를 단정하지 않습니다. " +
      "운명론적 단정 대신 '경향'과 '조언'으로 말합니다. 의료·법률·투자의 확정적 조언은 피하고 참고용임을 전제합니다. " +
      "한국어 존댓말로, 따뜻하지만 두루뭉술하지 않고 구체적으로 씁니다. 전문용어(십성·격국 등)는 쉬운 말로 풀어 씁니다.";

    const userPrompt =
      `아래는 한 사람의 사주 분석 데이터입니다(ssaju 엔진 계산 결과). 이 데이터에만 근거해 '${guide.title}' 리포트를 작성하세요.\n\n` +
      "형식(마크다운, 아래 구조를 지키되 자연스럽게):\n" +
      guide.format +
      "\n\n--- 사주 데이터 ---\n" +
      String(compact).slice(0, 4000);

    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1400,
        system,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      res.status(502).json({ error: "upstream", message: "AI 응답 실패", detail: detail.slice(0, 400) });
      return;
    }

    const data = await upstream.json();
    const text = (data.content || []).map((b) => b.text || "").join("").trim();
    res.status(200).json({ text, model, topic });
  } catch (e) {
    res.status(500).json({ error: "server", message: String((e && e.message) || e) });
  }
}
