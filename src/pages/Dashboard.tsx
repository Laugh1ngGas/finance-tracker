import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  getTransactions,
  addTransaction,
  deleteTransaction,
} from "../services/transactions";

import AddTransaction from "../components/AddTransaction";
import TransactionList from "../components/TransactionList";
import Balance from "../components/Balance";

export default function Dashboard() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUser();
    loadTransactions();
  }, []);

  const loadUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
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

  const logout = async () => {
    await supabase.auth.signOut();
    location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Navbar */}
      <div className="bg-white shadow px-6 py-4 flex justify-between">
        <h1 className="font-bold text-xl text-indigo-600">Finance Tracker</h1>

        <div className="flex items-center gap-4">
          <span className="text-gray-600 text-sm">{user?.email}</span>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto">

        {/* Balance Card */}
        <div className="mb-6">
          <Balance transactions={transactions} />
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <AddTransaction onAdd={handleAdd} />
          <TransactionList
            transactions={transactions}
            onDelete={handleDelete}
          />
        </div>

      </div>
    </div>
  );
}