import type { CityEventScript } from './types';

/**
 * 25 Sự kiện Toàn Thành Phố Mới (City-Wide Comedy & Societal Satire):
 * Phạt nguội Cổng Dịch Vụ Công, Marathon Heo Vàng 1 triệu bước chân,
 * Sốt vé tàu Tết, Tổng kiểm tra bảo hiểm xe máy, Nắng nóng 40 độ sập điện,
 * Cơn sốt trả góp iPhone 0%, Giải vô địch lãi kép Thần Tài, Bô lão dưỡng sinh vs Gen Z hiphop,
 * Đại hồng thủy trà sữa 1 đồng, Sự cố trạm BOT không dừng, Hội chợ nông sản số,
 * Trận mưa đá vỡ màn hình, Đêm hội hoa đăng từ thiện Trái Tim MoMo, Giải đấu Mobile Esports vỉa hè,
 * Bí kíp chi tiêu 50/30/20 bàn trà, Phượt thủ xuyên Việt 0 đồng tiền mặt,
 * Bảng điện tử chứng khoán tím ngắt, Bão biển bồi thường MoMo Travel, Tiệm vàng quét QR chỉ vàng,
 * Phố ẩm thực đêm 1000 món, Bé Bi đánh giày dán mã QR, Khách sạn thú cưng,
 * Tuyến phố đèn lồng 5G AR, Phòng chống lừa đảo công nghệ cao, Đại nhạc hội đêm giao thừa lì xì MoMo.
 */
export const EXTRA_CITY_EVENTS: CityEventScript[] = [
  {
    id: 'ev-nop-phat-nguoi-online',
    title: 'Cơn ác mộng phạt nguội & Màn giải cứu qua Cổng Dịch Vụ Công!',
    subtitle: 'Nhiều cư dân hoang mang vì nhận thông báo phạt nguội camera giao thông...',
    speaker: 'Anh Khoa Shipper & Chú Bảy Sửa Xe',
    body: 'Hệ thống camera AI của thành phố vừa gửi trát phạt nguội lỗi rẽ phải không xi-nhan cho hơn 100 xe máy và ô tô. Bà con nháo nhác định xin nghỉ làm nửa ngày lên kho bạc xếp hàng nộp phạt. Bạn sẽ xử lý thế nào?',
    minMayorLevel: 1,
    choices: [
      {
        id: 'guide-national-portal',
        text: 'Chi 600 đồng mở điểm hướng dẫn nộp phạt giao thông online qua MoMo tại Tòa Thị Chính',
        costCoins: 600,
        btnTone: 'green',
        tags: [
          { label: '-600 đồng', tone: 'red' },
          { label: 'nộp phạt 1 chạm ++', tone: 'green' },
          { label: 'bà con yên lòng', tone: 'green' },
        ],
        effects: { trustAll: 18, xp: 90, happiness: 12 },
        reply:
          'Cư dân chỉ cần nhập số biên bản là nộp phạt trong 1 phút, biên lai điện tử gửi về tức thì! Không một ai phải bỏ ngày công đi xếp hàng.',
      },
      {
        id: 'qr-ticket-billboard',
        text: 'Lắp bảng hướng dẫn tra cứu phạt nguội tự động trên Cổng Dịch Vụ Công liên kết MoMo',
        btnTone: 'blue',
        tags: [
          { label: 'minh bạch số liệu +', tone: 'green' },
          { label: '+55 XP', tone: 'green' },
        ],
        effects: { trustAll: 10, xp: 55, happiness: 6 },
        reply:
          'Bà con tự tra cứu biển số xe tại nhà trên điện thoại, ai nấy đều tấm tắc khen giao thông thành phố hiện đại.',
      },
      {
        id: 'hide-license-plates',
        text: 'Khuyên mọi người... lấy khẩu trang y tế bịt biển số xe lại khi ra đường',
        btnTone: 'red',
        tags: [
          { label: 'bị phạt tăng gấp ba', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -14, happiness: -8 },
        reply:
          'Vừa bịt khẩu trang ra đầu phố thì cả đội bị giữ xe xử lý nghiêm khắc, cả khu phố nhìn Thị Trưởng với ánh mắt hờn trách!',
      },
    ],
  },
  {
    id: 'ev-giai-chay-heo-dat',
    title: 'Đại Nhạc Hội Marathon Heo Vàng Xây Trường Vùng Cao!',
    subtitle: '1 triệu bước chân nhân ái đang rung chuyển khắp các đại lộ...',
    speaker: 'Bé Heo Vàng & Hội Sinh Viên MoCity',
    body: 'Chiến dịch "Nuôi Heo Vàng - Gom Bước Chân Xây Trường Cho Em" trên MoMo vừa khởi động. 5.000 cư dân từ cụ già đến học sinh cùng đổ ra đường chạy bộ biến các con phố thành biển người áo hồng rực rỡ! Thị Trưởng sẽ:',
    minMayorLevel: 1,
    choices: [
      {
        id: 'sponsor-gold-pig-run',
        text: 'Chi 900 đồng lập 10 trạm tiếp nước điện giải & nhân đôi số bước chân quyên góp toàn phố',
        costCoins: 900,
        btnTone: 'green',
        tags: [
          { label: '-900 đồng', tone: 'red' },
          { label: 'quyên góp 2 ngôi trường ++', tone: 'green' },
          { label: 'toàn dân tự hào', tone: 'green' },
        ],
        effects: { trustAll: 22, xp: 110, happiness: 12 },
        reply:
          'Cột mốc 2 triệu bước chân hoàn thành trong 1 buổi sáng! Hai điểm trường khang trang sắp được xây dựng trên vùng cao, cả thành phố ngập tràn niềm vui nhân ái!',
      },
      {
        id: 'cheerleader-team',
        text: 'Điều động đội mascot Heo Vàng nhảy flashmob cổ động dọc các tuyến phố đi bộ',
        btnTone: 'blue',
        tags: [
          { label: 'tinh thần thể thao +', tone: 'green' },
          { label: '+60 XP', tone: 'green' },
        ],
        effects: { trustAll: 12, xp: 60, happiness: 6 },
        reply:
          'Điệu nhảy lắc hông của Bé Heo Vàng làm bà con hào hứng vừa chạy vừa cười vang, phong trào rèn luyện sức khỏe lan tỏa khắp nơi!',
      },
      {
        id: 'stop-the-marathon',
        text: 'Ra lệnh giải tán cuộc chạy bộ vì... sợ mòn mặt đường nhựa của thành phố',
        btnTone: 'red',
        tags: [
          { label: 'cả thành phố phẫn nộ', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -16, happiness: -8 },
        reply:
          'Bà con treo cờ đen phản đối quyết định kỳ cục của Thị Trưởng, phong trào thiện nguyện bị dập tắt trong ngậm ngùi!',
      },
    ],
  },
  {
    id: 'ev-sot-ve-tau-hoa-tet',
    title: 'Cơn Sốt Vé Tàu Hỏa Bắc Nam & Đêm Trắng Săn Vé Trên MoMo!',
    subtitle: 'Hàng ngàn lao động ngóng chờ tấm vé về quê sum vầy cùng gia đình...',
    speaker: 'Bác Quý Cà Phê & Công Nhân Khu Chế đồngất',
    body: 'Hệ thống đường sắt mở bán đợt vé tàu Tết cuối cùng. Rất nhiều cô chú công nhân không rành công nghệ sợ lỡ chuyến tàu về quê ăn Tết cùng con cháu. Thị Trưởng quyết định hỗ trợ thế nào?',
    minMayorLevel: 1,
    choices: [
      {
        id: 'support-train-tickets',
        text: 'Chi 1.100 đồng lập bàn hỗ trợ săn vé tàu MoMo Travel xuyên đêm kèm trợ giá 20%',
        costCoins: 1100,
        btnTone: 'green',
        tags: [
          { label: '-1.100 đồng', tone: 'red' },
          { label: '100% công nhân có vé ++', tone: 'green' },
          { label: 'nước mắt sum vầy', tone: 'green' },
        ],
        effects: { trustAll: 24, xp: 125, happiness: 12 },
        reply:
          'Tất cả bà con đều cầm chắc tấm vé tàu điện tử trên tay! Những giọt nước mắt hạnh phúc lăn dài trên má những người con xa quê lâu năm.',
      },
      {
        id: 'open-free-wifi-hub',
        text: 'Mở cửa sảnh Tòa Thị Chính phát Wi-Fi tốc độ cao cho bà con ngồi săn vé',
        btnTone: 'blue',
        tags: [
          { label: 'ấm áp nghĩa tình +', tone: 'green' },
          { label: '+70 XP', tone: 'green' },
        ],
        effects: { trustAll: 14, xp: 70, happiness: 6 },
        reply:
          'Sảnh nhà rộn ràng tiếng reo hò mỗi khi một người đặt vé thành công, tinh thần đùm bọc sẻ chia ấm áp.',
      },
      {
        id: 'stay-for-tet',
        text: 'Bảo bà con... ở lại thành phố ăn Tết một mình cho đỡ kẹt tàu xe',
        btnTone: 'red',
        tags: [
          { label: 'nỗi buồn tha hương', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -15, happiness: -8 },
        reply:
          'Lời khuyên vô tâm làm nhiều cô chú nghẹn ngào rơi nước mắt, không khí Tết của khu phố trở nên ảm đạm.',
      },
    ],
  },
  {
    id: 'ev-bao-hiem-xe-may-tong-kiem-tra',
    title: 'Tuần Lễ Tổng Kiểm Tra Bảo Hiểm Xe Máy: Màn Cấp Thẻ 30 Giây!',
    subtitle: 'Đội tuần tra giao thông túc trực khắp các ngã tư...',
    speaker: 'Anh Tài Shipper & Đội Tuần Tra Dân Phố',
    body: 'Thành phố ra quân đợt cao điểm an toàn giao thông, yêu cầu 100% xe cơ giới phải có Bảo Hiểm Trách Nhiệm Dân Sự bắt buộc. Hàng trăm người hoang mang vì không biết mua ở đâu uy tín và hợp lệ. Bạn sẽ:',
    minMayorLevel: 1,
    choices: [
      {
        id: 'grant-digital-insurance-kiosk',
        text: 'Chi 750 đồng mở quầy cấp Bảo Hiểm Xe Máy MoMo Điện Tử lưu ví tức thì cho toàn dân',
        costCoins: 750,
        btnTone: 'green',
        tags: [
          { label: '-750 đồng', tone: 'red' },
          { label: 'chứng nhận số chuẩn bộ ++', tone: 'green' },
          { label: 'giao thông thông suốt', tone: 'green' },
        ],
        effects: { trustAll: 20, xp: 95, happiness: 12 },
        reply:
          'Chỉ cần quét mã QR là chứng nhận điện tử có hiệu lực ngay! Lực lượng kiểm tra quét mã QR xác thực trong 3 giây và cho xe qua nhanh chóng!',
      },
      {
        id: 'guide-in-app-purchase',
        text: 'Phát loa phường hướng dẫn bà con tự mua bảo hiểm điện tử trực tiếp trên ứng dụng MoMo',
        btnTone: 'blue',
        tags: [
          { label: 'tiện lợi minh bạch +', tone: 'green' },
          { label: '+60 XP', tone: 'green' },
        ],
        effects: { trustAll: 10, xp: 60, happiness: 6 },
        reply:
          'Bà con chỉ mất 1 phút thao tác trên điện thoại là có ngay bảo hiểm, không cần mang theo giấy tờ rườm rà.',
      },
      {
        id: 'switch-to-walking',
        text: 'Ban hành lệnh cấm xe máy, bắt toàn bộ dân cư... chuyển sang đi bộ',
        btnTone: 'red',
        tags: [
          { label: 'giao thông đình trệ', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -14, happiness: -8 },
        reply:
          'Các cửa hàng tê liệt vì hàng hóa không giao được, cư dân đi bộ rã rời chân tay kéo đến Tòa Thị Chính khiếu nại!',
      },
    ],
  },
  {
    id: 'ev-mat-dien-gio-cao-diem-mua-he',
    title: 'Nắng Nóng 40 Độ & Cú Sập Điện Tổng Vì 1.000 Máy Lạnh!',
    subtitle: 'Nắng như đổ lửa, trạm biến áp trung tâm phát tín hiệu quá tải...',
    speaker: 'Chú Thành Sửa Xe & Bác Hùng Điện Máy',
    body: 'Đợt nắng nóng kỷ lục khiến hàng ngàn hộ gia đình đồng loạt bật điều hòa 16 độ, làm trạm điện quá tải sập aptomat tổng. Cả thành phố biến thành lò xông hơi khổng lồ! Thị Trưởng giải cứu:',
    minMayorLevel: 1,
    choices: [
      {
        id: 'upgrade-grid-power',
        text: 'Chi 1.200 đồng nâng cấp biến áp thông minh & kích hoạt Thanh Toán Hóa Đơn Tự Động toàn phố',
        costCoins: 1200,
        btnTone: 'green',
        tags: [
          { label: '-1.200 đồng', tone: 'red' },
          { label: 'điện lưới mát rượi ++', tone: 'green' },
          { label: 'bà con thở phào', tone: 'green' },
        ],
        effects: { trustAll: 22, xp: 120, happiness: 12 },
        reply:
          'Hệ thống điện thông minh vận hành trơn tru! Quạt mát chạy vù vù, máy lạnh phả hơi sảng khoái, cả xóm thở phào hoan hô Thị Trưởng!',
      },
      {
        id: 'cool-zones-community',
        text: 'Mở cửa các trung tâm thương mại và rạp MoMo Cinema làm điểm tránh nóng miễn phí',
        btnTone: 'blue',
        tags: [
          { label: 'sẻ chia cộng đồng +', tone: 'green' },
          { label: '+70 XP', tone: 'green' },
        ],
        effects: { trustAll: 12, xp: 70, happiness: 6 },
        reply:
          'Bà con cùng nhau vào rạp phim tránh nóng và thưởng thức những bộ phim hay, gắn kết tình làng nghĩa xóm.',
      },
      {
        id: 'fan-palm-leaf',
        text: 'Phát cho mỗi nhà... 2 chiếc quạt mo cau tự quạt tay giải nhiệt',
        btnTone: 'red',
        tags: [
          { label: 'quạt gãy mỏi tay', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -12, happiness: -8 },
        reply:
          'Quạt được 10 phút thì gãy cán, mồ hôi nhễ nhại như tắm, ai nấy đều bực dọc khó chịu!',
      },
    ],
  },
  {
    id: 'ev-tra-gop-iphone-moi',
    title: 'Cơn Sốt Điện Thoại Mới & Trào Lưu Trả Góp 0% Ví Trả Sau!',
    subtitle: 'Dòng người xếp hàng dài trước cửa hàng điện máy trung tâm...',
    speaker: 'Anh Phúc Điện Máy & Khánh Gen Z',
    body: 'Dòng điện thoại thông minh thế hệ mới nhất vừa ra mắt. Hàng trăm bạn trẻ và dân công sở khao khát sở hữu nhưng giá bán một lần quá cao so với thu nhập tháng. Cửa hàng điện máy sắp xảy ra chen lấn! Bạn sẽ:',
    minMayorLevel: 1,
    choices: [
      {
        id: 'sponsor-installment-festival',
        text: 'Chi 850 đồng mở ngày hội “Trả Góp 0% Lãi Suất qua Ví Trả Sau MoMo” chia nhỏ 12 tháng',
        costCoins: 850,
        btnTone: 'green',
        tags: [
          { label: '-850 đồng', tone: 'red' },
          { label: 'rước máy xịn sò ++', tone: 'green' },
          { label: 'quản lý tài chính tốt', tone: 'green' },
        ],
        effects: { trustAll: 20, xp: 100, happiness: 12 },
        reply:
          'Khách hàng rinh điện thoại mới trong niềm hân hoan! Mỗi tháng chỉ trả một khoản nhỏ vừa sức, không lo thâm hụt ngân sách gia đình!',
      },
      {
        id: 'teach-responsible-credit',
        text: 'Phát cẩm nang hướng dẫn sử dụng hạn mức tín dụng tiêu dùng thông minh và an toàn',
        btnTone: 'blue',
        tags: [
          { label: 'tiêu dùng thông thái +', tone: 'green' },
          { label: '+55 XP', tone: 'green' },
        ],
        effects: { trustAll: 10, xp: 55, happiness: 6 },
        reply:
          'Nhiều bạn trẻ cân nhắc kỹ lưỡng năng lực tài chính trước khi xuống tiền, hình thành thói quen chi tiêu chín chắn.',
      },
      {
        id: 'smash-display-phones',
        text: 'Tịch thu hết máy mới ép bà con quay về dùng... điện thoại bàn quay số',
        btnTone: 'red',
        tags: [
          { label: 'Gen Z biểu tình', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -15, happiness: -8 },
        reply:
          'Giới trẻ đăng hàng ngàn video phản đối Thị Trưởng cổ hủ, cửa hàng điện máy khiếu nại bồi thường thiệt hại!',
      },
    ],
  },
  {
    id: 'ev-cuoc-dua-lai-kep-than-tai',
    title: 'Giải Vô Địch Thần Tài: Đọ Số Dư Sinh Lời Mỗi Sáng 7 Giờ!',
    subtitle: 'Tiếng ting ting báo lãi nhảy múa trên màn hình khắp các ngõ hẻm...',
    speaker: 'Anh Long Tài Chính & Chị Ngân Kế Toán',
    body: 'Một trào lưu mới bùng nổ: Cứ đúng 7h sáng, bà con lại chụp màn hình tiền lãi sinh lời từ Túi Thần Tài MoMo để khoe trong nhóm chat khu phố. Ai cũng muốn tối ưu hóa dòng tiền nhàn rỗi! Bạn sẽ định hướng thế nào?',
    minMayorLevel: 2,
    choices: [
      {
        id: 'host-financial-award',
        text: 'Chi 800 đồng trao Cúp “Bàn Tay Vàng Tích Lũy” & tặng thêm quà may mắn vào Túi Thần Tài toàn dân',
        costCoins: 800,
        btnTone: 'green',
        tags: [
          { label: '-800 đồng', tone: 'red' },
          { label: 'toàn dân tích lũy ++', tone: 'green' },
          { label: 'tài chính xanh mướt', tone: 'green' },
        ],
        effects: { trustAll: 20, xp: 105, happiness: 12 },
        reply:
          'Khu phố trở thành hình mẫu đô thị tài chính thông minh! Tiền nhàn rỗi đẻ lãi mỗi ngày giúp bà con có thêm thu nhập thụ động bền vững.',
      },
      {
        id: 'explain-yield-mechanics',
        text: 'Mở buổi workshop giải thích cơ chế sinh lời và tính thanh khoản an toàn của MoMo',
        btnTone: 'blue',
        tags: [
          { label: 'kiến thức thực tiễn +', tone: 'green' },
          { label: '+60 XP', tone: 'green' },
        ],
        effects: { trustAll: 10, xp: 60, happiness: 6 },
        reply:
          'Bà con hiểu sâu hơn về quản lý tài sản cá nhân và biết cách tận dụng lãi kép để xây dựng quỹ khẩn cấp.',
      },
      {
        id: 'ban-morning-ting',
        text: 'Cấm cư dân mở điện thoại trước 9h sáng để... không ai được khoe lãi',
        btnTone: 'red',
        tags: [
          { label: 'cư dân bất mãn', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -12, happiness: -8 },
        reply:
          'Quy định kỳ quặc làm mọi người cảm thấy bị can thiệp đời tư, uy tín của Thị Trưởng sụt giảm nghiêm trọng!',
      },
    ],
  },
  {
    id: 'ev-khieu-vu-duong-pho-duong-sinh',
    title: 'Câu Lạc Bộ Dưỡng Sinh Bô Lão Chiếm Trọn Sân Bóng Rổ Gen Z!',
    subtitle: 'Tiếng nhạc múa quạt du dương đối đầu giai điệu Hiphop dồn dập...',
    speaker: 'Bác Tư Trà Đá & Tuấn KTX',
    body: 'Hội người cao tuổi mang loa ra sân trung tâm múa quạt dưỡng sinh, trong khi đội bóng rổ sinh viên đang chuẩn bị đấu giải trường. Hai bên đứng giằng co cái sân suốt 2 tiếng không ai chịu nhường ai! Bạn sẽ phân xử:',
    minMayorLevel: 2,
    choices: [
      {
        id: 'build-dual-arena',
        text: 'Chi 950 đồng mở rộng sân khấu đa năng có sàn gỗ dưỡng sinh và sân bóng rổ tiêu chuẩn riêng',
        costCoins: 950,
        btnTone: 'green',
        tags: [
          { label: '-950 đồng', tone: 'red' },
          { label: 'già trẻ hòa thuận ++', tone: 'green' },
          { label: 'không gian rực rỡ', tone: 'green' },
        ],
        effects: { trustAll: 22, xp: 115, happiness: 12 },
        reply:
          'Hai sân khấu lung linh đèn chiếu sáng! Cụ già khoan thai múa quạt, thanh niên ném bóng rổ sôi động, cuối buổi còn chụp ảnh chung giao lưu thắm thiết!',
      },
      {
        id: 'time-slot-schedule',
        text: 'Chia khung giờ khoa học: Sáng sớm dành cho dưỡng sinh, chiều tối dành cho thể thao Gen Z',
        btnTone: 'blue',
        tags: [
          { label: 'cân bằng hợp lý +', tone: 'green' },
          { label: '+65 XP', tone: 'green' },
        ],
        effects: { trustAll: 12, xp: 65, happiness: 6 },
        reply:
          'Lịch phân chia công bằng được hai bên nhất trí đồng thuận, trật tự công cộng được đảm bảo êm đẹp.',
      },
      {
        id: 'turn-off-all-music',
        text: 'Tịch thu cả loa lẫn quả bóng rổ, biến sân thành... bãi cỏ cấm dẫm chân',
        btnTone: 'red',
        tags: [
          { label: 'hai thế hệ cùng giận', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -14, happiness: -8 },
        reply:
          'Sân khấu bỏ hoang vắng ngắt, cả các cụ lẫn các bạn trẻ đều buồn bã vì mất đi nơi sinh hoạt thể chất!',
      },
    ],
  },
  {
    id: 'ev-con-sot-tra-sua-1-xu',
    title: 'Đại Hồng Thủy Trà Sữa 1 đồng & Biệt Đội Shipper Giải Cứu!',
    subtitle: '50.000 ly trà sữa bốc khói ordered cùng một khung giờ vàng...',
    speaker: 'Bảo Ngọc KOC & Anh Phát Shipper',
    body: 'Chiến dịch siêu voucher 1 đồng của MoMo Food bùng nổ, đơn trà sữa trân chú đổ về dồn dập làm máy in hóa đơn của các quán chạy cháy cả giấy! Hàng trăm shipper áo hồng chạy thục mạng qua từng con phố. Bạn sẽ:',
    minMayorLevel: 2,
    choices: [
      {
        id: 'support-shipper-fleet',
        text: 'Chi 1.000 đồng lập Trạm Nghỉ Chân Shipper miễn phí nước mát & thưởng nóng 50 đồng mỗi đơn giao nhanh',
        costCoins: 1000,
        btnTone: 'green',
        tags: [
          { label: '-1.000 đồng', tone: 'red' },
          { label: 'giao sạch 50k ly ++', tone: 'green' },
          { label: 'shipper tôn vinh', tone: 'green' },
        ],
        effects: { trustAll: 24, xp: 125, happiness: 12 },
        reply:
          'Biệt đội giao hàng chạy mượt như thoi đưa! Từng ly trà sữa mát lạnh giao tận tay khách đúng giờ, ai nấy đều tấm tắc khen dịch vụ 5 sao!',
      },
      {
        id: 'smart-pickup-station',
        text: 'Mở tủ nhận hàng tự động Smart Locker tại các sảnh chung cư tránh shipper leo lầu',
        btnTone: 'blue',
        tags: [
          { label: 'tiết kiệm công sức +', tone: 'green' },
          { label: '+70 XP', tone: 'green' },
        ],
        effects: { trustAll: 14, xp: 70, happiness: 6 },
        reply:
          'Shipper chỉ cần thả đồ vào tủ mã số, khách hàng xuống lấy tiện lợi, tốc độ giao hàng tăng gấp đôi!',
      },
      {
        id: 'cancel-all-tea',
        text: 'Bắt các quán trà sữa đổ bỏ trân châu chuyển sang bán... nước sôi để nguội',
        btnTone: 'red',
        tags: [
          { label: 'fan trà sữa khóc thét', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -16, happiness: -8 },
        reply:
          'Cộng đồng mạng bùng nổ làn sóng phản đối dữ dội, các chủ quán trà sữa biểu tình đòi lại quyền bán trân châu!',
      },
    ],
  },
  {
    id: 'ev-su-co-vetc-tram-thu-phi',
    title: 'Kẹt Xe Cửa Ngõ Vì 50 Xe Quên Nạp Tài Khoản Thu Phí Tự Động!',
    subtitle: 'Đoàn xe nối dài 3 cây số trước trạm BOT MoCity...',
    speaker: 'Bác Sáu Gạo & Tổ Trọng Tài Đô Thị',
    body: 'Đầu tuần lượng xe tải và ô tô vào thành phố đông đúc nhưng nhiều tài xế quên nạp tiền vào tài khoản VETC/ePass khiến barie không mở. Xe cộ ùn tắc kéo dài gây tắc nghẽn cả tuyến huyết mạch! Thị Trưởng sẽ:',
    minMayorLevel: 2,
    choices: [
      {
        id: 'instant-etc-topup-booth',
        text: 'Chi 700 đồng lập Trạm Hỗ Trợ Nạp VETC Tức Thì qua MoMo ngay làn khẩn cấp',
        costCoins: 700,
        btnTone: 'green',
        tags: [
          { label: '-700 đồng', tone: 'red' },
          { label: 'thông xe 5 phút ++', tone: 'green' },
          { label: 'tài xế nhẹ nhõm', tone: 'green' },
        ],
        effects: { trustAll: 18, xp: 95, happiness: 12 },
        reply:
          'Các tài xế chỉ cần quét mã QR trên biển chỉ dẫn là tiền vào tài khoản VETC sau 2 giây! Barie mở liên hồi, đoàn xe thông suốt êm ả!',
      },
      {
        id: 'install-auto-reminder-cam',
        text: 'Lắp biển báo thông minh nhắc nhở kiểm tra số dư VETC từ xa 1 cây số',
        btnTone: 'blue',
        tags: [
          { label: 'chủ động từ xa +', tone: 'green' },
          { label: '+55 XP', tone: 'green' },
        ],
        effects: { trustAll: 10, xp: 55, happiness: 6 },
        reply:
          'Tài xế nhận diện từ xa và nạp tiền trước khi chạm trạm, hiện tượng tắc nghẽn giảm hẳn 90%.',
      },
      {
        id: 'shut-down-bot',
        text: 'Hạ barie đóng chặt trạm thu phí bắt tất cả xe... quay đầu đi đường rừng',
        btnTone: 'red',
        tags: [
          { label: 'tắc nghẽn tê liệt', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -15, happiness: -8 },
        reply:
          'Hàng trăm tài xế bức xúc xuống đường phản đối, chuỗi cung ứng hàng hóa thành phố bị gián đoạn cả ngày!',
      },
    ],
  },
  {
    id: 'ev-hoi-cho-nong-san-so',
    title: 'Hội Chợ Nông Sản Số: Bà Con Tiểu Thương Livestream Bán Bưởi!',
    subtitle: 'Nông sản miền Tây đổ bộ quảng trường với thanh toán 100% không tiền mặt...',
    speaker: 'Cô Ba Bánh Mì & Dì Bảy Chè',
    body: '50 gian hàng trái cây miệt vườn và đặc sản vùng miền mở hội chợ tại quảng trường. Các cô chú tiểu thương lần đầu được trang bị bảng mã QR và loa thông minh để vừa bán hàng vừa livestream chốt đơn. Bạn sẽ tiếp sức:',
    minMayorLevel: 2,
    choices: [
      {
        id: 'sponsor-digital-expo',
        text: 'Chi 900 đồng tài trợ Sân Khấu Livestream & hoàn tiền 15% cho khách quét MoMo mua nông sản',
        costCoins: 900,
        btnTone: 'green',
        tags: [
          { label: '-900 đồng', tone: 'red' },
          { label: 'cháy sạch 20 tấn quả ++', tone: 'green' },
          { label: 'nông dân phấn khởi', tone: 'green' },
        ],
        effects: { trustAll: 22, xp: 110, happiness: 12 },
        reply:
          '20 tấn bưởi da xanh và sầu riêng bán sạch veo trong 3 giờ! Loa Thần Tài đọc tiền ting ting không ngớt, bà con nông dân cười rạng rỡ đón vụ mùa bội thu!',
      },
      {
        id: 'provide-wifi-stands',
        text: 'Trang bị trạm sạc điện thoại và kết nối Wi-Fi tốc độ cao cho từng gian hàng',
        btnTone: 'blue',
        tags: [
          { label: 'hạ tầng tiện nghi +', tone: 'green' },
          { label: '+60 XP', tone: 'green' },
        ],
        effects: { trustAll: 12, xp: 60, happiness: 6 },
        reply:
          'Tiểu thương livestream mượt mà, khách hàng thanh toán nhanh gọn không cần mang theo tiền mặt.',
      },
      {
        id: 'require-paper-barter',
        text: 'Bắt hội chợ quay về thời kỳ đồ đá... đổi bưởi lấy gạo chứ không được nhận tiền',
        btnTone: 'red',
        tags: [
          { label: 'hội chợ vỡ trận', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -14, happiness: -8 },
        reply:
          'Không ai mang gạo đi đổi lấy trái cây, nông sản để ngoài nắng bắt đầu hư hỏng, tiểu thương thở dài ngao ngán!',
      },
    ],
  },
  {
    id: 'ev-mua-da-vo-man-hinh',
    title: 'Trận Mưa Đá Bất Chợt & Màn Cứu Hộ Màn Hình Toàn Phố!',
    subtitle: 'Những viên đá to bằng quả trứng rơi rào rào làm nứt vỡ nhiều thiết bị...',
    speaker: 'Kiệt Freelancer & Bác Quý Điện Máy',
    body: 'Hiện tượng thời tiết dị thường làm mưa đá rơi như trút xuống khu trung tâm. Hàng trăm chiếc điện thoại đang gắn trên xe máy bị đá đập nứt vỡ màn hình. Chi phí sửa chữa làm bà con lao đao! Thị Trưởng giải cứu:',
    minMayorLevel: 2,
    choices: [
      {
        id: 'emergency-screen-relief',
        text: 'Chi 1.100 đồng kích hoạt Quỹ Hỗ Trợ Bảo Hiểm Rơi Vỡ Màn Hình MoMo thay màn hình chính hãng 50%',
        costCoins: 1100,
        btnTone: 'green',
        tags: [
          { label: '-1.100 đồng', tone: 'red' },
          { label: 'màn hình mới tinh ++', tone: 'green' },
          { label: 'toàn dân cảm kích', tone: 'green' },
        ],
        effects: { trustAll: 24, xp: 125, happiness: 12 },
        reply:
          'Trung tâm bảo hành tiếp nhận xử lý thần tốc! Từng chiếc điện thoại sáng bóng trở lại, người dân cảm nhận được sự quan tâm chu đáo của Thị Trưởng!',
      },
      {
        id: 'setup-protective-canopy',
        text: 'Dựng mái che kiên cố dọc các tuyến phố đi bộ và bãi đỗ xe công cộng',
        btnTone: 'blue',
        tags: [
          { label: 'an toàn hạ tầng +', tone: 'green' },
          { label: '+70 XP', tone: 'green' },
        ],
        effects: { trustAll: 12, xp: 70, happiness: 6 },
        reply:
          'Hệ thống mái che bảo vệ phương tiện và người đi bộ khỏi các đợt thời tiết khắc nghiệt tiếp theo.',
      },
      {
        id: 'wear-pots-on-head',
        text: 'Khuyên bà con... úp nồi cơm điện lên đầu và nhét điện thoại vào túi nilon',
        btnTone: 'red',
        tags: [
          { label: 'cảnh tượng bi hài', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -14, happiness: -8 },
        reply:
          'Cư dân đội nồi cơm điện chạy ngoài đường trông kỳ dị, nước mưa vẫn ngấm vào hỏng sạch điện thoại!',
      },
    ],
  },
  {
    id: 'ev-hoi-hoa-dang-ngay-ram',
    title: 'Đêm Hội Hoa Đăng Cầu An & Quỹ Từ Thiện Trái Tim MoMo!',
    subtitle: 'Hàng ngàn ngọn hoa đăng lung linh trôi trên mặt hồ trung tâm...',
    speaker: 'Cụ Tâm & Bé Heo Vàng',
    body: 'Đêm rằm tháng Giêng, toàn thể cư dân tụ họp bên hồ nước trung tâm thả đèn hoa đăng cầu bình an và chung tay đóng góp quỹ phẫu thuật tim nhân đạo cho các bệnh nhi nghèo qua Trái Tim MoMo. Bạn sẽ chủ trì:',
    minMayorLevel: 2,
    choices: [
      {
        id: 'light-lantern-charity',
        text: 'Chi 900 đồng tài trợ 5.000 ngọn hoa đăng sinh học & góp 5 ca mổ tim cho các em nhỏ',
        costCoins: 900,
        btnTone: 'green',
        tags: [
          { label: '-900 đồng', tone: 'red' },
          { label: 'cứu sống 5 trái tim thơ ++', tone: 'green' },
          { label: 'hồ nước lung linh', tone: 'green' },
        ],
        effects: { trustAll: 25, xp: 130, happiness: 12 },
        reply:
          'Mặt hồ rực rỡ ngập tràn ánh sáng hy vọng! 5 em nhỏ mắc bệnh tim bẩm sinh đã được nhận trọn vẹn chi phí phẫu thuật, một đêm rằm linh thiêng lay động lòng người!',
      },
      {
        id: 'digital-heart-kiosk',
        text: 'Đặt bảng điện tử cho cư dân quét mã quyên góp tùy tâm trực tiếp vào quỹ Trái Tim MoMo',
        btnTone: 'blue',
        tags: [
          { label: 'nghĩa cử cao đẹp +', tone: 'green' },
          { label: '+75 XP', tone: 'green' },
        ],
        effects: { trustAll: 14, xp: 75, happiness: 6 },
        reply:
          'Từng đóng góp nhỏ bé từ vài ngàn đồng của bà con gom lại thành dòng nước mát lành sưởi ấm bao mảnh đời bất hạnh.',
      },
      {
        id: 'ban-the-lanterns',
        text: 'Cấm thả hoa đăng vì... sợ cá trong hồ giật mình mất ngủ',
        btnTone: 'red',
        tags: [
          { label: 'mất đi truyền thống đẹp', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -15, happiness: -8 },
        reply:
          'Không khí rằm tháng Giêng nguội lạnh, bà con buồn bã ra về trong sự tiếc nuối một nét đẹp văn hóa tâm linh.',
      },
    ],
  },
  {
    id: 'ev-giai-dau-esports-via-he',
    title: 'Giải Đấu Mobile Esports Vỉa Hè: Cơn Sốt Nạp Thẻ Game!',
    subtitle: 'Các quán trà đá biến thành đấu trường game di động kịch tính...',
    speaker: 'Đạt Sinh Viên & Khánh Gen Z',
    body: 'Vòng loại giải đấu game di động lớn nhất thành phố đang diễn ra tại các quán cà phê vỉa hè. Các game thủ cần nạp thẻ kích hoạt trang bị nhưng mạng chập chờn và thiếu kênh nạp uy tín. Thị Trưởng quyết định:',
    minMayorLevel: 2,
    choices: [
      {
        id: 'sponsor-esports-league',
        text: 'Chi 800 đồng tài trợ đường truyền mạng 5G riêng & mở cổng Nạp Thẻ Game Hoàn Tiền trên MoMo',
        costCoins: 800,
        btnTone: 'green',
        tags: [
          { label: '-800 đồng', tone: 'red' },
          { label: 'trận đấu đỉnh cao ++', tone: 'green' },
          { label: 'Gen Z reo hò', tone: 'green' },
        ],
        effects: { trustAll: 20, xp: 105, happiness: 12 },
        reply:
          'Ping xanh ổn định 10ms! Những pha combat mãn nhãn làm khán giả đứng kín vỉa hè reo hò cuồng nhiệt, giải đấu thành công rực rỡ!',
      },
      {
        id: 'teach-game-balance',
        text: 'Khuyên các bạn trẻ cân bằng thời gian chơi game và chi tiêu nạp thẻ chừng mực',
        btnTone: 'blue',
        tags: [
          { label: 'chơi game lành mạnh +', tone: 'green' },
          { label: '+55 XP', tone: 'green' },
        ],
        effects: { trustAll: 10, xp: 55, happiness: 6 },
        reply:
          'Các tuyển thủ trẻ hình thành thói quen giải trí lành mạnh, không để trò chơi ảnh hưởng đến học tập.',
      },
      {
        id: 'cut-telecom-wires',
        text: 'Cắt đứt dây cáp viễn thông để ép các bạn trẻ... chuyển sang chơi ô ăn quan',
        btnTone: 'red',
        tags: [
          { label: 'mất mạng cả phố', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -16, happiness: -8 },
        reply:
          'Cả dãy phố mất liên lạc làm việc, các công ty văn phòng biểu tình đòi Thị Trưởng từ chức ngay lập tức!',
      },
    ],
  },
  {
    id: 'ev-thao-tung-tam-ly-tra-da',
    title: 'Bí Kíp Phân Bổ Chi Tiêu 50/30/20 Của Bà Trùm Trà Đá!',
    subtitle: 'Cô Chín mở lớp phổ cập tài chính miễn phí bên bàn trà...',
    speaker: 'Cô Chín Trà Đá & Chị Thảo Văn Phòng',
    body: 'Thấy nhiều bạn trẻ đầu tháng ăn tiêu sang chảnh cuối tháng húp mì tôm, Cô Chín Trà Đá quyết định mở lớp "quản trị dòng tiền" ngay góc ngã tư với công cụ Quản Lý Chi Tiêu MoMo. Lớp học thu hút đông nghẹt người nghe! Bạn sẽ:',
    minMayorLevel: 2,
    choices: [
      {
        id: 'upgrade-finance-seminar',
        text: 'Chi 650 đồng tài trợ bảng tương tác thông minh & tặng 100 cuốn cẩm nang tài chính cho học viên',
        costCoins: 650,
        btnTone: 'green',
        tags: [
          { label: '-650 đồng', tone: 'red' },
          { label: 'toàn dân biết tiết kiệm ++', tone: 'green' },
          { label: 'cô Chín mát lòng', tone: 'green' },
        ],
        effects: { trustAll: 20, xp: 95, happiness: 12 },
        reply:
          'Công thức 50% thiết yếu, 30% linh hoạt, 20% tích lũy Túi Thần Tài đi sâu vào lòng người! Cả xóm bắt đầu hình thành thói quen ghi chép chi tiêu khoa học!',
      },
      {
        id: 'feature-app-budgeting',
        text: 'Quảng bá tính năng tự động phân loại chi tiêu thông minh của MoMo trên màn hình quảng trường',
        btnTone: 'blue',
        tags: [
          { label: 'lan tỏa kiến thức +', tone: 'green' },
          { label: '+55 XP', tone: 'green' },
        ],
        effects: { trustAll: 10, xp: 55, happiness: 6 },
        reply:
          'Người dân dễ dàng theo dõi dòng tiền hàng tuần qua biểu đồ trực quan, cắt giảm các khoản chi lãng phí.',
      },
      {
        id: 'dismiss-the-class',
        text: 'Đuổi cô Chín về vì cho rằng... bán trà đá thì không có tư cách dạy tài chính',
        btnTone: 'red',
        tags: [
          { label: 'cô Chín giận dỗi', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -14, happiness: -8 },
        reply:
          'Cô Chín dẹp quán nghỉ bán 1 tuần, cả dãy phố mất đi nơi uống nước đàm đạo rôm rả quen thuộc!',
      },
    ],
  },
  {
    id: 'ev-tour-du-lich-xuyen-viet',
    title: 'Đoàn Phượt Thủ Đổ Bộ MoCity: Thử Thách 0 Đồng Tiền Mặt!',
    subtitle: 'Nhóm 50 du khách trẻ quyết tâm sống sót 3 ngày chỉ với chiếc smartphone...',
    speaker: 'Kiên Phượt Thủ & Cô Tư Bún Riêu',
    body: 'Đoàn phượt thủ xuyên Việt đặt chân tới MoCity để thực hiện thử thách: Ăn uống, thuê xe, ngủ nghỉ và mua sắm không dùng một đồng tiền giấy nào. Nếu thành phố không đủ hạ tầng thanh toán số họ sẽ chấm điểm 1 sao! Bạn sẽ:',
    minMayorLevel: 2,
    choices: [
      {
        id: 'welcome-cashless-tour',
        text: 'Chi 850 đồng trang bị bản đồ QR Du Lịch Thông Minh & tích hợp thanh toán mọi dịch vụ',
        costCoins: 850,
        btnTone: 'green',
        tags: [
          { label: '-850 đồng', tone: 'red' },
          { label: 'đạt chuẩn 5 sao đô thị ++', tone: 'green' },
          { label: 'du lịch bùng nổ', tone: 'green' },
        ],
        effects: { trustAll: 22, xp: 110, happiness: 12 },
        reply:
          'Từ bà bán xôi đến bác tài xe ôm đều quét mã QR mượt mà! Nhóm phượt thủ livestream chấm MoCity 10/10 điểm đáng sống, video lọt top thịnh hành!',
      },
      {
        id: 'guide-tourist-routes',
        text: 'Cung cấp cẩm nang số các quán ăn, khách sạn đã liên kết MoMo Travel cho đoàn khách',
        btnTone: 'blue',
        tags: [
          { label: 'hướng dẫn chu đáo +', tone: 'green' },
          { label: '+60 XP', tone: 'green' },
        ],
        effects: { trustAll: 12, xp: 60, happiness: 6 },
        reply:
          'Du khách trải nghiệm ẩm thực phố phường dễ dàng, tiểu thương bán được nhiều hàng hóa.',
      },
      {
        id: 'confiscate-phones',
        text: 'Bắt đoàn phượt thủ... nộp điện thoại và dùng vỏ sò để trao đổi hàng quán',
        btnTone: 'red',
        tags: [
          { label: 'du khách bỏ chạy', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -15, happiness: -8 },
        reply:
          'Đoàn khách hoảng sợ thu dọn hành lý rời thành phố ngay trong đêm, để lại đánh giá tệ hại trên các diễn đàn du lịch!',
      },
    ],
  },
  {
    id: 'ev-chung-khoan-xanh-tim',
    title: 'Đại Tiệc Chứng Khoán: Bảng Điện Tử Tím Rực Rỡ Khu FinTech!',
    subtitle: 'Thị trường tài chính thăng hoa, toàn bộ cổ phiếu đồng loạt tăng trần...',
    speaker: 'Chuyên Gia Khải & Quốc Chứng Khoán',
    body: 'Thị trường chứng khoán trong nước đón dòng vốn lớn, các mã cổ phiếu đầu ngành đua nhau khoác áo màu tím trần! Dân văn phòng và nhà đầu tư mở tiệc ăn mừng huyên náo khắp các tòa nhà tài chính. Bạn sẽ định hướng thế nào?',
    minMayorLevel: 2,
    choices: [
      {
        id: 'organize-investor-festival',
        text: 'Chi 950 đồng tổ chức Ngày Hội Đầu Tư Bền Vững & khuyến cáo chốt lời hợp lý bỏ vào Túi Thần Tài',
        costCoins: 950,
        btnTone: 'green',
        tags: [
          { label: '-950 đồng', tone: 'red' },
          { label: 'bảo toàn lợi nhuận ++', tone: 'green' },
          { label: 'tài chính vững vàng', tone: 'green' },
        ],
        effects: { trustAll: 22, xp: 115, happiness: 12 },
        reply:
          'Nhà đầu tư hân hoan chốt lời một phần và cất vào tài khoản sinh lời an toàn trên MoMo! Niềm vui trọn vẹn, không lo thị trường đảo chiều!',
      },
      {
        id: 'broadcast-market-insights',
        text: 'Phát sóng phân tích kinh tế vĩ mô trên màn hình LED giúp bà con nắm bắt xu thế',
        btnTone: 'blue',
        tags: [
          { label: 'đầu tư có kiến thức +', tone: 'green' },
          { label: '+65 XP', tone: 'green' },
        ],
        effects: { trustAll: 12, xp: 65, happiness: 6 },
        reply:
          'Cư dân học được cách đầu tư kỷ luật, không bị tâm lý FOMO cuốn theo những đợt sóng đầu cơ nguy hiểm.',
      },
      {
        id: 'shut-down-led-boards',
        text: 'Rút điện toàn bộ bảng điện tử vì... ghét màu tím hoa cà',
        btnTone: 'red',
        tags: [
          { label: 'nhà đầu tư phẫn nộ', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -14, happiness: -8 },
        reply:
          'Các sàn giao dịch không cập nhật được giá làm lỡ lệnh của hàng trăm khách hàng, khiếu nại bồi thường ngập bàn Thị Trưởng!',
      },
    ],
  },
  {
    id: 'ev-bao-hiem-du-lich-mua-bao',
    title: 'Chuyến Du Lịch Biển Gặp Bão: Bồi Hoàn Thần Tốc MoMo Travel!',
    subtitle: 'Đoàn 100 cư dân MoCity mắc kẹt tại đảo vì biển động dữ dội...',
    speaker: 'Bích Du Lịch & Hãng Hàng Không Đối Tác',
    body: 'Cơn bão biển bất ngờ đổ bộ làm toàn bộ tàu cao tốc ngưng hoạt động, 100 cư dân đi nghỉ dưỡng bị kẹt lại đảo xa hết tiền sinh hoạt. Rất may mọi người đều có Bảo Hiểm Du Lịch MoMo! Thị Trưởng sẽ phối hợp ra sao?',
    minMayorLevel: 2,
    choices: [
      {
        id: 'expedite-insurance-payout',
        text: 'Chi 1.000 đồng điều phối bồi hoàn viện trợ khẩn cấp & bố trí khách sạn 4 sao an toàn',
        costCoins: 1000,
        btnTone: 'green',
        tags: [
          { label: '-1.000 đồng', tone: 'red' },
          { label: 'toàn đoàn an toàn ++', tone: 'green' },
          { label: 'bảo hiểm chi trả 100%', tone: 'green' },
        ],
        effects: { trustAll: 25, xp: 130, happiness: 12 },
        reply:
          'Tiền bồi thường bảo hiểm hỗ trợ ăn ở giải ngân tức thì! Đoàn du khách được lưu trú khách sạn tiện nghi, bão tan được tàu đón về đất liền an toàn tuyệt đối!',
      },
      {
        id: 'supply-emergency-goods',
        text: 'Gửi hàng cứu trợ thực phẩm khô và thuốc men ra đảo hỗ trợ bà con',
        btnTone: 'blue',
        tags: [
          { label: 'cứu trợ kịp thời +', tone: 'green' },
          { label: '+70 XP', tone: 'green' },
        ],
        effects: { trustAll: 12, xp: 70, happiness: 6 },
        reply:
          'Bà con ấm lòng vì nhận được sự quan tâm của đất liền, giữ vững tinh thần vượt qua những ngày mưa bão.',
      },
      {
        id: 'tell-them-to-swim',
        text: 'Bảo mọi người... tự bơi 15 cây số vượt biển vào đất liền cho nhanh',
        btnTone: 'red',
        tags: [
          { label: 'nguy hiểm tính mạng', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -18, happiness: -8 },
        reply:
          'Lời phát ngôn vô trách nhiệm gây bão trên mạng xã hội, dư luận cả nước phẫn nộ đòi kỷ luật Thị Trưởng!',
      },
    ],
  },
  {
    id: 'ev-tiem-vang-chuyen-doi-so',
    title: 'Tiệm Vàng Bác Phúc & Lần Đầu Tiên Chấp Nhận Quét Mã QR Mua Vàng!',
    subtitle: 'Cửa hàng vàng 40 năm tuổi cuối cùng cũng bước lên chuyến tàu công nghệ...',
    speaker: 'Bác Phúc Tiệm Vàng & Chị Ngân Kế Toán',
    body: 'Vào ngày Vía Thần Tài mùng 10 tháng Giêng, hàng ngàn người xếp hàng mua vàng lấy may nhưng tiệm Bác Phúc xưa nay chỉ nhận tiền mặt. Khách hàng mang bao tải tiền đếm tới mỏi tay gây nghẽn cả góc phố. Bạn sẽ:',
    minMayorLevel: 3,
    choices: [
      {
        id: 'deploy-secure-gold-qr',
        text: 'Chi 800 đồng trang bị hệ thống VietQR Pro hạn mức cao chống giả mạo cho Tiệm Vàng',
        costCoins: 800,
        btnTone: 'green',
        tags: [
          { label: '-800 đồng', tone: 'red' },
          { label: 'quét mã mua vàng 3 giây ++', tone: 'green' },
          { label: 'tiệm vàng hiện đại', tone: 'green' },
        ],
        effects: { trustAll: 22, xp: 110, happiness: 12 },
        reply:
          'Khách mua vàng chỉ cần quét mã MoMo xác thực sinh trắc học là xong! Không phải ôm cọc tiền mặt nguy hiểm, tiệm vàng Bác Phúc bán sạch 500 chỉ vàng Thần Tài trong buổi sáng!',
      },
      {
        id: 'security-escort-cash',
        text: 'Bố trí tổ an ninh bảo vệ quầy đếm tiền mặt truyền thống cho khách mua vàng',
        btnTone: 'blue',
        tags: [
          { label: 'an toàn trật tự +', tone: 'green' },
          { label: '+60 XP', tone: 'green' },
        ],
        effects: { trustAll: 10, xp: 60, happiness: 6 },
        reply:
          'Trật tự khu phố được giữ vững, tuy nhiên việc đếm tiền mặt vẫn mất khá nhiều thời gian chờ đợi.',
      },
      {
        id: 'ban-gold-buying',
        text: 'Cấm mua vàng ngày Vía Thần Tài, bắt chuyển sang mua... củ khoai tây lấy may',
        btnTone: 'red',
        tags: [
          { label: 'tiểu thương buồn thiu', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -14, happiness: -8 },
        reply:
          'Bà con lắc đầu ngao ngán, phong tục cầu may đầu năm bị gián đoạn làm không khí phố Tết trầm lắng hẳn.',
      },
    ],
  },
  {
    id: 'ev-le-hoi-am-thuc-dem-mocity',
    title: 'Phố Ẩm Thực Đêm MoCity: 1.000 Món Ngon Quét QR Hoàn Tiền!',
    subtitle: 'Mùi sườn nướng, bánh tráng nướng và chè thái ngào ngạt khắp đại lộ...',
    speaker: 'Bếp Trưởng Long & Cô Tám Chè',
    body: 'Đại tiệc ẩm thực đường phố cuối tuần quy tụ hơn 100 xe đẩy và quán ăn đêm. Khách du lịch nườm nượp đổ về thưởng thức các món ngon trứ danh. Để khu phố buôn bán văn minh không tiền mặt, Thị Trưởng sẽ:',
    minMayorLevel: 3,
    choices: [
      {
        id: 'fund-food-cashback',
        text: 'Chi 900 đồng tài trợ gói “Hoàn Tiền 20% Vào Túi Thần Tài” cho mọi đơn quét MoMo tại phố đêm',
        costCoins: 900,
        btnTone: 'green',
        tags: [
          { label: '-900 đồng', tone: 'red' },
          { label: 'phố đêm rực sáng ++', tone: 'green' },
          { label: 'doanh số kỷ lục', tone: 'green' },
        ],
        effects: { trustAll: 24, xp: 120, happiness: 12 },
        reply:
          'Khách ăn uống no nê, tiền hoàn ting ting về túi lại đẻ ra lãi! Phố ẩm thực MoCity trở thành thiên đường du lịch đêm nức tiếng cả nước!',
      },
      {
        id: 'hygiene-and-waste-patrol',
        text: 'Bố trí đội thu gom rác lưu động và kiểm tra vệ sinh an toàn thực phẩm các quầy hàng',
        btnTone: 'blue',
        tags: [
          { label: 'phố sạch món ngon +', tone: 'green' },
          { label: '+65 XP', tone: 'green' },
        ],
        effects: { trustAll: 12, xp: 65, happiness: 6 },
        reply:
          'Khu phố ẩm thực sạch bóng không một cọng rác, du khách yên tâm thưởng thức ẩm thực thơm ngon.',
      },
      {
        id: 'curfew-8pm',
        text: 'Bắt toàn bộ quán ăn đóng cửa tắt bếp lúc 20h tối để bà con... đi ngủ',
        btnTone: 'red',
        tags: [
          { label: 'kinh tế đêm tê liệt', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -15, happiness: -8 },
        reply:
          'Phố xá tối om im lìm, hàng trăm tiểu thương ế ẩm đồ ăn đành đổ bỏ lãng phí, bức xúc khôn cùng!',
      },
    ],
  },
  {
    id: 'ev-chu-be-danh-giay-cong-nghe',
    title: 'Bé Bi Đánh Giày Dán Mã QR Lên Hộp Gỗ: Ting Ting Tiền Boa!',
    subtitle: 'Câu chuyện cảm động về cậu bé chăm chỉ và chiếc mã QR thông minh...',
    speaker: 'Bé Bi Đánh Giày & Bác Tổ Trưởng',
    body: 'Bé Bi 12 tuổi vừa đi học vừa đi đánh giày phụ giúp gia đình. Thấy khách vào quán cà phê toàn không mang tiền mặt, bé tự in mã QR dán lên hộp đồ nghề bằng gỗ. Nhiều khách muốn boa thêm tiền học nhưng không biết làm sao. Bạn sẽ:',
    minMayorLevel: 3,
    choices: [
      {
        id: 'gift-smart-speaker-bi',
        text: 'Chi 500 đồng tặng Bé Bi Loa Thần Tài Mini MoMo kèm học bổng khuyến học 500k',
        costCoins: 500,
        btnTone: 'green',
        tags: [
          { label: '-500 đồng', tone: 'red' },
          { label: 'tiếp sức em đến trường ++', tone: 'green' },
          { label: 'cả phố xúc động', tone: 'green' },
        ],
        effects: { trustAll: 25, xp: 120, happiness: 12 },
        reply:
          'Chiếc loa nhỏ vang lên những tiếng ting ting ấm áp! Khách thương bé Bi ngoan ngoãn quét mã ủng hộ rầm rộ, bé Bi có đủ tiền đóng học phí cả năm học!',
      },
      {
        id: 'invite-bi-study-hub',
        text: 'Đưa Bé Bi vào lớp học tình thương miễn phí buổi tối của Tòa Thị Chính',
        btnTone: 'blue',
        tags: [
          { label: 'ươm mầm tương lai +', tone: 'green' },
          { label: '+65 XP', tone: 'green' },
        ],
        effects: { trustAll: 14, xp: 65, happiness: 6 },
        reply:
          'Bé Bi được thầy cô dạy chữ và toán học, ước mơ trở thành kỹ sư công nghệ ngày một gần hơn.',
      },
      {
        id: 'confiscate-shoe-box',
        text: 'Tịch thu hộp đánh giày vì... dán mã QR làm mất mỹ quan vỉa hè',
        btnTone: 'red',
        tags: [
          { label: 'lòng người phẫn nộ', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -20, happiness: -8 },
        reply:
          'Bé Bi ôm mặt khóc nức nở bên lề đường, cả khu phố đồng loạt lên án sự lạnh lùng tàn nhẫn của Thị Trưởng!',
      },
    ],
  },
  {
    id: 'ev-khach-san-thu-cung',
    title: 'Dịch Vụ Khách Sạn Thú Cưng Mùa Lễ Hội: Đại Tiệc Chó Mèo!',
    subtitle: 'Hàng trăm "boss" 4 chân được chăm sóc chuẩn VIP khi chủ đi du lịch...',
    speaker: 'Bé An Quán Cà Phê & Chị Vy',
    body: 'Kỳ nghỉ lễ dài ngày, hàng trăm gia đình đi du lịch xa gửi thú cưng vào Khách Sạn Thú Cưng MoCity. Đúng lúc này hệ thống máy lạnh quá tải và thức ăn hạt cao cấp bị thiếu hụt! Thị Trưởng sẽ giải cứu các bạn nhỏ 4 chân thế nào?',
    minMayorLevel: 3,
    choices: [
      {
        id: 'upgrade-pet-hotel',
        text: 'Chi 750 đồng tiếp tế thức ăn hạt nhập khẩu & mở rộng khu vui chơi đệm êm cho thú cưng',
        costCoins: 750,
        btnTone: 'green',
        tags: [
          { label: '-750 đồng', tone: 'red' },
          { label: 'các boss vui vẻ ++', tone: 'green' },
          { label: 'chủ nhân an tâm', tone: 'green' },
        ],
        effects: { trustAll: 20, xp: 95, happiness: 12 },
        reply:
          'Các bé chó mèo được ăn ngon, nằm nệm mát, có camera livestream 24/7 cho chủ nhân ngắm nhìn! Ai nấy đều khen dịch vụ chu đáo vô cùng!',
      },
      {
        id: 'volunteer-pet-care',
        text: 'Kêu gọi đội tình nguyện viên yêu động vật đến vuốt ve và dẫn thú cưng đi dạo công viên',
        btnTone: 'blue',
        tags: [
          { label: 'yêu thương muôn loài +', tone: 'green' },
          { label: '+60 XP', tone: 'green' },
        ],
        effects: { trustAll: 10, xp: 60, happiness: 6 },
        reply:
          'Các bé thú cưng được tung tăng chạy nhảy trên thảm cỏ xanh mướt, tiếng sủa tiếng meo rộn rã công viên.',
      },
      {
        id: 'release-pets-to-street',
        text: 'Thả hết chó mèo ra ngoài đường... để chúng tự đi kiếm ăn',
        btnTone: 'red',
        tags: [
          { label: 'hỗn loạn đường phố', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -15, happiness: -8 },
        reply:
          'Chó đuổi mèo chạy loạn xị ngậu khắp ngã tư, thùng rác bị lật tung, chủ nhân về nhà tá hỏa đi tìm thú cưng trong nước mắt!',
      },
    ],
  },
  {
    id: 'ev-cung-duong-anh-sang-5g',
    title: 'Tuyến Phố Đèn Lồng 5G & Trải Nghiệm AR Săn Kho Báu MoMo!',
    subtitle: 'Không gian thực tế ảo lung linh biến đại lộ thành thế giới thần tiên...',
    speaker: 'Bảo Ngọc KOC & Đội Kỹ Thuật Viễn Thông',
    body: 'Tòa Thị Chính thí điểm "Tuyến Phố Trải Nghiệm AR": Người dân giơ camera điện thoại lên là thấy các chú Heo Vàng bay lượn trên bầu trời, mở rương quà tặng và voucher giảm giá khắp nơi. Lượng người đổ về quá đông! Bạn sẽ:',
    minMayorLevel: 3,
    choices: [
      {
        id: 'expand-ar-treasure-hunt',
        text: 'Chi 1.000 đồng mở rộng mạng lưới AR toàn thành phố & rải thêm 5.000 bao lì xì may mắn',
        costCoins: 1000,
        btnTone: 'green',
        tags: [
          { label: '-1.000 đồng', tone: 'red' },
          { label: 'săn quà ngập tràn ++', tone: 'green' },
          { label: 'đô thị tương lai', tone: 'green' },
        ],
        effects: { trustAll: 24, xp: 125, happiness: 12 },
        reply:
          'Hình ảnh kỳ ảo tuyệt đẹp! Cả người già lẫn trẻ nhỏ hào hứng giơ máy săn lùng kho báu ảo nhận quà thật, tiếng cười reo vang vọng cả khu phố!',
      },
      {
        id: 'ar-photo-booths',
        text: 'Dựng các điểm check-in AR chụp hình sống ảo cùng linh vật MoMo cho du khách',
        btnTone: 'blue',
        tags: [
          { label: 'hình đẹp lung linh +', tone: 'green' },
          { label: '+65 XP', tone: 'green' },
        ],
        effects: { trustAll: 12, xp: 65, happiness: 6 },
        reply:
          'Hàng ngàn bức ảnh check-in độc đáo lan truyền trên mạng xã hội, quảng bá hình ảnh MoCity năng động và sáng tạo.',
      },
      {
        id: 'turn-off-all-screens',
        text: 'Cắt toàn bộ nguồn điện vì cho rằng... công nghệ thực tế ảo là trò phù phiếm',
        btnTone: 'red',
        tags: [
          { label: 'tối đen như mực', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -14, happiness: -8 },
        reply:
          'Đại lộ vụt tắt ngúm, du khách vấp ngã trong bóng tối, một dự án công nghệ đầy hứa hẹn bị bóp chết yểu!',
      },
    ],
  },
  {
    id: 'ev-hop-dong-bao-hiem-an-ninh-mang',
    title: 'Chiến Dịch Phòng Chống Lừa Đảo Công Nghệ Cao Của Tổ Dân Phố!',
    subtitle: 'Tin tặc gửi tin nhắn mạo danh ngân hàng đòi mã OTP...',
    speaker: 'Bác Tổ Trưởng & Chuyên Gia Khải',
    body: 'Gần đây xuất hiện các nhóm lừa đảo gửi đường link giả mạo thông báo trúng thưởng để chiếm đoạt tài khoản. Nhiều cụ già nhẹ dạ suýt cung cấp mật khẩu và mã OTP. Thị Trưởng cần hành động khẩn cấp:',
    minMayorLevel: 3,
    choices: [
      {
        id: 'cyber-safety-shield',
        text: 'Chi 850 đồng mở lớp tập huấn “Bảo Vệ Tài Sản Số & Không Chia Sẻ OTP” + kích hoạt Bảo Hiểm An Ninh Mạng MoMo',
        costCoins: 850,
        btnTone: 'green',
        tags: [
          { label: '-850 đồng', tone: 'red' },
          { label: 'an toàn tuyệt đối ++', tone: 'green' },
          { label: 'tài khoản bất khả xâm phạm', tone: 'green' },
        ],
        effects: { trustAll: 22, xp: 110, happiness: 12 },
        reply:
          'Bà con nắm chắc nguyên tắc vàng: Không click link lạ, không đọc OTP cho bất kỳ ai! Kẻ gian gửi tin nhắn lừa đảo bị các cụ "bắt bài" trêu lại tơi bời!',
      },
      {
        id: 'alert-billboard-sms',
        text: 'Gửi cảnh báo an toàn thông tin qua bảng tin số và loa phát thanh khu phố',
        btnTone: 'blue',
        tags: [
          { label: 'nâng cao cảnh giác +', tone: 'green' },
          { label: '+60 XP', tone: 'green' },
        ],
        effects: { trustAll: 10, xp: 60, happiness: 6 },
        reply:
          'Thông tin cảnh báo kịp thời giúp người dân chủ động bảo vệ tài sản, ngăn chặn triệt để các vụ lừa đảo mạng.',
      },
      {
        id: 'disconnect-all-phones',
        text: 'Bảo mọi người... đập vỡ điện thoại thông minh để kẻ gian không lừa được',
        btnTone: 'red',
        tags: [
          { label: 'mất trắng điện thoại', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -16, happiness: -8 },
        reply:
          'Kẻ gian chưa kịp lừa thì người dân đã tự làm hỏng tài sản của mình theo lời Thị Trưởng, sự phẫn nộ lên đến đỉnh điểm!',
      },
    ],
  },
  {
    id: 'ev-dai-nhac-hoi-dem-giao-thua',
    title: 'Đại Nhạc Hội Đêm Giao Thừa: Mưa Lì Xì MoMo Rơi Từ Bầu Trời!',
    subtitle: 'Đồng hồ đếm ngược điểm 00:00, pháo hoa rực sáng cả bầu trời...',
    speaker: 'Ông Lộc & Toàn Thể Cư Dân MoCity',
    body: 'Đêm Giao Thừa thiêng liêng, hàng vạn cư dân quây quần dưới chân Tháp MoMo đếm ngược đón năm mới. Mọi người háo hức chờ đón màn Lắc Xì may mắn và những phong bao lì xì điện tử trao gửi lời chúc đầu xuân. Thị Trưởng sẽ khai hội ra sao?',
    minMayorLevel: 3,
    choices: [
      {
        id: 'fireworks-and-lixi',
        text: 'Chi 1.500 đồng bắn pháo hoa nghệ thuật & phát Cơn Mưa Lì Xì MoMo Tài Lộc cho toàn thể cư dân',
        costCoins: 1500,
        btnTone: 'green',
        tags: [
          { label: '-1.500 đồng', tone: 'red' },
          { label: 'vạn sự như ý ++', tone: 'green' },
          { label: 'năm mới thịnh vượng', tone: 'green' },
        ],
        effects: { trustAll: 30, xp: 150, happiness: 12 },
        reply:
          'Pháo hoa rực rỡ bừng sáng cả bầu trời đêm! Hàng vạn phong bao lì xì điện tử ting ting may mắn vào ví mỗi cư dân. MoCity bước sang năm mới trong tình yêu thương, phồn vinh và hạnh phúc ngập tràn!',
      },
      {
        id: 'countdown-chorus',
        text: 'Cùng toàn thể nhân dân đồng ca khúc hát mừng xuân và gửi lời chúc an khang thịnh vượng',
        btnTone: 'blue',
        tags: [
          { label: 'ấm áp khoảnh khắc giao thừa +', tone: 'green' },
          { label: '+85 XP', tone: 'green' },
        ],
        effects: { trustAll: 15, xp: 85, happiness: 6 },
        reply:
          'Những cái ôm ấm áp và nụ cười rạng rỡ trao nhau trong thời khắc chuyển giao thiêng liêng giữa năm cũ và năm mới.',
      },
      {
        id: 'cancel-countdown',
        text: 'Hủy bỏ đếm ngược, bắt mọi người... tắt đèn đi ngủ từ 21h đêm trừ tịch',
        btnTone: 'red',
        tags: [
          { label: 'Giao thừa buồn nhất lịch sử', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -20, happiness: -8 },
        reply:
          'Đêm Giao Thừa lạnh lẽo không một tiếng cười, người dân ngậm ngùi tiếc nuối khoảnh khắc thiêng liêng nhất trong năm!',
      },
    ],
  },
];
