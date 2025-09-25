/**
 * Mobile Navigation Component for DeelRx CRM
 * 
 * Provides accessible, mobile-first navigation with proper
 * touch targets and keyboard navigation support.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  User,
  LogOut,
  Bell,
  Search
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home
  },
  {
    id: 'customers',
    label: 'Customers',
    href: '/customers',
    icon: Users
  },
  {
    id: 'orders',
    label: 'Orders',
    href: '/orders',
    icon: ShoppingCart,
    badge: 3
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: Settings
  }
];

export function MobileNavigation({
  currentPath = '',
  userEmail = '',
  onNavigate,
  className
}: {
  currentPath?: string;
  userEmail?: string;
  onNavigate?: (href: string) => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleNavigation = (href: string) => {
    setIsOpen(false);
    if (onNavigate) {
      onNavigate(href);
    } else {
      window.location.href = href;
    }
  };

  return (
    <>
      {/* Mobile Header */}
      <header className={cn(
        'lg:hidden fixed top-0 left-0 right-0 z-40',
        'bg-background/95 backdrop-blur-sm border-b',
        'h-16 flex items-center justify-between px-4',
        className
      )}>
        {/* Logo */}
        <div className="flex items-center">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 -ml-2 rounded-md hover:bg-accent transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="ml-2 text-lg font-semibold">DeelRx CRM</h1>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-md hover:bg-accent transition-colors"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            className="p-2 rounded-md hover:bg-accent transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
              2
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Sidebar */}
      <nav
        className={cn(
          'lg:hidden fixed left-0 top-0 bottom-0 z-50',
          'w-80 max-w-[85vw] bg-background border-r',
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Main navigation"
      >
        {/* Menu Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Menu</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-md hover:bg-accent transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-accent/50 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navigationItems.map((item) => {
              const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
              const Icon = item.icon;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavigation(item.href)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-3 rounded-md text-left transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                      'min-h-[44px]', // Ensure 44px minimum touch target
                      isActive && 'bg-accent text-accent-foreground font-medium'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* User Profile Section */}
        <div className="border-t p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userEmail || 'User'}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => handleNavigation('/profile')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-sm hover:bg-accent transition-colors"
            >
              <User className="h-4 w-4" />
              Profile Settings
            </button>
            <button
              onClick={() => handleNavigation('/logout')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-sm hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <nav className="hidden lg:flex lg:fixed lg:left-0 lg:top-0 lg:bottom-0 lg:w-64 lg:flex-col lg:bg-card lg:border-r">
        {/* Desktop Header */}
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold">DeelRx CRM</h1>
        </div>

        {/* Desktop Navigation */}
        <div className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-1 px-4">
            {navigationItems.map((item) => {
              const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
              const Icon = item.icon;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavigation(item.href)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                      isActive && 'bg-accent text-accent-foreground font-medium'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Desktop User Profile */}
        <div className="border-t p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userEmail || 'User'}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => handleNavigation('/profile')}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent transition-colors"
            >
              <User className="h-4 w-4" />
              Profile
            </button>
            <button
              onClick={() => handleNavigation('/logout')}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}

// Hook for managing navigation state
export function useNavigation() {
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    setCurrentPath(window.location.pathname);
    
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  return { currentPath };
}

// Breadcrumb component for better navigation context
export function Breadcrumb({
  items,
  className
}: {
  items: Array<{ label: string; href?: string }>;
  className?: string;
}) {
  return (
    <nav 
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-1 text-sm text-muted-foreground', className)}
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="mx-2">/</span>}
          {item.href ? (
            <a
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export default { MobileNavigation, useNavigation, Breadcrumb };