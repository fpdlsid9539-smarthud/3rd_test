const educationLessons = [
  // =========================
  // 초급 40개
  // =========================
  {
    id: "why-rules-matter",
    title: "투자에도 내 규칙이 왜 필요할까?",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "📏",
    level: "초급",
    summary: `주식은 매번 상황이 달라 보여도, 결국 선택의 순간이 반복됩니다.

그때마다 기분대로 사고팔면 실수가 쌓이기 쉽습니다.

간단한 원칙이라도 미리 정해두면 흔들릴 때 판단 기준이 되어줍니다.`,
  },
  {
    id: "goal-before-buy",
    title: "사기 전에 먼저 목표를 정해야 하는 이유",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "🎯",
    level: "초급",
    summary: `같은 종목을 사더라도 누군가는 단기 수익을, 누군가는 장기 보유를 원합니다.

목표가 다르면 버티는 기준과 파는 기준도 달라집니다.

먼저 목적을 정해야 흔들릴 때도 일관된 대응이 가능합니다.`,
  },
  {
    id: "cash-is-position",
    title: "현금도 투자 포지션일까?",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "💵",
    level: "초급",
    summary: `아무것도 안 사고 기다리는 것도 하나의 선택입니다.

억지로 매수하지 않고 현금을 들고 있는 것은 기회를 남겨두는 행동이기도 합니다.

좋은 종목만 찾는 것만큼, 언제 쉬는지도 중요합니다.`,
  },
  {
    id: "dont-chase-everything",
    title: "모든 종목을 다 볼 필요는 없어요",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "👀",
    level: "초급",
    summary: `시장에는 매일 수많은 종목과 뉴스가 쏟아집니다.

전부 따라가려 하면 오히려 판단이 흐려지고 피로만 커집니다.

내가 이해할 수 있는 범위를 좁히는 것이 초보자에게 더 유리합니다.`,
  },
  {
    id: "circle-of-understanding",
    title: "아는 분야부터 보는 게 왜 유리할까?",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "🧠",
    level: "초급",
    summary: `익숙한 산업은 뉴스가 나왔을 때 의미를 더 빨리 파악할 수 있습니다.

제품, 고객, 경쟁 구조가 보이면 숫자보다 먼저 감이 생깁니다.

처음에는 내가 이해 가능한 분야부터 시작하는 것이 안전합니다.`,
  },
  {
    id: "dont-buy-because-famous",
    title: "유명한 회사라고 무조건 좋은 투자는 아니에요",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "🏢",
    level: "초급",
    summary: `이름이 익숙한 회사와 좋은 매수 타이밍은 같은 말이 아닙니다.

좋은 기업도 너무 비싸게 사면 수익 내기 어려울 수 있습니다.

회사를 좋아하는 마음과 투자 판단은 분리해서 보는 연습이 필요합니다.`,
  },
  {
    id: "news-vs-noise",
    title: "뉴스와 소음을 구분하는 법",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "📰",
    level: "초급",
    summary: `모든 뉴스가 주가에 오래 영향을 주는 것은 아닙니다.

순간적인 화제와 실제 사업 변화는 구분해서 봐야 합니다.

뉴스를 볼 때는 '이게 회사의 미래를 바꾸는 정보인가?'를 먼저 생각하면 좋습니다.`,
  },
  {
    id: "why-write-reason",
    title: "매수 이유를 적어두면 뭐가 좋을까?",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "✍️",
    level: "초급",
    summary: `그냥 느낌으로 샀는지, 분명한 이유가 있어서 샀는지는 시간이 지나면 더 크게 드러납니다.

처음 산 이유를 적어두면 나중에 판단이 흔들릴 때 기준점이 생깁니다.

투자는 기억보다 기록이 더 강합니다.`,
  },
  {
    id: "when-not-to-trade",
    title: "아무것도 안 하는 날이 필요한 이유",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "🛋️",
    level: "초급",
    summary: `매일 매매해야 실력이 느는 것은 아닙니다.

이해가 안 되는 장에서는 쉬는 것이 손실을 줄이는 가장 좋은 선택일 수 있습니다.

하지 말아야 할 행동을 아는 것도 투자 실력입니다.`,
  },
  {
    id: "separate-study-and-bet",
    title: "공부하는 종목과 돈 넣는 종목은 다를 수 있어요",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "📚",
    level: "초급",
    summary: `관심 있는 종목을 공부한다고 해서 바로 투자해야 하는 것은 아닙니다.

알아보는 단계와 실제 매수 단계는 분리하는 게 좋습니다.

이 간격이 있어야 충동적인 진입을 줄일 수 있습니다.`,
  },
  {
    id: "why-small-start",
    title: "처음엔 왜 작게 시작해야 할까?",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "🌱",
    level: "초급",
    summary: `처음부터 크게 들어가면 작은 흔들림에도 심리가 크게 흔들립니다.

적은 금액으로 경험을 쌓으면 손실보다 학습을 남기기 좋습니다.

투자는 이론보다 실제로 흔들려보며 배우는 부분이 많습니다.`,
  },
  {
    id: "price-moves-heart",
    title: "왜 주가는 숫자인데 마음이 흔들릴까?",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "❤️",
    level: "초급",
    summary: `주가가 오르면 욕심이 생기고, 내리면 불안이 커집니다.

문제는 그 감정이 판단을 대신하기 시작할 때입니다.

숫자를 보는 법만큼, 숫자에 흔들리는 나를 보는 법도 중요합니다.`,
  },
  {
    id: "social-proof-danger",
    title: "남들이 산다고 따라 사면 위험한 이유",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "👥",
    level: "초급",
    summary: `사람이 많이 몰린 종목은 안심이 되지만, 그만큼 이미 기대가 반영됐을 수도 있습니다.

내가 이해해서 산 것과 남들이 사서 산 것은 완전히 다릅니다.

남의 확신은 내 손실을 책임져주지 않습니다.`,
  },
  {
    id: "why-patience-pays",
    title: "조급함이 수익을 망치는 이유",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "⏳",
    level: "초급",
    summary: `빨리 수익 내고 싶은 마음이 강할수록 실수도 잦아집니다.

기다릴 줄 아는 사람은 애매한 자리를 걸러내고 더 나은 기회를 잡을 수 있습니다.

투자에서는 속도보다 타이밍이 더 중요할 때가 많습니다.`,
  },
  {
    id: "watchlist-purpose",
    title: "관심종목은 왜 따로 모아둘까?",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "📌",
    level: "초급",
    summary: `갑자기 눈에 띈 종목만 보면 흐름을 놓치기 쉽습니다.

관심종목을 모아두면 좋은 가격, 좋은 뉴스, 이상 신호를 비교해서 볼 수 있습니다.

투자는 한 번 보는 것보다 계속 관찰하는 과정에 가깝습니다.`,
  },
  {
    id: "what-you-dont-know",
    title: "모르는 걸 인정하는 게 왜 중요할까?",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "🙋",
    level: "초급",
    summary: `이해하지 못한 종목을 억지로 해석하면 결국 희망회로로 이어지기 쉽습니다.

모르면 안 사는 것도 좋은 선택입니다.

투자는 정답을 많이 맞히는 게임이 아니라, 큰 실수를 피하는 게임이기도 합니다.`,
  },
  {
    id: "my-risk-level",
    title: "나에게 맞는 위험 수준은 어떻게 알까?",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "🎚️",
    level: "초급",
    summary: `어떤 사람은 하루 변동에도 잠을 못 자고, 어떤 사람은 크게 흔들려도 담담합니다.

같은 종목이라도 사람마다 감당 가능한 위험은 다릅니다.

좋은 종목보다 먼저 나에게 맞는 흔들림의 크기를 알아야 합니다.`,
  },
  {
    id: "mistake-review",
    title: "실수 복기만 잘해도 실력이 늡니다",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "🔁",
    level: "초급",
    summary: `손실이 났다고 해서 모두 나쁜 경험은 아닙니다.

왜 샀고, 왜 팔았고, 무엇을 놓쳤는지 복기하면 같은 실수를 줄일 수 있습니다.

투자에서 가장 비싼 것은 손실 자체보다, 손실에서 배우지 않는 것입니다.`,
  },
  {
    id: "hope-is-not-plan",
    title: "희망과 계획은 다릅니다",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "🗺️",
    level: "초급",
    summary: `'오르겠지'는 기대이고, '어디까지 기다리고 언제 점검할지'는 계획입니다.

희망만으로 버티면 불안이 커지고 판단이 늦어집니다.

투자는 기대보다 계획이 많을수록 안정적입니다.`,
  },
  {
    id: "why-overconfidence-hurts",
    title: "한 번 맞혔다고 실력이 늘었다고 볼 수 없어요",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "😎",
    level: "초급",
    summary: `우연히 맞춘 성공은 자신감을 키우지만, 실력과는 다를 수 있습니다.

몇 번의 수익만으로 무리하게 커지면 큰 손실로 이어지기 쉽습니다.

이길 때 더 조심하는 사람이 오래 살아남습니다.`,
  },
  {
    id: "save-energy",
    title: "정보를 너무 많이 보면 왜 더 헷갈릴까?",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "🌀",
    level: "초급",
    summary: `정보가 많아질수록 더 똑똑해질 것 같지만, 실제로는 판단이 흐려지기도 합니다.

핵심이 아닌 정보까지 모두 붙잡으면 피로만 쌓입니다.

좋은 투자자는 많이 아는 사람보다, 중요한 것을 가려내는 사람에 가깝습니다.`,
  },
  {
    id: "buying-window",
    title: "좋은 회사도 아무 때나 사면 안 되는 이유",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "🚪",
    level: "초급",
    summary: `좋은 회사라도 들어가는 시점에 따라 수익률은 크게 달라질 수 있습니다.

매수 타이밍을 전혀 보지 않으면 좋은 회사를 비싼 가격에 사게 될 수 있습니다.

회사 선택과 진입 시점은 따로 생각해야 합니다.`,
  },
  {
    id: "why-check-assumptions",
    title: "내 생각이 맞는지 계속 점검해야 하는 이유",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "🔍",
    level: "초급",
    summary: `처음 세운 생각이 시간이 지나도 유효한지는 계속 확인해야 합니다.

시장은 바뀌고, 회사 상황도 변하고, 내 판단도 틀릴 수 있습니다.

처음의 확신을 지키는 것보다, 틀렸을 때 빨리 인정하는 게 더 중요합니다.`,
  },
  {
    id: "dont-confuse-luck-skill",
    title: "운과 실력을 헷갈리면 위험해요",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "🎲",
    level: "초급",
    summary: `상승장에서는 웬만하면 수익이 날 수 있습니다.

그럴수록 내 판단이 정말 좋았는지, 시장이 좋아서 오른 건지 구분해야 합니다.

운을 실력으로 착각하면 다음 하락장에서 크게 다칠 수 있습니다.`,
  },
  {
    id: "why-budget-matters",
    title: "생활비와 투자금을 분리해야 하는 이유",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "🏠",
    level: "초급",
    summary: `생활에 필요한 돈까지 투자에 넣으면 작은 하락도 심리적으로 크게 다가옵니다.

그 불안은 조급한 손절이나 무리한 선택으로 이어지기 쉽습니다.

투자는 여유 자금으로 할 때 훨씬 냉정해질 수 있습니다.`,
  },
  {
    id: "comparison-trap",
    title: "남의 수익률을 보면 흔들리는 이유",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "📱",
    level: "초급",
    summary: `누군가 더 큰 수익을 냈다는 말을 들으면 내 선택이 초라하게 느껴질 수 있습니다.

하지만 투자 목표, 기간, 위험 수준이 모두 다른데 결과만 비교하면 왜곡이 생깁니다.

투자는 경쟁보다 자기 기준이 중요합니다.`,
  },
  {
    id: "why-check-business-model",
    title: "회사가 어떻게 돈 버는지 아는 게 먼저예요",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "🏪",
    level: "초급",
    summary: `복잡한 숫자보다 먼저 봐야 할 건 회사의 돈 버는 방식입니다.

무엇을 팔고, 누가 사주고, 왜 계속 선택받는지 이해하면 기업을 더 오래 볼 수 있습니다.

사업 구조를 모르면 숫자도 제대로 해석하기 어렵습니다.`,
  },
  {
    id: "one-sentence-thesis",
    title: "한 문장으로 설명 못 하면 다시 봐야 해요",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "🧾",
    level: "초급",
    summary: `이 종목을 왜 사는지 한 문장으로 설명할 수 없다면 아직 정리가 덜 된 상태일 수 있습니다.

복잡한 이유 여러 개보다 분명한 핵심 하나가 더 강합니다.

핵심이 선명해야 흔들릴 때도 다시 점검할 수 있습니다.`,
  },
  {
    id: "time-horizon-basic",
    title: "보유 기간을 생각하면 판단이 달라져요",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "🕒",
    level: "초급",
    summary: `며칠 볼 종목과 몇 년 볼 종목은 보는 기준이 다릅니다.

기간이 정해지지 않으면 잠깐 흔들릴 때마다 계획도 바뀌기 쉽습니다.

먼저 얼마나 볼지 정해야 그에 맞는 시선이 생깁니다.`,
  },
  {
    id: "why-simple-is-good",
    title: "초보자일수록 단순한 기준이 강합니다",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "🧩",
    level: "초급",
    summary: `기준이 너무 많으면 서로 충돌해서 오히려 아무 결론도 못 내릴 수 있습니다.

처음에는 내가 이해할 수 있는 기준 몇 개만 꾸준히 지키는 것이 더 좋습니다.

복잡함보다 지속 가능성이 중요합니다.`,
  },
  {
    id: "avoid-all-in-emotion",
    title: "확신이 커질수록 왜 더 조심해야 할까?",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "🔥",
    level: "초급",
    summary: `확신이 생기면 더 많이 넣고 싶어집니다.

하지만 가장 위험한 순간 중 하나는, 틀릴 가능성을 잊어버린 확신이 커질 때입니다.

좋아 보여도 항상 반대 가능성을 남겨두는 태도가 필요합니다.`,
  },
  {
    id: "good-loss-bad-loss",
    title: "같은 손실도 좋은 손실과 나쁜 손실이 있어요",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "📉",
    level: "초급",
    summary: `계획대로 했는데 시장이 예상과 달라 손실이 난 경우도 있습니다.

반대로 아무 생각 없이 들어갔다가 난 손실도 있습니다.

손실의 크기보다, 그 손실이 어떤 과정을 거쳐 나왔는지를 보는 게 더 중요합니다.`,
  },
  {
    id: "why-wait-after-big-move",
    title: "급등 급락 뒤에는 왜 한 템포 쉬어야 할까?",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "🚦",
    level: "초급",
    summary: `급하게 움직인 종목은 기대와 공포가 한꺼번에 섞여 있을 때가 많습니다.

그럴수록 판단보다 반응이 먼저 나오기 쉽습니다.

한 걸음 물러나서 이유를 확인하는 습관이 실수를 줄여줍니다.`,
  },
  {
    id: "too-many-trades",
    title: "매매 횟수가 많다고 실력이 좋은 건 아니에요",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "🔄",
    level: "초급",
    summary: `자주 사고팔면 뭔가 열심히 하는 느낌은 들지만, 꼭 좋은 결과로 이어지진 않습니다.

불필요한 거래는 판단 실수와 피로를 함께 늘립니다.

좋은 매매는 많은 매매보다 필요한 매매에 가깝습니다.`,
  },
  {
    id: "why-check-decision-state",
    title: "피곤할 때 투자 판단을 미루는 이유",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "😴",
    level: "초급",
    summary: `피곤하거나 감정이 소모된 상태에서는 충동적인 선택이 늘어납니다.

같은 정보도 컨디션에 따라 전혀 다르게 해석될 수 있습니다.

투자 판단은 시장 상태만큼 내 상태도 중요합니다.`,
  },
  {
    id: "portfolio-is-system",
    title: "종목보다 내 투자 시스템이 먼저예요",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "⚙️",
    level: "초급",
    summary: `좋은 종목을 한 번 맞히는 것보다, 반복 가능한 방식이 있는 게 더 중요합니다.

왜 찾고, 왜 사고, 왜 파는지 흐름이 있어야 다음에도 적용할 수 있습니다.

투자는 감이 아니라 시스템이 쌓일수록 안정됩니다.`,
  },
  {
    id: "why-note-red-flags",
    title: "좋은 점보다 경고 신호를 먼저 보는 습관",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "🚨",
    level: "초급",
    summary: `사고 싶은 종목일수록 좋은 이유만 찾기 쉽습니다.

하지만 진짜 중요한 건 망가질 수 있는 지점을 먼저 보는 것입니다.

경고 신호를 적어두면 기대에 눈이 멀 가능성이 줄어듭니다.`,
  },
  {
    id: "dont-marry-stock",
    title: "종목과 사랑에 빠지면 안 되는 이유",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "💔",
    level: "초급",
    summary: `좋아하는 기업일수록 안 좋은 정보를 외면하고 싶어집니다.

하지만 종목에 애착이 생기면 냉정한 판단이 어려워집니다.

회사를 좋아할 수는 있어도, 판단은 끝까지 차갑게 유지해야 합니다.`,
  },
  {
    id: "what-if-plan",
    title: "오를 때와 내릴 때 둘 다 계획해야 해요",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "🪜",
    level: "초급",
    summary: `많은 사람은 오를 때만 상상하고 들어갑니다.

하지만 실제 매매에서는 예상대로 갈 때와 어긋날 때 모두를 준비해야 합니다.

대응 시나리오가 있어야 흔들릴 때도 덜 무너집니다.`,
  },
  {
    id: "why-consistency-matters",
    title: "투자는 한 번보다 반복이 중요해요",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "🧱",
    level: "초급",
    summary: `한 번의 큰 성공보다, 무너지지 않는 반복이 더 중요합니다.

꾸준히 지킬 수 있는 원칙은 작은 차이를 계속 만들어냅니다.

결국 오래 가는 사람은 화려한 사람보다 일관된 사람일 때가 많습니다.`,
  },
  {
    id: "respect-uncertainty",
    title: "확실하지 않다는 걸 받아들이는 법",
    xp: 3000,
    status: "new",
    difficulty: "beginner",
    icon: "🌫️",
    level: "초급",
    summary: `시장은 언제나 불확실성을 품고 있습니다.

모든 걸 알고 투자하려 하면 오히려 아무것도 못 할 수 있습니다.

중요한 건 불확실성을 없애는 게 아니라, 감당 가능한 범위 안에서 행동하는 것입니다.`,
  },

  // =========================
  // 중급 35개
  // =========================
  {
    id: "position-sizing-basic",
    title: "왜 비중 조절이 수익률만큼 중요할까?",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "⚖️",
    level: "중급",
    summary: `같은 종목을 사도 얼마를 담았는지에 따라 결과는 크게 달라집니다.

좋은 판단도 비중이 과하면 계좌 전체를 흔들 수 있습니다.

종목 선택과 비중 조절은 별개이면서도 동시에 중요합니다.`,
  },
  {
    id: "starter-size",
    title: "처음부터 크게 담지 않는 이유",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "🥄",
    level: "중급",
    summary: `처음 진입은 확인을 위한 자리일 수 있습니다.

시장이 내 생각을 어떻게 받아들이는지 보면서 천천히 대응하면 실수 비용을 줄일 수 있습니다.

한 번에 많이 넣는 것보다, 확인하며 늘리는 방식이 더 안정적일 수 있습니다.`,
  },
  {
    id: "add-on-strength-or-not",
    title: "추가 매수는 언제 고민해야 할까?",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "➕",
    level: "중급",
    summary: `같은 종목을 더 사는 행동도 이유 없이 하면 위험합니다.

내 생각이 맞아가고 있어서 늘리는 것인지, 불안해서 평균을 맞추려는 것인지 구분해야 합니다.

추가 행동일수록 처음보다 더 분명한 근거가 필요합니다.`,
  },
  {
    id: "thesis-break-check",
    title: "보유 중인 종목의 논리가 깨졌는지 확인하는 법",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "🪓",
    level: "중급",
    summary: `주가가 빠졌다고 해서 항상 논리가 깨진 것은 아닙니다.

반대로 주가가 멀쩡해 보여도 핵심 가정이 깨졌다면 다시 봐야 합니다.

가격보다 먼저, 내가 믿고 산 이유가 아직 살아 있는지 점검해야 합니다.`,
  },
  {
    id: "base-rate-thinking",
    title: "특이한 이야기보다 평균적 확률을 먼저 보자",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "📐",
    level: "중급",
    summary: `특별한 스토리는 매력적이지만, 실제 시장에서는 평범한 경우가 더 자주 일어납니다.

그래서 투자할 때는 예외적인 기대보다 일반적인 가능성을 먼저 보는 것이 유리합니다.

흥미로운 이야기와 높은 확률은 종종 다릅니다.`,
  },
  {
    id: "scenario-thinking",
    title: "하나의 미래만 믿으면 위험한 이유",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "🛣️",
    level: "중급",
    summary: `좋은 경우, 보통인 경우, 나쁜 경우를 나눠 생각하면 훨씬 현실적인 판단이 가능합니다.

하나의 낙관적인 그림만 믿으면 예상이 틀렸을 때 대응이 늦어집니다.

투자는 예측보다 시나리오 준비에 가깝습니다.`,
  },
  {
    id: "expected-value-basic",
    title: "한 번의 승패보다 기대값이 중요한 이유",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "🧮",
    level: "중급",
    summary: `모든 판단이 한 번에 맞을 필요는 없습니다.

중요한 건 여러 번 반복했을 때 전체적으로 유리한 구조인지입니다.

이기는 횟수보다, 이길 때와 질 때의 크기를 함께 보는 시각이 필요합니다.`,
  },
  {
    id: "cut-unclear-cases",
    title: "애매한 종목을 줄이는 것만으로도 좋아집니다",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "✂️",
    level: "중급",
    summary: `확신이 없는 종목은 대개 보유 중에도 계속 흔들리게 만듭니다.

애매한 것을 줄이면 좋은 기회에 집중할 여력이 생깁니다.

더 많이 찾는 것보다, 덜 좋은 것을 지우는 능력이 중요합니다.`,
  },
  {
    id: "decision-checklist",
    title: "체크리스트가 감정을 이기는 방법",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "✅",
    level: "중급",
    summary: `판단 전에 확인할 항목을 정해두면 감정적인 예외를 줄일 수 있습니다.

익숙한 실수는 대부분 반복되기 때문에, 체크리스트는 실수를 막는 장치가 됩니다.

복잡한 시장일수록 단순한 확인 절차가 힘을 발휘합니다.`,
  },
  {
    id: "sell-rules-matter",
    title: "사는 기준만큼 파는 기준도 중요합니다",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "🚪",
    level: "중급",
    summary: `언제 살지보다 언제 정리할지가 더 어려운 경우가 많습니다.

파는 기준이 없으면 작은 흔들림에도 흔들리거나, 반대로 너무 오래 끌고 갈 수 있습니다.

매수 전부터 정리 조건을 함께 생각하는 습관이 필요합니다.`,
  },
  {
    id: "partial-exit",
    title: "한 번에 전부 정리하지 않는 선택",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "🪜",
    level: "중급",
    summary: `시장은 늘 애매하게 움직이기 때문에 전량 매도와 전량 보유 사이에 중간 선택이 필요할 때가 있습니다.

부분 정리는 수익을 지키면서도 남은 가능성을 열어두는 방법이 될 수 있습니다.

흑백보다 회색 선택지가 실전에 더 자주 쓰입니다.`,
  },
  {
    id: "concentration-vs-diversification",
    title: "집중과 분산 사이의 균형",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "⚙️",
    level: "중급",
    summary: `너무 넓게 퍼지면 무엇이 잘했는지 나빴는지 구분이 어렵고, 너무 몰리면 한 번의 실수가 치명적일 수 있습니다.

결국 중요한 건 종목 수보다 내가 추적 가능한 범위입니다.

분산은 두려움 때문에, 집중은 과신 때문에 왜곡되기 쉽습니다.`,
  },
  {
    id: "portfolio-role",
    title: "각 종목에 역할을 부여하면 좋은 이유",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "🧩",
    level: "중급",
    summary: `모든 종목을 같은 기대와 같은 시선으로 들고 있으면 관리가 어려워집니다.

어떤 종목은 성장, 어떤 종목은 안정, 어떤 종목은 관찰용일 수 있습니다.

역할이 나뉘면 보유 이유와 대응 방식도 더 선명해집니다.`,
  },
  {
    id: "liquidity-preparation",
    title: "기회를 잡으려면 늘 여지를 남겨둬야 해요",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "🧰",
    level: "중급",
    summary: `좋은 기회는 예상하지 못한 순간에 오기도 합니다.

모든 자금을 이미 묶어두면 정말 좋은 순간에도 대응이 어렵습니다.

준비된 사람은 시장이 흔들릴 때도 선택지가 더 많습니다.`,
  },
  {
    id: "why-market-regime-matters",
    title: "장세가 바뀌면 같은 전략도 다르게 작동해요",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "🌦️",
    level: "중급",
    summary: `어떤 전략은 상승장에서 잘 먹히고, 어떤 전략은 변동성이 클 때 강합니다.

내 방식이 언제 유리하고 언제 불리한지 알면 억지 매매를 줄일 수 있습니다.

좋은 전략도 장세와 맞지 않으면 성과가 흔들릴 수 있습니다.`,
  },
  {
    id: "theme-vs-business",
    title: "이야기와 사업을 구분하는 연습",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "🎭",
    level: "중급",
    summary: `시장을 움직이는 건 종종 강한 이야기입니다.

하지만 이야기가 길게 가려면 결국 실제 사업이 따라와야 합니다.

스토리에 끌리더라도, 그 이야기를 뒷받침할 현실이 있는지 봐야 합니다.`,
  },
  {
    id: "narrative-change",
    title: "주가보다 먼저 바뀌는 것은 해석일 수 있어요",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "🔄",
    level: "중급",
    summary: `같은 숫자도 시장은 어떤 때는 좋게, 어떤 때는 나쁘게 해석합니다.

이처럼 해석의 프레임이 바뀌면 가격 반응도 달라집니다.

그래서 숫자 자체뿐 아니라, 시장이 무엇을 중요하게 보는지도 함께 읽어야 합니다.`,
  },
  {
    id: "lead-lag-thinking",
    title: "무엇이 먼저 움직이고 무엇이 따라올까?",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "⛓️",
    level: "중급",
    summary: `시장에는 먼저 반응하는 신호와 뒤늦게 따라오는 반응이 있습니다.

이 관계를 이해하면 흐름을 조금 더 입체적으로 볼 수 있습니다.

단일 정보보다 연결 구조를 보는 힘이 중요해지는 구간입니다.`,
  },
  {
    id: "capital-protection-first",
    title: "수익보다 먼저 생각해야 할 것은 생존입니다",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "🛡️",
    level: "중급",
    summary: `큰 손실은 회복에 매우 긴 시간이 걸립니다.

그래서 좋은 투자자는 얼마나 벌까보다, 어디서 크게 다칠 수 있는지를 먼저 생각합니다.

시장에 오래 남는 사람이 결국 더 많은 기회를 잡습니다.`,
  },
  {
    id: "wrong-for-right-reason",
    title: "판단이 맞아도 결과가 틀릴 수 있어요",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "🎯",
    level: "중급",
    summary: `올바른 생각이 항상 바로 보상받는 것은 아닙니다.

반대로 잘못된 판단도 잠깐은 좋은 결과를 낼 수 있습니다.

결과만 보면 과정을 왜곡하기 쉬우니, 판단의 질과 결과를 분리해서 봐야 합니다.`,
  },
  {
    id: "journal-patterns",
    title: "매매일지를 쓰면 내 패턴이 보입니다",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "📓",
    level: "중급",
    summary: `반복되는 실수는 기록을 남겨야 드러납니다.

언제 조급했고, 언제 과신했고, 언제 잘 기다렸는지 쌓이면 내 패턴이 보입니다.

실력은 정보보다 자기 패턴을 알아갈 때 더 빨리 늘기도 합니다.`,
  },
  {
    id: "entry-quality",
    title: "좋은 진입은 마음도 편하게 만듭니다",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "🚀",
    level: "중급",
    summary: `어설픈 자리에서 들어가면 작은 흔들림에도 불안이 커집니다.

반대로 충분히 준비하고 납득한 자리에서 들어가면 보유 중 판단도 더 안정됩니다.

진입의 질은 이후의 심리까지 바꿉니다.`,
  },
  {
    id: "thesis-aging",
    title: "오래 들고 있다고 항상 좋은 건 아니에요",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "🕰️",
    level: "중급",
    summary: `시간이 지나면 처음의 투자 논리도 낡을 수 있습니다.

환경이 바뀌었는데도 예전 이유만 붙잡으면 판단이 굳어집니다.

보유 기간이 길수록 논리도 새로 점검해야 합니다.`,
  },
  {
    id: "re-entry-discipline",
    title: "한 번 판 종목을 다시 볼 줄도 알아야 해요",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "🔂",
    level: "중급",
    summary: `팔았다고 해서 영원히 끝난 종목은 아닙니다.

상황이 바뀌면 다시 좋은 기회가 될 수 있습니다.

중요한 건 과거 선택에 자존심을 걸지 않고, 새롭게 판단하는 태도입니다.`,
  },
  {
    id: "thesis-scorecard",
    title: "좋은 종목 후보를 점수로 비교해보자",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "🧾",
    level: "중급",
    summary: `막연한 호감보다 기준에 따라 비교하면 판단이 더 선명해집니다.

예를 들어 이해도, 확신도, 리스크, 촉매 가능성 같은 항목을 나눠볼 수 있습니다.

완벽한 공식은 아니어도, 비교 틀이 있으면 감정 개입이 줄어듭니다.`,
  },
  {
    id: "cashflow-of-attention",
    title: "내 집중력도 한정 자원입니다",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "🔋",
    level: "중급",
    summary: `너무 많은 종목을 동시에 추적하면 핵심 변화를 놓치기 쉽습니다.

돈뿐 아니라 집중력도 포트폴리오 자원으로 생각해야 합니다.

내가 감당할 수 있는 범위 안에서만 확장하는 것이 좋습니다.`,
  },
  {
    id: "market-humility",
    title: "시장 앞에서 겸손해야 하는 이유",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "🙏",
    level: "중급",
    summary: `내가 확신하더라도 시장은 다른 방향으로 움직일 수 있습니다.

그 사실을 인정하면 대응이 빨라지고, 인정하지 않으면 집착이 커집니다.

겸손은 자신감 부족이 아니라 생존 기술에 가깝습니다.`,
  },
  {
    id: "red-team-my-idea",
    title: "내 아이디어를 반박해보는 습관",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "⚔️",
    level: "중급",
    summary: `사고 싶은 이유만 모으면 누구나 쉽게 확신할 수 있습니다.

오히려 반대 논리를 일부러 찾아봐야 아이디어의 약점이 보입니다.

좋은 판단은 스스로를 설득하는 것보다, 스스로를 반박해본 뒤에도 남는 생각입니다.`,
  },
  {
    id: "portfolio-cleanup",
    title: "계좌 정리도 실력입니다",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "🧹",
    level: "중급",
    summary: `의미 없이 남아 있는 종목은 판단을 흐리게 만듭니다.

보유 이유가 사라졌거나 추적하지 않는 종목은 정리 대상일 수 있습니다.

계좌를 가볍게 해야 좋은 기회가 더 잘 보입니다.`,
  },
  {
    id: "why-avoid-revenge-trade",
    title: "손실 직후 복수 매매가 위험한 이유",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "💢",
    level: "중급",
    summary: `방금 잃은 돈을 빨리 되찾고 싶을수록 판단은 거칠어집니다.

이때의 매매는 보통 기회를 찾는 행동이 아니라 감정 해소에 가깝습니다.

손실 뒤에는 복구보다 냉각이 먼저입니다.`,
  },
  {
    id: "slow-think-fast-market",
    title: "빠른 시장일수록 내 생각은 더 천천히",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "🐢",
    level: "중급",
    summary: `시장이 급할수록 사람도 급해집니다.

하지만 빠른 화면에 맞춰 생각까지 급해지면 실수 확률이 높아집니다.

변동성이 클수록 행동 속도보다 판단 속도를 늦춰야 합니다.`,
  },
  {
    id: "why-thesis-needs-trigger",
    title: "좋은 생각만으로는 부족하고 계기가 필요해요",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "🔔",
    level: "중급",
    summary: `좋은 기업이 오랫동안 저평가된 채 남는 경우도 있습니다.

시장의 시선을 바꿀 계기나 변화 포인트가 있어야 움직임이 나올 수 있습니다.

생각이 맞는 것과, 지금 움직일 이유가 있는 것은 다를 수 있습니다.`,
  },
  {
    id: "thesis-update-loop",
    title: "보유 중에도 내 생각은 계속 업데이트돼야 해요",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "🔄",
    level: "중급",
    summary: `한 번 산 뒤에 생각을 멈추면 보유는 쉬워 보여도 점점 위험해질 수 있습니다.

새 정보가 나올 때마다 내 가정이 유지되는지 확인해야 합니다.

좋은 보유는 방치가 아니라 점검을 동반합니다.`,
  },
  {
    id: "quality-of-attention",
    title: "매일 보는 것보다 제대로 보는 게 중요해요",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "🎯",
    level: "중급",
    summary: `계속 화면을 보는 것이 반드시 깊은 관찰은 아닙니다.

무엇을 위해 보는지 정하지 않으면 피로만 쌓입니다.

관찰의 횟수보다 관찰의 목적과 질이 더 중요합니다.`,
  },
  {
    id: "market-feedback",
    title: "시장은 내 아이디어에 피드백을 줍니다",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "📣",
    level: "중급",
    summary: `예상과 다른 반응이 계속 나온다면 이유를 다시 생각해야 합니다.

물론 시장이 틀릴 수도 있지만, 내가 놓친 것이 있을 가능성도 있습니다.

가격 반응은 정보와 함께 읽어야 할 또 하나의 피드백입니다.`,
  },
  {
    id: "avoid-thesis-creep",
    title: "중간에 이유를 바꾸는 습관이 위험한 이유",
    xp: 4000,
    status: "new",
    difficulty: "intermediate",
    icon: "🧵",
    level: "중급",
    summary: `단기로 샀다가 장기라고 합리화하고, 성장으로 샀다가 회복이라고 바꾸는 식의 자기 변명이 생기기 쉽습니다.

이런 변화는 생각의 유연성이 아니라 기준 붕괴일 수 있습니다.

처음 이유와 지금 이유가 바뀌었다면 다시 판단해야 합니다.`,
  },

  // =========================
  // 상급 35개
  // =========================
  {
    id: "portfolio-correlation",
    title: "종목이 달라도 같은 방향으로 무너질 수 있어요",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "🕸️",
    level: "상급",
    summary: `겉으로 보기엔 여러 종목을 담았어도 실제로는 비슷한 위험에 노출될 수 있습니다.

같은 뉴스, 같은 자금 흐름, 같은 투자 심리에 함께 흔들리는 경우가 많기 때문입니다.

종목 수보다 서로 얼마나 다른 위험을 가지고 있는지가 더 중요합니다.`,
  },
  {
    id: "convexity-thinking",
    title: "작게 잃고 크게 먹는 구조를 생각해보자",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "📈",
    level: "상급",
    summary: `모든 판단을 맞힐 필요는 없지만, 틀렸을 때 손실이 제한되고 맞았을 때 크게 열리는 구조는 매우 강력합니다.

이런 구조를 만들면 승률이 조금 낮아도 전체 결과는 좋아질 수 있습니다.

핵심은 방향보다 구조 설계입니다.`,
  },
  {
    id: "tail-risk-awareness",
    title: "평소엔 안 보여도 한 번 오면 큰 위험",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "🌪️",
    level: "상급",
    summary: `드물게 발생하지만 계좌를 크게 훼손하는 위험은 평소엔 과소평가되기 쉽습니다.

그래서 평온한 시기일수록 극단 상황을 미리 상상해둘 필요가 있습니다.

평균적인 날보다, 예외적인 날이 계좌 운명을 바꿀 때가 많습니다.`,
  },
  {
    id: "fragile-vs-antifragile",
    title: "흔들릴수록 약해지는 구조와 강해지는 구조",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "🪶",
    level: "상급",
    summary: `어떤 포트폴리오는 작은 충격에도 쉽게 무너지고, 어떤 구조는 변동성 속에서 기회를 얻습니다.

중요한 건 수익률만이 아니라, 충격을 받았을 때 구조가 어떻게 반응하는지입니다.

강한 구조는 평온할 때보다 혼란할 때 더 드러납니다.`,
  },
  {
    id: "opportunity-cost",
    title: "보유의 비용은 손실만이 아니에요",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "⌛",
    level: "상급",
    summary: `가만히 들고 있다고 해서 비용이 없는 것은 아닙니다.

더 좋은 기회를 놓치고 있는 시간도 하나의 비용입니다.

그래서 보유 판단에는 손익뿐 아니라, 자금이 묶이는 대가도 포함되어야 합니다.`,
  },
  {
    id: "edge-definition",
    title: "내가 시장에서 가진 작은 우위는 무엇일까?",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "🗡️",
    level: "상급",
    summary: `시장에는 수많은 참여자가 있기 때문에 막연한 노력만으로는 우위를 만들기 어렵습니다.

내가 더 잘 볼 수 있는 산업, 더 잘 기다릴 수 있는 성향, 더 잘 견딜 수 있는 시간축이 무엇인지 알아야 합니다.

우위 없는 매매는 결국 운의 비중이 커집니다.`,
  },
  {
    id: "time-arbitrage",
    title: "시간을 다르게 쓰는 것도 경쟁력이 됩니다",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "🕰️",
    level: "상급",
    summary: `많은 참여자가 짧은 움직임에 집중할 때, 더 긴 시간축으로 보는 사람에게 기회가 생기기도 합니다.

빠른 정보보다 긴 인내가 우위가 되는 경우도 있습니다.

시간을 다르게 쓰는 것은 생각보다 강한 전략이 될 수 있습니다.`,
  },
  {
    id: "second-order-thinking",
    title: "한 단계 더 생각하는 습관",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "♟️",
    level: "상급",
    summary: `좋은 뉴스가 나왔다고 해서 항상 좋은 투자 기회는 아닙니다.

중요한 건 그 뉴스 자체보다, 시장이 이미 얼마나 기대하고 있었는지, 다음 반응이 무엇인지입니다.

한 번 더 생각하는 사람은 표면 아래의 구조를 보게 됩니다.`,
  },
  {
    id: "consensus-crowding",
    title: "모두가 동의하는 생각은 왜 위험할 수 있을까?",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "🚶",
    level: "상급",
    summary: `대부분이 같은 방향을 믿고 있다면 이미 많은 기대가 가격에 반영됐을 수 있습니다.

그럴수록 작은 실망에도 반응은 커질 수 있습니다.

좋은 생각과 crowded한 생각은 다를 수 있습니다.`,
  },
  {
    id: "base-case-bull-bear",
    title: "기본 시나리오와 낙관·비관 시나리오를 나누자",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "🧭",
    level: "상급",
    summary: `시장 판단을 하나의 예상치로만 두면 대응이 단순해집니다.

기본, 낙관, 비관 시나리오를 나누면 가격 움직임에 대한 해석 폭이 넓어집니다.

상급 투자일수록 생각은 단선적이지 않고 층이 있습니다.`,
  },
  {
    id: "probability-weighting",
    title: "좋은 결과보다 가능성이 큰 결과를 봐야 해요",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "🎲",
    level: "상급",
    summary: `가장 멋진 시나리오가 가장 중요한 시나리오는 아닙니다.

각 결과가 얼마나 가능성이 있는지를 함께 따져야 현실적인 판단이 됩니다.

투자는 희망의 크기보다 확률과 크기의 곱을 보는 훈련입니다.`,
  },
  {
    id: "drawdown-tolerance",
    title: "수익률보다 최대 낙폭을 먼저 보자",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "🕳️",
    level: "상급",
    summary: `아무리 좋은 전략도 감당 못 할 하락폭이 나오면 중간에 포기하게 됩니다.

그래서 전략의 우수성은 최종 수익뿐 아니라, 중간의 흔들림까지 포함해 봐야 합니다.

지킬 수 없는 전략은 좋은 전략이 아닙니다.`,
  },
  {
    id: "regime-shift-risk",
    title: "잘 되던 방식이 갑자기 안 먹히는 순간",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "🌊",
    level: "상급",
    summary: `전략은 영원하지 않습니다.

금리, 유동성, 심리, 산업 구조가 바뀌면 과거에 통하던 방식이 급격히 둔화될 수 있습니다.

좋은 투자자는 성과만 보지 않고, 성과를 만든 환경이 유지되는지도 봅니다.`,
  },
  {
    id: "capital-allocation-quality",
    title: "회사가 번 돈을 어디에 쓰는지도 중요해요",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "🏗️",
    level: "상급",
    summary: `사업을 잘하는 것과 자본 배분을 잘하는 것은 다른 능력입니다.

번 돈을 재투자할지, 쌓아둘지, 주주에게 돌릴지에 따라 장기 결과가 달라집니다.

경영진의 자본 배분 감각은 장기 투자에서 매우 중요합니다.`,
  },
  {
    id: "management-incentive",
    title: "경영진의 이해관계가 왜 중요할까?",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "🤝",
    level: "상급",
    summary: `주주와 경영진이 같은 방향을 보고 있는지에 따라 장기 성과는 달라질 수 있습니다.

숫자만 좋은 회사보다, 의사결정 구조가 건강한 회사가 더 오래 강할 때가 많습니다.

무엇을 말하는지보다, 어떤 동기를 가졌는지 보는 눈이 필요합니다.`,
  },
  {
    id: "moat-thinking",
    title: "경쟁우위는 시간이 갈수록 드러납니다",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "🏰",
    level: "상급",
    summary: `누구나 따라 할 수 있는 사업은 좋은 시기에도 결국 경쟁이 심해집니다.

오랫동안 지킬 수 있는 차별점이 있는 기업은 시간이 지날수록 더 강해질 수 있습니다.

장기 투자에서는 단기 숫자보다 방어 가능한 우위를 보는 시각이 중요합니다.`,
  },
  {
    id: "unit-economics-thinking",
    title: "많이 팔수록 더 좋아지는 구조인지 보자",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "📦",
    level: "상급",
    summary: `겉으로 성장해 보여도 팔수록 남는 구조가 나빠질 수 있습니다.

한 단위가 어떻게 수익으로 연결되는지 보면 성장의 질을 볼 수 있습니다.

매출 확대보다 구조적 수익성이 더 중요한 순간이 있습니다.`,
  },
  {
    id: "operating-leverage-logic",
    title: "조금만 좋아져도 크게 달라질 수 있는 구조",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "🪜",
    level: "상급",
    summary: `비용 구조에 따라 작은 매출 변화가 큰 이익 변화로 이어질 수 있습니다.

이런 구조는 좋은 때는 강력하지만, 반대 방향일 때는 충격도 커질 수 있습니다.

숫자의 방향뿐 아니라 민감도를 읽는 힘이 필요합니다.`,
  },
  {
    id: "customer-concentration-risk",
    title: "고객이 몇 곳에 몰려 있으면 생기는 위험",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "🏷️",
    level: "상급",
    summary: `특정 고객 비중이 지나치게 높으면 작은 계약 변화도 회사 전체에 큰 영향을 줄 수 있습니다.

겉으로 좋아 보여도 구조적으로 취약할 수 있는 이유입니다.

성장보다 의존도를 함께 보는 시각이 중요합니다.`,
  },
  {
    id: "pricing-power",
    title: "가격을 올릴 수 있는 힘이 왜 중요할까?",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "💬",
    level: "상급",
    summary: `원가가 오르거나 환경이 바뀌어도 가격 전가가 가능한 기업은 훨씬 강합니다.

이 힘은 경기 변화 속에서도 사업의 체력을 지켜줍니다.

좋은 기업은 많이 파는 기업만이 아니라, 가격을 지킬 수 있는 기업이기도 합니다.`,
  },
  {
    id: "balance-sheet-buffer",
    title: "재무 여유는 위기 때 진짜 힘이 됩니다",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "🧱",
    level: "상급",
    summary: `평소엔 잘 드러나지 않지만, 어려운 시기에는 여유 자원이 있는 기업이 훨씬 유리합니다.

버틸 수 있는 힘은 성장만큼 중요한 경쟁력입니다.

좋은 회사는 잘 달릴 때보다, 흔들릴 때 더 구분됩니다.`,
  },
  {
    id: "decision-fatigue",
    title: "판단 피로가 계좌를 망칠 수 있어요",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "🪫",
    level: "상급",
    summary: `판단의 질은 정보량뿐 아니라 에너지 수준에도 영향을 받습니다.

중요한 순간에 이미 지쳐 있으면 나쁜 선택을 할 확률이 높아집니다.

상급 투자자는 시장뿐 아니라 자기 에너지 관리도 전략에 포함합니다.`,
  },
  {
    id: "meta-cognition-investing",
    title: "내가 지금 어떤 상태인지 아는 능력",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "🪞",
    level: "상급",
    summary: `탐욕, 두려움, 과신, 피로는 모두 판단을 왜곡합니다.

그래서 시장을 읽는 능력만큼 자기 상태를 읽는 능력도 중요합니다.

메타인지가 높은 사람일수록 같은 정보에서 더 좋은 결정을 뽑아냅니다.`,
  },
  {
    id: "why-optionalities-matter",
    title: "선택지가 많은 구조가 강한 이유",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "🗝️",
    level: "상급",
    summary: `현금 여력, 낮은 의존도, 유연한 전략은 예상 밖의 기회가 생겼을 때 힘을 발휘합니다.

선택지가 적은 구조는 작은 변수에도 취약해집니다.

불확실성이 큰 시장일수록 옵션이 많은 쪽이 유리합니다.`,
  },
  {
    id: "mean-reversion-vs-trend",
    title: "되돌림과 추세를 구분하는 사고법",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "↔️",
    level: "상급",
    summary: `어떤 움직임은 평균으로 되돌아가고, 어떤 움직임은 흐름을 계속 이어갑니다.

둘을 구분하지 못하면 너무 빨리 팔거나, 너무 오래 버티게 됩니다.

핵심은 현재 상황이 일시적 이탈인지 구조적 변화인지 판단하는 것입니다.`,
  },
  {
    id: "signal-vs-regime-noise",
    title: "개별 신호와 환경 변화가 충돌할 때",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "📡",
    level: "상급",
    summary: `개별 종목의 좋은 신호가 있어도, 전체 환경이 불리하면 성과가 약할 수 있습니다.

반대로 애매한 기업도 환경 덕분에 강하게 움직일 수 있습니다.

개별 판단과 큰 환경을 함께 보려는 시각이 필요합니다.`,
  },
  {
    id: "asymmetric-information-caution",
    title: "내가 모르는 정보가 더 많을 수 있다는 전제",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "🕶️",
    level: "상급",
    summary: `시장은 늘 내가 모르는 정보를 일부 반영하고 있을 수 있습니다.

그래서 이해 안 되는 급한 움직임 앞에서 과도한 확신은 위험합니다.

상급 투자일수록 '내가 놓친 게 있을 수 있다'는 전제를 깔고 움직입니다.`,
  },
  {
    id: "thesis-density",
    title: "이유가 너무 많으면 오히려 약할 수 있어요",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "🧶",
    level: "상급",
    summary: `좋아 보이는 이유가 지나치게 많다는 것은 핵심이 흐릿하다는 뜻일 수 있습니다.

강한 아이디어는 보통 중심 논리가 선명하고, 나머지는 보조 설명에 가깝습니다.

핵심 없는 다수의 이유는 확신처럼 보여도 쉽게 무너질 수 있습니다.`,
  },
  {
    id: "kill-criteria",
    title: "좋은 아이디어도 버릴 조건이 필요합니다",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "🧨",
    level: "상급",
    summary: `들어갈 이유만 정하고 나올 이유를 정하지 않으면 생각이 경직됩니다.

미리 '이 조건이 나오면 틀린 걸로 보겠다'는 기준을 정해두면 집착을 줄일 수 있습니다.

상급 판단일수록 진입 조건만큼 폐기 조건도 선명합니다.`,
  },
  {
    id: "thesis-half-life",
    title: "아이디어에도 유효기간이 있습니다",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "⌛",
    level: "상급",
    summary: `어떤 투자 아이디어는 짧게 강하고, 어떤 아이디어는 천천히 오래 갑니다.

아이디어의 수명을 가늠하지 못하면 지나치게 서두르거나 너무 오래 붙들게 됩니다.

좋은 분석에는 '이 생각이 언제까지 유효한가'가 포함되어야 합니다.`,
  },
  {
    id: "portfolio-barbell-thought",
    title: "안정과 공격을 섞는 사고법",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "🏋️",
    level: "상급",
    summary: `모든 자산을 중간 위험에만 두는 것이 항상 균형은 아닐 수 있습니다.

일부는 매우 안정적으로, 일부는 높은 가능성에 배치하는 방식도 생각해볼 수 있습니다.

중요한 건 각각의 역할과 전체 구조의 조합입니다.`,
  },
  {
    id: "good-company-bad-stock",
    title: "좋은 회사가 항상 좋은 종목은 아닙니다",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "🏛️",
    level: "상급",
    summary: `사업이 훌륭해도 이미 모든 기대가 반영된 가격이라면 기대 수익은 낮을 수 있습니다.

반대로 덜 화려해 보여도 기대가 낮은 곳에 기회가 숨어 있기도 합니다.

기업의 질과 투자 매력은 분리해서 봐야 합니다.`,
  },
  {
    id: "bad-company-good-trade",
    title: "나쁜 회사도 일시적 기회가 될 수 있을까?",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "🎢",
    level: "상급",
    summary: `장기적으로는 별로인 기업도 특정 국면에서는 강한 가격 반응을 만들 수 있습니다.

문제는 이런 기회를 장기 논리로 착각하는 순간입니다.

투자의 성격이 구조적인지 일시적인지 구분하는 힘이 중요합니다.`,
  },
  {
    id: "holding-through-volatility",
    title: "흔들림을 견디는 것과 버티기만 하는 것은 다릅니다",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "🌊",
    level: "상급",
    summary: `확신 있는 흔들림은 견딜 가치가 있지만, 이유 없는 버티기는 손실을 키울 수 있습니다.

둘의 차이는 처음 논리와 현재 점검 상태에 있습니다.

상급 투자자는 버팀의 이유를 계속 설명할 수 있어야 합니다.`,
  },
  {
    id: "market-reflexivity",
    title: "가격이 현실을 바꾸기도 합니다",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "🪄",
    level: "상급",
    summary: `주가 상승이 자금 조달을 쉽게 만들고, 그것이 다시 사업 확장과 기대를 키우는 식의 순환이 생길 수 있습니다.

반대로 하락도 현실을 악화시키는 방향으로 연결될 수 있습니다.

시장은 현실을 반영만 하는 것이 아니라, 때로는 현실을 바꾸기도 합니다.`,
  },
  {
    id: "narrative-peak-risk",
    title: "이야기가 완성될수록 위험해질 수도 있어요",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "🎬",
    level: "상급",
    summary: `모두가 이해하는 좋은 이야기는 매력적이지만, 그만큼 가격에 깊게 반영됐을 가능성도 높습니다.

이야기가 가장 설득력 있어 보일 때가 오히려 기대의 정점일 수 있습니다.

멋진 설명과 좋은 기대수익은 반드시 같이 가지 않습니다.`,
  },
  {
    id: "long-game-mindset",
    title: "결국 오래 살아남는 사고법이 강합니다",
    xp: 5000,
    status: "new",
    difficulty: "advanced",
    icon: "🏁",
    level: "상급",
    summary: `상급 투자에서 중요한 것은 한 번의 대박보다 긴 시간 동안 반복 가능한 구조입니다.

지속 가능한 판단, 감당 가능한 위험, 흔들리지 않는 과정이 모이면 시간이 편이 됩니다.

장기적으로 강한 사람은 늘 맞히는 사람이 아니라, 쉽게 망가지지 않는 사람입니다.`,
  },
];


module.exports = {
  educationLessons,
};