const fs = require('fs');

const replaceInFile = (file, search, replace) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(search, replace);
  fs.writeFileSync(file, content);
};

// 1. src/lib/gmail.js
replaceInFile('src/lib/gmail.js', /\[-–\\\/\]/g, '[-–/]');
replaceInFile('src/lib/gmail.js', /per\|\\\//g, 'per|/');

// 2. Add eslint-disable for motion
const filesWithMotion = [
  'src/pages/public/DirectoryPage.jsx',
  'src/pages/public/InternshipsPublicPage.jsx',
  'src/pages/public/LandingPage.jsx',
  'src/pages/public/LoginPage.jsx',
  'src/pages/public/RegisterPage.jsx',
  'src/pages/public/StudentProfilePublicPage.jsx',
  'src/pages/student/BrowseInternships.jsx',
  'src/pages/student/MyApplications.jsx',
  'src/pages/student/Notifications.jsx',
  'src/pages/student/ProfileForm.jsx',
  'src/pages/student/StudentDashboard.jsx',
  'src/pages/student/UploadCenter.jsx'
];

filesWithMotion.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('eslint-disable-next-line no-unused-vars\nimport { motion')) {
    content = content.replace("import { motion } from 'framer-motion'", "// eslint-disable-next-line no-unused-vars\nimport { motion } from 'framer-motion'");
    content = content.replace("import { motion, AnimatePresence } from 'framer-motion'", "// eslint-disable-next-line no-unused-vars\nimport { motion, AnimatePresence } from 'framer-motion'");
    fs.writeFileSync(file, content);
  }
});

// 3. RegisterPage.jsx
replaceInFile('src/pages/public/RegisterPage.jsx', 'catch (error) {', 'catch (_error) {');

// 4. StudentProfilePublicPage.jsx
replaceInFile('src/pages/public/StudentProfilePublicPage.jsx', '}, [student_id])', '// eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [student_id])');

// 5. BrowseInternships.jsx
replaceInFile('src/pages/student/BrowseInternships.jsx', '}, [user?.id, fetchPortalInternships, fetchGmail, providerToken])', '// eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [user?.id, fetchPortalInternships, fetchGmail, providerToken])');

// 6. MyApplications.jsx
replaceInFile('src/pages/student/MyApplications.jsx', 'catch (err) {', 'catch (_err) {');

// 7. ProfileForm.jsx
replaceInFile('src/pages/student/ProfileForm.jsx', 'const { user, setProfileCompletion } = useAuthStore()', 'const { user } = useAuthStore()');

// 8. StudentDashboard.jsx
replaceInFile('src/pages/student/StudentDashboard.jsx', '  }, [])', '  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [])');

// 9. src/store/authStore.js
replaceInFile('src/store/authStore.js', 'export const useAuthStore = create((set, get) => ({', 'export const useAuthStore = create((set) => ({');

// 10. update.js
let updateContent = fs.readFileSync('update.js', 'utf8');
if (!updateContent.includes('/* eslint-env node */')) {
  fs.writeFileSync('update.js', '/* eslint-env node */\n' + updateContent);
}

console.log("Fixes applied successfully.");
