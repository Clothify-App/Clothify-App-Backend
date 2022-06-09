const express = require("express");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_KEY);
// const queryString = require("querystring");
const cors = require("cors");
const { getProducts, addOrder, updateOrder } = require("./firebaseConfig");
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
const getProductsData = async (checkoutData) => {
  let productsData = [];
  const products = await getProducts();
  products.docs.map((product) => {
    productsData.push(product.data());
  });
  //   console.log(checkoutData);
  // new Code

  let paymentProductData = [];
  checkoutData.map((details) => {
    productsData.map((product) => {
      if (product.uid == details.id) {
        paymentProductData.push({
          productName: product.title,
          product_id: product.uid,
          productPrice:
            (Number(product.rentPrice) + Number(product.refundableAmount)) *
            100,
          productQuantity: Number(details.quantity),
        });
      }
    });
  });
  //End new Code
  // console.log(paymentProductData);
  return paymentProductData;
  /*This array contains payment require product data only for reference console log it 
  ex.[
    {
      productName:x,
      productPrice:y,
      productQuantity:z
    },{
      ......
    }
  ]*/
};

app.get("/", (req, res) => {
  res.send("Payment Server Started");
});

app.post("/checkout", async (req, res) => {
  let productData = await getProductsData(req.body.checkoutData);
  let MeData = {};
  let productDetails = [];
  let quantityDetails = [];
  for (let i = 0; i < productData.length; i++) {
    productDetails.push(productData[i].product_id);
    quantityDetails.push(productData[i].productQuantity);
  }
  // ["gdfgd","gdgf","ddg"]
  MeData.productDetails = JSON.stringify(productDetails);
  MeData.userEmail = req.body.userEmail;
  MeData.quantityDetails = JSON.stringify(quantityDetails);
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      metadata: MeData,
      line_items: productData.map((product) => {
        return {
          price_data: {
            currency: "inr",
            product_data: {
              name: product.productName,
            },
            unit_amount: product.productPrice,
          },
          quantity: product.productQuantity,
        };
      }),
      success_url: "http://localhost:80/success?id={CHECKOUT_SESSION_ID}",
      // success_url: "http://localhost:3000/invoice/id={CHECKOUT_SESSION_ID}",
      cancel_url: "http://localhost:3000/cart",
    });
    // console.log(session.url);
    res.json({
      url: session.url,
    });
  } catch (e) {
    console.log(e);
    res.json({
      error: e.message,
    });
  }
});

app.get("/success", async (req, res) => {
  let session_details = await stripe.checkout.sessions.retrieve(req.query.id);
  console.log(session_details);
  if (session_details.payment_status === "paid") {
    let newOrder = {
      email: session_details.metadata.userEmail,
      productsData: session_details.metadata.productDetails,
      payment_status: "PAID",
      payment_date: Date.now(),
      amount: session_details.amount_total / 100,
      quantityDetails: session_details.metadata.quantityDetails,
    };
    let orderAddedStatus = await addOrder(newOrder);
    newOrder.id = orderAddedStatus.id;
    let confirmOrderStatus = await updateOrder(orderAddedStatus.id, newOrder);
    if (orderAddedStatus) {
      // console.log(orderAddedStatus);
      // console.log(orderAddedStatus.id);
      res.redirect(
        "http://localhost:3000/invoice/" + String(orderAddedStatus.id)
      );
    } else {
      res.send("Payment Done. Some error Occured");
    }
  } else {
    res.redirect("http://localhost:3000/cancel");
  }

  // res.sendFile(__dirname + "/public/success.html");
  // let session_details = await stripe.checkout.sessions.retrieve(req.query.id, {
  //   expand: ["line_items"],
  // });
  // letdata = session_details.line_items.data.map((data) => {
  //   return JSON.stringify(data);
  // });
  // console.log(session_details);

  // let newOrder = {
  //   paymentData: data,
  //   email: session_details.customer_details.email,
  // };
  // // let orderDetails = await addOrder(newOrder);

  // console.log(data);
  // // res.redirect("http://localhost:3000/invoice/fdsjfjdsfj");
  // // res.redirect("http://localhost:3000/invoice");
});

app.listen(80, () => {
  console.log("SERVER STARTED");
});
