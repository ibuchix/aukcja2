
import * as z from "zod";

export const dealerFormSchema = z.object({
  supervisorName: z.string()
    .min(2, {
      message: "Nazwa nadzorcy musi zawierać co najmniej 2 litery",
    })
    .max(255, {
      message: "Nazwa nadzorcy nie może przekraczać 255 znaków",
    })
    .refine((value) => /^[a-zA-ZĄąĆćĘęŁłŃńÓóŚśŹźŻż\s-']+$/.test(value), {
      message: "Nazwa nadzorcy może zawierać tylko litery (polskie i angielskie), spacje, myślniki i apostrofy",
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
    }),
  password: z.string()
    .min(8, {
      message: "Hasło musi zawierać co najmniej 8 znaków",
    })
    .max(72, {
      message: "Hasło nie może przekraczać 72 znaków",
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
    .max(255, {
      message: "Nazwa firmy nie może przekraczać 255 znaków",
    })
    .refine((value) => /^[a-zA-ZĄąĆćĘęŁłŃńÓóŚśŹźŻż0-9\s.,&'-]+$/.test(value), {
      message: "Nazwa firmy może zawierać tylko litery (polskie i angielskie), cyfry, spacje i podstawowe znaki interpunkcyjne",
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
    .max(500, {
      message: "Adres firmy nie może przekraczać 500 znaków",
    })
    .refine((value) => /^[a-zA-ZĄąĆćĘęŁłŃńÓóŚśŹźŻż0-9\s.,/-]+$/.test(value), {
      message: "Adres firmy może zawierać tylko litery (polskie i angielskie), cyfry, spacje i podstawowe znaki interpunkcyjne",
    }),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Musisz zaakceptować regulamin",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Hasła nie są identyczne",
  path: ["confirmPassword"],
});

export type DealerFormValues = z.infer<typeof dealerFormSchema>;
