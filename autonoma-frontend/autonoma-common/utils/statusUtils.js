import {
  PENDING_WORKFLOW_STATUSES,
  VERIFIED_WORKFLOW_STATUSES,
  WORKFLOW_STATUS
} from '../constants/workflowStatusConstants';
import { DOCUMENT_STAMP_LABEL } from '../constants/documentStampConstants';

export const normalizeStatusName = (statusName) => String(statusName || '').trim().toUpperCase();

export const isStatusOneOf = (statusName, expectedStatusNames = []) => {
  const normalizedStatusName = normalizeStatusName(statusName);
  if (!normalizedStatusName) {
    return false;
  }

  return expectedStatusNames.some(
    (expectedStatusName) => normalizedStatusName === normalizeStatusName(expectedStatusName)
  );
};

export const isStatusMissingOrEqual = (statusName, expectedStatusName) => {
  const normalizedStatusName = normalizeStatusName(statusName);
  return !normalizedStatusName || normalizedStatusName === normalizeStatusName(expectedStatusName);
};

export const resolveWorkflowStampLabel = (statusNames = []) => {
  if (!statusNames.length) {
    return DOCUMENT_STAMP_LABEL.DRAFT;
  }

  const hasPendingStatus = statusNames.some((statusName) =>
    isStatusOneOf(statusName, PENDING_WORKFLOW_STATUSES)
  );
  if (hasPendingStatus) {
    return DOCUMENT_STAMP_LABEL.PENDING;
  }

  const hasRejectedStatus = statusNames.some((statusName) =>
    isStatusOneOf(statusName, [WORKFLOW_STATUS.REJECTED])
  );
  if (hasRejectedStatus) {
    return DOCUMENT_STAMP_LABEL.REJECTED;
  }

  const hasDraftStatus = statusNames.some((statusName) =>
    isStatusMissingOrEqual(statusName, WORKFLOW_STATUS.DRAFT)
  );
  if (hasDraftStatus) {
    return DOCUMENT_STAMP_LABEL.DRAFT;
  }

  const allVerifiedStatus = statusNames.every((statusName) =>
    isStatusOneOf(statusName, VERIFIED_WORKFLOW_STATUSES)
  );
  if (allVerifiedStatus) {
    return DOCUMENT_STAMP_LABEL.VERIFIED;
  }

  return DOCUMENT_STAMP_LABEL.DRAFT;
};
