$Hso = New-Object Net.HttpListener
$Hso.Prefixes.Add("http://localhost:8080/")
$Hso.Start()

Write-Host "Servidor HTTP iniciado em http://localhost:8080/"
Write-Host "Pressione Ctrl+C para encerrar o servidor"

$Root = Resolve-Path .
Write-Host "Servindo arquivos de: $Root"

try {
    while ($Hso.IsListening) {
        $HC = $Hso.GetContext()
        $HRes = $HC.Response
        $HReq = $HC.Request
        
        $Path = $HReq.Url.LocalPath
        $FilePath = Join-Path $Root ($Path -replace "^/","")
        
        if ($Path -eq "/") {
            $FilePath = Join-Path $Root "taskora_v4.3_calendar_gridOK_editbug.html"
        }
        
        if (Test-Path $FilePath -PathType Leaf) {
            $ContentType = "text/plain"
            
            if ($FilePath -match "\.html$") { $ContentType = "text/html" }
            elseif ($FilePath -match "\.js$") { $ContentType = "application/javascript" }
            elseif ($FilePath -match "\.css$") { $ContentType = "text/css" }
            elseif ($FilePath -match "\.(jpg|jpeg)$") { $ContentType = "image/jpeg" }
            elseif ($FilePath -match "\.png$") { $ContentType = "image/png" }
            
            $Content = [System.IO.File]::ReadAllBytes($FilePath)
            $HRes.ContentType = $ContentType
            $HRes.ContentLength64 = $Content.Length
            $HRes.OutputStream.Write($Content, 0, $Content.Length)
        }
        else {
            $HRes.StatusCode = 404
            $Content = [System.Text.Encoding]::UTF8.GetBytes("404 - Arquivo não encontrado")
            $HRes.ContentType = "text/plain"
            $HRes.ContentLength64 = $Content.Length
            $HRes.OutputStream.Write($Content, 0, $Content.Length)
        }
        
        $HRes.Close()
    }
}
finally {
    $Hso.Stop()
}