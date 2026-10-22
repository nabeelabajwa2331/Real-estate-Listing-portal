import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import RoleRoute from './routes/RoleRoute.jsx';
import Home from './pages/Home.jsx';
import Listings from './pages/Listings.jsx';
import ListingDetail from './pages/ListingDetail.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Profile from './pages/Profile.jsx';
import Messages from './pages/Messages.jsx';
import AgentDashboard from './pages/agent/AgentDashboard.jsx';
import ListingForm from './pages/agent/ListingForm.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import DashboardLayout from './pages/dashboard/DashboardLayout.jsx';
import Overview from './pages/dashboard/Overview.jsx';
import Favorites from './pages/dashboard/Favorites.jsx';
import SavedSearches from './pages/dashboard/SavedSearches.jsx';
import NotFound from './pages/NotFound.jsx';

// Old bookmarks keep working: inbox and chat now live in one Messages page.
function InquiryRedirect() {
  const { id } = useParams();
  return <Navigate to={`/messages/inquiry/${id}`} replace />;
}

function ChatRedirect() {
  const { id } = useParams();
  return <Navigate to={`/messages/chat/${id}`} replace />;
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Browsing the full catalogue requires an account. A shared listing
              link still opens for guests, showing the photos only. */}
          <Route path="/listings/:id" element={<ListingDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify/:token" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/listings" element={<Listings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/chat/:chatId" element={<Messages />} />
            <Route path="/messages/inquiry/:inquiryId" element={<Messages />} />
            <Route path="/inbox" element={<Navigate to="/messages?tab=inquiries" replace />} />
            <Route path="/inbox/:id" element={<InquiryRedirect />} />
            <Route path="/chat" element={<Navigate to="/messages?tab=chats" replace />} />
            <Route path="/chat/:id" element={<ChatRedirect />} />

            {/* Favorites and saved searches are available to every signed-in
                account, not only buyers, so agents and admins can use them too. */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Overview />} />
              <Route path="favorites" element={<Favorites />} />
              <Route path="searches" element={<SavedSearches />} />
            </Route>
          </Route>

          <Route element={<RoleRoute roles={['agent']} />}>
            <Route path="/agent" element={<AgentDashboard />} />
            <Route path="/agent/new" element={<ListingForm />} />
            <Route path="/agent/:id/edit" element={<ListingForm />} />
          </Route>

          <Route element={<RoleRoute roles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/*" element={<AdminDashboard />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}
