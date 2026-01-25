'use client';

import { useEffect, useState } from 'react';
import styles from './dashboard.module.css';

interface DashboardStats {
  totalCuidadores: number;
  totalPagos: number;
  saldoTotalMes: number;
  pagosPendientes: number;
  actividades: ActivityItem[];
  tendencias: {
    cuidadores: {
      porcentaje: number;
      valor: number;
    };
    saldo: {
      porcentaje: number;
      valor: number;
    };
  };
  progreso: {
    cuidadores: number;
    pagos: number;
    saldo: number;
  };
}

interface ActivityItem {
  id: string;
  type: 'person_add' | 'payment' | 'warning' | 'assignment';
  title: string;
  description: string;
  time: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/v1/dashboard/stats');
        const result = await response.json();

        if (!result.ok) {
          throw new Error(result.error || 'Error al cargar estadísticas');
        }

        setStats(result.data);
        setActivities(result.data.actividades || []);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className={styles.dashboard}>
      <div className={styles.welcomeSection}>
        <h3 className={styles.welcomeTitle}>Bienvenido de nuevo, Admin</h3>
        <p className={styles.welcomeSubtitle}>Aquí está el resumen de la actividad de hoy.</p>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        {/* Cuidadores Card */}
        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <div className={`${styles.statIcon} ${styles.statIconPink}`}>
              <span className="material-icons-outlined">people_outline</span>
            </div>
            <span className={styles.statTrend}>
              <span className="material-icons">
                {stats?.tendencias?.cuidadores?.porcentaje && stats.tendencias.cuidadores.porcentaje >= 0
                  ? 'trending_up'
                  : 'trending_down'}
              </span>
              {stats?.tendencias?.cuidadores?.porcentaje !== undefined
                ? `${stats.tendencias.cuidadores.porcentaje >= 0 ? '+' : ''}${stats.tendencias.cuidadores.porcentaje.toFixed(1)}%`
                : '0%'}
            </span>
          </div>
          <div className={styles.statContent}>
            <h4 className={styles.statLabel}>Cuidadores</h4>
            {loading ? (
              <div className={styles.loading}>Cargando...</div>
            ) : error ? (
              <div className={styles.error}>Error</div>
            ) : (
              <div className={styles.statValue}>
                <span className={styles.statNumber}>{stats?.totalCuidadores ?? 124}</span>
                <span className={styles.statSubtext}>Total registrados</span>
              </div>
            )}
          </div>
          <div className={styles.statProgress}>
            <div
              className={`${styles.statProgressBar} ${styles.statProgressPink}`}
              style={{ width: `${stats?.progreso?.cuidadores ?? 0}%` }}
            ></div>
          </div>
        </div>

        {/* Pagos Pendientes Card */}
        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <div className={`${styles.statIcon} ${styles.statIconPrimary}`}>
              <span className="material-icons-outlined">receipt</span>
            </div>
            <span className={`${styles.statTrend} ${styles.statTrendNeutral}`}>
              <span className="material-icons">remove</span>
              {stats?.pagosPendientes !== undefined ? stats.pagosPendientes : 0}
            </span>
          </div>
          <div className={styles.statContent}>
            <h4 className={styles.statLabel}>Pagos</h4>
            {loading ? (
              <div className={styles.loading}>Cargando...</div>
            ) : error ? (
              <div className={styles.error}>Error</div>
            ) : (
              <div className={styles.statValue}>
                <span className={styles.statNumber}>{stats?.pagosPendientes ?? 0}</span>
                <span className={styles.statSubtext}>Por procesar</span>
              </div>
            )}
          </div>
          <div className={styles.statProgress}>
            <div
              className={`${styles.statProgressBar} ${styles.statProgressPrimary}`}
              style={{ width: `${stats?.progreso?.pagos ?? 0}%` }}
            ></div>
          </div>
        </div>

        {/* Saldo Total Card */}
        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <div className={`${styles.statIcon} ${styles.statIconGold}`}>
              <span className="material-icons-outlined">account_balance_wallet</span>
            </div>
            <span className={styles.statTrend}>
              <span className="material-icons">
                {stats?.tendencias?.saldo?.porcentaje && stats.tendencias.saldo.porcentaje >= 0
                  ? 'trending_up'
                  : 'trending_down'}
              </span>
              {stats?.tendencias?.saldo?.porcentaje !== undefined
                ? `${stats.tendencias.saldo.porcentaje >= 0 ? '+' : ''}${stats.tendencias.saldo.porcentaje.toFixed(1)}%`
                : '0%'}
            </span>
          </div>
          <div className={styles.statContent}>
            <h4 className={styles.statLabel}>Saldo Total</h4>
            {loading ? (
              <div className={styles.loading}>Cargando...</div>
            ) : error ? (
              <div className={styles.error}>Error</div>
            ) : (
              <div className={styles.statValue}>
                <span className={styles.statNumber}>
                  ${stats?.saldoTotalMes.toLocaleString('es-AR') ?? '14,250'}
                </span>
                <span className={styles.statSubtext}>Este mes</span>
              </div>
            )}
          </div>
          <div className={styles.statProgress}>
            <div
              className={`${styles.statProgressBar} ${styles.statProgressGold}`}
              style={{ width: `${stats?.progreso?.saldo ?? 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Activity Section */}
      <div className={styles.activitySection}>
        <div className={styles.activityCard}>
          <div className={styles.activityHeader}>
            <h3 className={styles.activityTitle}>Actividad Reciente</h3>
            <button className={styles.activityViewAll}>Ver todo</button>
          </div>
          <div className={styles.activityList}>
            {loading ? (
              <div className={styles.loading}>Cargando actividades...</div>
            ) : activities.length === 0 ? (
              <div className={styles.loading}>No hay actividades recientes</div>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className={styles.activityItem}>
                  <div className={`${styles.activityIcon} ${styles[`activityIcon${activity.type}`]}`}>
                    <span className="material-icons">{activity.type}</span>
                  </div>
                  <div className={styles.activityContent}>
                    <p className={styles.activityItemTitle}>{activity.title}</p>
                    <p className={styles.activityItemDescription}>{activity.description}</p>
                  </div>
                  <span className={styles.activityTime}>{activity.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
