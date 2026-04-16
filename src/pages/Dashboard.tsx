import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  getTransactions,
  addTransaction,
  deleteTransaction,
} from "../services/transactions";

import { calculateTax } from "../utils/taxCalculator";
import { getCountries } from "../services/countries";

import AddTransaction from "../components/AddTransaction";
import TransactionList from "../components/TransactionList";
import Balance from "../components/Balance";

export default function Dashboard() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  const [countries, setCountries] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");

  // 🔽 FILTER STATES
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    loadUser();
    loadTransactions();
    loadCountries();
  }, []);

  const loadUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);

    if (data.user) {
      const { data: profileData } = await supabase
        .from("users")
        .select("*")
        .eq("id", data.user.id)
        .single();

      setSelectedCountry(profileData?.country || "Ukraine");
    }
  };

  const loadCountries = async () => {
    const data = await getCountries();
    setCountries(data);
  };

  const loadTransactions = async () => {
    const { data } = await getTransactions();
    setTransactions(data || []);
  };

  const handleAdd = async (t: any) => {
    await addTransaction({ ...t, user_id: user.id });
    loadTransactions();
  };

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
    loadTransactions();
  };

  const handleCountryChange = async (value: string) => {
    setSelectedCountry(value);

    await supabase
      .from("users")
      .update({ country: value })
      .eq("id", user.id);
  };

  // 🔍 FILTER LOGIC
  const filteredTransactions = transactions.filter((t) => {
    // DATE
    if (fromDate && new Date(t.created_at) < new Date(fromDate)) return false;
    if (toDate && new Date(t.created_at) > new Date(toDate)) return false;

    // TYPE
    if (filterType !== "all" && t.type !== filterType) return false;

    // CATEGORY
    if (filterCategory !== "all" && t.category !== filterCategory)
      return false;

    return true;
  });

  // 💰 INCOME
  const income = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);

  const { tax, esv, total } = calculateTax(
    income,
    selectedCountry || "Ukraine"
  );

  // 🔄 RESET FILTERS
  const resetFilters = () => {
    setFromDate("");
    setToDate("");
    setFilterType("all");
    setFilterCategory("all");
  };

  // 📂 UNIQUE CATEGORIES
  const categories = [
    "all",
    ...new Set(transactions.map((t) => t.category)),
  ];

  const logout = async () => {
    await supabase.auth.signOut();
    location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Navbar */}
      <div className="bg-white shadow px-6 py-4 flex justify-between">
        <h1 className="font-bold text-xl text-indigo-600">
          Finance Tracker
        </h1>

        <div className="flex items-center gap-4">
          <span className="text-gray-600 text-sm">
            {user?.email}
          </span>

          <button
            onClick={logout}
            className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto">

        {/* Balance */}
        <div className="mb-6">
          <Balance transactions={filteredTransactions} />
        </div>

        {/* 🌍 Taxes */}
        <div className="bg-white p-4 rounded-xl shadow mb-6">
          <h2 className="font-bold mb-3">Taxes & Settings</h2>

          <select
            value={selectedCountry}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="p-2 border rounded mb-4"
          >
            {countries.map((c: any) => (
              <option key={c.code} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-100 p-3 rounded">
              <p className="text-sm text-gray-500">Tax</p>
              <p className="font-bold">${tax.toFixed(2)}</p>
            </div>

            <div className="bg-gray-100 p-3 rounded">
              <p className="text-sm text-gray-500">ESV</p>
              <p className="font-bold">${esv}</p>
            </div>

            <div className="bg-gray-100 p-3 rounded">
              <p className="text-sm text-gray-500">Total</p>
              <p className="font-bold">${total.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* 🔍 FILTERS */}
        <div className="bg-white p-4 rounded-xl shadow mb-6 flex flex-wrap gap-3 items-center">
          
          {/* Date */}
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="p-2 border rounded"
          />

          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="p-2 border rounded"
          />

          {/* Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="all">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          {/* Category */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="p-2 border rounded"
          >
            {categories.map((c: any) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Reset */}
          <button
            onClick={resetFilters}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Reset
          </button>
        </div>

        {/* GRID */}
        <div className="grid md:grid-cols-2 gap-6">
          <AddTransaction onAdd={handleAdd} />

          <TransactionList
            transactions={filteredTransactions}
            onDelete={handleDelete}
          />
        </div>

      </div>
    </div>
  );
}