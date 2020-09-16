// const functions = require('firebase-functions');

// // // Create and Deploy Your First Cloud Functions
// // // https://firebase.google.com/docs/functions/write-firebase-functions
// //
// // exports.helloWorld = functions.https.onRequest((request, response) => {
// //   functions.logger.info("Hello logs!", {structuredData: true});
// //   response.send("Hello from Firebase!");
// // });

const { conversation } = require("@assistant/conversation");
const axios = require("axios");
const functions = require("firebase-functions");

const app = conversation();

app.handle("first", async (conv) => {
  let joke = "";
  await axios
    .get("https://api.chucknorris.io/jokes/random")
    .then((res) => res.data)
    .then((res) => (joke = res.value))
    .catch((err) => (joke = err));
  conv.add(joke);
});

exports.ActionsOnGoogleFulfillment = functions.https.onRequest(app);
