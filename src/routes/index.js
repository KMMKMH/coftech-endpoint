const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const rootRoutePath = path.join(__dirname, "root.js");
if (fs.existsSync(rootRoutePath)) {
  console.log("Loading route: /");
  router.use("/", require(rootRoutePath));
}

const loadRoutes = (directory) => {
  fs.readdirSync(directory).forEach((file) => {
    if (file.endsWith(".js") && !["index.js", "root.js"].includes(file)) {
      const route = require(path.join(directory, file));
      const routeName = `/${file.replace(".js", "").toLowerCase()}`;
      console.log(`Loading route: ${routeName}`);
      router.use(routeName, route);
    }
  });
};

loadRoutes(__dirname);

module.exports = router;
