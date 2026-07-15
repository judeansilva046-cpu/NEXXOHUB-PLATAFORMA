$ErrorActionPreference = 'Stop'

$envPath = Join-Path (Get-Location) '.env.local'

if (-not (Test-Path $envPath)) {
  New-Item -Path $envPath -ItemType File | Out-Null
}

$email = Read-Host 'Email da conta exclusiva de homologacao'
$securePassword = Read-Host 'Senha da conta exclusiva de homologacao' -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)

try {
  $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

if ([string]::IsNullOrWhiteSpace($email) -or [string]::IsNullOrWhiteSpace($password)) {
  throw 'Email e senha sao obrigatorios.'
}

$updates = @{
  PLAYWRIGHT_TEST_BASE_URL = 'http://localhost:3001'
  PLAYWRIGHT_TEST_EMAIL = $email.Trim()
  PLAYWRIGHT_TEST_PASSWORD = $password
}

$lines = @(Get-Content $envPath -ErrorAction SilentlyContinue)

foreach ($key in $updates.Keys) {
  $value = $updates[$key]
  $escapedKey = [regex]::Escape($key)
  $index = -1

  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "^$escapedKey=") {
      $index = $i
      break
    }
  }

  if ($index -ge 0) {
    $lines[$index] = "$key=$value"
  } else {
    $lines += "$key=$value"
  }
}

Set-Content -Path $envPath -Value $lines -Encoding utf8
Write-Host 'Credenciais E2E atualizadas em .env.local.'
Write-Host 'Agora rode: npm.cmd run test:e2e -- --project=chromium'
