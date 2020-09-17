// const functions = require('firebase-functions');

// // // Create and Deploy Your First Cloud Functions
// // // https://firebase.google.com/docs/functions/write-firebase-functions
// //
// // exports.helloWorld = functions.https.onRequest((request, response) => {
// //   functions.logger.info("Hello logs!", {structuredData: true});
// //   response.send("Hello from Firebase!");
// // });

const { conversation, Image, List } = require("@assistant/conversation");
const axios = require("axios");
const functions = require("firebase-functions");
const AccessToken = require("./ACCESS_TOKEN");

const app = conversation();

app.handle("first", async (conv) => {
  conv.add("What i can do for you?");
});

app.handle("createDoc", async (conv) => {
  let data = JSON.stringify({
    template_id: 1,
    title: conv.session.params.newTitle,
  });

  let config = {
    method: "post",
    url: "https://api.revvsales.com/api/docs",
    headers: {
      AccessToken,
      "Content-Type": "application/json",
    },
    data: data,
  };

  await axios(config)
    .then((response) =>
      conv.add("Hook Created " + conv.session.params.newTitle)
    )
    .catch((error) => {
      conv.add(error);
    });
});

app.handle("chooseTemplate", async (conv) => {
  let list = [];

  conv.add("This is a list.");

  let config = {
    method: "get",
    url: "https://api.revvsales.com/api/docstemplate/?page_num=1&status=ACTIVE",
    headers: {
      AccessToken,
      "Content-Type": "application/json",
    },
  };

  await axios(config)
    .then(({ data: { Templates: data } }) => {
      for (let i = 0; i < 4; i++) {
        list.push({
          name: String(data[i].id),
          synonyms: ["choose " + (i + 1), String(i + 1), data[i].title],
          display: {
            title: data[i].title,
            description: "Description of Item #1",
            image: new Image({ url: data[i].thumbnail, alt: data[i].title }),
          },
        });
      }
      return list;
    })
    .catch((error) => {
      conv.add("Something went wrong");
    });

  // Override type based on slot 'prompt_option'
  conv.session.typeOverrides = [
    {
      name: "optionNumber",
      mode: "TYPE_REPLACE",
      synonym: {
        entries: [...list],
      },
    },
  ];

  // Define prompt content using keys
  conv.add(
    new List({
      title: "List title",
      subtitle: "List subtitle",
      items: [...list.map((item) => ({ key: String(item.name) }))],
    })
  );
});

exports.ActionsOnGoogleFulfillment = functions.https.onRequest(app);
