/**
 * HỆ THỐNG NHÂN VẬT HỢP NHẤT (UNIFIED CHARACTER ROSTER) - Single Source of Truth
 *
 * Khắc phục tình trạng phân mảnh và thiếu nhất quán:
 * 1. Diện mạo (CharacterAppearance) chuẩn cho toàn bộ 15 Cư dân vỉa hè,
 *    6 Quản lý cửa hàng và 8 Cố vấn đô thị.
 * 2. Cung cấp hàm `resolveCharacterAppearance(nameOrId)` để mọi nơi
 *    (Street, DialogueModal, StoreInspectorModal, MayorCenterModal)
 *    khi vẽ bất kỳ nhân vật nào đều ra đúng diện mạo chuẩn thay vì bị
 *    băm chuỗi ngẫu nhiên (appearanceFromSeed).
 */

import type { CharacterAppearance, FacialEmotion } from './character-appearance';
import { appearanceFromSeed } from './character-appearance-gen';

export interface CitizenDef extends CharacterAppearance {
  id: string;
  name: string;
  role: string;
  startX: number;
  lane: number;
  startDir: 1 | -1;
  speed: number;
  emotion: FacialEmotion;
  quotes: string[];
  stationary?: boolean;
}

/** 15 Cư dân đời thường trên vỉa hè MoCity */
export const CITIZEN_ROSTER: CitizenDef[] = [
  {
    id: 'cit-mayor-assistant',
    name: 'Trợ Lý Thị Trưởng',
    role: 'Cán Bộ Quy Hoạch',
    startX: 240,
    lane: 0,
    startDir: 1,
    speed: 0.4,
    emotion: 'HAPPY',
    skinColor: '#FDE6D2',
    hairStyle: 'SHORT',
    hairColor: '#2B2118',
    shirtColor: '#2B4368',
    pantsColor: '#1E293B',
    accentColor: '#DC2626',
    outfitType: 'OFFICE_VEST',
    hasTie: true,
    heldItem: 'BRIEFCASE',
    quotes: [
      'Trời nắng 40°C mà cán bộ vẫn đi tuần kiểm tra vỉa hè đây!',
      'Cây xanh đô thị giúp giảm 3 độ C, bà con ủng hộ trồng thêm nha!',
      'Mưa ngập triều cường nhưng hệ thống thoát nước MoCity đang cân đẹp!',
      'Nhà nào hát karaoke sau 10h đêm là có biên bản nhắc nhở liền nha!',
      'Phố vỉa hè bữa nay 100% quét mã QR, văn minh kiểu mẫu!',
      'Đèn đường vừa bật tự động lúc chập tối, bà con an tâm dạo mát!',
    ],
  },
  {
    id: 'cit-co-tu',
    name: 'Cô Tư Đi Chợ',
    role: 'Bà Nội Trợ Săn Deal',
    startX: 390,
    lane: 4,
    startDir: -1,
    speed: 0.3,
    emotion: 'STAR_EYES',
    skinColor: '#FCD9BD',
    hairStyle: 'HEADSCARF',
    hairColor: '#2B2118',
    shirtColor: '#0D9488',
    pantsColor: '#334155',
    accentColor: '#14B8A6',
    outfitType: 'WORKER_OVERALLS',
    heldItem: 'SHOPPING_BAG',
    quotes: [
      'Trời nồm ẩm sàn trơn như sân trượt băng, đi chợ phải rón rén!',
      'Sốt giá vàng từng giờ chóng cả mặt, thôi mua cá tươi ăn cho lành!',
      'Nắng cháy đầu mà săn được mã giảm giá 50k rau củ là mát lòng!',
      'Hàng xóm lại bật loa kẹo kéo hát "Duyên Phận", tui thuộc làu luôn!',
      'Quét mặt sinh trắc học MoMo lúc mới ngủ dậy tóc xù vẫn nhận diện chuẩn ghê!',
      'Tích xu đổi voucher mua sắm Tết từ bây giờ là vừa đẹp cô bác ơi!',
    ],
  },
  {
    id: 'cit-be-nam',
    name: 'Bé Nam GenZ',
    role: 'Sinh Viên Năm 3',
    startX: 540,
    lane: 8,
    startDir: 1,
    speed: 0.5,
    emotion: 'HAPPY',
    skinColor: '#FDE6D2',
    hairStyle: 'CAP_YELLOW',
    hairColor: '#1F2937',
    shirtColor: '#65A30D',
    pantsColor: '#374151',
    accentColor: '#FACC15',
    heldItem: 'MILK_TEA',
    quotes: [
      'Trưa 40 độ húp ly trà sữa full topping mới hồi sinh được!',
      'Mưa ngập ngã tư sâu nửa bánh xe, lội nước ngỡ đang chèo sup!',
      'Kèo lẩu tối qua chia tiền trên MoMo, đứa nào tính trốn WC tui tag thẳng!',
      'Mở 5 tab canh vé xe Tết về quê mà mạng xoay đều như chong chóng!',
      'Trời rét căm căm đi thực tập chỉ ước trùm chăn cày deadline...',
      'Sinh trắc học quét mặt nhanh phết, lỡ sưng mụn một bên vẫn qua vèo vèo!',
    ],
  },
  {
    id: 'cit-chi-thao',
    name: 'Chị Thảo Văn Phòng',
    role: 'Thánh Chốt Đơn',
    startX: 690,
    lane: 3,
    startDir: -1,
    speed: 0.38,
    emotion: 'HAPPY',
    skinColor: '#FFF1E6',
    hairStyle: 'BUN',
    hairColor: '#3E2723',
    shirtColor: '#F472B6',
    pantsColor: '#334155',
    accentColor: '#D82D8B',
    outfitType: 'SKIRT',
    heldItem: 'PHONE_QR',
    quotes: [
      'Ting! Lãi Túi Thần Tài sáng nay về đủ bù ly cà phê muối chữa lành!',
      'Thời tiết ẩm ương như deadline của sếp, sáng nắng chiều giông tối nồm!',
      'Săn sale 0h xong sáng ra hoa mắt, may có voucher MoMo gánh còng lưng!',
      'Camera ngã tư mới phạt nguội gắt lắm, đi đứng nghiêm chỉnh nha mấy ní!',
      'Drama trà xanh văn phòng bên tòa nhà đối diện hót hòn họt cả sáng!',
      'Vé máy bay Tết đắt quá, chắc gom voucher MoMo săn vé tàu hỏa thôi!',
    ],
  },
  {
    id: 'cit-ong-loc',
    name: 'Ông Lộc Vé Số',
    role: 'Thần Tài Góc Phố',
    startX: 840,
    lane: 7,
    startDir: 1,
    speed: 0.28,
    emotion: 'HAPPY',
    skinColor: '#FCD9BD',
    hairStyle: 'BALD_GLASSES',
    hairColor: '#9CA3AF',
    shirtColor: '#D97706',
    pantsColor: '#3E2A1B',
    accentColor: '#FEF08A',
    heldItem: 'LOTTERY_FAN',
    quotes: [
      'Trời nắng chang chang nhưng đi bộ vừa khỏe chân vừa nuôi Heo Vàng!',
      'Giá vàng lên xuống thây kệ, chiều nay vé số đuôi 68-79 bao nổ nha!',
      'Mưa to tui ghé hiên tiệm tạp hóa trú mưa, quét mã QR mua lẹ!',
      'Cả xóm đang kháo nhau hôm qua có người trúng giải nhì Vietlott kìa!',
      'Già rồi mà quét mặt sinh trắc học cái rẹt, MoMo làm tiện quá xá!',
      'Trời se lạnh làm chén trà nóng ngắm phố phường MoCity bình yên ghê!',
    ],
  },
  {
    id: 'cit-anh-hoang',
    name: 'Anh Hoàng IT',
    role: 'Kỹ Sư Phần Mềm',
    startX: 990,
    lane: 2,
    startDir: -1,
    speed: 0.42,
    emotion: 'HAPPY',
    skinColor: '#E0A87E',
    hairStyle: 'HARD_HAT_ORANGE',
    hairColor: '#111827',
    shirtColor: '#EA580C',
    pantsColor: '#1E293B',
    accentColor: '#F97316',
    outfitType: 'ELECTRICIAN',
    heldItem: 'NONE',
    quotes: [
      'Kiểm tra trạm biến áp mùa nắng nóng, đảm bảo điện lưới cho cả phố MoCity!',
      'Trời nồm ẩm dây điện dễ chập, bà con chú ý an toàn thiết bị gia đình nha!',
      'Mưa ngập là đội kỹ thuật đi ngắt điện điểm trũng liền, bảo vệ an toàn!',
      'Tự động thanh toán hoá đơn tiền điện qua MoMo đỡ mất công đóng trễ cắt điện!',
      'Bảo trì đường dây cao thế mồ hôi ướt đẫm, mà thấy phố sáng rực là vui rồi!',
      'Mùa triều cường bà con nhớ ngắt aptomat tầng trệt nếu nước mấp mé cửa nghen!',
    ],
  },
  {
    id: 'cit-bao-ngoc',
    name: 'Bảo Ngọc KOC',
    role: 'Reviewer Phố Phường',
    startX: 1140,
    lane: 6,
    startDir: 1,
    speed: 0.45,
    emotion: 'STAR_EYES',
    skinColor: '#FFF1E6',
    hairStyle: 'BOB',
    hairColor: '#7C2D12',
    shirtColor: '#38BDF8',
    pantsColor: '#475569',
    accentColor: '#F43F5E',
    outfitType: 'SKIRT',
    heldItem: 'CAMERA',
    quotes: [
      'Livestream review quán lẩu trời mưa ngập mà view nổ triệu triệu tim!',
      'Trời nắng gắt chụp cam thường da vẫn bắt sáng, phố MoCity ăn ảnh xịn!',
      'Drama xóm: 2 quán trà sữa đối diện combat giảm giá 1 đồng giật giũ!',
      'Check-in cây thông Noel sớm giữa trời se lạnh, outfit triệu like!',
      'Vé concert idol mở bán cháy vé trong 3 giây, tui chốt qua MoMo đỉnh chóp!',
      'Trend quét mã lì xì online QR cute năm nay hot rần rần trên TikTok!',
    ],
  },
  {
    id: 'cit-chu-bay',
    name: 'Chú Bảy Hàng Xóm',
    role: 'Tổ Trưởng Dân Phố',
    startX: 1290,
    lane: 1,
    startDir: -1,
    speed: 0.33,
    emotion: 'SURPRISED',
    skinColor: '#FCD9BD',
    hairStyle: 'HELMET_BLUE',
    hairColor: '#1F2937',
    shirtColor: '#4ADE80',
    pantsColor: '#334155',
    accentColor: '#22D3EE',
    heldItem: 'NONE',
    quotes: [
      'Nhà nào hát karaoke loa kẹo kéo sau 10 giờ là Chú Bảy gõ cửa tận nơi!',
      'Mưa lớn triều cường là Chú Bảy ra khơi thông cống rãnh cho bà con liền!',
      'Phạt nguội gửi giấy báo về tận nhà đó nghen, chớ vượt đèn vàng ngã tư!',
      'Tự động trích tiền điện nước qua MoMo, cả tổ dân phố sạch nợ!',
      'Trời nắng gắt nhắc bà con kiểm tra bình chữa cháy mini trước cửa!',
      'Hàng xóm láng giềng tối lửa tắt đèn có nhau, mượn tiền nhớ trả đúng hẹn!',
    ],
  },
  {
    id: 'cit-bac-tai',
    name: 'Bác Tài Xe Ôm',
    role: 'Tài Xế Công Nghệ',
    startX: 1440,
    lane: 5,
    startDir: 1,
    speed: 0.36,
    emotion: 'HAPPY',
    skinColor: '#FCD9BD',
    hairStyle: 'HELMET_BLUE',
    hairColor: '#1F2937',
    shirtColor: '#16A34A',
    pantsColor: '#1E293B',
    accentColor: '#22C55E',
    heldItem: 'PHONE_QR',
    quotes: [
      'Trời nắng đổ lửa 40 độ nhưng có cuốc nổ ting ting là vít ga liền!',
      'Mưa ngập bì bõm nước tràn vỉa hè, tài xế công nghệ vẫn bao ship bún bò!',
      'Xăng tăng giá vàng tăng, may chạy xe điện sạc pin tiết kiệm khối mớ!',
      'Khách quét QR MoMo cái rẹt, khỏi lo thối 2 ngàn rách góc kẹt ví!',
      'Sáng ra hóng drama tài xế đối đầu khách bom hàng mà thấy tức anh ách!',
      'Đường phố lắp camera phạt nguội rồi, chạy điềm đạm an toàn là nhất!',
    ],
  },
  {
    id: 'cit-chi-hang-rong',
    name: 'Chị Hàng Rong',
    role: 'Gánh Xôi Đầu Ngõ',
    startX: 1590,
    lane: 0,
    startDir: -1,
    speed: 0.29,
    emotion: 'HAPPY',
    skinColor: '#FCD9BD',
    hairStyle: 'NON_LA',
    hairColor: '#2B2118',
    shirtColor: '#A16207',
    pantsColor: '#44403C',
    accentColor: '#FBBF24',
    heldItem: 'SHOPPING_BAG',
    quotes: [
      'Trời mưa lâm râm gánh xôi bay mùi nếp dẻo thơm phức cả con phố!',
      'Nắng nóng 40 độ chuyển sang bán thêm chè đậu xanh hạt sen giải nhiệt!',
      'Bà con quét mã MoMo mua bánh mì lia lịa, dán Loa Thần Tài ting ting vui tai!',
      'Dạo này xóm dưới rộ lên vụ săn vàng miếng xếp hàng từ 4 giờ sáng!',
      'Trời lạnh ăn bắp nướng mỡ hành nóng giòn là chuẩn bài số dzách!',
      'Buôn bán vỉa hè mà văn minh, sạch sẽ, không xả rác bừa bãi nha!',
    ],
  },
  {
    id: 'cit-be-an',
    name: 'Bé An Học Sinh',
    role: 'Học Sinh Cấp 2',
    startX: 1740,
    lane: 4,
    startDir: 1,
    speed: 0.44,
    emotion: 'STAR_EYES',
    skinColor: '#FDE6D2',
    hairStyle: 'SHORT',
    hairColor: '#111827',
    shirtColor: '#F1F5F9',
    pantsColor: '#1E3A8A',
    accentColor: '#3B82F6',
    heldItem: 'NONE',
    quotes: [
      'Trời mưa to trường cho nghỉ tiết thể dục, con kéo cả đám đi ăn kem!',
      'Mẹ quét mã đóng học phí với tiền bán trú trên app luôn, tiện quá chừng!',
      'Trời nồm ẩm đi cầu thang trường trượt té ếch một cú quê xỉu luôn!',
      'Nuôi Heo Đất trên MoMo được 500k rồi, Tết này mua bộ lego siêu nhân!',
      'Bố dặn qua ngã tư phải chờ đèn xanh, camera phạt nguội ghê lắm á!',
      'Trời se lạnh mặc áo khoác đồng phục mới tinh đi học thích mê ly!',
    ],
  },
  {
    id: 'cit-co-linh',
    name: 'Cô Linh Áo Dài',
    role: 'Cô Giáo Duyên Dáng',
    startX: 1890,
    lane: 8,
    startDir: -1,
    speed: 0.31,
    emotion: 'HAPPY',
    skinColor: '#FFF1E6',
    hairStyle: 'LONG_HAIR',
    hairColor: '#1E1B18',
    shirtColor: '#F43F5E',
    pantsColor: '#FFFFFF',
    accentColor: '#FDE047',
    outfitType: 'AO_DAI',
    heldItem: 'NONE',
    quotes: [
      'Tà áo dài thướt tha dạo bước giữa phố MoCity ngập tràn cờ hoa rực rỡ!',
      'Trời nồm ẩm phấn viết bảng bị ướt, thôi cô chuyển qua chiếu slide online!',
      'Trời rét thế này học sinh đi học muộn với lý do trùm chăn ấm quá!',
      'Phụ huynh chuyển khoản học phí tự động ting ting, sổ sách nhẹ tênh!',
      'Đầu tháng trích lương vào Túi Thần Tài lấy lãi ngày, vừa tiết kiệm vừa an tâm!',
      'Nắng rực rỡ soi bóng tà áo dài truyền thống, chụp hình kỷ yếu lớp đẹp mê ly!',
    ],
  },
  {
    id: 'cit-an-xin',
    name: 'Anh Ba',
    role: 'Ngồi Vỉa Hè',
    startX: 780,
    lane: 0,
    startDir: 1,
    speed: 0.3,
    emotion: 'TIRED',
    stationary: true,
    pose: 'SIT',
    skinColor: '#C98F68',
    hairStyle: 'MESSY',
    hairColor: '#4A3B30',
    shirtColor: '#7E7667',
    pantsColor: '#6B5B4A',
    accentColor: '#8C3B2E',
    heldItem: 'BOWL',
    quotes: [
      'Sáng nay chưa có gì vào bụng, Thị Trưởng có thừa bát nào không ạ?',
      'Đêm qua ngủ ở hiên chợ, sáng ra thì bị bảo vệ xua đi mất chỗ.',
      'Tội người ta, chứ tui cũng từng có cửa tiệm ngày xưa chú ơi.',
      'Bữa nay được hai ổ bánh mì, chia lại một ổ cho bà cụ cuối chợ.',
    ],
  },
  {
    id: 'cit-co-ve-chai',
    name: 'Cô Hai',
    role: 'Gánh Ve Chai',
    startX: 1215,
    lane: 3,
    startDir: -1,
    speed: 0.17,
    emotion: 'SMUG',
    skinColor: '#C98F68',
    hairStyle: 'NON_LA',
    hairColor: '#3A2E26',
    shirtColor: '#6E8C72',
    pantsColor: '#4A3B30',
    accentColor: '#C97A4A',
    heldItem: 'SHOULDER_POLE',
    quotes: [
      'Mệt thì mệt mà tiền tươi, cân xong là cầm liền chẳng phải chờ ai chốt.',
      'Cháu giữ cái này đi, cô gom cả ngày mới được có một bọc.',
      'Giá giấy hôm nay hơi xịt, thôi thì đi thêm một vòng nữa vậy.',
      'Cô gánh suốt hai mươi năm rồi, chân cô thuộc từng nẻo đường phố mình.',
    ],
  },
  {
    id: 'cit-co-lao-cong',
    name: 'Cô Sáu Lao Công',
    role: 'Vệ Sinh Môi Trường',
    startX: 2040,
    lane: 2,
    startDir: 1,
    speed: 0.24,
    emotion: 'HAPPY',
    skinColor: '#E0A87E',
    hairStyle: 'HEADSCARF',
    hairColor: '#2B2118',
    shirtColor: '#16A34A',
    pantsColor: '#1E293B',
    accentColor: '#FDE047',
    outfitType: 'CLEANER',
    heldItem: 'BROOM',
    quotes: [
      'Quét xong đoạn này là phố mình sạch bong từ đầu hẻm tới cuối ngõ!',
      'Rác phân loại sẵn giùm cô nha, chai lọ với bọc ni lông để riêng ra.',
      'Nắng nóng 40 độ vẫn phải quét ca sáng, xong ca là tắm cái đã đời!',
      'Bà con đổ rác đúng giờ là cô đỡ cực biết bao nhiêu, cảm ơn nha!',
    ],
  },
];

/** Diện mạo cố định cho 6 Quản Lý Cửa Hàng (Store Managers) */
export const MANAGER_APPEARANCES: Record<string, CharacterAppearance> = {
  'co-tu-bun-rieu': {
    skinColor: '#FCD9BD',
    hairStyle: 'HEADSCARF',
    hairColor: '#2B2118',
    shirtColor: '#EB2F96',
    pantsColor: '#334155',
    accentColor: '#F472B6',
    outfitType: 'WORKER_OVERALLS',
    heldItem: 'BOWL',
  },
  'anh-tuan-ship': {
    skinColor: '#FCD9BD',
    hairStyle: 'HELMET_BLUE',
    hairColor: '#1F2937',
    shirtColor: '#F59E0B',
    pantsColor: '#1E293B',
    accentColor: '#FEF08A',
    outfitType: 'DEFAULT',
    heldItem: 'PHONE_QR',
  },
  'dao-dien-bao-nam': {
    skinColor: '#FDE6D2',
    hairStyle: 'SHORT',
    hairColor: '#111827',
    shirtColor: '#EC4899',
    pantsColor: '#1E293B',
    accentColor: '#F472B6',
    outfitType: 'OFFICE_VEST',
    heldItem: 'CAMERA',
  },
  'ngoc-khue-travel': {
    skinColor: '#FFF1E6',
    hairStyle: 'LONG_HAIR',
    hairColor: '#2E1D16',
    shirtColor: '#06B6D4',
    pantsColor: '#FFFFFF',
    accentColor: '#67E8F9',
    outfitType: 'SKIRT',
    heldItem: 'BRIEFCASE',
  },
  'minh-anh-quy-mo': {
    skinColor: '#FDE6D2',
    hairStyle: 'BUN',
    hairColor: '#1F2937',
    shirtColor: '#2563EB',
    pantsColor: '#1E293B',
    accentColor: '#93C5FD',
    outfitType: 'OFFICE_VEST',
    hasTie: true,
    heldItem: 'LAPTOP',
  },
  'khoi-nguyen-cto': {
    skinColor: '#FFF1E6',
    hairStyle: 'SHORT',
    hairColor: '#1F2937',
    shirtColor: '#8B5CF6',
    pantsColor: '#0F172A',
    accentColor: '#C4B5FD',
    outfitType: 'OFFICE_VEST',
    hasTie: false,
    heldItem: 'PHONE_QR',
  },
};

/** Diện mạo cố định cho 8 Cố Vấn Đô Thị MoCity */
export const ADVISOR_APPEARANCES: Record<string, CharacterAppearance> = {
  'advisor-mai': {
    skinColor: '#FDE6D2',
    hairStyle: 'SHORT',
    hairColor: '#2B2118',
    shirtColor: '#16A34A',
    pantsColor: '#1E293B',
    accentColor: '#86EFAC',
    outfitType: 'OFFICE_VEST',
    hasTie: true,
    heldItem: 'BRIEFCASE',
  },
  'advisor-hung': {
    skinColor: '#FDE6D2',
    hairStyle: 'SHORT',
    hairColor: '#1F2937',
    shirtColor: '#2563EB',
    pantsColor: '#1E293B',
    accentColor: '#60A5FA',
    outfitType: 'OFFICE_VEST',
    hasTie: true,
    heldItem: 'PHONE_QR',
  },
  'advisor-heo-vang': {
    skinColor: '#FDE6D2',
    hairStyle: 'CAP_YELLOW',
    hairColor: '#D82D8B',
    shirtColor: '#D82D8B',
    pantsColor: '#73164A',
    accentColor: '#FACC15',
    heldItem: 'SHOPPING_BAG',
  },
  'advisor-ong-loc': {
    skinColor: '#FCD9BD',
    hairStyle: 'BALD_GLASSES',
    hairColor: '#9CA3AF',
    shirtColor: '#D97706',
    pantsColor: '#3E2A1B',
    accentColor: '#FEF08A',
    heldItem: 'LOTTERY_FAN',
  },
  'advisor-co-ba': {
    skinColor: '#FCD9BD',
    hairStyle: 'NON_LA',
    hairColor: '#2B2118',
    shirtColor: '#E11D48',
    pantsColor: '#44403C',
    accentColor: '#FDA4AF',
    outfitType: 'WORKER_OVERALLS',
    heldItem: 'SHOPPING_BAG',
  },
  'advisor-bao-ngoc': {
    skinColor: '#FFF1E6',
    hairStyle: 'BOB',
    hairColor: '#7C2D12',
    shirtColor: '#8B5CF6',
    pantsColor: '#475569',
    accentColor: '#F43F5E',
    outfitType: 'SKIRT',
    heldItem: 'CAMERA',
  },
  'advisor-khoa-shipper': {
    skinColor: '#FCD9BD',
    hairStyle: 'HELMET_BLUE',
    hairColor: '#1F2937',
    shirtColor: '#0EA5E9',
    pantsColor: '#1E293B',
    accentColor: '#38BDF8',
    heldItem: 'PHONE_QR',
  },
  'advisor-giao-su-khai': {
    skinColor: '#FDE6D2',
    hairStyle: 'SHORT',
    hairColor: '#3E2723',
    shirtColor: '#7C3AED',
    pantsColor: '#1E293B',
    accentColor: '#DDD6FE',
    outfitType: 'OFFICE_VEST',
    hasTie: true,
    heldItem: 'LAPTOP',
  },
};

/** Bản đồ tra nhanh theo id cư dân */
export const CITIZEN_BY_ID: Record<string, CitizenDef> = Object.fromEntries(
  CITIZEN_ROSTER.map((c) => [c.id, c]),
);

/** Chuẩn hoá chuỗi để so khớp tên tiếng Việt linh hoạt */
function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Tra cứu diện mạo nhân vật chuẩn từ Tên, Mã ID hoặc Chuỗi Người Nói.
 *
 * 1. Tự động trích xuất người nói chính nếu là cặp đối thoại:
 *    "Chị Thảo Văn Phòng & Bảo Ngọc KOC" -> xét "Chị Thảo Văn Phòng"
 * 2. Loại bỏ tiền tố/hậu tố nghề nghiệp:
 *    "Cô Tư (bún riêu)" -> "Cô Tư"
 *    "Ông Lộc bán vé số" -> "Ông Lộc"
 * 3. Nếu là nhân vật canonical trong hệ thống: trả về diện mạo chuẩn 100%.
 * 4. Nếu là NPC phát sinh ngẫu nhiên: sinh diện mạo xác định qua `appearanceFromSeed`.
 */
export function resolveCharacterAppearance(nameOrId: string): CharacterAppearance {
  if (!nameOrId) return appearanceFromSeed('nguoi-pho');

  // 1. Kiểm tra ID trực tiếp
  if (CITIZEN_BY_ID[nameOrId]) return CITIZEN_BY_ID[nameOrId];
  if (MANAGER_APPEARANCES[nameOrId]) return MANAGER_APPEARANCES[nameOrId];
  if (ADVISOR_APPEARANCES[nameOrId]) return ADVISOR_APPEARANCES[nameOrId];

  // 2. Lấy người nói đầu tiên nếu có nối bằng &, +, /
  let primaryName = nameOrId.split(/[&+/]/)[0].trim();
  // Bỏ phần chú thích trong ngoặc đơn ví dụ "Cô Ba (bún riêu)"
  primaryName = primaryName.replace(/\(.*?\)/g, '').trim();

  const key = normalizeKey(primaryName);

  // 3. Đối soát từ khoá chuẩn
  if (key.includes('co tu')) {
    return MANAGER_APPEARANCES['co-tu-bun-rieu'];
  }
  if (key.includes('ong loc')) {
    return CITIZEN_BY_ID['cit-ong-loc'];
  }
  if (key.includes('bao ngoc')) {
    return CITIZEN_BY_ID['cit-bao-ngoc'];
  }
  if (key.includes('nam genz') || key.includes('be nam') || key.includes('dat sinh vien') || key.includes('khanh gen z')) {
    return CITIZEN_BY_ID['cit-be-nam'];
  }
  if (key.includes('chi thao') || key.includes('thao van phong') || key.includes('chi ngan ke toan')) {
    return CITIZEN_BY_ID['cit-chi-thao'];
  }
  if (key.includes('anh hoang') || key.includes('tho dien') || key.includes('ky thuat')) {
    return CITIZEN_BY_ID['cit-anh-hoang'];
  }
  if (key.includes('chu bay')) {
    return CITIZEN_BY_ID['cit-chu-bay'];
  }
  if (key.includes('bac tai') || key.includes('xe om') || key.includes('anh tai shipper')) {
    return CITIZEN_BY_ID['cit-bac-tai'];
  }
  if (key.includes('anh tuan') || key.includes('tuan ship')) {
    return MANAGER_APPEARANCES['anh-tuan-ship'];
  }
  if (key.includes('anh khoa') || key.includes('khoa shipper')) {
    return ADVISOR_APPEARANCES['advisor-khoa-shipper'];
  }
  if (key.includes('hang rong') || key.includes('ganh xoi')) {
    return CITIZEN_BY_ID['cit-chi-hang-rong'];
  }
  if (key.includes('co ba')) {
    return ADVISOR_APPEARANCES['advisor-co-ba'];
  }
  if (key.includes('be an')) {
    return CITIZEN_BY_ID['cit-be-an'];
  }
  if (key.includes('co linh') || key.includes('ao dai')) {
    return CITIZEN_BY_ID['cit-co-linh'];
  }
  if (key.includes('anh ba') || key.includes('an xin')) {
    return CITIZEN_BY_ID['cit-an-xin'];
  }
  if (key.includes('co hai') || key.includes('ve chai')) {
    return CITIZEN_BY_ID['cit-co-ve-chai'];
  }
  if (key.includes('co sau') || key.includes('lao cong') || key.includes('ve sinh')) {
    return CITIZEN_BY_ID['cit-co-lao-cong'];
  }
  if (key.includes('tro ly') || key.includes('can bo quy hoach') || key.includes('chi mai')) {
    return CITIZEN_BY_ID['cit-mayor-assistant'];
  }
  if (key.includes('bao nam') || key.includes('dao dien')) {
    return MANAGER_APPEARANCES['dao-dien-bao-nam'];
  }
  if (key.includes('ngoc khue')) {
    return MANAGER_APPEARANCES['ngoc-khue-travel'];
  }
  if (key.includes('minh anh')) {
    return MANAGER_APPEARANCES['minh-anh-quy-mo'];
  }
  if (key.includes('khoi nguyen')) {
    return MANAGER_APPEARANCES['khoi-nguyen-cto'];
  }
  if (key.includes('anh hung') || key.includes('hung tai chinh')) {
    return ADVISOR_APPEARANCES['advisor-hung'];
  }
  if (key.includes('khai') || key.includes('giao su khai') || key.includes('chuyen gia khai')) {
    return ADVISOR_APPEARANCES['advisor-giao-su-khai'];
  }
  if (key.includes('heo vang') || key.includes('momo mascot')) {
    return ADVISOR_APPEARANCES['advisor-heo-vang'];
  }

  // Fallback ngẫu nhiên xác định theo tên
  return appearanceFromSeed(primaryName);
}
