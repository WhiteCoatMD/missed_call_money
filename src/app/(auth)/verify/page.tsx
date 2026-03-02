'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-lg shadow text-center">
        <div className="flex justify-center">
          <Image src="/logo.png" alt="Missed Call Money" width={200} height={50} priority />
        </div>

        <div className="space-y-3">
          <div className="text-5xl">📧</div>
          <h2 className="text-2xl font-bold text-gray-900">Check Your Email</h2>
          <p className="text-gray-600">
            We sent a confirmation link to your email address. Click the link to verify your account and get started.
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            Don&apos;t see the email? Check your spam folder or wait a minute and try again.
          </p>
        </div>

        <p className="text-sm text-gray-500">
          Already verified?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
