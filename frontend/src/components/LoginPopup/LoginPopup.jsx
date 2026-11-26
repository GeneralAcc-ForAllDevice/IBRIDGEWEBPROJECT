import React, { useContext, useState } from "react";
import "./LoginPopup.css";
import { assets } from "../../assets/frontend_assets/assets";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";

const LoginPopup = ({ setShowLogin }) => {
  const { url, setToken, setRole, setUserName, setUser } =
    useContext(StoreContext);
  const [currentState, setCurrentState] = useState("Login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const onLogin = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const endpoint =
      currentState === "Login" ? "/api/user/login" : "/api/user/register";
    const newUrl = `${url}${endpoint}`;

    setIsSubmitting(true);
    try {
      const response = await axios.post(newUrl, data);

      if (response.data?.success) {
        const nextToken = response.data.token || "";
        const userRole = response.data.role || "user";
        const nameToSave = response.data.name || data.name || "User";

        setToken(nextToken);
        if (nextToken) {
          localStorage.setItem("token", nextToken);
        }

        setRole(userRole);
        localStorage.setItem("role", userRole);

        setUserName(nameToSave);
        localStorage.setItem("userName", nameToSave);

        if (typeof setUser === "function") {
          const userObj = response.data.user || {
            _id: response.data.userId || response.data.id || "",
            name: nameToSave,
            email: data.email,
            role: userRole,
          };
          setUser(userObj);
          localStorage.setItem("user", JSON.stringify(userObj));
        }

        toast.success(
          currentState === "Login"
            ? "Login Successfully"
            : "Account Created Successfully"
        );
        setShowLogin(false);
      } else {
        toast.error(response.data?.message || "Authentication failed");
      }
    } catch (error) {
      console.error("LoginPopup error:", error);
      const errMsg =
        error?.response?.data?.message ||
        "Server နှင့် ချိတ်ဆက်၍ မရပါ (Network / URL ကို စစ်ပါ)";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-popup">
      <form onSubmit={onLogin} className="login-popup-container">
        <div className="login-popup-title">
          <h2>{currentState}</h2>
          <img
            onClick={() => setShowLogin(false)}
            src={assets.cross_icon}
            alt="Close"
          />
        </div>
        <div className="login-popup-inputs">
          {currentState === "Login" ? null : (
            <input
              name="name"
              onChange={onChangeHandler}
              value={data.name}
              type="text"
              placeholder="Your name"
              required
            />
          )}
          <input
            name="email"
            onChange={onChangeHandler}
            value={data.email}
            type="email"
            placeholder="Your email"
            required
          />
          <input
            name="password"
            onChange={onChangeHandler}
            value={data.password}
            type="password"
            placeholder="Your password"
            required
          />
        </div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Please wait..."
            : currentState === "Sign Up"
            ? "Create Account"
            : "Login"}
        </button>
        <div className="login-popup-condition">
          <input type="checkbox" required />
          <p>By continuing, I agree to the terms of use & privacy policy.</p>
        </div>
        {currentState === "Login" ? (
          <p>
            Create a new account?{" "}
            <span onClick={() => setCurrentState("Sign Up")}>Click here</span>
          </p>
        ) : (
          <p>
            Already have an account?{" "}
            <span onClick={() => setCurrentState("Login")}>Login here</span>
          </p>
        )}
      </form>
    </div>
  );
};

export default LoginPopup;