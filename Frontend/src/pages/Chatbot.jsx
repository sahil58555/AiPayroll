import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Users,
  Mail,
  Phone,
  DollarSign,
  Briefcase,
  Calendar,
} from "lucide-react";
import axios from "axios";
import { backendDomain } from "../constant/domain";
import { payEmployees } from "../utils/openaiUtil";
import { useWeb3 } from "../context/useWeb3";

// Employee Card Component
const EmployeeCard = ({ employee, index }) => (
  <motion.div
    className="bg-gray-800 rounded-lg p-3 mb-2 border border-gray-600"
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
  >
    <div className="flex items-center justify-between mb-2">
      <h4 className="font-semibold text-indigo-300 text-sm">
        {employee.name || "Unknown Employee"}
      </h4>
      <span className="text-xs bg-indigo-600 px-2 py-1 rounded">
        {employee.designation || "N/A"}
      </span>
    </div>

    <div className="space-y-1 text-xs text-gray-300">
      {employee.email && (
        <div className="flex items-center space-x-2">
          <Mail size={10} />
          <span>{employee.email}</span>
        </div>
      )}

      {employee.phone && (
        <div className="flex items-center space-x-2">
          <Phone size={10} />
          <span>{employee.phone}</span>
        </div>
      )}

      {employee.salary && (
        <div className="flex items-center space-x-2">
          <DollarSign size={10} />
          <span className="font-medium text-green-400">
            ${employee.salary.toLocaleString()}
          </span>
        </div>
      )}

      {employee.company && (
        <div className="flex items-center space-x-2">
          <Briefcase size={10} />
          <span className="text-gray-400 text-xs">ID: {employee.company}</span>
        </div>
      )}

      {employee.dateOfJoining && (
        <div className="flex items-center space-x-2">
          <Calendar size={10} />
          <span>{new Date(employee.dateOfJoining).toLocaleDateString()}</span>
        </div>
      )}
    </div>
  </motion.div>
);

// Enhanced Message Component
const MessageBubble = ({ message }) => {
  // Check if message contains employee data
  const isEmployeeData =
    message.text.includes("Name:") ||
    message.text.includes("details of all employees") ||
    (typeof message.data === "object" && message.data?.employees);

  if (isEmployeeData && message.data?.employees) {
    return (
      <div className="bg-gray-700 text-gray-100 rounded-lg p-3 max-w-full">
        <div className="flex items-center space-x-2 mb-3">
          <Users size={14} />
          <span className="font-semibold text-sm">Employee Directory</span>
          <span className="text-xs bg-indigo-600 px-2 py-1 rounded">
            {message.data.employees.length} employee
            {message.data.employees.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {message.data.employees.map((employee, index) => (
            <EmployeeCard
              key={employee.id || `emp-${index}`}
              employee={employee}
              index={index}
            />
          ))}
        </div>

        {message.data.totalSalary && (
          <div className="mt-3 pt-2 border-t border-gray-600">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Total Monthly Salary:</span>
              <span className="font-bold text-green-400">
                ${message.data.totalSalary.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Regular message
  return (
    <div
      className={`px-3 py-2 rounded-lg text-sm ${
        message.sender === "user"
          ? "bg-indigo-500 text-white"
          : "bg-gray-700 text-gray-100"
      }`}
    >
      <div className="whitespace-pre-wrap">{message.text}</div>
    </div>
  );
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const { provider, signer, account, network } = useWeb3();
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI assistant. How can I help you today?",
      sender: "bot",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Function to parse employee data from text response
  const parseEmployeeData = (responseText) => {
    const employees = [];

    // Split by numbered employee entries (1., 2., 3., etc.)
    const employeeBlocks = responseText.split(/\d+\.\s*\*\*Name:\*\*/).slice(1);

    employeeBlocks.forEach((block) => {
      const employee = {};
      const lines = block.split("\n");

      // Get name from first line
      const nameLine = lines[0]?.trim();
      if (nameLine) {
        employee.name = nameLine;
      }

      // Parse other details
      lines.forEach((line) => {
        const trimmed = line.trim();

        if (trimmed.includes("**Email:**")) {
          employee.email = trimmed.split("**Email:**")[1]?.trim();
        } else if (trimmed.includes("**Phone:**")) {
          employee.phone = trimmed.split("**Phone:**")[1]?.trim();
        } else if (trimmed.includes("**Salary:**")) {
          const salaryText = trimmed.split("**Salary:**")[1]?.trim();
          const salaryMatch = salaryText?.match(
            /\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/
          );
          if (salaryMatch) {
            employee.salary = parseFloat(salaryMatch[1].replace(/,/g, ""));
          }
        } else if (trimmed.includes("**Designation:**")) {
          employee.designation = trimmed.split("**Designation:**")[1]?.trim();
        } else if (trimmed.includes("**Company:**")) {
          employee.company = trimmed.split("**Company:**")[1]?.trim();
        } else if (trimmed.includes("**Date of Joining:**")) {
          employee.dateOfJoining = trimmed
            .split("**Date of Joining:**")[1]
            ?.trim();
        }
      });

      // Only add if we have at least a name
      if (employee.name) {
        employees.push(employee);
      }
    });

    // Fallback: Try alternative parsing pattern
    if (employees.length === 0) {
      const lines = responseText.split("\n");
      let currentEmployee = {};

      lines.forEach((line) => {
        const trimmed = line.trim();

        // Check for numbered employee start
        const numberMatch = trimmed.match(/^(\d+)\.\s*\*\*Name:\*\*\s*(.+)$/);
        if (numberMatch) {
          // Save previous employee if exists
          if (Object.keys(currentEmployee).length > 0) {
            employees.push(currentEmployee);
          }
          // Start new employee
          currentEmployee = { name: numberMatch[2] };
        } else if (trimmed.includes("**Email:**")) {
          currentEmployee.email = trimmed.split("**Email:**")[1]?.trim();
        } else if (trimmed.includes("**Phone:**")) {
          currentEmployee.phone = trimmed.split("**Phone:**")[1]?.trim();
        } else if (trimmed.includes("**Salary:**")) {
          const salaryText = trimmed.split("**Salary:**")[1]?.trim();
          const salaryMatch = salaryText?.match(
            /\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/
          );
          if (salaryMatch) {
            currentEmployee.salary = parseFloat(
              salaryMatch[1].replace(/,/g, "")
            );
          }
        } else if (trimmed.includes("**Designation:**")) {
          currentEmployee.designation = trimmed
            .split("**Designation:**")[1]
            ?.trim();
        } else if (trimmed.includes("**Company:**")) {
          currentEmployee.company = trimmed.split("**Company:**")[1]?.trim();
        }
      });

      // Add the last employee
      if (Object.keys(currentEmployee).length > 0) {
        employees.push(currentEmployee);
      }
    }

    return employees.length > 0
      ? {
          employees,
          totalSalary: employees.reduce(
            (sum, emp) => sum + (emp.salary || 0),
            0
          ),
        }
      : null;
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      text: inputText,
      sender: "user",
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${backendDomain}/openai/chat`,
        {
          message: inputText,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const agentResponse = response.data;
      let text = "";
      let messageData = null;

      if (agentResponse.status === "failed") {
        text = "Error from agent: " + agentResponse.message;
      } else if (agentResponse.triggerMetaMaskPayment) {
        text = "Please complete the payment via MetaMask.";
        payEmployees(signer);
      } else {
        text = agentResponse.message;

        // Try to parse employee data for better display
        const parsedData = parseEmployeeData(text);
        console.log("Original text:", text);
        console.log("Parsed data:", parsedData);

        if (parsedData) {
          messageData = parsedData;
          text = `Found ${parsedData.employees.length} employee(s)`;
        }
      }

      const botResponse = {
        id: messages.length + 2,
        text: text,
        sender: "bot",
        data: messageData,
      };

      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      const errorResponse = {
        id: messages.length + 2,
        text: "Sorry, I encountered an error. Please try again.",
        sender: "bot",
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.button
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50 flex items-center justify-center transition-colors ${
          isOpen
            ? "bg-red-500 hover:bg-red-600"
            : "bg-indigo-500 hover:bg-indigo-600"
        }`}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-24 right-6 w-96 h-[500px] bg-crypto-card border border-gray-700 rounded-xl shadow-2xl z-40 flex flex-col overflow-hidden"
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: "spring", damping: 20 }}
          >
            {/* Chat Header */}
            <div className="bg-indigo-600 p-4 flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                <Bot size={16} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">HR AI Assistant</h3>
                <p className="text-xs text-indigo-200">
                  {isLoading ? "Typing..." : "Online"}
                </p>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div
                    className={`flex items-start space-x-2 max-w-full ${
                      message.sender === "user"
                        ? "flex-row-reverse space-x-reverse"
                        : ""
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                        message.sender === "user"
                          ? "bg-indigo-500"
                          : "bg-gray-600"
                      }`}
                    >
                      {message.sender === "user" ? (
                        <User size={12} />
                      ) : (
                        <Bot size={12} />
                      )}
                    </div>
                    <MessageBubble message={message} />
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  className="flex justify-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                      <Bot size={12} />
                    </div>
                    <div className="bg-gray-700 px-3 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about employees, salaries, or HR tasks..."
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !inputText.trim()}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .bg-crypto-card {
          background-color: #1a1f2e;
        }
      `}</style>
    </>
  );
}
