var express = require("express");
var app = express();

var PORT = 3001;

app.get("/", function(req, res) {
  res.send("Hello World!");
});

app.listen(PORT, function() {
  console.log("Listening on port 3000...");
});
