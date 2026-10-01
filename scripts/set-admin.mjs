/**
 * J3A STORE - Set Admin Script
 *
 * Usage:
 *   node scripts/set-admin.mjs user@example.com
 *   node scripts/set-admin.mjs <USER_UID>
 *
 * This script securely promotes an existing user in Firestore to role: 'admin'
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Error: Firebase environment variables not set in .env.local');
  process.exit(1);
}

const targetIdentifier = process.argv[2];

if (!targetIdentifier) {
  console.log(`
===================================================
  J3A STORE - Set Admin Utility
===================================================
Usage:
  node scripts/set-admin.mjs <EMAIL_OR_UID>

Example:
  node scripts/set-admin.mjs admin@j3astore.com
  node scripts/set-admin.mjs abc123def456
===================================================
  `);
  process.exit(0);
}

async function run() {
  console.log(`🔍 Connecting to Firestore (${firebaseConfig.projectId})...`);
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  try {
    let targetDocId = null;

    // Check if it's an email
    if (targetIdentifier.includes('@')) {
      const q = query(
        collection(db, 'users'),
        where('email', '==', targetIdentifier.trim())
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        console.error(`❌ User with email "${targetIdentifier}" not found in Firestore.`);
        console.error(`💡 Tip: Please sign up / register with this email in the web app first, then run this command.`);
        process.exit(1);
      }
      targetDocId = snap.docs[0].id;
    } else {
      // Treat as UID
      const docRef = doc(db, 'users', targetIdentifier.trim());
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        console.error(`❌ User with UID "${targetIdentifier}" not found.`);
        process.exit(1);
      }
      targetDocId = docSnap.id;
    }

    // Update role
    const userRef = doc(db, 'users', targetDocId);
    await updateDoc(userRef, {
      role: 'admin',
      tier: 'VIP',
      updatedAt: new Date().toISOString(),
    });

    console.log(`✅ Success! User [${targetIdentifier}] (Doc ID: ${targetDocId}) is now an ADMIN.`);
    console.log(`🎉 You can now log into J3A STORE and access /admin`);
  } catch (error) {
    console.error('❌ Failed to update user role:', error);
  }
}

run();
