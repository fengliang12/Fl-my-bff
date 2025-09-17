# AWS Lambda部署快速入门指南

## 🚀 5分钟理解核心概念

### 简单类比
```
想象你要开一家餐厅:

🏢 VPC = 整栋建筑物
   ├── 🚪 公有子网 = 前台接待区（客人可以直接进入）
   └── 🍳 私有子网 = 后厨区域（安全，不对外开放）

👨‍🍳 Lambda = 厨师（处理订单，制作食物）
   ├── 住在后厨（私有子网）
   └── 需要采购原料（通过NAT Gateway访问外网）

📋 API Gateway = 服务员（接收客人订单，传递给厨师）
   └── 站在前台，与客人直接交流

📋 CloudFormation = 建筑师的图纸
   └── 一次性规划整个餐厅的布局和设备
```

### 数据流向
```
用户请求 → API Gateway → Lambda函数 → 数据库/外部API
    ↑           ↓           ↓              ↓
  浏览器    前台服务员    后厨厨师      食材供应商
```

## ⚡ 立即开始部署

### 前置条件检查
```powershell
# 1. 检查AWS CLI
aws --version
aws sts get-caller-identity

# 2. 检查SAM CLI
sam --version

# 3. 检查Node.js
node --version
npm --version
```

### 获取必需参数
```powershell
# 在AWS控制台获取以下信息:

# VPC ID (格式: vpc-xxxxxxxxx)
$VPC_ID = "vpc-your-vpc-id"

# 公有子网ID (用于NAT Gateway)
$PUBLIC_SUBNET = "subnet-your-public-subnet-id"

# 私有子网IDs (用于Lambda，至少3个)
$PRIVATE_SUBNETS = "subnet-private-1,subnet-private-2,subnet-private-3"

# 数据库连接信息
$DB_HOST = "your-db-host.amazonaws.com"
$DB_NAME = "your-database-name"
$DB_USER = "your-db-username"
$DB_PASSWORD = "your-db-password"
```

### 一键部署命令
```powershell
# 进入项目目录
cd d:\FL2025\Fl-My-Bff\Fl-Bff

# 构建项目
npm run build

# 部署到AWS (替换为你的实际参数)
sam deploy --guided --parameter-overrides `
  VpcId=$VPC_ID `
  PublicSubnetId=$PUBLIC_SUBNET `
  PrivateSubnetIds=$PRIVATE_SUBNETS `
  DatabaseHost=$DB_HOST `
  DatabaseName=$DB_NAME `
  DatabaseUser=$DB_USER `
  DatabasePassword=$DB_PASSWORD
```

## 📋 部署过程说明

### 部署时会发生什么？
```
⏱️  时间轴 (总计约10-15分钟)

[0-2分钟] 准备阶段
├── ✅ 验证模板语法
├── ✅ 检查参数有效性
├── ✅ 创建S3存储桶（存放代码）
└── ✅ 上传代码包

[2-5分钟] 网络配置
├── 🔧 创建Lambda安全组
├── 🔧 创建NAT Gateway EIP
├── 🔧 创建NAT Gateway
└── 🔧 配置网络路由

[5-12分钟] 应用部署
├── 📦 创建依赖层 (node_modules)
├── 🚀 创建Lambda函数
├── 🔗 配置VPC连接
├── 🌐 创建API Gateway
├── 🔗 配置API集成
└── 🚀 部署API阶段

[12-15分钟] 完成配置
├── ✅ 验证资源创建
├── ✅ 配置输出信息
└── 🎉 部署完成！
```

### 成功标志
```
看到以下输出表示部署成功:

✅ CloudFormation outputs:
---------------------------------------------------------
Key                 ApiEndpoint
Description         API Gateway endpoint URL
Value               https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev

Key                 FunctionArn
Description         Lambda Function ARN
Value               arn:aws:lambda:us-east-1:123456789012:function:fl-bff-dev-NestjsFunction-xxxxx
---------------------------------------------------------

🎉 部署成功！你的API现在可以通过上面的URL访问了。
```

## 🧪 快速测试

### 测试API端点
```powershell
# 替换为你的实际API端点
$API_URL = "https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev"

# 测试健康检查
curl "$API_URL/health"

# 测试用户API
curl "$API_URL/users"

# 测试GitHub API代理
curl "$API_URL/github/user" -H "Authorization: Bearer your-github-token"
```

### 预期响应
```json
// GET /health
{
  "status": "ok",
  "timestamp": "2024-01-20T10:30:00.000Z"
}

// GET /users
[
  {
    "id": 1,
    "name": "Test User",
    "email": "test@example.com"
  }
]
```

## 🔍 故障排除

### 常见问题快速解决

#### 问题1: 部署失败 - VPC配置错误
```
❌ 错误信息: "Invalid subnet ID"

✅ 解决方案:
1. 检查子网ID格式 (subnet-xxxxxxxxx)
2. 确认子网在正确的VPC中
3. 验证子网在不同可用区

# 验证命令
aws ec2 describe-subnets --subnet-ids subnet-xxx subnet-yyy
```

#### 问题2: Lambda函数超时
```
❌ 错误信息: "Task timed out after 30.00 seconds"

✅ 解决方案:
1. 检查VPC配置是否正确
2. 确认NAT Gateway正常工作
3. 检查安全组出站规则

# 检查NAT Gateway
aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=vpc-your-id"
```

#### 问题3: 数据库连接失败
```
❌ 错误信息: "Connection refused"

✅ 解决方案:
1. 检查数据库安全组入站规则
2. 确认数据库在相同VPC或可访问网络
3. 验证数据库连接参数

# 测试连接
aws rds describe-db-instances --db-instance-identifier your-db-name
```

### 调试工具
```powershell
# 查看CloudFormation事件
aws cloudformation describe-stack-events --stack-name fl-bff-dev

# 查看Lambda日志
aws logs tail /aws/lambda/fl-bff-dev-NestjsFunction-xxxxx --follow

# 查看API Gateway日志
aws logs tail API-Gateway-Execution-Logs_xxxxxxxxxx/dev --follow
```

## 🔄 更新和维护

### 代码更新
```powershell
# 1. 修改代码后重新构建
npm run build

# 2. 重新部署（使用相同参数）
sam deploy

# 3. 验证更新
curl "$API_URL/health"
```

### 配置更新
```powershell
# 更新环境变量或其他配置
sam deploy --parameter-overrides \
  DatabaseHost=new-db-host.amazonaws.com \
  # 其他参数保持不变
```

### 回滚部署
```powershell
# 查看部署历史
aws cloudformation list-stack-resources --stack-name fl-bff-dev

# 回滚到上一个版本
aws cloudformation cancel-update-stack --stack-name fl-bff-dev
```

## 🧹 清理资源

### 删除整个堆栈
```powershell
# ⚠️  警告: 这将删除所有创建的资源
aws cloudformation delete-stack --stack-name fl-bff-dev

# 监控删除进度
aws cloudformation describe-stacks --stack-name fl-bff-dev
```

### 选择性删除
```powershell
# 只删除Lambda函数（保留网络资源）
# 需要修改template.yaml，注释掉不需要的资源
```

## 📚 下一步学习

### 进阶主题
1. **监控和日志**: 配置CloudWatch告警
2. **安全加固**: 实施最小权限原则
3. **性能优化**: 调整内存和超时设置
4. **CI/CD集成**: 自动化部署流程
5. **多环境管理**: dev/test/prod环境配置

### 有用的资源
- [AWS Lambda开发者指南](https://docs.aws.amazon.com/lambda/)
- [API Gateway文档](https://docs.aws.amazon.com/apigateway/)
- [SAM CLI参考](https://docs.aws.amazon.com/serverless-application-model/)
- [CloudFormation模板参考](https://docs.aws.amazon.com/AWSCloudFormation/)

---

💡 **提示**: 如果这是你第一次部署，建议先在开发环境测试，确认一切正常后再部署到生产环境。

🆘 **需要帮助?** 查看详细的架构说明文档 `AWS-ARCHITECTURE-GUIDE.md` 或部署对比文档 `DEPLOYMENT-COMPARISON.md`。