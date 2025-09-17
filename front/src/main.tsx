import ReactDOM from "react-dom/client";
import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";
import { useAuth, AuthProvider } from './context/AuthContext';

import App from './App.tsx'
import User from './User.tsx'
import Position from './Position.tsx'
import Task from './Task.tsx'
import Login from './Login.tsx'
import Dashboard from './Dashboard.tsx'
import './index.css'

export default function PrivateRoute() {
  const { user } = useAuth();
  const token = localStorage.getItem('token');

  // if we have either a user in state or a saved token, allow access
  return user || token ? <Outlet /> : <Navigate to="/login" replace />;
}

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/dashboard', element: <Dashboard /> },
  {
    element: <PrivateRoute />,
    children: [
      { path: '/', element: <App /> },
      { path: '/User', element: <User /> },
      { path: '/Position', element: <Position /> },
      { path: '/Task', element: <Task /> },
    ],
  },
]);

const root = document.getElementById("root")!;

ReactDOM.createRoot(root).render(
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
);
