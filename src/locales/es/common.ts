const common = {
  appTitle: 'ResumeTune',
  appSubtitle: 'Tu compañero de carrera con IA para matching, cartas de presentación y optimización de CV',
  yourCV: 'Tu CV',
  addYourCV: 'Añade el contenido de tu CV',
  checkJobMatch: 'Comprobar compatibilidad',
  analyzingMatch: 'Analizando compatibilidad...',
  aiAdvisor: 'Asesor de Carrera IA',
  disclaimerTitle: 'Aviso Importante',
  howTo: 'Cómo usar:',
  langEN: 'EN', langTR: 'TR', langES: 'ES', langDE: 'DE', langZH: 'ZH', langKO: 'KO', langJA: 'JA', langAR: 'AR',
  chat: {
    title: 'Chatea con el Reclutador IA',
    quickActions: 'Acciones rápidas:',
    qaCover: 'Generar Carta de Presentación',
    qaResume: 'Optimizar CV',
    qaReqs: 'Requisitos Clave',
    qaSkills: 'Correspondencia de Habilidades',
    emptyTitle: '¡Listo para ayudar con el análisis del puesto y cartas de presentación!',
    emptySubtitle: 'Prueba las acciones rápidas arriba o pregunta lo que quieras',
    exportPDF: 'PDF', exportDOCX: 'DOCX',
    inputPlaceholderReady: 'Pregunta sobre el puesto, tu encaje o solicita consejos...',
    inputPlaceholderDisabled: 'Primero añade perfil, contacto, CV y descripción del puesto...'
  },
  fileUpload: {
    pasteText: 'Pegar Texto', uploadFile: 'Subir Archivo',
    recommendedTitle: '✨ Recomendado: Pega el texto de tu CV para mejores resultados',
    bulletAccuracy: 'Mejor precisión: Conserva el orden exacto del historial laboral',
    bulletFaster: 'Más rápido: No se necesita análisis de archivos',
    bulletEditing: 'Edición fácil: Cambios rápidos en cualquier momento',
    bulletNoLimits: 'Sin límites: Funciona con cualquier longitud de CV',
    howToCopyTitle: '💡 Cómo copiar:',
    howToCopyBody: 'Abre tu CV en Word/PDF → Seleccionar Todo (Ctrl+A) → Copiar (Ctrl+C) → Pegar aquí',
    contentReady: '✓ Contenido del CV listo', edit: 'Editar contenido del CV', delete: 'Eliminar contenido del CV',
    goodLength: 'Longitud adecuada', needMore: 'Se necesita más contenido', needMoreBtn: 'Se necesita más contenido', useThisCv: 'Usar este CV ✓',
    altTitle: '📁 Subida de Archivo (Opción Alternativa)',
    bulletSupport: 'Soporte PDF/Word: Sube tu CV existente',
    bulletExtraction: 'Extracción automática: Extraeremos el texto por ti',
    bulletBackup: 'Opción de respaldo: Usa cuando no sea posible copiar y pegar',
    note: '⚠️ Nota:',
    noteText: 'La extracción de texto puede alterar el formato u orden. Para mejores resultados, usa "Pegar Texto".',
    processing: 'Procesando...', dropHere: 'Suelta aquí...', uploadCv: 'Subir CV', dragDropHint: 'Arrastra y suelta un archivo aquí, o haz clic para seleccionar', onlyPdfWord: 'Sólo documentos PDF o Word',
    errorSave: 'No se pudo guardar el texto del CV. Revisa la configuración de almacenamiento del navegador.',
    errorRequired: 'Por favor, introduce el contenido de tu CV',
    errorMin: 'Por favor, proporciona más contenido del CV (al menos 50 caracteres)',
    pastedLabel: 'Contenido del CV pegado'
  },
  jobDesc: { label: 'Descripción del Puesto', placeholder: 'Pega la descripción del puesto aquí...', chars: 'caracteres' },
  profile: {
    label: 'Tu Perfil', addPrompt: 'Añade la información de tu perfil', save: 'Guardar Perfil', cancel: 'Cancelar',
    errorRequired: 'Por favor, introduce la información de tu perfil', errorMin: 'Por favor, añade más detalles (mínimo 50 caracteres)',
    placeholder: 'Cuéntanos sobre ti...\n\nEjemplo:\n- Nacionalidad, edad, género, titulación (universidad)\n- +[X] años de experiencia en [áreas] \n- Idiomas: [idiomas], sin [otros] \n- En [ciudad actual] o dispuesto a reubicarse\n- Salario mínimo: [cantidad] [moneda]/mes\n- Roles objetivo: [tipos de rol]\n- Preferencias: [tipos de empresa] ',
    previewHelpTitle: 'Añade la información de tu perfil',
    previewHelpDesc: 'Cuéntanos tu experiencia, formación y preferencias'
  },
  contact: {
    label: 'Información de Contacto', fullName: 'Nombre Completo', email: 'Correo Electrónico', phone: 'Teléfono', location: 'Ubicación Actual', title: 'Cargo Profesional',
    linkedin: 'Perfil de LinkedIn', portfolio: 'Sitio Web de Portafolio', optional: '(Opcional)', save: 'Guardar Información de Contacto',
    clearTitle: 'Borrar información de contacto', editTitle: 'Editar información de contacto',
    errors: {
      fullName: 'El nombre completo es obligatorio y debe tener al menos 2 caracteres',
      emailRequired: 'El correo electrónico es obligatorio',
      emailInvalid: 'Introduce un correo electrónico válido',
      location: 'La ubicación actual es obligatoria',
      professionalTitle: 'El cargo profesional es obligatorio',
      linkedin: 'La URL de LinkedIn debe contener "linkedin.com"',
      portfolio: 'El sitio del portafolio debe comenzar con "http://" o "https://"',
      fixFollowing: 'Por favor corrige lo siguiente:'
    },
    requiredFields: '* Campos obligatorios'
  },
  match: { title: 'Análisis de Compatibilidad', found: '¡Hay compatibilidad!', notFound: 'Sin compatibilidad', analyzedAt: 'Analizado a las' },
  errors: {
    networkError: 'Error de red. Verifica tu conexión e inténtalo de nuevo.',
    timeout: 'La solicitud expiró. Inténtalo de nuevo.',
    invalidInput: 'Entrada no válida. Revisa tus datos.',
    exportFailed: 'La exportación falló. Inténtalo de nuevo.',
    aiFailed: 'La solicitud a IA falló. Inténtalo de nuevo.',
    unknown: 'Algo salió mal. Inténtalo de nuevo.'
  },
  source: { pasted: 'Fuente: Contenido del CV pegado' },
  disclaimer: {
    aiGeneratedTitle: '🤖 Contenido Generado por IA',
    aiGeneratedBody: 'Todos los resultados (compatibilidad, cartas de presentación, optimización de CV) son generados por IA y pueden contener errores, imprecisiones o sugerencias inapropiadas.',
    responsibilityTitle: '✅ Tu Responsabilidad',
    responsibilityBody: 'Antes de usarlo en postulaciones, revisa, edita y verifica cuidadosamente todo el contenido generado por IA. Asegura la exactitud de datos personales, fechas, nombres de empresas y logros.',
    privacyTitle: '🔒 Privacidad de Datos',
    privacyBody: 'Tu CV e información personal se procesan localmente y se envían a Google Gemini para análisis. No incluyas información sensible que no quieras que procese un servicio de IA.',
    liabilityTitle: '⚖️ Exención de Responsabilidad',
    liabilityBody: 'No garantizamos éxito en postulaciones ni asumimos responsabilidad por consecuencias del uso del contenido generado por IA. Úsalo como punto de partida, no como solución final.'
  },
  howToDetailed: {
    stepsTitle: 'Cómo usar:',
    step1: 'Añade tu perfil (formación, experiencia, preferencias).',
    step2: 'Añade tu información de contacto (nombre, correo, ubicación, etc.).',
    step3: 'Pega el texto de tu CV (recomendado) o sube un archivo PDF/Word.',
    step4: 'Pega la descripción del puesto en el área de texto.',
    step5: 'Haz clic en "Comprobar compatibilidad" para una recomendación personalizada (sí/no).',
    step6: 'Usa el chat para preguntar sobre el puesto y tu encaje.',
    bestPracticeTitle: '💡 Mejores Prácticas:',
    bestPracticeBody: 'Abre tu CV en Word/PDF → Seleccionar Todo (Ctrl+A) → Copiar (Ctrl+C) → Pegar en el área de texto. Esto preserva el formato, mantiene el orden del historial laboral y mejora la calidad del análisis.',
    whyTextTitle: '✨ Por qué funciona mejor el texto pegado:',
    whyTextBullet1: '• Precisión perfecta: sin errores de análisis',
    whyTextBullet2: '• Procesamiento más rápido: análisis instantáneo',
    whyTextBullet3: '• Edición sencilla: mejoras rápidas',
    whyTextBullet4: '• Mejores resultados: salidas de mayor calidad'
  }
};

export default common;


