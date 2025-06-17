const express = require("express");
const router = express.Router();
const openaiRouter = require("../Controllers/openaiController");

router.route("/chat").post(openaiRouter.agentCall);

module.exports = router;
