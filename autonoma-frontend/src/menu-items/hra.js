import { PAGE_CODES } from 'hooks/usePagePermissions';
import {
  IconDashboard,
  IconBellRinging,
  IconUsers,
  IconBriefcase,
  IconBuildingFactory,
  IconAward,
  IconTruckDelivery,
  IconReceiptTax,
  IconTool,
  IconServerCog,
  IconListCheck,
  IconReport,
  IconHelp,
  IconChecks,
  IconRocket,
  IconMapPin,
  IconCoins,
  IconChartBar,
  IconChartPie,
  IconCreditCard,
  IconSettings,
  IconWorld,
  IconHierarchy,
  IconUserCheck,
  IconUserPlus,
  IconClipboardCheck,
  IconReportAnalytics,
  IconMessage2,
  IconCalendarEvent,
  IconFileCheck,
  IconNotes,
  IconBuilding,
  IconCertificate,
  IconShieldCheck,
  IconTags,
  IconFileText,
  IconFileInvoice,
  IconBuildingBank,
  IconClock,
  IconCalendar,
  IconLock,
  IconGasStation,
  IconTruck,
  IconRuler2,
  IconChartDonut,
  IconPlaneTilt,
  IconTractor,
  IconMoodSmile,
  IconSearch,
  IconCategory,
  IconRotate2,
  IconTicTac,
  IconTicket,
  IconTicketOff,
  IconBrain,
  IconRobot,
  IconSparkles,
  IconCoin,
  IconCircleX,
  IconAlertTriangle,
  IconCash,
  IconMailForward,
  IconNotebook,
  IconTimeline,
  IconPackage,
  IconDatabase,
  IconUserShield,
  IconTarget,
  IconClipboardList,
  IconCpu,
  IconForklift,
  IconBusinessplan,
  IconPencilCog,
  IconTools,
  IconLifebuoy,
  IconShoppingCart,
  IconList,
  IconShield,
  IconFlame,
  IconBuildingSkyscraper,
  IconFingerprint,
  IconAccessible,
  IconHistory,
  IconActivity,
  IconBrandWhatsapp,
  IconDatabaseExport,
  IconFileAnalytics,
  IconTemplate,
  IconPlayerPlay,
  IconCalculator
} from '@tabler/icons-react';

import {
  Storage,
  AdminPanelSettings,
  TrackChanges,
  Assignment,
  PrecisionManufacturing,
  LocalShipping,
  AccountBalance,
  Architecture,
  Handyman,
  Verified,
  Analytics,
  SupportAgent,
  ShoppingCart as ShoppingCartMui,
  BusinessCenter as BusinessCenterIcon,
  EventAvailable as EventAvailableIcon,
  FlightTakeoff as FlightTakeoffIcon
} from '@mui/icons-material';

import { withMuiIcon } from 'utils/withMuiIcon.jsx';

const SolidIcons = {
  Master: withMuiIcon(Storage),
  HRA: withMuiIcon(AdminPanelSettings),
  Sales: withMuiIcon(TrackChanges),
  Planning: withMuiIcon(Assignment),
  Production: withMuiIcon(PrecisionManufacturing),
  Logistics: withMuiIcon(LocalShipping),
  Finance: withMuiIcon(AccountBalance),
  Design: withMuiIcon(Architecture),
  Maintenance: withMuiIcon(Handyman),
  QMS: withMuiIcon(Verified),
  Reports: withMuiIcon(Analytics),
  Support: withMuiIcon(SupportAgent),
  Order: withMuiIcon(ShoppingCartMui)
};

const icons = {
  IconCalculator,
  IconList,
  IconShield,
  IconFlame,
  IconMailForward,
  IconNotebook,
  IconPackage,
  IconDashboard,
  IconBellRinging,
  IconCategory,
  IconAlertTriangle,
  IconUsers,
  IconBriefcase,
  IconBuildingFactory,
  IconAward,
  IconTruckDelivery,
  IconReceiptTax,
  IconTool,
  IconServerCog,
  IconListCheck,
  IconReport,
  IconHelp,
  IconChecks,
  IconRocket,
  IconMapPin,
  IconCoins,
  IconCoin,
  IconCircleX,
  IconChartBar,
  IconChartPie,
  IconCreditCard,
  IconSettings,
  IconWorld,
  IconHierarchy,
  IconUserCheck,
  IconUserPlus,
  IconClipboardCheck,
  IconReportAnalytics,
  IconMessage2,
  IconCalendarEvent,
  IconFileCheck,
  IconNotes,
  IconBuilding,
  IconCertificate,
  IconShieldCheck,
  IconTags,
  IconFileText,
  IconFileInvoice,
  IconBuildingBank,
  IconClock,
  IconCalendar,
  IconLock,
  IconGasStation,
  IconTruck,
  IconRuler2,
  IconChartDonut,
  IconPlaneTilt,
  IconTractor,
  IconMoodSmile,
  IconSearch,
  IconRotate2,
  IconBrain,
  IconRobot,
  IconSparkles,
  IconTimeline,
  IconCash,
  IconUserShield,
  IconBuildingSkyscraper,
  IconFingerprint,
  IconAccessible,
  IconHistory,
  IconActivity,
  IconBrandWhatsapp,
  IconDatabaseExport,
  IconFileAnalytics,
  IconTemplate,
  IconPlayerPlay,
  IconPencilCog
};




export const hrms = {
  id: 'hra',
  title: 'HRA',
  caption: 'HR & Admin HA0000',
  type: 'group',
  icon: SolidIcons.HRA,
  children: [
    {
      id: 'hra-admin-menu-collapse',
      title: 'HR Admin',
      type: 'collapse',
      icon: icons.IconBriefcase,
      children: [
        {
          id: 'hra-ats-menu-collapse',
          title: 'ATS',
          type: 'collapse',
          icon: icons.IconTimeline,
          children: [
            {
              id: 'hra-ats-interview-process',
              title: 'Interview Process',
              type: 'item',
              url: '/hra/ats/interview-process',
              icon: icons.IconRotate2,
              pageCode: 'HA1120'
            },
            {
              id: 'hra-ats-interview-final-process',
              title: 'Interview Final Process',
              type: 'item',
              url: '/hra/ats/interview-final-process',
              icon: icons.IconUserCheck,
              pageCode: 'HA1130'
            }
          ]
        },
        {
          id: 'hra-ats-collapse',
          title: 'Induction',
          type: 'collapse',
          icon: icons.IconUserPlus,
          children: [
            {
              id: 'master-hr-ats-induction-assignment',
              title: 'Induction Pending',
              type: 'item',
              url: '/hra/ats/induction-assignment',
              icon: icons.IconCalendarEvent,
              pageCode: 'HA1410'
            },
            {
              id: 'master-hr-ats-induction-training',
              title: 'Induction Training',
              type: 'item',
              url: '/hra/ats/induction-training',
              icon: icons.IconClipboardCheck,
              pageCode: 'HA1420'
            },
            {
              id: 'master-hr-ats-induction-trainee',
              title: 'Induction Trainee',
              type: 'item',
              url: '/hra/ats/induction-trainee',
              icon: icons.IconUserCheck,
              pageCode: 'HA1430'
            }
          ]
        },
        {
          id: 'hra-employee-collapse',
          title: 'Employee',
          type: 'collapse',
          icon: icons.IconUsers,
          children: [
            {
              id: 'hra-employee-transfer',
              title: 'Employee Transfer',
              type: 'item',
              url: '/hra/employee/transfer',
              icon: icons.IconRotate2,
              pageCode: 'HA1280'
            },
            {
              id: 'hra-employee-memo-list',
              title: 'Employee Memo',
              type: 'item',
              url: '/hra/employee/memo-list',
              icon: icons.IconNotebook,
              pageCode: 'HA1285'
            }
          ]
        },
        {
          id: 'hra-onboarding-collapse',
          title: 'Onboarding',
          type: 'collapse',
          icon: icons.IconClipboardCheck,
          children: [
            {
              id: 'hra-onboarding-offer-letter',
              title: 'Offer Letter',
              type: 'item',
              url: '/hra/onboarding/offer-letter',
              icon: icons.IconFileText,
              pageCode: 'HA1360'
            },
            {
              id: 'hra-onboarding-appointment-order',
              title: 'Appointment Order',
              type: 'item',
              url: '/hra/onboarding/appointment-order',
              icon: icons.IconFileCheck,
              pageCode: 'HA1370'
            },
            {
              id: 'hra-onboarding-relieving-order',
              title: 'Relieving Order',
              type: 'item',
              url: '/hra/onboarding/relieving-order',
              icon: icons.IconFileInvoice,
              pageCode: PAGE_CODES.HRA_ONBOARDING_RELIEVING_ORDER || 'HA1388'
            }
          ]
        },

        {
          id: 'hra-payroll-collapse',
          title: 'Payroll',
          type: 'collapse',
          icon: icons.IconCash,
          children: [
            {
              id: 'hra-payroll-penalty',
              title: 'Penalty',
              type: 'item',
              url: '/hra/payroll/penalty',
              icon: icons.IconAlertTriangle,
              pageCode: 'HA1290'
            },
            {
              id: 'hra-payroll-loan-verification',
              title: 'Loan Verification',
              type: 'item',
              url: '/hra/payroll/loan-verification',
              icon: icons.IconShieldCheck,
              pageCode: 'HA1291'
            },
            {
              id: 'hra-payroll-loan-issue',
              title: 'Loan Issue',
              type: 'item',
              url: '/hra/payroll/loan-issue',
              icon: icons.IconCoin,
              pageCode: 'HA1292'
            },
            {
              id: 'hra-payroll-loan-short-close',
              title: 'Loan Short Close',
              type: 'item',
              url: '/hra/payroll/loan-short-close',
              icon: icons.IconCircleX,
              pageCode: 'HA1293'
            },
            {
              id: 'hra-payroll-leave-encashment-entry',
              title: 'Leave Encashment Entry',
              type: 'item',
              url: '/hra/payroll/leave-encashment-entry',
              icon: icons.IconCash,
              pageCode: 'HA1294'
            },
            {
              id: 'hra-payroll-leave-encashment',
              title: 'Leave Encashment Verified',
              type: 'item',
              url: '/hra/payroll/leave-encashment-verified',
              icon: icons.IconFileCheck,
              pageCode: 'HA1295'
            },
            {
              id: 'hra-payroll-process',
              title: 'Payroll Processing',
              type: 'item',
              url: '/hra/payroll/payroll-process',
              icon: icons.IconCalculator,
              pageCode: 'HA1296'
            }
          ]
        },
        {
          id: 'hra-attendance-collapse',
          title: 'Attendance',
          type: 'collapse',
          icon: icons.IconCalendar,
          children: [
            {
              id: 'hra-attendance-leave-collapse',
              title: 'Leave',
              type: 'collapse',
              icon: withMuiIcon(EventAvailableIcon),
              children: [
                {
                  id: 'hra-attendance-leave-entry',
                  title: 'Leave Details',
                  type: 'item',
                  url: '/hra/attendance/leave-details',
                  icon: withMuiIcon(EventAvailableIcon),
                  pageCode: PAGE_CODES.HRA_ATTENDANCE_LEAVE_DETAILS || 'HA1390'
                },
                {
                  id: 'hra-attendance-leave-verification',
                  title: 'Leave Verification',
                  type: 'item',
                  url: '/hra/attendance/leave-verification',
                  icon: withMuiIcon(Verified),
                  pageCode: PAGE_CODES.HRA_ATTENDANCE_LEAVE_VERIFICATION || 'HA1392'
                },
                {
                  id: 'hra-attendance-lta-details',
                  title: 'Leave Travel Allowance Details',
                  type: 'item',
                  url: '/hra/attendance/lta-details',
                  icon: withMuiIcon(FlightTakeoffIcon),
                  pageCode: PAGE_CODES.HRA_ATTENDANCE_LTA_DETAILS || 'HA1396'
                },
                {
                  id: 'hra-attendance-lta-verification',
                  title: 'Leave Travel Allowance Verification',
                  type: 'item',
                  url: '/hra/attendance/lta-verification',
                  icon: withMuiIcon(Verified),
                  pageCode: PAGE_CODES.HRA_ATTENDANCE_LTA_VERIFICATION || 'HA1394'
                },
                {
                  id: 'hra-attendance-leave-config',
                  title: 'Leave Configuration',
                  type: 'item',
                  url: '/hra/attendance/leave-config',
                  icon: icons.IconSettings,
                  pageCode: 'M2393'
                }
              ]
            },
            {
              id: 'hra-attendance-permission-collapse',
              title: 'Permission',
              type: 'collapse',
              icon: icons.IconClock,
              children: [
                {
                  id: 'hra-attendance-permission-entry',
                  title: 'Permission Details',
                  type: 'item',
                  url: '/hra/attendance/permission-details',
                  icon: icons.IconClock,
                  pageCode: 'HA1310'
                },
                {
                  id: 'hra-attendance-permission-verification',
                  title: 'Permission Verification',
                  type: 'item',
                  url: '/hra/attendance/permission-verification',
                  icon: icons.IconFileCheck,
                  pageCode: 'HA1315'
                }
              ]
            },
            {
              id: 'hra-attendance-od-collapse',
              title: 'OD (On-Duty)',
              type: 'collapse',
              icon: withMuiIcon(BusinessCenterIcon),
              children: [
                {
                  id: 'hra-attendance-od-details',
                  title: 'OD Details',
                  type: 'item',
                  url: '/hra/attendance/od-details',
                  icon: withMuiIcon(BusinessCenterIcon),
                  pageCode: 'HA1330'
                },
                {
                  id: 'hra-attendance-od-verify',
                  title: 'OD Verify',
                  type: 'item',
                  url: '/hra/attendance/od-verify',
                  icon: withMuiIcon(Verified),
                  pageCode: 'HA1342'
                }
              ]
            },
            {
              id: 'hra-attendance-ot-collapse',
              title: 'OT (Overtime)',
              type: 'collapse',
              icon: icons.IconClock,
              children: [
                {
                  id: 'hra-ot-details',
                  title: 'OT Details',
                  type: 'item',
                  url: '/hra/attendance/ot-details',
                  icon: icons.IconClock,
                  pageCode: 'HA1347'
                },
                {
                  id: 'hra-ot-verify',
                  title: 'OT Verify',
                  type: 'item',
                  url: '/hra/attendance/ot-verify',
                  icon: withMuiIcon(Verified),
                  pageCode: 'HA1348'
                }
              ]
            },
            {
              id: 'hra-attendance-entry-collapse',
              title: 'Entry',
              type: 'collapse',
              icon: icons.IconClipboardCheck,
              children: [
                {
                  id: 'hra-attendance-entry',
                  title: 'Attendance Entry',
                  type: 'item',
                  url: '/hra/attendance/attendance-entry',
                  icon: icons.IconClipboardCheck,
                  pageCode: 'HA1345'
                },
                {
                  id: 'hra-biometric-attendance',
                  title: 'Biometric Attendance',
                  type: 'item',
                  url: '/hra/attendance-salary/biometric-attendance',
                  icon: icons.IconFingerprint,
                  pageCode: 'HA1340'
                }
              ]
            }
          ]
        },

        {
          id: 'hra-satisfaction-dashboard-collapse',
          title: 'Satisfaction',
          type: 'collapse',
          icon: icons.IconDashboard,
          children: [
            {
              id: 'hra-employee-satisfaction-dashboard',
              title: 'Employee Satisfaction Dashboard',
              type: 'item',
              url: '/hra/satisfaction/dashboard',
              icon: icons.IconMoodSmile,
              pageCode: 'HA1350'
            },
            {
              id: 'hra-vendor-satisfaction-dashboard',
              title: 'Vendor Satisfaction Dashboard',
              type: 'item',
              url: '/hra/satisfaction/vendor-dashboard',
              icon: icons.IconChartBar,
              pageCode: 'HA1365'
            },
            {
              id: 'hra-customer-satisfaction-dashboard',
              title: 'Customer Satisfaction Dashboard',
              type: 'item',
              url: '/hra/satisfaction/customer-dashboard',
              icon: icons.IconChartPie,
              pageCode: 'HA1375'
            },
            {
              id: 'hra-internal-customer-satisfaction-dashboard',
              title: 'Internal Customer Satisfaction Dashboard',
              type: 'item',
              url: '/hra/satisfaction/internal-customer-dashboard',
              icon: icons.IconChartDonut,
              pageCode: 'HA1385'
            }
          ]
        },
        {
          id: 'visitor-pass-menu',
          title: 'Visitor Pass',
          type: 'collapse',
          icon: icons.IconFileCheck,
          children: [
            {
              id: 'order-visitor-pass',
              title: 'Visitor Pass',
              type: 'item',
              url: '/order/visitor-pass',
              icon: icons.IconFileCheck,
              pageCode: 'OM1000'
            },
            {
              id: 'visitor-gate-entry',
              title: 'Visitor Gate Entry',
              type: 'item',
              url: '/order/visitor-gate-entry',
              icon: icons.IconDoorEnter || icons.IconChecklist,
              pageCode: 'OM1001'
            }
          ]
        }
      ]
    },
    {
      id: 'it-admin-menu-collapse',
      title: 'IT Admin',
      type: 'collapse',
      icon: icons.IconServerCog,
      children: [
      ]
    },
    {
      id: 'boss-admin-menu-collapse',
      title: 'Bos(s) Admin',
      type: 'collapse',
      icon: icons.IconUserShield,
      children: [
        {
          id: 'org-management',
          title: 'Organization Management',
          type: 'collapse',
          icon: icons.IconBuildingSkyscraper,
          children: [
            {
              id: 'company-profile',
              title: 'Company Profile',
              type: 'item',
              url: '/admin/company-profile',
              icon: icons.IconBuildingSkyscraper,
              breadcrumbs: true,
              pageCode: 'AD1110'
            },
            {
              id: 'division-master',
              title: 'Divisions / Units',
              type: 'item',
              url: '/admin/division',
              icon: icons.IconCategory,
              breadcrumbs: true,
              pageCode: 'AD1120'
            },
            {
              id: 'organization-chart',
              title: 'Organization Chart',
              type: 'item',
              url: '/admin/organization-chart',
              icon: icons.IconUsers,
              breadcrumbs: true,
              pageCode: 'AD1190'
            }
          ]
        },
        {
          id: 'user-management',
          title: 'User & Security Management',
          type: 'collapse',
          icon: icons.IconFingerprint,
          children: [
            {
              id: 'user-credentials',
              title: 'User Credentials',
              type: 'item',
              url: '/admin/user-credentials',
              icon: icons.IconFingerprint,
              breadcrumbs: true,
              pageCode: 'AD1130'
            },
            {
              id: 'user-access',
              title: 'User Access',
              type: 'item',
              url: '/admin/user-access',
              icon: icons.IconAccessible,
              breadcrumbs: true,
              pageCode: 'AD1140'
            }
          ]
        },
        {
          id: 'monitoring-audit',
          title: 'Monitoring & Audit',
          type: 'collapse',
          icon: icons.IconTimeline,
          children: [
            {
              id: 'audit-trail',
              title: 'Audit Trail',
              type: 'item',
              url: '/admin/audit-trail',
              icon: icons.IconHistory,
              breadcrumbs: true,
              pageCode: 'AD1150'
            },
            {
              id: 'session-analytics',
              title: 'User Session Analytics',
              type: 'item',
              url: '/admin/session-analytics',
              icon: icons.IconTimeline,
              breadcrumbs: true,
              pageCode: 'AD1160'
            },
            {
              id: 'session-monitoring',
              title: 'Session Monitoring',
              type: 'item',
              url: '/admin/session-monitoring',
              icon: icons.IconActivity,
              breadcrumbs: true,
              pageCode: 'AD1240'
            },
            {
              id: 'whatsapp-credentials',
              title: 'WhatsApp Credentials',
              type: 'item',
              url: '/admin/whatsapp-credentials',
              icon: icons.IconBrandWhatsapp,
              breadcrumbs: true,
              pageCode: 'AD1230'
            },
            {
              id: 'client-notifications',
              title: 'Client Notifications',
              type: 'item',
              url: '/admin/notifications',
              icon: icons.IconBellRinging,
              breadcrumbs: true,
              pageCode: 'AD1310'
            }
          ]
        },
        {
          id: 'document-file-management',
          title: 'Document & File Management',
          type: 'collapse',
          icon: icons.IconDatabaseExport,
          children: [
            {
              id: 'document-search',
              title: 'Document Search',
              type: 'item',
              url: '/admin/document-search',
              icon: icons.IconSearch,
              breadcrumbs: true,
              pageCode: 'DM1010'
            },
            {
              id: 'file-traceability-hub',
              title: 'File Traceability Hub',
              type: 'item',
              url: '/admin/file-traceability-hub',
              icon: icons.IconFileAnalytics,
              breadcrumbs: true,
              pageCode: 'AD1170'
            },
            {
              id: 'report-template-designer',
              title: 'Report Template Designer',
              type: 'item',
              url: '/admin/report-template-designer',
              icon: icons.IconTemplate,
              breadcrumbs: true,
              pageCode: 'AD1200'
            }
          ]
        },
        {
          id: 'module-configuration',
          title: 'Module Configuration',
          type: 'collapse',
          icon: icons.IconSettings,
          children: [
            {
              id: 'payroll-workspace',
              title: 'HR Setting',
              type: 'item',
              url: '/admin/hr-settings',
              icon: icons.IconFileAnalytics,
              breadcrumbs: true,
              pageCode: 'AD1250'
            },
            {
              id: 'purchase-configuration',
              title: 'Purchase Configuration',
              type: 'item',
              url: '/purchase/settings',
              icon: icons.IconSettings,
              breadcrumbs: false
            }
          ]
        },
        {
          id: 'process-automation',
          title: 'Process Automation',
          type: 'collapse',
          icon: icons.IconRobot,
          children: [
            {
              id: 'prefix-suffix-configuration',
              title: 'Prefix/Suffix Credentials',
              type: 'item',
              url: '/admin/prefix-suffix-configuration',
              icon: icons.IconLock,
              breadcrumbs: true,
              pageCode: 'AD1230'
            },
            {
              id: 'automation-designer',
              title: 'Automation Designer',
              type: 'item',
              url: '/admin/automation-designer',
              icon: icons.IconPencilCog,
              breadcrumbs: true,
              pageCode: 'AD1270'
            },
            {
              id: 'trigger-configuration',
              title: 'Trigger Configuration',
              type: 'item',
              url: '/admin/trigger-configuration',
              icon: icons.IconServerCog,
              breadcrumbs: true,
              pageCode: 'AD1300'
            }
          ]
        }
      ]
    }
  ]
};

