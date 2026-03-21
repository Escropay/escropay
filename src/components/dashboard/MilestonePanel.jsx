import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { base44 } from '@/api/base44Client';
import { useCurrency } from '@/components/common/CurrencyContext';

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-700', icon: Circle },
  in_progress: { label: 'In Progress', color: 'bg-cyan-100 text-cyan-700', icon: Clock },
  completed: { label: 'Completed', color: 'bg-amber-100 text-amber-700', icon: CheckCircle2 },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 }
};

export default function MilestonePanel({ escrow, onUpdate, isLoading, currentUser }) {
  const { format: formatCurrency } = useCurrency();
  const [expanded, setExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: '', amount: '', due_date: '' });
  
  const isSeller = currentUser?.email === escrow.seller_email;
  const isBuyer = currentUser?.email === escrow.buyer_email;
  const hasBanking = !!escrow.seller_banking_details?.account_number;
  
  const milestones = escrow.milestones || [];
  const completedMilestones = milestones.filter(m => m.status === 'approved').length;
  const progress = milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0;
  const totalMilestoneAmount = milestones.reduce((sum, m) => sum + (m.amount || 0), 0);

  const handleAddMilestone = () => {
    if (!newMilestone.title || !newMilestone.amount) return;
    const newAmount = parseFloat(newMilestone.amount);
    if (totalMilestoneAmount + newAmount > escrow.amount) return; // prevent overage
    
    const milestone = {
      id: Date.now().toString(),
      title: newMilestone.title,
      amount: newAmount,
      due_date: newMilestone.due_date,
      status: 'pending'
    };
    
    onUpdate(escrow.id, {
      milestones: [...milestones, milestone]
    });
    
    setNewMilestone({ title: '', amount: '', due_date: '' });
    setShowAddForm(false);
  };

  const handleMilestoneAction = async (milestoneId, newStatus) => {
    const updatedMilestones = milestones.map(m => {
      if (m.id === milestoneId) {
        return {
          ...m,
          status: newStatus,
          ...(newStatus === 'completed' && { completed_at: new Date().toISOString() }),
          ...(newStatus === 'approved' && { approved_at: new Date().toISOString() })
        };
      }
      return m;
    });
    
    await onUpdate(escrow.id, { milestones: updatedMilestones });
    
    // Notify buyer when seller marks milestone as complete
    if (newStatus === 'completed') {
      const milestone = updatedMilestones.find(m => m.id === milestoneId);
      await base44.entities.Notification.create({
        user_email: escrow.buyer_email,
        type: 'milestone_completed',
        escrow_id: escrow.id,
        title: 'Milestone completed',
        message: `Seller has marked "${milestone.title}" as complete. Please review and approve.`,
        action_url: `/EscrowView?id=${escrow.id}`
      });
    }

    // When buyer approves a milestone, trigger a payout request to admin
    if (newStatus === 'approved') {
      const milestone = updatedMilestones.find(m => m.id === milestoneId);
      // Notify seller
      await base44.entities.Notification.create({
        user_email: escrow.seller_email,
        type: 'milestone_completed',
        escrow_id: escrow.id,
        title: 'Milestone approved',
        message: `Buyer approved "${milestone.title}" (${formatCurrency(milestone.amount)}). Payout will be processed.`,
        action_url: `/EscrowView?id=${escrow.id}`
      });
      // Notify admins for payout processing
      const admins = await base44.entities.User.filter({ role: 'admin' });
      for (const admin of admins) {
        await base44.entities.Notification.create({
          user_email: admin.email,
          type: 'admin_action_required',
          escrow_id: escrow.id,
          title: 'Milestone Payout Required',
          message: `Milestone "${milestone.title}" approved for ${escrow.title}. Process payout of ${formatCurrency(milestone.amount)} to ${escrow.seller_name || escrow.seller_email}.`,
          action_url: `/Admin`
        });
      }
    }
  };

  const handleDeleteMilestone = (milestoneId) => {
    const updatedMilestones = milestones.filter(m => m.id !== milestoneId);
    onUpdate(escrow.id, { milestones: updatedMilestones });
  };

  if (escrow.status === 'released' || escrow.status === 'refunded') {
    return null;
  }

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Milestones</span>
          <Badge variant="outline" className="text-xs">
            {completedMilestones}/{milestones.length}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          {milestones.length > 0 && (
            <div className="w-24">
              <Progress value={progress} className="h-2" />
            </div>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3">
              {milestones.map((milestone, index) => {
                const config = statusConfig[milestone.status] || statusConfig.pending;
                const StatusIcon = config.icon;
                
                return (
                  <div
                    key={milestone.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{milestone.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500">{formatCurrency(milestone.amount)}</span>
                          {milestone.due_date && (
                            <span className="text-xs text-gray-400">
                              Due {format(new Date(milestone.due_date), 'MMM d')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-xs", config.color)}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Badge>
                      {milestone.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMilestoneAction(milestone.id, 'in_progress')}
                          className="text-xs h-7"
                        >
                          Start
                        </Button>
                      )}
                      {milestone.status === 'in_progress' && isSeller && (
                        <Button
                          size="sm"
                          onClick={() => handleMilestoneAction(milestone.id, 'completed')}
                          className="text-xs h-7 bg-cyan-500 hover:bg-cyan-600"
                        >
                          Mark Complete
                        </Button>
                      )}
                      {milestone.status === 'completed' && isBuyer && (
                        <Button
                          size="sm"
                          onClick={() => handleMilestoneAction(milestone.id, 'approved')}
                          className="text-xs h-7 bg-emerald-500 hover:bg-emerald-600"
                        >
                          Approve
                        </Button>
                      )}
                      {milestone.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteMilestone(milestone.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 w-7 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              {showAddForm ? (
                <div className="p-3 bg-purple-50 rounded-lg space-y-3">
                  <Input
                    placeholder="Milestone title"
                    value={newMilestone.title}
                    onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                    className="bg-white"
                  />
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                        {escrow.currency || 'ZAR'}
                      </span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={newMilestone.amount}
                        onChange={(e) => setNewMilestone({ ...newMilestone, amount: e.target.value })}
                        className="bg-white pl-12"
                      />
                    </div>
                    <Input
                      type="date"
                      value={newMilestone.due_date}
                      onChange={(e) => setNewMilestone({ ...newMilestone, due_date: e.target.value })}
                      className="bg-white flex-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddMilestone}
                      disabled={!newMilestone.title || !newMilestone.amount || (totalMilestoneAmount + parseFloat(newMilestone.amount || 0)) > escrow.amount}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddForm(true)}
                  className="w-full border-dashed border-purple-300 text-purple-600 hover:bg-purple-50"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Milestone
                </Button>
              )}

              {milestones.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Total milestone value</span>
                    <span className={cn("font-medium", totalMilestoneAmount > escrow.amount ? "text-red-600" : "text-gray-900")}>
                      {formatCurrency(totalMilestoneAmount)}
                    </span>
                  </div>
                  {totalMilestoneAmount > escrow.amount && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Total exceeds escrow amount of {formatCurrency(escrow.amount)}
                    </p>
                  )}
                  {isSeller && !hasBanking && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Add banking details in the escrow view to receive milestone payouts
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}