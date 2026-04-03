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

function normalizeText(value = "") {
  return String(value || "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[“”"'`~!@#$%^&*_=+|\\/:;,.<>?[\]{}-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeQuestionText(value = "") {
  return normalizeText(value)
    .replace(/무엇(인가요|일까요|입니까|인가|일까)?/g, "무엇")
    .replace(/뜻하는 것은/g, "뜻")
    .replace(/가장 적절한 것은/g, "적절")
    .replace(/옳은 것은/g, "옳음")
    .replace(/틀린 것은/g, "틀림")
    .replace(/다음 중/g, "")
    .replace(/설명으로/g, "설명")
    .replace(/것은/g, "")
    .trim();
}

function getSimilarity(a = "", b = "") {
  const aa = normalizeQuestionText(a);
  const bb = normalizeQuestionText(b);

  if (!aa || !bb) return 0;
  if (aa === bb) return 1;
  if (aa.includes(bb) || bb.includes(aa)) return 0.95;

  const aTokens = aa.split(" ").filter(Boolean);
  const bTokens = bb.split(" ").filter(Boolean);

  if (!aTokens.length || !bTokens.length) return 0;

  const aSet = new Set(aTokens);
  const bSet = new Set(bTokens);

  let intersection = 0;
  for (const token of aSet) {
    if (bSet.has(token)) intersection += 1;
  }

  return intersection / Math.max(aSet.size, bSet.size);
}

function isTooSimilarQuestion(a = "", b = "") {
  return getSimilarity(a, b) >= 0.72;
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

function getNormalizedOptions(quiz = {}) {
  return [
    quiz.option_1,
    quiz.option_2,
    quiz.option_3,
    quiz.option_4,
  ].map((v) => normalizeText(v));
}

function hasDuplicateOptions(quiz = {}) {
  const options = getNormalizedOptions(quiz);

  if (options.some((v) => !v)) return true;
  return new Set(options).size !== 4;
}

function hasTooSimilarOptions(quiz = {}) {
  const options = [
    quiz.option_1,
    quiz.option_2,
    quiz.option_3,
    quiz.option_4,
  ].map((v) => String(v || "").trim());

  for (let i = 0; i < options.length; i += 1) {
    for (let j = i + 1; j < options.length; j += 1) {
      if (getSimilarity(options[i], options[j]) >= 0.78) {
        return true;
      }
    }
  }

  return false;
}

function isValidFourChoiceQuiz(quiz = {}) {
  if (!quiz || typeof quiz !== "object") return false;

  if (!quiz.question) return false;
  if (!quiz.option_1) return false;
  if (!quiz.option_2) return false;
  if (!quiz.option_3) return false;
  if (!quiz.option_4) return false;
  if (!quiz.explanation) return false;
  if (![1, 2, 3, 4].includes(Number(quiz.answer))) return false;
  if (hasDuplicateOptions(quiz)) return false;
  if (hasTooSimilarOptions(quiz)) return false;

  return true;
}

function isDuplicateQuestion(question = "", seedQuestions = []) {
  const currentQuestion = String(question || "").trim();
  if (!currentQuestion) return true;

  return seedQuestions.some((seed) =>
    isTooSimilarQuestion(currentQuestion, String(seed || ""))
  );
}

function buildFallbackQuiz(difficulty = "하", seedQuestions = [], mixIndex = 1) {
  const fallbackPool = [
    {
      question: `${difficulty} 난이도 기준으로 PER이 낮다는 의미로 가장 적절한 것은 무엇인가요?`,
      option_1: "기업의 이익 대비 주가가 상대적으로 낮게 평가될 수 있다는 뜻이다",
      option_2: "기업의 부채가 반드시 적다는 뜻이다",
      option_3: "배당금이 항상 높다는 뜻이다",
      option_4: "주가가 무조건 더 오른다는 뜻이다",
      answer: 1,
      explanation:
        "PER은 주가를 주당순이익으로 나눈 값입니다. 일반적으로 낮은 PER은 이익 대비 주가가 상대적으로 낮게 평가될 가능성을 뜻하지만 업종 특성도 함께 봐야 합니다.",
    },
    {
      question: `${difficulty} 난이도 기준으로 PBR이 1보다 낮다는 뜻으로 가장 적절한 것은 무엇인가요?`,
      option_1: "기업의 배당이 무조건 높다는 뜻이다",
      option_2: "주가가 순자산 대비 낮게 평가될 수 있다는 뜻이다",
      option_3: "기업의 부채가 전혀 없다는 뜻이다",
      option_4: "기업이 상장폐지 직전이라는 뜻이다",
      answer: 2,
      explanation:
        "PBR은 주가를 주당순자산으로 나눈 값입니다. 1보다 낮으면 순자산 대비 주가가 낮게 평가될 가능성을 뜻하지만, 사업 전망도 같이 확인해야 합니다.",
    },
    {
      question: `${difficulty} 난이도 기준으로 시가총액에 대한 설명으로 가장 적절한 것은 무엇인가요?`,
      option_1: "기업이 한 해 동안 번 순이익이다",
      option_2: "기업의 부채 총액이다",
      option_3: "현재 주가에 총 발행 주식 수를 곱한 값이다",
      option_4: "하루 동안 거래된 주식 수량이다",
      answer: 3,
      explanation:
        "시가총액은 현재 주가에 총 발행 주식 수를 곱한 값입니다. 시장에서 평가하는 기업의 전체 규모를 볼 때 자주 사용합니다.",
    },
    {
      question: `${difficulty} 난이도 기준으로 배당금에 대한 설명으로 가장 적절한 것은 무엇인가요?`,
      option_1: "기업이 빌린 돈을 은행에 갚는 금액이다",
      option_2: "주주가 증권사에 내는 수수료이다",
      option_3: "기업이 이익의 일부를 주주에게 나누어 주는 돈이다",
      option_4: "주식을 살 때 필요한 최소 증거금이다",
      answer: 3,
      explanation:
        "배당금은 기업이 벌어들인 이익의 일부를 주주에게 나누어 주는 돈입니다. 배당 정책은 기업마다 다를 수 있습니다.",
    },
    {
      question: `${difficulty} 난이도 기준으로 공매도에 대한 설명으로 가장 적절한 것은 무엇인가요?`,
      option_1: "없는 주식을 빌려 먼저 판 뒤 나중에 사서 갚는 거래 방식이다",
      option_2: "배당금을 미리 받는 제도이다",
      option_3: "주식을 장기 보유하면 자동으로 신청되는 제도이다",
      option_4: "기업이 신규 상장할 때만 가능한 거래 방식이다",
      answer: 1,
      explanation:
        "공매도는 주가 하락을 예상할 때 주식을 빌려 먼저 판 뒤, 나중에 다시 사서 갚는 거래 방식입니다. 일반 매수와는 방향이 반대입니다.",
    },
    {
      question: `${difficulty} 난이도 기준으로 ETF에 대한 설명으로 가장 적절한 것은 무엇인가요?`,
      option_1: "한 기업의 주식만 담는 상품이다",
      option_2: "지수나 자산 흐름을 따라가도록 만든 상장형 펀드이다",
      option_3: "예금처럼 원금이 항상 보장되는 상품이다",
      option_4: "상장할 수 없는 비공개 펀드이다",
      answer: 2,
      explanation:
        "ETF는 특정 지수나 자산의 흐름을 추종하도록 만든 상장지수펀드입니다. 주식처럼 시장에서 실시간으로 거래할 수 있습니다.",
    },
  ];

  const available = fallbackPool.filter(
    (item) => !isDuplicateQuestion(item.question, seedQuestions)
  );

  const chosen =
    available[(mixIndex - 1) % Math.max(available.length, 1)] ||
    fallbackPool[(mixIndex - 1) % fallbackPool.length];

  return chosen;
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
      temperature: 0.35,
      top_p: 0.9,
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
  mixIndex = 1,
}) => {
  const keywordText = Array.isArray(keywords) ? keywords.join(", ") : "";
  const normalizedSeedQuestions = Array.isArray(seedQuestions)
    ? seedQuestions.map((q) => String(q || "").trim()).filter(Boolean)
    : [];

  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const seedText =
      normalizedSeedQuestions.length > 0
        ? normalizedSeedQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")
        : "없음";

    const prompt = `
당신은 한국 주식/투자 교육 플랫폼의 퀴즈 출제자입니다.

목표:
- 초보~중급 사용자를 위한 4지선다 객관식 1문제를 JSON으로 생성
- 기존 문제와 너무 유사하게 복붙하지 말고, 개념은 이어가되 새 문제로 만들 것
- 한국어만 사용
- 질문은 명확하고 정답은 하나만 존재해야 함

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
- question은 너무 짧거나 모호하면 안 됨
- 보기는 서로 완전히 달라야 함
- 정답 보기와 오답 보기 내용이 겹치면 안 됨
- 아래 참고용 기존 문제와 같은 질문/유사 질문 금지
- "다음 중 옳은 것은?" 같은 템플릿 반복 금지
- 마크다운 금지
- 코드블록 금지

예시 형식:
{
  "question": "PER이 낮다는 의미로 가장 적절한 것은 무엇인가요?",
  "option_1": "기업의 이익 대비 주가가 상대적으로 낮게 평가될 수 있다는 뜻이다",
  "option_2": "기업의 부채가 많다는 뜻이다",
  "option_3": "배당금이 반드시 늘어난다는 뜻이다",
  "option_4": "기업의 매출이 감소하고 있다는 뜻이다",
  "answer": 1,
  "explanation": "PER은 주가를 주당순이익으로 나눈 값입니다. 낮은 PER은 이익 대비 주가가 상대적으로 낮을 수 있음을 뜻하지만 업종 특성과 시장 상황도 함께 봐야 합니다."
}
    `.trim();

    try {
      const raw = await requestGroq(prompt);
      const parsed = safeJsonParse(raw);
      const quiz = normalizeFourChoiceQuiz(parsed);

      if (!isValidFourChoiceQuiz(quiz)) {
        throw new Error("형식 불량 또는 보기 중복");
      }

      if (isDuplicateQuestion(quiz.question, normalizedSeedQuestions)) {
        throw new Error("기존 문제와 질문 중복");
      }

      return quiz;
    } catch (err) {
      console.error(
        `generateQuizFromKeywords attempt ${attempt} error =`,
        err.message
      );
    }
  }

  return buildFallbackQuiz(difficulty, normalizedSeedQuestions, mixIndex);
};

/* =========================
  개념형 OX 생성
========================= */
exports.generateConceptOxQuiz = async ({
  difficulty = "하",
  seedQuestions = [],
} = {}) => {
  const seedText =
    Array.isArray(seedQuestions) && seedQuestions.length > 0
      ? seedQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")
      : "없음";

  const prompt = `
당신은 한국 주식/투자 교육 플랫폼의 OX 퀴즈 출제자입니다.

목표:
- 사용자가 O 또는 X로 판단할 수 있는 진술형 문장 1개를 만든다
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
        question: "PER은 주가를 주당순이익으로 나눈 값이다.",
        answer: "O",
        explanation:
          "PER은 기업의 이익 대비 현재 주가 수준을 보는 대표적인 투자 지표입니다.",
      },
    };
  }
};