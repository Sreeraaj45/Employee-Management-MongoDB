import { Search, Menu, X } from 'lucide-react';
import { NotificationCenter } from '../Notifications/NotificationCenter';
import { useState } from 'react';

interface HeaderProps {
  title: string;
  onNavigate?: (url: string) => void;
  onMenuClick?: () => void;
}

// Header.tsx - Optimized for 100% width
export const Header = ({ title, onNavigate, onMenuClick }: HeaderProps) => {
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b px-3 sm:px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between w-full max-w-full">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <Menu className="h-4 w-4 text-gray-600" />
          </button>
          
          {/* Title - Truncate on small screens */}
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate min-w-0">
            {title}
          </h1>
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3 flex-shrink-0">
          {/* Desktop search - Optimized width */}
          {/* <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-400 focus:border-transparent w-40 lg:w-48 text-sm"
            />
          </div> */}

          {/* Mobile search button */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="sm:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Search className="h-4 w-4 text-gray-600" />
          </button>
          
          <NotificationCenter onNavigate={onNavigate} />
        </div>
      </div>

      {/* Mobile search bar - Full width */}
      {showMobileSearch && (
        <div className="mt-3 sm:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-400 focus:border-transparent text-sm"
            />
            <button
              onClick={() => setShowMobileSearch(false)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};