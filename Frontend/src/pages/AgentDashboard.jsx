import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Settings, Wrench } from 'lucide-react';

const ChatbotAgent = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: 'Hello! I\'m your AI assistant powered by Azure OpenAI. How can I help you today?',
      timestamp: Date.now()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentConfig, setAgentConfig] = useState({
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 800,
    systemPrompt: 'You are a helpful AI assistant. You have access to various tools to help users with their tasks.'
  });
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Available tools configuration
  const [availableTools, setAvailableTools] = useState([
    { id: 'web_search', name: 'Web Search', enabled: true, description: 'Search the internet for current information' },
    { id: 'calculator', name: 'Calculator', enabled: true, description: 'Perform mathematical calculations' },
    { id: 'code_interpreter', name: 'Code Interpreter', enabled: true, description: 'Execute and analyze code' },
    { id: 'file_reader', name: 'File Reader', enabled: false, description: 'Read and analyze uploaded files' }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Simulated Azure OpenAI API call
  const callAzureOpenAI = async (userMessage, conversationHistory) => {
    // This is where you'd integrate with your actual Azure OpenAI service
    // Replace this with your actual API call
    
    const enabledTools = availableTools.filter(tool => tool.enabled);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // Simulate different types of responses
      const responses = [
        `I understand you're asking about "${userMessage}". Based on my analysis, here's what I can help you with...`,
        `Let me process that request using my available tools. ${enabledTools.length > 0 ? `I have ${enabledTools.length} tools available to assist you.` : ''}`,
        `That's an interesting question about "${userMessage}". Let me think through this step by step...`,
        `I can help you with that. ${enabledTools.some(t => t.id === 'web_search') ? 'Let me search for the latest information...' : 'Based on my knowledge...'}`
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      // Simulate tool usage
      let toolUsage = '';
      if (enabledTools.length > 0 && Math.random() > 0.5) {
        const usedTool = enabledTools[Math.floor(Math.random() * enabledTools.length)];
        toolUsage = `\n\n🔧 *Used ${usedTool.name}: ${usedTool.description}*`;
      }
      
      return randomResponse + toolUsage;
      
    } catch (error) {
      console.error('Azure OpenAI API Error:', error);
      throw new Error('Failed to get response from Azure OpenAI');
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await callAzureOpenAI(userMessage.content, messages);
      
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: Date.now(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleTool = (toolId) => {
    setAvailableTools(prev => 
      prev.map(tool => 
        tool.id === toolId ? { ...tool, enabled: !tool.enabled } : tool
      )
    );
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">AI Assistant</h1>
              <p className="text-sm text-gray-500">Powered by Azure OpenAI</p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Model Configuration</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Model</label>
                  <select 
                    value={agentConfig.model}
                    onChange={(e) => setAgentConfig(prev => ({...prev, model: e.target.value}))}
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-35-turbo">GPT-3.5 Turbo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Temperature: {agentConfig.temperature}</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={agentConfig.temperature}
                    onChange={(e) => setAgentConfig(prev => ({...prev, temperature: parseFloat(e.target.value)}))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Available Tools</h3>
              <div className="grid grid-cols-2 gap-2">
                {availableTools.map(tool => (
                  <div key={tool.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={tool.id}
                      checked={tool.enabled}
                      onChange={() => toggleTool(tool.id)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor={tool.id} className="text-xs text-gray-700 flex items-center">
                      <Wrench className="w-3 h-3 mr-1" />
                      {tool.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-xs lg:max-w-md xl:max-w-lg ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.type === 'user' 
                  ? 'bg-blue-600 ml-2' 
                  : message.isError 
                    ? 'bg-red-500 mr-2' 
                    : 'bg-gray-600 mr-2'
              }`}>
                {message.type === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              <div className={`rounded-lg px-4 py-2 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.isError
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-200'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatTimestamp(message.timestamp)}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center mr-2">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                  <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="1"
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </div>
        
        {/* Tool Status */}
        <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
          <Wrench className="w-3 h-3" />
          <span>{availableTools.filter(t => t.enabled).length} tools enabled</span>
        </div>
      </div>
    </div>
  );
};

export default ChatbotAgent;