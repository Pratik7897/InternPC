const fs = require('fs');

function updatePage(path) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(
    /onClick=\{\(\) => useAuthStore\.getState\(\)\.signInWithOAuth\('google'\)\}/,
    `onClick={async () => {
                const res = await useAuthStore.getState().signInWithOAuth('google')
                if (res && res.error) {
                  import('react-hot-toast').then(toast => toast.default.error(res.error))
                }
              }}`
  );
  content = content.replace(
    /onClick=\{\(\) => useAuthStore\.getState\(\)\.signInWithOAuth\('github'\)\}/,
    `onClick={async () => {
                const res = await useAuthStore.getState().signInWithOAuth('github')
                if (res && res.error) {
                  import('react-hot-toast').then(toast => toast.default.error(res.error))
                }
              }}`
  );
  fs.writeFileSync(path, content);
}

updatePage('src/pages/public/LoginPage.jsx');
updatePage('src/pages/public/RegisterPage.jsx');
