const axios = require("axios");

function cleanJsonText(text = "") {
  return String(text)
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

function safeJsonParse(text = "") {
  const cleaned = cleanJsonText(text);

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw err;
  }
}

function normalizeFourChoiceQuiz(data = {}) {
  return {
    question: String(data.question || "").trim(),
    option_1: String(data.option_1 || "").trim(),
    option_2: String(data.option_2 || "").trim(),
    option_3: String(data.option_3 || "").trim(),
    option_4: String(data.option_4 || "").trim(),
    answer: Number(data.answer),
    explanation: String(data.explanation || "").trim(),
  };
}

async function requestGroq(prompt) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY가 없습니다.");
  }

  const res = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return res.data?.choices?.[0]?.message?.content?.trim() || "";
}

/* =========================
  오답 해설 생성
========================= */
exports.generateQuizExplanation = async ({
  question,
  option_1,
  option_2,
  option_3,
  option_4,
  correctAnswer,
  selectedAnswer,
  difficulty,
  fallbackExplanation,
}) => {
  try {
    const prompt = `
당신은 초보 투자자를 위한 한국어 퀴즈 해설 코치입니다.

규칙:
- 한국어
- 3문장 이내
- 초보자도 이해 가능하게
- 정답이 왜 맞는지, 사용자가 왜 틀렸는지 짧게 설명
- 불필요한 인사말 금지
- 마크다운 금지

난이도: ${difficulty}

문제:
${question}

보기:
1번: ${option_1}
2번: ${option_2}
3번: ${option_3}
4번: ${option_4}

정답: ${correctAnswer}번
사용자 선택: ${selectedAnswer}번

기존 해설:
${fallbackExplanation || "없음"}
    `.trim();

    const result = await requestGroq(prompt);
    return result || fallbackExplanation || "해설을 생성하지 못했습니다.";
  } catch (err) {
    console.error("generateQuizExplanation error =", err.message);
    return fallbackExplanation || "해설을 생성하지 못했습니다.";
  }
};

/* =========================
  객관식 퀴즈 생성
========================= */
exports.generateQuizFromKeywords = async ({
  keywords = [],
  difficulty = "하",
  seedQuestions = [],
}) => {
  const keywordText = Array.isArray(keywords) ? keywords.join(", ") : "";
  const seedText = Array.isArray(seedQuestions) && seedQuestions.length > 0
    ? seedQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")
    : "없음";

  const prompt = `
당신은 한국 주식/투자 교육 플랫폼의 퀴즈 출제자입니다.

목표:
- 초보~중급 사용자를 위한 4지선다 객관식 1문제를 JSON으로 생성
- 기존 문제와 너무 유사하게 복붙하지 말고, 개념은 이어가되 새 문제로 만들 것
- 한국어만 사용

출제 기준:
- 난이도: ${difficulty}
- 키워드: ${keywordText || "주식, 투자, 기초"}
- 참고용 기존 문제:
${seedText}

반드시 지킬 규칙:
- 출력은 JSON 객체 하나만
- question: 문자열
- option_1 ~ option_4: 문자열
- answer: 1,2,3,4 중 하나의 숫자
- explanation: 초보자도 이해 가능한 2~3문장 설명
- 보기는 서로 겹치지 않게
- 정답은 명확해야 함
- 너무 모호한 표현 금지
- 마크다운 금지
- 코드블록 금지

예시 형식:
{
  "question": "PER이 낮다는 의미로 가장 적절한 것은?",
  "option_1": "항상 고평가라는 뜻이다",
  "option_2": "주가가 이익 대비 상대적으로 낮게 평가될 수 있다는 뜻이다",
  "option_3": "기업의 부채가 많다는 뜻이다",
  "option_4": "배당금이 무조건 많다는 뜻이다",
  "answer": 2,
  "explanation": "PER은 주가를 주당순이익으로 나눈 값입니다. 낮은 PER은 이익 대비 주가가 상대적으로 낮을 수 있음을 의미하지만, 산업 특성도 함께 봐야 합니다."
}
  `.trim();

  try {
    const raw = await requestGroq(prompt);
    const parsed = safeJsonParse(raw);
    const quiz = normalizeFourChoiceQuiz(parsed);

    if (
      !quiz.question ||
      !quiz.option_1 ||
      !quiz.option_2 ||
      !quiz.option_3 ||
      !quiz.option_4 ||
      ![1, 2, 3, 4].includes(quiz.answer)
    ) {
      throw new Error("생성된 객관식 JSON 형식이 올바르지 않습니다.");
    }

    return quiz;
  } catch (err) {
    console.error("generateQuizFromKeywords error =", err.message);

    return {
      question: `${difficulty} 난이도 기준으로 PER에 대한 설명으로 가장 적절한 것은?`,
      option_1: "PER은 기업의 시가총액을 뜻한다",
      option_2: "PER은 주가를 주당순이익으로 나눈 값이다",
      option_3: "PER은 배당수익률과 같은 의미다",
      option_4: "PER은 무조건 높을수록 좋은 지표다",
      answer: 2,
      explanation:
        "PER은 주가를 주당순이익(EPS)으로 나눈 값입니다. 일반적으로 기업의 이익 대비 주가 수준을 가늠할 때 참고하는 대표 지표입니다.",
    };
  }
};

/* =========================
  개념형 OX 생성
  - 반드시 참/거짓 판단형 문장으로 생성
========================= */
exports.generateConceptOxQuiz = async ({ difficulty = "하", seedQuestions = [] } = {}) => {
  const seedText = Array.isArray(seedQuestions) && seedQuestions.length > 0
    ? seedQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")
    : "없음";

  const prompt = `
당신은 한국 주식/투자 교육 플랫폼의 OX 퀴즈 출제자입니다.

목표:
- 사용자가 O 또는 X로 판단할 수 있는 "진술형 문장" 1개를 만든다
- 절대로 "무엇인가?", "뜻은?", "설명은?" 같은 서술형 질문으로 만들지 말 것
- 반드시 맞다/틀리다를 판단할 수 있어야 함

출제 조건:
- 난이도: ${difficulty}
- 참고용 기존 문제:
${seedText}

반드시 지킬 규칙:
- 한국어
- 출력은 JSON 객체 하나만
- question: 진술형 문장
- answer: "O" 또는 "X"
- explanation: 2문장 이내의 짧은 해설
- question은 반드시 문장 끝이 "~이다.", "~한다.", "~될 수 있다." 같은 판단형이어야 함
- 마크다운 금지
- 코드블록 금지

예시:
{
  "question": "상장은 기업의 주식이 증권시장에서 거래될 수 있도록 등록되는 절차이다.",
  "answer": "O",
  "explanation": "상장은 기업이 일정 요건을 갖춰 거래소에 등록되는 절차입니다. 이를 통해 투자자들이 시장에서 해당 주식을 사고팔 수 있습니다."
}
  `.trim();

  try {
    const raw = await requestGroq(prompt);
    const parsed = safeJsonParse(raw);

    const question = String(parsed.question || "").trim();
    const answer = String(parsed.answer || "").trim().toUpperCase();
    const explanation = String(parsed.explanation || "").trim();

    if (!question || !["O", "X"].includes(answer)) {
      throw new Error("개념형 OX JSON 형식이 올바르지 않습니다.");
    }

    return {
      type: "concept",
      quiz: {
        question,
        answer,
        explanation,
      },
    };
  } catch (err) {
    console.error("generateConceptOxQuiz error =", err.message);

    return {
      type: "concept",
      quiz: {
        question: "상장은 기업의 주식이 증권시장에서 거래될 수 있도록 등록되는 절차이다.",
        answer: "O",
        explanation:
          "상장은 기업이 거래소 요건을 충족해 시장에서 주식을 거래할 수 있도록 등록되는 절차입니다.",
      },
    };
  }
};