/**
 * Tien ich chung cho viec xet QUYET DINH cu tru TIEN-HOP-DONG theo tung CCCD.
 *
 * Boi canh: mot CCCD co the co NHIEU ban ghi residency_info (dang ky nhieu lan). Cac ban ghi
 * da gan hop dong (contract_id != null) la cua lan thue TRUOC — khong duoc dung de xet lan nay.
 * Ta chi lay ban ghi TIEN-HOP-DONG (contract_id = null) MOI NHAT cho moi CCCD (theo created_at,
 * hoa giai bang id) de tranh: (a) ban ghi cu gan HD lam sai ket qua, (b) ban ghi 'rejected' cu
 * khien khach dang ky lai bi coi la rot.
 *
 * Dung chung boi: residency.service (gate lap HD + finalize nhom) va manager-contract.repo
 * (xac dinh thanh phan hop dong).
 */
export type ResidencyDecisionRow = {
  id?: number | null;
  cccd?: string | null;
  check_result?: string | null;
  contract_id?: string | null;
  created_at?: string | null;
};

/** Map cccd -> ban ghi residency TIEN-HOP-DONG (contract_id null) moi nhat cua cccd do. */
export function latestPreContractResidencyByCccd(
  rows: ResidencyDecisionRow[] | null | undefined
): Map<string, ResidencyDecisionRow> {
  const latest = new Map<string, ResidencyDecisionRow>();
  for (const row of rows || []) {
    if (!row.cccd || row.contract_id != null) continue;
    const prev = latest.get(row.cccd);
    const rowTime = row.created_at ? new Date(row.created_at).getTime() : 0;
    const prevTime = prev?.created_at ? new Date(prev.created_at).getTime() : 0;
    if (!prev || rowTime > prevTime || (rowTime === prevTime && Number(row.id || 0) > Number(prev.id || 0))) {
      latest.set(row.cccd, row);
    }
  }
  return latest;
}
