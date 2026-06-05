import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, Printer, Download, CreditCard,
  Building2, Phone, ShieldCheck, AlertCircle,
  FileSignature, CheckCircle2, Activity
} from 'lucide-react';

interface ContractData {
  id: string;
  contractCode: string;
  signDate: string;
  startDate: string;
  endDate: string;
  duration: string;
  status: 'active' | 'expired' | 'terminated';
  statusLabel: string;
  // Room
  branch: string;
  building: string;
  roomCode: string;
  bedCode: string;
  roomType: string;
  roomImage: string;
  // Finance
  rentPrice: number;
  depositAmount: number;
  serviceFee: number;
  // Terms
  terms: string;
  paymentPolicy: string;
  terminationPolicy: string;
  // Timeline
  monthsPassed: number;
  totalMonths: number;
  remainingDays: number;
  managerName: string;
  managerPhone: string;
  managerImage: string;
}

const MOCK_CONTRACTS: ContractData[] = [
  {
    id: 'c1',
    contractCode: 'HD-2023-089',
    signDate: '01/10/2023',
    startDate: '05/10/2023',
    endDate: '05/10/2024',
    duration: '12 tháng',
    status: 'active',
    statusLabel: 'Đang hiệu lực',
    branch: 'Quận 1 - Eco Park',
    building: 'Tòa A',
    roomCode: 'A203',
    bedCode: 'G-02',
    roomType: 'Dorm 4 giường',
    roomImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLVXY_FnotGU7TRXMadBUOcaZ-W7bEGFRGjsLApApN2TIqoA_yOy6Y4FMjU4k9srb-KkqffbG8B4KIXOz7srtw3AAYTW3JOS8wVS-GBTMmdx98h9pxAJLeuf-AYCaDV9mJ-Dy3s_zoC1UILMEqT784QS42LrFZ2jcc5LZKeKb_qpQypix6X0SW5g_vxn8cKH9nVcKiu7RXYedxF4gsWzcy8AYZ1ToJowKD9zoh8d-Fnr40rC7IAicdN5mc_zyhjpwzpMlrbRe9vA',
    rentPrice: 4500000,
    depositAmount: 4500000,
    serviceFee: 250000,
    terms: 'Bên A đồng ý cho bên B thuê 01 vị trí giường (G-02) tại phòng A203, thuộc chi nhánh HomeStay Dorm Quận 1 - Eco Park. Tài sản bàn giao bao gồm: 01 nệm cao su, 01 tủ đồ có khóa, hệ thống đèn chiếu sáng cá nhân.',
    paymentPolicy: 'Giá thuê hàng tháng là 4.500.000 VNĐ. Thanh toán từ ngày 01 đến ngày 05 hàng tháng bằng hình thức chuyển khoản hoặc ví điện tử qua ứng dụng. Chậm thanh toán quá 03 ngày chịu phí phạt 5%.',
    terminationPolicy: 'Bên B cần báo trước 30 ngày nếu có ý định trả phòng trước hạn. Hoàn trả phòng sạch sẽ, bàn giao đầy đủ trang thiết bị như ban đầu để nhận lại tiền đặt cọc cọc.',
    monthsPassed: 8,
    totalMonths: 12,
    remainingDays: 124,
    managerName: 'Mr. Hoàng Long',
    managerPhone: '0901234567',
    managerImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAE5ziBZKnLACn0xlPYlC2lhPrFGdbW7Qm9gRN8PSfa0_cCchPKG-GHDo-Ouund7Uc2WOferSpzdbZQrh5KeYFu-oh2srdaDB-YeRwjYvFXM3HTKgJjaaF6XATv_bcjwAE6zgshchZ3-tBWnM18F1cEoxeYdCL7VhCc-BG8_VldY8CvNbOaEZ5mkvvbuLzuMGus_tvlkqJO37yZ33f-PlaYAxe3-HX0Jw2v80zXkmKk57E-7DBCl-7Y-CHjuV-VhNgkbQoVsb1wXQ'
  },
  {
    id: 'c2',
    contractCode: 'HD-2022-114',
    signDate: '15/09/2022',
    startDate: '20/09/2022',
    endDate: '20/09/2023',
    duration: '12 tháng',
    status: 'expired',
    statusLabel: 'Đã hết hạn',
    branch: 'Bình Thạnh - View Sông',
    building: 'Block B',
    roomCode: 'B305',
    bedCode: 'G-01',
    roomType: 'Dorm 6 giường',
    roomImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLVXY_FnotGU7TRXMadBUOcaZ-W7bEGFRGjsLApApN2TIqoA_yOy6Y4FMjU4k9srb-KkqffbG8B4KIXOz7srtw3AAYTW3JOS8wVS-GBTMmdx98h9pxAJLeuf-AYCaDV9mJ-Dy3s_zoC1UILMEqT784QS42LrFZ2jcc5LZKeKb_qpQypix6X0SW5g_vxn8cKH9nVcKiu7RXYedxF4gsWzcy8AYZ1ToJowKD9zoh8d-Fnr40rC7IAicdN5mc_zyhjpwzpMlrbRe9vA',
    rentPrice: 3800000,
    depositAmount: 3800000,
    serviceFee: 200000,
    terms: 'Bên A đồng ý cho bên B thuê 01 vị trí giường (G-01) tại phòng B305, thuộc chi nhánh HomeStay Dorm Bình Thạnh. Tài sản bàn giao bao gồm: 01 nệm cao su, 01 tủ đồ có khóa cá nhân.',
    paymentPolicy: 'Giá thuê hàng tháng là 3.800.000 VNĐ. Thanh toán từ ngày 01 đến ngày 05 hàng tháng qua ví điện tử.',
    terminationPolicy: 'Kết thúc hợp đồng đúng hạn, hoàn trả trang thiết bị nguyên vẹn để nhận lại 100% tiền cọc.',
    monthsPassed: 12,
    totalMonths: 12,
    remainingDays: 0,
    managerName: 'Ms. Mai Vy',
    managerPhone: '0907654321',
    managerImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAE5ziBZKnLACn0xlPYlC2lhPrFGdbW7Qm9gRN8PSfa0_cCchPKG-GHDo-Ouund7Uc2WOferSpzdbZQrh5KeYFu-oh2srdaDB-YeRwjYvFXM3HTKgJjaaF6XATv_bcjwAE6zgshchZ3-tBWnM18F1cEoxeYdCL7VhCc-BG8_VldY8CvNbOaEZ5mkvvbuLzuMGus_tvlkqJO37yZ33f-PlaYAxe3-HX0Jw2v80zXkmKk57E-7DBCl-7Y-CHjuV-VhNgkbQoVsb1wXQ'
  },
  {
    id: 'c3',
    contractCode: 'HD-2022-004',
    signDate: '10/01/2022',
    startDate: '15/01/2022',
    endDate: '15/07/2022',
    duration: '6 tháng',
    status: 'expired',
    statusLabel: 'Đã hết hạn',
    branch: 'Quận 1 - Eco Park',
    building: 'Tòa A',
    roomCode: 'A102',
    bedCode: 'G-04',
    roomType: 'Dorm 4 giường',
    roomImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLVXY_FnotGU7TRXMadBUOcaZ-W7bEGFRGjsLApApN2TIqoA_yOy6Y4FMjU4k9srb-KkqffbG8B4KIXOz7srtw3AAYTW3JOS8wVS-GBTMmdx98h9pxAJLeuf-AYCaDV9mJ-Dy3s_zoC1UILMEqT784QS42LrFZ2jcc5LZKeKb_qpQypix6X0SW5g_vxn8cKH9nVcKiu7RXYedxF4gsWzcy8AYZ1ToJowKD9zoh8d-Fnr40rC7IAicdN5mc_zyhjpwzpMlrbRe9vA',
    rentPrice: 4200000,
    depositAmount: 4200000,
    serviceFee: 250000,
    terms: 'Cho thuê vị trí giường G-04 tại phòng A102. Bàn giao đầy đủ nệm, gối, tủ cá nhân.',
    paymentPolicy: 'Giá thuê hàng tháng là 4.200.000 VNĐ. Thanh toán chuyển khoản ngân hàng.',
    terminationPolicy: 'Thanh lý hợp đồng đúng hạn, hoàn tất kiểm tra phòng trả cọc.',
    monthsPassed: 6,
    totalMonths: 6,
    remainingDays: 0,
    managerName: 'Mr. Hoàng Long',
    managerPhone: '0901234567',
    managerImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAE5ziBZKnLACn0xlPYlC2lhPrFGdbW7Qm9gRN8PSfa0_cCchPKG-GHDo-Ouund7Uc2WOferSpzdbZQrh5KeYFu-oh2srdaDB-YeRwjYvFXM3HTKgJjaaF6XATv_bcjwAE6zgshchZ3-tBWnM18F1cEoxeYdCL7VhCc-BG8_VldY8CvNbOaEZ5mkvvbuLzuMGus_tvlkqJO37yZ33f-PlaYAxe3-HX0Jw2v80zXkmKk57E-7DBCl-7Y-CHjuV-VhNgkbQoVsb1wXQ'
  },
  {
    id: 'c4',
    contractCode: 'HD-2021-456',
    signDate: '01/06/2021',
    startDate: '05/06/2021',
    endDate: '05/06/2022',
    duration: '12 tháng',
    status: 'expired',
    statusLabel: 'Đã hết hạn',
    branch: 'Thủ Đức - Đại học',
    building: 'Khu C',
    roomCode: 'C104',
    bedCode: 'G-02',
    roomType: 'Dorm 8 giường',
    roomImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLVXY_FnotGU7TRXMadBUOcaZ-W7bEGFRGjsLApApN2TIqoA_yOy6Y4FMjU4k9srb-KkqffbG8B4KIXOz7srtw3AAYTW3JOS8wVS-GBTMmdx98h9pxAJLeuf-AYCaDV9mJ-Dy3s_zoC1UILMEqT784QS42LrFZ2jcc5LZKeKb_qpQypix6X0SW5g_vxn8cKH9nVcKiu7RXYedxF4gsWzcy8AYZ1ToJowKD9zoh8d-Fnr40rC7IAicdN5mc_zyhjpwzpMlrbRe9vA',
    rentPrice: 3200000,
    depositAmount: 3200000,
    serviceFee: 180000,
    terms: 'Hợp đồng thuê vị trí giường G-02 phòng C104 chi nhánh Thủ Đức.',
    paymentPolicy: 'Giá thuê hàng tháng là 3.200.000 VNĐ. Thanh toán trực tiếp tại quầy hoặc ứng dụng.',
    terminationPolicy: 'Trả cọc sau khi bàn giao phòng và trừ chi phí phát sinh nếu có.',
    monthsPassed: 12,
    totalMonths: 12,
    remainingDays: 0,
    managerName: 'Mr. Quốc Khánh',
    managerPhone: '0908889999',
    managerImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAE5ziBZKnLACn0xlPYlC2lhPrFGdbW7Qm9gRN8PSfa0_cCchPKG-GHDo-Ouund7Uc2WOferSpzdbZQrh5KeYFu-oh2srdaDB-YeRwjYvFXM3HTKgJjaaF6XATv_bcjwAE6zgshchZ3-tBWnM18F1cEoxeYdCL7VhCc-BG8_VldY8CvNbOaEZ5mkvvbuLzuMGus_tvlkqJO37yZ33f-PlaYAxe3-HX0Jw2v80zXkmKk57E-7DBCl-7Y-CHjuV-VhNgkbQoVsb1wXQ'
  },
  {
    id: 'c5',
    contractCode: 'HD-2021-088',
    signDate: '10/01/2021',
    startDate: '12/01/2021',
    endDate: '12/07/2021',
    duration: '6 tháng',
    status: 'expired',
    statusLabel: 'Đã hết hạn',
    branch: 'Quận 10 - Sư Vạn Hạnh',
    building: 'Nhà 2',
    roomCode: 'P202',
    bedCode: 'G-03',
    roomType: 'Dorm 6 giường',
    roomImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLVXY_FnotGU7TRXMadBUOcaZ-W7bEGFRGjsLApApN2TIqoA_yOy6Y4FMjU4k9srb-KkqffbG8B4KIXOz7srtw3AAYTW3JOS8wVS-GBTMmdx98h9pxAJLeuf-AYCaDV9mJ-Dy3s_zoC1UILMEqT784QS42LrFZ2jcc5LZKeKb_qpQypix6X0SW5g_vxn8cKH9nVcKiu7RXYedxF4gsWzcy8AYZ1ToJowKD9zoh8d-Fnr40rC7IAicdN5mc_zyhjpwzpMlrbRe9vA',
    rentPrice: 3900000,
    depositAmount: 3900000,
    serviceFee: 220000,
    terms: 'Hợp đồng thuê vị trí giường G-03 phòng P202 chi nhánh Quận 10.',
    paymentPolicy: 'Giá thuê hàng tháng là 3.900.000 VNĐ. Thanh toán trực tuyến chuyển khoản.',
    terminationPolicy: 'Trả cọc sau khi kiểm tra hiện trạng tài sản.',
    monthsPassed: 6,
    totalMonths: 6,
    remainingDays: 0,
    managerName: 'Ms. Quỳnh Trâm',
    managerPhone: '0903334444',
    managerImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAE5ziBZKnLACn0xlPYlC2lhPrFGdbW7Qm9gRN8PSfa0_cCchPKG-GHDo-Ouund7Uc2WOferSpzdbZQrh5KeYFu-oh2srdaDB-YeRwjYvFXM3HTKgJjaaF6XATv_bcjwAE6zgshchZ3-tBWnM18F1cEoxeYdCL7VhCc-BG8_VldY8CvNbOaEZ5mkvvbuLzuMGus_tvlkqJO37yZ33f-PlaYAxe3-HX0Jw2v80zXkmKk57E-7DBCl-7Y-CHjuV-VhNgkbQoVsb1wXQ'
  },
  {
    id: 'c6',
    contractCode: 'HD-2020-312',
    signDate: '01/09/2020',
    startDate: '05/09/2020',
    endDate: '05/09/2021',
    duration: '12 tháng',
    status: 'expired',
    statusLabel: 'Đã hết hạn',
    branch: 'Bình Thạnh - View Sông',
    building: 'Block B',
    roomCode: 'B202',
    bedCode: 'G-04',
    roomType: 'Dorm 6 giường',
    roomImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLVXY_FnotGU7TRXMadBUOcaZ-W7bEGFRGjsLApApN2TIqoA_yOy6Y4FMjU4k9srb-KkqffbG8B4KIXOz7srtw3AAYTW3JOS8wVS-GBTMmdx98h9pxAJLeuf-AYCaDV9mJ-Dy3s_zoC1UILMEqT784QS42LrFZ2jcc5LZKeKb_qpQypix6X0SW5g_vxn8cKH9nVcKiu7RXYedxF4gsWzcy8AYZ1ToJowKD9zoh8d-Fnr40rC7IAicdN5mc_zyhjpwzpMlrbRe9vA',
    rentPrice: 3800000,
    depositAmount: 3800000,
    serviceFee: 200000,
    terms: 'Hợp đồng thuê giường G-04 phòng B202 chi nhánh Bình Thạnh.',
    paymentPolicy: 'Thanh toán từ ngày 01 đến ngày 05 qua ví điện tử.',
    terminationPolicy: 'Thanh lý đúng thời hạn, hoàn cọc 100%.',
    monthsPassed: 12,
    totalMonths: 12,
    remainingDays: 0,
    managerName: 'Ms. Mai Vy',
    managerPhone: '0907654321',
    managerImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAE5ziBZKnLACn0xlPYlC2lhPrFGdbW7Qm9gRN8PSfa0_cCchPKG-GHDo-Ouund7Uc2WOferSpzdbZQrh5KeYFu-oh2srdaDB-YeRwjYvFXM3HTKgJjaaF6XATv_bcjwAE6zgshchZ3-tBWnM18F1cEoxeYdCL7VhCc-BG8_VldY8CvNbOaEZ5mkvvbuLzuMGus_tvlkqJO37yZ33f-PlaYAxe3-HX0Jw2v80zXkmKk57E-7DBCl-7Y-CHjuV-VhNgkbQoVsb1wXQ'
  },
  {
    id: 'c7',
    contractCode: 'HD-2020-055',
    signDate: '15/02/2020',
    startDate: '18/02/2020',
    endDate: '18/08/2020',
    duration: '6 tháng',
    status: 'expired',
    statusLabel: 'Đã hết hạn',
    branch: 'Quận 1 - Eco Park',
    building: 'Tòa A',
    roomCode: 'A102',
    bedCode: 'G-02',
    roomType: 'Dorm 4 giường',
    roomImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLVXY_FnotGU7TRXMadBUOcaZ-W7bEGFRGjsLApApN2TIqoA_yOy6Y4FMjU4k9srb-KkqffbG8B4KIXOz7srtw3AAYTW3JOS8wVS-GBTMmdx98h9pxAJLeuf-AYCaDV9mJ-Dy3s_zoC1UILMEqT784QS42LrFZ2jcc5LZKeKb_qpQypix6X0SW5g_vxn8cKH9nVcKiu7RXYedxF4gsWzcy8AYZ1ToJowKD9zoh8d-Fnr40rC7IAicdN5mc_zyhjpwzpMlrbRe9vA',
    rentPrice: 4200000,
    depositAmount: 4200000,
    serviceFee: 250000,
    terms: 'Hợp đồng thuê giường G-02 tại A102 chi nhánh Quận 1.',
    paymentPolicy: 'Thanh toán chuyển khoản từ 01-05 hàng tháng.',
    terminationPolicy: 'Đã thanh lý đúng hạn, hoàn tất thủ tục.',
    monthsPassed: 6,
    totalMonths: 6,
    remainingDays: 0,
    managerName: 'Mr. Hoàng Long',
    managerPhone: '0901234567',
    managerImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAE5ziBZKnLACn0xlPYlC2lhPrFGdbW7Qm9gRN8PSfa0_cCchPKG-GHDo-Ouund7Uc2WOferSpzdbZQrh5KeYFu-oh2srdaDB-YeRwjYvFXM3HTKgJjaaF6XATv_bcjwAE6zgshchZ3-tBWnM18F1cEoxeYdCL7VhCc-BG8_VldY8CvNbOaEZ5mkvvbuLzuMGus_tvlkqJO37yZ33f-PlaYAxe3-HX0Jw2v80zXkmKk57E-7DBCl-7Y-CHjuV-VhNgkbQoVsb1wXQ'
  },
  {
    id: 'c8',
    contractCode: 'HD-2019-109',
    signDate: '01/10/2019',
    startDate: '05/10/2019',
    endDate: '05/10/2020',
    duration: '12 tháng',
    status: 'expired',
    statusLabel: 'Đã hết hạn',
    branch: 'Quận 1 - Eco Park',
    building: 'Tòa A',
    roomCode: 'A301',
    bedCode: 'G-01',
    roomType: 'Dorm 4 giường',
    roomImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLVXY_FnotGU7TRXMadBUOcaZ-W7bEGFRGjsLApApN2TIqoA_yOy6Y4FMjU4k9srb-KkqffbG8B4KIXOz7srtw3AAYTW3JOS8wVS-GBTMmdx98h9pxAJLeuf-AYCaDV9mJ-Dy3s_zoC1UILMEqT784QS42LrFZ2jcc5LZKeKb_qpQypix6X0SW5g_vxn8cKH9nVcKiu7RXYedxF4gsWzcy8AYZ1ToJowKD9zoh8d-Fnr40rC7IAicdN5mc_zyhjpwzpMlrbRe9vA',
    rentPrice: 4400000,
    depositAmount: 4400000,
    serviceFee: 250000,
    terms: 'Thuê giường G-01 phòng A301.',
    paymentPolicy: 'Thanh toán trực tiếp hoặc qua tài khoản ngân hàng.',
    terminationPolicy: 'Đã hết hạn, hoàn tất bàn giao.',
    monthsPassed: 12,
    totalMonths: 12,
    remainingDays: 0,
    managerName: 'Mr. Hoàng Long',
    managerPhone: '0901234567',
    managerImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAE5ziBZKnLACn0xlPYlC2lhPrFGdbW7Qm9gRN8PSfa0_cCchPKG-GHDo-Ouund7Uc2WOferSpzdbZQrh5KeYFu-oh2srdaDB-YeRwjYvFXM3HTKgJjaaF6XATv_bcjwAE6zgshchZ3-tBWnM18F1cEoxeYdCL7VhCc-BG8_VldY8CvNbOaEZ5mkvvbuLzuMGus_tvlkqJO37yZ33f-PlaYAxe3-HX0Jw2v80zXkmKk57E-7DBCl-7Y-CHjuV-VhNgkbQoVsb1wXQ'
  },
  {
    id: 'c9',
    contractCode: 'HD-2019-012',
    signDate: '10/01/2019',
    startDate: '12/01/2019',
    endDate: '12/07/2019',
    duration: '6 tháng',
    status: 'terminated',
    statusLabel: 'Đã thanh lý',
    branch: 'Bình Thạnh - View Sông',
    building: 'Block B',
    roomCode: 'B105',
    bedCode: 'G-06',
    roomType: 'Dorm 6 giường',
    roomImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLVXY_FnotGU7TRXMadBUOcaZ-W7bEGFRGjsLApApN2TIqoA_yOy6Y4FMjU4k9srb-KkqffbG8B4KIXOz7srtw3AAYTW3JOS8wVS-GBTMmdx98h9pxAJLeuf-AYCaDV9mJ-Dy3s_zoC1UILMEqT784QS42LrFZ2jcc5LZKeKb_qpQypix6X0SW5g_vxn8cKH9nVcKiu7RXYedxF4gsWzcy8AYZ1ToJowKD9zoh8d-Fnr40rC7IAicdN5mc_zyhjpwzpMlrbRe9vA',
    rentPrice: 3700000,
    depositAmount: 3700000,
    serviceFee: 200000,
    terms: 'Hợp đồng thuê giường G-06 phòng B105.',
    paymentPolicy: 'Thanh toán trực tiếp.',
    terminationPolicy: 'Thanh lý trước thời hạn do khách hàng chuyển nơi công tác. Đã giải quyết trả cọc 50% theo điều khoản phạt.',
    monthsPassed: 4,
    totalMonths: 6,
    remainingDays: 0,
    managerName: 'Ms. Mai Vy',
    managerPhone: '0907654321',
    managerImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAE5ziBZKnLACn0xlPYlC2lhPrFGdbW7Qm9gRN8PSfa0_cCchPKG-GHDo-Ouund7Uc2WOferSpzdbZQrh5KeYFu-oh2srdaDB-YeRwjYvFXM3HTKgJjaaF6XATv_bcjwAE6zgshchZ3-tBWnM18F1cEoxeYdCL7VhCc-BG8_VldY8CvNbOaEZ5mkvvbuLzuMGus_tvlkqJO37yZ33f-PlaYAxe3-HX0Jw2v80zXkmKk57E-7DBCl-7Y-CHjuV-VhNgkbQoVsb1wXQ'
  },
  {
    id: 'c10',
    contractCode: 'HD-2018-095',
    signDate: '20/08/2018',
    startDate: '25/08/2018',
    endDate: '25/08/2019',
    duration: '12 tháng',
    status: 'expired',
    statusLabel: 'Đã hết hạn',
    branch: 'Quận 10 - Sư Vạn Hạnh',
    building: 'Nhà 2',
    roomCode: 'P304',
    bedCode: 'G-01',
    roomType: 'Dorm 6 giường',
    roomImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLVXY_FnotGU7TRXMadBUOcaZ-W7bEGFRGjsLApApN2TIqoA_yOy6Y4FMjU4k9srb-KkqffbG8B4KIXOz7srtw3AAYTW3JOS8wVS-GBTMmdx98h9pxAJLeuf-AYCaDV9mJ-Dy3s_zoC1UILMEqT784QS42LrFZ2jcc5LZKeKb_qpQypix6X0SW5g_vxn8cKH9nVcKiu7RXYedxF4gsWzcy8AYZ1ToJowKD9zoh8d-Fnr40rC7IAicdN5mc_zyhjpwzpMlrbRe9vA',
    rentPrice: 3900000,
    depositAmount: 3900000,
    serviceFee: 220000,
    terms: 'Hợp đồng thuê giường G-01 phòng P304.',
    paymentPolicy: 'Thanh toán trực tuyến.',
    terminationPolicy: 'Hết hạn hợp đồng, hoàn trả tài sản đầy đủ.',
    monthsPassed: 12,
    totalMonths: 12,
    remainingDays: 0,
    managerName: 'Ms. Quỳnh Trâm',
    managerPhone: '0903334444',
    managerImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAE5ziBZKnLACn0xlPYlC2lhPrFGdbW7Qm9gRN8PSfa0_cCchPKG-GHDo-Ouund7Uc2WOferSpzdbZQrh5KeYFu-oh2srdaDB-YeRwjYvFXM3HTKgJjaaF6XATv_bcjwAE6zgshchZ3-tBWnM18F1cEoxeYdCL7VhCc-BG8_VldY8CvNbOaEZ5mkvvbuLzuMGus_tvlkqJO37yZ33f-PlaYAxe3-HX0Jw2v80zXkmKk57E-7DBCl-7Y-CHjuV-VhNgkbQoVsb1wXQ'
  }
];

export default function CustomerContractsPage() {
  const navigate = useNavigate();
  const [selectedContractId, setSelectedContractId] = useState<string>('c1');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const contract = MOCK_CONTRACTS.find((c) => c.id === selectedContractId) || MOCK_CONTRACTS[0];

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getStatusBadge = (status: 'active' | 'expired' | 'terminated') => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            Đang hiệu lực
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f3f4f6] text-[#4b5563] text-xs font-bold border border-[#e5e7eb]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af]"></span>
            Đã hết hạn
          </span>
        );
      case 'terminated':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            Đã thanh lý
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-fade-in-up">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 bg-[#334537] text-white border border-[#4a5d4e] px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 animate-slide-in-right">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Styles for animation */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Page Header & Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#d1c4b9] pb-6">
        <div>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3.5 py-2 text-sm font-semibold text-primary/80 transition-all hover:border-primary/25 hover:bg-primary/10 hover:text-primary active:scale-[0.98] cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại hồ sơ cá nhân
          </button>
          <h1 className="font-headline-lg text-2xl font-bold text-primary flex items-center gap-2">
            <FileText className="w-7 h-7 text-primary" />
            Hợp đồng thuê phòng
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Xem chi tiết các điều khoản, thông tin phòng và tình trạng hợp đồng thuê của bạn.
          </p>
        </div>

        {/* Contract Dropdown Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-on-surface-variant uppercase">Chọn hợp đồng:</span>
          <select
            value={selectedContractId}
            onChange={(e) => setSelectedContractId(e.target.value)}
            className="px-4 py-2 rounded-xl border border-outline-variant bg-[#ffffff] text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition cursor-pointer"
          >
            {MOCK_CONTRACTS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.contractCode} ({c.statusLabel} - {c.branch})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Overview Card */}
      <section className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0 border border-primary/20">
            <FileSignature className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-on-surface-variant font-bold">Mã hợp đồng:</span>
              <span className="text-base font-extrabold text-primary font-mono">{contract.contractCode}</span>
            </div>
            <div className="mt-1">
              {getStatusBadge(contract.status)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:flex gap-6 md:gap-8 border-t md:border-t-0 pt-4 md:pt-0 border-[#eee7e1]">
          <div className="flex flex-col">
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Ngày ký</span>
            <span className="text-sm font-bold text-on-surface mt-0.5">{contract.signDate}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Ngày hiệu lực</span>
            <span className="text-sm font-bold text-on-surface mt-0.5">
              {contract.startDate} - {contract.endDate}
            </span>
          </div>
          <div className="flex flex-col col-span-2 md:col-span-1">
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Thời hạn</span>
            <span className="text-sm font-bold text-on-surface mt-0.5">{contract.duration}</span>
          </div>
        </div>
      </section>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (Main details) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Room Info */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-sm space-y-4 hover:shadow-md transition">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2 border-b border-[#eee7e1] pb-2">
              <Building2 className="w-5 h-5 text-primary" />
              Thông tin phòng thuê
            </h3>
            
            <div className="flex flex-col md:flex-row gap-6">
              <img
                src={contract.roomImage}
                alt={contract.roomCode}
                className="w-full md:w-52 h-36 object-cover rounded-2xl bg-surface-variant border border-outline-variant/50 shadow-sm"
              />
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 flex-grow">
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase font-semibold">Tên phòng / Mã phòng</p>
                  <p className="text-sm font-bold text-on-surface mt-0.5">{contract.roomCode}</p>
                </div>
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase font-semibold">Chi nhánh</p>
                  <p className="text-sm font-bold text-on-surface mt-0.5">{contract.branch}</p>
                </div>
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase font-semibold">Tòa nhà</p>
                  <p className="text-sm font-bold text-on-surface mt-0.5">{contract.building}</p>
                </div>
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase font-semibold">Vị trí giường</p>
                  <span className="inline-flex items-center px-2 py-0.5 bg-primary/10 text-primary text-xs font-extrabold rounded-md mt-0.5 border border-primary/20">
                    {contract.bedCode}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-on-surface-variant uppercase font-semibold">Loại phòng</p>
                  <p className="text-sm font-bold text-on-surface mt-0.5">{contract.roomType}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Info */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-sm space-y-4 hover:shadow-md transition">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2 border-b border-[#eee7e1] pb-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Thông tin tài chính
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-surface rounded-2xl border border-outline-variant/30 hover:border-primary/30 transition">
                <p className="text-[10px] text-on-surface-variant uppercase font-semibold">Giá thuê hàng tháng</p>
                <p className="text-base font-extrabold text-primary mt-1">
                  {contract.rentPrice.toLocaleString('vi-VN')} VNĐ
                </p>
              </div>
              <div className="p-4 bg-surface rounded-2xl border border-outline-variant/30 hover:border-primary/30 transition">
                <p className="text-[10px] text-on-surface-variant uppercase font-semibold">Tiền đặt cọc cọc</p>
                <p className="text-base font-extrabold text-[#735a3a] mt-1">
                  {contract.depositAmount.toLocaleString('vi-VN')} VNĐ
                </p>
              </div>
              <div className="p-4 bg-surface rounded-2xl border border-outline-variant/30 hover:border-primary/30 transition">
                <p className="text-[10px] text-on-surface-variant uppercase font-semibold">Phí dịch vụ cố định</p>
                <p className="text-base font-extrabold text-on-surface-variant mt-1">
                  {contract.serviceFee.toLocaleString('vi-VN')} VNĐ
                </p>
              </div>
            </div>
          </div>

          {/* Contract Legal Text */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-sm space-y-4 hover:shadow-md transition">
            <div className="flex justify-between items-center border-b border-[#eee7e1] pb-2 flex-wrap gap-2">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Điều khoản hợp đồng thuê
              </h3>
              <span className="text-[10px] text-on-surface-variant italic font-semibold">Văn bản pháp lý có hiệu lực</span>
            </div>
            
            <div className="bg-surface border border-outline-variant/60 rounded-2xl p-5 h-[350px] overflow-y-auto custom-scrollbar font-body-md text-on-surface leading-relaxed text-sm space-y-4">
              <div className="max-w-prose mx-auto">
                <h4 className="font-extrabold text-center text-on-surface tracking-wide">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h4>
                <p className="text-center font-bold text-xs text-on-surface-variant mt-0.5">Độc lập - Tự do - Hạnh phúc</p>
                
                <div className="h-px bg-outline-variant/50 my-5"></div>
                
                <h5 className="font-bold text-primary uppercase mt-4 flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-primary rounded-full"></span>
                  ĐIỀU 1: ĐỐI TƯỢNG HỢP ĐỒNG
                </h5>
                <p className="text-on-surface/90 pl-3 mt-1.5 text-xs">
                  {contract.terms}
                </p>
                
                <h5 className="font-bold text-primary uppercase mt-5 flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-primary rounded-full"></span>
                  ĐIỀU 2: GIÁ THUÊ VÀ THANH TOÁN
                </h5>
                <p className="text-on-surface/90 pl-3 mt-1.5 text-xs">
                  {contract.paymentPolicy}
                </p>
                
                <h5 className="font-bold text-primary uppercase mt-5 flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-primary rounded-full"></span>
                  ĐIỀU 3: TRÁCH NHIỆM BẢO QUẢN TÀI SẢN
                </h5>
                <p className="text-on-surface/90 pl-3 mt-1.5 text-xs">
                  Bên B có trách nhiệm bảo quản và giữ gìn các tài sản, trang thiết bị đi kèm giường thuê. Mọi hư hỏng do lỗi chủ quan phải bồi thường theo thời giá thị trường. Không tự ý đóng đinh, đục khoét tường hoặc thay đổi vị trí giường/tủ cá nhân.
                </p>
                
                <h5 className="font-bold text-primary uppercase mt-5 flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-primary rounded-full"></span>
                  ĐIỀU 4: NỘI QUY CHUNG & CHẤM DỨT HỢP ĐỒNG
                </h5>
                <p className="text-on-surface/90 pl-3 mt-1.5 text-xs">
                  {contract.terminationPolicy} Tuân thủ nghiêm ngặt giờ giấc sinh hoạt tập thể, nội quy phòng chống cháy nổ và bảo đảm vệ sinh chung.
                </p>
                
                <p className="mt-8 italic text-on-surface-variant text-[11px] text-center">--- Văn bản lưu trữ nội bộ HomeStay Dorm ---</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (Sidebar widgets) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Progress Timeline Widget */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-sm hover:shadow-md transition space-y-4">
            <h3 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1.5 border-b border-[#eee7e1] pb-2">
              <Activity className="w-4.5 h-4.5" />
              Tiến độ hợp đồng
            </h3>

            {contract.status === 'active' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-2xl font-extrabold text-primary">
                      {contract.monthsPassed}/{contract.totalMonths}
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-medium">tháng đã trôi qua</span>
                  </div>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    {Math.round((contract.monthsPassed / contract.totalMonths) * 100)}%
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-[#ecefea] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${(contract.monthsPassed / contract.totalMonths) * 100}%` }}
                  ></div>
                </div>

                <div className="pt-3 border-t border-[#eee7e1] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Số ngày còn lại:</span>
                    <strong className="text-primary">{contract.remainingDays} ngày</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Ngày hết hạn:</span>
                    <span className="font-semibold text-on-surface">{contract.endDate}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-on-surface-variant space-y-2">
                <AlertCircle className="w-10 h-10 text-on-surface-variant/40 mx-auto" />
                <p className="font-bold text-sm text-on-surface">Hợp đồng không còn hoạt động</p>
                <p className="text-xs">Hợp đồng này đã hết hạn hiệu lực hoặc đã được thực hiện thanh lý xong.</p>
              </div>
            )}
          </div>

          {/* Action Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-sm hover:shadow-md transition space-y-3">
            <h3 className="text-xs font-bold text-primary uppercase tracking-widest border-b border-[#eee7e1] pb-2">
              Hành động nhanh
            </h3>
            
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => triggerToast(`Đang khởi tạo tải xuống PDF cho hợp đồng ${contract.contractCode}...`)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-primary text-primary font-bold text-xs rounded-xl hover:bg-primary/5 transition active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Tải xuống PDF Hợp đồng
              </button>
              <button
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white font-bold text-xs rounded-xl hover:bg-[#334537] transition active:scale-95 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                In bản hợp đồng
              </button>
            </div>
          </div>

          {/* Support Manager Card */}
          <div className="bg-primary text-[#ffffff] border border-primary rounded-3xl p-6 shadow-sm hover:shadow-lg transition space-y-4 relative overflow-hidden">
            {/* Decorative white blur */}
            <div className="absolute -right-12 -bottom-12 w-28 h-28 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="space-y-1">
              <h3 className="text-base font-extrabold leading-tight">Hỗ trợ hợp đồng</h3>
              <p className="text-xs opacity-90 leading-relaxed">
                Nếu bạn có bất kỳ thắc mắc nào về các điều khoản hoặc cần thực hiện gia hạn hợp đồng thuê phòng, vui lòng liên hệ trực tiếp:
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white/10 rounded-2xl p-3 border border-white/10">
              <img
                src={contract.managerImage}
                alt={contract.managerName}
                className="w-11 h-11 rounded-full border border-white/20 object-cover bg-white/20 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">{contract.managerName}</p>
                <p className="text-[10px] opacity-80 truncate">{contract.branch}</p>
              </div>
            </div>

            <a
              href={`tel:${contract.managerPhone}`}
              className="flex items-center justify-center gap-2 w-full py-3 bg-surface-container-lowest text-primary text-xs font-bold rounded-xl hover:bg-[#ffffff] transition active:scale-95"
            >
              <Phone className="w-4 h-4" />
              {contract.managerPhone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}
            </a>
          </div>

        </div>

      </div>
    </div>
  );
}
