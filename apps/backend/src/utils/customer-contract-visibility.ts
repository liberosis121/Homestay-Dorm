export type ContractCustomerLink = {
  contract_id: string;
  customer_user_id: string;
};

export function getVisibleCustomerUserIdsForContract(
  contractId: string,
  contractCustomerLinks: ContractCustomerLink[],
  fallbackRepresentativeUserId?: string | null
): string[] {
  const linkedUserIds = contractCustomerLinks
    .filter((link) => link.contract_id === contractId && link.customer_user_id)
    .map((link) => link.customer_user_id);

  const uniqueLinkedUserIds = Array.from(new Set(linkedUserIds));
  if (uniqueLinkedUserIds.length > 0) return uniqueLinkedUserIds;

  return fallbackRepresentativeUserId ? [fallbackRepresentativeUserId] : [];
}
