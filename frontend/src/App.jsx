import React, { useEffect, useState, lazy, Suspense, Component } from "react";
import Navbar from "./components/Navbar/Navbar";
import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home/Home";
import Footer from "./components/Footer/Footer";
import LoginPopup from "./components/LoginPopup/LoginPopup";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MobileBottomNav from "./components/MobileBottomNav/MobileBottomNav";
import SpaceBackground from "./components/SpaceBackground/SpaceBackground";
import GlobalVideoCall from "./components/GlobalVideoCall/GlobalVideoCall";
import BackgroundUploadBanner from "./components/BackgroundUploadBanner/BackgroundUploadBanner";

const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
const Softwares = lazy(() => import("./pages/Softwares/Softwares"));
const ServiceCenter = lazy(() => import("./pages/ServiceCenter/ServiceCenter"));
const Cart = lazy(() => import("./pages/Cart/Cart"));
const PlaceOrder = lazy(() => import("./pages/PlaceOrder/PlaceOrder"));
const Verify = lazy(() => import("./pages/Verify/Verify"));
const MyOrders = lazy(() => import("./pages/MyOrders/MyOrders"));
const Profile = lazy(() => import("./pages/Profile/Profile"));
const Chat = lazy(() => import("./pages/Chat/Chat"));
const ProductDetail = lazy(() => import("./pages/ProductDetail/ProductDetail"));
const Newsfeed = lazy(() => import("./pages/Newsfeed/Newsfeed"));

class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || "စာမျက်နှာတွင် အမှားတစ်ခု ဖြစ်ပွားခဲ့သည်",
    };
  }

  componentDidCatch(error, info) {
    console.error("App ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "50vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            padding: "24px",
            color: "#f87171",
            fontFamily: "monospace",
            textAlign: "center",
          }}
        >
          <div>{this.state.errorMessage}</div>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, errorMessage: "" })}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid #38bdf8",
              background: "rgba(56, 189, 248, 0.12)",
              color: "#e0f2fe",
              cursor: "pointer",
            }}
          >
            ပြန်စမ်းကြည့်ရန်
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const getIsMobile = () =>
  typeof window !== "undefined" ? window.innerWidth <= 768 : false;

const App = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [isMobile, setIsMobile] = useState(getIsMobile);
  const { pathname } = useLocation();

  useEffect(() => {
    const handleResize = () => setIsMobile(getIsMobile());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <>
      <SpaceBackground />

      {showLogin ? <LoginPopup setShowLogin={setShowLogin} /> : null}
      <div
        className="app"
        style={{
          paddingBottom: isMobile ? "68px" : "0",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Navbar setShowLogin={setShowLogin} />
        <RouteErrorBoundary>
          <Suspense
            fallback={
              <div
                style={{
                  minHeight: "60vh",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#38bdf8",
                  fontFamily: "monospace",
                }}
              >
                LOADING...
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/softwares" element={<Softwares />} />
              <Route path="/service" element={<ServiceCenter />} />
              <Route path="/feed" element={<Newsfeed />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/order" element={<PlaceOrder />} />
              <Route path="/verify" element={<Verify />} />
              <Route path="/myorders" element={<MyOrders />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </Suspense>
        </RouteErrorBoundary>
      </div>

      {/* Website ၏ မည်သည့်စာမျက်နှာတွင်မဆို ဖုန်းဝင်လာပါက လက်ခံ/ငြင်းပယ်နိုင်ရန် */}
      <GlobalVideoCall />

      {/* ဘယ် route ပြောင်းသွားသွား background upload MB status ဆက်ပြရန် */}
      <BackgroundUploadBanner isMobile={isMobile} />

      <MobileBottomNav setShowLogin={setShowLogin} />
      <Footer />
      <ToastContainer position="top-right" autoClose={1800} theme="dark" />
    </>
  );
};

export default App;