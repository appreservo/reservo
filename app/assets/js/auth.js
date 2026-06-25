/* Reservo demo - autenticazione reale via Firebase Authentication */
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, sendEmailVerification, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, getDocs, getCountFromServer, addDoc, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

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
  sessionStorage.removeItem('reservo_viewAs');
  return signInWithEmailAndPassword(auth, email, password);
}

async function register(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  sendEmailVerification(cred.user).catch(() => {});
  return cred;
}

function resendVerificationEmail() {
  if (!auth.currentUser) return Promise.resolve();
  return sendEmailVerification(auth.currentUser);
}

function loginWithGoogle() {
  sessionStorage.removeItem('reservo_viewAs');
  return signInWithPopup(auth, new GoogleAuthProvider());
}

function logout() {
  sessionStorage.removeItem('reservo_viewAs');
  return signOut(auth).then(() => { location.replace('login.html'); });
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

/* impedisce le scritture quando un admin sta visualizzando un'attività in sola lettura ("Visualizza come") */
function blockedInViewAs() {
  if (window.reservoAuth && window.reservoAuth.viewAsUid) {
    if (window.showToast) window.showToast('Modalità sola lettura: modifica non salvata', 'error');
    return true;
  }
  return false;
}

function upsertBusinessDirectory(uid, business) {
  if (blockedInViewAs()) return Promise.resolve();
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
  if (blockedInViewAs()) return Promise.resolve();
  return setDoc(doc(db, 'businessData', uid), data);
}

async function getPublicBusinessData(uid) {
  const snap = await getDoc(doc(db, 'businessPublic', uid));
  return snap.exists() ? snap.data() : null;
}

function savePublicBusinessData(uid, data) {
  if (blockedInViewAs()) return Promise.resolve();
  return setDoc(doc(db, 'businessPublic', uid), data);
}

async function getBusinessBySlug(slug) {
  const snap = await getDocs(query(collection(db, 'businesses'), where('slug', '==', slug)));
  const matches = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(b => !b.status || b.status === 'active');
  return matches[0] || null;
}

/* prenotazioni dal sito pubblico (collezione top-level 'bookings') */
function createPublicBooking(booking) {
  return addDoc(collection(db, 'bookings'), { ...booking, notified: false });
}

async function getBusinessBookingsForDate(businessUid, date) {
  const snap = await getDocs(query(collection(db, 'bookings'), where('businessUid', '==', businessUid), where('date', '==', date)));
  return snap.docs.map(d => d.data()).filter(b => b.status === 'confirmed' || b.status === 'pending');
}

function updateBookingStatus(bookingId, status) {
  if (blockedInViewAs()) return Promise.resolve();
  return setDoc(doc(db, 'bookings', bookingId), { status }, { merge: true });
}

async function getBusinessBookings(businessUid) {
  const snap = await getDocs(query(collection(db, 'bookings'), where('businessUid', '==', businessUid)));
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

function updateBooking(bookingId, payload) {
  if (blockedInViewAs()) return Promise.resolve();
  return setDoc(doc(db, 'bookings', bookingId), payload, { merge: true });
}

function deleteBooking(bookingId) {
  if (blockedInViewAs()) return Promise.resolve();
  return deleteDoc(doc(db, 'bookings', bookingId));
}

/* elimina tutte le prenotazioni del sito pubblico (collezione 'bookings') per un'attività */
async function deleteAllBusinessBookings(businessUid) {
  if (blockedInViewAs()) return;
  const snap = await getDocs(query(collection(db, 'bookings'), where('businessUid', '==', businessUid)));
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
}

/* elimina completamente il profilo di un gestore (pannello admin) */
async function deleteBusinessAccount(uid) {
  const reviewsSnap = await getDocs(query(collection(db, 'reviews'), where('businessUid', '==', uid)));
  await Promise.all([
    deleteAllBusinessBookings(uid),
    ...reviewsSnap.docs.map(d => deleteDoc(d.ref)),
    deleteDoc(doc(db, 'businessData', uid)).catch(() => {}),
    deleteDoc(doc(db, 'businessPublic', uid)).catch(() => {}),
    deleteDoc(doc(db, 'businesses', uid)).catch(() => {}),
  ]);
  await deleteDoc(doc(db, 'users', uid));
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

function updateReviewStatus(reviewId, status) {
  if (blockedInViewAs()) return Promise.resolve();
  return setDoc(doc(db, 'reviews', reviewId), { status }, { merge: true });
}

function deleteReview(reviewId) {
  if (blockedInViewAs()) return Promise.resolve();
  return deleteDoc(doc(db, 'reviews', reviewId));
}

/* comunicazioni broadcast (collezione top-level 'broadcasts', elaborate da una Cloud Function) */
function createBroadcast(broadcast) {
  if (blockedInViewAs()) return Promise.resolve();
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
  const snap = await getCountFromServer(collection(db, 'bookings'));
  return snap.data().count;
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

/* "Visualizza come" (pannello admin): l'uid dell'attività che l'admin sta visualizzando in sola lettura */
function getBusinessUid() {
  return window.reservoAuth.viewAsUid || (auth.currentUser && auth.currentUser.uid);
}

function isViewingAs() {
  return !!window.reservoAuth.viewAsUid;
}

/* pagina di destinazione in base a ruolo/stato dell'account */
function homeForProfile(profile) {
  if (!profile) return 'index.html';
  if (profile.role === 'admin') return 'admin.html';
  if (profile.role === 'gestore' && (profile.status === 'pending' || profile.status === 'rejected')) return 'pending.html';
  return 'index.html';
}

const GESTIONALE_PAGES = ['index.html', 'prenotazioni.html', 'clienti.html', 'statistiche.html', 'menu.html', 'eventi.html', 'impostazioni.html', 'tavoli.html', 'comunicazioni.html'];

function requireAuth() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await getUserProfile(user.uid).catch(() => null);
        const current = location.pathname.split('/').pop() || 'index.html';

        /* "Visualizza come" (sola lettura): un admin apre una pagina del gestionale con ?viewAs=<uid> */
        let viewAsUid = null;
        let viewedProfile = null;
        if (profile && profile.role === 'admin') {
          const params = new URLSearchParams(location.search);
          viewAsUid = params.get('viewAs') || sessionStorage.getItem('reservo_viewAs');
          if (viewAsUid) {
            viewedProfile = await getUserProfile(viewAsUid).catch(() => null);
            /* ignora valori non validi/residui (es. l'admin che visualizza se stesso) */
            if (viewAsUid === user.uid || !viewedProfile || viewedProfile.role !== 'gestore') {
              viewAsUid = null;
              viewedProfile = null;
              sessionStorage.removeItem('reservo_viewAs');
            } else {
              sessionStorage.setItem('reservo_viewAs', viewAsUid);
              history.replaceState(null, '', location.pathname + location.hash);
            }
          }
        }

        if (viewAsUid && GESTIONALE_PAGES.includes(current)) {
          document.documentElement.classList.remove('auth-pending');
          const displayName = (viewedProfile && viewedProfile.name) || (profile && profile.name) || user.email;
          document.querySelectorAll('.js-user-name').forEach(el => { el.textContent = displayName; });
          window.reservoAuth.currentUser = user;
          window.reservoAuth.currentProfile = viewedProfile || profile;
          window.reservoAuth.viewAsUid = viewAsUid;
          window.dispatchEvent(new Event('reservo-auth-ready'));
          resolve(user);
          return;
        }

        const home = homeForProfile(profile);
        const allowed = (GESTIONALE_PAGES.includes(current) && home === 'index.html') || current === home;
        if (!allowed) { location.replace(home); return; }

        document.documentElement.classList.remove('auth-pending');
        const displayName = (profile && profile.name) || user.email;
        document.querySelectorAll('.js-user-name').forEach(el => { el.textContent = displayName; });
        window.reservoAuth.currentUser = user;
        window.reservoAuth.currentProfile = profile;
        window.dispatchEvent(new Event('reservo-auth-ready'));
        resolve(user);
      } else {
        location.replace('login.html');
      }
    });
  });
}

function requireAdmin() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) { location.replace('login.html'); return; }
      const profile = await getUserProfile(user.uid).catch(() => null);
      if (!profile || profile.role !== 'admin') { location.replace(homeForProfile(profile)); return; }

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
  auth, db, login, register, loginWithGoogle, logout, requireAuth, requireAdmin, resetPassword,
  createUserProfile, getUserProfile, upsertBusinessDirectory, getBusinessDirectory, listBusinesses, listAllBusinesses,
  getBusinessData, saveBusinessData, getPublicBusinessData, savePublicBusinessData, getBusinessBySlug,
  createPublicBooking, getBusinessBookingsForDate, getBusinessBookings,
  updateBookingStatus, updateBooking, deleteBooking, deleteAllBusinessBookings, deleteBusinessAccount, whoAmI,
  homeForProfile, listPendingAccounts, approveAccount, rejectAccount,
  createReview, getBusinessReviews, getApprovedReviews, listAllReviews, updateReviewStatus, deleteReview,
  createBroadcast, getBusinessBroadcasts, listGestoreUsers, countAllBookings,
  getBusinessUid, isViewingAs, resendVerificationEmail,
  serverTimestamp,
};
export {
  auth, db, login, register, loginWithGoogle, logout, requireAuth, requireAdmin, resetPassword,
  createUserProfile, getUserProfile, upsertBusinessDirectory, getBusinessDirectory, listBusinesses, listAllBusinesses,
  getBusinessData, saveBusinessData, getPublicBusinessData, savePublicBusinessData, getBusinessBySlug,
  createPublicBooking, getBusinessBookingsForDate, getBusinessBookings,
  updateBookingStatus, updateBooking, deleteBooking, deleteAllBusinessBookings, deleteBusinessAccount, whoAmI,
  homeForProfile, listPendingAccounts, approveAccount, rejectAccount,
  createReview, getBusinessReviews, getApprovedReviews, listAllReviews, updateReviewStatus, deleteReview,
  createBroadcast, getBusinessBroadcasts, listGestoreUsers, countAllBookings,
  getBusinessUid, isViewingAs, resendVerificationEmail,
  serverTimestamp,
};
