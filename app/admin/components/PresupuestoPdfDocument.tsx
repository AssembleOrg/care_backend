import React from 'react';
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
  Font,
  Svg,
  Path,
  Defs,
  LinearGradient,
  Stop,
  Rect,
} from '@react-pdf/renderer';

const TEAL = '#0A7D8C';
const TEAL_DARK = '#0d6f7a';
const GREEN = '#4faa8b';
const FUCSIA = '#e8497f';
/** Celeste del subtítulo "Human Care & Nursing". */
const CELESTE = '#3fa7ad';
const ICON_BG = '#e8f4f2';
/** Ancho de una página A4 en puntos; el Svg del degradado necesita medidas concretas. */
const A4_WIDTH = 595.28;
const BAR_HEIGHT = 42;
const TEXT_DARK = '#334155';
const TEXT_SOFT = '#5b6b7a';

// El diseño no corta palabras con guión al final de renglón.
Font.registerHyphenationCallback((word) => [word]);

Font.register({
  family: 'Poppins',
  fonts: [
    { src: '/fonts/Poppins-Regular.ttf', fontWeight: 400 },
    { src: '/fonts/Poppins-Medium.ttf', fontWeight: 500 },
    { src: '/fonts/Poppins-SemiBold.ttf', fontWeight: 600 },
    { src: '/fonts/Poppins-BoldItalic.ttf', fontWeight: 600, fontStyle: 'italic' },
  ],
});

// Trazos tomados de @tabler/icons-react (MIT), viewBox 24x24.
const PATHS = {
  clock:
    'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0 M12 7v5l3 3',
  calendar:
    'M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z M16 3v4 M8 3v4 M4 11h16 M11 15h1 M12 15v3',
  currency:
    'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0 M14.8 9a2 2 0 0 0 -1.8 -1h-2a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4h-2a2 2 0 0 1 -1.8 -1 M12 6v2 M12 16v2',
  // Casa con corazón dentro (tabler: home + heart)
  home:
    'M19 8.71l-5.333 -4.148a2.666 2.666 0 0 0 -3.274 0l-5.334 4.148a2.665 2.665 0 0 0 -1.029 2.105v7.2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-7.2c0 -.823 -.38 -1.6 -1.03 -2.105',
  homeHeart:
    'M15.05 13.32l-3.05 2.93l-3.05 -2.93a1.9 1.9 0 0 1 0 -2.71a1.98 1.98 0 0 1 2.79 0l.26 .25l.26 -.25a1.98 1.98 0 0 1 2.79 0a1.9 1.9 0 0 1 0 2.71',
  whatsapp:
    'M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9 M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1',
  instagram:
    'M4 4m0 4a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0 M16.5 7.5l0 .01',
  mapPin:
    'M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0 M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z',
  user:
    'M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0 M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2',
};

/** Icono de línea dentro de un círculo claro, como en el diseño. */
const IconCircle: React.FC<{
  d: string;
  d2?: string;
  size?: number;
  bg?: string;
  color?: string;
}> = ({ d, d2, size = 26, bg = ICON_BG, color = GREEN }) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: bg,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}
  >
    <Svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24">
      <Path d={d} stroke={color} strokeWidth={1.7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {d2 ? (
        <Path d={d2} stroke={color} strokeWidth={1.7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
    </Svg>
  </View>
);

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  body: {
    paddingHorizontal: 34,
    paddingTop: 26,
    flexGrow: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  logo: {
    width: 138,
    height: 138,
    objectFit: 'contain',
    marginTop: -6,
    marginLeft: -6,
  },
  headerCenter: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 6,
  },
  brand: {
    fontSize: 25,
    fontWeight: 600,
    color: TEAL,
  },
  brandSub: {
    fontSize: 12.5,
    color: CELESTE,
    marginTop: 1,
  },
  brandRule: {
    marginTop: 9,
    height: 1,
    width: 120,
    backgroundColor: '#bcdfe3',
  },
  tagline: {
    fontSize: 11.5,
    fontWeight: 600,
    color: TEXT_DARK,
    marginTop: 12,
  },
  taglineAccent: {
    fontSize: 14,
    fontWeight: 600,
    fontStyle: 'italic',
    color: TEAL,
    marginTop: 1,
  },

  headerRight: {
    width: 150,
    alignItems: 'center',
    paddingTop: 22,
    flexShrink: 0,
  },
  docTitle: {
    fontSize: 17.5,
    fontWeight: 600,
    color: TEAL,
    letterSpacing: 0.4,
  },
  docTitleRule: {
    marginTop: 7,
    height: 1.6,
    width: 138,
    backgroundColor: '#bcdfe3',
  },
  fechaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  fechaLabel: {
    fontSize: 9.5,
    fontWeight: 600,
    color: TEXT_DARK,
  },
  fechaValue: {
    fontSize: 9.5,
    color: TEXT_SOFT,
    marginTop: 2,
  },

  servicioBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f7f7',
    borderRadius: 10,
    padding: 16,
    marginBottom: 18,
  },
  servicioCol: {
    // Ancho explícito: el texto no respeta los límites del contenedor
    // solo con flexGrow/flexShrink.
    // A4 (595.28) - body (34*2) - padding caja (16*2) - icono (46) - gap (14).
    width: A4_WIDTH - 68 - 32 - 46 - 14,
    marginLeft: 14,
  },
  servicioTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: TEAL,
    marginBottom: 6,
  },
  servicioText: {
    fontSize: 8.8,
    color: TEXT_SOFT,
    lineHeight: 1.65,
  },

  detalleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eceff1',
  },
  detalleLabel: {
    width: 130,
    marginLeft: 12,
    fontSize: 9.5,
    fontWeight: 600,
    color: TEXT_DARK,
  },
  detalleValue: {
    fontSize: 9.5,
    color: TEXT_SOFT,
  },

  totalBox: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f7f7',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: TEAL,
  },
  totalDivider: {
    width: 1,
    height: 34,
    backgroundColor: '#cfdcdd',
    marginHorizontal: 20,
  },
  totalValue: {
    fontSize: 30,
    fontWeight: 600,
    color: TEAL,
  },

  cierreZone: {
    flexDirection: 'row',
    marginTop: 16,
  },
  cierreCol: {
    width: 300,
    paddingTop: 4,
  },
  cierreText: {
    fontSize: 8.8,
    color: TEXT_SOFT,
    lineHeight: 1.65,
  },
  firmaLabel: {
    marginTop: 30,
    fontSize: 9,
    color: TEXT_DARK,
  },
  firmaLine: {
    marginTop: 26,
    width: 155,
    height: 1,
    backgroundColor: '#a8b4bd',
  },
  firmaCaption: {
    marginTop: 5,
    width: 155,
    textAlign: 'center',
    fontSize: 8,
    color: FUCSIA,
  },
  manosImg: {
    width: 158,
    height: 118,
    objectFit: 'contain',
    marginTop: -6,
    marginRight: 4,
  },

  contactoBox: {
    backgroundColor: '#f2f7f7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 34,
  },
  contactoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },
  contactoTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: TEAL,
    letterSpacing: 0.6,
  },
  contactoTitleRule: {
    height: 1,
    width: 30,
    backgroundColor: '#bcdfe3',
    marginHorizontal: 7,
  },
  contactoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  contactoItemText: {
    fontSize: 8.6,
    color: TEXT_DARK,
    marginLeft: 8,
  },
  contactoDivider: {
    width: 1,
    height: 62,
    backgroundColor: '#d5e2e3',
    marginHorizontal: 18,
  },
  contactoRightText: {
    fontSize: 8.6,
    color: TEXT_SOFT,
    lineHeight: 1.65,
  },
  manoCorazonImg: {
    width: 56,
    height: 56,
    objectFit: 'contain',
    marginLeft: 12,
  },

  bottomBar: {
    height: BAR_HEIGHT,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBarText: {
    position: 'absolute',
    top: 9,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bottomBarTitle: {
    fontSize: 10.5,
    fontWeight: 600,
    color: '#FFFFFF',
  },
  bottomBarSub: {
    fontSize: 7,
    color: '#d9eff0',
    marginTop: 2,
    letterSpacing: 0.8,
  },
});

export interface PresupuestoPdfProps {
  /** Persona que recibe el presupuesto. */
  cliente: string;
  fecha: string;
  cargaHoraria: string;
  totalSemanal: string;
  valorPorHora: string;
  total: string;
  /** Rutas de imagen. Por defecto las públicas, que resuelven en el navegador. */
  logoSrc?: string;
  manosSrc?: string;
  manoCorazonSrc?: string;
}

export const PresupuestoPdfDocument: React.FC<PresupuestoPdfProps> = ({
  cliente,
  fecha,
  cargaHoraria,
  totalSemanal,
  valorPorHora,
  total,
  logoSrc = '/logo-pdf.png',
  manosSrc = '/2manos-corazon.png',
  manoCorazonSrc = '/mano-corazon.png',
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.body}>
        {/* Header */}
        <View style={styles.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image no acepta alt */}
          <Image src={logoSrc} style={styles.logo} />
          <View style={styles.headerCenter}>
            <Text style={styles.brand}>Care By Dani</Text>
            <Text style={styles.brandSub}>Human Care &amp; Nursing</Text>
            <View style={styles.brandRule} />
            <Text style={styles.tagline}>Cuidado profesional,</Text>
            <Text style={styles.taglineAccent}>trato humano.</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docTitle}>PRESUPUESTO</Text>
            <View style={styles.docTitleRule} />
            <View style={styles.fechaRow}>
              <IconCircle d={PATHS.calendar} size={26} />
              <View style={{ marginLeft: 9 }}>
                <Text style={styles.fechaLabel}>Fecha:</Text>
                <Text style={styles.fechaValue}>{fecha}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Servicio */}
        <View style={styles.servicioBox}>
          <IconCircle d={PATHS.home} d2={PATHS.homeHeart} size={46} bg="#e3f1ee" />
          <View style={styles.servicioCol}>
            <Text style={styles.servicioTitle}>SERVICIO: CUIDADO DOMICILIARIO</Text>
            <Text style={styles.servicioText}>
              Se presenta el siguiente presupuesto para la prestación de servicios de cuidado
              domiciliario, de acuerdo con el siguiente detalle:
            </Text>
          </View>
        </View>

        {/* Detalle */}
        <View style={styles.detalleRow}>
          <IconCircle d={PATHS.user} />
          <Text style={styles.detalleLabel}>Cliente:</Text>
          <Text style={styles.detalleValue}>{cliente}</Text>
        </View>
        <View style={styles.detalleRow}>
          <IconCircle d={PATHS.clock} />
          <Text style={styles.detalleLabel}>Carga horaria:</Text>
          <Text style={styles.detalleValue}>{cargaHoraria}</Text>
        </View>
        <View style={styles.detalleRow}>
          <IconCircle d={PATHS.calendar} />
          <Text style={styles.detalleLabel}>Total semanal:</Text>
          <Text style={styles.detalleValue}>{totalSemanal}</Text>
        </View>
        <View style={styles.detalleRow}>
          <IconCircle d={PATHS.currency} />
          <Text style={styles.detalleLabel}>Valor por hora:</Text>
          <Text style={styles.detalleValue}>{valorPorHora}</Text>
        </View>

        {/* Total */}
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>TOTAL SEMANAL:</Text>
          <View style={styles.totalDivider} />
          <Text style={styles.totalValue}>{total}</Text>
        </View>

        {/* Cierre + firma + ilustración */}
        <View style={styles.cierreZone}>
          <View style={styles.cierreCol}>
            <Text style={styles.cierreText}>
              Este presupuesto corresponde al servicio de cuidado domiciliario según las condiciones
              detalladas anteriormente.
            </Text>
            <Text style={styles.firmaLabel}>Atentamente,</Text>
            <View style={styles.firmaLine} />
            <Text style={styles.firmaCaption}>Firma</Text>
          </View>
          <View style={{ flexGrow: 1, alignItems: 'flex-end' }}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image no acepta alt */}
            <Image src={manosSrc} style={styles.manosImg} />
          </View>
        </View>
      </View>

      {/* Footer contacto */}
      <View style={styles.contactoBox}>
        <View>
          <View style={styles.contactoTitleRow}>
            <Text style={styles.contactoTitle}>CONTACTO</Text>
            <View style={styles.contactoTitleRule} />
          </View>
          <View style={styles.contactoItem}>
            <IconCircle d={PATHS.whatsapp} size={19} bg="#dff3ea" />
            <Text style={styles.contactoItemText}>+54 9 11 7136-2057</Text>
          </View>
          <View style={styles.contactoItem}>
            <IconCircle d={PATHS.instagram} size={19} bg="#fde8f0" color={FUCSIA} />
            <Text style={styles.contactoItemText}>danielgodoy936</Text>
          </View>
          <View style={styles.contactoItem}>
            <IconCircle d={PATHS.mapPin} size={19} bg="#dff3ea" />
            <Text style={styles.contactoItemText}>Buenos Aires, Argentina</Text>
          </View>
        </View>

        <View style={styles.contactoDivider} />

        <View style={{ width: 190 }}>
          <Text style={styles.contactoRightText}>
            En <Text style={{ fontWeight: 600, color: TEAL }}>Care By Dani</Text> cuidamos con el
            corazón, porque cada persona merece respeto, dignidad y amor.
          </Text>
        </View>

        {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image no acepta alt */}
        <Image src={manoCorazonSrc} style={styles.manoCorazonImg} />
      </View>

      {/* Barra inferior con degradado */}
      <View style={styles.bottomBar}>
        {/* A4 mide 595.28pt de ancho; el Svg necesita medidas concretas. */}
        <Svg
          width={A4_WIDTH}
          height={BAR_HEIGHT}
          viewBox={`0 0 ${A4_WIDTH} ${BAR_HEIGHT}`}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <Defs>
            <LinearGradient id="barra" x1="0" y1="0" x2={A4_WIDTH} y2="0" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={TEAL_DARK} />
              <Stop offset="1" stopColor={GREEN} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={A4_WIDTH} height={BAR_HEIGHT} fill="url(#barra)" />
        </Svg>
        <View style={styles.bottomBarText}>
          <Text style={styles.bottomBarTitle}>Care By Dani – Human Care &amp; Nursing</Text>
          <Text style={styles.bottomBarSub}>CUIDAMOS PERSONAS, ACOMPAÑAMOS VIDAS</Text>
        </View>
      </View>
    </Page>
  </Document>
);
