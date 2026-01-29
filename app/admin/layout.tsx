'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/src/infrastructure/supabase/client';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { Menu, UnstyledButton } from '@mantine/core';
import styles from './admin.module.css';
import './admin-globals.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const supabase = createClient();

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
      if (pathname?.startsWith('/admin') && pathname !== '/admin/login') {
        // Only keep class if still in admin area
        return;
      }
      document.body.classList.remove('admin-dark-mode');
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
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${pathname === item.href ? styles.navLinkActive : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="material-icons-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
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
