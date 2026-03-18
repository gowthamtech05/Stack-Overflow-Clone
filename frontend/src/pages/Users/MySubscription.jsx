import { useEffect, useState, useContext } from "react";
import API from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";

const PLANS = [
  {
    id: "Bronze",
    price: 100,
    label: "Bronze",
    emoji: "🥉",
    limit: "5 questions/day",
    color: "border-orange-200 dark:border-orange-800",
    bg: "bg-orange-50 dark:bg-orange-900/10",
    btn: "bg-orange-500 hover:bg-orange-400",
  },
  {
    id: "Silver",
    price: 300,
    label: "Silver",
    emoji: "🥈",
    limit: "10 questions/day",
    color: "border-gray-200 dark:border-gray-700",
    bg: "bg-gray-50 dark:bg-gray-800/50",
    btn: "bg-gray-600 hover:bg-gray-700",
    popular: true,
  },
  {
    id: "Gold",
    price: 1000,
    label: "Gold",
    emoji: "🥇",
    limit: "Unlimited questions",
    color: "border-yellow-200 dark:border-yellow-800",
    bg: "bg-yellow-50 dark:bg-yellow-900/10",
    btn: "bg-yellow-500 hover:bg-yellow-400",
  },
];

const PLAN_ORDER = { Free: 0, Bronze: 1, Silver: 2, Gold: 3 };

export default function MySubscription() {
  const { user } = useContext(AuthContext);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const [timeAllowed, setTimeAllowed] = useState(false);
  const [currentIST, setCurrentIST] = useState("");

  const fetchStatus = async () => {
    try {
      const { data } = await API.get("/subscriptions/status");
      setSubscription(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const istStr = now.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      const hour = parseInt(
        now.toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "numeric",
          hour12: false,
        }),
      );
      setCurrentIST(istStr);
      setTimeAllowed(hour >= 10 && hour < 11);
    };
    checkTime();
    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) fetchStatus();
  }, [user]);

  const handlePayment = async (planId) => {
    if (!timeAllowed)
      return alert(
        "Payments are only allowed between 10:00 AM – 11:00 AM IST.",
      );
    const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!key) {
      alert(
        "Payment configuration error. VITE_RAZORPAY_KEY_ID missing in .env",
      );
      return;
    }
    try {
      setPaying(planId);
      const { data: order } = await API.post("/subscriptions/create-order", {
        plan: planId,
      });
      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: "StackOverflow Clone",
        description: `${planId} Plan - Monthly Subscription`,
        order_id: order.id,
        prefill: { name: user?.name, email: user?.email },
        theme: { color: "#f97316" },
        handler: async (response) => {
          try {
            const { data } = await API.post("/subscriptions/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: planId,
            });
            alert(`✅ ${data.message}\n📧 Invoice sent to your email.`);
            fetchStatus();
          } catch (err) {
            alert(
              err.response?.data?.message || "Payment verification failed.",
            );
          }
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        alert(`❌ Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (err) {
      alert(err.response?.data?.message || "Could not initiate payment.");
    } finally {
      setPaying(null);
    }
  };

  if (!user)
    return (
      <div className="text-center py-24 text-gray-400">
        Please log in to manage your subscription.
      </div>
    );
  if (loading)
    return (
      <div className="flex justify-center py-24">
        <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const currentPlan = subscription?.plan || "Free";
  const isExpired =
    subscription?.expiry && new Date(subscription.expiry) < new Date();
  const currentPlanLevel = PLAN_ORDER[currentPlan] || 0;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
          <div>
            <p className="text-[11px] text-orange-500 uppercase tracking-widest mb-0.5">
              Billing
            </p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Subscription
            </h1>
            <p className="text-[13px] text-gray-400 mt-0.5">Manage your plan</p>
          </div>
          <span
            className={`px-3 py-1.5 rounded-full border text-[12px] font-semibold ${
              currentPlan === "Gold"
                ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800"
                : currentPlan === "Silver"
                  ? "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                  : currentPlan === "Bronze"
                    ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800"
                    : "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
            }`}
          >
            {currentPlan === "Gold"
              ? "🥇"
              : currentPlan === "Silver"
                ? "🥈"
                : currentPlan === "Bronze"
                  ? "🥉"
                  : "🆓"}{" "}
            {currentPlan} Plan
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Current Plan", value: currentPlan },
            { label: "Questions/day", value: subscription?.limit ?? 1 },
            { label: "Used today", value: subscription?.used ?? 0 },
            { label: "Remaining", value: subscription?.remaining ?? 0 },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center"
            >
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {value}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {subscription?.expiry && (
          <p
            className={`mt-4 text-[13px] ${isExpired ? "text-red-500" : "text-gray-400"}`}
          >
            {isExpired ? "⚠️ Expired on" : "✅ Active until"}{" "}
            <strong>{new Date(subscription.expiry).toDateString()}</strong>
          </p>
        )}
      </div>

      <div
        className={`rounded-2xl border p-4 flex items-center justify-between flex-wrap gap-3 ${
          timeAllowed
            ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
            : "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800"
        }`}
      >
        <div>
          <p
            className={`text-[13px] font-semibold ${timeAllowed ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"}`}
          >
            {timeAllowed
              ? "✅ Payment window is OPEN"
              : "⏰ Payment window is CLOSED"}
          </p>
          <p className="text-[12px] text-gray-400 mt-0.5">
            Payments allowed only between{" "}
            <strong>10:00 AM – 11:00 AM IST</strong>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-gray-400">Current IST</p>
          <p className="text-[15px] font-bold text-gray-700 dark:text-gray-300 tabular-nums">
            {currentIST}
          </p>
        </div>
      </div>

      <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-2xl p-4 text-[13px] text-orange-700 dark:text-orange-400">
        📧 Invoice will be sent to <strong>{user?.email}</strong> after payment.
      </div>

      <div>
        <h2 className="text-[15px] font-bold text-gray-900 dark:text-white mb-3">
          Choose a Plan
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PLANS.map((p) => {
            const isCurrent = currentPlan === p.id;
            const planLevel = PLAN_ORDER[p.id];
            const isDowngrade = planLevel < currentPlanLevel;
            const isDisabled = !timeAllowed || paying === p.id || isDowngrade;

            return (
              <div
                key={p.id}
                className={`relative rounded-2xl border-2 p-5 transition-all ${p.color} ${p.bg} ${
                  isCurrent
                    ? "ring-2 ring-orange-500 ring-offset-2 dark:ring-offset-gray-900"
                    : isDowngrade
                      ? "opacity-50 grayscale"
                      : ""
                }`}
              >
                {p.popular && !isDowngrade && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full whitespace-nowrap">
                    POPULAR
                  </div>
                )}
                {isDowngrade && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-400 text-white text-[10px] font-bold px-3 py-0.5 rounded-full whitespace-nowrap">
                    NOT AVAILABLE
                  </div>
                )}
                <div className="text-3xl mb-2">{p.emoji}</div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {p.label}
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  ₹{p.price}
                  <span className="text-[13px] font-normal text-gray-400">
                    /mo
                  </span>
                </p>
                <p className="text-[12px] text-gray-400 mt-1 mb-4">{p.limit}</p>

                {isCurrent ? (
                  <div className="w-full text-center py-2 rounded-xl bg-orange-500 text-white text-[13px] font-semibold">
                    ✓ Current Plan
                  </div>
                ) : isDowngrade ? (
                  <div className="w-full text-center py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-400 text-[13px] cursor-not-allowed">
                    🔒 Not Available
                  </div>
                ) : (
                  <button
                    onClick={() => handlePayment(p.id)}
                    disabled={isDisabled}
                    className={`w-full py-2 rounded-xl text-white text-[13px] font-semibold transition-colors ${
                      !timeAllowed
                        ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-400"
                        : `${p.btn} disabled:opacity-50`
                    }`}
                  >
                    {paying === p.id
                      ? "Processing..."
                      : !timeAllowed
                        ? "Window Closed"
                        : `Upgrade to ${p.label}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
        <h3 className="text-[14px] font-semibold text-gray-700 dark:text-gray-300 mb-3">
          All Plans Include
        </h3>
        <div className="grid grid-cols-2 gap-2 text-[13px] text-gray-500 dark:text-gray-400">
          {[
            "✅ Ask & Answer questions",
            "✅ Upvote & downvote",
            "✅ Earn reputation points",
            "✅ Transfer points to others",
            "✅ Community feed access",
            "✅ Friend system",
          ].map((f) => (
            <p key={f}>{f}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
