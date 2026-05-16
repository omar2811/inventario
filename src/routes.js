import React from 'react';
import { Icon } from '@chakra-ui/react';
import {
  MdHome,
  MdOutlineShoppingCart,
  MdInventory,
  MdPeople,
  MdLocalShipping,
  MdPerson,
  MdLock,
  MdBuild,
  MdMonetizationOn,
  MdEventNote
} from 'react-icons/md';

// Importaciones de tus vistas reales
import MainDashboard from 'views/admin/default';
import Rentas from 'views/admin/rentas';
import Inventario from 'views/admin/inventario';
import Profile from 'views/admin/profile';
import SignInCentered from 'views/auth/signIn';
import CalendarioRentas from 'views/admin/calendario';
import SeccionClientes from 'views/admin/clientes';
import SeccionFinanzas from 'views/admin/finanzas';
import Logout from 'views/auth/signIn/logout';

// Componentes que vamos a construir
const Placeholder = ({ name }) => (
  <div style={{ paddingTop: '150px', textAlign: 'center', fontSize: '20px', fontWeight: 'bold' }}>
    Sección de {name} en desarrollo...
  </div>
);

const routes = [
  {
    name: 'Dashboard',
    layout: '/admin',
    path: '/default',
    icon: <Icon as={MdHome} width="20px" height="20px" color="inherit" />,
    component: <CalendarioRentas />,
  },
  {
    name: 'Nueva Renta',
    layout: '/admin',
    path: '/rentar',
    icon: <Icon as={MdOutlineShoppingCart} width="20px" height="20px" color="inherit" />,
    component: <Rentas />,
  },
  {
    name: 'Inventario',
    layout: '/admin',
    path: '/inventario',
    icon: <Icon as={MdInventory} width="20px" height="20px" color="inherit" />,
    component: <Inventario />,
  },


  {
    name: 'Clientes',
    layout: '/admin',
    path: '/clientes',
    icon: <Icon as={MdPeople} width="20px" height="20px" color="inherit" />,
    component: <SeccionClientes />,
  },
  {
    name: 'Finanzas',
    layout: '/admin',
    path: '/finanzas',
    icon: <Icon as={MdMonetizationOn} width="20px" height="20px" color="inherit" />,
    component: <SeccionFinanzas />,
  },

  {
    name: 'Iniciar Sesión',
    layout: '/auth',
    display: 'none',
    path: '/sign-in', // Esto genera /auth/sign-in
    icon: <Icon as={MdLock} width="20px" height="20px" color="inherit" />,
    component: <SignInCentered />,
  },

  {
    name: 'Cerrar Sesión',
    layout: '/admin', // <--- Cámbialo a /admin para que aparezca en el Sidebar actual
    path: '/logout',
    icon: <Icon as={MdLock} width="20px" height="20px" color="inherit" />,
    component: <Logout />, // <--- Al entrar aquí, se limpia todo y te expulsa
  },
];

export default routes;