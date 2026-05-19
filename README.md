# ECS + ECR Hands-on

Basit bir Node.js servisini Docker image olarak ECR'a pushlayıp ECS Fargate üzerinde çalıştırmak için minimal demo.

## İçerik

- `app.js` — `http://<host>:3000/` adresinde "Hello from ECS! v1" döndüren tek dosyalık Node.js servisi.
- `Dockerfile` — `node:20-alpine` üstüne kuran image tanımı, port 3000.
- `.github/workflows/deploy.yml` — `main` branch'e push olunca image'ı build edip ECR'a pushlayan ve ECS service'ini yeniden deploy eden GitHub Actions pipeline'ı.

## Local Test

```bash
docker build -t hello-ecs .
docker run --rm -p 3000:3000 hello-ecs
curl http://localhost:3000
```

## AWS Tarafında Yapılacaklar (Konsoldan)

1. **ECR**: `demo-ecr` adında Private repository oluştur.
2. **İlk image push** (local makineden, push commands ECR konsolunda hazır):
   ```bash
   aws ecr get-login-password --region eu-central-1 \
     | docker login --username AWS --password-stdin <account_id>.dkr.ecr.eu-central-1.amazonaws.com

   docker buildx build --platform linux/amd64 \
     -t <account_id>.dkr.ecr.eu-central-1.amazonaws.com/demo-ecr:latest \
     --push .
   ```
3. **ECS Cluster**: `hello-ecs-cluster`, Fargate.
4. **Task Definition**: `hello-ecs-task`
   - Launch type: Fargate
   - 0.25 vCPU, 0.5 GB
   - Task execution role: `ecsTaskExecutionRole`
   - Container: name `hello-ecs`, image `<account_id>.dkr.ecr.eu-central-1.amazonaws.com/demo-ecr:latest`, port 3000/tcp
5. **Service**: `hello-ecs-service`
   - Desired tasks: 1
   - Public subnetler, Public IP: ENABLED
   - Security group: inbound TCP 3000 açık (demo için 0.0.0.0/0)
6. Task `RUNNING` olunca task'ın public IP'sinden `http://<public-ip>:3000` aç.

## Pipeline

GitHub repository secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

IAM kullanıcısı için minimum yetkiler:
- `AmazonEC2ContainerRegistryPowerUser`
- ECS update-service izni (demo için `AmazonECS_FullAccess` yeterli)

`main` branch'e push → image build → ECR'a push → ECS service `--force-new-deployment` ile yeni image'ı çeker.

## Demo Akışı

1. `app.js` içinde `APP_VERSION` veya mesajdaki `v1` ifadesini `v2` yap.
2. `git commit && git push origin main`
3. Actions sekmesinde build/push/deploy adımlarını izle.
4. Aynı public IP üzerinden yeni mesajı gör.

## Temizlik

Demo bitince ücret yazmaması için:
- ECS service'i `desired count = 0` yap, sonra sil.
- Cluster'ı sil.
- ECR repository'yi sil.
# demo
