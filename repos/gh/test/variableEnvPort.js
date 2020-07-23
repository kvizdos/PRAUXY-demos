var express = require("express");
var app = express();

let appPort = process.env.VARIABLEPORT;

app.get("/", function(req, res) {
  res.send("Hello World!");
});

app.listen(appPort, function() {
  console.log("Listening on port 3000...");
});
