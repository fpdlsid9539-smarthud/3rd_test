import React from 'react'
import profile from '../assets/chicken running machine.gif'
import './Ranking.css'

const currentSeason = '2026-S1'
const myMemberId = 2

// leaderBoard 테이블 기준 더미데이터
const leaderboardRows = [
  { board_id: 1, season_name: '2026-S1', member_id: 2, score: 99, rank_num: 99, tier: 'bronze' },
  { board_id: 2, season_name: '2026-S1', member_id: 1, score: 99, rank_num: 1, tier: 'bronze' },
  { board_id: 3, season_name: '2026-S1', member_id: 3, score: 99, rank_num: 2, tier: 'bronze' },
  { board_id: 4, season_name: '2026-S1', member_id: 4, score: 99, rank_num: 3, tier: 'bronze' },
  { board_id: 5, season_name: '2026-S1', member_id: 17, score: 99, rank_num: 4, tier: 'bronze' },
  { board_id: 6, season_name: '2026-S1', member_id: 18, score: 99, rank_num: 5, tier: 'bronze' },
  { board_id: 7, season_name: '2026-S1', member_id: 19, score: 99, rank_num: 6, tier: 'bronze' },
  { board_id: 8, season_name: '2026-S1', member_id: 20, score: 99, rank_num: 7, tier: 'bronze' },

  { board_id: 9, season_name: '2026-S1', member_id: 5, score: 99, rank_num: 1, tier: 'silver' },
  { board_id: 10, season_name: '2026-S1', member_id: 6, score: 99, rank_num: 2, tier: 'silver' },
  { board_id: 11, season_name: '2026-S1', member_id: 7, score: 99, rank_num: 3, tier: 'silver' },
  { board_id: 12, season_name: '2026-S1', member_id: 8, score: 99, rank_num: 4, tier: 'silver' },
  { board_id: 13, season_name: '2026-S1', member_id: 21, score: 99, rank_num: 5, tier: 'silver' },
  { board_id: 14, season_name: '2026-S1', member_id: 22, score: 99, rank_num: 6, tier: 'silver' },
  { board_id: 15, season_name: '2026-S1', member_id: 23, score: 99, rank_num: 7, tier: 'silver' },
  { board_id: 16, season_name: '2026-S1', member_id: 24, score: 99, rank_num: 8, tier: 'silver' },

  { board_id: 17, season_name: '2026-S1', member_id: 9, score: 99, rank_num: 1, tier: 'gold' },
  { board_id: 18, season_name: '2026-S1', member_id: 10, score: 99, rank_num: 2, tier: 'gold' },
  { board_id: 19, season_name: '2026-S1', member_id: 11, score: 99, rank_num: 3, tier: 'gold' },
  { board_id: 20, season_name: '2026-S1', member_id: 12, score: 99, rank_num: 4, tier: 'gold' },
  { board_id: 21, season_name: '2026-S1', member_id: 25, score: 99, rank_num: 5, tier: 'gold' },
  { board_id: 22, season_name: '2026-S1', member_id: 26, score: 99, rank_num: 6, tier: 'gold' },
  { board_id: 23, season_name: '2026-S1', member_id: 27, score: 99, rank_num: 7, tier: 'gold' },
  { board_id: 24, season_name: '2026-S1', member_id: 28, score: 99, rank_num: 8, tier: 'gold' },

  { board_id: 25, season_name: '2026-S1', member_id: 13, score: 99, rank_num: 1, tier: 'diamond' },
  { board_id: 26, season_name: '2026-S1', member_id: 14, score: 99, rank_num: 2, tier: 'diamond' },
  { board_id: 27, season_name: '2026-S1', member_id: 15, score: 99, rank_num: 3, tier: 'diamond' },
  { board_id: 28, season_name: '2026-S1', member_id: 16, score: 99, rank_num: 4, tier: 'diamond' },
  { board_id: 29, season_name: '2026-S1', member_id: 29, score: 99, rank_num: 5, tier: 'diamond' },
  { board_id: 30, season_name: '2026-S1', member_id: 30, score: 99, rank_num: 6, tier: 'diamond' },
  { board_id: 31, season_name: '2026-S1', member_id: 31, score: 99, rank_num: 7, tier: 'diamond' },
  { board_id: 32, season_name: '2026-S1', member_id: 32, score: 99, rank_num: 8, tier: 'diamond' },
]

const memberMap = {
  1: { nickname: 'nick', profileImage: profile },
  2: { nickname: 'Vivere', profileImage: profile },
  3: { nickname: 'nick', profileImage: profile },
  4: { nickname: 'nick', profileImage: profile },
  5: { nickname: 'nick', profileImage: profile },
  6: { nickname: 'nick', profileImage: profile },
  7: { nickname: 'nick', profileImage: profile },
  8: { nickname: 'nick', profileImage: profile },
  9: { nickname: 'nick', profileImage: profile },
  10: { nickname: 'nick', profileImage: profile },
  11: { nickname: 'nick', profileImage: profile },
  12: { nickname: 'ComeAgain', profileImage: profile },
  13: { nickname: 'nick', profileImage: profile },
  14: { nickname: 'nick', profileImage: profile },
  15: { nickname: 'ComeAgain', profileImage: profile },
  16: { nickname: 'ComeAgain', profileImage: profile },
  17: { nickname: 'ComeAgain', profileImage: profile },
  18: { nickname: 'ComeAgain', profileImage: profile },
  19: { nickname: 'ComeAgain', profileImage: profile },
  20: { nickname: 'ComeAgain', profileImage: profile },
  21: { nickname: 'ComeAgain', profileImage: profile },
  22: { nickname: 'ComeAgain', profileImage: profile },
  23: { nickname: 'ComeAgain', profileImage: profile },
  24: { nickname: 'ComeAgain', profileImage: profile },
  25: { nickname: 'ComeAgain', profileImage: profile },
  26: { nickname: 'ComeAgain', profileImage: profile },
  27: { nickname: 'ComeAgain', profileImage: profile },
  28: { nickname: 'ComeAgain', profileImage: profile },
  29: { nickname: 'ComeAgain', profileImage: profile },
  30: { nickname: 'ComeAgain', profileImage: profile },
  31: { nickname: 'ComeAgain', profileImage: profile },
  32: { nickname: 'ComeAgain', profileImage: profile },
}

const leagueConfig = [
  { id: 'bronze', title: '브론즈' },
  { id: 'silver', title: '실버' },
  { id: 'gold', title: '골드' },
  { id: 'diamond', title: '다이아' },
]

const groupedRows = {
  bronze: leaderboardRows.filter((row) => row.tier === 'bronze'),
  silver: leaderboardRows.filter((row) => row.tier === 'silver'),
  gold: leaderboardRows.filter((row) => row.tier === 'gold'),
  diamond: leaderboardRows.filter((row) => row.tier === 'diamond'),
}

const Ranking = () => {
  return (
    <main className='ranking-container'>
      <div className='ranking-breadcrumb'>대시보드 &gt; 랭킹</div>

      <section className='ranking-summary-card'>
        <h1>
          모두의 성적, <strong>시즌 랭킹!</strong>
        </h1>
        <p>
          <span className='summary-highlight'>나의 순위는</span> 어디에?
        </p>
      </section>

      <section className='league-grid'>
        {leagueConfig.map((league) => (
          <article className='league-card' key={league.id}>
            <div className={`league-emblem ${league.id}`}></div>

            <ul className='league-user-list'>
              {groupedRows[league.id].slice(0, 10).map((row) => {
                const member = memberMap[row.member_id]
                const isMe = row.member_id === myMemberId

                return (
                  <li
                    className={`league-user-item ${isMe ? 'my-row' : ''}`}
                    key={row.board_id}
                  >
                    <span className='league-rank'>{row.rank_num}</span>

                    <div className='league-user-main'>
                      <img
                        src={member.profileImage}
                        alt={`${member.nickname} 프로필`}
                        className='league-profile'
                      />
                      <span className='league-name'>{member.nickname}</span>
                    </div>

                    <span className='league-score'>{row.score}</span>
                  </li>
                )
              })}
            </ul>
          </article>
        ))}
      </section>
    </main>
  )
}

export default Ranking