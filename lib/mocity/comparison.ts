import { CITY_TIERS } from './mock-city-data';
import type { DailySnapshot } from './types';

/**
 * SO SANH VOI CHINH MINH 7 NGAY TRUOC
 *
 * Day KHONG PHAI bang xep hang. Game khong co du lieu ve nguoi choi khac:
 * state nam trong `localStorage`, khong co API route, khong co database, va
 * `auth.ts` chua cau hinh provider nao. nen "so voi nguoi choi khac" la mot
 * con so bịa, va day la ly do khong tao ra so do.
 *
 * Thay vao do, day la ap luc THAT cua chinh nguoi choi: hom nay co lon hon
 * hom kia khong. Nguoi choi bi tu so sanh voi chinh minh - va do la thu
 * dang chay bang mot doi dong, khong can server.
 *
 * Hai nguyen tac dung o day:
 *   1. KHONG bao gi hien so am khi chua du du lieu. 7 ngay dau chua co ban
 *      ghi de so sanh, hien "0%" se la dinh huong nguoi choi ngung lai.
 *   2. KHONG phat nguoi choi vi chua lam duoc. Thieu du lieu la chua du
 *      lich su, khong phai ket qua kem.
 */

export const COMPARISON_WINDOW_DAYS = 7;

export type ComparisonTrend = 'UP' | 'DOWN' | 'FLAT' | 'UNKNOWN';

export interface ComparisonLine {
  label: string;
  /** Con so cua ngay hom nay. */
  homNay: number;
  /** Con so cua ngay cung ky 7 ngay truoc, `null` neu chua co du lieu. */
  kyTruoc: number | null;
  /** Chenh lech phan tram. `null` khi chua du du lieu de so sanh. */
  chenhLech: number | null;
  trend: ComparisonTrend;
  /** Don vi hien thi sau so. */
  donVi: string;
}

export interface WeekComparison {
  /** So ban ghi hien co. */
  soBanGhi: number;
  /** Can bao nhieu ban ghi de bat dau so sanh. */
  canBaoNhieu: number;
  /** Bang sanh da du du lieu chua. */
  sanhDuoc: boolean;
  /** Ngay duoc so sanh, `null` neu chua du. */
  ngaySoSanh: string | null;
  lines: ComparisonLine[];
  /**
   * SO CHI OI TU CHINH MINH: dang tụt so voi kỳ trước hay không.
   *
   * Dùng cho mot toast canh bao, KHONG dùng để phạt. Người chơi cần biết
   * mình đang chậm lại thì mới sửa được.
   */
  dangTut: boolean;
}

/** So ban ghi hien co, đã qua chuẩn hoá. */
export function snapshotsOf(s: { dailySnapshots?: DailySnapshot[] }): DailySnapshot[] {
  const cu = s.dailySnapshots;
  return Array.isArray(cu) ? cu : [];
}

/**
 * Phan tram chenh lech, ho tro ca so am.
 *
 * Mau so la 0 nen cong thuc chuan `delta / old` sinh Infinity. Khi do lai
 * so moi, `-100%` la cau tra loi dung: hom qua khong co gi, hom nay co.
 */
function percentChange(homNay: number, kyTruoc: number): number | null {
  if (kyTruoc === 0) return homNay === 0 ? 0 : null;
  return ((homNay - kyTruoc) / Math.abs(kyTruoc)) * 100;
}

function trendOf(pct: number | null): ComparisonTrend {
  if (pct === null) return 'UNKNOWN';
  if (pct > 2) return 'UP';
  if (pct < -2) return 'DOWN';
  return 'FLAT';
}

/**
 * Bao cao so sanh 7 ngay.
 *
 * Nhan truc tiep mang `dailySnapshots` thay vi `CityState`: ham nay khong
 * can gi den pho, va trong UI chi doc duoc mot mang snapshot qua selector.
 * Ep `CityState` o cho nay se tao mot object gia de moi lan render, ma
 * `useSyncExternalStore` so sanh bang tham chieu nen se lap vo han.
 */
export function weekComparison(
  snapshots: readonly DailySnapshot[],
  homNay: {
    netIncome: number;
    revenue: number;
    danSo?: number;
    soCongTrinh?: number;
    mayorLevel?: number;
  },
): WeekComparison {
  const snaps = Array.isArray(snapshots) ? snapshots : [];
  const canBaoNhieu = COMPARISON_WINDOW_DAYS;

  /*
   * Lay ban ghi CUOI CUNG trong chuoi chu khong phai ban ghi dau tien.
   *
   * Chuoi duoc cat con `COMPARISON_WINDOW_DAYS` ban ghi, nen khi nguoi choi
   * da choi 30 ngay thi `snaps[0]` la ngay 24 truoc, khong phai 7 ngay truoc.
   * Lay `length - 1` moi la ngay lien ke truoc hom nay.
   */
  const kyTruoc = snaps.length > 0 ? snaps[snaps.length - 1] : null;
  const sanhDuoc = snaps.length >= canBaoNhieu && kyTruoc !== null;

  if (!kyTruoc) {
    return {
      soBanGhi: snaps.length,
      canBaoNhieu,
      sanhDuoc: false,
      ngaySoSanh: null,
      lines: [],
      dangTut: false,
    };
  }

  /*
   * `danSo` la truong bat buoc cua caller, nen khi thiếu thì coi là 0 thay vì
   * suy ra từ danh sách công trình: dòng này so sánh hai con số người chơi
   * nhìn thấy, và suy ra sẽ lệch với thứ hiện trên HUD.
   */
  const danSoHomNay = homNay.danSo ?? 0;
  const lines: ComparisonLine[] = [
    {
      label: 'Doanh thu gộp',
      homNay: homNay.revenue,
      kyTruoc: kyTruoc.revenue,
      chenhLech: percentChange(homNay.revenue, kyTruoc.revenue),
      trend: trendOf(percentChange(homNay.revenue, kyTruoc.revenue)),
      donVi: 'đồng',
    },
    {
      label: 'Lợi nhuận ròng',
      homNay: homNay.netIncome,
      kyTruoc: kyTruoc.netIncome,
      chenhLech: percentChange(homNay.netIncome, kyTruoc.netIncome),
      trend: trendOf(percentChange(homNay.netIncome, kyTruoc.netIncome)),
      donVi: 'đồng',
    },
  ];

  /*
   * Chi so KHONG TIEN khong dung `percentChange` cua mat tien: dan so 200 len
   * 205 la +2,5% như nghia la "them 5 nguoi", con "thieu 5 nguoi so voi ky
   * truoc" thi doc tuong phan huu hon.
   */
  const khongTien: Array<{ label: string; n: number; k: number; donVi: string }> = [
    { label: 'Cư dân', n: danSoHomNay, k: kyTruoc.danSo, donVi: 'người' },
    { label: 'Số tiệm', n: homNay.soCongTrinh ?? 0, k: kyTruoc.soCongTrinh, donVi: 'tiệm' },
    { label: 'Cấp', n: homNay.mayorLevel ?? 0, k: kyTruoc.mayorLevel, donVi: 'cấp' },
  ];
  for (const row of khongTien) {
    lines.push({
      label: row.label,
      homNay: row.n,
      kyTruoc: row.k,
      chenhLech: row.n - row.k,
      trend: trendOf(row.n - row.k === 0 ? 0 : (row.n - row.k) * 100),
      donVi: row.donVi,
    });
  }

  /*
   * `dangTut` chi bat khi BANG DA DU DU LIEU. Tinh ca khi chua du du lieu se
   * bao nguoi choi "ban dang tut" trong khi moi choi 2 ngay - dung nhu
   * dong vi con so.
   */
  const chenhLechLoiNhuan = percentChange(homNay.netIncome, kyTruoc.netIncome);
  const dangTut = sanhDuoc && chenhLechLoiNhuan !== null && chenhLechLoiNhuan < -10;

  return {
    soBanGhi: snaps.length,
    canBaoNhieu,
    sanhDuoc,
    ngaySoSanh: kyTruoc.day,
    lines,
    dangTut,
  };
}

/**
 * Bao nhieu ngay nua thi len duoc bac thanh pho ke tiep.
 *
 * Tinh bang moc trung binh cua 7 ngay qua chu khong phai ngay hom nay: ngay
 * hom nay co the la ngay thang "du an chay" hoac ngaay ngo, mot ngay khong
 * dai duoc lam moc so sanh.
 */
export function daysToNextTier(snapshots: readonly DailySnapshot[], danSoHienTai: number): number | null {
  const dang = danSoHienTai;
  const tiep = CITY_TIERS.find((t) => t.minPopulation > dang);
  if (!tiep) return null;

  const trungBinh = averageGrowthPerDay(snapshots, 'danSo');
  if (trungBinh <= 0) return null;
  return Math.ceil((tiep.minPopulation - dang) / trungBinh);
}

/** Toc do tang trung binh moi ngay cua mot chi so, tren cac ban ghi. */
export function averageGrowthPerDay(
  snapshots: readonly DailySnapshot[],
  field: 'danSo' | 'soCongTrinh',
): number {
  const snaps = snapshots;
  if (snaps.length < 2) return 0;
  const first = snaps[0][field];
  const last = snaps[snaps.length - 1][field];
  const days = snaps.length - 1;
  if (days <= 0) return 0;
  return (last - first) / days;
}