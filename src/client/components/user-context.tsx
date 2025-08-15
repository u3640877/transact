import React, { useEffect, useState} from 'react';
import { getLogger, fetchJson, parseCookie }
from '@transitive-sdk/utils-web';
import { COOKIE_NAME } from '@/common/constants';
import { useLocation, useNavigate } from 'react-router-dom';

const log = getLogger('UserContext');
log.setLevel('debug');

interface UserContextType {
  ready?: boolean;
  session?: any;
  login?: (user: string, password: string) => void;
  logout?: () => void;
  register?: (user: string, password: string, email: string) => void;
  error?: string | null;
}

export const UserContext = React.createContext<UserContextType>({});
export const UserContextProvider = ({children}) => {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState();
  const [error, setError] = useState();
  const navigate = useNavigate();
  const location = useLocation();

  const refresh = () => {
    const cookie = parseCookie(document.cookie);
    if (cookie[COOKIE_NAME]) {
      setSession(JSON.parse(cookie[COOKIE_NAME]));
    } else {
      setSession(null);
    }
    setReady(true);
  };

  useEffect(() => {
    fetch('/api/refresh', { method: 'GET' })
    .then(response => {
      refresh();
      if (!response.ok) {
        // Don't redirect if we're already on login or create-account pages
        if (location.pathname === '/login' || location.pathname === '/create-account') {
          return;
        }
        log.debug('not logged in');
        navigate('/login');
      }
    })
    .catch(function(err) {
      log.error(err);
      // Don't redirect if we're already on login or create-account pages
      if (location.pathname === '/login' || location.pathname === '/create-account') {
        return;
      }
      navigate('/login');
    });

  }, []);

  /** execute the login */
  const login = (user, password) =>
    fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: user, password })
    })
      .then(response => {
        if (!response.ok) {
          setError('Failed to log in, please check your credentials.');
          throw new Error('Failed to log in');
        }
        setError(null);
        log.debug('logged in');
        refresh();
        navigate('/dashboard/devices');
      })
      .catch(function(err) {
        log.error(err);
        setError('Failed to log in, please check your credentials.');
      });


  const logout = () => fetch('/api/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
    })
      .then(response => {
        log.debug('response', response);
        if (!response.ok) {
          log.error('Failed to log out');
          throw new Error('Failed to log out');
        }
        setError(null);
        log.debug('logged out');
        refresh();
        navigate('/login');
      })
      .catch(function(err) {
        log.error(err);
        setError('Failed to log out');
      });

  /** register new account */
  const register = (user, password, email) =>
    fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: user, password, email })
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          setError(`Failed to register: ${data.error}`);
          throw new Error(data.error);
        }
        setError(null);
        log.debug('registered');
        // Automatically login after successful registration
        login(user, password);
      })
      .catch(function(err) {
        log.error(err);
        setError(`Failed to register: ${err.message || 'Unknown error'}`);
      });

//   const forgot = (email) =>
//     fetchJson(`/@transitive-robotics/_robot-agent/forgot`,
//       (err, res) => {
//         if (err) {
//           log.error(err, res);
//           setError(`Failed to request reset link: ${res.error}`);
//         } else {
//           setError(null);
//           log.debug('reset link sent');
//         }
//       },
//       {body: {email}});

//   const reset = (user, password, code) =>
//     fetchJson(`/@transitive-robotics/_robot-agent/reset`,
//       (err, res) => {
//         if (err) {
//           log.error(err, res);
//           setError(`Failed to reset password: ${res.error}`);
//         } else {
//           setError(null);
//           log.debug('password reset');
//           location.href = '/';
//         }
//       },
//       {body: {name: user, password, code}});

  return <UserContext.Provider
    value={{ ready, session, login, logout, register, error }}>
    {children}
  </UserContext.Provider>;
};