// Tiện ích được lưu bằng mã tiếng Anh (form đăng ký thuê dùng các mã này làm value),
// nhưng toàn bộ UI hướng tới khách hàng và nhân viên đều là tiếng Việt.
// Dùng chung một bảng ánh xạ để không lệch chữ giữa các màn hình.
export const AMENITY_LABELS: Record<string, string> = {
  'AC': 'Máy lạnh',
  'Wifi': 'Wifi mạnh',
  'Private WC': 'WC riêng',
  'Kitchen': 'Bếp chung',
  'Washing Machine': 'Máy giặt',
};

/** Đổi một mã tiện ích sang nhãn tiếng Việt; giữ nguyên nếu là mã lạ. */
export const getAmenityLabel = (code: string): string =>
  AMENITY_LABELS[code.trim()] ?? code;

/**
 * Dịch các mã tiện ích nằm lẫn trong chuỗi ghi chú tự do dạng
 * "Phòng quan tâm: X | AC, Wifi | ghi chú...".
 * Cần cho các phiếu đã lưu trước đây với mã tiếng Anh.
 */
export const translateAmenityTokens = (note: string): string =>
  note
    .split(' | ')
    .map(segment =>
      segment
        .split(', ')
        .map(token => getAmenityLabel(token))
        .join(', ')
    )
    .join(' | ');
