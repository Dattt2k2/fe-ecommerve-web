"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import { forceClientLogout } from '@/lib/api';

// Define the type for account status
interface AccountStatus {
  isStripeConnected: boolean;
  stripeStatus: string;
  onboarding_completed: boolean;
  email: string;
  business_name: string;
  status: string;
  country: string;
  onboarding_url: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
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

  useEffect(() => {
    // Fetch vendor information
    const fetchVendorInfo = async () => {
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
    return <div>Loading...</div>;
  }

  if (accountStatus) {
    const { onboarding_completed, charges_enabled, payouts_enabled } = accountStatus;

    if (onboarding_completed || charges_enabled || payouts_enabled) {
      return (
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Thông tin tài khoản bán hàng</h1>
          <p>Email: {accountStatus.email}</p>
          <p>Tên doanh nghiệp: {accountStatus.business_name}</p>
          <p>Trạng thái: {accountStatus.status}</p>
          <p>Quốc gia: {accountStatus.country}</p>
          {accountStatus.onboarding_url && (
            <p>Onboarding URL: <a href={accountStatus.onboarding_url} target="_blank" rel="noopener noreferrer">Hoàn tất onboarding</a></p>
          )}
        </div>
      );
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Quản lý tài khoản bán hàng</h1>

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

      <button
        onClick={handleRegister}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Đang xử lý..." : "Đăng ký tài khoản bán hàng"}
      </button>

      {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}
    </div>
  );
};

export default SellerAccountPage;