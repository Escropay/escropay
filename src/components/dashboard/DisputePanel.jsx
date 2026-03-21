import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  Bot, 
  Upload, 
  FileText, 
  Sparkles,
  Scale,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { cn } from "@/lib/utils";

export default function DisputePanel({ escrow, onUpdate, onClose }) {
  const [step, setStep] = useState(escrow.ai_resolution ? 'resolution' : 'reason');
  const [disputeReason, setDisputeReason] = useState(escrow.dispute_reason || '');
  const [files, setFiles] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFiles([...files, { name: file.name, url: file_url }]);
    } catch (err) {
      console.error('Upload failed:', err);
    }
    setUploadingFile(false);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setStep('analyzing');

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI dispute resolution system for an escrow platform. Analyze this dispute and provide a fair resolution recommendation.

ESCROW DETAILS:
- Title: ${escrow.title}
- Amount: R${escrow.amount?.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Buyer: ${escrow.buyer_name || escrow.buyer_email}
- Seller: ${escrow.seller_name || escrow.seller_email}
- Description: ${escrow.description || 'No description'}
- Milestones completed: ${(escrow.milestones || []).filter(m => m.status === 'approved').length}/${(escrow.milestones || []).length}

DISPUTE REASON:
${disputeReason}

Analyze the situation and provide:
1. A clear recommendation (refund_buyer, release_to_seller, or split)
2. If split, what percentage each party should receive
3. Your reasoning
4. Confidence level (0-100)

Be fair and consider both parties' perspectives.`,
        response_json_schema: {
          type: "object",
          properties: {
            recommendation: { type: "string", enum: ["refund_buyer", "release_to_seller", "split"] },
            reasoning: { type: "string" },
            confidence: { type: "number" },
            suggested_split: {
              type: "object",
              properties: {
                buyer_percent: { type: "number" },
                seller_percent: { type: "number" }
              }
            }
          },
          required: ["recommendation", "reasoning", "confidence"]
        }
      });

      const aiResolution = {
        ...result,
        generated_at: new Date().toISOString()
      };

      await onUpdate(escrow.id, {
        dispute_reason: disputeReason,
        dispute_evidence_urls: files.map(f => f.url),
        ai_resolution: aiResolution,
        status: 'disputed',
        disputed_at: escrow.disputed_at || new Date().toISOString()
      });

      // Notify admins that AI analysis is ready for review
      const admins = await base44.entities.User.filter({ role: 'admin' });
      for (const admin of admins) {
        await base44.entities.Notification.create({
          user_email: admin.email,
          type: 'admin_action_required',
          escrow_id: escrow.id,
          title: 'Dispute — AI Analysis Ready',
          message: `AI has analysed the dispute for "${escrow.title}". Recommendation: ${result.recommendation?.replace(/_/g, ' ')} (${result.confidence}% confidence). Admin action required.`,
          action_url: '/Admin'
        });
      }

      setStep('resolution');
    } catch (err) {
      console.error('AI analysis failed:', err);
      setStep('reason');
    }
    
    setIsAnalyzing(false);
  };

  // AI recommendation is advisory only — no direct status changes allowed here.
  // Admin must review ai_resolution in the Admin panel and take action.

  const resolution = escrow.ai_resolution;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Dispute Resolution</h3>
              <p className="text-sm text-gray-500">{escrow.title}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Enter Reason */}
            {step === 'reason' && (
              <motion.div
                key="reason"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Describe the issue
                  </label>
                  <Textarea
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Explain what went wrong and why you're raising this dispute..."
                    className="min-h-[120px]"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Upload evidence (optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="evidence-upload"
                    />
                    <label
                      htmlFor="evidence-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      {uploadingFile ? (
                        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                      ) : (
                        <Upload className="w-8 h-8 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-500 mt-2">
                        Click to upload screenshots or documents
                      </span>
                    </label>
                  </div>
                  {files.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {files.map((file, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                          <FileText className="w-4 h-4" />
                          {file.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={onClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAnalyze}
                    disabled={!disputeReason.trim()}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    <Bot className="w-4 h-4 mr-2" />
                    Analyze with AI
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Analyzing */}
            {step === 'analyzing' && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 text-center"
              >
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping" />
                  <div className="relative flex items-center justify-center w-full h-full bg-purple-100 rounded-full">
                    <Sparkles className="w-8 h-8 text-purple-600 animate-pulse" />
                  </div>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  AI is analyzing your dispute
                </h4>
                <p className="text-sm text-gray-500">
                  Reviewing evidence and determining fair resolution...
                </p>
              </motion.div>
            )}

            {/* Step 3: Resolution */}
            {step === 'resolution' && resolution && (
              <motion.div
                key="resolution"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="p-4 bg-gradient-to-r from-purple-50 to-cyan-50 rounded-xl border border-purple-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Scale className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-gray-900">AI Recommendation</span>
                    <Badge className="ml-auto bg-purple-100 text-purple-700">
                      {resolution.confidence}% confidence
                    </Badge>
                  </div>
                  
                  <div className="mb-4">
                    {resolution.recommendation === 'refund_buyer' && (
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="w-5 h-5" />
                        <span className="font-medium">Refund to Buyer</span>
                      </div>
                    )}
                    {resolution.recommendation === 'release_to_seller' && (
                      <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium">Release to Seller</span>
                      </div>
                    )}
                    {resolution.recommendation === 'split' && (
                      <div className="space-y-2">
                        <span className="font-medium text-gray-900">Split Funds</span>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 mb-1">Buyer</div>
                            <Progress value={resolution.suggested_split?.buyer_percent || 50} className="h-2" />
                            <div className="text-sm font-medium mt-1">
                              {resolution.suggested_split?.buyer_percent || 50}%
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 mb-1">Seller</div>
                            <Progress value={resolution.suggested_split?.seller_percent || 50} className="h-2" />
                            <div className="text-sm font-medium mt-1">
                              {resolution.suggested_split?.seller_percent || 50}%
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-gray-600">{resolution.reasoning}</p>
                </div>

                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-800 font-medium">
                    This recommendation has been submitted for admin review. An admin will make the final decision on the dispute outcome.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => setStep('reason')}
                    className="flex-1 text-gray-500 text-sm"
                  >
                    ← Add more evidence / Re-analyse
                  </Button>
                  <Button onClick={onClose} className="flex-1 bg-purple-600 hover:bg-purple-700">
                    Done
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}