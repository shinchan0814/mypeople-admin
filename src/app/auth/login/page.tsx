'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phone, KeyRound, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const unauthorizedError = searchParams.get('error') === 'unauthorized';

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Ensure it starts with country code
    if (digits.startsWith('91')) {
      return '+' + digits;
    } else if (digits.length === 10) {
      return '+91' + digits;
    }
    return '+' + digits;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formattedPhone = formatPhoneNumber(phone);

    if (formattedPhone.length < 12) {
      setError('Please enter a valid phone number');
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // First check if this phone belongs to an admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('phone', formattedPhone)
      .single();

    if (userError || !userData?.is_admin) {
      setError('This phone number does not have admin access');
      setLoading(false);
      return;
    }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });

    if (otpError) {
      setError(otpError.message);
      setLoading(false);
      return;
    }

    setPhone(formattedPhone);
    setStep('otp');
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    });

    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Double check admin status
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', data.user.id)
        .single();

      if (userError || !userData?.is_admin) {
        await supabase.auth.signOut();
        setError('You do not have admin access');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8">
      {(error || unauthorizedError) && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">
            {error || 'You do not have permission to access this page'}
          </p>
        </div>
      )}

      {step === 'phone' ? (
        <form onSubmit={handleSendOtp} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#334155] mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 88790 49043"
                className="pl-10"
                required
              />
            </div>
            <p className="text-xs text-[#64748B] mt-2">
              Enter the phone number associated with your admin account
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Send OTP'
            )}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#334155] mb-2">
              Verification Code
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
              <Input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                className="pl-10 text-center text-lg tracking-widest"
                maxLength={6}
                required
              />
            </div>
            <p className="text-xs text-[#64748B] mt-2">
              We sent a code to {phone}
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Verify & Sign In'
            )}
          </Button>

          <button
            type="button"
            onClick={() => {
              setStep('phone');
              setOtp('');
              setError('');
            }}
            className="w-full text-sm text-[#6366F1] hover:underline"
          >
            Use a different phone number
          </button>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#A5B4FC] mb-4">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A]">MyPeople Admin</h1>
          <p className="text-[#64748B] mt-2">Sign in to access the admin panel</p>
        </div>

        {/* Login Form */}
        <Suspense fallback={
          <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8 text-center">
            <div className="w-8 h-8 border-4 border-[#E2E8F0] border-t-[#6366F1] rounded-full animate-spin mx-auto" />
          </div>
        }>
          <LoginForm />
        </Suspense>

        <p className="text-center text-sm text-[#64748B] mt-6">
          Only authorized administrators can access this panel.
        </p>
      </div>
    </div>
  );
}
