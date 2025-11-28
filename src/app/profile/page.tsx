// "use client";

// import { useEffect, useRef, useState } from "react";
// import { forceClientLogout, usersAPI } from "@/lib/api";
// import { useAuth } from "@/context/AuthContext";
// import Link from "next/link";
// import ProfileSidebar from "@/components/profile/ProfileSidebar";
// import ProfileDetails from "@/components/profile/ProfileDetails";
// import AddressManagementPage from "@/components/profile/AddressManagementPage";

// type UserProfile = {
//   id: string;
//   name?: string;
//   email?: string;
//   phone?: string;
// };

// export default function ProfilePage() {
//   const [user, setUser] = useState<UserProfile | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [activeTab, setActiveTab] = useState("profile");
//   const { user: authUser } = useAuth();
//   const didFetchRef = useRef(false);

//   useEffect(() => {
//     if (didFetchRef.current) return;
//     didFetchRef.current = true;

//     if (authUser) {
//       const payload: UserProfile = {
//         id: authUser.id,
//         name: authUser.name || "",
//         email: (authUser as any).email || "",
//         phone: (authUser as any).phone || "",
//       };
//       setUser(payload);
//       return;
//     }

//     const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

//     if (token) {
//       fetchProfileViaAuth();
//     } else {
//       if (typeof window !== "undefined") window.location.href = "/auth/login";
//     }
//   }, [authUser]);

//   useEffect(() => {
//     console.log("Active Tab:", activeTab);
//     if (activeTab === "profile") {
//       console.log("Fetching profile data...");
//       setLoading(true);
//       fetchProfileViaAuth()
//         .then(() => {
//           console.log("User state after fetch:", user);
//         })
//         .catch((err) => {
//           console.error("Error fetching profile data:", err);
//           setError("Không thể tải thông tin người dùng");
//         });
//     }
//   }, [activeTab]);

//   async function fetchProfileViaAuth() {
//     setLoading(true);
//     setError(null);
//     try {
//       const userId = typeof window !== "undefined" ? localStorage.getItem("user_id") : null;
//       if (!userId) throw new Error("Không tìm thấy user ID");
//       const resp: any = await usersAPI.getUser(userId);
//       const profile: any = resp?.user ?? resp;
//       if (profile && profile.id) {
//         const payload: UserProfile = {
//           id: profile.id || profile.uid || profile._id || profile.ID,
//           name: profile.name || profile.fullname || profile.email?.split?.("@")?.[0] || "",
//           email: profile.email || "",
//           phone: profile.phone || profile.mobile || "",
//         };
//         console.log("Fetched profile data:", payload);
//         setUser(payload);
//       } else {
//         throw new Error("Không thể tải thông tin người dùng");
//       }
//     } catch (err: any) {
//       console.error("Error fetching user profile:", err);
//       setError(err?.message || "Lỗi khi tải hồ sơ");
//     } finally {
//       setLoading(false);
//     }
//   }

//   const renderContent = () => {
//     console.log("Rendering content for tab:", activeTab);
//     if (activeTab === "profile") {
//       if (loading) return <div className="text-white">Đang tải thông tin người dùng...</div>;
//       if (error) return <div className="text-red-400">{error}</div>;
//       return user ? <ProfileDetails user={user} setUser={setUser} /> : <div className="text-white">Không tìm thấy thông tin người dùng. Vui lòng thử lại sau.</div>;
//     }
//     if (activeTab === "addresses") {
//       return <AddressManagementPage />;
//     }
//     if (activeTab === "change-password") {
//       return <div>Đổi mật khẩu (Coming Soon)</div>;
//     }
//     return null;
//   };

//   if (loading) return <div className="p-6 text-white">Đang tải thông tin người dùng...</div>;

//   if (error) return <div className="p-6 text-red-400">{error}</div>;

//   if (!user)
//     return (
//       <div className="p-6 text-white">
//         <p>
//           Không tìm thấy người dùng. Vui lòng <Link href="/auth/login" className="text-orange-300">đăng nhập</Link>.
//         </p>
//       </div>
//     );

//   return (
//     <div className="flex min-h-screen">
//       <ProfileSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
//       <div className="flex-1 p-6">{renderContent()}</div>
//     </div>
//   );
// }


"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { forceClientLogout, usersAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import ProfileSidebar from "@/components/profile/ProfileSidebar";
import ProfileDetails from "@/components/profile/ProfileDetails";
import AddressManagementPage from "@/components/profile/AddressManagementPage";
import ChangePasswordForm from "@/components/profile/ChangePasswordForm";

type UserProfile = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("personal-info");
  const { user: authUser } = useAuth();
  const didFetchRef = useRef(false);

  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;

    if (authUser) {
      const payload: UserProfile = {
        id: authUser.id,
        name: authUser.name || "",
        email: (authUser as any).email || "",
        phone: (authUser as any).phone || "",
      };
      setUser(payload);
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

    if (token) {
      fetchProfileViaAuth();
    } else {
      if (typeof window !== "undefined") window.location.href = "/auth/login";
    }
  }, [authUser]);

  async function fetchProfileViaAuth() {
    setLoading(true);
    setError(null);
    try {
      const userId = typeof window !== "undefined" ? localStorage.getItem("user_id") : null;
      if (!userId) throw new Error("Không tìm thấy user ID");
      const resp: any = await usersAPI.getUser(userId);
      const profile: any = resp?.user ?? resp;
      if (profile && profile.id) {
        const payload: UserProfile = {
          id: profile.id || profile.uid || profile._id || profile.ID,
          name: profile.name || profile.fullname || profile.email?.split?.("@")?.[0] || "",
          email: profile.email || "",
          phone: profile.phone || profile.mobile || "",
        };
        console.log("Fetched profile data:", payload);
        setUser(payload);
      } else {
        throw new Error("Không thể tải thông tin người dùng");
      }
    } catch (err: any) {
      console.error("Error fetching user profile:", err);
      setError(err?.message || "Lỗi khi tải hồ sơ");
    } finally {
      setLoading(false);
    }
  }

  const renderContent = useMemo(() => {
    console.log("Rendering content for tab:", activeTab);
    
    // Check other tabs first
    if (activeTab === "addresses") {
      return <AddressManagementPage />;
    }
    if (activeTab === "change-password") {
      return <div><ChangePasswordForm /></div>;
    }
    
    // Personal info tab (default)
    if (loading) return <div className="text-white">Đang tải thông tin người dùng...</div>;
    if (error) return <div className="text-red-400">{error}</div>;
    return user ? <ProfileDetails user={user} setUser={setUser} /> : <div className="text-white">Không tìm thấy thông tin người dùng. Vui lòng thử lại sau.</div>;
  }, [activeTab, loading, error, user, setUser]);

  if (!user && !loading && !error)
    return (
      <div className="p-6 text-white">
        <p>
          Không tìm thấy người dùng. Vui lòng <Link href="/auth/login" className="text-orange-300">đăng nhập</Link>.
        </p>
      </div>
    );

  return (
    <div className="flex min-h-screen">
      <ProfileSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 p-6">{renderContent}</div>
    </div>
  );
}