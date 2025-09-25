/**
 * Responsive Form Components for DeelRx CRM
 * 
 * Provides accessible, mobile-first form components with
 * proper validation, error handling, and touch-friendly inputs.
 */

'use client';

import React, { useState, useId } from 'react';
import { Eye, EyeOff, AlertCircle, Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';

// Base form field wrapper
export function FormField({
  label,
  error,
  required = false,
  children,
  className,
  hint
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  hint?: string;
}) {
  const fieldId = useId();

  return (
    <div className={cn('space-y-2', className)}>
      <label 
        htmlFor={fieldId}
        className="block text-sm font-medium text-foreground"
      >
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      
      <div className="relative">
        {React.isValidElement(children) ? 
          React.cloneElement(children, { 
            id: fieldId,
            'aria-invalid': !!error,
            'aria-describedby': error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined
          } as any) : children
        }
        
        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
        )}
      </div>
      
      {hint && !error && (
        <p id={`${fieldId}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      
      {error && (
        <p id={`${fieldId}-error`} className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// Responsive input component
export function ResponsiveInput({
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  error,
  className,
  ...props
}: {
  type?: 'text' | 'email' | 'tel' | 'url' | 'search';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'>) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className={cn(
        'flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base',
        'placeholder:text-muted-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'sm:text-sm', // Smaller text on desktop
        error && 'border-destructive focus:ring-destructive',
        className
      )}
      {...props}
    />
  );
}

// Password input with visibility toggle
export function PasswordInput({
  value,
  onChange,
  placeholder = 'Enter password',
  disabled = false,
  error,
  showStrengthIndicator = false,
  className,
  ...props
}: {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  showStrengthIndicator?: boolean;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'>) {
  const [showPassword, setShowPassword] = useState(false);
  
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;
    
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return { strength: score, label: labels[score - 1] || '' };
  };
  
  const passwordStrength = showStrengthIndicator ? getPasswordStrength(value || '') : null;

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 pr-12 text-base',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'sm:text-sm',
            error && 'border-destructive focus:ring-destructive',
            className
          )}
          {...props}
        />
        
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          ) : (
            <Eye className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          )}
        </button>
      </div>
      
      {showStrengthIndicator && passwordStrength && value && (
        <div className="space-y-1">
          <div className="flex h-2 gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'flex-1 rounded-full',
                  i < passwordStrength.strength
                    ? passwordStrength.strength <= 2
                      ? 'bg-destructive'
                      : passwordStrength.strength <= 3
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                    : 'bg-muted'
                )}
              />
            ))}
          </div>
          {passwordStrength.label && (
            <p className="text-xs text-muted-foreground">
              Password strength: {passwordStrength.label}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Responsive textarea
export function ResponsiveTextarea({
  placeholder,
  value,
  onChange,
  disabled = false,
  error,
  rows = 4,
  className,
  ...props
}: {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  rows?: number;
  className?: string;
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'>) {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      rows={rows}
      className={cn(
        'flex w-full rounded-md border border-input bg-background px-3 py-2 text-base',
        'placeholder:text-muted-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'resize-y min-h-[80px]',
        'sm:text-sm',
        error && 'border-destructive focus:ring-destructive',
        className
      )}
      {...props}
    />
  );
}

// Select component with search
export function ResponsiveSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  error,
  searchable = false,
  className
}: {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  searchable?: boolean;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selectId = useId();

  const filteredOptions = searchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base',
          'placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'sm:text-sm',
          error && 'border-destructive focus:ring-destructive',
          className
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={selectId}
      >
        <span className={selectedOption ? 'text-foreground' : 'text-muted-foreground'}>
          {selectedOption?.label || placeholder}
        </span>
        <svg
          className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
            {searchable && (
              <div className="p-2 border-b">
                <input
                  type="text"
                  placeholder="Search options..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-input rounded bg-background"
                />
              </div>
            )}
            
            <div role="listbox" className="py-1">
              {filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange?.(option.value);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  disabled={option.disabled}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground',
                    'focus:outline-none focus:bg-accent focus:text-accent-foreground',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'min-h-[44px] flex items-center', // Touch-friendly height
                    option.value === value && 'bg-accent text-accent-foreground font-medium'
                  )}
                  role="option"
                  aria-selected={option.value === value}
                >
                  <span className="flex-1">{option.label}</span>
                  {option.value === value && (
                    <Check className="h-4 w-4 ml-2 flex-shrink-0" />
                  )}
                </button>
              ))}
              
              {filteredOptions.length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No options found
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Checkbox with proper touch targets
export function ResponsiveCheckbox({
  checked,
  onChange,
  label,
  disabled = false,
  error,
  className
}: {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}) {
  const checkboxId = useId();

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <div className="relative flex-shrink-0 mt-0.5">
        <input
          type="checkbox"
          id={checkboxId}
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <label
          htmlFor={checkboxId}
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded border-2',
            'cursor-pointer transition-colors',
            'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
            checked
              ? 'bg-primary border-primary text-primary-foreground'
              : 'border-input hover:border-primary',
            disabled && 'opacity-50 cursor-not-allowed',
            error && 'border-destructive'
          )}
        >
          {checked && <Check className="h-3 w-3" />}
        </label>
      </div>
      
      <label
        htmlFor={checkboxId}
        className={cn(
          'text-sm leading-5 cursor-pointer select-none',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'text-destructive'
        )}
      >
        {label}
      </label>
    </div>
  );
}

// Form actions with responsive layout
export function FormActions({
  primaryAction,
  secondaryAction,
  isLoading = false,
  className
}: {
  primaryAction: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  isLoading?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(
      'flex flex-col-reverse sm:flex-row gap-3 sm:justify-end',
      className
    )}>
      {secondaryAction && (
        <button
          type="button"
          onClick={secondaryAction.onClick}
          disabled={secondaryAction.disabled || isLoading}
          className="h-12 px-6 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {secondaryAction.label}
        </button>
      )}
      
      <button
        type="button"
        onClick={primaryAction.onClick}
        disabled={primaryAction.disabled || isLoading}
        className="h-12 px-6 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        )}
        {primaryAction.label}
      </button>
    </div>
  );
}

export default {
  FormField,
  ResponsiveInput,
  PasswordInput,
  ResponsiveTextarea,
  ResponsiveSelect,
  ResponsiveCheckbox,
  FormActions
};