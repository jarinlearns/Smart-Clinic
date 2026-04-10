import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import PrivateRoute from './components/PrivateRoute';
import RoleBasedRoute from './components/RoleBasedRoute';
import MedicineListPage from './pages/MedicineListPage';
import AddPatientPage from './pages/AddPatientPage';
import PatientListPage from './pages/PatientListPage'; 
import LiveQueuePage from './pages/LiveQueuePage';
import HomePage from './pages/HomePage';
import SupplierPage from './pages/SupplierPage';
import ConsultationPage from './pages/ConsultationPage';
import ProcurementHistoryPage from './pages/ProcurementHistoryPage';
import RevenueReportPage from './pages/RevenueReportPage';
import AnalyticsReportPage from './pages/AnalyticsReportPage';
import AddUserPage from './pages/AddUserPage';
import UserListPage from './pages/UserListPage'; 
import ConsultationHistoryPage from './pages/ConsultationHistoryPage'; 
import ProfileSettingsPage from './pages/ProfileSettingsPage'; 
import AllConsultationHistory from './pages/AllConsultationHistory'; 

import PendingApprovalsPage from './pages/PendingApprovalsPage';


function App() {
  return (
    <Router>
      <Header />
      <main style={{ padding: '1rem' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route element={<PublicOnlyRoute />}>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Route>

          <Route element={<PrivateRoute />}>
          <Route path="/profile" element={<ProfileSettingsPage />} />
          </Route>
          <Route element={<RoleBasedRoute allowedRoles={['Admin']} />}>
            <Route path="/admin/add-user" element={<AddUserPage />} />
            <Route path="/admin/users" element={<UserListPage />} />
            <Route path="/admin/consultation-history" element={<AllConsultationHistory />} />

          </Route>
          <Route element={<RoleBasedRoute allowedRoles={['Admin', 'Pharmacist']} />}>
            
            <Route path="/admin/medicines" element={<MedicineListPage />} />
            <Route path="/pharmacist/procurements" element={<ProcurementHistoryPage />} />
            <Route path="/pharmacist/suppliers" element={<SupplierPage />} />
            <Route path="/admin/revenue" element={<RevenueReportPage />} />
            <Route path="/reports/dispensing-analytics" element={<AnalyticsReportPage />} />
          
          </Route>
          <Route element={<RoleBasedRoute allowedRoles={['Admin', 'Doctor']} />}>
            <Route element={<RoleBasedRoute allowedRoles={['Doctor']} />}>
              <Route path="/doctor/consultation/:id" element={<ConsultationPage />} />
              <Route path="/doctor/history" element={<ConsultationHistoryPage />} />
            
            </Route>
          </Route>
          <Route element={<RoleBasedRoute allowedRoles={['Admin', 'Receptionist']} />}>
            <Route path="/reception/add-patient" element={<AddPatientPage />} />
            <Route path="/reception/live-queue" element={<LiveQueuePage />} />
            <Route path="/reception/patient-list" element={<PatientListPage />} />
            <Route path="/reception/approvals" element={<PendingApprovalsPage />} /> 
          </Route>

        </Routes>
      </main>
    </Router>
  );
}

export default App;