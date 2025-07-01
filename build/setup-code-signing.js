#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔐 Coach-AI Code Signing Setup\n');

// Check if running on different platforms
const isWindows = process.platform === 'win32';
const isMacOS = process.platform === 'darwin';
const isLinux = process.platform === 'linux';

// Check environment variables
function checkEnvironmentVariables() {
  console.log('📋 Checking environment variables...\n');
  
  const requiredVars = [];
  
  if (isWindows) {
    console.log('🪟 Windows Code Signing Variables:');
    
    // Windows certificate variables
    const windowsVars = [
      'CSC_KEY_PASSWORD',
      'CSC_LINK'
    ];
    
    windowsVars.forEach(varName => {
      const value = process.env[varName];
      const status = value ? '✅' : '❌';
      console.log(`   ${status} ${varName}: ${value ? '[SET]' : '[NOT SET]'}`);
      
      if (!value && varName === 'CSC_KEY_PASSWORD') {
        requiredVars.push(varName);
      }
    });
    
    // Check certificate file
    const certPath = process.env.CSC_LINK || 'build/certs/windows-cert.p12';
    const certExists = fs.existsSync(certPath);
    console.log(`   ${certExists ? '✅' : '❌'} Certificate file: ${certPath} ${certExists ? '[EXISTS]' : '[NOT FOUND]'}`);
    
    if (!certExists) {
      requiredVars.push('Windows Certificate File');
    }
  }
  
  if (isMacOS) {
    console.log('\n🍎 macOS Code Signing Variables:');
    
    const macVars = [
      'APPLE_ID',
      'APPLE_ID_PASSWORD', 
      'APPLE_TEAM_ID',
      'CSC_NAME'
    ];
    
    macVars.forEach(varName => {
      const value = process.env[varName];
      const status = value ? '✅' : '❌';
      console.log(`   ${status} ${varName}: ${value ? '[SET]' : '[NOT SET]'}`);
      
      if (!value) {
        requiredVars.push(varName);
      }
    });
    
    // Check for macOS certificates in keychain
    try {
      const result = execSync('security find-identity -v -p codesigning', { encoding: 'utf8' });
      const hasDevId = result.includes('Developer ID Application');
      console.log(`   ${hasDevId ? '✅' : '❌'} Developer ID Certificate: ${hasDevId ? '[FOUND]' : '[NOT FOUND]'}`);
      
      if (!hasDevId) {
        requiredVars.push('Developer ID Certificate');
      }
    } catch (error) {
      console.log('   ❌ Unable to check keychain certificates');
      requiredVars.push('Keychain Access');
    }
  }
  
  if (isLinux) {
    console.log('\n🐧 Linux: No code signing required');
  }
  
  return requiredVars;
}

// Generate environment template
function generateEnvTemplate() {
  console.log('\n📝 Generating environment template...\n');
  
  let envTemplate = `# Coach-AI Code Signing Environment Variables
# Copy this to your .env file and fill in the values

`;

  if (isWindows) {
    envTemplate += `# Windows Code Signing
CSC_KEY_PASSWORD=your-certificate-password
CSC_LINK=build/certs/windows-cert.p12

`;
  }
  
  if (isMacOS) {
    envTemplate += `# macOS Code Signing and Notarization
APPLE_ID=your-apple-id@example.com
APPLE_ID_PASSWORD=your-app-specific-password
APPLE_TEAM_ID=YOUR_TEAM_ID
CSC_NAME="Developer ID Application: Coach-AI Team"

`;
  }
  
  envTemplate += `# Disable code signing for development builds
# CSC_IDENTITY_AUTO_DISCOVERY=false

# GitHub Actions Secrets (for CI/CD)
# Add these as repository secrets:
# - CSC_KEY_PASSWORD
# - APPLE_ID
# - APPLE_ID_PASSWORD  
# - APPLE_TEAM_ID
# - CSC_LINK (base64 encoded certificate for Windows)
`;

  const envFile = path.join(__dirname, '..', '.env.code-signing');
  fs.writeFileSync(envFile, envTemplate);
  
  console.log(`✅ Environment template created: ${envFile}`);
  console.log('   Copy this file to .env and fill in your values');
}

// Validate certificates
function validateCertificates() {
  console.log('\n🔍 Validating certificates...\n');
  
  if (isWindows) {
    console.log('🪟 Windows Certificate Validation:');
    
    const certPath = process.env.CSC_LINK || 'build/certs/windows-cert.p12';
    
    if (fs.existsSync(certPath)) {
      try {
        // Try to list certificate contents (without showing sensitive data)
        execSync(`certutil -dump "${certPath}"`, { stdio: 'pipe' });
        console.log('   ✅ Certificate file is valid');
      } catch (error) {
        console.log('   ❌ Certificate file appears to be invalid or corrupted');
      }
    } else {
      console.log('   ⚠️  Certificate file not found, skipping validation');
    }
  }
  
  if (isMacOS) {
    console.log('\n🍎 macOS Certificate Validation:');
    
    try {
      const result = execSync('security find-identity -v -p codesigning', { encoding: 'utf8' });
      const lines = result.split('\n').filter(line => line.includes('Developer ID'));
      
      if (lines.length > 0) {
        console.log('   ✅ Found signing certificates:');
        lines.forEach(line => {
          const match = line.match(/"([^"]+)"/);
          if (match) {
            console.log(`      - ${match[1]}`);
          }
        });
      } else {
        console.log('   ❌ No Developer ID certificates found');
      }
    } catch (error) {
      console.log('   ❌ Error accessing keychain');
    }
  }
}

// Main execution
function main() {
  try {
    const missingRequirements = checkEnvironmentVariables();
    
    validateCertificates();
    
    generateEnvTemplate();
    
    console.log('\n📊 Setup Summary:');
    
    if (missingRequirements.length === 0) {
      console.log('✅ All code signing requirements appear to be configured!');
      console.log('\n🚀 You can now build signed releases:');
      console.log('   npm run build        # Build for current platform');
      console.log('   npm run build:all    # Build for all platforms');
      console.log('   npm run publish      # Build and publish to GitHub Releases');
    } else {
      console.log('⚠️  Missing requirements:');
      missingRequirements.forEach(req => {
        console.log(`   - ${req}`);
      });
      
      console.log('\n📚 Next steps:');
      console.log('1. Review the generated .env.code-signing template');
      console.log('2. Obtain required certificates from:');
      console.log('   - Windows: DigiCert, Sectigo, GlobalSign');
      console.log('   - macOS: Apple Developer Program');
      console.log('3. Set environment variables');
      console.log('4. Run this script again to verify setup');
      
      console.log('\n💡 For development builds without signing:');
      console.log('   export CSC_IDENTITY_AUTO_DISCOVERY=false');
      console.log('   npm run build');
    }
    
    console.log('\n📖 For detailed instructions, see: build/certs/README.md');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkEnvironmentVariables,
  generateEnvTemplate,
  validateCertificates
}; 