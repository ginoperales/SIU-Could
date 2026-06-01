'use client';

import React, { InputHTMLAttributes, ButtonHTMLAttributes, SelectHTMLAttributes, HTMLAttributes, ReactNode, useState, useEffect } from 'react';
import { X } from 'lucide-react';

// ==========================================
// 1. BUTTON COMPONENT
// ==========================================
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const baseStyle = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-98 cursor-pointer disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover focus:ring-primary/50 shadow-sm shadow-primary/20',
    secondary: 'bg-secondary text-white hover:bg-secondary-hover focus:ring-secondary/50 shadow-sm shadow-secondary/20',
    outline: 'border border-border text-foreground hover:bg-muted focus:ring-muted',
    ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground focus:ring-muted',
    danger: 'bg-destructive text-white hover:bg-destructive/90 focus:ring-destructive/50 shadow-sm',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500/50 shadow-sm'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base'
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// ==========================================
// 2. CARD COMPONENT
// ==========================================
export function Card({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`glass-panel rounded-xl shadow-sm border border-border p-6 flex flex-col gap-4 overflow-hidden ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex flex-col gap-1.5 ${className}`} {...props}>{children}</div>;
}

export function CardTitle({ className = '', children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={`text-lg font-semibold tracking-tight text-foreground ${className}`} {...props}>{children}</h3>;
}

export function CardDescription({ className = '', children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-sm text-muted-foreground ${className}`} {...props}>{children}</p>;
}

export function CardContent({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex-1 ${className}`} {...props}>{children}</div>;
}

// ==========================================
// 3. INPUT COMPONENT
// ==========================================
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label htmlFor={inputId} className="text-xs font-medium text-muted-foreground">{label}</label>}
      <input
        id={inputId}
        className={`w-full px-3.5 py-2 text-sm bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50 transition-all ${error ? 'border-destructive focus:ring-destructive/30 focus:border-destructive' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-destructive font-medium">{error}</span>}
    </div>
  );
}

// ==========================================
// 4. SELECT COMPONENT
// ==========================================
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className = '', id, ...props }: SelectProps) {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label htmlFor={selectId} className="text-xs font-medium text-muted-foreground">{label}</label>}
      <select
        id={selectId}
        className={`w-full px-3.5 py-2 text-sm bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer disabled:opacity-50 transition-all ${error ? 'border-destructive' : ''} ${className}`}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <span className="text-xs text-destructive font-medium">{error}</span>}
    </div>
  );
}

// ==========================================
// 5. BADGE (STATUS TAG) COMPONENT
// ==========================================
interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary' | 'secondary';
  children: ReactNode;
}

export function Badge({ variant = 'neutral', className = '', children, ...props }: BadgeProps) {
  const styles = {
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900',
    danger: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900',
    neutral: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    primary: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
    secondary: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-md border ${styles[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}

// ==========================================
// 6. TABLE COMPONENTS
// ==========================================
export function Table({ className = '', children, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <table className={`w-full text-sm text-left border-collapse ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className = '', children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={`bg-muted/80 text-muted-foreground text-xs uppercase font-semibold border-b border-border ${className}`} {...props}>{children}</thead>;
}

export function TableBody({ className = '', children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={`divide-y divide-border ${className}`} {...props}>{children}</tbody>;
}

export function TableRow({ className = '', children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={`hover:bg-muted/40 transition-colors ${className}`} {...props}>{children}</tr>;
}

export function TableHead({ className = '', children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={`px-4 py-3 font-semibold text-muted-foreground ${className}`} {...props}>{children}</th>;
}

export function TableCell({ className = '', children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`px-4 py-3.5 text-foreground align-middle ${className}`} {...props}>{children}</td>;
}

// ==========================================
// 7. DIALOG (MODAL) COMPONENT
// ==========================================
interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Dialog({ isOpen, onClose, title, children }: DialogProps) {
  // ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      {/* Dialog Content */}
      <div className="relative bg-card border border-border w-full max-w-lg rounded-xl shadow-xl flex flex-col p-6 animate-slide-up z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <button 
            onClick={onClose} 
            className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground outline-none cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

// ==========================================
// 8. TABS COMPONENT
// ==========================================
interface TabsProps {
  tabs: { id: string; label: string; icon?: ReactNode }[];
  activeTab: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex border-b border-border mb-4 overflow-x-auto">
      {tabs.map(tab => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer outline-none whitespace-nowrap ${
              isActive 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            {tab.icon && tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ==========================================
// 9. ALERT COMPONENT
// ==========================================
interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'warning' | 'danger' | 'success';
  title?: string;
  children: ReactNode;
}

export function Alert({ variant = 'info', title, className = '', children, ...props }: AlertProps) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:border-blue-900/50 dark:text-blue-300',
    warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-300',
    danger: 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-300',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-300'
  };

  return (
    <div className={`p-4 border rounded-lg flex flex-col gap-1 text-sm ${styles[variant]} ${className}`} {...props}>
      {title && <h5 className="font-semibold">{title}</h5>}
      <div className="opacity-90">{children}</div>
    </div>
  );
}
