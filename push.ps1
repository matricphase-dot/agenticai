$token = Read-Host "Paste your GitHub token (ghp_...)" -AsSecureString
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
$plainToken = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
cd E:\AgenticAI
git remote set-url origin "https://matricphase-dot:$plainToken@github.com/matricphase-dot/agenticai.git"
git push -u origin main
git remote set-url origin "https://github.com/matricphase-dot/agenticai.git"
Write-Host "Done - token removed from config for security"
