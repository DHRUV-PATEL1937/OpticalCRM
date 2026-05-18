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
    <header className="sticky top-0 z-30 h-20 bg-surface-50/80 backdrop-blur-xl flex items-center px-6 lg:px-10 gap-6">
      {/* Mobile menu toggle */}
      <button onClick={onMenuToggle} className="p-2.5 rounded-2xl bg-white border border-surface-200/60 shadow-sm hover:bg-surface-50 hover:shadow-md text-surface-600 cursor-pointer transition-all">
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 group-focus-within:text-primary-500 transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, customers..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-surface-200/60 rounded-2xl text-sm font-medium placeholder:text-surface-400 placeholder:font-normal focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100/50 shadow-sm transition-all"
          />
        </div>
      </form>

      <div className="flex items-center gap-4 ml-auto flex-shrink-0">
        {/* Notifications */}
        <button className="relative p-3 rounded-2xl bg-white border border-surface-200/60 shadow-sm hover:bg-surface-50 hover:shadow-md text-surface-600 transition-all cursor-pointer">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-danger-500 rounded-full border-2 border-white shadow-sm"></span>
        </button>

        {/* Date */}
        <div className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-white border border-surface-200/60 rounded-2xl shadow-sm">
          <span className="text-sm font-bold text-surface-700">
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
          <span className="text-sm font-medium text-surface-400">
            {new Date().toLocaleDateString('en-IN', { year: 'numeric' })}
          </span>
        </div>
      </div>
    </header>
  );
}
