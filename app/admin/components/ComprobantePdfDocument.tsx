import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    borderBottomWidth: 3,
    borderBottomColor: '#0A7D8C', // Teal from logo
    paddingBottom: 15,
  },
  logo: {
    width: 140,
    height: 140,
    objectFit: 'contain',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#0A7D8C',
  },
  subtitle: {
    fontSize: 16,
    color: '#ff3d75', // Fucsia accent
    marginTop: 4,
  },
  infoSection: {
    marginBottom: 20,
    backgroundColor: '#f8fafc', // Light grayish-blue bg
    padding: 15,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#0A7D8C',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 150,
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    color: '#334155',
  },
  infoValue: {
    fontSize: 12,
    color: '#0f172a',
  },
  table: {
    width: 'auto',
    marginTop: 20,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#0A7D8C', // Teal bg
    borderBottomWidth: 1,
    borderBottomColor: '#0A7D8C',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableColHeader: {
    padding: 10,
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: '#FFFFFF',
  },
  tableCol: {
    padding: 10,
    fontSize: 11,
    color: '#334155',
  },
  colFechas: { width: '40%' },
  colCuidadores: { width: '40%' },
  colHoras: { width: '20%' },
  totalSection: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: '#fff1f2', // Light fucsia bg
    padding: 15,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffe4e6',
  },
  totalLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 15,
    marginRight: 10,
    color: '#be123c', // Darker fucsia
  },
  totalValue: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: '#e11d48',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#64748b',
    fontSize: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
  }
});

export interface FilaPdfData {
  periodo: string;
  cuidadorNombre: string;
  horas: number;
  precioPorHora: number;
  subtotal: number;
}

export interface ComprobantePdfProps {
  personaNombre: string;
  fechaDesde: string;
  fechaHasta: string;
  filas: FilaPdfData[];
}

export const ComprobantePdfDocument: React.FC<ComprobantePdfProps> = ({
  personaNombre,
  fechaDesde,
  fechaHasta,
  filas,
}) => {
  const totalHorasGenerales = filas.reduce((acc, curr) => acc + curr.horas, 0);
  const totalLiquidacion = filas.reduce((acc, curr) => acc + curr.subtotal, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src="/image.png" style={styles.logo} />
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.title}>Comprobante de Asistencia</Text>
            <Text style={styles.subtitle}>Detalle Operativo y Liquidación</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Persona Asistida:</Text>
            <Text style={styles.infoValue}>{personaNombre}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Período de Liquidación:</Text>
            <Text style={styles.infoValue}>{fechaDesde} al {fechaHasta}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha de Emisión:</Text>
            <Text style={styles.infoValue}>{new Date().toLocaleDateString('es-AR')}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRowHeader}>
            <View style={[styles.tableColHeader, { width: '30%' }]}><Text>Período de Guardia</Text></View>
            <View style={[styles.tableColHeader, { width: '30%' }]}><Text>Cuidador</Text></View>
            <View style={[styles.tableColHeader, { width: '15%' }]}><Text>Horas</Text></View>
            <View style={[styles.tableColHeader, { width: '25%' }]}><Text>Precio x Hora</Text></View>
          </View>

          {filas.map((fila, index) => (
            <View style={styles.tableRow} key={index}>
              <View style={[styles.tableCol, { width: '30%' }]}><Text>{fila.periodo}</Text></View>
              <View style={[styles.tableCol, { width: '30%' }]}><Text>{fila.cuidadorNombre}</Text></View>
              <View style={[styles.tableCol, { width: '15%' }]}><Text>{fila.horas.toFixed(2)}h</Text></View>
              <View style={[styles.tableCol, { width: '25%' }]}><Text>${fila.precioPorHora.toLocaleString('es-AR', { minimumFractionDigits: 2, useGrouping: true })}</Text></View>
            </View>
          ))}
          
          {filas.length === 0 && (
             <View style={styles.tableRow}>
                <View style={{ width: '100%', padding: 8, fontSize: 10, textAlign: 'center' }}>
                   <Text>No hubo guardias registradas en este período.</Text>
                </View>
             </View>
          )}
        </View>

        <View style={styles.totalSection}>
          <View style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
            <View style={{ flexDirection: 'row' }}>
              <Text style={[styles.totalLabel, { color: '#334155', fontSize: 14 }]}>Total Horas Trabajadas:</Text>
              <Text style={[styles.totalValue, { color: '#334155', fontSize: 14 }]}>{totalHorasGenerales.toFixed(2)}h</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <Text style={styles.totalLabel}>Total Liquidación:</Text>
              <Text style={styles.totalValue}>${totalLiquidacion.toLocaleString('es-AR', { minimumFractionDigits: 2, useGrouping: true })}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Este documento es un comprobante de servicio emitido de forma automatizada por Care By Dani.</Text>
        </View>
      </Page>
    </Document>
  );
};
