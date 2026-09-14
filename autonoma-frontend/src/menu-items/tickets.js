import { IconTicket } from '@tabler/icons-react';

const icons = {
  IconTicket
};

const tickets = {
  id: 'tickets',
  title: 'Task Management',
  caption: 'System & Support Tickets',
  type: 'group',
  icon: icons.IconTicket,
  children: [
    {
      id: 'ticket-management',
      title: 'Task Center',
      type: 'item',
      url: '/ticket/management',
      icon: icons.IconTicket,
      breadcrumbs: false
    }
  ]
};

export default tickets;
