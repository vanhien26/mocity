import type { RequestScript } from './types';

/**
 * 25 Kịch bản Drama & Yêu cầu Cư dân mới — Phản ánh toàn diện hệ sinh thái dịch vụ MoMo:
 * VETC thu phí tự động, Data 4G/5G, Học phí trực tuyến, Bảo hiểm xe máy điện tử,
 * Sổ thu chi 50/30/20, Bảo hiểm trễ chuyến bay, BHYT tự nguyện, Chứng chỉ quỹ mở,
 * Combo bắp nước Cinema, Loa Thần Tài pin trâu, Tiền nước rò rỉ, Trả góp laptop,
 * Voucher MoMo Food, Vé tàu hỏa Tết, Vay Nhanh FastMoney, Trả góp máy pha cà phê,
 * Phí vệ sinh môi trường, Lãi kép Thần Tài, Vé VIP Sweetbox, Nạp thẻ game,
 * Mừng cưới online, VietQR Pro, Bảo hiểm viện phí, Bảo hiểm rơi vỡ màn hình, Đặt phòng MoMo Travel.
 */
export const EXTRA_REQUEST_SCRIPTS: RequestScript[] = [
  {
    id: 'req-merchant-vetc-hang',
    archetype: 'MERCHANT_ESTABLISHED',
    requiresDigital: true,
    title: 'Xe tải chở hàng kẹt cứng trạm BOT vì quên nạp VETC',
    subtitle: 'Anh Lâm đang toát mồ hôi hột giữa tiếng còi xe inh ỏi...',
    body: 'Chiếc xe tải chở 200 chiếc lốp xe chống đinh của anh Lâm đang đứng chặn ngay làn thu phí tự động ETC đầu đại lộ MoCity. Tài khoản VETC còn 8 ngàn đồng mà phía sau có 30 chiếc xe đang bấm còi giục giã! Bạn sẽ:',
    choices: [
      {
        id: 'nạp-vetc-momo',
        text: 'Nạp cấp tốc 300.000đ vào tài khoản VETC qua MoMo cho xe qua trạm tức thì',
        costCoins: 300000,
        btnTone: 'green',
        tags: [
          { label: '-300.000đ', tone: 'red' },
          { label: 'thông trạm ngay ++', tone: 'green' },
          { label: 'anh Lâm đội ơn', tone: 'green' },
        ],
        effects: { trust: 28, xp: 55, happiness: 12 },
        reply:
          'Barie bật mở trong 3 giây! Xe tải lăn bánh êm ru, 30 tài xế phía sau đồng loạt giơ ngón tay cái tán thưởng Thị Trưởng MoCity!',
      },
      {
        id: 'auto-topup-vetc',
        text: 'Bày anh Lâm cài đặt tính năng Tự Động Nạp Tiền VETC khi số dư dưới 100k trên MoMo',
        btnTone: 'blue',
        tags: [
          { label: 'anh Lâm gật gù +', tone: 'green' },
          { label: 'không lo kẹt trạm', tone: 'green' },
        ],
        effects: { trust: 20, xp: 45, happiness: 6 },
        reply:
          '“Trời đất, bật nạp tự động qua MoMo vầy thì từ nay xe chở hàng bon bon xuyên đêm, khỏi lo giật mình giữa trạm BOT nữa!”',
      },
      {
        id: 'push-truck',
        text: 'Bảo anh Lâm cùng bác tài xế... xuống đẩy lùi xe tải 2 cây số ra làn tiền mặt',
        btnTone: 'red',
        tags: [
          { label: 'ùn tắc toàn tuyến', tone: 'red' },
          { label: 'anh Lâm gãy lưng', tone: 'neutral' },
        ],
        effects: { trust: -10, happiness: -8 },
        reply:
          'Đẩy lùi được 5 mét thì cả đoàn xe phía sau đồng thanh bấm còi inh ỏi như sấm sét, anh Lâm thở không ra hơi!',
      },
    ],
  },
  {
    id: 'req-student-data-thi',
    archetype: 'STUDENT',
    missingService: 'BNPL',
    title: 'Đang phỏng vấn học bổng online thì điện thoại ngắt Data 4G',
    subtitle: 'Khánh Gen Z đang đứng hình giữa câu trả lời tiếng Anh...',
    body: 'Khánh đang trong vòng phỏng vấn học bổng trao đổi quốc tế thì màn hình xoay vòng tròn vì gói Data 4G hết dung lượng. Tiền trong tài khoản còn 3 ngàn không đủ gia hạn gói cước, chỉ còn đúng 2 phút trước khi bị loại khỏi phòng chờ! Bạn sẽ:',
    choices: [
      {
        id: 'gift-5g-data',
        text: 'Tài trợ 250.000đ nạp gói Data 5G Siêu Tốc 10GB qua MoMo + Thẻ Thành Viên',
        costCoins: 250000,
        btnTone: 'green',
        tags: [
          { label: '-250.000đ', tone: 'red' },
          { label: 'kết nối 5G tức thì', tone: 'green' },
          { label: 'ưu đãi thành viên', tone: 'green' },
        ],
        effects: { grantService: 'BNPL', trust: 30, xp: 60, happiness: 12 },
        reply:
          'Sóng 5G căng đét trong 10 giây! Khánh tự tin trả lời lưu loát và nhận ngay suất học bổng toàn phần, ôm chầm lấy Thị Trưởng mừng rơi nước mắt!',
      },
      {
        id: 'guide-data-topup',
        text: 'Chỉ Khánh dùng MoMo săn voucher nạp thẻ Data 1 ngày ưu đãi',
        btnTone: 'blue',
        tags: [
          { label: 'Khánh vượt ải +', tone: 'green' },
          { label: 'ưu đãi thành viên', tone: 'green' },
        ],
        effects: { grantService: 'BNPL', trust: 22, xp: 45, happiness: 6 },
        reply:
          '“Săn voucher nạp Data bằng MoMo nhanh như chớp mắt, cứu nguy cho tương lai của em luôn Thị Trưởng ơi!”',
      },
      {
        id: 'climb-tree-wifi',
        text: 'Khuyên Khánh... trèo lên ngọn cây bàng đầu hẻm bắt trộm Wi-Fi nhà hàng xóm',
        btnTone: 'red',
        tags: [
          { label: 'rớt mạng rớt luôn học bổng', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trust: -10, happiness: -8 },
        reply:
          'Vừa leo lên tới chạc cây thì nhánh bàng gãy rắc, Khánh trượt chân rớt xuống bụi cỏ, giám khảo tưởng em đang làm xiếc nên tắt luôn phòng họp!',
      },
    ],
  },
  {
    id: 'req-family-hoc-phi',
    archetype: 'FAMILY',
    requiresDigital: false,
    title: 'Hạn chót đóng học phí lúc 23h59 ngày Chủ Nhật',
    subtitle: 'Vợ chồng chị Mai đang toát mồ hôi trước cổng trường đóng cửa...',
    body: 'Con gái chị Mai đậu vào trường chuyên nhưng hạn chót nộp học phí đầu năm là nửa đêm nay, ngân hàng đóng cửa cuối tuần. Nếu quá hạn sẽ mất luôn chỉ tiêu trúng tuyển! Chị Mai vừa lau nước mắt vừa cầu cứu:',
    choices: [
      {
        id: 'pay-tuition-now',
        text: 'Chi 450.000đ hỗ trợ thanh toán học phí qua Cổng Dịch Vụ Giáo Dục MoMo',
        costCoins: 450000,
        btnTone: 'green',
        tags: [
          { label: '-450.000đ', tone: 'red' },
          { label: 'gia đình chị Mai ++', tone: 'green' },
          { label: 'mở Thanh Toán Số', tone: 'green' },
        ],
        effects: { acceptDigital: true, trust: 32, xp: 70, happiness: 12 },
        reply:
          'Chỉ cần nhập mã học sinh là hệ thống MoMo gạch nợ tức thì! Giấy biên nhận điện tử gửi về email lúc 23h58, cả nhà chị Mai ôm nhau reo hò giữa đêm!',
      },
      {
        id: 'teach-tuition-portal',
        text: 'Hướng dẫn chị Mai tra cứu mã định danh học sinh và thanh toán học phí trên MoMo',
        btnTone: 'blue',
        tags: [
          { label: 'chị Mai an tâm +', tone: 'green' },
          { label: 'mở Thanh Toán Số', tone: 'green' },
        ],
        effects: { acceptDigital: true, trust: 22, xp: 50, happiness: 6 },
        reply:
          '“Trời ơi tiện quá, khỏi phải xin nghỉ làm ra ngân hàng xếp hàng lấy số, ở nhà bấm 30 giây là con được đi học ngon lành!”',
      },
      {
        id: 'write-plea-letter',
        text: 'Bảo chị Mai... viết thư tay nhét qua khe cổng trường xin thầy hiệu trưởng gia hạn',
        btnTone: 'red',
        tags: [
          { label: 'thư bị gió thổi bay', tone: 'red' },
          { label: 'cả nhà mất ngủ', tone: 'neutral' },
        ],
        effects: { trust: -12, happiness: -8 },
        reply:
          'Lá thư rơi vào máng nước mưa trôi mất tích, cả đêm vợ chồng chị Mai thức trắng ngồi lo lắng đến bạc đầu!',
      },
    ],
  },
  {
    id: 'req-gig-bh-xe-may',
    archetype: 'GIG_WORKER',
    missingService: 'INSURANCE',
    title: 'Shipper run rẩy trước trạm kiểm tra giấy tờ xe',
    subtitle: 'Anh Khoa đang dắt xe nép vào lề đường run bần bật...',
    body: 'Đội kiểm tra giao thông đang lập chốt đầu phố. Anh Khoa mang đầy đủ giấy tờ nhưng cuốn bảo hiểm xe máy giấy đã hết hạn từ 3 tháng trước. Bị phạt thì mất đứt cả tuần chạy xe cật lực! Bạn sẽ:',
    choices: [
      {
        id: 'buy-moto-insurance',
        text: 'Tài trợ 200.000đ mua ngay Bảo Hiểm Xe Máy Điện Tử MoMo nhận giấy trong 30 giây',
        costCoins: 200000,
        btnTone: 'green',
        tags: [
          { label: '-200.000đ', tone: 'red' },
          { label: 'mở Bảo Hiểm Số', tone: 'green' },
          { label: 'anh Khoa thở phào ++', tone: 'green' },
        ],
        effects: { grantService: 'INSURANCE', trust: 30, xp: 55, happiness: 12 },
        reply:
          'Chứng nhận bảo hiểm điện tử có mã QR chuẩn quốc gia xuất hiện trên màn hình! Chú cảnh sát kiểm tra xong gật đầu khen ngợi công dân gương mẫu!',
      },
      {
        id: 'guide-moto-ins',
        text: 'Hướng dẫn anh Khoa tự mua bảo hiểm xe máy trên MoMo lưu vào ví giấy tờ điện tử',
        btnTone: 'blue',
        tags: [
          { label: 'anh Khoa +', tone: 'green' },
          { label: 'mở Bảo Hiểm Số', tone: 'green' },
        ],
        effects: { grantService: 'INSURANCE', trust: 20, xp: 45, happiness: 6 },
        reply:
          '“Từ nay chứng nhận bảo hiểm lưu sẵn trong điện thoại, khỏi sợ để quên ở nhà hay bị mưa ướt rách bươm nữa!”',
      },
      {
        id: 'push-bike-home',
        text: 'Khuyên anh Khoa... giả vờ xe hết xăng dắt bộ 5 cây số đường vòng né chốt',
        btnTone: 'red',
        tags: [
          { label: 'trễ sạch đơn hàng', tone: 'red' },
          { label: 'khách hủy đơn 1 sao', tone: 'neutral' },
        ],
        effects: { trust: -10, happiness: -8 },
        reply:
          'Dắt bộ xe chở 3 thùng sầu riêng giữa trưa nắng 38 độ, anh Khoa vừa kiệt sức vừa bị khách hủy đơn đánh giá 1 sao tơi tả!',
      },
    ],
  },
  {
    id: 'req-salaried-so-thu-chi',
    archetype: 'SALARIED',
    missingService: 'SAVINGS',
    title: 'Bí ẩn tiền lương bốc hơi sau 7 ngày nhận thưởng',
    subtitle: 'Chị Vy kế toán đang ngồi tính toán sao kê mà hai mắt đờ đẫn...',
    body: 'Đầu tháng nhận 15 triệu tiền lương, mới mùng 8 kiểm tra tài khoản chỉ còn 1 triệu 200 ngàn! Chị Vy thề là mình không mua đồ hiệu, chỉ "uống vài ly cà phê và đặt đồ ăn vặt". Bạn sẽ giải cứu:',
    choices: [
      {
        id: 'setup-expense-tracker',
        text: 'Chi 350.000đ mở Trợ Lý Quản Lý Chi Tiêu MoMo phân bổ chuẩn 50/30/20 + thưởng nóng',
        costCoins: 350000,
        btnTone: 'green',
        tags: [
          { label: '-350.000đ', tone: 'red' },
          { label: 'chị Vy thức tỉnh ++', tone: 'green' },
          { label: 'mở Tiết Kiệm Số', tone: 'green' },
        ],
        effects: { grantService: 'SAVINGS', trust: 28, xp: 60, happiness: 12 },
        reply:
          'Trợ lý MoMo quét tự động và chỉ ra: 42 ly trà sữa kem cheese và 15 đơn bánh tráng trộn nửa đêm ngốn hết 8 triệu! Chị Vy giật mình thiết lập trần chi tiêu liền tay!',
      },
      {
        id: 'auto-save-salary',
        text: 'Cài đặt quy tắc: Cứ có tiền vào tài khoản là tự động trích 20% vào Túi Thần Tài',
        btnTone: 'blue',
        tags: [
          { label: 'tích lũy đều đặn +', tone: 'green' },
          { label: 'mở Tiết Kiệm Số', tone: 'green' },
        ],
        effects: { grantService: 'SAVINGS', trust: 20, xp: 45, happiness: 6 },
        reply:
          '“Mắt không thấy thì tay không tiêu! Nhờ cất tiền vào Túi Thần Tài mà cuối tháng em vẫn còn tiền rủng rỉnh ăn lẩu!”',
      },
      {
        id: 'eat-instant-noodles',
        text: 'Bảo chị Vy... uống nước lọc cầm hơi và khóa điện thoại 20 ngày còn lại',
        btnTone: 'red',
        tags: [
          { label: 'suy nhược cơ thể', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trust: -10, happiness: -8 },
        reply:
          'Được 2 ngày thì chị Vy hoa mắt chóng mặt suýt ngất trước màn hình máy tính, phải tốn thêm tiền mua thuốc bổ!',
      },
    ],
  },
  {
    id: 'req-traveler-tre-chuyen-bay',
    archetype: 'TRAVELER',
    missingService: 'INSURANCE',
    title: 'Chuyến bay đi trăng mật delay 5 tiếng giữa đêm ở sân bay',
    subtitle: 'Lâm Blogger và vợ sắp cưới đang ngồi bệt trên sàn sảnh chờ...',
    body: 'Cặp đôi mới cưới chuẩn bị bay đi Phú Quốc chụp ảnh cưới thì hãng thông báo trễ chuyến bay từ 20h đến tận 1h30 sáng hôm sau. Không có phòng chờ, đồ ăn sân bay đắt đỏ, hai vợ chồng mệt mỏi suýt cãi nhau! Bạn sẽ:',
    choices: [
      {
        id: 'activate-flight-delay-ins',
        text: 'Tài trợ 380.000đ kích hoạt Bảo Hiểm Trễ Chuyến Bay MoMo bồi thường 1 triệu tức thì',
        costCoins: 380000,
        btnTone: 'green',
        tags: [
          { label: '-380.000đ', tone: 'red' },
          { label: 'mở Bảo Hiểm Số', tone: 'green' },
          { label: 'cặp đôi vui vẻ ++', tone: 'green' },
        ],
        effects: { grantService: 'INSURANCE', trust: 30, xp: 65, happiness: 12 },
        reply:
          'Ting ting! Vừa trễ đủ 2 tiếng là tiền bồi thường tự động nhảy vào MoMo không cần nộp giấy tờ! Hai bạn trẻ dắt nhau vào phòng chờ VIP ăn buffet thơm lừng!',
      },
      {
        id: 'guide-flight-insurance',
        text: 'Hướng dẫn cặp đôi đặt vé máy bay tích hợp sẵn gói bảo hiểm chuyến bay trên MoMo Travel',
        btnTone: 'blue',
        tags: [
          { label: 'Lâm +', tone: 'green' },
          { label: 'mở Bảo Hiểm Số', tone: 'green' },
        ],
        effects: { grantService: 'INSURANCE', trust: 22, xp: 50, happiness: 6 },
        reply:
          '“Đặt vé qua MoMo được bảo vệ từ A đến Z, máy bay trễ là có tiền đền bù ăn uống nghỉ ngơi, chuẩn xịn luôn Thị Trưởng!”',
      },
      {
        id: 'sleep-on-bench',
        text: 'Khuyên hai bạn... trải áo khoác nằm ngủ đỡ trên hàng ghế inox lạnh ngắt',
        btnTone: 'red',
        tags: [
          { label: 'vợ dỗi hủy đám cưới', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trust: -12, happiness: -8 },
        reply:
          'Ghế inox vừa cứng vừa lạnh buốt, cô dâu giận dỗi tháo nhẫn cưới cất vào túi xách, chuyến trăng mật biến thành chuyến trăng đen!',
      },
    ],
  },
  {
    id: 'req-elder-bhyt-tu-nguyen',
    archetype: 'ELDER',
    requiresDigital: false,
    title: 'Cụ bà lo lắng thẻ BHYT sắp hết hạn vào ngày mai',
    subtitle: 'Bà Phúc chống gậy đứng nhìn bậc thang ủy ban cao ngất ngưởng...',
    body: 'Bà Phúc bị đau khớp gối đi lại khó khăn, mà thẻ Bảo Hiểm Y Tế tự nguyện sẽ hết hiệu lực sau 24h nữa. Nếu gián đoạn bảo hiểm thì tiền thuốc huyết áp hàng tháng sẽ tốn cả triệu đồng. Bạn sẽ giúp bà thế nào?',
    choices: [
      {
        id: 'renew-bhyt-momo',
        text: 'Chi 300.000đ đóng gia hạn BHYT hộ gia đình qua MoMo + đưa bà về nhà an toàn',
        costCoins: 300000,
        btnTone: 'green',
        tags: [
          { label: '-300.000đ', tone: 'red' },
          { label: 'bà Phúc cảm động ++', tone: 'green' },
          { label: 'mở Thanh Toán Số', tone: 'green' },
        ],
        effects: { acceptDigital: true, trust: 35, xp: 75, happiness: 12 },
        reply:
          'Chỉ cần nhập mã số BHXH là hệ thống đồng bộ ngay lập tức! Thẻ BHYT của bà được gia hạn thêm 12 tháng, bà Phúc cười hiền hậu cảm ơn Thị Trưởng hết lời!',
      },
      {
        id: 'teach-family-bhyt',
        text: 'Bày con cháu trong nhà tính năng đóng BHXH và BHYT tự nguyện trực tuyến trên MoMo',
        btnTone: 'blue',
        tags: [
          { label: 'tiện lợi cho người già +', tone: 'green' },
          { label: 'mở Thanh Toán Số', tone: 'green' },
        ],
        effects: { acceptDigital: true, trust: 22, xp: 50, happiness: 6 },
        reply:
          '“Tụi nhỏ ở nhà chỉ cần bấm điện thoại vài giây là xong cho bà, không phải để người già lặn lội mưa nắng nữa!”',
      },
      {
        id: 'queue-in-line',
        text: 'Bảo bà Phúc... cứ ngồi đợi ở ghế đá ngoài hiên chờ tới lượt bốc số',
        btnTone: 'red',
        tags: [
          { label: 'bà đau khớp chân', tone: 'red' },
          { label: 'bà con bất bình', tone: 'neutral' },
        ],
        effects: { trust: -14, happiness: -8 },
        reply:
          'Bà ngồi đợi suốt 4 tiếng dưới trời nắng gắt làm huyết áp tăng vọt, cả xóm chê trách Tòa Thị Chính vô tâm!',
      },
    ],
  },
  {
    id: 'req-investor-chung-chi-quy',
    archetype: 'INVESTOR',
    missingService: 'CREDIT',
    title: 'Có 50 ngàn tiền lẻ nhưng nuôi mộng làm nhà đầu tư tài chính',
    subtitle: 'Nhà đầu tư An đang nhìn sàn chứng khoán với ánh mắt thèm thuồng...',
    body: 'An vừa tiết kiệm được 50 ngàn từ việc nhịn 1 ly trà sữa, rất muốn đầu tư tài chính để tiền đẻ ra tiền nhưng các sàn giao dịch truyền thống yêu cầu vốn tối thiểu vài chục triệu đồng. Bạn sẽ dẫn lối cho An:',
    choices: [
      {
        id: 'open-fund-certificate',
        text: 'Tài trợ 400.000đ mở tài khoản Chứng Chỉ Quỹ Mở MoMo Dragon Capital từ 10.000đ',
        costCoins: 400000,
        btnTone: 'green',
        tags: [
          { label: '-400.000đ', tone: 'red' },
          { label: 'trở thành nhà đầu tư ++', tone: 'green' },
          { label: 'mở Tín Dụng Số', tone: 'green' },
        ],
        effects: { grantService: 'CREDIT', trust: 30, xp: 65, happiness: 12 },
        reply:
          'Chỉ với 10k là An đã sở hữu chứng chỉ quỹ của các tập đoàn hàng đầu Việt Nam do chuyên gia quản lý! An tự tin bước vào con đường tự do tài chính!',
      },
      {
        id: 'teach-micro-investing',
        text: 'Hướng dẫn An tích lũy tiền lẻ hàng ngày vào Quỹ Đầu Tư uy tín liên kết trên MoMo',
        btnTone: 'blue',
        tags: [
          { label: 'tư duy tài chính +', tone: 'green' },
          { label: 'mở Tín Dụng Số', tone: 'green' },
        ],
        effects: { grantService: 'CREDIT', trust: 22, xp: 50, happiness: 6 },
        reply:
          '“Mỗi ngày bớt 1 ly cà phê là tích được cả gia tài trong tương lai, bài học này quý giá hơn vàng Thị Trưởng ơi!”',
      },
      {
        id: 'buy-lottery-all-in',
        text: 'Khuyên An... gom hết 50 ngàn đi mua 5 tờ vé số cầu may chiều nay',
        btnTone: 'red',
        tags: [
          { label: 'cháy sạch vốn', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trust: -10, happiness: -8 },
        reply:
          'Chiều 16h30 dò vé số trượt cả 5 tờ, An đứng nhìn tờ giấy lộn bay theo gió mà lòng trống rỗng!',
      },
    ],
  },
  {
    id: 'req-merchant-loa-het-pin',
    archetype: 'MERCHANT_CASH',
    requiresDigital: false,
    title: 'Quán bún đông nghẹt thì điện thoại sập nguồn, khách hô “Đã chuyển khoản!”',
    subtitle: 'Chị Hai Bún đang cầm muôi múc bún mà mặt xanh như tàu lá chuối...',
    body: 'Giờ cao điểm sáng 50 khách ra vào liên tục. Đúng lúc này điện thoại của chị Hai sập nguồn vì chai pin. Khách liên tục giơ màn hình điện thoại nói “Em quét rồi nha chị!” mà chị không biết tiền có về tài khoản thật không! Bạn sẽ:',
    choices: [
      {
        id: 'gift-smart-speaker-pro',
        text: 'Tài trợ 350.000đ tặng Loa Thần Tài MoMo Pro pin trâu 48h cắm sạc độc lập tại quầy',
        costCoins: 350000,
        btnTone: 'green',
        tags: [
          { label: '-350.000đ', tone: 'red' },
          { label: 'mở Loa QR cả tiệm', tone: 'green' },
          { label: 'chị Hai yên tâm ++', tone: 'green' },
        ],
        effects: { acceptDigital: true, trust: 30, xp: 65, happiness: 12 },
        reply:
          'Loa cất tiếng vang rõ: “MoMo nhận 35.000đ từ bạn Nam!”. Chị Hai múc bún thoăn thoắt không cần ngó điện thoại, khách ăn xong nghe tiếng loa tự động bước ra vui vẻ!',
      },
      {
        id: 'print-qr-standee',
        text: 'Bày chị Hai mượn sạc dự phòng và bật thông báo tiền về bằng âm thanh to nhất',
        btnTone: 'blue',
        tags: [
          { label: 'chị Hai gật đầu +', tone: 'green' },
          { label: 'mở QR tiệm', tone: 'green' },
        ],
        effects: { acceptDigital: true, trust: 20, xp: 45, happiness: 6 },
        reply:
          '“May quá có giải pháp tạm thời, từ nay chị phải đầu tư ngay chiếc loa thông minh để buôn bán cho an tâm!”',
      },
      {
        id: 'hold-customer-id',
        text: 'Bảo chị Hai... giữ chứng minh nhân dân của từng khách đến khi điện thoại sạc xong',
        btnTone: 'red',
        tags: [
          { label: 'khách bỏ đi hết', tone: 'red' },
          { label: 'nồi nước lèo ế chỏng trơ', tone: 'neutral' },
        ],
        effects: { trust: -12, happiness: -8 },
        reply:
          'Khách hàng bức xúc bỏ đi hết sang quán bên cạnh ăn phở, chị Hai ngồi nhìn nồi nước lèo bốc khói mà khóc ròng!',
      },
    ],
  },
  {
    id: 'req-family-tien-nuoc-ro-ri',
    archetype: 'FAMILY',
    requiresDigital: false,
    title: 'Vỡ đường ống ngầm, hóa đơn tiền nước nhảy vọt lên 3 triệu đồng',
    subtitle: 'Nhà anh Khôi đang tá hỏa trước giấy báo tiền nước đỏ lòm...',
    body: 'Bình thường tiền nước nhà anh Khôi chỉ 150k, tháng này đường ống ngầm sau vườn bị vỡ rò rỉ làm hóa đơn vọt lên 3.200.000đ! Công ty nước đe dọa sẽ cắt nước sinh hoạt nếu không thanh toán trong ngày. Bạn sẽ:',
    choices: [
      {
        id: 'emergency-bill-pay',
        text: 'Chi 400.000đ thanh toán khẩn cấp qua MoMo & hỗ trợ đội thợ dò tìm điểm vỡ',
        costCoins: 400000,
        btnTone: 'green',
        tags: [
          { label: '-400.000đ', tone: 'red' },
          { label: 'nước chảy mát lành ++', tone: 'green' },
          { label: 'mở Thanh Toán Số', tone: 'green' },
        ],
        effects: { acceptDigital: true, trust: 30, xp: 60, happiness: 12 },
        reply:
          'Hóa đơn được gạch nợ trong tích tắc! Đường ống được hàn kín, vòi sen lại chảy ào ào mát rượi. Anh Khôi bắt tay Thị Trưởng cảm ơn rối rít!',
      },
      {
        id: 'setup-auto-water-bill',
        text: 'Bật tính năng Cảnh Báo Hóa Đơn Bất Thường và Thanh Toán Tự Động trên MoMo',
        btnTone: 'blue',
        tags: [
          { label: 'anh Khôi +', tone: 'green' },
          { label: 'mở Thanh Toán Số', tone: 'green' },
        ],
        effects: { acceptDigital: true, trust: 22, xp: 45, happiness: 6 },
        reply:
          '“Hay quá, tháng sau hóa đơn tăng bất thường là app cảnh báo liền để mình kiểm tra đường ống ngay, không lo mất tiền oan nữa!”',
      },
      {
        id: 'fetch-water-well',
        text: 'Bảo gia đình anh Khôi... xách xô ra giếng làng đầu hẻm gánh nước về dùng',
        btnTone: 'red',
        tags: [
          { label: 'đau lưng mỏi gối', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trust: -10, happiness: -8 },
        reply:
          'Cả nhà 4 người xách xô bì bõm cả buổi chiều mới được nửa bể nước, anh Khôi đau lưng nằm liệt giường!',
      },
    ],
  },
  {
    id: 'req-student-laptop-do-an',
    archetype: 'STUDENT',
    missingService: 'BNPL',
    title: 'Laptop bốc khói đen sát đêm bảo vệ đồ án tốt nghiệp',
    subtitle: 'Huy sinh viên năm cuối đang ôm chiếc máy tính chết đứng...',
    body: 'Chiếc laptop cũ kỹ của Huy phát ra tiếng xèo xèo rồi bốc khói đen đúng 3 ngày trước buổi bảo vệ đồ án tốt nghiệp kỹ sư. Trong túi Huy chỉ còn 800 ngàn đồng, không đủ tiền thay mainboard chứ đừng nói mua máy mới! Bạn sẽ:',
    choices: [
      {
        id: 'grant-bnpl-laptop',
        text: 'Tài trợ 450.000đ săn deal laptop mới qua MoMo nhận combo voucher học tập',
        costCoins: 450000,
        btnTone: 'green',
        tags: [
          { label: '-450.000đ', tone: 'red' },
          { label: 'đạt thủ khoa đồ án ++', tone: 'green' },
          { label: 'ưu đãi thành viên', tone: 'green' },
        ],
        effects: { grantService: 'BNPL', trust: 32, xp: 70, happiness: 12 },
        reply:
          'Huy mang ngay chiếc laptop đời mới cấu hình mạnh về chạy mô phỏng 3D mượt mà! Buổi bảo vệ đạt điểm 10 tuyệt đối, cả hội đồng giáo sư vỗ tay khen ngợi!',
      },
      {
        id: 'guide-student-bnpl',
        text: 'Hướng dẫn Huy thanh toán bằng MoMo săn combo hoàn tiền và voucher',
        btnTone: 'blue',
        tags: [
          { label: 'giảm áp lực tài chính +', tone: 'green' },
          { label: 'ưu đãi thành viên', tone: 'green' },
        ],
        effects: { grantService: 'BNPL', trust: 22, xp: 50, happiness: 6 },
        reply:
          '“Nhờ combo hoàn tiền và voucher MoMo giảm giá sâu, chiếc máy mới cứu nguy cả sự nghiệp của em!”',
      },
      {
        id: 'write-code-paper',
        text: 'Bảo Huy... vẽ sơ đồ mạch và viết code đồ án ra 50 tờ giấy A4 nộp cho thầy',
        btnTone: 'red',
        tags: [
          { label: 'thầy giáo đuổi ra khỏi phòng', tone: 'red' },
          { label: 'nợ môn 1 năm', tone: 'neutral' },
        ],
        effects: { trust: -12, happiness: -8 },
        reply:
          'Thầy trưởng khoa nhìn xấp giấy viết tay nguệch ngoạc lắc đầu ngao ngán: “Thời buổi 4.0 ai lại mang sớ Táo Quân đi bảo vệ đồ án hả em?!”',
      },
    ],
  },
  {
    id: 'req-salaried-san-deal-com-trua',
    archetype: 'SALARIED',
    missingService: 'SAVINGS',
    title: 'Hội chị em văn phòng đau đầu vì tiền cơm trưa đắt đỏ',
    subtitle: 'Chị Lan và đồng nghiệp đang nhìn menu 75k/phần cơm tấm...',
    body: 'Khu văn phòng trung tâm đắt đỏ, mỗi bữa trưa cộng ly nước ép ngốn gần 100 ngàn đồng. Một tháng mất gần 2 triệu tiền ăn trưa, chị em rầu rĩ bàn tính chuyện nhịn ăn trưa để dành tiền săn sale! Bạn sẽ cứu đói thế nào?',
    choices: [
      {
        id: 'sponsor-food-voucher',
        text: 'Chi 300.000đ tung gói Voucher Ăn Trưa MoMo Food giảm 40% cho cả toà nhà',
        costCoins: 300000,
        btnTone: 'green',
        tags: [
          { label: '-300.000đ', tone: 'red' },
          { label: 'hội chị em hoan hô ++', tone: 'green' },
          { label: 'mở Tiết Kiệm Số', tone: 'green' },
        ],
        effects: { grantService: 'SAVINGS', trust: 28, xp: 60, happiness: 12 },
        reply:
          'Trưa nào văn phòng cũng rộn rã tiệc tùng! Cơm gà xối mỡ, bún bò, trà trái cây thơm lừng chỉ với giá nửa ly trà sữa. Chị em khen Thị Trưởng tâm lý số 1!',
      },
      {
        id: 'teach-group-ordering',
        text: 'Bày hội chị em tính năng Đặt Đơn Nhóm chia ship và tích điểm hoàn tiền MoMo',
        btnTone: 'blue',
        tags: [
          { label: 'tiết kiệm tiền túi +', tone: 'green' },
          { label: 'mở Tiết Kiệm Số', tone: 'green' },
        ],
        effects: { grantService: 'SAVINGS', trust: 20, xp: 45, happiness: 6 },
        reply:
          '“Gom đơn 8 người vừa được miễn phí giao hàng vừa dùng voucher giảm sâu, mỗi tháng dư cả triệu bỏ heo đất!”',
      },
      {
        id: 'eat-raw-cucumber',
        text: 'Khuyên mọi người... mỗi trưa ăn 1 trái dưa leo chấm muối ớt để vừa giảm cân vừa tiết kiệm',
        btnTone: 'red',
        tags: [
          { label: 'đói cồn cào cả buổi chiều', tone: 'red' },
          { label: 'đánh máy sai số liệu', tone: 'neutral' },
        ],
        effects: { trust: -10, happiness: -8 },
        reply:
          'Đến 14h chiều bụng cả phòng réo như sấm đánh, mắt mờ gõ nhầm số liệu kế toán bị sếp phê bình!',
      },
    ],
  },
  {
    id: 'req-gig-vay-nhanh-cuu-tro',
    archetype: 'GIG_WORKER',
    missingService: 'CREDIT',
    title: 'Bác tài xế xe ôm cần tiền gấp đóng tiền thuốc cho mẹ già',
    subtitle: 'Hải Xe Ôm đang ngồi thất thần trên yên xe máy cũ...',
    body: 'Mẹ Hải ở quê bất ngờ nhập viện cần 500 đồng tiền thuốc khẩn cấp. Tiền cuốc xe công nghệ cuối tuần mới đối soát về tài khoản, vay người ngoài thì sợ lãi cắt cổ. Hải tuyệt vọng cầu cứu Thị Trưởng:',
    choices: [
      {
        id: 'fast-money-support',
        text: 'Bảo lãnh gói Vay Nhanh MoMo FastMoney 500.000đ giải ngân trong 60 giây',
        costCoins: 500000,
        btnTone: 'green',
        tags: [
          { label: '-500.000đ', tone: 'red' },
          { label: 'cứu viện khẩn cấp ++', tone: 'green' },
          { label: 'mở Vay Vốn', tone: 'green' },
        ],
        effects: { grantService: 'CREDIT', trust: 32, xp: 70, happiness: 12 },
        reply:
          'Ting ting! Tiền giải ngân thẳng vào ví, Hải chuyển khoản ngay cho bệnh viện cứu mẹ qua cơn nguy kịch! Hải cúi đầu cảm ơn Thị Trưởng trọn nghĩa vẹn tình!',
      },
      {
        id: 'teach-micro-credit',
        text: 'Hướng dẫn Hải tra cứu điểm tin cậy và kích hoạt hạn mức Vay Tiêu Dùng an toàn trên MoMo',
        btnTone: 'blue',
        tags: [
          { label: 'Hải yên tâm +', tone: 'green' },
          { label: 'mở Vay Vốn', tone: 'green' },
        ],
        effects: { grantService: 'CREDIT', trust: 22, xp: 50, happiness: 6 },
        reply:
          '“Vay tổ chức tài chính uy tín liên kết MoMo lãi suất minh bạch, không lo bị tín dụng đen quấy phá, mừng quá anh ơi!”',
      },
      {
        id: 'pawn-motorbike',
        text: 'Bảo Hải... đem chiếc xe máy cày cuốc duy nhất vào tiệm cầm đồ cầm tạm',
        btnTone: 'red',
        tags: [
          { label: 'mất cần câu cơm', tone: 'red' },
          { label: 'thất nghiệp dài hạn', tone: 'neutral' },
        ],
        effects: { trust: -14, happiness: -8 },
        reply:
          'Mất xe máy làm Hải không còn phương tiện chạy cuốc, vòng xoáy nợ nần bủa vây không lối thoát!',
      },
    ],
  },
  {
    id: 'req-merchant-tra-gop-may-pha-cafe',
    archetype: 'MERCHANT_ESTABLISHED',
    missingService: 'CREDIT',
    title: 'Quán cà phê muốn lên đời máy pha Espresso Ý 30 triệu',
    subtitle: 'Bác Quý chủ quán cà phê đang nhìn chiếc phin nhôm rỉ giọt chậm rì...',
    body: 'Khách trẻ vào quán toàn gọi Cold Brew và Latte bọt sữa nghệ thuật, trong khi quán chỉ có phin nhôm nhỏ giọt mất 15 phút. Bác Quý muốn mua máy pha chuyên nghiệp của Ý nhưng thiếu vốn lưu động. Bạn sẽ:',
    choices: [
      {
        id: 'business-credit-espresso',
        text: 'Bảo lãnh gói Vốn Kinh Doanh Trả Góp MoMo 600.000đ rinh ngay máy pha xịn sò',
        costCoins: 600000,
        btnTone: 'green',
        tags: [
          { label: '-600.000đ', tone: 'red' },
          { label: 'doanh thu quán x3 ++', tone: 'green' },
          { label: 'mở Tín Dụng Số', tone: 'green' },
        ],
        effects: { grantService: 'CREDIT', trust: 30, xp: 75, happiness: 12 },
        reply:
          'Máy pha Espresso bóng loáng đánh bọt sữa béo ngậy chỉ trong 30 giây! Quán bác Quý kín bàn từ sáng đến tối, doanh thu tăng vọt gấp 3 lần!',
      },
      {
        id: 'merchant-installments',
        text: 'Tư vấn bác Quý trả góp máy qua tài khoản doanh nghiệp MoMo Merchant trích từ doanh thu QR',
        btnTone: 'blue',
        tags: [
          { label: 'bác Quý gật gù +', tone: 'green' },
          { label: 'mở Tín Dụng Số', tone: 'green' },
        ],
        effects: { grantService: 'CREDIT', trust: 22, xp: 55, happiness: 6 },
        reply:
          '“Mỗi ngày khách quét mã trả ly cà phê là máy tự trích trả nợ một chút, êm ru không nặng gánh chút nào!”',
      },
      {
        id: 'use-giant-aluminum-filter',
        text: 'Khuyên bác Quý... đặt gò chiếc phin nhôm khổng lồ đường kính 1 mét pha cho nhiều',
        btnTone: 'red',
        tags: [
          { label: 'cà phê nguội ngắt', tone: 'red' },
          { label: 'khách bỏ về', tone: 'neutral' },
        ],
        effects: { trust: -10, happiness: -8 },
        reply:
          'Chiếc phin khổng lồ nặng trĩu làm đổ ụp cả xô bột cà phê đen sì ra sàn nhà, khách hàng chạy tán loạn!',
      },
    ],
  },
  {
    id: 'req-elder-dong-tien-rac',
    archetype: 'ELDER',
    requiresDigital: false,
    title: 'Bác tổ trưởng dân phố đi gõ cửa từng nhà thu tiền rác',
    subtitle: 'Bác Tư Trà Đá mồ hôi ướt đẫm áo sau 3 giờ leo cầu thang...',
    body: 'Khu phố có 120 hộ gia đình. Tháng nào Bác Tư cũng phải cầm cuốn sổ tay leo 5 tầng cầu thang từng nhà để thu 35 ngàn tiền vệ sinh môi trường, nhiều nhà đi vắng phải gõ cửa 4-5 lần mới gặp! Bạn sẽ giải cứu:',
    choices: [
      {
        id: 'digital-waste-fee',
        text: 'Chi 280.000đ tích hợp thu phí Vệ Sinh Môi Trường trực tuyến qua MoMo cho toàn khu phố',
        costCoins: 280000,
        btnTone: 'green',
        tags: [
          { label: '-280.000đ', tone: 'red' },
          { label: 'bác Tư khỏe re ++', tone: 'green' },
          { label: 'mở Thanh Toán Số', tone: 'green' },
        ],
        effects: { acceptDigital: true, trust: 32, xp: 65, happiness: 12 },
        reply:
          'Đến kỳ là điện thoại cư dân tự báo hóa đơn rác 35k, bấm 1 chạm thanh toán xong! Bác Tư thong thả ngồi uống trà đàm đạo không phải leo cầu thang nữa!',
      },
      {
        id: 'guide-qr-community',
        text: 'Tạo mã VietQR thu phí khu phố dán ngay bảng tin sảnh chung cư',
        btnTone: 'blue',
        tags: [
          { label: 'khu phố văn minh +', tone: 'green' },
          { label: 'mở Thanh Toán Số', tone: 'green' },
        ],
        effects: { acceptDigital: true, trust: 20, xp: 45, happiness: 6 },
        reply:
          '“Bà con đi làm về quét mã cái rẹt là xong, thu đủ 100% trong 2 ngày đầu tháng, hiện đại thật sự!”',
      },
      {
        id: 'use-megaphone-shout',
        text: 'Bảo bác Tư... bắc loa pin đứng dưới sân gào tên từng hộ chưa nộp tiền rác',
        btnTone: 'red',
        tags: [
          { label: 'hàng xóm cãi nhau to', tone: 'red' },
          { label: 'mất tình đoàn kết', tone: 'neutral' },
        ],
        effects: { trust: -12, happiness: -8 },
        reply:
          'Tiếng loa pin oang oang làm cả xóm bức xúc ném vỏ lon xuống sân, tình làng nghĩa xóm sứt mẻ nghiêm trọng!',
      },
    ],
  },
  {
    id: 'req-student-nap-the-game-giam-gia',
    archetype: 'STUDENT',
    missingService: 'CREDIT_SCORE',
    title: 'Giải đấu Esports trường đại học nhưng đội trưởng cạn tiền nạp thẻ',
    subtitle: 'Đạt và đồng đội đang ngồi vò đầu bứt tai trước giờ thi đấu...',
    body: 'Đội tuyển Esports của trường vào tới trận Chung Kết nhưng nhân vật chính thiếu trang bị bảo hộ tối tân. Cả đội gom hết tiền lẻ chỉ được 80 ngàn đồng, trong khi cần nạp 200 ngàn mua thẻ game kích hoạt kỹ năng. Bạn sẽ:',
    choices: [
      {
        id: 'sponsor-game-card',
        text: 'Chi 250.000đ nạp thẻ game chiết khấu cao qua MoMo + nâng điểm uy tín cho Đạt',
        costCoins: 250000,
        btnTone: 'green',
        tags: [
          { label: '-250.000đ', tone: 'red' },
          { label: 'đoạt cúp vô địch ++', tone: 'green' },
          { label: 'mở Điểm Tín Dụng', tone: 'green' },
        ],
        effects: { grantService: 'CREDIT_SCORE', trust: 30, xp: 60, happiness: 12 },
        reply:
          'Thẻ nạp thành công trong 5 giây! Cả đội phối hợp ăn ý giành chức Vô Địch trường, rinh cúp vàng danh giá về cho khoa công nghệ!',
      },
      {
        id: 'guide-game-topup',
        text: 'Chỉ cả nhóm cách săn voucher nạp thẻ game hoàn tiền và tích điểm tín dụng trên MoMo',
        btnTone: 'blue',
        tags: [
          { label: 'tinh thần đồng đội +', tone: 'green' },
          { label: 'mở Điểm Tín Dụng', tone: 'green' },
        ],
        effects: { grantService: 'CREDIT_SCORE', trust: 22, xp: 45, happiness: 6 },
        reply:
          '“Nạp trên MoMo vừa có chiết khấu cao vừa tăng điểm tín dụng cá nhân, chuẩn game thủ văn minh thời đại số!”',
      },
      {
        id: 'play-without-items',
        text: 'Khuyên cả đội... dùng nhân vật mặc định không đồ thi đấu lấy kinh nghiệm',
        btnTone: 'red',
        tags: [
          { label: 'thua trắng 0-3', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trust: -10, happiness: -8 },
        reply:
          'Vừa vào trận được 2 phút thì bị đối thủ trang bị tận răng quét sạch cả đội, 5 game thủ nhìn nhau buồn thiu!',
      },
    ],
  },
  {
    id: 'req-salaried-chuyen-tien-dam-cuoi',
    archetype: 'SALARIED',
    requiresDigital: false,
    title: 'Mùa cưới 5 đám một tuần, cây ATM đầu đường hết sạch tiền mặt',
    subtitle: 'Anh Huy Designer đang đứng nhìn cây ATM báo lỗi màn hình xanh...',
    body: 'Cuối tuần đi 2 đám cưới đồng nghiệp, anh Huy chạy xe khắp 3 cây ATM đều thông báo “Tạm ngừng phục vụ vì hết tiền mặt”. Không có tiền mặt nhét phong bì mừng cưới thì không biết giấu mặt vào đâu! Bạn sẽ cứu cánh thế nào?',
    choices: [
      {
        id: 'transfer-wedding-momo',
        text: 'Tài trợ 320.000đ mở tính năng Chuyển Tiền Mừng Cưới MoMo kèm thiệp 3D độc quyền',
        costCoins: 320000,
        btnTone: 'green',
        tags: [
          { label: '-320.000đ', tone: 'red' },
          { label: 'cô dâu chú rể thích mê ++', tone: 'green' },
          { label: 'mở Thanh Toán Số', tone: 'green' },
        ],
        effects: { acceptDigital: true, trust: 30, xp: 60, happiness: 12 },
        reply:
          'Thiệp cưới hoạt hình 3D kèm lời chúc hóm hỉnh ting ting thẳng vào ví cô dâu chú rể! Đôi tân lang tân nương khoe lên trang cá nhân khen nức nở!',
      },
      {
        id: 'teach-digital-li-xi',
        text: 'Hướng dẫn anh Huy quét mã QR trên bàn tiệc cưới để chuyển tiền mừng tiện lợi',
        btnTone: 'blue',
        tags: [
          { label: 'anh Huy +', tone: 'green' },
          { label: 'mở Thanh Toán Số', tone: 'green' },
        ],
        effects: { acceptDigital: true, trust: 20, xp: 45, happiness: 6 },
        reply:
          '“Bây giờ đám cưới hiện đại để sẵn mã QR xinh xắn, quét 3 giây là xong khỏi lo đổi tiền mới nhét phong bì!”',
      },
      {
        id: 'empty-envelope-promise',
        text: 'Bảo anh Huy... cứ nhét phong bì rỗng ghi giấy hẹn “Tuần sau anh chuyển khoản”',
        btnTone: 'red',
        tags: [
          { label: 'bị cô dâu gạch tên', tone: 'red' },
          { label: 'quê độ cả công ty', tone: 'neutral' },
        ],
        effects: { trust: -12, happiness: -8 },
        reply:
          'Hôm sau cô dâu mở phong bì thấy tờ giấy hẹn, đăng ẩn danh lên hội nhóm công ty làm anh Huy ngượng chín mặt!',
      },
    ],
  },
  {
    id: 'req-merchant-vietqr-pro',
    archetype: 'MERCHANT_CASH',
    requiresDigital: false,
    title: 'Bảng mã QR in giấy bị tạt nước mưa nhòe nhoẹt không quét nổi',
    subtitle: 'Dì Mười Xôi đang dùng khăn lau tờ giấy A4 rách mép...',
    body: 'Xe xôi sáng của Dì Mười in mã QR ra tờ giấy dán tạm vào thùng xôi. Cơn mưa rào bất chợt làm mực in nhòe nhoẹt, camera điện thoại của khách quét hoài không ra số tài khoản, khách vội đi làm đành bỏ đi! Bạn sẽ giúp dì:',
    choices: [
      {
        id: 'gift-vietqr-pro-board',
        text: 'Chi 280.000đ tặng Bảng Mica VietQR Pro MoMo chống nước, chống xước để bàn',
        costCoins: 280000,
        btnTone: 'green',
        tags: [
          { label: '-280.000đ', tone: 'red' },
          { label: 'xe xôi sáng loáng ++', tone: 'green' },
          { label: 'mở Loa QR cả tiệm', tone: 'green' },
        ],
        effects: { acceptDigital: true, trust: 30, xp: 60, happiness: 12 },
        reply:
          'Bảng mica VietQR Pro sáng choang, quét từ xa 1 mét cũng nhận tức thì! Khách đứng xếp hàng quét mã rào rào, nồi xôi vơi sạch trước 8h sáng!',
      },
      {
        id: 'laminate-qr-sheet',
        text: 'Bày Dì Mười ép nhựa dẻo bảng mã QR và dán vào vị trí khô ráo dưới mái che',
        btnTone: 'blue',
        tags: [
          { label: 'Dì Mười gật gù +', tone: 'green' },
          { label: 'mở QR tiệm', tone: 'green' },
        ],
        effects: { acceptDigital: true, trust: 20, xp: 45, happiness: 6 },
        reply:
          '“Có tấm bảo vệ vầy mưa gió bão bùng cũng không sợ hư mã, buôn bán an tâm hẳn ra con ơi!”',
      },
      {
        id: 'read-bank-number',
        text: 'Bảo Dì Mười... đọc thuộc lòng 14 chữ số tài khoản ngân hàng cho từng khách tự bấm',
        btnTone: 'red',
        tags: [
          { label: 'khách chuyển nhầm tiền', tone: 'red' },
          { label: 'kẹt cứng vỉa hè', tone: 'neutral' },
        ],
        effects: { trust: -10, happiness: -8 },
        reply:
          'Dì đọc số một đằng khách bấm một nẻo, tiền xôi 20 ngàn bay thẳng sang tài khoản của một người ở tận Cà Mau!',
      },
    ],
  },
  {
    id: 'req-family-bao-hiem-nam-vien',
    archetype: 'FAMILY',
    missingService: 'INSURANCE',
    title: 'Con nhỏ sốt xuất huyết nằm viện, hóa đơn ngoài BHYT làm cả nhà lo sốt vó',
    subtitle: 'Vợ chồng trẻ Minh - Thư đang nhìn bảng kê viện phí bệnh viện...',
    body: 'Bé Bơ 3 tuổi bị sốt xuất huyết phải nằm viện điều trị cả tuần. Mặc dù có BHYT nhưng các khoản xét nghiệm chuyên sâu, phòng dịch vụ và thuốc đặc trị lên tới 800 đồng làm quỹ tiết kiệm của đôi vợ chồng trẻ kiệt quệ. Bạn sẽ:',
    choices: [
      {
        id: 'activate-hospital-insurance',
        text: 'Tài trợ 480.000đ kích hoạt Bảo Hiểm Sức Khỏe & Trợ Cấp Viện Phí MoMo thanh toán trực tuyến',
        costCoins: 480000,
        btnTone: 'green',
        tags: [
          { label: '-480.000đ', tone: 'red' },
          { label: 'mở Bảo Hiểm Số', tone: 'green' },
          { label: 'bé Bơ khỏe mạnh ++', tone: 'green' },
        ],
        effects: { grantService: 'INSURANCE', trust: 32, xp: 75, happiness: 12 },
        reply:
          'Chỉ cần chụp hình toa thuốc và hóa đơn tải lên MoMo là bồi thường giải ngân trong 24 giờ! Bé Bơ bình phục xuất viện, gia đình nhỏ thở phào nhẹ nhõm!',
      },
      {
        id: 'guide-health-insurance',
        text: 'Tư vấn gói bảo hiểm tai nạn và viện phí gia đình giá rẻ chỉ từ vài trăm ngàn trên MoMo',
        btnTone: 'blue',
        tags: [
          { label: 'bảo vệ toàn diện +', tone: 'green' },
          { label: 'mở Bảo Hiểm Số', tone: 'green' },
        ],
        effects: { grantService: 'INSURANCE', trust: 22, xp: 50, happiness: 6 },
        reply:
          '“Có tấm khiên bảo hiểm che chở cho con cái thì bố mẹ yên tâm đi làm, không sợ rủi ro bất ngờ ập đến!”',
      },
      {
        id: 'borrow-everywhere',
        text: 'Khuyên hai vợ chồng... gọi điện thoại vay mượn 20 người bà con xa',
        btnTone: 'red',
        tags: [
          { label: 'bà con từ chối khéo', tone: 'red' },
          { label: 'thêm sầu thêm lo', tone: 'neutral' },
        ],
        effects: { trust: -12, happiness: -8 },
        reply:
          'Gọi cả ngày chỉ nhận lại những tiếng thở dài và lời từ chối khéo, không khí gia đình u ám nặng trĩu!',
      },
    ],
  },
  {
    id: 'req-gig-dien-thoai-vo-man-hinh',
    archetype: 'GIG_WORKER',
    missingService: 'INSURANCE',
    title: 'Cú phanh gấp làm điện thoại văng xuống đường vỡ nát màn hình',
    subtitle: 'Kiệt Freelancer đang nhặt từng mảnh kính vỡ của chiếc smartphone...',
    body: 'Đang chạy xe giao bản thiết kế gấp cho khách thì gặp ổ gà, điện thoại gắn trên tay lái văng xuống mặt đường nứt toác màn hình cảm ứng đen ngòm. Mất điện thoại coi như mất cần câu cơm và đứt liên lạc với đối tác! Bạn sẽ:',
    choices: [
      {
        id: 'claim-screen-insurance',
        text: 'Chi 350.000đ bồi hoàn Bảo Hiểm Rơi Vỡ Màn Hình MoMo thay màn hình chính hãng ngay',
        costCoins: 350000,
        btnTone: 'green',
        tags: [
          { label: '-350.000đ', tone: 'red' },
          { label: 'màn hình nét căng ++', tone: 'green' },
          { label: 'mở Bảo Hiểm Số', tone: 'green' },
        ],
        effects: { grantService: 'INSURANCE', trust: 30, xp: 60, happiness: 12 },
        reply:
          'Trung tâm bảo hành tiếp nhận và thay màn hình mới tinh trong ngày! Kiệt gửi bản thiết kế kịp hạn chót và nhận luôn tiền thưởng nóng từ đối tác!',
      },
      {
        id: 'guide-screen-ins',
        text: 'Hướng dẫn Kiệt mua gói bảo vệ màn hình điện thoại chỉ 15k/tháng trên MoMo',
        btnTone: 'blue',
        tags: [
          { label: 'bảo vệ dế yêu +', tone: 'green' },
          { label: 'mở Bảo Hiểm Số', tone: 'green' },
        ],
        effects: { grantService: 'INSURANCE', trust: 20, xp: 45, happiness: 6 },
        reply:
          '“Chi phí gói bảo hiểm chỉ bằng 1 gói xôi mà bảo vệ màn hình điện thoại hàng chục triệu, quá hời Thị Trưởng ơi!”',
      },
      {
        id: 'tape-broken-screen',
        text: 'Bảo Kiệt... dán băng keo trong chằng chịt lên màn hình vỡ dùng tạm',
        btnTone: 'red',
        tags: [
          { label: 'mảnh kính đâm xước ngón tay', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trust: -10, happiness: -8 },
        reply:
          'Vừa vuốt màn hình thì mảnh kính đâm chảy máu tay, máy tính bảng chập mạch tắt hẳn không cứu được!',
      },
    ],
  },
];
