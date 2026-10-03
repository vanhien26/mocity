import type { ArchetypeId, CityEventScript, RequestScript } from './types';
import { EXTRA_REQUEST_SCRIPTS } from './dialogue-requests-extra';
import { EXTRA_CITY_EVENTS } from './dialogue-events-extra';
import { CONDITIONAL_CITY_EVENTS } from './dialogue-events-conditional';

/**
 * Tầng 1 — Thoại Ambient "Tám Chuyện Vỉa Hè" (Mặn mòi, hài hước đời thường Việt Nam).
 * Tự động nảy lên trên đầu các tòa nhà & cư dân đi bộ trên phố.
 */
export interface AmbientPool {
  /** Chủ tiệm chưa nhận thanh toán số. */
  cash?: string[];
  /** Chủ tiệm đã nhận thanh toán số. */
  digital?: string[];
  /** Cư dân chưa có dịch vụ tài chính nào ngoài mặc định. */
  plain?: string[];
  /** Cư dân đã được mở thêm dịch vụ. */
  served?: string[];
}

export const AMBIENT: Record<ArchetypeId, AmbientPool> = {
  MERCHANT_CASH: {
    cash: [
      'Mua bó hành 5 ngàn mà hỏi quét QR, quét cái chổi chà giờ!',
      'Đứa nào ghi sổ nợ từ Tết năm ngoái bước ra đây nói chuyện!',
      'Hết tiền lẻ rồi, lấy đỡ 3 cục kẹo cao su làm tiền thối nha con!',
      'Con Mực mới cắn rách trang sổ nợ tiền bia của chú Bảy rồi trời ơi!',
      'Bán tô bún lời có mấy ngàn, chuyển khoản nhầm cái là khóc tiếng Mán!',
      'Nóng muốn xỉu! Ai uống trà tắc khổng lồ giải nhiệt hôn?',
    ],
    digital: [
      'Ting ting! Nghe tiếng Loa Thần Tài báo tiền về êm tai hơn nhạc Bolero!',
      'Giờ đứa nào kêu “quên mang tiền mặt” cô chỉ thẳng mặt vô bảng QR!',
      'Loa đọc tiền về to quá hàng xóm tưởng nhà cô mới trúng đất!',
      'Khỏi đếm tiền lẻ mỏi tay, khỏi lo con Mực gặm rách sổ nợ nữa!',
      'Mấy đứa sinh viên quét mã cái rẹt, tặng luôn thêm miếng chả lụa!',
    ],
  },
  MERCHANT_ESTABLISHED: {
    cash: [
      'Sổ nợ dày hơn cuốn từ điển rồi mà chưa thấy ai qua trả!',
      'Nhập phụ tùng cận Tết mà nhìn cọc tiền mặt đếm tới 2 giờ sáng.',
      'Khách hỏi trả góp qua ví mà tiệm chưa biết đăng ký chỗ nào!',
      'Trời ơi đầu hẻm mới có người trúng độc đắc 2 tờ kìa!',
    ],
    digital: [
      'Cuối ngày mở MoMo đối soát 3 giây là xong, đi ngủ sớm khỏe re!',
      'Có lịch sử giao dịch số rõ ràng, vay vốn nhập hàng Tết duyệt cái rụp!',
      'Tiệm sửa xe giờ hiện đại không kém showroom, quét QR trả góp luôn!',
    ],
  },
  GIG_WORKER: {
    plain: [
      'Giao ly trà sữa full trân châu qua 5 cái ổ gà mà không đổ giọt nào!',
      'Nắng 39 độ C, chạy cuốc xe xong nhìn mặt đen hơn cục than tổ ong!',
      'Khách đưa tờ 500k mua đơn 18k lúc 6 giờ sáng... cứu em Thị Trưởng ơi!',
      'Cuối tháng xe lại kêu lọc cọc, chưa tới ngày nhận lương nữa!',
    ],
    served: [
      'Khách chuyển khoản thẳng vô MoMo, khỏi chạy khắp phố đổi tiền lẻ!',
      'Bể lốp giữa đường có Ví Trả Sau ứng trước sửa liền, không mất ngày công!',
      'Đường phố MoCity quy hoạch mượt quá, giao đơn 5 phút là tới tận cửa!',
    ],
  },
  SALARIED: {
    plain: [
      'Lương về tài khoản chỉ mang tính chất... ghé thăm rồi bay mất!',
      'Cột sống thì bất ổn mà cột tài chính thì... âm vô cực!',
      'Mỗi chiều 1 ly trà sữa chữa lành, cuối tháng nhìn sao kê muốn... rách lành!',
      'Mới ngày 18 âm lịch mà đã nghe mùi mì tôm Hảo Hảo quanh đây rồi...',
    ],
    served: [
      'Lương về tự động cất 30% vô Túi Thần Tài trước khi cái tay kịp săn sale!',
      'Sáng ngủ dậy thấy tiền lãi Túi Thần Tài đủ mua thêm trân châu trắng, quá đã!',
      'Nhìn biểu đồ quản lý chi tiêu mới biết tháng rồi uống hết nửa chỉ vàng trà sữa!',
    ],
  },
  STUDENT: {
    plain: [
      'Đầu tháng ăn Buffet lẩu nướng, cuối tháng hít khí trời quang hợp!',
      'Tài khoản còn đúng 14 ngàn, cây ATM nhìn em cười khinh bỉ luôn á!',
      'Đi ăn lẩu 6 đứa, tới lúc tính tiền tự nhiên 3 đứa đau bụng đi WC!',
      'Ăn mì gói nhiều tới mức mặt sắp nổi vảy tôm chua cay rồi Thị Trưởng ơi!',
    ],
    served: [
      'Bấm “Chia Tiền Nhóm” trên MoMo, đứa nào trốn trong WC cũng phải ting ting trả nợ!',
      'Săn được voucher trà sữa 1 XU, cảm giác mình như nhà kinh tế học đại tài!',
      'Đặt vé MoMo Cinema đi coi phim với crush được giảm hẳn 50k, uy tín luôn!',
    ],
  },
  FAMILY: {
    plain: [
      'Đang nhúng con tôm vô nồi lẩu sôi sùng sục thì... cúp điện vì quên đóng hóa đơn!',
      'Cuối tuần dẫn 2 đứa nhỏ đi siêu thị, tay xách nách mang còn phải lục tiền lẻ!',
      'Tiền điện, tiền nước, tiền học phí của con cứ tới cùng một tuần muốn tiền đình!',
    ],
    served: [
      'Bật Thanh Toán Hóa Đơn Tự Động rồi, nồi lẩu sôi bất chấp ngày đêm!',
      'Đi siêu thị quét MoMo hoàn tiền về Túi Thần Tài, bà xã khen nức nở!',
      'Đóng học phí cho sắp nhỏ 1 chạm trên điện thoại, khỏi xin nghỉ làm đi xếp hàng!',
    ],
  },
  CINEPHILE: {
    plain: [
      'Mua vé sát giờ bị xếp ngồi hàng A1 sát màn hình, ngước coi xong trật đốt sống cổ!',
      'Đi coi phim kinh dị mà thằng cha ngồi cạnh hét to hơn cả con ma trong phim!',
      'Xếp hàng mua bắp nước dài tới tận vỉa hè, vô tới rạp là phim chiếu được nửa tiếng!',
    ],
    served: [
      'Đặt trước ghế đôi Sweetbox hàng H trên MoMo Cinema, crush nhìn phát đổ đứ đừ!',
      'Mua combo bắp phô mai + caramel giảm giá trên app, tới rạp quét mã đi thẳng vô!',
      'Coi suất chiếu đêm IMAX xong bước qua phố ẩm thực kế bên ăn khuya là hết nước chấm!',
    ],
  },
  TRAVELER: {
    plain: [
      'Sát ngày lễ mới đặt vé máy bay, nhìn giá vé tưởng mua luôn cổ phần hãng bay!',
      'Đi du lịch đem cọc tiền mặt trong bụng, đi tắm biển cũng phải ôm khư khư!',
      'Tới nơi mới đi tìm khách sạn, suýt nữa phải ra ghế đá công viên ngủ ngắm sao!',
    ],
    served: [
      'Săn combo Vé máy bay + Khách sạn trên MoMo Du Lịch rẻ hơn tự đặt cả triệu bạc!',
      'Tới MoCity du lịch chỉ cần 1 chiếc điện thoại là quét từ sân bay tới quán ốc!',
      'Check-in resort 5 sao không cần đặt cọc tiền mặt, trải nghiệm đỉnh của chóp!',
    ],
  },
  INVESTOR: {
    plain: [
      'Tiền để nằm im trong ví là tiền đang đi ngủ, mà lạm phát thì thức 24/7!',
      'Nghe người ta bàn chứng khoán với quỹ mở mà mình tưởng đang nói tiếng ngoài hành tinh!',
      'Muốn đầu tư sinh lời mà sợ thủ tục giấy tờ dài như sớ Táo Quân!',
    ],
    served: [
      'Mua Chứng Chỉ Quỹ từ 100k ngay trên MoMo, tuy chưa thành cá mập nhưng hết làm cá lòng tong!',
      'Lãi kép Túi Thần Tài nhảy số mỗi ngày, tiếng ting ting nghe bổ phổi hơn nhân sâm!',
      'Dòng vốn FinTech của MoCity đang tăng trưởng xanh mướt khắp các đại lộ!',
    ],
  },
  ELDER: {
    plain: [
      'Mắt mũi kèm nhèm, tờ 20 ngàn với tờ 500 ngàn nhìn cứ na ná nhau!',
      'Lựa giùm ông tờ vé số đuôi 68 chiều nay trúng ông khao cả hẻm ăn chè!',
      'Tụi nhỏ giờ nói chuyện gì mà “chốt đơn”, “quay xe”, ông nghe hổng kịp!',
    ],
    served: [
      'Mỗi sáng đi bộ quanh công viên lấy bước chân nuôi Heo Vàng quyên góp xây trường cho tụi nhỏ!',
      'Giờ ông cũng biết quét mã QR mua cà phê sáng rồi, hiện đại không thua thanh niên!',
      'Cảm ơn Thị Trưởng quy hoạch khu phố vừa đẹp lung linh vừa giữ trọn tình làng nghĩa xóm!',
    ],
  },
};

/**
 * Tầng 2 — Kịch bản Drama & Yêu cầu Cư dân (Bấm vào nút `Chuyện phố! (!)` trên bản đồ).
 * Mỗi kịch bản có 3 lựa chọn: Chơi Lớn (Đầu tư MoMo), Mưu Trí (Công nghệ), và Lầy Lội (Tấu hài).
 */
const BASE_REQUEST_SCRIPTS: RequestScript[] = [
  {
    id: 'req-qr-tieu-thuong',
    archetype: 'MERCHANT_CASH',
    requiresDigital: false,
    title: 'Bí ẩn cuốn sổ nợ bị con Mực cắn rách',
    subtitle: 'Cô Tư bán bún đầu hẻm đang cầm chổi lông gà rượt chó...',
    body: 'Cuốn sổ ghi nợ bằng tập học sinh của Cô Tư vừa bị con Mực gặm mất trang ghi nợ tiền bún và bia của mấy ông trong xóm. Cô Tư vừa khóc vừa mếu cầu cứu Thị Trưởng:',
    choices: [
      {
        id: 'pay',
        text: 'Tặng ngay Bộ Loa Thần Tài QR & Sổ Thu Chi Điện Tử MoMo',
        costCoins: 240,
        btnTone: 'green',
        tags: [
          { label: '-240 XU', tone: 'red' },
          { label: 'cô Tư khoái chí ++', tone: 'green' },
          { label: 'mở Loa QR cả tiệm', tone: 'green' },
        ],
        effects: { acceptDigital: true, trust: 28, xp: 45, happiness: 12 },
        reply:
          'Loa đọc vang cả ngã tư: “Ting ting! Đã nhận 50 ngàn từ chú Bảy trả nợ!”. Cô Tư vỗ đùi cái đét: “Từ nay con Mực có cắn đứt cáp quang cũng không mất sổ nợ của cô nữa!”',
      },
      {
        id: 'explain',
        text: 'Bày cô Tư chụp hình sổ nợ lưu lên mây & kiểm tra lịch sử tiền về',
        btnTone: 'blue',
        tags: [
          { label: 'cô Tư gật gù +', tone: 'green' },
          { label: 'mở QR tiệm', tone: 'green' },
        ],
        effects: { acceptDigital: true, trust: 20, xp: 25, happiness: 6 },
        reply:
          '“Ờ ha! Vậy mà cô không nghĩ ra. Để cô dán thêm cái mã QR ngay nồi nước lèo, đứa nào ăn xong quét tại chỗ khỏi ghi sổ!”',
      },
      {
        id: 'push',
        text: 'Khuyên cô Tư... phạt con Mực nhịn ăn pate 3 ngày để răn đe',
        btnTone: 'red',
        tags: [
          { label: 'cô Tư lườm cháy mặt', tone: 'red' },
          { label: 'con Mực buồn thiu', tone: 'neutral' },
        ],
        effects: { trust: -10, happiness: -8 },
        reply:
          '“Trời đất ơi Thị Trưởng đi chấp nhặt với con chó! Còn tiền nợ của tui ai đòi giùm đây trời?!”',
      },
    ],
  },
  {
    id: 'req-credit-score',
    archetype: 'STUDENT',
    missingService: 'CREDIT_SCORE',
    title: 'Hội bạn thân & Màn kịch đau bụng lúc tính tiền lẩu',
    subtitle: 'Bé Nam sinh viên đang đứng đổ mồ hôi hột trước quầy thu ngân...',
    body: 'Nhóm 6 sinh viên đi ăn lẩu nướng hết 960k. Vừa kêu tính tiền thì 2 đứa chui vô WC trốn biệt tích, 1 đứa giả bộ nghe điện thoại mẹ gọi về quê gấp, 1 đứa kêu “Nãy giờ tao chỉ húp nước lẩu!”. Bạn sẽ xử lý sao?',
    choices: [
      {
        id: 'guarantee',
        text: 'Tài trợ 300 XU & kích hoạt “Chia Tiền Nhóm MoMo” réo nợ tự động',
        costCoins: 300,
        btnTone: 'green',
        tags: [
          { label: '-300 XU', tone: 'red' },
          { label: 'bé Nam đội ơn ++', tone: 'green' },
          { label: 'mở Điểm Tín Dụng', tone: 'green' },
        ],
        effects: { grantService: 'CREDIT_SCORE', trust: 30, xp: 60, happiness: 12 },
        reply:
          'Điện thoại cả 5 đứa đang trốn trong WC đồng loạt kêu “Ting ting! Yêu cầu chia tiền lẩu 160k từ Bé Nam”. Trong vòng 30 giây cả đám nộp đủ không thiếu 1 xu!',
      },
      {
        id: 'small',
        text: 'Đặt luật “Quét QR góp quỹ lẩu trước khi bật bếp” cho cả nhóm',
        btnTone: 'blue',
        tags: [
          { label: 'tình bạn bền lâu +', tone: 'green' },
          { label: 'mở Điểm Tín Dụng', tone: 'green' },
        ],
        effects: { grantService: 'CREDIT_SCORE', trust: 22, xp: 50, happiness: 6 },
        reply:
          '“Đỉnh quá Thị Trưởng ơi! Đứa nào ting ting xong mới được phát đũa gắp thịt bò, hết đường diễn kịch đi vệ sinh!”',
      },
      {
        id: 'wait',
        text: 'Bảo Bé Nam ở lại tiệm lẩu... rửa 200 cái chén trừ nợ',
        btnTone: 'red',
        tags: [
          { label: 'bé Nam khóc ròng', tone: 'red' },
          { label: 'mất hết tình anh em', tone: 'neutral' },
        ],
        effects: { trust: -10, happiness: -8 },
        reply:
          'Bé Nam đeo găng tay cao su ngồi rửa chồng chén cao ngang đầu, vừa rửa vừa hát nhạc thất tình giữa đêm đông...',
      },
    ],
  },
  {
    id: 'req-savings-luong',
    archetype: 'SALARIED',
    missingService: 'SAVINGS',
    title: 'Kiếp nạn ngày 20 âm lịch & Lời nguyền Trà Sữa Chữa Lành',
    subtitle: 'Chị Thảo văn phòng đang ngồi đếm từng gói mì tôm dưới ánh đèn...',
    body: 'Mới nhận lương mùng 5 nhưng sau 15 ngày “tự thưởng bản thân” vì áp lực deadline bằng 18 ly trà sữa full topping và 4 phiên livestream nửa đêm, tài khoản chị Thảo giờ còn đúng 45 ngàn đồng. Bạn sẽ:',
    choices: [
      {
        id: 'auto',
        text: 'Mở Túi Thần Tài tự động trích 30% lương + thưởng nóng 350 XU',
        costCoins: 350,
        btnTone: 'green',
        tags: [
          { label: '-350 XU', tone: 'red' },
          { label: 'chị Thảo ++', tone: 'green' },
          { label: '+Lãi kép mỗi ngày', tone: 'green' },
        ],
        effects: { grantService: 'SAVINGS', trust: 28, xp: 60, happiness: 12 },
        reply:
          '“Cứu tinh của cột sống đây rồi! Sáng ngủ dậy mở mắt ra là thấy Túi Thần Tài trả lãi đủ mua thêm trân châu trắng mà tiền gốc vẫn còn nguyên!”',
      },
      {
        id: 'educate',
        text: 'Bật Trợ Lý Quản Lý Chi Tiêu MoMo khóa hạn mức trà sữa hàng tuần',
        btnTone: 'blue',
        tags: [
          { label: 'chị Thảo tỉnh ngộ +', tone: 'green' },
          { label: 'mở Tiết Kiệm Số', tone: 'green' },
        ],
        effects: { grantService: 'SAVINGS', trust: 20, xp: 45, happiness: 6 },
        reply:
          '“Trời đất ơi nhìn biểu đồ thống kê mới biết tháng trước em uống hết nửa chỉ vàng tiền trà sữa kem cheese! Em khóa hạn mức liền!”',
      },
      {
        id: 'later',
        text: 'Tặng chị Thảo bí kíp “Mì tôm ngâm nước lọc nở gấp 3 lần”',
        btnTone: 'red',
        tags: [
          { label: 'chị Thảo sang chấn', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trust: -8, happiness: -8 },
        reply:
          'Chị Thảo lặng lẽ chụp màn hình câu nói của Thị Trưởng đăng lên hội nhóm “Review Thị Trưởng MoCity” kèm icon mặt khóc...',
      },
    ],
  },
  {
    id: 'req-cup-dien-noi-lau',
    archetype: 'FAMILY',
    requiresDigital: false,
    title: 'Thảm họa cúp điện đúng lúc nồi lẩu hải sản đang sôi',
    subtitle: 'Nhà chú Bảy đang tối thui giữa bữa tiệc họp mặt thông gia...',
    body: 'Gia đình chú Bảy đang mời thông gia tới ăn lẩu tôm hùm. Nước lẩu vừa sôi sùng sục, con tôm vừa đỏ vỏ thì... PHỤP! Cúp điện tối om vì chú Bảy quên đóng hóa đơn tiền điện tháng này! Bạn sẽ:',
    choices: [
      {
        id: 'auto-bill',
        text: 'Chi 380 XU thanh toán điện khẩn cấp & bật “Thanh Toán Hóa Đơn Tự Động”',
        costCoins: 380,
        btnTone: 'green',
        tags: [
          { label: '-380 XU', tone: 'red' },
          { label: 'cả họ vỗ tay ++', tone: 'green' },
          { label: 'mở Thanh Toán Số', tone: 'green' },
        ],
        effects: { acceptDigital: true, trust: 30, xp: 60, happiness: 12 },
        reply:
          'Đúng 3 giây sau đèn sáng trưng, máy lạnh chạy vù vù, nồi lẩu sôi sùng sục trở lại! Chú Bảy xúc động gắp ngay cái càng tôm hùm to nhất mời Thị Trưởng!',
      },
      {
        id: 'remind-app',
        text: 'Cài nhắc lịch đóng tiền điện nước tự động hàng tháng trên MoMo cho chú Bảy',
        btnTone: 'blue',
        tags: [
          { label: 'chú Bảy yên tâm +', tone: 'green' },
          { label: 'mở Thanh Toán Số', tone: 'green' },
        ],
        effects: { acceptDigital: true, trust: 20, xp: 40, happiness: 6 },
        reply:
          '“Hay quá con ơi! Tới kỳ là điện thoại tự nhắc, bấm 1 cái là xong, khỏi sợ đang ăn lẩu mà phải mò tôm trong bóng tối nữa!”',
      },
      {
        id: 'candle',
        text: 'Đưa cho chú Bảy 2 cây đèn cầy bảo ăn lẩu ánh nến cho... lãng mạn',
        btnTone: 'red',
        tags: [
          { label: 'hai họ đổ mồ hôi', tone: 'red' },
          { label: 'gắp nhầm ớt hiểm', tone: 'neutral' },
        ],
        effects: { trust: -10, happiness: -8 },
        reply:
          'Trong ánh nến lung linh và cái nóng 37 độ, ông thông gia gắp nhầm nguyên trái ớt hiểm tưởng là tôm, cay xè nước mắt!',
      },
    ],
  },
  {
    id: 'req-bnpl-sua-xe',
    archetype: 'GIG_WORKER',
    missingService: 'BNPL',
    title: 'Shipper bể lốp giữa trưa nắng 39 độ',
    subtitle: 'Trước cửa tiệm Sửa Xe đầu ngã tư...',
    body: 'Anh Tài chạy xe giao đồ ăn bị cán đinh bể lốp kèm đứt sên trước tiệm Sửa Xe, tốn 400 XU mà trên xe còn đang treo 4 ly trà sữa kem trứng nướng sợ chảy mất. Bạn sẽ:',
    choices: [
      {
        id: 'grant',
        text: 'Trả giúp 400 XU thay lốp xịn & điều xe hỗ trợ giao luôn 4 ly trà sữa',
        costCoins: 400,
        btnTone: 'green',
        tags: [
          { label: '-400 XU', tone: 'red' },
          { label: 'anh Tài cảm kích ++', tone: 'green' },
          { label: 'giữ chuẩn 5 sao', tone: 'green' },
        ],
        effects: { grantService: 'BNPL', trust: 30, xp: 55, happiness: 12 },
        reply:
          'Lốp mới thay trong 5 phút, 4 ly trà sữa giao tới tay khách vẫn còn nguyên lớp kem béo ngậy! Anh Tài được khách tip nóng luôn 50k!',
      },
      {
        id: 'bnpl',
        text: 'Mở Ví Trả Sau tại tiệm Sửa Xe để ứng trước sửa xe ngay lập tức',
        btnTone: 'blue',
        tags: [
          { label: 'anh Tài +', tone: 'green' },
          { label: 'mở Ví Trả Sau', tone: 'green' },
        ],
        effects: { grantService: 'BNPL', trust: 22, xp: 50, happiness: 6 },
        reply:
          '“Quét Ví Trả Sau cái rẹt là anh Lâm thay lốp liền cho em chạy tiếp, cuối tháng có lương cuốc xe trả lại khỏe re!”',
      },
      {
        id: 'reject',
        text: 'Khuyên anh Tài... vừa dắt bộ xe vừa uống hết 4 ly trà sữa cho đỡ khát',
        btnTone: 'red',
        tags: [
          { label: 'tăng 3kg trong 1 chiều', tone: 'red' },
          { label: 'bị khóa app 1 ngày', tone: 'neutral' },
        ],
        effects: { trust: -12, happiness: -8 },
        reply:
          'Anh Tài uống hết 4 ly trà sữa trân châu xong no tới mức không dắt nổi chiếc xe luôn...',
      },
    ],
  },
  {
    id: 'req-von-nhap-hang',
    archetype: 'MERCHANT_ESTABLISHED',
    requiresDigital: true,
    missingService: 'CREDIT',
    title: 'Đơn hàng 500 chiếc lốp xe & Cuộc đua vốn cuối năm',
    subtitle: 'Anh Lâm chủ tiệm Sửa Xe đang cầm bảng báo giá vò đầu bứt tai...',
    body: 'Đại lý vừa báo có lô lốp xe chống đinh giảm giá 40% nếu chốt đơn trong hôm nay, nhưng anh Lâm thiếu 800 XU vốn lưu động. Ngân hàng truyền thống đòi thẩm định sổ đất 2 tuần lễ. Bạn sẽ:',
    choices: [
      {
        id: 'guarantee',
        text: 'Bảo lãnh gói Vốn Kinh Doanh MoMo 800 XU giải ngân trong 60 giây',
        costCoins: 800,
        btnTone: 'green',
        tags: [
          { label: '-800 XU', tone: 'red' },
          { label: 'anh Lâm ++', tone: 'green' },
          { label: 'doanh thu bùng nổ', tone: 'green' },
        ],
        effects: { grantService: 'CREDIT', trust: 30, xp: 70, happiness: 12 },
        reply:
          'Anh Lâm ôm trọn lô 500 chiếc lốp giá sỉ! Cả đoàn xe Shipper toàn thành phố kéo tới thay lốp tấp nập từ sáng tới khuya!',
      },
      {
        id: 'data',
        text: 'Dùng lịch sử doanh thu QR MoMo của tiệm làm hồ sơ xét duyệt hạn mức tự động',
        btnTone: 'blue',
        tags: [
          { label: 'anh Lâm +', tone: 'green' },
          { label: 'mở Tín Dụng Số', tone: 'green' },
        ],
        effects: { grantService: 'CREDIT', trust: 22, xp: 60, happiness: 6 },
        reply:
          '“Ủa, hóa ra mỗi lần khách quét mã QR ở tiệm đều giúp tăng uy tín vay vốn tự động hả Thị Trưởng? Công nghệ giờ đỉnh thiệt!”',
      },
      {
        id: 'wait',
        text: 'Bảo anh Lâm... bơm hơi bánh xe cũ chạy tạm qua mùa Tết',
        btnTone: 'red',
        tags: [
          { label: 'lỡ kèo thơm', tone: 'red' },
          { label: 'anh Lâm tiếc đứt ruột', tone: 'neutral' },
        ],
        effects: { trust: -10, happiness: -8 },
        reply:
          'Tiệm sửa xe bên phường kế bên hốt trọn lô lốp giảm giá, anh Lâm đứng nhìn xe tải chở hàng chạy ngang mà rớt nước mắt.',
      },
    ],
  },
  {
    id: 'req-cinephile-premiere',
    archetype: 'CINEPHILE',
    title: 'Đêm công chiếu phim bom tấn & Cơn khát bắp phô mai!',
    subtitle: '200 fan điện ảnh đang vây kín sảnh Rạp Phim MoMo...',
    body: 'Suất chiếu sớm lúc nửa đêm cháy sạch vé trên MoMo Cinema, nhưng máy nổ bắp rang bơ của rạp lại quá tải. Fan hâm mộ đang gào thét đòi bắp phô mai đôi để vừa xem phim vừa nhâm nhi! Thị Trưởng sẽ:',
    choices: [
      {
        id: 'vip-popcorn-truck',
        text: 'Chi 950 XU điều ngay 3 xe Bắp Rang Phô Mai & Trà Sữa tới sảnh rạp đãi khách',
        costCoins: 950,
        btnTone: 'green',
        tags: [
          { label: '-950 XU', tone: 'red' },
          { label: '+1 Ly Trà Sữa Kho Đồ', tone: 'green' },
          { label: 'Hoàng Cine ++', tone: 'green' },
        ],
        effects: { trust: 32, xp: 85, rewardItemId: 'gift-tra-sua', happiness: 12 },
        reply:
          'Cả rạp vỗ tay rần rần! Bảo Ngọc KOC livestream khen Rạp Phim MoCity 10 điểm dịch vụ và tặng lại Thị Trưởng 1 Ly Trà Sữa Full Topping vào Kho Đồ!',
      },
      {
        id: 'voucher-combo',
        text: 'Tặng voucher giảm 50% Combo Bắp Nước cho suất chiếu ngày mai qua MoMo',
        btnTone: 'blue',
        tags: [
          { label: 'khách rạp hài lòng +', tone: 'green' },
          { label: 'giữ chân fan', tone: 'green' },
        ],
        effects: { trust: 18, xp: 55, happiness: 6 },
        reply:
          'Khách xem phim vui vẻ nhận voucher trên điện thoại, hẹn cuối tuần lại rủ nguyên hội bạn quay lại rạp!',
      },
      {
        id: 'eat-peanuts',
        text: 'Bảo nhân viên rạp... phát đậu phộng luộc ăn đỡ thay bắp rang',
        btnTone: 'red',
        tags: [
          { label: 'vỏ đậu phộng ngập rạp', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trust: -10, happiness: -8 },
        reply:
          'Hết suất chiếu, nhân viên vệ sinh quét ra 3 bao tải vỏ đậu phộng dưới gầm ghế!',
      },
    ],
  },
  {
    id: 'req-elder-chess-club',
    archetype: 'ELDER',
    title: 'Giải Cờ Tướng Đỉnh Cao Vỉa Hè & Tiếng Loa Thần Tài',
    subtitle: 'Bàn cờ thế của Ông Lộc đang tới hồi gay cấn nhất...',
    body: 'Ông Lộc và Cụ Tâm đang đấu ván cờ tướng quyết định chức Vô Địch Khu Phố thì khách mua vé số đứng vây quanh hỏi chuyển khoản QR. Ông Lộc sợ ngẩng lên dò điện thoại sẽ bị Cụ Tâm... đi ăn gian mất con Xe! Bạn sẽ:',
    choices: [
      {
        id: 'sponsor-speaker-loc',
        text: 'Chi 500 XU gắn Loa Thần Tài đọc số tiền tự động ngay cạnh bàn cờ cho Ông Lộc',
        costCoins: 500,
        btnTone: 'green',
        tags: [
          { label: '-500 XU', tone: 'red' },
          { label: '+1 Bao Lì Xì 68 vào Kho Đồ', tone: 'green' },
          { label: 'Ông Lộc ++', tone: 'green' },
        ],
        effects: { trust: 35, acceptDigital: true, xp: 80, rewardItemId: 'item-bao-li-xi', happiness: 12 },
        reply:
          'Loa kêu “Đã nhận 20.000đ” rõ mồn một! Ông Lộc mắt vẫn dán vào bàn cờ hô to “Chiếu tướng!” rồi rút tặng Thị Trưởng 1 Bao Lì Xì Lộc Phát 68 vào Kho Đồ!',
      },
      {
        id: 'referee-help',
        text: 'Cử Trợ Lý Thị Trưởng đứng làm trọng tài kiêm thu ngân vé số giúp Ông Lộc',
        btnTone: 'blue',
        tags: [
          { label: 'Ông Lộc +', tone: 'green' },
          { label: 'ván cờ công bằng', tone: 'green' },
        ],
        effects: { trust: 20, xp: 50, happiness: 6 },
        reply:
          'Ván cờ diễn ra kịch tính suốt 3 tiếng đồng hồ, vé số bán hết veo 200 tờ ngay tại vỉa hè!',
      },
      {
        id: 'draw-game',
        text: 'Hô to “Trời sắp mưa!” để hai cụ... dẹp bàn cờ về nhà',
        btnTone: 'red',
        tags: [
          { label: 'hai cụ cụt hứng', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trust: -12, happiness: -8 },
        reply:
          'Trời nắng chang chang không một gợn mây, hai cụ nhìn Thị Trưởngด้วย ánh mắt đầy nghi ngờ!',
      },
    ],
  },
  {
    id: 'req-investor-summit',
    archetype: 'INVESTOR',
    title: 'Hội Nghị Cổ Đông Nhí & Bí Mật Lãi Kép Túi Thần Tài',
    subtitle: 'Các nhà đầu tư trẻ muốn mở câu lạc bộ tài chính ngay tại Phố Đi Bộ...',
    body: 'Chuyên gia Khải muốn tổ chức buổi chia sẻ “Tích tiểu thành đại — Biến tiền lẻ trà sữa thành Quỹ Đầu Tư” cho bà con tiểu thương, nhưng cần Tòa Thị Chính tài trợ địa điểm và phần thưởng khởi động. Bạn chọn:',
    choices: [
      {
        id: 'sponsor-summit',
        text: 'Chi 1.200 XU tài trợ Sân Khấu Lớn & tặng voucher mở Túi Thần Tài cho toàn phố',
        costCoins: 1200,
        btnTone: 'green',
        tags: [
          { label: '-1.200 XU', tone: 'red' },
          { label: '+1 Loa Phường Vàng vào Kho Đồ', tone: 'green' },
          { label: 'toàn dân gửi tiết kiệm ++', tone: 'green' },
        ],
        effects: { trustAll: 20, xp: 110, rewardItemId: 'item-loa-phuong', happiness: 12 },
        reply:
          'Buổi tọa đàm thành công rực rỡ! Hàng trăm tiểu thương bắt đầu gửi tiền doanh thu mỗi tối vào Túi Thần Tài, và Ban Tổ Chức tặng Thị Trưởng 1 Loa Phường Phát Thanh Vàng!',
      },
      {
        id: 'livestream-finance',
        text: 'Phát sóng trực tiếp buổi chia sẻ lên màn hình LED Quảng Trường Trung Tâm',
        btnTone: 'blue',
        tags: [
          { label: 'kiến thức tài chính +', tone: 'green' },
          { label: '+65 XP', tone: 'green' },
        ],
        effects: { trustAll: 10, xp: 65, happiness: 6 },
        reply:
          'Vừa ngồi uống cà phê vỉa hè vừa xem bí quyết sinh lời, cả khu phố hào hứng bàn tán chuyện đầu tư!',
      },
      {
        id: 'cancel-summit',
        text: 'Bảo mọi người... cứ cất tiền dưới gầm giường cho ấm',
        btnTone: 'red',
        tags: [
          { label: 'tiền nhàn rỗi mất giá', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trust: -10, happiness: -8 },
        reply:
          'Chuyên gia Khải thở dài lắc đầu vì bao nhiêu dòng vốn nhàn rỗi của khu phố bị ngủ quên.',
      },
    ],
  },
];

export const REQUEST_SCRIPTS: RequestScript[] = [
  ...BASE_REQUEST_SCRIPTS,
  ...EXTRA_REQUEST_SCRIPTS,
];

/**
 * Tầng 3 — Sự kiện Toàn Thành Phố Siêu Bựa (City-Wide Comedy & Moral Dilemmas).
 */
const BASE_CITY_EVENTS: CityEventScript[] = [
  {
    id: 'ev-lac-heo-vang',
    title: 'Cơn sốt đi bộ nuôi Heo Vàng lúc 2 giờ sáng!',
    subtitle: 'Toàn bộ khu dân cư bỗng nhiên thức trắng đêm chạy bộ...',
    speaker: 'Ông Lộc & Hội Người Cao Tuổi GenZ',
    body: 'Cư dân MoCity phát hiện đi bộ đủ bước chân trên MoMo được nhận thức ăn nuôi Heo Vàng làm từ thiện và mở rương quà. Thế là 2 giờ sáng cả trăm người mặc đồ bộ pijama chạy rầm rập quanh quảng trường làm chó cả xóm sủa vang trời! Bạn sẽ xử lý thế nào?',
    minMayorLevel: 1,
    choices: [
      {
        id: 'marathon-festival',
        text: 'Chi 650 XU mở “Đại Nhạc Hội Đi Bộ Heo Vàng” vào 6h sáng kèm trà tắc miễn phí',
        costCoins: 650,
        btnTone: 'green',
        tags: [
          { label: '-650 XU', tone: 'red' },
          { label: 'hy sinh ngân khách', tone: 'red' },
          { label: 'toàn dân phấn khích ++', tone: 'green' },
        ],
        effects: { trustAll: 18, xp: 100, happiness: 12 },
        reply:
          'Từ nay đúng 6h sáng cả thành phố cùng tập thể dục nhịp điệu! Đám đông vỡ oà hào hứng vây quanh Thị Trưởng. Tòa Thị Chính thì nhẹ nhõm vì ngân khách đã xuống còn... hơn mất!',
      },
      {
        id: 'smart-step-zone',
        text: 'Quy hoạch tuyến phố đi bộ phát sáng riêng quanh công viên từ 18h - 22h',
        btnTone: 'blue',
        tags: [
          { label: 'cả phố hài lòng +', tone: 'green' },
          { label: '+60 XP', tone: 'green' },
        ],
        effects: { trustAll: 10, xp: 60, happiness: 6 },
        reply:
          'Tuyến phố đi bộ tối nào cũng lung linh ánh đèn, bà con vừa tản bộ săn bước chân nuôi Heo Vàng vừa ghé mua trà sữa nhộn nhịp!',
      },
      {
        id: 'ban-night-walk',
        text: 'Bắc loa phường yêu cầu ai đi bộ sau 11h đêm phải... bước đi kiểu ninja không phát tiếng động',
        btnTone: 'red',
        tags: [
          { label: 'cảnh tượng kỳ quặc', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -8, happiness: -8 },
        reply:
          'Tối hôm đó camera an ninh ghi lại cảnh 50 cư dân mặc đồ ngủ rón rén đi nhón gót quanh công viên trông còn đáng sợ hơn phim kinh dị!',
      },
    ],
  },
  {
    id: 'ev-shipper-bun-bo',
    title: 'Giải Đua Shipper Mở Rộng: Giao Bún Bò Không Đổ Nước Lèo!',
    subtitle: 'Đại lộ trung tâm đang biến thành đường đua F1 của biệt đội áo hồng...',
    speaker: 'Anh Tài Shipper & Bếp Trưởng Long',
    body: 'Để chứng minh ai là “Thánh Giao Hàng MoMo Food”, 20 anh em Shipper tự tổ chức giải đua treo 10 tô bún bò đầy ắp nước lèo trên tay lái, lạng lách qua ngã tư khiến bà con đứng tim! Thị Trưởng quyết định:',
    minMayorLevel: 1,
    choices: [
      {
        id: 'upgrade-road-cup',
        text: 'Chi 800 XU trải nhựa phẳng lì toàn đại lộ & trao Cúp “Thùng Giữ Nhiệt Chống Sóng Sánh”',
        costCoins: 800,
        btnTone: 'green',
        tags: [
          { label: '-800 XU', tone: 'red' },
          { label: 'hy sinh ngân khách', tone: 'red' },
          { label: 'biệt đội Shipper ++', tone: 'green' },
        ],
        effects: { trustAll: 16, xp: 95, happiness: 12 },
        reply:
          'Đường phố MoCity êm như nhung! Hiệp hội Shipper gửi lời cảm ơn tới Thị Trưởng bằng một bài tụng sáu câu. Họ không tặng gì cả, nhưng uy tín thì có.',
      },
      {
        id: 'separate-soup',
        text: 'Ban hành quy chuẩn “Để riêng nước lèo với bún” cho toàn bộ quán ăn trong thành phố',
        btnTone: 'blue',
        tags: [
          { label: 'bếp trưởng Long +', tone: 'green' },
          { label: 'an toàn giao thông +', tone: 'green' },
        ],
        effects: { trustAll: 8, xp: 50, happiness: 6 },
        reply:
          'Giải pháp đơn giản mà hiệu quả tuyệt đối! Khách nhận đồ ăn sợi bún không bị nở mà Shipper chạy xe điềm đạm hẳn.',
      },
      {
        id: 'dry-noodle-only',
        text: 'Ra sắc lệnh cấm bán bún nước, bắt cả thành phố chuyển sang ăn... bún thịt nướng khô',
        btnTone: 'red',
        tags: [
          { label: 'hội mê bún bò phản đối', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -12, happiness: -8 },
        reply:
          'Cô Tư Bún Riêu cầm muôi múc nước lèo đứng biểu tình trước Tòa Thị Chính suốt 2 tiếng đồng hồ!',
      },
    ],
  },
  {
    id: 'ev-tin-don-lua-dao',
    title: 'Vụ án “Kẻ dán trộm mã QR” & Màn phản đòn của Loa Thần Tài',
    subtitle: 'Cả ngã tư xôn xao vì một thanh niên khả nghi lảng vảng lúc nửa đêm...',
    speaker: 'Ông Lộc & Tổ Bảo Vệ Dân Phố',
    body: 'Có kẻ lén dán đè mã QR lạ lên bảng thanh toán của mấy tiệm tạp hóa đầu phố để ăn chặn tiền bún sáng. Tiểu thương hoang mang định dẹp hết bảng QR quay về cầm tiền lẻ. Bạn sẽ:',
    minMayorLevel: 1,
    choices: [
      {
        id: 'workshop',
        text: 'Chi 600 XU trang bị “Loa Thần Tài MoMo Đọc Tên Chính Chủ” cho toàn bộ cửa hàng',
        costCoins: 600,
        btnTone: 'green',
        tags: [
          { label: '-600 XU', tone: 'red' },
          { label: 'hy sinh ngân khách', tone: 'red' },
          { label: 'bắt sống kẻ gian', tone: 'green' },
        ],
        effects: { trustAll: 16, xp: 85, happiness: 12 },
        reply:
          'Sáng hôm sau khách vừa quét mã, Loa Thần Tài đứng im không đọc tiếng tiền về của Cô Tư! Tổ dân phố tóm gọn kẻ gian. Cô Tư nhìn Thị Trưởng bằng ánh mắt cảm ơn sâu sắc.',
      },
      {
        id: 'inspect',
        text: 'Tặng khung mica khóa chống bóc & tem chống giả MoMo cho từng tiệm',
        btnTone: 'blue',
        tags: [
          { label: 'ông Lộc +', tone: 'green' },
          { label: 'cô Tư +', tone: 'green' },
        ],
        effects: { trustAll: 8, xp: 45, happiness: 6 },
        reply:
          'Bảng QR được bọc kính cường lực sáng bóng, kẻ gian nhìn thấy chỉ biết lắc đầu bỏ chạy.',
      },
      {
        id: 'ignore',
        text: 'Bảo các tiệm... tự vẽ lại mã QR bằng bút lông cho độc lạ',
        btnTone: 'red',
        tags: [
          { label: 'camera điện thoại bó tay', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -10, happiness: -8 },
        reply:
          'Cô Tư cầm bút lông vẽ cái mã QR nhìn giống hệt bàn cờ caro, không một chiếc điện thoại nào trên trái đất quét nổi!',
      },
    ],
  },
  {
    id: 'ev-to-ve-trung',
    title: 'Tờ vé số độc đắc bay vô chuồng gà nhà chú Bảy',
    subtitle: 'Chuyện hy hữu nhất lịch sử xổ số kiến thiết MoCity...',
    speaker: 'Ông Lộc bán vé số',
    body: 'Ông Lộc vừa dò trúng giải khuyến khích 800 XU thì một cơn gió lốc thổi tờ vé số bay thẳng vô chuồng gà trống nhà chú Bảy. Con gà trống chiến đang mổ tờ vé số rách mất một góc! Bạn sẽ:',
    minMayorLevel: 1,
    choices: [
      {
        id: 'compensate-loc',
        text: 'Chi 800 XU đổi thưởng ngay cho ông Lộc & mở tính năng “Lưu Vé Số An Toàn” trên app',
        costCoins: 800,
        btnTone: 'green',
        tags: [
          { label: '-800 XU', tone: 'red' },
          { label: 'hy sinh ngân khách', tone: 'red' },
          { label: 'ông Lộc mừng rơi nước mắt ++', tone: 'green' },
        ],
        effects: { trustAll: 16, xp: 90, happiness: 12 },
        reply:
          'Ông Lộc nói "Thị Trưởng chi mạnh tay quá, bà con ghi nhớ!" rồi bước ra chỗ vắng đếm lại số tiền trong ví. Còn con gà trống nhà chú Bảy thì thoát án lên nồi cháo!',
      },
      {
        id: 'report-mai',
        text: 'Cùng tổ dân phố dán lại từng mảnh vé số bằng băng keo trong để đi lãnh thưởng',
        btnTone: 'blue',
        tags: [
          { label: 'ông Lộc +', tone: 'green' },
          { label: 'tình làng nghĩa xóm +', tone: 'green' },
        ],
        effects: { trustAll: 6, xp: 45, happiness: 6 },
        reply:
          'Sau 2 tiếng ghép hình như chơi Lego, đại lý vé số xác nhận mã vạch vẫn còn nguyên và trao thưởng cho ông Lộc!',
      },
      {
        id: 'ignore-loc',
        text: 'Tuyên bố... con gà trống mới là chủ nhân hợp pháp của giải thưởng',
        btnTone: 'red',
        tags: [
          { label: 'ông Lộc giận tím người', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -12, happiness: -8 },
        reply:
          'Ông Lộc giận dỗi chống gậy đi thẳng, thề tuần này không phím con số may mắn nào cho Thị Trưởng nữa!',
      },
    ],
  },
  {
    id: 'ev-livestream-cho-dem',
    title: 'Đêm Hội Livestream Chợ Đêm MoCity & Sập Giỏ Hàng!',
    subtitle: 'Bảo Ngọc KOC cùng Cô Ba Bánh Mì lên sóng thu hút 50.000 mắt xem...',
    speaker: 'Bảo Ngọc KOC & Cô Ba Bánh Mì',
    body: 'Phiên livestream quảng bá Phố Ẩm Thực MoCity bất ngờ leo thẳng Top 1 Thịnh Hành! Hàng ngàn đơn đặt bánh mì, trà sữa và vé xem phim nổ liên hồi khiến các tiệm trở tay không kịp. Thị Trưởng sẽ hỗ trợ thế nào?',
    minMayorLevel: 1,
    choices: [
      {
        id: 'boost-livestream',
        text: 'Chi 1.500 XU tung gói “Freeship & Voucher Giờ Vàng” tiếp sức toàn bộ tiểu thương',
        costCoins: 1500,
        btnTone: 'green',
        tags: [
          { label: '-1.500 XU', tone: 'red' },
          { label: 'hy sinh ngân khách', tone: 'red' },
        ],
        effects: { trustAll: 22, xp: 120, happiness: 12 },
        reply:
          'Doanh số đêm hội phá kỷ lục lịch sử! Tiệm nước bà chị Ba bán hết sạch trong 20 phút. Tuy nhiên Thị Trưởng cũng phải móc túi trả tiền thuê sân khấu, âm cơ nên buồn mà kệ.',
      },
      {
        id: 'mobilize-shippers',
        text: 'Huy động toàn bộ đội xe Shipper tăng ca đêm, chi thưởng nóng 900 XU/đơn cho cả đội',
        costCoins: 900,
        btnTone: 'blue',
        tags: [
          { label: '-900 XU', tone: 'red' },
          { label: 'thưởng nóng cho đội xe', tone: 'neutral' },
          { label: 'uy tín toàn phố +', tone: 'green' },
        ],
        effects: { trustAll: 12, xp: 75, happiness: 6 },
        reply:
          'Mọi đơn hàng đều được giao nóng hổi trong 15 phút, khách hàng để lại hàng ngàn đánh giá 5 sao cho khu phố! Đội xe hài lòng, túi tiền ngân khách thì không hài lòng lắm.',
      },
      {
        id: 'unplug-wifi',
        text: 'Rút dây mạng Wi-Fi công cộng để... bà con đi ngủ sớm',
        btnTone: 'red',
        tags: [
          { label: 'mất trắng đơn hàng', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -15, happiness: -8 },
        reply:
          '50.000 khán giả đang chốt đơn thì màn hình đứng hình, Cô Ba Bánh Mì tiếc đứt ruột 200 ổ bánh mì vừa nướng giòn rụm!',
      },
    ],
  },
  {
    id: 'ev-karaoke-loa-keo-1000w',
    title: 'Đại Chiến Loa Kéo 1000W: Đêm Nhạc Bolero Xuyên Màn Đêm!',
    subtitle: 'Cả xóm mất ngủ vì giọng ca vàng của Chú Bảy và Bác Ba...',
    speaker: 'Bác Ba Đầu Hẻm & Chú Bảy Loa Kéo',
    body: 'Chú Bảy mới tậu chiếc loa kéo 1000W bật đèn LED nhấp nháy, hát bài "Đắp Mộ Cuộc Tình" từ chiều đến 23h đêm chưa nghỉ. Bác Ba vác chổi ra thách đấu song ca để phân tài cao thấp. Cả phố đứng bu đông nghẹt! Thị Trưởng phân xử thế nào?',
    minMayorLevel: 1,
    choices: [
      {
        id: 'the-voice-via-he',
        text: 'Chi 700 XU tổ chức "The Voice Vỉa Hè" tối Thứ 7 có phòng cách âm & Cúp Micro Vàng',
        costCoins: 700,
        btnTone: 'green',
        tags: [
          { label: '-700 XU', tone: 'red' },
          { label: 'hy sinh ngân khách', tone: 'red' },
          { label: 'cả xóm hoan hô ++', tone: 'green' },
        ],
        effects: { trustAll: 18, xp: 90, happiness: 12 },
        reply:
          'Sân khấu ca nhạc cuối tuần đông nghẹt như hội hoa xuân! Hai bác hát song ca xuất sắc, cả phố hát theo đến khàn cả giọng. Phần quà tặng cho Thị Trưởng là một tấm lòng chân thành.',
      },
      {
        id: 'bluetooth-only',
        text: 'Ban hành quy ước: Sau 22h chỉ được hát thì thầm qua tai nghe Bluetooth',
        btnTone: 'blue',
        tags: [
          { label: 'giữ gìn trật tự +', tone: 'green' },
          { label: '+55 XP', tone: 'green' },
        ],
        effects: { trustAll: 10, xp: 55, happiness: 6 },
        reply:
          'Quy định vừa văn minh vừa hài hước, đêm xuống khu phố êm đềm bà con ngủ say giấc nồng.',
      },
      {
        id: 'cut-power-fuse',
        text: 'Cúp cầu dao điện tổng cả dãy phố để ép mọi người đi ngủ sớm',
        btnTone: 'red',
        tags: [
          { label: 'tối om cả xóm', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -14, happiness: -8 },
        reply:
          'Điện vừa ngắt thì loa kéo của chú Bảy chạy bằng bình ắc quy vẫn hát vang bài "Còn Thương Rau Đắng Mọc Sau Hè" vang vọng giữa màn đêm!',
      },
    ],
  },
  {
    id: 'ev-tra-da-dua-tin',
    title: 'Tổng Cục Tình Báo Trà Đá Vỉa Hè: Cơn Sốt Trúng Vietlott 100 Tỷ!',
    subtitle: 'Tin đồn một cư dân vừa trúng độc đắc Jackpot lan khắp ngõ ngách...',
    speaker: 'Cô Chín Trà Đá & Anh Hùng Grab',
    body: 'Cô Chín vừa châm bình trà vừa phím tin mật: Có người vừa bấm trúng Jackpot 100 tỷ trên MoMo ở tiệm tạp hóa đầu phố! Hơn 50 anh em tài xế ùa vào chúc mừng làm chủ quán toát mồ hôi hột vì... hóa ra chỉ trúng 50.000đ thẻ cào nạp điện thoại! Bạn sẽ giải cứu:',
    minMayorLevel: 1,
    choices: [
      {
        id: 'treat-tra-tac',
        text: 'Chi 500 XU khao toàn bộ bà con 1 chùm Trà Tắc MoMo khổng lồ để chúc mừng',
        costCoins: 500,
        btnTone: 'green',
        tags: [
          { label: '-500 XU', tone: 'red' },
          { label: 'hy sinh ngân khách', tone: 'red' },
          { label: 'tiểu thương vui vẻ ++', tone: 'green' },
        ],
        effects: { trustAll: 16, xp: 80, happiness: 12 },
        reply:
          'Không khí rộn rã tiếng cười bên quán cóc, ai cũng hỏi thăm Thị Trưởng sức khoẻ thế nào sau mùa "chi bao bọc chuyện nghe đồn" vừa rồi.',
      },
      {
        id: 'fact-check-board',
        text: 'Lắp bảng tin điện tử thông minh cập nhật kết quả Vietlott chính xác từng phút',
        btnTone: 'blue',
        tags: [
          { label: 'cô Chín +', tone: 'green' },
          { label: 'minh bạch số liệu +', tone: 'green' },
        ],
        effects: { trustAll: 8, xp: 50, happiness: 6 },
        reply:
          'Bảng tin số hóa giúp bà con vừa uống trà vừa dò vé số nhanh gọn, không lo tin đồn thất thiệt.',
      },
      {
        id: 'ignore-gossip',
        text: 'Mặc kệ cho mọi người tha hồ đồn thổi để khu phố... thêm phần ly kỳ',
        btnTone: 'red',
        tags: [
          { label: 'hàng xóm soi nhau', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -10, happiness: -8 },
        reply:
          'Hôm sau ai đi chợ cũng đeo kính đen và khẩu trang vì sợ hàng xóm nghĩ mình là người trúng 100 tỷ!',
      },
    ],
  },
  {
    id: 'ev-nuoc-ngap-duong-dua-thuyen',
    title: 'Mưa Rào Bất Chợt & Dịch Vụ Xe Lội Nước “Venice Vỉa Hè”!',
    subtitle: 'Đường phố biến thành sông, tiệm sửa xe mở tour cano đưa rước...',
    speaker: 'Anh Ba Sửa Xe & Đội Cứu Hộ Phố',
    body: 'Cơn mưa rào trút xuống biến mặt đường phố MoCity thành kênh đào thu nhỏ. Anh Ba tiệm sửa xe nhanh trí bơm phao kéo và xe đẩy cải tiến để cõng người qua đường với giá 10K/chuyến nhận quét mã MoMo QR ting ting! Bạn sẽ xử lý thế nào?',
    minMayorLevel: 1,
    choices: [
      {
        id: 'upgrade-drain-hero',
        text: 'Chi 900 XU thông cống thoát nước tức thì & trao Huân Chương “Anh Hùng Cứu Hộ” cho anh Ba',
        costCoins: 900,
        btnTone: 'green',
        tags: [
          { label: '-900 XU', tone: 'red' },
          { label: 'hy sinh ngân khách', tone: 'red' },
          { label: 'nước rút sạch bóng ++', tone: 'green' },
        ],
        effects: { trustAll: 20, xp: 110, happiness: 12 },
        reply:
          'Nước rút sạch trong 10 phút, mặt đường khô ráo! Anh Ba thở phào, cả xóm thở phào, còn túi tiền Thị Trưởng thì không thở phào.',
      },
      {
        id: 'kayak-carnival',
        text: 'Tranh thủ mở “Lễ Hội Đua Thuyền Phao Vỉa Hè” cổ vũ bà con vui chơi',
        btnTone: 'blue',
        tags: [
          { label: 'bà con cười ngất +', tone: 'green' },
          { label: '+70 XP', tone: 'green' },
        ],
        effects: { trustAll: 12, xp: 70, happiness: 6 },
        reply:
          'Hình ảnh cư dân chèo thuyền phao vịt vàng giữa phố lên sóng truyền hình, thu hút hàng ngàn khách ghé xem!',
      },
      {
        id: 'fine-anh-ba',
        text: 'Phạt anh Ba vì dám mở dịch vụ giao thông đường thủy... trái phép',
        btnTone: 'red',
        tags: [
          { label: 'anh Ba dỗi cất thuyền', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -15, happiness: -8 },
        reply:
          'Anh Ba dỗi cất thuyền vào kho, cả trăm người phải xắn quần bì bõm lội nước ướt hết cả giày hiệu!',
      },
    ],
  },
  {
    id: 'ev-meo-tam-the-chiem-ghe',
    title: '“Đại Ca” Mèo Tam Thể Chiếm Ghế Bành Quán Cà Phê Vỉa Hè!',
    subtitle: 'Vị khách đặc biệt 4 chân khiến quán cà phê kẹt cứng bàn...',
    speaker: 'Bé An Quán Cà Phê & Tổ Dân Phố',
    body: 'Một chú mèo tam thể béo tròn tự ý nhảy lên nằm ngủ trên chiếc ghế bành xịn nhất quán cà phê vỉa hè. Ai tới gần đòi ghế đều bị chú mèo đưa mắt lườm sắc như dao cau. Khách kéo tới chụp ảnh check-in nườm nượp! Thị Trưởng sẽ:',
    minMayorLevel: 1,
    choices: [
      {
        id: 'adopt-mascot-cat',
        text: 'Chi 600 XU sắc phong Đại Ca làm “Mascot Giữ Vía Tài Lộc” & mua sắm đệm êm',
        costCoins: 600,
        btnTone: 'green',
        tags: [
          { label: '-600 XU', tone: 'red' },
          { label: 'hy sinh ngân khách', tone: 'red' },
          { label: 'khách kéo đến gấp đôi ++', tone: 'green' },
        ],
        effects: { trustAll: 18, xp: 85, happiness: 12 },
        reply:
          'Đại Ca mèo tam thể trở thành idol giới trẻ của cả khu phố! Quán cà phê kín khách đứng nghẹn cổ chụp ảnh. Phần quà tặng cho Thị Trưởng là một tấm lòng chân thành.',
      },
      {
        id: 'scratch-post-station',
        text: 'Lắp thêm cây cào móng và góc đồ chơi cho mèo quanh vỉa hè',
        btnTone: 'blue',
        tags: [
          { label: 'bé An +', tone: 'green' },
          { label: 'yêu động vật +', tone: 'green' },
        ],
        effects: { trustAll: 9, xp: 50, happiness: 6 },
        reply:
          'Góc phố trở thành điểm hẹn thân thiện cho thú cưng, các bé thiếu nhi thích mê!',
      },
      {
        id: 'evict-cat',
        text: 'Bắt đại ca mèo đi làm bảo vệ... đứng gác cửa bắt chuột',
        btnTone: 'red',
        tags: [
          { label: 'mèo ngủ gật phơi bụng', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -8, happiness: -8 },
        reply:
          'Vừa giao ca gác cửa thì Đại Ca đã lăn ra ngáy khò khò trên yên xe khách, chuột đi ngang qua còn ngoái lại chào!',
      },
    ],
  },
  {
    id: 'ev-san-sale-ngay-doi',
    title: 'Siêu Sale Ngày Đôi: Nghẽn Mạng Vì 10.000 Khách Săn Voucher 1Đ!',
    subtitle: 'Bà con giơ điện thoại lên trời bắt sóng Wi-Fi Tòa Thị Chính...',
    speaker: 'Cô Mai Tạp Hóa & Kỹ Thuật Viên Viễn Thông',
    body: 'Đến khung giờ vàng săn Voucher 1Đ trà sữa và nạp thẻ game trên MoMo, lưu lượng truy cập tăng vọt khiến mạng 4G khu phố chập chờn. Hàng trăm bạn trẻ bu kín cửa Tòa Thị Chính giơ điện thoại lên trời như đang làm phép bắt sóng! Thị Trưởng giải cứu:',
    minMayorLevel: 1,
    choices: [
      {
        id: 'boost-5g-station',
        text: 'Chi 1.200 XU kích hoạt trạm phát 5G Siêu Tốc & phát thêm 200 voucher dự phòng',
        costCoins: 1200,
        btnTone: 'green',
        tags: [
          { label: '-1.200 XU', tone: 'red' },
          { label: 'hy sinh ngân khách', tone: 'red' },
          { label: 'toàn dân săn sale thành công ++', tone: 'green' },
        ],
        effects: { trustAll: 22, xp: 125, happiness: 12 },
        reply:
          'Sóng 5G căng đét như cáp quang quân đội! Ai cũng giật được voucher giảm 50%, cả xóm reo hò. Hoá đơn điện tháng sau chắc chắn sẽ có một món ăn mới không ai đoán được.',
      },
      {
        id: 'open-hall-cooling',
        text: 'Mở cửa hội trường lớn cho bà con vào ngồi điều hòa săn sale tập trung',
        btnTone: 'blue',
        tags: [
          { label: 'tình cảm nhân dân +', tone: 'green' },
          { label: '+80 XP', tone: 'green' },
        ],
        effects: { trustAll: 14, xp: 80, happiness: 6 },
        reply:
          'Hội trường rộn ràng như xem chung kết bóng đá, mỗi lần ai săn được voucher là cả phòng vỗ tay rần rần!',
      },
      {
        id: 'airplane-mode-prank',
        text: 'Bảo bà con bật chế độ máy bay 30 giây rồi tắt đi... cho vui',
        btnTone: 'red',
        tags: [
          { label: 'trượt hết voucher', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -16, happiness: -8 },
        reply:
          'Lúc bật lại máy bay thì khung giờ vàng 1Đ đã trôi qua, bà con nhìn nhau thở dài ngao ngán!',
      },
    ],
  },
];

export const CITY_EVENTS: CityEventScript[] = [
  ...BASE_CITY_EVENTS,
  ...EXTRA_CITY_EVENTS,
  ...CONDITIONAL_CITY_EVENTS,
];

export const REQUEST_BY_ID: Record<string, RequestScript> = Object.fromEntries(
  REQUEST_SCRIPTS.map((r) => [r.id, r]),
);

export const EVENT_BY_ID: Record<string, CityEventScript> = Object.fromEntries(
  CITY_EVENTS.map((e) => [e.id, e]),
);

