import { useState } from 'react';
import {
  Search, FileText, Clock, CheckCircle2, User, Phone, Building2,
  CalendarDays, Banknote, ChevronRight, Filter, MapPin
} from 'lucide-react';
import { DepositRecord } from '../SaleContractsPage';

interface Props {
  deposits: DepositRecord[];
  onSelect: (deposit: DepositRecord) => void;
  staffBranch: string;
  onViewContracts: () => void;
}

export default function DepositPendingList({ deposits, onSelect, staffBranch, onViewContracts }: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = deposits.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      d.customerName.toLowerCase().includes(q) ||
      d.depositCode.toLowerCase().includes(q) ||
      d.customerPhone.includes(q) ||
      d.roomCode.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-2xl font-bold text-[#1e1b17]">
            Lập hợp đồng thuê
          </h1>
          <p className="text-[#4e453c] mt-1 text-sm">
            Danh sách các phiếu đặt cọc đã được kiểm tra điều kiện lưu trú{' '}
            <span className="inline-flex items-center gap-1 font-semibold text-[#2d6a4f] bg-[#d8f3dc] px-2 py-0.5 rounded-full text-xs">
              <CheckCircle2 className="w-3 h-3" /> Đạt
            </span>{' '}
            và đang chờ nhận phòng.
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-[#6f583c] font-semibold">
            <MapPin className="w-3.5 h-3.5" />
            Chi nhánh của bạn: <span className="bg-[#faf2ec] border border-[#d1c4b9] px-2 py-0.5 rounded-full ml-1">{staffBranch}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <button
            onClick={onViewContracts}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#d1c4b9] text-[#4e453c] text-xs font-semibold hover:bg-[#faf2ec] hover:border-[#6f583c] hover:text-[#6f583c] transition cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            Hợp đồng & Bản nháp
          </button>
          <span className="bg-[#fef3c7] text-[#92400e] px-3 py-1.5 rounded-full font-semibold border border-[#fcd34d] text-xs">
            <Clock className="w-3.5 h-3.5 inline mr-1" />
            {filtered.length} phiếu chờ xử lý
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-[#d1c4b9] shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9d8879]" />
          <input
            type="text"
            placeholder="Tìm theo tên khách, mã phiếu, SĐT, mã phòng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d1c4b9] text-sm bg-[#fff8f3] focus:outline-none focus:ring-2 focus:ring-[#6f583c]/30 focus:border-[#6f583c] transition placeholder-[#b5a89c]"
          />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#d1c4b9] shadow-sm p-16 text-center">
          <Filter className="w-12 h-12 mx-auto text-[#c4b5a9] mb-4" />
          <p className="text-[#1e1b17] font-semibold text-lg">Không tìm thấy phiếu nào</p>
          <p className="text-[#9d8879] text-sm mt-2">Thử điều chỉnh bộ lọc để xem thêm kết quả.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#d1c4b9] shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-[#faf2ec] border-b border-[#d1c4b9]">
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-[#6f583c] uppercase tracking-wider">
                    Mã phiếu
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-[#6f583c] uppercase tracking-wider">
                    Khách thuê
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-[#6f583c] uppercase tracking-wider">
                    Phòng chọn thuê
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-[#6f583c] uppercase tracking-wider">
                    Chi nhánh
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-[#6f583c] uppercase tracking-wider">
                    Tiền cọc
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-bold text-[#6f583c] uppercase tracking-wider">
                    Trạng thái KT
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-bold text-[#6f583c] uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee7e1]">
                {filtered.map((deposit) => (
                  <tr
                    key={deposit.id}
                    className="hover:bg-[#fff8f3] transition-colors group"
                  >
                    {/* Mã phiếu */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#6f583c]/10 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-[#6f583c]" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#1e1b17] font-mono text-xs">
                            {deposit.depositCode}
                          </p>
                          <p className="text-[10px] text-[#9d8879] flex items-center gap-1 mt-0.5">
                            <CalendarDays className="w-3 h-3" />
                            {deposit.depositDate}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Khách thuê */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6f583c] to-[#8C7355] flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {deposit.customerName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-[#1e1b17] text-sm">{deposit.customerName}</p>
                          <p className="text-[11px] text-[#9d8879] flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {deposit.customerPhone}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Phòng */}
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#1e1b17] text-sm">{deposit.roomCode}</p>
                      <p className="text-[11px] text-[#9d8879]">{deposit.roomType}</p>
                    </td>

                    {/* Chi nhánh */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-[#4e453c] text-sm">
                        <Building2 className="w-3.5 h-3.5 text-[#9d8879] shrink-0" />
                        {deposit.branch}
                      </div>
                    </td>

                    {/* Tiền cọc */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-[#2d6a4f] shrink-0" />
                        <span className="font-bold text-[#2d6a4f] text-sm">
                          {deposit.depositAmount.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    </td>

                    {/* Trạng thái */}
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#d8f3dc] text-[#1b5e20]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        ĐẠT
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => onSelect(deposit)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#6f583c] hover:bg-[#5c4830] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Lập HĐ
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-[#faf2ec] border-t border-[#d1c4b9] flex items-center justify-between text-xs text-[#9d8879] flex-wrap gap-2">
            <span>Hiển thị <strong className="text-[#1e1b17]">{filtered.length}</strong> / {deposits.length} phiếu – Chi nhánh <strong className="text-[#6f583c]">{staffBranch}</strong></span>
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              Chỉ hiển thị phiếu kiểm tra lưu trú đạt của chi nhánh bạn
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
