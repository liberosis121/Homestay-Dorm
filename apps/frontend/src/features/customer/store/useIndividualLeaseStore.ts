import { create } from 'zustand';

export interface DraftData {
  // Step 1: Personal Info
  fullName?: string;
  phone?: string;
  cccd?: string;
  dob?: string;
  gender?: 'male' | 'female' | 'other';
  issueDate?: string;
  issuePlace?: string;
  nationality?: string;
  permanentAddress?: string;
  // Step 2: Rental Info
  leaseTerm?: string;
  moveInDate?: string;
  // Step 3: Documents
  cccdFront?: string | null; // For simplicity, using string to represent file name/URL in mock
  cccdBack?: string | null;
}

interface IndividualLeaseStore {
  draftData: DraftData;
  setDraftData: (data: Partial<DraftData>) => void;
  clearDraft: () => void;
  
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

export const useIndividualLeaseStore = create<IndividualLeaseStore>((set) => ({
  draftData: {},
  setDraftData: (data) => set((state) => ({ draftData: { ...state.draftData, ...data } })),
  clearDraft: () => set({ draftData: {}, currentStep: 1 }),
  
  currentStep: 1,
  setCurrentStep: (step) => set({ currentStep: step }),
}));
