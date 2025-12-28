/**
 * Skeleton Card con Shimmer Effect
 * Componente de carga para ManhwaCard usando anime.js
 */

import React, { useEffect, useRef } from 'react';
import anime from 'animejs';

export const SkeletonCard = () => {
  const shimmerRef = useRef(null);

  useEffect(() => {
    // Animación de shimmer infinita
    if (shimmerRef.current) {
      anime({
        targets: shimmerRef.current,
        translateX: ['-100%', '100%'],
        duration: 1500,
        easing: 'easeInOutQuad',
        loop: true,
      });
    }
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col h-full animate-pulse">
      {/* Cover Skeleton */}
      <div className="relative h-40 sm:h-52 md:h-64 bg-gray-200 dark:bg-gray-700 overflow-hidden">
        {/* Shimmer Effect */}
        <div
          ref={shimmerRef}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          style={{ transform: 'translateX(-100%)' }}
        />
      </div>

      {/* Content Skeleton */}
      <div className="p-2.5 sm:p-3 md:p-4 flex flex-col flex-grow gap-2 sm:gap-3">
        {/* Title */}
        <div className="h-4 sm:h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        
        {/* Author */}
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        
        {/* Description */}
        <div className="flex-grow space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
        </div>
        
        {/* Button */}
        <div className="h-9 sm:h-10 bg-gray-200 dark:bg-gray-700 rounded-lg sm:rounded-xl mt-auto" />
      </div>
    </div>
  );
};

export default SkeletonCard;
