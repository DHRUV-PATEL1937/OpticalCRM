import { Search, Bell, Menu } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Header({ onMenuToggle }) {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-surface-200/50 flex items-center px-6 gap-4 shadow-sm">
      {/* Mobile menu toggle */}
      <button onClick={onMenuToggle} className="p-2 rounded-lg hover:bg-surface-100 text-surface-500 cursor-pointer">
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, customers..."
            className="w-full pl-10 pr-4 py-2 bg-surface-50 border border-surface-200 rounded-xl text-sm placeholder:text-surface-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all"
          />
        </div>
      </form>

      <div className="flex items-center gap-2 ml-auto flex-shrink-0">
        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-surface-100 text-surface-500 transition-colors cursor-pointer">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full"></span>
        </button>

        {/* Date */}
        <div className="hidden md:block text-sm text-surface-500 px-3 whitespace-nowrap">
          {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>
    </header>
  );
}
