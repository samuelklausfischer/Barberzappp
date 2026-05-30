import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { HomeDashboard } from './pages/HomeDashboard';
import { Agenda, Horarios, Clientes, Servicos, Funcionarios, Financeiro, WhatsApp, IAConfig, Aparencia, Settings } from './pages/DashboardPages';

const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><HomeDashboard /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><HomeDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
      <Route path="/dashboard/horarios" element={<ProtectedRoute><Horarios /></ProtectedRoute>} />
      <Route path="/dashboard/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
      <Route path="/dashboard/servicos" element={<ProtectedRoute><Servicos /></ProtectedRoute>} />
      <Route path="/dashboard/funcionarios" element={<ProtectedRoute><Funcionarios /></ProtectedRoute>} />
      <Route path="/dashboard/financeiro" element={<ProtectedRoute><Financeiro /></ProtectedRoute>} />
      <Route path="/dashboard/whatsapp" element={<ProtectedRoute><WhatsApp /></ProtectedRoute>} />
      <Route path="/dashboard/ia" element={<ProtectedRoute><IAConfig /></ProtectedRoute>} />
      <Route path="/dashboard/aparencia" element={<ProtectedRoute><Aparencia /></ProtectedRoute>} />
      <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
    </Routes>
  </BrowserRouter>
);

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
