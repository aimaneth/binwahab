const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const certificatesDir = path.join(__dirname, '..', 'certificates');
const opensslPath = 'C:\\Program Files (x86)\\OpenSSL-Win32\\bin\\openssl.exe';

// Create certificates directory if it doesn't exist
if (!fs.existsSync(certificatesDir)) {
  fs.mkdirSync(certificatesDir);
}

try {
  console.log('Generating SSL certificates for local development...');
  
  if (process.platform === 'win32') {
    // For Windows, use OpenSSL
    const openSSLConfig = `[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = localhost

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
IP.1 = 127.0.0.1`;

    const configPath = path.join(certificatesDir, 'openssl.cnf');
    fs.writeFileSync(configPath, openSSLConfig);

    // Generate private key and certificate using full path to OpenSSL
    execSync(`"${opensslPath}" req -x509 -nodes -days 365 -newkey rsa:2048 -keyout "${path.join(certificatesDir, 'localhost-key.pem')}" -out "${path.join(certificatesDir, 'localhost.pem')}" -config "${configPath}"`, { stdio: 'inherit' });
    
    // Clean up config file
    fs.unlinkSync(configPath);
  } else {
    // For macOS and Linux, use mkcert
    try {
      execSync('mkcert -version');
    } catch (error) {
      console.log('Installing mkcert...');
      if (process.platform === 'darwin') {
        execSync('brew install mkcert');
      } else {
        console.error('Please install mkcert manually for your platform');
        process.exit(1);
      }
    }
    execSync(`mkcert -key-file "${path.join(certificatesDir, 'localhost-key.pem')}" -cert-file "${path.join(certificatesDir, 'localhost.pem')}" localhost 127.0.0.1`);
  }
  
  console.log('SSL certificates generated successfully!');
} catch (error) {
  console.error('Error generating certificates:', error);
  process.exit(1);
} 