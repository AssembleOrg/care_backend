import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import React from 'react';
import { Pago } from '@/src/domain/entities/Pago';
import { Cuidador } from '@/src/domain/entities/Cuidador';
import { PersonaAsistida } from '@/src/domain/entities/PersonaAsistida';

const PAGE_SIZE = { width: 595, height: 842 };

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 15,
  },
  label: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  total: {
    marginTop: 20,
    paddingTop: 15,
    borderTop: '1 solid #000',
    fontSize: 16,
    fontWeight: 'bold',
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
    esLiquidacion?: boolean;
    precioPorHora?: number | null;
    horasTrabajadas?: number | null;
    horarios?: HorarioLiquidacion[];
    semanaInicio?: Date | string | null;
    semanaFin?: Date | string | null;
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

  const esLiquidacion = pago.esLiquidacion || false;
  const precioPorHora = pago.precioPorHora;
  const horasTrabajadas = pago.horasTrabajadas;
  const horarios = pago.horarios;
  const semanaInicio = pago.semanaInicio;
  const semanaFin = pago.semanaFin;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>
          {esLiquidacion ? 'LIQUIDACIÓN DE HONORARIOS' : 'RECIBO DE PAGO'}
        </Text>

        <View style={styles.section}>
          <Text style={styles.label}>Fecha:</Text>
          <Text style={styles.value}>{formatDate(pago.fecha)}</Text>
        </View>

        {esLiquidacion && semanaInicio && semanaFin && (
          <View style={styles.section}>
            <Text style={styles.label}>Período:</Text>
            <Text style={styles.value}>
              {formatDate(new Date(semanaInicio))} - {formatDate(new Date(semanaFin))}
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Cuidador:</Text>
          <Text style={styles.value}>{cuidadorNombre}</Text>
        </View>

        {persona && (
          <View style={styles.section}>
            <Text style={styles.label}>Persona Asistida:</Text>
            <Text style={styles.value}>{personaNombre}</Text>
          </View>
        )}

        {esLiquidacion && precioPorHora && horasTrabajadas && (
          <>
            <View style={styles.section}>
              <Text style={styles.label}>Precio por hora:</Text>
              <Text style={styles.value}>{formatCurrency(Number(precioPorHora))}</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>Horas trabajadas:</Text>
              <Text style={styles.value}>{Number(horasTrabajadas).toFixed(2)} horas</Text>
            </View>
            {horarios && Array.isArray(horarios) && horarios.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.label}>Detalle de horarios:</Text>
                {(horarios as HorarioLiquidacion[])
                  .filter((h) => h.horas > 0)
                  .map((h, idx: number) => (
                    <Text key={idx} style={styles.value}>
                      {h.diaNombre || `Día ${h.dia + 1}`}: {h.horaInicio} - {h.horaFin} ({h.horas.toFixed(2)}h)
                    </Text>
                  ))}
              </View>
            )}
          </>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Método de Pago:</Text>
          <Text style={styles.value}>{pago.metodo}</Text>
        </View>

        {pago.nota && (
          <View style={styles.section}>
            <Text style={styles.label}>Nota:</Text>
            <Text style={styles.value}>{pago.nota}</Text>
          </View>
        )}

        <View style={styles.row}>
          <Text style={styles.total}>Total:</Text>
          <Text style={styles.total}>{formatCurrency(pago.monto)}</Text>
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
