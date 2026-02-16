import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  Download, 
  Calendar,
  Loader2
} from 'lucide-react';
import { format, isWithinInterval, parseISO } from 'date-fns';

export default function StatementGenerator({ escrows }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!startDate || !endDate) return;
    
    setIsGenerating(true);

    const start = parseISO(startDate);
    const end = parseISO(endDate);

    const filteredEscrows = escrows.filter(e => {
      if (!e.created_date) return false;
      const created = new Date(e.created_date);
      return isWithinInterval(created, { start, end });
    });

    // Calculate stats
    const totalVolume = filteredEscrows.reduce((sum, e) => sum + (e.amount || 0), 0);
    const released = filteredEscrows.filter(e => e.status === 'released');
    const releasedVolume = released.reduce((sum, e) => sum + (e.amount || 0), 0);

    // Generate HTML content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>EscroPay Statement</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #9333ea; padding-bottom: 20px; }
    .header h1 { color: #9333ea; margin: 0; }
    .header p { color: #666; margin-top: 5px; }
    .summary { background: #f8f4ff; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .summary-item { text-align: center; }
    .summary-item .value { font-size: 24px; font-weight: bold; color: #9333ea; }
    .summary-item .label { color: #666; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f5f5f5; font-weight: 600; }
    .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
    .status-released { background: #d1fae5; color: #065f46; }
    .status-funded { background: #cffafe; color: #0e7490; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-disputed { background: #fee2e2; color: #991b1b; }
    .status-refunded { background: #f3f4f6; color: #374151; }
    .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>EscroPay</h1>
    <p>Transaction Statement</p>
    <p>${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}</p>
  </div>
  
  <div class="summary">
    <div class="summary-grid">
      <div class="summary-item">
        <div class="value">${filteredEscrows.length}</div>
        <div class="label">Total Transactions</div>
      </div>
      <div class="summary-item">
        <div class="value">$${totalVolume.toLocaleString()}</div>
        <div class="label">Total Volume</div>
      </div>
      <div class="summary-item">
        <div class="value">$${releasedVolume.toLocaleString()}</div>
        <div class="label">Released</div>
      </div>
    </div>
  </div>

  <h3>Transaction Details</h3>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Title</th>
        <th>Counterparty</th>
        <th>Amount</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${filteredEscrows.map(e => `
        <tr>
          <td>${e.created_date ? format(new Date(e.created_date), 'MMM d, yyyy') : '-'}</td>
          <td>${e.title}</td>
          <td>${e.buyer_email} / ${e.seller_email}</td>
          <td>$${e.amount?.toLocaleString()}</td>
          <td><span class="status status-${e.status}">${e.status}</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>Generated on ${format(new Date(), 'MMM d, yyyy \'at\' h:mm a')}</p>
    <p>EscroPay - Secure Escrow Platform</p>
  </div>
</body>
</html>
    `;

    // Create and download file
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `escropay-statement-${format(start, 'yyyy-MM-dd')}-to-${format(end, 'yyyy-MM-dd')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setIsGenerating(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <FileText className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Generate Statement</h3>
          <p className="text-sm text-gray-500">Download a summary of your transactions</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            Start Date
          </Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            End Date
          </Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={!startDate || !endDate || isGenerating}
        className="w-full bg-purple-600 hover:bg-purple-700"
      >
        {isGenerating ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        Generate Statement
      </Button>
    </div>
  );
}