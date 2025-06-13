# PowerShell version of the mock MES API
# Run with: powershell -ExecutionPolicy Bypass -File .\mes-api.ps1

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

function Send-Json($response, $obj) {
    $json = $obj | ConvertTo-Json -Depth 4
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    $response.ContentLength64 = $bytes.Length
    $response.ContentType = 'application/json'
    $response.Headers.Add('Access-Control-Allow-Origin', '*')
    $response.OutputStream.Write($bytes, 0, $bytes.Length)
    $response.Close()
}

while ($true) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    $path = $request.Url.AbsolutePath

    switch ($path) {
        '/next-action' {
            if ($currentIndex -ge $steps.Count) {
                Send-Json $response @(@{ finished = $true })
                continue
            }
            $action = $steps[$currentIndex].PSObject.Copy()
            $currentIndex++
            if ($currentIndex -ge $steps.Count) { $action.finished = $true }
            Send-Json $response $action
        }
        '/submit' {
            $reader = New-Object System.IO.StreamReader($request.InputStream)
            $body = $reader.ReadToEnd()
            Write-Host "Received data on /submit: $body"
            Send-Json $response @{}
        }
        '/upload-photo' {
            $reader = New-Object System.IO.StreamReader($request.InputStream)
            $body = $reader.ReadToEnd()
            Write-Host "Photo uploaded on /upload-photo: $body"
            Send-Json $response @{}
        }
        '/station' {
            Send-Json $response @{ name = 'ESA_SH05 - Slaughter Recovery'; printer = 'LBL 101' }
        }
        '/animal-info' {
            $num = $request.QueryString['number']
            Send-Json $response @{ id = $num; type = 'Vitender'; date = '2025-01-13' }
        }
        '/session' {
            Send-Json $response @{ status = 'ok'; timestamp = (Get-Date).ToString('o') }
        }
        '/reset' {
            $currentIndex = 0
            Write-Host 'Session reset: currentIndex set to 0'
            Send-Json $response @{ message = 'Session has been reset.' }
        }
        Default {
            $response.StatusCode = 404
            $response.Close()
        }
    }
}
