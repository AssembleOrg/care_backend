import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Estilos
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: 'bold',
    textDecoration: 'underline',
  },
  section: {
    marginBottom: 8,
    lineHeight: 1.5,
    textAlign: 'justify',
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
    fontWeight: 'bold',
  },
  signatureSection: {
    marginTop: 100,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: 40,
  },
  signatureBox: {
    width: '40%',
    borderTopWidth: 1,
    borderColor: '#000',
    paddingTop: 5,
    alignItems: 'center',
  },
});

interface ContratoPDFProps {
  nombre: string;
  cuit: string;
  direccion: string;
  telefonoEmergencia: string;
  fechaInicio: string;
  fechaFin: string;
}

export const ContratoPDF = ({
  nombre,
  cuit,
  direccion,
  telefonoEmergencia,
  fechaInicio,
  fechaFin
}: ContratoPDFProps) => {

  // Fecha de firma (HOY)
  const today = new Date();
  const signDay = today.getDate();
  const signMonth = today.toLocaleString('es-AR', { month: 'long' }).toUpperCase();
  const signYear = today.getFullYear();

  // Formateo de fechas de vigencia (Entradas)
  const formatOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
  const startDate = new Date(fechaInicio).toLocaleDateString('es-AR', formatOptions);
  const endDate = new Date(fechaFin).toLocaleDateString('es-AR', formatOptions);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>CONTRATO DE LOCACIÓN DE SERVICIOS</Text>

        <View style={styles.section}>
          <Text>
            En la ciudad de Buenos Aires, a los <Text style={styles.bold}>{signDay}</Text> días del mes de <Text style={styles.bold}>{signMonth}</Text> de <Text style={styles.bold}>{signYear}</Text>, entre <Text style={styles.bold}>EMMESOL S.A</Text> C.U.I.T N° 30-71305050-0 y domicilio en Alicia Moreau de Justo 1930 Piso 3° Of. “308” C.A.B.A, representada en este acto por su Presidente Sra. Mariana Laura Perdiechizi D.N.I. 18.598.654 en adelante “EL COMITENTE” y <Text style={styles.bold}>{nombre}</Text> CUIT <Text style={styles.bold}>{cuit}</Text>, con domicilio en <Text style={styles.bold}>{direccion}</Text> y teléfono de contacto/emergencia <Text style={styles.bold}>{telefonoEmergencia}</Text>, Provincia de Buenos Aires, en adelante el “PRESTADOR DE SERVICIOS” se conviene celebrar este “CONTRATO DE LOCACIÓN DE SERVICIOS” sujeto a las siguientes cláusulas y condiciones el cual se regirá por los términos del Art. 1251 y sstes. y cctes. del Código Civil y Comercial de la Nación:
          </Text>
        </View>

        <View style={styles.section}>
          <Text>
            <Text style={styles.bold}>PRIMERA: OBJETO.</Text> a) EL PRESTADOR DEL SERVICIO prestará al COMITENTE los servicios de Visita Médica, Kinesiología, Enfermería, Servicios de Cuidador, Fonoaudiología, Atención Terapéutica, Terapia Ocupacional y Psicología a requerimiento y solicitud del COMITENTE, con expresa indicación de tipo y lugar de la prestación así como también la organización del tiempo y forma en la que lo hará, todo ello con personal profesional matriculado en cada disciplina y supervisado por los responsables de <Text style={styles.bold}>{nombre}</Text> a cuyo cargo se encuentran y sujeto a satisfacción de EMMESOL S.A., y sus pacientes o contratistas pudiendo en cualquier momento auditar a <Text style={styles.bold}>{nombre}</Text> respecto de los servicios que presta para EMMESOL S.A.
          </Text>
          <Text style={{ marginTop: 5 }}>
            b) En caso de requerirlo, el PRESTADOR DEL SERVICIO, estará obligado a presentar un informe detallado y pormenorizado del estado y situación de un determinado paciente el cual deberá estar firmado por el Director Médico de <Text style={styles.bold}>{nombre}</Text> y sus responsables.
          </Text>
        </View>

        <View style={styles.section}>
          <Text>
            <Text style={styles.bold}>SEGUNDA: PERSONAL:</Text> EL PRESTADOR DEL SERVICIO se compromete a tener a su cargo profesionales de la matrícula que corresponda a cada especialidad y registrarlo correctamente según la normativa laboral y legal vigente.
          </Text>
          <Text style={{ marginTop: 5 }}>
            Así mismo se compromete a entregar al COMITENTE un listado pormenorizado trimestral con el personal que se encuentre brindando servicios para EMMESOL S.A con el correspondiente alta en AFIP y en los organismos de la Seguridad Social y sindicales que corresponda mostrando la relación de dependencia de su personal así como también a presentar ante EMMESOL S.A. el correspondiente contrato de póliza de la A.R.T. obligatorio de dicho personal, EL PRESTADOR DE SERVICIOS se compromete expresamente a mantener indemne a EMMESOL S.A. frente a cualquier reclamo sea este civil, comercial, laboral, penal o de cualquier otra índole respecto del personal a cargo del PRESTADOR DE SERVICIOS en cualquier instancia o forma que sea requerido el COMITENTE.
          </Text>
        </View>

        <View style={styles.section}>
          <Text>
            <Text style={styles.bold}>TERCERA: CONTRATACIÓN DEL SEGURO MALA PRAXIS.</Text> EL PRESTADOR DE SERVICIOS se compromete a entregar a EMMESOL S.A. una copia del seguro de mala praxis médica profesional que cual declara bajo juramento es el real y vigente a la firma del presente acuerdo y el COMITENTE en la Av. Alicia Moreau de Justo 1930 piso 3° of. “308” de la Ciudad Autónoma de Buenos Aires.
          </Text>
        </View>

        {/* VIGENCIA */}
        <View style={styles.section}>
          <Text>
            <Text style={styles.bold}>CUARTA: VIGENCIA.</Text> El presente contrato tendrá vigencia a partir del día <Text style={styles.bold}>{startDate}</Text> hasta el día <Text style={styles.bold}>{endDate}</Text>, pudiendo ser renovado o modificado únicamente mediante acuerdo expreso y por escrito entre ambas partes.
          </Text>
        </View>

        <View style={styles.section}>
          <Text>
            Ambas partes se someten a la competencia ordinaria de los Tribunales Ordinarios de la Ciudad de Buenos Aires para todos los efectos derivados de este contrato y renuncian a cualquier otro fuero o jurisdicción que pudiera corresponderles. En prueba de conformidad se firman dos ejemplares de un mismo tenor.
          </Text>
        </View>

        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text>Firma</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};