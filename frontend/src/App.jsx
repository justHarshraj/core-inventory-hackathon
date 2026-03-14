import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Operations from "./pages/Operations";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Adjustments from "./pages/Adjustments";
import InternalDetail from "./pages/InternalDetail";
import ReceiptDetail from "./pages/ReceiptDetail";
import DeliveryDetail from "./pages/DeliveryDetail";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Routes inside Layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/operations/receipts" element={<Operations type="Receipt" />} />
          <Route path="/operations/deliveries" element={<Operations type="Delivery" />} />
          <Route path="/operations/deliveries/:id" element={<DeliveryDetail />} />
          <Route path="/operations/transfers" element={<Operations type="Internal" />} />
          <Route path="/operations/transfers/:id" element={<InternalDetail />} />
          <Route path="/operations/adjustments" element={<Adjustments />} />
          <Route path="/operations/receipts/:id" element={<ReceiptDetail />} />
          <Route path="/operations/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
