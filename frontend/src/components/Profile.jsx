import React, { useEffect, useState, useRef } from 'react'
import './Profile.css'
import notification from '../assets/icons/notification.svg'
import account from '../assets/icons/account.svg'
import logout from '../assets/icons/logout.svg'
import defaultProfile from '../assets/chicken running machine.png'
import vivereBeginner from '../assets/icons/achievement/vivere_beginner.png'
import { api } from '../config/api.js'

const Profile = () => {

  const [member, setMember] = useState(null)
  const [recentAchievements, setRecentAchievements] = useState([])
  const [gameLog, setGameLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 편집 모드
  const [editMode, setEditMode] = useState(false)
  const [editNickname, setEditNickname] = useState('')
  const [editPreviewUrl, setEditPreviewUrl] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const fileInputRef = useRef(null)
  const nicknameInputRef = useRef(null)

  const loadProfile = async () => {
    try {
      const data = await api.get('/api/auth/me');
      setMember(data.data.member);
      setRecentAchievements(data.data.recentAchievements || []);
      setGameLog(data.data.gameLog);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    // Initial load
    loadProfile()

    // Listen for the custom event
    const handleRefresh = () => {
      console.log('Refreshing profile due to points update...')
      loadProfile()
    }

    window.addEventListener('pointsUpdated', handleRefresh)

    // Clean up listener on unmount
    return () => {
      window.removeEventListener('pointsUpdated', handleRefresh)
    }
  }, [])

  const profileImg = member?.profile_image || defaultProfile
  const displayImg = editPreviewUrl || profileImg

  const openEdit = () => {
    setEditNickname(member?.nickname || '')
    setEditPreviewUrl(null)
    setSaveError('')
    setEditMode(true)
    // 편집 모드 전환 후 닉네임 input 에 포커스
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
      const data = await api.patch('/api/auth/me', { nickname: editNickname.trim() })
      setMember(prev => ({
        ...prev,
        ...data.data.member,
        // 백엔드 사진 업로드 전까지 로컬 미리보기 유지
        profile_image: editPreviewUrl || data.data.member.profile_image,
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
    if (!confirm("로그아웃 하시겠어요?")) return;

    localStorage.removeItem('token');
    localStorage.removeItem('member');
    localStorage.removeItem('nickname');
    sessionStorage.clear();

    alert('안전하게 로그아웃 되었습니다!');
    window.location.href = '/';
  }

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

  return (
    <div className='profile'>
      <div className='profile-content'>

        {/* 상단 아이콘 */}
        <div className='profile-set'>
          <img src={notification} alt="notification" className='icons set-icons' />
          <img
            src={account}
            alt="account"
            className={`icons set-icons ${editMode ? 'set-icons--active' : ''}`}
            onClick={editMode ? closeEdit : openEdit}
            title={editMode ? '편집 취소' : '프로필 편집'}
          />
          <img
            src={logout}
            alt="logout"
            className='icons set-icons'
            onClick={handleLogout}
          />
        </div>

        {/* 프로필 마스터 */}
        <div className='profile-master'>

          {/* 프로필 사진 — 편집 모드일 때 클릭 가능 */}
          <div className='profile-account'>
            <div
              className={`glowing-container ${editMode ? 'glowing-container--editable' : ''}`}
              style={{ '--profile-url': `url(${displayImg})` }}
              onClick={editMode ? () => fileInputRef.current?.click() : undefined}
              title={editMode ? '사진 변경' : undefined}
            >
              <img src={displayImg} alt="profile image" className='profile-pic' />
              {editMode && (
                <div className='avatar-edit-overlay'>
                  <span>📷</span>
                </div>
              )}
            </div>
            <div className='profile-premium'>👑</div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />
          </div>

          {/* 닉네임 — 편집 모드일 때 input으로 전환 */}
          {editMode ? (
            <div className='nickname-edit-wrap'>
              <input
                ref={nicknameInputRef}
                className='nickname-input'
                type="text"
                value={editNickname}
                maxLength={20}
                onChange={(e) => setEditNickname(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave()
                  if (e.key === 'Escape') closeEdit()
                }}
                placeholder="닉네임 입력"
              />
              {saveError && <p className='nickname-error'>{saveError}</p>}
              <div className='nickname-actions'>
                <button className='edit-btn edit-btn--cancel' onClick={closeEdit} disabled={saving}>취소</button>
                <button className='edit-btn edit-btn--save' onClick={handleSave} disabled={saving}>
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          ) : (
            <h2 className='profile-name'>{member?.nickname || '사용자'}</h2>
          )}

          <div className='profile-stats'>
            <div className='stats-description'>
              <span className='description-top'>{member?.tier || '브론즈'}</span>
              <p>{member?.rank_num ?? 999}</p>
            </div>
            <hr />
            <div className='stats-description'>
              <span className='description-top'>ISR</span>
              <p>{member?.isr_score ?? 0}</p>
            </div>
          </div>
        </div>

        <div className='total-description'>
          <span className='description-top'>시즌 누적 포인트</span>
          <p className='description-slave'>
            {member?.points ?? 0}
            <span>pt</span>
          </p>
        </div>

        <div className='profile-stock'>
          <h2>투자 현황</h2>
          <div className='stock-list'>
            <div className='stock-content'>
              <span className='description-top'>원금</span>
              <p className='description-slave'>{member?.bet_amount?? 0}<span>pt</span></p>
            </div>
            <div className='stock-content'>
              <span className='description-top'>총순익</span>
              <p className='description-slave gain'>{member?.pnl_amount?? 0}<span>pt</span></p>
            </div>
            <div className='stock-content'>
              <span className='description-top'>변동률</span>
              <p className='description-slave gain'>0<span>%</span></p>
            </div>
          </div>
        </div>

        <div className='profile-stock'>
          <h2>달성한 업적</h2>
          <div className='achievment-list'>
            {recentAchievements.length > 0 ? (
              recentAchievements.map((item, index) => (
                <div className='achievment-item' key={`${item}-${index}`}>
                  <img src={vivereBeginner} alt="achievments" className='img-block' />
                  <div className='achievment-description'>
                    <span className='achievement-slave'>{item}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className='achievment-item'>
                <img src={vivereBeginner} alt="achievments" className='img-block' />
                <div className='achievment-description'>
                  <span className='achievement-slave'>표시할 업적이 없습니다.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile