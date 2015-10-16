#
#
#  tfx build tasks delete a615cd40-5e41-11e5-bee7-bd6eddb93f41
#
# tfx build tasks upload .
#
#
param (
    [string]$connectedServiceName,
    [string]$browsers,
    [string]$sauceConnect
  )


Write-host "Entering sample.ps1"
Write-host "browsers = $browsers"
Write-host "ConnectedServiceName = $connectedServiceName" -Verbose


$connectedServiceDetails = Get-ServiceEndpoint -Context $distributedTaskContext -Name $connectedServiceName
$connectedServiceUrl=$connectedServiceDetails.Url
$username=$connectedServiceDetails.Authorization.Parameters.Username
$accesskey=$connectedServiceDetails.Authorization.Parameters.Password



#Set 

[Environment]::SetEnvironmentVariable("SAUCE_USER_NAME", $username, "Process")
[Environment]::SetEnvironmentVariable("SAUCE_API_KEY", $accesskey, "Process")
[Environment]::SetEnvironmentVariable("SAUCE_USERNAME", $username, "Process")
[Environment]::SetEnvironmentVariable("SAUCE_ACCESS_KEY", $accesskey, "Process")


$var = [Environment]::GetEnvironmentVariable("SAUCE_USER_NAME")

Write-Host "user environment $var"

#Parse the browsers string into this format OSPlatform:Browser:Browser Version, error conditions TODO
$splitbrowser=$browsers.Split(":")

if ($splitbrowser[0]) {
	[Environment]::SetEnvironmentVariable("SELENIUM_PLATFORM", $splitbrowser[0], "Process")
	Write-Host "Setting SELENIUM_PLATFORM environment "  $splitbrowser[0]
}

if ($splitbrowser[1]) {
	[Environment]::SetEnvironmentVariable("SELENIUM_BROWSER", $splitbrowser[1], "Process")
	Write-Host "Setting SELENIUM_BROWSER environment "  $splitbrowser[1]
}

if ($splitbrowser[2]) {
	[Environment]::SetEnvironmentVariable("SELENIUM_VERSION", $splitbrowser[2], "Process")
	Write-Host "Setting SELENIUM_VERSION environment "  $splitbrowser[2]
}


