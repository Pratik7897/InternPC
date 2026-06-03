const fs = require('fs');

const replaceInFile = (file, search, replace) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(search, replace);
  fs.writeFileSync(file, content);
};

// 1. RegisterPage.jsx
replaceInFile('src/pages/public/RegisterPage.jsx', 'catch (error) {', 'catch {');

// 2. MyApplications.jsx
replaceInFile('src/pages/student/MyApplications.jsx', 'catch (err) {', 'catch {');

// 3. update.js
replaceInFile('update.js', '/* eslint-env node */', '/* global require */');
replaceInFile('update.js', '/* global require, __dirname */', '/* global require */'); // in case it was left

console.log("Third pass fixes applied.");
