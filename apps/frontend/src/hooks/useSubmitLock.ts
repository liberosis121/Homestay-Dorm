import { useCallback, useRef, useState } from 'react';

/**
 * useSubmitLock — chặn double-click gửi trùng request.
 *
 * VÌ SAO PHẢI DÙNG useRef CHỨ KHÔNG CHỈ useState:
 * `setState` trong React là bất đồng bộ. Nếu chỉ khóa bằng state, hai cú click liên tiếp
 * trong cùng một tick sẽ CÙNG đọc được `isSubmitting === false` (state chưa kịp cập nhật)
 * và cả hai đều lọt qua → vẫn bắn 2 request. `useRef` cập nhật ĐỒNG BỘ ngay lập tức nên
 * cú click thứ hai bị chặn ngay.
 *
 * State `isSubmitting` chỉ dùng để hiển thị (disable nút, hiện spinner).
 *
 * @example
 * const { isSubmitting, guard } = useSubmitLock();
 * <button disabled={isSubmitting} onClick={() => guard(handleSave)}>
 *   {isSubmitting ? 'Đang lưu...' : 'Lưu'}
 * </button>
 */
export function useSubmitLock() {
  const lockRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Bọc một hàm async: chỉ cho chạy 1 lần tại một thời điểm.
   * Các lần gọi trong lúc đang chạy sẽ bị bỏ qua (trả về undefined).
   */
  const guard = useCallback(async <T,>(fn: () => Promise<T> | T): Promise<T | undefined> => {
    if (lockRef.current) return undefined; // đang gửi → bỏ qua click thừa
    lockRef.current = true;
    setIsSubmitting(true);
    try {
      return await fn();
    } finally {
      lockRef.current = false;
      setIsSubmitting(false);
    }
  }, []);

  return { isSubmitting, guard };
}
