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
  IconCpu,
  IconRotate2,
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
  IconList,
  IconShield,
  IconFlame,
  IconBook2,
  IconShoppingCart,
  IconClipboardList
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
  ShoppingCart as ShoppingCartMui
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
  IconList,
  IconShield,
  IconFlame,
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
  IconBook2,
  IconShoppingCart,
  IconClipboardList
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
              icon: icons.IconMoodSmile,
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
        },
        {
          id: 'master-qmt-machine',
          title: 'Assets',
          type: 'item',
          url: '/master/qmt/machine',
          icon: icons.IconCpu,
          pageCode: 'M3520'
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
      id: 'master-purchase',
      title: 'Purchase',
      type: 'collapse',
      icon: icons.IconShoppingCart,
      children: [

      ]
    },
    {
      id: 'master-quality-control',
      title: 'Quality (QMC)',
      type: 'collapse',
      icon: icons.IconShield,
      pageCode: 'M10000',
      children: [
        {
          id: 'master-quality-aql',
          title: 'AQL/Sampling Plan',
          type: 'item',
          url: '/master/quality-control/aql-master',
          icon: icons.IconChecks,
          pageCode: 'M10100'
        },
        {
          id: 'master-quality-inspection-spec',
          title: 'Inspection Specification',
          type: 'item',
          url: '/master/quality-control/inspection-specification',
          icon: icons.IconClipboardList,
          pageCode: 'M10200'
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
            },
            {
              id: 'master-npd-character-specification',
              title: 'Character Specification',
              type: 'item',
              url: '/master/npd/process/character-specification',
              icon: icons.IconList,
              pageCode: 'M3360'
            },
            {
              id: 'master-npd-sample-size',
              title: 'Sample Size',
              type: 'item',
              url: '/master/npd/process/sample-size',
              icon: icons.IconRuler2,
              pageCode: 'M3370'
            },
            {
              id: 'master-npd-sample-frequency',
              title: 'Sample Frequency',
              type: 'item',
              url: '/master/npd/process/sample-frequency',
              icon: icons.IconClock,
              pageCode: 'M3380'
            },
            {
              id: 'master-npd-control-method',
              title: 'Control Method',
              type: 'item',
              url: '/master/npd/process/control-method',
              icon: icons.IconShield,
              pageCode: 'M3390'
            },
            {
              id: 'master-npd-feasibility-category',
              title: 'Feasibility Category',
              type: 'item',
              url: '/master/npd/process/feasibility-category',
              icon: icons.IconCategory,
              pageCode: 'M3400'
            },
            {
              id: 'master-npd-corrective-action',
              title: 'Corrective Action',
              type: 'item',
              url: '/master/npd/process/corrective-action',
              icon: icons.IconAlertTriangle,
              pageCode: 'M3410'
            },
            {
              id: 'master-npd-reaction-plan',
              title: 'Reaction Plan',
              type: 'item',
              url: '/master/npd/process/reaction-plan',
              icon: icons.IconFlame,
              pageCode: 'M3420'
            }
          ]
        },
        {
          id: 'master-npd-ppap',
          title: 'PPAP',
          type: 'collapse',
          icon: icons.IconReport,
          children: [
            {
              id: 'master-npd-ppap-severity-fmea',
              title: 'Severity FMEA',
              type: 'item',
              url: '/master/npd/ppap/severity-fmea',
              icon: icons.IconAlertTriangle,
              pageCode: 'M3430'
            },
            {
              id: 'master-npd-ppap-detection-fmea',
              title: 'Detection FMEA',
              type: 'item',
              url: '/master/npd/ppap/detection-fmea',
              icon: icons.IconSearch,
              pageCode: 'M3440'
            },
            {
              id: 'master-npd-ppap-occurance-fmea',
              title: 'Occurance FMEA',
              type: 'item',
              url: '/master/npd/ppap/occurance-fmea',
              icon: icons.IconTimeline,
              pageCode: 'M3450'
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
            },
          ]
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
    },
    {
      id: 'admin-masters',
      title: 'Admin',
      type: 'collapse',
      icon: icons.IconCategory,
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
          id: 'admin-additional-charges',
          title: 'Additional Charges',
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
    },
    {
      id: 'master-finance',
      title: 'Finance & Accounting',
      type: 'collapse',
      icon: icons.IconCash,
      children: [
        {
          id: 'master-finance-ledger-group',
          title: 'Ledger Group',
          type: 'item',
          url: '/master/finance/ledger-group',
          icon: icons.IconBook2,
          pageCode: 'M9110'
        },
        {
          id: 'master-finance-ledgers',
          title: 'Ledger',
          type: 'collapse',
          icon: icons.IconBook2,
          children: [
            {
              id: 'master-finance-customer',
              title: 'Customer',
              type: 'item',
              url: '/sm/customers',
              icon: icons.IconBuilding,
              pageCode: 'M5130'
            },
            {
              id: 'master-finance-supplier',
              title: 'Supplier',
              type: 'item',
              url: '/sm/vendors',
              icon: icons.IconTruckDelivery,
              pageCode: 'M4110'
            },
            {
              id: 'master-finance-ledger-finance',
              title: 'Finance',
              type: 'item',
              url: '/master/finance/ledger',
              icon: icons.IconBook2,
              pageCode: 'M9120'
            },
            {
              id: 'master-finance-ledger-tax',
              title: 'Tax',
              type: 'item',
              url: '/master/finance/tax-ledger',
              icon: icons.IconBook2,
              pageCode: 'M9130'
            }
          ]
        }
      ]
    }
  ]
};


