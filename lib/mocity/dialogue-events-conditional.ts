import type { CityEventScript } from './types';

/**
 * SỰ KIỆN THEO TRẠNG THÁI THÀNH PHỐ
 *
 * Ngân hàng 35 sự kiện cũ chỉ được chọn theo `minMayorLevel`, nên chúng
 * không hề biết thành phố đang ra sao. Người chơi vừa bị nợ xấu BNPL tăng
 * vẫn được nghe chuyện tổ chức đại nhạc hội.
 *
 * Nhóm này khai báo điều kiện trạng thái (`CityEventScript.happinessBelow`,
 * `nplAbove`, `requiresCrowding`, ...). Mọi điều kiện là AND với điều kiện
 * cấp Thị Trưởng, và kịch bản không khai báo gì thì vẫn luôn hợp lệ.
 *
 * Nội dung viết theo đúng giọng các kịch bản cũ: hài đời thường, nhân vật
 * có hành động cụ thể, và hậu quả chạm đúng một chỉ số tài chính.
 */
export const CONDITIONAL_CITY_EVENTS: CityEventScript[] = [
  {
    id: 'ev-hang-doi-lam-ngh-phep',
    title: 'Hàng Đợi Vỡ Bờ & Cảnh Báo Khách Bỏ Hàng!',
    subtitle: 'Bà con xếp hàng ngoài cửa tiệm nhiều hơn số chỗ phục vụ...',
    speaker: 'Chị Hàng Rong & Thợ Sửa Xe',
    body: 'Sáng nay dân cả kéo tới xếp hàng đông nghịt trước mấy tiệm mới mở, nhưng số chỗ thu ngân thì không đủ. Bà con đứng đợi quá lâu thì quay đi mất, mà quay đi là mất luôn tiền bán hàng chứ không phải chờ thêm xíu. Bạn sẽ xử lý thế nào?',
    minMayorLevel: 1,
    requiresCrowding: true,
    choices: [
      {
        id: 'hire-more-counter',
        text: 'Chi 1.200 XU thuê thêm quầy thu ngân & đào tạo nhân viên phục vụ song song',
        costCoins: 1200,
        btnTone: 'green',
        tags: [
          { label: '-1.200 XU', tone: 'red' },
          { label: 'thêm chỗ phục vụ', tone: 'green' },
          { label: 'khách bỏ hàng giảm', tone: 'green' },
        ],
        effects: { trustAll: 16, xp: 95, happiness: 12 },
        reply:
          'Thêm quầy thu ngân, tiệm nào cũng loãng hàng ra ngay! Ông Lộc đứng ngoài hàng đếm: "Từ nay tui không còn phải đứng đợi mấy tiếm chiều đông nữa!"',
      },
      {
        id: 'number-ticket',
        text: 'Lắp hệ thống số thứ tự lấy số qua MoMo, khách đứng đợi mà vẫn chạy quảng cáo cho tiệm khác',
        btnTone: 'blue',
        tags: [
          { label: 'không tốn tiền mặt', tone: 'green' },
          { label: 'khách đi dạo chờ lâu hơn', tone: 'red' },
        ],
        effects: { trustAll: 6, xp: 45, happiness: 6 },
        reply:
          'Lấy số qua app thì không ai chen nhau được nữa. Nhưng bà con lấy số xong thấy đông quá thì lải ra đi ăn bánh xèo kia, kệ tiệm luôn!',
      },
      {
        id: 'close-doors',
        text: 'Đóng cửa tiệm lại cho đến khi hàng vãn, chấp nhận hôm nay không bán được gì',
        btnTone: 'red',
        tags: [
          { label: 'mất sạch doanh thu hôm nay', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -12, happiness: -8 },
        reply:
          'Rè cửa xuống như giờ tất cả, bà con chụp ảnh đăng Facebook: "Thành phố đóng cửa vì không biết xếp hàng!"',
      },
    ],
  },
  {
    id: 'ev-no-xau-vi-tra-sau-vuot',
    title: 'Tỷ Lệ Nợ Xấu Vượt Ngưỡng & Bùng Nổ Quỹt Bill!',
    subtitle: 'Ví Trả Sau quay xở nợ không thu hồi được, phố mình bắt đầu gọi là thành phố "ở nợ"...',
    speaker: 'Bé Nam GenZ & Bác Tài',
    body: 'Mấy hôm nay nhiều bạn sinh viên quẹt thẻ trả sau rồi quên trả, tiệm thì không dám mời lần hai vì ngại. Tỷ lệ nợ xấu thành phố đã vượt mốc an toàn, và mỗi khoản không thu hồi được đều đang cắn vào lợi nhuận của bạn. Bạn xử lý sao?',
    minMayorLevel: 2,
    nplAbove: 0.12,
    choices: [
      {
        id: 'tighten-limit',
        text: 'Siết hạn mức Trả Sau về mức cư dân thực sự trả nổi, niêm yết công khai hạn mức',
        btnTone: 'green',
        tags: [
          { label: 'giảm nợ xấu', tone: 'green' },
          { label: 'giảm chút doanh thu', tone: 'neutral' },
        ],
        effects: { trustAll: 14, xp: 90, happiness: 12 },
        reply:
          'Hạn mức nhỏ lại thì bán được ít hơn, nhưng tiệm nào cũng thu được tiền hết. Bác Tài bảo: "Bán được nhiều mà không thu được thì có cũng như không!"',
      },
      {
        id: 'repay-campaign',
        text: 'Chi 900 XU mở chiến dịch "Trả Hết Một Lần Nhận Món Quà", giảm phí phạt trễ hạn',
        costCoins: 900,
        btnTone: 'blue',
        tags: [
          { label: '-900 XU', tone: 'red' },
          { label: 'nợ xấu giảm nhanh', tone: 'green' },
        ],
        effects: { trustAll: 10, xp: 70, happiness: 6 },
        reply:
          'Hết tháng mà 8 trong 10 đứa trả nợ trả đủ, tiệm ăn mừng ngày nào cũng thu được tiền. Số tiền 900 Xu chi vào khuyến mãi quay lại thành tiền trả nợ.',
      },
      {
        id: 'ban-anon',
        text: 'Khóa luôn Ví Trả Sau lại tạm thời, không cho ai mượn thêm nữa',
        btnTone: 'red',
        tags: [
          { label: 'thu hồi được nợ cũ', tone: 'neutral' },
          { label: 'thu nhập thay thế mất', tone: 'red' },
        ],
        effects: { trustAll: -10, happiness: -8 },
        reply:
          'Phố mình cấm Trả Sau thì tiểu thương buôn bán xong lại quay về đếm tiền mặt. Ông Lộc thở dài: "Không mấy khi phố nghe lời mình thế!"',
      },
    ],
  },
  {
    id: 'ev-dong-tien-gan-bang',
    title: 'Hệ Số An Toàn Dòng Tiền Tụt Xuống Dưới 1!',
    subtitle: 'Quỹ vận hành không còn đủ chi phí cho một chu kỳ 60 giây nữa...',
    speaker: 'Trợ Lý Thị Trưởng & Kế Toán Phố',
    body: 'Chi phí vận hành mỗi giây hiện đã lớn hơn khả năng quỹ vận hành của bạn gánh nổi trong một phút. Hệ số an toàn dòng tiền đã tụt dưới 1.0, tức là chỉ cần một sự cố nhỏ là cả thành phố sẽ không đủ tiền trả hoá đơn đến hạn.',
    minMayorLevel: 1,
    cashflowBelow: 1,
    choices: [
      {
        id: 'pull-from-personal',
        text: 'Rút tiền từ Ví Cá Nhân đổ vào quỹ vận hành, giữ dòng tiền không bị đứt',
        btnTone: 'green',
        tags: [
          { label: 'hệ số an toàn tăng', tone: 'green' },
          { label: 'ví cá nhân vơi', tone: 'red' },
        ],
        effects: { trustAll: 12, xp: 85, happiness: 12 },
        reply:
          'Bơm tiền từ ví cá nhân vào quỹ là chữa đúng bệnh nhưng chữa khỏi bệnh, không phải chữa bệnh. Kế toán phố vẫn thưa bạn: "Giảm chi phí vận hành đi Thị Trưởng!"',
      },
      {
        id: 'sell-relic',
        text: 'Bán Bảo Vật trang bị đang gây hại hiệu quả, thu tiền về bơm ngay vào quỹ',
        btnTone: 'blue',
        tags: [
          { label: 'mất bonus Bảo Vật', tone: 'red' },
          { label: 'tiền về ngay', tone: 'green' },
        ],
        effects: { trustAll: 4, xp: 60, happiness: 6 },
        reply:
          'Tháo Bảo Vật ra bán được giá tốt, nhưng doanh thu mỗi giây tụt luôn theo. Bạn phải chọn giữ dòng tiền hay giữ tốc độ kiếm tiền, không thể giữ cả hai.',
      },
      {
        id: 'keep-draining',
        text: 'Không làm gì cả, cứ thế cho đến khi tự ổn',
        btnTone: 'red',
        tags: [
          { label: 'rủi ro đứt dòng tiền', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -14, happiness: -8 },
        reply:
          'Chờ cho tự ổn là cách của người không có sổ sách. Quỹ cạn, hóa đơn đến hạn, chủ tiệm kêu, phố đứng lì chờ bạn xử lý.',
      },
    ],
  },
  {
    id: 'ev-hanh-phuc-duoi-day',
    title: 'Cảnh Báo Hạnh Phúc Dưới Ngưỡng & Đờn Đôi Trên Phố!',
    subtitle: 'Cư dân xì xào khu phố bạn đang thua đờn trên chính con đường đi...',
    speaker: 'Chị Thảo Văn Phòng & Bảo Ngọc KOC',
    body: 'Cảnh báo hạnh phúc toàn phố đã tụt xuống mức nguy hiểm: người ta than phiền hết đường, mệt mỏi nhiều hơn mức bình thường, và những việc không cần thiết bắt đầu xuất hiện. Hệ số nhân doanh thu đang giảm theo, nghĩa là doanh thu giảm cả vì niềm tin chứ không chỉ vì tiệm kém.',
    minMayorLevel: 1,
    happinessBelow: 55,
    choices: [
      {
        id: 'heal-project',
        text: 'Chi 1.000 XU mở chuỗi trung tâm chăm sóc cư dân & đường phố vệ sinh sạch sẽ',
        costCoins: 1000,
        btnTone: 'green',
        tags: [
          { label: '-1.000 XU', tone: 'red' },
          { label: 'hạnh phúc tăng mạnh', tone: 'green' },
          { label: 'hệ số nhân tăng lại', tone: 'green' },
        ],
        effects: { trustAll: 18, xp: 100, happiness: 16 },
        reply:
          'Chỉ mới một tuần mà phố sạch bóng, ngủ được, đi đứng phòng hoa mát cả. Bảo Ngọc quay clip 10 triệu view: "Tìm được người biết lắng nghe!"',
      },
      {
        id: 'cheap-policy',
        text: 'Áp dụng chính sách giảm giá sâu để dùng tiền mua sự hài lòng nhanh chóng',
        btnTone: 'blue',
        tags: [
          { label: 'giảm giá giết biên lợi nhuận', tone: 'red' },
          { label: 'dòng tiền vào', tone: 'neutral' },
        ],
        effects: { trustAll: 6, xp: 50, happiness: 8 },
        reply:
          'Khách đông nghẹt vì giảm giá, nhưng chị Thảo chỉ mặt: "Bán nhiều mà lời mỏng thì sau cùng cũng là mất tiền. Giá rẻ không phải thuốc trị hạnh phúc!"',
      },
      {
        id: 'blame-citizens',
        text: 'Họp kêu gọi bà con tự ý thức giữ gìn, trách nhiệm là của mỗi người',
        btnTone: 'red',
        tags: [
          { label: 'ai cũng thấy bị đổ lỗi', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -12, happiness: -6 },
        reply:
          'Bà con họp nhau đăng status: "Thị trưởng không làm gì mà bảo dân lo!" Ông Lộc lắc đầu: "Chia đôi sự bất lực là giỏi nhất!"',
      },
    ],
  },
  {
    id: 'ev-phat-tien-tri-han',
    title: 'Ngày Đáo Hạn Vay & Phí Trễ Hạn Đã Vào Sổ!',
    subtitle: 'Ba ngày trước bạn vay 500 triệu, hôm nay là ngày phải trả...',
    speaker: 'Kế Toán Phố & Ông Lộc',
    body: 'Khoản vay của bạn hôm nay đến hạn. Nếu bạn có tiền thì trả và xong chuyện, giữ nguyên điểm uy tín. Nếu không đủ, khoản phí trễ hạn 5% sẽ được tính vào chi phí vận hành, điểm tin cậy của bạn bị trừ, và ngân hàng sẽ nhìn bạn bằng con mắt khác. Quyết định thuộc về bạn.',
    minMayorLevel: 1,
    requiresLateFee: true,
    choices: [
      {
        id: 'pay-in-full',
        text: 'Trả đủ cả gốc lẫn lãi hôm nay, không để lại điểm yếu nào cho ai nói',
        btnTone: 'green',
        tags: [
          { label: 'dòng tiền cạn', tone: 'red' },
          { label: 'giữ trọn điểm uy tín', tone: 'green' },
        ],
        effects: { trustAll: 16, xp: 110, happiness: 12 },
        reply:
          'Trả xong ông Lộc nắm tay Thị Trưởng: "Bác cho vay 20 năm, chưa thấy ai trả đúng hạn mà giữ lời như con!" Điểm uy tín của bạn tăng vọt.',
      },
      {
        id: 'roll-over',
        text: 'Thương lượng gia hạn thêm 7 ngày, chấp nhận trả phí trễ hạn nhưng giữ dòng tiền',
        btnTone: 'blue',
        tags: [
          { label: '-5% phí trễ hạn', tone: 'red' },
          { label: 'thêm 7 ngày thở', tone: 'green' },
        ],
        effects: { trustAll: 6, xp: 60, happiness: 6 },
        reply:
          'Ngân hàng ghi thêm 7 ngày trên giấy. Phí trễ hạn thì phải trả thật, nhưng phố còn thở thêm một tuần để bà con tìm cách tăng thu nhập.',
      },
      {
        id: 'ignore-loan',
        text: 'Bỏ qua luôn, tiền này còn để mở thêm ba tiệm mới thì sẽ thu lại nhiều hơn',
        btnTone: 'red',
        tags: [
          { label: 'phí trễ hạn cộng dồn', tone: 'red' },
          { label: 'điểm uy tín suy giảm', tone: 'red' },
        ],
        effects: { trustAll: -18, happiness: -8 },
        reply:
          'Mở thêm ba tiệm, mỗi tiệm lại phát sinh chi phí vận hành. Nợ cũ chưa trả, nợ mới cộng thêm. Chủ nợ chỉ cần chờ - và tiệm mới thì cần tiền thuê mặt bằng trước đã.',
      },
    ],
  },
  {
    id: 'ev-chua-co-bao-hiem-thien-tai',
    title: 'Bão Sắp Đến & Thành Phố Vẫn Chưa Mua Bảo Hiểm!',
    subtitle: 'Nhà báo thời tiết vừa cảnh báo bão mạnh đi qua khu vực trong 48 giờ tới...',
    speaker: 'Chú Bảy Hàng Xóm & Bác Tài',
    body: 'Cơn bão sắp tới, mà thành phố bạn chưa trang bị gói bảo hiểm nào. Nếu không có bảo hiểm, mọi thiệt hại sẽ trừ thẳng vào quỹ vận hành của bạn. Nhớ rằng quán xây, xe cộ, hàng hóa đều là tài sản đang nằm trong sổ cái chứ không phải tiền trong ví.',
    minMayorLevel: 1,
    requiresNoInsurance: true,
    choices: [
      {
        id: 'buy-package',
        text: 'Mua ngay Gói Bảo Hiểm Toàn Diện, chỉ chịu 10% phần khấu trừ thay vì 100%',
        btnTone: 'green',
        tags: [
          { label: 'bỏ tiền mua bảo hiểm', tone: 'red' },
          { label: 'thiệt hại chỉ còn 10%', tone: 'green' },
        ],
        effects: { trustAll: 16, xp: 100, happiness: 12 },
        reply:
          'Bão đi qua, mái tôn bay mất 5 cái, biển hiệu vỡ, đường ngập nát. Công ty bảo hiểm bồi 90%, bạn chỉ mất 10%. Chú Bảy thở dài: "Có bảo hiểm khác gì mua bình nước khi trời nắng!"',
      },
      {
        id: 'reinforce-first',
        text: 'Chi 1.100 XU gia cố mái tôn, chằng dây trước, không mua bảo hiểm',
        costCoins: 1100,
        btnTone: 'blue',
        tags: [
          { label: '-1.100 XU', tone: 'red' },
          { label: 'giảm thiệt hại', tone: 'green' },
          { label: 'vẫn không có bảo hiểm', tone: 'red' },
        ],
        effects: { trustAll: 8, xp: 60, happiness: 6 },
        reply:
          'Bão tới thì thiệt hại chỉ còn một phần nhỏ, nhưng phần đó không ai bồi - bạn vẫn phải tự túi. Gia cố rẻ hơn bảo hiểm, và chỉ dùng được một lần.',
      },
      {
        id: 'do-nothing',
        text: 'Phớt lờ cảnh báo, để thiên tai tự xử lý đi',
        btnTone: 'red',
        tags: [
          { label: 'mất trắng tiền mặt', tone: 'red' },
          { label: 'khép chuyện', tone: 'neutral' },
        ],
        effects: { trustAll: -15, happiness: -10 },
        reply:
          'Sau một đêm, ngân khố trống hơn một nửa. Chủ tiệm ngồi trước mảnh bảng hiệu vỡ nói: "Tôi đã cảnh báo rồi mà!"',
      },
    ],
  },
];