import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import API from "../services/api";
import { Package, ArrowLeft } from "lucide-react";

function ResetPassword() {
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  const handleReset = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    if (newPassword !== rePassword) {
      setErrorMsg("Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      await API.post("/auth/reset-password", { email, otp, new_password: newPassword });
      setSuccessMsg("Password reset successfully!");
      setTimeout(() => { navigate("/"); }, 1500);
    } catch (error) {
      console.error("Reset Password Error:", error);
      setErrorMsg(error.response?.data?.detail || "Invalid OTP or password constraint failure.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8" style={{ backgroundColor: 'var(--odoo-bg)' }}>
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--odoo-purple)' }}>
                <Package className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold" style={{ color: 'var(--odoo-purple)' }}>Create New Password</h2>
            <p className="mt-2" style={{ color: 'var(--odoo-text-muted)' }}>Enter the OTP sent to {email}</p>
          </div>

          <form onSubmit={handleReset} className="space-y-6 bg-white p-8 rounded-2xl shadow-sm border" style={{ borderColor: 'var(--odoo-border)' }}>
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm text-center">{errorMsg}</div>
            )}
            {successMsg && (
              <div className="p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm text-center">{successMsg}</div>
            )}
            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--odoo-text)' }}>Enter OTP</label>
              <input type="text" required className="mt-1 block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 tracking-widest text-center text-lg uppercase" style={{ borderColor: 'var(--odoo-border)', '--tw-ring-color': 'var(--odoo-purple)' }} placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} disabled={isLoading} />
            </div>
            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--odoo-text)' }}>New Password</label>
              <input type="password" required className="mt-1 block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2" style={{ borderColor: 'var(--odoo-border)', '--tw-ring-color': 'var(--odoo-purple)' }} placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={isLoading} />
              <p className="text-xs mt-2" style={{ color: 'var(--odoo-text-muted)' }}>Must be &gt; 8 characters, include uppercase, lowercase &amp; special character.</p>
            </div>
            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--odoo-text)' }}>Confirm New Password</label>
              <input type="password" required className="mt-1 block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2" style={{ borderColor: 'var(--odoo-border)', '--tw-ring-color': 'var(--odoo-purple)' }} placeholder="••••••••" value={rePassword} onChange={(e) => setRePassword(e.target.value)} disabled={isLoading} />
            </div>
            <div className="flex flex-col gap-3">
              <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 rounded-lg text-white font-medium transition-colors uppercase tracking-wider text-sm disabled:opacity-50 hover:opacity-90" style={{ backgroundColor: 'var(--odoo-teal)' }}>
                {isLoading ? "Saving..." : "Confirm Reset"}
              </button>
              <Link to="/forgot-password" className="flex items-center justify-center gap-2 text-sm font-medium transition-colors mt-2 hover:underline" style={{ color: 'var(--odoo-purple)' }}>
                <ArrowLeft className="w-4 h-4" />
                Change Email
              </Link>
            </div>
          </form>
        </div>
      </div>
      <div className="hidden lg:block lg:w-1/2 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1586528116311-ad8ed7c8263e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}>
        <div className="h-full w-full flex items-center justify-center p-12" style={{ backgroundColor: 'rgba(113, 75, 103, 0.7)' }}>
          <div className="text-white max-w-lg">
            <h1 className="text-4xl font-bold mb-4">Secure Account Recovery</h1>
            <p className="text-lg text-white/80">Quickly regain access to your inventory management system via unified OTP delivery.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
