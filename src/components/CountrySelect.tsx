import { useEffect, useState } from "react";
import { getCountries } from "../services/countries";

export default function CountrySelect({ value, onChange }: any) {
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    getCountries().then(setCountries);
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="p-2 border rounded"
    >
      {countries.map((c: any) => (
        <option key={c.code} value={c.name}>
          {c.name}
        </option>
      ))}
    </select>
  );
}