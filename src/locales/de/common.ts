const common = {
  appTitle: 'ResumeTune',
  appSubtitle: 'Dein KI-Karrierebegleiter für Job-Matching, Anschreiben und Lebenslauf-Optimierung',
  yourCV: 'Dein Lebenslauf', addYourCV: 'Füge deinen Lebenslaufinhalt hinzu',
  checkJobMatch: 'Passung prüfen', analyzingMatch: 'Passung wird analysiert...', aiAdvisor: 'KI-Karriereberater', disclaimerTitle: 'Wichtiger Hinweis', howTo: 'So funktioniert’s:',
  langEN: 'EN', langTR: 'TR', langES: 'ES', langDE: 'DE', langZH: 'ZH', langKO: 'KO', langJA: 'JA', langAR: 'AR',
  chat: {
    title: 'Chat mit dem KI-Recruiter', quickActions: 'Schnellaktionen:', qaCover: 'Anschreiben erstellen', qaResume: 'Lebenslauf optimieren', qaReqs: 'Schlüsselanforderungen', qaSkills: 'Skill-Passung',
    emptyTitle: 'Bereit, bei Stellenanalyse und Anschreiben zu helfen!', emptySubtitle: 'Probiere die Schnellaktionen oben oder stelle eine Frage', exportPDF: 'PDF', exportDOCX: 'DOCX',
    inputPlaceholderReady: 'Frage zur Stelle, deiner Passung oder bitte um Rat...', inputPlaceholderDisabled: 'Füge zuerst Profil, Kontakt, Lebenslauf und Stellenbeschreibung hinzu...'
  },
  fileUpload: {
    pasteText: 'Text einfügen', uploadFile: 'Datei hochladen', recommendedTitle: '✨ Empfehlung: Füge deinen Lebenslauf-Text ein',
    bulletAccuracy: 'Bessere Genauigkeit: Exakte Reihenfolge der Berufserfahrung bleibt erhalten',
    bulletFaster: 'Schneller: Keine Dateiparsing nötig',
    bulletEditing: 'Einfaches Bearbeiten: Änderungen jederzeit',
    bulletNoLimits: 'Keine Limits: Funktioniert mit jeder Länge',
    howToCopyTitle: '💡 So kopierst du:', howToCopyBody: 'Lebenslauf in Word/PDF öffnen → Alles markieren (Ctrl+A) → Kopieren (Ctrl+C) → Hier einfügen',
    contentReady: '✓ Lebenslauf-Inhalt bereit', edit: 'Lebenslauf-Inhalt bearbeiten', delete: 'Lebenslauf-Inhalt löschen',
    goodLength: 'Gute Länge', needMore: 'Mehr Inhalt nötig', needMoreBtn: 'Mehr Inhalt nötig', useThisCv: 'Diesen Lebenslauf verwenden ✓',
    altTitle: '📁 Datei-Upload (Alternative Option)', bulletSupport: 'PDF/Word-Unterstützung: Lade deinen Lebenslauf hoch', bulletExtraction: 'Automatische Extraktion: Wir extrahieren den Text', bulletBackup: 'Backup-Option: Wenn Kopieren nicht möglich ist',
    note: '⚠️ Hinweis:', noteText: 'Textextraktion kann Formatierung/Reihenfolge ändern. Für beste Ergebnisse „Text einfügen“ nutzen.',
    processing: 'Verarbeitung...', dropHere: 'Hier ablegen...', uploadCv: 'Lebenslauf hochladen', dragDropHint: 'Datei hier ablegen oder klicken', onlyPdfWord: 'Nur PDF oder Word',
    errorSave: 'Lebenslauf-Text konnte nicht gespeichert werden. Browser-Speicher prüfen.', errorRequired: 'Bitte gib deinen Lebenslauf-Inhalt ein', errorMin: 'Bitte mehr Inhalt (mind. 50 Zeichen)', pastedLabel: 'Eingefügter Lebenslauf-Inhalt'
  },
  jobDesc: { label: 'Stellenbeschreibung', placeholder: 'Füge die Stellenbeschreibung hier ein...', chars: 'Zeichen' },
  profile: { label: 'Dein Profil', addPrompt: 'Füge deine Profilinformationen hinzu', save: 'Profil speichern', cancel: 'Abbrechen', errorRequired: 'Bitte Profilinfo eingeben', errorMin: 'Mind. 50 Zeichen', placeholder: 'Erzähle über dich...', previewHelpTitle: 'Profilinformationen hinzufügen', previewHelpDesc: 'Beschreibe Hintergrund, Erfahrung und Präferenzen' },
  contact: {
    label: 'Kontaktinformationen', fullName: 'Vollständiger Name', email: 'E-Mail-Adresse', phone: 'Telefonnummer', location: 'Aktueller Standort', title: 'Berufstitel',
    linkedin: 'LinkedIn-Profil', portfolio: 'Portfolio-Webseite', optional: '(Optional)', save: 'Kontaktinfo speichern', clearTitle: 'Kontaktinfo löschen', editTitle: 'Kontaktinfo bearbeiten',
    errors: { fullName: 'Name ist erforderlich (mind. 2 Zeichen)', emailRequired: 'E-Mail ist erforderlich', emailInvalid: 'Bitte gültige E-Mail eingeben', location: 'Aktueller Standort erforderlich', professionalTitle: 'Berufstitel erforderlich', linkedin: 'LinkedIn-URL sollte „linkedin.com“ enthalten', portfolio: 'Portfolio muss mit „http://“ oder „https://“ beginnen', fixFollowing: 'Bitte behebe Folgendes:' },
    requiredFields: '* Pflichtfelder'
  },
  match: { title: 'Passungsanalyse', found: 'Passung gefunden!', notFound: 'Keine Passung', analyzedAt: 'Analysiert um' },
  errors: {
    networkError: 'Netzwerkfehler. Bitte Verbindung prüfen und erneut versuchen.',
    timeout: 'Zeitüberschreitung. Bitte erneut versuchen.',
    invalidInput: 'Ungültige Eingabe. Bitte Eingaben prüfen.',
    exportFailed: 'Export fehlgeschlagen. Bitte erneut versuchen.',
    aiFailed: 'KI-Anfrage fehlgeschlagen. Bitte erneut versuchen.',
    unknown: 'Etwas ist schiefgelaufen. Bitte erneut versuchen.'
  },
  source: { pasted: 'Quelle: Eingefügter Lebenslauf-Inhalt' },
  disclaimer: {
    aiGeneratedTitle: '🤖 KI‑generierte Inhalte',
    aiGeneratedBody: 'Alle Ausgaben (Passung, Anschreiben, Lebenslauf‑Optimierungen) werden von KI generiert und können Fehler, Ungenauigkeiten oder unpassende Vorschläge enthalten.',
    responsibilityTitle: '✅ Deine Verantwortung',
    responsibilityBody: 'Prüfe, bearbeite und verifiziere alle KI‑Inhalte vor der Verwendung. Kontrolliere insbesondere persönliche Daten, Daten/Zeiten, Firmennamen und Erfolge.',
    privacyTitle: '🔒 Datenschutz',
    privacyBody: 'Dein Lebenslauf und persönliche Daten werden lokal verarbeitet und zur Analyse an Google Gemini gesendet. Füge keine sensiblen Informationen ein, die nicht verarbeitet werden sollen.',
    liabilityTitle: '⚖️ Haftungsausschluss',
    liabilityBody: 'Wir garantieren keinen Bewerbungserfolg und übernehmen keine Haftung für Folgen aus der Nutzung von KI‑Inhalten. Nutze das Tool als Ausgangspunkt, nicht als finale Lösung.'
  },
  howToDetailed: {
    stepsTitle: 'So funktioniert’s:',
    step1: 'Profilinformationen hinzufügen (Hintergrund, Erfahrung, Präferenzen).',
    step2: 'Kontaktinformationen hinzufügen (Name, E‑Mail, Standort usw.).',
    step3: 'Lebenslauftext einfügen (empfohlen) oder PDF/Word hochladen.',
    step4: 'Stellenbeschreibung in das Textfeld einfügen.',
    step5: 'Auf „Passung prüfen“ klicken für eine persönliche Ja/Nein‑Empfehlung.',
    step6: 'Chat nutzen für Detailfragen zur Stelle und Passung.',
    bestPracticeTitle: '💡 Best Practice:',
    bestPracticeBody: 'Lebenslauf in Word/PDF öffnen → Alles markieren (Ctrl+A) → Kopieren (Ctrl+C) → Im Textfeld einfügen. So bleiben Format und Reihenfolge erhalten und die Analysequalität steigt.',
    whyTextTitle: '✨ Warum Texteingabe besser ist:',
    whyTextBullet1: '• Höchste Genauigkeit: keine Parsing‑Fehler',
    whyTextBullet2: '• Schnellere Verarbeitung: sofortige Analyse',
    whyTextBullet3: '• Einfaches Editieren: schnelle Verbesserungen',
    whyTextBullet4: '• Bessere Ergebnisse: höhere Output‑Qualität'
  }
};

export default common;


