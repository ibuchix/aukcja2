import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { SecureInput } from '@/components/ui/secure-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { requestPasswordReset } from '@/services/auth/passwordReset';

interface PasswordResetRequestForm {
  email: string;
  taxId: string;
  businessRegistryNumber: string;
  supervisorName: string;
}

export default function PasswordReset() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<PasswordResetRequestForm>();

  const onSubmit = async (data: PasswordResetRequestForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await requestPasswordReset({
        email: data.email.trim(),
        taxId: data.taxId.trim(),
        businessRegistryNumber: data.businessRegistryNumber.trim(),
        supervisorName: data.supervisorName.trim()
      });

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Password reset request failed');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#454545] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Mail className="h-16 w-16 text-[#D81B24] mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-white">Check Your Email</h3>
                <p className="text-gray-400 mt-2">
                  We've sent password reset instructions to your email address. 
                  Please check your inbox and follow the link to reset your password.
                </p>
              </div>
              <Button 
                onClick={() => navigate('/auth')}
                className="w-full"
              >
                Return to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#454545] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/auth')}
              className="p-2 hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="text-xl text-white">Reset Password</CardTitle>
              <CardDescription className="text-gray-400">
                Enter your details to receive password reset instructions
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <SecureInput
                id="email"
                type="email"
                fieldType="email"
                maxLength={255}
                placeholder="Enter your registered email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Please enter a valid email address'
                  }
                })}
              />
              {errors.email && (
                <p className="text-sm text-[#D81B24]">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID (NIP)</Label>
              <SecureInput
                id="taxId"
                fieldType="digits"
                maxLength={10}
                placeholder="Enter your tax ID"
                {...register('taxId', { required: 'Tax ID is required' })}
              />
              {errors.taxId && (
                <p className="text-sm text-[#D81B24]">{errors.taxId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessRegistryNumber">Business Registry Number (REGON)</Label>
              <SecureInput
                id="businessRegistryNumber"
                fieldType="digits"
                maxLength={14}
                placeholder="Enter your business registry number"
                {...register('businessRegistryNumber', { required: 'Business registry number is required' })}
              />
              {errors.businessRegistryNumber && (
                <p className="text-sm text-[#D81B24]">{errors.businessRegistryNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="supervisorName">Supervisor Name</Label>
              <SecureInput
                id="supervisorName"
                fieldType="name"
                maxLength={100}
                placeholder="Enter supervisor name"
                {...register('supervisorName', { required: 'Supervisor name is required' })}
              />
              {errors.supervisorName && (
                <p className="text-sm text-[#D81B24]">{errors.supervisorName.message}</p>
              )}
            </div>

            <Button 
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Reset Instructions'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
