const { dialogflow, BasicCard } = require("actions-on-google");

// Instantiate the Dialogflow client.
const app = dialogflow({ debug: true });

// Handlers go here..
app.intent("first", (conv) => {
  conv.ask("how are you");
});

app.intent("Say_Something_Silly", (conv) => {
  conv.ask("say something silly");
});

module.exports = app;
