import { create } from 'zustand';

export interface GroupMember {
  id: string;
  fullName: string;
  phone: string;
  cccd: string;
  isRepresentative: boolean;
}

export interface GroupDraftData {
  members: GroupMember[];
  leaseTerm?: string;
  moveInDate?: string;
}

interface GroupRegistrationStore {
  draftData: GroupDraftData;
  setDraftData: (data: Partial<GroupDraftData>) => void;
  clearDraft: () => void;
  
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

export const useGroupRegistrationStore = create<GroupRegistrationStore>((set) => ({
  draftData: { members: [] },
  setDraftData: (data) => set((state) => ({ draftData: { ...state.draftData, ...data } })),
  clearDraft: () => set({ draftData: { members: [] }, currentStep: 1 }),
  
  currentStep: 1,
  setCurrentStep: (step) => set({ currentStep: step }),
}));
