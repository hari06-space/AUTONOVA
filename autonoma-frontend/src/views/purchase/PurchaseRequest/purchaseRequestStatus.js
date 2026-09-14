import { PENDING_WORKFLOW_STATUSES, TERMINAL_WORKFLOW_STATUSES, WORKFLOW_STATUS } from 'autonoma-common/constants/workflowStatusConstants';
import { isStatusMissingOrEqual, isStatusOneOf, resolveWorkflowStampLabel } from 'autonoma-common/utils/statusUtils';

export const isPendingStatus = (statusName) => isStatusOneOf(statusName, PENDING_WORKFLOW_STATUSES);

export const isDraftStatus = (statusName) => isStatusMissingOrEqual(statusName, WORKFLOW_STATUS.DRAFT);

export const isTerminalStatus = (statusName) => isStatusOneOf(statusName, TERMINAL_WORKFLOW_STATUSES);

export const getPrStampText = (transactions = []) => {
  const statusNames = transactions.map((transaction) => transaction.statusName);
  return resolveWorkflowStampLabel(statusNames);
};
