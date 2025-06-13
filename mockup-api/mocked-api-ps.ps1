# Simple mock API server for MES flow in PowerShell
# Run in terminal: powershell -ExecutionPolicy Bypass -File .\mes-api.ps1

Add-Type -AssemblyName System.Net.HttpListener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:3001/")
$listener.Start()

Write-Host "Mock MES API running at http://localhost:3001"

$steps = @(
    @{ id = 'confirm-shoulder'; description = 'Is the animal divided?'; type = 'confirm' },
    @{ id = 'remove-injury'; description = 'Remove shoulder injury from carcass'; type = 'confirm' },
    @{ id = 'input-weight'; description = 'Enter weight of removed part (kg)'; type = 'input' },
    @{ id = 'upload-photo'; description = 'Upload picture of removed part'; type = 'photo' },
    @{ id = 'print-labels'; description = 'Print new label'; type = 'labels' }
)

$currentIndex = 0

while ($true) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    if ($request.Url.AbsolutePath -eq "/next-action") {
        $step = $steps[$currentIndex]
        $step["lastStep"] = ($currentIndex -eq ($steps.Count - 1))
        $json = ($step | ConvertTo-Json -Depth 2)
    }
    elseif ($request.Url.AbsolutePath -eq "/submit" -or $request.Url.AbsolutePath -eq "/upload-photo") {
        $reader = New-Object System.IO.StreamReader($request.InputStream)
        $body = $reader.ReadToEnd()
        Write-Host "Received: $($body.Substring(0, [Math]::Min(300, $body.Length)))"
        if ($currentIndex -lt $steps.Count - 1) { $currentIndex++ }
        $json = "{}"
    }
    else {
        $response.StatusCode = 404
        $response.Close()
        continue
    }

    $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
    $response.ContentLength64 = $buffer.Length
    $response.ContentType = "application/json"
    $response.OutputStream.Write($buffer, 0, $buffer.Length)
    $response.Close()
}
