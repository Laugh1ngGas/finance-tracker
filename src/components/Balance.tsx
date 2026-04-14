export default function Balance({ transactions }: any) {
  const balance = transactions.reduce((acc: number, t: any) => {
    return t.type === "income"
      ? acc + t.amount
      : acc - t.amount;
  }, 0);

  return (
    <div className="bg-white p-4 rounded-xl shadow text-center">
      <h2 className="text-lg font-bold">Balance</h2>
      <p className="text-2xl mt-2">${balance}</p>
    </div>
  );
}