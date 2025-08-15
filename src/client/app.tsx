import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import _ from 'lodash';

import './app.css';

import { ThemeProvider } from './components/theme-provider.js';
import { UserContextProvider } from './components/user-context.js';
import { Login } from './components/login.js';
import { CreateAccount } from './components/create-account.js';

import { getLogger} from '@transitive-sdk/utils-web';
import DashBoard from './dashboard.js';

const log = getLogger('App');
log.setLevel('debug');


function App() {
  return (
    <Router>
      <ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
        <UserContextProvider>          
          <Routes>
            <Route path='/login' element={<Login/>} />
            <Route path='/create-account' element={<CreateAccount/>} />
            <Route path='/dashboard/*' element={<DashBoard/>} />
            <Route path='*' element={<Navigate to='/dashboard/devices' />} />
          </Routes>
        </UserContextProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;