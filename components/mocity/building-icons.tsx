import React from 'react';
import type { BuildingIconKey } from '@/lib/mocity/types';

export interface ShophouseIconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/** 1. QUÁN CÀ PHÊ VỈA HÈ (Phin Cà Phê & Ly Cafe Sữa Đá) */
export function CoffeeShopGameIcon({ size = 24, className = '', style }: ShophouseIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={`shrink-0 select-none ${className}`} style={style}>
      <defs>
        <linearGradient id="coffeeCup" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
      </defs>
      {/* Đĩa lót */}
      <ellipse cx="16" cy="27" rx="12" ry="3" fill="#B45309" stroke="#451A03" strokeWidth="0.8" />
      {/* Thân ly cà phê */}
      <path d="M7 14H25L23 25C23 26 21 27 16 27C11 27 9 26 9 25L7 14Z" fill="url(#coffeeCup)" stroke="#451A03" strokeWidth="1" />
      {/* Phin cà phê nhôm bên trên */}
      <rect x="8" y="7" width="16" height="7" rx="1" fill="#CBD5E1" stroke="#475569" strokeWidth="0.8" />
      <rect x="6" y="13" width="20" height="2" rx="0.5" fill="#94A3B8" stroke="#475569" strokeWidth="0.6" />
      <rect x="11" y="4" width="10" height="3" rx="0.5" fill="#E2E8F0" stroke="#475569" strokeWidth="0.6" />
      <circle cx="16" cy="3" r="1.2" fill="#F59E0B" />
      {/* Làn khói thơm nghi ngút */}
      <path d="M12 2C12 0 14 0 14 -1" stroke="#FDE047" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

/** 2. QUÁN ĂN / CƠM TẤM SƯỜN BÌ CHẢ */
export function UtensilsFoodGameIcon({ size = 24, className = '', style }: ShophouseIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={`shrink-0 select-none ${className}`} style={style}>
      <defs>
        <radialGradient id="plateGrad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="100%" stopColor="#FDE68A" />
        </radialGradient>
      </defs>
      {/* Đĩa thức ăn */}
      <ellipse cx="16" cy="18" rx="14" ry="10" fill="url(#plateGrad)" stroke="#B45309" strokeWidth="1.2" />
      <ellipse cx="16" cy="18" rx="11" ry="7" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="0.6" />
      {/* Miếng sườn nướng thơm lừng */}
      <rect x="8" y="14" width="9" height="7" rx="2" fill="#B91C1C" stroke="#7F1D1D" strokeWidth="0.8" />
      <line x1="10" y1="16" x2="15" y2="16" stroke="#FEF08A" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="9" y1="18" x2="14" y2="18" stroke="#FEF08A" strokeWidth="0.8" strokeLinecap="round" />
      {/* Trứng ốp la lòng đào */}
      <circle cx="20" cy="17" r="3.5" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.5" />
      <circle cx="20" cy="17" r="2" fill="#F59E0B" />
      {/* Muỗng & Nĩa chéo */}
      <path d="M5 6L11 12M5 12L11 6" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** 3. TIỆM TẠP HÓA / SIÊU THỊ MINI (Shophouse Grocery with Awning) */
export function GroceryStoreGameIcon({ size = 24, className = '', style }: ShophouseIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={`shrink-0 select-none ${className}`} style={style}>
      <defs>
        <linearGradient id="wallShop" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="100%" stopColor="#FDE68A" />
        </linearGradient>
      </defs>
      {/* Thân cửa tiệm */}
      <rect x="5" y="11" width="22" height="17" rx="1.5" fill="url(#wallShop)" stroke="#78350F" strokeWidth="1.2" />
      {/* Mái bạt sọc đỏ trắng đặc trưng */}
      <path d="M3 11L5 5H27L29 11H3Z" fill="#EF4444" stroke="#78350F" strokeWidth="1" />
      <path d="M8 5L7 11M13 5L13 11M19 5L19 11M24 5L25 11" stroke="#FFFFFF" strokeWidth="2" />
      {/* Cửa cuốn & Quầy kính */}
      <rect x="9" y="16" width="14" height="12" fill="#38BDF8" stroke="#0284C7" strokeWidth="0.8" opacity="0.85" />
      <rect x="11" y="20" width="10" height="8" fill="#FFFFFF" stroke="#78350F" strokeWidth="0.8" />
      <circle cx="13" cy="24" r="1" fill="#F59E0B" />
    </svg>
  );
}

/** 4. TRUNG TÂM MUA SẮM / TÚI SHOPPING (Shopping Center Mall) */
export function ShoppingMallGameIcon({ size = 24, className = '', style }: ShophouseIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={`shrink-0 select-none ${className}`} style={style}>
      <defs>
        <linearGradient id="bagGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FB7185" />
          <stop offset="100%" stopColor="#E11D48" />
        </linearGradient>
      </defs>
      {/* Quai túi xách */}
      <path d="M11 12V7C11 4.5 13 3 16 3C19 3 21 4.5 21 7V12" stroke="#FDA4AF" strokeWidth="2" strokeLinecap="round" />
      {/* Thân túi xách thời trang */}
      <rect x="5" y="11" width="22" height="18" rx="3" fill="url(#bagGrad)" stroke="#9F1239" strokeWidth="1.2" />
      {/* Ngôi sao vàng thương hiệu */}
      <polygon points="16,16 17.5,19.5 21,20 18.5,22.5 19,26 16,24 13,26 13.5,22.5 11,20 14.5,19.5" fill="#FDE047" stroke="#A16207" strokeWidth="0.5" />
    </svg>
  );
}

/** 5. RẠP CHIẾU PHIM / PHIM ĐIỆN ẢNH (Cinema Movie Reel) */
export function CinemaGameIcon({ size = 24, className = '', style }: ShophouseIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={`shrink-0 select-none ${className}`} style={style}>
      <rect x="4" y="6" width="24" height="20" rx="3" fill="#1E1B4B" stroke="#4338CA" strokeWidth="1.2" />
      <rect x="4" y="6" width="24" height="6" fill="#312E81" />
      <path d="M7 6L10 12M13 6L16 12M19 6L22 12M25 6L28 12" stroke="#FFFFFF" strokeWidth="1.5" />
      <polygon points="13,16 21,20 13,24" fill="#FACC15" stroke="#CA8A04" strokeWidth="0.8" />
    </svg>
  );
}

/** 6. TÒA NHÀ CAO ỐC / CHUNG CƯ CAO CẤP (Highrise Apartment Tower) */
export function BuildingApartmentGameIcon({ size = 24, className = '', style }: ShophouseIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={`shrink-0 select-none ${className}`} style={style}>
      <defs>
        <linearGradient id="bldgGlass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
      </defs>
      <rect x="7" y="4" width="18" height="25" rx="2" fill="url(#bldgGlass)" stroke="#075985" strokeWidth="1.2" />
      {/* Ô cửa kính phản quang */}
      <rect x="10" y="7" width="4" height="4" rx="0.5" fill="#E0F2FE" />
      <rect x="18" y="7" width="4" height="4" rx="0.5" fill="#E0F2FE" />
      <rect x="10" y="14" width="4" height="4" rx="0.5" fill="#E0F2FE" />
      <rect x="18" y="14" width="4" height="4" rx="0.5" fill="#E0F2FE" />
      <rect x="10" y="21" width="4" height="4" rx="0.5" fill="#E0F2FE" />
      <rect x="18" y="21" width="4" height="4" rx="0.5" fill="#E0F2FE" />
    </svg>
  );
}

/** 7. NGÂN HÀNG SỐ / TÒA LANDMARK (Digital Bank / Landmark) */
export function BankLandmarkGameIcon({ size = 24, className = '', style }: ShophouseIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={`shrink-0 select-none ${className}`} style={style}>
      <polygon points="16,4 4,11 28,11" fill="#F59E0B" stroke="#92400E" strokeWidth="1" />
      <rect x="6" y="11" width="20" height="2" fill="#FEF3C7" stroke="#92400E" strokeWidth="0.6" />
      <rect x="8" y="13" width="2.5" height="11" fill="#CBD5E1" stroke="#475569" strokeWidth="0.5" />
      <rect x="14.75" y="13" width="2.5" height="11" fill="#CBD5E1" stroke="#475569" strokeWidth="0.5" />
      <rect x="21.5" y="13" width="2.5" height="11" fill="#CBD5E1" stroke="#475569" strokeWidth="0.5" />
      <rect x="5" y="24" width="22" height="4" rx="1" fill="#94A3B8" stroke="#475569" strokeWidth="0.8" />
    </svg>
  );
}

/** 8. NHÀ Ở / KHU DÂN CƯ (Residential House) */
export function HomeResidentialGameIcon({ size = 24, className = '', style }: ShophouseIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={`shrink-0 select-none ${className}`} style={style}>
      <polygon points="16,4 4,14 28,14" fill="#EA580C" stroke="#9A3412" strokeWidth="1.2" />
      <rect x="6" y="14" width="20" height="14" rx="1" fill="#FEF3C7" stroke="#B45309" strokeWidth="1" />
      <rect x="13" y="19" width="6" height="9" rx="1" fill="#92400E" />
      <rect x="8" y="16" width="4" height="4" rx="0.5" fill="#38BDF8" stroke="#0284C7" strokeWidth="0.5" />
      <rect x="20" y="16" width="4" height="4" rx="0.5" fill="#38BDF8" stroke="#0284C7" strokeWidth="0.5" />
    </svg>
  );
}

/** 9. CÂY XANH / CÔNG VIÊN ĐÔ THỊ (Urban Green Trees) */
export function UrbanTreesGameIcon({ size = 24, className = '', style }: ShophouseIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={`shrink-0 select-none ${className}`} style={style}>
      <rect x="14" y="18" width="4" height="10" rx="1" fill="#78350F" stroke="#451A03" strokeWidth="0.8" />
      <circle cx="16" cy="12" r="9" fill="#22C55E" stroke="#15803D" strokeWidth="1.2" />
      <circle cx="12" cy="14" r="5" fill="#16A34A" />
      <circle cx="20" cy="13" r="6" fill="#4ADE80" opacity="0.8" />
    </svg>
  );
}

/** 10. TRƯỜNG HỌC / ĐÀO TẠO (Graduation Academy) */
export function AcademyGameIcon({ size = 24, className = '', style }: ShophouseIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={`shrink-0 select-none ${className}`} style={style}>
      <polygon points="16,6 3,13 16,20 29,13" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1.2" />
      <path d="M8 16V22C8 24 11.5 26 16 26C20.5 26 24 24 24 22V16" stroke="#1E40AF" strokeWidth="1.5" fill="none" />
      <path d="M29 13V22" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="29" cy="23" r="1.5" fill="#F59E0B" />
    </svg>
  );
}

/** 11. TRẠM DỮ LIỆU SỐ / SERVER CLOUD */
export function ServerDataGameIcon({ size = 24, className = '', style }: ShophouseIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={`shrink-0 select-none ${className}`} style={style}>
      <rect x="5" y="5" width="22" height="6" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="1" />
      <circle cx="9" cy="8" r="1" fill="#22C55E" />
      <circle cx="13" cy="8" r="1" fill="#38BDF8" />
      <rect x="5" y="13" width="22" height="6" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="1" />
      <circle cx="9" cy="16" r="1" fill="#22C55E" />
      <circle cx="13" cy="16" r="1" fill="#38BDF8" />
      <rect x="5" y="21" width="22" height="6" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="1" />
      <circle cx="9" cy="24" r="1" fill="#22C55E" />
      <circle cx="13" cy="24" r="1" fill="#38BDF8" />
    </svg>
  );
}

/** 12. THÁP TRUYỀN HÌNH / TOWER CONTROL */
export function TowerGameIcon({ size = 24, className = '', style }: ShophouseIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={`shrink-0 select-none ${className}`} style={style}>
      <polygon points="16,3 12,28 20,28" fill="#64748B" stroke="#334155" strokeWidth="1" />
      <ellipse cx="16" cy="12" rx="7" ry="3" fill="#E2E8F0" stroke="#475569" strokeWidth="0.8" />
      <circle cx="16" cy="4" r="2" fill="#EF4444" />
      <line x1="10" y1="20" x2="22" y2="20" stroke="#94A3B8" strokeWidth="1" />
    </svg>
  );
}

/** 13. SÂN BAY / GIAO VẬN (Airport Plane) */
export function PlaneGameIcon({ size = 24, className = '', style }: ShophouseIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={`shrink-0 select-none ${className}`} style={style}>
      <path
        d="M16 3C14.5 3 13.5 5 13.5 8L4 15V18L13.5 15V22L10 25V28L16 26L22 28V25L18.5 22V15L28 18V15L18.5 8C18.5 5 17.5 3 16 3Z"
        fill="#38BDF8"
        stroke="#0369A1"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 14. VÍ ĐIỆN TỬ / TÚI TIỀN (Wallet Token) */
export function WalletGameIcon({ size = 24, className = '', style }: ShophouseIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={`shrink-0 select-none ${className}`} style={style}>
      <rect x="4" y="7" width="24" height="18" rx="3" fill="#A855F7" stroke="#6B21A8" strokeWidth="1.2" />
      <path d="M4 11H28" stroke="#D8B4FE" strokeWidth="1" />
      <rect x="19" y="12" width="9" height="8" rx="2" fill="#FDE047" stroke="#A16207" strokeWidth="0.8" />
      <circle cx="23.5" cy="16" r="1.2" fill="#78350F" />
    </svg>
  );
}

/** 15. TĂNG TRƯỞNG / PHÁT TÀI (Trending Up Golden Spark) */
export function TrendingUpGameIcon({ size = 24, className = '', style }: ShophouseIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={`shrink-0 select-none ${className}`} style={style}>
      <path d="M4 24L12 16L18 21L28 8" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points="21,8 28,8 28,15" fill="#10B981" />
    </svg>
  );
}

/** 16. NĂNG LƯỢNG / ĐIỆN LỰC (Zap Power) */
export function ZapGameIcon({ size = 24, className = '', style }: ShophouseIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={`shrink-0 select-none ${className}`} style={style}>
      <polygon points="18,2 8,16 15,16 13,30 24,14 17,14" fill="#FACC15" stroke="#713F12" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

/** 17. KÉT SẮT / HEO TIẾT KIỆM (Safe / Piggy) */
export function SafePiggyGameIcon({ size = 24, className = '', style }: ShophouseIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={`shrink-0 select-none ${className}`} style={style}>
      <rect x="5" y="5" width="22" height="22" rx="4" fill="#64748B" stroke="#334155" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="6" fill="#CBD5E1" stroke="#475569" strokeWidth="1" />
      <circle cx="16" cy="16" r="2" fill="#F59E0B" />
      <circle cx="23" cy="10" r="1" fill="#22C55E" />
    </svg>
  );
}

/**
 * BẢNG ÁNH XẠ TOÀN BỘ CÔNG TRÌNH SANG GAME ICONS
 */
export const BUILDING_ICON: Record<BuildingIconKey, React.ComponentType<ShophouseIconProps>> = {
  store: GroceryStoreGameIcon,
  utensils: UtensilsFoodGameIcon,
  shoppingBag: ShoppingMallGameIcon,
  coffee: CoffeeShopGameIcon,
  landmark: BankLandmarkGameIcon,
  server: ServerDataGameIcon,
  graduation: AcademyGameIcon,
  trees: UrbanTreesGameIcon,
  building: BuildingApartmentGameIcon,
  tower: TowerGameIcon,
  piggy: SafePiggyGameIcon,
  film: CinemaGameIcon,
  plane: PlaneGameIcon,
  wallet: WalletGameIcon,
  trendingUp: TrendingUpGameIcon,
  zap: ZapGameIcon,
  home: HomeResidentialGameIcon,
};
