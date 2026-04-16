import { useState } from "react";

export default function DateFilter({ onFilter }: any) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  return (
    <div className="bg-white p-4 rounded-xl shadow flex gap-2">
      <input
        type="date"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        className="p-2 border rounded"
      />

      <input
        type="date"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        className="p-2 border rounded"
      />

      <button
        onClick={() => onFilter(from, to)}
        className="bg-blue-600 text-white px-4 rounded"
      >
        Apply
      </button>
    </div>
  );
}