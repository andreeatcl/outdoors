import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { loginSuccess, logout, setLoading } from "./store/authSlice";
import useNotificationSocket from "./hooks/useNotificationSocket";
import api from "./services/api";
import WelcomePage from "./pages/WelcomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import NotificationsPage from "./pages/NotificationsPage";
import MyEventsPage from "./pages/MyEventsPage";
import AdminPage from "./pages/AdminPage";

function PrivateRoute({ children }) {
  const { isLoggedIn, isGuest, loading } = useSelector((s) => s.auth);
  if (loading) return null;
  if (!isLoggedIn && !isGuest) return <Navigate to="/" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { isLoggedIn, user, loading } = useSelector((s) => s.auth);
  if (loading) return null;
  if (!isLoggedIn || user?.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

function AuthRoute({ children }) {
  const { isLoggedIn, loading } = useSelector((s) => s.auth);
  if (loading) return null;
  if (isLoggedIn) return <Navigate to="/home" replace />;
  return children;
}

function AuthInitializer() {
  const dispatch = useDispatch();
  const { token, isLoggedIn } = useSelector((s) => s.auth);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) {
      dispatch(setLoading(false));
      return;
    }

    api
      .get("/api/auth/me")
      .then(({ data }) => {
        dispatch(loginSuccess({ user: data.user, token: savedToken }));
      })
      .catch(() => {
        dispatch(logout());
      });
  }, [dispatch]);

  useNotificationSocket({ isLoggedIn, token });

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthInitializer />
      <Routes>
        <Route
          path="/"
          element={
            <AuthRoute>
              <WelcomePage />
            </AuthRoute>
          }
        />
        <Route
          path="/login"
          element={
            <AuthRoute>
              <LoginPage />
            </AuthRoute>
          }
        />
        <Route
          path="/register"
          element={
            <AuthRoute>
              <RegisterPage />
            </AuthRoute>
          }
        />

        <Route
          path="/home"
          element={
            <PrivateRoute>
              <HomePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <ChatPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile/:id"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <PrivateRoute>
              <NotificationsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/my-events"
          element={
            <PrivateRoute>
              <MyEventsPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
