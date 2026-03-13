export const educationLessons = [
  {
    id: 'stock-intro',
    title: '먼저, 주식이란?',
    badge: '신규',
    xp: 250,
    status: 'new',
    icon: '📘',
    level: '기초',
    duration: '3분',
    summary:
      '주식이 아이돌, 또는 축구팀이라고 생각하세요. 그리고 그 아이돌/축구팀을 구매해서 팬이 된다고 생각하시면 됩니다.',
  },
  {
    id: 'market-cap',
    title: '시가 총액이란?',
    badge: '신규',
    xp: 200,
    status: 'new',
    icon: '🧮',
    level: '기초',
    duration: '2분',
    summary:
      '시가총액은 기업의 전체 가치를 뜻합니다. 현재 주가에 발행된 주식 수를 곱해서 계산합니다.',
  },
  {
    id: 'golden-cross',
    title: '이동평균선 골든크로스?',
    badge: '신규',
    xp: 300,
    status: 'new',
    icon: '📈',
    level: '기초',
    duration: '4분',
    summary:
      '단기 이동평균선이 장기 이동평균선을 위로 뚫고 올라가는 신호를 뜻합니다. 상승 전환의 신호로 자주 해석됩니다.',
  },
  {
    id: 'dead-cross',
    title: '데드크로스는 뭘까?',
    badge: '신규',
    xp: 300,
    status: 'new',
    icon: '⚠️',
    level: '기초',
    duration: '4분',
    summary:
      '단기 이동평균선이 장기 이동평균선을 아래로 내려가는 신호입니다. 하락 전환의 신호로 해석되는 경우가 많습니다.',
  },
  {
    id: 'per',
    title: 'PER은 왜 볼까?',
    badge: '기초',
    xp: 220,
    status: 'basic',
    icon: '💹',
    level: '기초',
    duration: '3분',
    summary:
      'PER은 회사가 버는 돈에 비해 현재 주가가 비싼지 싼지 판단할 때 자주 참고하는 대표적인 지표입니다.',
  },
]

export const getEducationProgress = () => {
  const totalCount = educationLessons.length
  const completedCount = 3
  const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)

  return {
    completedCount,
    totalCount,
    percent,
  }
}