/**
 * DIỆN MẠO NGẪU NHIÊN THEO TÊN - dùng cho avatar/NPC không có `CitizenDef`
 * cố định (sự kiện Chuyện Phố, NPC sinh theo tòa nhà, người đi đường).
 *
 * Trước đây mỗi nơi vẽ avatar tự chế một bộ mặt riêng (xem lịch sử
 * `ChibiNpcAvatar` cũ trong `DialogueModal.tsx`, hoặc div CSS tay trong
 * `StreetTraffic.tsx`) - không ai giống `ChibiBody`, nên cùng một game có 3-4
 * phong cách nhân vật khác nhau. Hàm này sinh một `CharacterAppearance` hợp
 * lệ từ một chuỗi hạt giống (seed) bất kỳ, CÙNG HỆ MÀU/kiểu tóc với
 * `CITIZEN_DEFS` - mọi nơi gọi `ChibiBody` đều ra một "chất liệu" nhân vật.
 *
 * Seed giống nhau (cùng tên) luôn ra đúng một diện mạo - nhân vật không đổi
 * mặt giữa hai lần mở hội thoại.
 */
import type { CharacterAppearance, HairStyle, OutfitType } from './character-appearance';

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pick<T>(arr: readonly T[], h: number, salt: number): T {
  return arr[(h + salt) % arr.length];
}

const SKIN = ['#FDE6D2', '#FCD9BD', '#FFF1E6', '#EFC49C', '#E0A87E'] as const;
const HAIR_COLOR = ['#2B2118', '#1F2937', '#3E2723', '#2E1D16'] as const;
const SHIRT = ['#2B4368', '#0D9488', '#65A30D', '#F472B6', '#D82D8B', '#EA580C', '#7C3AED', '#0EA5E9'] as const;
const PANTS = ['#1E293B', '#334155', '#374151', '#0F172A'] as const;
const ACCENT = ['#DC2626', '#14B8A6', '#FACC15', '#D82D8B', '#2563EB', '#F59E0B'] as const;

/** Kiểu tóc nữ - chọn khi tên khớp heuristic phụ nữ/lớn tuổi. */
const HAIR_FEMALE = ['BUN', 'BOB', 'PONYTAIL', 'LONG_HAIR', 'HEADSCARF'] as const satisfies readonly HairStyle[];
/** Kiểu tóc nam / trung tính. */
const HAIR_NEUTRAL = ['SHORT', 'NON_LA', 'MESSY', 'CAP_YELLOW'] as const satisfies readonly HairStyle[];

const OUTFIT_FEMALE = ['DEFAULT', 'SKIRT', 'AO_DAI'] as const satisfies readonly OutfitType[];
const OUTFIT_NEUTRAL = ['DEFAULT', 'DEFAULT', 'OFFICE_VEST'] as const satisfies readonly OutfitType[];

/**
 * Đoán giới tính/độ tuổi THÔ từ chữ trong tên - chỉ để chọn NHÓM tóc/trang
 * phục, không phải phân loại nghiêm túc. Khớp các từ đệm thường gặp trong
 * tên tiếng Việt: Cô/Bà/Chị/Thím cho nữ, còn lại coi là trung tính.
 */
function skewFemale(seed: string): boolean {
  const lower = seed.toLowerCase();
  return /\b(cô|bà|chị|thím|mợ|dì)\b/.test(lower);
}

export function appearanceFromSeed(seed: string): CharacterAppearance {
  const h = hashString(seed || 'nguoi-pho');
  const female = skewFemale(seed);
  const hairPool = female ? HAIR_FEMALE : HAIR_NEUTRAL;
  const outfitPool = female ? OUTFIT_FEMALE : OUTFIT_NEUTRAL;

  return {
    skinColor: pick(SKIN, h, 0),
    hairStyle: pick(hairPool, h, 1),
    hairColor: pick(HAIR_COLOR, h, 2),
    shirtColor: pick(SHIRT, h, 3),
    pantsColor: pick(PANTS, h, 4),
    accentColor: pick(ACCENT, h, 5),
    outfitType: pick(outfitPool, h, 6),
    hasTie: outfitPool === OUTFIT_NEUTRAL && h % 5 === 0,
  };
}
