/**
 * Traduce mensajes de error comunes al español
 */
function translateError(message: string): string {
  const translations: Record<string, string> = {
    // Errores de validación comunes
    'Invalid email address': 'Dirección de correo electrónico inválida',
    'Invalid email': 'Correo electrónico inválido',
    'Required': 'Este campo es obligatorio',
    'Required field': 'Este campo es obligatorio',
    'Invalid format': 'Formato inválido',
    'Invalid date': 'Fecha inválida',
    'Invalid number': 'Número inválido',
    'Number must be positive': 'El número debe ser positivo',
    'Number must be greater than 0': 'El número debe ser mayor que 0',
    'String must contain at least': 'Debe contener al menos',
    'String must contain at most': 'Debe contener como máximo',
    'Too small': 'Valor muy pequeño',
    'Too big': 'Valor muy grande',
    'Invalid type': 'Tipo de dato inválido',
    'Expected': 'Se esperaba',
    'Received': 'Se recibió',
    
    // Errores específicos de formato
    'invalid_format': 'Formato inválido',
    'invalid_type': 'Tipo de dato inválido',
    'too_small': 'Valor muy pequeño',
    'too_big': 'Valor muy grande',
    'invalid_string': 'Texto inválido',
    'invalid_number': 'Número inválido',
    'invalid_date': 'Fecha inválida',
    'invalid_email': 'Correo electrónico inválido',
    
    // Mensajes de error genéricos
    'Validation error': 'Error de validación',
    'Invalid request': 'Solicitud inválida',
    'Not found': 'No encontrado',
    'Unauthorized': 'No autorizado',
    'Forbidden': 'Acceso denegado',
    'Internal server error': 'Error interno del servidor',
    'Bad request': 'Solicitud incorrecta',
  };
  
  // Buscar traducción exacta
  if (translations[message]) {
    return translations[message];
  }
  
  // Buscar traducciones parciales (para mensajes más complejos)
  for (const [key, value] of Object.entries(translations)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return message.replace(new RegExp(key, 'gi'), value);
    }
  }
  
  // Traducir patrones comunes
  let translated = message;
  
  // "Invalid X" -> "X inválido"
  translated = translated.replace(/^Invalid\s+(.+)$/i, '$1 inválido');
  
  // "X is required" -> "X es obligatorio"
  translated = translated.replace(/(.+)\s+is\s+required/i, '$1 es obligatorio');
  
  // "X must be..." -> "X debe ser..."
  translated = translated.replace(/(.+)\s+must\s+be/i, '$1 debe ser');
  
  // "X should be..." -> "X debería ser..."
  translated = translated.replace(/(.+)\s+should\s+be/i, '$1 debería ser');
  
  return translated;
}

/**
 * Traduce nombres de campos comunes al español
 */
function translateFieldName(field: string): string {
  const fieldTranslations: Record<string, string> = {
    'nombreCompleto': 'Nombre completo',
    'nombre': 'Nombre',
    'dni': 'DNI',
    'telefono': 'Teléfono',
    'email': 'Correo electrónico',
    'direccion': 'Dirección',
    'telefonoContactoEmergencia': 'Teléfono de contacto de emergencia',
    'cuidadorId': 'Cuidador',
    'personaId': 'Persona asistida',
    'precioPorHora': 'Precio por hora',
    'fechaInicio': 'Fecha de inicio',
    'fechaFin': 'Fecha de fin',
    'horarios': 'Horarios',
    'notas': 'Notas',
    'monto': 'Monto',
    'fecha': 'Fecha',
    'metodo': 'Método de pago',
    'esLiquidacion': 'Es liquidación',
    'personaAsistidaId': 'Persona asistida',
  };
  
  return fieldTranslations[field] || field;
}

/**
 * Parsea errores de la API y devuelve un mensaje legible para el usuario
 */
export function parseApiError(error: unknown): string {
  // Si es un Error estándar, devolver su mensaje
  if (error instanceof Error) {
    const message = error.message;
    
    // Si el mensaje es un JSON stringificado, intentar parsearlo
    if (message.startsWith('[') || message.startsWith('{')) {
      try {
        const parsed = JSON.parse(message);
        
        // Si es un array de errores de validación (Zod)
        if (Array.isArray(parsed)) {
          const errorMessages = parsed
            .map((err: any) => {
              // Extraer el mensaje del error
              if (err.message) {
                // Traducir el mensaje
                let translatedMessage = translateError(err.message);
                
                // Agregar el campo traducido si está disponible
                if (err.path && err.path.length > 0) {
                  const field = err.path[err.path.length - 1]; // Último campo del path
                  const translatedField = translateFieldName(field);
                  return `${translatedField}: ${translatedMessage}`;
                }
                
                return translatedMessage;
              }
              return null;
            })
            .filter((msg: string | null) => msg !== null);
          
          return errorMessages.length > 0 
            ? errorMessages.join('\n') 
            : 'Error de validación';
        }
        
        // Si es un objeto con mensaje
        if (parsed.message) {
          return translateError(parsed.message);
        }
      } catch {
        // Si no se puede parsear, traducir el mensaje original
        return translateError(message);
      }
    }
    
    return translateError(message);
  }
  
  // Si es un string, traducirlo
  if (typeof error === 'string') {
    return translateError(error);
  }
  
  // Por defecto, mensaje genérico
  return 'Error desconocido';
}

/**
 * Extrae el mensaje de error de una respuesta de la API
 */
export function extractApiErrorMessage(data: { error?: { message?: string } }): string {
  if (!data.error?.message) {
    return 'Error desconocido';
  }
  
  const message = data.error.message;
  
  // Si el mensaje es un JSON stringificado, parsearlo
  if (message.startsWith('[') || message.startsWith('{')) {
    try {
      const parsed = JSON.parse(message);
      
      // Si es un array de errores de validación
      if (Array.isArray(parsed)) {
        const errorMessages = parsed
          .map((err: any) => {
            if (err.message) {
              // Traducir el mensaje
              let translatedMessage = translateError(err.message);
              
              // Agregar el campo traducido si está disponible
              if (err.path && err.path.length > 0) {
                const field = err.path[err.path.length - 1]; // Último campo del path
                const translatedField = translateFieldName(field);
                return `${translatedField}: ${translatedMessage}`;
              }
              
              return translatedMessage;
            }
            return null;
          })
          .filter((msg: string | null) => msg !== null);
        
        return errorMessages.length > 0 
          ? errorMessages.join('\n') 
          : 'Error de validación';
      }
      
      // Si es un objeto con mensaje
      if (parsed.message) {
        return translateError(parsed.message);
      }
    } catch {
      // Si no se puede parsear, traducir el mensaje original
      return translateError(message);
    }
  }
  
  return translateError(message);
}
