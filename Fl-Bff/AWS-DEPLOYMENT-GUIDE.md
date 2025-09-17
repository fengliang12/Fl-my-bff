# AWS Lambda部署完整指南

本指南整合了AWS架构、部署方式对比和快速入门，为Fl-Bff项目提供完整的AWS Lambda部署解决方案。

## 📋 目录

1. [🚀 快速开始](#快速开始)
2. [🏗️ 架构概览](#架构概览)
3. [⚖️ 部署方式对比](#部署方式对比)
4. [📝 详细部署步骤](#详细部署步骤)
5. [🔧 配置参考](#配置参考)
6. [🐛 故障排除](#故障排除)

---

## 🚀 快速开始

### 5分钟理解核心概念

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

---

## 🏗️ 架构概览

### 服务关系图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CloudFormation                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    基础设施即代码 (IaC)                              │   │
│  │  管理和编排所有AWS资源的创建、更新和删除                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                       │
│                                    ▼                                       │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────┐   │
│  │      VPC        │    │   API Gateway   │    │      Lambda         │   │
│  │  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────────┐  │   │
│  │  │  安全组   │  │◄───┤  │  REST API │  │◄───┤  │   函数代码    │  │   │
│  │  └───────────┘  │    │  └───────────┘  │    │  └───────────────┘  │   │
│  │  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────────┐  │   │
│  │  │   子网    │  │◄───┤  │   路由    │  │    │  │   环境变量    │  │   │
│  │  └───────────┘  │    │  └───────────┘  │    │  └───────────────┘  │   │
│  │  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────────┐  │   │
│  │  │NAT Gateway│  │    │  │   CORS    │  │    │  │   VPC配置     │  │   │
│  │  └───────────┘  │    │  └───────────┘  │    │  └───────────────┘  │   │
│  └─────────────────┘    └─────────────────┘    └─────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 网络架构详解

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

### 依赖关系详解

#### 1. CloudFormation（编排层）
- **作用**: 基础设施即代码，统一管理所有AWS资源
- **职责**: 定义资源配置、管理创建顺序、处理依赖关系、提供回滚机制
- **依赖**: 无（顶层服务）

#### 2. VPC（网络层）
- **作用**: 提供隔离的网络环境
- **职责**: 创建虚拟私有云、定义子网、配置安全组和路由
- **依赖**: 无（基础设施层）

#### 3. Lambda（计算层）
- **作用**: 执行应用程序代码
- **职责**: 运行Node.js应用、处理HTTP请求、连接数据库、调用外部API
- **依赖**: VPC（需要网络环境）

#### 4. API Gateway（接口层）
- **作用**: 提供HTTP API入口
- **职责**: 接收HTTP请求、路由到Lambda、处理CORS、提供监控
- **依赖**: Lambda（需要后端处理函数）

---

## ⚖️ 部署方式对比

### 手动配置 vs CloudFormation

| 对比项目 | 手动配置 | CloudFormation |
|---------|---------|----------------|
| **部署时间** | 2-4小时 | 15-20分钟 |
| **出错概率** | 高 | 低 |
| **可重复性** | 差 | 优秀 |
| **版本控制** | 不支持 | 支持 |
| **团队协作** | 困难 | 简单 |
| **回滚能力** | 手动 | 自动 |
| **环境一致性** | 难保证 | 完全一致 |

### 手动配置流程（不推荐）
```
时间线: 2-4小时

第1步 [30分钟] VPC网络配置
├── 创建VPC (5分钟)
├── 创建4个子网 (10分钟)
├── 创建Internet Gateway (3分钟)
├── 创建NAT Gateway (5分钟)
└── 配置路由表和安全组 (7分钟)

第2步 [45分钟] Lambda函数配置
├── 创建IAM角色 (10分钟)
├── 打包上传代码 (15分钟)
├── 创建Lambda层 (10分钟)
└── 配置函数和VPC (10分钟)

第3步 [30分钟] API Gateway配置
├── 创建REST API (10分钟)
├── 配置资源和方法 (10分钟)
├── 设置CORS (5分钟)
└── 部署API (5分钟)

第4步 [15分钟] 测试和调试
├── 测试API端点 (10分钟)
└── 调试网络连接 (5分钟)
```

### CloudFormation自动化（推荐）
```
时间线: 15-20分钟

准备阶段 [5分钟]
├── 准备参数值 (VPC ID, 子网ID等)
└── 检查AWS CLI配置

部署阶段 [10-15分钟]
├── sam build (2分钟)
├── sam deploy (8-13分钟)
│   ├── 创建CloudFormation堆栈 (1分钟)
│   ├── 创建安全组 (2分钟)
│   ├── 部署Lambda函数 (3-5分钟)
│   ├── 创建API Gateway (2分钟)
│   └── 配置集成关系 (1分钟)
└── 获取输出信息 (1分钟)
```

---

## 📝 详细部署步骤

### 步骤1: 准备必需参数

在AWS控制台获取以下信息：

```bash
# VPC网络信息
VPC_ID="vpc-019dc15b736c3a72b"
PRIVATE_SUBNET_1="subnet-0015d272e6a9780fc"
PRIVATE_SUBNET_2="subnet-059ff661e98af5fd0"
PRIVATE_SUBNET_3="subnet-08229e02099de6f0c"
SECURITY_GROUP="sg-0ef5ca38e76692f56"

# 数据库信息
DB_HOST="fl-bff-databse-instance-1.cw9qwc4sm80c.us-east-1.rds.amazonaws.com"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="root"
DB_PASSWORD="your-password"
```

### 步骤2: 更新配置文件

编辑 `template-vpc.yaml`：

```yaml
Parameters:
  # 数据库配置
  DatabaseHost:
    Default: fl-bff-databse-instance-1.cw9qwc4sm80c.us-east-1.rds.amazonaws.com
  DatabasePassword:
    Default: your-password
  
  # VPC配置
  VpcId:
    Default: 'vpc-019dc15b736c3a72b'
  PrivateSubnet1Id:
    Default: 'subnet-0015d272e6a9780fc'
  PrivateSubnet2Id:
    Default: 'subnet-059ff661e98af5fd0'
  PrivateSubnet3Id:
    Default: 'subnet-08229e02099de6f0c'
  SecurityGroupId:
    Default: 'sg-0ef5ca38e76692f56'
```

### 步骤3: 构建和部署

```powershell
# 1. 构建项目
npm run build
sam build

# 2. 部署到AWS
sam deploy --template-file template-vpc.yaml --stack-name fl-bff-existing-vpc --capabilities CAPABILITY_IAM --resolve-s3 --no-confirm-changeset

# 3. 获取API端点
aws cloudformation describe-stacks --stack-name fl-bff-existing-vpc --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" --output text
```

### 步骤4: 测试部署

```powershell
# 测试API端点
$API_URL = "https://your-api-id.execute-api.us-east-1.amazonaws.com/dev"
Invoke-WebRequest -Uri "$API_URL/api" -Method GET
```

---

## 🔧 配置参考

### VPC组件配置

```yaml
VPC:
├── 公有子网 (Public Subnet)
│   ├── Internet Gateway (IGW)
│   └── NAT Gateway
├── 私有子网 (Private Subnet) × 3
│   └── Lambda函数部署位置
├── 安全组 (Security Groups)
│   ├── Lambda出站规则 (HTTPS: 443, HTTP: 80)
│   └── 数据库访问规则 (PostgreSQL: 5432)
└── 路由表 (Route Tables)
    ├── 公有子网路由 → IGW
    └── 私有子网路由 → NAT Gateway
```

### Lambda函数配置

```yaml
Lambda函数:
├── 代码包 (CodeUri: ./dist)
├── 运行时环境 (Runtime: nodejs20.x)
├── 内存和超时设置 (1024MB, 30s)
├── 环境变量
│   ├── 数据库连接参数
│   └── Node.js配置
├── VPC配置
│   ├── 安全组ID
│   └── 子网IDs (私有子网)
├── IAM权限
│   ├── VPC访问权限
│   ├── CloudWatch日志权限
│   └── S3访问权限
└── 依赖层 (Layer)
    └── node_modules
```

### API Gateway配置

```yaml
API Gateway:
├── REST API定义
├── 资源和方法
│   └── /{proxy+} ANY → Lambda
├── CORS配置
│   ├── AllowOrigin: '*'
│   ├── AllowMethods: '*'
│   └── AllowHeaders: 'Content-Type,Authorization'
├── 部署阶段 (Stage: dev)
└── 集成配置
    └── Lambda代理集成
```

---

## 🐛 故障排除

### 常见问题

#### 1. Lambda函数超时
```bash
# 检查VPC配置
aws lambda get-function-configuration --function-name your-function-name

# 检查NAT Gateway状态
aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=vpc-xxxxxxxxx"
```

#### 2. 数据库连接失败
```bash
# 检查安全组规则
aws ec2 describe-security-groups --group-ids sg-xxxxxxxxx

# 检查子网路由
aws ec2 describe-route-tables --filters "Name=association.subnet-id,Values=subnet-xxxxxxxxx"
```

#### 3. API Gateway 404错误
```bash
# 检查API Gateway配置
aws apigateway get-rest-apis
aws apigateway get-resources --rest-api-id your-api-id
```

### 调试命令

```powershell
# 查看CloudFormation堆栈状态
aws cloudformation describe-stacks --stack-name fl-bff-existing-vpc

# 查看Lambda函数日志
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/fl-bff"

# 测试Lambda函数
aws lambda invoke --function-name your-function-name --payload '{}' response.json
```

---

## 📚 相关资源

- [AWS Lambda开发者指南](https://docs.aws.amazon.com/lambda/)
- [AWS SAM开发者指南](https://docs.aws.amazon.com/serverless-application-model/)
- [API Gateway开发者指南](https://docs.aws.amazon.com/apigateway/)
- [VPC用户指南](https://docs.aws.amazon.com/vpc/)

---

**最后更新**: 2024年1月
**版本**: 1.0
**维护者**: FL-BFF团队