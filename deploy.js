const { execSync } = require('child_process');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log(`
====================================================
       HelpMate AI Deployment Assistant
====================================================
`);

const deployOptions = [
  { name: 'Render.com', value: 'render' },
  { name: 'Heroku', value: 'heroku' },
  { name: 'GitHub (for manual deployment)', value: 'github' },
];

console.log('Available deployment options:');
deployOptions.forEach((option, index) => {
  console.log(`${index + 1}. ${option.name}`);
});

rl.question('\nSelect a deployment option (number): ', async (answer) => {
  const option = deployOptions[parseInt(answer) - 1];
  
  if (!option) {
    console.log('Invalid option selected. Exiting...');
    rl.close();
    return;
  }
  
  console.log(`\nPreparing for deployment to ${option.name}...`);
  
  try {
    // Common steps for all deployment options
    console.log('\n1. Installing dependencies...');
    execSync('npm run install-all', { stdio: 'inherit' });
    
    console.log('\n2. Building client application...');
    execSync('npm run build', { stdio: 'inherit' });
    
    switch (option.value) {
      case 'render':
        console.log('\n=== Deployment to Render.com ===');
        console.log(`
To deploy to Render.com:
1. Create a new account on Render.com
2. Connect your GitHub repository
3. Create a new Web Service and select your repository
4. Use the following settings:
   - Build Command: npm run install-all && npm run build
   - Start Command: npm start
5. Add the environment variables from your .env file
6. Click 'Create Web Service'
`);
        break;
        
      case 'heroku':
        console.log('\n=== Deployment to Heroku ===');
        console.log('\nChecking for Heroku CLI...');
        
        try {
          execSync('heroku --version', { stdio: 'pipe' });
          console.log('Heroku CLI found. Continuing deployment...');
          
          rl.question('\nEnter your Heroku app name: ', (appName) => {
            try {
              console.log(`\nCreating Heroku app: ${appName}...`);
              execSync(`heroku create ${appName}`, { stdio: 'inherit' });
              
              console.log('\nSetting environment variables...');
              const envFile = path.join(__dirname, 'server', '.env');
              if (fs.existsSync(envFile)) {
                const envContent = fs.readFileSync(envFile, 'utf8');
                const envVars = envContent.split('\n');
                
                envVars.forEach(line => {
                  const [key, value] = line.split('=');
                  if (key && value) {
                    const trimmedKey = key.trim();
                    const trimmedValue = value.trim();
                    if (trimmedKey && trimmedValue) {
                      execSync(`heroku config:set ${trimmedKey}=${trimmedValue} --app ${appName}`, { stdio: 'pipe' });
                      console.log(`Set ${trimmedKey}`);
                    }
                  }
                });
              }
              
              console.log('\nDeploying to Heroku...');
              execSync('git push heroku main', { stdio: 'inherit' });
              
              console.log(`\nDeployment complete! Your app is live at: https://${appName}.herokuapp.com`);
              rl.close();
            } catch (error) {
              console.error('Error deploying to Heroku:', error.message);
              rl.close();
            }
          });
          return;
        } catch (error) {
          console.log('Heroku CLI not found. Please install it:');
          console.log('npm install -g heroku');
          rl.close();
          return;
        }
        
      case 'github':
        console.log('\n=== Pushing to GitHub ===');
        rl.question('\nEnter your GitHub repository URL: ', (repoUrl) => {
          try {
            console.log('\nAdding remote repository...');
            execSync(`git remote add origin ${repoUrl}`, { stdio: 'inherit' });
            
            console.log('\nCommitting changes...');
            execSync('git add .', { stdio: 'inherit' });
            execSync('git commit -m "Prepare for deployment"', { stdio: 'inherit' });
            
            console.log('\nPushing to GitHub...');
            execSync('git push -u origin main', { stdio: 'inherit' });
            
            console.log('\nCode successfully pushed to GitHub!');
            console.log(`\nNow you can manually deploy from your repository at: ${repoUrl}`);
            rl.close();
          } catch (error) {
            console.error('Error pushing to GitHub:', error.message);
            rl.close();
          }
        });
        return;
    }
    
    rl.close();
  } catch (error) {
    console.error('Deployment preparation error:', error.message);
    rl.close();
  }
});