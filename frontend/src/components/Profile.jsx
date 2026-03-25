import React, { useEffect, useMemo, useState, useRef } from 'react'
import './Profile.css'
import notification from '../assets/icons/notification.svg'
import account from '../assets/icons/account.svg'
import logout from '../assets/icons/logout.svg'
import defaultProfile from '../assets/chicken running machine.png'
import vivereBeginner from '../assets/icons/achievement/vivere_beginner.png'
import { api } from '../config/api.js'

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

const Profile = () => {
  const [member, setMember] = useState(null)
  const [ownedStocks, setOwnedStocks] = useState([])
  const [recentAchievements, setRecentAchievements] = useState([])
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
  const [achievementLoading, setAchievementLoading] = useState(false)
  const [rankingPoint, setRankingPoint] = useState(0)

  const [titles, setTitles] = useState([])
  const [equippedTitle, setEquippedTitle] = useState(null)
  const [titleLoading, setTitleLoading] = useState(false)
  const [titleEquipLoading, setTitleEquipLoading] = useState(false)

  const [editMode, setEditMode] = useState(false)
  const [editNickname, setEditNickname] = useState('')
  const [editPreviewUrl, setEditPreviewUrl] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const fileInputRef = useRef(null)
  const nicknameInputRef = useRef(null)
  const notificationRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target) &&
        !event.target.closest('.notification-dropdown')
      ) {
        setIsNotificationOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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
            obtained_at: item.obtained_at ?? null,
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

  const formatNoticeDate = (value) => {
    if (!value) return '-'

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'

    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
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
    try {
      const [memberRes, ownedRes, recentAchRes, equippedTitleRes] = await Promise.allSettled([
        api.get('/api/auth/me'),
        api.get('/api/stocks/owned'),
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
        setGameLog(Array.isArray(logs) ? logs : [])
      } else {
        setError(memberRes.reason?.message || '프로필 로딩 실패')
      }

      if (ownedRes.status === 'fulfilled') {
        const payload = ownedRes.value?.data ?? ownedRes.value
        const ownedData =
          payload?.stocks ??
          payload?.data ??
          payload ??
          []

        setOwnedStocks(Array.isArray(ownedData) ? ownedData : [])
      } else {
        setOwnedStocks([])
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

      if (currentMember?.member_id) {
        try {
          const rankingRes = await api.get('/api/ranking')
          const rankingRaw = rankingRes?.data ?? rankingRes
          const rankingData = rankingRaw?.data ?? rankingRaw

          const allUsers = [
            ...(rankingData?.leagues?.bronze || []),
            ...(rankingData?.leagues?.silver || []),
            ...(rankingData?.leagues?.gold || []),
            ...(rankingData?.leagues?.diamond || []),
          ]

          const me = allUsers.find(
            (user) => Number(user.memberId) === Number(currentMember.member_id)
          )

          setRankingPoint(Number(me?.rankingPoint || 0))
        } catch (err) {
          console.error('랭킹 점수 조회 실패 =', err)
          setRankingPoint(0)
        }
      } else {
        setRankingPoint(0)
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
    } catch (err) {
      console.error('칭호 장착 실패:', err)
      alert(err?.response?.data?.message || '칭호 장착에 실패했습니다.')
    } finally {
      setTitleEquipLoading(false)
    }
  }

  const handleOpenAchievements = async () => {
    setShowAllAchievements(true)

    await Promise.all([
      allAchievements.length === 0 ? loadAllAchievements() : Promise.resolve(),
      loadMyTitles(),
    ])
  }

  const handleBackToProfile = () => {
    setShowAllAchievements(false)
  }

  const loadNotifications = async () => {
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

  useEffect(() => {
    loadProfile()
    loadNotifications()

    const handleRefresh = () => {
      loadProfile()
      loadNotifications()
      if (showAllAchievements) {
        loadAllAchievements()
        loadMyTitles()
      }
    }

    window.addEventListener('pointsUpdated', handleRefresh)
    return () => window.removeEventListener('pointsUpdated', handleRefresh)
  }, [showAllAchievements])

  const profileImg = member?.profile_image2 || member?.profile_image || defaultProfile
  const displayImg = editPreviewUrl || profileImg
  const membershipType = String(member?.membership_type || '').trim().toLowerCase()
  const isPremium = membershipType === 'premium'

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
    const file = e.target.files[0]
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
      if (fileInputRef.current?.files[0]) {
        const formData = new FormData()
        formData.append('profile_image', fileInputRef.current.files[0])

        await fetch('http://localhost:5000/api/auth/me/image', {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData,
        })
      }

      await api.patch('/api/auth/me', { nickname: editNickname.trim() })
      await loadProfile()

      setEditMode(false)
      setEditPreviewUrl(null)
    } catch (err) {
      setSaveError(err.message || '저장 실패')
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
        const quantity = Number(stock?.quantity || 0)
        const avgPrice = Number(stock?.avgPrice || stock?.avg_price || 0)
        const invested = avgPrice * quantity
        const profit = Number(stock?.changeAmount || stock?.change_amount || 0)

        acc.totalInvested += invested
        acc.totalProfit += profit
        return acc
      },
      { totalInvested: 0, totalProfit: 0 }
    )
  }, [ownedStocks])

  const totalProfitRate =
    investmentSummary.totalInvested > 0
      ? (investmentSummary.totalProfit / investmentSummary.totalInvested) * 100
      : 0

  const obtainedAchievements = useMemo(
    () => allAchievements.filter((item) => Number(item.is_obtained) === 1),
    [allAchievements]
  )

  const inProgressAchievements = useMemo(
    () => allAchievements.filter((item) => Number(item.is_obtained) !== 1),
    [allAchievements]
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

  if (showAllAchievements) {
    return (
      <div className='profile'>
        <div className='profile-content'>
          <div className='achievement-page-top'>
            <button className='achievement-back-btn' onClick={handleBackToProfile}>
              ← 뒤로가기
            </button>
          </div>

          <div className='profile-stock title-summary-card'>
            <div className='achievement-title-row'>
              <h2>현재 칭호</h2>
            </div>

            <div className='title-current-box'>
              <div className='title-current-label'>장착 중</div>
              <div className='title-current-name'>
                {equippedTitle?.name || '칭호 없음'}
              </div>
            </div>
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
                      <div className='title-item-left'>
                        <div className='title-item-name-row'>
                          <span className='title-item-name'>{item.name}</span>

                          <div className='isr-tooltip-wrap'>
                            <span className='isr-tooltip-icon'>ⓘ</span>
                            <span className='isr-tooltip-text'>
                              {item.description || '칭호 설명이 없습니다.'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        className={`title-equip-btn ${
                          isEquipped ? 'title-equip-btn--active' : ''
                        }`}
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
                      src={item.ach_img || vivereBeginner}
                      alt='achievement'
                      className='achievement-grid-img'
                    />

                    <div className='achievement-grid-name'>{item.name}</div>

                    <div className='achievement-grid-date'>
                      획득일: {formatDateTime(item.obtained_at)}
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

            <div className='achievement-progress-list'>
              {achievementLoading ? (
                <div className='achievement-empty-block'>불러오는 중...</div>
              ) : inProgressAchievements.length > 0 ? (
                inProgressAchievements.map((item) => (
                  <div className='achievement-progress-card' key={item.ach_id}>
                    <img
                      src={item.ach_img || vivereBeginner}
                      alt='achievement'
                      className='achievement-progress-img'
                    />

                    <div className='achievement-progress-body'>
                      <div className='achievement-name-row'>
                        <span className='achievement-name'>{item.name}</span>
                        <span className='achievement-state achievement-state--pending'>
                          진행 중
                        </span>
                      </div>

                      <p className='achievement-desc'>{item.description}</p>
                    </div>
                  </div>
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

  return (
    <div className='profile'>
      <div className='profile-content'>
        <div className='profile-set'>
          <div className='notification-wrap' ref={notificationRef}>
            <img
              src={notification}
              alt='notification'
              className={`icons set-icons ${isNotificationOpen ? 'set-icons--active' : ''}`}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()

                setNotificationPosition({
                  top: rect.bottom + 8,
                  right: window.innerWidth - rect.right,
                })

                setIsNotificationOpen((prev) => {
                  const next = !prev
                  if (next) setHasUnreadNotification(false)
                  return next
                })
              }}
              title='최근 포인트 변동 알림'
            />

            {hasUnreadNotification && <span className='notification-dot' />}

            {isNotificationOpen && (
              <div
                className='notification-dropdown notification-dropdown--fixed'
                style={{
                  top: `${notificationPosition.top}px`,
                  right: `${notificationPosition.right}px`,
                }}
              >
                <div className='notification-dropdown-title'>최근 알림 목록</div>

                {notifications.length === 0 ? (
                  <div className='notification-empty'>알림이 없습니다.</div>
                ) : (
                  notifications.slice(0, 5).map((item) => (
                    <div className='notification-item' key={item.history_id}>
                      <div className='notification-item-left'>
                        <div className='notification-name'>{item.type}</div>
                        <div className='notification-date'>
                          {formatNoticeDate(item.createdAt)}
                        </div>
                      </div>

                      <div
                        className={`notification-amount ${
                          Number(item.changeAmount) >= 0 ? 'positive' : 'negative'
                        }`}
                      >
                        {Number(item.changeAmount) >= 0 ? '+' : ''}
                        {Number(item.changeAmount).toLocaleString('ko-KR')}pt
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <img
            src={account}
            alt='account'
            className={`icons set-icons ${editMode ? 'set-icons--active' : ''}`}
            onClick={editMode ? closeEdit : openEdit}
            title={editMode ? '편집 취소' : '프로필 편집'}
          />

          <img
            src={logout}
            alt='logout'
            className='icons set-icons'
            onClick={handleLogout}
          />
        </div>

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
              className={`profile-membership ${
                isPremium ? 'profile-membership--premium' : 'profile-membership--free'
              }`}
            >
              {isPremium ? '👑' : 'Free'}
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
              <h2 className='profile-name'>{member?.nickname || '사용자'}</h2>
              <div className='profile-title-badge'>
                <span>
                  {equippedTitle?.name || member?.title || '🌱 Vivere 주린이'}
                </span>

                <div className='isr-tooltip-wrap'>
                  <span className='isr-tooltip-icon'>ⓘ</span>
                  <span className='isr-tooltip-text'>
                    {equippedTitle?.description || '칭호 설명이 없습니다.'}
                  </span>
                </div>
              </div>
            </>
          )}

          <div className='profile-stats'>
            <div className='stats-description'>
              <span className='description-top'>{member?.tier || '브론즈'}</span>
              <p>{Number(rankingPoint || member?.rank_num || 0).toFixed(1)}</p>
            </div>
            <hr />
            <div className='stats-description'>
              <span className='description-top'>ISR</span>
              <p>{member?.isr_score ?? 0}</p>
            </div>
          </div>
        </div>

        <div className='total-description'>
          <span className='description-top'>보유 포인트</span>
          <p className='description-slave'>
            {formatNumber(member?.points ?? 0)}
            <span>pt</span>
          </p>
        </div>

        <div className='profile-stock'>
          <h2>투자 현황</h2>
          <div className='stock-list'>
            <div className='stock-content'>
              <span className='description-top'>원금</span>
              <p className='description-slave'>
                {formatNumber(investmentSummary.totalInvested)}
                <span>pt</span>
              </p>
            </div>

            <div className='stock-content'>
              <span
                className={`description-top ${
                  Number(investmentSummary.totalProfit) >= 0 ? '' : 'loss'
                }`}
              >
                총순익
              </span>
              <p
                className={`description-slave ${
                  Number(investmentSummary.totalProfit) >= 0 ? 'gain' : 'loss'
                }`}
              >
                {formatSignedNumber(investmentSummary.totalProfit)}
                <span>pt</span>
              </p>
            </div>

            <div className='stock-content'>
              <span className='description-top'>변동률</span>
              <p
                className={`description-slave ${
                  Number(totalProfitRate) >= 0 ? 'gain' : 'loss'
                }`}
              >
                {Number(totalProfitRate).toFixed(2)}
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
                  <img
                    src={
                      typeof item === 'object' && item?.ach_img
                        ? item.ach_img
                        : vivereBeginner
                    }
                    alt='achievement'
                    className='achievement-recent-img'
                  />

                  <div className='achievement-recent-name'>
                    {typeof item === 'string' ? item : item?.name}
                  </div>
                </div>
              ))
            ) : (
              <div className='achievement-empty-block'>표시할 업적이 없습니다.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile