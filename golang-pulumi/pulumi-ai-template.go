package main

import (
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ecs"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi-github/index/actionsOrganizationVariable"
	"github.com/pulumi/pulumi-github/index/repositoryEnvironment"
	"github.com/pulumi/pulumi-postgresql/index/database"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Create IAM role for ECS task execution
		taskExecRole, err := iam.NewRole(ctx, "taskExecRole", &iam.RoleArgs{
			AssumeRolePolicy: pulumi.String(`
			{
				"Version": "2012-10-17",
				"Statement": [
				  {
					"Effect": "Allow",
					"Principal": {
					  "Service": "ecs-tasks.amazonaws.com"
					},
					"Action": "sts:AssumeRole"
				  }
				]
			  }`),
		})
		if err != nil {
			return err
		}

		_, err = iam.NewRolePolicyAttachment(ctx, "taskExecRolePolicy", &iam.RolePolicyAttachmentArgs{
			Role:      taskExecRole.Name,
			PolicyArn: pulumi.String("arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"),
		})
		if err != nil {
			return err
		}

		// Create VPC
		vpc, err := ec2.NewVpc(ctx, "vpc", &ec2.VpcArgs{
			CidrBlock: pulumi.String("10.0.0.0/16"),
		})
		if err != nil {
			return err
		}

		subnet, err := ec2.NewSubnet(ctx, "subnet", &ec2.SubnetArgs{
			CidrBlock:        pulumi.String("10.0.1.0/24"),
			VpcId:            vpc.ID(),
			AvailabilityZone: pulumi.String("us-west-2a"),
		})
		if err != nil {
			return err
		}

		// Create Postgres Database
		dbInstance, err := rds.NewInstance(ctx, "postgresDb", &rds.InstanceArgs{
			InstanceClass:      pulumi.String("db.t3.micro"),
			AllocatedStorage:   pulumi.Int(20),
			Engine:             pulumi.String("postgres"),
			EngineVersion:      pulumi.String("15"),
			Name:               pulumi.String("mydb"),
			ParameterGroupName: pulumi.String("default.postgres15"),
			Username:           pulumi.String("postgres"),
			Password:           pulumi.String("password"),
			SkipFinalSnapshot:  pulumi.Bool(true),
			DbSubnetGroupName: vpc.SubnetIds.ApplyT(func(ids []string) (string, error) {
				return ids[0], nil
			}).(pulumi.StringOutput),
		})
		if err != nil {
			return err
		}

		// Create ECS cluster
		cluster, err := ecs.NewCluster(ctx, "app-cluster", &ecs.ClusterArgs{})
		if err != nil {
			return err
		}

		// Create ECS task definition
		taskDefinition, err := ecs.NewTaskDefinition(ctx, "appTask", &ecs.TaskDefinitionArgs{
			Family:                  pulumi.String("sample"),
			Cpu:                     pulumi.String("256"),
			Memory:                  pulumi.String("512"),
			NetworkMode:             pulumi.String("awsvpc"),
			RequiresCompatibilities: pulumi.StringArray{pulumi.String("FARGATE")},
			ExecutionRoleArn:        taskExecRole.Arn,
			ContainerDefinitions: pulumi.String(`[{
				"name": "backend",
				"image": "golang:latest",
				"portMappings": [{"containerPort": 8080, "hostPort": 8080}],
				"environment": [
					{"name": "POSTGRES_HOST", "value": "` + dbInstance.Endpoint + `"},
					{"name": "POSTGRES_USER", "value": "postgres"},
					{"name": "POSTGRES_PASSWORD", "value": "password"},
					{"name": "POSTGRES_DB", "value": "mydb"}
				]
			}, {
				"name": "frontend",
				"image": "node:14",
				"portMappings": [{"containerPort": 3000, "hostPort": 3000}]
			}]`),
		})
		if err != nil {
			return err
		}

		// Create ECS service
		_, err = ecs.NewService(ctx, "appService", &ecs.ServiceArgs{
			Cluster:        cluster.Arn,
			DesiredCount:   pulumi.Int(2),
			TaskDefinition: taskDefinition.Arn,
			LaunchType:     pulumi.String("FARGATE"),
			NetworkConfiguration: &ecs.ServiceNetworkConfigurationArgs{
				Subnets: pulumi.StringArray{subnet.ID()},
			},
		})
		if err != nil {
			return err
		}

		// Create Postgres Database in Pulumi
		_, err = database.NewDatabase(ctx, "mydb", &database.DatabaseArgs{
			Name:     pulumi.String("mydb"),
			Owner:    pulumi.String("postgres"),
			Encoding: pulumi.String("UTF8"),
		})
		if err != nil {
			return err
		}

		// Setup GitHub Actions Environment variable
		_, err = actionsOrganizationVariable.NewActionsOrganizationVariable(
			ctx,
			"dbVar",
			&actionsOrganizationVariable.ActionsOrganizationVariableArgs{
				VariableName: pulumi.String("POSTGRES_URL"),
				Value:        pulumi.String(dbInstance.Endpoint),
				Visibility:   pulumi.String("selected"),
			})
		if err != nil {
			return err
		}

		// Create GitHub Repository Environment
		_, err = repositoryEnvironment.NewRepositoryEnvironment(
			ctx,
			"prod",
			&repositoryEnvironment.RepositoryEnvironmentArgs{
				Repository:  pulumi.String("myrepo"),
				Environment: pulumi.String("production"),
			})
		if err != nil {
			return err
		}

		return nil
	})
}
