const { callAzureAgent } = require("../openai/client/agent");

const agentCall = async (req, res) => {
  try {
    const userMessage = req.body.message;
    const result = await callAzureAgent(req, userMessage);
    console.log("Agent call result:", result);
    if (result.error) {
      return res.status(400).json({
        status: "failed",
        message: result.error,
      });
    }

    res.status(200).json({
      status: "success",
      message: result.message,
      triggerMetaMaskPayment: result.triggerMetaMaskPayment || false,
    });
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: error.message,
    });
  }
};

module.exports = {
  agentCall,
};
