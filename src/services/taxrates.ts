const API_KEY = "YOUR_API_KEY";

export const getTaxRateByCountry = async (countryCode: string) => {
  const res = await fetch(
    `https://api.taxrates.io/v1/rates?country=${countryCode}`,
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    }
  );

  const data = await res.json();
  return data;
};