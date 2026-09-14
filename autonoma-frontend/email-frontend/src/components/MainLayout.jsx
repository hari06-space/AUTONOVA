import { Outlet, NavLink } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/DashboardRounded';
import QueueIcon from '@mui/icons-material/AssignmentRounded';
import ReceiptIcon from '@mui/icons-material/ReceiptLongRounded';
import DescriptionIcon from '@mui/icons-material/DescriptionRounded';
import PeopleIcon from '@mui/icons-material/PeopleAltRounded';
import BuildIcon from '@mui/icons-material/BuildCircleRounded';
import HistoryIcon from '@mui/icons-material/HistoryRounded';
import SettingsIcon from '@mui/icons-material/SettingsRounded';
import InboxIcon from '@mui/icons-material/InboxRounded';

const navItems = [
  { path: '/', icon: <DashboardIcon />, label: 'Dashboard' },
  { path: '/inbox', icon: <InboxIcon />, label: 'Inbox' },
  { path: '/work-items', icon: <QueueIcon />, label: 'Work Items' },
  { path: '/email-history', icon: <HistoryIcon />, label: 'Email History' },
  { path: '/review-queue', icon: <QueueIcon />, label: 'Review Queue' },
  { path: '/quotations', icon: <ReceiptIcon />, label: 'Quotations' },
  { path: '/invoices', icon: <DescriptionIcon />, label: 'Invoices' },
  { path: '/customers', icon: <PeopleIcon />, label: 'Customers' },
  { path: '/parts', icon: <BuildIcon />, label: 'Master Parts' },
  { path: '/settings', icon: <SettingsIcon />, label: 'Settings' },
];

export default function MainLayout() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar__logo">
          <div className="sidebar__logo-icon">N</div>
          <span className="sidebar__logo-text">Nutech Mail</span>
        </div>

        <nav className="sidebar__nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
            >
              <span className="sidebar__link-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
