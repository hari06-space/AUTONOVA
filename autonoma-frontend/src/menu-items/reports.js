import {
  IconDashboard,
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
  IconScale,
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
  IconFlame
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
  IconScale,
  IconList,
  IconShield,
  IconFlame,
  IconMailForward,
  IconNotebook,
  IconPackage,
  IconDashboard,
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
  IconShoppingCart
};

export const reports = {
  id: 'reports',
  title: 'Reports',
  caption: 'Reports R0000',
  type: 'group',
  icon: SolidIcons.Reports,
  children: [
    {
      id: 'reports-unallocated-resource',
      title: 'Unallocated Resource',
      type: 'item',
      url: '/reports/unallocated-resource',
      icon: icons.IconUsers,
      pageCode: 'QMS2001'
    },
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
    },
    {
      id: 'inventory-management',
      title: 'Inventory Management',
      type: 'collapse',
      icon: icons.IconCategory,
      children: [
        {
          id: 'reports-inventory-current-stock',
          title: 'Current Stock',
          type: 'item',
          url: '/reports/inventory/current-stock',
          icon: icons.IconReportAnalytics,
          pageCode: 'INV1001'
        },
        {
          id: 'reports-inventory-stock-ledger',
          title: 'Stock Ledger',
          type: 'item',
          url: '/reports/inventory/stock-ledger',
          icon: icons.IconFileText,
          pageCode: 'INV1002'
        },
        {
          id: 'reports-inventory-rejection-stock',
          title: 'Rejection Stock',
          type: 'item',
          url: '/reports/inventory/rejection-stock',
          icon: icons.IconCircleX,
          pageCode: 'INV1003'
        },
        {
          id: 'reports-inventory-stock-movement',
          title: 'Stock Movement',
          type: 'item',
          url: '/reports/inventory/stock-movement',
          icon: icons.IconTimeline,
          pageCode: 'INV1004'
        }
      ]
    },
    {
      id: 'purchase-reports',
      title: 'Purchase',
      type: 'collapse',
      icon: icons.IconShoppingCart,
      children: [
        {
          id: 'reports-purchase-batch-traceability',
          title: 'Batch Traceability Report',
          type: 'item',
          url: '/reports/purchase/batch-traceability',
          icon: icons.IconFileText,
          pageCode: 'PUR1001'
        }
      ]
    },
    {
      id: 'finance-accounts',
      title: 'Finance & Accounts',
      type: 'collapse',
      icon: SolidIcons.Finance,
      children: [
        {
          id: 'reports-finance-transactions',
          title: 'Finance Transaction',
          type: 'item',
          url: '/reports/finance/transaction',
          icon: icons.IconReportAnalytics,
          pageCode: 'FIN1001'
        },
        {
          id: 'reports-finance-outstanding',
          title: 'Finance Outstanding',
          type: 'item',
          url: '/reports/finance/outstanding',
          icon: icons.IconReportAnalytics,
          pageCode: 'FIN1002'
        }
      ]
    },
    {
      id: 'qms-reports',
      title: 'QMS',
      type: 'collapse',
      icon: icons.IconCertificate,
      children: [
        {
          id: 'reports-qms-audit',
          title: 'Audit',
          type: 'collapse',
          icon: icons.IconReportAnalytics,
          children: [
            {
              id: 'reports-qms-audit-report',
              title: 'Audit Report',
              type: 'item',
              url: '/reports/qms/audit/report',
              icon: icons.IconReport,
              pageCode: 'QM1260'
            },
            {
              id: 'reports-qms-audit-score-report',
              title: 'Audit Score Report',
              type: 'item',
              url: '/reports/qms/audit/score-report',
              icon: icons.IconReportAnalytics,
              pageCode: 'QM1270'
            },
            {
              id: 'reports-qms-audit-vs-actual',
              title: 'Audit vs Actual',
              type: 'item',
              url: '/reports/qms/audit/vs-actual',
              icon: icons.IconScale,
              pageCode: 'QM1280'
            }
          ]
        }
      ]
    }
  ]
};


