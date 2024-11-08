import '@/styles/globals.css';
import '@/styles/Home.module.css';
import React from 'react';
import { AuthProvider } from '../auth/authContext'; // นำเข้า AuthProvider จาก authContext.js

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;