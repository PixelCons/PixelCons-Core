import React from 'react';
import {toHash, useRouter} from '../router';

type LinkProps = Omit<React.ComponentPropsWithoutRef<'a'>, 'href'> & {
  href: string;
  replace?: boolean;
  prefetch?: boolean;
};

export default function Link({href, replace, prefetch: _prefetch, onClick, children, ...props}: LinkProps) {
  const router = useRouter();
  return (
    <a
      {...props}
      href={toHash(href)}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.altKey ||
          event.shiftKey ||
          props.target === '_blank'
        )
          return;
        if (href.startsWith('/') || href.startsWith('#')) {
          event.preventDefault();
          void (replace ? router.replace(href) : router.push(href));
        }
      }}
    >
      {children}
    </a>
  );
}
