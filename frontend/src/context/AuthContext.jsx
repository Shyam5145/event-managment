import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_USERS } from '../data/mockUsers';
import { isFirebaseConfigured, auth } from '../services/firebase';
import {
  signUp,
  signIn,
  signOutUser,
  resetPassword as firebaseResetPassword,
  subscribeToAuthChanges,
} from '../services/authService';
import { updateUserProfile, updateOrganizerProfile } from '../services/userService.js';

const AuthContext = createContext(null);

const STORAGE_KEY = 'campuspulse_auth_state';

export const AuthProvider = ({ children }) => {
  // Initialize authState from localStorage for instant offline demo availability
  const [authState, setAuthState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error reading auth state from localStorage', e);
    }
    // Default to Rahul Sharma (Student Demo)
    return {
      isAuthenticated: true,
      role: 'student',
      user: DEMO_USERS.student,
    };
  });

  const [authLoading, setAuthLoading] = useState(Boolean(isFirebaseConfigured));

  // Persist authState to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authState));
    } catch (e) {
      console.error('Error saving auth state to localStorage', e);
    }
  }, [authState]);

  // Persistent Firebase Authentication listener
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = subscribeToAuthChanges((authResult) => {
      if (authResult?.user) {
        const profile = authResult.profile || {};
        const role = authResult.role || profile.role || 'student';

        setAuthState({
          isAuthenticated: true,
          role,
          user: {
            id: authResult.user.uid,
            uid: authResult.user.uid,
            name: profile.name || authResult.user.displayName || 'Campus Student',
            email: authResult.user.email,
            role,
            department: profile.department || 'General',
            year: profile.year || '1st Year',
            degree: profile.degree || `${profile.department || 'Student'} (${profile.year || '1st Year'})`,
            studentId: profile.studentId || `CS-${authResult.user.uid.slice(0, 4)}`,
            photoURL: profile.photoURL || authResult.user.photoURL || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
            avatar: profile.photoURL || authResult.user.photoURL || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
            interests: profile.interests || [],
            bio: profile.bio || '',
            clubName: profile.clubName || profile.name,
            organization: profile.organization || profile.clubName,
            isFirebaseUser: true,
          },
        });
      } else {
        // If not authenticated in Firebase and not actively marked as a demo user session
        setAuthState((prev) => {
          if (prev?.user?.isFirebaseUser) {
            return {
              isAuthenticated: false,
              role: 'guest',
              user: null,
            };
          }
          return prev;
        });
      }

      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Demo Login Handler (For instant zero-setup demonstration)
  const loginAsDemo = (role = 'student') => {
    const selectedUser = role === 'organizer' ? DEMO_USERS.organizer : DEMO_USERS.student;
    const newState = {
      isAuthenticated: true,
      role,
      user: { ...selectedUser, isFirebaseUser: false },
    };
    setAuthState(newState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.error(e);
    }
    return role === 'organizer' ? '/organizer/dashboard' : '/student/dashboard';
  };

  // Sign In Handler (Firebase email/password or demo fallback)
  const login = async (roleOrEmail = 'student', customDataOrPassword = null) => {
    // If credentials look like email & password and Firebase is available, authenticate with Firebase
    if (
      isFirebaseConfigured &&
      typeof roleOrEmail === 'string' &&
      roleOrEmail.includes('@') &&
      typeof customDataOrPassword === 'string'
    ) {
      const { user: fbUser, profile } = await signIn(roleOrEmail, customDataOrPassword);
      const role = profile?.role || 'student';
      const updatedUser = {
        id: fbUser.uid,
        uid: fbUser.uid,
        name: profile?.name || fbUser.displayName || 'Campus User',
        email: fbUser.email,
        role,
        department: profile?.department || 'General',
        year: profile?.year || '1st Year',
        photoURL: profile?.photoURL || fbUser.photoURL || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
        avatar: profile?.photoURL || fbUser.photoURL || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
        interests: profile?.interests || [],
        bio: profile?.bio || '',
        isFirebaseUser: true,
      };

      const newState = {
        isAuthenticated: true,
        role,
        user: updatedUser,
      };

      setAuthState(newState);
      return { success: true, user: updatedUser, role };
    }

    // Demo / Mock Login Fallback
    const role = typeof roleOrEmail === 'string' && ['student', 'organizer', 'admin'].includes(roleOrEmail)
      ? roleOrEmail
      : 'student';
    const baseUser = DEMO_USERS[role] || DEMO_USERS.student;
    const userToSave = typeof customDataOrPassword === 'object' && customDataOrPassword !== null
      ? { ...baseUser, ...customDataOrPassword, isFirebaseUser: false }
      : { ...baseUser, isFirebaseUser: false };

    const newState = {
      isAuthenticated: true,
      role,
      user: userToSave,
    };

    setAuthState(newState);
    return { success: true, user: userToSave, role };
  };

  // Student Signup Handler
  const signupStudent = async (studentData) => {
    let firebaseUser = null;
    let userProfile = null;

    if (isFirebaseConfigured && studentData.password) {
      const res = await signUp(studentData.email, studentData.password, {
        name: studentData.name || studentData.fullName,
        department: studentData.department,
        year: studentData.year || studentData.academicYear,
        academicYear: studentData.academicYear || studentData.year,
        photoURL: studentData.photoURL || studentData.avatar,
      });
      firebaseUser = res.user;
      userProfile = res.profile;
    }

    const newUser = {
      id: firebaseUser ? firebaseUser.uid : `usr_${Date.now()}`,
      uid: firebaseUser ? firebaseUser.uid : `usr_${Date.now()}`,
      name: userProfile?.name || studentData.name || studentData.fullName,
      email: firebaseUser ? firebaseUser.email : (studentData.email || '').trim().toLowerCase(),
      role: 'student',
      department: userProfile?.department || studentData.department || 'General',
      year: userProfile?.year || studentData.year || studentData.academicYear || '1st Year',
      academicYear: userProfile?.academicYear || studentData.academicYear || studentData.year || '1st Year',
      degree: 'CSE Student',
      studentId: `CS-${Math.floor(1000 + Math.random() * 9000)}`,
      photoURL: userProfile?.photoURL || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      avatar: userProfile?.photoURL || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      interests: studentData.interests || [],
      bio: `${studentData.department || 'Student'} (${studentData.year || studentData.academicYear || '1st Year'})`,
      isFirebaseUser: Boolean(firebaseUser),
    };

    setAuthState({
      isAuthenticated: true,
      role: 'student',
      user: newUser,
    });

    return newUser;
  };

  // Organizer Onboarding Handler
  const onboardOrganizer = async (organizerData) => {
    const newOrganizer = {
      id: `org_${Date.now()}`,
      uid: `org_${Date.now()}`,
      name: organizerData.clubName,
      clubName: organizerData.clubName,
      organizerName: organizerData.organizerName,
      email: organizerData.email,
      role: 'organizer',
      category: organizerData.category,
      description: organizerData.description,
      avatar: organizerData.logo || 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      organization: organizerData.clubName,
      department: `${organizerData.category} Council`,
      title: 'Lead Club Organizer',
      bio: organizerData.description,
      isFirebaseUser: false,
    };

    setAuthState({
      isAuthenticated: true,
      role: 'organizer',
      user: newOrganizer,
    });
    return newOrganizer;
  };

  // Update Student Interests
  const updateStudentInterests = async (interests) => {
    setAuthState((prev) => {
      const updatedUser = prev.user ? { ...prev.user, interests } : null;
      return {
        ...prev,
        user: updatedUser,
      };
    });

    if (isFirebaseConfigured && authState.user?.uid && authState.user?.isFirebaseUser) {
      try {
        await updateUserProfile(authState.user.uid, { interests });
      } catch (e) {
        console.warn('Could not sync interests to Firestore:', e);
      }
    }
  };

  const switchRole = (newRole) => {
    if (newRole === 'guest') {
      logout();
      return;
    }
    const selectedUser = DEMO_USERS[newRole] || DEMO_USERS.student;
    setAuthState({
      isAuthenticated: true,
      role: newRole,
      user: { ...selectedUser, isFirebaseUser: false },
    });
  };

  const logout = async () => {
    if (isFirebaseConfigured) {
      try {
        await signOutUser();
      } catch (e) {
        console.warn('Error signing out of Firebase:', e);
      }
    }

    localStorage.removeItem(STORAGE_KEY);
    setAuthState({
      isAuthenticated: false,
      role: 'guest',
      user: null,
    });
  };

  const updateProfile = async (updatedFields) => {
    const { role, uid: _uid, email, createdAt, ...allowedUpdates } = updatedFields;

    setAuthState((prev) => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...allowedUpdates } : null,
    }));

    if (isFirebaseConfigured && authState.user?.uid && authState.user?.isFirebaseUser) {
      try {
        await updateUserProfile(authState.user.uid, allowedUpdates);
      } catch (e) {
        console.error('Could not update profile in Firestore:', e);
        throw e;
      }
    }
  };

  const updateOrganizerProfileData = async (updatedFields) => {
    const { role, uid: _uid, email, createdAt, ...allowedUpdates } = updatedFields;

    setAuthState((prev) => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...allowedUpdates } : null,
    }));

    if (isFirebaseConfigured && authState.user?.uid && authState.user?.isFirebaseUser) {
      try {
        await updateOrganizerProfile(authState.user.uid, allowedUpdates);
      } catch (e) {
        console.error('Could not update organizer profile in Firestore:', e);
        throw e;
      }
    }
  };

  const resetUserPassword = async (email) => {
    if (isFirebaseConfigured) {
      return await firebaseResetPassword(email);
    }
    return Promise.resolve();
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        authLoading,
        isFirebaseConfigured,
        login,
        loginAsDemo,
        signupStudent,
        onboardOrganizer,
        updateStudentInterests,
        logout,
        switchRole,
        updateProfile,
        updateOrganizerProfile: updateOrganizerProfileData,
        resetPassword: resetUserPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
