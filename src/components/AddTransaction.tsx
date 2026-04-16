import { useState } from "react";

export default function AddTransaction({ onAdd }: any) {
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("income");
  const [category, setCategory] = useState("Other");

  const handleSubmit = (e: any) => {
    e.preventDefault();

    onAdd({
      amount: Number(amount),
      title,
      type,
      category,
    });

    setAmount("");
    setTitle("");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl shadow space-y-3">
      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="w-full p-2 border rounded"
      >
        <option value="income">Income</option>
        <option value="expense">Expense</option>
      </select>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full p-2 border rounded"
      >
        <option value="Food">Food</option>
        <option value="Transport">Transport</option>
        <option value="Salary">Salary</option>
        <option value="Other">Other</option>
      </select>

      <button className="w-full bg-green-600 text-white p-2 rounded">
        Add Transaction
      </button>
    </form>
  );
}