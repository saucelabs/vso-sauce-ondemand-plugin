param (
    [string]$connectedServiceName,
    [string]$browsers,
    [string]$sauceConnect
)

$connectedServiceDetails = Get-ServiceEndpoint -Context $distributedTaskContext -Name $connectedServiceName
$env:INPUT_connectedServiceName = $connectedServiceName
$env:INPUT_endpointUrl = $connectedServiceDetails.Url
$env:INPUT_endpointAuthToken = $connectedServiceDetails.Authorization.Parameters.Password
$env:INPUT_endpointUsername = $connectedServiceDetails.Authorization.Parameters.Username

$env:INPUT_browsers = $browsers
$env:INPUT_sauceConnect = $sauceConnect

node sauceondemand.js
