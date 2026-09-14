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
  IconShieldHalf,
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
  IconCash
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
          id: 'checklist-acknowledgement',
          title: 'Checklist Acknowledgement',
          type: 'item',
          url: '/qms/checklist/acknowledgement',
          icon: icons.IconUserCheck,
          pageCode: 'QM1150'
        },
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
          title: 'Close NCR / OFI Verification',
          type: 'item',
          url: '/qms/audit/ncr/approval',
          icon: icons.IconShieldCheck,
          pageCode: 'QM1250'
        },
        {
          id: 'qms-audit-vs-actual',
          title: 'Audit vs Actual',
          type: 'item',
          url: '/qms/audit/vs-actual',
          icon: icons.IconScale,
          pageCode: 'QM1280'
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



