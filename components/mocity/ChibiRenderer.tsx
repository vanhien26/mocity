'use client';

import type { CharacterAppearance, FacialEmotion } from '@/lib/mocity/character-appearance';

/**
 * BO VE HINH XOA NHAN VAT - duy nhat trong repo.
 *
 * Day la file chay TRUOC DAY trong git: truoc do `RAMP`, `nearestSkin`,
 * `tachKhoiDa` va ham ve nguoi uong trong `ExpressiveStreetCitizens.tsx`,
 * va `FacialEmotion` lai con duoc khai mot lan nua o `citizen-scenarios.ts`.
 * Hau qua: muon ve lai nhan vat (cot vien, avatar Profile, anh chia se pho)
 * thi moi phai copy ma nguoi ra file thu hai, va bon nguoi do nhanh chong lech
 * mau/lech expression.
 *
 * Bo ve nay khong biet gi ve mo phong - chi nhan vao `CharacterAppearance` +
 * `FacialEmotion` va tra ve SVG viewBox 56x72. Boi vay no dung duoc o day,
 * o `DialogueModal`, o trang Profile - o bat cu noi nao can mot cai dau.
 * ═══════════════════════════════════════════════════════════════════════════

/**
 * BẢNG MÀU HẠN CHẾ THỜI BAO CẤP.
 *
 * Pixel art sống bằng bảng màu hẹp. Màu gốc của 12 cư dân rải tự do khắp dải
 * RGB, nên phải nắn về bảng này - nếu không thì dù vẽ bằng khối vuông vẫn ra
 * cảm giác vector hiện đại vì màu quá nhiều và quá tươi.
 */
const RAMP = [
  /* Mực và gỗ */
  '#2B2420', '#4A3B30', '#6B4A2F', '#8A6A43',
  /* Vôi, xi măng, giấy */
  '#7E7667', '#B5AC98', '#C9B98F', '#E3D6B4', '#F0E6CE',
  /* Da người - PHẢI có bậc riêng, nếu không mọi khuôn mặt sẽ nắn về màu
     giấy và áo trắng cũng rơi vào đúng màu đó, thành ra như không mặc áo. */
  '#C98F68', '#E0A87E', '#EFC49C',
  /* Xanh rêu */
  '#2F4A3C', '#4A6B5A', '#6E8C72', '#A9BEB4',
  /* Đỏ son, gạch */
  '#6B241C', '#8C3B2E', '#B33A2B', '#C97A4A',
  /* Vàng nghệ */
  '#7A4F14', '#A8701F', '#D9A441', '#E8C46A',
  /* Xanh mực */
  '#262F3D', '#3E4C63', '#5C7390', '#8C9BB0',
  /* Hồng in */
  '#4E0F32', '#73164A', '#A8246B',
];

/** Khoảng cách màu trong không gian RGB, đủ dùng cho việc nắn bảng. */
function nearest(hex: string): string {
  const v = hex.replace('#', '');
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  let best = RAMP[0];
  let bestD = Infinity;
  for (const c of RAMP) {
    const cr = parseInt(c.slice(1, 3), 16);
    const cg = parseInt(c.slice(3, 5), 16);
    const cb = parseInt(c.slice(5, 7), 16);
    const d = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}

/** Độ sáng cảm nhận, dùng để so hai màu đậm nhạt. */
function lum(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Bậc đậm hơn trong cùng bảng, chọn theo ĐỘ SÁNG chứ không theo chỉ số mảng.
 *
 * Bản đầu lùi một bậc theo chỉ số. Nhưng bảng nhóm theo họ màu, nên lùi một
 * bậc có thể nhảy sang họ khác: `darker('#4A6B5A')` ra `#F0E6CE` - bóng đổ
 * thành vùng sáng. Lỗi loại này chỉ lộ ra khi nhìn tận mắt từng nhân vật.
 */
function darker(hex: string): string {
  const muc = lum(hex) * 0.62;
  let best = RAMP[0];
  let bestD = Infinity;
  for (const c of RAMP) {
    if (lum(c) >= lum(hex)) continue;
    const d = Math.abs(lum(c) - muc);
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}

/**
 * Nắn màu da trong DẢI DA RIÊNG, không qua bảng chung.
 *
 * Màu da gốc của 12 cư dân đều rất sáng (#FDE6D2, #FFF1E6). Qua bảng chung
 * thì bậc gần nhất là #F0E6CE - đúng màu giấy và màu tường vôi, nên khuôn mặt
 * đọc thành mặt nạ trắng bệch lẫn vào nền. Da là loại màu có ý nghĩa riêng,
 * không được để nó cạnh tranh bậc với vôi và giấy.
 */
const DA_RAMP = ['#C98F68', '#E0A87E', '#EFC49C'];

function nearestSkin(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  let best = DA_RAMP[0];
  let bestD = Infinity;
  for (const c of DA_RAMP) {
    const d =
      (r - parseInt(c.slice(1, 3), 16)) ** 2 +
      (g - parseInt(c.slice(3, 5), 16)) ** 2 +
      (b - parseInt(c.slice(5, 7), 16)) ** 2;
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}

/** Nắn màu áo sao cho không trùng màu da, nếu không nhìn như không mặc áo. */
function tachKhoiDa(ao: string, da: string): string {
  return ao === da ? darker(ao) : ao;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * NHÂN VẬT CHIBI ĐƠN GIẢN
 *
 * Thay bản pixel art o luot truoc. Pixel art ở khung 56x72 với chu kỳ bốn
 * khung hình ra cứng như máy: kích thước quá nhỏ để số khung hình thấp đọc
 * thành phong cách, nó chỉ đọc thành giật cục.
 *
 * Chibi giữ được cảm giác tự nhiên vì tay chân xoay quanh khớp theo đường
 * cong liên tục. Đánh đổi: bớt retro hơn pixel. Bảng màu thời kỳ vẫn giữ để
 * nhân vật không tách khỏi bối cảnh đã ngả màu.
 *
 * TỶ LỆ: đầu chiếm 46% chiều cao. Đó là ngưỡng chibi - thấp hơn thì thành
 * người thường thu nhỏ, ở 56px sẽ không đọc được nét mặt.
 * ═══════════════════════════════════════════════════════════════════════════ */
export function ChibiBody({ def, emotion }: { def: CharacterAppearance; emotion: FacialEmotion }) {
  const da = nearestSkin(def.skinColor);
  const daToi = darker(da);
  const ao = tachKhoiDa(nearest(def.shirtColor), da);
  const aoToi = darker(ao);
  const quan = nearest(def.pantsColor);
  const quanToi = darker(quan);
  const toc = nearest(def.hairColor);
  const nhan = nearest(def.accentColor);
  const muc = '#2B2420';

  /** Một chi: hình viên thuốc bo tròn, vẽ từ khớp đổ xuống. */
  const Chi = ({ fill, dai, day = 6 }: { fill: string; dai: number; day?: number }) => (
    <rect x={-day / 2} y={0} width={day} height={dai} rx={day / 2} fill={fill} />
  );

  const mat = (() => {
    switch (emotion) {
      case 'STAR_EYES':
        return (
          <>
            <path d="M21 18 L22 20.2 L24.2 21.2 L22 22.2 L21 24.4 L20 22.2 L17.8 21.2 L20 20.2 Z" fill={muc} />
            <path d="M35 18 L36 20.2 L38.2 21.2 L36 22.2 L35 24.4 L34 22.2 L31.8 21.2 L34 20.2 Z" fill={muc} />
            <path d="M23.5 27.5 Q28 32.5 32.5 27.5" fill="none" stroke={muc} strokeWidth="2.4" strokeLinecap="round" />
          </>
        );
      case 'SURPRISED':
        return (
          <>
            <circle cx="21" cy="21" r="2.6" fill={muc} />
            <circle cx="35" cy="21" r="2.6" fill={muc} />
            <ellipse cx="28" cy="28.5" rx="2.4" ry="3.2" fill={muc} />
          </>
        );
      case 'TIRED':
        return (
          <>
            <rect x="18" y="20" width="6" height="2.2" rx="1.1" fill={muc} />
            <rect x="32" y="20" width="6" height="2.2" rx="1.1" fill={muc} />
            <rect x="25" y="28" width="6" height="2" rx="1" fill={muc} />
          </>
        );
      case 'MONEY_EYES':
        return (
          <>
            <circle cx="21" cy="21" r="3.6" fill={muc} />
            <rect x="19.5" y="19.5" width="3" height="3" fill={da} />
            <circle cx="35" cy="21" r="3.6" fill={muc} />
            <rect x="33.5" y="19.5" width="3" height="3" fill={da} />
            <path d="M23.5 27.5 Q28 32.5 32.5 27.5" fill="none" stroke={muc} strokeWidth="2.4" strokeLinecap="round" />
          </>
        );
      case 'CRYING':
        return (
          <>
            <path d="M18 20.6 Q21 17.6 24 20.6" fill="none" stroke={muc} strokeWidth="2.2" strokeLinecap="round" />
            <path d="M32 20.6 Q35 17.6 38 20.6" fill="none" stroke={muc} strokeWidth="2.2" strokeLinecap="round" />
            <rect x="19" y="23" width="3.6" height="11" rx="1.8" fill="#8C9BB0" />
            <rect x="33" y="23" width="3.6" height="11" rx="1.8" fill="#8C9BB0" />
            <ellipse cx="28" cy="29.5" rx="4" ry="3.4" fill={muc} />
          </>
        );
      case 'SMUG':
        return (
          <>
            <path d="M18 23 Q21 19 24 23" fill="none" stroke={muc} strokeWidth="2.2" strokeLinecap="round" />
            <path d="M32 23 Q35 19 38 23" fill="none" stroke={muc} strokeWidth="2.2" strokeLinecap="round" />
            <path d="M24 29.5 L32 27.5" fill="none" stroke={muc} strokeWidth="2.2" strokeLinecap="round" />
          </>
        );
      case 'ANGRY':
        return (
          <>
            <path d="M17 16 L24 19.5" fill="none" stroke={muc} strokeWidth="2.4" strokeLinecap="round" />
            <path d="M39 16 L32 19.5" fill="none" stroke={muc} strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="21" cy="23" r="2.2" fill={muc} />
            <circle cx="35" cy="23" r="2.2" fill={muc} />
            <path d="M24 30 L32 30" fill="none" stroke={muc} strokeWidth="2.2" strokeLinecap="round" />
          </>
        );
      case 'SLEEPY':
        return (
          <>
            <path d="M18 21 Q21 24.5 24 21" fill="none" stroke={muc} strokeWidth="2.2" strokeLinecap="round" />
            <path d="M32 21 Q35 24.5 38 21" fill="none" stroke={muc} strokeWidth="2.2" strokeLinecap="round" />
            <ellipse cx="28" cy="29.5" rx="2.5" ry="3" fill={muc} />
          </>
        );
      default:
        return (
          <>
            {/*
              Khuôn mặt chuẩn của NguoiCuaSo:
              - Mắt: hai chấm tròn nhỏ tinh tế (r=2.2 ở cx=21, 35).
              - Cười: nét cong đậm rõ ràng và tươi tắn như hình mẫu cửa sổ.
            */}
            <circle cx="21" cy="21" r="2.2" fill={muc} />
            <circle cx="35" cy="21" r="2.2" fill={muc} />
            <path
              d="M23.5 27.5 Q28 32.5 32.5 27.5"
              fill="none"
              stroke={muc}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </>
        );
    }
  })();

  const dauToc = (() => {
    switch (def.hairStyle) {
      case 'NON_LA':
        return (
          <>
            {/*
              Nón lá hình tam giác cân chuẩn 100% như NguoiCuaSo:
              NguoiCuaSo: <polygon points="17,3 4,14 30,14" fill="#FDE68A" stroke="#D97706" strokeWidth="0.8" />
              Tâm mặt cy=21, vành nón kết thúc ở y=13 để lộ trọn vẹn đôi mắt và má hồng.
            */}
            <polygon
              points="28,-6 2,13 54,13"
              fill="#FDE68A"
              stroke="#D97706"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </>
        );
      case 'CAP_YELLOW':
        return (
          <>
            <path d="M12 9 Q28 -6 44 9 Z" fill="#D9A441" />
            <rect x="6" y="8" width="28" height="3.2" rx="1.6" fill="#A8701F" />
          </>
        );
      case 'HELMET_BLUE':
        return (
          <>
            <path d="M11 11 Q28 -6 45 11 Z" fill="#3E4C63" />
            <rect x="8" y="9.5" width="40" height="3" rx="1.5" fill="#262F3D" />
          </>
        );
      case 'BALD_GLASSES':
        return (
          <>
            <path d="M12 10 Q28 -4 44 10 Z" fill={daToi} />
            <circle cx="20" cy="21" r="6" fill="none" stroke="#3E4C63" strokeWidth="2" />
            <circle cx="36" cy="21" r="6" fill="none" stroke="#3E4C63" strokeWidth="2" />
            <rect x="25" y="20" width="6" height="2" fill="#3E4C63" />
          </>
        );
      case 'BOB':
        return (
          <>
            <path d="M12 18 Q12 6 28 6 Q44 6 44 18 Q38 10 28 10 Q18 10 12 18 Z" fill={toc} />
            <rect x="10" y="16" width="4.5" height="12" rx="2.2" fill={toc} />
            <rect x="41.5" y="16" width="4.5" height="12" rx="2.2" fill={toc} />
          </>
        );
      case 'BUN':
        return (
          <>
            <circle cx="28" cy="1" r="5" fill={toc} />
            <path d="M12 18 Q12 6 28 6 Q44 6 44 18 Q38 10 28 10 Q18 10 12 18 Z" fill={toc} />
          </>
        );
      case 'PONYTAIL':
        return (
          <>
            <path d="M42 9 Q52 18 47 30 L43 28 Q46 19 39 12 Z" fill={toc} />
            <path d="M12 18 Q12 6 28 6 Q44 6 44 18 Q38 10 28 10 Q18 10 12 18 Z" fill={toc} />
          </>
        );
      case 'LONG_HAIR':
        return (
          <>
            {/* Tóc dài buông xõa nhẹ nhàng hai bên vai */}
            <path d="M10 16 Q10 40 14 46 Q17 44 15 28 Q15 16 12 16 Z" fill={toc} />
            <path d="M46 16 Q46 40 42 46 Q39 44 41 28 Q41 16 44 16 Z" fill={toc} />
            <path d="M12 18 Q12 6 28 6 Q44 6 44 18 Q38 10 28 10 Q18 10 12 18 Z" fill={toc} />
          </>
        );
      case 'HARD_HAT_ORANGE':
        return (
          <>
            {/* Mũ bảo hộ thợ điện màu cam EVN: vòm gọn gàng, vành phẳng */}
            <path d="M12 14 Q28 -4 44 14 Z" fill="#EA580C" stroke="#C2410C" strokeWidth="0.8" />
            <rect x="9" y="12" width="38" height="3" rx="1.5" fill="#C2410C" />
            <rect x="26" y="0" width="4" height="12" rx="1.5" fill="#F97316" />
          </>
        );
      case 'HARD_HAT_YELLOW':
        return (
          <>
            {/* Mũ bảo hộ công nhân màu vàng */}
            <path d="M12 14 Q28 -4 44 14 Z" fill="#EAB308" stroke="#CA8A04" strokeWidth="0.8" />
            <rect x="9" y="12" width="38" height="3" rx="1.5" fill="#CA8A04" />
            <rect x="26" y="0" width="4" height="12" rx="1.5" fill="#FACC15" />
          </>
        );
      case 'HEADSCARF':
        return (
          <>
            {/* Khăn rằn / khăn trùm đầu chống nắng gọn gàng */}
            <path d="M12 18 Q12 5 28 5 Q44 5 44 18 L41 28 Q36 31 33 24 L28 25 L23 24 Q20 31 15 28 Z" fill="#0D9488" />
            <path d="M14 17 Q28 10 42 17 L44 20 Q28 13 12 20 Z" fill="#14B8A6" />
            <ellipse cx="28" cy="30" rx="3.5" ry="1.8" fill="#0F766E" />
          </>
        );
      case 'MESSY':
        return (
          <>
            <path d="M12 18 Q12 6 28 6 Q44 6 44 18 Q38 11 28 11 Q18 11 12 18 Z" fill={toc} />
            <path d="M15 8 L18 0 L22 7 Z" fill={toc} />
            <path d="M26 4 L29 -3 L32 5 Z" fill={toc} />
            <path d="M36 7 L40 0 L43 8 Z" fill={toc} />
          </>
        );
      default:
        /*
          Tóc chuẩn của NguoiCuaSo:
          <path d="M9 12 Q9 5 17 5 Q25 5 25 12 Q21 8 17 8 Q13 8 9 12 Z" fill={toc} />
          Tỉ lệ mở rộng lên khung 56x72 (tâm đầu cx=28, cy=21, r=17):
        */
        return <path d="M12 18 Q12 5 28 5 Q44 5 44 18 Q38 10 28 10 Q18 10 12 18 Z" fill={toc} />;
    }
  })();

  const doCam = (() => {
    const g = (child: React.ReactNode) => <g transform="translate(44,46)">{child}</g>;
    switch (def.heldItem) {
      case 'MILK_TEA':
        return g(<><rect x="-4" y="0" width="8" height="10" rx="1.5" fill="#E3D6B4" /><rect x="-4.6" y="-2" width="9.2" height="2.6" rx="1.3" fill="#8A6A43" /></>);
      case 'SHOPPING_BAG':
        return g(<><rect x="-5" y="0" width="10" height="11" rx="1.5" fill={nhan} /><path d="M-2.6 0 Q0 -5 2.6 0" fill="none" stroke={darker(nhan)} strokeWidth="1.6" /></>);
      case 'BRIEFCASE':
        return g(<><rect x="-6" y="0" width="12" height="9" rx="1.5" fill="#6B4A2F" /><rect x="-2" y="-2.4" width="4" height="2.6" fill="#4A3B30" /></>);
      case 'LOTTERY_FAN':
        return g(<><rect x="-3" y="-1" width="7" height="11" rx="1" fill="#F0E6CE" transform="rotate(14)" /><rect x="0" y="-2" width="7" height="11" rx="1" fill="#E3D6B4" transform="rotate(-10)" /></>);
      case 'PHONE_QR':
        return g(<><rect x="-3.4" y="-1" width="6.8" height="11" rx="1.4" fill="#2B2420" /><rect x="-2.2" y="0.4" width="4.4" height="7" fill="#A9BEB4" /></>);
      case 'LAPTOP':
        return g(<><rect x="-6" y="2" width="12" height="2.6" rx="1" fill="#8C9BB0" /><rect x="-5" y="-5" width="10" height="7" rx="1" fill="#5C7390" /></>);
      case 'CAMERA':
        return g(<><rect x="-6" y="0" width="12" height="8.4" rx="1.6" fill="#3E4C63" /><circle cx="0" cy="4.2" r="3" fill="#8C9BB0" /></>);
      case 'BOWL':
        return g(
          <>
            <rect x="-5.4" y="-1.6" width="10.8" height="2.4" rx="1.2" fill="#E3D6B4" />
            <path d="M-5 0 L5 0 L3.4 7 Q0 8.6 -3.4 7 Z" fill="#F0E6CE" />
            <rect x="-1.4" y="-6" width="2.8" height="5" rx="1.4" fill="#B5AC98" />
          </>,
        );
      case 'SHOULDER_POLE':
        return g(
          <>
            <path d="M-10 -9 L8.5 4" stroke="#8A6A43" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M-6.6 -6.6 L-5.4 -5.8" stroke="#6B4A2F" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M8.5 4 L8.5 7.6" stroke="#4A3B30" strokeWidth="1.5" />
            <path d="M4.8 7.6 L11.6 7.6 L10.7 16 L5.7 16 Z" fill="#C9B98F" />
            <path d="M4.4 7.6 L12 7.6 L12 10 L4.4 10 Z" fill="#7E7667" />
            <rect x="6.2" y="5.4" width="1.7" height="3" rx="0.8" fill="#A9BEB4" />
            <path d="M8.8 6.4 L10.8 5.6 L11.2 7.6 L9 7.8 Z" fill="#E3D6B4" />
          </>,
        );
      case 'BROOM':
        return g(
          <>
            {/* Cán chổi tựa nghiêng vai */}
            <path d="M-2 -14 L6 10" stroke="#A16207" strokeWidth="2.2" strokeLinecap="round" />
            {/* Phần tre xoè quét rác */}
            <path d="M3 6 L9 13 L5.4 15.4 L1.4 8.6 Z" fill="#D9A441" />
            <path d="M4.2 8 L8 13.4 M2.6 9.6 L7 15 M6 7.4 L9.4 11.8" stroke="#A16207" strokeWidth="0.8" strokeLinecap="round" />
          </>,
        );
      default:
        return null;
    }
  })();

  /*
   * `pose: 'SIT'` - người ngồi bệt.
   */
  const ngoi = def.pose === 'SIT';
  const dy = ngoi ? 10 : 0;
  const isAoDai = def.outfitType === 'AO_DAI';
  const isSkirt = def.outfitType === 'SKIRT';
  const isWorker = def.outfitType === 'WORKER_OVERALLS';
  const isElectrician = def.outfitType === 'ELECTRICIAN';
  const isOfficeVest = def.outfitType === 'OFFICE_VEST';
  const isCleaner = def.outfitType === 'CLEANER';

  return (
    <>
      <ellipse cx="28" cy="69" rx={ngoi ? 16 : 13} ry="2.6" fill="rgba(43,36,32,0.22)" />

      <g className="cit-bw">
        {ngoi ? (
          /* CHÂN GẬP - vẽ trước để thân lọt vào sau. */
          <>
            <ellipse cx="28" cy="63" rx="16" ry="8" fill={quan} />
            <path d="M12.5 60.5 Q28 55 43.5 60.5 L43.5 64 Q28 59.5 12.5 64 Z" fill={quanToi} />
          </>
        ) : isSkirt ? (
          /* CHÂN VÁY CÔNG SỞ / DẠO PHỐ: chân thon màu da/vớ, có váy phủ */
          <>
            <g transform="translate(24,52)"><g className="cit-lb"><Chi fill={daToi} dai={13} day={5.5} /></g></g>
            <g transform="translate(32,52)"><g className="cit-lf"><Chi fill={da} dai={13} day={5.5} /></g></g>
            {/* Chân váy xòe chữ A che phần đùi */}
            <path d="M17 46 L39 46 L42 55 L14 55 Z" fill={quan} />
            <path d="M17 46 L39 46 L41 49 L15 49 Z" fill={quanToi} />
          </>
        ) : (
          /* CHÂN THƯỜNG / QUẦN DÀI (quần âu, quần lụa áo dài, quần bảo hộ) */
          <>
            <g transform="translate(23,47)"><g className="cit-lb"><Chi fill={isAoDai ? '#E2E8F0' : quanToi} dai={17} /></g></g>
            <g transform="translate(33,47)"><g className="cit-lf"><Chi fill={isAoDai ? '#FFFFFF' : quan} dai={17} /></g></g>
          </>
        )}

        <g transform={`translate(0,${dy})`}>
          {/* TAY SAU */}
          <g transform="translate(16,34)"><g className="cit-ab"><Chi fill={aoToi} dai={15} day={5.3} /></g></g>

          {/* THÂN VÀ TRANG PHỤC ĐẶC THÙ */}
          {isAoDai ? (
            /* ÁO DÀI TRUYỀN THỐNG: Tà áo dài thướt tha xẻ eo trước sau, cổ tàu */
            <>
              {/* Thân áo ôm dáng */}
              <path d="M18 32 Q28 29 38 32 L36.5 47 Q28 49 19.5 47 Z" fill={ao} />
              {/* Tà áo dài trước bay nhẹ che quần */}
              <path d="M20 46 Q28 47 36 46 L38 65 Q28 67 18 65 Z" fill={ao} opacity="0.95" />
              {/* Đường xẻ tà eo duyên dáng */}
              <path d="M28 32 L28 48" stroke={aoToi} strokeWidth="1" strokeDasharray="1.5,1.5" />
              {/* Hàng khuy bấm chéo cổ áo dài truyền thống */}
              <path d="M28 32 Q32 35 36 38" stroke={nhan} strokeWidth="1.2" fill="none" />
              {/* Cổ trụ áo dài (cổ tàu) */}
              <rect x="23.5" y="28" width="9" height="4" rx="2" fill={ao} stroke={aoToi} strokeWidth="0.8" />
            </>
          ) : isWorker || isElectrician ? (
            /* ĐỒNG PHỤC CÔNG NHÂN / LAO CÔNG / THỢ ĐIỆN VỚI DẢI PHẢN QUANG & ĐỒ NGHỀ */
            <>
              <path d="M19 32 Q28 29.5 37 32 L35.8 49.5 Q28 51.8 20.2 49.5 Z" fill={ao} />
              <path d="M19 32 Q28 29.5 37 32 L36.3 36.5 Q28 34.2 19.7 36.5 Z" fill={aoToi} />
              {/* Cổ áo trắng đặc trưng chuẩn NguoiCuaSo */}
              <path d="M23 32 L28 37 L33 32 Z" fill="#FFFFFF" opacity="0.95" />
              {/* Dải phản quang bạc - xanh neon nổi bật an toàn lao động */}
              <rect x="17.5" y="40" width="21" height="3" rx="1.5" fill="#E2E8F0" />
              <rect x="18" y="41" width="20" height="1.2" fill="#84CC16" />
              {isElectrician ? (
                /* Thắt lưng thợ điện EVN mang theo kìm / cuộn băng dính điện */
                <g>
                  <rect x="18" y="47" width="20" height="3" rx="1.5" fill="#451A03" />
                  <rect x="26" y="46.5" width="4" height="4" rx="1" fill="#CA8A04" />
                  {/* Kìm cắt điện treo hông */}
                  <path d="M35 48 L37 54 M37 48 L35 54" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
                </g>
              ) : (
                /* Túi áo bảo hộ công nhân */
                <rect x="21" y="44" width="5" height="4" rx="1" fill={aoToi} />
              )}
            </>
          ) : isCleaner ? (
            /* ĐỒNG PHỤC LAO CÔNG ĐÔ THỊ: áo phản quang + khẩu trang kéo xuống cổ */
            <>
              <path d="M19 32 Q28 29.5 37 32 L35.8 49.5 Q28 51.8 20.2 49.5 Z" fill={ao} />
              <path d="M19 32 Q28 29.5 37 32 L36.3 36.5 Q28 34.2 19.7 36.5 Z" fill={aoToi} />
              {/* Dải phản quang vàng chéo người - đặc trưng đồng phục vệ sinh môi trường */}
              <path d="M19 33.5 L34 49" stroke="#FDE047" strokeWidth="2.6" strokeLinecap="round" />
              {/* Khẩu trang kéo xuống cổ - không che miệng để vẫn đọc được biểu cảm */}
              <path d="M22 36.5 Q28 39.6 34 36.5 L33 40.4 Q28 42.6 23 40.4 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.6" />
            </>
          ) : isOfficeVest ? (
            /* VEST CÔNG SỞ SANG TRỌNG */
            <>
              {/* Áo sơ mi lót trắng bên trong */}
              <path d="M21 32 L28 43 L35 32 Z" fill="#FFFFFF" />
              {/* Cà vạt */}
              <path d="M26.8 33 L29.2 33 L30.2 42 L28 44 L25.8 42 Z" fill={nhan} />
              {/* Áo vest khoác ngoài */}
              <path d="M17 32 L23 45 L18.5 50 Z" fill={ao} />
              <path d="M39 32 L33 45 L37.5 50 Z" fill={ao} />
              <path d="M19 32 Q28 29.5 37 32 L35.8 49.5 Q28 51.8 20.2 49.5 Z" fill="none" stroke={aoToi} strokeWidth="1" />
            </>
          ) : (
            /* THÂN THƯỜNG - bo tròn, thu lại ở eo cho dáng chibi */
            <>
              <path d="M19 32 Q28 29.5 37 32 L35.8 49.5 Q28 51.8 20.2 49.5 Z" fill={ao} />
              <path d="M19 32 Q28 29.5 37 32 L36.3 36.5 Q28 34.2 19.7 36.5 Z" fill={aoToi} />
              {/* Cổ áo trắng chữ V chuẩn 100% như NguoiCuaSo (<path d="M14 21 L17 25 L20 21 Z" fill="#FFFFFF" />) */}
              <path d="M23 32 L28 37 L33 32 Z" fill="#FFFFFF" opacity="0.95" />
              {def.hasTie ? (
                <path d="M26.6 34 L29.4 34 L30.6 43 L28 45.4 L25.4 43 Z" fill={nhan} />
              ) : (
                <circle cx="28" cy="41" r="2.4" fill={nhan} />
              )}
            </>
          )}

          {/* TAY TRƯỚC */}
          <g transform="translate(40,34)"><g className="cit-af"><Chi fill={ao} dai={15} day={5.3} /></g></g>
          {doCam}

          {/* ĐẦU - chiếm 46% chiều cao, tỷ lệ chibi */}
          <g className="cit-hw">
            <rect x="24.5" y="27" width="7" height="6" fill={daToi} />
            <circle cx="28" cy="21" r="17" fill={da} />
            {/* Tóc / Nón đội trên đầu */}
            {dauToc}
            {/*
              MÁ HỒNG theo đúng kiểu người ở cửa sổ (`NguoiCuaSo` trong `ShophouseFacade.tsx`)
              r=2.5, cx=17 và cx=39, cy=24.5, màu #FB7185 opacity 0.65
            */}
            <circle cx="17" cy="24.5" r="2.5" fill="#FB7185" opacity="0.65" />
            <circle cx="39" cy="24.5" r="2.5" fill="#FB7185" opacity="0.65" />
            {/* MẮT VÀ MIỆNG - vẽ trên cùng để luôn sắc nét, không bị mũ che */}
            {mat}
          </g>
        </g>
      </g>
    </>
  );
}
