import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const categories = {
  Coffee: '☕️',
  Food: '🍽️',
  Subscription: '💳',
  General: '👛',
};

const subscriptionKeywords = [
  'netflix',
  'spotify',
  'apple music',
  'hulu',
  'amazon prime',
];

function groupByWeek(transactions) {
  const now = new Date();
  const thisWeek = transactions.filter((t) => {
    const d = new Date(t.date);
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    return diffDays < 7;
  });

  const lastWeek = transactions.filter((t) => {
    const d = new Date(t.date);
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    return diffDays >= 7 && diffDays < 14;
  });

  return { thisWeek, lastWeek };
}

function sumTransactions(arr, filter) {
  return arr.filter(filter).reduce((acc, t) => acc + Math.abs(t.amount), 0);
}

function useInsights(transactions) {
  return useMemo(() => {
    const { thisWeek, lastWeek } = groupByWeek(transactions);
    const foodNow = sumTransactions(
      thisWeek,
      (t) => t.category === 'Food' || t.category === 'Coffee'
    );
    const foodPrev = sumTransactions(
      lastWeek,
      (t) => t.category === 'Food' || t.category === 'Coffee'
    );
    const totalNow = sumTransactions(thisWeek, () => true);
    const totalPrev = sumTransactions(lastWeek, () => true);
    const calc = (n, p) => (p === 0 ? (n > 0 ? 100 : 0) : ((n - p) / p) * 100);

    return [
      {
        title: 'Food spending this week',
        value: `€${foodNow.toFixed(2)}`,
        change: calc(foodNow, foodPrev),
        categoryFilter: (t) => t.category === 'Food' || t.category === 'Coffee',
      },
      {
        title: 'Total spending',
        value: `€${totalNow.toFixed(2)}`,
        change: calc(totalNow, totalPrev),
        categoryFilter: () => true,
      },
    ];
  }, [transactions]);
}

function detectSmartSubscription(tx, transactions) {
  if (subscriptionKeywords.some((k) => tx.name.toLowerCase().includes(k)))
    return true;
  const repeats = transactions.filter(
    (t) => t.name.toLowerCase() === tx.name.toLowerCase()
  );
  return repeats.length >= 2;
}

function InsightCard({ insight, onPress }) {
  return (
    <div
      onClick={() => onPress(insight)}
      className="backdrop-blur-xl bg-white/10 rounded-2xl p-5 mb-6 cursor-pointer"
    >
      <p className="text-sm text-gray-400">{insight.title}</p>
      <p className="text-xl font-semibold text-white mt-1">{insight.value}</p>
      <p
        className={`mt-2 text-sm ${
          insight.change >= 0 ? 'text-red-400' : 'text-green-400'
        }`}
      >
        {insight.change >= 0 ? '↑' : '↓'} {Math.abs(insight.change).toFixed(0)}%
        vs last week
      </p>
    </div>
  );
}

function TransactionRow({ item, onPress }) {
  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      className="flex items-center justify-between mb-4 cursor-pointer"
      onClick={() => onPress(item)}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10">
          {categories[item.category]}
        </div>
        <div>
          <p className="text-white text-base">{item.name}</p>
          <p className="text-xs text-gray-500">{item.category}</p>
        </div>
      </div>
      <p
        className={`font-semibold ${
          item.amount < 0 ? 'text-red-400' : 'text-green-400'
        }`}
      >
        {item.amount < 0 ? '-' : '+'}€{Math.abs(item.amount).toFixed(2)}
      </p>
    </motion.div>
  );
}

function AddSpendingModal({ show, onClose, onSave }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');

  const handleSave = () => {
    const parsed = parseFloat(amount);
    if (!name) {
      onClose();
      return;
    }
    if (isNaN(parsed)) return;
    onSave({ name, amount: -Math.abs(parsed), category, date: new Date() });
    setName('');
    setAmount('');
    setCategory('Food');
    onClose();
  };

  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-2xl p-6 w-80 backdrop-blur-xl relative">
        <button
          className="absolute top-3 right-3 text-white text-xl"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-white font-bold text-lg mb-4">Add Expense</h2>
        <input
          className="w-full mb-3 p-2 rounded bg-gray-800 text-white"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="number"
          className="w-full mb-3 p-2 rounded bg-gray-800 text-white"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <select
          className="w-full mb-4 p-2 rounded bg-gray-800 text-white"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {Object.keys(categories).map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <button
          className="w-full py-2 rounded bg-green-500 text-black font-bold"
          onClick={handleSave}
        >
          Save
        </button>
      </div>
    </div>
  );
}

function TransactionDetailModal({ transaction, onClose }) {
  if (!transaction) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 200, damping: 30 }}
        className="bg-gray-900 rounded-t-3xl p-6 w-full max-w-[420px] mx-auto max-h-[85vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-xl font-bold">{transaction.name}</h2>
          <button className="text-white text-xl" onClick={onClose}>
            ×
          </button>
        </div>
        <p className="text-white text-2xl mb-2">
          €{Math.abs(transaction.amount).toFixed(2)}
        </p>
        <p className="text-gray-400 mb-1">Category: {transaction.category}</p>
        <p className="text-gray-400 mb-1">
          Date: {new Date(transaction.date).toLocaleDateString()}
        </p>
      </motion.div>
    </div>
  );
}

function InsightDetailModal({ insight, transactions, onClose }) {
  if (!insight) return null;

  const filtered = transactions.filter(insight.categoryFilter);

  const map = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
  filtered.forEach((t) => {
    const d = new Date(t.date).toLocaleDateString('en-US', {
      weekday: 'short',
    });
    map[d] = (map[d] || 0) + Math.abs(t.amount);
  });

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const max = Math.max(...Object.values(map), 1);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 200, damping: 30 }}
        className="bg-gray-900 rounded-t-3xl p-6 w-full max-w-[420px] mx-auto max-h-[85vh] overflow-y-auto"
      >
        <h2 className="text-white text-xl mb-2">{insight.title}</h2>
        <p className="text-2xl mb-4">{insight.value}</p>

        <motion.div
          className="flex items-end justify-between h-24 mb-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          {days.map((d, index) => {
            const val = map[d] || 0;
            return (
              <motion.div
                key={d}
                className="flex flex-col items-center"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                  bounce: 0.5,
                }}
              >
                <motion.div
                  className="w-3 bg-gradient-to-t from-green-400 to-green-600 rounded mb-1"
                  initial={{ height: 0 }}
                  animate={{ height: `${(val / max) * 100}%` }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                    bounce: 0.5,
                    delay: index * 0.1,
                  }}
                />
                <span className="text-xs text-gray-500">{d}</span>
              </motion.div>
            );
          })}
        </motion.div>

        {filtered.map((t, i) => (
          <div key={i} className="flex justify-between mb-2">
            <span>{t.name}</span>
            <span>€{Math.abs(t.amount).toFixed(2)}</span>
          </div>
        ))}

        <button
          className="w-full py-3 bg-red-500 rounded-xl mt-4"
          onClick={onClose}
        >
          Close
        </button>
        <div className="h-20" />
      </motion.div>
    </div>
  );
}

function SubscriptionsDetailModal({ subscriptions, onClose }) {
  if (!subscriptions.length) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 200, damping: 30 }}
        className="bg-gray-900 rounded-t-3xl p-6 w-full max-w-[420px] mx-auto max-h-[85vh] overflow-y-auto"
      >
        <h2 className="text-white text-xl font-bold mb-4">Subscriptions</h2>
        {subscriptions.map((s, i) => (
          <div key={i} className="flex justify-between mb-2">
            <span>{s.name}</span>
            <span>€{Math.abs(s.amount).toFixed(2)}</span>
          </div>
        ))}
        <button
          className="w-full py-3 bg-red-500 rounded-xl mt-4"
          onClick={onClose}
        >
          Close
        </button>
        <div className="h-20" />
      </motion.div>
    </div>
  );
}

export default function App() {
  const [transactions, setTransactions] = useState([
    { name: 'Starbucks', category: 'Coffee', amount: -4.5, date: new Date() },
    { name: 'Dinner', category: 'Food', amount: -20, date: new Date() },
    {
      name: 'Netflix',
      category: 'Subscription',
      amount: -9.99,
      date: new Date(),
    },
    { name: 'Salary', category: 'General', amount: 2500, date: new Date() },
  ]);

  const insights = useInsights(transactions);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [showSubscriptions, setShowSubscriptions] = useState(false);

  const balance = transactions.reduce((a, t) => a + t.amount, 0);

  const addTransaction = (tx) => {
    const isSub = detectSmartSubscription(tx, transactions);
    const finalTx = isSub ? { ...tx, category: 'Subscription' } : tx;
    setTransactions((prev) => [finalTx, ...prev]);
  };

  const subscriptions = transactions.filter(
    (t) => t.category === 'Subscription'
  );
  const totalSubscriptions = subscriptions.reduce(
    (a, t) => a + Math.abs(t.amount),
    0
  );

  const aiInsights = useMemo(() => {
    const insightsArr = [];
    const days = {};
    transactions.forEach((t) => {
      const d = new Date(t.date).toLocaleDateString('en-US', {
        weekday: 'long',
      });
      days[d] = (days[d] || 0) + Math.abs(t.amount);
    });
    const top = Object.entries(days).sort((a, b) => b[1] - a[1])[0];
    if (top) insightsArr.push(`You spend most on ${top[0]}`);

    let totalSubs = 0;
    const subsMap = {};
    transactions.forEach((t) => {
      if (
        t.category === 'Subscription' ||
        subscriptionKeywords.some((k) => t.name.toLowerCase().includes(k))
      ) {
        const key = t.name.toLowerCase();
        if (!subsMap[key]) {
          subsMap[key] = t;
          totalSubs += Math.abs(t.amount);
          t.category = 'Subscription';
        }
      }
    });

    if (totalSubs > 0)
      insightsArr.unshift(`Subscriptions total €${totalSubs.toFixed(2)}/month`);
    Object.values(subsMap).forEach((tx) =>
      insightsArr.push(
        `Looks like a subscription: ${tx.name} €${Math.abs(tx.amount).toFixed(
          2
        )}/month`
      )
    );

    return insightsArr.slice(0, 4);
  }, [transactions]);

  return (
    <div className="min-h-screen bg-black text-white flex justify-center p-6">
      <div className="w-[360px]">
        <h1 className="text-4xl font-bold">€{balance.toFixed(2)}</h1>
        <p className="text-gray-500 mb-4">Available balance</p>

        {aiInsights.map((t, i) => (
          <div
            key={i}
            onClick={() =>
              t.startsWith('Subscriptions total') && setShowSubscriptions(true)
            }
            className="text-xs text-gray-400 bg-white/5 rounded-xl px-3 py-2 mb-2 cursor-pointer"
          >
            {t}
          </div>
        ))}

        {insights.map((i, idx) => (
          <InsightCard
            key={idx}
            insight={i}
            onPress={() => setSelectedInsight(i)}
          />
        ))}

        <div className="pb-40">
          {transactions.map((t, i) => (
            <TransactionRow
              key={i}
              item={t}
              onPress={(tx) => setSelectedTransaction(tx)}
            />
          ))}
        </div>

        <button
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-green-500 text-black text-2xl"
          onClick={() => setShowAdd(true)}
        >
          +
        </button>

        <AnimatePresence>
          {showAdd && (
            <AddSpendingModal
              show={showAdd}
              onClose={() => setShowAdd(false)}
              onSave={addTransaction}
            />
          )}
          {selectedTransaction && (
            <TransactionDetailModal
              transaction={selectedTransaction}
              onClose={() => setSelectedTransaction(null)}
            />
          )}
          {selectedInsight && (
            <InsightDetailModal
              insight={selectedInsight}
              transactions={transactions}
              onClose={() => setSelectedInsight(null)}
            />
          )}
          {showSubscriptions && (
            <SubscriptionsDetailModal
              subscriptions={subscriptions}
              onClose={() => setShowSubscriptions(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
