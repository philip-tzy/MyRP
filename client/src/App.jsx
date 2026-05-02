import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard       from './pages/Dashboard';
import PartsMaster     from './pages/MasterData/PartsMaster';
import PartDetail      from './pages/MasterData/PartDetail';
import Customers       from './pages/MasterData/Customers';
import Suppliers       from './pages/MasterData/Suppliers';
import SalesOrders     from './pages/Transactions/SalesOrders';
import SalesOrderForm  from './pages/Transactions/SalesOrderForm';
import Inventory       from './pages/Transactions/Inventory';
import MrpDashboard    from './pages/MrpEngine/MrpDashboard';
import SuggestionBoard from './pages/MrpEngine/SuggestionBoard';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"            element={<Dashboard />} />
        <Route path="master/parts"         element={<PartsMaster />} />
        <Route path="master/parts/:id"     element={<PartDetail />} />
        <Route path="master/customers"     element={<Customers />} />
        <Route path="master/suppliers"     element={<Suppliers />} />
        <Route path="transactions/so"      element={<SalesOrders />} />
        <Route path="transactions/so/new"  element={<SalesOrderForm />} />
        <Route path="transactions/so/:id"  element={<SalesOrderForm />} />
        <Route path="transactions/inventory" element={<Inventory />} />
        <Route path="mrp/engine"           element={<MrpDashboard />} />
        <Route path="mrp/suggestions"      element={<SuggestionBoard />} />
      </Route>
    </Routes>
  );
}
