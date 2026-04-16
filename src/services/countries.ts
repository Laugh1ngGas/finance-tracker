export const getCountries = async () => {
  const res = await fetch("https://restcountries.com/v3.1/all");
  const data = await res.json();

  return data
    .map((c: any) => ({
      name: c.name.common,
      code: c.cca2,
    }))
    .sort((a: any, b: any) => a.name.localeCompare(b.name));
};