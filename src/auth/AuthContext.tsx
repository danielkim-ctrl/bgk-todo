import { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
};

type AuthContextType = {
  user: User | null;
  userProfile: UserProfile | null;
  authLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  saveDisplayName: (name: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showNameSetup, setShowNameSetup] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const pendingUser = useRef<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setUserProfile(null);
        setAuthLoading(false);
        return;
      }
      // 프로필 확인
      const profileRef = doc(db, 'users', firebaseUser.uid);
      const snap = await getDoc(profileRef);
      if (snap.exists() && snap.data().displayName) {
        setUser(firebaseUser);
        setUserProfile(snap.data() as UserProfile);
        setAuthLoading(false);
      } else {
        // 이름 설정 필요
        pendingUser.current = firebaseUser;
        setNameInput(firebaseUser.displayName || '');
        setShowNameSetup(true);
        setAuthLoading(false);
      }
    });
    return unsub;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  const saveDisplayName = async (name: string) => {
    const target = pendingUser.current || user;
    if (!target || !name.trim()) return;
    setNameSaving(true);
    const profile: UserProfile = {
      uid: target.uid,
      displayName: name.trim(),
      email: target.email || '',
      photoURL: target.photoURL || '',
    };
    await setDoc(doc(db, 'users', target.uid), profile);
    setUserProfile(profile);
    setUser(target);
    pendingUser.current = null;
    setShowNameSetup(false);
    setNameSaving(false);
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, authLoading, signInWithGoogle, signOut, saveDisplayName }}>
      {children}
      {showNameSetup && (
        <NameSetupModal
          defaultName={nameInput}
          saving={nameSaving}
          onSave={saveDisplayName}
        />
      )}
    </AuthContext.Provider>
  );
}

function NameSetupModal({ defaultName, saving, onSave }: { defaultName: string; saving: boolean; onSave: (n: string) => void }) {
  const [name, setName] = useState(defaultName);
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        background: '#fff', borderRadius: 18, padding: '36px 40px', width: 380,
        boxShadow: '0 20px 60px rgba(0,0,0,.18)', textAlign: 'center',
        fontFamily: "'Pretendard', system-ui, sans-serif",
      }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>👋</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#1a2332', marginBottom: 6 }}>
          팀에 오신 것을 환영합니다!
        </div>
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 28 }}>
          앱에서 사용할 이름을 설정해 주세요.<br />팀원에게 표시됩니다.
        </div>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onSave(name); }}
          placeholder="예) 김대윤"
          style={{
            width: '100%', padding: '12px 14px', border: '2px solid #2563eb',
            borderRadius: 10, fontSize: 15, outline: 'none', textAlign: 'center',
            fontFamily: "'Pretendard', system-ui, sans-serif", boxSizing: 'border-box',
            marginBottom: 16,
          }}
        />
        <button
          onClick={() => name.trim() && onSave(name)}
          disabled={!name.trim() || saving}
          style={{
            width: '100%', padding: '12px', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
            color: '#fff', border: 'none', borderRadius: 10, fontSize: 14,
            fontWeight: 700, cursor: name.trim() ? 'pointer' : 'not-allowed',
            opacity: !name.trim() || saving ? 0.6 : 1,
            fontFamily: "'Pretendard', system-ui, sans-serif",
          }}
        >
          {saving ? '저장 중...' : '시작하기'}
        </button>
      </div>
    </div>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
