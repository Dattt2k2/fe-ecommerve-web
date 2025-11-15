"use client";
import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, RefreshCcw, Copy, ExternalLink } from 'lucide-react';
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import { forceClientLogout } from '@/lib/api';

// Define the type for account status
interface AccountStatus {
  isStripeConnected?: boolean;
  stripeStatus?: string;
  onboarding_completed: boolean;
  email: string;
  business_name: string;
  status: string;
  country: string;
  onboarding_url: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  vendor_id?: string;
  stripe_account_id?: string;
}

const SellerAccountPage = () => {
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [country, setCountry] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);

  const fetchVendorInfo = async () => {
    setLoading(true);
    try {
      console.log("Fetching vendor information from /api/vendors");
      const response = await apiClient.get("/api/vendors");
      console.log("API response:", response);
      setAccountStatus(response);
    } catch (err) {
      if (err instanceof SyntaxError) {
        console.error("Failed to parse JSON response. Response might not be JSON:", err);
      } else {
        console.error("Failed to fetch vendor information:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorInfo();
  }, []);

  const handleStripeRegistration = async () => {
    try {
      const response = await apiClient.post(
        "/api/seller/stripe-onboarding",
        {}
      );
      const { url } = response.data;
      window.location.href = url; // Redirect to Stripe onboarding
    } catch (error) {
      console.error("Failed to initiate Stripe onboarding:", error);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setMessage("");

    const payload = {
      email, // Use the email value from the input field
      country,
      business_name: businessName,
    };

    try {
      const response = await apiClient.post("/api/vendors/register", payload);

      // Check for token expiration
      const bodyErr = response && (response.error || response.message || response.msg);
      if (typeof bodyErr === "string" && /token\s*(is\s*)?expired|expired\s*token/i.test(bodyErr)) {
        forceClientLogout();
        return;
      }

      if (response.onboarding_url) {
        setOnboardingUrl(response.onboarding_url);
        setMessage(response.message || "Đăng ký thành công!");
      } else {
        setMessage("Đăng ký thành công nhưng không tìm thấy URL onboarding.");
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Lỗi khi đăng ký tài khoản";
      setMessage(errorMsg);
      console.error("Error registering vendor:", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingSuccess = () => {
    // Redirect to the seller dashboard
    router.push("/seller");
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin w-10 h-10 mx-auto text-orange-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
          <p className="text-gray-500 mt-2">Đang tải thông tin tài khoản bán hàng...</p>
        </div>
      </div>
    );
  }

  // If vendor data exists (has vendor_id or stripe_account_id), show account info
  if (accountStatus && (accountStatus.vendor_id || accountStatus.stripe_account_id)) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Thông tin tài khoản bán hàng</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchVendorInfo}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 min-w-[140px] h-10 bg-white text-gray-700 dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 whitespace-nowrap"
              aria-label="Cập nhật thông tin"
            >
              <RefreshCcw className="w-4 h-4" />
              <span className="text-sm font-medium">Cập nhật</span>
            </button>
            <button
              onClick={() => router.push('/seller')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 min-w-[160px] h-10 bg-blue-600 text-white rounded-md hover:bg-blue-700 whitespace-nowrap"
            >
              <span className="text-sm font-medium">Quay về Dashboard</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6 items-start">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="mb-4">
              <label className="font-semibold block text-sm text-gray-600 dark:text-gray-300">Email</label>
              <p className="text-gray-900 dark:text-white mt-1">{accountStatus.email || 'Chưa có'}</p>
            </div>

            <div className="mb-4">
              <label className="font-semibold block text-sm text-gray-600 dark:text-gray-300">Tên doanh nghiệp</label>
              <p className="text-gray-900 dark:text-white mt-1">{accountStatus.business_name || 'Chưa có'}</p>
            </div>

            <div className="mb-4">
              <label className="font-semibold block text-sm text-gray-600 dark:text-gray-300">Quốc gia</label>
              <p className="text-gray-900 dark:text-white mt-1">{accountStatus.country || 'Chưa có'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Mã nhà bán (Vendor ID)</label>
                <div className="mt-1 flex gap-2 items-center">
                  <p className="text-sm text-gray-700 dark:text-gray-300 break-all">{accountStatus.vendor_id || 'N/A'}</p>
                  {accountStatus.vendor_id && (
                    <button
                      onClick={() => navigator.clipboard?.writeText(accountStatus.vendor_id || '')}
                      title="Sao chép"
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Stripe Account</label>
                <div className="mt-1 flex gap-2 items-center">
                  <p className="text-sm text-gray-700 dark:text-gray-300 break-all">{accountStatus.stripe_account_id || 'N/A'}</p>
                  {accountStatus.stripe_account_id && (
                    <>
                      <button
                        onClick={() => navigator.clipboard?.writeText(accountStatus.stripe_account_id || '')}
                        title="Sao chép"
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <a href={`https://dashboard.stripe.com/${accountStatus.stripe_account_id}/`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline ml-1 flex items-center gap-1">
                        <ExternalLink className="w-4 h-4" />
                        Dashboard
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Stripe Status</h3>
            <div className="mb-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Kết nối Stripe</span>
                <span className={`inline-flex items-center gap-2 px-2 py-1 text-xs font-semibold rounded ${accountStatus.isStripeConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {accountStatus.isStripeConnected ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-gray-500" />}
                  {accountStatus.isStripeConnected ? 'Đã kết nối' : 'Chưa kết nối'}
                </span>
              </div>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Thanh toán kích hoạt</span>
                <span className={`inline-flex items-center gap-2 px-2 py-1 text-xs font-semibold rounded ${accountStatus.charges_enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {accountStatus.charges_enabled ? 'Hoạt động' : 'Không hoạt động'}
                </span>
              </div>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Rút tiền</span>
                <span className={`inline-flex items-center gap-2 px-2 py-1 text-xs font-semibold rounded ${accountStatus.payouts_enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {accountStatus.payouts_enabled ? 'Hoạt động' : 'Không hoạt động'}
                </span>
              </div>
            </div>

            {accountStatus.onboarding_url ? (
              <div className="mt-2">
                <a href={accountStatus.onboarding_url} className="inline-flex items-center gap-2 w-full justify-center px-4 py-2 text-white bg-orange-500 rounded hover:bg-orange-600" target="_blank" rel="noreferrer">
                  {accountStatus.isStripeConnected ? 'Xem Stripe' : 'Hoàn thành Kết nối Stripe'}
                </a>
              </div>
            ) : (
              <div className="mt-2">
                <button onClick={handleStripeRegistration} className="inline-flex items-center gap-2 w-full justify-center px-4 py-2 text-white bg-orange-500 rounded hover:bg-orange-600">
                  Bắt đầu Kết nối Stripe
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Quản lý tài khoản bán hàng</h1>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Bạn chưa có tài khoản bán hàng. Điền thông tin dưới đây để đăng ký.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-orange-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Quốc gia
        </label>
        <input
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-orange-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Tên doanh nghiệp
        </label>
        <input
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-orange-500"
        />
      </div>

        </div>

        <div className="mt-4 flex gap-2 items-center justify-end">
          <button
        onClick={handleRegister}
        disabled={loading}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 h-10 min-w-[190px] whitespace-nowrap"
      >
        {loading ? "Đang xử lý..." : "Đăng ký tài khoản bán hàng"}
      </button>

          <button
            onClick={fetchVendorInfo}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50 h-10 whitespace-nowrap"
          >
            Làm mới
          </button>
        </div>
      </div>

      {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}
    </div>
  );
};

export default SellerAccountPage;