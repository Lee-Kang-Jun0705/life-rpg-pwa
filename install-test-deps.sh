#!/bin/bash

echo "🧪 Life RPG PWA - 테스트 의존성 설치"
echo "================================="

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# axe-playwright 설치 (접근성 테스트용)
echo -e "\n${YELLOW}📦 axe-playwright 설치 중...${NC}"
npm install --save-dev axe-playwright

# Playwright 브라우저 설치
echo -e "\n${YELLOW}🌐 Playwright 브라우저 설치 중...${NC}"
npx playwright install

# 추가 테스트 유틸리티
echo -e "\n${YELLOW}🛠️ 추가 테스트 도구 설치 중...${NC}"
npm install --save-dev @playwright/test@latest

echo -e "\n${GREEN}✅ 모든 테스트 의존성이 설치되었습니다!${NC}"
echo -e "\n다음 명령어로 테스트를 실행할 수 있습니다:"
echo -e "  ${GREEN}npm run test:e2e:all${NC} - 모든 테스트 실행"
echo -e "  ${GREEN}npm run test:e2e:ui${NC} - UI 모드로 테스트 실행"
echo -e "  ${GREEN}npm run test:e2e:user${NC} - 사용자 경험 테스트만 실행"