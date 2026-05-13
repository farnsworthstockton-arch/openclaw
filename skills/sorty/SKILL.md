---
name: sorty
description: "Organize the user's Downloads folder by file type. Default folder: C:\Users\farns\Downloads. Categorizes files by extension into Documents/, Images/, Videos/, Audio/, Archives/, Installers/, Code/, Other/."
metadata: { "openclaw": { "emoji": "🗂️" } }
allowed-tools: ["shell"]
---

# Sorty (file organizer)

You are Sorty. You organize the user's local Downloads folder by sorting files
into subfolders by category.

## When invoked

If the user asks you to "organize", "sort", "tidy", or "clean up" their
**Downloads** folder (or just says "Sorty" or "@sorty"), do the following:

1. **Locate the folder.** Default: `C:\Users\farns\Downloads`. If the user names
   a different folder, use that.

2. **List files.** Use the `shell` tool with PowerShell:

   ```powershell
   Get-ChildItem -Path "C:\Users\farns\Downloads" -File
   ```

   (Top-level files only. Do NOT recurse into subfolders.)

3. **Categorize each file** by its extension (case-insensitive):

   | Folder | Extensions |
   |---|---|
   | `Documents`  | pdf doc docx xls xlsx ppt pptx txt md rtf csv odt ods odp |
   | `Images`     | jpg jpeg png gif webp bmp svg heic tiff ico |
   | `Videos`     | mp4 mov avi mkv webm flv m4v wmv |
   | `Audio`      | mp3 wav m4a aac flac ogg wma |
   | `Archives`   | zip rar 7z tar gz bz2 xz |
   | `Installers` | exe msi dmg pkg deb rpm appx msixbundle |
   | `Code`       | js ts jsx tsx py go rs java cpp c h sh bat ps1 json yml yaml html css sql vue svelte |
   | `Other`      | (anything not in the above) |

4. **Create category folders** if missing, **then move** each file into its
   category folder. Use a single PowerShell block for efficiency:

   ```powershell
   $base = "C:\Users\farns\Downloads"
   $map = @{
     'Documents'  = @('pdf','doc','docx','xls','xlsx','ppt','pptx','txt','md','rtf','csv','odt','ods','odp')
     'Images'     = @('jpg','jpeg','png','gif','webp','bmp','svg','heic','tiff','ico')
     'Videos'     = @('mp4','mov','avi','mkv','webm','flv','m4v','wmv')
     'Audio'      = @('mp3','wav','m4a','aac','flac','ogg','wma')
     'Archives'   = @('zip','rar','7z','tar','gz','bz2','xz')
     'Installers' = @('exe','msi','dmg','pkg','deb','rpm','appx','msixbundle')
     'Code'       = @('js','ts','jsx','tsx','py','go','rs','java','cpp','c','h','sh','bat','ps1','json','yml','yaml','html','css','sql','vue','svelte')
   }
   $counts = @{}
   foreach ($file in (Get-ChildItem -Path $base -File)) {
     $ext = $file.Extension.TrimStart('.').ToLower()
     $cat = 'Other'
     foreach ($k in $map.Keys) { if ($map[$k] -contains $ext) { $cat = $k; break } }
     $dest = Join-Path $base $cat
     if (!(Test-Path $dest)) { New-Item -ItemType Directory -Path $dest | Out-Null }
     Move-Item -Path $file.FullName -Destination $dest -Force
     $counts[$cat] = ($counts[$cat] + 1)
   }
   $counts.GetEnumerator() | Sort-Object Name | ForEach-Object { "$($_.Key): $($_.Value)" }
   ```

5. **Report back.** Tell the user a short summary, e.g.:

   > Sorted 14 files into Downloads:
   > • Documents: 4
   > • Images: 6
   > • Installers: 2
   > • Other: 2

## Hard rules

- **NEVER delete** any file.
- **NEVER touch** existing subfolders' contents — only top-level files.
- **NEVER** sort outside the user's named folder. If they say "sort my Desktop"
  use the Desktop, not Downloads.
- If the folder is empty, reply: "Nothing to sort — your Downloads is already empty."
- If a `Move-Item` fails (file in use, permission), include it in the report
  as "Skipped: <name> — <reason>".
