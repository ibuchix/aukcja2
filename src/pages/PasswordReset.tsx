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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-secondary border-accent">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Mail className="h-16 w-16 text-primary mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-body-text">Sprawdź swoją skrzynkę e-mail</h3>
                <p className="text-subtitle-text mt-2">
                  Wysłaliśmy instrukcje resetowania hasła na Twój adres e-mail. 
                  Sprawdź swoją skrzynkę pocztową i kliknij w link, aby zresetować hasło.
                </p>
              </div>
              <Button 
                onClick={() => navigate('/auth')}
                className="w-full"
              >
                Powrót do logowania
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-secondary border-accent">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/auth')}
              className="p-2 hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="text-xl text-body-text">Zresetuj hasło</CardTitle>
              <CardDescription className="text-subtitle-text">
                Podaj poniższe dane, aby otrzymać instrukcje resetowania hasła
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
              <Label htmlFor="email">Adres e-mail</Label>
              <SecureInput
                id="email"
                type="email"
                fieldType="email"
                maxLength={255}
                placeholder="Wprowadź swój zarejestrowany adres e-mail"
                {...register('email', {
                  required: 'Adres e-mail jest wymagany',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Wprowadź poprawny adres e-mail'
                  }
                })}
              />
              {errors.email && (
                <p className="text-sm text-primary">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxId">Numer NIP</Label>
              <SecureInput
                id="taxId"
                fieldType="digits"
                maxLength={10}
                placeholder="Wprowadź swój numer NIP"
                {...register('taxId', { required: 'Numer NIP jest wymagany' })}
              />
              {errors.taxId && (
                <p className="text-sm text-primary">{errors.taxId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessRegistryNumber">Numer REGON</Label>
              <SecureInput
                id="businessRegistryNumber"
                fieldType="digits"
                maxLength={14}
                placeholder="Wprowadź swój numer REGON"
                {...register('businessRegistryNumber', { required: 'Numer REGON jest wymagany' })}
              />
              {errors.businessRegistryNumber && (
                <p className="text-sm text-primary">{errors.businessRegistryNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="supervisorName">Imię i nazwisko opiekuna konta</Label>
              <SecureInput
                id="supervisorName"
                fieldType="name"
                maxLength={100}
                placeholder="Wprowadź imię i nazwisko opiekuna konta"
                {...register('supervisorName', { required: 'Imię i nazwisko opiekuna konta jest wymagane' })}
              />
              {errors.supervisorName && (
                <p className="text-sm text-primary">{errors.supervisorName.message}</p>
              )}
            </div>

            <Button 
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Wysyłanie...' : 'Wyślij instrukcje resetowania hasła'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
