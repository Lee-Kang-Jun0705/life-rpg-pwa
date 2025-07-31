@echo off
echo GitHub 업로드를 시작합니다...
echo.
echo 먼저 GitHub.com에서 새 저장소를 만드세요:
echo 1. https://github.com/new 접속
echo 2. Repository name: life-rpg-pwa
echo 3. Public 선택
echo 4. "Create repository" 클릭
echo.
echo 저장소를 만드셨나요? (Y/N)
set /p answer=

if /i "%answer%"=="Y" (
    echo.
    echo GitHub 사용자명을 입력하세요:
    set /p username=
    
    echo.
    echo 다음 명령어를 실행합니다...
    git remote add origin https://github.com/%username%/life-rpg-pwa.git
    git branch -M main
    git push -u origin main
    
    echo.
    echo 완료! 이제 https://github.com/%username%/life-rpg-pwa 에서 확인하세요.
) else (
    echo.
    echo 먼저 GitHub에서 저장소를 만든 후 다시 실행하세요.
)

pause