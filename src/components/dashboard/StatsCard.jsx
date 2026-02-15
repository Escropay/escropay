import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

export default function StatsCard({ title, value, subtitle, icon: Icon, trend, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-zinc-700/50 transition-all duration-300">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-zinc-500 text-sm font-medium tracking-wide uppercase">{title}</p>
            <h3 className="text-3xl font-bold text-white mt-2 tracking-tight">{value}</h3>
            {subtitle && (
              <p className="text-zinc-400 text-sm mt-1">{subtitle}</p>
            )}
            {trend && (
              <div className={cn(
                "flex items-center gap-1 mt-3 text-sm font-medium",
                trend > 0 ? "text-emerald-400" : "text-red-400"
              )}>
                <span>{trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>
                <span className="text-zinc-500 font-normal">vs last month</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className="p-3 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl border border-cyan-500/20">
              <Icon className="w-6 h-6 text-cyan-400" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}