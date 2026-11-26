import React, { useContext, useEffect, useState } from "react";
import "./PlaceOrder.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const PlaceOrder = () => {
  const navigate = useNavigate();

  const {
    getTotalCartAmount,
    token,
    food_list,
    software_list,
    cartItems,
    setCartItems,
    url,
  } = useContext(StoreContext);

  const deliveryFee = 2000;

  const dataState = useState({
    name: "",
    phone: "",
    address: "",
  });
  const data = dataState.at(0);
  const setData = dataState.at(1);

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    let orderItems = [];
    const allProducts = [...(food_list || []), ...(software_list || [])];

    allProducts.forEach((item) => {
      if (cartItems[item._id] > 0) {
        let itemInfo = { ...item, quantity: cartItems[item._id] };
        orderItems.push(itemInfo);
      }
    });

    let orderData = {
      address: {
        firstName: data.name,
        lastName: "",
        phone: data.phone,
        street: data.address,
        city: "",
        state: "",
        zipcode: "",
        country: "Myanmar",
      },
      items: orderItems,
      amount: getTotalCartAmount() + deliveryFee,
    };

    try {
      let response = await axios.post(`${url}/api/order/place`, orderData, {
        headers: { token },
      });
      if (response.data.success) {
        setCartItems({});
        toast.success("Order အောင်မြင်စွာ တင်ပြီးပါပြီ");
        navigate("/myorders");
      } else {
        toast.error(response.data.message || "Order တင်ရာတွင် အမှားရှိနေပါသည်");
      }
    } catch (error) {
      toast.error("Server နှင့် ချိတ်ဆက်၍ မရပါ");
    }
  };

  useEffect(() => {
    if (!token) {
      toast.error("Please Login first");
      navigate("/cart");
    } else if (getTotalCartAmount() === 0) {
      toast.error("Please Add Items to Cart");
      navigate("/cart");
    }
  }, [token]);

  return (
    <form className="place-order" onSubmit={placeOrder}>
      <div className="place-order-left">
        <p className="title">Delivery Information</p>

        <input
          required
          name="name"
          value={data.name}
          onChange={onChangeHandler}
          type="text"
          placeholder="အမည် (Full Name)"
        />

        <input
          required
          name="phone"
          value={data.phone}
          onChange={onChangeHandler}
          type="tel"
          placeholder="ဖုန်းနံပါတ် (Phone Number)"
        />

        <textarea
          required
          name="address"
          value={data.address}
          onChange={onChangeHandler}
          rows="4"
          placeholder="ပို့ဆောင်ရမည့် လိပ်စာအပြည့်အစုံ (Delivery Address)"
        />
      </div>

      <div className="place-order-right">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotals</p>
              <p>{getTotalCartAmount().toLocaleString()} Kyats</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>{getTotalCartAmount() === 0 ? 0 : deliveryFee.toLocaleString()} Kyats</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>
                {getTotalCartAmount() === 0
                  ? 0
                  : (getTotalCartAmount() + deliveryFee).toLocaleString()}{" "}
                Kyats
              </b>
            </div>
          </div>
          <button type="submit">PLACE ORDER (CASH ON DELIVERY)</button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
