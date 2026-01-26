'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { createClient } from '@/src/infrastructure/supabase/client';
import Link from 'next/link';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validación básica
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      setLoading(false);
      return;
    }

    if (!/^\S+@\S+$/.test(email)) {
      setError('Email inválido');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      notifications.show({
        title: 'Éxito',
        message: 'Sesión iniciada correctamente',
        color: 'green',
      });

      router.push('/admin');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error de conexión';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Ambient Animated Background */}
      <div className={styles.backgroundBlobs}>
        <div className={`${styles.blob} ${styles.blob1}`}></div>
        <div className={`${styles.blob} ${styles.blob2}`}></div>
        <div className={`${styles.blob} ${styles.blob3}`}></div>
        <div className={`${styles.blob} ${styles.blob4}`}></div>
      </div>

      {/* Main Content Area */}
      <main className={styles.main}>
        {/* Glassmorphism Login Card */}
        <div className={styles.glassPanel}>
          {/* Logo Section */}
          <div className={styles.logoSection}>
            <div className={styles.logoIcon}>
              <span className="material-symbols-outlined">medical_services</span>
            </div>
            <h1 className={styles.logoTitle}>Care By Dani</h1>
          </div>

          {/* Headlines */}
          <div className={styles.headlines}>
            <h2 className={styles.title}>Bienvenido de nuevo</h2>
            <p className={styles.subtitle}>Portal de Administración</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className={styles.errorAlert}>
              <span className="material-symbols-outlined">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Email Field */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="email">
                Correo electrónico
              </label>
              <div className={styles.inputWrapper}>
                <div className={styles.inputIcon}>
                  <span className="material-symbols-outlined">mail</span>
                </div>
                <input
                  className={styles.input}
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@carebydani.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className={styles.fieldGroup}>
              <div className={styles.labelRow}>
                <label className={styles.label} htmlFor="password">
                  Contraseña
                </label>
              </div>
              <div className={styles.inputWrapper}>
                <div className={styles.inputIcon}>
                  <span className="material-symbols-outlined">lock</span>
                </div>
                <input
                  className={styles.input}
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Back Link */}
          <Link href="/" className={styles.backLink}>
            ← Volver al inicio
          </Link>
        </div>

        {/* Footer */}
        <footer className={styles.footer}>
          <p>© {new Date().getFullYear()} Care By Dani. Todos los derechos reservados.</p>
        </footer>
      </main>
    </div>
  );
}
