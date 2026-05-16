import './assets/css/App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from './layouts/auth';
import AdminLayout from './layouts/admin';
import RTLLayout from './layouts/rtl';
import ProtectedRoute from './components/ProtectedRoute'; // Importa el protector
import { ChakraProvider } from '@chakra-ui/react';
import initialTheme from './theme/theme';
import { useState } from 'react';

export default function Main() {
  const [currentTheme, setCurrentTheme] = useState(initialTheme);

  return (
    <ChakraProvider theme={currentTheme}>
      <Routes>
        {/* Rutas de autenticación */}
        <Route path="auth/*" element={<AuthLayout />} />

        {/* Rutas de administración protegidas */}
        <Route
          path="admin/*"
          element={
            <ProtectedRoute>
              <AdminLayout theme={currentTheme} setTheme={setCurrentTheme} />
            </ProtectedRoute>
          }
        />

        <Route
          path="rtl/*"
          element={
            <RTLLayout theme={currentTheme} setTheme={setCurrentTheme} />
          }
        />

        {/* Redirigir siempre al Login si entran a la raíz */}
        <Route path="/" element={<Navigate to="/auth/sign-in" replace />} />
      </Routes>
    </ChakraProvider>
  );
}