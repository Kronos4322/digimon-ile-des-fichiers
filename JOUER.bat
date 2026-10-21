@echo off
rem ============================================================================
rem  JOUER : ouvre le jeu dans sa propre fenetre, comme une application.
rem  - le jeu EN LIGNE (https://kronos4322.github.io/digimon-ile-des-fichiers/) :
rem    la version de reference, la meme sur PC et telephone, a jour a chaque
rem    publication, qui marche aussi hors ligne une fois ouverte ;
rem  - dans Chrome, sinon Edge (fenetre d'application sans barre d'adresse :
rem    --app=), sinon le navigateur par defaut ; cette console se referme aussitot ;
rem  - la premiere fois, un raccourci "Digimon" est pose sur le Bureau, avec
rem    l'icone du jeu : ensuite, un clic dessus suffit (sans meme cette console).
rem  Jamais de double-clic sur index.html : ouvert comme un fichier (file://),
rem  le navigateur interdit au jeu de lire ses propres images.
rem  CE FICHIER RESTE EN ASCII (aucune lettre accentuee, meme dans la partie
rem  PowerShell) : avec des fins de ligne LF, cmd le lit de travers des qu'il
rem  contient un caractere accentue et que la console est en UTF-8.
rem ============================================================================
setlocal
set "JEU=https://kronos4322.github.io/digimon-ile-des-fichiers/"

rem le navigateur : Chrome, sinon Edge, a leur place habituelle
set "NAV="
for %%F in (
  "%ProgramFiles%\Google\Chrome\Application\chrome.exe"
  "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
  "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
  "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
  "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
) do if not defined NAV if exist "%%~F" set "NAV=%%~F"

rem le jeu, tout de suite (ni Chrome ni Edge : le navigateur par defaut)
if defined NAV (start "" "%NAV%" --app=%JEU%) else start "" "%JEU%"

rem la premiere fois seulement : le raccourci sur le Bureau (partie PowerShell, en bas de ce fichier)
set "MARQUE=%LOCALAPPDATA%\Digimon Ile des Fichiers\raccourci.txt"
if exist "%MARQUE%" exit /b
echo Premier lancement : le jeu s'ouvre, et un raccourci Digimon est pose sur le Bureau.
echo (une seule fois, quelques secondes : cette fenetre se fermera toute seule)
set "ICONE=%~dp0assets\icons\icon-512.png"
set "BAT=%~f0"
powershell -NoProfile -Command "$t = [IO.File]::ReadAllText($env:BAT); Invoke-Expression $t.Substring($t.IndexOf('#' + 'POWERSHELL'))"
exit /b

#POWERSHELL : le raccourci "Digimon" sur le Bureau, une seule fois (cmd ne lit jamais cette partie : il s'arrete a exit /b)
# Recu de la partie cmd : JEU (adresse du jeu), NAV (Chrome ou Edge, ou rien), ICONE (image du jeu), MARQUE.
$ErrorActionPreference = 'Stop'
try {
  $dossier = Split-Path -Parent $env:MARQUE
  New-Item -ItemType Directory -Force -Path $dossier | Out-Null
  # l'icone : l'image du jeu (assets\icons\icon-512.png) en fichier .ico de 256 a 16 pixels, gardee a cote de la marque
  $ico = Join-Path $dossier 'digimon.ico'
  try {
    Add-Type -AssemblyName System.Drawing
    $src = [Drawing.Image]::FromFile($env:ICONE)
    $bords = New-Object Drawing.Imaging.ImageAttributes
    $bords.SetWrapMode([Drawing.Drawing2D.WrapMode]::TileFlipXY)   # (pas de lisere clair au bord des petites tailles)
    $tailles = 256, 48, 32, 16
    $images = @()
    foreach ($t in $tailles) {
      $bmp = New-Object Drawing.Bitmap $t, $t
      $g = [Drawing.Graphics]::FromImage($bmp)
      $g.InterpolationMode = 'HighQualityBicubic'
      $g.PixelOffsetMode = 'HighQuality'
      $g.DrawImage($src, (New-Object Drawing.Rectangle 0, 0, $t, $t), 0, 0, $src.Width, $src.Height, [Drawing.GraphicsUnit]::Pixel, $bords)
      $g.Dispose()
      $ms = New-Object IO.MemoryStream
      $bmp.Save($ms, [Drawing.Imaging.ImageFormat]::Png)
      $bmp.Dispose()
      $images += , $ms.ToArray()
    }
    $src.Dispose()
    # fichier .ico : en-tete, une entree par taille, puis les images (au format PNG, que Windows lit depuis Vista)
    $f = New-Object IO.MemoryStream
    $w = New-Object IO.BinaryWriter $f
    $w.Write([UInt16]0); $w.Write([UInt16]1); $w.Write([UInt16]$tailles.Count)
    $pos = 6 + 16 * $tailles.Count
    for ($i = 0; $i -lt $tailles.Count; $i++) {
      $cote = $tailles[$i] % 256   # (256 pixels s'ecrit 0)
      $w.Write([byte]$cote); $w.Write([byte]$cote); $w.Write([byte]0); $w.Write([byte]0)
      $w.Write([UInt16]1); $w.Write([UInt16]32); $w.Write([UInt32]$images[$i].Length); $w.Write([UInt32]$pos)
      $pos += $images[$i].Length
    }
    foreach ($im in $images) { $w.Write([byte[]]$im) }
    $w.Flush()
    [IO.File]::WriteAllBytes($ico, $f.ToArray())
  } catch {
    $ico = $null   # (sans icone : le raccourci prend celle du navigateur)
  }
  $bureau = [Environment]::GetFolderPath('Desktop')
  $lnk = Join-Path $bureau 'Digimon.lnk'
  $url = Join-Path $bureau 'Digimon.url'
  if ((Test-Path -LiteralPath $lnk) -or (Test-Path -LiteralPath $url)) {
    Write-Host 'Un raccourci Digimon est deja sur le Bureau.'
  } else {
    if ($env:NAV) {
      # Chrome ou Edge en fenetre d'application : le raccourci les ouvre directement, sans console
      $r = (New-Object -ComObject WScript.Shell).CreateShortcut($lnk)
      $r.TargetPath = $env:NAV
      $r.Arguments = '--app=' + $env:JEU
      $r.WorkingDirectory = Split-Path -Parent $env:NAV
      $r.Description = "Digimon, l'Aventure de l'" + [char]0xCE + 'le des Fichiers (le jeu en ligne)'
      if ($ico) { $r.IconLocation = $ico + ',0' }
      $r.Save()
    } else {
      # navigateur par defaut : un raccourci Internet
      $texte = "[InternetShortcut]`r`nURL=$env:JEU`r`n"
      if ($ico) { $texte += "IconFile=$ico`r`nIconIndex=0`r`n" }
      [IO.File]::WriteAllText($url, $texte, [Text.Encoding]::Default)
    }
    Write-Host 'Raccourci Digimon mis sur le Bureau : la prochaine fois, clique simplement dessus.'
  }
} catch {
  Write-Host ('Impossible de mettre le raccourci sur le Bureau (' + $_.Exception.Message + ') : JOUER.bat suffit pour jouer.')
} finally {
  # la marque : le raccourci n'est propose qu'une fois (supprimer ce fichier pour que JOUER.bat le remette)
  try {
    $note = 'JOUER.bat a mis le raccourci Digimon sur le Bureau le ' + (Get-Date -Format 'dd/MM/yyyy (HH:mm)') + ".`r`n" +
      "Supprimer ce fichier pour qu'il le remette au prochain lancement.`r`n"
    [IO.File]::WriteAllText($env:MARQUE, $note)
  } catch { }
}
Start-Sleep -Seconds 3
