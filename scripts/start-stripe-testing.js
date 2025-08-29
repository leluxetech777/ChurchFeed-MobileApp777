#!/usr/bin/env node

/**
 * Stripe Testing Mode
 * 
 * This script:
 * 1. Starts backend server on port 3000
 * 2. Creates ngrok tunnel for port 3000  
 * 3. Updates .env with tunnel URL for Stripe testing
 * 4. Starts Expo development server
 * 5. Cleans up on exit
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');

let backendProcess = null;
let expoProcess = null;
let ngrokProcess = null;

// Cleanup function
function cleanup() {
  console.log('\n🧹 Cleaning up Stripe testing mode...');
  
  if (backendProcess) {
    backendProcess.kill('SIGTERM');
  }
  
  if (expoProcess) {
    expoProcess.kill('SIGTERM');
  }
  
  if (ngrokProcess) {
    ngrokProcess.kill('SIGTERM');
  }
  
  // Remove tunnel URL from .env
  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(/^EXPO_PUBLIC_STRIPE_TUNNEL_URL=.*$/m, '# EXPO_PUBLIC_STRIPE_TUNNEL_URL=');
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Cleared Stripe tunnel URL from .env');
    console.log('🏠 Back to LAN mode (192.168.40.78:3000)');
  } catch (error) {
    console.error('❌ Error clearing .env:', error.message);
  }
  
  process.exit(0);
}

// Handle process termination
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

async function startStripeTestingMode() {
  console.log('🔴 STRIPE TESTING MODE');
  console.log('📱 This mode enables Stripe checkout testing with ngrok tunnel');
  console.log('🏠 Use "npm start" for daily development (LAN mode)\n');
  
  // Step 1: Start backend server
  console.log('1️⃣ Starting backend server...');
  backendProcess = spawn('npm', ['start'], {
    cwd: path.join(__dirname, '../backend'),
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  backendProcess.stdout.on('data', (data) => {
    console.log(`[Backend] ${data.toString().trim()}`);
  });
  
  backendProcess.stderr.on('data', (data) => {
    console.log(`[Backend Error] ${data.toString().trim()}`);
  });
  
  // Wait for backend to start
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Step 2: Start ngrok tunnel
  console.log('\n2️⃣ Creating ngrok tunnel...');
  ngrokProcess = spawn('npx', ['ngrok', 'http', '3000', '--log=stdout'], {
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  let tunnelUrl = null;
  
  ngrokProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[ngrok] ${output.trim()}`);
    
    // Look for tunnel URL in output
    const urlMatch = output.match(/https:\/\/[^.\s]+\.ngrok-free\.app/);
    if (urlMatch && !tunnelUrl) {
      tunnelUrl = urlMatch[0];
      console.log(`\n✅ Tunnel URL found: ${tunnelUrl}`);
      updateEnvFile(tunnelUrl);
      startExpo();
    }
  });
  
  ngrokProcess.stderr.on('data', (data) => {
    console.log(`[ngrok Error] ${data.toString().trim()}`);
  });
  
  // Timeout for tunnel creation
  setTimeout(() => {
    if (!tunnelUrl) {
      console.log('\n⚠️ Tunnel creation timed out. Make sure ngrok is installed:');
      console.log('npm install -g ngrok');
      console.log('Or install via: brew install ngrok');
      process.exit(1);
    }
  }, 30000);
}

function updateEnvFile(tunnelUrl) {
  try {
    console.log('\n3️⃣ Updating .env for Stripe testing...');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    const tunnelUrlPattern = /^# EXPO_PUBLIC_STRIPE_TUNNEL_URL=.*$/m;
    
    if (tunnelUrlPattern.test(envContent)) {
      envContent = envContent.replace(tunnelUrlPattern, `EXPO_PUBLIC_STRIPE_TUNNEL_URL=${tunnelUrl}`);
    } else {
      envContent += `\nEXPO_PUBLIC_STRIPE_TUNNEL_URL=${tunnelUrl}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated .env with Stripe testing tunnel');
    console.log(`🔗 API requests will use: ${tunnelUrl}`);
  } catch (error) {
    console.error('❌ Error updating .env file:', error.message);
  }
}

function startExpo() {
  console.log('\n4️⃣ Starting Expo development server...');
  console.log('📱 Scan QR code with Expo Go');
  console.log('💳 Stripe checkout will now work in Expo Go!\n');
  
  expoProcess = spawn('npx', ['expo', 'start', '--clear'], {
    stdio: 'inherit'
  });
  
  expoProcess.on('exit', (code) => {
    console.log(`\nExpo process exited with code ${code}`);
    cleanup();
  });
}

// Start everything
startStripeTestingMode().catch(error => {
  console.error('❌ Error starting Stripe testing mode:', error);
  cleanup();
});