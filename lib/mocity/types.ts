export type ZoneType = 'COMMERCIAL' | 'FINTECH' | 'RESIDENTIAL' | 'LANDMARK';

export interface Currencies {
  /** Đồng (VNĐ) - Tiền tệ kinh doanh & dòng tiền thực tế */
  coins: number;
  /** Kim Cương (KC) - Tiền tệ chiến lược & cao cấp */
  gems: number;
  energy?: number;
  blueprints?: number;
  medals?: number;
}

export type CurrencyKey = keyof Currencies;

export interface CityMetrics {
  cityName: string;
  mayorLevel: number;
  population: number;
  maxPopulation: number;
  happinessIndex: number;
  taxRateMultiplier: number;
}

export type StoreModuleId = 'QR_LOA_THAN_TAI' | 'VI_TRA_SAU_VOUCHER' | 'TUI_THAN_TAI_AUTO';

export interface StoreModuleDef {
  id: StoreModuleId;
  name: string;
  shortName: string;
  serviceTag: string;
  description: string;
  unlockLevel: number;
  costCoins: number;
  yieldBonus: number;
  color: string;
}

export type ManagerRarity = 'R' | 'SR' | 'SSR';

export interface ManagerDef {
  id: string;
  name: string;
  title: string;
  rarity: ManagerRarity;
  specialtyZone: ZoneType | 'ALL';
  skillName: string;
  skillDesc: string;
  yieldMultiplier: number;
  happinessBonus: number;
  costCoins: number;
  costGems: number;
  hue: string;
}

export interface MayorQuestDef {
  id: string;
  title: string;
  description: string;
  rewardCoins: number;
  rewardGems: number;
  rewardXp: number;
  /**
   * Chang tien trinh. 1 la nhap mon (xong trong buoi dau), 2 la dai han.
   * Bang Nhiem Vu nhom theo truong nay, neu khong 18 muc se thanh mot danh
   * sach dai khong co moc nao de nguoi choi dinh huong.
   */
  stage: 1 | 2;
}

export interface BuildingNode {
  id: string;
  defId: string;
  col: number;
  row: number;
  level: number;
  starRating: number;
  lastCollectedAt: number;
  modules?: StoreModuleId[];
  /**
   * Cổ Đông đang góp vốn - đổi tên UI từ "Quản Lý" nhưng giữ nguyên field
   * này để không vỡ save cũ. Tác dụng: +% Xu/giây (yield bonus), KHÔNG ảnh
   * hưởng tốc độ tự bán - đó là việc của `staffCount`.
   */
  managerId?: string;
  /**
   * Số Nhân Viên đang thuê (0..`MAX_STAFF`). Nhân viên KHÔNG tăng doanh thu
   * mỗi đơn - họ rút ngắn `serviceIntervalMs`, tức tiệm tự đóng đơn nhanh
   * hơn. Đây là cơ chế DUY NHẤT điều khiển tốc độ bán kể từ khi bỏ nút bấm
   * tay "Đóng đơn"/"Dọn hàng".
   */
  staffCount?: number;
  /**
   * Mốc tự phục vụ gần nhất, dùng để tính đơn đã tự đóng mỗi `tickIdle`
   * (kể cả lúc offline). `undefined` = chưa từng tự phục vụ, tính từ `now`
   * ở lần tick đầu tiên để không dồn đơn hồi tố cho save cũ.
   */
  lastAutoServedAt?: number;
  stockStatus?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  lastFraudPreventedAt?: number;
}

/* ── Con nguoi trong thanh pho ──────────────────────────────────── */

export type ArchetypeId =
  | 'MERCHANT_CASH'
  | 'MERCHANT_ESTABLISHED'
  | 'GIG_WORKER'
  | 'SALARIED'
  | 'STUDENT'
  | 'FAMILY'
  | 'CINEPHILE'
  | 'TRAVELER'
  | 'INVESTOR'
  | 'ELDER';

/** Dich vu tai chinh NPC da duoc mo. Moi dich vu doi hanh vi kinh te cua ho. */
export type ServiceId =
  | 'QR_PAYMENT'
  | 'CREDIT'
  | 'BNPL'
  | 'SAVINGS'
  | 'CREDIT_SCORE'
  | 'INSURANCE';

export type NpcRole = 'MERCHANT' | 'CITIZEN';

/**
 * Moi cong trinh COMMERCIAL sinh 1 chu tiem, moi cong trinh RESIDENTIAL sinh
 * 1 dai dien cu dan. Dai dien noi thay cho ca cohort - tranh phai mo phong
 * hang tram entity rieng le.
 */
export interface NpcState {
  id: string;
  buildingId: string;
  name: string;
  archetype: ArchetypeId;
  role: NpcRole;
  /** 0-100. Merchant doi sang thanh toan so khi cham nguong. */
  trust: number;
  acceptsDigital: boolean;
  services: ServiceId[];
}

/* ── Doi thoai ──────────────────────────────────────────────────── */

export type InventoryItemCategory = 'CONSUMABLE' | 'RELIC' | 'GIFT';

export interface InventoryItemDef {
  id: string;
  name: string;
  category: InventoryItemCategory;
  rarity: 'R' | 'SR' | 'SSR';
  description: string;
  effectSummary: string;
  hue: string;
  costCoins: number;
  costGems: number;
  /** Buff thụ động khi trang bị (dành cho RELIC) */
  passiveYieldBonus?: number;
  passiveHappinessBonus?: number;
}

export interface DialogueEffects {
  trust?: number;
  acceptDigital?: boolean;
  grantService?: ServiceId;
  coins?: number;
  xp?: number;
  /** Ap dung cho toan bo NPC thay vi rieng nguoi dang noi. */
  trustAll?: number;
  /** Vat pham nhan duoc vao Kho Do khi chon phuong an nay */
  rewardItemId?: string;
  /**
   * Diem Hanh Phuc cong don. Xử lý chuyện phố là cách duy nhất bù lại suy
   * giam hanh phuc theo thoi gian.
   */
  happiness?: number;
}

export interface ConsequenceTag {
  label: string;
  tone: 'red' | 'green' | 'neutral';
}

export interface DialogueChoice {
  id: string;
  text: string;
  costCoins?: number;
  effects: DialogueEffects;
  /** Cau NPC dap lai sau khi thi truong chon. */
  reply: string;
  /** Danh sach pill tag he qua hien thi truc quan nhu '[-800k]', '[ong Loc ++]', '[khep chuyen]' */
  tags?: ConsequenceTag[];
  /** Mau nut Chon: green | red | blue */
  btnTone?: 'green' | 'red' | 'blue';
}

export interface RequestScript {
  id: string;
  archetype: ArchetypeId;
  /** Chi hien khi chu tiem da/chua nhan thanh toan so. undefined = bo qua dieu kien. */
  requiresDigital?: boolean;
  /** Chi hien khi NPC chua co dich vu nay. */
  missingService?: ServiceId;
  title: string;
  subtitle?: string;
  body: string;
  choices: DialogueChoice[];
}

export interface CityEventScript {
  id: string;
  title: string;
  subtitle?: string;
  speaker: string;
  body: string;
  minMayorLevel: number;
  /**
   * Điều kiện trạng thái thành phố để sự kiện này xuất hiện.
   *
   * Trước đây chỉ có `minMayorLevel`, nên 35 sự kiện được rải đều theo cấp và
   * không sự kiện nào "biết" thành phố đang gặp khủng hoảng. Ông Lộc kể
   * chuyện đánh bạc ngay cả khi thành phố cạn tiền, và chuyện cứu dòng tiền
   * xuất hiện khi mọi thứ đang ổn.
   *
   * Không điều kiện nào nghĩa là luôn hợp lệ. Tất cả đều là AND với
   * `minMayorLevel`.
   */
  /** Chỉ hiện khi hạnh phúc thấp hơn ngưỡng (0-100). */
  happinessBelow?: number;
  /** Chỉ hiện khi hệ số dòng tiền lưu động thấp hơn ngưỡng. */
  cashflowBelow?: number;
  /** Chỉ hiện khi tỷ lệ nợ xấu BNPL cao hơn ngưỡng (0-1). */
  nplAbove?: number;
  /** Chỉ hiện khi đang nợ trên ngưỡng này. */
  debtAbove?: number;
  /** Chỉ hiện khi hàng đợi quá tải ở ít nhất một tiệm. */
  requiresCrowding?: boolean;
  /** Chỉ hiện khi còn trễ hạn trả nợ. */
  requiresLateFee?: boolean;
  /** Chỉ hiện khi chưa có gói bảo hiểm nào. */
  requiresNoInsurance?: boolean;
  choices: DialogueChoice[];
}

export interface ActiveRequest {
  id: string;
  scriptId: string;
  npcId: string;
  createdAt: number;
}

/** Su kien toan thanh pho dang cho thi truong xu ly. */
export interface PendingEvent {
  id: string;
  scriptId: string;
  createdAt: number;
}

/** So su kien toan pho da giai quyet trong ngay, dung chan arbitrage. */
export interface EventDayLog {
  /** Khoa ngay theo gio dia phuong, dang `YYYY-M-D`. */
  day: string;
  resolved: number;
}

/** Tien do nhiem vu ngay. Reset khi `day` khac ngay hien tai. */
export interface DailyLog {
  day: string;
  built: number;
  upgraded: number;
  talked: number;
  eventsResolved: number;
  starEvolved: number;
  /**
   * XP nhan roi da cong trong ngay. Co tran rieng (`IDLE_XP_DAILY_CAP`) vi
   * khong co no thi de may chay mot ngay la gan het duong cong cap do.
   */
  idleXp: number;
  /** Id cac nhiem vu ngay da nhan thuong trong ngay nay. */
  claimed: string[];
}

/**
 * CHUOI NGAY CHOI LIEN TIEP.
 *
 * `days` la so ngay lien tiep TINH LANG giua cac lan mo game. `lastDay` la
 * khoa ngay da ghi nhan gan nhat de biet con tiep duoc hay phai reset.
 *
 * Day la co che giu nguoi choi quay lai re nhat va dat loi: nguoi choi da
 * xay 12 ngay thi mat chuoi la mot thu ly, khong phai con so o.
 */
export interface StreakState {
  /** So ngay lien tiep hien tai. 0 = vua ngat chuoi. */
  days: number;
  /** Khoa ngay `YYYY-M-D` ghi nhan gan nhat. */
  lastDay: string;
  /** Chuoi dai nhat da dat duoc, khong bao gio reset. */
  best: number;
  /**
   * So phieu bao vui chuoi, toi da 3.
   *
   * Tu dong dung khi nguoi choi ngat chuoi: mat 1 phieu, chuoi giu nguyen.
   * Nhan tu moc 7 ngay, moi moc 14 ngay them 1.
   *
   * Bien nay ton tai vi `streakClaimed` luu SO NGAY chu khong luu id moc, nen
   * them no khong dung vao logic hieu moc hien co.
   */
  shields?: number;
}

/**
 * SO LUC CUA MOT NGAY DA QUA.
 *
 * Ghi lai khi sang ngay moi, giu 7 ngay. Day la co so cua bang "so sanh voi
 * chinh minh 7 ngay truoc" - ap luc co that ma khong can biet gi ve nguoi
 * choi khac.
 *
 * Chi luu SO LIEU DA KET LUAN (doanh thu, loi nhuan, dan so), khong luu gi
 * tri tai sanh. Ly do: so lieu ket luan la thu do nguoi choi so sanh, con
 * so xu trong vi thi bien dong hang ngay va so sanh vo nghia.
 */
export interface DailySnapshot {
  /** Khoa ngay `YYYY-M-D`. */
  day: string;
  /** Loi nhuan rong cua ngay do, da tru tat ca chi phi. */
  netIncome: number;
  /** Doanh thu van hanh cua ngay do, khong bao gom thuong cap. */
  revenue: number;
  danSo: number;
  soCongTrinh: number;
  mayorLevel: number;
  /** Hạn phố đạt được trong ngày đó. */
  cityTier: number;
  /** Chuoi ngay tinh den cuoi ngay do. */
  streak: number;
  /** So su kien da giai quyet, de do kien luc. */
  eventsResolved: number;
  /**
   * Hanh phuc tinh LUON SUY GIAM (tuc la luc moi mo game) chu khong phai luc
   * vua ngan xong. Ly do: pho bi suy giam thi se lam kien luc, nen muốn
   * so sanh cong bang thi ca hai ngay phai do cung mot cach.
   */
  happiness: number;
}

/* ── SỔ CÁI & BÁO CÁO KẾT QUẢ KINH DOANH ────────────────────────── */

/**
 * Mot ky so cua bao cao ket qua kinh doanh. Moi dong la MOT DONG trong bang
 * P&L, khong phai tong hop tat ca cac dong - hieu sai se cong thieu.
 */
export interface LedgerEntry {
  /** TONG DOANH THU (gross) truoc khi tru chi phi. */
  grossRevenue: number;
  /** Gia von hang ban. */
  cogs: number;
  /** Chi phi vat hanh. */
  opex: number;
  /** Chi phi du phong no xau tu Vi Tra Sau trong ky. */
  badDebt: number;
  /** Chi phi lai vay tren du no trong ky. */
  interestExpense: number;
  /** Thue thu nhap doanh nghiep. */
  tax: number;
  /** Loi nhuan rong = tien thuc vao ngan khoc tu hoat dong. */
  netIncome: number;
  /**
   * Chi tieu von (capex): xay moi, nang cap, mo rong dat, len sao, lap tien ich.
   * KHONG phai chi phi - no tao tai san, va game khong khu hao nen `capex` chi
   * tich lu chu khong bao gio quay lai ngan khoc. Day la phan biet ma game
   * nay day dung.
   */
  capex: number;
  /** Kiem ke thi truong: chi tieu von bao tri, khong ghi vao P&L. */
  inventoryBought: number;
}

export function emptyLedger(): LedgerEntry {
  return {
    grossRevenue: 0,
    cogs: 0,
    opex: 0,
    badDebt: 0,
    interestExpense: 0,
    tax: 0,
    netIncome: 0,
    capex: 0,
    inventoryBought: 0,
  };
}

/** Ledger theo ky. `day`/`month` reset khi doi ngay / doi thang. */
export interface PeriodLedger extends LedgerEntry {
  /** Khoa ngay `YYYY-M-D`, rong neu chua co du lieu. */
  day: string;
  /** Khoa thang `YYYY-M`. */
  month: string;
}

/**
 * Hàng chờ khách của MỘT tiệm.
 *
 * `arrivedAt` là timestamp từng khách đang đợi, xếp theo thứ tự đến.
 * Khách đứng đầu hàng được đóng trước (FIFO). Vượt sức chứa hoặc chờ quá
 * lâu thì khách bỏ đi - mất doanh thu thật, không phải hình phạt suy ra.
 */
export interface ShopQueue {
  shopId: string;
  arrivedAt: number[];
}

export function emptyPeriodLedger(day: string, month: string): PeriodLedger {
  return { ...emptyLedger(), day, month };
}

export type MayorGender = 'male' | 'female';

export interface CityState extends Currencies {
  version: number;
  mayorName: string;
  cityName: string;
  hasNamedCity: boolean;
  mayorGender: MayorGender;
  mayorLevel: number;
  mayorXp: number;
  gridSize: number;
  unlockedCols: number;
  unlockedRows: number;
  buildings: BuildingNode[];
  npcs: NpcState[];
  unlockedManagers: string[];
  claimedQuests: string[];
  /**
   * So ngay `StreakMilestoneDef.days` da nhan thuong.
   *
   * Luu SO NGAY chu khong luu id nen mot lan chuoi dai hon van nhan duoc thuong
   * moc da cham (vi du chuoi 10 ngay cham moc 3 va 7, chuoi 40 ngay cham them
   * 14 va 30). Da cham `days` thi khong bao gio trao lai - nhanh vien khong
   * doi lui, thuong cap bang so ngay.
   */
  streakClaimed: number;
  /** Kho do cua Thi Truong: itemId -> so luong */
  inventory: Record<string, number>;
  /** Danh sach Bau Vat (Relics) dang trang bi (toi da 3) */
  equippedRelics: string[];
  feverUntil: number;
  /**
   * So lan da bat Giờ Vàng trong ngày hôm nay.
   *
   * `feverUntil` chỉ true trong 60 giây nên không giữ được lịch sử dùng.
   * Không có biến này thì 20 Kim Cương khởi đầu bấm 10 lần là cạn ví, và
   * Kim Cương mất hết vai trò là tiền tích trữ.
   */
  feverUsedToday?: number;
  /** Khoa ngay `YYYY-M-D` ma `feverUsedToday` thuoc ve. */
  feverDay?: string;
  /**
   * Da BAO GIO kich hoat Giờ Vàng chua, ghi lai vĩnh viễn.
   *
   * `feverUntil` chi true trong 60 giay nen quest `q-fever-mode` kiem tra
   * bang `feverUntil > 0` se khong bao gio hoan thanh duoc sau khi thi
   * trang het - thuong 18.000 Xu + 8 Kim Cuong bay bien vo hinh. Cờ nay ghi
   * nhan "da tung mo" mot lan duy nhat.
   */
  feverEverUsed: boolean;
  activeRequests: ActiveRequest[];
  pendingEvent: PendingEvent | null;
  lastRequestAt: number;
  lastEventAt: number;
  /**
   * Lan gan nhat dem `talked` cho nhiem vu ngay. Chan spam click cu dan: khong
   * co han nay thi `recordCitizenTalk` chay vo han va `d-tro-chuyen` (target 5)
   * hoan thanh trong 5 giay.
   */
  lastTalkAt: number;
  /**
   * Lan gan nhat Thi Truong THAT SỰ quan tâm den pho (giai quyet su kien hoac
   * yeu cau cua nguoi dan). Tach rieng `lastEventAt` - cai do chi dem han 35
   * giay giua cac su kien, dung de kiem tra xem co duoc spawn them khong.
   *
   * Day la dong ho chay cho suy giam hanh phuc.
   */
  lastEngagedAt: number;
  /** Dem han giai quyet su kien trong ngay. Tu reset sang 0 khi sang ngay moi. */
  eventLog: EventDayLog;
  /**
   * Buoc huong dan hien tai. `-1` nghia la da xong hoac da bo qua.
   *
   * Luu vao save chu khong phai `useState`: huong dan keo dai ca mot phien
   * dau, nguoi choi tat trinh duyet giua chung thi phai quay lai dung cho.
   */
  tutorialStep: number;
  /** Cac moc huong dan chi co the danh dau tu UI (vd: da mo So Cai). */
  tutorialFlags: string[];
  /**
   * DU NO hien tai. Sinh lai vay moi giay, tru thang vao P&L.
   *
   * Tach khoi `coins` chu khong tru thang: tien vay VAO ngan khoc ngay, con
   * nghia vu tra thi o lai. Do la toan bo y nghia cua don bay tai chinh, va
   * neu gop chung mot con so thi khong con gi de day.
   */
  debt: number;
  /** Tong lai vay da tra tu truoc toi nay, de bao cao. */
  totalInterestPaid: number;

  // ─── STORY: Người lập nghiệp từ quê lên phố ───────────
  /** Nợ cá nhân của người chơi khi lên thành phố (200M). Khác với `debt` là nợ vay kinh doanh. */
  playerDebtPrincipal: number;
  /** Tổng nợ gốc cá nhân đã trả được. */
  playerDebtPaid: number;
  /** Ngày đến hạn lãi kỳ tiếp, dạng "YYYY-M-D" (cùng format loanDueDay). */
  playerDebtNextDueDateStr: string;
  /** Số kỳ lãi trễ liên tiếp (>= 2 = game over warning). */
  playerDebtMissed: number;
  dailyLog: DailyLog;
  streak: StreakState;
  /**
   * SO LUC 7 NGAY DA QUA, moi ngay mot ban ghi.
   *
   * Giu theo thu tu thoi gian tang dan, toi da 7 ban ghi. Dung cho bang so
   * sanh voi chinh minh 7 ngay truoc. KHONG phai bang xep hang: game khong co
   * du lieu ve nguoi choi khac, va day la gioi han cua kien truc client-only.
   */
  dailySnapshots?: DailySnapshot[];
  /** Rank bac thanh pho cao nhat da nhan thuong, de khong tra thuong hai lan. */
  cityTierClaimed: number;
  /**
   * Diem Hanh Phuc cong don tu dialogue. Hanh phuc suy giam theo thoi gian
   * (xem `happinessFor`), nen day la lien he giữ "co xu lý chuyện phố" và
   * "doanh thu".
   */
  happinessBoost: number;
  /** Timestamp lan tap gan nhat cua tung nguon: 'bubble' | 'citizen' | 'advisor' | 'patrol'. */
  tappedAt: Record<string, number>;
  /** Tong volume giao dich tich luy - chi so tang truong cua thanh pho. */
  totalVolume: number;
  lastSeenAt: number;
  createdAt: number;
  /**
   * TONG DA NHAP - gom ca doanh thu va thuong cap. Chi dung de hien "tong so
   * da vao ngan khoc". KHONG dung lam "doanh thu": xem `totalRevenue`.
   */
  totalCoinsEarned: number;
  /**
   * DOANH THU VAN HAI sinh ra tu hoat dong cua thanh pho: san luong cua
   * hang + phi ha tang giao dich so + lai tich luy. Day moi la dong "doanh thu"
   * co nghia ke toan.
   */
  totalRevenue: number;
  /**
   * Tien thuong khong phai ban ra: nhiem vu Thị Truơng, bac thanh pho, thuong
   * nhiem vu ngay, thuong nham chuc lan dau.
   *
   * Về kế toán đây là vốn góp của chủ sở hữu, KHÔNG phải doanh thu. Trước đây
   * 2,96 triệu Xu thuong bị dán nhãn "Tổng Doanh Thu Tích Lũy" trên thẻ chia
   * sẻ - dạy sai người chơi rằng tiền thưởng game là tiền bán hàng.
   */
  totalGrants: number;
  /** Tiền thuong vi tương tác: chạm cư dân, thú cưng, quầy Lộc, bóng Xu. */
  totalTapIncome: number;
  /** Sổ cái vĩnh viễn, không reset. */
  ledgerLifetime: PeriodLedger;
  /** Sổ cái trong ngày. Reset lúc sang ngày mới. */
  ledgerDay: PeriodLedger;
  /** Sổ cái trong tháng. Reset lúc sang tháng mới. */
  ledgerMonth: PeriodLedger;
  bubblesCollected: number;
  /**
   * Kết quả mô phỏng lô giao dịch trong lúc vắng mặt.
   *
   * Đây KHÔNG phải "tiền tự sinh theo thời gian" nữa - nó là tập hợp các
   * giao dịch thật (khách vẫn mua hàng, chỉ không có chủ canh nên đạt
   * `OFFLINE_FILL_RATE` sản lượng), gộp lại để không tạo 30.000 object.
   *
   * `coins` = LỢI NHUẬN RÒNG của lô. Bốn dòng `gross/cogs/opex/tax` được giữ
   * riêng để lúc nhận thưởng vẫn ghi đủ P&L: ví cộng net, sổ cái cũng cộng net,
   * cộng thêm các dòng chi phí đi kèm - nếu bỏ, sổ cái sẽ nói dối.
   *
   * null = đã xử lý xong (đã nhận hoặc đã bỏ qua).
   */
  pendingOffline: {
    coins: number;
    elapsedMs: number;
    orders?: number;
    gross?: number;
    cogs?: number;
    opex?: number;
    tax?: number;
    /**
     * Thời gian vắng bị chặn ở trần 8 giờ.
     *
     * Tách riêng thay vì để UI tự suy ra từ `elapsedMs`: `elapsedMs` đã bị
     * cắt sẵn nên `elapsedMs > 8h` luôn false - đúng lỗi "cảnh báo trần 8 giờ
     * không bao giờ hiện" đang sửa.
     */
    capped?: boolean;
  } | null;

  /* ── Transaction Engine: hàng chờ khách của từng tiệm ── */
  /**
   * KHÁCH ĐANG CHỜ tại từng tiệm. Đây là nguồn sinh tiền duy nhất:
   * không có hàng chờ thì không có giao dịch, không có giao dịch thì không
   * có doanh thu. Người chơi phải bấm để đóng từng đơn.
   *
   * Mảng rỗng = không có khách nào chờ = không có thu nhập.
   */
  shopQueues?: ShopQueue[];
  /**
   * Số đơn đã bị bỏ lỡ vì hết hàng chờ hoặc quá hạn trong phiên hiện tại.
   * Hiển thị để người chơi thấy hệ quả của việc không bấm kịp.
   */
  ordersLost?: number;
  /** Tổng số đơn đã đóng từ đầu - chỉ số hoạt động của thành phố. */
  ordersClosed?: number;
  /** Thoi diem trong ngay: BINH MINH, NGAY, HOANG HON, DEM */
  timeOfDay?: TimeOfDay;
  /** Thời tiết đô thị: Nắng ráo, Mưa rào, Triều cường ngập lụt, Giông bão */
  weather?: WeatherType;
  /** Trạng thái đường phố đang bị ngập lụt */
  isFlooded?: boolean;

  /* ── Cơ chế Luật Chơi & Quản Trị Tài Chính Thực Chiến ── */
  /** Điểm Tin Cậy MoMo (300 - 850). Quyết định hạn mức vay, lãi suất & độ uy tín */
  trustScore?: number;
  /** Quỹ Vận Hành Quán (Working Capital) - tiền dùng để tự động nhập hàng COGS và trả phí vận hành */
  workingCapital?: number;
  /** Ví Tiêu Dùng Cá Nhân của Thị Trưởng (Personal Wealth) - rút từ lợi nhuận ròng để mua sắm cá nhân */
  personalWealth?: number;
  /** Ngày đáo hạn khoản nợ cũ (nếu có) */
  loanDueDay?: string;
  /** Số lần bị phạt phí trễ hạn do không trả nợ đúng ngày */
  loanLateFeeCount?: number;
  /** Số lần Loa Thần Tài đã ngăn chặn thành công nạn bill photoshop giả */
  fraudBlockedCount?: number;
  /** Tổng số tiền bị thất thoát do dính bill giả khi chưa có Loa Thần Tài */
  fraudLossCoins?: number;
  /** Số dư đang gửi sinh lời mỗi ngày trong Túi Thần Tài */
  tuiThanTaiBalance?: number;
  /** Tổng số tiền lãi đã tích lũy từ Túi Thần Tài */
  tuiThanTaiInterestEarned?: number;
  /** Đã trang bị Gói Bảo Hiểm Toàn Diện MoMo để phòng vệ rủi ro thiên tai/sự cố */
  hasInsurance?: boolean;
  /** Tổng số tiền bảo hiểm đã bồi thường khi gặp sự cố */
  insuranceClaimsPaid?: number;

  /* ── Narrative Game Story & Wealth Matrix ("Từ tay trắng đến cơ đồ") ── */
  currentAct?: GameAct;
  npcMicroLedgers?: NpcMicroLedger[];
  momoOSState?: MomoFinancialOSState;
  activeOpportunityCardId?: string | null;
  activeBlackSwanId?: string | null;

  /* ── Hệ Thống Dopamine & Tăng Trưởng: Thị Trưởng MoMo ── */
  /** Điểm Năng Lượng Hành Động (Action Points): 0 - 50. Dùng cho thu hoạch tức thì */
  ap?: number;
  /** Mốc tối đa Action Points (mặc định 50) */
  maxAp?: number;
  /** Thời điểm gần nhất hồi 1 AP (hồi 1 AP mỗi 5 phút = 300.000ms) */
  lastApRegenMs?: number;
  /** Điểm Uy Tín Thị Trưởng (Mayor Points - MP) tích lũy qua quyết định tài chính đúng đắn */
  mayorPoints?: number;
  /** Số tiền gửi Tiết Kiệm MoMo sinh lãi có kỳ hạn (VNĐ) */
  savingsBalance?: number;
  /** Kỳ hạn gửi tiết kiệm hiện tại */
  savingsTier?: '1D' | '3D' | '7D' | 'NONE';
  /** Thời điểm bắt đầu gửi tiết kiệm */
  savingsStartedAt?: number;
  /** Tiền nợ cũ nếu có (VNĐ) */
  loanPrincipal?: number;
  /** Thời điểm bắt đầu khoản vay */
  loanStartedAt?: number;
  /** Quỹ Đầu Tư đang tham gia */
  investedFundId?: 'SAFE' | 'BALANCED' | 'AGGRESSIVE' | 'NONE';
  /** Số vốn đang rót vào Quỹ Đầu Tư (VNĐ) */
  investedAmount?: number;
  /** Thời điểm bắt đầu rót vốn vào Quỹ */
  investedAt?: number;
  /** Hạn hiệu lực của Gói Bảo Hiểm (timestamp ms) */
  insuranceActiveUntilMs?: number;
  /** Danh sách sự cố đô thị đang diễn ra cần Thị Trưởng giải quyết */
  activeIncidents?: CityIncident[];
}

export type IncidentType = 'FIRE' | 'THEFT' | 'COMPLAINT' | 'STOCKOUT';

export interface CityIncident {
  id: string;
  type: IncidentType;
  buildingId: string;
  buildingName: string;
  description: string;
  penaltyPct: number;
  startedAt: number;
  resolved: boolean;
}

export type TimeOfDay = 'DAWN' | 'DAY' | 'SUNSET' | 'NIGHT';
export type WeatherType = 'SUNNY' | 'RAIN' | 'FLOOD' | 'STORM';

/** Ten icon trong BUILDING_ICON map (components/mocity/building-icons.ts). */
export type BuildingIconKey =
  | 'store'
  | 'utensils'
  | 'shoppingBag'
  | 'coffee'
  | 'landmark'
  | 'server'
  | 'graduation'
  | 'trees'
  | 'building'
  | 'tower'
  | 'piggy'
  | 'film'
  | 'plane'
  | 'wallet'
  | 'trendingUp'
  | 'zap'
  | 'home';

export interface BuildingDef {
  id: string;
  name: string;
  shortName: string;
  icon: BuildingIconKey;
  zone: ZoneType;
  momoServiceTag?: string;
  description: string;
  baseYieldPerSec: number;
  baseHappiness: number;
  population: number;
  costCoins: number;
  costGems: number;
  maxLevel: number;
  height: number;
  hue: string;
  accent: string;
  unlockAtMayorLevel: number;
  /**
   * BAC THANH PHO toi thieu de mo khoa cong trinh nay (rank 1..8).
   *
   * Day la TRUC TIEN TRINH chinh: cong trinh mo theo bac do thi, khong phai
   * theo cap Thi Truong. Len bac moi la su kien mo ra san pham tai chinh +
   * nhom cong trinh moi (xem CityTierDef.unlocks).
   */
  unlockAtTier: number;
  /** COMMERCIAL: suc chua giao dich moi giay. */
  merchantCapacity?: number;
  /** FINTECH: cong them vao take rate cua thi truong. */
  takeRateBonus?: number;
  /**
   * TY LE GIA VON tren phan doanh thu ban hang cua cong trinh nay (0.35 =
   * 35% doanh thu het vao mua hang ton kho + chi phi giao hang).
   *
   * Day la dong "Gia von hang ban" cua bao cao ket qua kinh doanh. KHONG
   * ap dung cho doanh thu phi thu ho hay lai tich lu - nhung dong do khong
   * co ha ton kho.
   *
   * Bien loi nhuan gop = 1 - tong ty le nay. Nganh ban le thuong 35-45%, cong
   * trinh dich vu o giua, cong trinh giao dich so o cuoi (giao dich khong ton
   * hang).
   */
  cogsRate?: number;
  /**
   * TY LE CHI PHI VAT HANH tren phan doanh thu cua cong trinh nay: thue mat
   * bang, luong nhan vien, dien nuoc, bao tri thiet bi.
   *
   * Cua hang an uong ton trong nhan vien va mat bang nen OPEX cao; tram tu
   * than tai chi can may chay nen OPEX thap.
   */
  opexRate?: number;
  /** Danh sach ID cong trinh tao hieu ung Combo Lien Ke khi dat canh nhau. */
  synergyWith?: string[];
  synergyLabel?: string;
}

export interface ZoneMeta {
  type: ZoneType;
  label: string;
  shortLabel: string;
  color: string;
  tint: string;
  ring: string;
  description: string;
}

/* ==========================================================================
 * NARRATIVE GAME STORY & WEALTH MATRIX TYPES ("Từ tay trắng đến cơ đồ")
 * ========================================================================== */

export type GameAct = 
  | 'ACT_1_STARTER'
  | 'ACT_2_CASHFLOW'
  | 'ACT_3_LEVERAGE'
  | 'ACT_4_BLACK_SWAN'
  | 'ACT_5_ESTATE';

export type EndingProfileId =
  | 'FRAGILE_EMPIRE'
  | 'RESILIENT_ESTATE'
  | 'OPTIMAL_INVESTOR'
  | 'COMMUNITY_BUILDER';

export interface WealthMatrixMetrics {
  totalAssetsValuation: number;
  monthlyNetCashflow: number;
  liquidityRatio: number;
  debtToAssetRatio: number;
  portfolioRiskIndex: number;
  citizenHappinessIndex: number;
  legacyScore: number;
}

export interface EndingEvaluation {
  id: EndingProfileId;
  title: string;
  subtitle: string;
  description: string;
  score: number;
  badge: string;
  keyStrengths: string[];
  keyVulnerabilities: string[];
}

export interface NpcPlayerLoan {
  amount: number;
  interestRateMonthly: number;
  termMonthsRemaining: number;
  startMonth: number;
}

export interface NpcPlayerEquity {
  ownershipPct: number;
  investedCapital: number;
  monthlyDividend: number;
}

export type NpcMood = 'HAPPY' | 'STRESSED' | 'ANXIOUS' | 'ECSTATIC' | 'DESPERATE';

export type NpcPersonality =
  | 'SAVER_CONSERVATIVE'
  | 'RISK_TAKER_ENTREPRENEUR'
  | 'IMPULSE_BUYER'
  | 'BALANCED_PLANNER'
  | 'COMMUNITY_HELPFUL';

export type NpcActivity = 'WORKING' | 'SHOPPING' | 'RESTING' | 'COMMUTING';

export interface NpcFamilyTie {
  relatedNpcId: string;
  relation: 'SPOUSE' | 'CHILD' | 'PARENT' | 'SIBLING';
}

export interface NpcBusinessRelation {
  partnerNpcId: string;
  relationType: 'SUPPLIER' | 'CLIENT' | 'LOGISTICS_PARTNER' | 'CO_OWNER';
}

export interface NpcMicroLedger {
  npcId: string;
  name: string;
  roleTitle: string;
  monthlyIncome: number;
  monthlyExpense: number;
  savings: number;
  currentDebt: number;
  riskTolerance: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  personality: NpcPersonality;
  mood: NpcMood;
  stressLevel: number; // 0..100
  currentActivity: NpcActivity;
  bioQuote: string;
  financialGoal: string;
  avatarHue: string;
  familyTies: NpcFamilyTie[];
  businessRelations: NpcBusinessRelation[];
  playerLoan: NpcPlayerLoan | null;
  playerEquity: NpcPlayerEquity | null;
}

export interface OpportunityChoice {
  id: string;
  label: string;
  costCoins: number;
  borrowAmountCoins?: number;
  equityDilutionPct?: number;
  summaryEffect: string;
  financialImpact: {
    cashDeltaCoins: number;
    debtDeltaCoins: number;
    equityDeltaPct?: number;
    monthlyCashflowDeltaCoins: number;
    happinessDelta: number;
    riskDelta: number;
  };
}

export interface OpportunityCardDef {
  id: string;
  act: GameAct;
  title: string;
  context: string;
  description: string;
  choices: OpportunityChoice[];
}

export interface BlackSwanEventDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  severity: 'MINOR' | 'MODERATE' | 'CRITICAL';
  durationDays: number;
  revenueMultiplier: number;
  repairCostCoins?: number;
  debtInterestMultiplier: number;
  realEstateValuationMultiplier: number;
  affectedNpcId?: string;
  mitigationAdvice: string;
}

export interface MomoFinancialOSState {
  tuiThanTaiBalanceCoins: number;
  tuiThanTaiYieldRateDailyPct: number;
  viTraSauLimitCoins: number;
  viTraSauUsedCoins: number;
  viTraSauInterestRateMonthlyPct: number;
  activeInsurances: {
    buildingId: string;
    coverageType: 'BLACK_SWAN_SHOCK' | 'REPAIR_DAMAGE';
    monthlyPremiumCoins: number;
  }[];
  npcStockPortfolio: {
    npcId: string;
    sharesOwned: number;
    avgPurchasePriceCoins: number;
  }[];
}

