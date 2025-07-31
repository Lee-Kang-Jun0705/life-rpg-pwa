#!/bin/bash

# Life RPG PWA - 포괄적인 E2E 테스트 실행 스크립트

echo "🚀 Life RPG PWA E2E 테스트 시작..."

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 테스트 카테고리
declare -a test_categories=(
  "core-user-flow:핵심 사용자 플로우"
  "error-handling:에러 처리"
  "performance-optimization:성능 최적화"
  "security-data-integrity:보안 및 데이터 무결성"
  "pwa-features:PWA 기능"
)

# 테스트 실행 함수
run_test() {
  local test_file=$1
  local test_name=$2
  
  echo -e "\n${YELLOW}📋 $test_name 테스트 실행 중...${NC}"
  
  if npx playwright test "$test_file.spec.ts" --reporter=list; then
    echo -e "${GREEN}✅ $test_name 테스트 통과${NC}"
    return 0
  else
    echo -e "${RED}❌ $test_name 테스트 실패${NC}"
    return 1
  fi
}

# 전체 테스트 실행
total_tests=0
passed_tests=0
failed_tests=0

# 개별 테스트 실행
for test_info in "${test_categories[@]}"; do
  IFS=':' read -r test_file test_name <<< "$test_info"
  
  if run_test "$test_file" "$test_name"; then
    ((passed_tests++))
  else
    ((failed_tests++))
  fi
  
  ((total_tests++))
done

# 결과 요약
echo -e "\n${YELLOW}📊 테스트 결과 요약${NC}"
echo "========================="
echo -e "전체 테스트: $total_tests"
echo -e "${GREEN}통과: $passed_tests${NC}"
echo -e "${RED}실패: $failed_tests${NC}"

# HTML 리포트 생성
if [ $failed_tests -gt 0 ]; then
  echo -e "\n${YELLOW}📄 상세 리포트 생성 중...${NC}"
  npx playwright test --reporter=html
  echo -e "${GREEN}✅ HTML 리포트가 생성되었습니다. (playwright-report/index.html)${NC}"
fi

# 성공/실패 반환
if [ $failed_tests -eq 0 ]; then
  echo -e "\n${GREEN}🎉 모든 테스트가 성공적으로 통과했습니다!${NC}"
  exit 0
else
  echo -e "\n${RED}⚠️  일부 테스트가 실패했습니다. 리포트를 확인해주세요.${NC}"
  exit 1
fi