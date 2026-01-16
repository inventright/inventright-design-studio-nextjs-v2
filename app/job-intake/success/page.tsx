'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [jobId, setJobId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const confirmPayment = async () => {
      const paymentIntentId = searchParams.get('payment_intent');
      const redirectStatus = searchParams.get('redirect_status');

      if (!paymentIntentId) {
        setStatus('error');
        setErrorMessage('No payment information found');
        return;
      }

      if (redirectStatus !== 'succeeded') {
        setStatus('error');
        setErrorMessage('Payment was not successful');
        return;
      }

      try {
        // Get the job ID from localStorage (set during payment initiation)
        const storedJobId = localStorage.getItem('pending_payment_job_id');
        
        // Confirm the payment with our backend
        const response = await fetch('/api/payment/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntentId,
            jobId: storedJobId ? parseInt(storedJobId) : null,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setJobId(data.jobId || parseInt(storedJobId || '0'));
          setStatus('success');
          
          // Clean up localStorage
          localStorage.removeItem('pending_payment_job_id');
          
          // Redirect to job page after 3 seconds
          setTimeout(() => {
            if (data.jobId || storedJobId) {
              router.push(`/jobs/${data.jobId || storedJobId}`);
            } else {
              router.push('/dashboard/client');
            }
          }, 3000);
        } else {
          const errorData = await response.json();
          setStatus('error');
          setErrorMessage(errorData.error || 'Failed to confirm payment');
        }
      } catch (error: any) {
        console.error('Error confirming payment:', error);
        setStatus('error');
        setErrorMessage('An error occurred while confirming your payment');
      }
    };

    confirmPayment();
  }, [searchParams, router]);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                {status === 'loading' && 'Processing Payment...'}
                {status === 'success' && 'Payment Successful!'}
                {status === 'error' && 'Payment Issue'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8">
                {status === 'loading' && (
                  <>
                    <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
                    <p className="text-gray-600 text-center">
                      Please wait while we confirm your payment...
                    </p>
                  </>
                )}

                {status === 'success' && (
                  <>
                    <CheckCircle className="w-16 h-16 text-green-600 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Thank you for your payment!
                    </h3>
                    <p className="text-gray-600 text-center mb-6">
                      Your job has been successfully created and payment has been processed.
                      You will be redirected to your job details shortly.
                    </p>
                    {jobId && (
                      <Link href={`/jobs/${jobId}`}>
                        <Button>
                          View Job Details
                        </Button>
                      </Link>
                    )}
                  </>
                )}

                {status === 'error' && (
                  <>
                    <XCircle className="w-16 h-16 text-red-600 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Something went wrong
                    </h3>
                    <p className="text-gray-600 text-center mb-6">
                      {errorMessage}
                    </p>
                    <div className="flex gap-4">
                      <Link href="/job-intake">
                        <Button variant="outline">
                          Back to Job Intake
                        </Button>
                      </Link>
                      <Link href="/dashboard/client">
                        <Button>
                          Go to Dashboard
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
          <div className="max-w-2xl w-full">
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center">
                  <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
                  <p className="text-gray-600">Loading...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
