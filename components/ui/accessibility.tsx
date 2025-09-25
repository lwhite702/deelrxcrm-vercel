/**
 * Accessibility Utilities for DeelRx CRM
 * 
 * Provides accessible components and utilities to ensure
 * the application meets WCAG 2.1 AA standards.
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

// Screen reader only content
export function ScreenReaderOnly({ 
  children,
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span 
      className={cn(
        'absolute -inset-0.5 opacity-0 pointer-events-none',
        'sr-only', // Tailwind class for screen readers only
        className
      )}
    >
      {children}
    </span>
  );
}

// Skip navigation link
export function SkipNavigation({ 
  targetId = 'main-content',
  className 
}: { 
  targetId?: string;
  className?: string;
}) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50',
        'bg-primary text-primary-foreground px-4 py-2 rounded-md',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      )}
    >
      Skip to main content
    </a>
  );
}

// Focus trap for modals and dropdowns
export function FocusTrap({ 
  children,
  active = true,
  className
}: {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusableElements, setFocusableElements] = useState<HTMLElement[]>([]);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    const elements = Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
    setFocusableElements(elements);

    // Focus first element
    if (elements.length > 0) {
      elements[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [active]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

// Accessible modal dialog
export function AccessibleModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Announce modal opening to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = `Dialog opened: ${title}`;
      document.body.appendChild(announcement);
      
      setTimeout(() => document.body.removeChild(announcement), 1000);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, title]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={description ? "modal-description" : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <FocusTrap active={isOpen}>
        <div className={cn(
          'relative bg-background border border-border rounded-lg shadow-lg',
          'w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto',
          'focus:outline-none',
          className
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 id="modal-title" className="text-lg font-semibold">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Description */}
          {description && (
            <div className="px-6 pt-4">
              <p id="modal-description" className="text-sm text-muted-foreground">
                {description}
              </p>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}

// Accessible toast notifications
export function AccessibleToast({
  type = 'info',
  title,
  message,
  isVisible,
  onDismiss,
  duration = 5000,
  className
}: {
  type?: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  isVisible: boolean;
  onDismiss?: () => void;
  duration?: number;
  className?: string;
}) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onDismiss?.();
        setIsExiting(false);
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [isVisible, duration, onDismiss]);

  const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertCircle
  };

  const colors = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    success: 'bg-green-50 border-green-200 text-green-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    error: 'bg-red-50 border-red-200 text-red-900'
  };

  const Icon = icons[type];

  if (!isVisible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        'fixed top-4 right-4 z-50 max-w-sm w-full',
        'border rounded-lg shadow-lg p-4',
        'transition-all duration-300 ease-in-out',
        isExiting 
          ? 'transform translate-x-full opacity-0' 
          : 'transform translate-x-0 opacity-100',
        colors[type],
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium">{title}</h4>
          <p className="text-sm mt-1">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={() => {
              setIsExiting(true);
              setTimeout(onDismiss, 300);
            }}
            className="flex-shrink-0 p-1 hover:bg-black/10 rounded"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// High contrast mode toggle
export function HighContrastToggle({ className }: { className?: string }) {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const savedPreference = localStorage.getItem('high-contrast');
    if (savedPreference === 'true') {
      setIsHighContrast(true);
      document.documentElement.classList.add('high-contrast');
    }
  }, []);

  const toggleHighContrast = () => {
    const newValue = !isHighContrast;
    setIsHighContrast(newValue);
    
    if (newValue) {
      document.documentElement.classList.add('high-contrast');
      localStorage.setItem('high-contrast', 'true');
    } else {
      document.documentElement.classList.remove('high-contrast');
      localStorage.setItem('high-contrast', 'false');
    }
  };

  return (
    <button
      onClick={toggleHighContrast}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 text-sm',
        'border border-input rounded-md hover:bg-accent',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      )}
      aria-pressed={isHighContrast}
      aria-label={`${isHighContrast ? 'Disable' : 'Enable'} high contrast mode`}
    >
      <div className={cn(
        'h-4 w-4 rounded border-2 border-current flex items-center justify-center',
        isHighContrast && 'bg-current'
      )}>
        {isHighContrast && <div className="h-2 w-2 bg-background rounded-full" />}
      </div>
      High Contrast
    </button>
  );
}

// Font size controls
export function FontSizeControls({ className }: { className?: string }) {
  const [fontSize, setFontSize] = useState('normal');

  useEffect(() => {
    const savedSize = localStorage.getItem('font-size') || 'normal';
    setFontSize(savedSize);
    document.documentElement.setAttribute('data-font-size', savedSize);
  }, []);

  const changeFontSize = (size: string) => {
    setFontSize(size);
    document.documentElement.setAttribute('data-font-size', size);
    localStorage.setItem('font-size', size);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-sm font-medium">Text Size:</span>
      <div className="flex border border-input rounded-md overflow-hidden">
        {[
          { value: 'small', label: 'A', title: 'Small text' },
          { value: 'normal', label: 'A', title: 'Normal text' },
          { value: 'large', label: 'A', title: 'Large text' }
        ].map((option, index) => (
          <button
            key={option.value}
            onClick={() => changeFontSize(option.value)}
            className={cn(
              'px-3 py-1 text-sm hover:bg-accent transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset',
              index === 0 && 'text-xs',
              index === 2 && 'text-base font-medium',
              fontSize === option.value && 'bg-accent text-accent-foreground'
            )}
            aria-pressed={fontSize === option.value}
            title={option.title}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Announcement region for dynamic content changes
export function LiveRegion({
  message,
  politeness = 'polite',
  clearAfter = 1000
}: {
  message: string;
  politeness?: 'polite' | 'assertive';
  clearAfter?: number;
}) {
  const [currentMessage, setCurrentMessage] = useState('');

  useEffect(() => {
    if (message) {
      setCurrentMessage(message);
      
      if (clearAfter > 0) {
        const timer = setTimeout(() => {
          setCurrentMessage('');
        }, clearAfter);
        
        return () => clearTimeout(timer);
      }
    }
  }, [message, clearAfter]);

  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
      role="status"
    >
      {currentMessage}
    </div>
  );
}

// Keyboard navigation helper
export function useKeyboardNavigation(
  itemCount: number,
  onSelect?: (index: number) => void
) {
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < itemCount - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : itemCount - 1
        );
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (selectedIndex >= 0 && onSelect) {
          onSelect(selectedIndex);
        }
        break;
      case 'Escape':
        setSelectedIndex(-1);
        break;
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [itemCount, selectedIndex, onSelect]);

  return { selectedIndex, setSelectedIndex };
}

export default {
  ScreenReaderOnly,
  SkipNavigation,
  FocusTrap,
  AccessibleModal,
  AccessibleToast,
  HighContrastToggle,
  FontSizeControls,
  LiveRegion,
  useKeyboardNavigation
};