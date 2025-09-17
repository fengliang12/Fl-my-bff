# Lambda部署指南

本指南将帮助您将Fl-Bff项目部署到AWS Lambda，使用VPC、PostgreSQL数据库和API Gateway。

## 前置条件

1. **AWS CLI** - 已安装并配置
2. **SAM CLI** - AWS Serverless Application Model CLI
3. **Node.js** - 版本20.x
4. **PostgreSQL数据库** - 已在AWS RDS中创建
5. **VPC配置** - 包含公有和私有子网

## 网络架构

```
┌─────────────────────────────────────────────────────────────┐
│                        VPC                                  │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │   公有子网       │    │         私有子网                 │ │
│  │                │    │  ┌─────────────────────────────┐ │ │
│  │  NAT Gateway   │────┤  │       Lambda函数            │ │ │
│  │                │    │  │   (3个私有子网分布)          │ │ │
│  │  GitHub API    │    │  └─────────────────────────────┘ │ │
│  │  访问点         │    │                                 │ │
│  └─────────────────┘    │  ┌─────────────────────────────┐ │ │
│                         │  │      PostgreSQL RDS        │ │ │
│                         │  └─────────────────────────────┘ │ │
│                         └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 配置步骤

### 1. 准备VPC和子网信息

在AWS控制台中获取以下信息：

- **VPC ID**: `vpc-xxxxxxxxx`
- **公有子网ID**: `subnet-xxxxxxxxx` (用于NAT Gateway)
- **私有子网IDs**: `subnet-yyyyyyyyy,subnet-zzzzzzzzz,subnet-aaaaaaaaa` (用于Lambda)

### 2. 准备数据库信息

- **数据库主机**: `your-db-host.amazonaws.com`
- **数据库端口**: `5432`
- **数据库名称**: `your-database-name`
- **数据库用户**: `your-db-user`
- **数据库密码**: `your-db-password`

### 3. 更新配置文件

编辑 `samconfig.toml` 文件，替换以下参数：

```toml
parameter_overrides = [
    "VpcId=vpc-你的VPC-ID",
    "PublicSubnetId=subnet-你的公有子网ID", 
    "PrivateSubnetIds=subnet-私有子网1,subnet-私有子网2,subnet-私有子网3",
    "DatabaseHost=你的数据库主机",
    "DatabasePort=5432",
    "DatabaseName=你的数据库名",
    "DatabaseUser=你的数据库用户",
    "DatabasePassword=你的数据库密码"
]
```

### 4. 部署方法

#### 方法一：使用PowerShell脚本（推荐）

```powershell
.\deploy.ps1 -StackName "fl-bff-lambda-stack" `
            -VpcId "vpc-你的VPC-ID" `
            -PublicSubnetId "subnet-你的公有子网ID" `
            -PrivateSubnetIds "subnet-私有子网1,subnet-私有子网2,subnet-私有子网3" `
            -DbHost "你的数据库主机" `
            -DbName "你的数据库名" `
            -DbUser "你的数据库用户" `
            -DbPassword "你的数据库密码"
```

#### 方法二：使用npm脚本

```bash
# 构建并部署
npm run deploy

# 或者分步执行
npm run build
sam deploy --config-file samconfig.toml
```

#### 方法三：使用SAM CLI

```bash
# 构建项目
npm run build

# 部署
sam deploy --template-file template.yaml \
  --stack-name fl-bff-lambda-stack \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    VpcId=vpc-你的VPC-ID \
    PublicSubnetId=subnet-你的公有子网ID \
    PrivateSubnetIds="subnet-私有子网1,subnet-私有子网2,subnet-私有子网3" \
    DatabaseHost=你的数据库主机 \
    DatabaseName=你的数据库名 \
    DatabaseUser=你的数据库用户 \
    DatabasePassword=你的数据库密码 \
  --resolve-s3
```

## 部署后验证

### 1. 获取API端点

部署完成后，在输出中查找API端点URL，格式如下：
```
https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev
```

### 2. 测试API

```powershell
# 测试获取用户列表
Invoke-WebRequest -Uri "https://your-api-endpoint/api/form" -Method GET

# 测试创建用户
$body = @{
    name = "Test User"
    email = "test@example.com"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://your-api-endpoint/api/form" `
                  -Method POST `
                  -Body $body `
                  -ContentType "application/json"

# 测试GitHub API代理
Invoke-WebRequest -Uri "https://your-api-endpoint/api/github/user?token=your-github-token" -Method GET
```

## 监控和日志

### 查看Lambda日志

```bash
# 实时查看日志
npm run logs

# 或使用SAM CLI
sam logs -n NestjsFunction --stack-name fl-bff-lambda-stack --tail
```

### CloudWatch监控

在AWS控制台中访问CloudWatch，查看Lambda函数的：
- 调用次数
- 错误率
- 持续时间
- 内存使用情况

## 本地测试

```bash
# 本地启动API Gateway模拟器
npm run local

# 访问本地端点
# http://localhost:3000/api/form
```

## 故障排除

### 常见问题

1. **VPC连接超时**
   - 检查安全组配置
   - 确认NAT Gateway正常工作
   - 验证路由表配置

2. **数据库连接失败**
   - 检查数据库安全组是否允许Lambda访问
   - 验证数据库连接参数
   - 确认数据库在同一VPC或可访问的网络中

3. **GitHub API访问失败**
   - 检查NAT Gateway是否正常
   - 验证安全组出站规则允许HTTPS(443端口)
   - 确认GitHub token有效

### 调试命令

```bash
# 检查CloudFormation堆栈状态
aws cloudformation describe-stacks --stack-name fl-bff-lambda-stack

# 检查Lambda函数配置
aws lambda get-function --function-name fl-bff-lambda-stack-NestjsFunction-xxx

# 检查VPC配置
aws ec2 describe-vpcs --vpc-ids vpc-你的VPC-ID
aws ec2 describe-subnets --subnet-ids subnet-xxx subnet-yyy subnet-zzz
```

## 清理资源

```bash
# 删除CloudFormation堆栈
aws cloudformation delete-stack --stack-name fl-bff-lambda-stack
```

## 成本优化建议

1. **Lambda配置**
   - 根据实际需求调整内存大小
   - 设置合适的超时时间
   - 使用ARM64架构降低成本

2. **VPC配置**
   - 合理规划子网大小
   - 考虑使用VPC端点减少NAT Gateway流量

3. **监控**
   - 设置CloudWatch告警
   - 定期检查成本报告