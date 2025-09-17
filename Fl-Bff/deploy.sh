#!/bin/bash

# Lambda部署脚本
# 使用方法: ./deploy.sh [stack-name] [vpc-id] [public-subnet-id] [private-subnet-ids] [db-host] [db-name] [db-user] [db-password]

set -e

# 默认参数
STACK_NAME=${1:-"fl-bff-lambda-stack"}
VPC_ID=${2:-"vpc-xxxxxxxxx"}
PUBLIC_SUBNET_ID=${3:-"subnet-xxxxxxxxx"}
PRIVATE_SUBNET_IDS=${4:-"subnet-yyyyyyyyy,subnet-zzzzzzzzz,subnet-aaaaaaaaa"}
DB_HOST=${5:-"your-db-host.amazonaws.com"}
DB_NAME=${6:-"your-database-name"}
DB_USER=${7:-"your-db-user"}
DB_PASSWORD=${8:-"your-db-password"}

echo "开始部署Lambda函数到AWS..."
echo "Stack Name: $STACK_NAME"
echo "VPC ID: $VPC_ID"
echo "Public Subnet: $PUBLIC_SUBNET_ID"
echo "Private Subnets: $PRIVATE_SUBNET_IDS"
echo "Database Host: $DB_HOST"

# 检查AWS CLI是否安装
if ! command -v aws &> /dev/null; then
    echo "错误: AWS CLI未安装，请先安装AWS CLI"
    exit 1
fi

# 检查SAM CLI是否安装
if ! command -v sam &> /dev/null; then
    echo "错误: SAM CLI未安装，请先安装SAM CLI"
    exit 1
fi

# 构建项目
echo "构建TypeScript项目..."
npm run build

# 创建layer目录
echo "准备依赖层..."
mkdir -p layer/nodejs
cp package.json layer/nodejs/
cp package-lock.json layer/nodejs/
cd layer/nodejs
npm install --production
cd ../..

# 使用SAM部署
echo "使用SAM部署到AWS..."
sam deploy \
  --template-file template.yaml \
  --stack-name $STACK_NAME \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    VpcId=$VPC_ID \
    PublicSubnetId=$PUBLIC_SUBNET_ID \
    PrivateSubnetIds="$PRIVATE_SUBNET_IDS" \
    DatabaseHost=$DB_HOST \
    DatabaseName=$DB_NAME \
    DatabaseUser=$DB_USER \
    DatabasePassword=$DB_PASSWORD \
  --resolve-s3

echo "部署完成！"

# 获取API端点
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text)

echo "API端点: $API_ENDPOINT"
echo "测试API: curl $API_ENDPOINT/api/form"