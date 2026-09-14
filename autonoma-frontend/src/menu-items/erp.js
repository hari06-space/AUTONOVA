import { PAGE_CODES } from 'hooks/usePagePermissions';
import {
  IconDashboard,
  IconUsers,
  IconBriefcase,
  IconBuildingFactory,
  IconAward,
  IconTruckDelivery,
  IconReceiptTax,
  IconTool,
  IconGauge,
  IconBolt,
  IconPlug,
  IconCalculator,
  IconLayersDifference as IconLayers,
  IconLayoutList,
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
  IconBuildingSkyscraper,
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
  IconChartLine
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
  IconMailForward,
  IconNotebook,
  IconPackage,
  IconDashboard,
  IconCategory,
  IconCpu,
  IconAlertTriangle,
  IconUsers,
  IconBriefcase,
  IconBuildingFactory,
  IconAward,
  IconTruckDelivery,
  IconReceiptTax,
  IconTool,
  IconGauge,
  IconBolt,
  IconPlug,
  IconCalculator,
  IconLayoutList,
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
  IconBuildingSkyscraper,
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
  IconTools
};

export const masters = {
  id: 'masters',
  title: 'Master',
  caption: 'Master Q0001',
  type: 'group',
  icon: SolidIcons.Master,
  children: [
    {
      id: 'master-hr',
      title: 'HR',
      type: 'collapse',
      icon: icons.IconUsers,
      children: [
        {
          id: 'master-hr-ats',
          title: 'ATS',
          type: 'collapse',
          icon: icons.IconTimeline,
          pageCode: 'M2100',
          children: [
            {
              id: 'hra-ats',
              title: 'Application Tracking System',
              type: 'item',
              url: '/hra/ats',
              icon: icons.IconBriefcase,
              pageCode: 'HA1110'
            },
            {
              id: 'hra-ats-interview',
              title: 'Interview Criteria Master',
              type: 'item',
              url: '/master/hr/ats/interview-criteria',
              icon: icons.IconClipboardCheck,
              pageCode: 'M2110'
            },
            {
              id: 'hra-ats-email',
              title: 'Email Content Master',
              type: 'item',
              url: '/master/hr/ats/email-content',
              icon: icons.IconMessage2,
              pageCode: 'M2120'
            },
            {
              id: 'hra-ats-verification',
              title: 'Applicant Verification Criteria',
              type: 'item',
              url: '/master/hr/ats/verification',
              icon: icons.IconShieldCheck,
              pageCode: 'M2130'
            },
            {
              id: 'master-hr-ats-induction',
              title: 'Induction Criteria',
              type: 'item',
              url: '/master/hr/ats/induction-criteria',
              icon: icons.IconUserPlus,
              pageCode: 'M2140'
            }
          ]
        },
        {
          id: 'master-hr-employee',
          title: 'Employee',
          type: 'collapse',
          icon: icons.IconUsers,
          pageCode: 'M2200',
          children: [
            {
              id: 'master-hr-employee-master',
              title: 'Employee Master',
              type: 'item',
              url: '/hr/employee/master',
              icon: icons.IconUserPlus,
              pageCode: 'M2210'
            },
            {
              id: 'master-hr-dept-details',
              title: 'Department',
              type: 'item',
              url: '/master/hr/department',
              icon: icons.IconBuilding,
              pageCode: 'M2230'
            },
            {
              id: 'master-hr-designation-level',
              title: 'Designation Level',
              type: 'item',
              url: '/master/hr/desg-level',
              icon: icons.IconHierarchy,
              pageCode: 'M2250'
            },
            {
              id: 'master-hr-designation-details',
              title: 'Designation',
              type: 'item',
              url: '/master/hr/designation',
              icon: icons.IconBriefcase,
              pageCode: 'M2240'
            },
            {
              id: 'master-hr-grade',
              title: 'Grade',
              type: 'item',
              url: '/master/hr/grade',
              icon: icons.IconAward,
              pageCode: 'M2260'
            },
            {
              id: 'master-hr-employee-type',
              title: 'Employee Type',
              type: 'item',
              url: '/master/hr/employee-type',
              icon: icons.IconTags,
              pageCode: 'M2220'
            },
            {
              id: 'master-hr-employee-satisfaction',
              title: 'Employee Satisfaction Criteria',
              type: 'item',
              url: '/master/hr/satisfaction',
              icon: icons.IconAward,
              pageCode: 'M2270'
            }
          ]
        },
        {
          id: 'master-hr-payroll',
          title: 'Payroll',
          type: 'collapse',
          icon: icons.IconCoins,
          pageCode: 'M2300',
          children: [
            {
              id: 'master-hr-payroll-holiday',
              title: 'Holiday Master',
              type: 'item',
              url: '/master/hr/payroll/holiday',
              icon: icons.IconCalendarEvent,
              pageCode: 'M2310'
            },
            {
              id: 'master-hr-payroll-shift',
              title: 'Shift',
              type: 'item',
              url: '/master/hr/payroll/shift',
              icon: icons.IconClock,
              pageCode: 'M2330'
            },
            {
              id: 'master-hr-payroll-policy',
              title: 'Policy Master',
              type: 'item',
              url: '/master/hr/payroll/policy',
              icon: icons.IconFileText,
              pageCode: 'M2380'
            },
            {
              id: 'master-hr-payroll-petrol',
              title: 'Petrol Allowance',
              type: 'item',
              url: '/master/hr/payroll/petrol',
              icon: icons.IconGasStation,
              pageCode: 'M2370'
            },
            {
              id: 'master-hr-payroll-loan',
              title: 'Loan Master',
              type: 'item',
              url: '/master/hr/payroll/loan',
              icon: icons.IconCoins,
              pageCode: 'M2340'
            },
            {
              id: 'master-hr-payroll-bank',
              title: 'Bank Details',
              type: 'item',
              url: '/master/hr/payroll/bank',
              icon: icons.IconBuildingBank,
              pageCode: 'M2320'
            }
          ]
        },
        {
          id: 'master-hr-attendance',
          title: 'Attendance',
          type: 'collapse',
          icon: icons.IconCalendar,
          pageCode: 'M2400',
          children: [
            {
              id: 'master-hr-attendance-leave',
              title: 'Leave Master',
              type: 'item',
              url: '/master/hr/attendance/leave',
              icon: icons.IconCalendar,
              pageCode: 'M2350'
            }
          ]
        }
      ]
    },
    {
      id: 'master-hr-asset',
      title: 'Asset',
      type: 'collapse',
      icon: icons.IconReportAnalytics,
      pageCode: 'M2500',
      children: [
        {
          id: 'master-hr-asset-group',
          title: 'Asset Group',
          type: 'item',
          url: '/master/hr/asset/group',
          icon: icons.IconCategory,
          pageCode: 'M2510'
        },
        {
          id: 'master-hr-asset-type',
          title: 'Asset Type',
          type: 'item',
          url: '/master/hr/asset/type',
          icon: icons.IconTags,
          pageCode: 'M2520'
        },
        {
          id: 'master-hr-asset-sub-type',
          title: 'Asset Sub Type',
          type: 'item',
          url: '/master/hr/asset/subtype',
          icon: icons.IconNotes,
          pageCode: 'M2530'
        }
      ]
    },
    {
      id: 'master-qms',
      title: 'QMS',
      type: 'collapse',
      icon: icons.IconListCheck,
      children: [
        {
          id: 'master-qms-checklist-parent',
          title: 'Check List',
          type: 'collapse',
          icon: icons.IconClipboardCheck,
          pageCode: 'M1200',
          children: [
            {
              id: 'master-qms-checklist',
              title: 'Check List Master',
              type: 'item',
              url: '/master/qms/checklist/master',
              icon: icons.IconClipboardCheck,
              pageCode: 'M1210'
            },
            {
              id: 'checklist-verify',
              title: 'Checklist Verify',
              type: 'item',
              url: '/qms/checklist/verify',
              icon: icons.IconChecks,
              pageCode: 'QM1110'
            }
          ]
        },
        {
          id: 'master-qms-audit',
          title: 'Audit',
          type: 'collapse',
          icon: icons.IconFileCheck,
          pageCode: 'M1100',
          children: [
            {
              id: 'master-qms-audit-area',
              title: 'Audit Area / Zone',
              type: 'item',
              url: '/master/qms/audit/area',
              icon: icons.IconMapPin,
              pageCode: 'M1120'
            },
            {
              id: 'master-qms-audit-type',
              title: 'Audit Type',
              type: 'item',
              url: '/master/qms/audit/type',
              icon: icons.IconNotes,
              pageCode: 'M1110'
            },
            {
              id: 'master-qms-audit-criteria',
              title: 'Audit Criteria',
              type: 'item',
              url: '/master/qms/audit/criteria',
              icon: icons.IconShieldCheck,
              pageCode: 'M1130'
            }
          ]
        },
        {
          id: 'master-qms-meeting',
          title: 'Meeting',
          type: 'collapse',
          icon: icons.IconMessage2,
          pageCode: 'M1300',
          children: [
            {
              id: 'master-qms-meeting-master',
              title: 'Meeting Master',
              type: 'item',
              url: '/master/qms/meeting/master',
              icon: icons.IconCalendarEvent,
              pageCode: 'M1310'
            }
          ]
        }
      ]
    },
    {
      id: 'master-qmt',
      title: 'QMT',
      type: 'collapse',
      icon: icons.IconTools,
      children: [
        {
          id: 'master-qmt-machine-category',
          title: 'Machine Category Master',
          type: 'item',
          url: '/master/qmt/machine-category',
          icon: icons.IconCategory,
          pageCode: 'M3510'
        },
        {
          id: 'master-qmt-machine',
          title: 'Machine',
          type: 'item',
          url: '/master/qmt/machine',
          icon: icons.IconCpu,
          pageCode: 'M3520'
        }
      ]
    },
    {
      id: 'master-maintenance',
      title: 'Maintenance',
      type: 'collapse',
      icon: icons.IconTool,
      pageCode: 'M1400',
      children: [
        {
          id: 'master-maintenance-eb-slab',
          title: 'EB Slab',
          type: 'item',
          url: '/master/maintenance/eb-slab',
          icon: icons.IconLayoutList,
          pageCode: 'M1410'
        },
        {
          id: 'master-maintenance-eb-meter',
          title: 'EB Meter',
          type: 'item',
          url: '/master/maintenance/eb-meter',
          icon: icons.IconPlug,
          pageCode: 'M1420'
        },
        {
          id: 'master-maintenance-eb-power-consumption',
          title: 'EB Power Consumption',
          type: 'item',
          url: '/master/maintenance/eb-power-consumption',
          icon: icons.IconCalculator,
          pageCode: 'M1430'
        }
      ]
    },
    {
      id: 'master-npd',
      title: 'NPD',
      type: 'collapse',
      icon: icons.IconRocket,
      children: [
        {
          id: 'master-npd-product',
          title: 'Product',
          type: 'collapse',
          icon: icons.IconBuildingFactory,
          children: [
            {
              id: 'master-product-master',
              title: 'Product',
              type: 'item',
              url: '/master/product-master',
              icon: icons.IconSettings,
              pageCode: 'M3115'
            },
            {
              id: 'master-product-bom',
              title: 'Product BOM',
              type: 'item',
              url: '/master/product-bom',
              icon: icons.IconPackage,
              pageCode: 'M3116'
            },
            {
              id: 'master-npd-inventory-type',
              title: 'Inventory Type',
              type: 'item',
              url: '/master/npd/inventory-type',
              icon: icons.IconTags,
              pageCode: 'M3230'
            },
            {
              id: 'master-npd-product-group',
              title: 'Product Item Group',
              type: 'item',
              url: '/master/npd/product-group',
              icon: icons.IconCategory,
              pageCode: 'M3110'
            },
            {
              id: 'master-npd-product-type',
              title: 'Product Item Type',
              type: 'item',
              url: '/master/npd/product-type',
              icon: icons.IconListCheck,
              pageCode: 'M3120'
            },
            {
              id: 'master-npd-product-subtype',
              title: 'Product Item Sub Type',
              type: 'item',
              url: '/master/npd/product-subtype',
              icon: icons.IconNotes,
              pageCode: 'M3130'
            },
            {
              id: 'master-npd-product-oem',
              title: 'Product OEM',
              type: 'item',
              url: '/master/npd/product-oem',
              icon: icons.IconBuilding,
              pageCode: 'M3140'
            },
            {
              id: 'master-npd-product-oem-mapping',
              title: 'Product OEM Mapping',
              type: 'item',
              url: '/master/npd/product-oem-mapping',
              icon: icons.IconHierarchy,
              pageCode: 'M3150'
            },
            {
              id: 'master-npd-product-model',
              title: 'Product Model',
              type: 'item',
              url: '/master/npd/product-model',
              icon: icons.IconSettings,
              pageCode: 'M3160'
            },
            {
              id: 'master-npd-product-capacity',
              title: 'Product Capacity',
              type: 'item',
              url: '/master/npd/product-capacity',
              icon: icons.IconAward,
              pageCode: 'M3170'
            },
            {
              id: 'master-npd-product-ipp',
              title: 'Product IPP',
              type: 'item',
              url: '/master/npd/product-ipp',
              icon: icons.IconPackage,
              pageCode: 'M3190'
            }
          ]
        },
        {
          id: 'master-npd-material',
          title: 'Material',
          type: 'collapse',
          icon: icons.IconCategory,
          pageCode: 'M3300',
          children: [
            {
              id: 'master-npd-material-type',
              title: 'Material Type',
              type: 'item',
              url: '/master/npd/material/material-type',
              icon: icons.IconTags,
              pageCode: 'M3310'
            },
            {
              id: 'master-npd-material-grade',
              title: 'Material Grade',
              type: 'item',
              url: '/master/npd/material/material-grade',
              icon: icons.IconAward,
              pageCode: 'M3320'
            },
            {
              id: 'master-npd-shape-master',
              title: 'Shape',
              type: 'item',
              url: '/master/npd/material/shape-master',
              icon: icons.IconRuler2,
              pageCode: 'M3330'
            },
            {
              id: 'master-npd-material-condition',
              title: 'Material Condition',
              type: 'item',
              url: '/master/npd/material/material-condition',
              icon: icons.IconChecks,
              pageCode: 'M3340'
            }
          ]
        },
        {
          id: 'master-npd-process',
          title: 'Process',
          type: 'collapse',
          icon: icons.IconBrain,
          children: [
            {
              id: 'master-npd-product-process',
              title: 'Process',
              type: 'item',
              url: '/master/npd/product-process',
              icon: icons.IconRotate2,
              pageCode: 'M3180'

            }
          ]
        },
        {
          id: 'master-npd-wind-farm',
          title: 'Wind Farm',
          type: 'item',
          url: '/master/npd/wind-farm',
          icon: icons.IconRocket,
          pageCode: 'M3210'
        }
      ]
    },
    {
      id: 'sm-supplier-master',
      title: 'Vendor Master',
      type: 'item',
      url: '/sm/vendors',
      icon: icons.IconTruckDelivery,
      pageCode: 'M4110'
    },
    {
      id: 'master-sales',
      title: 'Sales',
      type: 'collapse',
      icon: icons.IconBriefcase,
      children: [
        {
          id: 'master-sales-crm',
          title: 'CRM',
          type: 'collapse',
          icon: icons.IconUserCheck,
          children: [
            {
              id: 'master-sales-crm-contact',
              title: 'Contact Master',
              type: 'item',
              url: '/sm/contacts',
              icon: icons.IconUsers,
              pageCode: 'M5120'
            },
            {
              id: 'master-sales-crm-customer',
              title: 'Customer Master',
              type: 'item',
              url: '/sm/customers',
              icon: icons.IconBuilding,
              pageCode: 'M5130'
            },
            {
              id: 'master-sales-crm-potential',
              title: 'Customer Potential',
              type: 'item',
              url: '/master/sales/crm/potential',
              icon: icons.IconChartBar,
              pageCode: 'M5140'
            }
          ]
        },
        {
          id: 'master-sales-logistics',
          title: 'Terms & Logistics',
          type: 'collapse',
          icon: icons.IconTruck,
          children: [
            {
              id: 'master-sales-logistics-payment-terms',
              title: 'Terms Master',
              type: 'item',
              url: '/master/common/payment-terms',
              icon: icons.IconCreditCard,
              pageCode: 'M5210'
            },
            {
              id: 'master-sales-logistics-segment',
              title: 'Segment',
              type: 'item',
              url: '/sm/ocr/segment-master',
              icon: icons.IconChartPie,
              pageCode: 'M5270'
            },
            {
              id: 'master-sales-logistics-subsegment',
              title: 'Sub Segment',
              type: 'item',
              url: '/sm/ocr/sub-segment-master',
              icon: icons.IconChartDonut,
              pageCode: 'M5280'
            }
          ]
        }
      ]
    },
    {
      id: 'admin-masters',
      title: 'Admin',
      type: 'collapse',
      icon: icons.IconCategory,
      children: [
        {
          id: 'admin-additional-charges',
          title: 'Additional Charges Master',
          type: 'item',
          url: '/master/sales/logistics/additional-charges',
          icon: icons.IconReceiptTax,
          pageCode: 'M5310'
        },
        {
          id: 'admin-uom',
          title: 'UOM Master',
          type: 'item',
          url: '/master/admin/uom',
          icon: icons.IconRuler2,
          pageCode: 'M5240'
        },
        {
          id: 'admin-hsn-code',
          title: 'HSN Code Master',
          type: 'item',
          url: '/master/admin/hsn-code',
          icon: icons.IconReceiptTax,
          pageCode: 'M3220'
        },
        {
          id: 'admin-currency',
          title: 'Currency Master',
          type: 'item',
          url: '/master/admin/currency',
          icon: icons.IconCoin,
          pageCode: 'M5230'
        },
        {
          id: 'admin-country',
          title: 'Country Master',
          type: 'item',
          url: '/master/admin/country',
          icon: icons.IconWorld,
          pageCode: 'M5250'
        },
        {
          id: 'admin-state',
          title: 'State Master',
          type: 'item',
          url: '/master/admin/state',
          icon: icons.IconMapPin,
          pageCode: 'M5260'
        },
        {
          id: 'admin-city',
          title: 'City Master',
          type: 'item',
          url: '/master/admin/city',
          icon: icons.IconBuilding,
          pageCode: 'M5265'
        }
      ]
    }
  ]
};


export const hra = {
  id: 'hra',
  title: 'HRA',
  caption: 'HR & Admin HA0000',
  type: 'group',
  icon: SolidIcons.HRA,
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
          pageCode: 'QM1420'
        },
        {
          id: 'hra-payroll-loan-issue',
          title: 'Loan Issue',
          type: 'item',
          url: '/hra/payroll/loan-issue',
          icon: icons.IconCoin,
          pageCode: 'QM1430'
        },
        {
          id: 'hra-payroll-loan-short-close',
          title: 'Loan Short Close',
          type: 'item',
          url: '/hra/payroll/loan-short-close',
          icon: icons.IconCircleX,
          pageCode: 'QM1440'
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
    }
  ]
};

export const sm = {
  id: 'sm',
  title: 'Sales & Marketing',
  caption: 'Sales & Marketing SM0000',
  type: 'group',
  icon: SolidIcons.Sales,
  children: [
    {
      id: 'sm-sales-submenu',
      title: 'Sales',
      type: 'collapse',
      icon: icons.IconBriefcase,
      children: [
        {
          id: 'sm-order-management',
          title: 'Customer Order',
          type: 'item',
          url: '/sm/sales/customer/order-management',
          icon: icons.IconPackage,
          pageCode: 'SM1160'
        },
        {
          id: 'sm-order-schedule',
          title: 'Customer Order Schedule',
          type: 'item',
          url: '/sm/sales/customer/order-schedule',
          icon: icons.IconCalendarEvent,
          pageCode: 'SM1170'
        },
        {
          id: 'sm-delivery-receipts',
          title: 'Delivery Chellan (DC)',
          type: 'item',
          url: '/sm/sales/customer/delivery-receipts',
          icon: icons.IconTruckDelivery,
          pageCode: 'SM1190'
        },
        {
          id: 'sm-invoice-list',
          title: 'Sales Invoice',
          type: 'item',
          url: '/sm/sales/customer/invoices',
          icon: icons.IconFileInvoice,
          pageCode: 'SM1180'
        }
      ]
    },
    {
      id: 'sm-marketing-submenu',
      title: 'Marketing',
      type: 'collapse',
      icon: icons.IconWorld,
      children: [
        {
          id: 'sm-ocr-dashboard',
          title: 'OCR Dashboard',
          type: 'item',
          url: '/sm/enquiry/dashboard',
          icon: icons.IconDashboard,
          pageCode: 'SM1110'
        },
        {
          id: 'sm-customer-master',
          title: 'Customer Master',
          type: 'item',
          url: '/sm/customers',
          icon: icons.IconBuilding,
          pageCode: 'M5130'
        },
        {
          id: 'sm-enquiry',
          title: 'Enquiry',
          type: 'item',
          url: '/sm/enquiries',
          icon: icons.IconListCheck,
          pageCode: 'SM1120'
        },
        {
          id: 'sm-price-master',
          title: 'Price Master',
          type: 'item',
          url: '/sm/price-master',
          icon: icons.IconCoins,
          pageCode: 'SM1130'
        },
        {
          id: 'sm-quotation',
          title: 'Quotation',
          type: 'item',
          url: '/sm/quotations',
          icon: icons.IconReport,
          pageCode: 'SM1140'
        },
        {
          id: 'sm-quotation-follow-up',
          title: 'Quotation Follow Up',
          type: 'item',
          url: '/sm/quotation-follow-up',
          icon: icons.IconChartLine,
          pageCode: 'SM1141'
        }
      ]
    }
  ]
};



export const pp = {
  id: 'pp',
  title: 'Planning & Purchase',
  caption: 'Planning & Purchase PP0000',
  type: 'group',
  icon: SolidIcons.Planning,
  children: []
};

export const production = {
  id: 'production',
  title: 'Production',
  caption: 'Production P0000',
  type: 'group',
  icon: SolidIcons.Production,
  children: []
};


export const sl = {
  id: 'sl',
  title: 'Stores & Logistics',
  caption: 'Stores & Logistics SL0000',
  type: 'group',
  icon: SolidIcons.Logistics,
  children: []
};

export const fa = {
  id: 'fa',
  title: 'Finance & Accounts',
  caption: 'Finance & Accounts FA0000',
  type: 'group',
  icon: SolidIcons.Finance,
  children: []
};

export const dd = {
  id: 'dd',
  title: 'Design & Development',
  caption: 'Design & Development DD0000',
  type: 'group',
  icon: SolidIcons.Design,
  children: []
};

export const ms = {
  id: 'ms',
  title: 'Maintenance & Services',
  caption: 'Maintenance & Services MS0000',
  type: 'group',
  icon: SolidIcons.Maintenance,
  children: []
};

export const qms = {
  id: 'qms',
  title: 'QMS',
  caption: 'QMS QM0000',
  type: 'group',
  icon: SolidIcons.QMS,
  children: [
    {
      id: 'qms-checklist',
      title: 'Checklist',
      type: 'collapse',
      icon: icons.IconClipboardCheck,
      pageCode: 'QM1100',
      children: [
        {
          id: 'close-renewal',
          title: 'Close Checklist / Renewal',
          type: 'item',
          url: '/qms/checklist/close-renewal',
          icon: icons.IconFileCheck,
          pageCode: 'QM1120'
        },
        {
          id: 'renewal-verify',
          title: 'Checklist / Renewal Verify',
          type: 'item',
          url: '/qms/checklist/renewal-verify',
          icon: icons.IconShieldCheck,
          pageCode: 'QM1130'
        },
        {
          id: 'renewal-report',
          title: 'Checklist / Renewal Report',
          type: 'item',
          url: '/qms/checklist/renewal-report',
          icon: icons.IconReport,
          pageCode: 'QM1140'
        }
      ]
    },
    {
      id: 'qms-audit',
      title: 'Audit',
      type: 'collapse',
      icon: icons.IconFileCheck,
      pageCode: 'QM1200',
      children: [
        {
          id: 'qms-audit-schedule',
          title: 'Audit Schedule',
          type: 'item',
          url: '/qms/audit/schedule',
          icon: icons.IconCalendarEvent,
          pageCode: 'QM1210'
        },
        {
          id: 'qms-audit-attendance',
          title: 'Audit User Attendance',
          type: 'item',
          url: '/qms/audit/attendance',
          icon: icons.IconUserCheck,
          pageCode: 'QM1220'
        },
        {
          id: 'qms-audit-observation',
          title: 'Audit Observation',
          type: 'item',
          url: '/qms/audit/observation',
          icon: icons.IconReportAnalytics,
          pageCode: 'QM1230'
        },
        {
          id: 'qms-audit-ncr-close',
          title: 'Close NC / OFI',
          type: 'item',
          url: '/qms/audit/ncr/close',
          icon: icons.IconChecks,
          pageCode: 'QM1240'
        },
        {
          id: 'qms-audit-ncr-approval',
          title: 'Audit NC / OFI approval',
          type: 'item',
          url: '/qms/audit/ncr/approval',
          icon: icons.IconShieldCheck,
          pageCode: 'QM1250'
        }
      ]
    },
    {
      id: 'qms-meeting',
      title: 'Meeting',
      type: 'collapse',
      icon: icons.IconMessage2,
      pageCode: 'QM1300',
      children: [
        {
          id: 'qms-meeting-schedule',
          title: 'Meeting Schedule',
          type: 'item',
          url: '/qms/meeting-schedule',
          icon: icons.IconCalendarEvent,
          pageCode: 'QM1310'
        },
        {
          id: 'qms-meeting-attendance',
          title: 'Meeting User Attendance',
          type: 'item',
          url: '/qms/meeting-attendance',
          icon: icons.IconUserCheck,
          pageCode: 'QM1320'
        },
        {
          id: 'qms-minutes-of-meeting',
          title: 'Minutes of Meeting',
          type: 'item',
          url: '/qms/minutesofmeeting',
          icon: icons.IconNotes,
          pageCode: 'QM1330'
        },
        {
          id: 'qms-close-mom',
          title: 'Close MOM',
          type: 'item',
          url: '/qms/close-mom',
          icon: icons.IconFileCheck,
          pageCode: 'QM1340'
        },
        {
          id: 'qms-mom-approval',
          title: 'MOM Verify',
          type: 'item',
          url: '/qms/mom-approval',
          icon: icons.IconShieldCheck,
          pageCode: 'QM1350'
        },
        {
          id: 'qms-mom-report',
          title: 'MOM Report',
          type: 'item',
          url: '/qms/momreport',
          icon: icons.IconFileText,
          pageCode: 'QM1360'
        },
        {
          id: 'qms-mom-summary-report',
          title: 'MOM Summary Report',
          type: 'item',
          url: '/qms/mom-summary-report',
          icon: icons.IconChartBar,
          pageCode: 'QM1370'
        }
      ]
    }
  ]
};

export const reports = {
  id: 'reports',
  title: 'Reports',
  caption: 'Reports R0000',
  type: 'group',
  icon: SolidIcons.Reports,
  children: [
    {
      id: 'reports-hr-holiday-collapse',
      title: 'HR Holiday',
      type: 'collapse',
      icon: icons.IconCalendarEvent,
      children: [
        {
          id: 'reports-hr-holiday-calendar',
          title: 'Holiday Calendar',
          type: 'item',
          url: '/reports/hra/holiday-calendar',
          icon: icons.IconCalendar,
          pageCode: 'HA1240'
        },
        {
          id: 'reports-hr-holiday-summary',
          title: 'Employee Holiday Summary',
          type: 'item',
          url: '/reports/hra/employee-holiday-summary',
          icon: icons.IconReportAnalytics,
          pageCode: 'HA1250'
        }
      ]
    }
  ]
};

export const erpSupport = {
  id: 'erp-support',
  title: 'Support',
  caption: 'Support S0000',
  type: 'group',
  icon: SolidIcons.Support,
  children: [
    {
      id: 'support-ticket-management',
      title: 'Task Management',
      type: 'collapse',
      icon: icons.IconHelp,
      children: [
        {
          id: 'support-raised-by-me',
          title: 'My Requests',
          type: 'item',
          url: '/support/ticket-by-me',
          breadcrumbs: false,
          pageCode: 'S1110',
          icon: IconTicketOff
        },
        {
          id: 'support-raised-for-me',
          title: 'Requests For Me',
          type: 'item',
          url: '/support/raised-for-me',
          breadcrumbs: false,
          pageCode: 'S1120',
          icon: IconTicket
        },
        {
          id: 'support-notebook',
          title: 'Notebook Assistant',
          type: 'item',
          url: '/support/notebook',
          breadcrumbs: false,
          pageCode: 'S1130',
          icon: IconNotebook
        }
      ]
    }
  ]
};




