import React from 'react';
import { motion } from 'motion/react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  extraInfo?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  id?: string;
}

export default function KpiCard({
  title,
  value,
  subtitle,
  extraInfo,
  trend,
  icon,
  rightElement,
  id
}: KpiCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2, borderColor: '#F2C94C' }}
      transition={{ duration: 0.2 }}
      className="bg-[#0F131C]/90 border border-[#1A2130] rounded-xl p-5 shadow-lg relative overflow-hidden group flex items-center justify-between"
      id={id}
    >
      <div className="space-y-1 text-left flex-1">
        <span className="text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase block">
          {title}
        </span>
        
        <div className="flex items-baseline gap-2 pt-0.5">
          <span className="text-2xl font-bold tracking-wide text-white">
            {value}
          </span>
          {trend && (
            <span className={`text-xs font-mono font-bold ${trend.isPositive ? 'text-red-500' : 'text-green-500'}`}>
              {trend.value}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-500 uppercase tracking-widest pt-1">
          {icon && <span className="text-brand-gold/60">{icon}</span>}
          <span>{subtitle}</span>
          {extraInfo && <span className="text-gray-600 font-normal">| {extraInfo}</span>}
        </div>
      </div>

      {rightElement && (
        <div className="ml-4 flex items-center justify-center shrink-0">
          {rightElement}
        </div>
      )}
    </motion.div>
  );
}
