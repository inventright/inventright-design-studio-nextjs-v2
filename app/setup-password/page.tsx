"use client";

import { Suspense } from "react";
import SetupPasswordForm from "./SetupPasswordForm";
import { Loader2 } from "lucide-react";

export default function SetupPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <SetupPasswordForm />
    </Suspense>
  );
}
