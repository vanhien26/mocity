/**
 * HỆ THỐNG KỊCH BẢN ĐỐI THOẠI CƯ DÂN ĐƯỜNG PHỐ (CITIZEN DIALOGUE SCENARIOS)
 * Bổ sung toàn diện: DRAMA góc phố, TÌNH HÌNH THỜI TIẾT (nắng nóng, mưa ngập, nồm ẩm, se lạnh)
 * và THỜI SỰ XÃ HỘI (sinh trắc học, giá vàng, bão giá xăng, vé tàu Tết, phạt nguội camera,
 * công nghệ 5G, không dùng tiền mặt) cho 12 cư dân đường phố MoCity.
 */

export type FacialEmotion = 'HAPPY' | 'STAR_EYES' | 'SURPRISED' | 'TIRED';

export interface CitizenDialogueOption {
  id: string;
  label: string;
  cost?: number; // Số Xu Thị Trưởng biếu/tặng, mặc định 0 (miễn phí)
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
  | 'THUONG';

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
        label: '☕ Mời đồng chí ly cà phê 30 Xu bồi dưỡng',
        cost: 30,
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
          coins: 20,
          reason: 'Cô Tư biếu đĩa chả giò giòn rụm lót dạ',
        },
        particles: 'stars',
        reply: 'Tối nay cô làm lẩu cá kèo lá giang với chả giò! Cô biếu Thị Trưởng đĩa chả giò ăn lấy thảo (+20 Xu), bữa nào rảnh ghé cô đãi ăn cơm nghen!',
      },
      {
        id: 'cotu-gift',
        financeTags: ['THUONG'],
        label: '🧧 Biếu cô 50 Xu mua thêm hoa quả tráng miệng',
        cost: 50,
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
      title: 'Trả sau và nợ xấu',
      lesson:
        'Mua trước trả sau giúp bạn có tiện ngay lúc này, nhưng tổng dư nợ chính là chi phí tương lai của thành phố. Cấp hạn mức vượt khả năng trả thì tỷ lệ nợ xấu ăn thẳng vào lợi nhuận.',
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
        reply: 'Full topping trân châu phô mai nướng mà săn deal MoMo có 1 Xu, ngon nhức nách luôn Thị Trưởng ơi! Nhưng mà tháng nào em cũng trả sau hết, lãi quay về cắn vào ví á!',
      },
      {
        id: 'benam-hotpot',
        label: '🍕 Tặng em 40 Xu rủ nhóm bạn liên hoan lẩu',
        cost: 40,
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
        label: '☕ Mời chị ly cà phê muối 30 Xu chống buồn ngủ',
        cost: 30,
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
        label: '🍵 Biếu ông 30 Xu uống ly trà đá nghỉ chân',
        cost: 30,
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
        label: '☕ Mời ly cà phê đen đá 30 Xu cho tỉnh táo',
        cost: 30,
        emotionOnSelect: 'STAR_EYES',
        particles: 'coin',
        reply: 'Trời ơi cứu tinh đời em! Cà phê đậm đặc này tương đương với 200 dòng code sạch không lỗi! Cảm ơn Thị Trưởng nhiều!',
      },
      {
        id: 'hoang-finance',
        financeTags: ['TIET_KIEM','LOI_NHUAN'],
        label: '💸 Dân IT quản lý tài chính thế nào để không cháy túi?',
        emotionOnSelect: 'HAPPY',
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
        emotionOnSelect: 'STAR_EYES',
        rewardBonus: {
          coins: 20,
          reason: 'Bảo Ngọc trích hoa hồng video tài trợ phố',
        },
        particles: 'stars',
        reply: 'Nhận kèo liền Thị Trưởng ơi! Em sẽ làm series "MoCity đi là mê" giật tít triệu view, tặng Thị Trưởng 20 Xu tiền hoa hồng lan tỏa (+20 Xu)!',
      },
      {
        id: 'baongoc-tea',
        financeTags: ['THUONG'],
        label: '🧋 Tặng em 30 Xu mua ly trà sữa bồi dưỡng quay clip',
        cost: 30,
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
        emotionOnSelect: 'HAPPY',
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
        emotionOnSelect: 'STAR_EYES',
        reply: 'Từ ngày có đèn tín hiệu giao thông đếm số ở ngã tư, không ai dám vượt đèn đỏ nữa! Ai bị phạt là tra cứu nộp phạt trực tuyến trên MoMo luôn, tiện lợi minh bạch!',
      },
      {
        id: 'chubay-fund',
        financeTags: ['THUONG'],
        label: '🤝 Biếu chú 50 Xu đóng góp quỹ khuyến học của tổ',
        cost: 50,
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
        emotionOnSelect: 'HAPPY',
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
        label: '⛽ Biếu bác 40 Xu hỗ trợ bình xăng chạy xe',
        cost: 40,
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
        label: '🎁 Mua ủng hộ chị gói xôi 30 Xu ăn sáng',
        cost: 30,
        emotionOnSelect: 'STAR_EYES',
        rewardBonus: {
          coins: 15,
          reason: 'Chị Hàng Rong thối lại tiền lộc đầu ngày',
        },
        particles: 'coin',
        reply: 'Dạ em gói lá chuối nóng hổi, rắc thêm muối mè hành phi giòn rụm cho Thị Trưởng đây! Em gửi lại Thị Trưởng 15 Xu tiền lộc đầu ngày (+15 Xu) chúc may mắn!',
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
        label: '🧃 Cho con 20 Xu mua hộp sữa tươi uống ra chơi nè',
        cost: 20,
        emotionOnSelect: 'STAR_EYES',
        particles: 'coin',
        reply: 'Dạ con khoanh tay cảm ơn Chú Thị Trưởng nhiều ạ! Con sẽ học thật giỏi để sau này làm kỹ sư xây dựng phố xá to đẹp hơn nữa!',
      },
      {
        id: 'bean-heodat',
        financeTags: ['THUONG','TIET_KIEM'],
        label: '🚲 Tiền tiêu vặt con để dành trong Heo Đất được bao nhiêu rồi?',
        emotionOnSelect: 'STAR_EYES',
        rewardBonus: {
          coins: 10,
          reason: 'Bé An chia sẻ lộc Heo Đất mập mạp',
        },
        particles: 'stars',
        reply: 'Dạ con để dành được hơn nửa chiếc xe đạp mới rồi chú! Con tặng chú 10 Xu lộc Heo Đất may mắn (+10 Xu), chúc chú luôn vui vẻ nha!',
      },
    ],
  },

  // 12. CÔ LINH DẠY THÊM
  'cit-co-linh': {
    id: 'cit-co-linh',
    name: 'Cô Linh Dạy Thêm',
    role: 'Giáo Viên',
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
        text: 'Tin vui thời sự: Trường học quanh khu phố mình vừa nhận chứng nhận Chuyển Đổi Số Xuất Sắc, 100% học phí không dùng tiền mặt!',
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
        label: '🍵 Mời cô ly trà hoa cúc 30 Xu thanh nhiệt nhuận giọng',
        cost: 30,
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
};
