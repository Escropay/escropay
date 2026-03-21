import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Wallet,
  Plus,
  ArrowRight,
  Calendar,
  DollarSign,
  User
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";
import { useCurrency } from '@/components/common/CurrencyContext';

const statusConfig = {
  pending: {
    label: 'Created',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: Plus,
    lineColor: 'bg-purple-400'
  },
  funded: {
    label: 'Funded',
    color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    icon: Wallet,
    lineColor: 'bg-cyan-400'
  },
  released: {
    label: 'Released',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
    lineColor: 'bg-emerald-400'
  },
  disputed: {
    label: 'Disputed',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: AlertTriangle,
    lineColor: 'bg-red-400'
  },
  refunded: {
    label: 'Refunded',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: ArrowRight,
    lineColor: 'bg-gray-400'
  }
};

export default function TimelineView({ escrows }) {
  // Generate timeline events from all escrows
  const timelineEvents = escrows
    .flatMap(escrow => {
      const events = [];
      
      // Created event
      if (escrow.created_date) {
        events.push({
          id: `${escrow.id}-created`,
          escrowId: escrow.id,
          type: 'pending',
          title: escrow.title,
          amount: escrow.amount,
          buyer: escrow.buyer_name || escrow.buyer_email,
          seller: escrow.seller_name || escrow.seller_email,
          date: escrow.created_date,
          action: 'Escrow created'
        });
      }
      
      // Funded event
      if (escrow.funded_at) {
        events.push({
          id: `${escrow.id}-funded`,
          escrowId: escrow.id,
          type: 'funded',
          title: escrow.title,
          amount: escrow.amount,
          buyer: escrow.buyer_name || escrow.buyer_email,
          seller: escrow.seller_name || escrow.seller_email,
          date: escrow.funded_at,
          action: 'Funds deposited'
        });
      }
      
      // Released event
      if (escrow.released_at) {
        events.push({
          id: `${escrow.id}-released`,
          escrowId: escrow.id,
          type: 'released',
          title: escrow.title,
          amount: escrow.amount,
          buyer: escrow.buyer_name || escrow.buyer_email,
          seller: escrow.seller_name || escrow.seller_email,
          date: escrow.released_at,
          action: 'Funds released to seller'
        });
      }
      
      // Disputed event
      if (escrow.disputed_at) {
        events.push({
          id: `${escrow.id}-disputed`,
          escrowId: escrow.id,
          type: 'disputed',
          title: escrow.title,
          amount: escrow.amount,
          buyer: escrow.buyer_name || escrow.buyer_email,
          seller: escrow.seller_name || escrow.seller_email,
          date: escrow.disputed_at,
          action: 'Dispute raised',
          reason: escrow.dispute_reason
        });
      }
      
      return events;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (timelineEvents.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Timeline Events</h3>
        <p className="text-gray-500">Transaction events will appear here as they happen.</p>
      </div>
    );
  }

  // Group events by date
  const groupedEvents = timelineEvents.reduce((groups, event) => {
    const date = format(new Date(event.date), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {});

  return (
    <div className="space-y-8">
      {Object.entries(groupedEvents).map(([date, events], groupIndex) => (
        <div key={date}>
          {/* Date Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Calendar className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-sm text-gray-500">
                {events.length} event{events.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Events */}
          <div className="ml-5 pl-6 border-l-2 border-gray-200 space-y-4">
            {events.map((event, index) => {
              const config = statusConfig[event.type];
              const Icon = config.icon;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative"
                >
                  {/* Timeline dot */}
                  <div className={cn(
                    "absolute -left-[33px] w-4 h-4 rounded-full border-2 border-white",
                    config.lineColor
                  )} />

                  {/* Event card */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-purple-200 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          config.color.split(' ')[0]
                        )}>
                          <Icon className={cn("w-4 h-4", config.color.split(' ')[1])} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{event.action}</p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(event.date), 'h:mm a')} • {formatDistanceToNow(new Date(event.date), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <Badge className={cn("border", config.color)}>
                        {config.label}
                      </Badge>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="font-medium text-gray-900 mb-2">{event.title}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          R {event.amount?.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <User className="w-4 h-4 text-gray-400" />
                          {event.buyer}
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          {event.seller}
                        </div>
                      </div>
                      {event.reason && (
                        <p className="mt-2 text-sm text-red-600">
                          Reason: {event.reason}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}