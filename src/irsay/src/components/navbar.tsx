import { logout } from '@/utils/auth';

interface NavbarProps {
  onLogout?: () => void;
}

export default function Navbar({ onLogout }: NavbarProps) {
  const handleLogout = () => {
    logout();
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar__logo">
        <img
          src="/Logo.svg"
          alt="Logo"
          width={120}
          height={40}
        />
      </div>
      <button className="navbar__button" onClick={handleLogout}>
        LOGOUT
      </button>
    </nav>
  );
}
