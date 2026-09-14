/**
 * API Constants
 * Centralized source of truth for all backend endpoints.
 * This prevents typos and makes it easy to change paths globally.
 */

export const API_BASE = '/api';

export const API_PATHS = {
  // HRM Module
  HRM: {
    DEPARTMENTS: `${API_BASE}/master/hr/departments`,
    ACTIVE_DEPARTMENTS: `${API_BASE}/master/hr/departments/active`,
    DESIGNATIONS: `${API_BASE}/master/hr/designations`,
    CATEGORIES: `${API_BASE}/master/hr/categories`,
    LEVELS: `${API_BASE}/master/hr/levels`,
    DESIGNATION_LEVELS: `${API_BASE}/master/hr/designation-levels`,
    TYPES: `${API_BASE}/master/hr/employee-types`,
    EMPLOYEES: `${API_BASE}/master/hr/employees`,
    EMPLOYEES_LIST: `${API_BASE}/master/hr/employees/list`,
    GRADES: `${API_BASE}/master/hr/grades`,
    HOLIDAYS: `${API_BASE}/master/hr/holidays`,
    HOLIDAY_REQUESTS: `${API_BASE}/hra/holiday-requests`,
    LEAVE_REQUESTS: `${API_BASE}/hra/leave-requests`,
    USERS: `${API_BASE}/users/all`,
    DIVISIONS: `${API_BASE}/admin/divisions`,
    PROCESS_CONFIGS: `${API_BASE}/payroll/process-configs`,
    PETROL_ALLOWANCES: `${API_BASE}/master/hr/payroll/petrol`,
    ASSET_GROUP: `${API_BASE}/asset-group`,
    ASSET_TYPE: `${API_BASE}/asset-type`,
    ASSET_SUB_TYPE: `${API_BASE}/asset-sub-type`
  },

  // QMS Module
  QMS: {
    CHECKLIST: `${API_BASE}/qms/checklist`,
    AUDIT_TYPE: `${API_BASE}/master/qms/audit-type`,
    AUDIT_AREA: `${API_BASE}/master/qms/audit-area`,
    AUDIT_CRITERIA: `${API_BASE}/master/qms/audit-criteria`,
    AUDIT_SCHEDULE: `${API_BASE}/qms/audit-schedules`,
    AUDIT_ATTENDANCE: `${API_BASE}/qms/audit/attendance`,
    AUDIT_OBSERVATION: `${API_BASE}/qms/audit/observation`,
    AUDIT_NCR: `${API_BASE}/qms/audit/ncr`,
    MEETINGS: `${API_BASE}/qms/meetings`,
    MEETING_SCHEDULES: `${API_BASE}/qms/meeting-schedules`,
    MEETING_SCHEDULES_ACTIVE: `${API_BASE}/qms/meeting-schedules/active`,
    SCHEDULE_RULES: `${API_BASE}/qms/schedule-rules`,
    SCHEDULE_RULES_METADATA: `${API_BASE}/qms/schedule-rules/metadata`,
    SCHEDULE_RULES_SIMULATE: `${API_BASE}/qms/schedule-rules/simulate`,
    MEETING_ATTENDANCE: `${API_BASE}/qms/meeting-attendance`,
    MEETINGS_TODAY: `${API_BASE}/qms/meetings/today`,
    MOMS: `${API_BASE}/qms/moms`,
    MOMS_LIST: `${API_BASE}/qms/moms/list`,
    MOM_ACTIONS: `${API_BASE}/qms/moms/actions`,
    MOM_ACTIONS_PAGED: `${API_BASE}/qms/moms/actions/paged`,
    MOM_ACTIONS_SEARCH: `${API_BASE}/qms/moms/actions/search`,
    MOM_REPORTS: `${API_BASE}/qms/moms/reports`,
    MODEL_NAME: `${API_BASE}/master/qms/model-name`
  },

  // HRA Module
  HRA: {
    PENALTIES: `${API_BASE}/hra/penalties`,
    LEAVE_ENCASHMENT_VERIFIED: `${API_BASE}/hra/leave-encashment-verified`,
    ALL_INTERVIEWS: `${API_BASE}/hra/applicants/all-interviews`
  },

  // Admin Module
  ADMIN: {
    PREFERENCES: `${API_BASE}/preferences`,
    COMPANY: `${API_BASE}/company-profile`,
    CREDENTIALS: `${API_BASE}/users`,
    UOM: `${API_BASE}/master/admin/uom`
  },

  // SM (Sales & Marketing) Module
  SM: {
    CUSTOMERS: `${API_BASE}/sm/customers`,
    CONTACTS: `${API_BASE}/sm/contacts`,
    ENQUIRIES: `${API_BASE}/sm/enquiry`,
    PRICE_MASTER: `${API_BASE}/sm/price-master`,
    SUPPLIERS: `${API_BASE}/sm/suppliers`,
    SUB_CONTRACTORS: `${API_BASE}/sm/sub-contractors`,
    QUOTATIONS: `${API_BASE}/sm/quotation`,
    CUSTOMER_ORDERS: `${API_BASE}/sm/customer-orders`,
    INVOICES: `${API_BASE}/sm/invoices`,
    SEGMENTS: `${API_BASE}/sm/segments`,
    SUB_SEGMENTS: `${API_BASE}/sm/sub-segments`,
    POTENTIAL: `${API_BASE}/master/sales/crm/potential`,
    ADDITIONAL_CHARGES: `${API_BASE}/sm/additional-charges`
  },

  // OCR Module (proxied through Spring Boot)
  OCR: {
    INBOX: `${API_BASE}/ocr/inbox`,
    MARK_READ: (id) => `${API_BASE}/ocr/inbox/${id}/mark-read`,
    PROCESSING: `${API_BASE}/ocr/processing-requests`,
    PROCESSING_BY_ID: (id) => `${API_BASE}/ocr/processing-requests/${id}`
  },

  NPD: {
    ITEM_GROUP: `${API_BASE}/master/npd/item-group`,
    PRODUCT_MASTER: `${API_BASE}/master/npd/product-master`,
    PRODUCT_MASTER_LIST: `${API_BASE}/master/npd/product-master/list`,
    PRODUCT_FORM_DATA: `${API_BASE}/master/npd/product-form-data`,
    BOM_MASTER: `${API_BASE}/master/npd/bom`,
    ITEM_TYPE: `${API_BASE}/master/npd/item-type`,
    ITEM_SUBTYPE: `${API_BASE}/master/npd/item-subtype`,
    ITEM_OEM: `${API_BASE}/master/npd/oem`,
    ITEM_OEM_MAPPING: `${API_BASE}/master/npd/oem-mapping`,
    ITEM_MODEL: `${API_BASE}/master/npd/model`,
    ITEM_CAPACITY: `${API_BASE}/master/npd/capacity`,
    WIND_FARMS: `${API_BASE}/master/npd/wind-farm`,
    HSN_MASTER: `${API_BASE}/admin/hsn-codes`,
    PROCESS: `${API_BASE}/master/npd/process`,
    PRODUCT_PROCESS: `${API_BASE}/dd/product-process`,
    PRODUCT_IPP: `${API_BASE}/master/npd/product-ipp`,
    CHARACTER_SPECIFICATION: `${API_BASE}/master/npd/process/character-specification`,
    SAMPLE_SIZE: `${API_BASE}/master/npd/process/sample-size`,
    SAMPLE_FREQUENCY: `${API_BASE}/master/npd/process/sample-frequency`,
    CONTROL_METHOD: `${API_BASE}/master/npd/process/control-method`,
    FEASIBILITY_CATEGORY: `${API_BASE}/master/npd/process/feasibility-category`,
    CORRECTIVE_ACTION: `${API_BASE}/master/npd/process/corrective-action`,
    REACTION_PLAN: `${API_BASE}/master/npd/process/reaction-plan`,
    SEVERITY_FMEA: `${API_BASE}/master/npd/ppap/severity-fmea`,
    DETECTION_FMEA: `${API_BASE}/master/npd/ppap/detection-fmea`,
    OCCURANCE_FMEA: `${API_BASE}/master/npd/ppap/occurance-fmea`,
    INVENTORY_TYPE: `${API_BASE}/npd/inventory-types`,
    SHAPE: `${API_BASE}/npd/shapes`,
    MATERIAL_TYPE: `${API_BASE}/npd/material-types`,
    MATERIAL_GRADE: `${API_BASE}/npd/material-grades`,
    MATERIAL_CONDITIONS: `${API_BASE}/npd/material/conditions`
  },

  // Common/Infrastructure
  FILES: `${API_BASE}/files`,

  // Dashboard Module
  DASHBOARD: {
    OPERATIONAL_WIDGETS: `${API_BASE}/dashboard/operational/widgets`
  },

  // Production Plan Module
  PRODUCTION_PLAN: {
    BASE: `${API_BASE}/production-plans`,
    SOURCES: `${API_BASE}/production-plans/sources`,
    SOURCE_ITEMS: `${API_BASE}/production-plans/source-items`,
    CALCULATE_PREVIEW: `${API_BASE}/production-plans/calculate-preview`,
    RELEASE: (planNo) => `${API_BASE}/production-plans/${planNo}/release`,
    CANCEL: (planNo) => `${API_BASE}/production-plans/${planNo}/cancel`,
    GENERATE_PR: (planNo) => `${API_BASE}/production-plans/${planNo}/generate-purchase-requests`
  }
};
