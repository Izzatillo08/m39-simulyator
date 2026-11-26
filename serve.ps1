# «Барҳам: М-39» — Python бўлмаган компьютерда локал HTTP сервер
# Ишга тушириш:  powershell -ExecutionPolicy Bypass -File serve.ps1 [-Port 8780] [-Open]
# Сўнг браузерда: http://localhost:8780/
# Tezlashtirilgan: bir vaqtda 8 ta so'rov (parallel oqimlar), fayllar bo'laklab uzatiladi,
# video/audio uchun Range (206 Partial Content) — video darhol boshlanadi va oldinga o'tkazish ishlaydi.
param([int]$Port = 8780, [switch]$Open, [int]$Workers = 8)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# Port band bo'lsa (masalan, eski nusxa ishlayotgan bo'lsa) — keyingi bo'sh port tanlanadi
$l = $null
for ($p = $Port; $p -lt $Port + 20; $p++) {
  try { $t = New-Object System.Net.HttpListener; $t.Prefixes.Add("http://localhost:$p/"); $t.Start(); $l = $t; $Port = $p; break } catch { }
}
if (-not $l) { Write-Host "Bo'sh port topilmadi"; exit 1 }
Write-Host "Barham M-39: http://localhost:$Port/  (to'xtatish - Ctrl+C)"
if ($Open) { Start-Process "http://localhost:$Port/" }

# Har bir ishchi oqim shu blokni bajaradi: so'rovni oladi va javob beradi
$worker = {
  param($l, $root)
  $mime = @{
    '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.json'='application/json; charset=utf-8'
    '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.webp'='image/webp'; '.svg'='image/svg+xml'; '.otf'='font/otf'; '.ttf'='font/ttf'; '.woff2'='font/woff2'
    '.mp4'='video/mp4'; '.webm'='video/webm'; '.mp3'='audio/mpeg'; '.ogg'='audio/ogg'; '.m4a'='audio/mp4'; '.wav'='audio/wav'
    '.glb'='model/gltf-binary'; '.gltf'='model/gltf+json'; '.txt'='text/plain; charset=utf-8'; '.md'='text/plain; charset=utf-8'
  }
  while ($l.IsListening) {
    try { $ctx = $l.GetContext() } catch { break }
    $req = $ctx.Request; $res = $ctx.Response; $fs = $null
    try {
      $rel = [Uri]::UnescapeDataString($req.Url.AbsolutePath.TrimStart('/'))
      $path = [IO.Path]::GetFullPath((Join-Path $root $rel))
      if (-not $path.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)) { $res.StatusCode = 403; $res.Close(); continue }
      if (Test-Path -LiteralPath $path -PathType Container) {
        $idx = Join-Path $path 'index.html'
        if ($rel -eq '' -and (Test-Path -LiteralPath $idx)) { $path = $idx }
        else {
          # папка рўйхати (дастур медиа файлларни шу орқали аниқлайди)
          $items = Get-ChildItem -LiteralPath $path | ForEach-Object { $n = $_.Name + $(if ($_.PSIsContainer) { '/' } else { '' }); '<li><a href="' + [Uri]::EscapeDataString($_.Name) + $(if ($_.PSIsContainer) { '/' } else { '' }) + '">' + [Net.WebUtility]::HtmlEncode($n) + '</a></li>' }
          $b = [Text.Encoding]::UTF8.GetBytes('<!doctype html><meta charset="utf-8"><ul>' + ($items -join '') + '</ul>')
          $res.ContentType = 'text/html; charset=utf-8'; $res.ContentLength64 = $b.Length; $res.OutputStream.Write($b, 0, $b.Length); $res.Close(); continue
        }
      }
      if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { $res.StatusCode = 404; $res.Close(); continue }
      $ext = [IO.Path]::GetExtension($path).ToLower()
      $res.ContentType = $(if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' })
      $res.Headers.Add('Accept-Ranges', 'bytes')
      # kod fayllari doim yangisi; og'ir media/model fayllari brauzer keshida 1 soat saqlanadi
      if ($ext -in '.html', '.js', '.css', '.json') { $res.Headers.Add('Cache-Control', 'no-cache') } else { $res.Headers.Add('Cache-Control', 'max-age=3600') }
      $fs = [IO.File]::Open($path, 'Open', 'Read', 'ReadWrite')
      $len = $fs.Length; $start = 0; $end = $len - 1
      $range = $req.Headers['Range']
      if ($range -and $range -match '^bytes=(\d*)-(\d*)$') {
        if ($Matches[1] -ne '') { $start = [int64]$Matches[1]; if ($Matches[2] -ne '') { $end = [Math]::Min([int64]$Matches[2], $len - 1) } }
        elseif ($Matches[2] -ne '') { $start = [Math]::Max(0, $len - [int64]$Matches[2]) }
        if ($start -gt $end -or $start -ge $len) { $res.StatusCode = 416; $res.Headers.Add('Content-Range', "bytes */$len"); $res.Close(); $fs.Close(); continue }
        $res.StatusCode = 206; $res.Headers.Add('Content-Range', "bytes $start-$end/$len")
      }
      $count = $end - $start + 1
      $res.ContentLength64 = $count
      if ($req.HttpMethod -ne 'HEAD') {
        $fs.Position = $start; $buf = New-Object byte[] 262144; $left = $count
        while ($left -gt 0) {
          $n = $fs.Read($buf, 0, [int][Math]::Min($buf.Length, $left)); if ($n -le 0) { break }
          $res.OutputStream.Write($buf, 0, $n); $left -= $n
        }
      }
      $res.Close()
    } catch { try { $res.Abort() } catch {} }
    finally { if ($fs) { $fs.Dispose() } }
  }
}

$pool = [RunspaceFactory]::CreateRunspacePool(1, $Workers); $pool.Open()
$jobs = @()
for ($i = 0; $i -lt $Workers; $i++) {
  $ps = [PowerShell]::Create(); $ps.RunspacePool = $pool
  [void]$ps.AddScript($worker).AddArgument($l).AddArgument($root)
  $jobs += [pscustomobject]@{ ps = $ps; h = $ps.BeginInvoke() }
}
try { while ($l.IsListening) { Start-Sleep -Milliseconds 500 } }
finally { $l.Stop(); $l.Close(); foreach ($j in $jobs) { try { $j.ps.Dispose() } catch {} }; $pool.Close() }
