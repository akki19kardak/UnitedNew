import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Heart, Shield, CheckCircle, Info, Loader2,
  AlertCircle
} from "lucide-react";
import useAuth from "../contexts/useAuth";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;

const fmt = (n) => Number(n || 0).toLocaleString("en-IN");

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000];

const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const DonationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // ✅ FIX 3: use `user` from AuthContext which has firstName, lastName, email, phone
  const { user, isAuthenticated, getToken } = useAuth();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [amount, setAmount] = useState("");
  const [customAmount, setCustomAmount] = useState(false);
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const res = await axios.get(`${API}/campaigns/${id}`);
        setCampaign(res.data.campaign || res.data);
      } catch (err) {
        console.error("Error fetching campaign:", err);
        setError("Failed to load campaign details.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCampaign();
  }, [id]);

  const handleDonate = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!amount || amount < 100) {
      setError("Minimum donation amount is ₹100");
      return;
    }

    if (!RAZORPAY_KEY) {
      setError("Payment gateway not configured. Please contact support.");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        setError("Razorpay SDK failed to load. Please check your connection.");
        setProcessing(false);
        return;
      }

      const token = await getToken();

      // ✅ FIX 3: Build donorName from user object (AuthContext), not missing userData
      const donorName = anonymous
        ? "Anonymous"
        : `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.email || "Donor";

      // Create Razorpay order
      const orderRes = await axios.post(
        `${API}/razorpay/create-order`,
        {
          amount: Number(amount),
          campaignId: id,
          donorMessage: message,
          isAnonymous: anonymous,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { orderId, amount: orderAmount, currency, donationId } = orderRes.data; // ✅ FIX 2: capture donationId

      const options = {
        key: RAZORPAY_KEY,
        amount: orderAmount,
        currency,
        name: campaign?.title || "Campaign Donation",
        description: `Support ${campaign?.title}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            // ✅ FIX 1: Correct route `/verify` (not `/verify-payment`)
            // ✅ FIX 2: donationId is now included in the request body
            await axios.post(
              `${API}/razorpay/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                donationId, // ✅ FIXED: was missing before
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            setSuccess(true);
            setTimeout(() => {
              navigate(`/campaigns/${id}`);
            }, 2000);
          } catch (err) {
            console.error("Payment verification failed:", err);
            setError("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: donorName,
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: "#3b82f6",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

      rzp.on("payment.failed", (response) => {
        setError("Payment failed. Please try again.");
        console.error("Payment error:", response.error);
        setProcessing(false);
      });

    } catch (err) {
      console.error("Donation error:", err);
      setError(err.response?.data?.message || "Failed to process donation. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background-light dark:bg-background-dark">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <p className="text-lg font-semibold mb-4">Campaign not found</p>
          <button
            onClick={() => navigate("/campaigns")}
            className="text-primary hover:underline"
          >
            ← Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  const ngo = typeof campaign.ngoId === "object" ? campaign.ngoId : null;
  const ngoName = ngo?.name || ngo?.organizationName || "NGO";
  const imageUrl = campaign.images?.[0]?.url || campaign.imageUrl;

  return (
    <div className="bg-background-light dark:bg-background-dark font-display">
      {success && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center max-w-sm">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Donation Successful!</h3>
            <p className="text-slate-500 text-sm">
              Thank you for your generosity. Redirecting...
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => navigate(`/campaigns/${id}`)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors font-medium mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Campaign
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Campaign Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden sticky top-6">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={campaign.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <h2 className="text-xl font-bold mb-2">{campaign.title}</h2>
                <p className="text-sm text-slate-500 mb-4">{ngoName}</p>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Raised</span>
                    <span className="font-bold">₹{fmt(campaign.currentAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Goal</span>
                    <span className="font-bold">₹{fmt(campaign.goalAmount || campaign.targetAmount)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${Math.min(
                          (campaign.currentAmount / (campaign.goalAmount || campaign.targetAmount)) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <Shield className="w-5 h-5 text-green-600 shrink-0" />
                  <p className="text-xs text-green-700 dark:text-green-400">
                    100% secure payment via Razorpay
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Donation Form */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
              <h1 className="text-2xl font-bold mb-6">Make a Donation</h1>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-6">
                {/* Amount Selection */}
                <div>
                  <label className="block text-sm font-semibold mb-3">Select Amount (₹)</label>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {PRESET_AMOUNTS.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => {
                          setAmount(preset);
                          setCustomAmount(false);
                        }}
                        className={`py-3 rounded-lg border-2 font-semibold transition-colors ${amount === preset && !customAmount
                          ? "border-primary bg-primary text-white"
                          : "border-slate-200 dark:border-slate-700 hover:border-primary"
                          }`}
                      >
                        ₹{fmt(preset)}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setCustomAmount(true);
                      setAmount("");
                    }}
                    className={`w-full py-3 rounded-lg border-2 font-semibold transition-colors ${customAmount
                      ? "border-primary bg-primary text-white"
                      : "border-slate-200 dark:border-slate-700 hover:border-primary"
                      }`}
                  >
                    Custom Amount
                  </button>

                  {customAmount && (
                    <input
                      type="number"
                      min="100"
                      placeholder="Enter amount (min ₹100)"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full mt-3 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  )}
                </div>

                {/* Optional Message */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Leave a message of support..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>

                {/* Anonymous Donation */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={anonymous}
                    onChange={(e) => setAnonymous(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium">Donate anonymously</span>
                </label>

                {/* Donate Button */}
                <button
                  onClick={handleDonate}
                  disabled={processing || !amount || amount < 100}
                  className="w-full py-4 bg-primary hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Heart className="w-5 h-5" />
                      Donate {amount ? `₹${fmt(amount)}` : "Now"}
                    </>
                  )}
                </button>

                <div className="flex items-start gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                    Your donation goes directly to the NGO running this campaign. You'll receive a payment confirmation via email.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationPage;
