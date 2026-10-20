import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ArrowRight } from "lucide-react";
import { continueAsGuest } from "../store/authSlice";
import { EVENT_TYPES } from "../constants/EVENT_TYPES";
import Button from "../components/ui/Button";
import Logo from "../components/ui/Logo";

const RIDE_AWAY_MS = 420;

export default function WelcomePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [riding, setRiding] = useState(false);

  const goTo = (path) => {
    setRiding(true);
    setTimeout(() => navigate(path), RIDE_AWAY_MS);
  };

  const handleGuest = () => {
    dispatch(continueAsGuest());
    goTo("/home");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden px-6">
      <div className="absolute top-[-20%] right-[-15%] w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-primary-light/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[30%] left-[5%] w-[200px] h-[200px] bg-blue-100/60 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
        <div className="mb-8 flex flex-col items-center gap-4">
          <Logo
            className={`h-12 w-auto ${riding ? "animate-ride-away" : ""}`}
          />
          <p className="text-text-muted text-lg leading-snug">
            Descoperă evenimente sportive și
            <br />
            sociale în orașul tău!
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {EVENT_TYPES.map((tag) => (
            <span
              key={tag.value}
              className="flex items-center gap-1.5 px-3 py-1 bg-surface border border-border text-sm text-text-muted rounded-full"
            >
              <tag.icon size={14} /> {tag.label}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Button
            size="lg"
            className="w-full text-base font-semibold shadow-float"
            onClick={() => goTo("/login")}
            disabled={riding}
          >
            Conectează-te
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full text-base font-semibold"
            onClick={() => goTo("/register")}
            disabled={riding}
          >
            Creează cont
          </Button>
          <button
            onClick={handleGuest}
            disabled={riding}
            className="text-sm text-text-muted hover:text-primary transition-colors py-2 flex items-center justify-center gap-1 disabled:opacity-60"
          >
            Continuă ca vizitator <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
