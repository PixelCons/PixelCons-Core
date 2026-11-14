import React, {useEffect, useState} from 'react';

// Keep every anchor once complete. Returning to a scrolled gallery renders the
// whole list immediately so the existing history restoration can run unchanged.
export default function Progressive({children, className}: {children: React.ReactNode[]; className: string}) {
  const [count, setCount] = useState(() =>
    Number(sessionStorage.getItem('scrollPosition')) > 0 ? children.length : 500,
  );
  useEffect(() => {
    if (count >= children.length) return;
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;
    let next = count;
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(advance);
    });
    function advance() {
      if (cancelled) return;
      next += 1500;
      setCount((previous) => Math.min(children.length, previous + 1500));
      if (next < children.length) timer = setTimeout(advance, 0);
    }
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [count, children]);
  return <div className={className}>{children.slice(0, count)}</div>;
}
