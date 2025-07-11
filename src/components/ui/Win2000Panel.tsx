'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface Win2000PanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'raised' | 'sunken' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Win2000Panel = forwardRef<HTMLDivElement, Win2000PanelProps>(
  ({ className, variant = 'raised', padding = 'md', children, ...props }, ref) => {
    const baseStyles = `
      bg-[#c0c0c0]
      border-2
      font-mono
    `;

    const variantStyles = {
      raised: `
        border-t-[#ffffff]
        border-l-[#ffffff]
        border-r-[#808080]
        border-b-[#808080]
      `,
      sunken: `
        border-t-[#808080]
        border-l-[#808080]
        border-r-[#ffffff]
        border-b-[#ffffff]
      `,
      flat: `
        border-[#808080]
      `
    };

    const paddingStyles = {
      none: 'p-0',
      sm: 'p-2',
      md: 'p-4',
      lg: 'p-6'
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Win2000Panel.displayName = 'Win2000Panel';

export default Win2000Panel;
