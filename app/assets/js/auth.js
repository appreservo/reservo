/* Reservo demo - autenticazione reale via Firebase Authentication */
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, getDocs, addDoc, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAQNqwqsDX2bwNKjj1zt-PCfHH0R2KNjHM",
  authDomain: "appreservo-92b7c.firebaseapp.com",
  projectId: "appreservo-92b7c",
  storageBucket: "appreservo-92b7c.firebasestorage.app",
  messagingSenderId: "806875101057",
  appId: "1:806875101057:web:45ad76021eadca6c8e9a80",
};

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

function register(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

function logout() {
  return signOut(auth).then(() => { location.href = 'login.html'; });
}

function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

function createUserProfile(uid, profile) {
  return setDoc(doc(db, 'users', uid), profile);
}

async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

function upsertBusinessDirectory(uid, business) {
  return setDoc(doc(db, 'businesses', uid), { ...business, updatedAt: serverTimestamp() }, { merge: true });
}

async function getBusinessDirectory(uid) {
  const snap = await getDoc(doc(db, 'businesses', uid));
  return snap.exists() ? snap.data() : null;
}

async function getBusinessData(uid) {
  const snap = await getDoc(doc(db, 'businessData', uid));
  return snap.exists() ? snap.data() : null;
}

function saveBusinessData(uid, data) {
  return setDoc(doc(db, 'businessData', uid), data);
}

async function getPublicBusinessData(uid) {
  const snap = await getDoc(doc(db, 'businessPublic', uid));
  return snap.exists() ? snap.data() : null;
}

function savePublicBusinessData(uid, data) {
  return setDoc(doc(db, 'businessPublic', uid), data);
}

async function getBusinessBySlug(slug) {
  const snap = await getDocs(query(collection(db, 'businesses'), where('slug', '==', slug)));
  const matches = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(b => !b.status || b.status === 'active');
  return matches[0] || null;
}

/* prenotazioni dal sito pubblico (collezione top-level 'bookings') */
function createPublicBooking(booking) {
  return addDoc(collection(db, 'bookings'), booking);
}

async function getCustomerBookings(customerUid) {
  const snap = await getDocs(query(collection(db, 'bookings'), where('customerUid', '==', customerUid)));
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

async function getBusinessBookingsForDate(businessUid, date) {
  const snap = await getDocs(query(collection(db, 'bookings'), where('businessUid', '==', businessUid), where('date', '==', date)));
  return snap.docs.map(d => d.data()).filter(b => b.status === 'confirmed' || b.status === 'pending');
}

function updateBookingStatus(bookingId, status) {
  return setDoc(doc(db, 'bookings', bookingId), { status }, { merge: true });
}

async function getBusinessBookings(businessUid) {
  const snap = await getDocs(query(collection(db, 'bookings'), where('businessUid', '==', businessUid)));
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

function updateBooking(bookingId, payload) {
  return setDoc(doc(db, 'bookings', bookingId), payload, { merge: true });
}

function deleteBooking(bookingId) {
  return deleteDoc(doc(db, 'bookings', bookingId));
}

/* utente corrente (o null), senza richiedere login */
function whoAmI() {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => { unsub(); resolve(user); });
  });
}

async function listAllBusinesses() {
  const snap = await getDocs(collection(db, 'businesses'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/* recensioni (collezione top-level 'reviews') */
function createReview(review) {
  return addDoc(collection(db, 'reviews'), review);
}

async function getBusinessReviews(businessUid) {
  const snap = await getDocs(query(collection(db, 'reviews'), where('businessUid', '==', businessUid)));
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

async function getApprovedReviews(businessUid) {
  const snap = await getDocs(query(collection(db, 'reviews'), where('businessUid', '==', businessUid), where('status', '==', 'approved')));
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

/* tutte le recensioni di tutte le attività (pannello admin) */
async function listAllReviews() {
  const snap = await getDocs(collection(db, 'reviews'));
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

async function getCustomerReviews(customerUid) {
  const snap = await getDocs(query(collection(db, 'reviews'), where('customerUid', '==', customerUid)));
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

function updateReviewStatus(reviewId, status) {
  return setDoc(doc(db, 'reviews', reviewId), { status }, { merge: true });
}

function deleteReview(reviewId) {
  return deleteDoc(doc(db, 'reviews', reviewId));
}

/* comunicazioni broadcast (collezione top-level 'broadcasts', elaborate da una Cloud Function) */
function createBroadcast(broadcast) {
  return addDoc(collection(db, 'broadcasts'), { ...broadcast, created_at: serverTimestamp(), status: 'pending' });
}

async function getBusinessBroadcasts(businessUid) {
  const snap = await getDocs(query(collection(db, 'broadcasts'), where('businessUid', '==', businessUid)));
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

/* statistiche piattaforma per il pannello admin */
async function listGestoreUsers() {
  const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'gestore')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function countAllBookings() {
  const snap = await getDocs(collection(db, 'bookings'));
  return snap.size;
}

async function listBusinesses() {
  const list = await listAllBusinesses();
  return list.filter(b => !b.status || b.status === 'active');
}

async function listPendingAccounts() {
  const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'gestore'), where('status', '==', 'pending')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

function slugify(text) {
  return text
    .toString()
    .normalize('NFD').replace(new RegExp('[̀-ͯ]', 'g'), '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function approveAccount(uid) {
  const profile = await getUserProfile(uid);
  const bizSnap = await getDoc(doc(db, 'businesses', uid));
  const biz = bizSnap.exists() ? bizSnap.data() : {};

  const businessUpdate = { status: 'active' };
  if (!biz.business_name && profile?.businessName) businessUpdate.business_name = profile.businessName;
  if (!biz.type && profile?.businessType) businessUpdate.type = profile.businessType;
  if (!biz.email && profile?.email) businessUpdate.email = profile.email;
  if (!biz.slug && profile?.businessName) businessUpdate.slug = slugify(profile.businessName);

  return Promise.all([
    setDoc(doc(db, 'users', uid), { status: 'active' }, { merge: true }),
    setDoc(doc(db, 'businesses', uid), businessUpdate, { merge: true }),
  ]);
}

function rejectAccount(uid) {
  return Promise.all([
    setDoc(doc(db, 'users', uid), { status: 'rejected' }, { merge: true }),
    setDoc(doc(db, 'businesses', uid), { status: 'rejected' }, { merge: true }),
  ]);
}

/* pagina di destinazione in base a ruolo/stato dell'account */
function homeForProfile(profile) {
  if (!profile) return 'index.html';
  if (profile.role === 'admin') return 'admin.html';
  if (profile.role === 'cliente') return 'area.html';
  if (profile.role === 'gestore' && (profile.status === 'pending' || profile.status === 'rejected')) return 'pending.html';
  return 'index.html';
}

const GESTIONALE_PAGES = ['index.html', 'prenotazioni.html', 'clienti.html', 'statistiche.html', 'menu.html', 'eventi.html', 'impostazioni.html', 'recensioni.html', 'tavoli.html', 'comunicazioni.html'];

function requireAuth() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await getUserProfile(user.uid).catch(() => null);
        const current = location.pathname.split('/').pop() || 'index.html';
        const home = homeForProfile(profile);
        const allowed = (GESTIONALE_PAGES.includes(current) && home === 'index.html') || current === home;
        if (!allowed) { location.href = home; return; }

        document.documentElement.classList.remove('auth-pending');
        const displayName = (profile && profile.name) || user.email;
        document.querySelectorAll('.js-user-name').forEach(el => { el.textContent = displayName; });
        window.reservoAuth.currentUser = user;
        window.reservoAuth.currentProfile = profile;
        window.dispatchEvent(new Event('reservo-auth-ready'));
        resolve(user);
      } else {
        location.href = 'login.html';
      }
    });
  });
}

function requireAdmin() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) { location.href = 'login.html'; return; }
      const profile = await getUserProfile(user.uid).catch(() => null);
      if (!profile || profile.role !== 'admin') { location.href = homeForProfile(profile); return; }

      document.documentElement.classList.remove('auth-pending');
      const displayName = profile.name || user.email;
      document.querySelectorAll('.js-user-name').forEach(el => { el.textContent = displayName; });
      window.reservoAuth.currentUser = user;
      window.reservoAuth.currentProfile = profile;
      window.dispatchEvent(new Event('reservo-auth-ready'));
      resolve(user);
    });
  });
}

window.reservoAuth = {
  auth, db, login, register, logout, requireAuth, requireAdmin, resetPassword,
  createUserProfile, getUserProfile, upsertBusinessDirectory, getBusinessDirectory, listBusinesses, listAllBusinesses,
  getBusinessData, saveBusinessData, getPublicBusinessData, savePublicBusinessData, getBusinessBySlug,
  createPublicBooking, getCustomerBookings, getBusinessBookingsForDate, getBusinessBookings,
  updateBookingStatus, updateBooking, deleteBooking, whoAmI,
  homeForProfile, listPendingAccounts, approveAccount, rejectAccount,
  createReview, getBusinessReviews, getApprovedReviews, getCustomerReviews, listAllReviews, updateReviewStatus, deleteReview,
  createBroadcast, getBusinessBroadcasts, listGestoreUsers, countAllBookings,
  serverTimestamp,
};
export {
  auth, db, login, register, logout, requireAuth, requireAdmin, resetPassword,
  createUserProfile, getUserProfile, upsertBusinessDirectory, getBusinessDirectory, listBusinesses, listAllBusinesses,
  getBusinessData, saveBusinessData, getPublicBusinessData, savePublicBusinessData, getBusinessBySlug,
  createPublicBooking, getCustomerBookings, getBusinessBookingsForDate, getBusinessBookings,
  updateBookingStatus, updateBooking, deleteBooking, whoAmI,
  homeForProfile, listPendingAccounts, approveAccount, rejectAccount,
  createReview, getBusinessReviews, getApprovedReviews, getCustomerReviews, listAllReviews, updateReviewStatus, deleteReview,
  createBroadcast, getBusinessBroadcasts, listGestoreUsers, countAllBookings,
  serverTimestamp,
};
