const fetch = require("node-fetch");
const config = require("../config/azure-config");
const {
  addEmployee,
  deleteEmployee,
  totalSalary,
  employeesByEmail,
} = require("../../services/adminServices");

const toolSchemas = [
  {
    type: "function",
    function: {
      name: "addEmployee",
      description: "Add a new employee to the system",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Name of the employee" },
          email: {
            type: "string",
            description: "Email address of the employee",
          },
          salary: {
            type: "number",
            description: "Salary of the employee (can be decimal)",
          },
          designation: {
            type: "string",
            description: "Designation of the employee",
          },
          company: { type: "string", description: "Company name" },
          accountId: {
            type: "string",
            description: "Ethereum wallet address of the employee",
          },
          phone: {
            type: "string",
            description: "Phone number of the employee",
          },
        },
        required: [
          "name",
          "email",
          "salary",
          "designation",
          "company",
          "accountId",
          "phone",
        ],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "deleteEmployee",
      description: "Delete an employee by ID",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "Employee ID" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "paySalary",
      description: "Pay salaries to all employees",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getTotalSalary",
      description: "Get the total salary of all employees in the company",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getAllEmployees",
      description:
        "Get all employee details in the company including their personal information, salary, and designation",
      parameters: {
        type: "object",
        properties: {
          company: {
            type: "string",
            description: "Company name to filter employees (optional)",
          },
        },
        required: [],
      },
    },
  },
];

async function callAzureOpenAI(messages) {
  const url = `${config.endpoint}/openai/deployments/${config.deploymentName}/chat/completions?api-version=${config.apiVersion}`;

  const payload = {
    messages,
    tools: toolSchemas,
    tool_choice: "auto",
    max_tokens: 300,
    temperature: 0.2,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "api-key": config.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return await response.json();
}

async function executeFunction(req, fnName, args) {
  try {
    if (fnName === "addEmployee") {
      return await addEmployee(req, args);
    } else if (fnName === "deleteEmployee") {
      return await deleteEmployee(req, args);
    } else if (fnName === "paySalary") {
      return {
        message: "Please initiate salary payment from the wallet.",
        triggerMetaMaskPayment: true,
      };
    } else if (fnName === "getTotalSalary") {
      return await totalSalary(req, args);
    } else if (fnName === "getAllEmployees") {
      return await employeesByEmail(req, args);
    } else {
      return { error: `Tool function "${fnName}" not implemented` };
    }
  } catch (error) {
    return { error: `Error executing ${fnName}: ${error.message}` };
  }
}

async function callAzureAgent(req, userPrompt) {
  try {
    // Step 1: Send initial prompt to agent
    const messages = [
      {
        role: "system",
        content: `You are an HR assistant. When displaying employee information, format it in a clean, simple way:
      - Use simple bullet points or numbered lists
      - Show essential information: Name, Email, Phone, Salary, Designation, Company
      - Format salary with currency symbol
      - Keep responses concise and professional
      - Avoid showing technical IDs or overly detailed formatting`,
      },
      { role: "user", content: userPrompt },
    ];

    const initialResponse = await callAzureOpenAI(messages);
    const choice = initialResponse.choices[0];

    // Step 2: Check if agent wants to call a function
    if (choice.message.tool_calls) {
      // Add the assistant's message with tool calls to conversation
      messages.push(choice.message);

      // Step 3: Execute each tool call
      for (const toolCall of choice.message.tool_calls) {
        const fnName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);

        console.log(`Executing tool: ${fnName}`, args);

        // Execute the function
        const functionResult = await executeFunction(req, fnName, args);

        // Step 4: Add tool result to conversation
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(functionResult),
        });
      }

      // Step 5: Send tool results back to agent for final response
      const finalResponse = await callAzureOpenAI(messages);
      const finalChoice = finalResponse.choices[0];

      // Handle special cases like MetaMask payment trigger
      if (
        choice.message.tool_calls.some((tc) => tc.function.name === "paySalary")
      ) {
        return {
          message: finalChoice.message.content,
          triggerMetaMaskPayment: true,
        };
      }

      return { message: finalChoice.message.content };
    }

    // No function calls needed, return direct response
    return { message: choice.message.content };
  } catch (error) {
    console.error("Error in callAzureAgent:", error);
    return {
      message: "Sorry, I encountered an error while processing your request.",
      error: error.message,
    };
  }
}

module.exports = {
  callAzureAgent,
};
