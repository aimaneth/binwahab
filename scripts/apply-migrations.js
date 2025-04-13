const { execSync } = require('child_process');
const path = require('path');

console.log('Applying database migrations...');

try {
  // Run Prisma migrate deploy
  execSync('npx prisma migrate deploy', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  
  console.log('Migrations applied successfully!');
} catch (error) {
  console.error('Error applying migrations:', error.message);
  process.exit(1);
} 