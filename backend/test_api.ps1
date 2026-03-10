$loginUrl = "http://localhost:8080/api/auth/signin"
$sessionsUrl = "http://localhost:8080/api/faculty/sessions"

$loginData = @{
    email = "TestF@gmail.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $loginData -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "Login successful. Token: $($token.Substring(0, 20))..."

    $headers = @{
        Authorization = "Bearer $token"
    }

    $sessionsResponse = Invoke-RestMethod -Uri $sessionsUrl -Method Get -Headers $headers
    Write-Host "Sessions Response Count: $($sessionsResponse.Count)"
    $sessionsResponse | ConvertTo-Json -Depth 5
} catch {
    Write-Error "Request failed: $_"
}
