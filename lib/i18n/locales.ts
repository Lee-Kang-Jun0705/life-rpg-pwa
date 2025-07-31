// 지원 언어 정의
export const locales = ['ko', 'en', 'ja', 'zh'] as const
export type Locale = typeof locales[number]

export const defaultLocale: Locale = 'ko'

export const localeNames: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  zh: '中文'
}

// 언어별 번역 타입
export interface Translations {
  common: {
    dashboard: string
    character: string
    shop: string
    profile: string
    settings: string
    save: string
    cancel: string
    delete: string
    edit: string
    apply: string
    reset: string
    back: string
    next: string
    loading: string
    error: string
    success: string
    confirm: string
  }
  dashboard: {
    title: string
    welcome: string
    dailyMissions: string
    stats: {
      health: string
      learning: string
      relationship: string
      achievement: string
    }
    level: string
    experience: string
    noMissions: string
    completeMission: string
  }
  character: {
    title: string
    customization: string
    appearance: string
    preview: string
    basic: string
    face: string
    hair: string
    outfit: string
    accessory: string
    presets: string
    saved: string
    saveCustomization: string
    enterName: string
    gender: {
      male: string
      female: string
    }
    bodyType: {
      slim: string
      normal: string
      muscular: string
    }
    skinTone: string
    hairStyle: string
    hairColor: string
    eyeType: string
    eyeColor: string
    expression: {
      happy: string
      neutral: string
      confident: string
      focused: string
      tired: string
    }
  }
  shop: {
    title: string
    inventory: string
    coins: string
    buy: string
    equip: string
    unequip: string
    use: string
    equipped: string
    notEnoughCoins: string
    purchaseSuccess: string
    categories: {
      all: string
      weapon: string
      armor: string
      accessory: string
      consumable: string
      cosmetic: string
    }
    rarity: {
      common: string
      rare: string
      epic: string
      legendary: string
    }
  }
  profile: {
    title: string
    displayName: string
    email: string
    bio: string
    editProfile: string
    activityStats: string
    characterPreview: string
    totalActivities: string
    joined: string
    lastActive: string
  }
  settings: {
    title: string
    general: string
    language: string
    theme: string
    soundEffects: string
    aiCoach: string
    aiModel: string
    apiKey: string
    notifications: string
    backup: string
    accessibility: string
    privacy: string
    dataExport: string
    dataImport: string
    themes: {
      light: string
      dark: string
      system: string
    }
    enableNotifications: string
    fontSize: string
    contrast: string
    reduceMotion: string
  }
  accessibility: {
    skipToContent: string
    mainNavigation: string
    openMenu: string
    closeMenu: string
    ariaLabels: {
      navigation: string
      mainContent: string
      loading: string
      error: string
      success: string
      modalDialog: string
      closeModal: string
    }
  }
}

// 한국어 번역
export const ko: Translations = {
  common: {
    dashboard: '대시보드',
    character: '캐릭터',
    shop: '상점',
    profile: '프로필',
    settings: '설정',
    save: '저장',
    cancel: '취소',
    delete: '삭제',
    edit: '편집',
    apply: '적용',
    reset: '초기화',
    back: '뒤로',
    next: '다음',
    loading: '로딩 중...',
    error: '오류',
    success: '성공',
    confirm: '확인'
  },
  dashboard: {
    title: '대시보드',
    welcome: '환영합니다',
    dailyMissions: '일일 미션',
    stats: {
      health: '건강',
      learning: '학습',
      relationship: '관계',
      achievement: '성취'
    },
    level: '레벨',
    experience: '경험치',
    noMissions: '진행 중인 미션이 없습니다',
    completeMission: '미션 완료'
  },
  character: {
    title: '캐릭터 커스터마이징',
    customization: '커스터마이징',
    appearance: '외모',
    preview: '미리보기',
    basic: '기본',
    face: '얼굴',
    hair: '헤어',
    outfit: '의상',
    accessory: '액세서리',
    presets: '프리셋',
    saved: '저장됨',
    saveCustomization: '커스터마이징 저장',
    enterName: '저장할 이름을 입력하세요',
    gender: {
      male: '남성',
      female: '여성'
    },
    bodyType: {
      slim: '슬림',
      normal: '보통',
      muscular: '근육질'
    },
    skinTone: '피부톤',
    hairStyle: '헤어스타일',
    hairColor: '머리 색깔',
    eyeType: '눈 모양',
    eyeColor: '눈 색깔',
    expression: {
      happy: '행복',
      neutral: '중립',
      confident: '자신감',
      focused: '집중',
      tired: '피곤'
    }
  },
  shop: {
    title: '상점',
    inventory: '인벤토리',
    coins: '코인',
    buy: '구매',
    equip: '장착',
    unequip: '해제',
    use: '사용',
    equipped: '장착중',
    notEnoughCoins: '코인이 부족합니다',
    purchaseSuccess: '구매 완료!',
    categories: {
      all: '전체',
      weapon: '무기',
      armor: '갑옷',
      accessory: '액세서리',
      consumable: '소비아이템',
      cosmetic: '코스메틱'
    },
    rarity: {
      common: '일반',
      rare: '희귀',
      epic: '영웅',
      legendary: '전설'
    }
  },
  profile: {
    title: '프로필',
    displayName: '표시 이름',
    email: '이메일',
    bio: '소개',
    editProfile: '프로필 편집',
    activityStats: '활동 통계',
    characterPreview: '캐릭터 미리보기',
    totalActivities: '총 활동',
    joined: '가입일',
    lastActive: '마지막 활동'
  },
  settings: {
    title: '설정',
    general: '일반',
    language: '언어',
    theme: '테마',
    soundEffects: '효과음',
    aiCoach: 'AI 코치',
    aiModel: 'AI 모델',
    apiKey: 'API 키',
    notifications: '알림',
    backup: '백업',
    accessibility: '접근성',
    privacy: '개인정보',
    dataExport: '데이터 내보내기',
    dataImport: '데이터 가져오기',
    themes: {
      light: '라이트',
      dark: '다크',
      system: '시스템'
    },
    enableNotifications: '알림 활성화',
    fontSize: '글자 크기',
    contrast: '대비',
    reduceMotion: '모션 감소'
  },
  accessibility: {
    skipToContent: '본문으로 건너뛰기',
    mainNavigation: '메인 네비게이션',
    openMenu: '메뉴 열기',
    closeMenu: '메뉴 닫기',
    ariaLabels: {
      navigation: '네비게이션',
      mainContent: '메인 콘텐츠',
      loading: '로딩 중',
      error: '오류 발생',
      success: '성공',
      modalDialog: '모달 대화상자',
      closeModal: '모달 닫기'
    }
  }
}

// 영어 번역
export const en: Translations = {
  common: {
    dashboard: 'Dashboard',
    character: 'Character',
    shop: 'Shop',
    profile: 'Profile',
    settings: 'Settings',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    apply: 'Apply',
    reset: 'Reset',
    back: 'Back',
    next: 'Next',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    confirm: 'Confirm'
  },
  dashboard: {
    title: 'Dashboard',
    welcome: 'Welcome',
    dailyMissions: 'Daily Missions',
    stats: {
      health: 'Health',
      learning: 'Learning',
      relationship: 'Relationship',
      achievement: 'Achievement'
    },
    level: 'Level',
    experience: 'Experience',
    noMissions: 'No active missions',
    completeMission: 'Complete Mission'
  },
  character: {
    title: 'Character Customization',
    customization: 'Customization',
    appearance: 'Appearance',
    preview: 'Preview',
    basic: 'Basic',
    face: 'Face',
    hair: 'Hair',
    outfit: 'Outfit',
    accessory: 'Accessory',
    presets: 'Presets',
    saved: 'Saved',
    saveCustomization: 'Save Customization',
    enterName: 'Enter a name to save',
    gender: {
      male: 'Male',
      female: 'Female'
    },
    bodyType: {
      slim: 'Slim',
      normal: 'Normal',
      muscular: 'Muscular'
    },
    skinTone: 'Skin Tone',
    hairStyle: 'Hair Style',
    hairColor: 'Hair Color',
    eyeType: 'Eye Type',
    eyeColor: 'Eye Color',
    expression: {
      happy: 'Happy',
      neutral: 'Neutral',
      confident: 'Confident',
      focused: 'Focused',
      tired: 'Tired'
    }
  },
  shop: {
    title: 'Shop',
    inventory: 'Inventory',
    coins: 'Coins',
    buy: 'Buy',
    equip: 'Equip',
    unequip: 'Unequip',
    use: 'Use',
    equipped: 'Equipped',
    notEnoughCoins: 'Not enough coins',
    purchaseSuccess: 'Purchase complete!',
    categories: {
      all: 'All',
      weapon: 'Weapons',
      armor: 'Armor',
      accessory: 'Accessories',
      consumable: 'Consumables',
      cosmetic: 'Cosmetics'
    },
    rarity: {
      common: 'Common',
      rare: 'Rare',
      epic: 'Epic',
      legendary: 'Legendary'
    }
  },
  profile: {
    title: 'Profile',
    displayName: 'Display Name',
    email: 'Email',
    bio: 'Bio',
    editProfile: 'Edit Profile',
    activityStats: 'Activity Stats',
    characterPreview: 'Character Preview',
    totalActivities: 'Total Activities',
    joined: 'Joined',
    lastActive: 'Last Active'
  },
  settings: {
    title: 'Settings',
    general: 'General',
    language: 'Language',
    theme: 'Theme',
    soundEffects: 'Sound Effects',
    aiCoach: 'AI Coach',
    aiModel: 'AI Model',
    apiKey: 'API Key',
    notifications: 'Notifications',
    backup: 'Backup',
    accessibility: 'Accessibility',
    privacy: 'Privacy',
    dataExport: 'Export Data',
    dataImport: 'Import Data',
    themes: {
      light: 'Light',
      dark: 'Dark',
      system: 'System'
    },
    enableNotifications: 'Enable Notifications',
    fontSize: 'Font Size',
    contrast: 'Contrast',
    reduceMotion: 'Reduce Motion'
  },
  accessibility: {
    skipToContent: 'Skip to content',
    mainNavigation: 'Main navigation',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    ariaLabels: {
      navigation: 'Navigation',
      mainContent: 'Main content',
      loading: 'Loading',
      error: 'Error occurred',
      success: 'Success',
      modalDialog: 'Modal dialog',
      closeModal: 'Close modal'
    }
  }
}

// 일본어 번역 (기본 구조)
export const ja: Translations = {
  ...en, // 임시로 영어 사용
  common: {
    ...en.common,
    dashboard: 'ダッシュボード',
    character: 'キャラクター',
    shop: 'ショップ',
    profile: 'プロフィール',
    settings: '設定',
    save: '保存',
    cancel: 'キャンセル',
    delete: '削除',
    edit: '編集'
  }
}

// 중국어 번역 (기본 구조)
export const zh: Translations = {
  ...en, // 임시로 영어 사용
  common: {
    ...en.common,
    dashboard: '仪表板',
    character: '角色',
    shop: '商店',
    profile: '个人资料',
    settings: '设置',
    save: '保存',
    cancel: '取消',
    delete: '删除',
    edit: '编辑'
  }
}

export const translations: Record<Locale, Translations> = {
  ko,
  en,
  ja,
  zh
}