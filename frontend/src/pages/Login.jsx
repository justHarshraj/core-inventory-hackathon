import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import { Package } from "lucide-react";

function Login() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      const res = await API.post("/auth/login", {
        login_id: loginId,
        password,
      });
      localStorage.setItem("user", JSON.stringify(res.data));
      navigate("/dashboard");
    } catch (error) {
      console.error("Login Error:", error);
      setErrorMsg(error.response?.data?.detail || "Invalid Login Id or Password");
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
            <h2 className="text-3xl font-bold" style={{ color: 'var(--odoo-purple)' }}>
              CoreInventory
            </h2>
            <p className="mt-2" style={{ color: 'var(--odoo-text-muted)' }}>Sign in to manage your inventory</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 bg-white p-8 rounded-2xl shadow-sm border" style={{ borderColor: 'var(--odoo-border)' }}>
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm text-center">
                {errorMsg}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--odoo-text)' }}>Login Id</label>
              <input
                type="text"
                required
                className="mt-1 block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                style={{ borderColor: 'var(--odoo-border)', '--tw-ring-color': 'var(--odoo-purple)' }}
                placeholder="User123"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium" style={{ color: 'var(--odoo-text)' }}>Password</label>
              </div>
              <input
                type="password"
                required
                className="mt-1 block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                style={{ borderColor: 'var(--odoo-border)', '--tw-ring-color': 'var(--odoo-purple)' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 rounded-lg text-white font-medium transition-colors uppercase tracking-wider text-sm hover:opacity-90"
                style={{ backgroundColor: 'var(--odoo-purple)' }}
              >
                SIGN IN
              </button>
              <div className="text-center text-sm font-medium mt-2" style={{ color: 'var(--odoo-purple)' }}>
                <Link to="/forgot-password" className="cursor-pointer hover:underline">Forget Password ?</Link> | <Link to="/register" className="hover:underline">Sign Up</Link>
              </div>
            </div>
          </form>
        </div>
      </div>
      <div className="hidden lg:block lg:w-1/2 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1586528116311-ad8ed7c8263e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}>
        <div className="h-full w-full flex items-center justify-center p-12" style={{ backgroundColor: 'rgba(113, 75, 103, 0.7)' }}>
          <div className="text-white max-w-lg">
            <h1 className="text-4xl font-bold mb-4">Streamline Your Supply Chain</h1>
            <p className="text-lg text-white/80">Manage receipts, deliveries, and internal transfers seamlessly with real-time stock tracking.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
