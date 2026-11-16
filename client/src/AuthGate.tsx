import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import axios from "axios";
import { BookOpen, LockKeyhole, LogOut } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const TOKEN_KEY = "library_auth_token";

type AuthUser = {
  id: number;
  fullName: string;
  email: string;
  role: "ADMIN" | "LIBRARIAN";
};

type Props = { children: ReactNode };

export default function AuthGate({ children }: Props) {
  const [checking, setChecking] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function applyToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    delete axios.defaults.headers.common.Authorization;
    setUser(null);
  }

  useEffect(() => {
    async function initialize() {
      const token = localStorage.getItem(TOKEN_KEY);

      if (token) {
        axios.defaults.headers.common.Authorization = `Bearer ${token}`;
        try {
          const response = await axios.get(`${API}/auth/me`);
          setUser(response.data.user);
          setChecking(false);
          return;
        } catch {
          clearSession();
        }
      }

      try {
        const response = await axios.get(`${API}/auth/status`);
        setSetupRequired(Boolean(response.data.setupRequired));
      } catch {
        setError("Не вдалося з'єднатися із сервером. Перевірте, чи запущений backend.");
      } finally {
        setChecking(false);
      }
    }

    void initialize();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password || (setupRequired && !fullName.trim())) {
      setError("Заповніть усі поля.");
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = setupRequired ? "setup" : "login";
      const payload = setupRequired
        ? { fullName: fullName.trim(), email: email.trim(), password }
        : { email: email.trim(), password };

      const response = await axios.post(`${API}/auth/${endpoint}`, payload);
      applyToken(response.data.token);
      setUser(response.data.user);
      setPassword("");
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message
        : null;
      setError(message || "Не вдалося виконати запит.");
    } finally {
      setSubmitting(false);
    }
  }

  function logout() {
    clearSession();
    setPassword("");
    setError("");
  }

  if (checking) {
    return <div style={styles.loading}>Завантаження системи...</div>;
  }

  if (!user) {
    return (
      <div style={styles.page}>
        <form onSubmit={handleSubmit} style={styles.card}>
          <div style={styles.logo}><BookOpen size={30} /></div>
          <h1 style={styles.title}>Бібліотека коледжу</h1>
          <p style={styles.subtitle}>
            {setupRequired
              ? "Створення облікового запису адміністратора"
              : "Увійдіть до системи обліку бібліотечного фонду"}
          </p>

          {setupRequired && (
            <label style={styles.label}>
              ПІБ адміністратора
              <input
                style={styles.input}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="name"
                required
              />
            </label>
          )}

          <label style={styles.label}>
            Email
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label style={styles.label}>
            Пароль {setupRequired && "(не менше 8 символів)"}
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={setupRequired ? "new-password" : "current-password"}
              minLength={setupRequired ? 8 : undefined}
              required
            />
          </label>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" disabled={submitting} style={styles.button}>
            <LockKeyhole size={17} />
            {submitting
              ? "Зачекайте..."
              : setupRequired ? "Створити адміністратора" : "Увійти"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <>
      <div style={styles.userBar}>
        <span>{user.fullName} · {user.role === "ADMIN" ? "Адміністратор" : "Бібліотекар"}</span>
        <button onClick={logout} style={styles.logout}>
          <LogOut size={16} /> Вийти
        </button>
      </div>
      {children}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 20,
    background: "#f3f5f9",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    boxSizing: "border-box",
    padding: 32,
    borderRadius: 16,
    background: "#fff",
    boxShadow: "0 12px 40px rgba(20, 35, 65, 0.10)",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  logo: {
    width: 58,
    height: 58,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    background: "#e9efff",
    color: "#3157a4",
    margin: "0 auto",
  },
  title: { margin: 0, textAlign: "center", fontSize: 24, color: "#1d2940" },
  subtitle: { margin: "0 0 8px", textAlign: "center", color: "#68758a", lineHeight: 1.5 },
  label: { display: "flex", flexDirection: "column", gap: 7, color: "#344054", fontSize: 14, fontWeight: 600 },
  input: { boxSizing: "border-box", width: "100%", padding: "12px 13px", border: "1px solid #d7deea", borderRadius: 8, fontSize: 15, outlineColor: "#3157a4" },
  button: { border: 0, borderRadius: 8, padding: 13, display: "flex", justifyContent: "center", alignItems: "center", gap: 9, background: "#3157a4", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" },
  error: { padding: 11, borderRadius: 8, background: "#fff0f0", color: "#b42318", fontSize: 14 },
  loading: { minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "Arial, sans-serif", color: "#344054" },
  userBar: { display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 14, padding: "9px 24px", background: "#fff", borderBottom: "1px solid #e5eaf1", color: "#344054", fontFamily: "Arial, sans-serif", fontSize: 13 },
  logout: { display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid #d7deea", borderRadius: 7, background: "#fff", padding: "7px 10px", color: "#344054", cursor: "pointer" },
};
