/**
 * contract-templates.ts
 *
 * Cấu hình các hằng số và bản mẫu điều khoản hợp đồng cho Khách thuê.
 * Tách biệt cấu hình gán cứng ra khỏi mã nguồn nghiệp vụ trong contract.service.ts.
 */

export const CONTRACT_TEMPLATES = {
  // Phí dịch vụ cố định hàng tháng (đơn vị: VNĐ)
  serviceFee: 250000,

  // Link ảnh mặc định phòng nếu không có trong database
  defaultRoomImage: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=500&auto=format&fit=crop',

  // Link ảnh đại diện quản lý mặc định
  defaultManagerImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop',

  // Bản mẫu điều khoản bàn giao tài sản
  getTermsTemplate: (bedName: string, roomName: string, branchName: string) => {
    return `Bên A đồng ý cho bên B thuê 01 vị trí giường (${bedName}) tại phòng ${roomName}, thuộc chi nhánh ${branchName}. Tài sản bàn giao bao gồm: 01 nệm cao su, 01 tủ đồ có khóa, hệ thống đèn chiếu sáng cá nhân.`;
  },

  // Bản mẫu chính sách thanh toán phí thuê
  getPaymentPolicyTemplate: (rentPrice: number) => {
    return `Giá thuê hàng tháng là ${rentPrice.toLocaleString('vi-VN')} VNĐ. Thanh toán từ ngày 01 đến ngày 05 hàng tháng bằng hình thức chuyển khoản. Chậm thanh toán quá 03 ngày chịu phí phạt 5%.`;
  },

  // Bản mẫu chính sách thanh lý hợp đồng
  getTerminationPolicyTemplate: () => {
    return `Bên B cần báo trước 30 ngày nếu có ý định trả phòng trước hạn. Hoàn trả phòng sạch sẽ, bàn giao đầy đủ trang thiết bị như ban đầu để nhận lại tiền đặt cọc.`;
  }
};
