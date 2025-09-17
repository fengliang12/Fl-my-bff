# Lambda部署脚本 (PowerShell版本)
# 使用方法: .\deploy.ps1 -StackName "fl-bff-lambda-stack" -VpcId "vpc-xxx" -PublicSubnetId "subnet-xxx" -PrivateSubnetIds "subnet-yyy,subnet-zzz,subnet-aaa" -DbHost "your-db-host" -DbName "your-db" -DbUser "user" -DbPassword "password"

param(
    [string]$StackName = "fl-bff-lambda-stack",
    [string]$VpcId = "vpc-xxxxxxxxx",
    [string]$PublicSubnetId = "subnet-xxxxxxxxx",
    [string]$PrivateSubnetIds = "subnet-yyyyyyyyy,subnet-zzzzzzzzz,subnet-aaaaaaaaa",
    [string]$DbHost = "your-db-host.amazonaws.com",
    [string]$DbName = "your-database-name",
    [string]$DbUser = "your-db-user",
    [string]$DbPassword = "your-db-password"
)

Write-Host "开始部署Lambda函数到AWS..." -ForegroundColor Green
Write-Host "Stack Name: $StackName"
Write-Host "VPC ID: $VpcId"
Write-Host "Public Subnet: $PublicSubnetId"
Write-Host "Private Subnets: $PrivateSubnetIds"
Write-Host "Database Host: $DbHost"

# 检查AWS CLI是否安装
try {
    aws --version | Out-Null
} catch {
    Write-Error "错误: AWS CLI未安装，请先安装AWS CLI"
    exit 1
}

# 检查SAM CLI是否安装
try {
    sam --version | Out-Null
} catch {
    Write-Error "错误: SAM CLI未安装，请先安装SAM CLI"
    exit 1
}

# 构建项目
Write-Host "构建TypeScript项目..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "构建失败"
    exit 1
}

# 创建layer目录
Write-Host "准备依赖层..." -ForegroundColor Yellow
if (Test-Path "layer") {
    Remove-Item -Recurse -Force "layer"
}
New-Item -ItemType Directory -Path "layer\nodejs" -Force | Out-Null
Copy-Item "package.json" "layer\nodejs\"
Copy-Item "package-lock.json" "layer\nodejs\"

Push-Location "layer\nodejs"
npm install --production
if ($LASTEXITCODE -ne 0) {
    Write-Error "依赖安装失败"
    Pop-Location
    exit 1
}
Pop-Location

# 使用SAM部署
Write-Host "使用SAM部署到AWS..." -ForegroundColor Yellow
$deployCmd = @(
    "sam", "deploy",
    "--template-file", "template.yaml",
    "--stack-name", $StackName,
    "--capabilities", "CAPABILITY_IAM",
    "--parameter-overrides",
    "VpcId=$VpcId",
    "PublicSubnetId=$PublicSubnetId",
    "PrivateSubnetIds=$PrivateSubnetIds",
    "DatabaseHost=$DbHost",
    "DatabaseName=$DbName",
    "DatabaseUser=$DbUser",
    "DatabasePassword=$DbPassword",
    "--resolve-s3"
)

& $deployCmd[0] $deployCmd[1..($deployCmd.Length-1)]
if ($LASTEXITCODE -ne 0) {
    Write-Error "部署失败"
    exit 1
}

Write-Host "部署完成！" -ForegroundColor Green

# 获取API端点
try {
    $apiEndpoint = aws cloudformation describe-stacks --stack-name $StackName --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' --output text
    Write-Host "API端点: $apiEndpoint" -ForegroundColor Cyan
    Write-Host "测试API: Invoke-WebRequest -Uri '$apiEndpoint/api/form' -Method GET" -ForegroundColor Cyan
} catch {
    Write-Warning "无法获取API端点，请检查CloudFormation控制台"
}

Write-Host "部署脚本执行完成！" -ForegroundColor Green