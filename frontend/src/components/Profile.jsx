import React, { useEffect, useMemo, useRef, useState } from 'react'
import './Profile.css'
import notification from '../assets/icons/notification.svg'
import edit from '../assets/icons/edit.svg'
import account from '../assets/icons/account.svg'
import logout from '../assets/icons/logout.svg'
import spread from '../assets/icons/spread.svg'
import defaultProfile from '../assets/chicken running machine.png'
import { api } from '../config/api.js'
import { getAchievementIcon } from '../utils/achievementIconMap'
import close from '../assets/icons/close.svg'

const extractArrayData = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

const extractObjectData = (payload) => {
  if (!payload) return null
  if (payload?.data && !Array.isArray(payload.data)) return payload.data
  if (!Array.isArray(payload) && typeof payload === 'object') return payload
  return null
}

const normalizeOwnedStocks = (payload) => {
  if (Array.isArray(payload?.stocks)) return payload.stocks
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload)) return payload
  return []
}

const normalizeLikedStocks = (payload) => {
  if (Array.isArray(payload?.stocks)) return payload.stocks
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload)) return payload
  return []
}

const getStockPrincipal = (stock) => {
  const directTotalPrice = Number(
    stock?.totalPrice ??
    stock?.total_price ??
    stock?.principal ??
    stock?.originPrice ??
    stock?.origin_price ??
    0
  )

  if (directTotalPrice > 0) return directTotalPrice

  const quantity = Number(stock?.quantity || 0)
  const avgPrice = Number(stock?.avgPrice ?? stock?.avg_price ?? 0)
  return quantity * avgPrice
}

const getStockProfit = (stock) => {
  return Number(
    stock?.changeAmount ??
    stock?.change_amount ??
    stock?.profit ??
    stock?.pnl_amount ??
    0
  )
}

const PIE_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#84cc16',
]

const buildPortfolioSegments = (stocks) => {
  const baseList = Array.isArray(stocks)
    ? stocks
      .map((stock, index) => {
        const amount = getStockPrincipal(stock)

        return {
          id:
            stock?.stockCode ??
            stock?.stock_code ??
            stock?.code ??
            `${stock?.stockName ?? stock?.name ?? 'stock'}-${index}`,
          name: stock?.stockName ?? stock?.name ?? '이름 없음',
          amount,
        }
      })
      .filter((item) => Number(item.amount) > 0)
    : []

  const total = baseList.reduce((sum, item) => sum + Number(item.amount || 0), 0)

  if (total <= 0) {
    return {
      total: 0,
      segments: [],
      gradient: '#e5e7eb',
    }
  }

  let currentDeg = 0

  const segments = baseList.map((item, index) => {
    const ratio = (Number(item.amount) / total) * 100
    const degree = (ratio / 100) * 360
    const color = PIE_COLORS[index % PIE_COLORS.length]

    const segment = {
      ...item,
      ratio,
      color,
      startDeg: currentDeg,
      endDeg: currentDeg + degree,
    }

    currentDeg += degree
    return segment
  })

  const gradient = `conic-gradient(${segments
    .map((item) => `${item.color} ${item.startDeg}deg ${item.endDeg}deg`)
    .join(', ')})`

  return {
    total,
    segments,
    gradient,
  }
}

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

const buildAnimatedPortfolioSegments = (chartData, progress = 1) => {
  if (!chartData || !Array.isArray(chartData.segments) || chartData.segments.length === 0) {
    return {
      ...chartData,
      total: 0,
      gradient: '#e5e7eb',
      segments: [],
    }
  }

  const safeProgress = Math.max(0, Math.min(1, progress))
  let currentDeg = 0

  const animatedSegments = chartData.segments.map((item) => {
    const fullDegree = Number(item.endDeg || 0) - Number(item.startDeg || 0)
    const animatedDegree = fullDegree * safeProgress

    const nextItem = {
      ...item,
      animatedStartDeg: currentDeg,
      animatedEndDeg: currentDeg + animatedDegree,
    }

    currentDeg += animatedDegree
    return nextItem
  })

  const gradient =
    animatedSegments.length > 0
      ? `conic-gradient(${animatedSegments
        .map((item) => `${item.color} ${item.animatedStartDeg}deg ${item.animatedEndDeg}deg`)
        .join(', ')})`
      : '#e5e7eb'

  return {
    ...chartData,
    total: chartData.total * safeProgress,
    segments: animatedSegments,
    gradient,
  }
}

const getTooltipText = (item, fallback = '설명이 없습니다.') => {
  return item?.description || item?.desc || item?.detail || fallback
}

const Profile = ({ collapsed, setCollapsed }) => {
  const [member, setMember] = useState(null)
  const [ownedStocks, setOwnedStocks] = useState([])
  const [likedStocks, setLikedStocks] = useState([])
  const [recentAchievements, setRecentAchievements] = useState([])
  const [showInvestmentModal, setShowInvestmentModal] = useState(false)
  const [portfolioChartProgress, setPortfolioChartProgress] = useState(0)
  const [allAchievements, setAllAchievements] = useState([])
  const [achievementSummary, setAchievementSummary] = useState({
    obtainedCount: 0,
    totalCount: 28,
  })
  const [gameLog, setGameLog] = useState([])
  const [notifications, setNotifications] = useState([])
  const [notificationPosition, setNotificationPosition] = useState({
    top: 0,
    right: 0,
  })
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hasUnreadNotification, setHasUnreadNotification] = useState(false)

  const [showAllAchievements, setShowAllAchievements] = useState(false)
  const [showPointHistory, setShowPointHistory] = useState(false)
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(10)
  const [pointHistoryRange, setPointHistoryRange] = useState('7d')

  const [achievementLoading, setAchievementLoading] = useState(false)
  const [displayTier, setDisplayTier] = useState('브론즈')
  const [tierRank, setTierRank] = useState(null)

  const [titles, setTitles] = useState([])
  const [equippedTitle, setEquippedTitle] = useState(null)
  const [titleLoading, setTitleLoading] = useState(false)
  const [titleEquipLoading, setTitleEquipLoading] = useState(false)

  const [editMode, setEditMode] = useState(false)
  const [editNickname, setEditNickname] = useState('')
  const [editPreviewUrl, setEditPreviewUrl] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [isTitleDropdownOpen, setIsTitleDropdownOpen] = useState(false)

  const titleDropdownRef = useRef(null)
  const fileInputRef = useRef(null)
  const nicknameInputRef = useRef(null)
  const notificationRef = useRef(null)

  const isProfileCollapsed = collapsed
  const setIsProfileCollapsed = setCollapsed

  // Auto-collapse when ≤1280px, restore when wider
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)')

    const handleMq = (e) => {
      if (e.matches) {
        // entering narrow — force collapsed and close sub-panels
        setCollapsed(true)
        setShowAllAchievements(false)
        setShowPointHistory(false)
      } else {
        // leaving narrow — restore from localStorage
        const saved = localStorage.getItem('profile_collapsed')
        setCollapsed(saved === 'true')
      }
    }

    // Run immediately for the current viewport
    handleMq(mq)

    mq.addEventListener('change', handleMq)
    return () => mq.removeEventListener('change', handleMq)
  }, [])

  useEffect(() => {
    if (showPointHistory) {
      setVisibleHistoryCount(10)
    }
  }, [showPointHistory])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target) &&
        !event.target.closest('.notification-dropdown')
      ) {
        setIsNotificationOpen(false)
      }

      if (
        titleDropdownRef.current &&
        !titleDropdownRef.current.contains(event.target)
      ) {
        setIsTitleDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowInvestmentModal(false)
      }
    }

    if (showInvestmentModal) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [showInvestmentModal])

  useEffect(() => {
    if (!showInvestmentModal) {
      setPortfolioChartProgress(0)
      return
    }

    let frameId = null
    let startTime = null
    const duration = 1200

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp

      const elapsed = timestamp - startTime
      const rawProgress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutCubic(rawProgress)

      setPortfolioChartProgress(easedProgress)

      if (rawProgress < 1) {
        frameId = window.requestAnimationFrame(animate)
      }
    }

    setPortfolioChartProgress(0)
    frameId = window.requestAnimationFrame(animate)

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId)
    }
  }, [showInvestmentModal])

  useEffect(() => {
    return () => {
      if (editPreviewUrl) {
        URL.revokeObjectURL(editPreviewUrl)
      }
    }
  }, [editPreviewUrl])

  const normalizeRecentAchievements = (list) => {
    if (!Array.isArray(list)) return []

    return list
      .map((item, index) => {
        if (typeof item === 'string') {
          return {
            ach_id: `string-${index}`,
            name: item,
            ach_img: null,
            obtained_at: null,
          }
        }

        if (item && typeof item === 'object') {
          return {
            ach_id: item.ach_id ?? item.id ?? `obj-${index}`,
            name: item.name ?? item.title ?? '업적',
            ach_img: item.ach_img ?? null,
            obtained_at: item.obtained_at ?? item.obtainedAt ?? null,
            description: item.description ?? item.desc ?? item.detail ?? null,
          }
        }

        return null
      })
      .filter(Boolean)
  }

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString('ko-KR')
  }

  const formatSignedNumber = (value) => {
    const num = Number(value || 0)
    const prefix = num > 0 ? '+' : ''
    return `${prefix}${num.toLocaleString('ko-KR')}`
  }

  const formatSignedPercent = (value) => {
    const num = Number(value || 0)
    const prefix = num > 0 ? '+' : ''
    return `${prefix}${num.toFixed(2)}`
  }

  const formatNoticeDate = (value) => {
    if (!value) return '-'

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'

    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    })
  }

  const formatCompactDateTime = (value) => {
    if (!value) return '-'

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${year}.${month}.${day} ${hours}:${minutes}`
  }

  const formatDateTime = (value) => {
    if (!value) return '-'

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'

    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const loadProfile = async () => {
    // 토큰 없으면 조용히 스킵 — 로그인 전 Profile 마운트 시 401 방지
    if (!localStorage.getItem('token')) {
      setLoading(false)
      return
    }

    try {
      const [memberRes, ownedRes, likedRes, recentAchRes, equippedTitleRes] = await Promise.allSettled([
        api.get('/api/auth/me'),
        api.get('/api/stocks/owned'),
        api.get('/api/stocks/liked'),
        api.get('/api/recent-achievements?limit=3'),
        api.get('/api/titles/equipped'),
      ])

      let currentMember = null
      let fallbackRecentAchievements = []

      if (memberRes.status === 'fulfilled') {
        const res = memberRes.value
        const raw = res?.data ?? res

        const memberData =
          raw?.member ??
          raw?.data?.member ??
          raw?.data ??
          null

        currentMember = memberData
        setMember(memberData)

        const authRecent =
          raw?.recentAchievements ??
          raw?.data?.recentAchievements ??
          []

        const logs =
          raw?.gameLog ??
          raw?.data?.gameLog ??
          []

        fallbackRecentAchievements = normalizeRecentAchievements(authRecent)
      } else {
        // /api/auth/me 실패 = 토큰 만료 또는 무효 → auth:expired 이벤트 발행
        const reason = memberRes.reason?.message || ''
        if (reason.includes('인증이 만료')) {
          // api.js 가 이미 토큰을 제거하고 이벤트를 발행했으므로 여기선 아무것도 하지 않음
        } else {
          setError(reason || '프로필 로딩 실패')
        }
        return // member 없이 아래 블록 실행 불필요
      }

      if (ownedRes.status === 'fulfilled') {
        const payload = ownedRes.value?.data ?? ownedRes.value
        const ownedData = normalizeOwnedStocks(payload)
        setOwnedStocks(Array.isArray(ownedData) ? ownedData : [])
      } else {
        setOwnedStocks([])
      }

      if (likedRes.status === 'fulfilled') {
        const payload = likedRes.value?.data ?? likedRes.value
        const likedData = normalizeLikedStocks(payload)
        setLikedStocks(Array.isArray(likedData) ? likedData : [])
      } else {
        setLikedStocks([])
      }

      if (recentAchRes.status === 'fulfilled') {
        const raw = recentAchRes.value?.data ?? recentAchRes.value
        const list = extractArrayData(raw)
        const normalized = normalizeRecentAchievements(list)

        if (normalized.length > 0) {
          setRecentAchievements(normalized)
        } else {
          setRecentAchievements(fallbackRecentAchievements)
        }
      } else {
        setRecentAchievements(fallbackRecentAchievements)
      }

      if (equippedTitleRes.status === 'fulfilled') {
        const raw = equippedTitleRes.value?.data ?? equippedTitleRes.value
        setEquippedTitle(extractObjectData(raw))
      } else {
        setEquippedTitle(null)
      }

      if (currentMember?.member_id && localStorage.getItem('token')) {
        try {
          const rankingRes = await api.get('/api/ranking')
          const rankingRaw = rankingRes?.data ?? rankingRes
          const rankingData = rankingRaw?.data ?? rankingRaw

          const currentUserId = rankingData?.currentUserId
          const leagues = rankingData?.leagues || {}

          const tierOrder = [
            { key: 'diamond', label: '다이아' },
            { key: 'gold', label: '골드' },
            { key: 'silver', label: '실버' },
            { key: 'bronze', label: '브론즈' },
          ]

          let foundTierLabel = currentMember?.tier || '브론즈'
          let foundTierRank = null

          for (const tierInfo of tierOrder) {
            const leagueUsers = Array.isArray(leagues?.[tierInfo.key])
              ? leagues[tierInfo.key]
              : []

            const myRow = leagueUsers.find(
              (user) => Number(user.memberId) === Number(currentUserId)
            )

            if (myRow) {
              foundTierLabel = tierInfo.label
              foundTierRank = Number(myRow.leagueRank || 0) || null
              break
            }
          }

          setDisplayTier(foundTierLabel)
          setTierRank(foundTierRank)
        } catch (err) {
          console.error('티어 내 등수 조회 실패 =', err)
          setDisplayTier(currentMember?.tier || '브론즈')
          setTierRank(null)
        }
      } else {
        setTierRank(null)
      }


    } catch (err) {
      setError(err.message || '프로필 로딩 실패')
    } finally {
      setLoading(false)
    }
  }

  const loadAllAchievements = async () => {
    try {
      setAchievementLoading(true)

      const res = await api.get('/api/my-achievements')
      const raw = res?.data ?? res
      const data = extractObjectData(raw) || {}

      const achievements = Array.isArray(data?.achievements) ? data.achievements : []
      const obtainedCount = achievements.filter((item) => Number(item.is_obtained) === 1).length
      const totalCount = Number(data?.totalCount || achievements.length || 28)

      setAllAchievements(achievements)
      setAchievementSummary({
        obtainedCount,
        totalCount,
      })
    } catch (err) {
      console.error('전체 업적 조회 실패:', err)
      setAllAchievements([])
      setAchievementSummary({
        obtainedCount: 0,
        totalCount: 28,
      })
    } finally {
      setAchievementLoading(false)
    }
  }

  const loadMyTitles = async () => {
    try {
      setTitleLoading(true)

      const [titlesRes, equippedRes] = await Promise.all([
        api.get('/api/titles'),
        api.get('/api/titles/equipped'),
      ])

      const titlesRaw = titlesRes?.data ?? titlesRes
      const equippedRaw = equippedRes?.data ?? equippedRes

      const titleList = extractArrayData(titlesRaw)
      const equipped = extractObjectData(equippedRaw)

      setTitles(titleList)
      setEquippedTitle(equipped)
    } catch (err) {
      console.error('칭호 조회 실패:', err)
      setTitles([])
    } finally {
      setTitleLoading(false)
    }
  }

  const handleEquipTitle = async (achId) => {
    try {
      setTitleEquipLoading(true)
      await api.patch('/api/titles/equip', { ach_id: achId })
      await loadMyTitles()
      setIsTitleDropdownOpen(false)
    } catch (err) {
      console.error('칭호 장착 실패:', err)
      alert(err?.response?.data?.message || '칭호 장착에 실패했습니다.')
    } finally {
      setTitleEquipLoading(false)
    }
  }

  const handleToggleTitleDropdown = async () => {
    const nextOpen = !isTitleDropdownOpen

    setIsTitleDropdownOpen(nextOpen)

    if (nextOpen && titles.length === 0) {
      await loadMyTitles()
    }
  }


  const handleOpenAchievements = async () => {
    setShowPointHistory(false)
    setShowAllAchievements(true)

    await Promise.all([
      allAchievements.length === 0 ? loadAllAchievements() : Promise.resolve(),
      loadMyTitles(),
    ])
  }

  const handleBackToProfile = () => {
    setShowAllAchievements(false)
    setShowPointHistory(false)
  }

  const loadNotifications = async () => {
    if (!localStorage.getItem('token')) return
    try {
      const res = await api.get('/api/points/notifications')
      const raw = res?.data ?? res

      const list = Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw)
          ? raw
          : []

      setNotifications(list)
      setHasUnreadNotification(list.length > 0)
    } catch (err) {
      console.error('알림 조회 실패 =', err)
      setNotifications([])
      setHasUnreadNotification(false)
    }
  }

  const loadTradeHistory = async () => {
    if (!localStorage.getItem('token')) return
    try {
      const res = await api.get('/api/points/notifications')
      const raw = res?.data ?? res
      const list = extractArrayData(raw)

      setGameLog(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error('최근 매매 내역 조회 실패 =', err)
      setGameLog([])
    }
  }

  const handleHidePointHistory = async (historyId) => {
    const ok = window.confirm('이 포인트 변동 내역을 숨길까요?')
    if (!ok) return

    try {
      await api.patch(`/api/points/notifications/${historyId}/hide`)

      setNotifications((prev) =>
        prev.filter((item) => Number(item.history_id) !== Number(historyId))
      )
    } catch (err) {
      console.error('포인트 내역 숨김 실패 =', err)
      alert(err?.response?.data?.message || '포인트 내역 숨김에 실패했습니다.')
    }
  }

  useEffect(() => {
    loadProfile()
    loadNotifications()
    loadTradeHistory()

    const handleRefresh = () => {
      if (!localStorage.getItem('token')) return
      loadProfile()
      loadNotifications()
      loadTradeHistory()
    }

    window.addEventListener('pointsUpdated', handleRefresh)
    return () => window.removeEventListener('pointsUpdated', handleRefresh)
  }, []) // showAllAchievements 제거: 패널 토글 시 loadProfile 재실행 버그 수정

  const profileImg = member?.profile_image2 || member?.profile_image || defaultProfile
  const displayImg = editPreviewUrl || profileImg

  const membershipType = String(member?.membership_type || '').trim().toLowerCase()
  const isPremium =
    membershipType === 'premium' ||
    membershipType === 'premium_member' ||
    membershipType === 'paid'

  const membershipLabel = isPremium ? '👑' : 'Free'

  const openEdit = () => {
    setEditNickname(member?.nickname || '')
    setEditPreviewUrl(null)
    setSaveError('')
    setEditMode(true)
    setTimeout(() => nicknameInputRef.current?.focus(), 50)
  }

  const closeEdit = () => {
    setEditMode(false)
    setEditPreviewUrl(null)
    setSaveError('')
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setEditPreviewUrl(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!editNickname.trim()) {
      setSaveError('닉네임을 입력해주세요.')
      nicknameInputRef.current?.focus()
      return
    }
    setSaving(true)
    setSaveError('')
    try {
      // Upload image first if one was selected
      if (fileInputRef.current?.files[0]) {
        const formData = new FormData()
        formData.append('profile_image', fileInputRef.current.files[0])
        await fetch(`http://localhost:5000/api/auth/me/image`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: formData, // multipart — do NOT set Content-Type manually
        })
      }

      const data = await api.patch('/api/auth/me', { nickname: editNickname.trim() })
      setMember(prev => ({
        ...prev,
        ...data.data.member,
        profile_image2: editPreviewUrl || data.data.member.profile_image2,
      }))
      setEditMode(false)
      setEditPreviewUrl(null)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    if (!confirm('로그아웃 하시겠어요?')) return

    localStorage.removeItem('token')
    localStorage.removeItem('member')
    localStorage.removeItem('nickname')
    sessionStorage.clear()

    alert('안전하게 로그아웃 되었습니다!')
    window.location.href = '/'
  }

  const investmentSummary = useMemo(() => {
    return ownedStocks.reduce(
      (acc, stock) => {
        acc.totalInvested += getStockPrincipal(stock)
        acc.totalProfit += getStockProfit(stock)
        return acc
      },
      { totalInvested: 0, totalProfit: 0 }
    )
  }, [ownedStocks])

  const portfolioChartData = useMemo(() => {
    return buildPortfolioSegments(ownedStocks)
  }, [ownedStocks])

  const animatedPortfolioChartData = useMemo(() => {
    return buildAnimatedPortfolioSegments(portfolioChartData, portfolioChartProgress)
  }, [portfolioChartData, portfolioChartProgress])

  const recentTradeList = useMemo(() => {
    return Array.isArray(gameLog) ? gameLog.slice(0, 10) : []
  }, [gameLog])

  const displayTotalInvested =
    Number(investmentSummary.totalInvested || 0) > 0
      ? investmentSummary.totalInvested
      : Number(member?.bet_amount || 0)

  const displayTotalProfit =
    Number(investmentSummary.totalProfit || 0) !== 0
      ? investmentSummary.totalProfit
      : Number(member?.pnl_amount || 0)

  const totalProfitRate =
    Number(displayTotalInvested) > 0
      ? (Number(displayTotalProfit) / Number(displayTotalInvested)) * 100
      : 0

  const obtainedAchievements = useMemo(
    () => allAchievements.filter((item) => Number(item.is_obtained) === 1),
    [allAchievements]
  )

  const inProgressAchievements = useMemo(
    () => allAchievements.filter((item) => Number(item.is_obtained) !== 1),
    [allAchievements]
  )

  const filteredPointHistory = useMemo(() => {
    const now = new Date()
    const rangeStart = new Date(now)

    if (pointHistoryRange === '1d') {
      rangeStart.setDate(now.getDate() - 1)
    } else if (pointHistoryRange === '7d') {
      rangeStart.setDate(now.getDate() - 7)
    } else if (pointHistoryRange === '1m') {
      rangeStart.setMonth(now.getMonth() - 1)
    } else if (pointHistoryRange === '1y') {
      rangeStart.setFullYear(now.getFullYear() - 1)
    }

    return notifications.filter((item) => {
      const itemDate = new Date(item.createdAt)
      return !Number.isNaN(itemDate.getTime()) && itemDate >= rangeStart
    })
  }, [notifications, pointHistoryRange])

  const currentTitleName =
    equippedTitle?.name || member?.title || '🌱 Vivere 주린이'

  const currentTitleDescription = getTooltipText(
    equippedTitle,
    '칭호 설명이 없습니다.'
  )

  if (loading) {
    return (
      <div className='profile'>
        <div className='profile-content'>불러오는 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='profile'>
        <div className='profile-content'>오류: {error}</div>
      </div>
    )
  }

  // Notification //

  if (showPointHistory) {
    const visibleHistory = filteredPointHistory.slice(0, visibleHistoryCount)

    const rangeLabelMap = {
      '1d': '최근 1일',
      '7d': '최근 1주일',
      '1m': '최근 1개월',
      '1y': '최근 1년',
    }

    return (
      <div className='profile'>
        <div className='profile-content'>
          <div className='achievement-page-top'>
            <button className='achievement-back-btn' onClick={handleBackToProfile}>
              ← 뒤로가기
            </button>
          </div>

          <div className='profile-stock title-summary-card'>
            <div className='achievement-title-row point-history-top-row'>
              <h2>포인트 변동 내역</h2>
              <span className='achievement-count'>{filteredPointHistory.length}건</span>
            </div>

            <div className='point-history-filter-wrap'>
              <button
                type='button'
                className={`point-history-filter-btn ${pointHistoryRange === '1d' ? 'active' : ''}`}
                onClick={() => {
                  setPointHistoryRange('1d')
                  setVisibleHistoryCount(10)
                }}
              >
                1일
              </button>

              <button
                type='button'
                className={`point-history-filter-btn ${pointHistoryRange === '7d' ? 'active' : ''}`}
                onClick={() => {
                  setPointHistoryRange('7d')
                  setVisibleHistoryCount(10)
                }}
              >
                1주일
              </button>

              <button
                type='button'
                className={`point-history-filter-btn ${pointHistoryRange === '1m' ? 'active' : ''}`}
                onClick={() => {
                  setPointHistoryRange('1m')
                  setVisibleHistoryCount(10)
                }}
              >
                1개월
              </button>

              <button
                type='button'
                className={`point-history-filter-btn ${pointHistoryRange === '1y' ? 'active' : ''}`}
                onClick={() => {
                  setPointHistoryRange('1y')
                  setVisibleHistoryCount(10)
                }}
              >
                1년
              </button>
            </div>

            <div className='point-history-range-label'>
              {rangeLabelMap[pointHistoryRange]} 내역
            </div>

            <div className='point-history-list'>
              {visibleHistory.length > 0 ? (
                visibleHistory.map((item) => (
                  <div className='point-history-item' key={item.history_id}>
                    <div className='notification-item-left'>
                      <div className='notification-name'>{item.type}</div>
                      <div
                        className={`notification-amount ${Number(item.changeAmount) >= 0 ? 'positive' : 'negative'}`}
                      >
                        {Number(item.changeAmount) >= 0 ? '+' : ''}
                        {Number(item.changeAmount).toLocaleString('ko-KR')}pt
                      </div>
                    </div>

                    <div className='point-history-right'>
                      <div className='notification-date'>
                        {formatCompactDateTime(item.createdAt)}
                      </div>

                      <button
                        type='button'
                        className='point-history-hide-btn'
                        onClick={() => handleHidePointHistory(item.history_id)}
                        title='이 내역 숨기기'
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className='achievement-empty-block'>
                  {rangeLabelMap[pointHistoryRange]} 내역이 없습니다.
                </div>
              )}
            </div>
              {filteredPointHistory.length > 10 && (
                <div
                  className={`point-history-more-row ${visibleHistoryCount <= 10 ? 'single' : 'double'}`}
                >
                  {visibleHistoryCount <= 10 ? (
                    <button
                      type='button'
                      className='title-equip-btn'
                      onClick={() =>
                        setVisibleHistoryCount((prev) =>
                          Math.min(prev + 10, filteredPointHistory.length)
                        )
                      }
                    >
                      더보기
                    </button>
                  ) : (
                    <>
                      {visibleHistoryCount < filteredPointHistory.length ? (
                        <button
                          type='button'
                          className='title-equip-btn'
                          onClick={() =>
                            setVisibleHistoryCount((prev) =>
                              Math.min(prev + 10, filteredPointHistory.length)
                            )
                          }
                        >
                          더보기
                        </button>
                      ) : (
                        <div className='point-history-more-placeholder' />
                      )}

                      <span className='point-history-visible-count'>
                        {visibleHistory.length} / {filteredPointHistory.length}
                      </span>

                      <button
                        type='button'
                        className='title-equip-btn'
                        onClick={() =>
                          setVisibleHistoryCount((prev) => Math.max(prev - 10, 10))
                        }
                      >
                        접기
                      </button>
                    </>
                  )}
                </div>
              )}
          </div>
        </div>
      </div>
    )
  }

  // Achievments //

  if (showAllAchievements) {
    return (
      <div className='profile'>
        <div className='profile-content'>
          <div className='achievement-page-top'>
            <button className='achievement-back-btn' onClick={handleBackToProfile}>
              ← 뒤로가기
            </button>
          </div>

          <div className='profile-stock'>
            <div className='achievement-title-row'>
              <h2>칭호 선택</h2>
              <span className='achievement-count'>{titles.length}개</span>
            </div>

            <div className='title-list'>
              {titleLoading ? (
                <div className='achievement-empty-block'>불러오는 중...</div>
              ) : titles.length > 0 ? (
                titles.map((item) => {
                  const isEquipped =
                    Number(item?.is_equipped) === 1 ||
                    Number(item?.ach_id) === Number(equippedTitle?.ach_id)

                  return (
                    <div className='title-item' key={item.ach_id}>
                      <div className='title-item-tooltip'>
                        {getTooltipText(item, '칭호 설명이 없습니다.')}
                      </div>

                      <div className='title-item-left'>
                        <span className='title-item-name'>{item.name}</span>
                      </div>

                      <button
                        className={`title-equip-btn ${isEquipped ? 'title-equip-btn--active' : ''}`}
                        disabled={titleEquipLoading || isEquipped}
                        onClick={() => handleEquipTitle(item.ach_id)}
                      >
                        {isEquipped ? '장착 중' : titleEquipLoading ? '변경 중...' : '장착하기'}
                      </button>
                    </div>
                  )
                })
              ) : (
                <div className='achievement-empty-block'>보유한 칭호가 없습니다.</div>
              )}
            </div>
          </div>

          <div className='profile-stock achievement-summary-card'>
            <div className='achievement-title-row'>
              <h2>전체 업적</h2>
            </div>

            <div className='achievement-progress-top'>
              <div className='achievement-progress-text achievement-progress-text--single'>
                <span>달성 진행도</span>
                <strong>
                  {achievementSummary.obtainedCount} / {achievementSummary.totalCount}
                </strong>
              </div>
            </div>
          </div>

          <div className='profile-stock'>
            <div className='achievement-title-row'>
              <h2>달성한 업적</h2>
              <span className='achievement-count'>{obtainedAchievements.length}개</span>
            </div>

            <div className='achievement-grid-full'>
              {achievementLoading ? (
                <div className='achievement-empty-block'>불러오는 중...</div>
              ) : obtainedAchievements.length > 0 ? (
                obtainedAchievements.map((item) => (
                  <div className='achievement-grid-card' key={item.ach_id}>
                    <img
                      src={getAchievementIcon(item.ach_id)}
                      alt={item.name}
                      className='achievement-grid-img'
                    />
                    <div className='achievement-grid-name'>{item.name}</div>

                    <div className='achievement-grid-date'>
                      획득일: {formatDateTime(item.obtained_at)}
                    </div>

                    <div className='achievement-grid-card-tooltip'>
                      <div className='achievement-grid-tooltip-arrow'></div>
                      {getTooltipText(item, '업적 설명이 없습니다.')}
                    </div>
                  </div>
                ))
              ) : (
                <div className='achievement-empty-block'>달성한 업적이 없습니다.</div>
              )}
            </div>
          </div>

          <div className='profile-stock'>
            <div className='achievement-title-row'>
              <h2>진행 중인 업적</h2>
              <span className='achievement-count'>{inProgressAchievements.length}개</span>
            </div>

            <div className='achievement-progress-tooltip-grid'>
              {achievementLoading ? (
                <div className='achievement-empty-block'>불러오는 중...</div>
              ) : inProgressAchievements.length > 0 ? (
                inProgressAchievements.map((item) => (
                  <>
                    <div className='achievement-trigger-item' key={item.ach_id}>

                      <div className='achievement-mini-icon'>
                        <img
                          src={getAchievementIcon(item.ach_id)}
                          alt={item.name}
                          className='achievement-mini-icon-img'
                        />
                      </div>
                      <div className='achievement-speech-bubble'>
                        <div className='bubble-arrow' />
                        <div className='bubble-content'>
                          <strong className='bubble-name'>{item.name}</strong>
                          <p className='bubble-desc'>
                            {getTooltipText(item, '업적 설명이 없습니다.')}
                          </p>
                        </div>
                      </div>

                    </div>
                    <div className='achievement-speech-bubble2'>
                      <div className='bubble-arrow2' />
                      <div className='bubble-content'>
                        <strong className='bubble-name'>{item.name}</strong>
                        <p className='bubble-desc'>
                          {getTooltipText(item, '업적 설명이 없습니다.')}
                        </p>
                      </div>
                    </div>
                  </>
                ))
              ) : (
                <div className='achievement-empty-block'>진행 중인 업적이 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Profile Main //

  return (
    <>
      <div className={`profile ${collapsed ? 'collapsed' : ''}`}>
        <div className='profile-content'>
          <div className='profile-set'>

            <button
              type='button'
              className='icon-container set-icons'
              onClick={() => setCollapsed(!collapsed)}
              title={isProfileCollapsed ? '프로필 펼치기' : '프로필 숨기기'}
            >
              <img
                src={spread}
                alt={isProfileCollapsed ? 'expand profile' : 'collapse profile'}
                className={`icons profile-toggle-icon ${isProfileCollapsed ? 'profile-toggle-icon--collapsed' : ''}`}
              />
              <img src={account} alt='account' className='icons profile-account-icon' />
            </button>
            <div className={`profile-set-extra${isProfileCollapsed ? ' profile-set-extra--hidden' : ''}`}>
              <div className='notification-wrap' ref={notificationRef}>
                <button
                  type='button'
                  className={`icon-container set-icons ${isNotificationOpen ? 'set-icons--active' : ''}`}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setIsNotificationOpen((prev) => {
                      const next = !prev
                      if (next) setHasUnreadNotification(false)
                      return next
                    })
                  }}
                  title='최근 포인트 변동 알림'
                >
                  <img src={notification} alt='notification' className='icons' />
                  {hasUnreadNotification && <span className='notification-dot' />}
                </button>

                {isNotificationOpen && (
                  <div className='notification-dropdown notification-dropdown--fixed'>
                    <div className='notification-dropdown-header'>
                      <div className='notification-dropdown-title'>최근 알림 목록</div>
                      <button
                        className='achievement-more-btn'
                        onClick={() => {
                          setIsNotificationOpen(false)
                          setShowPointHistory(true)
                        }}
                      >
                        더보기
                      </button>
                    </div>

                    {notifications.length === 0 ? (
                      <div className='notification-empty'>알림이 없습니다.</div>
                    ) : (
                      notifications.slice(0, 5).map((item) => (
                        <div className='notification-item' key={item.history_id}>
                          <div className='notification-item-left'>
                            <div className='notification-name'>{item.type}</div>
                            <div
                              className={`notification-amount ${Number(item.changeAmount) >= 0 ? 'positive' : 'negative'}`}
                            >
                              {Number(item.changeAmount) >= 0 ? '+' : ''}
                              {Number(item.changeAmount).toLocaleString('ko-KR')}pt
                            </div>
                          </div>

                          <div className='notification-date'>
                            {formatNoticeDate(item.createdAt)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <button
                type='button'
                className={`icon-container set-icons ${editMode ? 'set-icons--active' : ''}`}
                onClick={editMode ? closeEdit : openEdit}
                title={editMode ? '편집 취소' : '프로필 편집'}
              >
                <img src={edit} alt='edit' className='icons' />
              </button>

              <button
                type='button'
                className='icon-container set-icons'
                onClick={handleLogout}
                title='로그아웃'
              >
                <img src={logout} alt='logout' className='icons' />
              </button>
            </div>
          </div>

          {!isProfileCollapsed && (
            <>
              <div className='profile-master'>
                <div className='profile-account'>
                  <div
                    className={`glowing-container ${editMode ? 'glowing-container--editable' : ''}`}
                    style={{ '--profile-url': `url(${displayImg})` }}
                    onClick={editMode ? () => fileInputRef.current?.click() : undefined}
                    title={editMode ? '사진 변경' : undefined}
                  >
                    <img src={displayImg} alt='profile image' className='profile-pic' />
                    {editMode && (
                      <div className='avatar-edit-overlay'>
                        <span>📷</span>
                      </div>
                    )}
                  </div>

                  <div
                    className={`profile-membership ${isPremium ? 'profile-membership--premium' : 'profile-membership--free'
                      }`}
                  >
                    {membershipLabel}
                  </div>

                  <input
                    ref={fileInputRef}
                    type='file'
                    accept='image/*'
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                </div>

                {editMode ? (
                  <div className='nickname-edit-wrap'>
                    <input
                      ref={nicknameInputRef}
                      className='nickname-input'
                      type='text'
                      value={editNickname}
                      maxLength={20}
                      onChange={(e) => setEditNickname(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave()
                        if (e.key === 'Escape') closeEdit()
                      }}
                      placeholder='닉네임 입력'
                    />

                    {saveError && <p className='nickname-error'>{saveError}</p>}

                    <div className='nickname-actions'>
                      <button
                        className='edit-btn edit-btn--cancel'
                        onClick={closeEdit}
                        disabled={saving}
                      >
                        취소
                      </button>
                      <button
                        className='edit-btn edit-btn--save'
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? '저장 중...' : '저장'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <h2 className='profile-name'>{member?.nickname || '사용자'}</h2>

                      <div className='profile-title-dropdown-wrap' ref={titleDropdownRef}>
                        <button
                          type='button'
                          className={`profile-title-badge ${isTitleDropdownOpen ? 'profile-title-open' : ''}`}
                          onClick={handleToggleTitleDropdown}
                        >
                          <span className='profile-title-text-hover'>
                            {currentTitleName}
                            <span className='profile-title-text-tooltip'>
                              {currentTitleDescription}
                            </span>
                          </span>
                        </button>

                        {isTitleDropdownOpen && (
                          <div className='profile-title-dropdown'>
                            <div className='profile-title-dropdown-header'>
                              <div className='profile-title-dropdown-title'>칭호 선택</div>
                              <span className='achievement-count'>{titles.length}개</span>
                            </div>

                            <div className='profile-title-dropdown-list'>
                              {titleLoading ? (
                                <div className='achievement-empty-block'>불러오는 중...</div>
                              ) : titles.length > 0 ? (
                                titles.map((item) => {
                                  const isEquipped =
                                    Number(item?.is_equipped) === 1 ||
                                    Number(item?.ach_id) === Number(equippedTitle?.ach_id)

                                  return (
                                    <div className='title-item' key={item.ach_id}>
                                      <div className='title-item-tooltip'>
                                        {getTooltipText(item, '칭호 설명이 없습니다.')}
                                      </div>

                                      <div className='title-item-left'>
                                        <span className='title-item-name'>{item.name}</span>
                                      </div>

                                      <button
                                        type='button'
                                        className={`title-equip-btn ${isEquipped ? 'title-equip-btn--active' : ''}`}
                                        disabled={titleEquipLoading || isEquipped}
                                        onClick={() => handleEquipTitle(item.ach_id)}
                                      >
                                        {isEquipped ? '장착 중' : titleEquipLoading ? '변경 중...' : '장착'}
                                      </button>
                                    </div>
                                  )
                                })
                              ) : (
                                <div className='achievement-empty-block'>보유한 칭호가 없습니다.</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

              </div>
              <div className='profile-stats'>
                <div className='stats-description'>
                  <span className='description-top'>{displayTier || '브론즈'}</span>
                  <p>{tierRank ? `${tierRank}` : '-'}<span className='point-unit'>위</span></p>
                </div>
                <hr />
                <div className='stats-description'>
                  <span className='description-top'>ISR</span>
                  <p>{member?.isr_score ?? 0}</p>
                </div>
              </div>

              <div className='total-description'>
                <span className='description-top'>보유 포인트</span>
                <p
                  className='description-slave'
                >
                  <span
                    className='clickable-points'
                    onClick={() => setShowPointHistory(true)}
                  >
                    {formatNumber(member?.points ?? 0)}
                  </span>
                  <span className='point-unit'>pt</span>
                </p>
              </div>

              <div className='profile-stock'>
                <div className='achievement-title-row'>
                  <h2>투자 현황</h2>
                  <button
                    type='button'
                    className='achievement-more-btn'
                    onClick={() => setShowInvestmentModal(true)}
                  >
                    더보기
                  </button>
                </div>
                <div className='profile-stock-list'>
                  <div className='stock-content'>
                    <span className='description-top'>원금</span>
                    <p className='description-slave'>
                      {formatNumber(displayTotalInvested)}
                      <span>pt</span>
                    </p>
                  </div>

                  <div className='stock-content'>
                    <span className='description-top'>
                      총손익
                    </span>
                    <p
                      className={`description-slave ${Number(displayTotalProfit) >= 0 ? 'gain' : 'loss'}`}
                    >
                      {formatSignedNumber(displayTotalProfit)}
                      <span>pt</span>
                    </p>
                  </div>

                  <div className='stock-content'>
                    <span className='description-top'>변동률</span>
                    <p
                      className={`description-slave ${Number(totalProfitRate) >= 0 ? 'gain' : 'loss'}`}
                    >
                      {formatSignedPercent(Number(totalProfitRate).toFixed(2))}
                      <span>%</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className='profile-stock'>
                <div className='achievement-title-row'>
                  <h2>달성한 업적</h2>
                  <button className='achievement-more-btn' onClick={handleOpenAchievements}>
                    더보기
                  </button>
                </div>

                <div className='achievement-recent-grid'>
                  {recentAchievements.length > 0 ? (
                    recentAchievements.slice(0, 3).map((item, index) => (
                      <div
                        className='achievement-recent-card'
                        key={`${item?.ach_id || item?.name || item || 'achievement'}-${index}`}
                      >
                        {typeof item !== 'string' && (
                          <img
                            src={getAchievementIcon(item.ach_id)}
                            alt={item.name}
                            className='achievement-recent-img'
                          />
                        )}

                        <div className='achievement-recent-name'>
                          {typeof item === 'string' ? item : item?.name}
                        </div>

                        <div className='achievement-recent-tooltip'>
                          <div className='achievement-recent-tooltip-arrow'></div>
                          {getTooltipText(item, '업적 설명이 없습니다.')}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className='achievement-empty-block'>표시할 업적이 없습니다.</div>
                  )}
                </div>
              </div>

            </>
          )}
        </div>
      </div>
      {showInvestmentModal && (
        <div
          className='profile-investment-modal-overlay'
          onClick={() => setShowInvestmentModal(false)}
        >
          <div
            className='profile-investment-modal'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='profile-investment-modal-header'>
              <h2>나의 포트폴리오</h2>
              <button
                type='button'
                className='profile-investment-modal-close'
                onClick={() => setShowInvestmentModal(false)}
              >
                <img src={close} alt="close" />
              </button>
            </div>

            <div className='profile-investment-modal-body'>
              <div className='profile-investment-summary-grid'>
                <div className='profile-investment-summary-card'>
                  <span className='profile-investment-summary-label'>원금</span>
                  <strong className='profile-investment-summary-value'>
                    {formatNumber(displayTotalInvested)}
                    <span>pt</span>
                  </strong>
                </div>

                <div className='profile-investment-summary-card'>
                  <span className='profile-investment-summary-label'>총손익</span>
                  <strong
                    className={`profile-investment-summary-value ${Number(displayTotalProfit) >= 0 ? 'gain' : 'loss'
                      }`}
                  >
                    {formatSignedNumber(displayTotalProfit)}
                    <span>pt</span>
                  </strong>
                </div>

                <div className='profile-investment-summary-card'>
                  <span className='profile-investment-summary-label'>변동률</span>
                  <strong
                    className={`profile-investment-summary-value ${Number(totalProfitRate) >= 0 ? 'gain' : 'loss'
                      }`}
                  >
                    {formatSignedPercent(Number(totalProfitRate).toFixed(2))}
                    <span>%</span>
                  </strong>
                </div>
              </div>

              <div className='profile-investment-sections'>
                <div className='profile-investment-section'>
                  <div className='profile-investment-section-title-row'>
                    <h3>보유 주식</h3>
                    <span>{ownedStocks.length}개</span>
                  </div>

                  <div className='profile-investment-section-body'>
                    {ownedStocks.length > 0 ? (
                      ownedStocks.map((stock) => (
                        <>
                          <div
                            key={`profile-owned-${stock.stockCode ?? stock.stock_code ?? stock.stockName}`}
                            className='profile-side-stock-item'
                          >
                            <div className='profile-side-stock-top'>
                              <p>{stock.stockName || stock.name || '-'}</p>
                              <p>
                                {stock.price !== null && stock.price !== undefined
                                  ? `${Number(stock.price).toLocaleString()}원`
                                  : '-'}
                              </p>
                            </div>

                            <div className='profile-side-stock-mid'>
                              <span>
                                {Number(stock.quantity || 0)}주
                                {' '}
                                (평단가 {Number(stock.avgPrice || stock.avg_price || 0).toLocaleString()}원)
                              </span>
                              <span
                                className={
                                  Number(stock.myChangeRate || stock.myChangeRate || 0) >= 0
                                    ? 'gain'
                                    : 'loss'
                                }
                              >
                                {stock.myChangeRate !== null && stock.myChangeRate !== undefined
                                  ? `${Number(stock.myChangeRate) >= 0 ? '+' : ''}${Number(
                                    stock.myChangeRate).toFixed(2)}%`
                                  : stock.change_rate !== null && stock.change_rate !== undefined
                                    ? `${Number(stock.change_rate) >= 0 ? '+' : ''}${Number(
                                      stock.change_rate
                                    ).toFixed(2)}%`
                                    : '-'}
                              </span>
                            </div>
                          </div>
                          <div className='hr' />
                        </>
                      ))
                    ) : (
                      <div className='profile-investment-empty'>보유 주식이 없습니다.</div>
                    )}
                  </div>
                </div>

                <div className='profile-investment-section'>
                  <div className='profile-investment-section-title-row'>
                    <h3>보유 비중</h3>
                    <span>원금 기준</span>
                  </div>

                  <div className='profile-investment-section-body'>
                    {portfolioChartData.segments.length > 0 ? (
                      <>
                        <div className='profile-investment-pie-wrap'>
                          <div
                            className='profile-investment-pie'
                            style={{ background: animatedPortfolioChartData.gradient }}
                          >
                            <div className='profile-investment-pie-hole'>
                              <span className='profile-investment-pie-hole-label'>총 원금</span>
                              <p>
                                <strong>{formatNumber(portfolioChartData.total)}</strong>
                                <span>pt</span>
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className='profile-investment-legend'>
                          {portfolioChartData.segments.map((item) => (
                            <div className='profile-investment-legend-item' key={item.id}>
                              <div className='profile-investment-legend-left'>
                                <span
                                  className='profile-investment-legend-color'
                                  style={{ backgroundColor: item.color }}
                                />
                                <span>{item.name}</span>
                              </div>

                              <div className='profile-investment-legend-right'>
                                <span>{formatNumber(item.amount)}pt</span>
                                <strong>
                                  {item.ratio.toFixed(2)}%
                                </strong>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className='profile-investment-empty'>
                        보유 주식이 없습니다.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Profile