/**
 * Cache trong bo nho co han su dung (TTL), dung cho cac tra cuu LAP DI LAP LAI va
 * DOC-NHIEU-GHI-IT — cu the la buoc xac thuc o auth.middleware.
 *
 * Boi canh: moi request di qua requireAuth + requireRole deu ton 1-2 round-trip toi
 * Supabase (do duoc 77-479ms moi lan) TRUOC KHI cham vao handler. Voi mot man hinh goi
 * 4 API song song thi rieng phan xac thuc da tra phi 8 round-trip cho cung mot nguoi dung.
 * Cache lai trong vai chuc giay giup bo gan het so do.
 *
 * Co y giu don gian (khong dung thu vien ngoai):
 *  - Het han theo thoi gian, kiem tra ngay luc doc (lazy) — khong can timer nen.
 *  - Chan tran kich thuoc theo kieu FIFO: Map cua JS giu nguyen thu tu them vao, nen khi
 *    day thi xoa key cu nhat. Tranh ro ri bo nho neu co nhieu token khac nhau di qua.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class TtlCache<T> {
  private store = new Map<string, CacheEntry<T>>();

  /**
   * @param ttlMs    Thoi gian song mac dinh cua moi ban ghi (mili giay).
   * @param maxSize  So ban ghi toi da; vuot qua thi xoa dan tu cu nhat.
   */
  constructor(private readonly ttlMs: number, private readonly maxSize: number = 500) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  /**
   * @param maxAgeMs Gioi han tren rieng cho ban ghi nay. Dung khi du lieu co han rieng
   *                 (vi du JWT sap het han) — luc do lay thoi gian NGAN HON giua hai ben.
   */
  set(key: string, value: T, maxAgeMs?: number): void {
    const ttl = maxAgeMs != null ? Math.min(this.ttlMs, maxAgeMs) : this.ttlMs;
    // TTL <= 0 nghia la du lieu da/sap het han -> khong cache de khoi phuc vu do cu.
    if (ttl <= 0) return;

    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) this.store.delete(oldestKey);
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttl });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

/**
 * Doc truong `exp` cua JWT MA KHONG xac thuc chu ky.
 *
 * AN TOAN o cho nao: gia tri nay CHI dung de RUT NGAN thoi gian cache, khong bao gio dung
 * de cap quyen. Viec xac thuc that van do `supabase.auth.getUser` dam nhiem. Ke tan cong
 * sua `exp` cung chi lam cache song ngan hon hoac khong duoc cache — khong the vuot quyen.
 *
 * @returns So mili giay con lai den khi token het han; `null` neu khong doc duoc.
 */
export function getJwtRemainingMs(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (typeof payload?.exp !== 'number') return null;
    return payload.exp * 1000 - Date.now();
  } catch {
    return null;
  }
}
