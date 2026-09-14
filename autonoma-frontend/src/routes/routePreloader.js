/**
 * Smart Route Preloader
 * Pre-imports lazy route components on menu hover so pages load instantly upon click.
 */

// Registry of page routes to their dynamic import functions
const routeImportMap = {
  // Purchase Module
  '/purchase/pr/list': () => import('views/purchase/PurchaseRequest/PurchaseRequestList'),
  '/purchase/pr/entry': () => import('views/purchase/PurchaseRequest/PurchaseRequestEntry'),
  '/purchase/rfq/list': () => import('views/purchase/Rfq/RfqList'),
  '/purchase/rfq/entry': () => import('views/purchase/Rfq/RfqEntry'),
  '/purchase/quotation/list': () => import('views/purchase/Quotation/QuotationList'),
  '/purchase/quotation/entry': () => import('views/purchase/Quotation/QuotationEntry'),
  '/purchase/quote-negotiation/list': () => import('views/purchase/QuoteNegotiation/QuoteNegotiationList'),
  '/purchase/quote-comparison/list': () => import('views/purchase/QuoteComparison/QuoteComparisonList'),
  '/purchase/po/list': () => import('views/purchase/PurchaseOrder/PurchaseOrderList'),
  '/purchase/po/entry': () => import('views/purchase/PurchaseOrder/PurchaseOrderEntry'),
  '/purchase/gate-entry/list': () => import('views/purchase/GateEntry/GateEntryList'),
  '/purchase/grn/list': () => import('views/purchase/GoodsReceipt/GoodsReceiptList'),
  '/purchase/qi/list': () => import('views/purchase/QualityInspection/QualityInspectionList'),
  '/purchase/supplier-return/list': () => import('views/purchase/SupplierReturn/SupplierReturnList'),

  // Dashboards
  '/dashboard/default': () => import('modules/dashboard/Default'),
  '/dashboard/analytics': () => import('modules/dashboard/Analytics'),
  '/dashboard/task-queue': () => import('modules/dashboard/UserTaskQueue'),
  '/dashboard/tasks': () => import('modules/dashboard/TaskDashboard'),
  '/dashboard/executive': () => import('modules/dashboard/Executive'),

  // HR / Admin
  '/admin/user-overview': () => import('modules/admin/UserOverview'),
  '/admin/user-access': () => import('modules/admin/UserAccess'),
  '/admin/company-profile': () => import('modules/admin/CompanyProfile'),
  '/client-management/client-master': () => import('modules/admin/ClientMaster'),
  '/admin/client-master': () => import('modules/admin/ClientMaster'),
  '/admin/session-monitoring': () => import('modules/admin/SessionMonitoring'),
  '/hr/employee-list': () => import('modules/hr/EmployeeList'),
  '/hr/department': () => import('modules/hr/DepartmentDetails'),
  '/hr/leave-apply': () => import('views/hra/Attendance/HraLeaveApply'),
  '/hr/leave-details': () => import('views/hra/Attendance/HraLeaveDetailsList'),
  '/hr/leave-verify': () => import('views/hra/Attendance/HraLeaveVerifyList')
};

const prefetchedRoutes = new Set();

/**
 * Prefetch route chunk JS file on hover
 * @param {string} url - Route URL
 */
export function prefetchRoute(url) {
  if (!url) return;

  const cleanUrl = url.split('?')[0].split('#')[0];

  if (prefetchedRoutes.has(cleanUrl)) return;

  // Direct map match
  if (routeImportMap[cleanUrl]) {
    prefetchedRoutes.add(cleanUrl);
    routeImportMap[cleanUrl]().catch(() => {
      prefetchedRoutes.delete(cleanUrl);
    });
    return;
  }

  // Dynamic matching for prefix pattern routes (e.g. /purchase/pr/entry/123 -> /purchase/pr/entry)
  for (const routeKey of Object.keys(routeImportMap)) {
    if (cleanUrl.startsWith(routeKey)) {
      prefetchedRoutes.add(cleanUrl);
      routeImportMap[routeKey]().catch(() => {
        prefetchedRoutes.delete(cleanUrl);
      });
      break;
    }
  }
}
