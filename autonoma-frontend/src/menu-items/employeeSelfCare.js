import { IconCalendarEvent, IconPlaneDeparture, IconCoins, IconClock, IconCash } from '@tabler/icons-react';
import { PAGE_CODES } from 'hooks/usePagePermissions';
import {
  ManageAccounts,
  EventAvailable as EventAvailableIcon,
  FlightTakeoff as FlightTakeoffIcon,
  Schedule as ScheduleIcon,
  BusinessCenter as BusinessCenterIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  RequestQuote as RequestQuoteIcon
} from '@mui/icons-material';
import { withMuiIcon } from 'utils/withMuiIcon.jsx';

const icons = {
  IconCalendarEvent,
  IconPlaneDeparture,
  IconCoins,
  IconClock,
  IconCash
};

const employeeselfcare = {
  id: 'employee-self-care',
  title: 'Employee Self Care',
  type: 'group',
  icon: withMuiIcon(ManageAccounts),
  children: [
    {
      id: 'leave-self-care',
      title: 'Attendance',
      type: 'collapse',
      icon: icons.IconCalendarEvent,
      children: [
        {
          id: 'leave-application-entry',
          title: 'Leave Apply',
          type: 'item',
          url: '/employee-self-care/leave-application',
          icon: withMuiIcon(EventAvailableIcon),
          pageCode: PAGE_CODES.SELF_CARE_LEAVE_APPLICATION,
          breadcrumbs: false
        },
        {
          id: 'leave-travel-application',
          title: 'Leave Travel Allowance Apply',
          type: 'item',
          url: '/employee-self-care/lta-apply',
          icon: withMuiIcon(FlightTakeoffIcon),
          pageCode: PAGE_CODES.SELF_CARE_LEAVE_TRAVEL_APPLICATION,
          breadcrumbs: false
        },
        {
          id: 'sc-leave-permission-entry',
          title: 'Permission Apply',
          type: 'item',
          url: '/employee-self-care/leave/permission-apply',
          icon: withMuiIcon(ScheduleIcon),
          pageCode: PAGE_CODES.SELF_CARE_PERMISSION_APPLY,
          breadcrumbs: false
        },
        {
          id: 'sc-leave-od-entry',
          title: 'OD Apply',
          type: 'item',
          url: '/employee-self-care/leave/od-apply',
          icon: withMuiIcon(BusinessCenterIcon),
          pageCode: PAGE_CODES.SELF_CARE_OD_APPLY,
          breadcrumbs: false
        },
        {
          id: 'sc-leave-encashment-entry',
          title: 'Leave Encashment Apply',
          type: 'item',
          url: '/employee-self-care/leave-encashment-entry',
          icon: withMuiIcon(AccountBalanceWalletIcon),
          pageCode: PAGE_CODES.SELF_CARE_LEAVE_ENCASHMENT_ENTRY,
          breadcrumbs: false
        }
      ]
    },
    {
      id: 'loan-self-care',
      title: 'Loan',
      type: 'collapse',
      icon: icons.IconCoins,
      children: [
        {
          id: 'loan-application-entry',
          title: 'Loan Apply',
          type: 'item',
          url: '/employee-self-care/loan-apply',
          icon: withMuiIcon(RequestQuoteIcon),
          pageCode: PAGE_CODES.QMS_LOAN_APPLY,
          breadcrumbs: false
        }
      ]
    }
  ]
};

export default employeeselfcare;
