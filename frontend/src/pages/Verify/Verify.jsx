import React, { useContext, useEffect } from "react";
import "./Verify.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";

const Verify = () => {
  const [searchParams] = useSearchParams();
  const success = searchParams.get("success");
  const orderId = searchParams.get("orderId");
  const { url } = useContext(StoreContext);
  const navigate = useNavigate();

  const verifyPayment = async () => {
    if (!url) return;
    try {
      const response = await axios.post(`${url}/api/order/verify`, {
        success,
        orderId,
      });
      if (response.data.success) {
        toast.success("Order Placed Successfully");
        navigate("/myorders");
      } else {
        toast.error("Payment verification failed");
        navigate("/");
      }
    } catch (error) {
      toast.error("Something went wrong");
      navigate("/");
    }
  };

  useEffect(() => {
    verifyPayment();
  }, [url]);

  return (
    <div className="verify">
      <div className="spinner"></div>
      <p>ငွေပေးချေမှု အတည်ပြုနေပါသည်၊ ခေတ္တစောင့်ဆိုင်းပါ...</p>
    </div>
  );
};

export default Verify;
