export type ScheduleRow = {
  month: number;
  payment: number; // cents
  principalPart: number; // cents
  interestPart: number; // cents
  outstandingPrincipal: number; // cents
};
