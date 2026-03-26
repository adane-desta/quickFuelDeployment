import { createBrowserRouter, Navigate } from 'react-router';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterDriver } from './components/auth/RegisterDriver';
import { DriverLayout } from './components/driver/DriverLayout';
import { OperatorLayout } from './components/operator/OperatorLayout';
import { AdminLayout } from './components/admin/AdminLayout';
import { OwnerDashboard } from './components/station_owner/OwnerDashboard';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: LandingPage,
  },
  {
    path: '/login',
    Component: LoginPage,
  },
  {
    path: '/station_owner',
    Component: OwnerDashboard,
  },
  {
    path: '/register/driver',
    Component: RegisterDriver,
  },
  {
    path: '/driver/*',
    Component: DriverLayout,
  },
  {
    path: '/operator/*',
    Component: OperatorLayout,
  },
  {
    path: '/admin/*',
    Component: AdminLayout,
  },
]);