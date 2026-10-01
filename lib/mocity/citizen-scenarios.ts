/**
 * HỆ THỐNG KỊCH BẢN ĐỐI THOẠI CƯ DÂN ĐƯỜNG PHỐ (CITIZEN DIALOGUE SCENARIOS)
 * Cung cấp kịch bản phong phú, câu chuyện nghề nghiệp, tâm lý đời sống và
 * tình huống tương tác thực tế giữa Thị Trưởng và 12 cư dân đường phố MoCity.
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
}

export interface CitizenScriptData {
  id: string;
  name: string;
  role: string;
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
    greetings: [
      {
        text: 'Báo cáo Thị Trưởng! Tui vừa đi kiểm tra một vòng quy hoạch từ đầu phố đến cuối ngã tư, mọi thứ đều chỉn chu!',
        emotion: 'HAPPY',
      },
      {
        text: 'Kính chào Thị Trưởng! Hồ sơ mở rộng phố đi bộ và nâng cấp đèn chiếu sáng đã được bà con nhất trí 100%!',
        emotion: 'STAR_EYES',
      },
      {
        text: 'Thị Trưởng đi thị sát ạ? Hôm nay lưu lượng người đi bộ và xe cộ lưu thông qua ngã tư rất nhịp nhàng!',
        emotion: 'HAPPY',
      },
      {
        text: 'Dạ Thị Trưởng! Tui đang ghi nhận các ý kiến đóng góp của tiểu thương về việc phủ sóng mã QR toàn phố!',
        emotion: 'HAPPY',
      },
    ],
    options: [
      {
        id: 'asst-report',
        label: '📊 Báo cáo nhanh tình hình phố xá hôm nay',
        emotionOnSelect: 'HAPPY',
        reply: 'Chỉ số an ninh đạt chuẩn, 6 cột đèn đường hoạt động 100%, các tiệm kinh doanh đều báo doanh số tăng đều nhờ khách quét mã MoMo nhanh chóng!',
      },
      {
        id: 'asst-plan',
        label: '🏙️ Kế hoạch nâng cấp tiếp theo là gì?',
        emotionOnSelect: 'STAR_EYES',
        reply: 'Tui đề xuất phủ xanh thêm bồn hoa vỉa hè và mở thêm các quầy thanh toán tự động để khách tham quan tiện trải nghiệm không dùng tiền mặt.',
      },
      {
        id: 'asst-finance',
        label: '📈 Ngân khố và dòng tiền khu phố thế nào?',
        emotionOnSelect: 'HAPPY',
        reply: 'Dòng tiền xoay vòng rất lành mạnh! Nhờ bà con dùng Túi Thần Tài và thanh toán số nên không có hiện tượng nợ xấu hay thất thoát.',
      },
      {
        id: 'asst-coffee',
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
    greetings: [
      {
        text: 'Úi chao Thị Trưởng! Cô vừa đi một vòng gom được cả giỏ đồ tươi ngon giá siêu hời nè!',
        emotion: 'STAR_EYES',
      },
      {
        text: 'Chào Thị Trưởng nghen! Hôm nay app MoMo tung bão voucher hoàn tiền chợ truyền thống, cô chớp thời cơ liền!',
        emotion: 'HAPPY',
      },
      {
        text: 'Thị Trưởng đi dạo mát hả? Để cô coi bữa nay tiệm bách hóa có gì mới để mách cho Thị Trưởng!',
        emotion: 'HAPPY',
      },
      {
        text: 'May quá gặp Thị Trưởng! Phố mình vỉa hè sạch sẽ, đẩy xe đi chợ nhẹ tênh, sướng cái chân ghê!',
        emotion: 'HAPPY',
      },
    ],
    options: [
      {
        id: 'cotu-deal',
        label: '🥦 Hôm nay cô săn được deal gì hot nhất?',
        emotionOnSelect: 'STAR_EYES',
        reply: 'Trời ơi, voucher giảm 30% rau củ quả với hoàn tiền 10.000đ khi quét MoMo! Tiết kiệm được một mớ tiền chợ cả tuần luôn con!',
      },
      {
        id: 'cotu-qr',
        label: '🛒 Đi chợ không xài tiền mặt có tiện không cô?',
        emotionOnSelect: 'HAPPY',
        reply: 'Tiện số một luôn Thị Trưởng! Mấy bà bán cá bán rau giờ dán mã QR hết, khỏi sợ tay ướt móc tiền lẻ dơ hầy lại sợ thối nhầm!',
      },
      {
        id: 'cotu-dinner',
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
    greetings: [
      {
        text: 'Hế lô Thị Trưởng! Em vừa cày xong đồ án, đang ra phố hóng gió hút ly trà sữa nạp đường nè!',
        emotion: 'HAPPY',
      },
      {
        text: 'Chào Thị Trưởng ngầu lòi! Cả nhóm sinh viên trường em ai cũng mê tít khu phố MoCity này!',
        emotion: 'STAR_EYES',
      },
      {
        text: 'Yo Thị Trưởng! Em đang canh flash sale săn vé xem phim MoMo Cinema giá 1 Xu đây!',
        emotion: 'HAPPY',
      },
      {
        text: 'Thị Trưởng ơi! Phố mình có trạm 5G căng đét, ngồi quán cóc làm bài tập mượt mà không delay miếng nào!',
        emotion: 'STAR_EYES',
      },
    ],
    options: [
      {
        id: 'benam-milktea',
        label: '🧋 Ly trà sữa hôm nay thế nào rồi em?',
        emotionOnSelect: 'HAPPY',
        reply: 'Full topping trân châu phô mai nướng mà săn deal MoMo có 1 Xu, ngon nhức nách luôn Thị Trưởng ơi!',
      },
      {
        id: 'benam-cinema',
        label: '🎬 Dạo này rạp MoCity có phim gì hay không?',
        emotionOnSelect: 'STAR_EYES',
        reply: 'Có bom tấn siêu anh hùng mới ra đó Thị Trưởng! Đặt vé trên app chọn được ghế Sweetbox xịn xò với bắp rang bơ phô mai thơm lừng!',
      },
      {
        id: 'benam-paylater',
        label: '💰 Sinh viên cuối tháng có bị viêm màng túi không?',
        emotionOnSelect: 'HAPPY',
        reply: 'Có Ví Trả Sau trợ lực nên em khỏi lo ăn mì gói! Đầu tháng làm thêm nhận lương là thanh toán đúng hạn, điểm tín dụng tăng vèo vèo!',
      },
      {
        id: 'benam-hotpot',
        label: '🍕 Tặng em 40 Xu rủ nhóm bạn liên hoan lẩu',
        cost: 40,
        emotionOnSelect: 'STAR_EYES',
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
    greetings: [
      {
        text: 'Chào Thị Trưởng! Vừa kết thúc buổi họp căng thẳng, em phải ra phố đi bộ hít thở xả stress liền nè!',
        emotion: 'HAPPY',
      },
      {
        text: 'A Thị Trưởng! Em vừa nhận được thông báo tiền lời Túi Thần Tài sáng nay, vui cả ngày luôn!',
        emotion: 'STAR_EYES',
      },
      {
        text: 'Dạ chào Thị Trưởng! Em đang tranh thủ giờ nghỉ trưa đi dạo săn deal cơm trưa văn phòng trên phố!',
        emotion: 'HAPPY',
      },
      {
        text: 'Thị Trưởng dạo phố ạ? Tụi em làm văn phòng quanh đây ai cũng thích vỉa hè rộng rãi, đi bộ vừa khỏe vừa tích Xu!',
        emotion: 'HAPPY',
      },
    ],
    options: [
      {
        id: 'thao-work',
        label: '💼 Công việc văn phòng đợt này bận không chị?',
        emotionOnSelect: 'HAPPY',
        reply: 'Chạy KPI dí deadline dữ lắm Thị Trưởng ơi, nhưng trưa được ra phố ăn bát phở, uống ly sinh tố là nạp đầy pin chiến tiếp!',
      },
      {
        id: 'thao-tuithantai',
        label: '📈 Túi Thần Tài dạo này tích lũy ngon lành chứ?',
        emotionOnSelect: 'STAR_EYES',
        reply: 'Dạ ngon lành lắm! Tiền nhàn rỗi cứ để trong đó, mỗi ngày sinh lời tự động, tích tiểu thành đại cuối năm có chuyến du lịch luôn!',
      },
      {
        id: 'thao-coffee',
        label: '☕ Mời chị ly cà phê muối 30 Xu chống buồn ngủ',
        cost: 30,
        emotionOnSelect: 'STAR_EYES',
        particles: 'coin',
        reply: 'Ôi cảm ơn Thị Trưởng nhiều nha! Cà phê chuẩn vị, em về văn phòng gõ máy tính thoăn thoắt chốt hợp đồng liền!',
      },
      {
        id: 'thao-wish',
        label: '💡 Dân văn phòng cần khu phố hỗ trợ thêm gì không?',
        emotionOnSelect: 'HAPPY',
        reply: 'Thêm vài quầy máy bán nước tự động quét QR với trạm sạc điện thoại ở vỉa hè là 10 điểm không có nhưng luôn Thị Trưởng!',
      },
    ],
  },

  // 5. ÔNG LỘC VÉ SỐ
  'cit-ong-loc': {
    id: 'cit-ong-loc',
    name: 'Ông Lộc Vé Số',
    role: 'Thần Tài Góc Phố',
    greetings: [
      {
        text: 'Kính chào Thị Trưởng! Ông vừa đi một vòng bờ kè, gặp Thị Trưởng là điềm lành may mắn lắm đây!',
        emotion: 'HAPPY',
      },
      {
        text: 'A Thị Trưởng! Chiều nay đài sổ có cặp số đẹp lắm, ông chừa sẵn cho bà con rồi nè!',
        emotion: 'STAR_EYES',
      },
      {
        text: 'Chào Thị Trưởng nghen! Nhờ phố xá yên bình, sáng sủa nên ông già này đi bộ bán vé số thấy khỏe khoắn trong người hẳn!',
        emotion: 'HAPPY',
      },
      {
        text: 'Thị Trưởng ghé chơi! Người tốt việc tốt như Thị Trưởng thì phúc lộc đầy nhà, phố xá thịnh vượng!',
        emotion: 'HAPPY',
      },
    ],
    options: [
      {
        id: 'ongloc-ticket',
        label: '🎫 Hôm nay còn vé số đài nào thế ông?',
        emotionOnSelect: 'STAR_EYES',
        rewardBonus: {
          coins: 25,
          reason: 'Ông Lộc tặng vé số đuôi Thần Tài may mắn',
        },
        particles: 'stars',
        reply: 'Còn mấy tờ đuôi 68 Lộc Phát với 79 Thần Tài nè Thị Trưởng! Ông tặng Thị Trưởng 1 tờ lấy hên (+25 Xu), chiều nay nổ giải độc đắc nha!',
      },
      {
        id: 'ongloc-walk',
        label: '🚶 Đi bộ cả ngày chân cẳng có mỏi không ông?',
        emotionOnSelect: 'HAPPY',
        reply: 'Nhờ bật tính năng Đi Bộ Cùng MoMo đó Thị Trưởng, vừa vận động gân cốt vừa đổi được thức ăn nuôi Heo Vàng, già rồi mà mê lắm!',
      },
      {
        id: 'ongloc-tea',
        label: '🍵 Biếu ông 30 Xu uống ly trà đá nghỉ chân',
        cost: 30,
        emotionOnSelect: 'STAR_EYES',
        particles: 'coin',
        reply: 'Chà, quý hóa quá! Ông cảm ơn Thị Trưởng! Cầu chúc Thị Trưởng bình an, vạn sự hanh thông, lộc tài như nước!',
      },
      {
        id: 'ongloc-history',
        label: '📜 Ông sống ở đây lâu, thấy phố mình đổi thay ra sao?',
        emotionOnSelect: 'HAPPY',
        reply: 'Hồi xưa tối tăm ổ gà ổ voi, giờ đèn đường sáng trưng, tiệm tùng tấp nập, thanh toán quét cái "bíp" là xong, văn minh hiện đại như phố Tây!',
      },
    ],
  },

  // 6. ANH HOÀNG IT
  'cit-anh-hoang': {
    id: 'cit-anh-hoang',
    name: 'Anh Hoàng IT',
    role: 'Kỹ Sư Phần Mềm',
    greetings: [
      {
        text: 'Hello Thị Trưởng! Vừa deploy bản cập nhật lúc 3h sáng, giờ ra hóng gió cho tan mớ syntax error trong đầu...',
        emotion: 'TIRED',
      },
      {
        text: 'Chào Thị Trưởng! Em đang ngắm hệ thống IoT của khu phố mình, kiến trúc vi dịch vụ ở đây chạy ổn định phết!',
        emotion: 'HAPPY',
      },
      {
        text: 'Dạ Thị Trưởng! Em đang debug ứng dụng nhưng bị mùi thơm đồ ăn vỉa hè lôi kéo ra đây nè!',
        emotion: 'HAPPY',
      },
      {
        text: 'Thị Trưởng ghé thăm hạ tầng số ạ? Em vừa kiểm tra độ trễ mạng quét QR toàn phố, ping chỉ có 5ms, cực mượt!',
        emotion: 'STAR_EYES',
      },
    ],
    options: [
      {
        id: 'hoang-bug',
        label: '💻 Dự án mới đợt này có bug gì hóc búa không em?',
        emotionOnSelect: 'HAPPY',
        reply: 'Toàn bug logic oái oăm thôi Thị Trưởng, nhưng uống ly nước ngọt là não thông ngay! Em vừa tối ưu luồng thanh toán giảm 40% thời gian chờ!',
      },
      {
        id: 'hoang-coffee',
        label: '☕ Mời ly cà phê đen đá 30 Xu cho tỉnh táo',
        cost: 30,
        emotionOnSelect: 'STAR_EYES',
        particles: 'coin',
        reply: 'Trời ơi cứu tinh đời em! Cà phê đậm đặc này tương đương với 200 dòng code sạch không lỗi! Cảm ơn Thị Trưởng nhiều!',
      },
      {
        id: 'hoang-iot',
        label: '⚡ Hệ thống điện nước tự động của phố hoạt động sao rồi?',
        emotionOnSelect: 'HAPPY',
        reply: 'Chạy ngon ơ luôn Thị Trưởng! Cài đặt thanh toán tự động qua MoMo, đến kỳ là tự trừ tiền, không bao giờ lo cúp điện giữa lúc đang render code!',
      },
      {
        id: 'hoang-finance',
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
    greetings: [
      {
        text: 'A Thị Trưởng! Em đang quay góc nghiêng thần thánh của khu phố mình, ánh sáng tự nhiên hôm nay lên hình đẹp xỉu!',
        emotion: 'STAR_EYES',
      },
      {
        text: 'Dạ Thị Trưởng! Em vừa đăng clip "Review món ngon vỉa hè MoCity", mới 15 phút đã lên tab thịnh hành rồi!',
        emotion: 'HAPPY',
      },
      {
        text: 'Chào Thị Trưởng ngầu đét! Em đang chuẩn bị livestream giới thiệu các tiệm kinh doanh uy tín trên phố nè!',
        emotion: 'HAPPY',
      },
      {
        text: 'Thị Trưởng ơi! Dân mạng đang rần rần đòi em làm tour hướng dẫn săn trọn bộ voucher phố MoCity kìa!',
        emotion: 'STAR_EYES',
      },
    ],
    options: [
      {
        id: 'baongoc-food',
        label: '📸 Em đang quay review quán nào hot nhất phố?',
        emotionOnSelect: 'HAPPY',
        reply: 'Dạ quán bánh mì chảo với tiệm cà phê muối góc ngã tư đó Thị Trưởng! Quét mã MoMo hoàn tiền ầm ầm nên khách xếp hàng kín cả vỉa hè!',
      },
      {
        id: 'baongoc-promo',
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
        id: 'baongoc-trend',
        label: '💡 Dân mạng dạo này thích điều gì nhất ở phố mình?',
        emotionOnSelect: 'HAPPY',
        reply: 'Bà con mê nhất là phố xá sạch đẹp, đèn đường lung linh về đêm và thanh toán 100% không chạm, hiện đại văn minh cực kỳ!',
      },
      {
        id: 'baongoc-tea',
        label: '🧋 Tặng em 30 Xu mua ly trà sữa bồi dưỡng quay clip',
        cost: 30,
        emotionOnSelect: 'STAR_EYES',
        particles: 'coin',
        reply: 'U là trời! Thị Trưởng tâm lý đỉnh chóp! Em sẽ tag Thị Trưởng vào story khoe cả nước biết độ xịn sò của phố mình!',
      },
      {
        id: 'baongoc-tips',
        label: '🎙️ Mẹo gì giúp các tiểu thương mới mở kéo khách?',
        emotionOnSelect: 'HAPPY',
        reply: 'Dễ lắm Thị Trưởng, chỉ cần đặt cái Loa Thần Tài MoMo trước cửa phát âm thanh "Ting" vui tai, thêm bảng QR nổi bật là khách ghé nườm nượp!',
      },
    ],
  },

  // 8. CHÚ BẢY HÀNG XÓM
  'cit-chu-bay': {
    id: 'cit-chu-bay',
    name: 'Chú Bảy Hàng Xóm',
    role: 'Tổ Trưởng Dân Phố',
    greetings: [
      {
        text: 'Chào Thị Trưởng! Chú đang đi kiểm tra an ninh trật tự và tình hình vệ sinh khu phố buổi này đây!',
        emotion: 'HAPPY',
      },
      {
        text: 'Thị Trưởng đi thị sát hả? Khu phố mình dạo này đoàn kết lắm, xóm giềng hòa thuận buôn bán đắt đỏ!',
        emotion: 'HAPPY',
      },
      {
        text: 'A Thị Trưởng! Chú vừa nhắc nhở mấy tiệm xếp xe máy gọn gàng trong vạch sơn cho người đi bộ thông thoáng nè!',
        emotion: 'HAPPY',
      },
      {
        text: 'Chào đồng chí Thị Trưởng! Nhờ có hệ thống đèn đường mới mà tối đến bà con đi tập thể dục đông vui, an tâm hẳn!',
        emotion: 'STAR_EYES',
      },
    ],
    options: [
      {
        id: 'chubay-security',
        label: '📋 Tình hình an ninh trật tự dạo này thế nào chú?',
        emotionOnSelect: 'HAPPY',
        reply: 'An ninh đạt điểm 10 luôn Thị Trưởng! Đèn đường sáng trưng, xe cộ dừng đèn đỏ nghiêm túc, trộm cắp chạy mất dép khỏi khu mình!',
      },
      {
        id: 'chubay-feedback',
        label: '📢 Bà con tổ dân phố có kiến nghị gì với Thị Trưởng không?',
        emotionOnSelect: 'HAPPY',
        reply: 'Bà con khen hết lời! Chỉ mong Thị Trưởng duy trì các lễ hội đường phố và khuyến khích mở thêm nhiều dịch vụ tiện ích nữa!',
      },
      {
        id: 'chubay-fund',
        label: '🤝 Biếu chú 50 Xu đóng góp quỹ khuyến học của tổ',
        cost: 50,
        emotionOnSelect: 'STAR_EYES',
        particles: 'coin',
        reply: 'Hoan hô tấm lòng Thị Trưởng! Chú ghi sổ vàng truyền thống liền, cuối năm phát thưởng cho các cháu học sinh giỏi trong xóm!',
      },
      {
        id: 'chubay-unity',
        label: '💡 Mẹo hay gì giúp bà con trong khu gắn kết hơn chú?',
        emotionOnSelect: 'HAPPY',
        reply: 'Cứ mỗi dịp lễ tết mở hội làng, rủ nhau Lắc Heo Vàng MoMo rồi chia sẻ lì xì qua lại là tình làng nghĩa xóm khăng khít ngay!',
      },
    ],
  },

  // 9. BÁC TÀI XE ÔM
  'cit-bac-tai': {
    id: 'cit-bac-tai',
    name: 'Bác Tài Xe Ôm',
    role: 'Tài Xế Công Nghệ',
    greetings: [
      {
        text: 'Kính chào Thị Trưởng! Bác vừa trả khách ở đầu hẻm xong, đang tấp vô uống miếng nước trà chờ nổ cuốc mới!',
        emotion: 'HAPPY',
      },
      {
        text: 'A Thị Trưởng! Hôm nay khách qua lại phố mình nườm nượp, bác chạy không kịp nghỉ tay luôn nè!',
        emotion: 'HAPPY',
      },
      {
        text: 'Chào Thị Trưởng! Nhờ đường sá bằng phẳng, phân luồng giao thông rõ ràng mà anh em tài xế chạy êm ru, ít hao xăng!',
        emotion: 'STAR_EYES',
      },
      {
        text: 'Thị Trưởng dạo phố à? Bác vừa chở một cặp du khách ngoại tỉnh tới, họ khen phố mình đẹp như tranh vẽ!',
        emotion: 'HAPPY',
      },
    ],
    options: [
      {
        id: 'bactai-trips',
        label: '🛵 Hôm nay chạy được mấy cuốc rồi bác?',
        emotionOnSelect: 'HAPPY',
        reply: 'Từ sáng tới giờ ngót nghét 15 cuốc rồi Thị Trưởng! Khách giờ toàn trả qua MoMo, tiền vô ví cái "ting" là an tâm chạy tiếp, khỏi lo tiền thối!',
      },
      {
        id: 'bactai-gas',
        label: '⛽ Biếu bác 40 Xu hỗ trợ bình xăng chạy xe',
        cost: 40,
        emotionOnSelect: 'STAR_EYES',
        particles: 'coin',
        reply: 'Chao ôi, bác cảm ơn Thị Trưởng nhiều lắm! Chúc Thị Trưởng luôn mạnh giỏi, đưa khu phố mình ngày một giàu đẹp nghen!',
      },
      {
        id: 'bactai-tourists',
        label: '🗺️ Khách đi đường hay khen phố mình điều gì nhất hả bác?',
        emotionOnSelect: 'HAPPY',
        reply: 'Họ khoái nhất là vỉa hè rộng rãi thoáng mát, quán ăn sạch sẽ và tiệm nào cũng có bảng mã QR thanh toán tích tắc!',
      },
      {
        id: 'bactai-insurance',
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
    greetings: [
      {
        text: 'Dạ em chào Thị Trưởng! Xôi gấc, xôi vò, xôi đậu xanh lá dứa nóng hổi thơm phức đây Thị Trưởng ơi!',
        emotion: 'HAPPY',
      },
      {
        text: 'Thị Trưởng đi ngang tiệm em hả? Sáng sớm tinh mơ mà khách quét mã nổ đơn liên tục, mừng rớt nước mắt!',
        emotion: 'STAR_EYES',
      },
      {
        text: 'Em chào Thị Trưởng! Nhờ vỉa hè phong quang sạch sẽ mà gánh xôi của em bán sạch veo từ sớm!',
        emotion: 'HAPPY',
      },
      {
        text: 'Dạ Thị Trưởng dùng gói xôi lót dạ chưa? Em đang đơm xôi cho khách quen đây ạ!',
        emotion: 'HAPPY',
      },
    ],
    options: [
      {
        id: 'xoi-inventory',
        label: '🍚 Gánh xôi hôm nay còn nhiều không chị?',
        emotionOnSelect: 'HAPPY',
        reply: 'Dạ còn vài gói xôi bắp với xôi gấc hạt sen thôi Thị Trưởng, khách đi làm ghé quét mã MoMo "ting ting" một loáng là hết vèo thúng xôi!',
      },
      {
        id: 'xoi-buy',
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
        id: 'xoi-qr',
        label: '📱 Chị xài bảng QR MoMo thấy buôn bán thế nào?',
        emotionOnSelect: 'HAPPY',
        reply: 'Tiện dữ lắm Thị Trưởng ơi! Tay em dính nếp dính mè, khách tự quét tự trả tiền, em chỉ việc đơm xôi, khỏi phải thối tiền lẻ dơ dáy!',
      },
      {
        id: 'xoi-dream',
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
    greetings: [
      {
        text: 'Dạ con chào Chú Thị Trưởng ạ! Con vừa tan học đang đi bộ về nhà nè chú!',
        emotion: 'HAPPY',
      },
      {
        text: 'A Chú Thị Trưởng! Hôm nay con được cô giáo chấm điểm 10 bài kiểm tra Toán đó chú ơi!',
        emotion: 'STAR_EYES',
      },
      {
        text: 'Con chào Chú Thị Trưởng đẹp trai! Chú đi tuần phố giống mấy chú siêu nhân trong truyện tranh ghê!',
        emotion: 'HAPPY',
      },
      {
        text: 'Chú Thị Trưởng ơi! Con với mấy bạn đang thi xem ai nuôi Heo Đất MoMo mập hơn đó chú!',
        emotion: 'STAR_EYES',
      },
    ],
    options: [
      {
        id: 'bean-school',
        label: '🎒 Hôm nay đi học có chuyện gì vui kể chú nghe nào?',
        emotionOnSelect: 'HAPPY',
        reply: 'Dạ vui lắm chú! Con được cô khen trước lớp vì biết phụ mẹ quét mã QR trả tiền điện nước tự động, cả lớp vỗ tay rần rần!',
      },
      {
        id: 'bean-milk',
        label: '🧃 Cho con 20 Xu mua hộp sữa tươi uống ra chơi nè',
        cost: 20,
        emotionOnSelect: 'STAR_EYES',
        particles: 'coin',
        reply: 'Dạ con khoanh tay cảm ơn Chú Thị Trưởng nhiều ạ! Con sẽ học thật giỏi để sau này làm kỹ sư xây dựng phố xá to đẹp hơn nữa!',
      },
      {
        id: 'bean-heodat',
        label: '🚲 Tiền tiêu vặt con để dành trong Heo Đất được bao nhiêu rồi?',
        emotionOnSelect: 'STAR_EYES',
        rewardBonus: {
          coins: 10,
          reason: 'Bé An chia sẻ lộc Heo Đất mập mạp',
        },
        particles: 'stars',
        reply: 'Dạ con để dành được hơn nửa chiếc xe đạp mới rồi chú! Con tặng chú 10 Xu lộc Heo Đất may mắn (+10 Xu), chúc chú luôn vui vẻ nha!',
      },
      {
        id: 'bean-favorite',
        label: '🏫 Khu phố mình con thích nhất chỗ nào?',
        emotionOnSelect: 'HAPPY',
        reply: 'Con thích nhất là vỉa hè rộng rãi đi bộ an toàn, với chú bảo vệ ở ngã tư hay dắt tụi con qua đường lúc tan trường ạ!',
      },
    ],
  },

  // 12. CÔ LINH DẠY THÊM
  'cit-co-linh': {
    id: 'cit-co-linh',
    name: 'Cô Linh Dạy Thêm',
    role: 'Giáo Viên',
    greetings: [
      {
        text: 'Em chào Thị Trưởng! Em vừa chấm xong xấp bài kiểm tra, ra phố làm ly nước cho nhẹ đầu đây ạ!',
        emotion: 'HAPPY',
      },
      {
        text: 'Chào Thị Trưởng! Nhờ khu phố yên tĩnh, an ninh tốt mà các lớp học thêm của em các em học tập rất tập trung!',
        emotion: 'HAPPY',
      },
      {
        text: 'Thị Trưởng đi thị sát ạ? Em đang ghé hiệu sách mua thêm tài liệu tham khảo cho các em học sinh nghèo hiếu học.',
        emotion: 'STAR_EYES',
      },
      {
        text: 'Em chào Thị Trưởng! Không khí phố phường hôm nay mát mẻ, nhìn bà con hăng say lao động thấy phấn khởi quá!',
        emotion: 'HAPPY',
      },
    ],
    options: [
      {
        id: 'colinh-class',
        label: '📚 Lớp học đợt này các em học tập ra sao cô Linh?',
        emotionOnSelect: 'HAPPY',
        reply: 'Các em ngoan và tiến bộ nhanh lắm Thị Trưởng! Đặc biệt là phụ huynh giờ chuyển học phí qua MoMo hết rồi, nhanh gọn và lưu lịch sử rõ ràng!',
      },
      {
        id: 'colinh-tea',
        label: '🍵 Mời cô ly trà hoa cúc 30 Xu thanh nhiệt nhuận giọng',
        cost: 30,
        emotionOnSelect: 'STAR_EYES',
        particles: 'coin',
        reply: 'Em cảm ơn Thị Trưởng nhiều lắm! Lời động viên của Thị Trưởng là nguồn năng lượng quý giá cho những người làm nghề giáo như tụi em!',
      },
      {
        id: 'colinh-books',
        label: '🏫 Khu phố mình cần thêm tiện ích gì cho giáo dục không cô?',
        emotionOnSelect: 'STAR_EYES',
        reply: 'Nếu có thể, em mong khu phố mở thêm một "Tủ Sách Cộng Đồng" ở vỉa hè để các em nhỏ có chỗ đọc sách miễn phí mỗi buổi chiều!',
      },
      {
        id: 'colinh-advice',
        label: '💡 Lời khuyên nào cho các bạn trẻ chuẩn bị bước vào đời?',
        emotionOnSelect: 'HAPPY',
        reply: 'Em luôn dặn các em phải rèn luyện tính tự lập và quản lý tài chính từ sớm, biết tiết kiệm và đầu tư tri thức thì tương lai ắt thành công!',
      },
    ],
  },
};
