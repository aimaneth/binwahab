# Create fonts directory if it doesn't exist
New-Item -ItemType Directory -Force -Path "..\public\fonts"

# Define font weights to download
$weights = @("Regular", "Medium", "SemiBold", "Bold")

# Download each font weight
foreach ($weight in $weights) {
    $url = "https://raw.githubusercontent.com/rsms/inter/master/docs/font-files/Inter-$weight.woff2"
    $output = "..\public\fonts\Inter-$weight.woff2"
    
    Write-Host "Downloading Inter-$weight.woff2..."
    Invoke-WebRequest -Uri $url -OutFile $output
}

Write-Host "Font downloads complete!" 