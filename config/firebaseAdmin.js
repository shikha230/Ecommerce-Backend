const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount),
});

module.exports = {
  auth: getAuth(),
};

// const admin = require("firebase-admin");
// const serviceAccount = require("./serviceAccountKey.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// module.exports = admin;
// const admin = require("firebase-admin");

// console.log(admin);

// process.exit();
// const admin = require("firebase-admin");
// const serviceAccount = require("./serviceAccountKey.json");

// console.log("Credential:", admin.credential);
// console.log("Cert:", admin.credential?.cert);

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// module.exports = admin;