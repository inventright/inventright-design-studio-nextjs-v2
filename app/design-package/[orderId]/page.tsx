'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/ui/GlassCard';
import { toast } from 'sonner';

interface DesignPackage {
  id: number;
  orderId: string;
  purchaseDate: string;
  virtualPrototypeStatus: string;
  virtualPrototypeJobId: number | null;
  sellSheetStatus: string;
  sellSheetJobId: number | null;
  packageStatus: string;
}

export default function DesignPackagePage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  
  const [packageData, setPackageData] = useState<DesignPackage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackageData = async () => {
      try {
        const response = await fetch(`/api/design-packages/${orderId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setPackageData(data.package);
          } else {
            toast.error('Design package not found');
          }
        } else {
          toast.error('Failed to load design package');
        }
      } catch (error) {
        console.error('Error fetching package:', error);
        toast.error('Failed to load design package');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchPackageData();
    }
  }, [orderId]);

  const handleStartVirtualPrototype = () => {
    router.push(`/job-intake?jobType=virtual_prototype&packageId=${orderId}`);
  };

  const handleStartSellSheet = () => {
    if (packageData?.virtualPrototypeStatus !== 'completed') {
      toast.error('Please complete your Virtual Prototype first');
      return;
    }
    router.push(`/job-intake?jobType=sell_sheet&packageId=${orderId}`);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; className: string }> = {
      not_started: { text: 'Not Started', className: 'bg-gray-100 text-gray-800' },
      in_progress: { text: 'In Progress', className: 'bg-blue-100 text-blue-800' },
      completed: { text: 'Completed', className: 'bg-green-100 text-green-800' },
      locked: { text: 'Locked', className: 'bg-yellow-100 text-yellow-800' },
    };
    return badges[status] || badges.not_started;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="text-center py-12">
            <p className="text-gray-500">Loading your design package...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-24">
          <GlassCard className="p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Design Package Not Found</h1>
            <p className="text-gray-600 mb-6">We couldn't find this design package. Please check your order confirmation email.</p>
            <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
          </GlassCard>
        </div>
      </div>
    );
  }

  const vpBadge = getStatusBadge(packageData.virtualPrototypeStatus);
  const ssBadge = getStatusBadge(packageData.sellSheetStatus);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Thank you for purchasing the Design Package!
          </h1>
          <p className="text-xl text-gray-600">
            We're excited to help bring your product idea to life.
          </p>
        </div>

        {/* Package Includes */}
        <GlassCard className="p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Design Package includes:</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <div className="flex-1">
                <span className="text-lg font-medium text-gray-900">1 Free Virtual Prototype</span>
                <span className="text-gray-600 ml-2">($375 value)</span>
              </div>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${vpBadge.className}`}>
                {vpBadge.text}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <div className="flex-1">
                <span className="text-lg font-medium text-gray-900">1 Free Sell Sheet</span>
                <span className="text-gray-600 ml-2">($375 value)</span>
              </div>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${ssBadge.className}`}>
                {ssBadge.text}
              </span>
            </div>
          </div>
        </GlassCard>

        {/* How It Works */}
        <GlassCard className="p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">HERE'S HOW IT WORKS:</h2>
          
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Your Virtual Prototype</h3>
                <p className="text-gray-600 mb-4">
                  Click the button below or visit your dashboard to begin. You'll fill out a simple form describing your product, and our designers will create a professional 3D rendering.
                </p>
                {packageData.virtualPrototypeStatus === 'not_started' && (
                  <Button 
                    onClick={handleStartVirtualPrototype}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    🚀 Get started with your virtual prototype
                  </Button>
                )}
                {packageData.virtualPrototypeStatus === 'in_progress' && (
                  <div className="text-blue-600 font-medium">✓ Virtual Prototype in progress</div>
                )}
                {packageData.virtualPrototypeStatus === 'completed' && (
                  <div className="text-green-600 font-medium">✓ Virtual Prototype completed!</div>
                )}
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Review & Complete Your Virtual Prototype</h3>
                <p className="text-gray-600">
                  Once your virtual prototype is ready, you'll review it. After it's marked complete, you'll be prompted to move on to your Sell Sheet.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Your Sell Sheet</h3>
                <p className="text-gray-600 mb-4">
                  After your Virtual Prototype is complete, you can start your Sell Sheet order. This creates a professional one-page marketing document for your product.
                </p>
                {packageData.sellSheetStatus === 'locked' && (
                  <div className="text-gray-500 italic">🔒 Unlocks after Virtual Prototype is completed</div>
                )}
                {packageData.sellSheetStatus === 'not_started' && packageData.virtualPrototypeStatus === 'completed' && (
                  <Button 
                    onClick={handleStartSellSheet}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    📄 Start your sell sheet
                  </Button>
                )}
                {packageData.sellSheetStatus === 'in_progress' && (
                  <div className="text-blue-600 font-medium">✓ Sell Sheet in progress</div>
                )}
                {packageData.sellSheetStatus === 'completed' && (
                  <div className="text-green-600 font-medium">✓ Sell Sheet completed!</div>
                )}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Important Note */}
        <GlassCard className="p-6 mb-6 bg-yellow-50 border-2 border-yellow-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">⚠️ IMPORTANT NOTE:</h3>
          <p className="text-gray-700">
            You must complete and close out your Virtual Prototype job before starting your Sell Sheet. This ensures the best quality for both deliverables.
          </p>
        </GlassCard>

        {/* Access Information */}
        <GlassCard className="p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">You can access both jobs anytime from:</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-center gap-2">
              <span className="text-blue-600">→</span>
              <span>Your Client Dashboard</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-600">→</span>
              <span>The Design Package order page (this page)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-600">→</span>
              <span>Email links we'll send you</span>
            </li>
          </ul>
        </GlassCard>

        {/* Support */}
        <GlassCard className="p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Questions?</h3>
          <p className="text-gray-600 mb-4">
            Contact customer support via our chat on the main inventRight website or call us at{' '}
            <a href="tel:1-800-701-7993" className="text-blue-600 hover:underline font-semibold">
              1-800-701-7993
            </a>
          </p>
          <p className="text-xl font-semibold text-gray-900 mb-2">Let's get started!</p>
          <p className="text-gray-600">
            Best regards,<br />
            <span className="font-semibold">The inventRight Design Studio Team</span>
          </p>
        </GlassCard>

        {/* Dashboard Link */}
        <div className="text-center mt-6">
          <Button 
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="text-gray-600"
          >
            ← Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
