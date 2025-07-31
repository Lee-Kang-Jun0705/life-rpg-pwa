@echo off
REM Life RPG PWA - 포괄적인 E2E 테스트 실행 스크립트 (Windows)

echo 🚀 Life RPG PWA E2E 테스트 시작...

REM 테스트 카운터 초기화
set total_tests=0
set passed_tests=0
set failed_tests=0

REM 핵심 사용자 플로우 테스트
echo.
echo 📋 핵심 사용자 플로우 테스트 실행 중...
call npx playwright test core-user-flow.spec.ts --reporter=list
if %ERRORLEVEL% EQU 0 (
    echo ✅ 핵심 사용자 플로우 테스트 통과
    set /a passed_tests+=1
) else (
    echo ❌ 핵심 사용자 플로우 테스트 실패
    set /a failed_tests+=1
)
set /a total_tests+=1

REM 에러 처리 테스트
echo.
echo 📋 에러 처리 테스트 실행 중...
call npx playwright test error-handling.spec.ts --reporter=list
if %ERRORLEVEL% EQU 0 (
    echo ✅ 에러 처리 테스트 통과
    set /a passed_tests+=1
) else (
    echo ❌ 에러 처리 테스트 실패
    set /a failed_tests+=1
)
set /a total_tests+=1

REM 성능 최적화 테스트
echo.
echo 📋 성능 최적화 테스트 실행 중...
call npx playwright test performance-optimization.spec.ts --reporter=list
if %ERRORLEVEL% EQU 0 (
    echo ✅ 성능 최적화 테스트 통과
    set /a passed_tests+=1
) else (
    echo ❌ 성능 최적화 테스트 실패
    set /a failed_tests+=1
)
set /a total_tests+=1

REM 보안 및 데이터 무결성 테스트
echo.
echo 📋 보안 및 데이터 무결성 테스트 실행 중...
call npx playwright test security-data-integrity.spec.ts --reporter=list
if %ERRORLEVEL% EQU 0 (
    echo ✅ 보안 및 데이터 무결성 테스트 통과
    set /a passed_tests+=1
) else (
    echo ❌ 보안 및 데이터 무결성 테스트 실패
    set /a failed_tests+=1
)
set /a total_tests+=1

REM PWA 기능 테스트
echo.
echo 📋 PWA 기능 테스트 실행 중...
call npx playwright test pwa-features.spec.ts --reporter=list
if %ERRORLEVEL% EQU 0 (
    echo ✅ PWA 기능 테스트 통과
    set /a passed_tests+=1
) else (
    echo ❌ PWA 기능 테스트 실패
    set /a failed_tests+=1
)
set /a total_tests+=1

REM 결과 요약
echo.
echo 📊 테스트 결과 요약
echo =========================
echo 전체 테스트: %total_tests%
echo 통과: %passed_tests%
echo 실패: %failed_tests%

REM HTML 리포트 생성
if %failed_tests% GTR 0 (
    echo.
    echo 📄 상세 리포트 생성 중...
    call npx playwright test --reporter=html
    echo ✅ HTML 리포트가 생성되었습니다. (playwright-report\index.html)
)

REM 성공/실패 반환
if %failed_tests% EQU 0 (
    echo.
    echo 🎉 모든 테스트가 성공적으로 통과했습니다!
    exit /b 0
) else (
    echo.
    echo ⚠️  일부 테스트가 실패했습니다. 리포트를 확인해주세요.
    exit /b 1
)