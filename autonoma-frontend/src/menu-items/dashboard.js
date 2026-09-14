// assets
import { IconDashboard, IconDeviceAnalytics, IconFileInvoice, IconArticle, IconLifebuoy, IconClipboardList, IconTrendingUp, IconChartDots3 } from '@tabler/icons-react';
import { PAGE_CODES } from 'hooks/usePagePermissions';

const icons = {
  IconDashboard: IconDashboard,
  IconDeviceAnalytics: IconDeviceAnalytics,
  IconFileInvoice: IconFileInvoice,
  IconArticle: IconArticle,
  IconLifebuoy: IconLifebuoy,
  IconClipboardList: IconClipboardList,
  IconTrendingUp: IconTrendingUp,
  IconChartDots3: IconChartDots3
};

// ==============================|| MENU ITEMS - DASHBOARD ||============================== //

const dashboard = {
  id: 'dashboard',
  title: 'Dashboard',
  icon: icons.IconDashboard,
  type: 'group',
  children: [

    {
      id: 'user-task-queue',
      title: 'Unified Work Dashboard',
      type: 'item',
      url: '/dashboard/user-task-queue',
      icon: icons.IconClipboardList,
      pageCode: PAGE_CODES.DASHBOARD_UNIFIED,
      breadcrumbs: false
    },
    {
      id: 'task-dashboard',
      title: 'Task Dashboard',
      type: 'item',
      url: '/dashboard/task-dashboard',
      icon: icons.IconDashboard,
      pageCode: PAGE_CODES.DASHBOARD_TASK,
      breadcrumbs: false
    },
    {
      id: 'epm-dashboard',
      title: 'My Performance (EPM)',
      type: 'item',
      url: '/epm/dashboard',
      icon: icons.IconTrendingUp,
      pageCode: PAGE_CODES.DASHBOARD_EPM, // Uncomment if permission is required
      breadcrumbs: false
    }, {
      id: 'executive-command-center',
      title: 'Executive Command Center',
      type: 'item',
      url: '/dashboard/executive',
      icon: icons.IconDeviceAnalytics,
      pageCode: PAGE_CODES.DASHBOARD_EXECUTIVE,
      breadcrumbs: false
    },
    {
      id: 'product-360-dashboard',
      title: 'Product 360 & Inventory Intelligence',
      type: 'item',
      url: '/dashboard/product-360',
      icon: icons.IconChartDots3,
      pageCode: PAGE_CODES.DASHBOARD_PRODUCT_360,
      breadcrumbs: false
    }
  ]
};

export default dashboard;
