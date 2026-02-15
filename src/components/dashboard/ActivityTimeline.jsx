import React from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Wallet,
  Plus,
  ArrowRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";

const activityConfig = {
  created: { icon: Plus, color: 'text-purple-600', bg: 'bg-purple-100' },
  funded: { icon: Wallet, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  released: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  disputed: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
  refunded: { icon: ArrowRight, color: 'text-gray-600', bg: 'bg-gray-100' }
};

export default function ActivityTimeline({ escrows }) {
  // Generate activity from escrows
  const activities = escrows
    .flatMap(escrow => {
      const acts = [{
        type: 'created',
        escrow: escrow.title,
        amount: escrow.amount,
        date: escrow.created_date
      }];
      
      if (escrow.funded_at) {
        acts.push({
          type: 'funded',
          escrow: escrow.title,
          amount: escrow.amount,
          date: escrow.funded_at
        });
      }
      if (escrow.released_at) {
        acts.push({
          type: 'released',
          escrow: escrow.title,
          amount: escrow.amount,
          date: escrow.released_at
        });
      }
      if (escrow.disputed_at) {
        acts.push({
          type: 'disputed',
          escrow: escrow.title,
          amount: escrow.amount,
          date: escrow.disputed_at
        });
      }
      
      return acts;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);

  const getActivityMessage = (activity) => {
    const messages = {
      created: `Escrow "${activity.escrow}" created`,
      funded: `$${activity.amount?.toLocaleString()} funded to escrow`,
      released: `Funds released for "${activity.escrow}"`,
      disputed: `Dispute raised on "${activity.escrow}"`,
      refunded: `Refund processed for "${activity.escrow}"`
    };
    return messages[activity.type] || 'Activity recorded';
  };

  if (activities.length === 0) {
    return (
      <div className="bg-white backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="flex items-center justify-center py-8 text-gray-500">
          <Clock className="w-5 h-5 mr-2" />
          No activity yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
      <div className="space-y-1">
        {activities.map((activity, index) => {
          const config = activityConfig[activity.type] || activityConfig.created;
          const Icon = config.icon;
          
          return (
            <motion.div
              key={`${activity.type}-${activity.date}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative flex gap-4 pb-4"
            >
              {index < activities.length - 1 && (
                <div className="absolute left-[18px] top-10 bottom-0 w-px bg-gray-200" />
              )}
              <div className={cn(
                "relative z-10 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
                config.bg
              )}>
                <Icon className={cn("w-4 h-4", config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate">
                  {getActivityMessage(activity)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {activity.date && formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}