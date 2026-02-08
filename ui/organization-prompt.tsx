'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight, Users } from 'lucide-react';

const OrganizationPrompt = () => {
  const [countdown, setCountdown] = useState(15);
  const router = useRouter();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      router.push('/main/create-org');
      return;
    }
  }, [countdown, router]);

  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <div className="w-full max-w-xl rounded-lg bg-slate-800 p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-full bg-blue-500 p-3">
            <Users className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-white">
            Organization Required
          </h2>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-3 rounded-lg bg-slate-700/50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
            <p className="text-slate-200">
              You need to be part of an organization to access this feature. You
              can either request an invitation to join an existing organization
              or create your own.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <button
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-500 
                         px-4 py-3 font-medium text-white transition-colors hover:bg-blue-600"
              onClick={() => {
                /* Handle invitation request */
              }}
            >
              Request Invitation
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-600 
                         px-4 py-3 font-medium text-white transition-colors hover:bg-slate-700"
              onClick={() => router.push('/main/create-org')}
            >
              Create Organization
              <Users className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center">
            <div className="rounded-full bg-slate-700/50 px-4 py-2 text-sm text-slate-300">
              Redirecting to organization creation in {countdown} seconds
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationPrompt;
