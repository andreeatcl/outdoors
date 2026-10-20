import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { loginSuccess } from "../store/authSlice";
import api from "../services/api";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

export default function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/register", form);
      dispatch(loginSuccess({ user: data.user, token: data.token }));
      toast.success("Cont creat! Bun venit la Outdoors.");
      navigate("/home");
    } catch (err) {
      const msg =
        err.response?.data?.error ??
        err.response?.data?.errors?.[0]?.msg ??
        "Eroare la înregistrare.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-10">
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-primary/6 rounded-full blur-3xl pointer-events-none" />

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
            Creează cont
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Prenume"
              placeholder="Andreea"
              value={form.first_name}
              onChange={set("first_name")}
              required
            />
            <Input
              label="Nume"
              placeholder="Moldovan"
              value={form.last_name}
              onChange={set("last_name")}
              required
            />
          </div>
          <Input
            label="Username"
            placeholder="andreea_m"
            value={form.username}
            onChange={set("username")}
            required
          />
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
            placeholder="min. 6 caractere"
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
            {loading ? "Se creează…" : "Creează cont"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-center text-text-muted">
          Ai deja cont?{" "}
          <Link
            to="/login"
            className="text-primary font-semibold hover:underline"
          >
            Conectează-te
          </Link>
        </p>
      </div>
    </div>
  );
}
