'use client';

import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo' | 'yellow';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

const colorVariants = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  purple: 'text-purple-600',
  orange: 'text-orange-600',
  red: 'text-red-600',
  indigo: 'text-indigo-600',
  yellow: 'text-yellow-600',
};

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
  trend,
  onClick
}: StatsCardProps) {
  const isClickable = !!onClick;

  return (
    <div
      className={cn(
        'bg-white p-6 rounded-lg shadow border transition-all duration-200',
        isClickable && 'cursor-pointer hover:shadow-md hover:scale-[1.02]'
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            {icon && <span className="text-lg">{icon}</span>}
            <h3 className="text-sm font-medium text-gray-700">{title}</h3>
          </div>
          
          <div className="flex items-baseline space-x-2">
            <p className={cn('text-3xl font-bold', colorVariants[color])}>
              {typeof value === 'number' && value > 999 
                ? value.toLocaleString() 
                : value
              }
            </p>
            
            {trend && (
              <span
                className={cn(
                  'text-sm font-medium flex items-center',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.isPositive ? '↗️' : '↘️'}
                {Math.abs(trend.value)}%
              </span>
            )}
          </div>
          
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        
        {isClickable && (
          <div className="ml-4">
            <span className="text-gray-400 hover:text-gray-600">
              →
            </span>
          </div>
        )}
      </div>
    </div>
  );
}