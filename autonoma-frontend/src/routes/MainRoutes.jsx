import { lazy } from 'react';

// project imports
import MainLayout from 'layout/MainLayout';
import ErrorBoundary from './ErrorBoundary';
import Loadable from 'ui-component/Loadable';
import AuthGuard from 'utils/route-guard/AuthGuard';
import { PageGuard } from 'ui-component/bos';
import { PAGE_CODES } from 'hooks/usePagePermissions';

import { Navigate } from 'react-router-dom';
import useAuth from 'hooks/useAuth';
import { loader as productsLoader, productLoader } from 'api/products';

const HrAdminGuard = ({ children }) => {
  const { user } = useAuth();
  const isHrOrAdmin =
    user?.userLevel === 1 ||
    user?.userLevel >= 5 ||
    user?.departmentName?.toLowerCase() === 'hr' ||
    user?.departmentName?.toLowerCase() === 'human resource' ||
    user?.departmentName?.toLowerCase() === 'human resources';

  if (!isHrOrAdmin) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
};

const SuperBossGuard = ({ children }) => {
  const { user } = useAuth();
  const isSuperBoss =
    user?.userId?.toUpperCase() === 'SUPER BOSS' ||
    user?.userName?.toUpperCase() === 'SUPER BOSS' ||
    user?.id?.toUpperCase() === 'SUPER BOSS' ||
    user?.employeeName?.toUpperCase() === 'SUPER BOSS' ||
    user?.name?.toUpperCase() === 'SUPER BOSS' ||
    user?.userId?.toUpperCase() === 'ADMIN';

  if (!isSuperBoss) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
};

// dashboard routing
const DashboardDefault = Loadable(lazy(() => import('modules/dashboard/Default')));
const DashboardAnalytics = Loadable(lazy(() => import('modules/dashboard/Analytics')));
const UserTaskQueue = Loadable(lazy(() => import('modules/dashboard/UserTaskQueue')));
const TaskDashboard = Loadable(lazy(() => import('modules/dashboard/TaskDashboard')));
const ExecutiveDashboard = Loadable(lazy(() => import('modules/dashboard/Executive')));
const Product360Dashboard = Loadable(lazy(() => import('modules/dashboard/Product360')));

const ProductionPlanList = Loadable(lazy(() => import('modules/production/plan/ProductionPlanList')));
const ProductionPlanForm = Loadable(lazy(() => import('modules/production/plan/ProductionPlanForm')));
const ProductionPlanDetail = Loadable(lazy(() => import('modules/production/plan/ProductionPlanDetail')));

// widget routing

// application - user social & account profile routing

// application - user cards & list variant routing

const PurchaseRequestList = Loadable(lazy(() => import('views/purchase/PurchaseRequest/PurchaseRequestList')));
const PurchaseRequestEntry = Loadable(lazy(() => import('views/purchase/PurchaseRequest/PurchaseRequestEntry')));
const PurchaseRequestPrint = Loadable(lazy(() => import('views/purchase/PurchaseRequest/PurchaseRequestPrint')));

const RfqList = Loadable(lazy(() => import('views/purchase/Rfq/RfqList')));
const RfqEntry = Loadable(lazy(() => import('views/purchase/Rfq/RfqEntry')));
const RfqPrint = Loadable(lazy(() => import('views/purchase/Rfq/RfqPrint')));

const QuotationList = Loadable(lazy(() => import('views/purchase/Quotation/QuotationList')));
const QuotationEntry = Loadable(lazy(() => import('views/purchase/Quotation/QuotationEntry')));

const QuoteNegotiationList = Loadable(lazy(() => import('views/purchase/QuoteNegotiation/QuoteNegotiationList')));
const QuoteNegotiationEntry = Loadable(lazy(() => import('views/purchase/QuoteNegotiation/QuoteNegotiationEntry')));

const QuoteComparisonList = Loadable(lazy(() => import('views/purchase/QuoteComparison/QuoteComparisonList')));
const QuoteComparisonEntry = Loadable(lazy(() => import('views/purchase/QuoteComparison/QuoteComparisonEntry')));
const PurchaseOrderList = Loadable(lazy(() => import('views/purchase/PurchaseOrder/PurchaseOrderList')));
const PurchaseOrderEntry = Loadable(lazy(() => import('views/purchase/PurchaseOrder/PurchaseOrderEntry')));
const PurchaseOrderScheduleList = Loadable(lazy(() => import('views/purchase/PurchaseOrderSchedule/PurchaseOrderScheduleList')));
const PurchaseOrderScheduleEntry = Loadable(lazy(() => import('views/purchase/PurchaseOrderSchedule/PurchaseOrderScheduleEntry')));

// Gate Entry
const GateEntryList = Loadable(lazy(() => import('views/purchase/GateEntry/GateEntryList')));
const GateEntryEntry = Loadable(lazy(() => import('views/purchase/GateEntry/GateEntryEntry')));


// Goods Receipt Note
const GoodsReceiptList = Loadable(lazy(() => import('views/purchase/GoodsReceipt/GoodsReceiptList')));
const GoodsReceiptEntry = Loadable(lazy(() => import('views/purchase/GoodsReceipt/GoodsReceiptEntry')));

// Quality Inspection
const QualityInspectionList = Loadable(lazy(() => import('views/purchase/QualityInspection/QualityInspectionList')));
const QualityInspectionForm = Loadable(lazy(() => import('views/purchase/QualityInspection/QualityInspectionForm')));

// Supplier Return
const SupplierReturnList = Loadable(lazy(() => import('views/purchase/SupplierReturn/SupplierReturnList')));
const SupplierReturnEntry = Loadable(lazy(() => import('views/purchase/SupplierReturn/SupplierReturnEntry')));

const ProcurementSettings = Loadable(lazy(() => import('views/purchase/Settings/ProcurementSettings')));
const VendorLicensing = Loadable(lazy(() => import('views/vendor/VendorLicensing')));

// application - customer routing

// application - chat / kanban / kanban / mail / calendar / contact routing

// application - e-commerce routing

// application - invoice routing

// application crm routing

// application blog routing

// master - hrm routing

// forms component routing

// forms plugins layout

// forms plugins routing

// table routing

// data-grid routing

// forms validation

// chart routing

// map routing

// basic ui-elements routing

// advance ui-elements routing

// pricing page routing

// utilities routing

// sample page routing

// admin routing
const AdminUserOverview = Loadable(lazy(() => import('modules/admin/UserOverview')));
const AdminPreferenceMaster = Loadable(lazy(() => import('modules/admin/PreferenceMaster')));
const AdminPrefixCredentials = Loadable(lazy(() => import('modules/admin/PrefixCredentials')));
const AdminCompanyProfile = Loadable(lazy(() => import('modules/admin/CompanyProfile')));
const ClientMasterList = Loadable(lazy(() => import('modules/admin/ClientMasterList')));
const ClientMaster = Loadable(lazy(() => import('modules/admin/ClientMaster')));
const AdminUserAccess = Loadable(lazy(() => import('modules/admin/UserAccess')));
const AdminBusinessAuthorization = Loadable(lazy(() => import('modules/admin/BusinessAuthorization')));
const AdminSessionMonitoring = Loadable(lazy(() => import('modules/admin/SessionMonitoring')));
const DivisionMaster = Loadable(lazy(() => import('modules/admin/DivisionMaster')));
const AddDivisionPage = Loadable(lazy(() => import('modules/admin/AddDivisionPage')));
const AuditTrailPage = Loadable(lazy(() => import('modules/admin/AuditTrailPage')));
const UserSessionAnalytics = Loadable(lazy(() => import('modules/admin/UserSessionAnalytics')));
const FileTraceabilityHub = Loadable(lazy(() => import('modules/admin/FileTraceabilityHub')));
import DocumentSearch from 'modules/admin/DocumentSearch';
const TicketManagement = Loadable(lazy(() => import('modules/admin/TicketManagement')));
const BOSNotebookAssistant = Loadable(lazy(() => import('modules/support/BOSNotebookAssistant')));
const DataMigration = Loadable(lazy(() => import('modules/admin/DataMigration')));
const DbQuery = Loadable(lazy(() => import('views/admin/super-boss/DbQuery')));
const OrganizationChart = Loadable(lazy(() => import('modules/admin/OrganizationChart')));
const PayrollWorkspace = Loadable(lazy(() => import('modules/admin/PayrollWorkspace')));
const HrSettings = Loadable(lazy(() => import('views/hr/settings/HrSettings')));
const AutomationDesigner = Loadable(lazy(() => import('modules/admin/AutomationDesigner')));
const ChecklistTrigger = Loadable(lazy(() => import('modules/admin/ChecklistTrigger')));
const WhatsAppCredentials = Loadable(lazy(() => import('modules/admin/WhatsAppCredentials')));
const TriggerConfiguration = Loadable(lazy(() => import('modules/admin/TriggerConfiguration')));
const ReportTemplateDesigner = Loadable(lazy(() => import('ui-component/bos/designer/ReportTemplateDesigner')));
const OAuthCallback = Loadable(lazy(() => import('views/admin/OAuthCallback')));
const ClientNotificationManagement = Loadable(lazy(() => import('modules/admin/ClientNotificationManagement')));


// qms checklist routing
const AqlMasterIndex = Loadable(lazy(() => import('views/master/quality/aql/AqlMasterIndex')));
const InspectionSpecificationIndex = Loadable(lazy(() => import('views/master/quality/inspection-specification/InspectionSpecificationIndex')));
const QmsMasterCheckList = Loadable(lazy(() => import('modules/qms/checklist/MasterCheckList')));
const QmsCheckListVerify = Loadable(lazy(() => import('modules/qms/checklist/CheckListVerify')));
const QmsCloseCheckListRenewal = Loadable(lazy(() => import('modules/qms/checklist/CloseCheckListRenewal')));
const QmsCheckListRenewalVerify = Loadable(lazy(() => import('modules/qms/checklist/CheckListRenewalVerify')));
const QmsCheckListRenewalReport = Loadable(lazy(() => import('modules/qms/checklist/CheckListRenewalReport')));
const MasterHrDepartment = Loadable(lazy(() => import('modules/hr/DepartmentDetails')));
const EmployeeType = Loadable(lazy(() => import('modules/hr/EmployeeType')));
const LeaveMaster = Loadable(lazy(() => import('modules/hr/LeaveMaster')));
const LeaveDetails = Loadable(lazy(() => import('views/hra/Attendance/HraLeaveDetailsList'))); // touch to trigger update for allowedEmployees options
const LeaveApply = Loadable(lazy(() => import('views/hra/Attendance/HraLeaveApply'))); // touch to reload
const LeaveTravelApplication = Loadable(lazy(() => import('views/hra/Attendance/HraLTAApply')));
const LeaveVerification = Loadable(lazy(() => import('views/hra/Attendance/HraLeaveVerifyList'))); // touch to rebuild
const LeaveTravelVerification = Loadable(lazy(() => import('views/hra/Attendance/HraLTAVerifyList')));
const LeaveTravelEntry = Loadable(lazy(() => import('views/hra/Attendance/HraLTADetails')));
const LeaveConfiguration = Loadable(lazy(() => import('modules/hr/LeaveConfiguration')));
const MasterHrEmployeeList = Loadable(lazy(() => import('modules/hr/EmployeeList')));
const MasterHrEmployee = Loadable(lazy(() => import('modules/hr/EmployeeMaster')));
const MasterHrDesignation = Loadable(lazy(() => import('modules/hr/DesignationMaster')));
const MasterHrGrade = Loadable(lazy(() => import('modules/hr/GradeDetails')));
const MasterHrHoliday = Loadable(lazy(() => import('modules/hr/HolidayMaster')));
const LoanMaster = Loadable(lazy(() => import('modules/hr/LoanMaster')));
const BankMaster = Loadable(lazy(() => import('modules/hr/BankMaster')));
const MonthMaster = Loadable(lazy(() => import('modules/hr/MonthMaster')));
const ShiftMaster = Loadable(lazy(() => import('modules/hr/ShiftMaster')));
const PetrolAllowanceMaster = Loadable(lazy(() => import('modules/hr/PetrolAllowanceMaster')));
const FinanceLedgerMaster = Loadable(lazy(() => import('modules/master/finance/FinanceLedgerMaster')));
const TaxLedgerMaster = Loadable(lazy(() => import('modules/master/finance/TaxLedgerMaster')));

const AssetGroupMaster = Loadable(lazy(() => import('modules/hr/asset/AssetGroupMaster')));
const AssetTypeMaster = Loadable(lazy(() => import('modules/hr/asset/AssetTypeMaster')));
const AssetSubTypeMaster = Loadable(lazy(() => import('modules/hr/asset/AssetSubTypeMaster')));
const MachineCategoryMaster = Loadable(lazy(() => import('views/master/qmt/MachineCategoryMaster')));
const MachineMaster = Loadable(lazy(() => import('views/master/qmt/MachineMaster')));
const MachineAddEditPage = Loadable(lazy(() => import('views/master/qmt/MachineAddEditPage')));
const ItemTransactionType = Loadable(lazy(() => import('modules/master/ItemTransactionType')));

const HraMyHolidayRequests = Loadable(lazy(() => import('modules/hra/holiday/MyHolidayRequests')));
const HraManagerHolidayApprovals = Loadable(lazy(() => import('modules/hra/holiday/ManagerHolidayApprovals')));
const HraEmployeeLeaveRequests = Loadable(lazy(() => import('modules/hra/holiday/HraEmployeeLeaveRequests')));
const HraHolidayCalendarReport = Loadable(lazy(() => import('modules/hra/holiday/HolidayCalendarReport')));
const HraEmployeeHolidaySummaryReport = Loadable(lazy(() => import('modules/hra/holiday/EmployeeHolidaySummaryReport')));
const MasterHrDesignationLevel = Loadable(lazy(() => import('modules/hr/DesignationLevelMaster')));
const InductionCriteria = Loadable(lazy(() => import('modules/hr/ats/InductionCriteria')));
const InductionRoundMaster = Loadable(lazy(() => import('modules/hr/ats/InductionRoundMaster')));
const InterviewCriteria = Loadable(lazy(() => import('modules/hr/ats/InterviewCriteria')));
const EmailContent = Loadable(lazy(() => import('modules/hr/ats/EmailContent')));
const VerificationCriteria = Loadable(lazy(() => import('modules/hr/ats/VerificationCriteria')));
const InductionAssignment = Loadable(lazy(() => import('modules/hr/ats/InductionAssignment')));
const InductionTraining = Loadable(lazy(() => import('modules/hr/ats/InductionTraining')));
const InductionTrainee = Loadable(lazy(() => import('modules/hr/ats/InductionTrainee')));

// QMS Satisfaction (Local Branch)
const QmsEmployeeSatisfactionDashboard = Loadable(lazy(() => import('modules/qms/satisfaction/EmployeeSatisfactionDashboard')));
const QmsSatisfactionCriteriaMaster = Loadable(lazy(() => import('modules/qms/satisfaction/SatisfactionCriteriaMaster')));
const QmsSatisfactionFeedbackEntry = Loadable(lazy(() => import('modules/qms/satisfaction/SatisfactionFeedbackEntry')));

// QMS Satisfaction (Remote HEAD)
const SatisfactionCriteriaMaster = Loadable(lazy(() => import('views/master/qms/SatisfactionCriteriaMaster')));
const SatisfactionFeedbackEntry = Loadable(lazy(() => import('views/master/qms/SatisfactionFeedbackEntry')));

const HraApplicationTrackingSystem = Loadable(lazy(() => import('modules/hra/ApplicationTrackingSystem')));
const HraApplicantProfile = Loadable(lazy(() => import('modules/hra/ApplicantProfile')));
const HraInterviewProcess = Loadable(lazy(() => import('modules/hra/InterviewProcess')));
const HraInterviewFinalProcess = Loadable(lazy(() => import('modules/hra/InterviewFinalProcess')));
const HraEmployeeTransfer = Loadable(lazy(() => import('modules/hra/EmployeeTransfer')));
const HraPayrollPenalty = Loadable(lazy(() => import('modules/hra/Payroll/PenaltyList')));
const HraLeaveEncashmentVerified = Loadable(lazy(() => import('modules/hra/Payroll/LeaveEncashmentVerifiedList')));
const HraLeaveEncashmentEntry = Loadable(lazy(() => import('modules/hra/Payroll/LeaveEncashmentEntryList')));
const HraPayrollProcess = Loadable(lazy(() => import('modules/hra/Payroll/PayrollProcess')));
const HraPayrollProcessCreate = Loadable(lazy(() => import('modules/hra/Payroll/PayrollProcessCreate')));
const HraPermissionApply = Loadable(lazy(() => import('views/hra/Attendance/HraPermissionApply')));
const HraPermissionDetails = Loadable(lazy(() => import('views/hra/Attendance/HraPermissionDetailsList')));
const HraPermissionEntry = Loadable(lazy(() => import('views/hra/Attendance/HraPermissionDetailsList')));
const HraPermissionVerification = Loadable(lazy(() => import('views/hra/Attendance/HraPermissionVerifyList')));
const HraPermissionRequest = Loadable(lazy(() => import('modules/hra/Attendance/PermissionRequestList')));
const HraOdApply = Loadable(lazy(() => import('views/hra/Attendance/HraOdApply'))); // touch for BOSStatusChip
const HraOdDetailsList = Loadable(lazy(() => import('views/hra/Attendance/HraOdDetailsList'))); // touch for BOSStatusChip
const HraOdVerifyList = Loadable(lazy(() => import('views/hra/Attendance/HraOdVerifyList'))); // touch for BOSStatusChip
const BiometricAttendance = Loadable(lazy(() => import('modules/hra/Attendance/BiometricAttendance')));
const AttendanceEntry = Loadable(lazy(() => import('modules/hra/Attendance/AttendanceEntry')));
const OtMasterList = Loadable(lazy(() => import('modules/hra/Attendance/OtMasterList')));
const OtDetailsList = Loadable(lazy(() => import('modules/hra/Attendance/OtDetailsList')));
const OtVerifyList = Loadable(lazy(() => import('modules/hra/Attendance/OtVerifyList')));

const EmployeeSatisfactionDashboard = Loadable(lazy(() => import('views/hra/satisfaction/EmployeeSatisfactionDashboard')));
const VendorSatisfactionDashboard = Loadable(lazy(() => import('views/hra/satisfaction/VendorSatisfactionDashboard')));
const CustomerSatisfactionDashboard = Loadable(lazy(() => import('views/hra/satisfaction/CustomerSatisfactionDashboard')));
const InternalCustomerSatisfactionDashboard = Loadable(lazy(() => import('views/hra/satisfaction/InternalCustomerSatisfactionDashboard')));
const EmployeeOnboarding = Loadable(lazy(() => import('views/hra/onboarding/EmployeeOnboarding')));
const EmployeeOnboardingTracking = Loadable(lazy(() => import('modules/hr/EmployeeOnboarding')));
const OfferLetterPage = Loadable(lazy(() => import('views/hra/onboarding/OfferLetterPage')));
const RelievingOrderPage = Loadable(lazy(() => import('views/hra/onboarding/RelievingOrderPage')));
const AppointmentOrderPage = Loadable(lazy(() => import('views/hra/onboarding/AppointmentOrderPage')));

const HraEmployeeMemoList = Loadable(lazy(() => import('views/hra/memo/EmployeeMemoList')));

const EmployeeFeedbackPortal = Loadable(lazy(() => import('views/hra/satisfaction/EmployeeFeedbackPortal')));
const VendorFeedbackPortal = Loadable(lazy(() => import('views/hra/satisfaction/VendorFeedbackPortal')));
const CustomerFeedbackPortal = Loadable(lazy(() => import('views/hra/satisfaction/CustomerFeedbackPortal')));
const InternalCustomerFeedbackPortal = Loadable(lazy(() => import('views/hra/satisfaction/InternalCustomerFeedbackPortal')));
const AccessDenied = Loadable(lazy(() => import('views/pages/authentication/AccessDenied')));
const HealthDashboard = Loadable(lazy(() => import('modules/admin/healthDashboard/HealthDashboard')));

const QmsAuditTypeMaster = Loadable(lazy(() => import('modules/qms/AuditTypeMaster/AuditTypeMaster')));
const ChecklistAcknowledgement = Loadable(lazy(() => import('modules/qms/checklist/ChecklistAcknowledgement')));
const QmsAuditAreaMaster = Loadable(lazy(() => import('modules/qms/AuditAreaMaster/AuditAreaMaster')));
const QmsAuditCriteriaMaster = Loadable(lazy(() => import('modules/qms/AuditCriteriaMaster/AuditCriteriaMaster')));
const EbSlabMaster = Loadable(lazy(() => import('modules/maintenance/EbSlab')));
const EbMeterMaster = Loadable(lazy(() => import('modules/maintenance/EbMeter')));
const EbPowerConsumptionMaster = Loadable(lazy(() => import('modules/maintenance/EbPowerConsumption')));

const QmsAuditScheduleList = Loadable(lazy(() => import('modules/qms/AuditSchedule/AuditScheduleList')));
const QmsAddAuditSchedule = Loadable(lazy(() => import('modules/qms/AuditSchedule/AddAuditSchedule')));
const QmsAuditAttendance = Loadable(lazy(() => import('modules/qms/AuditAttendance/AuditAttendance')));
const QmsAuditObservationList = Loadable(lazy(() => import('modules/qms/AuditObservation/AuditObservationList')));
const QmsAddAuditObservation = Loadable(lazy(() => import('modules/qms/AuditObservation/AddAuditObservation')));
const QmsAuditNcrClose = Loadable(lazy(() => import('modules/qms/AuditNcr/AuditNcrClose')));
const QmsAuditNcrApproval = Loadable(lazy(() => import('modules/qms/AuditNcr/AuditNcrApproval')));
const QmsAuditReport = Loadable(lazy(() => import('modules/qms/AuditNcr/AuditReport')));
const QmsAuditScoreReport = Loadable(lazy(() => import('modules/qms/AuditNcr/AuditScoreReport')));
const QmsAuditVsActualReport = Loadable(lazy(() => import('modules/qms/AuditNcr/AuditVsActualReport')));
const MeetingMaster = Loadable(lazy(() => import('modules/qms/MeetingMaster/MeetingMasterList')));
const MeetingSchedule = Loadable(lazy(() => import('modules/qms/MeetingSchedule/MeetingScheduleList')));
const AddMeetingSchedule = Loadable(lazy(() => import('modules/qms/MeetingSchedule/AddMeetingSchedule')));
const MeetingMinutes = Loadable(lazy(() => import('modules/qms/MeetingMinutes/MomList')));
const AddMeetingMinutes = Loadable(lazy(() => import('modules/qms/MeetingMinutes/AddMeetingMinutes')));
const MeetingAttendance = Loadable(lazy(() => import('modules/qms/MeetingAttendance/AttendanceList')));
const CloseMom = Loadable(lazy(() => import('modules/qms/CloseMom/CloseMomList')));
const MomApproval = Loadable(lazy(() => import('modules/qms/MomApproval/MomApprovalList')));
const MomReport = Loadable(lazy(() => import('modules/qms/MomReport/MomReportList')));
const MomSummaryReport = Loadable(lazy(() => import('modules/qms/MomSummaryReport/MomSummaryReportList')));
const QmsLoanIssue = Loadable(lazy(() => import('modules/qms/loan/LoanIssueList')));
const QmsLoanShortClose = Loadable(lazy(() => import('modules/qms/loan/LoanShortCloseList')));
const QmsLoanVerification = Loadable(lazy(() => import('modules/qms/loan/LoanVerificationList')));
const QmsLoanApply = Loadable(lazy(() => import('modules/qms/loan/LoanApply')));

// sales & marketing routing
const SmCustomerMasterList = Loadable(lazy(() => import('modules/sm/CustomerMasterList')));
const SmCustomerMaster = Loadable(lazy(() => import('modules/sm/CustomerMaster')));
const SmCustomerAddressList = Loadable(lazy(() => import('modules/sm/CustomerAddressList')));
const SmContactMasterList = Loadable(lazy(() => import('modules/sm/ContactMasterList')));
const SmEnquiryDashboard = Loadable(lazy(() => import('modules/sm/EnquiryDashboard')));
const SmPriceMasterList = Loadable(lazy(() => import('modules/sm/PriceMasterList')));
const SmAddPriceMasterPage = Loadable(lazy(() => import('modules/sm/AddPriceMasterPage')));
const SmSupplierList = Loadable(lazy(() => import('modules/sm/SupplierList')));
const SmSupplierMaster = Loadable(lazy(() => import('modules/sm/SupplierMaster')));
const SmQuotationList = Loadable(lazy(() => import('modules/sm/QuotationList')));
const SmQuotationEntry = Loadable(lazy(() => import('modules/sm/QuotationEntry')));
const SmQuotationFollowUp = Loadable(lazy(() => import('modules/sm/QuotationFollowUp')));
const SmQuotationFollowUpEntry = Loadable(lazy(() => import('modules/sm/QuotationFollowUpEntry')));
const SmEnquiryList = Loadable(lazy(() => import('modules/sm/EnquiryList')));
const SmEnquiryForm = Loadable(lazy(() => import('modules/sm/EnquiryForm')));
const SmCustomerOrderManagementList = Loadable(lazy(() => import('modules/sm/CustomerOrderManagementList')));
const SmCustomerOrderForm = Loadable(lazy(() => import('modules/sm/CustomerOrderForm')));
const SmCustomerOrderScheduleList = Loadable(lazy(() => import('modules/sm/CustomerOrderScheduleList')));
const SmCustomerOrderScheduleForm = Loadable(lazy(() => import('modules/sm/CustomerOrderScheduleForm')));
const InvoiceList = Loadable(lazy(() => import('modules/sm/InvoiceList')));
const InvoiceForm = Loadable(lazy(() => import('modules/sm/InvoiceForm')));
const DeliveryReceiptList = Loadable(lazy(() => import('modules/sm/DeliveryReceiptList')));
const DeliveryReceiptForm = Loadable(lazy(() => import('modules/sm/DeliveryReceiptForm')));


// sm masters
const CurrencyMaster = Loadable(lazy(() => import('modules/admin/CurrencyMaster')));
const SegmentMaster = Loadable(lazy(() => import('modules/master/SegmentMaster')));
const SubSegmentMaster = Loadable(lazy(() => import('modules/master/SubSegmentMaster')));
const PaymentTerms = Loadable(lazy(() => import('modules/master/PaymentTerms')));
const LedgerGroup = Loadable(lazy(() => import('modules/master/finance/LedgerGroup')));
const TypeOfService = Loadable(lazy(() => import('modules/master/TypeOfService')));
const CountryMasterPage = Loadable(lazy(() => import('modules/admin/CountryMaster')));
const StateMasterPage = Loadable(lazy(() => import('modules/admin/StateMaster')));
const CityMasterPage = Loadable(lazy(() => import('modules/admin/CityMaster/CityMaster')));
const CustomerPotentialMaster = Loadable(lazy(() => import('modules/sm/crm/CustomerPotential/CustomerPotentialMaster')));
const AdditionalChargesMaster = Loadable(lazy(() => import('modules/master/AdditionalChargesMaster')));

// npd routing
const NpdItemGroupMaster = Loadable(lazy(() => import('modules/npd/ItemGroup/ItemGroupMaster')));
const NpdProductMaster = Loadable(lazy(() => import('modules/npd/ProductMaster/ProductMaster')));
const NpdAddProduct = Loadable(lazy(() => import('modules/npd/ProductMaster/AddProduct')));
const NpdItemTypeMaster = Loadable(lazy(() => import('modules/npd/ItemType/ItemTypeMaster')));
const NpdItemSubtypeMaster = Loadable(lazy(() => import('modules/npd/ItemSubtype/ItemSubtypeMaster')));
const NpdOemMaster = Loadable(lazy(() => import('modules/npd/Oem/OemMaster')));
const NpdOemMappingMaster = Loadable(lazy(() => import('modules/npd/OemMapping/OemMappingMaster')));
const NpdModelMaster = Loadable(lazy(() => import('modules/npd/Model/ModelMaster')));
const NpdCapacityMaster = Loadable(lazy(() => import('modules/npd/Capacity/CapacityMaster')));
const NpdWindFarmMaster = Loadable(lazy(() => import('modules/npd/WindFarm/WindFarmMaster')));
const NpdHsnCodeMaster = Loadable(lazy(() => import('modules/admin/HsnCodeMaster/HsnCodeMaster')));
const NpdInventoryTypeMaster = Loadable(lazy(() => import('modules/npd/InventoryTypeMaster/InventoryTypeMaster')));
const NpdMaterialTypeMaster = Loadable(lazy(() => import('modules/npd/MaterialTypeMaster/MaterialTypeMaster')));
const NpdMaterialGradeMaster = Loadable(lazy(() => import('modules/npd/MaterialGradeMaster/MaterialGradeMaster')));
const NpdShapeMaster = Loadable(lazy(() => import('modules/npd/ShapeMaster/ShapeMaster')));
const NpdMaterialConditionMaster = Loadable(lazy(() => import('modules/npd/material/MaterialConditionMaster')));
const NpdModelNameMaster = Loadable(lazy(() => import('modules/qms/ModelName/ModelNameMaster')));
const NpdProcessMaster = Loadable(lazy(() => import('modules/npd/product/ProcessMaster')));
const NpdCharacterSpecificationMaster = Loadable(lazy(() => import('modules/npd/product/CharacterSpecificationMaster')));
const NpdSampleSizeMaster = Loadable(lazy(() => import('modules/npd/product/SampleSizeMaster')));
const NpdSampleFrequencyMaster = Loadable(lazy(() => import('modules/npd/product/SampleFrequencyMaster')));
const NpdControlMethodMaster = Loadable(lazy(() => import('modules/npd/product/ControlMethodMaster')));
const NpdFeasibilityCategoryMaster = Loadable(lazy(() => import('modules/npd/product/FeasibilityCategoryMaster')));
const NpdCorrectiveActionMaster = Loadable(lazy(() => import('modules/npd/product/CorrectiveActionMaster')));
const NpdReactionPlanMaster = Loadable(lazy(() => import('modules/npd/product/ReactionPlanMaster')));
const NpdSeverityFmeaMaster = Loadable(lazy(() => import('modules/npd/ppap/SeverityFmeaMaster')));
const NpdDetectionFmeaMaster = Loadable(lazy(() => import('modules/npd/ppap/DetectionFmeaMaster')));
const NpdOccuranceFmeaMaster = Loadable(lazy(() => import('modules/npd/ppap/OccuranceFmeaMaster')));
const NpdUomMaster = Loadable(lazy(() => import('modules/admin/Uom/UomMaster')));
const NpdProductIPPMaster = Loadable(lazy(() => import('modules/npd/ProductIPP/ProductIPPMaster')));
const UnderConstruction = Loadable(lazy(() => import('modules/pages/maintenance/UnderConstruction')));
const BatchTraceabilityReport = Loadable(lazy(() => import('modules/purchase/reports/BatchTraceabilityReport')));
const CurrentStockReport = Loadable(lazy(() => import('modules/inventory/reports/CurrentStockReport')));
const StockLedgerReport = Loadable(lazy(() => import('modules/inventory/reports/StockLedgerReport')));
const RejectionStockReport = Loadable(lazy(() => import('modules/inventory/reports/RejectionStockReport')));
const StockMovementReport = Loadable(lazy(() => import('modules/inventory/reports/StockMovementReport')));
const FinanceTransactionReport = Loadable(lazy(() => import('views/finance/FinanceTransactionReport')));
const FinanceOutstandingReport = Loadable(lazy(() => import('views/finance/FinanceOutstandingReport')));
const UnallocatedResourceReport = Loadable(lazy(() => import('modules/qms/meeting/UnallocatedResource')));
const BOMList = Loadable(lazy(() => import('modules/npd/ProductBOM/BOMList')));
const AddBOM = Loadable(lazy(() => import('modules/npd/ProductBOM/AddBOM')));
const ProductBundleList = Loadable(lazy(() => import('views/master/npd/productBundle')));
const ProductBundleForm = Loadable(lazy(() => import('views/master/npd/productBundle/ProductBundleForm')));
const DdProductProcess = Loadable(lazy(() => import('modules/npd/product/DdProductProcess')));
const DdProductProcessForm = Loadable(lazy(() => import('modules/npd/product/DdProductProcessForm')));
const PackingProcedureList = Loadable(lazy(() => import('modules/npd/product/PackingProcedureList')));
const PackingProcedureForm = Loadable(lazy(() => import('modules/npd/product/PackingProcedureForm')));

// chat application routing
const AppChat = Loadable(lazy(() => import('views/application/chat')));

// mail application routing
const AppMail = Loadable(lazy(() => import('views/application/mail')));

// calendar application routing
const AppCalendar = Loadable(lazy(() => import('views/application/calendar')));

// order management routing
const OmVisitorGatePass = Loadable(lazy(() => import('modules/order/VisitorGatePass')));
const OmVisitorGateEntry = Loadable(lazy(() => import('modules/order/VisitorGateEntry')));

// epm routing
const EpmDashboard = Loadable(lazy(() => import('modules/epm/dashboard')));

// ── Autonova AI ──────────────────────────────────────────────────

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: (
    <AuthGuard>
      <MainLayout />
    </AuthGuard>
  ),
  children: [
    {
      path: '/epm/dashboard',
      element: (
        <EpmDashboard />
      )
    },
    {
      path: '/apps/calendar',
      element: <AppCalendar />
    },
    {
      path: '/admin/user-overview',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_USER_CREDENTIALS}>
          <AdminUserOverview />
        </PageGuard>
      )
    },
    {
      path: '/admin/preference-master',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_APP_PREFERENCE}>
          <AdminPreferenceMaster />
        </PageGuard>
      )
    },
    {
      path: '/admin/prefix-suffix-configuration',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_PREFIX_CREDENTIALS}>
          <AdminPrefixCredentials />
        </PageGuard>
      )
    },
    {
      path: '/admin/user-credentials',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_USER_CREDENTIALS}>
          <AdminUserOverview />
        </PageGuard>
      )
    },
    {
      path: '/admin/company-profile',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_COMPANY_PROFILE}>
          <AdminCompanyProfile />
        </PageGuard>
      )
    },
    {
      path: '/client-management/client-master',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_CLIENT_MASTER}>
          <ClientMasterList />
        </PageGuard>
      )
    },
    {
      path: '/client-management/client-master/add',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_CLIENT_MASTER}>
          <ClientMaster />
        </PageGuard>
      )
    },
    {
      path: '/client-management/client-master/edit/:id',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_CLIENT_MASTER}>
          <ClientMaster />
        </PageGuard>
      )
    },
    {
      path: '/admin/client-master',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_CLIENT_MASTER}>
          <ClientMasterList />
        </PageGuard>
      )
    },
    {
      path: '/admin/client-master/add',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_CLIENT_MASTER}>
          <ClientMaster />
        </PageGuard>
      )
    },
    {
      path: '/admin/client-master/edit/:id',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_CLIENT_MASTER}>
          <ClientMaster />
        </PageGuard>
      )
    },
    {
      path: '/oauth/callback',
      element: <OAuthCallback />
    },
    {
      path: '/admin/user-access',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_USER_ACCESS}>
          <AdminUserAccess />
        </PageGuard>
      )
    },
    {
      path: '/admin/business-authorization',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_BUSINESS_AUTH}>
          <AdminBusinessAuthorization />
        </PageGuard>
      )
    },
    {
      path: '/admin/session-monitoring',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_SESSION_MONITORING}>
          <AdminSessionMonitoring />
        </PageGuard>
      )
    },
    {
      path: '/master/admin/hsn-code',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_HSN_CODE}>
          <NpdHsnCodeMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/admin/uom',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_UOM}>
          <NpdUomMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/admin/currency',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_CURRENCY}>
          <CurrencyMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/admin/country',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_COUNTRY}>
          <CountryMasterPage />
        </PageGuard>
      )
    },
    {
      path: '/master/admin/state',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_STATE}>
          <StateMasterPage />
        </PageGuard>
      )
    },
    {
      path: '/master/admin/city',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_CITY}>
          <CityMasterPage />
        </PageGuard>
      )
    },
    {
      path: '/admin/audit-trail',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_AUDIT_TRAIL}>
          <AuditTrailPage />
        </PageGuard>
      )
    },
    {
      path: '/admin/session-analytics',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_SESSION_ANALYTICS}>
          <UserSessionAnalytics />
        </PageGuard>
      )
    },
    {
      path: '/admin/file-traceability-hub',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_FILE_TRACEABILITY}>
          <FileTraceabilityHub />
        </PageGuard>
      )
    },
    {
      path: '/admin/document-search',
      element: (
        <PageGuard pageCode="DM1010">
          <DocumentSearch />
        </PageGuard>
      )
    },
    {
      path: '/admin/report-template-designer',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_REPORT_TEMPLATE_DESIGNER}>
          <ReportTemplateDesigner />
        </PageGuard>
      )
    },

    {
      path: '/admin/data-migration',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_DATA_MIGRATION}>
          <DataMigration />
        </PageGuard>
      )
    },
    {
      path: '/admin/db-query',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_BUSINESS_AUTH}>
          <DbQuery />
        </PageGuard>
      )
    },
    {
      path: '/admin/division',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_DIVISION}>
          <DivisionMaster />
        </PageGuard>
      )
    },
    {
      path: '/admin/division/add',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_DIVISION}>
          <AddDivisionPage />
        </PageGuard>
      )
    },
    {
      path: '/admin/division/edit/:id',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_DIVISION}>
          <AddDivisionPage />
        </PageGuard>
      )
    },

    {
      path: '/admin/payroll-workspace',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_PAYROLL_WORKSPACE}>
          <PayrollWorkspace />
        </PageGuard>
      )
    },
    {
      path: '/admin/hr-settings',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_PAYROLL_WORKSPACE}>
          <PayrollWorkspace />
        </PageGuard>
      )
    },
    {
      path: '/admin/automation-designer',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_AUTOMATION_DESIGNER}>
          <AutomationDesigner />
        </PageGuard>
      )
    },
    {
      path: '/admin/process-trigger',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_PROCESS_TRIGGER}>
          <ChecklistTrigger />
        </PageGuard>
      )
    },
    {
      path: '/admin/whatsapp-credentials',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_PREFIX_CREDENTIALS}>
          <WhatsAppCredentials />
        </PageGuard>
      )
    },
    {
      path: '/admin/trigger-configuration',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_TRIGGER_CONFIGURATION}>
          <TriggerConfiguration />
        </PageGuard>
      )
    },
    {
      path: '/client-management/notifications',
      element: <ClientNotificationManagement isCentralMode={true} />
    },
    {
      path: '/admin/notifications',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD_CLIENT_NOTIFICATIONS}>
          <ClientNotificationManagement isCentralMode={false} />
        </PageGuard>
      )
    },
    {
      path: '/admin/health-dashboard',
      element: <HealthDashboard />
    },
    {
      path: '/master/hr/ats/induction-criteria',
      element: (
        <PageGuard pageCode={PAGE_CODES.ATS_INDUCTION_CRITERIA}>
          <InductionCriteria />
        </PageGuard>
      )
    },
    // {
    //   path: '/master/hr/ats/induction-round',
    //   element: (
    //     <PageGuard pageCode={PAGE_CODES.ATS_INDUCTION_ROUND}>
    //       <InductionRoundMaster />
    //     </PageGuard>
    //   )
    // },
    {
      path: '/master/hr/ats/interview-criteria',
      element: (
        <PageGuard pageCode={PAGE_CODES.ATS_INTERVIEW_CRITERIA}>
          <InterviewCriteria />
        </PageGuard>
      )
    },
    {
      path: '/master/hr/ats/email-content',
      element: (
        <PageGuard pageCode={PAGE_CODES.ATS_EMAIL_CONTENT}>
          <EmailContent />
        </PageGuard>
      )
    },
    {
      path: '/master/hr/ats/verification',
      element: (
        <PageGuard pageCode={PAGE_CODES.ATS_VERIFICATION}>
          <VerificationCriteria />
        </PageGuard>
      )
    },
    {
      path: '/hra/ats/induction-assignment',
      element: (
        <PageGuard pageCode={PAGE_CODES.ATS_INDUCTION_PENDING}>
          <InductionAssignment />
        </PageGuard>
      )
    },
    {
      path: '/hra/ats/induction-training',
      element: (
        <PageGuard pageCode={PAGE_CODES.ATS_INDUCTION_TRAINING}>
          <InductionTraining />
        </PageGuard>
      )
    },
    {
      path: '/hra/ats/induction-trainee',
      element: (
        <PageGuard pageCode={PAGE_CODES.ATS_INDUCTION_TRAINEE}>
          <InductionTrainee />
        </PageGuard>
      )
    },
    {
      path: '/hra/holiday/my-requests',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_MY_HOLIDAY_REQUESTS}>
          <HraMyHolidayRequests />
        </PageGuard>
      )
    },
    {
      path: '/hra/holiday/approvals/manager',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_HOLIDAY_APPROVALS_MGR}>
          <HraManagerHolidayApprovals />
        </PageGuard>
      )
    },
    {
      path: '/hra/leave-requests',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_HOLIDAY_APPROVALS_HR}>
          <HraEmployeeLeaveRequests />
        </PageGuard>
      )
    },
    {
      path: '/reports/hra/holiday-calendar',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_HOLIDAY_CALENDAR_REPORT}>
          <HraHolidayCalendarReport />
        </PageGuard>
      )
    },
    {
      path: '/reports/hra/employee-holiday-summary',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_HOLIDAY_YEARLY_SUMMARY}>
          <HraEmployeeHolidaySummaryReport />
        </PageGuard>
      )
    },
    {
      path: '/dashboard/default',
      element: <DashboardDefault />
    },
    {
      path: '/dashboard/analytics',
      element: <DashboardAnalytics />
    },
    {
      path: '/dashboard/user-task-queue',
      element: <UserTaskQueue />
    },
    {
      path: '/dashboard/executive',
      element: (
        <PageGuard pageCode={PAGE_CODES.DASHBOARD_EXECUTIVE}>
          <ExecutiveDashboard />
        </PageGuard>
      )
    },
    {
      path: '/dashboard/product-360',
      element: (
        <PageGuard pageCode={PAGE_CODES.DASHBOARD_PRODUCT_360}>
          <Product360Dashboard />
        </PageGuard>
      )
    },
    {
      path: '/production/production-plan',
      element: (
        <PageGuard pageCode="PP1010">
          <ProductionPlanList />
        </PageGuard>
      )
    },
    {
      path: '/production/production-plan/add',
      element: (
        <PageGuard pageCode="PP1010">
          <ProductionPlanForm />
        </PageGuard>
      )
    },
    {
      path: '/production/production-plan/view/:id',
      element: (
        <PageGuard pageCode="PP1010">
          <ProductionPlanDetail />
        </PageGuard>
      )
    },
    {
      path: '/admin/organization-chart',
      element: (
        <PageGuard pageCode={PAGE_CODES.AD1190}>
          <OrganizationChart />
        </PageGuard>
      )
    },
    {
      path: '/dashboard/task-dashboard',
      element: <TaskDashboard />
    },
    {
      path: '/master/quality-control/aql-master',
      element: (
        <PageGuard pageCode="M10100">
          <AqlMasterIndex />
        </PageGuard>
      )
    },
    {
      path: '/master/quality-control/inspection-specification',
      element: (
        <PageGuard pageCode="M10200">
          <InspectionSpecificationIndex />
        </PageGuard>
      )
    },
    {
      path: '/master/qms/checklist/master',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_CHECKLIST}>
          <QmsMasterCheckList />
        </PageGuard>
      )
    },
    {
      path: '/master/qmt/machine-category',
      element: (
        <PageGuard pageCode="M3510">
          <MachineCategoryMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/qmt/machine',
      element: (
        <PageGuard pageCode="M3520">
          <MachineMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/qmt/machine/add',
      element: (
        <PageGuard pageCode="M3520">
          <MachineAddEditPage />
        </PageGuard>
      )
    },
    {
      path: '/master/qmt/machine/edit/:id',
      element: (
        <PageGuard pageCode="M3520">
          <MachineAddEditPage />
        </PageGuard>
      )
    },

    {
      path: '/master/maintenance/eb-slab',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_EB_SLAB}>
          <EbSlabMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/maintenance/eb-meter',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_EB_METER}>
          <EbMeterMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/maintenance/eb-power-consumption',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_EB_POWER_CONSUMPTION}>
          <EbPowerConsumptionMaster />
        </PageGuard>
      )
    },
    {
      path: '/qms/checklist/verify',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_CHECKLIST_VERIFY}>
          <QmsCheckListVerify />
        </PageGuard>
      )
    },
    {
      path: '/qms/checklist/close-renewal',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_CLOSE_RENEWAL}>
          <QmsCloseCheckListRenewal />
        </PageGuard>
      )
    },
    {
      path: '/qms/checklist/renewal-verify',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_RENEWAL_VERIFY}>
          <QmsCheckListRenewalVerify />
        </PageGuard>
      )
    },
    {
      path: '/qms/checklist/renewal-report',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_RENEWAL_REPORT}>
          <QmsCheckListRenewalReport />
        </PageGuard>
      )
    },
    {
      path: '/master/hr/department',
      element: (
        <PageGuard pageCode={PAGE_CODES.EMP_DEPARTMENT}>
          <MasterHrDepartment />
        </PageGuard>
      )
    },
    {
      path: '/master/hr/employee-type',
      element: (
        <PageGuard pageCode={PAGE_CODES.EMP_TYPE}>
          <EmployeeType />
        </PageGuard>
      )
    },
    {
      path: '/master/hr/ats',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_ATS}>
          <HraApplicationTrackingSystem />
        </PageGuard>
      )
    },
    {
      path: '/master/hr/ats/create',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_ATS}>
          <HraApplicantProfile />
        </PageGuard>
      )
    },
    {
      path: '/hr/employee/master',
      element: (
        <PageGuard pageCode={PAGE_CODES.EMP_MASTER}>
          <MasterHrEmployeeList />
        </PageGuard>
      )
    },
    {
      path: '/hr/employee/master/create',
      element: (
        <PageGuard pageCode={PAGE_CODES.EMP_MASTER}>
          <MasterHrEmployee />
        </PageGuard>
      )
    },
    {
      path: '/hr/employee/onboarding',
      element: (
        <PageGuard pageCode={PAGE_CODES.EMP_ONBOARDING}>
          <EmployeeOnboarding />
        </PageGuard>
      )
    },
    {
      path: '/hr/employee/onboarding/offer-letter',
      element: (
        <PageGuard pageCode={PAGE_CODES.EMP_ONBOARDING}>
          <OfferLetterPage />
        </PageGuard>
      )
    },
    {
      path: '/hr/employee/onboarding/relieving-order',
      element: (
        <PageGuard pageCode={PAGE_CODES.EMP_ONBOARDING}>
          <RelievingOrderPage />
        </PageGuard>
      )
    },
    {
      path: '/hr/employee/onboarding/appointment-order',
      element: (
        <PageGuard pageCode={PAGE_CODES.EMP_ONBOARDING}>
          <AppointmentOrderPage />
        </PageGuard>
      )
    },
    {
      path: '/master/hr/designation',
      element: (
        <PageGuard pageCode={PAGE_CODES.EMP_DESIGNATION}>
          <MasterHrDesignation />
        </PageGuard>
      )
    },
    {
      path: '/master/hr/grade',
      element: (
        <PageGuard pageCode={PAGE_CODES.EMP_GRADE}>
          <MasterHrGrade />
        </PageGuard>
      )
    },
    {
      path: '/master/hr/desg-level',
      element: (
        <PageGuard pageCode={PAGE_CODES.EMP_LEVEL}>
          <MasterHrDesignationLevel />
        </PageGuard>
      )
    },
    {
      path: '/master/qms/audit/type',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_AUDIT_TYPE}>
          <QmsAuditTypeMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/qms/audit/area',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_AUDIT_AREA}>
          <QmsAuditAreaMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/qms/audit/criteria',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_AUDIT_CRITERIA}>
          <QmsAuditCriteriaMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/npd/product-group',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_ITEM_GROUP}>
          <NpdItemGroupMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/product-master',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_PRODUCT_MASTER}>
          <NpdProductMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/product-master/add',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_PRODUCT_MASTER}>
          <NpdAddProduct />
        </PageGuard>
      )
    },
    {
      path: '/master/product-master/edit/:id',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_PRODUCT_MASTER}>
          <NpdAddProduct />
        </PageGuard>
      )
    },
    {
      path: '/master/npd/product-type',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_ITEM_TYPE}>
          <NpdItemTypeMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/npd/product-subtype',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_ITEM_SUBTYPE}>
          <NpdItemSubtypeMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/npd/product-oem',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_OEM}>
          <NpdOemMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/npd/product-oem-mapping',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_OEM_MAPPING}>
          <NpdOemMappingMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/npd/product-model',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_MODEL}>
          <NpdModelMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/npd/product-capacity',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_CAPACITY}>
          <NpdCapacityMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/npd/product-process',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_PROCESS}>
          <NpdProcessMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/npd/process/character-specification',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_CHARACTER_SPECIFICATION}>
          <NpdCharacterSpecificationMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/npd/process/sample-size',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_SAMPLE_SIZE}>
          <NpdSampleSizeMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/npd/process/sample-frequency',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_SAMPLE_FREQUENCY}>
          <NpdSampleFrequencyMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/npd/process/control-method',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_CONTROL_METHOD}>
          <NpdControlMethodMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/npd/process/feasibility-category',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_FEASIBILITY_CATEGORY}>
          <NpdFeasibilityCategoryMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/npd/process/corrective-action',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_CORRECTIVE_ACTION}>
          <NpdCorrectiveActionMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/npd/process/reaction-plan',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_REACTION_PLAN}>
          <NpdReactionPlanMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/npd/ppap/severity-fmea',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_SEVERITY_FMEA}>
          <NpdSeverityFmeaMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/npd/ppap/detection-fmea',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_DETECTION_FMEA}>
          <NpdDetectionFmeaMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/npd/ppap/occurance-fmea',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_OCCURANCE_FMEA}>
          <NpdOccuranceFmeaMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/npd/product-ipp',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_PRODUCT_IPP}>
          <NpdProductIPPMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/npd/wind-farm',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_WIND_FARM}>
          <NpdWindFarmMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/npd/inventory-type',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_INVENTORY_TYPE}>
          <NpdInventoryTypeMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/npd/material/material-type',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_MATERIAL_TYPE}>
          <NpdMaterialTypeMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/npd/material/material-grade',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_MATERIAL_GRADE}>
          <NpdMaterialGradeMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/npd/material/shape-master',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_SHAPE_MASTER}>
          <NpdShapeMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/npd/model-name',
      element: <NpdModelNameMaster />
    },
    {
      path: '/master/qms/meeting/master',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_MEETING}>
          <MeetingMaster />
        </PageGuard>
      )
    },
    {
      path: '/qms/meeting-schedule',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_MEETING_SCHEDULE}>
          <MeetingSchedule />
        </PageGuard>
      )
    },
    {
      path: '/qms/meeting-schedule/create',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_MEETING_SCHEDULE}>
          <AddMeetingSchedule />
        </PageGuard>
      )
    },
    {
      path: '/qms/meeting-schedule/edit/:id',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_MEETING_SCHEDULE}>
          <AddMeetingSchedule />
        </PageGuard>
      )
    },
    {
      path: '/qms/minutesofmeeting',
      children: [
        {
          path: '',
          element: (
            <PageGuard pageCode={PAGE_CODES.QMS_MOM}>
              <MeetingMinutes />
            </PageGuard>
          )
        },
        {
          path: 'add',
          element: (
            <PageGuard pageCode={PAGE_CODES.QMS_MOM}>
              <AddMeetingMinutes />
            </PageGuard>
          )
        },
        {
          path: 'edit/:id',
          element: (
            <PageGuard pageCode={PAGE_CODES.QMS_MOM}>
              <AddMeetingMinutes />
            </PageGuard>
          )
        }
      ]
    },
    {
      path: '/qms/meeting-attendance',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_MEETING_ATTENDANCE}>
          <MeetingAttendance />
        </PageGuard>
      )
    },
    {
      path: '/qms/close-mom',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_CLOSE_MOM}>
          <CloseMom />
        </PageGuard>
      )
    },
    {
      path: '/qms/mom-approval',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_MOM_APPROVAL}>
          <MomApproval />
        </PageGuard>
      )
    },
    {
      path: '/qms/momreport',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_MOM_REPORT}>
          <MomReport />
        </PageGuard>
      )
    },
    {
      path: '/qms/mom-summary-report',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_MOM_SUMMARY_REPORT}>
          <MomSummaryReport />
        </PageGuard>
      )
    },
    {
      path: '/qms/checklist/acknowledgement',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_CHECKLIST_ACKNOWLEDGEMENT}>
          <ChecklistAcknowledgement />
        </PageGuard>
      )
    },
    {
      path: '/qms/audit/schedule',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_AUDIT_SCHEDULE}>
          <QmsAuditScheduleList />
        </PageGuard>
      )
    },
    {
      path: '/qms/audit/schedule/add',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_AUDIT_SCHEDULE}>
          <QmsAddAuditSchedule />
        </PageGuard>
      )
    },
    {
      path: '/qms/audit/schedule/edit/:id',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_AUDIT_SCHEDULE}>
          <QmsAddAuditSchedule />
        </PageGuard>
      )
    },
    {
      path: '/qms/audit/attendance',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_AUDIT_ATTENDANCE}>
          <QmsAuditAttendance />
        </PageGuard>
      )
    },
    {
      path: '/qms/audit/observation',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_AUDIT_OBSERVATION}>
          <QmsAuditObservationList />
        </PageGuard>
      )
    },
    {
      path: '/qms/audit/observation/add',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_AUDIT_OBSERVATION}>
          <QmsAddAuditObservation />
        </PageGuard>
      )
    },
    {
      path: '/qms/audit/observation/edit/:id',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_AUDIT_OBSERVATION}>
          <QmsAddAuditObservation />
        </PageGuard>
      )
    },
    {
      path: '/qms/audit/ncr/close',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_AUDIT_NCR_CLOSE}>
          <QmsAuditNcrClose />
        </PageGuard>
      )
    },
    {
      path: '/qms/audit/ncr/approval',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_AUDIT_NCR_APPROVAL}>
          <QmsAuditNcrApproval />
        </PageGuard>
      )
    },
    {
      path: '/qms/audit/report',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_AUDIT_REPORT}>
          <QmsAuditReport />
        </PageGuard>
      )
    },
    {
      path: '/reports/qms/audit/report',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_AUDIT_REPORT}>
          <QmsAuditReport />
        </PageGuard>
      )
    },
    {
      path: '/qms/audit/score-report',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_AUDIT_REPORT}>
          <QmsAuditScoreReport />
        </PageGuard>
      )
    },
    {
      path: '/reports/qms/audit/score-report',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_AUDIT_REPORT}>
          <QmsAuditScoreReport />
        </PageGuard>
      )
    },
    {
      path: '/reports/qms/audit/vs-actual',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_AUDIT_VS_ACTUAL_REPORT}>
          <QmsAuditVsActualReport />
        </PageGuard>
      )
    },
    {
      path: '/qms/audit/vs-actual',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_AUDIT_VS_ACTUAL_REPORT}>
          <QmsAuditVsActualReport />
        </PageGuard>
      )
    },
    {
      path: '/employee-self-care/loan-apply',
      element: (
        <PageGuard pageCode={PAGE_CODES.QMS_LOAN_APPLY}>
          <QmsLoanApply />
        </PageGuard>
      )
    },
    {
      path: '/hra/payroll/loan-verification',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_LOAN_VERIFICATION}>
          <QmsLoanVerification />
        </PageGuard>
      )
    },
    {
      path: '/hra/payroll/loan-issue',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_LOAN_ISSUE}>
          <QmsLoanIssue />
        </PageGuard>
      )
    },
    {
      path: '/hra/payroll/loan-short-close',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_LOAN_SHORT_CLOSE}>
          <QmsLoanShortClose />
        </PageGuard>
      )
    },
    {
      path: '/sm/customers',
      element: (
        <PageGuard pageCode={PAGE_CODES.CRM_CUSTOMER}>
          <SmCustomerMasterList />
        </PageGuard>
      )
    },
    {
      path: '/sm/customers/create',
      element: (
        <PageGuard pageCode={PAGE_CODES.CRM_CUSTOMER}>
          <SmCustomerMaster />
        </PageGuard>
      )
    },
    {
      path: '/sm/contacts',
      element: (
        <PageGuard pageCode={PAGE_CODES.CRM_CONTACT}>
          <SmContactMasterList />
        </PageGuard>
      )
    },
    {
      path: '/sm/customer-address',
      element: <SmCustomerAddressList />
    },
    {
      path: '/sm/enquiry/dashboard',
      element: (
        <PageGuard pageCode={PAGE_CODES.SM_OCR_DASHBOARD}>
          <SmEnquiryDashboard />
        </PageGuard>
      )
    },
    {
      path: '/sm/price-master',
      element: (
        <PageGuard pageCode={PAGE_CODES.SM_PRICE_MASTER}>
          <SmPriceMasterList />
        </PageGuard>
      )
    },
    {
      path: '/sm/price-master/create',
      element: (
        <PageGuard pageCode={PAGE_CODES.SM_PRICE_MASTER}>
          <SmAddPriceMasterPage />
        </PageGuard>
      )
    },
    {
      path: '/sm/price-master/edit/:id',
      element: (
        <PageGuard pageCode={PAGE_CODES.SM_PRICE_MASTER}>
          <SmAddPriceMasterPage />
        </PageGuard>
      )
    },
    {
      path: '/sm/vendors',
      element: (
        <PageGuard pageCode={PAGE_CODES.VEN_SUPPLIER}>
          <SmSupplierList />
        </PageGuard>
      )
    },
    {
      path: '/sm/vendors/create',
      element: (
        <PageGuard pageCode={PAGE_CODES.VEN_SUPPLIER}>
          <SmSupplierMaster />
        </PageGuard>
      )
    },
    {
      path: '/sm/vendors/edit/:id',
      element: (
        <PageGuard pageCode={PAGE_CODES.VEN_SUPPLIER}>
          <SmSupplierMaster />
        </PageGuard>
      )
    },
    {
      path: '/sm/quotations',
      element: (
        <PageGuard pageCode={PAGE_CODES.SM_QUOTATION}>
          <SmQuotationList />
        </PageGuard>
      )
    },
    {
      path: '/sm/quotation/entry',
      element: (
        <PageGuard pageCode={PAGE_CODES.SM_QUOTATION}>
          <SmQuotationEntry />
        </PageGuard>
      )
    },
    {
      path: '/sm/quotation/entry/:id',
      element: (
        <PageGuard pageCode={PAGE_CODES.SM_QUOTATION}>
          <SmQuotationEntry />
        </PageGuard>
      )
    },
    {
      path: '/sm/quotation-follow-up',
      element: (
        <PageGuard pageCode={PAGE_CODES.SM_QUOTATION_FOLLOW_UP}>
          <SmQuotationFollowUp />
        </PageGuard>
      )
    },
    {
      path: '/sm/quotation-follow-up/entry',
      element: (
        <PageGuard pageCode={PAGE_CODES.SM_QUOTATION_FOLLOW_UP}>
          <SmQuotationFollowUpEntry />
        </PageGuard>
      )
    },
    {
      path: '/sm/quotation-follow-up/entry/:id',
      element: (
        <PageGuard pageCode={PAGE_CODES.SM_QUOTATION_FOLLOW_UP}>
          <SmQuotationFollowUpEntry />
        </PageGuard>
      )
    },
    {
      path: '/sm/enquiries',
      element: (
        <PageGuard pageCode={PAGE_CODES.SM_ENQUIRY}>
          <SmEnquiryList />
        </PageGuard>
      )
    },
    {
      path: '/sm/enquiries/create',
      element: (
        <PageGuard pageCode={PAGE_CODES.SM_ENQUIRY}>
          <SmEnquiryForm />
        </PageGuard>
      )
    },
    {
      path: '/sm/sales/customer/order-management',
      element: (
        <PageGuard pageCode={PAGE_CODES.SM_ORDER_MANAGEMENT}>
          <SmCustomerOrderManagementList />
        </PageGuard>
      )
    },
    {
      path: '/sm/sales/customer/order-schedule',
      element: (
        <PageGuard pageCode={PAGE_CODES.SM_CUSTOMER_ORDER_SCHEDULE}>
          <SmCustomerOrderScheduleList />
        </PageGuard>
      )
    },
    {
      path: '/sm/sales/customer/order-management/create',
      element: (
        <PageGuard pageCode={PAGE_CODES.SM_ORDER_MANAGEMENT}>
          <SmCustomerOrderForm />
        </PageGuard>
      )
    },
    {
      path: '/sm/sales/customer/order-schedule/create',
      element: (
        <PageGuard pageCode={PAGE_CODES.SM_CUSTOMER_ORDER_SCHEDULE}>
          <SmCustomerOrderScheduleForm />
        </PageGuard>
      )
    },
    {
      path: '/sm/sales/customer/order-management/edit/:id',
      element: (
        <PageGuard pageCode={PAGE_CODES.SM_ORDER_MANAGEMENT}>
          <SmCustomerOrderForm />
        </PageGuard>
      )
    },
    {
      path: '/sm/sales/customer/order-schedule/edit/:id',
      element: (
        <PageGuard pageCode={PAGE_CODES.SM_CUSTOMER_ORDER_SCHEDULE}>
          <SmCustomerOrderScheduleForm />
        </PageGuard>
      )
    },
    {
      path: '/sm/sales/customer/invoices',
      element: (
        <PageGuard pageCode={PAGE_CODES.SM_INVOICES}>
          <InvoiceList />
        </PageGuard>
      )
    },
    {
      path: '/sm/sales/customer/invoices/create',
      element: (
        <PageGuard pageCode={PAGE_CODES.SM_INVOICES}>
          <InvoiceForm />
        </PageGuard>
      )
    },
    {
      path: '/sm/sales/customer/invoices/edit/:id',
      element: (
        <PageGuard pageCode={PAGE_CODES.SM_INVOICES}>
          <InvoiceForm />
        </PageGuard>
      )
    },
    {
      path: '/sm/sales/customer/delivery-receipts',
      element: (
        <PageGuard pageCode={PAGE_CODES.SM_DELIVERY_RECEIPTS}>
          <DeliveryReceiptList />
        </PageGuard>
      )
    },
    {
      path: '/sm/sales/customer/delivery-receipts/create',
      element: (
        <PageGuard pageCode={PAGE_CODES.SM_DELIVERY_RECEIPTS}>
          <DeliveryReceiptForm />
        </PageGuard>
      )
    },
    {
      path: '/sm/sales/customer/delivery-receipts/edit/:id',
      element: (
        <PageGuard pageCode={PAGE_CODES.SM_DELIVERY_RECEIPTS}>
          <DeliveryReceiptForm />
        </PageGuard>
      )
    },

    {
      path: '/sm/ocr/segment-master',
      element: (
        <PageGuard pageCode={PAGE_CODES.LOG_SEGMENT}>
          <SegmentMaster />
        </PageGuard>
      )
    },
    {
      path: '/sm/ocr/sub-segment-master',
      element: (
        <PageGuard pageCode={PAGE_CODES.LOG_SUB_SEGMENT}>
          <SubSegmentMaster />
        </PageGuard>
      )
    },
    {
      path: '/sm/ocr/payment-terms',
      element: (
        <PageGuard pageCode={PAGE_CODES.LOG_PAYMENT_TERMS}>
          <PaymentTerms />
        </PageGuard>
      )
    },

    {
      path: '/master/finance/ledger-group',
      element: (
        <PageGuard pageCode="M9110">
          <LedgerGroup />
        </PageGuard>
      )
    },
    {
      path: '/master/finance/ledger',
      element: (
        <PageGuard pageCode="M9120">
          <FinanceLedgerMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/finance/tax-ledger',
      element: (
        <PageGuard pageCode="M9130">
          <TaxLedgerMaster />
        </PageGuard>
      )
    },

    {
      path: '/master/common/payment-terms',
      element: (
        <PageGuard pageCode={PAGE_CODES.LOG_PAYMENT_TERMS}>
          <PaymentTerms />
        </PageGuard>
      )
    },
    {
      path: '/master/sales/crm/potential',
      element: (
        <PageGuard pageCode={PAGE_CODES.CRM_POTENTIAL}>
          <CustomerPotentialMaster />
        </PageGuard>
      )
    },
    {
      path: '/sm/ocr/type-of-service',
      element: (
        <PageGuard pageCode={PAGE_CODES.SM_TYPE_OF_SERVICE}>
          <TypeOfService />
        </PageGuard>
      )
    },
    {
      path: '/support/raised-for-me',
      element: (
        <PageGuard pageCode={PAGE_CODES.SUPPORT_RAISED_FOR_ME}>
          <TicketManagement viewType="raised-for-me" />
        </PageGuard>
      )
    },
    {
      path: '/support/ticket-by-me',
      element: (
        <PageGuard pageCode={PAGE_CODES.SUPPORT_RAISED_BY_ME}>
          <TicketManagement viewType="raised-by-me" />
        </PageGuard>
      )
    },
    {
      path: '/support/notebook',
      element: (
        <PageGuard pageCode={PAGE_CODES.SUPPORT_NOTEBOOK}>
          <BOSNotebookAssistant />
        </PageGuard>
      )
    },

    {
      path: '/master/sales/logistics/additional-charges',
      element: (
        <PageGuard pageCode="M5310">
          <AdditionalChargesMaster />
        </PageGuard>
      )
    },
    {
      path: '/hra/ats',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_ATS}>
          <HraApplicationTrackingSystem />
        </PageGuard>
      )
    },
    {
      path: '/hra/ats/create',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_ATS}>
          <HraApplicantProfile />
        </PageGuard>
      )
    },
    {
      path: '/hra/ats/interview-process',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_INTERVIEW_PROCESS}>
          <HraInterviewProcess />
        </PageGuard>
      )
    },
    {
      path: '/hra/ats/interview-final-process',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_INTERVIEW_FINAL_PROCESS}>
          <HraInterviewFinalProcess />
        </PageGuard>
      )
    },
    {
      path: '/hra/employee/transfer',
      element: (
        <PageGuard pageCode={PAGE_CODES.EMPLOYEE_TRANSFER}>
          <HraEmployeeTransfer />
        </PageGuard>
      )
    },
    {
      path: '/hra/onboarding',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_EMPLOYEE_ONBOARDING}>
          <EmployeeOnboarding />
        </PageGuard>
      )
    },
    {
      path: '/hra/employee/onboarding',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_EMPLOYEE_ONBOARDING}>
          <EmployeeOnboardingTracking />
        </PageGuard>
      )
    },
    {
      path: '/hra/employee/onboarding/offer-letter',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_EMPLOYEE_ONBOARDING}>
          <OfferLetterPage />
        </PageGuard>
      )
    },
    {
      path: '/hra/employee/onboarding/relieving-order',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_EMPLOYEE_ONBOARDING}>
          <RelievingOrderPage />
        </PageGuard>
      )
    },
    {
      path: '/hra/employee/onboarding/appointment-order',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_EMPLOYEE_ONBOARDING}>
          <AppointmentOrderPage />
        </PageGuard>
      )
    },
    {
      path: '/hra/onboarding/offer-letter',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_EMPLOYEE_ONBOARDING}>
          <OfferLetterPage />
        </PageGuard>
      )
    },
    {
      path: '/hra/onboarding/relieving-order',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_EMPLOYEE_ONBOARDING}>
          <RelievingOrderPage />
        </PageGuard>
      )
    },
    {
      path: '/hra/onboarding/appointment-order',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_EMPLOYEE_ONBOARDING}>
          <AppointmentOrderPage />
        </PageGuard>
      )
    },

    {
      path: '/hra/employee/memo-list',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_EMPLOYEE_MEMO_LIST}>
          <HraEmployeeMemoList />
        </PageGuard>
      )
    },

    {
      path: '/hra/payroll/penalty',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_PAYROLL_PENALTY}>
          <HraPayrollPenalty />
        </PageGuard>
      )
    },
    {
      path: '/hra/payroll/leave-encashment-verified',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_LEAVE_ENCASHMENT_VERIFIED}>
          <HraLeaveEncashmentVerified />
        </PageGuard>
      )
    },
    {
      path: '/hra/payroll/leave-encashment-entry',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_LEAVE_ENCASHMENT_ENTRY}>
          <HraLeaveEncashmentEntry />
        </PageGuard>
      )
    },
    {
      path: '/hra/payroll/payroll-process',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_PAYROLL_PROCESS}>
          <HraPayrollProcess />
        </PageGuard>
      )
    },
    {
      path: '/hra/payroll/payroll-process-creation',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_PAYROLL_PROCESS}>
          <HraPayrollProcessCreate />
        </PageGuard>
      )
    },
    {
      path: '/hra/attendance/permission-details',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_ATTENDANCE_PERMISSION}>
          <HraPermissionDetails />
        </PageGuard>
      )
    },
    {
      path: '/hra/attendance/permission-deatils',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_ATTENDANCE_PERMISSION}>
          <HraPermissionDetails />
        </PageGuard>
      )
    },
    {
      path: '/hra/attendance/permission-entry',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_ATTENDANCE_PERMISSION}>
          <HraPermissionDetails />
        </PageGuard>
      )
    },
    {
      path: '/hra/attendance/permission-verification',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_ATTENDANCE_PERMISSION_VERIFICATION}>
          <HraPermissionVerification />
        </PageGuard>
      )
    },

    {
      path: '/hra/attendance/od-details',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_ATTENDANCE_OD_ENTRY}>
          <HraOdDetailsList />
        </PageGuard>
      )
    },

    {
      path: '/employee-self-care/leave/permission-apply',
      element: (
        <PageGuard pageCode={PAGE_CODES.SELF_CARE_PERMISSION_APPLY || PAGE_CODES.HRA_ATTENDANCE_PERMISSION}>
          <HraPermissionApply />
        </PageGuard>
      )
    },
    {
      path: '/employee-self-care/leave/permission-entry',
      element: (
        <PageGuard pageCode={PAGE_CODES.SELF_CARE_PERMISSION_APPLY || PAGE_CODES.HRA_ATTENDANCE_PERMISSION}>
          <HraPermissionApply />
        </PageGuard>
      )
    },
    {
      path: '/employee-self-care/leave/od-apply',
      element: (
        <PageGuard pageCode={PAGE_CODES.SELF_CARE_OD_APPLY || PAGE_CODES.HRA_ATTENDANCE_OD_ENTRY}>
          <HraOdApply />
        </PageGuard>
      )
    },

    {
      path: '/employee-self-care/leave-encashment-entry',
      element: <HraLeaveEncashmentEntry />
    },
    {
      path: '/hra/attendance/od-verify',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_ATTENDANCE_OD_VERIFY}>
          <HraOdVerifyList />
        </PageGuard>
      )
    },
    {
      path: '/hra/attendance/attendance-entry',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_ATTENDANCE_ENTRY}>
          <AttendanceEntry />
        </PageGuard>
      )
    },
    {
      path: '/hra/attendance/ot-master',
      element: (
        <PageGuard pageCode="HA1130">
          <OtMasterList />
        </PageGuard>
      )
    },
    {
      path: '/hra/attendance/ot-details',
      element: (
        <PageGuard pageCode="HA1347">
          <OtDetailsList />
        </PageGuard>
      )
    },
    {
      path: '/hra/attendance/ot-verify',
      element: (
        <PageGuard pageCode="HA1348">
          <OtVerifyList />
        </PageGuard>
      )
    },
    {
      path: '/hra/attendance-salary/biometric-attendance',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_BIOMETRIC_ATTENDANCE}>
          <BiometricAttendance />
        </PageGuard>
      )
    },
    {
      path: '/hra/satisfaction/dashboard',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_SATISFACTION_DASHBOARD}>
          <EmployeeSatisfactionDashboard />
        </PageGuard>
      )
    },
    {
      path: '/hra/satisfaction/vendor-dashboard',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_SATISFACTION_VENDOR_DASHBOARD}>
          <VendorSatisfactionDashboard />
        </PageGuard>
      )
    },
    {
      path: '/hra/satisfaction/customer-dashboard',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_SATISFACTION_CUSTOMER_DASHBOARD}>
          <CustomerSatisfactionDashboard />
        </PageGuard>
      )
    },
    {
      path: '/hra/satisfaction/internal-customer-dashboard',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_SATISFACTION_INTERNAL_CUSTOMER_DASHBOARD}>
          <InternalCustomerSatisfactionDashboard />
        </PageGuard>
      )
    },
    {
      path: '/hra/satisfaction/feedback-form',
      element: <EmployeeFeedbackPortal />
    },
    {
      path: '/hra/satisfaction/vendor-feedback',
      element: <VendorFeedbackPortal />
    },
    {
      path: '/hra/satisfaction/customer-feedback',
      element: <CustomerFeedbackPortal />
    },
    {
      path: '/hra/satisfaction/internal-feedback',
      element: <InternalCustomerFeedbackPortal />
    },
    {
      path: '/access-denied',
      element: <AccessDenied />
    },
    {
      path: '/master/hr/satisfaction',
      element: (
        <PageGuard pageCode={PAGE_CODES.EMP_SATISFACTION}>
          <SatisfactionCriteriaMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/hr/satisfaction/feedback-entry',
      element: (
        <PageGuard pageCode={PAGE_CODES.EMP_SATISFACTION}>
          <SatisfactionFeedbackEntry />
        </PageGuard>
      )
    },
    {
      path: '/qms/satisfaction/dashboard',
      element: (
        <PageGuard pageCode="QM1520">
          <QmsEmployeeSatisfactionDashboard />
        </PageGuard>
      )
    },
    {
      path: '/qms/satisfaction/feedback',
      element: (
        <PageGuard pageCode="QM1510">
          <QmsSatisfactionFeedbackEntry />
        </PageGuard>
      )
    },
    {
      path: '/qms/satisfaction/vendor-dashboard',
      element: (
        <PageGuard pageCode="QM1520">
          <UnderConstruction />
        </PageGuard>
      )
    },
    {
      path: '/qms/satisfaction/customer-dashboard',
      element: (
        <PageGuard pageCode="QM1520">
          <UnderConstruction />
        </PageGuard>
      )
    },
    {
      path: '/qms/satisfaction/internal-customer-dashboard',
      element: (
        <PageGuard pageCode="QM1520">
          <UnderConstruction />
        </PageGuard>
      )
    },
    {
      path: '/master/hr/payroll/holiday',
      element: (
        <PageGuard pageCode={PAGE_CODES.PAY_HOLIDAY}>
          <MasterHrHoliday />
        </PageGuard>
      )
    },
    {
      path: '/master/hr/payroll/bank',
      element: (
        <PageGuard pageCode={PAGE_CODES.PAY_BANK}>
          <BankMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/hr/payroll/shift',
      element: (
        <PageGuard pageCode={PAGE_CODES.PAY_SHIFT}>
          <ShiftMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/hr/payroll/loan',
      element: (
        <PageGuard pageCode={PAGE_CODES.PAY_LOAN}>
          <LoanMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/hr/payroll/month',
      element: (
        <PageGuard pageCode={PAGE_CODES.PAY_MONTH}>
          <MonthMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/hr/attendance/leave',
      element: (
        <PageGuard pageCode={PAGE_CODES.PAY_LEAVE}>
          <LeaveMaster />
        </PageGuard>
      )
    },
    {
      path: '/hra/attendance/leave-details',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_ATTENDANCE_LEAVE_DETAILS || 'HA1390'}>
          <LeaveDetails />
        </PageGuard>
      )
    },
    {
      path: '/hra/attendance/leave-entry',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_ATTENDANCE_LEAVE_DETAILS || 'HA1390'}>
          <LeaveDetails />
        </PageGuard>
      )
    },
    {
      path: '/hra/attendance/lta-details',
      element: (
        <PageGuard pageCode={PAGE_CODES.PAY_LTA_ENTRY}>
          <LeaveTravelEntry />
        </PageGuard>
      )
    },
    {
      path: '/employee-self-care/leave/leave-apply',
      element: (
        <PageGuard pageCode={PAGE_CODES.SELF_CARE_LEAVE_APPLICATION || 'M2390'}>
          <LeaveApply />
        </PageGuard>
      )
    },
    {
      path: '/employee-self-care/leave-application',
      element: (
        <PageGuard pageCode={PAGE_CODES.SELF_CARE_LEAVE_APPLICATION}>
          <LeaveApply />
        </PageGuard>
      )
    },
    {
      path: '/employee-self-care/lta-apply',
      element: (
        <PageGuard pageCode={PAGE_CODES.SELF_CARE_LEAVE_TRAVEL_APPLICATION}>
          <LeaveTravelApplication />
        </PageGuard>
      )
    },
    {
      path: '/hra/attendance/leave-verification',
      element: (
        <PageGuard pageCode={PAGE_CODES.HRA_ATTENDANCE_LEAVE_VERIFICATION || 'HA1392'}>
          <LeaveVerification />
        </PageGuard>
      )
    },
    {
      path: '/hra/attendance/lta-verification',
      element: (
        <PageGuard pageCode={PAGE_CODES.PAY_LTA_VERIFICATION}>
          <LeaveTravelVerification />
        </PageGuard>
      )
    },
    {
      path: '/hra/attendance/leave-config',
      element: (
        <PageGuard pageCode={PAGE_CODES.PAY_LEAVE_CONFIG}>
          <LeaveConfiguration />
        </PageGuard>
      )
    },
    {
      path: '/master/hr/payroll/petrol',
      element: (
        <PageGuard pageCode={PAGE_CODES.PAY_PETROL}>
          <PetrolAllowanceMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/hr/asset/group',
      element: (
        <PageGuard pageCode={PAGE_CODES.ASSET_GROUP}>
          <AssetGroupMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/hr/asset/type',
      element: (
        <PageGuard pageCode={PAGE_CODES.ASSET_TYPE}>
          <AssetTypeMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/hr/asset/subtype',
      element: (
        <PageGuard pageCode={PAGE_CODES.ASSET_SUB_TYPE}>
          <AssetSubTypeMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/hr/payroll/policy',
      element: (
        <PageGuard pageCode={PAGE_CODES.PAY_POLICY}>
          <UnderConstruction />
        </PageGuard>
      )
    },
    {
      path: '/master/sales/crm/satisfaction',
      element: (
        <PageGuard pageCode={PAGE_CODES.CRM_SATISFACTION}>
          <SatisfactionCriteriaMaster />
        </PageGuard>
      )
    },
    {
      path: '/master/sales/crm/satisfaction/feedback-entry',
      element: (
        <PageGuard pageCode={PAGE_CODES.CRM_SATISFACTION}>
          <SatisfactionFeedbackEntry />
        </PageGuard>
      )
    },

    {
      path: '/master/npd/material/material-condition',
      element: (
        <PageGuard pageCode={PAGE_CODES.M3340}>
          <NpdMaterialConditionMaster />
        </PageGuard>
      )
    },

    // ── Order Management routes ──
    {
      path: '/order/visitor-pass',
      element: (
        <PageGuard pageCode={PAGE_CODES.OM_VISITOR_GATE_PASS}>
          <OmVisitorGatePass />
        </PageGuard>
      )
    },
    {
      path: '/order/visitor-gate-entry',
      element: (
        <PageGuard pageCode={PAGE_CODES.OM_VISITOR_GATE_ENTRY || PAGE_CODES.OM_VISITOR_GATE_PASS}>
          <OmVisitorGateEntry />
        </PageGuard>
      )
    },
    {
      path: '/dd/product-bom',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_PRODUCT_BOM}>
          <BOMList />
        </PageGuard>
      )
    },
    {
      path: '/dd/product-bundle',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_PRODUCT_BUNDLE}>
          <ProductBundleList />
        </PageGuard>
      )
    },
    {
      path: '/dd/product-bundle/add',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_PRODUCT_BUNDLE}>
          <ProductBundleForm />
        </PageGuard>
      )
    },
    {
      path: '/dd/product-bundle/edit/:id',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_PRODUCT_BUNDLE}>
          <ProductBundleForm />
        </PageGuard>
      )
    },
    {
      path: '/dd/product-bom/add',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_PRODUCT_BOM}>
          <AddBOM />
        </PageGuard>
      )
    },
    {
      path: '/dd/product-bom/edit/:id',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_PRODUCT_BOM}>
          <AddBOM />
        </PageGuard>
      )
    },
    {
      path: '/dd/product-process',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_PRODUCT_PROCESS}>
          <DdProductProcess />
        </PageGuard>
      )
    },
    {
      path: '/dd/product-process/create',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_PRODUCT_PROCESS}>
          <DdProductProcessForm />
        </PageGuard>
      )
    },
    {
      path: '/dd/product-process/edit/:id',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_PRODUCT_PROCESS}>
          <DdProductProcessForm />
        </PageGuard>
      )
    },
    {
      path: '/dd/packing-procedure',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_PACKING_PROCEDURE}>
          <PackingProcedureList />
        </PageGuard>
      )
    },
    {
      path: '/dd/packing-procedure/add',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_PACKING_PROCEDURE}>
          <PackingProcedureForm />
        </PageGuard>
      )
    },
    {
      path: '/dd/packing-procedure/edit/:id',
      element: (
        <PageGuard pageCode={PAGE_CODES.NPD_PACKING_PROCEDURE}>
          <PackingProcedureForm />
        </PageGuard>
      )
    },
    {
      path: '/inventory/transaction-type',
      element: (
        <PageGuard pageCode={PAGE_CODES.INV_TRANSACTION_TYPE}>
          <ItemTransactionType />
        </PageGuard>
      )
    },
    {
      path: '/apps/chat',
      element: <AppChat />
    },
    {
      path: '/apps/mail',
      element: <AppMail />
    },
    {
      path: '/reports/purchase/batch-traceability',
      element: (
        <PageGuard pageCode={PAGE_CODES.PUR_BATCH_TRACEABILITY_REPORT}>
          <BatchTraceabilityReport />
        </PageGuard>
      )
    },
    {
      path: '/reports/inventory/current-stock',
      element: (
        <PageGuard pageCode={PAGE_CODES.INV_CURRENT_STOCK_REPORT}>
          <CurrentStockReport />
        </PageGuard>
      )
    },
    {
      path: '/reports/inventory/stock-ledger',
      element: (
        <PageGuard pageCode={PAGE_CODES.INV_STOCK_LEDGER_REPORT}>
          <StockLedgerReport />
        </PageGuard>
      )
    },
    {
      path: '/reports/inventory/rejection-stock',
      element: (
        <PageGuard pageCode={PAGE_CODES.INV_REJECTION_STOCK_REPORT}>
          <RejectionStockReport />
        </PageGuard>
      )
    },
    {
      path: '/reports/inventory/stock-movement',
      element: (
        <PageGuard pageCode={PAGE_CODES.INV_STOCK_MOVEMENT_REPORT}>
          <StockMovementReport />
        </PageGuard>
      )
    },
    {
      path: '/reports/finance/transaction',
      element: <FinanceTransactionReport />
    },
    {
      path: '/reports/finance/outstanding',
      element: <FinanceOutstandingReport />
    },
    {
      path: '/reports/unallocated-resource',
      element: (
        <PageGuard pageCode="QMS2001">
          <UnallocatedResourceReport />
        </PageGuard>
      )
    },
    {
      path: '/reports/qms/meeting/unallocated-resource',
      element: (
        <PageGuard pageCode="QMS2001">
          <UnallocatedResourceReport />
        </PageGuard>
      )
    },



    {
      path: '/purchase/pr/list',
      element: <PurchaseRequestList />
    },
    {
      path: '/purchase/pr/entry',
      element: <PurchaseRequestEntry />
    },
    {
      path: '/purchase/pr/entry/:id',
      element: <PurchaseRequestEntry />
    },
    {
      path: '/purchase/pr/print/:id',
      element: <PurchaseRequestPrint />
    },
    {
      path: '/purchase/rfq/list',
      element: <RfqList />
    },
    {
      path: '/purchase/rfq/entry',
      element: <RfqEntry />
    },
    {
      path: '/purchase/rfq/entry/:id',
      element: <RfqEntry />
    },
    {
      path: '/purchase/rfq/print/:id',
      element: <RfqPrint />
    },
    {
      path: '/purchase/quotation/list',
      element: <QuotationList />
    },
    {
      path: '/purchase/quotation/entry',
      element: <QuotationEntry />
    },
    {
      path: '/purchase/quotation/entry/:id',
      element: <QuotationEntry />
    },
    {
      path: '/purchase/negotiation/list',
      element: <QuoteNegotiationList />
    },
    {
      path: '/purchase/negotiation/entry',
      element: <QuoteNegotiationEntry />
    },
    {
      path: '/purchase/negotiation/entry/:id',
      element: <QuoteNegotiationEntry />
    },
    {
      path: '/purchase/comparison',
      element: <QuoteComparisonList />
    },
    {
      path: '/purchase/comparison/entry',
      element: <QuoteComparisonEntry />
    },
    {
      path: '/purchase/comparison/entry/:id',
      element: <QuoteComparisonEntry />
    },
    {
      path: '/purchase/po',
      element: <PurchaseOrderList />
    },
    {
      path: '/purchase/po/entry',
      element: <PurchaseOrderEntry />
    },
    {
      path: '/purchase/po/entry/:id',
      element: <PurchaseOrderEntry />
    },
    {
      path: '/purchase/po-schedule',
      element: <PurchaseOrderScheduleList />
    },
    {
      path: '/purchase/po-schedule/entry',
      element: <PurchaseOrderScheduleEntry />
    },
    {
      path: '/purchase/gate-entry/list',
      element: <GateEntryList />
    },
    {
      path: '/purchase/gate-entry/entry',
      element: <GateEntryEntry />
    },
    {
      path: '/purchase/gate-entry/entry/:id',
      element: <GateEntryEntry />
    },

    {
      path: '/purchase/goods-receipt/list',
      element: <GoodsReceiptList />
    },
    {
      path: '/purchase/goods-receipt/entry/:id',
      element: <GoodsReceiptEntry />
    },
    {
      path: '/purchase/quality-inspection',
      element: <QualityInspectionList />
    },
    {
      path: '/purchase/quality-inspection/form/:id',
      element: <QualityInspectionForm />
    },
    {
      path: '/purchase/supplier-return',
      element: <SupplierReturnList />
    },
    {
      path: '/purchase/supplier-return/:id',
      element: <SupplierReturnEntry />
    },
    {
      path: '/purchase/settings',
      element: <ProcurementSettings />
    },
    {
      path: '/vendor-licensing',
      element: <VendorLicensing />
    },

    {
      path: '*',
      element: <ErrorBoundary />
    }
  ],
  errorElement: <ErrorBoundary />
};

export default MainRoutes;
