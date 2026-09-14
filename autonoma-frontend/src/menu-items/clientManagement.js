import {
  IconServer, IconActivity, IconBellRinging, IconUserPlus, IconUsers, IconShieldLock, IconSettings, IconBuildingSkyscraper,
  IconAccessPoint, IconHistory, IconLayoutColumns, IconTimeline,
  IconFingerprint, IconUserShield, IconCategory, IconFileAnalytics,
  IconDatabaseExport, IconAccessibleFilled, IconAccessible, IconBrandWhatsapp,
  IconPlayerPlay
} from '@tabler/icons-react';

const icons = {
  IconServer,
  IconActivity,
  IconBellRinging,
  IconUserPlus,
  IconUsers,
  IconShieldLock,
  IconSettings,
  IconBuildingSkyscraper,
  IconAccessPoint,
  IconHistory,
  IconLayoutColumns,
  IconTimeline,
  IconFingerprint,
  IconActivity,
  IconUserShield,
  IconCategory,
  IconFileAnalytics,
  IconDatabaseExport, IconAccessibleFilled, IconAccessible, IconBrandWhatsapp,
  IconPlayerPlay
};

const clientManagement = {
  id: 'client-monitoring',
  title: 'Client Management',
  type: 'group',
  icon: icons.IconServer,
  children: [
    {
      id: 'client-master',
      title: 'Client Master',
      type: 'item',
      url: '/client-management/client-master',
      icon: icons.IconBuildingSkyscraper,
      breadcrumbs: true,
    },
    {
      id: 'notification-center',
      title: 'Notification Center',
      type: 'item',
      url: '/client-management/notifications',
      icon: icons.IconBellRinging,
      breadcrumbs: false
    },
    {
      id: 'health-dashboard',
      title: 'Health Dashboard',
      type: 'item',
      url: '/admin/health-dashboard',
      icon: icons.IconActivity,
      breadcrumbs: false
    },
    {
      id: 'business-authorization',
      title: 'Business Authorization',
      type: 'item',
      url: '/admin/business-authorization',
      icon: icons.IconShieldLock,
      breadcrumbs: true
    },
    {
      id: 'preference-master',
      title: 'App Preference',
      type: 'item',
      url: '/admin/preference-master',
      icon: icons.IconSettings,
      breadcrumbs: true
    },
    {
      id: 'data-migration',
      title: 'Data Migration',
      type: 'item',
      url: '/admin/data-migration',
      icon: icons.IconDatabaseExport,
      breadcrumbs: true
    },
    {
      id: 'db-query',
      title: 'DB Query',
      type: 'item',
      url: '/admin/db-query',
      icon: icons.IconDatabaseExport,
      breadcrumbs: true
    },
    {
      id: 'inventory-management',
      title: 'Inventory Management',
      type: 'collapse',
      icon: icons.IconCategory,
      children: [
        {
          id: 'transaction-type',
          title: 'Transaction Type',
          type: 'item',
          url: '/inventory/transaction-type',
          icon: icons.IconCategory,
          breadcrumbs: true
        }
      ]
    }
  ]
};

export default clientManagement;
