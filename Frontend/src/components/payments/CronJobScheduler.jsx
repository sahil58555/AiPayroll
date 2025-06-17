import React, { useState, useEffect } from "react";
import axios from "axios";
import cronParser from "cron-parser";
import { backendDomain } from "../../constant/domain";

export default function CronJobScheduler() {
  const [minute, setMinute] = useState("0");
  const [hour, setHour] = useState("0");
  const [dayOfMonth, setDayOfMonth] = useState("*");
  const [month, setMonth] = useState("*");
  const [dayOfWeek, setDayOfWeek] = useState("*");
  const [customMessage, setCustomMessage] = useState("Execute scheduled payroll");
  const [feedback, setFeedback] = useState("");
  const [nextRuns, setNextRuns] = useState([]);

  const monthOptions = [
    { label: "Every Month (*)", value: "*" },
    ...Array.from({ length: 12 }, (_, i) => ({
      label: new Date(0, i).toLocaleString("default", { month: "long" }),
      value: (i + 1).toString(),
    })),
  ];

  const dayOptions = [
    { label: "Every Day (*)", value: "*" },
    ...Array.from({ length: 31 }, (_, i) => ({
      label: `${i + 1}`,
      value: (i + 1).toString(),
    })),
  ];

  const weekDayOptions = [
    { label: "Every Day (*)", value: "*" },
    { label: "Sunday (0)", value: "0" },
    { label: "Monday (1)", value: "1" },
    { label: "Tuesday (2)", value: "2" },
    { label: "Wednesday (3)", value: "3" },
    { label: "Thursday (4)", value: "4" },
    { label: "Friday (5)", value: "5" },
    { label: "Saturday (6)", value: "6" },
  ];

  // 🔁 Auto-preview logic
  useEffect(() => {
    const cron = `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
    try {
      const interval = cronParser.parse(cron);
      const upcoming = [];
      for (let i = 0; i < 5; i++) {
        upcoming.push(interval.next().toString());
      }
      setNextRuns(upcoming);
      setFeedback("");
    } catch (error) {
      setNextRuns([]);
      setFeedback("⚠️ Invalid cron expression.");
    }
  }, [minute, hour, dayOfMonth, month, dayOfWeek]);

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    const cronExpression = `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;

    try {
    //   await axios.post(
    //     `${backendDomain}/cron/set-cron`,
    //     {
    //       cron: cronExpression,
    //       message: customMessage,
    //     },
    //     {
    //       headers: {
    //         Authorization: `Bearer ${token}`,
    //       },
    //     }
    //   );

      setFeedback(`✅ Cron job set successfully.`);
    } catch (error) {
      console.error(error);
      setFeedback("❌ Failed to set cron job.");
    }
  };

  return (
    <div className="bg-[#1f1f2b] p-6 rounded-2xl shadow-lg space-y-5 text-white mt-10">
      <h2 className="text-xl font-semibold">🛠️ Cron Job Scheduler ( Using Chainlink Automation )</h2>

      {/* Time Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-400">Minute (0–59)</label>
          <input
            type="number"
            min="0"
            max="59"
            value={minute}
            onChange={(e) => setMinute(e.target.value)}
            className="w-full px-4 py-2 rounded-md bg-gray-800 text-white"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400">Hour (0–23)</label>
          <input
            type="number"
            min="0"
            max="23"
            value={hour}
            onChange={(e) => setHour(e.target.value)}
            className="w-full px-4 py-2 rounded-md bg-gray-800 text-white"
          />
        </div>
      </div>

      {/* Date Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-400">Day of Month</label>
          <select
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(e.target.value)}
            className="w-full px-4 py-2 rounded-md bg-gray-800 text-white"
          >
            {dayOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-400">Month</label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full px-4 py-2 rounded-md bg-gray-800 text-white"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Day of Week */}
      <div>
        <label className="text-sm text-gray-400">Day of Week</label>
        <select
          value={dayOfWeek}
          onChange={(e) => setDayOfWeek(e.target.value)}
          className="w-full px-4 py-2 rounded-md bg-gray-800 text-white"
        >
          {weekDayOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Message */}
      <div>
        <label className="text-sm text-gray-400">Custom Message</label>
        <input
          type="text"
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          className="w-full px-4 py-2 rounded-md bg-gray-800 text-white"
        />
      </div>

      {/* Preview */}
      <div className="text-sm text-indigo-400">
        🔁 Cron Expression Preview: <code>{`${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`}</code>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        className="bg-indigo-600 hover:bg-indigo-700 transition-colors px-4 py-2 rounded-lg text-white w-full"
      >
        Set Cron Job
      </button>

      {/* Feedback */}
      {feedback && <p className="text-sm text-green-400 mt-2">{feedback}</p>}

      {/* Next 5 Runs */}
      {nextRuns.length > 0 && (
        <div className="mt-4 text-sm text-yellow-300 space-y-1">
          <p className="font-medium">🗓 Next 5 Executions:</p>
          {nextRuns.map((run, idx) => (
            <div key={idx}>• {run}</div>
          ))}
        </div>
      )}
    </div>
  );
}
