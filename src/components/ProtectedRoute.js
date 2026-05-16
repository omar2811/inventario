import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    // Verificamos si existe el token en el almacenamiento local
    const token = localStorage.getItem('token');

    if (!token) {
        // Si no hay token, lo mandamos al Login de perfiles
        // El 'replace' es para que no pueda volver atrás con el botón del navegador
        return <Navigate to="/auth/sign-in" replace />;
    }

    // Si hay token, permitimos que vea el AdminLayout
    return children;
};

export default ProtectedRoute;