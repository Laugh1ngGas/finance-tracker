export default function TransactionList({ transactions, onDelete }: any) {
  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h2 className="text-lg font-bold mb-3">Transactions</h2>

      {transactions.map((t: any) => (
        <div
          key={t.id}
          className="flex justify-between items-center border-b py-2"
        >
          <div>
            <p className="font-semibold">{t.title}</p>
            <p className="text-sm text-gray-500">{t.type}</p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={
                t.type === "income" ? "text-green-600" : "text-red-600"
              }
            >
              {t.type === "income" ? "+" : "-"}${t.amount}
            </span>

            <button
              onClick={() => onDelete(t.id)}
              className="text-red-500"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}