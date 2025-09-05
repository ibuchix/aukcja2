import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { resetPassword } from '@/services/auth/passwordReset';

interface PasswordResetForm {
  email: string;
  taxId: string;
  businessRegistryNumber: string;
  supervisorName: string;
  newPassword: string;
  confirmPassword: string;
}

type Step = 'email' | 'verification' | 'password' | 'success';

export default function PasswordReset() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors }, trigger } = useForm<PasswordResetForm>();

  const watchedEmail = watch('email');
  const watchedPassword = watch('newPassword');

  const handleNextStep = async (nextStep: Step) => {
    setError(null);
    
    if (currentStep === 'email') {
      const isValid = await trigger('email');
      if (isValid) {
        setCurrentStep(nextStep);
      }
    } else if (currentStep === 'verification') {
      const fieldsValid = await trigger(['taxId', 'businessRegistryNumber', 'supervisorName']);
      if (fieldsValid) {
        setCurrentStep(nextStep);
      }
    }
  };

  const onSubmit = async (data: PasswordResetForm) => {
    if (data.newPassword !== data.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await resetPassword({
        email: data.email,
        taxId: data.taxId,
        businessRegistryNumber: data.businessRegistryNumber,
        supervisorName: data.supervisorName,
        newPassword: data.newPassword
      });

      if (result.success) {
        setCurrentStep('success');
      } else {
        setError(result.error || 'Password reset failed');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'email':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
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
            <Button 
              type="button" 
              onClick={() => handleNextStep('verification')}
              className="w-full"
              disabled={!watchedEmail}
            >
              Continue
            </Button>
          </>
        );

      case 'verification':
        return (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID (NIP)</Label>
                <Input
                  id="taxId"
                  placeholder="Enter your tax ID"
                  {...register('taxId', { required: 'Tax ID is required' })}
                />
                {errors.taxId && (
                  <p className="text-sm text-[#D81B24]">{errors.taxId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessRegistryNumber">Business Registry Number (REGON)</Label>
                <Input
                  id="businessRegistryNumber"
                  placeholder="Enter your business registry number"
                  {...register('businessRegistryNumber', { required: 'Business registry number is required' })}
                />
                {errors.businessRegistryNumber && (
                  <p className="text-sm text-[#D81B24]">{errors.businessRegistryNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="supervisorName">Supervisor Name</Label>
                <Input
                  id="supervisorName"
                  placeholder="Enter supervisor name"
                  {...register('supervisorName', { required: 'Supervisor name is required' })}
                />
                {errors.supervisorName && (
                  <p className="text-sm text-[#D81B24]">{errors.supervisorName.message}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setCurrentStep('email')}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                type="button" 
                onClick={() => handleNextStep('password')}
                className="flex-1"
              >
                Verify Identity
              </Button>
            </div>
          </>
        );

      case 'password':
        return (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  {...register('newPassword', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters long'
                    }
                  })}
                />
                {errors.newPassword && (
                  <p className="text-sm text-[#D81B24]">{errors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  {...register('confirmPassword', { required: 'Please confirm your password' })}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-[#D81B24]">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setCurrentStep('verification')}
                className="flex-1"
                disabled={isLoading}
              >
                Back
              </Button>
              <Button 
                type="submit"
                className="flex-1"
                disabled={isLoading || !watchedPassword}
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          </>
        );

      case 'success':
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-white">Password Reset Successful!</h3>
              <p className="text-gray-400 mt-2">
                Your password has been reset successfully. You can now log in with your new password.
              </p>
            </div>
            <Button 
              onClick={() => navigate('/auth')}
              className="w-full"
            >
              Go to Login
            </Button>
          </div>
        );
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'email': return 'Reset Password';
      case 'verification': return 'Verify Identity';
      case 'password': return 'Create New Password';
      case 'success': return 'Success!';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'email': return 'Enter your email address to begin the password reset process.';
      case 'verification': return 'Please provide the following information to verify your identity.';
      case 'password': return 'Choose a strong new password for your account.';
      case 'success': return '';
    }
  };

  return (
    <div className="min-h-screen bg-[#454545] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="space-y-4">
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
              <CardTitle className="text-xl text-white">{getStepTitle()}</CardTitle>
              {getStepDescription() && (
                <CardDescription className="text-gray-400">
                  {getStepDescription()}
                </CardDescription>
              )}
            </div>
          </div>

          {/* Step indicator */}
          {currentStep !== 'success' && (
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${currentStep === 'email' ? 'bg-[#D81B24]' : 'bg-gray-600'}`} />
              <div className={`w-2 h-2 rounded-full ${currentStep === 'verification' ? 'bg-[#D81B24]' : 'bg-gray-600'}`} />
              <div className={`w-2 h-2 rounded-full ${currentStep === 'password' ? 'bg-[#D81B24]' : 'bg-gray-600'}`} />
            </div>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {renderStepContent()}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}