import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DepositStatus = 'pending' | 'submitted' | 'approved' | 'rejected' | 'expired';

export interface DepositInfo {
  roomId: string;
  roomName: string;
  bedId: string;
  branch: string;
  checkInDate: string;
  depositAmount: number;
  deadline: string;
}

interface DepositState {
  status: DepositStatus;
  depositInfo: DepositInfo | null;
  paymentMethod: 'qr' | 'card' | 'wallet';
  proofImage: string | null;
  setStatus: (status: DepositStatus) => void;
  setPaymentMethod: (method: 'qr' | 'card' | 'wallet') => void;
  setProofImage: (image: string | null) => void;
  submitDeposit: () => void;
  reset: () => void;
}

const mockDepositInfo: DepositInfo = {
  roomId: 'r-1',
  roomName: 'Studio A',
  bedId: 'G-102',
  branch: 'Chi nhánh Quận 1',
  checkInDate: '2026-07-01',
  depositAmount: 2000000,
  deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export const useDepositStore = create<DepositState>()(
  persist(
    (set) => ({
      status: 'pending',
      depositInfo: mockDepositInfo,
      paymentMethod: 'qr',
      proofImage: null,
      setStatus: (status) => set({ status }),
      setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
      setProofImage: (proofImage) => set({ proofImage }),
      submitDeposit: () => set({ status: 'submitted' }),
      reset: () => set({ status: 'pending', proofImage: null, paymentMethod: 'qr' }),
    }),
    {
      name: 'deposit-storage',
    }
  )
);
