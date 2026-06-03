import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CheckoutRequest {
  id: string; // YC-10024
  customerId: string;
  customerName: string;
  branchName: string;
  roomName: string;
  bedName: string;
  contractId: string;
  expectedDate: string; // YYYY-MM-DD
  reason: string;
  note?: string;
  bankOwner: string;
  bankName: string;
  bankAccount: string;
  depositAmount: number;
  status: 'submitted' | 'inventory_checking' | 'accounting_matching' | 'refunding' | 'completed' | 'rejected';
  statusName: string; // "Đã gửi yêu cầu", "Chờ quản lý kiểm kê", v.v.
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  rejectReason?: string;
}

interface CheckoutState {
  requests: CheckoutRequest[];
  submitRequest: (request: Omit<CheckoutRequest, 'id' | 'status' | 'statusName' | 'createdAt' | 'updatedAt'>) => void;
  cancelRequest: (requestId: string) => void;
  updateRequestStatus: (
    requestId: string,
    status: CheckoutRequest['status'],
    rejectReason?: string
  ) => void;
  resetStore: () => void;
}

const getStatusName = (status: CheckoutRequest['status']): string => {
  switch (status) {
    case 'submitted':
      return 'Đã gửi yêu cầu';
    case 'inventory_checking':
      return 'Chờ quản lý kiểm kê';
    case 'accounting_matching':
      return 'Chờ kế toán đối soát';
    case 'refunding':
      return 'Chờ hoàn cọc';
    case 'completed':
      return 'Hoàn tất';
    case 'rejected':
      return 'Bị từ chối';
    default:
      return 'Không xác định';
  }
};

const generateMockRequests = (): CheckoutRequest[] => {
  const list: CheckoutRequest[] = [];
  const bankNames = ['Vietcombank', 'Techcombank', 'BIDV', 'MBBank', 'ACB'];
  const reasons = [
    'Hết hạn hợp đồng',
    'Thay đổi nơi học tập/làm việc',
    'Lý do cá nhân',
    'Không hài lòng với dịch vụ',
  ];
  
  // Danh sách khách hàng demo khác
  const customers = [
    { id: 'u-101', name: 'Nguyễn Văn Hải', room: 'Phòng 201 (Nam)', bed: 'Giường G1', branch: 'Chi nhánh Thủ Đức (Khu ĐHQG)', contract: 'HD-2025-0012' },
    { id: 'u-102', name: 'Trần Thị Thuỳ', room: 'Phòng 202 (Nữ)', bed: 'Giường B1', branch: 'Chi nhánh Thủ Đức (Khu ĐHQG)', contract: 'HD-2025-0015' },
    { id: 'u-103', name: 'Phạm Thành Long', room: 'Phòng 103 (Nam)', bed: 'Giường A1', branch: 'Chi nhánh Quận 1', contract: 'HD-2025-0018' },
    { id: 'u-104', name: 'Lê Thị Mai', room: 'Phòng 203 (Nữ)', bed: 'Giường C2', branch: 'Chi nhánh Thủ Đức (Khu ĐHQG)', contract: 'HD-2025-0022' },
    { id: 'u-105', name: 'Hoàng Minh Quân', room: 'Phòng 101 (Nam)', bed: 'Giường A2', branch: 'Chi nhánh Quận 1', contract: 'HD-2025-0025' },
  ];

  // Sinh 13 yêu cầu của các khách hàng khác (đã hoàn tất hoặc bị từ chối)
  for (let i = 1; i <= 13; i++) {
    const cust = customers[i % customers.length];
    const isRejected = i % 4 === 0;
    const status: CheckoutRequest['status'] = isRejected ? 'rejected' : 'completed';
    const month = i < 10 ? `0${i}` : `${i}`;
    const dateStr = `2025-${month}-15`;
    const createdAt = `${dateStr}T09:00:00Z`;
    const updatedAt = `${dateStr}T15:30:00Z`;
    const expectedDate = `2025-${month}-20`;

    list.push({
      id: `YC-100${20 + i}`,
      customerId: cust.id,
      customerName: cust.name,
      branchName: cust.branch,
      roomName: cust.room,
      bedName: cust.bed,
      contractId: cust.contract,
      expectedDate,
      reason: reasons[i % reasons.length],
      note: i % 2 === 0 ? 'Phòng sạch sẽ, cảm ơn Homestay nhiều nhé.' : undefined,
      bankOwner: cust.name.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/Đ/g, 'D'),
      bankName: bankNames[i % bankNames.length],
      bankAccount: `03482109848${i}`,
      depositAmount: 1500000 + (i % 3) * 500000,
      status,
      statusName: getStatusName(status),
      createdAt,
      updatedAt,
      rejectReason: isRejected ? 'Chưa dọn dẹp phòng sạch sẽ theo biên bản bàn giao, làm bẩn tường phòng vẽ bậy.' : undefined,
    });
  }

  // Thêm 2 yêu cầu cũ đã hoàn tất của chính u-5 (Lê Lâm Trí Đức)
  // Giả sử u-5 trước đây từng ở chi nhánh Thủ Đức và đã trả phòng thành công năm ngoái.
  list.push({
    id: 'YC-10010',
    customerId: 'u-5',
    customerName: 'Lê Lâm Trí Đức',
    branchName: 'Chi nhánh Thủ Đức (Khu ĐHQG)',
    roomName: 'Phòng 201 (Nam)',
    bedName: 'Giường G2',
    contractId: 'HD-2024-0010',
    expectedDate: '2024-12-31',
    reason: 'Hết hạn hợp đồng',
    note: 'Chuyển sang chi nhánh Quận 1 để gần chỗ làm mới.',
    bankOwner: 'LE LAM TRI DUC',
    bankName: 'Vietcombank',
    bankAccount: '1014820938',
    depositAmount: 1800000,
    status: 'completed',
    statusName: getStatusName('completed'),
    createdAt: '2024-12-15T10:00:00Z',
    updatedAt: '2024-12-30T16:00:00Z',
  });

  list.push({
    id: 'YC-10011',
    customerId: 'u-5',
    customerName: 'Lê Lâm Trí Đức',
    branchName: 'Chi nhánh Thủ Đức (Khu ĐHQG)',
    roomName: 'Phòng 201 (Nam)',
    bedName: 'Giường G2',
    contractId: 'HD-2024-0011',
    expectedDate: '2025-03-31',
    reason: 'Thay đổi nơi học tập/làm việc',
    note: 'Đổi việc.',
    bankOwner: 'LE LAM TRI DUC',
    bankName: 'Techcombank',
    bankAccount: '190348210984',
    depositAmount: 1800000,
    status: 'rejected',
    statusName: getStatusName('rejected'),
    createdAt: '2025-03-10T08:30:00Z',
    updatedAt: '2025-03-12T14:15:00Z',
    rejectReason: 'Hợp đồng chưa đủ thời hạn tối thiểu 6 tháng theo cam kết, không được hoàn cọc.',
  });

  // Đưa các yêu cầu mới nhất lên đầu danh sách
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

const initialRequests = generateMockRequests();

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      requests: initialRequests,
      submitRequest: (reqData) =>
        set((state) => {
          const now = new Date().toISOString();
          const newRequest: CheckoutRequest = {
            id: `YC-${Math.floor(10000 + Math.random() * 90000)}`,
            ...reqData,
            status: 'submitted',
            statusName: getStatusName('submitted'),
            createdAt: now,
            updatedAt: now,
          };
          return {
            requests: [newRequest, ...state.requests],
          };
        }),
      cancelRequest: (requestId) =>
        set((state) => ({
          requests: state.requests.filter((r) => r.id !== requestId),
        })),
      updateRequestStatus: (requestId, status, rejectReason) =>
        set((state) => ({
          requests: state.requests.map((r) => {
            if (r.id === requestId) {
              const now = new Date().toISOString();
              return {
                ...r,
                status,
                statusName: getStatusName(status),
                rejectReason: status === 'rejected' ? rejectReason : undefined,
                updatedAt: now,
              };
            }
            return r;
          }),
        })),
      resetStore: () =>
        set({
          requests: generateMockRequests(),
        }),
    }),
    {
      name: 'checkout-storage',
    }
  )
);
