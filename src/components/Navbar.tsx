import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sparkles } from 'lucide-react';
<img src="/home/project/public/favicon.svg" alt="CogniAND Logo" className="h-8 w-8" />

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
    }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Sparkles className="h-8 w-8 text-primary-600" />
            <img src="/favicon.svg" alt="CogniAND Logo" className="h-8 w-8" />

            <span className="text-2xl font-serif font-bold text-gray-900">
              CogniAND
            </span>
          </Link>
          
          <nav className="hidden md:flex space-x-8">
            <NavLink to="/" label="首页" />
            <NavLink to="/experiments" label="实验" />
            <NavLink to="/#about" label="关于" />
            <NavLink to="/#team" label="团队" />
          </nav>
          
          <div className="hidden md:block">
            <Link
              to="/experiments"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              开始实验
            </Link>
          </div>
          
          <button 
            onClick={toggleMenu} 
            className="md:hidden rounded-md p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <MobileNavLink to="/" label="首页" />
            <MobileNavLink to="/experiments" label="实验" />
            <MobileNavLink to="/#about" label="关于" />
            <MobileNavLink to="/#team" label="团队" />
            <div className="pt-2">
              <Link
                to="/experiments"
                className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                开始实验
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

const NavLink = ({ to, label }: { to: string; label: string }) => {
  const location = useLocation();
  const isActive = 
    to === '/' 
      ? location.pathname === '/' 
      : location.pathname.startsWith(to) || location.hash === to;
  
  return (
    <Link
      to={to}
      className={`text-sm font-medium transition-colors hover:text-primary-600 ${
        isActive ? 'text-primary-600' : 'text-gray-700'
      }`}
    >
      {label}
    </Link>
  );
};

const MobileNavLink = ({ to, label }: { to: string; label: string }) => {
  const location = useLocation();
  const isActive = 
    to === '/' 
      ? location.pathname === '/' 
      : location.pathname.startsWith(to) || location.hash === to;
  
  return (
    <Link
      to={to}
      className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
        isActive 
          ? 'bg-gray-100 text-primary-600' 
          : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
      }`}
    >
      {label}
    </Link>
  );
};

export default Navbar;