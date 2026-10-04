'use client';

/**
 * BỘ TỔNG HỢP ÂM THANH GAME THỊ TRƯỞNG MOMO (Pure Web Audio API)
 *
 * Đặc điểm:
 * - 0MB dung lượng, 0 tài nguyên file ngoài (không MP3/WAV/OGG).
 * - Chạy tức thì, không bị độ trễ mạng (zero latency).
 * - Singleton AudioContext khởi tạo lười (lazy) khi người chơi chạm lần đầu.
 * - Hỗ trợ Mute/Unmute lưu trong localStorage.
 */

let audioCtx: AudioContext | null = null;
let muted = false;

// Đọc cài đặt mute từ localStorage nếu có
if (typeof window !== 'undefined') {
  try {
    muted = localStorage.getItem('mocity_sound_muted') === 'true';
  } catch {
    muted = false;
  }
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSoundMuted(): boolean {
  return muted;
}

export function toggleSoundMute(): boolean {
  muted = !muted;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('mocity_sound_muted', String(muted));
    } catch {
      // Ignore
    }
  }
  return muted;
}

/**
 * Tiếng leng keng tiền xu VNĐ rơi vào túi (Ting! ✨)
 */
export function playTing(pitch = 1.0) {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = 'sine';
  osc2.type = 'triangle';

  // Tần số cao trong vắt (G6 và D7)
  const baseFreq = 1568 * pitch;
  osc1.frequency.setValueAtTime(baseFreq, now);
  osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.12);

  osc2.frequency.setValueAtTime(baseFreq * 2, now);
  osc2.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, now + 0.1);

  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.3);
  osc2.stop(now + 0.3);
}

/**
 * Tiếng nổ Siêu Lợi Nhuận x10 (Jackpot Arpeggio 💥 Ta-da!)
 */
export function playJackpot() {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Hợp âm Đô trưởng thăng hoa C5 -> E5 -> G5 -> C6 -> E6 -> G6
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];

  notes.forEach((freq, idx) => {
    const noteTime = now + idx * 0.06;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = idx === notes.length - 1 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, noteTime);

    gain.gain.setValueAtTime(0.28, noteTime);
    gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(noteTime);
    osc.stop(noteTime + 0.5);
  });
}

/**
 * Tiếng bật Pop vui tai (thu hoạch nhanh, click tab)
 */
export function playPop() {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(780, now + 0.06);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.09);
}

/**
 * Tiếng máy thu ngân Ka-Ching (khi nhận tiền tiết kiệm hoặc chốt quỹ)
 */
export function playKaChing() {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(987.77, now); // B5
  osc1.frequency.setValueAtTime(1318.51, now + 0.08); // E6

  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(1975.53, now + 0.08); // B6

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now + 0.08);
  osc1.stop(now + 0.45);
  osc2.stop(now + 0.45);
}

/**
 * Tiếng còi báo động khẩn cấp (Sự cố hỏa hoạn / trộm cắp)
 */
export function playAlert() {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.linearRampToValueAtTime(450, now + 0.15);
  osc.frequency.linearRampToValueAtTime(800, now + 0.3);

  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.38);
}

/**
 * Tiếng chúc mừng thăng cấp / trả lời đúng Quiz
 */
export function playSuccess() {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const chord = [523.25, 659.25, 783.99, 1046.5]; // C E G C

  chord.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + i * 0.04);

    gain.gain.setValueAtTime(0.25, now + i * 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + i * 0.04);
    osc.stop(now + 0.6);
  });
}

/**
 * Tiếng thất bại / hết năng lượng AP / không đủ tiền
 */
export function playError() {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(110, now + 0.18);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.25);
}
