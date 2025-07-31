#!/bin/bash

echo "🚀 Life RPG PWA - Quick Fix for Vercel Deployment"
echo "================================================"

# 1. Critical Errors 수정
echo -e "\n📌 Step 1: Fixing Critical Errors..."
node fix-critical-errors.js

# 2. 빌드 테스트
echo -e "\n📌 Step 2: Testing Build..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "\n✅ Build Successful!"
    
    # 3. Git 커밋
    echo -e "\n📌 Step 3: Committing Changes..."
    git add -A
    git commit -m "fix: Critical build errors for Vercel deployment

- Fixed prefer-const errors (8 occurrences)
- Fixed no-unused-expressions errors (8 occurrences)
- Ready for production deployment"
    
    # 4. Push
    echo -e "\n📌 Step 4: Pushing to GitHub..."
    git push
    
    echo -e "\n🎉 Complete! Check Vercel dashboard for deployment status."
    echo "🔗 https://vercel.com/dashboard"
else
    echo -e "\n❌ Build Failed! Please check the errors above."
    echo "💡 Try running 'npm run lint' to see detailed errors."
fi