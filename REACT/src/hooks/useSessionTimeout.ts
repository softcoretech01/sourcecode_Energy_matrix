import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const SESSION_TIMEOUT_MINUTES = 15; // Idle timeout in minutes
const SESSION_WARNING_MINUTES = 14; // Show warning 1 minute before timeout

export const useSessionTimeout = () => {
  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isToastShownRef = useRef(false);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("access_token");
    isToastShownRef.current = false;
    navigate("/login", { replace: true });
    toast.error("Session timed out. Please log in again.");
  }, [navigate]);

  const resetSessionTimer = useCallback(() => {
    // Clear previous timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

    // Reset warning toast flag
    isToastShownRef.current = false;

    // Set warning timeout (at SESSION_WARNING_MINUTES)
    warningTimeoutRef.current = setTimeout(() => {
      if (!isToastShownRef.current) {
        isToastShownRef.current = true;
        // Don't force logout, just show a warning
      }
    }, SESSION_WARNING_MINUTES * 60 * 1000);

    // Set logout timeout (at SESSION_TIMEOUT_MINUTES)
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, SESSION_TIMEOUT_MINUTES * 60 * 1000);
  }, [handleLogout]);

  // Initialize session timer on component mount
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("access_token");
    if (!token) {
      return;
    }

    // Start initial timer
    resetSessionTimer();

    // Track user activity and reset timer
    const handleUserActivity = () => {
      // Only reset if user is still logged in
      if (localStorage.getItem("access_token")) {
        resetSessionTimer();
      }
    };

    // Listen to user activity events
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    events.forEach((event) => {
      document.addEventListener(event, handleUserActivity);
    });

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      events.forEach((event) => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [resetSessionTimer]);

  // Handle browser close
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clear tokens when tab/window closes
      const token = localStorage.getItem("access_token");
      if (token) {
        localStorage.removeItem("access_token");
        // Try to call logout endpoint (won't wait for response)
        navigator.sendBeacon(
          `${import.meta.env.VITE_BACKEND_URL}/api/auth/logout`,
          JSON.stringify({ token })
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);
};
