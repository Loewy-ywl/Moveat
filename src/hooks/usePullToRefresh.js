import { useState, useRef, useEffect } from 'react';

export const usePullToRefresh = (onRefresh) => {
  const containerRef = useRef(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const pullDistanceRef = useRef(0);
  const threshold = 80;
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleTouchStart = (e) => {
      if (el.scrollTop > 0) return;
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    };

    const handleTouchMove = (e) => {
      if (!isPulling.current) return;
      const diff = e.touches[0].clientY - startY.current;
      if (diff > 0) {
        const newDist = Math.min(diff * 0.4, threshold + 40);
        pullDistanceRef.current = newDist;
        setPullDistance(newDist);
      } else {
        pullDistanceRef.current = 0;
        setPullDistance(0);
        isPulling.current = false;
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current) return;
      isPulling.current = false;
      if (pullDistanceRef.current > threshold) {
        setRefreshing(true);
        await onRefreshRef.current();
        setRefreshing(false);
      }
      pullDistanceRef.current = 0;
      setPullDistance(0);
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd);
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return { containerRef, pullDistance, refreshing };
};
