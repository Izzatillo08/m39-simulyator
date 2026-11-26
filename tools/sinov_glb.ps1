param([string]$Out)
# Minimal GLB: two boxes (cab red + trailer white), length along Z (to test auto-rotate), non-indexed
$ErrorActionPreference = 'Stop'
$Out = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Out)
function Box($cx, $cy, $cz, $sx, $sy, $sz) {
  $p = New-Object System.Collections.Generic.List[single]; $n = New-Object System.Collections.Generic.List[single]
  $hx = $sx / 2; $hy = $sy / 2; $hz = $sz / 2
  $faces = @(
    @(@(1, 0, 0), @(@($hx, -$hy, -$hz), @($hx, $hy, -$hz), @($hx, $hy, $hz), @($hx, -$hy, $hz))),
    @(@(-1, 0, 0), @(@(-$hx, -$hy, $hz), @(-$hx, $hy, $hz), @(-$hx, $hy, -$hz), @(-$hx, -$hy, -$hz))),
    @(@(0, 1, 0), @(@(-$hx, $hy, -$hz), @(-$hx, $hy, $hz), @($hx, $hy, $hz), @($hx, $hy, -$hz))),
    @(@(0, -1, 0), @(@(-$hx, -$hy, $hz), @(-$hx, -$hy, -$hz), @($hx, -$hy, -$hz), @($hx, -$hy, $hz))),
    @(@(0, 0, 1), @(@($hx, -$hy, $hz), @($hx, $hy, $hz), @(-$hx, $hy, $hz), @(-$hx, -$hy, $hz))),
    @(@(0, 0, -1), @(@(-$hx, -$hy, -$hz), @(-$hx, $hy, -$hz), @($hx, $hy, -$hz), @($hx, -$hy, -$hz))))
  foreach ($f in $faces) { $q = $f[1]; foreach ($ix in 0, 1, 2, 0, 2, 3) { $v = $q[$ix]; $p.Add($v[0] + $cx); $p.Add($v[1] + $cy); $p.Add($v[2] + $cz); $n.Add($f[0][0]); $n.Add($f[0][1]); $n.Add($f[0][2]) } }
  return , @($p, $n)
}
$parts = @((Box 0 1.5 6.5 2.5 2.8 2.4), (Box 0 1.9 -1.5 2.5 3.6 13))
$bin = New-Object System.IO.MemoryStream; $bw = New-Object System.IO.BinaryWriter($bin)
$views = @(); $accs = @(); $meshes = @()
$mats = '[{"pbrMetallicRoughness":{"baseColorFactor":[0.8,0.1,0.1,1],"metallicFactor":0.2,"roughnessFactor":0.6}},{"pbrMetallicRoughness":{"baseColorFactor":[0.92,0.92,0.92,1],"metallicFactor":0.1,"roughnessFactor":0.7}}]'
for ($k = 0; $k -lt 2; $k++) {
  $P = $parts[$k][0]; $N = $parts[$k][1]; $cnt = $P.Count / 3
  $mn = @(1e9, 1e9, 1e9); $mx = @(-1e9, -1e9, -1e9)
  for ($i = 0; $i -lt $P.Count; $i++) { $a = $i % 3; if ($P[$i] -lt $mn[$a]) { $mn[$a] = $P[$i] }; if ($P[$i] -gt $mx[$a]) { $mx[$a] = $P[$i] } }
  $off = $bin.Position; foreach ($v in $P) { $bw.Write([single]$v) }; $views += '{"buffer":0,"byteOffset":' + $off + ',"byteLength":' + ($P.Count * 4) + '}'
  $off2 = $bin.Position; foreach ($v in $N) { $bw.Write([single]$v) }; $views += '{"buffer":0,"byteOffset":' + $off2 + ',"byteLength":' + ($N.Count * 4) + '}'
  $inv = [Globalization.CultureInfo]::InvariantCulture
  $accs += '{"bufferView":' + ($k * 2) + ',"componentType":5126,"count":' + $cnt + ',"type":"VEC3","min":[' + (($mn | ForEach-Object { $_.ToString($inv) }) -join ',') + '],"max":[' + (($mx | ForEach-Object { $_.ToString($inv) }) -join ',') + ']}'
  $accs += '{"bufferView":' + ($k * 2 + 1) + ',"componentType":5126,"count":' + $cnt + ',"type":"VEC3"}'
  $meshes += '{"primitives":[{"attributes":{"POSITION":' + ($k * 2) + ',"NORMAL":' + ($k * 2 + 1) + '},"material":' + $k + '}]}'
}
while ($bin.Position % 4) { $bw.Write([byte]0) }; $bw.Flush(); [byte[]]$binBytes = $bin.ToArray()
$json = '{"asset":{"version":"2.0"},"scene":0,"scenes":[{"nodes":[0,1]}],"nodes":[{"mesh":0},{"mesh":1}],"meshes":[' + ($meshes -join ',') + '],"materials":' + $mats + ',"accessors":[' + ($accs -join ',') + '],"bufferViews":[' + ($views -join ',') + '],"buffers":[{"byteLength":' + $binBytes.Length + '}]}'
while (([Text.Encoding]::UTF8.GetByteCount($json)) % 4) { $json += " " }; [byte[]]$jb = [Text.Encoding]::UTF8.GetBytes($json)
$ms2 = New-Object System.IO.MemoryStream; $w = New-Object System.IO.BinaryWriter($ms2)
$w.Write([uint32]0x46546C67); $w.Write([uint32]2); $w.Write([uint32](12 + 8 + $jb.Length + 8 + $binBytes.Length))
$w.Write([uint32]$jb.Length); $w.Write([uint32]0x4E4F534A); $w.Write($jb)
$w.Write([uint32]$binBytes.Length); $w.Write([uint32]0x004E4942); $w.Write($binBytes); $w.Flush()
[IO.File]::WriteAllBytes($Out, $ms2.ToArray()); "glb " + (Get-Item $Out).Length
