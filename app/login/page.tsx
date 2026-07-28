'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { createClient } from '@/src/infrastructure/supabase/client';
import Link from 'next/link';
import styles from './login.module.css';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const supabase = createClient();

  // Si ya hay sesión, no tiene sentido mostrar el form: va a su área.
  useEffect(() => {
    let vivo = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!vivo || !data.user) return;
      router.replace(data.user.app_metadata?.rol === 'ADMIN' ? '/admin' : '/empleado');
    });
    return () => {
      vivo = false;
    };
  }, [supabase, router]);

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

      // El rol viaja en app_metadata; el área a la que puede entrar depende de él.
      const esAdmin = data.user?.app_metadata?.rol === 'ADMIN';
      const home = esAdmin ? '/admin' : '/empleado';
      const redirect = searchParams.get('redirect');
      // `/admin/login` es un alias viejo que vuelve acá: seguirlo sería un loop.
      const destino = redirect?.startsWith(home) && !redirect.includes('/login') ? redirect : home;

      router.push(destino);
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
            <p className={styles.subtitle}>Ingreso al sistema</p>
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
              {loading && <span className={styles.spinner} aria-hidden="true" />}
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

export default function LoginPage() {
  // useSearchParams necesita un límite de Suspense para prerenderizar.
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
