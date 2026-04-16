import { supabase } from "../lib/supabase";

export const getTransactions = async () => {
  return await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false });
};

export const addTransaction = async (transaction: any) => {
  return await supabase.from("transactions").insert(transaction);
};

export const deleteTransaction = async (id: string) => {
  return await supabase.from("transactions").delete().eq("id", id);
};

export const updateTransaction = async (id: string, data: any) => {
  return await supabase.from("transactions").update(data).eq("id", id);
};

export const getTransactionsByDate = async (
  from: string,
  to: string
) => {
  return await supabase
    .from("transactions")
    .select("*")
    .gte("created_at", from)
    .lte("created_at", to)
    .order("created_at", { ascending: false });
};

export const getTransactionsByCategory = async (category: string) => {
  return await supabase
    .from("transactions")
    .select("*")
    .eq("category", category);
};