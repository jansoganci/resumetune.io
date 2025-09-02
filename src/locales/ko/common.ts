const common = {
  appTitle: 'ResumeTune', appSubtitle: 'AI로 직무 매칭, 자기소개서, 이력서 최적화', yourCV: '이력서', addYourCV: '이력서 내용 추가', checkJobMatch: '매칭 확인', analyzingMatch: '분석 중...', aiAdvisor: 'AI 커리어 어드바이저', disclaimerTitle: '중요 안내', howTo: '사용 방법:',
  langEN: 'EN', langTR: 'TR', langES: 'ES', langDE: 'DE', langZH: 'ZH', langKO: 'KO', langJA: 'JA', langAR: 'AR',
  chat: { title: 'AI 채용담당자와 채팅', quickActions: '빠른 작업:', qaCover: '자기소개서 생성', qaResume: '이력서 최적화', qaReqs: '핵심 요구 사항', qaSkills: '기술 매칭', emptyTitle: '직무 분석과 자기소개서 작성을 도와드릴 준비가 되었습니다!', emptySubtitle: '위의 빠른 작업을 사용하거나 질문해 보세요', exportPDF: 'PDF', exportDOCX: 'DOCX', inputPlaceholderReady: '직무, 적합도, 조언 등에 대해 물어보세요...', inputPlaceholderDisabled: '먼저 프로필, 연락처, 이력서, 직무 설명을 추가하세요...' },
  fileUpload: { pasteText: '텍스트 붙여넣기', uploadFile: '파일 업로드', recommendedTitle: '✨ 권장: 최상의 결과를 위해 이력서 텍스트 붙여넣기', bulletAccuracy: '더 정확함: 경력 순서가 보존됨', bulletFaster: '더 빠름: 파일 파싱 불필요', bulletEditing: '손쉬운 편집: 언제든 빠른 수정', bulletNoLimits: '제한 없음: 어떤 길이든 동작', howToCopyTitle: '💡 복사 방법:', howToCopyBody: 'Word/PDF에서 이력서를 열기 → 모두 선택 (Ctrl+A) → 복사 (Ctrl+C) → 여기에 붙여넣기', contentReady: '✓ 이력서 내용 준비됨', edit: '이력서 내용 편집', delete: '이력서 내용 삭제', goodLength: '적절한 길이', needMore: '더 많은 내용 필요', needMoreBtn: '더 많은 내용 필요', useThisCv: '이 이력서 사용 ✓', altTitle: '📁 파일 업로드 (대안)', bulletSupport: 'PDF/Word 지원: 기존 이력서 업로드', bulletExtraction: '자동 추출: 텍스트를 추출해 드립니다', bulletBackup: '백업 옵션: 복사-붙여넣기 불가 시 사용', note: '⚠️ 참고:', noteText: '텍스트 추출은 형식/순서를 변경할 수 있습니다. 최상의 결과는 "텍스트 붙여넣기" 권장', processing: '처리 중...', dropHere: '여기에 놓기...', uploadCv: '이력서 업로드', dragDropHint: '여기에 파일을 드래그하거나 클릭하여 선택', onlyPdfWord: 'PDF 또는 Word만', errorSave: '이력서 텍스트를 저장할 수 없습니다. 브라우저 저장소 설정을 확인하세요.', errorRequired: '이력서 내용을 입력하세요', errorMin: '이력서 내용을 더 입력하세요 (최소 50자)', pastedLabel: '붙여넣은 이력서 내용' },
  jobDesc: { label: '직무 설명', placeholder: '직무 설명을 여기에 붙여넣기...', chars: '자' },
  profile: { label: '프로필', addPrompt: '프로필 정보를 추가하세요', save: '프로필 저장', cancel: '취소', errorRequired: '프로필 정보를 입력하세요', errorMin: '자세한 정보를 입력하세요 (최소 50자)', placeholder: '자기 소개를 입력하세요...', previewHelpTitle: '프로필 정보 추가', previewHelpDesc: '배경, 경력, 선호도를 알려주세요' },
  contact: { label: '연락처 정보', fullName: '성명', email: '이메일', phone: '전화번호', location: '현재 위치', title: '직함', linkedin: 'LinkedIn 프로필', portfolio: '포트폴리오 사이트', optional: '(선택)', save: '연락처 저장', clearTitle: '연락처 삭제', editTitle: '연락처 편집', errors: { fullName: '성명은 최소 2자 이상이어야 합니다', emailRequired: '이메일은 필수입니다', emailInvalid: '유효한 이메일을 입력하세요', location: '현재 위치는 필수입니다', professionalTitle: '직함은 필수입니다', linkedin: 'LinkedIn URL에 "linkedin.com"이 포함되어야 합니다', portfolio: '포트폴리오는 "http://" 또는 "https://"로 시작해야 합니다', fixFollowing: '다음을 수정하세요:' }, requiredFields: '* 필수 항목' },
  match: { title: '매칭 분석', found: '매칭됨!', notFound: '매칭 없음', analyzedAt: '분석 시간' },
  errors: {
    networkError: '네트워크 오류입니다. 연결을 확인한 후 다시 시도하세요.',
    timeout: '요청이 시간 초과되었습니다. 다시 시도하세요.',
    invalidInput: '잘못된 입력입니다. 내용을 확인하세요.',
    exportFailed: '내보내기에 실패했습니다. 다시 시도하세요.',
    aiFailed: 'AI 요청에 실패했습니다. 다시 시도하세요.',
    unknown: '문제가 발생했습니다. 다시 시도하세요.'
  },
  source: { pasted: '출처: 붙여넣은 이력서 내용' },
  disclaimer: {
    aiGeneratedTitle: '🤖 AI 생성 콘텐츠',
    aiGeneratedBody: '모든 결과(매칭, 자기소개서, 이력서 최적화)는 AI가 생성하며 오류나 부정확, 부적절한 제안이 포함될 수 있습니다.',
    responsibilityTitle: '✅ 사용자 책임',
    responsibilityBody: '지원 전 AI 생성 콘텐츠를 반드시 검토·수정·확인하세요. 개인 정보, 날짜, 회사명, 성과의 정확성을 점검하세요.',
    privacyTitle: '🔒 데이터 프라이버시',
    privacyBody: '이력서와 개인 정보는 로컬에서 처리되며 분석을 위해 Google Gemini로 전송됩니다. 민감 정보는 포함하지 마세요.',
    liabilityTitle: '⚖️ 책임 제한',
    liabilityBody: '채용 성공을 보장하지 않으며, AI 콘텐츠 사용에 따른 결과에 책임지지 않습니다. 본 도구는 시작점일 뿐 최종 결과물이 아닙니다.'
  },
  howToDetailed: {
    stepsTitle: '사용 방법:',
    step1: '프로필 정보 입력(배경, 경험, 선호).',
    step2: '연락처 정보 입력(이름, 이메일, 위치 등).',
    step3: '이력서 텍스트를 붙여넣기(권장) 또는 PDF/Word 업로드.',
    step4: '직무 설명을 텍스트 영역에 붙여넣기.',
    step5: '"매칭 확인" 클릭 → 개인화된 예/아니오 추천.',
    step6: '채팅으로 직무·적합도 관련 상세 질문.',
    bestPracticeTitle: '💡 베스트 프랙티스:',
    bestPracticeBody: 'Word/PDF에서 이력서를 열기 → 전체 선택(Ctrl+A) → 복사(Ctrl+C) → 텍스트 영역에 붙여넣기. 형식 보존, 경력 순서 유지, 분석 품질 향상.',
    whyTextTitle: '✨ 텍스트 입력이 더 나은 이유:',
    whyTextBullet1: '• 정확도 우수: 파싱 오류 없음',
    whyTextBullet2: '• 더 빠른 처리: 즉시 분석',
    whyTextBullet3: '• 쉬운 편집: 빠른 개선',
    whyTextBullet4: '• 더 좋은 결과: 고품질 출력'
  }
};

export default common;


