# AWS服务架构关系详解

本文档详细解释CloudFormation、API Gateway、Lambda和VPC之间的依赖关系，以及手动配置的正确顺序。

## 1. 服务关系概览

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

## 2. 依赖关系详解

### 2.1 CloudFormation（编排层）
**作用**: 基础设施即代码，统一管理所有AWS资源

**职责**:
- 定义所有资源的配置
- 管理资源的创建顺序
- 处理资源间的依赖关系
- 提供回滚和更新机制

**依赖**: 无（顶层服务）

### 2.2 VPC（网络层）
**作用**: 提供隔离的网络环境

**职责**:
- 创建虚拟私有云
- 定义子网（公有/私有）
- 配置安全组和网络ACL
- 设置路由表和网关

**依赖**: 无（基础设施层）

**包含组件**:
```
VPC
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

### 2.3 Lambda（计算层）
**作用**: 执行应用程序代码

**职责**:
- 运行Node.js应用代码
- 处理HTTP请求
- 连接数据库
- 调用外部API（GitHub）

**依赖**: VPC（需要网络环境）

**配置要素**:
```
Lambda函数
├── 代码包 (CodeUri: ./dist)
├── 运行时环境 (Runtime: nodejs20.x)
├── 内存和超时设置
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

### 2.4 API Gateway（接口层）
**作用**: 提供HTTP API入口

**职责**:
- 接收外部HTTP请求
- 路由请求到Lambda函数
- 处理CORS跨域
- 提供API文档和监控

**依赖**: Lambda（需要后端处理函数）

**配置要素**:
```
API Gateway
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

## 3. 手动配置顺序

如果要手动在AWS控制台配置，正确的顺序如下：

### 第一步：VPC网络配置
```
1. 创建VPC
   - CIDR: 10.0.0.0/16
   - 启用DNS解析和DNS主机名

2. 创建子网
   - 公有子网: 10.0.1.0/24 (用于NAT Gateway)
   - 私有子网1: 10.0.2.0/24 (Lambda AZ-1)
   - 私有子网2: 10.0.3.0/24 (Lambda AZ-2)
   - 私有子网3: 10.0.4.0/24 (Lambda AZ-3)

3. 创建Internet Gateway
   - 附加到VPC

4. 创建NAT Gateway
   - 部署在公有子网
   - 分配弹性IP

5. 配置路由表
   - 公有子网路由表: 0.0.0.0/0 → IGW
   - 私有子网路由表: 0.0.0.0/0 → NAT Gateway

6. 创建安全组
   - Lambda安全组:
     * 出站: HTTPS(443) → 0.0.0.0/0
     * 出站: HTTP(80) → 0.0.0.0/0
     * 出站: PostgreSQL(5432) → 10.0.0.0/8
```

### 第二步：Lambda函数配置
```
1. 创建IAM角色
   - 基本Lambda执行权限
   - VPC访问权限
   - CloudWatch日志权限

2. 创建Lambda层
   - 上传node_modules依赖
   - 设置兼容运行时

3. 创建Lambda函数
   - 运行时: Node.js 20.x
   - 架构: arm64
   - 内存: 3008MB
   - 超时: 30秒
   - 代码: 上传dist目录
   - 层: 附加依赖层

4. 配置VPC
   - 选择创建的VPC
   - 选择3个私有子网
   - 选择Lambda安全组

5. 设置环境变量
   - DB_HOST, DB_PORT, DB_NAME等
```

### 第三步：API Gateway配置
```
1. 创建REST API
   - API名称和描述
   - 端点类型: Regional

2. 创建资源
   - 代理资源: {proxy+}
   - 启用CORS

3. 创建方法
   - ANY方法
   - 集成类型: Lambda代理
   - 选择Lambda函数

4. 配置CORS
   - Access-Control-Allow-Origin: *
   - Access-Control-Allow-Methods: *
   - Access-Control-Allow-Headers: Content-Type,Authorization

5. 部署API
   - 创建部署阶段: dev
   - 获取调用URL
```

## 4. 配置文件中的依赖体现

在我们的`template.yaml`中，依赖关系通过以下方式体现：

### 4.1 参数定义（输入）
```yaml
Parameters:
  VpcId: # VPC必须预先存在
  PublicSubnetId: # 公有子网必须预先存在
  PrivateSubnetIds: # 私有子网必须预先存在
```

### 4.2 资源创建顺序
```yaml
Resources:
  # 1. 首先创建安全组（依赖VPC）
  LambdaSecurityGroup:
    Properties:
      VpcId: !Ref VpcId  # 引用VPC

  # 2. 创建NAT Gateway（依赖公有子网）
  NATGateway:
    Properties:
      SubnetId: !Ref PublicSubnetId  # 引用公有子网

  # 3. 创建Lambda函数（依赖安全组和私有子网）
  NestjsFunction:
    Properties:
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup  # 引用安全组
        SubnetIds: !Ref PrivateSubnetIds  # 引用私有子网

  # 4. API Gateway（依赖Lambda函数）
  Api:
    # 通过Events部分与Lambda关联
```

### 4.3 引用关系
```yaml
# Lambda函数事件配置
Events:
  ApiEvent:
    Properties:
      RestApiId: !Ref Api  # Lambda引用API Gateway

# 输出中的引用
Outputs:
  ApiEndpoint:
    Value: !Sub 'https://${Api}.execute-api.${AWS::Region}.amazonaws.com/dev'
    # 使用API Gateway的ID构建端点URL
```

## 5. 为什么需要这样的架构？

### 5.1 安全性
- **VPC隔离**: Lambda函数在私有子网中，不直接暴露在互联网
- **安全组**: 精确控制网络访问权限
- **NAT Gateway**: 允许私有子网访问互联网（GitHub API）

### 5.2 可扩展性
- **多AZ部署**: Lambda函数分布在3个可用区
- **API Gateway**: 自动处理负载均衡和扩展
- **CloudFormation**: 版本控制和环境复制

### 5.3 成本优化
- **按需付费**: Lambda只在请求时运行
- **共享NAT Gateway**: 多个Lambda函数共享一个NAT Gateway
- **ARM64架构**: 更低的计算成本

## 6. 常见问题和解决方案

### Q1: 为什么Lambda需要在私有子网？
**A**: 安全最佳实践。私有子网的Lambda函数不会获得公网IP，减少攻击面。

### Q2: 为什么需要NAT Gateway？
**A**: 私有子网中的Lambda需要访问GitHub API，NAT Gateway提供出站互联网访问。

### Q3: 为什么使用3个私有子网？
**A**: 高可用性。分布在不同可用区，提高容错能力。

### Q4: API Gateway和Lambda是如何连接的？
**A**: 通过Lambda代理集成，API Gateway将所有请求转发给Lambda函数处理。

### Q5: CloudFormation的作用是什么？
**A**: 基础设施即代码，确保环境一致性，支持版本控制和自动化部署。

这样的架构设计确保了应用的安全性、可扩展性和可维护性，同时通过CloudFormation实现了基础设施的代码化管理。