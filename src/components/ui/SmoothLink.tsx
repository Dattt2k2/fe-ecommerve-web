'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ComponentProps, MouseEvent } from 'react';

interface SmoothLinkProps extends ComponentProps<typeof Link> {
  prefetch?: boolean;
  replace?: boolean;
}

/**
 * Enhanced Link component with smooth navigation and reduced RSC calls
 * Prefetches pages and uses client-side navigation when possible
 */
export default function SmoothLink({ 
  href, 
  prefetch = true, 
  replace = false,
  onClick,
  children,
  ...props 
}: SmoothLinkProps) {
  const router = useRouter();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Call custom onClick if provided
    if (onClick) {
      onClick(e);
    }

    // Don't override default behavior for external links or new tabs
    if (
      e.defaultPrevented ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      (e.nativeEvent && e.nativeEvent.which === 2) ||
      typeof href === 'string' && (href.startsWith('http') || href.startsWith('mailto:'))
    ) {
      return;
    }

    // Use programmatic navigation for internal links
    e.preventDefault();
    
    if (replace) {
      router.replace(href.toString());
    } else {
      router.push(href.toString());
    }
  };

  return (
    <Link
      href={href}
      prefetch={prefetch}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
}