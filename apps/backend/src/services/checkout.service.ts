import { checkoutRepo } from '../repositories/checkout.repo';
import { contractRepo } from '../repositories/contract.repo';

export const checkoutService = {
  getMyCheckoutRequests: async (userId: string) => {
    // 1. Fetch user's contracts to verify ownership
    const contracts = await contractRepo.findByUserId(userId);
    const contractIds = contracts.map(c => c.id);

    if (contractIds.length === 0) {
      return [];
    }

    // 2. Fetch checkouts
    const checkouts = await checkoutRepo.findByContractIds(contractIds);

    // 3. Map checkouts and join in-memory with contract details
    return checkouts.map(ch => {
      const contract = contracts.find(c => c.id === ch.contract_id);
      const depReq = contract?.deposit_requests || {} as any;
      const room = depReq.rooms || {};
      const bed = depReq.beds || {};
      const branch = room.branches || {};

      // Parse the JSON note
      let parsedNote = {
        reason: ch.note || '',
        note: '',
        bankName: '',
        bankAccount: '',
        bankOwner: ''
      };

      if (ch.note) {
        try {
          const parsed = JSON.parse(ch.note);
          if (parsed && typeof parsed === 'object') {
            parsedNote = {
              reason: parsed.reason || '',
              note: parsed.note || '',
              bankName: parsed.bankName || '',
              bankAccount: parsed.bankAccount || '',
              bankOwner: parsed.bankOwner || ''
            };
          }
        } catch (e) {
          // Fallback to treat raw note as reason
        }
      }

      // Map status
      let frontendStatus: string = 'submitted';
      if (ch.status === 'pending') frontendStatus = 'submitted';
      else if (ch.status === 'inventory_checking') frontendStatus = 'inventory_checking';
      else if (ch.status === 'accounting_matching') frontendStatus = 'accounting_matching';
      else if (ch.status === 'refunding') frontendStatus = 'refunding';
      else if (ch.status === 'completed') frontendStatus = 'completed';
      else if (ch.status === 'rejected') frontendStatus = 'rejected';
      else frontendStatus = ch.status;

      let statusName = 'Đã gửi yêu cầu';
      if (frontendStatus === 'inventory_checking') statusName = 'Chờ quản lý kiểm kê';
      else if (frontendStatus === 'accounting_matching') statusName = 'Chờ kế toán đối soát';
      else if (frontendStatus === 'refunding') statusName = 'Chờ hoàn cọc';
      else if (frontendStatus === 'completed') statusName = 'Hoàn tất';
      else if (frontendStatus === 'rejected') statusName = 'Bị từ chối';

      return {
        id: ch.id,
        customerId: userId,
        customerName: contract?.deposit_requests?.rental_registrations?.customer_name || 'Khách hàng',
        branchName: branch.name || 'N/A',
        roomName: `Phòng ${room.name || 'N/A'} (${room.room_type === 'dorm' ? 'Dormitory' : room.room_type || 'N/A'})`,
        bedName: `Giường ${bed.name || 'N/A'}`,
        contractId: contract?.contract_code || ch.contract_id,
        expectedDate: ch.request_date,
        reason: parsedNote.reason,
        note: parsedNote.note,
        bankOwner: parsedNote.bankOwner,
        bankName: parsedNote.bankName,
        bankAccount: parsedNote.bankAccount,
        depositAmount: depReq.deposit_amount || contract?.rent_price || 0,
        status: frontendStatus,
        statusName,
        createdAt: contract?.created_date ? `${contract.created_date}T00:00:00Z` : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rejectReason: ch.status === 'rejected' ? ch.room_condition : undefined
      };
    });
  },

  submitCheckoutRequest: async (
    userId: string,
    reqData: {
      contractId: string;
      expectedDate: string;
      reason: string;
      note?: string;
      bankName: string;
      bankAccount: string;
      bankOwner: string;
    }
  ) => {
    // 1. Fetch user's contracts
    const contracts = await contractRepo.findByUserId(userId);
    
    // Find contract by ID or contractCode
    const contract = contracts.find(c => c.id === reqData.contractId || c.contract_code === reqData.contractId);
    if (!contract) {
      throw new Error('Hợp đồng không hợp lệ hoặc không thuộc quyền sở hữu của bạn.');
    }

    // 2. Prepare JSON note
    const noteJson = JSON.stringify({
      reason: reqData.reason,
      note: reqData.note || '',
      bankName: reqData.bankName,
      bankAccount: reqData.bankAccount,
      bankOwner: reqData.bankOwner
    });

    // 3. Create checkout record in DB
    const newCheckout = await checkoutRepo.create(contract.id, reqData.expectedDate, noteJson);
    return newCheckout;
  },

  cancelCheckoutRequest: async (userId: string, requestId: string) => {
    // 1. Fetch user's contracts
    const contracts = await contractRepo.findByUserId(userId);
    const contractIds = contracts.map(c => c.id);

    // 2. Verify checkout belongs to one of these contracts
    const checkouts = await checkoutRepo.findByContractIds(contractIds);
    const checkout = checkouts.find(ch => ch.id === requestId);
    if (!checkout) {
      throw new Error('Yêu cầu trả phòng không hợp lệ hoặc không thuộc quyền sở hữu của bạn.');
    }

    if (checkout.status !== 'pending' && checkout.status !== 'rejected') {
      throw new Error('Chỉ có thể hủy hoặc xóa yêu cầu đang ở trạng thái Chờ xử lý hoặc Bị từ chối.');
    }

    // 3. Delete checkout request
    await checkoutRepo.delete(requestId);
  }
};
