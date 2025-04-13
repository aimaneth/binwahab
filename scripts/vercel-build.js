const { execSync } = require('child_process');
const path = require('path');

console.log('Starting Vercel build process...');

try {
  // Generate Prisma client
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  
  // Build Next.js application
  console.log('Building Next.js application...');
  execSync('next build', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  
  console.log('Vercel build completed successfully!');
} catch (error) {
  console.error('Error during Vercel build:', error.message);
  process.exit(1);
} 