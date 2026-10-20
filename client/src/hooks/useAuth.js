import { useSelector, useDispatch } from "react-redux";
import { logout, continueAsGuest } from "../store/authSlice";

export function useAuth() {
  const { user, isLoggedIn, isGuest } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  return {
    user,
    isLoggedIn,
    isGuest,
    isAuth: isLoggedIn && !isGuest,
    logout: () => dispatch(logout()),
    continueAsGuest: () => dispatch(continueAsGuest()),
  };
}
