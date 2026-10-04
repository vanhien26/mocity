/**
 * HỆ THỐNG KỊCH BẢN ĐỐI THOẠI CƯ DÂN ĐƯỜNG PHỐ (CITIZEN DIALOGUE SCENARIOS)
 * Bổ sung toàn diện: DRAMA góc phố, TÌNH HÌNH THỜI TIẾT (nắng nóng, mưa ngập, nồm ẩm, se lạnh)
 * và THỜI SỰ XÃ HỘI (sinh trắc học, giá vàng, bão giá xăng, vé tàu Tết, phạt nguội camera,
 * công nghệ 5G, không dùng tiền mặt) cho 12 cư dân đường phố MoCity.
 */

import type { FacialEmotion } from './character-appearance';

export type { FacialEmotion };

export interface CitizenDialogueOption {
  id: string;
  label: string;
  cost?: number; // Số đồng Thị Trưởng biếu/tặng, mặc định 0 (miễn phí)
  emotionOnSelect?: FacialEmotion;
  reply: string;
  /** Lộc may mắn NPC tặng lại cho Thị Trưởng nếu có */
  rewardBonus?: {
    coins: number;
    reason: string;
  };
  particles?: 'coin' | 'stars';
  /**
   * Chỉ số tài chính mà lựa chọn này đụng tới, hiện thành pill màu.
   *
   * Đây là phần quan trọng nhất để game dạy tài chính: NPC không chỉ nói
   * chuyện vui, mà câu chuyện của họ gắn với đúng một khái niệm kế toán.
   * Ví dụ `+QR giảm fraud`, `-OPEX`, `+NPL rủi ro`.
   */
  financeTags?: FinanceTag[];
}

export type FinanceTag =
  | 'DOANH_THU'
  | 'GIA_VON'
  | 'OPEX'
  | 'LOI_NHUAN'
  | 'QR'
  | 'FRAUD'
  | 'NPL'
  | 'BAO_HIEM'
  | 'TIET_KIEM'
  | 'LANH_VAY'
  | 'CHI_TIEU_VON'
  | 'THUONG'
  /**
   * An sinh và quỹ dự phòng.
   *
   * Thêm riêng cho Anh Ba: 12 tag cũ đã bị 12 cư dân gốc chiếm hết và test
   * `chu de phu kin toan mot khai niem chinh` bắt mỗi cư dân một tag riêng.
   * Đây cũng thật sự là khái niệm RIÊNG, không phải đổi tên của TIET_KIEM:
   * tiết kiệm nói "để dành tiền sinh lời", an sinh nói "để dành tiền không
   * để bản thân rơi xuống" - hai động cơ dùng cùng một con số.
   */
  | 'AN_SINH'
  /**
   * Thanh khoản - mức độ đổi ra tiền mặt được nhanh mà không mất giá.
   *
   * Thêm cho Cô Hai gánh ve chai: cô bán là có tiền trong ngày, nên đây là
   * khái niệm của CHÍNH cô chứ không phải mượn tạm của TIET_KIEM. Tiết kiệm
   * hỏi "để dành bao nhiêu", thanh khoản hỏi "rút ra kịp lúc nào" - hai câu
   * khác nhau và câu thứ hai mới là thứ làm người ta vỡ nợ.
   */
  | 'THANH_KHOAN'
  /**
   * Bảo trì và khấu hao tài sản công cộng / hạ tầng vỉa hè.
   *
   * Thêm riêng cho Cô Sáu Lao Công: cơ sở vật chất bị hao mòn qua thời gian,
   * nếu không trích quỹ bảo trì định kỳ thì chi phí thay mới sẽ đắt gấp bội.
   */
  | 'BAO_TRI';

/** Nhãn hiển thị + màu cho từng chỉ số. */
export const FINANCE_TAG_META: Record<FinanceTag, { label: string; tone: 'good' | 'bad' | 'neutral' }> = {
  DOANH_THU: { label: '+Doanh thu', tone: 'good' },
  GIA_VON: { label: 'Giá vốn', tone: 'bad' },
  OPEX: { label: 'Chi phí vận hành', tone: 'bad' },
  LOI_NHUAN: { label: '+Lợi nhuận ròng', tone: 'good' },
  QR: { label: 'QR không tiền mặt', tone: 'good' },
  FRAUD: { label: 'Rủi ro lừa đảo', tone: 'bad' },
  NPL: { label: 'Nợ xấu', tone: 'bad' },
  BAO_HIEM: { label: 'Bảo hiểm', tone: 'good' },
  TIET_KIEM: { label: 'Tiết kiệm sinh lời', tone: 'good' },
  LANH_VAY: { label: 'Lãi vay', tone: 'bad' },
  CHI_TIEU_VON: { label: 'Chi tiêu vốn', tone: 'neutral' },
  THUONG: { label: 'Tiền thưởng', tone: 'neutral' },
  AN_SINH: { label: 'An sinh & dự phòng', tone: 'bad' },
  THANH_KHOAN: { label: 'Thanh khoản', tone: 'neutral' },
  BAO_TRI: { label: 'Bảo trì & Khấu hao', tone: 'bad' },
};

export interface CitizenScriptData {
  id: string;
  name: string;
  role: string;
  /**
   * Bài toán tài chính mà nhân vật này mang xách, hiện dưới tên trong bảng
   * trò chuyện để người chơi biết mình đang học cái gì khi nói chuyện với họ.
   */
  financeTheme: {
    tag: FinanceTag;
    title: string;
    /** Bài học một câu, hiện sau khi người chơi chọn xong một lựa chọn. */
    lesson: string;
  };
  /** Danh sách các lời chào mở đầu phong phú theo ngữ cảnh (chọn ngẫu nhiên) */
  greetings: {
    text: string;
    emotion: FacialEmotion;
  }[];
  /** Danh sách các kịch bản đối thoại chuyên sâu */
  options: CitizenDialogueOption[];
}

export const CITIZEN_SCRIPTS: Record<string, CitizenScriptData> = {
  // 1. TRỢ LÝ THỊ TRƯỞNG
  'cit-mayor-assistant': {
    id: 'cit-mayor-assistant',
    name: 'Trợ Lý Thị Trưởng',
    role: 'Cán Bộ Quy Hoạch',
    financeTheme: {
      tag: 'OPEX',
      title: 'Chi phí vận hành',
      lesson:
        'Đèn đường, vỉa hè, cống thoát nước đều là chi phí vận hành. Chúng không tăng doanh thu trực tiếp nhưng thiếu chúng thì cả phố ngừng hoạt động.',
    },
    greetings: [
      {
        text: 'Báo cáo Thị Trưởng! Dự báo thời tiết chiều nay có mưa to triều cường, tui đã cho kiểm tra toàn bộ cống thoát nước và 6 cột đèn đường rồi!',
        emotion: 'HAPPY',
      },
      {
        text: 'Tin nóng thời sự: Thành phố vừa triển khai chuẩn hóa định danh và thanh toán số toàn diện, phố mình đang dẫn đầu bảng xếp hạng!',
        emotion: 'STAR_EYES',
      },
      {
        text: 'Thị Trưởng ơi! Sáng nay có drama hai tiệm đầu phố kê biển quảng cáo lấn vỉa hè tranh khách, tui vừa hòa giải êm đẹp xong!',
        emotion: 'HAPPY',
      },
      {
        text: 'Thời sự đưa tin giá xăng vừa hạ nhiệt, bà con tài xế công nghệ với shipper khu mình ai nấy đều phấn khởi chạy thêm cuốc!',
        emotion: 'HAPPY',
      },
      {
        text: 'Trời nắng nóng gay gắt 39 độ, tui vừa kiến nghị lắp thêm máy bán nước tự động quét QR có mái che cho người đi bộ nghỉ chân!',
        emotion: 'TIRED',
      },
    ],
    options: [
      {
        id: 'asst-drainage',
        financeTags: ['OPEX','BAO_HIEM'],
        label: '🌦️ Phương án chống ngập phố mùa mưa bão thế nào?',
        emotionOnSelect: 'HAPPY',
        reply: 'Hệ thống rãnh ngầm đã được nạo vét thông suốt! 6 cột đèn đường chống nước chuẩn IP68, ngập tới đâu sáng tới đó, bà con đi lại an toàn tuyệt đối!',
      },
      {
        id: 'asst-news',
        financeTags: ['OPEX','DOANH_THU'],
        label: '📰 Dân tình dạo này bàn tán tin thời sự gì nhiều nhất?',
        emotionOnSelect: 'STAR_EYES',
        reply: 'Bà con đang xôn xao vụ tích hợp VNeID với quét sinh trắc học chuyển tiền. Tui hướng dẫn các cụ dùng MoMo xác thực 1 chạm là xong, ai cũng khen tiện!',
      },
      {
        id: 'asst-drama',
        financeTags: ['OPEX'],
        label: '🔥 Nghe đồn có vụ drama lấn chiếm vỉa hè sáng nay hả?',
        emotionOnSelect: 'HAPPY',
        reply: 'À, tiệm trà chanh kê ghế hơi lố ra lối đi bộ, bị Chú Bảy nhắc nhở. Giờ họ tự giác kẻ vạch sơn ngay ngắn rồi, văn minh đô thị là trên hết Thị Trưởng!',
      },
      {
        id: 'asst-report',
        financeTags: ['LOI_NHUAN'],
        label: '📊 Báo cáo nhanh tình hình phố xá hôm nay',
        emotionOnSelect: 'HAPPY',
        reply: 'Chỉ số an ninh đạt chuẩn 10/10, giao thông thông thoáng, các tiệm kinh doanh đều báo doanh số tăng đều nhờ khách quét mã MoMo nhanh chóng!',
      },
      {
        id: 'asst-coffee',
        financeTags: ['THUONG'],
        label: '☕ Mời đồng chí ly cà phê 30.000đ bồi dưỡng',
        cost: 30_000,
        emotionOnSelect: 'STAR_EYES',
        particles: 'coin',
        reply: 'Cảm ơn Thị Trưởng! Có cà phê năng lượng vào là tui tăng tốc duyệt hồ sơ quy hoạch thần tốc ngay cho phố mình!',
      },
    ],
  },

  // 2. CÔ TƯ ĐI CHỢ
  'cit-co-tu': {
    id: 'cit-co-tu',
    name: 'Cô Tư Đi Chợ',
    role: 'Bà Nội Trợ Săn Deal',
    financeTheme: {
      tag: 'QR',
      title: 'Tiền mặt và QR',
      lesson:
        'Tiệm nào còn đếm tiền lẻ thì giữ sổ nợ và tự chịu rủi ro lừa đảo. Lắp QR là chuyển chi phí xử lý sang hệ thống, đổi lại không còn sổ tay rách nát.',
    },
    greetings: [
      {
        text: 'Trời đất ơi Thị Trưởng! Nắng gì mà 39 độ cháy da, cô phải trùm kín như ninja ra phố săn deal nước giải khát nè!',
        emotion: 'TIRED',
      },
      {
        text: 'Thị Trưởng có hay tin gì chưa? Mấy bữa nay trên mạng rần rần vụ lừa đảo gọi video deepfake giả công an, xém tí nữa cô Tư dính bẫy!',
        emotion: 'SURPRISED',
      },
      {
        text: 'Mưa dầm dề mấy hôm nay rau củ lên giá quá xá, may mà cô có mã hoàn tiền MoMo cứu lại được mớ tiền chợ cả tuần!',
        emotion: 'HAPPY',
      },
      {
        text: 'Sáng nay ra chợ nghe mấy bà tám kể drama nhà đối diện bắt quả tang người yêu chia tiền lẩu mà trốn trong WC, cười muốn xỉu!',
        emotion: 'STAR_EYES',
      },
      {
        text: 'Thời tiết nồm ẩm nhà cửa trơn trượt ghê chưa, cô phải ra tiệm điện máy sắm cái máy hút ẩm thanh toán trả góp 0% nè!',
        emotion: 'HAPPY',
      },
    ],
    options: [
      {
        id: 'cotu-scam',
        label: '🔥 Kể con nghe vụ cô xém bị lừa đảo qua mạng coi?',
        emotionOnSelect: 'SURPRISED',
        financeTags: ['FRAUD', 'QR'],
        reply: 'Trời ơi, nó gọi video mặt mờ mờ kêu cô chuyển tiền nộp phạt nguội! Cô bảo: "Mày ngon quét sinh trắc học MoMo với tao nè con!", nó cúp máy cái rụp, đồ lừa đảo!',
      },
      {
        id: 'cotu-hot',
        label: '☀️ Trời nắng gay gắt vầy đi chợ có mệt không cô?',
        emotionOnSelect: 'HAPPY',
        financeTags: ['DOANH_THU', 'QR'],
        reply: 'Mệt chứ con! Nhưng ghé tiệm tạp hóa mua chai nước quét MoMo giảm 50%, bước vô cửa hàng máy lạnh phà mát rượi là cô khỏe re liền!',
      },
      {
        id: 'cotu-gold',
        label: '📰 Giá vàng với giá cả thị trường dạo này ra sao cô Tư?',
        emotionOnSelect: 'HAPPY',
        financeTags: ['TIET_KIEM'],
        reply: 'Vàng miếng thì nhảy múa chóng mặt, xếp hàng dài ngoằng. Cô Tư ăn chắc mặc bền, có tiền lẻ cứ đút vô Túi Thần Tài lấy lãi mỗi ngày cho an tâm con ơi!',
      },
      {
        id: 'cotu-dinner',
        financeTags: ['THUONG'],
        label: '🍲 Tối nay nhà cô nấu món gì ngon vậy?',
        emotionOnSelect: 'HAPPY',
        rewardBonus: {
          coins: 20_000,
          reason: 'Cô Tư biếu đĩa chả giò giòn rụm lót dạ',
        },
        particles: 'stars',
        reply: 'Tối nay cô làm lẩu cá kèo lá giang với chả giò! Cô biếu Thị Trưởng đĩa chả giò ăn lấy thảo (+20.000đ), bữa nào rảnh ghé cô đãi ăn cơm nghen!',
      },
      {
        id: 'cotu-gift',
        financeTags: ['THUONG'],
        label: '🧧 Biếu cô 50.000đ mua thêm hoa quả tráng miệng',
        cost: 50_000,
        emotionOnSelect: 'STAR_EYES',
        particles: 'coin',
        reply: 'Ôi Thị Trưởng thảo ăn quá xá! Cô chúc Thị Trưởng vạn sự hanh thông, cả khu phố lúc nào cũng buôn may bán đắt nghen!',
      },
    ],
  },

  // 3. BÉ NAM GENZ
  'cit-be-nam': {
    id: 'cit-be-nam',
    name: 'Bé Nam GenZ',
    role: 'Sinh Viên Năm 3',
    financeTheme: {
      tag: 'NPL',
      title: 'Quản trị công nợ khách hàng',
      lesson:
        'Kinh doanh cho khách mua nợ ghi sổ giúp chốt đơn nhanh nhưng tiềm ẩn rủi ro nợ khó đòi (NPL). Nếu không kiểm soát công nợ chặt chẽ thì tiền nằm ngoài sổ sách, ăn thẳng vào dòng tiền vận hành.',
    },
    greetings: [
      {
        text: 'Thị Trưởng ơi! Hôm nay drama idol tóp tóp 5 triệu follower bị bóc phốt ăn bún đậu quỵt tiền đang nổ tung mạng xã hội kìa!',
        emotion: 'SURPRISED',
      },
      {
        text: 'Trời mưa tầm tã mà tụi em vẫn lội nước đi săn vé concert âm nhạc trên app nè Thị Trưởng, đam mê bất diệt!',
        emotion: 'STAR_EYES',
      },
      {
        text: 'Nhiệt độ xuống 18 độ se lạnh rồi Thị Trưởng ơi, ngồi vỉa hè húp tô mì cay 7 cấp độ thì đỉnh chóp luôn!',
        emotion: 'HAPPY',
      },
      {
        text: 'Thị Trưởng quét sinh trắc học khuôn mặt chưa? Hôm qua em vừa đi nhuộm tóc về app nhận không ra, dí cam sát mặt cười xỉu!',
        emotion: 'STAR_EYES',
      },
      {
        text: 'Hot trend thời sự: Cả trường em đang thi nhau nuôi Heo Đất MoMo đua top, ai thua phải bao cả phòng uống trà sữa!',
        emotion: 'HAPPY',
      },
    ],
    options: [
      {
        id: 'benam-drama',
        financeTags: ['DOANH_THU','QR'],
        label: '🔥 Drama bóc phốt idol quán bún đậu tới đâu rồi em?',
        emotionOnSelect: 'SURPRISED',
        reply: 'Chủ quán tung camera ra bóc mẽ idol xin ăn chực không được nên quay clip dìm hàng! Dân mạng quay xe 180 độ, rủ nhau quét QR MoMo ủng hộ quán đông nghẹt!',
      },
      {
        id: 'benam-rain',
        financeTags: ['OPEX'],
        label: '🌧️ Mưa bão ngập đường vầy tụi em tụ tập kiểu gì?',
        emotionOnSelect: 'HAPPY',
        reply: 'Dễ ợt Thị Trưởng! Mưa thì ngồi quán cafe cóc nghe mưa rơi chill chill, xong mở app MoMo chơi Lắc Heo Vàng chia thẻ quà, vui banh nóc!',
      },
      {
        id: 'benam-tech',
        financeTags: ['QR'],
        label: '📱 GenZ dạo này bắt trend thời sự công nghệ nào hot nhất?',
        emotionOnSelect: 'STAR_EYES',
        reply: 'Trend quét mã VietQR không tiền mặt với Apple Pay! Đi ăn chè 10k cũng "bíp" một phát, mang ví dày cộm là xưa rồi diễm ơi!',
      },
      {
        id: 'benam-milktea',
        label: '🧋 Ly trà sữa hôm nay thế nào rồi em?',
        emotionOnSelect: 'HAPPY',
        financeTags: ['NPL'],
        reply: 'Full topping trân châu phô mai nướng mà săn deal MoMo ngon nhức nách luôn Thị Trưởng ơi! Uống xong có năng lượng cày cuốc cả ngày luôn!',
      },
      {
        id: 'benam-hotpot',
        label: '🍕 Tặng em 50.000đ rủ nhóm bạn liên hoan lẩu',
        cost: 50_000,
        emotionOnSelect: 'STAR_EYES',
        financeTags: ['NPL', 'OPEX'],
        particles: 'coin',
        reply: 'U là trời! Thị Trưởng là chân ái! Tụi em chia tiền lẩu trên app xong sẽ vote 5 sao cho phố mình lên xu hướng liền!',
      },
    ],
  },

  // 4. CHỊ THẢO VĂN PHÒNG
  'cit-chi-thao': {
    id: 'cit-chi-thao',
    name: 'Chị Thảo Văn Phòng',
    role: 'Thánh Chốt Đơn',
    financeTheme: {
      tag: 'TIET_KIEM',
      title: 'Dòng tiền nhàn rỗi',
      lesson:
        'Lương về tài khoản rồi mà vẫn hết tiền trước ngày 20 là dòng tiền không được quản lý, không phải lương ít. Tách phần tiết kiệm ngay khi nhận lương.',
    },
    greetings: [
      {
        text: 'Chào Thị Trưởng! Phòng em hôm nay vừa nổ drama chia tiền trà sữa cuối tháng, đứa thì bảo chuyển rồi đứa thì quên lịch sử giao dịch!',
        emotion: 'SURPRISED',
      },
      {
        text: 'Trời nồm ẩm sàn nhà ướt nhẹp trơn trượt quá Thị Trưởng ơi, đi giày cao gót ra phố suýt nữa em vồ ếch!',
        emotion: 'TIRED',
      },
      {
        text: 'Thị Trưởng ơi, mùa săn vé tàu xe Tết bắt đầu rồi, cả công ty em đang mở 10 tab canh vé máy bay giá rẻ trên MoMo Travel nè!',
        emotion: 'STAR_EYES',
      },
      {
        text: 'Nắng nóng đỉnh điểm, hóa đơn tiền điện tháng này của cơ quan tăng vọt, may mà em săn được mã giảm giá hóa đơn 100k trên MoMo!',
        emotion: 'HAPPY',
      },
      {
        text: 'Tin nóng sàn chứng khoán: Thị trường hôm nay xanh tím rực rỡ, tiền lời Chứng Chỉ Quỹ của em nhảy múa vui ghê!',
        emotion: 'STAR_EYES',
      },
    ],
    options: [
      {
        id: 'thao-drama',
        financeTags: ['DOANH_THU','QR'],
        label: '🔥 Drama chia tiền trà sữa ở văn phòng giải quyết sao rồi chị?',
        emotionOnSelect: 'HAPPY',
        reply: 'Em bật ngay tính năng Chia Tiền Nhóm trên MoMo ra! Ai nợ bao nhiêu app tự chia đều, gửi thông báo đòi nợ lịch sự tinh tế, 5 phút sau ting ting đủ không thiếu 1 xu!',
      },
      {
        id: 'thao-tet',
        financeTags: ['DOANH_THU'],
        label: '✈️ Tình hình săn vé về quê ăn Tết đợt này căng thẳng không?',
        emotionOnSelect: 'STAR_EYES',
        reply: 'Căng như dây đàn luôn Thị Trưởng! Vé máy bay khan hiếm, nhưng em đặt trước qua MoMo có bảo hiểm trễ chuyến bay với hoàn tiền nên yên tâm hẳn!',
      },
      {
        id: 'thao-weather',
        financeTags: ['OPEX'],
        label: '🌦️ Thời tiết nồm ẩm thất thường này dân văn phòng sống sao?',
        emotionOnSelect: 'TIRED',
        reply: 'Bật máy hút ẩm 24/7 với uống trà gừng giải cảm thôi Thị Trưởng. Trưa tranh thủ ra phố hít tí nắng gió cho đỡ mốc meo người!',
      },
      {
        id: 'thao-tuithantai',
        financeTags: ['TIET_KIEM'],
        label: '📈 Túi Thần Tài dạo này tích lũy ngon lành chứ?',
        emotionOnSelect: 'STAR_EYES',
        reply: 'Dạ ngon lành lắm! Tiền nhàn rỗi cứ để trong đó, mỗi ngày sinh lời tự động, tích tiểu thành đại cuối năm có chuyến du lịch luôn!',
      },
      {
        id: 'thao-coffee',
        financeTags: ['THUONG'],
        label: '☕ Mời chị ly cà phê muối 30.000đ chống buồn ngủ',
        cost: 30_000,
        emotionOnSelect: 'STAR_EYES',
        particles: 'coin',
        reply: 'Ôi cảm ơn Thị Trưởng nhiều nha! Cà phê chuẩn vị, em về văn phòng gõ máy tính thoăn thoắt chốt hợp đồng liền!',
      },
    ],
  },

  // 5. ÔNG LỘC VÉ SỐ
  'cit-ong-loc': {
    id: 'cit-ong-loc',
    name: 'Ông Lộc Vé Số',
    role: 'Thần Tài Góc Phố',
    financeTheme: {
      tag: 'FRAUD',
      title: 'Gian lận và bảo chứng',
      lesson:
        'Bán thứ cần tiền thật mà không có dấu vết giao dịch thì mỗi lần là một lần có nguy cơ bị lừa. Giao dịch số tạo bằng chứng, đó là lý do chuyển đổi số không chỉ là cho tiện.',
    },
    greetings: [
      {
        text: 'Trời ơi Thị Trưởng, chiều qua mưa giông sấm chớp đùng đùng mà bà con vẫn đội mưa đứng mua vé số đài phụ, đông nghẹt!',
        emotion: 'HAPPY',
      },
      {
        text: 'Thời sự đưa tin có người vừa trúng độc đắc 92 tỷ Vietlott qua app, cả xóm đang nhốn nháo bàn tán phong thủy góc phố mình!',
        emotion: 'STAR_EYES',
      },
      {
        text: 'Gió mùa đông bắc về se lạnh rồi, người già như ông khớp xương hơi nhức nhưng đi bộ thể dục bán vé vẫn thấy khỏe khoắn!',
        emotion: 'HAPPY',
      },
      {
        text: 'Sáng nay có drama hai ông bạn cờ tướng cãi nhau suýt lật bàn cờ vì tranh luận giá vàng thế giới tăng hay giảm kìa Thị Trưởng!',
        emotion: 'SURPRISED',
      },
      {
        text: 'Thời sự đưa tin sốt đất nền vùng ven, ông bảo đất phố MoCity mình mặt tiền sạch đẹp có giá trị thực mới là vàng ròng!',
        emotion: 'HAPPY',
      },
    ],
    options: [
      {
        id: 'ongloc-drama',
        financeTags: ['TIET_KIEM'],
        label: '🔥 Vụ cãi nhau giá vàng ở bàn cờ tướng kết quả sao rồi ông?',
        emotionOnSelect: 'HAPPY',
        reply: 'Haha, ông can hai lão ấy, bảo cãi nhau làm chi cho tăng xông! Cứ mở mục Tài Chính trên MoMo ra coi biểu đồ giá vàng với lãi Túi Thần Tài thời gian thực là biết ai đúng ai sai liền!',
      },
      {
        id: 'ongloc-vietlott',
        financeTags: ['FRAUD'],
        label: '🎫 Vụ trúng độc đắc Vietlott chấn động phố mình ra sao ông?',
        emotionOnSelect: 'STAR_EYES',
        reply: 'Người ta mua vé số online trên app đó Thị Trưởng! Giờ hiện đại ghê, trúng là tiền bắn thẳng vô ví, khỏi sợ rách vé hay làm rơi, già như ông cũng phải học theo!',
      },
      {
        id: 'ongloc-rain',
        financeTags: ['QR'],
        label: '🌦️ Trời mưa gió thất thường vầy ông che chắn vé số thế nào?',
        emotionOnSelect: 'HAPPY',
        reply: 'Ông bọc 3 lớp nilon chống nước cẩn thận lắm! Nhưng khách giờ chuộng quét mã chuyển khoản hơn, tay ướt khỏi đếm tiền giấy sũng nước, tiện cho ông lão này lắm!',
      },
      {
        id: 'ongloc-ticket',
        financeTags: ['FRAUD'],
        label: '🎫 Lựa cho cháu một tờ vé số đuôi may mắn với',
        emotionOnSelect: 'STAR_EYES',
        particles: 'stars',
        reply: 'Còn mấy tờ đuôi 68 Lộc Phát với 79 Thần Tài nè Thị Trưởng! Ông đã quét QR bằng mã định danh rồi nên tờ vé có tên chính chủ, mất trộm cũng không lấy được của ông. Chiều nay có giải là ting ting tiền vô ví đàng hoàng!',
      },
      {
        id: 'ongloc-tea',
        financeTags: ['THUONG'],
        label: '🍵 Biếu ông 20.000đ uống ly trà đá nghỉ chân',
        cost: 20_000,
        emotionOnSelect: 'STAR_EYES',
        particles: 'coin',
        reply: 'Chà, quý hóa quá! Ông cảm ơn Thị Trưởng! Cầu chúc Thị Trưởng bình an, vạn sự hanh thông, lộc tài như nước!',
      },
    ],
  },

  // 6. ANH HOÀNG IT
  'cit-anh-hoang': {
    id: 'cit-anh-hoang',
    name: 'Anh Hoàng IT',
    role: 'Kỹ Sư Phần Mềm',
    financeTheme: {
      tag: 'CHI_TIEU_VON',
      title: 'Chi tiêu vốn vs chi phí',
      lesson:
        'Mua máy chủ là chi tiêu vốn, trả tiền thuê bao tháng là chi phí vận hành. Trong báo cáo, hai dòng này khác nhau: vốn tạo tài sản, chi phí thì trừ vào lợi nhuận từng tháng.',
    },
    greetings: [
      {
        text: 'Thị Trưởng ơi! Drama đứt cáp quang biển đêm qua làm cả công ty em thức trắng đêm chuyển hướng lưu lượng sang trạm 5G MoCity!',
        emotion: 'TIRED',
      },
      {
        text: 'Thời tiết nắng nóng 40 độ máy chủ server kêu như máy cày, em phải mang laptop ra quán cafe vỉa hè ngồi ké máy lạnh nè!',
        emotion: 'TIRED',
      },
      {
        text: 'Thời sự bắt buộc xác thực sinh trắc học khuôn mặt chuyển tiền làm team kỹ thuật tụi em OT liên tục 2 tuần liền!',
        emotion: 'HAPPY',
      },
      {
        text: 'Drama công nghệ: Trí tuệ nhân tạo AI dạo này code vèo vèo, sếp em đùa bảo sắp sa thải lập trình viên tới nơi rồi Thị Trưởng!',
        emotion: 'SURPRISED',
      },
      {
        text: 'Trời mưa ngập đường mạng cáp quang bị ẩm rớt gói tin, may mà có mạng 5G không dây cứu bồ kịp giờ nộp dự án!',
        emotion: 'HAPPY',
      },
    ],
    options: [
      {
        id: 'hoang-ai',
        financeTags: ['OPEX'],
        label: '🤖 Vụ AI cướp việc của dân IT có thật không em?',
        emotionOnSelect: 'HAPPY',
        reply: 'Haha, AI code nhanh nhưng fix bug logic với cãi nhau với khách hàng thì vẫn phải cần người thật Thị Trưởng ơi! Em dùng AI tối ưu luồng thanh toán cho phố mình chạy nhanh gấp đôi luôn!',
      },
      {
        id: 'hoang-internet',
        financeTags: ['CHI_TIEU_VON'],
        label: '⚡ Cáp quang biển đứt thì mạng mẽo khu phố mình có sao không?',
        emotionOnSelect: 'STAR_EYES',
        reply: 'Phố mình chạy hạ tầng mạng nội địa CDN cực mạnh, máy chủ đặt ngay trung tâm dữ liệu MoMo nên bà con quét mã QR thanh toán chỉ mất 0.1 giây, mượt như nhung!',
      },
      {
        id: 'hoang-weather',
        financeTags: ['OPEX','CHI_TIEU_VON'],
        label: '🌦️ Nắng nóng đỉnh điểm này thiết bị công nghệ có quá tải không?',
        emotionOnSelect: 'HAPPY',
        reply: 'Hệ thống đèn đường với camera giao thông ngã tư đều có cảm biến nhiệt tự làm mát. Chỉ có kỹ sư phần mềm là cần nạp trà sữa đá mát lạnh thôi Thị Trưởng!',
      },
      {
        id: 'hoang-coffee',
        financeTags: ['THUONG'],
        label: '☕ Mời ly cà phê đen đá 25.000đ cho tỉnh táo',
        cost: 25_000,
        emotionOnSelect: 'STAR_EYES',
        particles: 'coin',
        reply: 'Trời ơi cứu tinh đời em! Cà phê đậm đặc này tương đương với 200 dòng code sạch không lỗi! Cảm ơn Thị Trưởng nhiều!',
      },
      {
        id: 'hoang-finance',
        financeTags: ['TIET_KIEM','LOI_NHUAN'],
        label: '💸 Dân IT quản lý tài chính thế nào để không cháy túi?',
        emotionOnSelect: 'SMUG',
        reply: 'Lương về là em bắn 50% vào Chứng Chỉ Quỹ và Túi Thần Tài để sinh lời kép, còn tiền ăn uống thì quét QR phân loại chi tiêu tự động!',
      },
    ],
  },

  // 7. BẢO NGỌC KOC
  'cit-bao-ngoc': {
    id: 'cit-bao-ngoc',
    name: 'Bảo Ngọc KOC',
    role: 'Reviewer Phố Phường',
    financeTheme: {
      tag: 'DOANH_THU',
      title: 'Doanh thu và giá vốn',
      lesson:
        'Một video triệu view không tự sinh lợi nhuận. Tiệm vẫn phải trả giá vốn cho từng phần bán ra, nên quảng bá tăng doanh thu thì phải theo dõi biên lợi nhuận, không chỉ nhìn lượt xem.',
    },
    greetings: [
      {
        text: 'Thị Trưởng ơi cứu em! Drama em vừa đăng clip khen tiệm bánh cuốn đầu phố, dân tình tràn vào cãi nhau nảy lửa vụ ăn bánh cuốn chấm nước mắm hay xì dầu!',
        emotion: 'SURPRISED',
      },
      {
        text: 'Trời nắng gắt cháy máy quay luôn Thị Trưởng, em phải dùng quạt mini tản nhiệt cho điện thoại để tiếp tục livestream review phố mình nè!',
        emotion: 'TIRED',
      },
      {
        text: 'Hot trend thời sự: Trào lưu "Check-in phố không tiền mặt" đang viral 10 triệu view trên TikTok, phố MoCity mình lọt top 1 điểm đến!',
        emotion: 'STAR_EYES',
      },
      {
        text: 'Mưa ngập nửa bánh xe mà phố mình lên hình lung linh kiểu "Venice phiên bản Sài Gòn", clip review trời mưa đạt 2 triệu view luôn Thị Trưởng!',
        emotion: 'STAR_EYES',
      },
      {
        text: 'Tin thời sự giải trí: Đêm nhạc đại nhạc hội giao thừa sắp tổ chức tại MoCity, vé xem ca nhạc mở bán trên MoMo đã cháy vé sau 3 phút!',
        emotion: 'HAPPY',
      },
    ],
    options: [
      {
        id: 'baongoc-drama',
        financeTags: ['DOANH_THU','GIA_VON'],
        label: '🔥 Vụ drama nước mắm bánh cuốn trên mạng tới đâu rồi em?',
        emotionOnSelect: 'HAPPY',
        reply: 'Trời ơi cãi nhau 50.000 bình luận luôn! Kết quả quán bánh cuốn chiều lòng khách, để sẵn cả 2 loại nước chấm kèm mã giảm giá MoMo 20%, thế là cả 2 phe kéo đến ăn đông nghẹt, chủ tiệm cảm ơn em rối rít!',
      },
      {
        id: 'baongoc-rain',
        financeTags: ['DOANH_THU'],
        label: '🌊 Mưa ngập phố mà em cũng biến thành video triệu view được hả?',
        emotionOnSelect: 'STAR_EYES',
        reply: 'Nghệ thuật là phải biến nguy thành cơ Thị Trưởng! Em quay cảnh bà con vui vẻ chèo thuyền sup ngắm phố đèn lồng, lồng nhạc "Tình ca mùa mưa", dân mạng khen phố mình lạc quan số 1!',
      },
      {
        id: 'baongoc-trend',
        financeTags: ['DOANH_THU','OPEX'],
        label: '💡 Mẹo nào cho các tiệm bắt trend thời sự kéo khách GenZ?',
        emotionOnSelect: 'HAPPY',
        reply: 'Cứ cắm bảng VietQR có in hình mèo meme cute, kèm câu slogan hài hước như "Quét mã đi chờ chi - Không quét ế cả đời" là tụi trẻ chụp hình up story rầm rộ liền!',
      },
      {
        id: 'baongoc-promo',
        financeTags: ['DOANH_THU','OPEX'],
        label: '🌟 Lên video quảng bá cho khu phố mình nha em!',
        emotionOnSelect: 'MONEY_EYES',
        rewardBonus: {
          coins: 20_000,
          reason: 'Bảo Ngọc trích hoa hồng video tài trợ phố',
        },
        particles: 'stars',
        reply: 'Nhận kèo liền Thị Trưởng ơi! Em sẽ làm series "MoCity đi là mê" giật tít triệu view, tặng Thị Trưởng 20.000đ tiền hoa hồng lan tỏa (+20.000đ)!',
      },
      {
        id: 'baongoc-tea',
        financeTags: ['THUONG'],
        label: '🧋 Tặng em 35.000đ mua ly trà sữa bồi dưỡng quay clip',
        cost: 35_000,
        emotionOnSelect: 'STAR_EYES',
        particles: 'coin',
        reply: 'U là trời! Thị Trưởng tâm lý đỉnh chóp! Em sẽ tag Thị Trưởng vào story khoe cả nước biết độ xịn sò của phố mình!',
      },
    ],
  },

  // 8. CHÚ BẢY HÀNG XÓM
  'cit-chu-bay': {
    id: 'cit-chu-bay',
    name: 'Chú Bảy Hàng Xóm',
    role: 'Tổ Trưởng Dân Phố',
    financeTheme: {
      tag: 'BAO_HIEM',
      title: 'Bảo hiểm và rủi ro',
      lesson:
        'Một cơn mưa bão phá hỏng tài sản không phải chuyện hiếm. Không có bảo hiểm thì thiệt hại trừ thẳng vào quỹ vận hành; có bảo hiểm thì chỉ chịu phần tự bảo lãnh, còn phần còn lại do công ty bảo hiểm bồi.',
    },
    greetings: [
      {
        text: 'Thị Trưởng! Chú vừa đi giải quyết vụ drama loa kéo karaoke nhà số 4 hát "Đắp mộ cuộc tình" lúc 11h đêm, bà con khiếu nại dữ quá!',
        emotion: 'SURPRISED',
      },
      {
        text: 'Thời sự cảnh báo bão số 3 sắp đổ bộ, chú đang đi nhắc từng nhà chằng chống mái tôn với tỉa cành cây vỉa hè nè Thị Trưởng!',
        emotion: 'HAPPY',
      },
      {
        text: 'Bữa nay công an phường triển khai định danh biển số xe máy với xử phạt nguội qua camera ngã tư, đường phố ngay ngắn hẳn ra!',
        emotion: 'STAR_EYES',
      },
      {
        text: 'Trời nắng chang chang mà mấy tiệm trà đá vỉa hè vẫn chật kín, chú nhắc bà con giữ gìn vệ sinh, không vứt tàn thuốc bừa bãi!',
        emotion: 'HAPPY',
      },
      {
        text: 'Thời sự xôn xao vụ phân loại rác thải tại nguồn, tổ dân phố mình vừa phát túi rác sinh học tái chế cho từng nhà rồi nghen!',
        emotion: 'HAPPY',
      },
    ],
    options: [
      {
        id: 'chubay-karaoke',
        financeTags: ['OPEX'],
        label: '🎤 Vụ loa kéo karaoke nửa đêm chú xử lý êm đẹp không?',
        emotionOnSelect: 'SLEEPY',
        reply: 'Chú tới vận động tình cảm: "Mấy chú hát hay nhưng để dành giọng mai thi Vietnam Idol, giờ cho bà con ngủ!". Thế là họ tắt loa, chuyển sang mở app MoMo nghe nhạc êm dịu, xóm làng lại yên bình!',
      },
      {
        id: 'chubay-storm',
        financeTags: ['BAO_HIEM','OPEX'],
        label: '🌪️ Công tác phòng chống mưa bão của tổ dân phố tới đâu rồi chú?',
        emotionOnSelect: 'HAPPY',
        reply: 'Chú kiểm tra 6 cột đèn đường và các biển hiệu rồi, kiên cố 100%! Có đường dây nóng cứu hộ trực 24/7 trên app, gió bão tới đâu tổ dân phố ứng phó tới đó!',
      },
      {
        id: 'chubay-traffic',
        financeTags: ['OPEX'],
        label: '🚗 Bà con khu mình chấp hành phạt nguội qua camera ra sao chú?',
        emotionOnSelect: 'ANGRY',
        reply: 'Từ ngày có đèn tín hiệu giao thông đếm số ở ngã tư, không ai dám vượt đèn đỏ nữa! Ai bị phạt là tra cứu nộp phạt trực tuyến trên MoMo luôn, tiện lợi minh bạch!',
      },
      {
        id: 'chubay-fund',
        financeTags: ['THUONG'],
        label: '🤝 Biếu chú 50.000đ đóng góp quỹ khuyến học của tổ',
        cost: 50_000,
        emotionOnSelect: 'STAR_EYES',
        particles: 'coin',
        reply: 'Hoan hô tấm lòng Thị Trưởng! Chú ghi sổ vàng truyền thống liền, cuối năm phát thưởng cho các cháu học sinh giỏi trong xóm!',
      },
      {
        id: 'chubay-security',
        financeTags: ['BAO_HIEM'],
        label: '📋 Tình hình an ninh trật tự chung dạo này thế nào chú?',
        emotionOnSelect: 'HAPPY',
        reply: 'An ninh đạt điểm 10 luôn Thị Trưởng! Đèn đường sáng trưng, xe cộ dừng đèn đỏ nghiêm túc, trộm cắp chạy mất dép khỏi khu mình!',
      },
    ],
  },

  // 9. BÁC TÀI XE ÔM
  'cit-bac-tai': {
    id: 'cit-bac-tai',
    name: 'Bác Tài Xe Ôm',
    role: 'Tài Xế Công Nghệ',
    financeTheme: {
      tag: 'LANH_VAY',
      title: 'Vay trả góp và lãi',
      lesson:
        'Mua xe bằng trả góp thì hàng tháng bác trả gồm cả tiền gốc lẫn tiền lãi. Tiền lãi không tạo ra xe mới, nó lấy đi một phần dòng tiền có thể dùng để sửa xe và nghỉ ngơi.',
    },
    greetings: [
      {
        text: 'Trời mưa ngập đường như sông Hương bến Ngự Thị Trưởng ơi, bác vừa cứu hộ đẩy xe chết máy cho một cô bé sinh viên xong nè!',
        emotion: 'TIRED',
      },
      {
        text: 'Thời sự đưa tin giá xăng vừa tăng thêm 500 đồng một lít, anh em tài xế xe ôm tụi bác lại đau đầu tính toán lộ trình tiết kiệm xăng!',
        emotion: 'TIRED',
      },
      {
        text: 'Sáng nay có vụ khách quỵt tiền cuốc xe 80k định bỏ chạy, may bác chụp được mã QR bảo hiểm chuyến đi nên tổng đài bồi hoàn liền!',
        emotion: 'SURPRISED',
      },
      {
        text: 'Trời nắng đổ lửa 40 độ ngoài đường mà như trong lò bát quái, may có mấy bình trà đá miễn phí trên phố mình cứu mạng anh em tài xế!',
        emotion: 'HAPPY',
      },
      {
        text: 'Thời sự đưa tin trạm thu phí cao tốc bỏ barie chuyển sang thu phí tự động không dừng ETC, bác chạy chở khách liên tỉnh mượt mà hẳn!',
        emotion: 'STAR_EYES',
      },
    ],
    options: [
      {
        id: 'bactai-rain',
        financeTags: ['OPEX'],
        label: '🌧️ Đường ngập nước vầy bác tài chạy xe có bí quyết gì không?',
        emotionOnSelect: 'HAPPY',
        reply: 'Bác giữ đều ga số thấp, canh né mấy chỗ ổ gà dưới nước! Khách đi xe của bác được trang bị áo mưa cánh dơi xịn, trả tiền quét mã chống ướt ví, ai cũng tip thêm 10k!',
      },
      {
        id: 'bactai-gasoline',
        financeTags: ['OPEX'],
        label: '⛽ Giá xăng dầu biến động vầy bác tiết kiệm chi phí kiểu gì?',
        emotionOnSelect: 'CRYING',
        reply: 'Bác dùng tính năng đổ xăng thanh toán PVOIL/Petrolimex trên MoMo tích điểm đổi voucher giảm 20.000đ mỗi bình! Tích tiểu thành đại, tháng cũng đỡ được cả triệu bạc đó Thị Trưởng!',
      },
      {
        id: 'bactai-ev',
        financeTags: ['CHI_TIEU_VON','LANH_VAY'],
        label: '🛵 Anh em tài xế dạo này có xu hướng đổi sang xe máy điện không bác?',
        emotionOnSelect: 'STAR_EYES',
        reply: 'Có chứ Thị Trưởng! Nhiều bác tài trẻ chuyển qua thuê xe máy điện chạy êm ru, sạc điện rẻ hơn xăng mà không khói bụi, phố mình thêm sạch đẹp văn minh!',
      },
      {
        id: 'bactai-gas',
        financeTags: ['OPEX'],
        label: '⛽ Biếu bác 50.000đ hỗ trợ bình xăng chạy xe',
        cost: 50_000,
        emotionOnSelect: 'STAR_EYES',
        particles: 'coin',
        reply: 'Chao ôi, bác cảm ơn Thị Trưởng nhiều lắm! Chúc Thị Trưởng luôn mạnh giỏi, đưa khu phố mình ngày một giàu đẹp nghen!',
      },
      {
        id: 'bactai-insurance',
        financeTags: ['BAO_HIEM'],
        label: '🛡️ Bác chạy xe cả ngày nhớ trang bị bảo hiểm xe máy nha',
        emotionOnSelect: 'HAPPY',
        reply: 'Dạ có chứ! Bác mua Bảo Hiểm Xe Máy Điện Tử trên MoMo luôn rồi, lưu sẵn trong app cảnh sát kiểm tra đưa ra là xong, an tâm 100%!',
      },
    ],
  },

  // 10. CHỊ HÀNG RONG
  'cit-chi-hang-rong': {
    id: 'cit-chi-hang-rong',
    name: 'Chị Hàng Rong',
    role: 'Gánh Xôi Đầu Ngõ',
    financeTheme: {
      tag: 'GIA_VON',
      title: 'Giá vốn hàng bán',
      lesson:
        'Gạo, lá, nếp, thùng chuối đều là giá vốn phải bỏ ra trước khi bán. Bán được nhiều xôi mà giá vốn tăng vọt thì lời mỏng, nên tăng giá bán luôn phải kèm theo đúng giá vốn.',
    },
    greetings: [
      {
        text: 'Dạ Thị Trưởng, sáng nay trời mưa phùn se lạnh, khách ghé mua xôi xéo xôi bắp nóng hổi đông nghẹt, em gói không kịp thở!',
        emotion: 'HAPPY',
      },
      {
        text: 'Thời sự đưa tin thực phẩm bẩn trôi nổi, gánh xôi của em gạo nếp nương lá dứa có chứng nhận nguồn gốc rõ ràng nên bà con tin tưởng lắm!',
        emotion: 'STAR_EYES',
      },
      {
        text: 'Úi chao, sáng nay có drama hai bà khách tranh nhau gói xôi gấc hạt sen cuối cùng, em phải đơm chia đôi mỗi người một nửa mới huề!',
        emotion: 'SURPRISED',
      },
      {
        text: 'Trời nắng gắt này em nấu thêm thúng chè đậu xanh hạt sen ướp lạnh, khách quét mã 15k là có ly chè mát rượi giải nhiệt tức thì!',
        emotion: 'HAPPY',
      },
      {
        text: 'Thời sự đưa tin chuyển đổi số gánh hàng rong, phóng viên đài truyền hình vừa ghé quay phóng sự gánh xôi quét mã QR của em đó Thị Trưởng!',
        emotion: 'STAR_EYES',
      },
    ],
    options: [
      {
        id: 'xoi-drama',
        financeTags: ['DOANH_THU'],
        label: '🔥 Vụ tranh nhau gói xôi gấc cuối cùng kết thúc vui vẻ chứ chị?',
        emotionOnSelect: 'HAPPY',
        reply: 'Dạ vui vẻ lắm! Hai cô ấy chia nhau nửa gói xôi xong ngồi ăn chung, tâm sự hồi kết nghĩa chị em luôn Thị Trưởng ơi, tình làng nghĩa xóm ấm áp ghê!',
      },
      {
        id: 'xoi-foodsafety',
        financeTags: ['GIA_VON'],
        label: '🍲 Thời tiết nắng nóng này đồ ăn dễ ôi thiu, chị bảo quản sao?',
        emotionOnSelect: 'HAPPY',
        reply: 'Em nấu tới đâu bán hết tới đó, dùng chõ hấp giữ nhiệt than sạch, lá chuối rửa nước muối tiệt trùng! Bán hàng có tâm thì trời thương, khách quét mã ủng hộ dài dài!',
      },
      {
        id: 'xoi-digital',
        financeTags: ['QR','DOANH_THU'],
        label: '💰 Thời buổi thanh toán số này chị bán gánh rong có tiện hơn không?',
        emotionOnSelect: 'STAR_EYES',
        reply: 'Hồi đầu em sợ không biết xài smartphone, mà cháu nó cài app MoMo dán cái mã QR trước quang gánh. Khách quét cái "ting", loa báo to rõ, tiền về tài khoản sinh lãi Túi Thần Tài luôn!',
      },
      {
        id: 'xoi-buy',
        financeTags: ['CHI_TIEU_VON'],
        label: '🎁 Mua ủng hộ chị gói xôi 30.000đ ăn sáng',
        cost: 30_000,
        emotionOnSelect: 'MONEY_EYES',
        rewardBonus: {
          coins: 15_000,
          reason: 'Chị Hàng Rong thối lại tiền lộc đầu ngày',
        },
        particles: 'coin',
        reply: 'Dạ em gói lá chuối nóng hổi, rắc thêm muối mè hành phi giòn rụm cho Thị Trưởng đây! Em gửi lại Thị Trưởng 15.000đ tiền lộc đầu ngày (+15.000đ) chúc may mắn!',
      },
      {
        id: 'xoi-dream',
        financeTags: ['TIET_KIEM'],
        label: '🌸 Ước mơ của chị cho gánh xôi sau này là gì?',
        emotionOnSelect: 'STAR_EYES',
        reply: 'Em ráng tích lũy tiền lời trong Túi Thần Tài, mai mốt thuê được cái mặt bằng nhỏ mở tiệm xôi truyền thống khang trang trên phố mình!',
      },
    ],
  },

  // 11. BÉ AN HỌC SINH
  'cit-be-an': {
    id: 'cit-be-an',
    name: 'Bé An Học Sinh',
    role: 'Học Sinh Cấp 2',
    financeTheme: {
      tag: 'THUONG',
      title: 'Tiền thưởng không phải doanh thu',
      lesson:
        'Tiền mẹ thưởng cuối tháng là tiền không kỳ vọng. Còn lãi từ Heo Đất hay khoản tiết kiệm mới là tiền do hành động của mình tạo ra, và chỉ tiền thứ hai mới lớn dần theo thời gian.',
    },
    greetings: [
      {
        text: 'Chú Thị Trưởng ơi! Hôm nay trời mưa to ngập sân trường, tụi con được nghỉ tiết thể dục ngồi trong lớp thi giải đố vui nè chú!',
        emotion: 'HAPPY',
      },
      {
        text: 'Tin nóng ở lớp con: Cả lớp đang sốt trào lưu nuôi Heo Đất MoMo thi xem ai để dành tiền tiêu vặt giỏi nhất đó chú!',
        emotion: 'STAR_EYES',
      },
      {
        text: 'Trời nắng nóng gay gắt mẹ dặn con đi học phải đội mũ bảo hiểm với đeo khẩu trang chống bụi mịn PM2.5 đó chú!',
        emotion: 'TIRED',
      },
      {
        text: 'Drama trường con: Bạn lớp trưởng bắt quả tang bạn bàn bên lén ăn vụng bim bim trong giờ học, bị phạt trực nhật quét lớp 1 tuần hihi!',
        emotion: 'SURPRISED',
      },
      {
        text: 'Thời sự đưa tin sắp có hội thi Sáng Tạo Khoa Học Trẻ, con đang chế mô hình đèn giao thông thông minh cho phố mình nè chú!',
        emotion: 'STAR_EYES',
      },
    ],
    options: [
      {
        id: 'bean-piggyrace',
        financeTags: ['TIET_KIEM','THUONG'],
        label: '🐷 Cuộc thi nuôi Heo Đất ở lớp con bạn nào đang dẫn đầu?',
        emotionOnSelect: 'STAR_EYES',
        reply: 'Dạ con đang top 2 đó chú! Mỗi ngày con nhịn ăn vặt 5k bỏ vô Heo Đất, cuối tháng được mẹ thưởng nhân đôi, con sắp đủ tiền mua bộ sách bách khoa toàn thư rồi!',
      },
      {
        id: 'bean-schoolrain',
        financeTags: ['OPEX'],
        label: '☔ Trời mưa ngập đường đi học tan trường có nguy hiểm không con?',
        emotionOnSelect: 'HAPPY',
        reply: 'Dạ vỉa hè phố mình cao ráo nên nước rút nhanh lắm! Có chú bảo vệ với chú công an đứng ngã tư dắt tụi con qua vạch kẻ đường an toàn 100% ạ!',
      },
      {
        id: 'bean-gamemocity',
        financeTags: ['THUONG'],
        label: '🎮 Dạo này các bạn học sinh có mê trò chơi điện tử gì không?',
        emotionOnSelect: 'STAR_EYES',
        reply: 'Tui con mê game MoCity này nè chú! Vừa học cách quy hoạch thành phố, vừa biết quản lý tài chính từ nhỏ, cô giáo con cũng khen game bổ ích nữa!',
      },
      {
        id: 'bean-milk',
        financeTags: ['GIA_VON'],
        label: '🧃 Cho con 20.000đ mua hộp sữa tươi uống ra chơi nè',
        cost: 20_000,
        emotionOnSelect: 'STAR_EYES',
        particles: 'coin',
        reply: 'Dạ con khoanh tay cảm ơn Chú Thị Trưởng nhiều ạ! Con sẽ học thật giỏi để sau này làm kỹ sư xây dựng phố xá to đẹp hơn nữa!',
      },
      {
        id: 'bean-heodat',
        financeTags: ['THUONG','TIET_KIEM'],
        label: '🚲 Tiền tiêu vặt con để dành trong Heo Đất được bao nhiêu rồi?',
        emotionOnSelect: 'MONEY_EYES',
        rewardBonus: {
          coins: 10_000,
          reason: 'Bé An chia sẻ lộc Heo Đất mập mạp',
        },
        particles: 'stars',
        reply: 'Dạ con để dành được hơn nửa chiếc xe đạp mới rồi chú! Con tặng chú 10.000đ lộc Heo Đất may mắn (+10.000đ), chúc chú luôn vui vẻ nha!',
      },
    ],
  },

  // 12. CÔ LINH DẠY THÊM
  'cit-co-linh': {
    id: 'cit-co-linh',
    name: 'Cô Linh Áo Dài',
    role: 'Cô Giáo Duyên Dáng',
    financeTheme: {
      tag: 'LOI_NHUAN',
      title: 'Lợi nhuận ròng',
      lesson:
        'Doanh thu trên giấy tờ không phải tiền còn lại trong túi. Trừ giá vốn, chi phí vận hành, lãi vay và thuế xong mới là lợi nhuận ròng, và đó mới là tiền nuôi được ngày mai.',
    },
    greetings: [
      {
        text: 'Em chào Thị Trưởng! Thời sự đưa tin kỳ thi tốt nghiệp và tuyển sinh đổi mới chương trình, phụ huynh đang lo lắng hỏi han em quá chừng!',
        emotion: 'HAPPY',
      },
      {
        text: 'Trời nắng nóng oi ả 40 độ các em học sinh đi học dễ mệt mỏi, em phải bật quạt mát và chuẩn bị nước chanh muối cho các em giải nhiệt.',
        emotion: 'TIRED',
      },
      {
        text: 'Dạo này trên mạng có drama lừa đảo "Con đang cấp cứu ở viện chuyển tiền gấp", em phải họp phụ huynh cảnh báo khẩn cấp ngay!',
        emotion: 'SURPRISED',
      },
      {
        text: 'Mùa mưa bão triều cường tới rồi, em chuyển một số buổi học sang hình thức trực tuyến để các em không phải lội nước nguy hiểm trên đường về.',
        emotion: 'HAPPY',
      },
      {
        text: 'Tin vui thời sự: Trường học quanh khu phố mình vừa nhận chứng nhận Chuyển Đổi Số đồngất Sắc, 100% học phí không dùng tiền mặt!',
        emotion: 'STAR_EYES',
      },
    ],
    options: [
      {
        id: 'colinh-scamwarn',
        financeTags: ['FRAUD'],
        label: '⚠️ Vụ lừa đảo "con đang cấp cứu" cô xử lý và cảnh báo phụ huynh ra sao?',
        emotionOnSelect: 'SURPRISED',
        reply: 'Em gửi thông báo yêu cầu phụ huynh tuyệt đối không chuyển tiền theo số lạ, chỉ liên lạc qua kênh nhà trường và số điện thoại giáo viên chủ nhiệm! Nhờ vậy lớp em không ai bị lừa gạt!',
      },
      {
        id: 'colinh-curriculum',
        financeTags: ['LOI_NHUAN'],
        label: '📚 Chương trình giáo dục mới có định hướng gì về tài chính cho học sinh không cô?',
        emotionOnSelect: 'STAR_EYES',
        reply: 'Có đó Thị Trưởng! Các em được học môn Giáo dục Kinh tế & Pháp luật từ cấp 2, hiểu về tiết kiệm, lạm phát và thanh toán số. Rất nhiều em áp dụng ngay qua việc quản lý chi tiêu trên app!',
      },
      {
        id: 'colinh-health',
        financeTags: ['OPEX'],
        label: '🌦️ Thời tiết giao mùa thất thường này cô có lời khuyên gì cho học sinh?',
        emotionOnSelect: 'HAPPY',
        reply: 'Trời chuyển mùa dễ bị cảm cúm sốt xuất huyết, các gia đình nhớ dọn dẹp lăng quăng, ăn chín uống sôi và giữ ấm cổ họng khi ra ngoài đường buổi sáng sớm!',
      },
      {
        id: 'colinh-tea',
        financeTags: ['THUONG'],
        label: '🍵 Mời cô ly trà hoa cúc 30.000đ thanh nhiệt nhuận giọng',
        cost: 30_000,
        emotionOnSelect: 'STAR_EYES',
        particles: 'coin',
        reply: 'Em cảm ơn Thị Trưởng nhiều lắm! Lời động viên của Thị Trưởng là nguồn năng lượng quý giá cho những người làm nghề giáo như tụi em!',
      },
      {
        id: 'colinh-books',
        financeTags: ['CHI_TIEU_VON'],
        label: '🏫 Khu phố mình cần thêm tiện ích gì cho giáo dục không cô?',
        emotionOnSelect: 'STAR_EYES',
        reply: 'Nếu có thể, em mong khu phố mở thêm một "Tủ Sách Cộng Đồng" ở vỉa hè để các em nhỏ có chỗ đọc sách miễn phí mỗi buổi chiều!',
      },
    ],
  },
  // 13. ANH BA - NGƯỜI NGỒI VỈA HÈ
  /*
   * Nhan vat duy nhat khong phai khach hang. Khong co tiem, khong co hang,
   * khong co doanh thu - chi co cau chuyen ve cai khong co duoc quy du phong.
   *
   * `financeTheme` van la TIET_KIEM vi do bai hoc that cua nhan vat nay: khong
   * phai "lam sao tien sinh loi" ma "khong co tien du thi mot bien co nho cung
   * dua ban ra duong". Day la mat xoay nguoc cua cung mot quy tuyen, va no
   * giup hai ben cua quyen doc la mot.
   *
   * `rewardBonus` la VI: anh Ba dua lai mot dong loc trong bat - tien ba con
   * thuong cho anh, anh chia mot it cho thi truong. Noi qua `claimTapReward`
   * (chay vao `totalTapIncome`), KHONG qua `recordTransactions`: cho tien la
   * chi tieu ca nhan cua thi truong, khong phai doanh thu cua khoi.
   */
  'cit-an-xin': {
    id: 'cit-an-xin',
    name: 'Anh Ba',
    role: 'Ngồi Vỉa Hè',
    financeTheme: {
      tag: 'AN_SINH',
      title: 'Quỹ dự phòng',
      lesson:
        'Anh Ba từng có tiệm. Một trận ốm, một khoản nợ không trả kịp, và chỗ ngồi trên vỉa hè thay cho quầy thu ngân. Trích 10-20% thu nhập vào quỹ khẩn cấp TRƯỚC khi nghĩ tới đầu tư: quỹ đó không sinh lời, nhưng nó giữ bạn khỏi rơi xuống đây.',
    },
    greetings: [
      {
        text: 'Thị Trưởng sáng sớm đã đi kiểm phố rồi à? Tui ngồi đây suốt đêm, phố mình sáng lên từng ngày thật.',
        emotion: 'TIRED',
      },
      {
        text: 'Bát tui giờ không nặng như hôm qua nữa, được mấy cháu trong xóm để vào mấy đồng lộc.',
        emotion: 'HAPPY',
      },
      {
        text: 'Trời nắng gắt quá, ngồi đây cả đêm người rã rời, Thị Trưởng có thừa ngụm nước nào không?',
        emotion: 'CRYING',
      },
      {
        text: 'Ngày trước tui cũng đứng bán sau quầy y như mấy anh chị kia. Giờ thì chỉ còn biết nhìn.',
        emotion: 'SLEEPY',
      },
    ],
    options: [
      {
        id: 'anxin-ask',
        financeTags: ['AN_SINH'],
        label: '🗣️ Sáng nay anh đã ăn gì chưa ạ?',
        emotionOnSelect: 'CRYING',
        reply:
          'Từ tối qua tới giờ chưa có gì vào bụng. Bà cụ bán bánh mì đầu chợ thấy tui thì dúi cho một ổ, tui bẻ đôi chia lại cho ông cụ cũng đang chờ ở bên kia. Xã hội chẳng giàu, nhưng cái ổ bánh thì chia được.',
      },
      {
        id: 'anxin-bread',
        financeTags: ['AN_SINH'],
        label: '🥖 Biếu anh 20.000đ mua ổ bánh mì',
        cost: 20_000,
        emotionOnSelect: 'MONEY_EYES',
        rewardBonus: {
          coins: 10_000,
          reason: 'Anh Ba chia lại đồng lộc trong bát',
        },
        particles: 'coin',
        reply:
          'Trời ơi cảm ơn Thị Trưởng! 20.000đ mua được hai ổ, tui ăn một ổ, ổ kia để dành trưa. Bát tui có vài đồng bà con thương, tui để lại 10.000đ lộc cho Thị Trưởng, cầu chúc làm ăn thuận buồm xuôi gió! (+10.000đ)',
      },
      {
        id: 'anxin-coin',
        financeTags: ['THUONG'],
        label: '🪙 Cho anh 10.000đ tiền lẻ',
        cost: 10_000,
        emotionOnSelect: 'HAPPY',
        rewardBonus: {
          coins: 5_000,
          reason: 'Đồng lộc tí hon từ bát xin',
        },
        particles: 'coin',
        reply:
          'Được 10.000đ tui mừng lắm rồi Thị Trưởng ơi. Đủ mua nắm cơm tấm bên chợ. Tui lật bát lấy lại 5.000đ lộc - của ít lòng nhiều, nhận lộc rồi làm ăn mau phát đấy! (+5.000đ)',
      },
      {
        id: 'anxin-why',
        financeTags: ['NPL'],
        label: '😟 Vì sao anh lại ra nông nỗi này?',
        emotionOnSelect: 'TIRED',
        reply:
          'Hồi đó tui có tiệm tạp hoá nho nhỏ. Ổn tới khi mẹ ốm nặng, tiền thuốc bay hết, tui vay nóng để xoay, rồi lãi mẹ đẻ lãi con. Bán tiệm vẫn không đủ trả. Bài học của tui đắt lắm: giữ sẵn vài tháng chi tiêu phòng thân, đừng bao giờ để mạng sống của mình phụ thuộc vào một khoản vay.',
      },
      {
        id: 'anxin-job',
        financeTags: ['AN_SINH'],
        label: '🌿 Biết chỗ nào cần người nhặt ve chai không anh?',
        emotionOnSelect: 'STAR_EYES',
        reply:
          'Có! Đầu chợ mỗi sáng có cô gánh ve chai, quét sạch ve chai chai lọ khu mình rồi chở đi bán. Tui tính xin vào phụ khi nào khoẻ lại. Sức vẫn còn thì vẫn còn cách, Thị Trưởng nhỉ?',
      },
    ],
  },

  /**
   * CO GANH VE CHAI - khach hang NHUNG khong phai khach hang cua tiem.
   *
   * Anh Ba ngoi xin thi khong doi xuc gi. Co Hai la nguoi DI VE: mang phelieu
   * ban lay tien mat ngay trong ngay, van co the vao tiem mua duoc, nen van
   * di bo va van xep hang duoc. `speed: 0.17` - cham nhat pho vi dang GANH,
   * khong phai dang di dao.
   *
   * Chu de RIENG `THANH_KHOAN`, khong dung lai tren TIET_KIEM: tiet kiem hoi
   * "de danh bao nhieu", thanh khoan hoi "rut ra duoc luc nao". Ca thu hai
   * chinh la cau lam nguoi ta vo no, va co Hai la nguoi minh hoa cho no.
   *
   * `rewardBonus` hop le o day: THANH_KHOAN khong nam trong nhom rui ro lon
   * (NPL/FRAUD/BAO_HIEM/LANH_VAY) nen khong bi cam tra tien thuong.
   */
  'cit-co-ve-chai': {
    id: 'cit-co-ve-chai',
    name: 'Cô Hai',
    role: 'Gánh Ve Chai',
    financeTheme: {
      tag: 'THANH_KHOAN',
      title: 'Thanh khoản',
      lesson:
        'Ve chai bán trong ngày là có tiền liền, không ai chịu để hàng ứ trong kho chờ lên giá. Thanh khoản - mức độ đổi ra tiền mặt nhanh mà không mất giá - quan trọng ngang lãi suất: tiền gắn chặt trong hàng hoá, bất động sản hay kỳ hạn dài thì lúc cần chi tiêu sẽ không rút ra kịp, và đó chính là lúc người ta phải vay nóng với lãi cắt cổ.',
    },
    greetings: [
      {
        text: 'Chào Thị Trưởng! Sáng nay gánh nặng hơn mọi ngày, mấy thùng carton đầu chợ đầy ắp.',
        emotion: 'HAPPY',
      },
      {
        text: 'Giá phế liệu giờ niêm yết đàng hoàng đấy, thế giới lên thì bà con mình sống theo.',
        emotion: 'SMUG',
      },
      {
        text: 'Đi cả buổi mới gom được một gánh. Tiền vào túi là còn tiền, bỏ trong kho thì chưa.',
        emotion: 'TIRED',
      },
      {
        text: 'Nghề này trông nhếch nhác mà tiền quay vòng nhanh lắm, chốt mối là có ngay.',
        emotion: 'STAR_EYES',
      },
    ],
    options: [
      {
        id: 'vechai-ask',
        financeTags: ['THANH_KHOAN'],
        label: '🌿 Hôm nay gánh được gì rồi cô?',
        emotionOnSelect: 'HAPPY',
        reply:
          'Đủ một gánh chai nhựa, nửa gánh sắt vụn với mấy thùng carton. Đem cân đầu chợ là ra tiền liền, không chờ ai duyệt, không chờ kỳ tất toán. Nghề cô nghèo nhưng không bao giờ mắc nợ vì tiền nằm ứ trong kho.',
      },
      {
        id: 'vechai-buy',
        financeTags: ['THANH_KHOAN'],
        label: '📦 Mua một bọc giấy vụn 20.000đ',
        cost: 20_000,
        emotionOnSelect: 'MONEY_EYES',
        rewardBonus: {
          coins: 10_000,
          reason: 'Cô Hai cho thêm mẩu sắt nhẹ',
        },
        particles: 'coin',
        reply:
          'Cô lấy 20.000đ thôi, thêm cái mẩu sắt này nữa coi như lộc. Giấy cô cân bán đầu chợ là có tiền ngay, không ứ lại đồng nào. (+10.000đ)',
      },
      {
        id: 'vechai-price',
        financeTags: ['DOANH_THU'],
        label: '📉 Vì sao hôm nay giá giấy lại thấp vậy cô?',
        emotionOnSelect: 'TIRED',
        reply:
          'Giá phế liệu bám theo giá thế giới, có tuần lên có tuần tụt không lý do. Cả đời cô bán theo giá người ta niêm yết, không bao giờ đặt được giá của mình. Bài học của dân làm nghề này: doanh thu phụ thuộc thị trường thì phải tính cả tuần ế, chứ không được chỉ tính ngày đẹp trời.',
      },
      {
        id: 'vechai-hold',
        financeTags: ['THANH_KHOAN'],
        label: '🏦 Sao cô không để dành chờ giá lên rồi mới bán?',
        emotionOnSelect: 'SMUG',
        reply:
          'Có người khuyên cô như vậy đấy. Nhưng để thêm tháng nữa thì gánh đầy nhà, ẩm mốc mối mọt đi hết giá, còn tiền thuốc cho cháu thì không chờ được. Bán lỗ còn hơn ứ hàng: tiền cầm tay mới là tiền, hàng để trong kho chỉ là niềm tin.',
      },
      {
        id: 'vechai-tip',
        financeTags: ['THUONG'],
        label: '💛 Bo cô 30.000đ cho đỡ nặng gánh',
        cost: 30_000,
        emotionOnSelect: 'STAR_EYES',
        rewardBonus: {
          coins: 15_000,
          reason: 'Cô Hai mời lại lon nước',
        },
        particles: 'coin',
        reply:
          'Trời ơi cảm ơn Thị Trưởng! Cô xin 15.000đ lon nước lại đây, đi gánh cả ngày khát lắm. Tiền cô cũng quay vòng cả ngày rồi - nhận của người ta rồi lại trả cho người ta, phố mình nó vậy. (+15.000đ)',
      },
    ],
  },
  'cit-co-lao-cong': {
    id: 'cit-co-lao-cong',
    name: 'Cô Sáu Lao Công',
    role: 'Vệ Sinh Môi Trường',
    financeTheme: {
      tag: 'BAO_TRI',
      title: 'Bảo trì & Khấu hao',
      lesson:
        'Cơ sở vật chất vỉa hè, nắp cống, thùng rác đô thị qua thời gian đều bị hao mòn và xuống cấp. Nếu không trích quỹ bảo trì và giữ gìn vệ sinh định kỳ, chi phí thay mới toàn bộ sẽ đắt gấp bội phần.',
    },
    greetings: [
      {
        text: 'Dạ chào Thị Trưởng! Sáng nào cô cũng quét từ đầu hẻm tới bờ kênh, phố sạch là lòng nhẹ nhõm.',
        emotion: 'HAPPY',
      },
      {
        text: 'Trời nắng 40 độ quét vỉa hè mồ hôi ướt đẫm lưng, nhưng thấy bà con buôn bán tấp nập là vui!',
        emotion: 'TIRED',
      },
      {
        text: 'Mưa triều cường rác nghẹt miệng cống, cô vừa khơi thông xong nước mới chịu rút đấy chú ơi.',
        emotion: 'SURPRISED',
      },
      {
        text: 'Bà con dạo này có ý thức phân loại rác hơn rồi, quét dọn đỡ cực hẳn một nửa!',
        emotion: 'STAR_EYES',
      },
    ],
    options: [
      {
        id: 'laocong-ask',
        financeTags: ['BAO_TRI'],
        label: '🧹 Quét dọn cả phố mỗi ngày có vất vả lắm không cô?',
        emotionOnSelect: 'HAPPY',
        reply:
          'Vất vả chứ chú, nhưng đường phố không quét một ngày là rác ngập, cống tắc, hàng quán mất khách liền. Giữ gìn vệ sinh chính là bảo vệ tài sản công cộng của cả đô thị mình đó!',
      },
      {
        id: 'laocong-water',
        financeTags: ['THUONG'],
        label: '🥤 Biếu cô 20.000đ mua nước mía giải nhiệt',
        cost: 20_000,
        emotionOnSelect: 'STAR_EYES',
        rewardBonus: {
          coins: 10_000,
          reason: 'Cô Sáu tặng nụ cười phúc hậu',
        },
        particles: 'stars',
        reply:
          'Trời ơi cảm ơn Thị Trưởng quý hóa quá! Có ly nước mía mát lạnh này là cô đủ sức quét nốt đoạn phố ẩm thực chiều nay rồi. Chúc phố mình buôn may bán đắt nghen! (+10.000đ)',
      },
      {
        id: 'laocong-drain',
        financeTags: ['BAO_TRI'],
        label: '🕳️ Nắp cống với thùng rác dạo này hay bị hỏng hóc quá cô nhỉ?',
        emotionOnSelect: 'TIRED',
        reply:
          'Đúng rồi chú, đồ công cộng nắng mưa dãi dầu mau rỉ sét lắm. Nếu tuần nào cũng kiểm tra bảo trì tra dầu thì xài được năm mười năm, chứ để gãy nát rồi mới thay mới thì tốn kém ngân sách gấp mấy lần.',
      },
      {
        id: 'laocong-sort',
        financeTags: ['OPEX'],
        label: '♻️ Phân loại rác tại nguồn giúp giảm chi phí gì vậy cô?',
        emotionOnSelect: 'SMUG',
        reply:
          'Bà con tách chai nhựa giấy vụn riêng cho cô Ve Chai, rác hữu cơ bỏ đúng thùng thì xe gom chỉ cần chạy một chuyến. Vừa giảm xăng xe vận chuyển, vừa hạ chi phí vận hành xử lý rác cho cả thành phố!',
      },
    ],
  },
};
