/**
 * BẢNG MẶT TIỀN THEO CÔNG TRÌNH - nguồn dùng chung.
 *
 * Tách ra khỏi `ViaHeStreetBoard.tsx` để `StoreInspectorModal` cũng render
 * được đúng mặt tiền thật của công trình (preview trong header), không chỉ
 * icon trừu tượng. Một bảng tra duy nhất, không nhân bản.
 */
import type { ShopType } from '@/components/mocity/ShophouseFacade';

export interface ShophouseTheme {
  wallBg: string;
  wallHatch: string;
  signBg: string;
  signText: string;
  defaultLabel: string;
  shopType: ShopType;
}

export const SHOPHOUSE_THEMES: ShophouseTheme[] = [
  {
    wallBg: '#EFE8D5',
    wallHatch: '#E2D9C0',
    signBg: '#E6B84F',
    signText: '#FFFFFF',
    defaultLabel: 'SỬA XE',
    shopType: 'TIRE_SHOP',
  },
  {
    wallBg: '#C8D9EC',
    wallHatch: '#B5CBE3',
    signBg: '#D9534F',
    signText: '#FFFFFF',
    defaultLabel: 'TẠP HOÁ',
    shopType: 'GROCERY',
  },
  {
    wallBg: '#EEC7C2',
    wallHatch: '#E2B4AE',
    signBg: '#669977',
    signText: '#FFFFFF',
    defaultLabel: 'VĂN PHÒNG PHẨM',
    shopType: 'STATIONERY',
  },
  {
    wallBg: '#DFC6E8',
    wallHatch: '#D0B2DC',
    signBg: '#D82D8B',
    signText: '#FFFFFF',
    defaultLabel: 'TRÀ SỮA MOMO',
    shopType: 'CAFE',
  },
  {
    wallBg: '#F6E299',
    wallHatch: '#EBD37E',
    signBg: '#7C4DFF',
    signText: '#FFFFFF',
    defaultLabel: 'MOMO CINEMA',
    shopType: 'CINEMA',
  },
  {
    wallBg: '#EFE8D5',
    wallHatch: '#E2D9C0',
    signBg: '#A46A3E',
    signText: '#FFFFFF',
    defaultLabel: 'GẠO TÁM THƠM',
    shopType: 'RICE_SHOP',
  },
  {
    wallBg: '#C9E8D9',
    wallHatch: '#B4DEC9',
    signBg: '#0EA5E9',
    signText: '#FFFFFF',
    defaultLabel: 'TÚI THẦN TÀI',
    shopType: 'FINTECH',
  },
  /* ── 7. CÔNG VIÊN - cây xanh, không buôn bán ── */
  {
    wallBg: '#E4EFD8',
    wallHatch: '#D2E4C0',
    signBg: '#5E8C42',
    signText: '#FFFFFF',
    defaultLabel: 'CÔNG VIÊN',
    shopType: 'PARK',
  },
  /* ── 8. NHÀ Ở - cửa ra vào, không biển hiệu ── */
  {
    wallBg: '#F0E8DA',
    wallHatch: '#E4D8C4',
    signBg: '#9A8468',
    signText: '#FFFFFF',
    defaultLabel: 'NHÀ Ở',
    shopType: 'HOME',
  },
  /* ── 9. KỲ QUAN - tượng đài, bậc tam cấp ── */
  {
    wallBg: '#FBF0D8',
    wallHatch: '#F4E2BC',
    signBg: '#B8862A',
    signText: '#FFFFFF',
    defaultLabel: 'KỲ QUAN',
    shopType: 'LANDMARK',
  },
];

/** Chỉ số theme dùng khi gặp công trình chưa khai báo - cố tình trung tính. */
export const THEME_FALLBACK = 1;

/**
 * MỖI CÔNG TRÌNH MỘT MẶT TIỀN, khai báo tường minh.
 *
 * 0 SỬA XE · 1 TẠP HÓA · 2 VĂN PHÒNG PHẨM · 3 CÀ PHÊ · 4 RẠP PHIM
 * 5 CƠM TẤM · 6 TÀI CHÍNH · 7 CÔNG VIÊN · 8 NHÀ Ở · 9 KỲ QUAN
 */
export const THEME_BY_BUILDING: Record<string, ShophouseTheme> = {
  /* Ăn uống - mua sắm */
  'quan-ca-phe': SHOPHOUSE_THEMES[3],
  'sieu-thi': SHOPHOUSE_THEMES[1],
  'pho-am-thuc': SHOPHOUSE_THEMES[5],
  'rap-phim-momo': SHOPHOUSE_THEMES[4],
  'trung-tam-thuong-mai': SHOPHOUSE_THEMES[1],
  'to-hop-du-lich': SHOPHOUSE_THEMES[2],
  'tram-hoa-don': SHOPHOUSE_THEMES[2],
  /* Tài chính */
  'tram-tui-than-tai': SHOPHOUSE_THEMES[6],
  'ngan-hang-so': SHOPHOUSE_THEMES[6],
  'trung-tam-vi-tra-sau': SHOPHOUSE_THEMES[6],
  'hoc-vien-tai-chinh': SHOPHOUSE_THEMES[6],
  'san-chung-khoan': SHOPHOUSE_THEMES[6],
  'trung-tam-du-lieu': SHOPHOUSE_THEMES[6],
  /* Không buôn bán */
  'cong-vien': SHOPHOUSE_THEMES[7],
  'nha-pho-binh-dan': SHOPHOUSE_THEMES[8],
  'chung-cu-cao-cap': SHOPHOUSE_THEMES[8],
  'ky-tuc-xa-sinh-vien': SHOPHOUSE_THEMES[8],
  'quang-truong-heo-vang': SHOPHOUSE_THEMES[9],
  'thap-momo': SHOPHOUSE_THEMES[9],
};

export function themeForBuilding(defId: string): ShophouseTheme {
  return THEME_BY_BUILDING[defId] ?? SHOPHOUSE_THEMES[THEME_FALLBACK];
}
