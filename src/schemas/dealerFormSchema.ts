
import * as z from "zod";

export const dealerFormSchema = z.object({
  supervisorName: z.string()
    .min(2, {
      message: "Nazwa nadzorcy musi zawierać co najmniej 2 litery",
    })
    .max(100, {
      message: "Nazwa nadzorcy nie może przekraczać 100 znaków",
    })
    .transform((value) => value.trim())
    .refine((value) => /^[a-zA-ZĄąĆćĘęŁłŃńÓóŚśŹźŻż\s\-']+$/.test(value), {
      message: "Nazwa nadzorcy może zawierać tylko litery (polskie i angielskie), spacje, myślniki i apostrofy",
    })
    .refine((value) => !/(<script|javascript:|on\w+\s*=|<iframe)/gi.test(value), {
      message: "Nieprawidłowe znaki w nazwie nadzorcy",
    }),
  email: z.string()
    .email({
      message: "Wprowadź poprawny adres email",
    })
    .min(5, {
      message: "Email musi zawierać co najmniej 5 znaków",
    })
    .max(255, {
      message: "Email nie może przekraczać 255 znaków",
    })
    .transform((value) => value.trim().toLowerCase())
    .refine((value) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value), {
      message: "Nieprawidłowy format adresu email",
    })
    .refine((value) => !/(<script|javascript:|on\w+\s*=)/gi.test(value), {
      message: "Nieprawidłowe znaki w adresie email",
    }),
  password: z.string()
    .min(12, {
      message: "Hasło musi zawierać co najmniej 12 znaków",
    })
    .max(72, {
      message: "Hasło nie może przekraczać 72 znaków",
    })
    .refine((value) => /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]+$/.test(value), {
      message: "Hasło zawiera niedozwolone znaki",
    })
    .refine((value) => !/(<script|javascript:|on\w+\s*=)/gi.test(value), {
      message: "Nieprawidłowe znaki w haśle",
    }),
  confirmPassword: z.string(),
  phoneNumber: z.string()
    .min(9, {
      message: "Wprowadź poprawny numer telefonu",
    })
    .max(20, {
      message: "Numer telefonu nie może przekraczać 20 znaków",
    })
    .refine((value) => /^\+?[\d\s-()]+$/.test(value), {
      message: "Wprowadź poprawny format numeru telefonu",
    }),
  companyName: z.string()
    .min(2, {
      message: "Nazwa firmy musi zawierać co najmniej 2 litery",
    })
    .max(100, {
      message: "Nazwa firmy nie może przekraczać 100 znaków",
    })
    .transform((value) => value.trim())
    .refine((value) => /^[a-zA-ZĄąĆćĘęŁłŃńÓóŚśŹźŻż0-9\s.,&'\-]+$/.test(value), {
      message: "Nazwa firmy może zawierać tylko litery (polskie i angielskie), cyfry, spacje i podstawowe znaki interpunkcyjne",
    })
    .refine((value) => !/(<script|javascript:|on\w+\s*=|<iframe)/gi.test(value), {
      message: "Nieprawidłowe znaki w nazwie firmy",
    }),
  taxId: z.string()
    .length(10, {
      message: "Wprowadź Numer NIP zawierający 10 cyfr",
    })
    .refine((value) => /^\d+$/.test(value), {
      message: "NIP może zawierać tylko cyfry",
    }),
  businessRegistryNumber: z.string()
    .refine((val) => val.length === 9 || val.length === 14, {
      message: "Numer REGON musi zawierać 9 lub 14 cyfr",
    })
    .refine((value) => /^\d+$/.test(value), {
      message: "Numer REGON może zawierać tylko cyfry",
    }),
  companyAddress: z.string()
    .min(5, {
      message: "Wprowadź poprawny adres firmy",
    })
    .max(200, {
      message: "Adres firmy nie może przekraczać 200 znaków",
    })
    .transform((value) => value.trim().replace(/\s+/g, ' '))
    .refine((value) => /^[a-zA-ZĄąĆćĘęŁłŃńÓóŚśŹźŻż0-9\s.,\-/]+$/.test(value), {
      message: "Adres firmy może zawierać tylko litery (polskie i angielskie), cyfry, spacje i podstawowe znaki interpunkcyjne",
    })
    .refine((value) => !/(<script|javascript:|on\w+\s*=|<iframe)/gi.test(value), {
      message: "Nieprawidłowe znaki w adresie firmy",
    }),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Musisz zaakceptować regulamin",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Hasła nie są identyczne",
  path: ["confirmPassword"],
});

export type DealerFormValues = z.infer<typeof dealerFormSchema>;
