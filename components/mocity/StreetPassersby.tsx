'use client';

import { useEffect, useRef } from 'react';
import type { CharacterAppearance, FacialEmotion } from '@/lib/mocity/character-appearance';
import { ChibiBody } from './ChibiRenderer';
import { WALK_CSS, CYCLE_K, laneYOf } from './ExpressiveStreetCitizens';

/**
 * KHACH HANG DI DUONG - nhung nguoi qua lai vo tri tren via he.
 *
 * Khac voi `ExpressiveStreetCitizens` o mot diem quyet dinh: ho KHONG phai
 * khach hang cua tiem. Khong xep hang, khong duoc keo vao queue, khong co
 * dialogue, khong nhan reward. Ho chi DI THANG qua manh pho roi het.
 *
 * Vi sao tach thanh mot component rieng thay vi them vao `CITIZEN_DEFS`?
 *
 * `CITIZEN_DEFS` la mot mang ma CA RAF loop va CUA HANG deu duyet. Them vao do
 * dong nghia voi viec phai cat mot cai `if` moi nhai: khong vao hang, khong
 * bi anti-cluster day xo, khong bi `nextShopPullAt` keo vao tiem, khong click
 * duoc. Bon cai if do cho mot doi tuong "khong lam gi ca" thi loi chay hon loi
 * tach. O day ho co RAF, co render, co CSS RIENG, khong cham vao mot dong nao
 * cua loop cu dan.
 *
 * GAG - cai lam ho "mat cuoi". Bo bon gag, moi nguoi mot, de khong nhin nhu
 * bon chung trai hang:
 *
 *   1. SELFIE_ARM   - giu dien thoai len cap, thoang le nhe, chin lenh mot cai.
 *   2. SLIP         - di nham chan roi hoi, nguoi ngang, roi lai nhu khong.
 *   3. TIPTOE       - di nhon got, nguoi nang nang nang tien ve truoc.
 *   4. CHASING_HAT  - gio thoi bay cap tren tay, nguoi lo dong do theo.
 *
 * CHU Y ve `CHASING_HAT`: mu KHONG nam tren dau. Neu dung `CAP_YELLOW` cua
 * `ChibiBody` roi cho no bay di, thi luc bay tren dau van con mot cai mu second
 * (vi `dauToc` nam trong nhom `cit-hw`, khong an duoc ma khong phai sua
 * renderer). Nen nhan vat nay dau TRAN va cam mu tren TAY - vi the mu la mot
 * DO TUONG DOC LAP, bay di thi dau van trong, khong can che gi.
 *
 * KHONG click: day la quyet dinh cua scope, khong phai bo qua. "Khach hang di
 * duong" la nguoi qua lai - cho ho them mot cai tap reward nua thi pho tro
 * thanh mot dam chibi trai qua lai ma nguoi choi khong biet ai noi chuyen duoc.
 * Muon cho ho interaction sau nay: rieng `TapSource` trong store, khong dung
 * chung cooldown `'citizen'`.
 */

type Gag = 'SELFIE_ARM' | 'SLIP' | 'TIPTOE' | 'CHASING_HAT';

/**
 * Ten class CSS cho tung gag.
 *
 * KHONG dung truc tiep `pb-gag-${gag}`: `gag` la SCREAMING_CASE (de doc khi
 * khai bao trong def) nhung CSS thi viet thuong, va class name la PHAN BIET
 * CHU HOA. `pb-gag-SELFIE_ARM` khong match `.pb-gag-selfie` - gag se im len
 * hoan toan ma tsc van xanh.
 */
const GAG_CLASS: Record<Gag, string> = {
  SELFIE_ARM: 'pb-gag-selfie',
  SLIP: 'pb-gag-slip',
  TIPTOE: 'pb-gag-tiptoe',
  CHASING_HAT: 'pb-gag-hat',
};

interface PasserbyDef extends CharacterAppearance {
  /** Dung cho `data-name` va debug, khong hien ra man hinh. */
  name: string;
  /** Chi so hang, doc tu `LANES` - giong hoi cham `lane` cua cu dan. */
  lane: number;
  startX: number;
  startDir: 1 | -1;
  /** Cung don vi voi `CitizenDef.speed`: px/giay hieu qua = speed * ~96. */
  speed: number;
  emotion: FacialEmotion;
  gag: Gag;
}

const PASSERBY_DEFS: PasserbyDef[] = [
  {
    /*
     * SELFIE - tay phai giu dien thoai len ngang cap.
     *
     * `heldItem: 'NONE'`: `PHONE_QR` ve tai `translate(44,46)` - tuc o moi
     * day, khong phai len cap. Selfie khong doc duoc neu dien thoai nam o chan.
     */
    name: 'Sen Selfie',
    lane: 2, startX: 430, startDir: 1, speed: 0.36,
    emotion: 'STAR_EYES', gag: 'SELFIE_ARM',
    skinColor: '#E8B48A', hairStyle: 'BOB', hairColor: '#3A2E26',
    shirtColor: '#F2A6C0', pantsColor: '#4A5A78', accentColor: '#FFFFFF',
    heldItem: 'NONE',
  },
  {
    /*
     * OM THUNG - gag SLIP. Van giu `SHOPPING_BAG` luc roi: tay dang cham vao
     * giua cai bay, nguoi cu roi cung khong buoc do. Hinh chibi roi ngang ma
     * van dap giu thung chinh la phan mat cuoi.
     */
    name: 'Chị Oanh Vác Thùng',
    lane: 5, startX: 1020, startDir: -1, speed: 0.30,
    emotion: 'HAPPY', gag: 'SLIP',
    skinColor: '#C98F68', hairStyle: 'BUN', hairColor: '#2F2823',
    shirtColor: '#E8A33D', pantsColor: '#5B4A3A', accentColor: '#8C3B2E',
    heldItem: 'SHOPPING_BAG',
  },
  {
    /*
     * NHON GOT - cu di nhon got nhu dang len lung ai. `rotate(5deg)` la LE
     * TOIUONG co dinh: goc quay ve cung mot huong voi goc moi nguoi chop khi
     * `scaleX(-1)` lat nguoc, nen le luon tien ve PHIA TRUOC moi huong di.
     */
    name: 'Anh Kiên Đi Nhón Gót',
    lane: 7, startX: 1610, startDir: 1, speed: 0.44,
    emotion: 'SURPRISED', gag: 'TIPTOE',
    skinColor: '#D9A176', hairStyle: 'SHORT', hairColor: '#1F1B18',
    shirtColor: '#7BA6D9', pantsColor: '#2F3A4A', accentColor: '#F2B91C',
    heldItem: 'NONE',
  },
  {
    /*
     * MU BAY - xem ghi chu tren `Gag`. Dau tran (SHORT) vi mu dang o tay.
     */
    name: 'Anh Tài Cầm Nón',
    lane: 1, startX: 1980, startDir: -1, speed: 0.38,
    emotion: 'SMUG', gag: 'CHASING_HAT',
    skinColor: '#C98F68', hairStyle: 'SHORT', hairColor: '#4A3B30',
    shirtColor: '#6E8C72', pantsColor: '#4A3B30', accentColor: '#D9A441',
    heldItem: 'NONE',
  },
];

const PASSERBY_CSS = `
/*
 * TOA DO CUA GAG.
 *
 * Gag body gan len <svg> goc (56x72, viewBox khop 1:1) nen 28px 72px la
 * chan giua - cung moc xoay ma nguoi ta roi theo. Gag prop gan len mot <g>
 * khong co transform attribute va dat toa do viewBox vao "transform-origin",
 * vi vay khong can phai thac mac "transform-box" se chon khung nao.
 *
 * BAY GHI CHU DA TUNG AN: CSS transform GHI DE transform attribute cua SVG.
 * Do do moi phan bi bay (mu, dien thoai) deu la <g> TRONG, ve toa do viewBox
 * truc tiep, khong boc them mot "translate(...)".
 */

/* ── 1. SELFIE: chan dung, nguoi thoi thoang, dien thoai lap lanh ── */
.pb-gag-selfie { transform-origin: 28px 72px; animation: pbSelfiePose 1.8s ease-in-out infinite; }
@keyframes pbSelfiePose {
  0%,100% { transform: translateY(0) rotate(2deg) }
  50%     { transform: translateY(-2.5px) rotate(-2.5deg) }
}
.pb-phone { transform-origin: 46px 34px; animation: pbPhoneTilt 1.8s ease-in-out infinite; }
@keyframes pbPhoneTilt {
  0%,100% { transform: rotate(-8deg) }
  50%     { transform: rotate(8deg) }
}
.pb-flash { animation: pbFlash 1.8s ease-in-out infinite; }
@keyframes pbFlash {
  0%,84%   { opacity: 0 }
  86%,92%  { opacity: 1 }
  94%,100% { opacity: 0 }
}

/* ── 2. SLIP: roi ngang, dam chan van dap, roi dung len binh thuong ── */
.pb-gag-slip { transform-origin: 28px 72px; animation: pbSlip 7s ease-in-out infinite; }
@keyframes pbSlip {
  0%,70%   { transform: none }
  74%      { transform: translateY(9px) rotate(-74deg) }
  84%      { transform: translateY(7px) rotate(-66deg) }
  92%      { transform: translateY(2px) rotate(-10deg) }
  96%,100% { transform: none }
}

/* ── 3. TIPTOE: nang nguoi len, nang nang tien ve truoc ── */
.pb-gag-tiptoe { transform-origin: 28px 72px; animation: pbTiptoe 0.52s ease-in-out infinite; }
@keyframes pbTiptoe {
  0%,100% { transform: translateY(0) rotate(5deg) }
  25%     { transform: translateY(-6px) rotate(7deg) }
  50%     { transform: translateY(0) rotate(5deg) }
  75%     { transform: translateY(-6px) rotate(7deg) }
}

/* ── 4. CHASING HAT: mu bay di, nguoi lo dong do theo, roi mu tu quay ve ── */
.pb-gag-hat { transform-origin: 28px 72px; animation: pbChaseHat 7s ease-in-out infinite; }
@keyframes pbChaseHat {
  0%,56%   { transform: none }
  63%      { transform: translateX(8px) rotate(7deg) }
  72%      { transform: translateX(15px) rotate(11deg) }
  84%      { transform: translateX(4px) rotate(3deg) }
  92%,100% { transform: none }
}
.pb-hat { transform-origin: 42px 50px; animation: pbHatFly 7s ease-in-out infinite; }
@keyframes pbHatFly {
  0%,54%   { transform: none }
  63%      { transform: translate(16px,-22px) rotate(-64deg) }
  72%      { transform: translate(46px,-38px) rotate(-172deg) }
  84%      { transform: translate(22px,-28px) rotate(-296deg) }
  92%,100% { transform: none }
}
`;

/** Đèn chớp khi chụp: toang ra rồi tắt, khong can hieu ung mo dien. */
function SelfieFlash() {
  return (
    <g className="pb-flash" aria-hidden>
      <path
        d="M51 5 L52.7 9.6 L57.3 11.3 L52.7 13 L51 17.6 L49.3 13 L44.7 11.3 L49.3 9.6 Z"
        fill="#FFF3B0"
      />
    </g>
  );
}

interface Sim {
  x: number;
  dir: 1 | -1;
  speed: number;
  baseSpeed: number;
  walking: boolean;
  behaviorTimer: number;
}

export default function StreetPassersby({ streetWidth = 2400 }: { streetWidth?: number }) {
  const boxRefs = useRef<(HTMLDivElement | null)[]>([]);
  const flipRefs = useRef<(HTMLDivElement | null)[]>([]);
  const svgRefs = useRef<(SVGSVGElement | null)[]>([]);
  const streetWidthRef = useRef(streetWidth);
  useEffect(() => {
    streetWidthRef.current = Math.max(1200, streetWidth);
  }, [streetWidth]);

  const simsRef = useRef<Sim[]>(
    PASSERBY_DEFS.map((d) => ({
      x: Math.min(d.startX, streetWidth - 140),
      dir: d.startDir,
      speed: d.speed,
      baseSpeed: d.speed,
      walking: true,
      behaviorTimer: 9 + Math.random() * 8,
    })),
  );

  useEffect(() => {
    let rafId = 0;
    let last = performance.now();

    const MIN_X = 150;
    const WALK_S = [9, 15];
    const REST_S = [3, 6];

    const loop = (now: number) => {
      rafId = requestAnimationFrame(loop);
      const elapsed = now - last;
      if (elapsed < 16) return;
      /*
       * CUNG THANG DO voi `ExpressiveStreetCitizens`: dt = ms/100 nen
       * `speed * dt * 10` cho ra px/giay. Doi sang `ms/1000` thi moi nguoi se
       * cham gap 10 lan va nhip chan (`--spd = CYCLE_K / speed`) lech khoi hinh.
       */
      const dt = Math.min(elapsed, 50) / 100;
      const dtSec = Math.min(elapsed, 50) / 1000;
      last = now;

      if (typeof document !== 'undefined' && document.hidden) return;

      const maxX = streetWidthRef.current - 130;

      for (let i = 0; i < simsRef.current.length; i++) {
        const sim = simsRef.current[i];
        const def = PASSERBY_DEFS[i];

        sim.behaviorTimer -= dtSec;
        if (sim.behaviorTimer <= 0) {
          if (sim.walking) {
            sim.walking = false;
            sim.behaviorTimer = REST_S[0] + Math.random() * (REST_S[1] - REST_S[0]);
          } else {
            sim.walking = true;
            sim.behaviorTimer = WALK_S[0] + Math.random() * (WALK_S[1] - WALK_S[0]);
            if (Math.random() < 0.35) sim.dir = (sim.dir * -1) as 1 | -1;
            sim.speed = sim.baseSpeed;
          }
        }

        if (sim.walking) {
          sim.x += sim.dir * sim.speed * dt * 10;
          if (sim.x > maxX) { sim.x = maxX; sim.dir = -1; }
          if (sim.x < MIN_X) { sim.x = MIN_X; sim.dir = 1; }
        }

        const laneY = laneYOf(def.lane);
        const box = boxRefs.current[i];
        if (box) {
          box.style.transform = `translate3d(${Math.round(sim.x)}px,${-Math.round(laneY)}px,0)`;
          box.style.zIndex = String(Math.round(100 - laneY));
        }
        const flip = flipRefs.current[i];
        if (flip) flip.style.transform = `scaleX(${sim.dir})`;
        const svg = svgRefs.current[i];
        if (svg) {
          const cls = sim.walking ? 'walking' : 'idle';
          if (!svg.classList.contains(cls)) {
            svg.classList.remove('walking', 'idle');
            svg.classList.add(cls);
          }
        }
      }
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WALK_CSS + PASSERBY_CSS }} />
      <div className="pointer-events-none absolute inset-0 z-20 overflow-visible">
        {PASSERBY_DEFS.map((def, i) => (
          <div
            key={def.name}
            data-name={def.name}
            ref={(el) => { boxRefs.current[i] = el; }}
            className="absolute bottom-2 left-0"
            style={{
              transform: `translate3d(${def.startX}px,${-laneYOf(def.lane)}px,0)`,
              zIndex: 100 - laneYOf(def.lane),
            }}
          >
            <div ref={(el) => { flipRefs.current[i] = el; }}>
              <svg
                ref={(el) => { svgRefs.current[i] = el; }}
                width="56"
                height="72"
                viewBox="0 0 56 72"
                aria-hidden
                className={`cit-walk-anim overflow-visible walking ${GAG_CLASS[def.gag]}`}
                /* `CYCLE_K` thay cho 0.6 cu: sai chan phai khop quang duong,
                   khong thi nguoi qua duong "bay" - xem dan giai o
                   `ExpressiveStreetCitizens.tsx`. Cung mot cong thuc di
                   chuyen (`speed * dt * 10`) nen dung chung duoc hang so. */
                style={{ '--spd': `${(CYCLE_K / def.speed).toFixed(2)}s` } as React.CSSProperties}
              >
                <ChibiBody def={def} emotion={def.emotion} />

                {def.gag === 'SELFIE_ARM' && (
                  <>
                    <g className="pb-phone">
                      <rect x="41.5" y="14.5" width="9" height="17" rx="2.6" fill="#2B2420" />
                      <rect x="43" y="16.5" width="6" height="12" rx="1.2" fill="#8FC7E8" />
                      <circle cx="46" cy="33.5" r="4.6" fill={def.skinColor} />
                    </g>
                    <SelfieFlash />
                  </>
                )}

                {def.gag === 'CHASING_HAT' && (
                  <g className="pb-hat">
                    <path d="M34 50 Q42.5 40 51 50 Z" fill="#D9A441" />
                    <rect x="31" y="49" width="23" height="3.4" rx="1.7" fill="#A8701F" />
                  </g>
                )}
              </svg>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
