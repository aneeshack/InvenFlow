
// import React, { createContext, useState, useContext, ReactNode } from 'react';

// // Define our types
// interface User {
//   id: string;
//   name: string;
//   email: string;
// }

// interface AuthContextType {
//   user: User | null;
//   login: (email: string, password: string) => Promise<void>;
//   logout: () => void;
//   isLoading: boolean;
// }

// // Create context with a default value
// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// // Create provider component
// export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [isLoading, setIsLoading] = useState<boolean>(false);

//   // Mock login function - would be replaced with real API call
//   const login = async (email: string, password: string) => {
//     setIsLoading(true);
//     try {
//       // Simulate API delay
//       await new Promise(resolve => setTimeout(resolve, 1000));
      
//       // Hardcoded user for demo - will be replaced with real API response
//       if (email === 'demo@example.com' && password === 'password') {
//         setUser({
//           id: '1',
//           name: 'Demo User',
//           email: 'demo@example.com'
//         });
//       } else {
//         throw new Error('Invalid credentials');
//       }
//     } catch (error) {
//       console.error('Login error:', error);
//       throw error;
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const logout = () => {
//     setUser(null);
//   };

//   return (
//     <AuthContext.Provider value={{ user, login, logout, isLoading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// // Create hook for easy use of auth context
// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { CLIENT_API } from '@/util/Axios';

// Define our types
interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

// Create context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start as true for session check

  // Check for valid session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await CLIENT_API.get('/fetchUser');
        console.log('response',response.data)
        setUser(response.data); // Restore user state
      } catch (error: unknown) {
        console.error('Session check error:', error);
        setUser(null); // No valid session
      } finally {
        setIsLoading(false); // Done checking
      }
    };

    checkSession();
  }, []);

  // Login function to authenticate with backend
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const loginResponse = await CLIENT_API.post('/login', { email, password });
console.log('login response', loginResponse)
      if (loginResponse.data.success) {
        // Fetch user data after successful login
        // const userResponse = await CLIENT_API.get('/fetchUser');
        setUser(loginResponse.data); // Set user state
      } else {
        throw new Error(loginResponse.data.error || 'Login failed');
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      // throw new Error(error.response?.data?.error || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function to clear session
  const logout = async () => {
    try {
      await CLIENT_API.post('/logout');
      setUser(null); // Clear user state
    } catch (error: unknown) {
      console.error('Logout error:', error);
      setUser(null); // Clear user state even if logout fails
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Create hook for easy use of auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};