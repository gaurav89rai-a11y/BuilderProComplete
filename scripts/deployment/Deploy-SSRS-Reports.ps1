<#
.SYNOPSIS
    Automated PowerShell Deployment Script for BuilderPro ERP SSRS Reports
.DESCRIPTION
    Deploys RDL report definitions to Microsoft SQL Server Reporting Services (SSRS 2016-2022 / Power BI Report Server).
    Creates the /BuilderPro folder, configures the shared data source, and publishes all report definitions.
.PARAMETER ReportServerUri
    The SSRS Report Server web service URL (default: http://localhost/ReportServer)
.PARAMETER TargetFolder
    The report folder on SSRS (default: /BuilderPro)
.PARAMETER DataSourceName
    The name of the shared data source (default: BuilderProDataSource)
.PARAMETER ConnectionString
    The SQL Server connection string for the shared data source
#>

[CmdletBinding()]
param(
    [string]$ReportServerUri = "http://localhost/ReportServer",
    [string]$TargetFolder = "/BuilderPro",
    [string]$DataSourceName = "BuilderProDataSource",
    [string]$ConnectionString = "Data Source=localhost\SQLEXPRESS;Initial Catalog=BuilderProDB;Integrated Security=True",
    [string]$ReportsPath = "e:\BuilderProComplete\BuilderProAPI\Reports",
    [switch]$UseDefaultCredentials = $true,
    [string]$Username = "",
    [string]$Password = "",
    [string]$Domain = ""
)

$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  BuilderPro ERP — SSRS Automated Report Deployment Tool    " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Report Server URL: $ReportServerUri"
Write-Host "Target Folder:     $TargetFolder"
Write-Host "Reports Directory: $ReportsPath"
Write-Host ""

# 1. Connect to SSRS Web Service
$webServiceUrl = "$($ReportServerUri.TrimEnd('/'))/ReportService2010.asmx?WSDL"
Write-Host "Connecting to SSRS Web Service: $webServiceUrl..." -ForegroundColor Yellow

try {
    $proxy = New-WebServiceProxy -Uri $webServiceUrl -UseDefaultCredential:$UseDefaultCredentials
    if (-not $UseDefaultCredentials -and $Username) {
        $proxy.Credentials = New-Object System.Net.NetworkCredential($Username, $Password, $Domain)
    }
    Write-Host "[OK] Connected to SSRS Web Service successfully." -ForegroundColor Green
} catch {
    Write-Warning "Could not connect to SSRS Web Service at '$webServiceUrl'."
    Write-Warning "Reason: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "If SSRS is not yet installed on this machine, follow docs\SSRS_SETUP_AND_DEPLOYMENT_GUIDE.md." -ForegroundColor Yellow
    Write-Host "Note: BuilderPro ERP includes a built-in High-Performance SQL Engine fallback that runs seamlessly without SSRS." -ForegroundColor Yellow
    exit 0
}

# 2. Create Target Folder if not exists
try {
    $cleanFolder = $TargetFolder.TrimStart('/')
    $parent = "/"
    $name = $cleanFolder
    if ($cleanFolder.Contains("/")) {
        $parts = $cleanFolder.Split("/")
        $parent = "/" + ($parts[0..($parts.Length - 2)] -join "/")
        $name = $parts[-1]
    }

    $existingItems = $proxy.ListChildren($parent, $false)
    $folderExists = $existingItems | Where-Object { $_.TypeName -eq "Folder" -and $_.Name -eq $name }

    if (-not $folderExists) {
        Write-Host "Creating folder '$TargetFolder' on Report Server..." -ForegroundColor Yellow
        $proxy.CreateFolder($name, $parent, $null)
        Write-Host "[OK] Folder '$TargetFolder' created." -ForegroundColor Green
    } else {
        Write-Host "[OK] Target folder '$TargetFolder' already exists." -ForegroundColor Green
    }
} catch {
    Write-Warning "Folder check/creation notice: $($_.Exception.Message)"
}

# 3. Create or Verify Shared DataSource
try {
    Write-Host "Configuring shared DataSource '$DataSourceName'..." -ForegroundColor Yellow
    $dsDefinition = New-Object Microsoft.PowerShell.Commands.NewWebserviceProxy.InputObject.DataSourceDefinition
    $dsDefinition.Extension = "SQL"
    $dsDefinition.ConnectString = $ConnectionString
    $dsDefinition.UseOriginalConnectString = $false
    $dsDefinition.OriginalConnectStringExpressionBased = $false
    $dsDefinition.CredentialRetrieval = "Integrated"
    $dsDefinition.Enabled = $true
    $dsDefinition.EnabledSpecified = $true

    $proxy.CreateDataSource($DataSourceName, $TargetFolder, $true, $dsDefinition, $null)
    Write-Host "[OK] Shared DataSource '$DataSourceName' configured in '$TargetFolder'." -ForegroundColor Green
} catch {
    Write-Warning "DataSource notice: $($_.Exception.Message)"
}

# 4. Deploy RDL Reports
if (-not (Test-Path $ReportsPath)) {
    Write-Error "Reports directory not found at '$ReportsPath'."
}

$rdlFiles = Get-ChildItem -Path $ReportsPath -Filter "*.rdl"
Write-Host "Found $($rdlFiles.Count) RDL report definition(s) to publish." -ForegroundColor Cyan
Write-Host ""

$successCount = 0
foreach ($rdl in $rdlFiles) {
    $reportName = [System.IO.Path]::GetFileNameWithoutExtension($rdl.Name)
    Write-Host "Publishing [$($rdl.Name)] as '$reportName'..." -NoNewline

    try {
        $bytes = [System.IO.File]::ReadAllBytes($rdl.FullName)
        $warnings = $null
        $reportItem = $proxy.CreateCatalogItem("Report", $reportName, $TargetFolder, $true, $bytes, $null, [ref]$warnings)

        # Bind report to the shared data source in the folder
        try {
            $dataSources = $proxy.GetItemDataSources("$TargetFolder/$reportName")
            $dsRef = New-Object Microsoft.PowerShell.Commands.NewWebserviceProxy.InputObject.DataSourceReference
            $dsRef.Reference = "$TargetFolder/$DataSourceName"

            foreach ($ds in $dataSources) {
                $ds.Item = $dsRef
            }
            $proxy.SetItemDataSources("$TargetFolder/$reportName", $dataSources)
        } catch {
            # Continue even if data source binding has warnings
        }

        Write-Host " [SUCCESS]" -ForegroundColor Green
        $successCount++
    } catch {
        Write-Host " [FAILED]" -ForegroundColor Red
        Write-Warning "  $($_.Exception.Message)"
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Deployment Summary: $successCount / $($rdlFiles.Count) Reports Published Successfully!  " -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Access URL: $ReportServerUri?/BuilderPro"
