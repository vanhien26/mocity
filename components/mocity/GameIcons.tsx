import React from 'react';

export interface GameIconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * BỘ SƯU TẬP GAME ICONS MOCITY (Chuẩn Game Tycoon / Chibi Vector Art)
 * Thiết kế nhiều lớp: Viền đậm, Gradient chiều sâu, Ánh kim (Gloss), Bóng đổ (Drop Shadow)
 */

/** 1. ĐỒNG VÀNG MOCITY (Gold Coin Token 3D) */
export function CoinIcon({ size = 24, className = '', style }: GameIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={`shrink-0 select-none ${className}`}
      style={style}
    >
      <defs>
        <radialGradient id="coinGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#FFF275" />
          <stop offset="45%" stopColor="#F59E0B" />
          <stop offset="85%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </radialGradient>
        <linearGradient id="coinRim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
      </defs>
      {/* Vành ngoài bóng đổ */}
      <circle cx="16" cy="16.5" r="14" fill="#78350F" />
      {/* Vành viền chính */}
      <circle cx="16" cy="15.5" r="14" fill="url(#coinRim)" />
      {/* Lõi đồng xu */}
      <circle cx="16" cy="15.5" r="11" fill="url(#coinGrad)" stroke="#B45309" strokeWidth="1" />
      {/* Khía viền trong */}
      <circle cx="16" cy="15.5" r="9" stroke="#FEF08A" strokeWidth="0.75" strokeDasharray="1.5 1.5" opacity="0.8" />
      {/* Biểu tượng M */}
      <path
        d="M11 20V12L16 16.5L21 12V20"
        stroke="#78350F"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 19V11L16 15.5L21 11V19"
        stroke="#FFFFFF"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Điểm sáng lấp lánh (Glare) */}
      <circle cx="11.5" cy="10.5" r="1.5" fill="#FFFFFF" opacity="0.9" />
    </svg>
  );
}

/** 2. KIM CƯƠNG / HỒNG NGỌC 3D (Gem / Ruby Token) */
export function GemIcon({ size = 24, className = '', style }: GameIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={`shrink-0 select-none ${className}`}
      style={style}
    >
      <defs>
        <linearGradient id="gemTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        <linearGradient id="gemFront" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DB2777" />
          <stop offset="100%" stopColor="#9D174D" />
        </linearGradient>
        <linearGradient id="gemLeft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F43F5E" />
          <stop offset="100%" stopColor="#BE123C" />
        </linearGradient>
        <linearGradient id="gemRight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#BE185D" />
          <stop offset="100%" stopColor="#831843" />
        </linearGradient>
      </defs>
      {/* Bóng đáy */}
      <polygon points="16,30.5 5,14 27,14" fill="#500724" />
      {/* Thân đáy giữa */}
      <polygon points="16,29 11,14 21,14" fill="url(#gemFront)" stroke="#831843" strokeWidth="0.5" />
      {/* Thân đáy trái */}
      <polygon points="16,29 5,14 11,14" fill="url(#gemLeft)" stroke="#831843" strokeWidth="0.5" />
      {/* Thân đáy phải */}
      <polygon points="16,29 21,14 27,14" fill="url(#gemRight)" stroke="#831843" strokeWidth="0.5" />
      {/* Đỉnh chóp trên */}
      <polygon points="9,6 23,6 27,14 5,14" fill="url(#gemTop)" stroke="#9D174D" strokeWidth="0.5" />
      <polygon points="11,6 21,6 16,14" fill="#FDF2F8" opacity="0.4" />
      {/* Ánh sáng điểm */}
      <circle cx="10" cy="8" r="1.5" fill="#FFFFFF" />
      <circle cx="21" cy="9" r="0.8" fill="#FFFFFF" opacity="0.8" />
    </svg>
  );
}

/** 3. CẤP THỊ TRƯỞNG / HUÂN CHƯƠNG NGÔI SAO VÀNG (Mayor Star Badge) */
export function MayorStarIcon({ size = 24, className = '', style }: GameIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={`shrink-0 select-none ${className}`}
      style={style}
    >
      <defs>
        <linearGradient id="starRim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <radialGradient id="starBody" cx="40%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="25%" stopColor="#FCD34D" />
          <stop offset="70%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </radialGradient>
      </defs>
      {/* Vòng nền huân chương */}
      <circle cx="16" cy="16.5" r="14" fill="#78350F" />
      <circle cx="16" cy="15.5" r="14" fill="url(#starRim)" />
      <circle cx="16" cy="15.5" r="12" fill="#92400E" />
      <circle cx="16" cy="15.5" r="11" fill="url(#starBody)" />
      {/* Ngôi sao 5 cánh nổi */}
      <polygon
        points="16,6.5 18.8,12.2 25,13.1 20.5,17.5 21.6,23.7 16,20.7 10.4,23.7 11.5,17.5 7,13.1 13.2,12.2"
        fill="#FFFFFF"
        stroke="#B45309"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <polygon
        points="16,8 18.2,12.5 23.2,13.2 19.6,16.7 20.5,21.7 16,19.3 11.5,21.7 12.4,16.7 8.8,13.2 13.8,12.5"
        fill="url(#starRim)"
      />
    </svg>
  );
}

/** 4. NĂNG LƯỢNG / TIA SÉT AP 3D (Energy Lightning Token) */
export function EnergyIcon({ size = 24, className = '', style }: GameIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={`shrink-0 select-none ${className}`}
      style={style}
    >
      <defs>
        <linearGradient id="zapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="40%" stopColor="#FACC15" />
          <stop offset="100%" stopColor="#EAB308" />
        </linearGradient>
      </defs>
      {/* Bóng sét */}
      <polygon points="18,3 9,17 16,17 13,31 25,14 17,14" fill="#854D0E" transform="translate(0, 1.5)" />
      {/* Thân sét viền đậm */}
      <polygon
        points="18,2 9,16 16,16 13,30 25,13 17,13"
        fill="url(#zapGrad)"
        stroke="#713F12"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Highlight tia sáng trong */}
      <polygon points="17,5 11,15 16,15 14,23 21,14 16.5,14" fill="#FFFFFF" opacity="0.65" />
    </svg>
  );
}

/** 5. KHO ĐỒ / RƯƠNG GỖ BÁU VẬT (Wooden Loot Chest Badge) */
export function ChestInventoryIcon({ size = 24, className = '', style }: GameIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={`shrink-0 select-none ${className}`}
      style={style}
    >
      <defs>
        <linearGradient id="chestWood" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#B45309" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
        <linearGradient id="chestGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>
      </defs>
      {/* Bóng đổ */}
      <rect x="4" y="10" width="24" height="18" rx="4" fill="#451A03" transform="translate(0, 1)" />
      {/* Thân rương */}
      <rect x="4" y="9" width="24" height="18" rx="4" fill="url(#chestWood)" stroke="#451A03" strokeWidth="1.5" />
      {/* Nẹp viền vàng */}
      <path d="M4 16H28" stroke="url(#chestGold)" strokeWidth="2.5" />
      <path d="M10 9V27M22 9V27" stroke="url(#chestGold)" strokeWidth="2.5" />
      {/* Ổ khóa vàng nổi bật */}
      <rect x="13.5" y="14" width="5" height="6" rx="1.5" fill="#FEF08A" stroke="#854D0E" strokeWidth="1" />
      <circle cx="16" cy="16.5" r="1" fill="#854D0E" />
      <path d="M16 17.5V19" stroke="#854D0E" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

/** 6. HEO ĐẤT NGÂN KHỐ MOMO (Chibi MoMo Piggy Bank Badge) */
export function PiggyBankIcon({ size = 24, className = '', style }: GameIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={`shrink-0 select-none ${className}`}
      style={style}
    >
      <defs>
        <radialGradient id="pigBody" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FDF2F8" />
          <stop offset="35%" stopColor="#F472B6" />
          <stop offset="85%" stopColor="#DB2777" />
          <stop offset="100%" stopColor="#9D174D" />
        </radialGradient>
        <linearGradient id="pigCoin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      {/* Đồng xu rơi vào lưng heo */}
      <ellipse cx="16" cy="6" rx="4" ry="2.5" fill="url(#pigCoin)" stroke="#78350F" strokeWidth="0.75" />
      {/* Tai heo */}
      <polygon points="10,12 8,6 14,9" fill="#BE185D" stroke="#831843" strokeWidth="0.75" />
      <polygon points="21,11 24,6 18,9" fill="#BE185D" stroke="#831843" strokeWidth="0.75" />
      {/* Thân heo tròn mập */}
      <ellipse cx="16" cy="18" rx="12" ry="10" fill="url(#pigBody)" stroke="#831843" strokeWidth="1.25" />
      {/* Chân heo */}
      <rect x="8" y="24" width="3.5" height="4" rx="1" fill="#BE185D" stroke="#831843" strokeWidth="0.75" />
      <rect x="20.5" y="24" width="3.5" height="4" rx="1" fill="#BE185D" stroke="#831843" strokeWidth="0.75" />
      {/* Mũi heo phúng phính */}
      <ellipse cx="23" cy="19" rx="4" ry="3" fill="#FCE7F3" stroke="#DB2777" strokeWidth="0.75" />
      <circle cx="21.5" cy="19" r="0.75" fill="#BE185D" />
      <circle cx="24.5" cy="19" r="0.75" fill="#BE185D" />
      {/* Mắt lúng liếng */}
      <circle cx="16" cy="15" r="1.5" fill="#4A044E" />
      <circle cx="16.5" cy="14.5" r="0.5" fill="#FFFFFF" />
      {/* Má hồng */}
      <ellipse cx="14" cy="20" rx="2" ry="1" fill="#F43F5E" opacity="0.6" />
    </svg>
  );
}

/** 7. TÒA THỊ CHÍNH & CƯ DÂN (Town Hall Badge with Flag) */
export function TownHallIcon({ size = 24, className = '', style }: GameIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={`shrink-0 select-none ${className}`}
      style={style}
    >
      <defs>
        <linearGradient id="roofGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>
        <linearGradient id="wallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="100%" stopColor="#FEF3C7" />
        </linearGradient>
      </defs>
      {/* Cột cờ & lá cờ đỏ sao vàng */}
      <path d="M16 2V9" stroke="#78350F" strokeWidth="1.2" />
      <path d="M16 3H22L20 5.5L22 8H16V3Z" fill="#EF4444" stroke="#991B1B" strokeWidth="0.5" />
      <circle cx="18.5" cy="5.5" r="0.7" fill="#FDE047" />
      {/* Mái vòm thị chính */}
      <path d="M8 12C8 8.5 12 7 16 7C20 7 24 8.5 24 12H8Z" fill="url(#roofGrad)" stroke="#075985" strokeWidth="1" />
      {/* Thân tòa nhà */}
      <rect x="7" y="12" width="18" height="14" fill="url(#wallGrad)" stroke="#B45309" strokeWidth="1" />
      {/* Cột trụ La Mã cổ điển */}
      <rect x="9" y="13" width="2" height="12" fill="#E2E8F0" stroke="#64748B" strokeWidth="0.5" />
      <rect x="15" y="13" width="2" height="12" fill="#E2E8F0" stroke="#64748B" strokeWidth="0.5" />
      <rect x="21" y="13" width="2" height="12" fill="#E2E8F0" stroke="#64748B" strokeWidth="0.5" />
      {/* Cửa vòm trung tâm */}
      <path d="M13.5 26V20C13.5 18.5 15 17.5 16 17.5C17 17.5 18.5 18.5 18.5 20V26H13.5Z" fill="#78350F" />
      {/* Bậc tam cấp */}
      <rect x="5" y="26" width="22" height="3" rx="1" fill="#94A3B8" stroke="#475569" strokeWidth="0.75" />
    </svg>
  );
}

/** 8. BÚA VÀNG & BẢN VẼ XÂY DỰNG (Golden Hammer & Blueprint) */
export function BuildHammerIcon({ size = 24, className = '', style }: GameIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={`shrink-0 select-none ${className}`}
      style={style}
    >
      <defs>
        <linearGradient id="hammerHead" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      {/* Bản vẽ cuộn phía sau */}
      <rect x="5" y="6" width="16" height="20" rx="2" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" transform="rotate(-15 5 6)" />
      <path d="M8 10L14 8.5M7 14L16 11.5M9 18L15 16.5" stroke="#FFFFFF" strokeWidth="1" opacity="0.75" />
      {/* Cán búa gỗ */}
      <path d="M15 15L27 27" stroke="#78350F" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M15 15L27 27" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
      {/* Đầu búa vàng nổi khối */}
      <rect x="9" y="8" width="12" height="7" rx="1.5" fill="url(#hammerHead)" stroke="#78350F" strokeWidth="1" transform="rotate(45 9 8)" />
      <circle cx="15.5" cy="11.5" r="1" fill="#FFFFFF" />
    </svg>
  );
}

/** 9. HỘP QUÀ KHỞI NGHIỆP 3D (Juicy Gift Box with Ribbon) */
export function GiftBoxIcon({ size = 24, className = '', style }: GameIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={`shrink-0 select-none ${className}`}
      style={style}
    >
      <defs>
        <linearGradient id="giftBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F43F5E" />
          <stop offset="100%" stopColor="#BE123C" />
        </linearGradient>
        <linearGradient id="giftRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="100%" stopColor="#EAB308" />
        </linearGradient>
      </defs>
      {/* Bóng đổ */}
      <rect x="5" y="13" width="22" height="15" rx="3" fill="#4C0519" transform="translate(0, 1.5)" />
      {/* Thân hộp quà */}
      <rect x="5" y="12" width="22" height="15" rx="3" fill="url(#giftBody)" stroke="#881337" strokeWidth="1.25" />
      {/* Nắp hộp quà */}
      <rect x="3.5" y="9" width="25" height="5" rx="1.5" fill="#FB7185" stroke="#881337" strokeWidth="1.25" />
      {/* Dải ruy băng vàng dọc */}
      <rect x="13.5" y="9" width="5" height="18" fill="url(#giftRibbon)" stroke="#A16207" strokeWidth="0.75" />
      {/* Dải ruy băng ngang trên nắp */}
      <rect x="3.5" y="10.5" width="25" height="2" fill="url(#giftRibbon)" />
      {/* Nơ bướm đôi trên đỉnh */}
      <path
        d="M16 9C13 4 8 6 11 9C13 10 16 9 16 9Z"
        fill="url(#giftRibbon)"
        stroke="#A16207"
        strokeWidth="0.75"
      />
      <path
        d="M16 9C19 4 24 6 21 9C19 10 16 9 16 9Z"
        fill="url(#giftRibbon)"
        stroke="#A16207"
        strokeWidth="0.75"
      />
      <circle cx="16" cy="9" r="1.5" fill="#FEF08A" stroke="#A16207" strokeWidth="0.75" />
    </svg>
  );
}

/** 10. NHÂN VẬT & ĐỐI THOẠI (Chibi Character Speech Avatar) */
export function DialogueBadgeIcon({ size = 24, className = '', style }: GameIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={`shrink-0 select-none ${className}`}
      style={style}
    >
      <defs>
        <linearGradient id="bubbleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      {/* Bong bóng thoại chibi */}
      <path
        d="M6 8C6 4.7 9 2 13 2H21C25 2 28 4.7 28 8V16C28 19.3 25 22 21 22H14L8 27V21.5C6.8 20.2 6 18.2 6 16V8Z"
        fill="url(#bubbleGrad)"
        stroke="#064E3B"
        strokeWidth="1.25"
      />
      {/* Trái tim hồng / Icon cảm xúc bên trong */}
      <path
        d="M17 7.5C15 5 12 7 13.5 9.5L17 13L20.5 9.5C22 7 19 5 17 7.5Z"
        fill="#FDF2F8"
        stroke="#BE185D"
        strokeWidth="0.75"
      />
    </svg>
  );
}

/** 11. BẢO HIỂM / KHIÊN PHÒNG VỆ (Shield Protection Badge) */
export function InsuranceShieldIcon({ size = 24, className = '', style }: GameIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={`shrink-0 select-none ${className}`}
      style={style}
    >
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>
      </defs>
      {/* Bóng khiên */}
      <path d="M16 2L27 6V15C27 22.5 16 29 16 29C16 29 5 22.5 5 15V6L16 2Z" fill="#0C4A6E" transform="translate(0, 1)" />
      {/* Thân khiên kim loại */}
      <path
        d="M16 2L27 6V15C27 22.5 16 29 16 29C16 29 5 22.5 5 15V6L16 2Z"
        fill="url(#shieldGrad)"
        stroke="#0C4A6E"
        strokeWidth="1.25"
      />
      {/* Viền vàng hoàng kim */}
      <path
        d="M16 5L24 8V15C24 20.5 16 25.5 16 25.5C16 25.5 8 20.5 8 15V8L16 5Z"
        stroke="#FDE047"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Dấu tích bảo vệ an toàn */}
      <path d="M12 14L15 17L21 11" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 12. QUỸ ĐẦU TƯ / BIỂU ĐỒ TĂNG TRƯỞNG (Fund Investment Chart) */
export function InvestmentFundIcon({ size = 24, className = '', style }: GameIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={`shrink-0 select-none ${className}`}
      style={style}
    >
      <defs>
        <linearGradient id="fundBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ECFDF5" />
          <stop offset="100%" stopColor="#A7F3D0" />
        </linearGradient>
      </defs>
      {/* Khung thẻ đầu tư */}
      <rect x="4" y="5" width="24" height="22" rx="4" fill="url(#fundBg)" stroke="#059669" strokeWidth="1.25" />
      {/* Cột nến tăng trưởng */}
      <rect x="7" y="18" width="3.5" height="6" rx="1" fill="#10B981" />
      <rect x="13" y="14" width="3.5" height="10" rx="1" fill="#10B981" />
      <rect x="19" y="9" width="3.5" height="15" rx="1" fill="#10B981" />
      {/* Mũi tên tăng vọt */}
      <path d="M8 15L14 11L20 6L25 7" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points="25,4 27,8 23,8" fill="#EF4444" />
    </svg>
  );
}

/** 13. KHẾ ƯỚC NỢ / GIẤY VAY 200 TRIỆU (Debt Contract Document) */
export function DebtContractIcon({ size = 24, className = '', style }: GameIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={`shrink-0 select-none ${className}`}
      style={style}
    >
      <defs>
        <linearGradient id="paperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="100%" stopColor="#FEF3C7" />
        </linearGradient>
      </defs>
      {/* Tờ giấy hợp đồng */}
      <rect x="6" y="3" width="20" height="26" rx="2" fill="url(#paperGrad)" stroke="#B45309" strokeWidth="1.2" />
      {/* Các dòng chữ */}
      <rect x="9" y="7" width="14" height="2" rx="0.5" fill="#92400E" />
      <rect x="9" y="11" width="11" height="1.5" rx="0.5" fill="#B45309" />
      <rect x="9" y="14" width="13" height="1.5" rx="0.5" fill="#B45309" />
      <rect x="9" y="17" width="8" height="1.5" rx="0.5" fill="#B45309" />
      {/* Dấu triện đỏ ông Chín */}
      <circle cx="19" cy="22" r="3.5" fill="#EF4444" stroke="#991B1B" strokeWidth="0.75" />
      <path d="M17.5 22H20.5M19 20.5V23.5" stroke="#FFFFFF" strokeWidth="0.8" />
    </svg>
  );
}

/** 14. BÁO CÁO TÀI CHÍNH / SỔ THU CHI P&L (Financial Ledger Book) */
export function LedgerBookIcon({ size = 24, className = '', style }: GameIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={`shrink-0 select-none ${className}`}
      style={style}
    >
      <defs>
        <linearGradient id="bookCover" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#4338CA" />
        </linearGradient>
      </defs>
      {/* Gáy sổ */}
      <rect x="4" y="4" width="22" height="24" rx="3" fill="url(#bookCover)" stroke="#312E81" strokeWidth="1.2" />
      {/* Ruột giấy trắng */}
      <rect x="8" y="6" width="18" height="20" rx="1.5" fill="#FFFFFF" />
      {/* Dòng ghi chép */}
      <line x1="11" y1="10" x2="23" y2="10" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11" y1="14" x2="20" y2="14" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11" y1="18" x2="22" y2="18" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11" y1="22" x2="17" y2="22" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
      {/* Dây đánh dấu trang vàng */}
      <path d="M18 4V12L20.5 10L23 12V4H18Z" fill="#FDE047" stroke="#A16207" strokeWidth="0.5" />
    </svg>
  );
}

/** 15. ĐỐ VUI TÀI CHÍNH (Micro Quiz Lightbulb Badge) */
export function QuizBadgeIcon({ size = 24, className = '', style }: GameIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={`shrink-0 select-none ${className}`}
      style={style}
    >
      <defs>
        <radialGradient id="bulbGrad" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="40%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#EAB308" />
        </radialGradient>
      </defs>
      {/* Bóng đèn phát sáng */}
      <circle cx="16" cy="13" r="9" fill="url(#bulbGrad)" stroke="#854D0E" strokeWidth="1.2" />
      {/* Dây tóc bóng đèn */}
      <path d="M13 14C13 11 19 11 19 14" stroke="#B45309" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="16" y1="14" x2="16" y2="17" stroke="#B45309" strokeWidth="1" />
      {/* Đuôi kim loại xoắn */}
      <rect x="12" y="21" width="8" height="4" rx="1" fill="#94A3B8" stroke="#475569" strokeWidth="0.8" />
      <line x1="12" y1="23" x2="20" y2="23" stroke="#CBD5E1" strokeWidth="0.8" />
      <rect x="14" y="25" width="4" height="2" rx="1" fill="#475569" />
      {/* Tia sáng phát quang */}
      <line x1="16" y1="1" x2="16" y2="3" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="5" y1="13" x2="3" y2="13" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="27" y1="13" x2="29" y2="13" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** 16. MỞ RỘNG MẶT BẰNG / ĐẤT ĐAI (Land Deed / Golden Shovel) */
export function LandExpandIcon({ size = 24, className = '', style }: GameIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={`shrink-0 select-none ${className}`}
      style={style}
    >
      <defs>
        <linearGradient id="grassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#16A34A" />
        </linearGradient>
      </defs>
      {/* Khối đất vỉa hè 3D */}
      <polygon points="16,4 28,10 16,16 4,10" fill="url(#grassGrad)" stroke="#14532D" strokeWidth="1" />
      <polygon points="4,10 16,16 16,24 4,18" fill="#78350F" stroke="#451A03" strokeWidth="1" />
      <polygon points="16,16 28,10 28,18 16,24" fill="#92400E" stroke="#451A03" strokeWidth="1" />
      {/* Cọc cắm quy hoạch viền đỏ */}
      <rect x="15" y="6" width="2" height="7" fill="#FEF08A" stroke="#854D0E" strokeWidth="0.5" />
      <polygon points="17,7 22,9 17,11" fill="#EF4444" />
    </svg>
  );
}
