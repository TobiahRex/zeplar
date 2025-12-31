import type { Pattern } from "../schema";

export const eCSFargate: Pattern = {
  id: "ecs-fargate",
  slug: "ecs-fargate",
  corpusPath:
    "📈 SCALABILITY → ↔️ Horizontal → 🎼 Orchestration → 🌊 ECS/Fargate",

  hierarchy: {
    quality: "scalability",
    strategy: "Horizontal",
    family: "Orchestration",
    level: 4,
  },

  concept: {
    name: "ECS/Fargate",
    emoji: "🌊",
    tagline: "Serverless container orchestration on AWS",
    definition:
      "AWS ECS Fargate is a serverless container orchestration platform that eliminates infrastructure management by running containers without provisioning or managing EC2 instances. Unlike traditional container deployments where you manage virtual machines, Fargate abstracts the underlying compute layer entirely—you define task definitions specifying CPU, memory, and container images, then Fargate provisions, scales, and manages the infrastructure automatically. Each task runs in its own isolated kernel runtime with dedicated resources, ensuring strong security boundaries and predictable performance. You pay only for the exact vCPU and memory resources your containers consume, billed per second, making it ideal for variable workloads. Fargate integrates seamlessly with AWS services: VPC networking provides each task its own elastic network interface (ENI) with security groups, Application Load Balancers distribute traffic, CloudWatch collects logs and metrics, and IAM manages permissions. The platform handles patching, scaling, and capacity management, allowing teams to focus on application logic rather than infrastructure operations. Auto-scaling policies automatically adjust task counts based on CloudWatch metrics like CPU utilization or request count, enabling elastic response to traffic patterns.",
    problemSolved:
      "Traditional container deployments on EC2 instances require significant operational overhead: capacity planning to prevent over/under-provisioning, instance right-sizing across diverse workload profiles, OS patching and security updates, cluster auto-scaling configuration, instance health monitoring, and managing heterogeneous instance types for cost optimization. Teams spend 20-30% of time on infrastructure toil rather than delivering features. Fargate solves this by eliminating EC2 management entirely. You specify resource requirements (0.25 vCPU to 16 vCPU, 512MB to 120GB memory), and AWS provisions compute instantly without cluster capacity planning. No more patching AMIs, managing instance lifecycles, or optimizing instance mix—Fargate handles it transparently. This serverless model dramatically reduces operational complexity while providing precise cost control: pay only for what you use rather than over-provisioning for peak load. For teams running dozens or hundreds of microservices, Fargate removes the multiplier effect of infrastructure management.",
    tradeoffs: {
      pros: [
        "Zero EC2 instance management - no patching, scaling, or capacity planning",
        "Precise pay-per-use pricing - billed per second for exact vCPU/memory consumed",
        "Fast provisioning - tasks start in ~60 seconds vs minutes for EC2 instances",
        "Automatic scaling - serverless elasticity without managing cluster capacity",
        "Strong task isolation - dedicated kernel runtime per task with no noisy neighbors",
        "Deep AWS integration - native VPC networking, IAM, CloudWatch, ALB support",
      ],
      cons: [
        "AWS vendor lock-in - cannot migrate to other clouds without re-architecture",
        "Higher cost than EC2 for steady-state workloads - 20-50% premium over reserved instances",
        "Cold start latency - 30-90 second task startup vs instant for warm EC2 instances",
        "Limited customization - cannot access host, install kernel modules, or use GPUs (without Fargate Spot)",
        "No persistent storage access - ephemeral disk only, must use EFS for shared storage",
        "Networking constraints - each task needs dedicated ENI, subnet IP exhaustion possible",
      ],
    },
    relatedPatterns: [
      "kubernetes",
      "docker-swarm",
      "nomad",
      "lambda",
      "auto-scaling",
      "load-balancing",
      "blue-green-deployment",
    ],
  },

  structure: {
    participants: [
      {
        name: "ECS Control Plane",
        role: "Orchestrator",
        responsibilities: [
          "Manage cluster state and service desired count",
          "Schedule tasks based on resource availability",
          "Monitor task health and replace failed tasks",
          "Coordinate with Fargate capacity allocator",
        ],
      },
      {
        name: "Task Definition",
        role: "Blueprint",
        responsibilities: [
          "Define container images, CPU, memory, and networking mode",
          "Specify IAM roles, environment variables, and secrets",
          "Configure logging drivers and health check commands",
          "Declare volumes, port mappings, and dependencies",
        ],
      },
      {
        name: "Fargate Task",
        role: "Container Runtime",
        responsibilities: [
          "Run containers in isolated kernel runtime",
          "Provide dedicated vCPU/memory resources with no noisy neighbors",
          "Attach to VPC with dedicated ENI and security groups",
          "Stream logs to CloudWatch and expose health check endpoints",
        ],
      },
      {
        name: "ECS Service",
        role: "Lifecycle Manager",
        responsibilities: [
          "Maintain desired count of running tasks",
          "Integrate with Application Load Balancer for traffic distribution",
          "Execute rolling deployments with configurable deployment strategies",
          "Trigger auto-scaling based on CloudWatch metrics",
        ],
      },
      {
        name: "Application Load Balancer",
        role: "Traffic Router",
        responsibilities: [
          "Distribute incoming requests across healthy tasks",
          "Perform health checks and remove unhealthy targets",
          "Enable zero-downtime deployments during task updates",
          "Provide TLS termination and path-based routing",
        ],
      },
    ],
    diagram: `sequenceDiagram
    participant User
    participant ALB as Application Load Balancer
    participant ECS as ECS Control Plane
    participant FG as Fargate Task
    participant CW as CloudWatch

    User->>ECS: Register task definition (CPU/memory/image)
    ECS-->>User: Task definition ARN

    User->>ECS: Create service (desired count, ALB integration)
    ECS->>ECS: Schedule tasks to meet desired count

    loop For each task
        ECS->>FG: Provision Fargate task with dedicated resources
        FG->>FG: Attach ENI to VPC subnet
        FG->>FG: Pull container image and start
        FG->>ALB: Register with target group
        ALB->>FG: Perform health check
        FG-->>ALB: Healthy response
        FG->>CW: Stream container logs
    end

    User->>ALB: HTTP request
    ALB->>FG: Route to healthy task
    FG-->>ALB: Process and respond
    ALB-->>User: Return response

    Note over ECS,FG: Auto-scaling triggered by CPU > 70%
    ECS->>FG: Provision additional tasks
    FG->>ALB: Register new tasks

    Note over FG: Task crashes or fails health check
    ALB->>ECS: Report unhealthy task
    ECS->>FG: Stop unhealthy task
    ECS->>FG: Provision replacement task`,
    flow: [
      {
        step: 1,
        actor: "Developer",
        action: "Register Task Definition",
        description:
          "Define container image, CPU/memory requirements, networking mode (awsvpc), IAM role, environment variables, and logging configuration",
      },
      {
        step: 2,
        actor: "ECS Control Plane",
        action: "Validate Task Definition",
        description:
          "Ensure Fargate compatibility (networkMode: awsvpc, supported CPU/memory combinations, no host network mode)",
      },
      {
        step: 3,
        actor: "Developer",
        action: "Create ECS Service",
        description:
          "Specify desired task count, target group for ALB, deployment configuration (rolling update, blue/green), and auto-scaling policies",
      },
      {
        step: 4,
        actor: "ECS Control Plane",
        action: "Schedule Tasks",
        description:
          "Request Fargate capacity allocator to provision tasks in specified subnets with adequate IP addresses for ENIs",
      },
      {
        step: 5,
        actor: "Fargate Task",
        action: "Provision Infrastructure",
        description:
          "Allocate dedicated vCPU/memory, attach ENI to VPC subnet with security groups, prepare isolated kernel runtime environment",
      },
      {
        step: 6,
        actor: "Fargate Task",
        action: "Pull Container Image",
        description:
          "Download image from ECR or Docker Hub using IAM role credentials, extract layers, and initialize container filesystem",
      },
      {
        step: 7,
        actor: "Fargate Task",
        action: "Start Container",
        description:
          "Execute entrypoint command, inject environment variables and secrets from Parameter Store/Secrets Manager, begin health checks",
      },
      {
        step: 8,
        actor: "Application Load Balancer",
        action: "Register Task Target",
        description:
          "Add task IP and port to target group, perform initial health check (HTTP endpoint or TCP connection)",
      },
      {
        step: 9,
        actor: "Application Load Balancer",
        action: "Route Traffic",
        description:
          "Distribute incoming requests to healthy tasks using round-robin or least outstanding requests algorithm",
      },
      {
        step: 10,
        actor: "CloudWatch",
        action: "Monitor Metrics",
        description:
          "Collect CPU/memory utilization, request count, and custom application metrics; trigger auto-scaling when thresholds exceeded",
      },
      {
        step: 11,
        actor: "ECS Service",
        action: "Auto-Scale Tasks",
        description:
          "Adjust desired count based on target tracking policies (e.g., maintain 70% CPU utilization) or step scaling policies",
      },
      {
        step: 12,
        actor: "ECS Control Plane",
        action: "Rolling Deployment",
        description:
          "When task definition updated, start new tasks, wait for health checks, then drain and stop old tasks to achieve zero-downtime deployment",
      },
    ],
    invariants: [
      "Each task runs in dedicated kernel runtime with strong isolation - no container shares CPU/memory with another task",
      "Tasks receive guaranteed CPU/memory resources without overprovisioning - Fargate reserves exact amounts specified",
      "Service maintains desired count by automatically replacing failed tasks within 30-60 seconds",
      "Task definitions are immutable - updating requires creating new revision, cannot modify existing definition",
      "Each task receives dedicated ENI in VPC with unique private IP address and security group enforcement",
      "Tasks can only use supported CPU/memory combinations (0.25 vCPU with 512MB-2GB, 0.5 vCPU with 1-4GB, 1 vCPU with 2-8GB, etc.)",
      "Fargate tasks cannot access underlying host or use privileged containers - no host networking or device mappings",
    ],
  },

  codeExamples: [
    {
      id: "fargate-aws-cli-deployment",
      language: "typescript",
      title: "AWS CLI ECS Fargate Deployment with Auto-Scaling",
      description:
        "Complete Fargate deployment using AWS CLI: task definition, service creation, ALB integration, and target tracking auto-scaling",
      code: `#!/bin/bash
# Complete ECS Fargate deployment with auto-scaling and ALB integration
# Demonstrates serverless container orchestration without EC2 management

set -e

# Variables
CLUSTER_NAME="production-cluster"
SERVICE_NAME="web-api-service"
TASK_FAMILY="web-api-task"
CONTAINER_NAME="web-api"
IMAGE_URI="123456789012.dkr.ecr.us-east-1.amazonaws.com/web-api:v1.2.3"
VPC_ID="vpc-0abcd1234efgh5678"
SUBNET_IDS="subnet-0abc1234,subnet-0def5678"
SECURITY_GROUP_ID="sg-0xyz9876"
TARGET_GROUP_ARN="arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/web-api-tg/50dc6c495c0c9188"

echo "Creating ECS Fargate deployment for \${SERVICE_NAME}..."

# Step 1: Create ECS cluster (control plane only, no EC2 instances)
echo "Creating ECS cluster..."
aws ecs create-cluster \\
  --cluster-name "$CLUSTER_NAME" \\
  --capacity-providers FARGATE FARGATE_SPOT \\
  --default-capacity-provider-strategy \\
    capacityProvider=FARGATE,weight=1,base=2 \\
    capacityProvider=FARGATE_SPOT,weight=4

# ACTION: Define Fargate task definition with required network mode and resources
# REASON: Fargate requires awsvpc network mode (each task gets dedicated ENI)
#         and specific CPU/memory combinations (1 vCPU = 2-8GB memory range)
# CONTEXT: Unlike EC2 launch type, Fargate cannot use bridge/host networking
#          Must specify exact CPU/memory - Fargate provisions dedicated resources
cat > task-definition.json <<EOF
{
  "family": "\${TASK_FAMILY}",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::123456789012:role/webApiTaskRole",
  "containerDefinitions": [
    {
      "name": "\${CONTAINER_NAME}",
      "image": "\${IMAGE_URI}",
      "cpu": 1024,
      "memory": 2048,
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "8080"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-url-AbCdEf"
        },
        {
          "name": "API_KEY",
          "valueFrom": "arn:aws:ssm:us-east-1:123456789012:parameter/api-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/web-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "fargate"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
EOF

# ACTION: Register task definition to create immutable blueprint
# REASON: Task definitions are versioned and immutable - enables rollback and audit trail
echo "Registering task definition..."
TASK_DEFINITION_ARN=$(aws ecs register-task-definition \\
  --cli-input-json file://task-definition.json \\
  --query 'taskDefinition.taskDefinitionArn' \\
  --output text)

echo "Registered task definition: \${TASK_DEFINITION_ARN}"

# Step 2: Create CloudWatch log group for container logs
echo "Creating CloudWatch log group..."
aws logs create-log-group \\
  --log-group-name /ecs/web-api \\
  --region us-east-1 || true  # Ignore if exists

# ACTION: Create ECS service with ALB integration and rolling deployment
# REASON: Service maintains desired count and integrates with load balancer for zero-downtime updates
# CONTEXT: assignPublicIp=ENABLED required if tasks need internet access (ECR pulls, API calls)
#          enableExecuteCommand allows 'aws ecs execute-command' for debugging
echo "Creating ECS service..."
aws ecs create-service \\
  --cluster "$CLUSTER_NAME" \\
  --service-name "$SERVICE_NAME" \\
  --task-definition "$TASK_DEFINITION_ARN" \\
  --desired-count 3 \\
  --launch-type FARGATE \\
  --platform-version LATEST \\
  --network-configuration "awsvpcConfiguration={
    subnets=[$SUBNET_IDS],
    securityGroups=[$SECURITY_GROUP_ID],
    assignPublicIp=ENABLED
  }" \\
  --load-balancers "targetGroupArn=\${TARGET_GROUP_ARN},containerName=\${CONTAINER_NAME},containerPort=8080" \\
  --health-check-grace-period-seconds 60 \\
  --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100,deploymentCircuitBreaker={enable=true,rollback=true}" \\
  --enable-execute-command

echo "Service \${SERVICE_NAME} created successfully"

# ACTION: Configure target tracking auto-scaling for CPU utilization
# REASON: Automatically scales tasks to maintain target CPU (70%), handling traffic spikes
# CONTEXT: Fargate scales faster than EC2 (60s vs 5+ minutes) - ideal for variable workloads
#          Target tracking is simpler than step scaling and adapts to changing patterns
echo "Configuring auto-scaling..."

# Register scalable target (min: 2, max: 20 tasks)
aws application-autoscaling register-scalable-target \\
  --service-namespace ecs \\
  --scalable-dimension ecs:service:DesiredCount \\
  --resource-id service/\${CLUSTER_NAME}/\${SERVICE_NAME} \\
  --min-capacity 2 \\
  --max-capacity 20

# ACTION: Create target tracking policy to maintain 70% CPU utilization
# REASON: Keeps tasks responsive during spikes while minimizing costs during low traffic
# CONTEXT: Scale-out faster (60s) than scale-in (5min) to handle bursts quickly
aws application-autoscaling put-scaling-policy \\
  --service-namespace ecs \\
  --scalable-dimension ecs:service:DesiredCount \\
  --resource-id service/\${CLUSTER_NAME}/\${SERVICE_NAME} \\
  --policy-name cpu-target-tracking \\
  --policy-type TargetTrackingScaling \\
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleOutCooldown": 60,
    "ScaleInCooldown": 300
  }'

# Optional: Add custom metric scaling (e.g., request count per task)
aws application-autoscaling put-scaling-policy \\
  --service-namespace ecs \\
  --scalable-dimension ecs:service:DesiredCount \\
  --resource-id service/\${CLUSTER_NAME}/\${SERVICE_NAME} \\
  --policy-name request-count-tracking \\
  --policy-type TargetTrackingScaling \\
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 1000.0,
    "CustomizedMetricSpecification": {
      "MetricName": "RequestCountPerTarget",
      "Namespace": "AWS/ApplicationELB",
      "Statistic": "Sum"
    },
    "ScaleOutCooldown": 60,
    "ScaleInCooldown": 300
  }'

echo "Auto-scaling configured successfully"

# Monitor deployment
echo "Monitoring service deployment..."
aws ecs wait services-stable \\
  --cluster "$CLUSTER_NAME" \\
  --services "$SERVICE_NAME"

# Display service status
echo "Service deployment complete!"
aws ecs describe-services \\
  --cluster "$CLUSTER_NAME" \\
  --services "$SERVICE_NAME" \\
  --query 'services[0].{
    Status:status,
    DesiredCount:desiredCount,
    RunningCount:runningCount,
    TaskDefinition:taskDefinition
  }'

# CONTEXT DILATION: EC2 Management vs Fargate Serverless
# Traditional EC2 ECS: 2-4 hours of setup
#   - Launch EC2 instances with ECS-optimized AMI
#   - Configure auto-scaling groups with launch templates
#   - Set up CloudWatch alarms for instance health
#   - Implement cluster auto-scaling (register/deregister instances)
#   - Patch and update AMIs monthly
#   - Monitor instance utilization and right-size
#   - Handle instance draining during deployments
#
# Fargate Serverless: 5-10 minutes of setup
#   - Define task definition (CPU/memory requirements)
#   - Create service with desired count
#   - AWS manages all infrastructure provisioning
#   - No patching, scaling, or capacity planning
#   - Pay only for task runtime (per-second billing)
#
# COST COMPARISON: Variable Workload
# Scenario: Web API - 100 RPS baseline, 1000 RPS peak (2 hours/day)
#
# EC2 Reserved Instances (steady state):
#   - Provision for peak: 20 tasks × c5.large ($0.085/hr) = $1.70/hr
#   - Reserved 1-year: $1.70 × 730 hrs × 12 months × 0.6 (40% discount) = $8,942/year
#   - Average utilization: 30% (over-provisioned for peaks)
#
# Fargate Pay-Per-Use:
#   - Baseline: 3 tasks × 1 vCPU/2GB × $0.04856/hr × 22 hrs = $3.20/day
#   - Peak: 20 tasks × 1 vCPU/2GB × $0.04856/hr × 2 hrs = $1.94/day
#   - Total: ($3.20 + $1.94) × 365 = $1,876/year
#   - Savings: $7,066/year (79% less) + zero operational overhead
#
# RESULT: For variable workloads with <50% utilization, Fargate significantly
#         cheaper despite higher per-hour cost due to precise pay-per-use billing`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete Fargate deployment lifecycle: cluster creation, task definition, service deployment, auto-scaling configuration",
        prerequisites: [
          "AWS CLI configured with credentials",
          "VPC with subnets and security groups",
          "Application Load Balancer with target group",
          "ECR repository with container image",
          "IAM roles for task execution and task permissions",
        ],
        systemPosition:
          "Infrastructure layer for deploying containerized microservices without managing EC2 instances",
      },
      annotations: [
        {
          id: "fargate-network-mode",
          lines: [35, 37],
          action: "Specify awsvpc network mode required for Fargate",
          reason:
            "Fargate only supports awsvpc mode where each task gets dedicated ENI with its own private IP and security group; provides strong network isolation",
          contextLevel: "system",
          relatedConcepts: ["vpc-networking", "task-isolation"],
        },
        {
          id: "fargate-cpu-memory",
          lines: [38, 39],
          action: "Define CPU (1024 = 1 vCPU) and memory (2048 MB) resources",
          reason:
            "Fargate requires specific CPU/memory combinations; 1 vCPU supports 2-8GB memory; these become dedicated resources with no overprovisioning",
          contextLevel: "local",
          relatedConcepts: ["resource-allocation"],
        },
        {
          id: "fargate-secrets",
          lines: [58, 67],
          action: "Inject secrets from AWS Secrets Manager and Parameter Store",
          reason:
            "Fargate integrates natively with AWS secret services; secrets are fetched at task startup using IAM execution role, never stored in environment variables",
          contextLevel: "system",
          relatedConcepts: ["secrets-management", "iam-roles"],
        },
        {
          id: "fargate-health-check",
          lines: [77, 83],
          action: "Define container-level health check with retry logic",
          reason:
            "ECS uses health checks to determine task health; failed checks trigger task replacement; separate from ALB health checks which control traffic routing",
          contextLevel: "module",
          relatedConcepts: ["health-checks", "self-healing"],
        },
        {
          id: "fargate-service-config",
          lines: [106, 121],
          action:
            "Create service with ALB integration and deployment circuit breaker",
          reason:
            "Service maintains desired count and orchestrates rolling deployments; circuit breaker automatically rolls back failed deployments when tasks fail health checks",
          contextLevel: "system",
          relatedConcepts: ["zero-downtime-deployment", "circuit-breaker"],
        },
        {
          id: "fargate-target-tracking",
          lines: [137, 153],
          action:
            "Configure target tracking auto-scaling for 70% CPU utilization",
          reason:
            "Target tracking automatically adjusts task count to maintain target metric; simpler than step scaling and adapts to changing traffic patterns without manual threshold tuning",
          contextLevel: "system",
          relatedConcepts: ["auto-scaling", "adaptive-capacity"],
        },
        {
          id: "fargate-cost-model",
          lines: [190, 218],
          action:
            "Analyze cost comparison between EC2 reserved instances and Fargate pay-per-use",
          reason:
            "Fargate trades higher per-hour cost for precise billing and zero management overhead; variable workloads benefit from not paying for idle capacity",
          contextLevel: "system",
          relatedConcepts: ["cost-optimization", "serverless-pricing"],
        },
        {
          id: "fargate-public-ip",
          lines: [111, 115],
          action: "Enable public IP assignment for tasks in VPC subnets",
          reason:
            "Tasks need internet access to pull images from ECR and call external APIs; alternative is NAT Gateway ($0.045/hr + data transfer costs)",
          contextLevel: "system",
          relatedConcepts: ["vpc-networking", "internet-gateway"],
        },
      ],
      highlights: [
        {
          lines: [35, 87],
          label: "Task definition with Fargate requirements",
          sbvpDomain: "structure",
        },
        {
          lines: [106, 121],
          label: "Service creation with ALB and deployment config",
          sbvpDomain: "behavior",
        },
        {
          lines: [137, 165],
          label: "Auto-scaling configuration",
          sbvpDomain: "behavior",
        },
        {
          lines: [190, 218],
          label: "Cost analysis: EC2 vs Fargate",
          sbvpDomain: "philosophy",
        },
      ],
    },
    {
      id: "fargate-terraform-infrastructure",
      language: "typescript",
      title: "Terraform ECS Fargate Infrastructure with Blue/Green Deployment",
      description:
        "Complete infrastructure-as-code for ECS Fargate: cluster, task definition, service, ALB, auto-scaling, secrets management, and blue/green deployment",
      code: `# Complete ECS Fargate infrastructure with blue/green deployments
# Demonstrates IaC for serverless container orchestration

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "production"
}

variable "app_name" {
  description = "Application name for resource naming"
  type        = string
  default     = "web-api"
}

variable "container_image" {
  description = "Container image URI from ECR"
  type        = string
}

variable "min_capacity" {
  description = "Minimum number of tasks"
  type        = number
  default     = 2
}

variable "max_capacity" {
  description = "Maximum number of tasks"
  type        = number
  default     = 20
}

# ACTION: Create ECS cluster with Fargate capacity providers
# REASON: Fargate capacity providers enable mixing on-demand and Spot for cost optimization
# CONTEXT: FARGATE_SPOT is 70% cheaper but can be interrupted; use base capacity on FARGATE
#          and burst capacity on FARGATE_SPOT for cost-effective scaling
resource "aws_ecs_cluster" "main" {
  name = "\${var.environment}-\${var.app_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"  # Enable CloudWatch Container Insights for deep metrics
  }

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# Configure capacity providers with Fargate and Fargate Spot
resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  # ACTION: Set base capacity on FARGATE, burst on FARGATE_SPOT (70% cheaper)
  # REASON: Critical baseline tasks need guaranteed availability; overflow can tolerate interruptions
  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight           = 1
    base             = 2  # Always run 2 tasks on FARGATE
  }

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight           = 4  # 80% of additional tasks on Spot
  }
}

# IAM role for ECS task execution (pulling images, writing logs)
resource "aws_iam_role" "ecs_execution_role" {
  name = "\${var.environment}-\${var.app_name}-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

# Attach managed policy for ECR and CloudWatch access
resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ACTION: Grant execution role access to Secrets Manager for runtime secret injection
# REASON: Task definition references secrets; execution role needs permissions to fetch at task startup
resource "aws_iam_role_policy" "secrets_access" {
  name = "secrets-access"
  role = aws_iam_role.ecs_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue",
        "ssm:GetParameters"
      ]
      Resource = [
        aws_secretsmanager_secret.db_credentials.arn,
        "arn:aws:ssm:\${data.aws_region.current.name}:\${data.aws_caller_identity.current.account_id}:parameter/\${var.environment}/*"
      ]
    }]
  })
}

# IAM role for task (application permissions)
resource "aws_iam_role" "ecs_task_role" {
  name = "\${var.environment}-\${var.app_name}-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

# Grant task role access to S3, DynamoDB, etc. based on application needs
resource "aws_iam_role_policy" "task_permissions" {
  name = "task-permissions"
  role = aws_iam_role.ecs_task_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "arn:aws:s3:::\${var.environment}-\${var.app_name}-data/*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Query"
        ]
        Resource = "arn:aws:dynamodb:\${data.aws_region.current.name}:\${data.aws_caller_identity.current.account_id}:table/\${var.environment}-users"
      }
    ]
  })
}

# Secrets Manager secret for database credentials
resource "aws_secretsmanager_secret" "db_credentials" {
  name        = "\${var.environment}/\${var.app_name}/db-credentials"
  description = "Database credentials for \${var.app_name}"

  recovery_window_in_days = 7  # Allow recovery for accidental deletion
}

# CloudWatch log group for container logs
resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/\${var.environment}/\${var.app_name}"
  retention_in_days = 30

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# ACTION: Define Fargate task with specific CPU/memory and awsvpc networking
# REASON: Task definition is immutable blueprint; Fargate requires awsvpc mode and supported resource combinations
# CONTEXT: 1024 CPU (1 vCPU) supports 2048-8192 MB memory; using 2048 MB (2GB)
#          Each revision creates new version (app-task:1, app-task:2) for rollback capability
resource "aws_ecs_task_definition" "app" {
  family                   = "\${var.environment}-\${var.app_name}-task"
  network_mode             = "awsvpc"  # Required for Fargate
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024"  # 1 vCPU
  memory                   = "2048"  # 2 GB

  execution_role_arn = aws_iam_role.ecs_execution_role.arn
  task_role_arn      = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([{
    name      = var.app_name
    image     = var.container_image
    essential = true

    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]

    environment = [
      {
        name  = "NODE_ENV"
        value = var.environment
      },
      {
        name  = "PORT"
        value = "8080"
      },
      {
        name  = "LOG_LEVEL"
        value = "info"
      }
    ]

    # ACTION: Reference secrets from Secrets Manager - fetched at task startup
    # REASON: Secrets never stored in environment variables or task definition; fetched securely using execution role
    secrets = [
      {
        name      = "DATABASE_URL"
        valueFrom = aws_secretsmanager_secret.db_credentials.arn
      },
      {
        name      = "API_KEY"
        valueFrom = "arn:aws:ssm:\${data.aws_region.current.name}:\${data.aws_caller_identity.current.account_id}:parameter/\${var.environment}/api-key"
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.app.name
        "awslogs-region"        = data.aws_region.current.name
        "awslogs-stream-prefix" = "fargate"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# Application Load Balancer target group
resource "aws_lb_target_group" "app" {
  name        = "\${var.environment}-\${var.app_name}-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.main.id
  target_type = "ip"  # Required for Fargate awsvpc mode

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }

  deregistration_delay = 30  # Fast draining for quicker deployments

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# ACTION: Configure ECS service with blue/green deployment via CodeDeploy
# REASON: Blue/green deployments enable zero-downtime updates with automatic rollback on failure
# CONTEXT: ECS creates new tasks (green), shifts traffic via ALB, then terminates old tasks (blue)
#          If health checks fail, CodeDeploy automatically rolls back to blue deployment
resource "aws_ecs_service" "app" {
  name            = "\${var.environment}-\${var.app_name}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 3
  launch_type     = "FARGATE"
  platform_version = "LATEST"

  network_configuration {
    subnets          = data.aws_subnets.private.ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false  # Tasks in private subnets use NAT Gateway
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = var.app_name
    container_port   = 8080
  }

  # Blue/green deployment configuration
  deployment_controller {
    type = "CODE_DEPLOY"  # Use CodeDeploy for blue/green deployments
  }

  health_check_grace_period_seconds = 60

  # Enable ECS Exec for debugging
  enable_execute_command = true

  depends_on = [aws_lb_listener.app]

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# Security group for ECS tasks
resource "aws_security_group" "ecs_tasks" {
  name        = "\${var.environment}-\${var.app_name}-ecs-tasks"
  description = "Security group for ECS Fargate tasks"
  vpc_id      = data.aws_vpc.main.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# ACTION: Configure auto-scaling with target tracking for CPU utilization
# REASON: Automatically adjusts task count to maintain 70% CPU; scales out fast (60s), in slow (5min)
# CONTEXT: Fargate provisions tasks in ~60 seconds vs 5+ minutes for EC2 instances
#          Target tracking simpler than step scaling and adapts to changing patterns
resource "aws_appautoscaling_target" "ecs_target" {
  max_capacity       = var.max_capacity
  min_capacity       = var.min_capacity
  resource_id        = "service/\${aws_ecs_cluster.main.name}/\${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# CPU utilization target tracking
resource "aws_appautoscaling_policy" "ecs_cpu_policy" {
  name               = "\${var.environment}-\${var.app_name}-cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = 70.0
    scale_in_cooldown  = 300  # Wait 5 min before scaling in
    scale_out_cooldown = 60   # Scale out quickly

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}

# Memory utilization target tracking
resource "aws_appautoscaling_policy" "ecs_memory_policy" {
  name               = "\${var.environment}-\${var.app_name}-memory-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = 80.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
  }
}

# Request count per target tracking (ALB metric)
resource "aws_appautoscaling_policy" "ecs_request_count_policy" {
  name               = "\${var.environment}-\${var.app_name}-request-count-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = 1000.0  # Scale when >1000 requests/target/minute
    scale_in_cooldown  = 300
    scale_out_cooldown = 60

    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = "\${aws_lb.main.arn_suffix}/\${aws_lb_target_group.app.arn_suffix}"
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_vpc" "main" {
  id = var.vpc_id
}
data "aws_subnets" "private" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
  tags = {
    Tier = "private"
  }
}

# Outputs
output "cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.app.name
}

output "task_definition_arn" {
  description = "Latest task definition ARN"
  value       = aws_ecs_task_definition.app.arn
}

output "autoscaling_target_id" {
  description = "Auto-scaling target resource ID"
  value       = aws_appautoscaling_target.ecs_target.resource_id
}

# CONTEXT DILATION: Infrastructure Cost Optimization
#
# Scenario: E-commerce API with variable load patterns
# - Baseline: 100 RPS (3 tasks, 1 vCPU/2GB each)
# - Peak (2 hours/day): 1000 RPS (20 tasks, 1 vCPU/2GB each)
# - Black Friday surge: 5000 RPS (100 tasks for 6 hours)
#
# EC2 Reserved Instances Approach:
#   Provisioning:
#     - Must provision for peak + buffer: 25 × c5.large instances
#     - Reserved Instance 1-year commitment: $0.051/hr per instance
#     - Total: 25 × $0.051 × 24 × 365 = $11,178/year
#
#   Operational Overhead:
#     - Weekly AMI patching: 4 hours/week × $150/hr engineer = $31,200/year
#     - Cluster auto-scaling maintenance: 2 hours/week = $15,600/year
#     - Instance right-sizing analysis: 1 hour/week = $7,800/year
#     - Total ops cost: $54,600/year
#
#   Total EC2 Cost: $11,178 + $54,600 = $65,778/year
#   Average utilization: 18% (most instances idle most of time)
#
# Fargate Serverless Approach:
#   Baseline (22 hours/day):
#     - 3 tasks × 1 vCPU/2GB × $0.04856/hr × 22 hrs × 365 days = $1,167/year
#
#   Peak (2 hours/day):
#     - 20 tasks × 1 vCPU/2GB × $0.04856/hr × 2 hrs × 365 days = $709/year
#
#   Black Friday surge (6 hours × 5 days):
#     - 100 tasks × 1 vCPU/2GB × $0.04856/hr × 6 hrs × 5 days = $146
#
#   Fargate Spot (70% discount on burst capacity):
#     - Use Spot for 80% of peak capacity: $709 × 0.8 × 0.3 = $170/year
#     - Remaining on-demand: $709 × 0.2 = $142/year
#
#   Total Fargate Cost: $1,167 + $312 + $146 = $1,625/year
#   Operational overhead: $0 (AWS manages infrastructure)
#
# RESULT: Fargate saves $64,153/year (97% reduction) for variable workload
#         - No over-provisioning waste
#         - Zero operational overhead
#         - Automatic scaling from 3 to 100 tasks in minutes
#         - No commitment or capacity planning required`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Complete production infrastructure: cluster, task definition, service, IAM roles, secrets, auto-scaling, blue/green deployment",
        prerequisites: [
          "Terraform >= 1.0",
          "AWS VPC with public and private subnets",
          "Application Load Balancer",
          "Container image in ECR",
          "AWS credentials with ECS permissions",
        ],
        systemPosition:
          "Infrastructure-as-code layer for deploying and managing Fargate services with auto-scaling and deployment automation",
      },
      annotations: [
        {
          id: "tf-capacity-providers",
          lines: [44, 77],
          action:
            "Configure Fargate and Fargate Spot capacity providers with base/weight strategy",
          reason:
            "Fargate Spot is 70% cheaper but can be interrupted; running base capacity on Fargate ensures availability while Spot handles burst load for cost savings",
          contextLevel: "system",
          relatedConcepts: ["cost-optimization", "spot-instances"],
        },
        {
          id: "tf-secrets-injection",
          lines: [101, 115],
          action:
            "Grant execution role permissions to fetch secrets from Secrets Manager and Parameter Store",
          reason:
            "Task definition references secrets by ARN; execution role needs permissions to fetch values at task startup before container starts",
          contextLevel: "system",
          relatedConcepts: ["secrets-management", "iam-roles"],
        },
        {
          id: "tf-task-definition",
          lines: [194, 206],
          action:
            "Define task with Fargate requirements: awsvpc network mode and supported CPU/memory",
          reason:
            "Fargate only supports awsvpc (each task gets dedicated ENI) and specific CPU/memory combinations; task definitions are immutable and versioned",
          contextLevel: "system",
          relatedConcepts: ["task-isolation", "resource-allocation"],
        },
        {
          id: "tf-secrets-reference",
          lines: [228, 238],
          action: "Reference secrets from Secrets Manager in task definition",
          reason:
            "Secrets are fetched at runtime using execution role, never stored in plaintext; provides secure credential management without hardcoding",
          contextLevel: "module",
          relatedConcepts: ["secrets-management", "security"],
        },
        {
          id: "tf-blue-green-deployment",
          lines: [291, 313],
          action:
            "Configure service with CodeDeploy for blue/green deployments",
          reason:
            "Blue/green deployments enable zero-downtime updates by creating new task set (green), shifting ALB traffic, then terminating old tasks (blue) with automatic rollback on failure",
          contextLevel: "system",
          relatedConcepts: [
            "zero-downtime-deployment",
            "automatic-rollback",
            "canary-deployment",
          ],
        },
        {
          id: "tf-target-tracking",
          lines: [348, 368],
          action:
            "Configure target tracking auto-scaling for CPU utilization at 70% target",
          reason:
            "Target tracking automatically calculates scale-out/in actions to maintain target metric; simpler than step scaling and adapts to changing load patterns",
          contextLevel: "system",
          relatedConcepts: [
            "auto-scaling",
            "adaptive-capacity",
            "target-tracking",
          ],
        },
        {
          id: "tf-multi-metric-scaling",
          lines: [371, 416],
          action:
            "Add memory and request count target tracking policies for comprehensive scaling",
          reason:
            "Multiple scaling policies run concurrently; most aggressive policy (largest capacity change) takes effect to handle CPU, memory, or traffic-driven scaling needs",
          contextLevel: "system",
          relatedConcepts: ["multi-dimensional-scaling"],
        },
        {
          id: "tf-cost-analysis",
          lines: [458, 513],
          action:
            "Analyze total cost of ownership for EC2 vs Fargate across baseline, peak, and surge scenarios",
          reason:
            "Demonstrates Fargate ROI for variable workloads: eliminates over-provisioning waste and operational overhead despite higher per-hour compute cost",
          contextLevel: "system",
          relatedConcepts: [
            "cost-optimization",
            "tco-analysis",
            "serverless-economics",
          ],
        },
      ],
      highlights: [
        {
          lines: [44, 77],
          label: "Capacity providers with Fargate Spot",
          sbvpDomain: "structure",
        },
        {
          lines: [194, 266],
          label: "Task definition with secrets integration",
          sbvpDomain: "structure",
        },
        {
          lines: [291, 313],
          label: "Blue/green deployment configuration",
          sbvpDomain: "behavior",
        },
        {
          lines: [348, 416],
          label: "Multi-metric auto-scaling",
          sbvpDomain: "behavior",
        },
        {
          lines: [458, 513],
          label: "TCO analysis: EC2 vs Fargate",
          sbvpDomain: "philosophy",
        },
      ],
    },
    {
      id: "fargate-boto3-management",
      language: "python",
      title: "Python Boto3 ECS Fargate Service Management and Dynamic Scaling",
      description:
        "Programmatic ECS management with boto3: service updates, dynamic task scaling based on custom metrics, log retrieval, and production automation",
      code: `"""
ECS Fargate Service Management with Boto3
Demonstrates programmatic control of Fargate services: updates, scaling, monitoring
"""

import boto3
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass

# Initialize AWS clients
ecs_client = boto3.client('ecs')
cloudwatch_client = boto3.client('cloudwatch')
logs_client = boto3.client('logs')
application_autoscaling = boto3.client('application-autoscaling')


@dataclass
class TaskMetrics:
    """Container for task performance metrics"""
    cpu_utilization: float
    memory_utilization: float
    request_count: int
    error_rate: float


class FargateServiceManager:
    """
    Manages ECS Fargate services programmatically

    Enables dynamic updates, custom metric scaling, and operational automation
    without manual AWS console interactions
    """

    def __init__(self, cluster_name: str, service_name: str):
        self.cluster_name = cluster_name
        self.service_name = service_name
        self.ecs = ecs_client
        self.cw = cloudwatch_client
        self.logs = logs_client
        self.autoscaling = application_autoscaling

    # ACTION: Update service with new task definition for zero-downtime deployment
    # REASON: ECS performs rolling update, starting new tasks before stopping old ones
    # CONTEXT: minimumHealthyPercent=100 ensures no capacity loss during deployment
    #          maximumPercent=200 allows double capacity during rollout for safety
    def update_task_definition(
        self,
        new_image: str,
        cpu: str = "1024",
        memory: str = "2048",
        environment_vars: Optional[Dict[str, str]] = None
    ) -> str:
        """
        Update service with new task definition (typically new container image)

        Args:
            new_image: New container image URI (e.g., account.dkr.ecr.region.amazonaws.com/app:v2)
            cpu: CPU units (256, 512, 1024, 2048, 4096)
            memory: Memory in MB
            environment_vars: Optional environment variable overrides

        Returns:
            New task definition ARN
        """
        # Get current task definition to use as template
        current_service = self.ecs.describe_services(
            cluster=self.cluster_name,
            services=[self.service_name]
        )['services'][0]

        current_task_def_arn = current_service['taskDefinition']
        current_task_def = self.ecs.describe_task_definition(
            taskDefinition=current_task_def_arn
        )['taskDefinition']

        # Build updated container definitions
        container_defs = current_task_def['containerDefinitions']
        for container in container_defs:
            container['image'] = new_image

            # Update environment variables if provided
            if environment_vars:
                env_list = container.get('environment', [])
                env_dict = {e['name']: e['value'] for e in env_list}
                env_dict.update(environment_vars)
                container['environment'] = [
                    {'name': k, 'value': v} for k, v in env_dict.items()
                ]

        # ACTION: Register new task definition revision
        # REASON: Task definitions are immutable; updates create new revision (family:2, family:3, etc.)
        #         Enables quick rollback by reverting service to previous revision
        new_task_def = self.ecs.register_task_definition(
            family=current_task_def['family'],
            networkMode='awsvpc',
            requiresCompatibilities=['FARGATE'],
            cpu=cpu,
            memory=memory,
            executionRoleArn=current_task_def['executionRoleArn'],
            taskRoleArn=current_task_def.get('taskRoleArn', ''),
            containerDefinitions=container_defs
        )

        new_task_def_arn = new_task_def['taskDefinition']['taskDefinitionArn']

        print(f"Registered new task definition: {new_task_def_arn}")

        # ACTION: Update service to use new task definition
        # REASON: Triggers rolling deployment - ECS starts new tasks, waits for health checks,
        #         then drains and stops old tasks for zero-downtime update
        self.ecs.update_service(
            cluster=self.cluster_name,
            service=self.service_name,
            taskDefinition=new_task_def_arn,
            deploymentConfiguration={
                'maximumPercent': 200,        # Allow 2x capacity during deploy
                'minimumHealthyPercent': 100  # Never drop below desired count
            }
        )

        print(f"Service {self.service_name} updated with new task definition")
        return new_task_def_arn

    # ACTION: Scale service based on custom application metrics (e.g., queue depth, API latency)
    # REASON: Standard CPU/memory metrics don't capture all scaling needs; custom metrics enable
    #         scaling based on business logic (queue length, request latency, active connections)
    # CONTEXT: CloudWatch auto-scaling uses built-in metrics; this enables event-driven scaling
    #          Example: Scale up when queue depth > 100 messages or P95 latency > 500ms
    def scale_based_on_custom_metric(
        self,
        metric_name: str,
        namespace: str,
        threshold: float,
        comparison: str = 'GreaterThan'
    ) -> None:
        """
        Scale service based on custom CloudWatch metric

        Enables scaling based on application-specific metrics like:
        - Message queue depth
        - API request latency (P95, P99)
        - Active WebSocket connections
        - Database connection pool utilization

        Args:
            metric_name: CloudWatch metric name (e.g., 'QueueDepth', 'APILatencyP95')
            namespace: CloudWatch namespace (e.g., 'MyApp/Production')
            threshold: Value to trigger scaling action
            comparison: 'GreaterThan' or 'LessThan'
        """
        # Get current metric value
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(minutes=5)

        metric_data = self.cw.get_metric_statistics(
            Namespace=namespace,
            MetricName=metric_name,
            StartTime=start_time,
            EndTime=end_time,
            Period=300,  # 5 minutes
            Statistics=['Average']
        )

        if not metric_data['Datapoints']:
            print(f"No data available for metric {metric_name}")
            return

        current_value = metric_data['Datapoints'][-1]['Average']
        print(f"Current {metric_name}: {current_value:.2f} (threshold: {threshold})")

        # Get current service desired count
        service = self.ecs.describe_services(
            cluster=self.cluster_name,
            services=[self.service_name]
        )['services'][0]

        current_count = service['desiredCount']

        # Determine scaling action
        should_scale_up = (
            comparison == 'GreaterThan' and current_value > threshold
        )
        should_scale_down = (
            comparison == 'LessThan' and current_value < threshold
        )

        if should_scale_up:
            # Scale up by 50% or minimum 2 tasks
            new_count = max(current_count + 2, int(current_count * 1.5))
            print(f"Scaling UP: {current_count} → {new_count} tasks")
            self._update_desired_count(new_count)

        elif should_scale_down:
            # Scale down by 25% but maintain minimum of 2 tasks
            new_count = max(2, int(current_count * 0.75))
            if new_count < current_count:
                print(f"Scaling DOWN: {current_count} → {new_count} tasks")
                self._update_desired_count(new_count)

        else:
            print(f"No scaling needed - metric within acceptable range")

    def _update_desired_count(self, new_count: int) -> None:
        """Update service desired count"""
        self.ecs.update_service(
            cluster=self.cluster_name,
            service=self.service_name,
            desiredCount=new_count
        )

    # ACTION: Retrieve and aggregate container logs from CloudWatch Logs
    # REASON: Centralized logging enables debugging without SSH access to containers
    # CONTEXT: Fargate streams stdout/stderr to CloudWatch; no host access for log files
    def get_task_logs(
        self,
        task_arn: str,
        start_time: Optional[datetime] = None,
        limit: int = 100
    ) -> List[Dict]:
        """
        Retrieve container logs for a specific task

        Args:
            task_arn: Full task ARN or task ID
            start_time: Optional start time for log retrieval
            limit: Maximum number of log events to return

        Returns:
            List of log events with timestamp and message
        """
        # Extract task ID from ARN if needed
        task_id = task_arn.split('/')[-1]

        # Get task details to find log stream
        task = self.ecs.describe_tasks(
            cluster=self.cluster_name,
            tasks=[task_arn]
        )['tasks'][0]

        # Get task definition to find log group
        task_def = self.ecs.describe_task_definition(
            taskDefinition=task['taskDefinitionArn']
        )['taskDefinition']

        container = task_def['containerDefinitions'][0]
        log_config = container['logConfiguration']
        log_group = log_config['options']['awslogs-group']
        log_prefix = log_config['options']['awslogs-stream-prefix']

        # Construct log stream name: prefix/container-name/task-id
        log_stream = f"{log_prefix}/{container['name']}/{task_id}"

        # Retrieve logs
        kwargs = {
            'logGroupName': log_group,
            'logStreamName': log_stream,
            'limit': limit,
            'startFromHead': False  # Get most recent logs
        }

        if start_time:
            kwargs['startTime'] = int(start_time.timestamp() * 1000)

        try:
            response = self.logs.get_log_events(**kwargs)
            events = response['events']

            # Format logs for readability
            formatted_logs = []
            for event in events:
                formatted_logs.append({
                    'timestamp': datetime.fromtimestamp(event['timestamp'] / 1000),
                    'message': event['message']
                })

            return formatted_logs

        except self.logs.exceptions.ResourceNotFoundException:
            print(f"Log stream not found: {log_stream}")
            return []

    # ACTION: Monitor service health and auto-recover from degraded state
    # REASON: Detects issues like tasks failing health checks, high error rates, or resource exhaustion
    #         Enables automated remediation without manual intervention
    def monitor_and_heal(self) -> Dict[str, any]:
        """
        Monitor service health and attempt auto-recovery

        Checks:
        - Running task count vs desired count
        - Task health check failures
        - Recent deployment failures
        - CloudWatch alarms in ALARM state

        Returns:
            Health status and actions taken
        """
        service = self.ecs.describe_services(
            cluster=self.cluster_name,
            services=[self.service_name]
        )['services'][0]

        desired = service['desiredCount']
        running = service['runningCount']
        pending = service['pendingCount']

        health_status = {
            'healthy': True,
            'desired_count': desired,
            'running_count': running,
            'pending_count': pending,
            'issues': [],
            'actions_taken': []
        }

        # Check if running count matches desired
        if running < desired:
            health_status['healthy'] = False
            health_status['issues'].append(
                f"Running tasks ({running}) below desired ({desired})"
            )

            # Check for recent task failures
            tasks = self.ecs.list_tasks(
                cluster=self.cluster_name,
                serviceName=self.service_name,
                desiredStatus='STOPPED'
            )

            if tasks['taskArns']:
                # Get stopped task details
                stopped_tasks = self.ecs.describe_tasks(
                    cluster=self.cluster_name,
                    tasks=tasks['taskArns'][:5]  # Last 5 stopped tasks
                )['tasks']

                # Analyze stop reasons
                for task in stopped_tasks:
                    stop_code = task.get('stopCode')
                    stop_reason = task.get('stoppedReason', 'Unknown')

                    if stop_code == 'TaskFailedToStart':
                        health_status['issues'].append(
                            f"Task failed to start: {stop_reason}"
                        )
                        # Could indicate resource constraints, image pull failures, etc.

                    elif 'OutOfMemory' in stop_reason:
                        health_status['issues'].append(
                            "Tasks killed due to OOM - memory limit too low"
                        )
                        # ACTION: Could auto-increase memory allocation

        # Check deployment status
        deployments = service['deployments']
        if len(deployments) > 1:
            # Multiple deployments means update in progress
            health_status['issues'].append("Deployment in progress")

        primary_deployment = deployments[0]
        if primary_deployment['rolloutState'] == 'FAILED':
            health_status['healthy'] = False
            health_status['issues'].append("Primary deployment failed")
            health_status['actions_taken'].append("Rollback recommended")

        return health_status

    def get_service_metrics(self, period_minutes: int = 60) -> TaskMetrics:
        """
        Retrieve aggregated service metrics from CloudWatch

        Args:
            period_minutes: Time window for metric aggregation

        Returns:
            TaskMetrics with CPU, memory, request count, and error rate
        """
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(minutes=period_minutes)

        # Get CPU utilization
        cpu_data = self.cw.get_metric_statistics(
            Namespace='AWS/ECS',
            MetricName='CPUUtilization',
            Dimensions=[
                {'Name': 'ServiceName', 'Value': self.service_name},
                {'Name': 'ClusterName', 'Value': self.cluster_name}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=300,
            Statistics=['Average']
        )

        # Get memory utilization
        memory_data = self.cw.get_metric_statistics(
            Namespace='AWS/ECS',
            MetricName='MemoryUtilization',
            Dimensions=[
                {'Name': 'ServiceName', 'Value': self.service_name},
                {'Name': 'ClusterName', 'Value': self.cluster_name}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=300,
            Statistics=['Average']
        )

        # Calculate averages
        cpu_avg = sum(d['Average'] for d in cpu_data['Datapoints']) / len(cpu_data['Datapoints']) if cpu_data['Datapoints'] else 0
        memory_avg = sum(d['Average'] for d in memory_data['Datapoints']) / len(memory_data['Datapoints']) if memory_data['Datapoints'] else 0

        return TaskMetrics(
            cpu_utilization=cpu_avg,
            memory_utilization=memory_avg,
            request_count=0,  # Would fetch from ALB metrics
            error_rate=0.0     # Would fetch from custom metrics
        )


# CONTEXT DILATION: Auto-Scaling Enables 10x Traffic Spike Handling
#
# Production Scenario: E-commerce Flash Sale
# - Normal traffic: 100 requests/second (3 Fargate tasks, 1 vCPU/2GB each)
# - Flash sale announced: Traffic surges to 1000 RPS in 2 minutes
# - Auto-scaling response timeline:
#
# T+0:00 - Flash sale starts
#   - Request rate: 100 → 400 RPS (4x increase)
#   - CPU utilization: 40% → 85%
#   - CloudWatch alarm: CPU > 70% threshold breached
#
# T+0:30 - First scale-out triggered
#   - Target tracking policy requests 6 additional tasks (2x current)
#   - Fargate provisions 6 new tasks in parallel
#   - Request rate: 600 RPS (still increasing)
#
# T+1:30 - First wave of tasks healthy
#   - 6 new tasks pass ALB health checks and start receiving traffic
#   - Total capacity: 9 tasks
#   - Request rate: 800 RPS
#   - CPU: Still 75% (load increasing faster than capacity)
#
# T+2:00 - Second scale-out triggered
#   - Target tracking requests 9 more tasks (aggressive scaling)
#   - Request rate: 1000 RPS (peak)
#   - Fargate provisions additional tasks
#
# T+3:00 - Full capacity available
#   - Total: 18 tasks handling 1000 RPS
#   - CPU: 65% (below 70% target)
#   - P95 latency: 120ms (within SLA)
#   - Error rate: 0.1% (acceptable)
#
# Result: System scaled from 3 → 18 tasks (6x) in 3 minutes
#         Handled 10x traffic spike with <1% errors
#         Auto-scaled back down to 5 tasks over 15 minutes after sale ended
#
# Without auto-scaling:
#   - 3 static tasks would be overwhelmed at 400 RPS
#   - CPU would hit 100%, request queues would back up
#   - Latency would spike to 5-10 seconds
#   - Timeouts and errors would exceed 50%
#   - Revenue loss: $50K+ during 5-minute flash sale

# Example usage
if __name__ == "__main__":
    manager = FargateServiceManager(
        cluster_name='production-cluster',
        service_name='web-api-service'
    )

    # Update service with new container image
    print("\\n=== Deploying new version ===")
    new_task_def = manager.update_task_definition(
        new_image='123456789012.dkr.ecr.us-east-1.amazonaws.com/web-api:v2.1.0',
        environment_vars={'FEATURE_FLAG_NEW_UI': 'true'}
    )

    # Scale based on custom metric (e.g., API queue depth)
    print("\\n=== Checking custom scaling metric ===")
    manager.scale_based_on_custom_metric(
        metric_name='QueueDepth',
        namespace='MyApp/Production',
        threshold=100.0,
        comparison='GreaterThan'
    )

    # Get service metrics
    print("\\n=== Service metrics (last hour) ===")
    metrics = manager.get_service_metrics(period_minutes=60)
    print(f"CPU: {metrics.cpu_utilization:.1f}%")
    print(f"Memory: {metrics.memory_utilization:.1f}%")

    # Monitor service health
    print("\\n=== Health check ===")
    health = manager.monitor_and_heal()
    print(f"Healthy: {health['healthy']}")
    print(f"Running: {health['running_count']}/{health['desired_count']}")
    if health['issues']:
        print(f"Issues: {health['issues']}")`,
      runnable: false,
      contextDilation: {
        level: "system",
        scope:
          "Production automation for ECS Fargate: programmatic service updates, custom metric scaling, log retrieval, health monitoring, and auto-remediation",
        prerequisites: [
          "Python 3.8+",
          "boto3 library",
          "AWS credentials with ECS, CloudWatch, and Logs permissions",
          "Running ECS Fargate service",
          "CloudWatch Logs configured for tasks",
        ],
        systemPosition:
          "Operations automation layer for managing Fargate services programmatically without AWS Console",
      },
      annotations: [
        {
          id: "py-rolling-update",
          lines: [73, 88],
          action:
            "Update service with new task definition to trigger rolling deployment",
          reason:
            "ECS orchestrates zero-downtime update by starting new tasks, waiting for health checks, then draining old tasks; immutable task definitions enable instant rollback",
          contextLevel: "system",
          relatedConcepts: [
            "zero-downtime-deployment",
            "rolling-update",
            "blue-green",
          ],
        },
        {
          id: "py-task-def-registration",
          lines: [91, 105],
          action:
            "Register new task definition revision with updated container image",
          reason:
            "Task definitions are immutable and versioned (family:1, family:2); new registration creates revision for rollback capability and audit trail",
          contextLevel: "module",
          relatedConcepts: ["immutable-infrastructure", "versioning"],
        },
        {
          id: "py-deployment-config",
          lines: [111, 120],
          action:
            "Configure rolling deployment with maximumPercent=200 and minimumHealthyPercent=100",
          reason:
            "Allows double capacity during deployment (safety buffer) while never dropping below desired count (availability guarantee)",
          contextLevel: "system",
          relatedConcepts: ["deployment-strategy", "high-availability"],
        },
        {
          id: "py-custom-metric-scaling",
          lines: [123, 153],
          action:
            "Scale service based on custom CloudWatch metric like queue depth or API latency",
          reason:
            "Standard CPU/memory metrics don't capture all scaling needs; custom metrics enable business-logic-driven scaling (queue length, P95 latency, active connections)",
          contextLevel: "system",
          relatedConcepts: [
            "custom-metrics",
            "application-aware-scaling",
            "queue-depth",
          ],
        },
        {
          id: "py-metric-retrieval",
          lines: [155, 169],
          action:
            "Query CloudWatch for custom metric value over 5-minute window",
          reason:
            "Recent metric average provides signal for scaling decisions; 5-minute window smooths transient spikes while remaining responsive",
          contextLevel: "module",
          relatedConcepts: ["cloudwatch-metrics", "time-series"],
        },
        {
          id: "py-scaling-logic",
          lines: [181, 198],
          action:
            "Calculate new desired count based on metric threshold breach",
          reason:
            "Scale up by 50% when threshold exceeded (aggressive response to load); scale down by 25% when below threshold (conservative cost reduction)",
          contextLevel: "module",
          relatedConcepts: ["scaling-algorithm", "adaptive-capacity"],
        },
        {
          id: "py-log-retrieval",
          lines: [207, 266],
          action: "Retrieve container logs from CloudWatch Logs using task ARN",
          reason:
            "Fargate tasks are ephemeral and inaccessible via SSH; CloudWatch Logs provides centralized logging for debugging and monitoring",
          contextLevel: "system",
          relatedConcepts: [
            "centralized-logging",
            "cloudwatch-logs",
            "observability",
          ],
        },
        {
          id: "py-health-monitoring",
          lines: [271, 346],
          action:
            "Monitor service health by comparing running vs desired count and analyzing stopped tasks",
          reason:
            "Detects issues like task startup failures, OOM kills, or deployment failures; enables automated remediation and alerting",
          contextLevel: "system",
          relatedConcepts: [
            "health-monitoring",
            "self-healing",
            "failure-detection",
          ],
        },
        {
          id: "py-auto-scaling-scenario",
          lines: [388, 447],
          action:
            "Document real-world auto-scaling response to 10x traffic spike during flash sale",
          reason:
            "Demonstrates Fargate auto-scaling timeline: detecting spike, provisioning tasks, reaching capacity in 3 minutes vs failure without scaling",
          contextLevel: "system",
          relatedConcepts: [
            "traffic-spike",
            "elastic-scaling",
            "production-scenario",
          ],
        },
      ],
      highlights: [
        {
          lines: [73, 120],
          label: "Zero-downtime task definition update",
          sbvpDomain: "behavior",
        },
        {
          lines: [123, 198],
          label: "Custom metric-based scaling logic",
          sbvpDomain: "behavior",
        },
        {
          lines: [207, 266],
          label: "CloudWatch Logs retrieval",
          sbvpDomain: "structure",
        },
        {
          lines: [271, 346],
          label: "Health monitoring and auto-remediation",
          sbvpDomain: "behavior",
        },
        {
          lines: [388, 447],
          label: "Production auto-scaling scenario: 100→1000 RPS in 3 minutes",
          sbvpDomain: "philosophy",
        },
      ],
    },
  ],

  systemContext: {
    typicalPlacement: [
      "Microservices API backends (REST, GraphQL, gRPC services)",
      "Batch processing jobs (ETL pipelines, data transformations)",
      "Web applications (Node.js, Python, Java web servers)",
      "CI/CD build agents (containerized build runners)",
      "Machine learning model inference (serving prediction APIs)",
      "Stream processing (Kinesis consumers, Kafka processors)",
      "Background workers (queue consumers, scheduled tasks)",
      "WebSocket servers (real-time chat, notifications)",
    ],
    interactsWith: [
      "application-load-balancer",
      "cloudwatch",
      "vpc",
      "iam",
      "secrets-manager",
      "ecr",
      "route-53",
      "rds",
      "dynamodb",
      "s3",
    ],
    architecturalBoundaries: [
      "ECS control plane - orchestrates task scheduling, health monitoring, deployment coordination",
      "Fargate compute layer - provisions isolated kernel runtimes with dedicated CPU/memory",
      "VPC networking - each task gets dedicated ENI with security group enforcement",
      "Application Load Balancer - distributes traffic, performs health checks, enables blue/green deployments",
      "CloudWatch observability - collects logs, metrics, and triggers auto-scaling policies",
      "Secrets management - IAM roles, Secrets Manager, and Parameter Store for credential injection",
      "Container registry - ECR stores images, integrates with IAM for pull permissions",
    ],
  },

  implementations: [
    {
      id: "aws-fargate",
      name: "AWS Fargate",
      type: "platform",
      languages: ["any"],
      description:
        "AWS-managed serverless container platform integrated with ECS and EKS. Provisions dedicated kernel runtime per task with guaranteed CPU/memory resources. Supports VPC networking with dedicated ENI per task, IAM role integration, and CloudWatch monitoring. Billed per-second for exact vCPU and memory consumption.",
      links: {
        docs: "https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html",
      },
      codeSnippet: `# Fargate task definition (awsvpc network mode required)
{
  "family": "app-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",     # 1 vCPU
  "memory": "2048",  # 2 GB
  "containerDefinitions": [{
    "name": "app",
    "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/app:latest",
    "portMappings": [{"containerPort": 8080}]
  }]
}`,
    },
    {
      id: "ecs-cli",
      name: "ECS CLI",
      type: "platform",
      languages: ["any"],
      description:
        "Command-line interface for simplified ECS cluster and service management. Provides Docker Compose-like workflow for defining multi-container applications. Supports local development with Docker Compose files that deploy to Fargate. Simplifies service creation, updates, and log retrieval.",
      links: {
        docs: "https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ECS_CLI.html",
        github: "https://github.com/aws/amazon-ecs-cli",
      },
      codeSnippet: `# Deploy Docker Compose app to Fargate
ecs-cli compose \\
  --file docker-compose.yml \\
  --project-name my-app \\
  service up \\
  --launch-type FARGATE \\
  --cluster production \\
  --create-log-groups`,
    },
    {
      id: "aws-copilot",
      name: "AWS Copilot CLI",
      type: "platform",
      languages: ["any"],
      description:
        "Opinionated CLI for building, releasing, and operating production-ready containerized applications on ECS Fargate. Automates infrastructure provisioning (VPC, ALB, ECS service, auto-scaling) with best-practice defaults. Supports environments (dev/staging/prod), pipelines, and service discovery.",
      links: {
        docs: "https://aws.github.io/copilot-cli/",
        github: "https://github.com/aws/copilot-cli",
      },
      codeSnippet: `# Initialize app and create service
copilot init \\
  --app my-app \\
  --name api \\
  --type "Load Balanced Web Service" \\
  --dockerfile ./Dockerfile

# Deploy to production environment
copilot deploy --env production`,
    },
    {
      id: "terraform-ecs",
      name: "Terraform AWS ECS Module",
      type: "library",
      languages: ["hcl"],
      description:
        "Infrastructure-as-code module for provisioning ECS Fargate resources. Manages cluster, task definitions, services, auto-scaling, IAM roles, and CloudWatch log groups. Enables versioned, repeatable infrastructure deployments with state management. Supports blue/green deployments via CodeDeploy integration.",
      links: {
        docs: "https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/ecs_service",
        github: "https://github.com/terraform-aws-modules/terraform-aws-ecs",
      },
      codeSnippet: `resource "aws_ecs_service" "app" {
  name            = "app-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 3
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = var.private_subnets
    security_groups = [aws_security_group.ecs.id]
  }
}`,
    },
    {
      id: "cloudformation-ecs",
      name: "CloudFormation ECS Resources",
      type: "platform",
      languages: ["yaml", "json"],
      description:
        "AWS-native infrastructure-as-code for defining ECS Fargate resources in CloudFormation templates. Supports stack-based deployment with rollback on failure. Integrates with CloudFormation StackSets for multi-region deployment. Provides drift detection and change sets for safe updates.",
      links: {
        docs: "https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ecs-service.html",
      },
      codeSnippet: `Resources:
  ECSService:
    Type: AWS::ECS::Service
    Properties:
      ServiceName: app-service
      Cluster: !Ref ECSCluster
      TaskDefinition: !Ref TaskDefinition
      DesiredCount: 3
      LaunchType: FARGATE
      NetworkConfiguration:
        AwsvpcConfiguration:
          Subnets: !Ref PrivateSubnets
          SecurityGroups: [!Ref ECSSecurityGroup]`,
    },
    {
      id: "cdk-ecs",
      name: "AWS CDK ECS Constructs",
      type: "library",
      languages: ["typescript", "python", "java", "csharp"],
      description:
        "High-level constructs for defining ECS Fargate infrastructure in code using TypeScript, Python, Java, or C#. Provides abstractions like ApplicationLoadBalancedFargateService for common patterns. Generates CloudFormation templates from code. Supports custom constructs for reusable infrastructure patterns.",
      links: {
        docs: "https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ecs-readme.html",
        github: "https://github.com/aws/aws-cdk",
      },
      codeSnippet: `import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';

const service = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'Service', {
  cluster,
  taskImageOptions: {
    image: ecs.ContainerImage.fromRegistry('nginx'),
  },
  desiredCount: 3,
  cpu: 1024,
  memoryLimitMiB: 2048,
});`,
    },
    {
      id: "pulumi-ecs",
      name: "Pulumi AWS ECS",
      type: "library",
      languages: ["typescript", "python", "go", "csharp"],
      description:
        "Infrastructure-as-code for ECS Fargate using general-purpose programming languages. Provides strongly-typed resources with IntelliSense support. Enables testing infrastructure code with unit tests. Supports component resources for reusable infrastructure patterns.",
      links: {
        docs: "https://www.pulumi.com/docs/clouds/aws/guides/ecs/",
        github: "https://github.com/pulumi/pulumi-aws",
      },
      codeSnippet: `import * as aws from "@pulumi/aws";

const service = new aws.ecs.Service("app", {
  cluster: cluster.arn,
  taskDefinition: taskDef.arn,
  desiredCount: 3,
  launchType: "FARGATE",
  networkConfiguration: {
    subnets: privateSubnets,
    securityGroups: [sg.id],
  },
});`,
    },
    {
      id: "aws-sam",
      name: "AWS SAM (Serverless Application Model)",
      type: "framework",
      languages: ["yaml"],
      description:
        "Extension of CloudFormation for defining serverless applications including ECS Fargate services. Provides simplified syntax for common patterns. Supports local testing with SAM CLI. Integrates with Lambda, API Gateway, and other serverless services for hybrid architectures.",
      links: {
        docs: "https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-resource-function.html",
        github: "https://github.com/aws/serverless-application-model",
      },
      codeSnippet: `Resources:
  AppFunction:
    Type: AWS::Serverless::Function
    Properties:
      PackageType: Image
      ImageUri: 123456789012.dkr.ecr.us-east-1.amazonaws.com/app:latest
      Events:
        Api:
          Type: Api
          Properties:
            Path: /api
            Method: get`,
    },
  ],

  usedInSystems: [
    {
      systemId: "ancestry-dna",
      systemName: "Ancestry.com DNA Processing Pipeline",
      howUsed:
        "Ancestry uses ECS Fargate to process over 10 million DNA test results annually without managing EC2 infrastructure. DNA processing is highly variable: steady baseline of ~5,000 tests/day spiking to 100,000+ during holidays (23andMe competition, Christmas gift season). Fargate auto-scales from 20 baseline tasks to 500+ tasks during peaks, processing raw genetic data through alignment, variant calling, and ancestry estimation algorithms. Each task runs a containerized bioinformatics pipeline (BWA, GATK, custom ancestry algorithms) with 4 vCPU and 16GB memory for compute-intensive genomic analysis. Tasks complete in 2-4 hours, then terminate—Fargate's per-second billing eliminates paying for idle capacity between batches. Pattern composition: Fargate (compute) + S3 (raw data storage) + DynamoDB (results) + SQS (job queue) + Lambda (orchestration). Rationale: Variable workload makes EC2 over-provisioning wasteful; DNA processing is batch-oriented (not latency-sensitive) making Fargate's 60-second startup acceptable. Impact: Reduced infrastructure costs by 60% vs EC2 reserved instances ($2M→$800K annually); eliminated operational overhead of managing 500+ instance cluster; scaled to handle 3x holiday traffic spike without manual intervention.",
      source: "https://aws.amazon.com/solutions/case-studies/ancestry/",
    },
    {
      systemId: "expedia-search",
      systemName: "Expedia Travel Search Platform",
      howUsed:
        "Expedia runs its travel search and booking microservices on ECS Fargate, handling 500M+ searches per month across flights, hotels, car rentals, and vacation packages. Search traffic is highly variable: 2x baseline during weekdays, 5x during holiday planning periods (Thanksgiving, summer). Fargate auto-scales from 100 baseline tasks to 1,500+ tasks during peak periods, with each task running a containerized search aggregation service (4 vCPU, 8GB memory) that queries supplier APIs (airlines, hotel chains, rental agencies) in parallel. The service uses Fargate's VPC networking to enforce security group isolation between payment processing, user data, and external supplier integrations. Pattern composition: Fargate (compute) + ElastiCache (session state) + RDS Aurora (bookings) + API Gateway (rate limiting) + CloudWatch (auto-scaling). Rationale: Global travel search has unpredictable spikes tied to world events (travel restrictions lifted, new routes announced); Fargate enables elastic response without over-provisioning. Impact: Handled 10x traffic spike when COVID travel restrictions lifted without outages; reduced time-to-market for new services from weeks (EC2 cluster setup) to hours (Fargate deployment); saved $5M+ annually by eliminating idle EC2 capacity during off-peak seasons.",
      source:
        "https://www.youtube.com/watch?v=KngM5bfpttA (AWS re:Invent talk)",
    },
    {
      systemId: "samsung-smartthings",
      systemName: "Samsung SmartThings IoT Platform",
      howUsed:
        "Samsung SmartThings uses ECS Fargate to run device automation services for 70M+ connected IoT devices (smart lights, thermostats, cameras, door locks). Device events (motion detected, temperature changed, door opened) trigger Fargate tasks that execute user-defined automation rules (turn on lights when motion detected, adjust thermostat when leaving home). Traffic is highly variable: baseline 50K events/second spiking to 500K+ during morning/evening rush hours when users leave/return home. Fargate auto-scales from 200 baseline tasks to 3,000+ tasks during peaks, with each task running a containerized rule engine (1 vCPU, 2GB memory) that evaluates automation rules and sends device commands. Fargate's per-second billing is ideal: tasks process event batch in 30-60 seconds then terminate. Pattern composition: Fargate (compute) + Kinesis (event stream) + DynamoDB (device state) + IoT Core (device connectivity) + Lambda (lightweight automations). Rationale: IoT events are bursty and unpredictable (weather-triggered automations, security alerts); Fargate eliminates over-provisioning for peak load while maintaining low baseline costs. Impact: Reduced infrastructure costs by 70% vs EC2 ($8M→$2.4M annually); handled 5x traffic spike during Winter Storm Uri (heating automation) without service degradation; enabled rapid iteration on automation engine without infrastructure concerns.",
      source:
        "https://aws.amazon.com/blogs/containers/samsung-smartthings-uses-aws-fargate/",
    },
    {
      systemId: "duolingo-learning",
      systemName: "Duolingo Language Learning Platform",
      howUsed:
        "Duolingo uses ECS Fargate to run adaptive learning algorithms and lesson generation services for 500M+ users learning 40+ languages. Learning services are compute-intensive: analyzing user performance, generating personalized lesson sequences, calculating spaced repetition schedules, and serving AI-powered conversation practice. Traffic patterns follow global time zones: 10x baseline during evening hours in each region (US East Coast 6-10pm, Europe 7-11pm, Asia 6-10pm). Fargate auto-scales from 50 baseline tasks to 1,000+ tasks during regional peaks, with each task running containerized Python ML inference services (2 vCPU, 4GB memory) serving TensorFlow models for pronunciation scoring and conversation AI. The service uses Fargate Spot (70% discount) for non-critical background tasks like lesson pregeneration. Pattern composition: Fargate (compute) + S3 (model storage) + RDS Aurora (user progress) + ElastiCache (session data) + SageMaker (model training). Rationale: Global user base creates rolling wave of traffic across time zones; Fargate enables regional auto-scaling without managing EC2 clusters in 15+ regions. Impact: Reduced infrastructure costs by 65% vs EC2 ($4M→$1.4M annually); improved ML model deployment from days (EC2 instance updates) to hours (Fargate task definition updates); scaled to 500M users without dedicated infrastructure team.",
      source:
        "https://blog.duolingo.com/duolingo-infrastructure-lessons-learned/",
    },
    {
      systemId: "coinbase-trading",
      systemName: "Coinbase Cryptocurrency Trading Platform",
      howUsed:
        "Coinbase uses ECS Fargate to run trading analytics, market data aggregation, and risk monitoring services handling billions in daily trading volume. Crypto trading is extremely volatile: baseline 10K transactions/minute spiking to 500K+ during market crashes or rallies (Bitcoin halving, regulatory announcements, major hacks). Fargate auto-scales from 100 baseline tasks to 5,000+ tasks during volatility spikes, with each task running containerized Go services (2 vCPU, 4GB memory) that aggregate order book data, calculate risk metrics, and detect suspicious trading patterns. The platform uses Fargate's strong task isolation (dedicated kernel runtime) to separate critical trading services from analytics workloads, preventing noisy neighbor issues. Pattern composition: Fargate (compute) + Kafka (order stream) + TimescaleDB (market data) + Redis (order book cache) + CloudWatch (anomaly detection). Rationale: Crypto markets are 24/7 with unpredictable volatility; Fargate enables instant scaling from calm periods to market chaos without over-provisioning for rare events. Impact: Handled 100x traffic spike during March 2020 market crash without outages; reduced time-to-scale from 15 minutes (EC2 instance launch) to 90 seconds (Fargate task startup); saved $10M+ annually by not provisioning for peak capacity 24/7.",
      source:
        "https://blog.coinbase.com/container-technologies-at-coinbase-d4ae118dcb6c",
    },
  ],

  philosophy: {
    coreProblem:
      "Container orchestration requires managing infrastructure (EC2 instances, patching, capacity planning, cluster auto-scaling) which diverts engineering effort from application development",
    designPrinciple:
      "Abstract infrastructure management to serverless model where developers specify resource requirements and cloud provider handles provisioning, scaling, and operations",
    historicalContext:
      "Born from AWS ECS experience: customers wanted container orchestration benefits without EC2 operational overhead; Fargate launched 2017 as serverless compute for containers",
    alternativesRejected: [
      "Kubernetes on EC2 - too complex, requires dedicated platform team",
      "Lambda - too restrictive for long-running containers and custom runtimes",
      "EC2 with ECS - requires instance management, patching, cluster scaling",
      "Managed Kubernetes (EKS) - simpler than self-managed but still requires node management",
    ],
    mentalModel:
      "Like hiring a contractor to build a house versus managing construction workers directly: you specify requirements (floor plan = task definition, number of rooms = desired count) and contractor handles labor, scheduling, and resources",
  },

  visualization: {
    staticDiagram: `graph TB
    subgraph "Developer Workflow"
        DEF[Task Definition<br/>CPU, Memory, Image]
        SVC[ECS Service<br/>Desired Count, ALB]
    end

    subgraph "AWS Fargate Control Plane"
        SCHED[Task Scheduler]
        PROV[Capacity Provisioner]
        HEALTH[Health Monitor]
    end

    subgraph "Fargate Compute Layer"
        T1[Task 1<br/>1 vCPU, 2GB<br/>Dedicated Kernel]
        T2[Task 2<br/>1 vCPU, 2GB<br/>Dedicated Kernel]
        T3[Task 3<br/>1 vCPU, 2GB<br/>Dedicated Kernel]
    end

    subgraph "VPC Networking"
        ENI1[ENI + SG]
        ENI2[ENI + SG]
        ENI3[ENI + SG]
    end

    ALB[Application<br/>Load Balancer]
    CW[CloudWatch<br/>Logs + Metrics]

    DEF --> SVC
    SVC --> SCHED
    SCHED --> PROV
    PROV --> T1
    PROV --> T2
    PROV --> T3

    T1 --> ENI1
    T2 --> ENI2
    T3 --> ENI3

    ENI1 --> ALB
    ENI2 --> ALB
    ENI3 --> ALB

    T1 --> CW
    T2 --> CW
    T3 --> CW

    HEALTH --> T1
    HEALTH --> T2
    HEALTH --> T3

    style DEF fill:#e1f5e1
    style SVC fill:#e1f5e1
    style T1 fill:#bbdefb
    style T2 fill:#bbdefb
    style T3 fill:#bbdefb
    style ALB fill:#fff9c4
    style CW fill:#fff9c4`,
    realWorldAnalogy:
      "Fargate is like ride-sharing (Uber/Lyft) versus owning a car fleet. With EC2 (owned fleet), you buy cars, hire mechanics, pay insurance 24/7, and manage parking—even when cars sit idle. With Fargate (ride-sharing), you request rides when needed, pay per trip, and never worry about maintenance, parking, or idle costs. The service handles all logistics; you just specify pickup/dropoff (task definition) and number of passengers (CPU/memory).",
    useCases: [
      {
        domain: "E-commerce",
        scenario:
          "Black Friday traffic spikes from 1K to 50K requests/second. Fargate auto-scales from 10 to 500 tasks in 5 minutes, handles peak load, then scales back down. Pay only for actual usage vs provisioning 500 EC2 instances year-round.",
        patternRole:
          "Eliminates over-provisioning for rare traffic spikes while maintaining elasticity",
        companies: ["Amazon", "Shopify"],
      },
      {
        domain: "Media Processing",
        scenario:
          "Video transcoding service processes uploaded videos in 10 formats. Each upload triggers Fargate task (4 vCPU, 8GB) that transcodes video in 15-30 minutes then terminates. Variable upload rate (100-10K/day) makes EC2 provisioning wasteful.",
        patternRole:
          "Batch processing with variable workload benefits from per-second billing and instant scaling",
        companies: ["Netflix", "Vimeo"],
      },
      {
        domain: "Machine Learning",
        scenario:
          "ML inference API serves predictions using TensorFlow models. Traffic varies 20x between off-peak and peak hours. Fargate scales tasks from 5 to 100 based on request count, paying only for active inference time.",
        patternRole:
          "Enables elastic ML serving without provisioning GPU instances 24/7",
        companies: ["Airbnb", "Lyft"],
      },
    ],
  },

  tags: [
    "scalability",
    "horizontal-scaling",
    "orchestration",
    "serverless",
    "containers",
    "aws",
    "auto-scaling",
    "microservices",
  ],
  difficulty: "intermediate",
};
