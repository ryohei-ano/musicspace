'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface Win2000ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'pressed' | 'disabled';
  size?: 'sm' | 'md' | 'lg';
}

const Win2000Button = forwardRef<HTMLButtonElement, Win2000ButtonProps>(
  ({ className, variant = 'default', size = 'md', children, disabled, ...props }, ref) => {
    const baseStyles = `
      relative
      font-mono
      font-normal
      border-2
      cursor-pointer
      select-none
      transition-none
      focus:outline-none
      focus:ring-0
    `;

    const variantStyles = {
      default: `
        bg-[#c0c0c0]
        border-t-[#ffffff]
        border-l-[#ffffff]
        border-r-[#808080]
        border-b-[#808080]
        text-black
        hover:bg-[#d0d0d0]
        active:border-t-[#808080]
        active:border-l-[#808080]
        active:border-r-[#ffffff]
        active:border-b-[#ffffff]
        active:bg-[#b0b0b0]
      `,
      pressed: `
        bg-[#b0b0b0]
        border-t-[#808080]
        border-l-[#808080]
        border-r-[#ffffff]
        border-b-[#ffffff]
        text-black
      `,
      disabled: `
        bg-[#c0c0c0]
        border-t-[#ffffff]
        border-l-[#ffffff]
        border-r-[#808080]
        border-b-[#808080]
        text-[#808080]
        cursor-not-allowed
      `
    };

    const sizeStyles = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-1.5 text-sm',
      lg: 'px-4 py-2 text-base'
    };

    const currentVariant = disabled ? 'disabled' : variant;

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[currentVariant],
          sizeStyles[size],
          className
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Win2000Button.displayName = 'Win2000Button';

export default Win2000Button;
