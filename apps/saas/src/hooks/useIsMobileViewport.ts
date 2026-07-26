import { useEffect, useState } from 'react';

const mobileMediaQuery = '(max-width: 767px)';

export const useIsMobileViewport = () => {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(mobileMediaQuery).matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(mobileMediaQuery);
    const update = () => setIsMobile(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  return isMobile;
};
