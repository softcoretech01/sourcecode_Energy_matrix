import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Clear any existing tokens when visiting login page
  React.useEffect(() => {
    localStorage.removeItem("access_token");
  }, []);

  // If already logged in (shouldn't happen due to SessionManager), redirect
  React.useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      // Token exists, redirect to dashboard
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await res.json();

      if (res.ok && data.access_token) {
        // Store token
        localStorage.setItem("access_token", data.access_token);
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }
        
        toast.success("Login successful!");
        // Navigate to dashboard
        navigate("/windmill", { replace: true });
      } else {
        setError(data.detail || data.message || "Login failed");
        toast.error(data.detail || data.message || "Login failed");
      }
    } catch (err) {
      console.error(err);
      const errorMessage = "Unable to reach server";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-12 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-2" style={{ color: "hsl(189 79% 27%)" }}>EnergyMatrix</h2>
        </div>
        
        {error && (
          <div className="text-red-600 mb-4 p-3 bg-red-50 rounded border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Username
            </label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 text-gray-900 placeholder-gray-400"
              placeholder="Enter your username"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 text-gray-900 placeholder-gray-400"
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full text-white font-semibold py-2 rounded"
            style={{ backgroundColor: "hsl(189 79% 27%)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "hsl(189 79% 22%)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "hsl(189 79% 27%)")}
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
