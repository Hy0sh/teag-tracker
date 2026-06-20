export type BorrowingCapacityResult = {
  maxMonthlyPayment: number;
  currentDebtRatioBp: number;
  borrowableAmount: number;
  desiredAmount?: number;
  desiredMonthlyPayment?: number;
  desiredFits?: boolean;
  desiredDebtRatioBp?: number;
};
