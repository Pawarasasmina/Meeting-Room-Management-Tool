import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-slate-900 text-white shadow">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="font-semibold">200M Meeting Room Manager</Link>
        {user && (
          <div className="flex items-center gap-4 text-sm">
            <span>{user.name} ({user.role})</span>
            <button className="rounded bg-slate-700 px-3 py-1 hover:bg-slate-600" onClick={logout}>Logout</button>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
