const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'routes');

const matrix = {
  donorRoutes: {
    get: "auth, authorize('Admin', 'Doctor', 'Nurse')",
    post: "auth, authorize('Admin', 'Nurse')",
    put: "auth, authorize('Admin', 'Nurse')",
    delete: "auth, authorize('Admin')"
  },
  receiverRoutes: {
    get: "auth, authorize('Admin', 'Doctor')",
    post: "auth, authorize('Admin', 'Doctor')",
    put: "auth, authorize('Admin', 'Doctor')",
    delete: "auth, authorize('Admin')"
  },
  bloodRequestRoutes: {
    get: "auth, authorize('Admin', 'Doctor', 'Technician')",
    post: "auth, authorize('Admin', 'Doctor', 'Technician')",
    put: "auth, authorize('Admin', 'Doctor', 'Technician')",
    delete: "auth, authorize('Admin')"
  },
  bloodBankRoutes: {
    get: "auth, authorize('Admin', 'Doctor', 'Nurse', 'Technician')",
    post: "auth, authorize('Admin')",
    put: "auth, authorize('Admin')",
    delete: "auth, authorize('Admin')"
  },
  bloodUnitRoutes: {
    get: "auth, authorize('Admin', 'Nurse', 'Technician')",
    post: "auth, authorize('Admin', 'Nurse', 'Technician')",
    put: "auth, authorize('Admin', 'Nurse', 'Technician')",
    delete: "auth, authorize('Admin')"
  },
  donationEventRoutes: {
    get: "auth, authorize('Admin', 'Nurse')",
    post: "auth, authorize('Admin', 'Nurse')",
    put: "auth, authorize('Admin', 'Nurse')",
    delete: "auth, authorize('Admin')"
  },
  bloodTestRoutes: {
    get: "auth, authorize('Admin', 'Nurse', 'Technician')",
    post: "auth, authorize('Admin', 'Nurse', 'Technician')",
    put: "auth, authorize('Admin', 'Nurse', 'Technician')",
    delete: "auth, authorize('Admin')"
  },
  staffRoutes: {
    get: "auth, authorize('Admin')",
    post: "auth, authorize('Admin')",
    put: "auth, authorize('Admin')",
    delete: "auth, authorize('Admin')"
  },
  dashboardRoutes: {
    get: "auth"
  }
};

for (const [filename, rules] of Object.entries(matrix)) {
  const filePath = path.join(routesDir, `${filename}.js`);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already injected
  if (content.includes('authMiddleware')) continue;
  
  // Inject imports
  const imports = `const auth = require('../middleware/authMiddleware');\nconst authorize = require('../middleware/roleMiddleware');\n`;
  content = content.replace(/(const router = express\.Router\(\);)/, `$1\n${imports}`);
  
  // Inject middleware into routes
  content = content.replace(/router\.get\('([^']+)',\s*(ctrl\.[a-zA-Z]+)\);/g, (match, routePath, handler) => {
    return `router.get('${routePath}', ${rules.get}, ${handler});`;
  });
  
  content = content.replace(/router\.post\('([^']+)',\s*(ctrl\.[a-zA-Z]+)\);/g, (match, routePath, handler) => {
    return `router.post('${routePath}', ${rules.post}, ${handler});`;
  });
  
  content = content.replace(/router\.put\('([^']+)',\s*(ctrl\.[a-zA-Z]+)\);/g, (match, routePath, handler) => {
    return `router.put('${routePath}', ${rules.put}, ${handler});`;
  });
  
  content = content.replace(/router\.delete\('([^']+)',\s*(ctrl\.[a-zA-Z]+)\);/g, (match, routePath, handler) => {
    return `router.delete('${routePath}', ${rules.delete}, ${handler});`;
  });

  fs.writeFileSync(filePath, content);
  console.log(`Injected RBAC into ${filename}.js`);
}
