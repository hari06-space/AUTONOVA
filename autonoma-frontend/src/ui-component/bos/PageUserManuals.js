/**
 * Centralized User Manual Registry Index.
 * Imports individual page documentation modules to keep layouts highly modular.
 */
import { ReportDesignerManual } from './manuals/ReportDesignerManual';
import { InterviewProcessManual } from './manuals/InterviewProcessManual';
import { InterviewFinalManual } from './manuals/InterviewFinalManual';
import { OfferLetterManual } from './manuals/OfferLetterManual';
import { AppointmentOrderManual } from './manuals/AppointmentOrderManual';
import { InductionTraineeManual } from './manuals/InductionTraineeManual';
import HrSettingsManual from './manuals/HrSettingsManual';
import { ApplicationTrackingSystemManual } from './manuals/ApplicationTrackingSystemManual.jsx';
import { BomMasterManual } from './manuals/BomMasterManual';
import OtDetailsManual from './manuals/OtDetailsManual';
import OtVerifyManual from './manuals/OtVerifyManual';
import ChecklistAcknowledgementManual from './manuals/ChecklistAcknowledgementManual';
import { OfferLetterDesignerManual } from './manuals/OfferLetterDesignerManual';
import { EmailContentManual } from './manuals/EmailContentManual';
import { InterviewCriteriaManual } from './manuals/InterviewCriteriaManual';
import { LoanMasterManual } from './manuals/LoanMasterManual';
import { BankMasterManual } from './manuals/BankMasterManual';
import { EmployeeTransferManual } from './manuals/EmployeeTransferManual';
import { MeetingMasterManual } from './manuals/MeetingMasterManual';
import { MeetingScheduleManual } from './manuals/MeetingScheduleManual';
import { MeetingAttendanceManual } from './manuals/MeetingAttendanceManual';
import { MeetingMinutesManual } from './manuals/MeetingMinutesManual';
import { CloseMomManual } from './manuals/CloseMomManual';
import { MomApprovalManual } from './manuals/MomApprovalManual';
import { MomReportManual } from './manuals/MomReportManual';
import { MomSummaryReportManual } from './manuals/MomSummaryReportManual';
import { EnquiryDashboardManual } from './manuals/EnquiryDashboardManual';
import { MachineAddEditPageManual } from './manuals/MachineAddEditPageManual';

import { GoodsReceiptManual } from './manuals/GoodsReceiptManual';
import { PurchaseRequestManual } from './manuals/PurchaseRequestManual';
import { RfqManual } from './manuals/RfqManual';
import { QuotationManual } from './manuals/QuotationManual';
import { QuoteNegotiationManual } from './manuals/QuoteNegotiationManual';
import { QuoteComparisonManual } from './manuals/QuoteComparisonManual';
import { PurchaseOrderManual } from './manuals/PurchaseOrderManual';
import { GateEntryManual } from './manuals/GateEntryManual';

import { AqlMasterManual } from './manuals/AqlMasterManual';
import { InspectionSpecificationManual } from './manuals/InspectionSpecificationManual';
import { TermsMasterManual } from './manuals/TermsMasterManual';
import { AuditAttendanceManual } from './manuals/AuditAttendanceManual';
import { VisitorGatePassManual } from './manuals/VisitorGatePassManual';
import CompanyProfileManual from './manuals/CompanyProfileManual';
import { Product360DashboardManual } from './manuals/Product360DashboardManual';
import { BiometricAttendanceManual } from './manuals/BiometricAttendanceManual';
import { AuditReportManual } from './manuals/AuditReportManual';
import { AuditScoreReportManual } from './manuals/AuditScoreReportManual';
import { AuditVsActualReportManual } from './manuals/AuditVsActualReportManual';

export const PAGE_USER_MANUALS = {
  'QM1260': AuditReportManual,
  'QM1270': AuditScoreReportManual,
  'QM1280': AuditVsActualReportManual,
  'DD1110': BomMasterManual,
  'DB1500': Product360DashboardManual,
  'M5210': TermsMasterManual,
  'M10100': AqlMasterManual,
  'M10200': InspectionSpecificationManual,
  'AD1110': CompanyProfileManual,
  'AD1420': CompanyProfileManual,
  'AD1200': ReportDesignerManual,
  'HA1110': ApplicationTrackingSystemManual,
  'HA1120': InterviewProcessManual,
  'HA1130': InterviewFinalManual,
  'HA1280': EmployeeTransferManual,
  'HA1340': BiometricAttendanceManual,
  'HA1347': OtDetailsManual,
  'HA1348': OtVerifyManual,
  'HA1360': OfferLetterManual,
  'HA1360_DESIGNER': OfferLetterDesignerManual,
  'HA1361': AppointmentOrderManual,
  'HA1430': InductionTraineeManual,
  'QM1150': ChecklistAcknowledgementManual,
  'AD_HR_SETTINGS': HrSettingsManual,
  'M2120': EmailContentManual,
  'M2110': InterviewCriteriaManual,
  'M2340': LoanMasterManual,
  'M2320': BankMasterManual,
  'M1310': MeetingMasterManual,
  'M1320': MeetingScheduleManual,
  'M1330': MeetingAttendanceManual,
  'M1340': MeetingMinutesManual,
  'M1350': CloseMomManual,
  'M1370': MomReportManual,
  'M1380': MomSummaryReportManual,
  'SM1110': EnquiryDashboardManual,
  'M3520': MachineAddEditPageManual,
  'PU1130': GoodsReceiptManual,
  'PP0104': PurchaseRequestManual,
  'PU1105': RfqManual,
  'PU1110': QuotationManual,
  'PU1115': QuoteNegotiationManual,
  'PU1120': QuoteComparisonManual,
  'PU1140': PurchaseOrderManual,
  'PU1145': GateEntryManual,
  'QM1220': AuditAttendanceManual,
  'QM1320': MeetingAttendanceManual,
  'OM1000': VisitorGatePassManual,
  'AuditAttendance': AuditAttendanceManual,
  'VisitorGatePass': VisitorGatePassManual,
  'GoodsReceiptManual': GoodsReceiptManual,
  'TermsMasterManual': TermsMasterManual,
  'BiometricAttendance': BiometricAttendanceManual,
  'MomApprovalManual': MomApprovalManual
};
