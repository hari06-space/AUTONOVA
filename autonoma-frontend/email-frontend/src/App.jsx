import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import DashboardPage from './pages/DashboardPage';
import ReviewQueuePage from './pages/ReviewQueuePage';
import QuotationHistoryPage from './pages/QuotationHistoryPage';
import CustomersPage from './pages/CustomersPage';
import MasterPartsPage from './pages/MasterPartsPage';
import EmailHistoryPage from './pages/EmailHistoryPage';
import InvoicesPage from './pages/InvoicesPage';
import SettingsPage from './pages/SettingsPage';
import InboxPage from './pages/InboxPage';
import WorkItemsPage from './pages/WorkItemsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="inbox" element={<InboxPage />} />
        <Route path="work-items" element={<WorkItemsPage />} />
        <Route path="review-queue" element={<ReviewQueuePage />} />
        <Route path="quotations" element={<QuotationHistoryPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="parts" element={<MasterPartsPage />} />
        <Route path="email-history" element={<EmailHistoryPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
