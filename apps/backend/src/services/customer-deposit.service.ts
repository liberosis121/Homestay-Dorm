/**
 * Service layer de xu ly nghiep vu dat coc phong/giuong.
 * Phu thuoc: repositories/deposit-request.repo.ts, repositories/lease.repo.ts, repositories/profile.repo.ts, repositories/room.repo.ts, utils/id-generator.ts, types/constants.ts
 */

import { depositRequestRepo } from '../repositories/deposit-request.repo';
import { registrationMemberRepo } from '../repositories/registration-member.repo';
import { leaseRepo } from '../repositories/lease.repo';
import { getCustomerByUserId, getStaffByUserId } from '../repositories/profile.repo';
import { roomRepo } from '../repositories/room.repo';
import { generateNextId } from '../utils/id-generator';
import { REGISTRATION_STATUS, ID_PREFIX, DEPOSIT_STATUS, BED_STATUS, ROOM_STATUS, DEPOSIT_PAYMENT_DEADLINE_HOURS } from '../types/constants';
import { supabase } from '../utils/supabase';
import { getBedsByDepositIds } from '../utils/deposit-beds';

/**
 * Nha (tra ve 'available') cac giuong ma mot phieu coc dang giu cho.
 * Mo hinh n-n: MOI giuong giu cho deu nam trong bang noi deposit_beds
 *  (coc le = 1 giuong, coc nhom = N giuong). Coc nguyen phong khong co dong nao
 *  -> khong nha giuong o day (phong duoc nha o cho goi rieng).
 */
async function releaseReservedBeds(deposit: { id: string }) {
  const bedIds = await depositRequestRepo.getBedIdsByDeposit(deposit.id);
  for (const bedId of bedIds) {
    await roomRepo.updateBedStatus(bedId, BED_STATUS.AVAILABLE);
  }
}

export const customerDepositService = {
  /**
   * Tao yeu cau dat coc moi cho khach hang.
   * Luong nghiep vu:
   * 1. Kiem tra khach hang va so CCCD hop le.
   * 2. Kiem tra don dang ky thue phai hop le (chua dat coc hoac bi huy).
   * 3. Kiem tra giuong va phong phai san sang (available).
   * 4. Kiem tra de tranh spam yeu cau dat coc trung lap.
   * 5. Tinh toan tien coc va deadline thanh toan (+7 ngay).
   * 6. Tu dong tao ma phieu dat coc PDC-XXX.
   * 7. Luu phieu dat coc, chuyen trang thai giuong sang deposited, cap nhat trang thai don thue sang deposited.
   */
  createDeposit: async (userId: string, data: {
    registration_id: string;
    bed_id: string;
  }) => {
    // 1. Lay thong tin chi tiet khach hang tu userId
    const customer = await getCustomerByUserId(userId);
    if (!customer) {
      throw new Error('Khong tim thay thong tin khach hang. Vui long cap nhat ho so.');
    }

    // Yeu cau bat buoc phai co CCCD hop le moi duoc lam thu tuc dat coc
    if (!customer.cccd || customer.cccd.startsWith('TEMP-')) {
      throw new Error('Ban phai cap nhat so CCCD hop le trong ho so ca nhan truoc khi dat coc.');
    }

    // 2. Kiem tra don dang ky thue co ton tai khong
    const registration = await leaseRepo.getRegistrationById(data.registration_id);
    if (!registration) {
      throw new Error('Don dang ky thue khong ton tai.');
    }

    // Kiem tra quyen so huu don dang ky
    if (registration.cccd !== customer.cccd) {
      throw new Error('Ban khong co quyen dat coc cho don dang ky nay.');
    }

    // Don dang ky chi duoc phep dat coc khi chua dat coc hoac bi huy
    if (registration.status === REGISTRATION_STATUS.DEPOSITED) {
      throw new Error('Don dang ky thue nay da duoc dat coc.');
    }
    if (registration.status === REGISTRATION_STATUS.COMPLETED) {
      throw new Error('Don dang ky thue nay da hoan thanh hop dong.');
    }
    if (registration.status === REGISTRATION_STATUS.CANCELLED) {
      throw new Error('Don dang ky thue nay da bi huy.');
    }

    // 3. Lay thong tin giuong thue va kiem tra tinh trang
    const bed = await roomRepo.getBedById(data.bed_id);
    if (!bed) {
      throw new Error('Giuong thue khong ton tai.');
    }

    if (bed.status !== BED_STATUS.AVAILABLE) {
      throw new Error('Giuong nay hien khong con trong de dat coc.');
    }

    // Kiem tra them phong cua giuong co dang bao tri khong
    if (!bed.rooms) {
      throw new Error('Khong tim thay thong tin phong cua giuong nay.');
    }
    if (bed.rooms.status === ROOM_STATUS.MAINTENANCE) {
      throw new Error('Phong cua giuong nay dang bao tri, khong the dat coc.');
    }

    // 4. Kiem tra xem khach hang da co yeu cau dat coc nao dang cho xu ly (pending) khong de tranh spam
    const existingDeposits = await depositRequestRepo.getDepositsByCustomer(customer.cccd);
    const hasPendingDeposit = existingDeposits.some((d) => d.status === DEPOSIT_STATUS.PENDING);
    if (hasPendingDeposit) {
      throw new Error('Ban dang co mot yeu cau dat coc dang cho xu ly. Khong the tao them yeu cau dat coc moi.');
    }

    // 5. Tinh toan tien coc (2 thang tien thue * so giuong thue) va thoi han thanh toan (24 gio)
    const occupantsCount = registration.occupants_count || 1;
    const depositAmount = bed.price * 2 * occupantsCount;

    const paymentDeadline = new Date();
    paymentDeadline.setHours(paymentDeadline.getHours() + DEPOSIT_PAYMENT_DEADLINE_HOURS);

    // 6. Tu dong sinh ID duy nhat cho phieu dat coc (PDC-XXX)
    const nextId = await generateNextId(ID_PREFIX.DEPOSIT_REQUEST, 'deposit_requests');

    // 7. Ghep du lieu phieu dat coc moi (khong con cot bed_id — giuong luu o bang noi deposit_beds)
    const newRecord = {
      id: nextId,
      registration_id: data.registration_id,
      room_id: bed.room_id,
      deposit_amount: depositAmount,
      deposit_time: new Date().toISOString(),
      payment_deadline: paymentDeadline.toISOString(),
      status: DEPOSIT_STATUS.PENDING,
      staff_id: registration.staff_id || null // Gan cho nhan vien Sale phu trach don dang ky neu da co
    };

    // Luu phieu dat coc vao database
    const savedDeposit = await depositRequestRepo.createDepositRequest(newRecord);

    // Ghi giuong da giu cho vao bang noi (mo hinh n-n: coc 1 giuong le = 1 dong).
    await depositRequestRepo.createDepositBeds([{ deposit_id: nextId, bed_id: data.bed_id }]);

    // Cap nhat trang thai giuong sang deposited (da dat coc)
    await roomRepo.updateBedStatus(data.bed_id, BED_STATUS.DEPOSITED);

    // Cap nhat trang thai don dang ky thue sang deposited (da dat coc)
    await leaseRepo.updateRegistrationStatus(data.registration_id, REGISTRATION_STATUS.DEPOSITED, registration.staff_id);

    return savedDeposit;
  },

  /**
   * Tao phieu dat coc NHOM: 1 phieu giu cho NHIEU giuong cung mot phong.
   * Chi NGUOI DAI DIEN (registration.cccd) duoc tao. Tao 1 phieu (bed_id=NULL) +
   * ghi danh sach giuong vao bang noi deposit_beds → sinh dung 1 hoa don chung.
   */
  createGroupDeposit: async (userId: string, data: {
    registration_id: string;
    bed_ids: string[];
  }) => {
    // 1. Nguoi dat coc phai la nguoi dai dien cua phieu dang ky, co CCCD hop le.
    const customer = await getCustomerByUserId(userId);
    if (!customer) {
      throw new Error('Khong tim thay thong tin khach hang. Vui long cap nhat ho so.');
    }
    if (!customer.cccd || customer.cccd.startsWith('TEMP-')) {
      throw new Error('Ban phai cap nhat so CCCD hop le trong ho so ca nhan truoc khi dat coc.');
    }

    const registration = await leaseRepo.getRegistrationById(data.registration_id);
    if (!registration) {
      throw new Error('Don dang ky thue khong ton tai.');
    }
    if (registration.cccd !== customer.cccd) {
      throw new Error('Chi nguoi dai dien nhom moi duoc dat coc cho phieu dang ky nay.');
    }
    if (registration.status === REGISTRATION_STATUS.DEPOSITED) {
      throw new Error('Don dang ky thue nay da duoc dat coc.');
    }
    if (registration.status === REGISTRATION_STATUS.COMPLETED) {
      throw new Error('Don dang ky thue nay da hoan thanh hop dong.');
    }
    if (registration.status === REGISTRATION_STATUS.CANCELLED) {
      throw new Error('Don dang ky thue nay da bi huy.');
    }

    // 2. Validate danh sach giuong: khong rong, khong trung, va bang so thanh vien nhom.
    const bedIds = Array.isArray(data.bed_ids) ? data.bed_ids.filter(Boolean) : [];
    if (bedIds.length === 0) {
      throw new Error('Vui long chon giuong cho nhom.');
    }
    const uniqueBedIds = Array.from(new Set(bedIds));
    if (uniqueBedIds.length !== bedIds.length) {
      throw new Error('Co giuong bi chon trung. Vui long kiem tra lai.');
    }
    const expectedCount = registration.occupants_count || uniqueBedIds.length;
    if (uniqueBedIds.length !== expectedCount) {
      throw new Error(
        `So giuong chon (${uniqueBedIds.length}) phai bang so thanh vien nhom (${expectedCount}).`
      );
    }

    // 3. Chan spam: khach dang co phieu coc dang cho xu ly.
    const existingDeposits = await depositRequestRepo.getDepositsByCustomer(customer.cccd);
    const hasPendingDeposit = existingDeposits.some(
      (d) => d.status === DEPOSIT_STATUS.PENDING || d.status === DEPOSIT_STATUS.INVOICE_CREATED
    );
    if (hasPendingDeposit) {
      throw new Error('Ban dang co mot yeu cau dat coc dang cho xu ly. Khong the tao them yeu cau moi.');
    }

    // 4. Kiem tra tung giuong: ton tai, con trong, cung mot phong, phong khong bao tri.
    let roomId: string | null = null;
    let totalBedPrice = 0;
    for (const bedId of uniqueBedIds) {
      const bed = await roomRepo.getBedById(bedId);
      if (!bed) {
        throw new Error(`Giuong ${bedId} khong ton tai.`);
      }
      if (bed.status !== BED_STATUS.AVAILABLE) {
        throw new Error(`Giuong ${bed.name || bedId} hien khong con trong de dat coc.`);
      }
      if (!bed.rooms) {
        throw new Error('Khong tim thay thong tin phong cua giuong.');
      }
      if (bed.rooms.status === ROOM_STATUS.MAINTENANCE) {
        throw new Error('Phong cua giuong nay dang bao tri, khong the dat coc.');
      }
      if (roomId === null) {
        roomId = bed.room_id;
      } else if (roomId !== bed.room_id) {
        throw new Error('Cac giuong cua nhom phai thuoc cung mot phong.');
      }
      totalBedPrice += Number(bed.price) || 0;
    }

    // 5. Tinh tien coc = tong gia N giuong * 2 thang; deadline +24h.
    const depositAmount = totalBedPrice * 2;
    const paymentDeadline = new Date();
    paymentDeadline.setHours(paymentDeadline.getHours() + DEPOSIT_PAYMENT_DEADLINE_HOURS);

    // 6. Tao 1 phieu coc nhom (bed_id=NULL, room_id=phong chung).
    const nextId = await generateNextId(ID_PREFIX.DEPOSIT_REQUEST, 'deposit_requests');
    const newRecord = {
      id: nextId,
      registration_id: data.registration_id,
      room_id: roomId,
      deposit_amount: depositAmount,
      deposit_time: new Date().toISOString(),
      payment_deadline: paymentDeadline.toISOString(),
      status: DEPOSIT_STATUS.PENDING,
      staff_id: registration.staff_id || null
    };
    const savedDeposit = await depositRequestRepo.createDepositRequest(newRecord);

    // 7. Ghi bang noi + giu cho N giuong + chuyen phieu dang ky sang deposited.
    //    Rollback thu cong (huy phieu) neu buoc nao that bai — khong co transaction.
    try {
      await depositRequestRepo.createDepositBeds(
        uniqueBedIds.map((bedId) => ({ deposit_id: nextId, bed_id: bedId }))
      );
      for (const bedId of uniqueBedIds) {
        await roomRepo.updateBedStatus(bedId, BED_STATUS.DEPOSITED);
      }
      await leaseRepo.updateRegistrationStatus(
        data.registration_id,
        REGISTRATION_STATUS.DEPOSITED,
        registration.staff_id
      );
    } catch (err) {
      await depositRequestRepo.updateDepositStatus(nextId, DEPOSIT_STATUS.CANCELLED).catch(() => {});
      throw err;
    }

    return savedDeposit;
  },

  /**
   * Khach hang chu dong huy yeu cau dat coc cua minh.
   * Chi cho phep khi phieu dat coc dang o trang thai cho (pending).
   */
  cancelDeposit: async (userId: string, depositId: string) => {
    // 1. Lay thong tin khach hang tu userId
    const customer = await getCustomerByUserId(userId);
    if (!customer) {
      throw new Error('Khong tim thay thong tin khach hang.');
    }

    // 2. Doc chi tiet phieu dat coc
    const deposit = await depositRequestRepo.getDepositById(depositId);
    if (!deposit) {
      throw new Error('Yeu cau dat coc khong ton tai.');
    }

    // 3. Kiem tra quyen so huu: nguoi huy phai la khach hang so huu phieu dat coc
    if (!deposit.rental_registrations || deposit.rental_registrations.cccd !== customer.cccd) {
      throw new Error('Ban khong co quyen huy yeu cau dat coc nay.');
    }

    // 4. Chi cho phep huy khi phieu dang o trang thai pending
    if (deposit.status !== DEPOSIT_STATUS.PENDING) {
      throw new Error('Chi co the huy yeu cau dat coc dang o trang thai cho duyet.');
    }

    // 5. Cap nhat trang thai phieu dat coc sang cancelled
    const updatedDeposit = await depositRequestRepo.updateDepositStatus(depositId, DEPOSIT_STATUS.CANCELLED);

    // 6. Tra lai trang thai giuong ve available (ho tro ca coc 1 giuong lan coc nhom N giuong)
    await releaseReservedBeds(deposit);

    // 7. Khoi phuc lai trang thai don dang ky thue
    // Neu co nhan vien Sale phu trach thi khoi phuc sang scheduled, nguoc lai pending_schedule
    const newRegStatus = deposit.rental_registrations.staff_id 
      ? REGISTRATION_STATUS.SCHEDULED 
      : REGISTRATION_STATUS.PENDING_SCHEDULE;
      
    await leaseRepo.updateRegistrationStatus(
      deposit.registration_id, 
      newRegStatus, 
      deposit.rental_registrations.staff_id
    );

    return updatedDeposit;
  },

  /**
   * Khach hang dang nhap tu xem lich su dat coc cua minh.
   */
  getCustomerDeposits: async (userId: string) => {
    const customer = await getCustomerByUserId(userId);
    if (!customer) {
      throw new Error('Khong tim thay thong tin khach hang.');
    }

    // Lay coc voi tu cach NGUOI DAI DIEN (theo cccd) + voi tu cach THANH VIEN nhom
    // (theo cac phieu dang ky ma user co mat trong rental_registration_members).
    const memberships = await registrationMemberRepo.getRegistrationIdsByUser(userId);
    const memberRegIds = memberships.map((m) => m.registration_id);

    const [ownDeposits, memberDeposits] = await Promise.all([
      depositRequestRepo.getDepositsByCustomer(customer.cccd),
      depositRequestRepo.getDepositsByRegistrationIds(memberRegIds)
    ]);

    // Gop unique theo id (dai dien vua la thanh vien nen co the trung).
    const byId = new Map<string, any>();
    for (const d of [...(ownDeposits || []), ...(memberDeposits || [])]) {
      byId.set(d.id, d);
    }
    const deposits = Array.from(byId.values());

    // Danh sach giuong (tu bang noi deposit_beds) cho MOI phieu: le = 1, nhom = N, nguyen phong = 0.
    const bedsByDeposit = await getBedsByDepositIds(deposits.map((d) => d.id));

    // Danh dau quyen: chi NGUOI DAI DIEN (cccd trung) moi duoc thanh toan.
    return deposits.map((d) => {
      const beds = bedsByDeposit[d.id] || [];
      return {
        ...d,
        // bed_id chi con y nghia voi coc 1 giuong le (giu tuong thich cho FE).
        bed_id: beds.length === 1 ? beds[0].id : null,
        is_representative: d.rental_registrations?.cccd === customer.cccd,
        can_pay: d.rental_registrations?.cccd === customer.cccd,
        bed_names: beds.map((b) => b.name)
      };
    });
  },

  /**
   * Nhan vien hoac quan ly xem chi tiet mot phieu dat coc, hoac khach hang xem cua chinh minh.
   */
  getDepositDetail: async (userId: string, userRole: string, depositId: string) => {
    const deposit = await depositRequestRepo.getDepositById(depositId);
    if (!deposit) {
      throw new Error('Yeu cau dat coc khong ton tai.');
    }

    // Neu la khach hang, phai kiem tra xem ho co dung la chu phieu khong
    if (userRole === 'customer') {
      const customer = await getCustomerByUserId(userId);
      if (!customer || !deposit.rental_registrations || deposit.rental_registrations.cccd !== customer.cccd) {
        throw new Error('Ban khong co quyen xem chi tiet yeu cau dat coc nay.');
      }
    }

    return deposit;
  },

  /**
   * Sale/Manager lay toan bo danh sach phieu dat coc (ho tro filter).
   */
  getDepositsForStaff: async (filters: { status?: string; staff_id?: string }) => {
    return await depositRequestRepo.getAllDeposits(filters);
  },

  /**
   * Tu dong quet va huy cac phieu dat coc qua han 24 gio ma chua thanh toan.
   */
  autoCancelExpiredDeposits: async () => {
    const nowStr = new Date().toISOString();
    const { data: expiredDeposits, error } = await supabase
      .from('deposit_requests')
      .select(`
        id,
        registration_id,
        rental_registrations (
          staff_id
        )
      `)
      .eq('status', DEPOSIT_STATUS.INVOICE_CREATED)
      .lt('payment_deadline', nowStr);

    if (error) {
      console.error('[DepositAutoCancel] Error fetching expired deposits:', error.message);
      return;
    }

    if (!expiredDeposits || expiredDeposits.length === 0) {
      return;
    }

    console.log(`[DepositAutoCancel] Found ${expiredDeposits.length} expired deposits to cancel.`);

    for (const dep of expiredDeposits) {
      try {
        // 1. Cap nhat trang thai phieu dat coc sang cancelled
        await depositRequestRepo.updateDepositStatus(dep.id, DEPOSIT_STATUS.CANCELLED);

        // 2. Tra lai trang thai giuong ve available (ho tro ca coc 1 giuong lan coc nhom)
        await releaseReservedBeds(dep);

        // 3. Khoi phuc lai trang thai don dang ky thue
        const staffId = (dep.rental_registrations as any)?.staff_id;
        const newRegStatus = staffId 
          ? REGISTRATION_STATUS.SCHEDULED 
          : REGISTRATION_STATUS.PENDING_SCHEDULE;
          
        await leaseRepo.updateRegistrationStatus(
          dep.registration_id, 
          newRegStatus, 
          staffId
        );
        console.log(`[DepositAutoCancel] Successfully cancelled expired deposit id=${dep.id}`);
      } catch (err: any) {
        console.error(`[DepositAutoCancel] Error cancelling deposit id=${dep.id}:`, err.message);
      }
    }
  }
};
