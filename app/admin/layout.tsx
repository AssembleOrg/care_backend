'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/src/infrastructure/supabase/client';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { Menu, UnstyledButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import styles from './admin.module.css';
import './admin-globals.css';

/** Eventos que las vistas de listas escuchan para refrescar en vivo. */
export const REALTIME_EVENTS = {
  contacto: 'realtime:mensaje-contacto',
  solicitudes: 'realtime:solicitud-empleo',
  /** Disparar tras marcar leído / cambiar estado para recalcular badges. */
  refreshBadges: 'badge:refresh',
} as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unread, setUnread] = useState<{ contacto: number; solicitudes: number }>({ contacto: 0, solicitudes: 0 });
  const supabase = createClient();

  // Contador real de no leídos desde la DB (contacto: leido=false; solicitudes: estado != CERRADA)
  const fetchUnread = useRef(async () => {
    try {
      const res = await fetch('/api/v1/dashboard/unread-counts');
      if (res.ok) {
        const data = await res.json();
        setUnread({ contacto: data.contacto ?? 0, solicitudes: data.solicitudes ?? 0 });
      }
    } catch {
      /* silencioso: el badge no es crítico */
    }
  }).current;

  useEffect(() => {
    // Initialize dark mode - only apply to admin container, not html
    const savedDarkMode = localStorage.getItem('darkMode');
    const shouldBeDark = savedDarkMode === null ? true : savedDarkMode === 'true';

    setDarkMode(shouldBeDark);
    setMounted(true);

    let isMounted = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (isMounted) {
        setUser(user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Realtime: nuevas filas en MensajeContacto / SolicitudEmpleo (Supabase Postgres Changes)
  useEffect(() => {
    const channel = supabase
      .channel('admin-forms-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'MensajeContacto' },
        (payload) => {
          const nombre = (payload.new as { nombre?: string })?.nombre;
          notifications.show({
            title: 'Nuevo mensaje de contacto',
            message: nombre ? `De ${nombre}` : 'Revisá Mensajes de Contacto',
            color: 'blue',
          });
          window.dispatchEvent(new CustomEvent(REALTIME_EVENTS.contacto));
          fetchUnread();
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'SolicitudEmpleo' },
        (payload) => {
          const nw = payload.new as { nombre?: string; apellido?: string };
          const nombre = [nw?.nombre, nw?.apellido].filter(Boolean).join(' ');
          notifications.show({
            title: 'Nueva solicitud de empleo',
            message: nombre ? `De ${nombre}` : 'Revisá Solicitudes de Empleo',
            color: 'teal',
          });
          window.dispatchEvent(new CustomEvent(REALTIME_EVENTS.solicitudes));
          fetchUnread();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchUnread]);

  // Carga inicial de no leídos + recálculo cuando una vista marca leído/cambia estado
  useEffect(() => {
    fetchUnread();
    const onRefresh = () => fetchUnread();
    window.addEventListener(REALTIME_EVENTS.refreshBadges, onRefresh);
    return () => window.removeEventListener(REALTIME_EVENTS.refreshBadges, onRefresh);
  }, [fetchUnread]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('darkMode', darkMode ? 'true' : 'false');
      // Add/remove class on body for modals/dropdowns that render outside adminContainer
      if (darkMode) {
        document.body.classList.add('admin-dark-mode');
      } else {
        document.body.classList.remove('admin-dark-mode');
      }
    }
    // Cleanup: remove class when component unmounts or pathname changes
    return () => {
      const currentPath = window.location.pathname;
      const isGoingToAdminPage = currentPath.startsWith('/admin') && currentPath !== '/admin/login';
      if (!isGoingToAdminPage) {
        document.body.classList.remove('admin-dark-mode');
      }
    };
  }, [darkMode, mounted, pathname]);

  if (!mounted) {
    return (
      <div className={styles.loadingContainer}>
        <p>Cargando...</p>
      </div>
    );
  }

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const navItems = [
    { label: 'Dashboard', icon: 'dashboard', href: '/admin' },
    { label: 'Cuidadores', icon: 'people', href: '/admin/cuidadores' },
    { label: 'Personas Asistidas', icon: 'elderly', href: '/admin/personas-asistidas' },
    { label: 'Asignaciones', icon: 'assignment', href: '/admin/asignaciones' },
    { label: 'Liquidaciones', icon: 'receipt_long', href: '/admin/liquidaciones' },
    { label: 'Reportes', icon: 'bar_chart', href: '/admin/reportes' },
    { label: 'Contratos', icon: 'description', href: '/admin/contratos' },
    { label: 'Solicitudes de Empleo', icon: 'work', href: '/admin/solicitudes-empleo' },
    { label: 'Mensajes de Contacto', icon: 'mail', href: '/admin/contacto' },
    { label: 'Bot de WhatsApp', icon: 'smartphone', href: '/admin/whatsapp' },
  ];

  const currentPageTitle = navItems.find(item => item.href === pathname)?.label || 'Dashboard';

  return (
    <div className={`${styles.adminContainer} ${darkMode ? 'dark' : ''}`}>
      {/* Mobile Menu Overlay */}
      {sidebarOpen && (
        <div
          className={styles.mobileOverlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoContainer}>
            <span className="material-icons">medical_services</span>
            <h1 className={styles.logoTitle}>CareByDani</h1>
          </div>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const badge =
              item.href === '/admin/contacto'
                ? unread.contacto
                : item.href === '/admin/solicitudes-empleo'
                  ? unread.solicitudes
                  : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${pathname === item.href ? styles.navLinkActive : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="material-icons-outlined">{item.icon}</span>
                <span>{item.label}</span>
                {badge > 0 && <span className={styles.navBadge}>{badge > 99 ? '99+' : badge}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <button onClick={handleLogout} className={styles.logoutButton}>
            <span className="material-icons-outlined">logout</span>
            <span>Cerrar Sesión</span>
          </button>
          <Link href="/" className={styles.homeLink} onClick={() => setSidebarOpen(false)}>
            <span className="material-icons-outlined">home</span>
            <span>Volver al inicio</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Background Blur */}
        <div className={styles.backgroundBlur}></div>

        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              className={styles.mobileMenuButton}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle menu"
            >
              <span className="material-icons-outlined">menu</span>
            </button>
            <h2 className={styles.headerTitle}>{currentPageTitle}</h2>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.notificationButton}>
              <span className="material-icons-outlined">notifications</span>
              <span className={styles.notificationBadge}></span>
            </button>
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <UnstyledButton className={styles.userMenuButton}>
                  <div className={styles.userMenu}>
                    <div className={styles.userAvatar}>
                      {user?.email?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>Administrador</span>
                      <span className={styles.userEmail}>{user?.email || 'admin@carebydani.com'}</span>
                    </div>
                    <span className="material-icons-outlined">expand_more</span>
                  </div>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>{user?.email || 'admin@carebydani.com'}</Menu.Label>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<span className="material-icons-outlined" style={{ fontSize: '18px' }}>logout</span>}
                  color="red"
                  onClick={handleLogout}
                >
                  Cerrar Sesión
                </Menu.Item>
                <Menu.Item
                  leftSection={<span className="material-icons-outlined" style={{ fontSize: '18px' }}>home</span>}
                  component={Link}
                  href="/"
                >
                  Volver al inicio
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </div>
        </header>

        {/* Content */}
        <div className={styles.content}>
          {children}
        </div>
      </main>

      {/* Dark Mode Toggle */}
      <button onClick={toggleDarkMode} className={styles.darkModeToggle} type="button">
        {darkMode ? (
          <span className="material-icons">light_mode</span>
        ) : (
          <span className="material-icons">dark_mode</span>
        )}
      </button>
    </div>
  );
}
