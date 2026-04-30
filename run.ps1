param(
    [int]$Port = 5500
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path ".\.env")) {
    if (Test-Path ".\.env.example") {
        Copy-Item ".\.env.example" ".\.env"
        Write-Host "Created .env from .env.example. Fill in your API keys before searching live data."
    } else {
        Write-Host "No .env found. Create one with CRUNCHBASE_API_KEY, OPENCORPORATES_API_KEY, BRANDFETCH_API_KEY."
    }
}

Write-Host "Initializing database with sample data..."
python ".\main.py"

Write-Host "Starting app server on http://localhost:$Port/"
$env:APP_PORT = "$Port"
python ".\server.py"
