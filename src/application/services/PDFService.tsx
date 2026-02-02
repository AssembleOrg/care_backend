import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import React from 'react';
import { Pago } from '@/src/domain/entities/Pago';
import { Cuidador } from '@/src/domain/entities/Cuidador';
import { PersonaAsistida } from '@/src/domain/entities/PersonaAsistida';

const PAGE_SIZE = { width: 595, height: 842 };

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontSize: 11,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#ff3d75',
    padding: 30,
    color: '#ffffff',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
  },
  content: {
    padding: 30,
    paddingTop: 0,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    borderBottom: '2 solid #ff3d75',
    paddingBottom: 5,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 10,
    color: '#666',
    width: 140,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 11,
    color: '#333',
    flex: 1,
    fontWeight: 'normal',
  },
  table: {
    marginTop: 10,
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderBottom: '1 solid #ddd',
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #eee',
  },
  tableCell: {
    fontSize: 10,
    color: '#333',
    flex: 1,
  },
  totalSection: {
    marginTop: 25,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    border: '2 solid #ff3d75',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff3d75',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1 solid #ddd',
    fontSize: 9,
    color: '#666',
    textAlign: 'center',
  },
  badge: {
    backgroundColor: '#ff3d75',
    color: '#ffffff',
    padding: '4 8',
    borderRadius: 3,
    fontSize: 9,
    fontWeight: 'bold',
    marginRight: 5,
  },
});

interface HorarioLiquidacion {
  dia: number;
  diaNombre?: string;
  horaInicio: string;
  horaFin: string;
  horas: number;
}

interface ReciboData {
  pago: Pago & {
    horarios?: HorarioLiquidacion[];
  };
  cuidador: Cuidador;
  persona?: PersonaAsistida;
}

const ReciboPDF: React.FC<{ data: ReciboData }> = ({ data }) => {
  const { pago, cuidador, persona } = data;

  // Decrypt data for display
  const cuidadorNombre = cuidador.nombreCompleto;
  const personaNombre = persona?.nombreCompleto || 'N/A';

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  // Todos los pagos son liquidaciones ahora
  const esLiquidacion = true;
  const precioPorHora = pago.precioPorHora;
  const horasTrabajadas = pago.horasTrabajadas;
  const horarios = pago.horarios;
  const semanaInicio = pago.semanaInicio;
  const semanaFin = pago.semanaFin;

  const getDiaNombre = (dia: number): string => {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[dia] || `Día ${dia + 1}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {esLiquidacion ? 'LIQUIDACIÓN DE HONORARIOS' : 'RECIBO DE PAGO'}
          </Text>
          <Text style={styles.headerSubtitle}>
            CareByDani - Sistema de Gestión de Cuidadores
          </Text>
        </View>

        <View style={styles.content}>
          {/* Información General */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información General</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fecha de emisión:</Text>
              <Text style={styles.infoValue}>{formatDate(pago.fecha)}</Text>
            </View>
            {esLiquidacion && semanaInicio && semanaFin && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Período trabajado:</Text>
                <Text style={styles.infoValue}>
                  {formatDate(new Date(semanaInicio))} - {formatDate(new Date(semanaFin))}
                </Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Número de recibo:</Text>
              <Text style={styles.infoValue}>#{pago.id.substring(0, 8).toUpperCase()}</Text>
            </View>
          </View>

          {/* Información del Cuidador y Persona Asistida */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Datos del Servicio</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cuidador:</Text>
              <Text style={styles.infoValue}>{cuidadorNombre}</Text>
            </View>
            {persona && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Persona Asistida:</Text>
                <Text style={styles.infoValue}>{personaNombre}</Text>
              </View>
            )}
          </View>

          {/* Detalle de Liquidación */}
          {esLiquidacion && precioPorHora && horasTrabajadas && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Detalle de Liquidación</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Precio por hora:</Text>
                <Text style={styles.infoValue}>{formatCurrency(Number(precioPorHora))}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Horas trabajadas:</Text>
                <Text style={styles.infoValue}>{Number(horasTrabajadas).toFixed(2)} horas</Text>
              </View>
              {horarios && Array.isArray(horarios) && horarios.length > 0 && (
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={styles.tableHeaderCell}>Día</Text>
                    <Text style={styles.tableHeaderCell}>Horario</Text>
                    <Text style={styles.tableHeaderCell}>Horas</Text>
                  </View>
                  {(horarios as HorarioLiquidacion[])
                    .filter((h) => h.horas > 0)
                    .map((h, idx: number) => (
                      <View key={idx} style={styles.tableRow}>
                        <Text style={styles.tableCell}>{h.diaNombre || getDiaNombre(h.dia)}</Text>
                        <Text style={styles.tableCell}>{h.horaInicio} - {h.horaFin}</Text>
                        <Text style={styles.tableCell}>{h.horas.toFixed(2)}h</Text>
                      </View>
                    ))}
                </View>
              )}
            </View>
          )}

          {/* Método de Pago */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información de Pago</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Método de pago:</Text>
              <Text style={styles.infoValue}>{pago.metodo}</Text>
            </View>
            {pago.nota && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Notas:</Text>
                <Text style={styles.infoValue}>{pago.nota}</Text>
              </View>
            )}
          </View>

          {/* Total */}
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL A PAGAR</Text>
              <Text style={styles.totalAmount}>{formatCurrency(pago.monto)}</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text>Este documento es generado automáticamente por el sistema CareByDani</Text>
            <Text style={{ marginTop: 5 }}>
              Fecha de generación: {new Date().toLocaleString('es-AR')}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export class PDFService {
  async generateRecibo(data: ReciboData): Promise<Buffer> {
    const buffer = await renderToBuffer(<ReciboPDF data={data} />);
    return buffer;
  }
}

export const pdfService = new PDFService();
