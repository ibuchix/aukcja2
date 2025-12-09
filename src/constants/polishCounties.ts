// The 16 Polish voivodeships (counties)
export const POLISH_COUNTIES = [
  "Dolnośląskie",
  "Kujawsko-pomorskie",
  "Łódzkie",
  "Lubelskie",
  "Lubuskie",
  "Małopolskie",
  "Mazowieckie",
  "Opolskie",
  "Podkarpackie",
  "Podlaskie",
  "Pomorskie",
  "Śląskie",
  "Świętokrzyskie",
  "Warmińsko-mazurskie",
  "Wielkopolskie",
  "Zachodniopomorskie"
] as const;

export type PolishCounty = typeof POLISH_COUNTIES[number];
