'use client';

import { Flame } from 'lucide-react';

import {
  STREAK_MILESTONES,
  nextStreakMilestone,
  streakMilestoneReached,
} from '@/lib/mocity/mock-city-data';
import { currentStreak, streakAtRisk, useCity } from '@/lib/mocity/store';
import { formatCompact } from '@/lib/mocity/format';

/**
 * CHUỖI NGÀY CHƠI LIÊN TIẾP.
 *
 * Đây là màn hình nói rõ "bạn đã chơi liên tục bao lâu và mất bao nhiêu nếu
 * bỏ hôm nay". Cơ chế giữ người chơi quay lại rẻ nhất trong toàn bộ thiết
 * kế, và nó chỉ hiệu quả khi người chơi **nhìn thấy** thứ đang có nguy cơ mất.
 */
export default function StreakBoard() {
  const streak = useCity((s) => s.streak);
  const claimed = useCity((s) => s.streakClaimed ?? 0);

  const days = streak?.lastDay === streak?.lastDay ? currentStreak() : 0;
  const atRisk = streakAtRisk();
  const reached = streakMilestoneReached(days);
  const next = nextStreakMilestone(days);
  const shields = streak?.shields ?? 0;

  // Chuỗi đã vỡ: vẫn hiện kỷ lục và mốc đang chờ.
  const broken = days === 0 && (streak?.best ?? 0) > 0;
  const shownDays = days > 0 ? days : (streak?.best ?? 0);

  return (
    <div className="space-y-3">
      {/* Con số chính */}
      <div
        className="rounded-2xl border-2 p-4 text-center"
        style={{
          background:
            days > 0
              ? 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)'
              : 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
          borderColor: days > 0 ? '#FB923C' : '#D1D5DB',
        }}
      >
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
          style={{
            background: days > 0 ? 'rgba(251,146,60,0.2)' : 'rgba(156,163,175,0.15)',
          }}
        >
          <Flame
            size={26}
            className={days > 0 ? 'fill-orange-500 text-orange-500' : 'text-gray-400'}
          />
        </div>

        <p
          className="mt-2 text-4xl font-black tabular-nums"
          style={{ color: days > 0 ? '#C2410C' : '#9CA3AF' }}
        >
          {days > 0 ? days : '—'}
        </p>
        <p className="text-xs font-black uppercase tracking-wide text-[#6E4F3A]">
          {days > 0 ? 'ngày chơi liên tiếp' : broken ? 'chuỗi đã ngắt' : 'chưa bắt đầu'}
        </p>

        {atRisk > 0 && (
          <p className="mt-2 rounded-lg bg-white/70 px-2 py-1 text-[13px] font-bold text-[#B45309]">
            Chuỗi {atRisk} ngày của bạn đang chờ được nối tiếp hôm nay.
          </p>
        )}
        {/*
         * Phiếu bảo vệ: hiện ở đây vì nó là câu trả lời trực tiếp cho câu hỏi
         "bỏ một ngày thì mất gì". Không có nó thì cảnh báo trên đúng một dòng
         "chuỗi 12 ngày đang chờ nối tiếp" nghe như đe doạ vô dụng.
         */}
        {shields > 0 && (
          <p className="mt-2 rounded-lg border border-[#C9A227] bg-white/70 px-2 py-1 text-[13px] font-bold text-[#8B6318]">
            🛡️ Bạn có {shields} phiếu bảo vệ. Bỏ đúng một ngày thì chuỗi được giữ,
            chỉ mất 1 phiếu.
          </p>
        )}
        {broken && (
          <p className="mt-2 rounded-lg bg-white/70 px-2 py-1 text-[13px] font-bold text-[#4B5563]">
            Chuỗi gần nhất dài {streak?.best} ngày. Vào chơi hôm nay để bắt đầu lại.
          </p>
        )}
      </div>

      {/* Thanh tiến tới mốc kế tiếp */}
      {next && (
        <div
          className="rounded-2xl border-2 p-3.5"
          style={{ background: '#FFFDF7', borderColor: '#FB923C66' }}
        >
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[12px] font-black uppercase tracking-wide text-[#C2410C]">
              Mốc tiếp theo
            </p>
            <p className="text-[13px] font-black text-[#6E4F3A]">
              {days}/{next.days} ngày
            </p>
          </div>
          <p className="mt-0.5 text-sm font-black text-[#3E2A1B]">{next.title}</p>

          <div
            className="mt-2 h-2.5 w-full overflow-hidden rounded-full"
            style={{ background: '#FFEDD5' }}
          >
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${Math.min(100, Math.round((days / next.days) * 100))}%`,
                background: 'linear-gradient(90deg,#FB923C,#EF4444)',
              }}
            />
          </div>
          <p className="mt-1.5 text-[12px] font-bold text-[#8B6318]">
            Còn {Math.max(0, next.days - days)} ngày · +{formatCompact(next.rewardCoins)} Xu · +
            {next.rewardGems} KC
          </p>
        </div>
      )}
      {!next && (
        <div
          className="rounded-2xl border-2 p-3.5 text-center"
          style={{ background: '#FFFDF7', borderColor: '#FB923C66' }}
        >
          <p className="text-sm font-black text-[#C2410C]">
            Đã chạm tất cả {STREAK_MILESTONES.length} mốc chuỗi ngày.
          </p>
          <p className="mt-0.5 text-[13px] font-semibold text-[#6E4F3A]">
            Chuỗi dài nhất của bạn: {streak?.best ?? 0} ngày.
          </p>
        </div>
      )}

      {/* Các mốc */}
      <div
        className="rounded-2xl border-2 p-3.5"
        style={{ background: '#FFFDF7', borderColor: '#FB923C44' }}
      >
        <p className="text-[12px] font-black uppercase tracking-wide text-[#C2410C]">
          Lộ trình mốc
        </p>
        <div className="mt-2 space-y-1.5">
          {STREAK_MILESTONES.map((m) => {
            const unlocked = shownDays >= m.days;
            const done = claimed >= m.days;
            return (
              <div
                key={m.days}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5"
                style={{ background: unlocked ? '#FFF7ED' : '#F9FAFB' }}
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-black"
                  style={{
                    background: unlocked ? '#FB923C' : '#E5E7EB',
                    color: unlocked ? '#fff' : '#9CA3AF',
                  }}
                >
                  {m.days}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-[13px] font-black"
                    style={{ color: unlocked ? '#3E2A1B' : '#9CA3AF' }}
                  >
                    {m.title}
                  </p>
                  <p className="text-[12px] font-bold text-[#6E4F3A]">
                    +{formatCompact(m.rewardCoins)} Xu · +{m.rewardGems} KC ·{' '}
                    +{formatCompact(m.rewardXp)} XP
                  </p>
                </div>
                <span
                  className="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-black"
                  style={
                    done
                      ? { background: '#DCFCE7', color: '#047857' }
                      : unlocked
                        ? { background: '#DBEAFE', color: '#1D4ED8' }
                        : { background: '#F3F4F6', color: '#9CA3AF' }
                  }
                >
                  {done ? 'Đã nhận' : unlocked ? 'Sẵn sàng' : `${m.days} ngày`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {reached && (
        <p className="px-1 text-[12px] font-semibold leading-relaxed text-[#6E4F3A]">
          Thưởng mốc được trao một lần cho mỗi mốc. Chuỗi của bạn dài hơn sẽ tự động
          nhận được các mốc còn thiếu — không cần chơi lại đúng số ngày đó.
        </p>
      )}
    </div>
  );
}