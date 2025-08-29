#!/usr/bin/env node

const os = require('os');
const fs = require('fs');
const path = require('path');

/**
 * Get the active local network IP address
 * Prioritizes wireless interfaces and common network ranges
 */
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  // Look through all network interfaces
  for (const interfaceName in interfaces) {
    const networkInterface = interfaces[interfaceName];
    
    for (const connection of networkInterface) {
      // Skip loopback, non-IPv4, and internal addresses
      if (connection.family === 'IPv4' && !connection.internal) {
        const ip = connection.address;
        
        // Prioritize common local network ranges
        if (ip.startsWith('192.168.')) {
          candidates.unshift({ ip, priority: 1, interface: interfaceName });
        } else if (ip.startsWith('10.')) {
          candidates.push({ ip, priority: 2, interface: interfaceName });
        } else if (ip.startsWith('172.')) {
          candidates.push({ ip, priority: 3, interface: interfaceName });
        } else {
          candidates.push({ ip, priority: 4, interface: interfaceName });
        }
      }
    }
  }

  // Sort by priority (lower number = higher priority)
  candidates.sort((a, b) => a.priority - b.priority);

  if (candidates.length === 0) {
    throw new Error('No local IP address found');
  }

  const selected = candidates[0];
  console.log(`🌐 Detected local IP: ${selected.ip} (${selected.interface})`);
  
  return selected.ip;
}

/**
 * Update the .env file with the new API URL
 */
function updateEnvFile(newIP) {
  const envPath = path.join(__dirname, '.env');
  const newApiUrl = `http://${newIP}:3000`;
  
  // Check if .env file exists
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found');
    process.exit(1);
  }

  try {
    // Read current .env file
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    let updated = false;
    let oldValue = null;

    // Update the EXPO_PUBLIC_API_URL line
    const updatedLines = lines.map(line => {
      if (line.startsWith('EXPO_PUBLIC_API_URL=')) {
        oldValue = line.split('=')[1];
        updated = true;
        return `EXPO_PUBLIC_API_URL=${newApiUrl}`;
      }
      return line;
    });

    // If the line doesn't exist, add it
    if (!updated) {
      updatedLines.push(`EXPO_PUBLIC_API_URL=${newApiUrl}`);
      console.log('➕ Added EXPO_PUBLIC_API_URL to .env file');
    } else {
      console.log(`🔄 Updated EXPO_PUBLIC_API_URL:`);
      console.log(`   From: ${oldValue}`);
      console.log(`   To:   ${newApiUrl}`);
    }

    // Write updated content back to file
    fs.writeFileSync(envPath, updatedLines.join('\n'));
    
    console.log('✅ .env file updated successfully');
    console.log(`📱 Mobile app will now connect to: ${newApiUrl}`);
    
    return newApiUrl;

  } catch (error) {
    console.error('❌ Error updating .env file:', error.message);
    process.exit(1);
  }
}

/**
 * Main function
 */
function main() {
  console.log('🚀 Updating .env file with current local IP...\n');
  
  try {
    // Get current local IP
    const localIP = getLocalIPAddress();
    
    // Update .env file
    const newApiUrl = updateEnvFile(localIP);
    
    console.log('\n💡 Next steps:');
    console.log('1. Restart your backend server: npm run dev (in backend folder)');
    console.log('2. Start your mobile app: npm run start:app');
    console.log('3. Test connectivity by visiting in your phone browser:');
    console.log(`   ${newApiUrl}/ping`);
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { getLocalIPAddress, updateEnvFile };