import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
}

/**
 * ModalPortal — Render children trực tiếp vào document.body.
 * Giải quyết triệt để vấn đề stacking context (z-index không phủ sidebar)
 * bằng cách thoát hoàn toàn khỏi cây DOM của ứng dụng.
 */
export function ModalPortal({ children }: PortalProps) {
  const el = document.body;
  return createPortal(children, el);
}
