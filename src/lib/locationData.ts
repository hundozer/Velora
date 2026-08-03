export interface CountryLocation {
  name: string;
  code: string;
  cities: string[];
}

export const LOCATION_DATA = {
  COUNTRIES: [
    {
      name: "Czech Republic",
      code: "CZ",
      cities: [
        "Prague",
        "Brno",
        "Ostrava",
        "Pilsen",
        "Liberec",
        "Olomouc",
        "České Budějovice",
        "Hradec Králové",
        "Pardubice",
        "Zlín",
        "Karlovy Vary",
      ],
    },
    {
      name: "Germany",
      code: "DE",
      cities: [
        "Berlin",
        "Munich",
        "Hamburg",
        "Frankfurt",
        "Cologne",
        "Düsseldorf",
        "Stuttgart",
        "Leipzig",
        "Dresden",
        "Nuremberg",
        "Hanover",
      ],
    },
    {
      name: "Austria",
      code: "AT",
      cities: [
        "Vienna",
        "Salzburg",
        "Graz",
        "Linz",
        "Innsbruck",
        "Klagenfurt",
        "Bregenz",
      ],
    },
    {
      name: "Slovakia",
      code: "SK",
      cities: [
        "Bratislava",
        "Košice",
        "Prešov",
        "Žilina",
        "Nitra",
        "Banská Bystrica",
        "Trnava",
        "Trenčín",
      ],
    },
    {
      name: "Hungary",
      code: "HU",
      cities: [
        "Budapest",
        "Debrecen",
        "Szeged",
        "Miskolc",
        "Pécs",
        "Győr",
        "Nyíregyháza",
        "Kecskemét",
      ],
    },
    {
      name: "United Kingdom",
      code: "GB",
      cities: [
        "London",
        "Manchester",
        "Birmingham",
        "Edinburgh",
        "Glasgow",
        "Liverpool",
        "Bristol",
        "Leeds",
        "Oxford",
        "Cambridge",
      ],
    },
    {
      name: "France",
      code: "FR",
      cities: [
        "Paris",
        "Lyon",
        "Marseille",
        "Nice",
        "Toulouse",
        "Bordeaux",
        "Strasbourg",
        "Lille",
        "Cannes",
      ],
    },
    {
      name: "Monaco",
      code: "MC",
      cities: [
        "Monte Carlo",
        "La Condamine",
        "Fontvieille",
      ],
    },
    {
      name: "Switzerland",
      code: "CH",
      cities: [
        "Zurich",
        "Geneva",
        "Basel",
        "Lausanne",
        "Bern",
        "Lucerne",
        "Lugano",
      ],
    },
    {
      name: "Poland",
      code: "PL",
      cities: [
        "Warsaw",
        "Kraków",
        "Wrocław",
        "Gdańsk",
        "Poznań",
        "Łódź",
        "Katowice",
      ],
    },
    {
      name: "Romania",
      code: "RO",
      cities: [
        "Bucharest",
        "Cluj-Napoca",
        "Timișoara",
        "Iași",
        "Brașov",
        "Constanța",
        "Sibiu",
      ],
    },
    {
      name: "Italy",
      code: "IT",
      cities: [
        "Rome",
        "Milan",
        "Florence",
        "Venice",
        "Naples",
        "Turin",
        "Bologna",
      ],
    },
    {
      name: "Spain",
      code: "ES",
      cities: [
        "Madrid",
        "Barcelona",
        "Valencia",
        "Seville",
        "Ibiza",
        "Marbella",
        "Malaga",
      ],
    },
    {
      name: "Netherlands",
      code: "NL",
      cities: [
        "Amsterdam",
        "Rotterdam",
        "The Hague",
        "Utrecht",
        "Eindhoven",
      ],
    },
    {
      name: "United States",
      code: "US",
      cities: [
        "New York",
        "Los Angeles",
        "Miami",
        "Las Vegas",
        "Chicago",
        "San Francisco",
      ],
    },
  ] as CountryLocation[],

  getCitiesForCountry(countryName: string): string[] {
    if (!countryName || countryName === "ALL") return [];
    const found = this.COUNTRIES.find(
      (c) => c.name.toLowerCase() === countryName.toLowerCase() || c.code.toLowerCase() === countryName.toLowerCase()
    );
    return found ? found.cities : [];
  },
};
