import { NavLink } from "react-router-dom";
import { useAuth } from './context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Nav() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const linkClass = ({ isActive }: { isActive: boolean }) => isActive ? "text-blue-600 font-bold" : "text-gray-700";

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Network Error');
    }
  }

  return (
    <>
      <nav className="flex gap-4 p-4 border-b">
        <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
        <NavLink to="/user" className={linkClass}>User</NavLink>
        <NavLink to="/position" className={linkClass}>Position</NavLink>
        <NavLink to="/task" className={linkClass}>Task</NavLink>
        <button
          className="text-red-500 cursor-pointer hover:bg-red-200"
          onClick={handleLogout}
        >Logout</button>
      </nav>
    </>
  )
}

export default Nav;
