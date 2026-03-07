import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Building2, 
  MapPin, 
  Phone, 
  Mail,
  Shield,
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Bell,
  ArrowLeft,
  Camera,
  Loader2,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import AnalyticsCharts from '@/components/dashboard/AnalyticsCharts';
import StatementGenerator from '@/components/profile/StatementGenerator';
import TwoFactorAuth from '@/components/profile/TwoFactorAuth';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69918ad956166c66b33e2ffc/048c9dd05_EscroPay-Brand-Logo2.png";

const Escrow = base44.entities.Escrow;

const kycStatusConfig = {
  not_started: { label: 'Not Started', color: 'bg-gray-100 text-gray-700', icon: Clock },
  pending: { label: 'Pending Review', color: 'bg-amber-100 text-amber-700', icon: Clock },
  verified: { label: 'Verified', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle }
};

const documentTypes = [
  { id: 'passport', label: 'Passport', description: 'Government-issued passport' },
  { id: 'drivers_license', label: "Driver's License", description: 'Valid driver\'s license' },
  { id: 'national_id', label: 'National ID', description: 'National identification card' },
  { id: 'proof_of_address', label: 'Proof of Address', description: 'Utility bill or bank statement (within 3 months)' }
];

export default function Profile() {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const defaultTab = urlParams.get('tab') || 'profile';

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: escrows = [] } = useQuery({
    queryKey: ['user-escrows'],
    queryFn: () => Escrow.list('-created_date', 100)
  });

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    country: '',
    notification_preferences: {
      email_escrow_updates: true,
      email_disputes: true,
      email_marketing: false
    }
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        company: user.company || '',
        address: user.address || '',
        city: user.city || '',
        country: user.country || '',
        notification_preferences: user.notification_preferences || {
          email_escrow_updates: true,
          email_disputes: true,
          email_marketing: false
        }
      });
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await base44.auth.updateMe(formData);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    } catch (err) {
      console.error('Save failed:', err);
    }
    setIsSaving(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ avatar_url: file_url });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    } catch (err) {
      console.error('Avatar upload failed:', err);
    }
  };

  const handleDocumentUpload = async (docType, e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingDoc(docType);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const existingDocs = user?.kyc_documents || [];
      const newDoc = {
        type: docType,
        url: file_url,
        uploaded_at: new Date().toISOString(),
        status: 'pending'
      };
      
      const updatedDocs = [...existingDocs.filter(d => d.type !== docType), newDoc];
      
      await base44.auth.updateMe({ 
        kyc_documents: updatedDocs,
        kyc_status: 'pending'
      });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    } catch (err) {
      console.error('Document upload failed:', err);
    }
    setUploadingDoc(null);
  };

  const kycStatus = kycStatusConfig[user?.kyc_status || 'not_started'];
  const KycIcon = kycStatus.icon;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('Dashboard')}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <Link to={createPageUrl('Home')}>
                <img src={LOGO_URL} alt="EscroPay" className="h-8" />
              </Link>
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-purple-600" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <Camera className="w-4 h-4 text-gray-600" />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user?.full_name || 'Your Name'}</h1>
              <p className="text-gray-500">{user?.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <Badge className={kycStatus.color}>
                  <KycIcon className="w-3 h-3 mr-1" />
                  KYC: {kycStatus.label}
                </Badge>
                <span className="text-sm text-gray-400">
                  Member since {user?.created_date ? format(new Date(user.created_date), 'MMM yyyy') : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-white border border-gray-200">
            <TabsTrigger value="profile" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="kyc" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
              <Shield className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">KYC Documents</span>
              <span className="sm:hidden">KYC</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
              <BarChart3 className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
              <Shield className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Security</span>
              <span className="sm:hidden">2FA</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    Full Name
                  </Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    Email
                  </Label>
                  <Input value={user?.email || ''} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    Phone
                  </Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    Company
                  </Label>
                  <Input
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Company name"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  Address
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label>Street Address</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="New York"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="United States"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* KYC Tab */}
          <TabsContent value="kyc">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Identity Verification</h3>
                  <p className="text-sm text-gray-500">Upload documents to verify your identity</p>
                </div>
                <Badge className={kycStatus.color}>
                  <KycIcon className="w-3 h-3 mr-1" />
                  {kycStatus.label}
                </Badge>
              </div>

              <div className="space-y-4">
                {documentTypes.map((docType) => {
                  const existingDoc = (user?.kyc_documents || []).find(d => d.type === docType.id);
                  const docStatus = existingDoc?.status;
                  
                  return (
                    <div
                      key={docType.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-purple-200 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gray-100 rounded-lg">
                          <FileText className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{docType.label}</h4>
                          <p className="text-sm text-gray-500">{docType.description}</p>
                          {existingDoc && (
                            <p className="text-xs text-gray-400 mt-1">
                              Uploaded {format(new Date(existingDoc.uploaded_at), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {docStatus === 'approved' && (
                          <Badge className="bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Approved
                          </Badge>
                        )}
                        {docStatus === 'pending' && (
                          <Badge className="bg-amber-100 text-amber-700">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                        {docStatus === 'rejected' && (
                          <Badge className="bg-red-100 text-red-700">
                            <XCircle className="w-3 h-3 mr-1" />
                            Rejected
                          </Badge>
                        )}
                        <label>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleDocumentUpload(docType.id, e)}
                            className="hidden"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                            asChild
                          >
                            <span>
                              {uploadingDoc === docType.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Upload className="w-4 h-4 mr-1" />
                                  {existingDoc ? 'Replace' : 'Upload'}
                                </>
                              )}
                            </span>
                          </Button>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="space-y-6">
              <AnalyticsCharts escrows={escrows} />
              <StatementGenerator escrows={escrows} />
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <TwoFactorAuth user={user} />
            </motion.div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Email Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Escrow Updates</h4>
                    <p className="text-sm text-gray-500">Get notified about escrow status changes</p>
                  </div>
                  <Switch
                    checked={formData.notification_preferences.email_escrow_updates}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      notification_preferences: {
                        ...formData.notification_preferences,
                        email_escrow_updates: checked
                      }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Dispute Alerts</h4>
                    <p className="text-sm text-gray-500">Get notified about dispute activities</p>
                  </div>
                  <Switch
                    checked={formData.notification_preferences.email_disputes}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      notification_preferences: {
                        ...formData.notification_preferences,
                        email_disputes: checked
                      }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Marketing Updates</h4>
                    <p className="text-sm text-gray-500">Receive news and promotional content</p>
                  </div>
                  <Switch
                    checked={formData.notification_preferences.email_marketing}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      notification_preferences: {
                        ...formData.notification_preferences,
                        email_marketing: checked
                      }
                    })}
                  />
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}