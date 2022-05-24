const express = require("express");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_KEY);
const cors = require("cors");
const { getProducts } = require("./firebaseConfig");
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
          productPrice:
            (Number(product.rentPrice) + Number(product.refundableAmount)) *
            100,
          productQuantity: Number(details.quantity),
        });
      }
    });
  });
  //End new Code
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
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
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
      success_url: "http://localhost:3000/invoice",
      cancel_url: "http://localhost:3000/cart",
    });
    console.log(session.url);
    res.json({
      url: session.url,
    });
  } catch (e) {
    res.json({
      error: e.message,
    });
  }
});

app.listen(80, () => {
  console.log("SERVER STARTED");
});
