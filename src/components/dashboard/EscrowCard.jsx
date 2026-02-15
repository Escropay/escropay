import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Wallet,
  ArrowRight,
  User,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: Clock,
    glow: 'shadow-amber-500/20'
  },
  funded: {
    label: 'Funded',
    color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    icon: Wallet,
    glow: 'shadow-cyan-500/20'
  },
  released: {
    label: 'Released',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: CheckCircle2,
    glow: 'shadow-emerald-500/20'
  },
  disputed: {
    label: 'Disputed',
    color: 'bg-red-500/10 text-red-400 border-red-500/20',
    icon: AlertTriangle,
    glow: 'shadow-red-500/20'
  },
  refunded: {
    label: 'Refunded',
    color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    icon: ArrowRight,
    glow: 'shadow-zinc-500/20'
  }
};

export default function EscrowCard({ escrow, onAction, index = 0 }) {
  const status = statusConfig[escrow.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group relative"
    >
      <div className={cn(
        "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl",
        status.glow
      )} />
      <div className="relative bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-zinc-700/50 transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
              {escrow.title}
            </h3>
            <p className="text-zinc-500 text-sm mt-1 line-clamp-2">
              {escrow.description || 'No description provided'}
            </p>
          </div>
          <Badge className={cn("border", status.color)}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {status.label}
          </Badge>
        </div>

        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-zinc-500" />
            <span className="text-zinc-400">{escrow.buyer_name || escrow.buyer_email}</span>
            <ArrowRight className="w-3 h-3 text-zinc-600" />
            <span className="text-zinc-400">{escrow.seller_name || escrow.seller_email}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
          <div>
            <p className="text-2xl font-bold text-white">
              ${escrow.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            {escrow.due_date && (
              <div className="flex items-center gap-1 text-zinc-500 text-sm mt-1">
                <Calendar className="w-3 h-3" />
                <span>Due {format(new Date(escrow.due_date), 'MMM d, yyyy')}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {escrow.status === 'pending' && (
              <Button
                size="sm"
                onClick={() => onAction(escrow.id, 'funded')}
                className="bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                <Wallet className="w-4 h-4 mr-1" />
                Fund
              </Button>
            )}
            {escrow.status === 'funded' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAction(escrow.id, 'disputed')}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Dispute
                </Button>
                <Button
                  size="sm"
                  onClick={() => onAction(escrow.id, 'released')}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Release
                </Button>
              </>
            )}
            {escrow.status === 'disputed' && (
              <Button
                size="sm"
                onClick={() => onAction(escrow.id, 'refunded')}
                className="bg-zinc-700 hover:bg-zinc-600 text-white"
              >
                Refund
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}