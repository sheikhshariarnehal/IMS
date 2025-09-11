import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SafeStorage from '../utils/safeStorage';
import { supabase, setUserContext, clearUserContext, testAuth, User } from '../lib/supabase';
import { useLocations } from './LocationContext';
import { logStorageDebugInfo } from '../utils/storageDebug';

// Check if we're in demo mode or web environment
const isDemoMode = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';
const isWeb = typeof window !== 'undefined';

// Use safe storage for web environment to handle localStorage issues
const storage = isWeb ? SafeStorage : AsyncStorage;

// User permissions interface
interface UserPermissions {
  dashboard: boolean;
  products: {
    view: boolean;
    add: boolean;
    edit: boolean;
    delete: boolean;
  };
  inventory: {
    view: boolean;
    add: boolean;
    edit: boolean;
    delete: boolean;
    transfer: boolean;
  };
  sales: {
    view: boolean;
    add: boolean;
    edit: boolean;
    delete: boolean;
    invoice: boolean;
  };
  customers: {
    view: boolean;
    add: boolean;
    edit: boolean;
    delete: boolean;
  };
  suppliers: {
    view: boolean;
    add: boolean;
    edit: boolean;
    delete: boolean;
  };
  categories: {
    view: boolean;
    add: boolean;
    edit: boolean;
    delete: boolean;
  };
  samples: {
    view: boolean;
    add: boolean;
    edit: boolean;
    delete: boolean;
  };
  reports: {
    view: boolean;
    export: boolean;
  };
  notifications: {
    view: boolean;
    manage: boolean;
  };
  activityLogs: {
    view: boolean;
  };
  settings: {
    view: boolean;
    userManagement: boolean;
    systemSettings: boolean;
  };
  help: {
    view: boolean;
  };
}

// User session interface
interface UserSession {
  id: number;
  email: string;
  name: string;
  role: string;
  permissions: Record<string, any>;
  assignedLocations?: number[];
  assigned_location_id?: number;
  loginTime: string;
}

// Login credentials interface
interface LoginCredentials {
  email: string;
  password: string;
}

// Auth context interface
interface AuthContextType {
  user: UserSession | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  hasPermission: (module: string, action?: string, locationId?: string) => boolean;
  isRole: (role: string) => boolean;
  canAccessLocation: (locationId: string | number) => boolean;
  getAccessibleLocations: () => string[];
  // Debug functions (only available in development)
  debugStorage?: () => Promise<void>;
  testPersistence?: () => Promise<boolean>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Password hashing function (same as in formService.ts)
const hashPassword = async (password: string): Promise<string> => {
  try {
    // Try to use expo-crypto for React Native
    const { digestStringAsync, CryptoDigestAlgorithm } = await import('expo-crypto');
    const saltedPassword = password + 'salt_key_2024';
    const hash = await digestStringAsync(CryptoDigestAlgorithm.SHA256, saltedPassword);
    return hash;
  } catch (error) {
    console.log('Expo crypto not available, trying web crypto...');

    // Check if we're in a web environment
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'salt_key_2024');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (webError) {
        console.warn('Web Crypto API failed, falling back to simple hash');
      }
    }

    // Fallback for environments without crypto support
    let hash = 0;
    const saltedPassword = password + 'salt_key_2024';

    for (let i = 0; i < saltedPassword.length; i++) {
      const char = saltedPassword.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return Math.abs(hash).toString(16);
  }
};

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isWarehouse, isShowroom } = useLocations();

  // Load user session on app start
  useEffect(() => {
    // Add storage debugging in development
    if (__DEV__) {
      logStorageDebugInfo();
    }
    loadUserSession();
  }, []);

  const loadUserSession = async () => {
    console.log('🔄 Starting session restoration...');

    try {
      // Add a small delay to ensure storage is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('📱 Attempting to retrieve stored session...');
      const sessionData = await storage.getItem('userSession');

      if (!sessionData) {
        console.log('📭 No stored session found');
        setUser(null);
        return;
      }

      console.log('📦 Found stored session data, parsing...');
      let userSession: UserSession;

      try {
        userSession = JSON.parse(sessionData);
        console.log('✅ Session data parsed successfully for user:', userSession.email);
      } catch (parseError) {
        console.error('❌ Failed to parse session data:', parseError);
        await storage.removeItem('userSession');
        setUser(null);
        return;
      }

      // Check session expiration (24 hours)
      const sessionAge = Date.now() - new Date(userSession.loginTime).getTime();
      const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      if (sessionAge > sessionTimeout) {
        console.log('❌ Session expired - clearing stored session');
        await storage.removeItem('userSession');
        setUser(null);
        return;
      }

      console.log('⏰ Session is still valid (age:', Math.round(sessionAge / (1000 * 60)), 'minutes)');

      // Try to restore session immediately, then validate in background
      console.log('🚀 Restoring user session immediately...');
      setUser(userSession);

      // Set user context for RLS
      try {
        await setUserContext(userSession.id);
        console.log('✅ User context set for RLS');
      } catch (contextError) {
        console.error('⚠️ Failed to set user context:', contextError);
      }

      // Validate session in background (don't block user experience)
      console.log('🔄 Validating session in background...');

      // Use a timeout to prevent hanging on network issues
      const validationPromise = Promise.race([
        testAuth(userSession.email),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Validation timeout')), 10000)
        )
      ]);

      try {
        const validationResult = await validationPromise as any;

        if (validationResult.error || !validationResult.data) {
          console.log('❌ Background session validation failed - user not found or inactive');
          // Only clear session if validation definitively fails (not on network errors)
          if (validationResult.error && !validationResult.error.message?.includes('network')) {
            await storage.removeItem('userSession');
            setUser(null);
          }
        } else {
          console.log('✅ Background session validation successful');
          // Update user data if it has changed
          const freshUserData = validationResult.data;
          if (JSON.stringify(userSession.permissions) !== JSON.stringify(freshUserData.permissions)) {
            console.log('🔄 User permissions updated, refreshing session...');
            const updatedSession = {
              ...userSession,
              permissions: freshUserData.permissions || {}
            };
            await storage.setItem('userSession', JSON.stringify(updatedSession));
            setUser(updatedSession);
          }
        }
      } catch (validationError: any) {
        console.warn('⚠️ Session validation failed (network issue?):', validationError.message);
        // Don't clear session on network errors - user can still use the app offline
        if (!validationError.message?.includes('timeout') && !validationError.message?.includes('network')) {
          console.log('❌ Non-network validation error, clearing session');
          await storage.removeItem('userSession');
          setUser(null);
        }
      }

    } catch (error) {
      console.error('❌ Critical error loading user session:', error);

      // Only clear session if it's a parsing/storage error, not network
      if (error instanceof SyntaxError || (error as any)?.message?.includes('storage')) {
        console.log('🧹 Clearing potentially corrupted session');
        try {
          await storage.removeItem('userSession');
        } catch (clearError) {
          console.error('❌ Failed to clear corrupted session:', clearError);
        }
      }

      setUser(null);
    } finally {
      console.log('✅ Session restoration process completed');
      setIsLoading(false);
    }
  };

  // Admin permission logic based on location types and access rules
  const hasAdminPermission = useCallback((module: string, action: string, locationId?: string): boolean => {
    console.log('🔍 Admin Permission Check:', {
      module,
      action,
      locationId,
      userRole: user?.role,
      adminLocations: user?.permissions?.locations,
      fullPermissions: user?.permissions
    });

    if (!user || user.role !== 'admin') {
      console.log('❌ Not admin user');
      return false;
    }

    // Get admin's assigned locations from permissions
    const adminLocations = user.permissions?.locations || [];
    if (adminLocations.length === 0) {
      console.log('❌ No admin locations assigned - this might be due to old session data');
      console.log('💡 Try logging out and logging back in to refresh permissions');
      return false;
    }

    // If no specific location is provided, check if admin has any relevant location access
    if (!locationId) {
      const result = checkAdminModuleAccess(module, action, adminLocations);
      console.log('✅ Admin permission result (no location):', result);
      return result;
    }

    // Convert locationId to number for comparison
    const locationIdNum = typeof locationId === 'string' ? parseInt(locationId) : locationId;

    // Check if admin has access to this specific location
    if (!adminLocations.includes(locationIdNum)) {
      console.log('❌ Admin does not have access to location:', locationIdNum);
      return false;
    }

    // Check module and action permissions based on location type and admin rules
    const result = checkAdminModuleAccess(module, action, adminLocations, locationIdNum);
    console.log('✅ Admin permission result (with location):', result);
    return result;
  }, [user]);

  // Helper function to check admin module access based on business rules
  const checkAdminModuleAccess = useCallback((module: string, action: string, adminLocations: number[], specificLocationId?: number): boolean => {
    // Admin access rules based on your requirements:

    // 1. Admins CANNOT delete anything
    if (action === 'delete' || action === 'remove') return false;

    // 2. Admins CANNOT create new admins or manage higher-level roles
    if (module === 'users' && (action === 'add' || action === 'create')) return false;

    // 3. Module-specific permissions based on location types
    switch (module.toLowerCase()) {
      case 'products':
        // Can add products only if they have warehouse access
        if (action === 'add' || action === 'create') {
          return hasWarehouseAccess(adminLocations, specificLocationId);
        }
        // Can view/edit products in any assigned location
        return action === 'view' || action === 'edit';

      case 'inventory':
        // Can transfer products only if they have warehouse access
        if (action === 'transfer') {
          return hasWarehouseAccess(adminLocations, specificLocationId);
        }
        // Can view/add/edit inventory in any assigned location
        return ['view', 'add', 'edit'].includes(action);

      case 'sales':
        // Can sell products only if they have showroom access
        if (action === 'add' || action === 'create') {
          return hasShowroomAccess(adminLocations, specificLocationId);
        }
        // Can view/edit sales in any assigned location
        return action === 'view' || action === 'edit';

      case 'customers':
      case 'suppliers':
      case 'categories':
        // Can add/view/edit customers, suppliers, and categories
        return ['view', 'add', 'create', 'edit'].includes(action);

      case 'reports':
        // Can view and export reports for their assigned locations
        return action === 'view' || action === 'export';

      case 'dashboard':
        // Can view dashboard
        return action === 'view';

      default:
        // For other modules, allow view and edit but not add/delete
        return action === 'view' || action === 'edit';
    }
  }, []);

  // Helper function to check if admin has warehouse access
  const hasWarehouseAccess = useCallback((adminLocations: number[], specificLocationId?: number): boolean => {
    console.log('🏭 Checking warehouse access:', { adminLocations, specificLocationId });
    console.log('🏭 isWarehouse function available:', typeof isWarehouse);

    // Known warehouse IDs based on database data (locations with type 'warehouse')
    const knownWarehouses = [1, 3]; // Main Warehouse, Chittagong Warehouse

    if (specificLocationId) {
      const hasLocation = adminLocations.includes(specificLocationId);
      // Try LocationContext first, fallback to hardcoded list
      let isWarehouseLoc = isWarehouse(specificLocationId);
      if (!isWarehouseLoc) {
        isWarehouseLoc = knownWarehouses.includes(specificLocationId);
        console.log(`🏭 Using fallback warehouse check for ${specificLocationId}:`, isWarehouseLoc);
      }
      console.log('🏭 Specific location check:', { hasLocation, isWarehouseLoc });
      return hasLocation && isWarehouseLoc;
    }

    // Check if admin has access to any warehouse
    const warehouseAccess = adminLocations.some(locationId => {
      // Try LocationContext first, fallback to hardcoded list
      let isWh = isWarehouse(locationId);
      if (!isWh) {
        isWh = knownWarehouses.includes(locationId);
        console.log(`🏭 Using fallback warehouse check for ${locationId}:`, isWh);
      }
      console.log(`🏭 Location ${locationId} is warehouse:`, isWh);
      return isWh;
    });
    console.log('🏭 Any warehouse access:', warehouseAccess);
    return warehouseAccess;
  }, [isWarehouse]);

  // Helper function to check if admin has showroom access
  const hasShowroomAccess = useCallback((adminLocations: number[], specificLocationId?: number): boolean => {
    console.log('🏪 Checking showroom access:', { adminLocations, specificLocationId });

    // Fallback: Known showroom IDs based on database data
    const knownShowrooms = [2]; // Gulshan Showroom

    if (specificLocationId) {
      const hasLocation = adminLocations.includes(specificLocationId);
      // Try LocationContext first, fallback to hardcoded list
      let isShowroomLoc = isShowroom(specificLocationId);
      if (!isShowroomLoc) {
        isShowroomLoc = knownShowrooms.includes(specificLocationId);
        console.log(`🏪 Using fallback showroom check for ${specificLocationId}:`, isShowroomLoc);
      }
      console.log('🏪 Specific location check:', { hasLocation, isShowroomLoc });
      return hasLocation && isShowroomLoc;
    }

    // Check if admin has access to any showroom
    const showroomAccess = adminLocations.some(locationId => {
      // Try LocationContext first, fallback to hardcoded list
      let isSh = isShowroom(locationId);
      if (!isSh) {
        isSh = knownShowrooms.includes(locationId);
        console.log(`🏪 Using fallback showroom check for ${locationId}:`, isSh);
      }
      console.log(`🏪 Location ${locationId} is showroom:`, isSh);
      return isSh;
    });
    console.log('🏪 Any showroom access:', showroomAccess);
    return showroomAccess;
  }, [isShowroom]);

  // Generate default permissions for Admin role
  const generateAdminPermissions = useCallback((): UserPermissions => {
    return {
      dashboard: true,
      products: {
        view: true,
        add: true, // Can add products if they have warehouse access
        edit: true,
        delete: false, // Admins cannot delete anything
      },
      inventory: {
        view: true,
        add: true,
        edit: true,
        delete: false, // Admins cannot delete anything
        transfer: true, // Can transfer if they have warehouse access
      },
      sales: {
        view: true,
        add: true, // Can sell if they have showroom access
        edit: true,
        delete: false, // Admins cannot delete anything
        invoice: true,
      },
      customers: {
        view: true,
        add: true,
        edit: true,
        delete: false, // Admins cannot delete anything
      },
      suppliers: {
        view: true,
        add: true,
        edit: true,
        delete: false, // Admins cannot delete anything
      },
      categories: {
        view: true,
        add: true,
        edit: true,
        delete: false, // Admins cannot delete anything
      },
      samples: {
        view: true,
        add: true,
        edit: true,
        delete: false, // Admins cannot delete anything
      },
      reports: {
        view: true,
        export: true,
      },
      notifications: {
        view: true,
        manage: true,
      },
      activityLogs: {
        view: true,
      },
      settings: {
        view: true,
        userManagement: true,
        systemSettings: true,
      },
      help: {
        view: true,
      },
    };
  }, []);

  // Generate default permissions for Sales Manager role
  const generateSalesManagerPermissions = useCallback((): UserPermissions => {
    return {
      dashboard: true,
      products: {
        view: true,
        add: false,
        edit: false,
        delete: false,
      },
      inventory: {
        view: true,
        add: false,
        edit: false,
        delete: false,
        transfer: false,
      },
      sales: {
        view: true,
        add: true,
        edit: true,
        delete: false,
        invoice: true,
      },
      customers: {
        view: true,
        add: true,
        edit: true,
        delete: false,
      },
      suppliers: {
        view: false,
        add: false,
        edit: false,
        delete: false,
      },
      categories: {
        view: false,
        add: false,
        edit: false,
        delete: false,
      },
      samples: {
        view: false,
        add: false,
        edit: false,
        delete: false,
      },
      reports: {
        view: true,
        export: true,
      },
      notifications: {
        view: false,
        manage: false,
      },
      activityLogs: {
        view: false,
      },
      settings: {
        view: false,
        userManagement: false,
        systemSettings: false,
      },
      help: {
        view: true,
      },
    };
  }, []);

  // Generate default permissions for Investor role
  const generateInvestorPermissions = useCallback((): UserPermissions => {
    return {
      dashboard: true,
      products: {
        view: true,
        add: false,
        edit: false,
        delete: false,
      },
      inventory: {
        view: false,
        add: false,
        edit: false,
        delete: false,
        transfer: false,
      },
      sales: {
        view: true,
        add: false,
        edit: false,
        delete: false,
        invoice: false,
      },
      customers: {
        view: true,
        add: false,
        edit: false,
        delete: false,
      },
      suppliers: {
        view: false,
        add: false,
        edit: false,
        delete: false,
      },
      categories: {
        view: false,
        add: false,
        edit: false,
        delete: false,
      },
      samples: {
        view: false,
        add: false,
        edit: false,
        delete: false,
      },
      reports: {
        view: true,
        export: true,
      },
      notifications: {
        view: false,
        manage: false,
      },
      activityLogs: {
        view: false,
      },
      settings: {
        view: false,
        userManagement: false,
        systemSettings: false,
      },
      help: {
        view: true,
      },
    };
  }, []);

  // Optimize auth methods with useCallback
  const login = useCallback(async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      const { email, password } = credentials;

      console.log('Login attempt for:', email);

      // Test database connection first
      const testResult = await testAuth(email.toLowerCase());
      console.log('Database test result:', testResult);

      if (testResult.error || !testResult.data) {
        console.error('Database connection failed:', testResult.error);
        return { success: false, error: 'Database connection failed. Please check your internet connection.' };
      }

      const user = testResult.data;

      // Password validation
      let isPasswordValid = false;

      console.log('🔐 Password validation for user:', user.email);
      console.log('🔐 User has password_hash:', !!user.password_hash);

      if (user.password_hash) {
        // Check if it's a bcrypt hash (starts with $2b$)
        if (user.password_hash.startsWith('$2b$')) {
          console.log('🔐 Detected bcrypt hash, using fallback for existing users');
          // For existing users with bcrypt hashes, use demo credentials as fallback
          if (user.email === 'admin@serranotex.com' && password === 'admin123') {
            isPasswordValid = true;
            console.log('🔐 Admin bcrypt fallback login successful');
          } else if (user.email !== 'admin@serranotex.com' && password === 'password') {
            isPasswordValid = true;
            console.log('🔐 User bcrypt fallback login successful');
          }
        } else {
          // For users with SHA256 hashes (newly created users)
          const hashedInputPassword = await hashPassword(password);
          isPasswordValid = hashedInputPassword === user.password_hash;
          console.log('🔐 SHA256 Hash comparison:', {
            inputPassword: password,
            inputHash: hashedInputPassword,
            storedHash: user.password_hash,
            match: isPasswordValid
          });
        }
      } else {
        // Fallback for demo users without password hash
        if (user.email === 'admin@serranotex.com' && password === 'admin123') {
          isPasswordValid = true;
          console.log('🔐 Admin demo login successful');
        } else if (user.email !== 'admin@serranotex.com' && password === 'password') {
          isPasswordValid = true;
          console.log('🔐 Demo user login successful');
        }
      }

      if (!isPasswordValid) {
        console.log('Password validation failed for:', user.email);
        return { success: false, error: 'Invalid email or password' };
      }

      console.log('Password validation successful for:', user.email);

      // Set user context for RLS
      await setUserContext(user.id);

      // Update last login (skip in demo mode)
      if (process.env.DEMO_MODE !== 'true' && process.env.EXPO_PUBLIC_DEMO_MODE !== 'true') {
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', user.id);
      }

      // Create user session
      console.log('🔍 Raw user data from database:', user);
      console.log('🔍 User permissions field:', user.permissions);

      // Set default permissions for Admin, Sales Manager and Investor if none exist
      let userPermissions = user.permissions || {};
      if (user.role === 'admin' && (!userPermissions || Object.keys(userPermissions).length === 0)) {
        console.log('🔧 Setting default permissions for Admin');
        userPermissions = generateAdminPermissions();
      } else if (user.role === 'sales_manager' && (!userPermissions || Object.keys(userPermissions).length === 0)) {
        console.log('🔧 Setting default permissions for Sales Manager');
        userPermissions = generateSalesManagerPermissions();
      } else if (user.role === 'investor' && (!userPermissions || Object.keys(userPermissions).length === 0)) {
        console.log('🔧 Setting default permissions for Investor');
        userPermissions = generateInvestorPermissions();
      }

      const userSession: UserSession = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: userPermissions,
        assignedLocations: user.assigned_location_id ? [user.assigned_location_id] : [],
        assigned_location_id: user.assigned_location_id,
        loginTime: new Date().toISOString()
      };

      console.log('🔍 Created user session:', userSession);

      // Save session with verification
      try {
        console.log('💾 Saving user session to storage...');
        await storage.setItem('userSession', JSON.stringify(userSession));

        // Verify the session was saved correctly
        const savedSession = await storage.getItem('userSession');
        if (savedSession) {
          const parsedSession = JSON.parse(savedSession);
          if (parsedSession.email === userSession.email) {
            console.log('✅ Session saved and verified successfully');
          } else {
            console.error('❌ Session verification failed - data mismatch');
            throw new Error('Session save verification failed');
          }
        } else {
          console.error('❌ Session verification failed - no data found');
          throw new Error('Session was not saved');
        }
      } catch (saveError) {
        console.error('❌ Failed to save user session:', saveError);
        // Continue with login but warn user about persistence issue
        console.warn('⚠️ Authentication will not persist across app restarts');
      }

      setUser(userSession);

      // Set current user for activity logging and log login
      if (!isDemoMode) {
        const { activityLogger } = await import('@/lib/services/activityLogger');
        activityLogger.setCurrentUser(user.id);
        await activityLogger.logLogin(user.email);
      }

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }, [generateAdminPermissions, generateSalesManagerPermissions, generateInvestorPermissions]);

  // Function to refresh user data from database
  const refreshUserData = useCallback(async () => {
    if (!user) return;

    try {
      console.log('🔄 Refreshing user data from database...');
      const { data: freshUserData, error } = await testAuth(user.email);

      if (error || !freshUserData) {
        console.error('❌ Failed to refresh user data:', error);
        return;
      }

      console.log('✅ Fresh user data:', freshUserData);

      // Update the user session with fresh data
      const updatedSession: UserSession = {
        ...user,
        permissions: freshUserData.permissions || {},
      };

      console.log('✅ Updated session:', updatedSession);

      // Save updated session
      await storage.setItem('userSession', JSON.stringify(updatedSession));
      setUser(updatedSession);

    } catch (error) {
      console.error('❌ Error refreshing user data:', error);
    }
  }, [user]);

  const logout = useCallback(async () => {
    try {
      // Log logout activity if user exists (skip in demo mode)
      if (user && !isDemoMode) {
        const { activityLogger } = await import('@/lib/services/activityLogger');
        await activityLogger.logLogout(user.email);
      }

      // Clear user context
      await clearUserContext();

      // Clear local session
      await storage.removeItem('userSession');
      setUser(null);
    } catch (error) {
      console.error('Failed to clear user session:', error);
    }
  }, [user]);

  // Sales Manager permission logic based on business rules
  const hasSalesManagerPermission = useCallback((module: string, action: string, locationId?: string): boolean => {
    console.log('🏪 Sales Manager Permission Check:', {
      module,
      action,
      locationId,
      userRole: user?.role,
      assignedLocationId: user?.assigned_location_id,
      fullUser: user
    });

    if (!user || user.role !== 'sales_manager') {
      console.log('❌ Not sales manager user');
      return false;
    }

    // Sales Managers CANNOT delete anything
    if (action === 'delete' || action === 'remove') {
      console.log('❌ Sales managers cannot delete anything');
      return false;
    }

    // Sales Managers CANNOT transfer products
    if (action === 'transfer') {
      console.log('❌ Sales managers cannot transfer products');
      return false;
    }

    // Check location access - Sales Manager can only access their assigned showroom
    if (locationId) {
      const locationIdNum = typeof locationId === 'string' ? parseInt(locationId) : locationId;
      if (user.assigned_location_id && user.assigned_location_id !== locationIdNum) {
        console.log('❌ Sales manager cannot access location outside their assignment');
        return false;
      }
    }

    // Module-specific permissions for Sales Manager
    switch (module.toLowerCase()) {
      case 'dashboard':
        // Can view dashboard
        return action === 'view';

      case 'sales':
        // Can view, add, and edit sales in their assigned showroom only
        return ['view', 'add', 'create', 'edit'].includes(action);

      case 'customers':
        // Can view, add, and edit customers (no delete)
        return ['view', 'add', 'create', 'edit'].includes(action);

      case 'products':
        // Can only view products (no add/edit/delete)
        return action === 'view';

      case 'inventory':
        // Can view inventory (no add/edit/delete/transfer)
        return action === 'view';

      case 'reports':
        // Can view and export reports for their location
        return action === 'view' || action === 'export';

      case 'suppliers':
      case 'categories':
      case 'samples':
      case 'notifications':
      case 'activitylogs':
      case 'settings':
      case 'users':
        // Cannot access these modules
        console.log(`❌ Sales managers cannot access ${module} module`);
        return false;

      default:
        // For any other modules, deny access
        console.log(`❌ Sales managers cannot access unknown module: ${module}`);
        return false;
    }
  }, [user]);

  // Investor permission logic - read-only access to specific modules
  const hasInvestorPermission = useCallback((module: string, action: string, locationId?: string): boolean => {
    console.log('💰 Investor Permission Check:', {
      module,
      action,
      locationId,
      userRole: user?.role,
      fullUser: user
    });

    if (!user || user.role !== 'investor') {
      console.log('❌ Not investor user');
      return false;
    }

    // Investors CANNOT perform any modification actions
    if (['add', 'create', 'edit', 'update', 'delete', 'remove', 'approve', 'transfer', 'invoice'].includes(action)) {
      console.log('❌ Investors cannot perform modification actions');
      return false;
    }

    // Module-specific permissions for Investor
    switch (module.toLowerCase()) {
      case 'dashboard':
        // Can view dashboard
        return action === 'view';

      case 'products':
        // Can only view product data (no modifications)
        return action === 'view';

      case 'sales':
        // Can only view sales data (no modifications)
        return action === 'view';

      case 'customers':
        // Can only view customer data (no modifications)
        return action === 'view';

      case 'reports':
        // Can view and export reports
        return action === 'view' || action === 'export';

      case 'help':
        // Can view help
        return action === 'view';

      default:
        // For all other modules, deny access
        console.log(`❌ Investors cannot access module: ${module}`);
        return false;
    }
  }, [user]);

  const hasPermission = useCallback((module: string, action: string = 'view', locationId?: string): boolean => {
    console.log('🔍 Permission Check:', {
      module,
      action,
      locationId,
      userRole: user?.role,
      userExists: !!user,
      permissionsExists: !!user?.permissions
    });

    if (!user) {
      console.log('❌ No user found');
      return false;
    }

    // Super admin has all permissions - check this FIRST before checking permissions object
    if (user.role === 'super_admin') {
      console.log('✅ Super admin - granting permission');
      return true;
    }

    // For other roles, check if permissions exist
    if (!user.permissions) {
      console.log('❌ No permissions object found for non-super-admin user');
      return false;
    }

    // Admin role-specific logic
    if (user.role === 'admin') {
      return hasAdminPermission(module, action, locationId);
    }

    // Sales Manager specific logic
    if (user.role === 'sales_manager') {
      return hasSalesManagerPermission(module, action, locationId);
    }

    // Investor specific logic
    if (user.role === 'investor') {
      return hasInvestorPermission(module, action, locationId);
    }

    // Other roles logic (existing)
    const modulePermissions = user.permissions[module.toLowerCase()];

    if (!modulePermissions) return false;

    // Map action names to permission fields
    const actionMap: Record<string, string> = {
      'view': 'view',
      'read': 'view',
      'add': 'add',
      'create': 'add',
      'edit': 'edit',
      'update': 'edit',
      'delete': 'delete',
      'remove': 'delete',
      'approve': 'approve'
    };

    const permissionField = actionMap[action.toLowerCase()] || action.toLowerCase();

    let hasModulePermission = false;

    if (typeof modulePermissions === 'boolean') {
      hasModulePermission = modulePermissions;
    } else if (typeof modulePermissions === 'object' && modulePermissions !== null) {
      hasModulePermission = modulePermissions[permissionField] ?? false;
    }

    if (!hasModulePermission) return false;

    // Check location restrictions for non-admin roles
    if (locationId && user.role !== 'super_admin') {
      // Convert locationId to number for comparison
      const locationIdNum = typeof locationId === 'string' ? parseInt(locationId) : locationId;

      // For location-specific permissions, check if user has access to this location
      if (user.assignedLocations && user.assignedLocations.length > 0) {
        return user.assignedLocations.includes(locationIdNum);
      }

      // If user has location restrictions in permissions
      if (modulePermissions.locationRestrictions && modulePermissions.locationRestrictions.length > 0) {
        return modulePermissions.locationRestrictions.includes(locationIdNum);
      }
    }

    return true;
  }, [user, hasAdminPermission, hasSalesManagerPermission]);

  const isRole = useCallback((role: string): boolean => {
    return user?.role === role;
  }, [user]);

  const canAccessLocation = useCallback((locationId: string | number): boolean => {
    if (!user) return false;

    // Super admin can access all locations
    if (user.role === 'super_admin') return true;

    // Convert locationId to number for comparison
    const locationIdNum = typeof locationId === 'string' ? parseInt(locationId) : locationId;

    // Check assigned locations
    if (user.assignedLocations && user.assignedLocations.length > 0) {
      return user.assignedLocations.includes(locationIdNum);
    }

    // Check single assigned location
    if (user.assigned_location_id) {
      return user.assigned_location_id === locationIdNum;
    }

    // If no location restrictions, allow access (for backward compatibility)
    return true;
  }, [user]);

  const getAccessibleLocations = useCallback((): string[] => {
    if (!user) return [];

    // Super admin can access all locations (return empty array means no restrictions)
    if (user.role === 'super_admin') return [];

    console.log('🔍 Getting accessible locations for user:', {
      role: user.role,
      permissions: user.permissions,
      assigned_location_id: user.assigned_location_id,
      assignedLocations: user.assignedLocations
    });

    // For admin users, check permissions.locations
    if (user.role === 'admin' && user.permissions?.locations && user.permissions.locations.length > 0) {
      const locations = user.permissions.locations.map((id: any) => id.toString());
      console.log('📍 Admin accessible locations from permissions:', locations);
      return locations;
    }

    // For sales managers, use assigned_location_id
    if (user.role === 'sales_manager' && user.assigned_location_id) {
      const locations = [user.assigned_location_id.toString()];
      console.log('📍 Sales manager accessible location:', locations);
      return locations;
    }

    // Fallback: Return assigned locations as strings (legacy support)
    if (user.assignedLocations && user.assignedLocations.length > 0) {
      const locations = user.assignedLocations.map(id => id.toString());
      console.log('📍 Fallback accessible locations:', locations);
      return locations;
    }

    // Fallback: Return single assigned location (legacy support)
    if (user.assigned_location_id) {
      const locations = [user.assigned_location_id.toString()];
      console.log('📍 Fallback single location:', locations);
      return locations;
    }

    console.log('⚠️ No accessible locations found for user');
    return [];
  }, [user]);

  // Debug functions (only in development)
  const debugStorage = useCallback(async () => {
    if (__DEV__) {
      const { logStorageDebugInfo } = await import('../utils/storageDebug');
      await logStorageDebugInfo();
    }
  }, []);

  const testPersistence = useCallback(async (): Promise<boolean> => {
    if (!__DEV__) return false;

    try {
      console.log('🧪 Testing authentication persistence...');

      // Save a test session
      const testSession = {
        id: 'test-persistence',
        email: 'test@persistence.com',
        name: 'Test User',
        role: 'admin',
        permissions: {},
        assignedLocations: [],
        assigned_location_id: null,
        loginTime: new Date().toISOString()
      };

      await storage.setItem('testSession', JSON.stringify(testSession));
      console.log('✅ Test session saved');

      // Try to retrieve it
      const retrieved = await storage.getItem('testSession');
      if (retrieved) {
        const parsed = JSON.parse(retrieved);
        const success = parsed.email === testSession.email;
        console.log(success ? '✅ Persistence test passed' : '❌ Persistence test failed');

        // Clean up
        await storage.removeItem('testSession');
        return success;
      } else {
        console.log('❌ Persistence test failed - no data retrieved');
        return false;
      }
    } catch (error) {
      console.error('❌ Persistence test error:', error);
      return false;
    }
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    isLoading,
    login,
    logout,
    refreshUserData,
    hasPermission,
    isRole,
    canAccessLocation,
    getAccessibleLocations,
    ...__DEV__ && { debugStorage, testPersistence },
  }), [user, isLoading, login, logout, refreshUserData, hasPermission, isRole, canAccessLocation, getAccessibleLocations, debugStorage, testPersistence]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Role-based access control component
interface ProtectedComponentProps {
  children: ReactNode;
  module: string;
  action?: string;
  fallback?: ReactNode;
}

export function ProtectedComponent({ 
  children, 
  module, 
  action = 'view', 
  fallback = null 
}: ProtectedComponentProps) {
  const { hasPermission } = useAuth();
  
  if (!hasPermission(module, action)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// Role-based menu item component
interface RoleBasedMenuItemProps {
  children: ReactNode;
  requiredRole?: string;
  requiredPermission?: { module: string; action?: string };
}

export function RoleBasedMenuItem({ 
  children, 
  requiredRole, 
  requiredPermission 
}: RoleBasedMenuItemProps) {
  const { isRole, hasPermission } = useAuth();
  
  // Check role requirement
  if (requiredRole && !isRole(requiredRole)) {
    return null;
  }
  
  // Check permission requirement
  if (requiredPermission && !hasPermission(requiredPermission.module, requiredPermission.action)) {
    return null;
  }
  
  return <>{children}</>;
}