import React from 'react';
import { Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function StatusAutomationInfo() {
  return (
    <Alert className="bg-blue-50 border-blue-200">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-900 font-semibold">Automatic Status Updates</AlertTitle>
      <AlertDescription className="text-blue-800 text-sm space-y-1 mt-2">
        <p>• Status changes to <strong>Job in Progress</strong> when designer is assigned or opens job</p>
        <p>• Status changes to <strong>Proof Sent</strong> when designer sends a proof</p>
        <p>• Status changes to <strong>Revisions Requested</strong> when client replies after proof</p>
        <p>• Notifications are sent automatically for all status changes</p>
      </AlertDescription>
    </Alert>
  );
}
