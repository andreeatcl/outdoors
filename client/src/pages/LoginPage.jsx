import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { ArrowLeft, Hand } from "lucide-react";
import { loginSuccess } from "../store/authSlice";
import api from "../services/api";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/login", form);
      dispatch(loginSuccess({ user: data.user, token: data.token }));
      toast.success(`Bun venit, ${data.user.first_name}!`, {
        icon: <Hand size={18} />,
      });
      navigate("/home");
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Eroare la conectare.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary/6 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors mb-8 text-sm"
        >
          <ArrowLeft size={16} /> Înapoi
        </button>

        <div className="flex items-center gap-3 mb-8">
          <img src="/favicon.svg" alt="Outdoors" className="w-10 h-10" />
          <h1 className="font-display font-bold text-2xl text-text-primary">
            Conectare
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="andreea@example.com"
            value={form.email}
            onChange={set("email")}
            required
          />
          <Input
            label="Parolă"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={set("password")}
            required
          />

          <Button
            type="submit"
            size="lg"
            className="w-full mt-2"
            disabled={loading}
          >
            {loading ? "Se conectează…" : "Conectare"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-center text-text-muted">
          Nu ai cont?{" "}
          <Link
            to="/register"
            className="text-primary font-semibold hover:underline"
          >
            Creează-ți unul
          </Link>
        </p>
      </div>
    </div>
  );
}
