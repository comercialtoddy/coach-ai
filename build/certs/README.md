# Code Signing Certificates Guide

This directory contains configuration for code signing certificates used to sign Coach-AI binaries for distribution.

## Windows Code Signing

### Certificate Requirements
- **Extended Validation (EV) Code Signing Certificate** (recommended for immediate trust)
- **Standard Code Signing Certificate** (requires reputation building)

### Obtaining a Windows Certificate
1. Purchase from a Certificate Authority (CA):
   - DigiCert (recommended)
   - Sectigo (Comodo)
   - GlobalSign
   - Entrust

2. Certificate formats:
   - `.p12` or `.pfx` file (PKCS#12 format)
   - Hardware token (for EV certificates)

### Configuration
1. Place your certificate file as `windows-cert.p12` in this directory
2. Set environment variables:
   ```bash
   # Certificate password
   export CSC_KEY_PASSWORD="your-certificate-password"
   
   # Alternative: Use Windows environment variables
   set CSC_KEY_PASSWORD=your-certificate-password
   ```

### Environment Variables for CI/CD
```bash
# Certificate file path (optional, defaults to build/certs/windows-cert.p12)
CSC_LINK=build/certs/windows-cert.p12

# Certificate password (required)
CSC_KEY_PASSWORD=your-certificate-password

# For base64 encoded certificate in CI
CSC_LINK=data:application/x-pkcs12;base64,<base64-encoded-certificate>
```

## macOS Code Signing

### Certificate Requirements
- **Apple Developer Account** (paid membership)
- **Developer ID Application Certificate**
- **Developer ID Installer Certificate** (for .pkg installers)

### Obtaining macOS Certificates
1. Join Apple Developer Program ($99/year)
2. Generate certificates in Apple Developer Portal
3. Download and install in Keychain Access

### Required Certificates
- Developer ID Application: Coach-AI Team
- Developer ID Installer: Coach-AI Team (if using .pkg)

### Configuration
Set environment variables:
```bash
# Apple ID for notarization
APPLE_ID=your-apple-id@example.com

# App-specific password for notarization
APPLE_ID_PASSWORD=app-specific-password

# Team ID (found in Apple Developer Portal)
APPLE_TEAM_ID=YOUR_TEAM_ID

# Certificate identity (must match exactly)
CSC_NAME="Developer ID Application: Coach-AI Team"
```

### Notarization Setup
1. Generate app-specific password in Apple ID settings
2. Set environment variables for notarization
3. Ensure Xcode command line tools are installed

## Security Best Practices

### Certificate Storage
- **Never commit certificates to version control**
- Use environment variables for passwords
- Store certificates securely (encrypted storage, hardware tokens)
- Rotate certificates before expiration

### CI/CD Integration
```yaml
# GitHub Actions example
env:
  CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
  APPLE_ID: ${{ secrets.APPLE_ID }}
  APPLE_ID_PASSWORD: ${{ secrets.APPLE_ID_PASSWORD }}
  APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
  CSC_NAME: "Developer ID Application: Coach-AI Team"
```

### Certificate Validation
Before building:
```bash
# Windows: Verify certificate
certutil -dump windows-cert.p12

# macOS: List available certificates
security find-identity -v -p codesigning
```

## Build Commands

### With Code Signing
```bash
# Build and sign for all platforms
npm run build

# Build and sign for specific platform
npm run build:win    # Windows with code signing
npm run build:mac    # macOS with code signing
npm run build:linux  # Linux (no code signing needed)

# Build and publish (requires signing)
npm run publish
```

### Without Code Signing (Development)
```bash
# Disable code signing for development builds
export CSC_IDENTITY_AUTO_DISCOVERY=false
npm run build
```

## Troubleshooting

### Windows Issues
- **Certificate not found**: Ensure certificate path is correct
- **Wrong password**: Verify `CSC_KEY_PASSWORD` environment variable
- **Timestamp server issues**: Check internet connection and firewall

### macOS Issues
- **Certificate not found**: Run `security find-identity -v -p codesigning`
- **Notarization fails**: Verify Apple ID credentials and team ID
- **Gatekeeper issues**: Ensure proper entitlements are configured

### Common Solutions
1. Clear electron-builder cache: `npx electron-builder install-app-deps`
2. Verify certificate validity and expiration dates
3. Check environment variables are properly set
4. Ensure certificates are installed in correct keychain (macOS)

## File Structure
```
build/certs/
├── README.md                           # This guide
├── windows-cert.p12                   # Windows certificate (not in repo)
├── entitlements.mac.plist             # macOS entitlements
└── entitlements.mac.inherit.plist     # macOS inherited entitlements
```

## Resources
- [Electron Builder Code Signing](https://www.electron.build/code-signing)
- [Apple Code Signing Guide](https://developer.apple.com/support/code-signing/)
- [Windows Code Signing Best Practices](https://docs.microsoft.com/en-us/windows/win32/seccrypto/cryptography-tools)
- [DigiCert Code Signing Guide](https://docs.digicert.com/en/software-trust-manager/ci-cd-integrations.html) 