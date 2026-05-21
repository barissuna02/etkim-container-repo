# etkim-container-repo

Basit bir Node.js servisini Docker image olarak ECR'a pushlayıp ECS Fargate üzerinde çalıştırmak için minimal demo.

## İçerik

- `app.js` — `http://<host>:3000/` adresinde "SUFLE ETKİM" karşılama sayfası döndüren tek dosyalık Node.js servisi. `/health` endpoint'i de var.
- `Dockerfile` — `node:20-alpine` üstüne kuran image tanımı, port 3000.
- `.github/workflows/deploy.yml` — `main` branch'e push olunca image'ı build edip ECR'a pushlayan ve ECS service'ini yeniden deploy eden GitHub Actions pipeline'ı.

## AWS Kaynakları

| Kaynak | Değer |
| --- | --- |
| Region | `eu-west-3` |
| Account ID | `511186633739` |
| ECR Repository | `etkim-image-repository` |
| ECR Image URI | `511186633739.dkr.ecr.eu-west-3.amazonaws.com/etkim-image-repository` |
| ECS Cluster | `etkim-container-cluster` |
| ECS Task Definition | `etkim-container-td` |
| ECS Service | `etkim-container-td-service` |
| Task Execution Role | `ecsTaskExecutionRole` |
| GitHub Actions Role | `github-actions-ecs-demo` (OIDC) |

## Local Test

```bash
docker build -t hello-ecs .
docker run --rm -p 3000:3000 hello-ecs
curl http://localhost:3000
curl http://localhost:3000/health
```

## AWS Tarafında Yapılacaklar (Konsoldan)

1. **ECR**: `etkim-image-repository` adında Private repository oluştur.
2. **İlk image push** (local makineden, Apple Silicon Mac'te `--platform linux/amd64` şart):
   ```bash
   aws ecr get-login-password --region eu-west-3 \
     | docker login --username AWS --password-stdin 511186633739.dkr.ecr.eu-west-3.amazonaws.com

   docker buildx build \
     --platform linux/amd64 \
     --provenance=false \
     --sbom=false \
     -t 511186633739.dkr.ecr.eu-west-3.amazonaws.com/etkim-image-repository:latest \
     --push .
   ```
3. **CloudWatch Log Group**: `/ecs/etkim-container-td` (task definition awslogs driver bunu kullanır).
4. **ECS Cluster**: `etkim-container-cluster`, Fargate.
5. **Task Definition**: `etkim-container-td`
   - Launch type: Fargate
   - Operating system / Architecture: `Linux/X86_64`
   - 0.25 vCPU, 0.5 GB
   - Task execution role: `ecsTaskExecutionRole`
   - Container: name `hello-ecs`, image `511186633739.dkr.ecr.eu-west3.amazonaws.com/etkim-container-app:latest`, port 3000/tcp
   - (Opsiyonel) Environment: `APP_VERSION=v1`
6. **Service**: `etkim-container-td-service`
   - Desired tasks: 1
   - Launch type: FARGATE
   - Public subnetler, Public IP: ENABLED
   - Security group: inbound TCP 3000 açık (demo için 0.0.0.0/0), outbound default (all traffic)
7. Task `RUNNING` olunca task'ın public IP'sinden `http://<public-ip>:3000` aç.

## Pipeline (GitHub Actions + OIDC)

GitHub repository secret:
- `AWS_ROLE_ARN` = `arn:aws:iam::511186633739:role/github-actions-ecs-demo`

IAM role `github-actions-ecs-demo`:
- Trust policy: `token.actions.githubusercontent.com` OIDC provider, `sub` condition `repo:barissuna02/etkim-container-repo:*`
- Permissions: `AmazonEC2ContainerRegistryPowerUser` + `AmazonECS_FullAccess`

Akış: `main` branch'e push → image build (`linux/amd64`) → ECR'a push (`:latest` ve `:<commit-sha>` tag'leri) → ECS service `--force-new-deployment` ile yeni image'ı çeker.


## Faydalı CLI Komutları

Service durumu:
```bash
aws ecs describe-services \
  --cluster etkim-container-cluster \
  --services etkim-container-td-service \
  --region eu-west- \
  --query 'services[0].{running:runningCount,pending:pendingCount,events:events[:3].message}'
```

Çalışan task'ın public IP'si:
```bash
TASK_ARN=$(aws ecs list-tasks --cluster etkim-container-cluster --service-name etkim-container-td-service --region eu-west-3 --query 'taskArns[0]' --output text)

ENI_ID=$(aws ecs describe-tasks --cluster etkim-container-cluster --tasks $TASK_ARN --region eu-west-3 --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text)

aws ec2 describe-network-interfaces --network-interface-ids $ENI_ID --region eu-west-3 --query 'NetworkInterfaces[0].Association.PublicIp' --output text
```

Manuel yeni deploy:
```bash
aws ecs update-service \
  --cluster etkim-container-cluster \
  --service etkim-container-td-service \
  --force-new-deployment \
  --region eu-west-3
```

## Temizlik

Demo bitince ücret yazmaması için:
- ECS service'i `desired count = 0` yap, sonra sil.
- Cluster'ı sil.
- Task definition'ları deregister et (opsiyonel, ücreti yok).
- ECR repository'yi sil (image'lar dolu olduğu için "force delete").
- CloudWatch log group'unu sil.
- Demo için açtığın security group'u sil.
