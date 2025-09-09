#!/usr/bin/env node
// index.js
// MCP API Client Server (HTTP + WebSocket)

const axios = require("axios");
const WebSocket = require("ws");
const fs = require("fs");

// log file
const LOG_FILE = "logs.json";

// helper: save logs
function saveLog(entry) {
  let logs = [];
  if (fs.existsSync(LOG_FILE)) {
    logs = JSON.parse(fs.readFileSync(LOG_FILE));
  }
  logs.push(entry);
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

// ------------------ HTTP CLIENT ------------------
async function sendHttpRequest(method, url, body = null) {
  try {
    const response = await axios({
      method,
      url,
      data: body ? JSON.parse(body) : undefined,
      withCredentials: true, // handles cookies
    });

    console.log(`✅ Response: ${response.status} ${response.statusText}`);
    console.log("📦 Data:", response.data);

    saveLog({
      time: new Date().toISOString(),
      type: "HTTP",
      method,
      url,
      status: response.status,
      response: response.data,
    });
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

// ------------------ WEBSOCKET CLIENT ------------------
function sendWebSocketMessage(url, message) {
  const ws = new WebSocket(url);

  ws.on("open", () => {
    console.log(`🔗 Connected to ${url}`);
    console.log(`📤 Sent: ${message}`);
    ws.send(message);
  });

  ws.on("message", (data) => {
    console.log(`📥 Received: ${data.toString()}`);

    saveLog({
      time: new Date().toISOString(),
      type: "WebSocket",
      url,
      sent: message,
      received: data.toString(),
    });

    ws.close();
  });

  ws.on("close", () => {
    console.log("🔒 Connection closed");
  });

  ws.on("error", (err) => {
    console.error("❌ WebSocket Error:", err.message);
  });
}

// ------------------ CLI HANDLER ------------------
const args = process.argv.slice(2);
const mode = args[0];

if (mode === "http") {
  const method = args[1];
  const url = args[2];
  const body = args[3]; // optional
  sendHttpRequest(method, url, body);
} else if (mode === "ws") {
  const url = args[1];
  const message = args[2] || "Hello from MCP Client!";
  sendWebSocketMessage(url, message);
} else {
  console.log("Usage:");
  console.log("  HTTP → node index.js http GET https://jsonplaceholder.typicode.com/posts/1");
  console.log('  HTTP with body → node index.js http POST https://jsonplaceholder.typicode.com/posts "{\\"title\\":\\"test\\"}"');
  console.log("  WebSocket → node index.js ws wss://ws.ifelse.io/ \"Hello AICTE\"");
}