'use client';

import type { TimeOfDay } from '@/lib/mocity/types';

/**
 * Dan phuong tien chay duoi LONG DUONG, ve theo cut paper giong nhan vat:
 * moi bo phan la mot mang phang, khong stroke, chieu sau bang lop dam hon.
 *
 * Moi xe cao toi da 56px de vua mot lan duong. Lan tren (`far`) chay sang
 * phai, lan duoi (`near`) chay sang trai.
 */

const TRAFFIC_CSS = `
@keyframes viahe-drive-r {
  0%   { transform: translateX(-240px); }
  100% { transform: translateX(2240px); }
}
@keyframes viahe-drive-l {
  0%   { transform: translateX(2240px) scaleX(-1); }
  100% { transform: translateX(-240px) scaleX(-1); }
}
`;

function Wheel({ cx, cy, r = 7 }: { cx: number; cy: number; r?: number }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill="#2A3442" />
      <circle cx={cx} cy={cy} r={r * 0.42} fill="#C3CCD8" />
    </>
  );
}

/** Den pha hat sang khi troi toi. */
function Beam({ x, y, on }: { x: number; y: number; on: boolean }) {
  if (!on) return null;
  return <polygon points={`${x},${y - 5} ${x + 96},${y - 22} ${x + 96},${y + 16}`} fill="rgba(254,240,138,0.4)" />;
}

function XichLo({ night }: { night: boolean }) {
  return (
    <svg width="98" height="56" viewBox="0 0 98 56" className="overflow-visible">
      <ellipse cx="49" cy="53" rx="34" ry="2.6" fill="rgba(62,42,27,0.16)" />
      <Wheel cx={18} cy={44} r={8} />
      <Wheel cx={82} cy={44} r={7} />
      {/* Khung noi cabin voi phan dap */}
      <path d="M26 40 L68 38 L69 42 L27 44 Z" fill="#4A4038" />
      <path d="M62 40 L72 24 L76 25.6 L66 41.6 Z" fill="#5A4E42" />
      {/* Cabin khach - mang phang + lop dam ben trai */}
      <path d="M6 42 L40 42 L40 24 L6 26 Z" fill="#2E7D6E" />
      <path d="M6 42 L15 42 L15 25.2 L6 26 Z" fill="#1F5A4E" />
      {/* Mui che vai do */}
      <path d="M3 25 Q22 8 43 23 L43 27 Q22 13 4 29 Z" fill="#D94F3D" />
      <path d="M22.4 15.6 Q33 18.4 43 23 L43 27 Q33 21.6 23 18.6 Z" fill="#A83628" />
      {/* Khach ngoi */}
      <circle cx="24" cy="31" r="5.4" fill="#FCD9BD" />
      <path d="M18.6 31.4 C18.6 24.6 29.4 24.6 29.4 31.4 C26 28.4 22 28.4 18.6 31.4 Z" fill="#2E1D16" />
      <path d="M19 42 L29 42 L29 34.4 L19 34.4 Z" fill="#E8B23C" />
      {/* Nguoi dap */}
      <path d="M64 38 L76 38 L75.2 26 L65 26 Z" fill="#4C83C4" />
      <path d="M64 38 L68 38 L67.6 26 L65 26 Z" fill="#35639A" />
      <circle cx="70" cy="19" r="6" fill="#FCD9BD" />
      <path d="M62.8 19.6 L77.2 19.6 L76.6 16 L63.4 16 Z" fill="#DEBE63" />
      <path d="M63.6 13.4 L76.4 13.4 Q70 5.4 63.6 13.4 Z" fill="#DEBE63" />
      <Beam x={90} y={38} on={night} />
    </svg>
  );
}

function XeDayDoAn({ night }: { night: boolean }) {
  return (
    <svg width="92" height="58" viewBox="0 0 92 58" className="overflow-visible">
      <ellipse cx="42" cy="55" rx="32" ry="2.6" fill="rgba(62,42,27,0.16)" />
      <Wheel cx={20} cy={47} r={6} />
      <Wheel cx={52} cy={47} r={6} />
      {/* Than xe day */}
      <path d="M8 44 L66 44 L66 28 L8 28 Z" fill="#E8D5A8" />
      <path d="M8 44 L66 44 L66 38.6 L8 38.6 Z" fill="#C9B078" />
      <path d="M8 28 L66 28 L66 31.4 L8 31.4 Z" fill="#A8926A" />
      {/* Mai che soc do trang */}
      <path d="M2 24 L72 24 L72 28 L2 28 Z" fill="#B23A2C" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <path key={i} d={`M${4 + i * 10} 14 L${12 + i * 10} 14 L${12 + i * 10} 24 L${4 + i * 10} 24 Z`} fill={i % 2 ? '#F5EDD8' : '#D94F3D'} />
      ))}
      <path d="M2 11 L72 11 L72 14.6 L2 14.6 Z" fill="#8F2C20" />
      {/* Noi nuoc leo + hoi boc */}
      <path d="M16 28 L34 28 L34 18.6 L16 18.6 Z" fill="#8A7A68" />
      <path d="M14 18.6 L36 18.6 L36 22 L14 22 Z" fill="#6B5D4E" />
      {/* Tay day */}
      <path d="M66 32 L78 32 L78 35 L66 35 Z" fill="#8A7A68" />
      {/* Nguoi ban */}
      <path d="M76 46 L88 46 L87 30 L77 30 Z" fill="#C2410C" />
      <path d="M76 46 L80 46 L79.4 30 L77 30 Z" fill="#92300A" />
      <circle cx="82" cy="23" r="6.2" fill="#FCD9BD" />
      <path d="M74.6 23.8 L89.4 23.8 L88.8 20 L75.2 20 Z" fill="#DEBE63" />
      <path d="M75.4 17.4 L88.6 17.4 Q82 9 75.4 17.4 Z" fill="#DEBE63" />
      <Beam x={2} y={38} on={night} />
    </svg>
  );
}

function OTo({ night }: { night: boolean }) {
  return (
    <svg width="106" height="50" viewBox="0 0 106 50" className="overflow-visible">
      <ellipse cx="53" cy="47" rx="40" ry="2.8" fill="rgba(62,42,27,0.16)" />
      {/* Than xe taxi vang retro */}
      <path d="M4 38 L102 38 L100 24 L80 24 L68 11 L36 11 L26 24 L6 25 Z" fill="#E8B23C" />
      <path d="M4 38 L102 38 L101.4 32 L4.6 32 Z" fill="#C08E22" />
      {/* Kinh */}
      <path d="M39 14 L51 14 L51 24 L30 24 Z" fill="#BDD8E8" />
      <path d="M55 14 L66 14 L75 24 L55 24 Z" fill="#BDD8E8" />
      {/* Soc hong taxi */}
      <path d="M6 28.4 L100 28.4 L100 31.4 L6 31.4 Z" fill="#8A6414" />
      {/* Mao taxi tren noc */}
      <path d="M44 5 L62 5 L62 11 L44 11 Z" fill="#2E7D32" />
      <path d="M44 5 L62 5 L62 7.4 L44 7.4 Z" fill="#1F5A23" />
      <Wheel cx={27} cy={39} r={8} />
      <Wheel cx={82} cy={39} r={8} />
      {/* Den */}
      <path d="M98 26 L103 26 L103 30 L98 30 Z" fill="#FDE68A" />
      <Beam x={103} y={30} on={night} />
    </svg>
  );
}

function VinFast({ night }: { night: boolean }) {
  return (
    <svg width="110" height="50" viewBox="0 0 110 50" className="overflow-visible">
      <ellipse cx="55" cy="47" rx="42" ry="2.8" fill="rgba(62,42,27,0.16)" />
      {/* SUV dien, dang bo tron hien dai */}
      <path d="M4 38 L106 38 L104 22 L84 20 L70 8 L38 8 L24 21 L5 24 Z" fill="#2B6CB0" />
      <path d="M4 38 L106 38 L105.2 31 L4.8 31 Z" fill="#1E4E84" />
      {/* Kinh lien khoi */}
      <path d="M40 11 L53 11 L53 21 L28.4 21.4 Z" fill="#C6DEEE" />
      <path d="M57 11 L68 11 L79 20.6 L57 20.6 Z" fill="#C6DEEE" />
      {/* Chi ma bac */}
      <path d="M6 27.6 L104 27.6 L104 29.6 L6 29.6 Z" fill="#8FB4D8" />
      {/* Logo V */}
      <path d="M14 32.6 L17.6 32.6 L19.6 36.4 L21.6 32.6 L25.2 32.6 L19.6 42 Z" fill="#E8EEF6" />
      <Wheel cx={28} cy={39} r={8.4} />
      <Wheel cx={85} cy={39} r={8.4} />
      {/* Dai den LED dac trung xe dien */}
      <path d="M96 23.6 L104.4 24.2 L104.4 26.6 L96 26 Z" fill="#DDF2FF" />
      <Beam x={105} y={29} on={night} />
    </svg>
  );
}

function XeMay({ night }: { night: boolean }) {
  return (
    <svg width="72" height="54" viewBox="0 0 72 54" className="overflow-visible">
      <ellipse cx="36" cy="51" rx="23" ry="2.6" fill="rgba(62,42,27,0.16)" />
      <Wheel cx={16} cy={43} r={7.6} />
      <Wheel cx={56} cy={43} r={7.6} />
      <path d="M11 40 L29 28 L48 38 L45 42.4 L28 33.6 Z" fill="#1E4FBF" />
      <path d="M46 40 L55 25 L59 26.6 L50 42 Z" fill="#2563EB" />
      <path d="M49 24 L59.4 25 L59 27.8 L48.6 26.8 Z" fill="#17388A" />
      <path d="M14 28 L32 29 L31.6 35.4 L13.6 34.4 Z" fill="#1E293B" />
      {/* Nguoi lai */}
      <path d="M24 15.6 L37 16.2 L36.4 32.4 L23.4 31.8 Z" fill="#4BC6DC" />
      <path d="M24 15.6 L28 15.8 L27.4 32 L23.4 31.8 Z" fill="#35A3B8" />
      <path d="M34.6 19.6 L50 26 L48.4 29.2 L33.4 23 Z" fill="#E8C6A6" />
      <circle cx="31" cy="9" r="7.8" fill="#FDE6D2" />
      <circle cx="33.6" cy="8.4" r="1.5" fill="#3E2A1B" />
      <path d="M31.6 12 L36.6 12 Q34.1 15 31.6 12 Z" fill="#3E2A1B" />
      <path d="M22.6 8.6 C22.6 -0.8 39.4 -0.8 39.4 8.6 Z" fill="#C2410C" />
      <path d="M22 8.4 L40 8.4 L39.6 11 L22.4 11 Z" fill="#8F2C0A" />
      <Beam x={62} y={32} on={night} />
    </svg>
  );
}

function XeDap({ night }: { night: boolean }) {
  return (
    <svg width="68" height="54" viewBox="0 0 68 54" className="overflow-visible">
      <ellipse cx="34" cy="51" rx="21" ry="2.6" fill="rgba(62,42,27,0.16)" />
      <circle cx="16" cy="42" r="8.4" fill="none" stroke="#2A3442" strokeWidth="2.6" />
      <circle cx="50" cy="42" r="8.4" fill="none" stroke="#2A3442" strokeWidth="2.6" />
      <path d="M16 42 L28 28.6 L31.4 30.2 L19.4 43.2 Z" fill="#2AA87A" />
      <path d="M28 28.4 L46 28.4 L45.8 31.2 L29.2 31.2 Z" fill="#34D399" />
      <path d="M46 28.8 L50 41.6 L47.2 42.4 L43.2 29.6 Z" fill="#2AA87A" />
      <path d="M31 29.2 L34.2 41.8 L31.4 42.4 L28.2 29.8 Z" fill="#34D399" />
      <path d="M44.6 25.6 L52.4 26.2 L52.2 28.6 L44.4 28 Z" fill="#1F8A62" />
      <path d="M23 13.6 L34.6 14.2 L33.8 29.4 L23.8 28.8 Z" fill="#EC4899" />
      <path d="M23 13.6 L26.8 13.8 L26.2 29.1 L23.8 28.8 Z" fill="#C0246F" />
      <path d="M33.2 17 L47 23.4 L45.4 26.2 L32 20 Z" fill="#E8C6A6" />
      <circle cx="23" cy="-2" r="4.2" fill="#2E1D16" />
      <circle cx="29.4" cy="5" r="7.8" fill="#FDE6D2" />
      <ellipse cx="26" cy="8" rx="2" ry="1.3" fill="#F0A8BE" />
      <circle cx="32.8" cy="4.4" r="1.5" fill="#3E2A1B" />
      <path d="M31 8 L35.8 8 Q33.4 11.2 31 8 Z" fill="#3E2A1B" />
      <path d="M21.4 3.2 C21.4 -4.4 37.4 -4.4 37.4 3.2 C33 -1.4 25.8 -1.4 21.4 3.2 Z" fill="#2E1D16" />
      <Beam x={56} y={32} on={night} />
    </svg>
  );
}

/** lane 'far' = sat bo via chay sang phai, 'near' = sat mep duoi chay sang trai. */
interface Rider {
  key: string;
  El: ({ night }: { night: boolean }) => React.ReactElement;
  lane: 'far' | 'near';
  dur: number;
  delay: number;
}

const FLEET: Rider[] = [
  { key: 'xichlo', El: XichLo, lane: 'far', dur: 52, delay: 0 },
  { key: 'xemay', El: XeMay, lane: 'far', dur: 30, delay: -12 },
  { key: 'oto', El: OTo, lane: 'far', dur: 38, delay: -26 },
  { key: 'xedaydoan', El: XeDayDoAn, lane: 'near', dur: 58, delay: -6 },
  { key: 'vinfast', El: VinFast, lane: 'near', dur: 34, delay: -20 },
  { key: 'xedap', El: XeDap, lane: 'near', dur: 44, delay: -33 },
];

export default function StreetTraffic({ timeOfDay }: { timeOfDay: TimeOfDay }) {
  const night = timeOfDay === 'NIGHT' || timeOfDay === 'SUNSET';
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: TRAFFIC_CSS }} />
      {FLEET.map(({ key, El, lane, dur, delay }) => (
        <div
          key={key}
          className="pointer-events-none absolute left-0 z-20"
          style={{
            [lane === 'far' ? 'top' : 'bottom']: lane === 'far' ? 8 : 6,
            animation: `viahe-drive-${lane === 'far' ? 'r' : 'l'} ${dur}s linear infinite`,
            animationDelay: `${delay}s`,
          }}
        >
          <El night={night} />
        </div>
      ))}
    </>
  );
}
