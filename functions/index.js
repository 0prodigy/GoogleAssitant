// const functions = require('firebase-functions');

// // // Create and Deploy Your First Cloud Functions
// // // https://firebase.google.com/docs/functions/write-firebase-functions
// //
// // exports.helloWorld = functions.https.onRequest((request, response) => {
// //   functions.logger.info("Hello logs!", {structuredData: true});
// //   response.send("Hello from Firebase!");
// // });

const { conversation, Image, List } = require("@assistant/conversation");
const { actionssdk } = require("actions-on-google");
const axios = require("axios");
const functions = require("firebase-functions");
const AccessToken = require("./ACCESS_TOKEN");

const app = conversation();

app.handle("first", async (conv) => {
  conv.add("What i can do for you?");
});

app.handle("createDoc", async (conv) => {
  let data = JSON.stringify({
    template_id: conv.session.params.templateNumber,
    title: conv.session.params.newTitle || "Untitled Document",
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
      title: "All templates list",
      subtitle: "available template " + list.length,
      items: [...list.map((item) => ({ key: String(item.name) }))],
    })
  );
});

const ASSISTANT_LOGO_IMAGE = new Image({
    url: "https://developers.google.com/assistant/assistant_96.png",
    alt: "Google Assistant logo",
});

app.handle("contactList", async (conv) => {
  conv.prompt.add("i need more details");
  let list = [];

  let config = {
    method: "get",
    url: "https://api.revvsales.com/api/docstemplate/?page_num=1&status=ACTIVE",
    headers: {
      AccessToken,
      "Content-Type": "application/json",
    },
  };

  await axios(config)
    .then(({ data: { Contacts: data } }) => {
      for (let i = 0; i < data.length; i++) {
        list.push({
          name: String(data[i].email+"#"+data[i].name),
          synonyms: ["choose " + (i + 1), String(i + 1), data[i].name, data[i].email],
          display: {
            title: data[i].name,
            description: data[i].email,
            image: ASSISTANT_LOGO_IMAGE,
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
      name: "contactId",
      mode: "TYPE_REPLACE",
      synonym: {
        entries: [...list],
      },
    },
  ];

  // Define prompt content using keys
  conv.add(
    new List({
      title: "All contact list",
      subtitle: "available contact",
      items: [...list.map((item) => ({ key: String(item.name) }))],
    })
  );
});

app.handle("listDocument", async (conv) => {
  let list = [];

  conv.add("Pick one project");

  let config = {
    method: "get",
    url: "https://api.revvsales.com/api/folders/?page_num=1",
    headers: {
      AccessToken,
      "Content-Type": "application/json",
    },
  };

  await axios(config)
    .then(({ data }) => {
      data = data.page.inodes;
      for (let i = 0; i < data.length; i++) {
        if (
          data[i].document_status !== null &&
          data[i].document_status.name.toLowerCase() === "completed"
        ) {
          list.push({
            name: String(data[i].id),
            synonyms: ["choose " + (i + 1), String(i + 1), data[i].name],
            display: {
              title: data[i].name,
              description: "Description of Item #1",
              image: ASSISTANT_LOGO_IMAGE,
            },
          });
        }
      }
      return list;
    })
    .catch((error) => {
      // console.log(error);
      conv.add("Something went wrong");
    });
  // Override type based on slot 'prompt_option'
  conv.session.typeOverrides = [
    {
      name: "objectId",
      mode: "TYPE_REPLACE",
      synonym: {
        entries: [...list],
      },
    },
  ];

  // Define prompt content using keys
  if (list.length !== 0) {
    conv.add(
      new List({
        title: "All Completed Document",
        subtitle: "total docs " + list.length,
        items: [...list.map((item) => ({ key: String(item.name) }))],
      })
    );
  } else {
    conv.add("You haven't completed any document");
  }
});

async function getObjectId(id) {
  let config = {
    method: "get",
    url: "https://api.revvsales.com/api/docs/" + id,
    headers: {
      AccessToken,
      "Content-Type": "application/json",
    },
  };

  let result = "";
  await axios(config)
    .then((res) => res.data.Document)
    .then((res) => (result = res.object_id))
    .catch((err) => console.log(err));

  return result;
}

app.handle("publishDoc", async (conv) => {
  const id = conv.session.params.documentId;
  let obj_id = await getObjectId(id);
  const data = {
    object_id: obj_id,
    object_type: "DOC",
  };
  let config = {
    method: "post",
    url: "https://api.revvsales.com/api/perma-link",
    headers: {
      AccessToken,
      "Content-Type": "application/json",
    },
    data: data,
  };

  await axios(config)
    .then((res) => res.data)
    .then((res) => conv.add("great here is your magic link " + res.url))
    .catch((err) => conv.add("Something went wrong" + err));
});

exports.ActionsOnGoogleFulfillment = functions.https.onRequest(app);
