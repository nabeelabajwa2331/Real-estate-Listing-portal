import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { FavoritesProvider } from './context/FavoritesContext.jsx';
import { InquiryProvider } from './context/InquiryContext.jsx';
import { ChatProvider } from './context/ChatContext.jsx';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <FavoritesProvider>
            <InquiryProvider>
              <ChatProvider>
                <App />
              </ChatProvider>
            </InquiryProvider>
          </FavoritesProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
