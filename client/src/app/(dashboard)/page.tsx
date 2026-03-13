'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useEmergency } from '@/hooks/useEmergency';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { SOCIETY_NAME } from '@/lib/constants';

import {
  PaymentCard,
  ComplaintsWidget,
  AssetStatusWidget,
  EmergencyBanner,
  EmergencyButton,
} from '@/components/dashboard';

import {
  AlertTriangle,
  Users,
  BarChart3,
  FileText,
  Settings,
  Activity,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Shield,
  Zap,
} from 'lucide-react';

export default function DashboardPage() {

  const router = useRouter();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const {
    activeEmergency,
    loading: emergencyLoading,
    triggerEmergency,
    resolveEmergency,
    triggerLoading,
    resolveLoading,
  } = useEmergency();

  const [maintenance, setMaintenance] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const isAdmin = user && ['manager', 'admin'].includes(user.role);

  // Redirect watchman
  useEffect(() => {
    if (!loading && user?.role === 'watchman') {
      router.replace('/watchman');
    }
  }, [user, loading, router]);

  // Fetch maintenance data
  useEffect(() => {

    const fetchMaintenance = async () => {

      try {

        const res = await api.get('/maintenance/current');

        if (res.data.success) {
          setMaintenance(res.data.data);
        }

      } catch (err) {

        console.error('Failed to load maintenance', err);

      } finally {
        setDataLoading(false);
      }

    };

    fetchMaintenance();

  }, []);

  // Emergency trigger
  const handleTriggerEmergency = async (notes?: string) => {

    try {

      await triggerEmergency(notes);

      toast({
        title: 'Emergency Alert Sent',
        description: 'All residents and staff have been notified.',
      });

    } catch (error: any) {

      toast({
        title: 'Failed to send alert',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });

    }

  };

  const handleResolveEmergency = async (id: string) => {

    try {

      await resolveEmergency(id);

      toast({
        title: 'Emergency Resolved',
        description: 'All residents have been notified.',
      });

    } catch (error: any) {

      toast({
        title: 'Failed to resolve',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });

    }

  };

  if (loading) {

    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
      </div>
    );

  }

  const hour = new Date().getHours();

  const greeting =
    hour < 12 ? 'Good Morning' :
    hour < 17 ? 'Good Afternoon' :
    'Good Evening';

  return (

    <div className="space-y-8">

      <EmergencyBanner
        emergency={activeEmergency}
        loading={emergencyLoading}
        onResolve={handleResolveEmergency}
        canResolve={isAdmin || false}
        resolveLoading={resolveLoading}
      />

      {/* Header */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {greeting}, {user?.name?.split(' ')[0]}
          </h1>

          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Flat {user?.flat_no} • {SOCIETY_NAME}
          </p>

        </div>

        <div className="flex items-center gap-3">

          <Badge variant="outline" className="px-3 py-1.5 text-sm font-medium bg-white">
            <Calendar className="w-4 h-4 mr-1.5 text-slate-400" />
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </Badge>

          {isAdmin && (
            <Badge className="bg-blue-100 text-blue-700 px-3 py-1.5">
              <Shield className="w-4 h-4 mr-1.5" />
              {user?.role === 'manager' ? 'Manager' : 'Admin'}
            </Badge>
          )}

        </div>

      </div>

      {/* Widgets */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        <PaymentCard
          totalAmount={maintenance?.total_amount}
          dueDate={maintenance?.due_date}
          status={maintenance?.status}
          lateFeesApplied={maintenance?.late_fee}
          loading={dataLoading}
        />

        <ComplaintsWidget
          openCount={2}
          inProgressCount={1}
          loading={dataLoading}
        />

        <AssetStatusWidget isAdmin={isAdmin || false} />

      </div>

      {/* Emergency + Profile */}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        <Card className="lg:col-span-3 border-0 shadow-sm">

          <CardHeader>

            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Lift Emergency
            </CardTitle>

          </CardHeader>

          <CardContent>

            <EmergencyButton
              onTrigger={handleTriggerEmergency}
              hasActiveEmergency={!!activeEmergency}
              userFlat={user?.flat_no || ''}
              triggerLoading={triggerLoading}
            />

          </CardContent>

        </Card>

        <Card className="lg:col-span-2 border-0 shadow-sm">

          <CardHeader>

            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Your Profile
            </CardTitle>

          </CardHeader>

          <CardContent className="space-y-3">

            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Phone:</strong> {user?.phone}</p>
            <p><strong>Flat:</strong> {user?.flat_no}</p>

          </CardContent>

        </Card>

      </div>

    </div>

  );

}