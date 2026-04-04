#!/usr/bin/env bash
set -euo pipefail

# ── cores ─────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}[info]${RESET}  $*"; }
ok()      { echo -e "${GREEN}[ok]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}[warn]${RESET}  $*"; }
err()     { echo -e "${RED}[erro]${RESET}  $*"; exit 1; }
header()  { echo -e "\n${BOLD}── $* ──${RESET}"; }

# ── validação de contexto ─────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Detecta se estamos dentro do repo Laravel ou um nível acima
if [[ -f "$SCRIPT_DIR/artisan" ]]; then
    LARAVEL_DIR="$SCRIPT_DIR"
elif [[ -f "$SCRIPT_DIR/hericarealtor/artisan" ]]; then
    LARAVEL_DIR="$SCRIPT_DIR/hericarealtor"
else
    err "Execute este script dentro do repo hericarealtor (onde está o artisan) ou um nível acima."
fi

PARENT_DIR="$(dirname "$LARAVEL_DIR")"
UPDATER_DIR="$PARENT_DIR/listings-updater"

info "Laravel  : $LARAVEL_DIR"
info "Updater  : $UPDATER_DIR"
info "Parent   : $PARENT_DIR"

if [[ ! -d "$UPDATER_DIR" ]]; then
    err "Pasta $UPDATER_DIR não encontrada. Clone o repo listings-updater ao lado do hericarealtor primeiro."
fi

# ── 1. Separar o updater do monorepo ─────────────────────────────────────────
header "1. Separar listings-updater do monorepo Laravel"

OLD_UPDATER="$LARAVEL_DIR/listings-updater"
if [[ -d "$OLD_UPDATER" ]]; then
    info "Movendo $OLD_UPDATER → $UPDATER_DIR ..."
    if [[ -d "$UPDATER_DIR" && "$(ls -A "$UPDATER_DIR")" ]]; then
        warn "$UPDATER_DIR já existe e não está vazio. Pulando mover (faça merge manual se necessário)."
    else
        mv "$OLD_UPDATER" "$UPDATER_DIR"
        ok "Movido com sucesso."
    fi
else
    ok "listings-updater já está fora do repo Laravel."
fi

# ── 2. Corrigir estrutura interna do updater ──────────────────────────────────
header "2. Corrigir estrutura interna do listings-updater"

cd "$UPDATER_DIR"

# config.py na raiz → app/
if [[ -f "config.py" && ! -f "app/config.py" ]]; then
    mv config.py app/config.py
    ok "config.py movido para app/"
fi

# pastas soltas na raiz → dentro de app/
for dir in graphql scrapers services utils; do
    if [[ -d "$dir" && ! -d "app/$dir" ]]; then
        mv "$dir" "app/$dir"
        ok "$dir/ movido para app/$dir/"
    fi
done

# typo no retry
if [[ -f "app/utils/rety.py" && ! -f "app/utils/retry.py" ]]; then
    mv app/utils/rety.py app/utils/retry.py
    ok "rety.py renomeado para retry.py"
fi

# requirements.md → requirements.txt
if [[ -f "requirements.md" && ! -f "requirements.txt" ]]; then
    mv requirements.md requirements.txt
    ok "requirements.md renomeado para requirements.txt"
fi

# env.example → .env.example
if [[ -f "env.example" && ! -f ".env.example" ]]; then
    mv env.example .env.example
    ok "env.example renomeado para .env.example"
fi

# yamls soltos → k8s/
mkdir -p k8s
for f in cronjob.yaml deployment.yaml; do
    if [[ -f "$f" && ! -f "k8s/$f" ]]; then
        mv "$f" "k8s/$f"
        ok "$f movido para k8s/"
    fi
done

# kustomization base do updater
if [[ ! -f "k8s/kustomization.yaml" ]]; then
    cat > k8s/kustomization.yaml << 'EOF'
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: hericarealtor
resources:
  - cronjob.yaml
EOF
    ok "k8s/kustomization.yaml criado"
fi

# ── 3. Corrigir k8s do Laravel ────────────────────────────────────────────────
header "3. Corrigir manifestos Kubernetes do Laravel"

cd "$LARAVEL_DIR"
K8S="$LARAVEL_DIR/k8s"
mkdir -p "$K8S/base" "$K8S/overlays/production"

# ── deployment.yaml corrigido ─────────────────────────────────────────────────
cat > "$K8S/base/deployment.yaml" << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hericarealtor
  namespace: hericarealtor
  labels:
    app: hericarealtor
spec:
  replicas: 1
  selector:
    matchLabels:
      app: hericarealtor
  template:
    metadata:
      labels:
        app: hericarealtor
    spec:
      containers:
        - name: hericarealtor
          image: myregistry/hericarealtor:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 9000
          envFrom:
            - configMapRef:
                name: config
            - secretRef:
                name: secrets
          volumeMounts:
            - name: storage
              mountPath: /var/www/storage

        - name: scheduler
          image: myregistry/hericarealtor:latest
          command: ["php", "/var/www/artisan", "schedule:work"]
          envFrom:
            - configMapRef:
                name: config
            - secretRef:
                name: secrets
          volumeMounts:
            - name: storage
              mountPath: /var/www/storage

        - name: worker
          image: myregistry/hericarealtor:latest
          command: ["php", "/var/www/artisan", "queue:work", "redis", "--sleep=3", "--tries=3"]
          envFrom:
            - configMapRef:
                name: config
            - secretRef:
                name: secrets
          volumeMounts:
            - name: storage
              mountPath: /var/www/storage

      volumes:
        - name: storage
          persistentVolumeClaim:
            claimName: hericarealtor-storage
EOF
ok "k8s/base/deployment.yaml corrigido (namespace + PVC)"

# ── PVC para storage do Laravel ───────────────────────────────────────────────
cat > "$K8S/base/pvc.yaml" << 'EOF'
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: hericarealtor-storage
  namespace: hericarealtor
  labels:
    app: hericarealtor
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: standard
EOF
ok "k8s/base/pvc.yaml criado (storage Laravel)"

# ── service.yaml com namespace ────────────────────────────────────────────────
cat > "$K8S/base/service.yaml" << 'EOF'
apiVersion: v1
kind: Service
metadata:
  name: hericarealtor
  namespace: hericarealtor
  labels:
    app: hericarealtor
spec:
  type: ClusterIP
  ports:
    - port: 9000
      targetPort: 9000
      protocol: TCP
      name: http
  selector:
    app: hericarealtor
EOF
ok "k8s/base/service.yaml corrigido (namespace)"

# ── namespace.yaml ────────────────────────────────────────────────────────────
cat > "$K8S/base/namespace.yaml" << 'EOF'
apiVersion: v1
kind: Namespace
metadata:
  name: hericarealtor
  labels:
    team: hericarealtor
EOF
ok "k8s/base/namespace.yaml criado"

# ── Job de bootstrap do bucket MinIO ─────────────────────────────────────────
cat > "$K8S/base/minio-bootstrap-job.yaml" << 'EOF'
apiVersion: batch/v1
kind: Job
metadata:
  name: minio-bootstrap
  namespace: hericarealtor
  labels:
    app: minio-bootstrap
spec:
  ttlSecondsAfterFinished: 120
  template:
    spec:
      restartPolicy: OnFailure
      containers:
        - name: mc
          image: minio/mc:latest
          envFrom:
            - secretRef:
                name: secrets
          command:
            - /bin/sh
            - -c
            - |
              sleep 5
              mc alias set minio http://minio:9000 $AWS_ACCESS_KEY_ID $AWS_SECRET_ACCESS_KEY --api S3v4
              mc mb minio/$AWS_BUCKET --ignore-existing
              mc ls minio
EOF
ok "k8s/base/minio-bootstrap-job.yaml criado"

# ── kustomization base ────────────────────────────────────────────────────────
cat > "$K8S/base/kustomization.yaml" << 'EOF'
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: hericarealtor
resources:
  - namespace.yaml
  - deployment.yaml
  - service.yaml
  - pvc.yaml
  - minio-bootstrap-job.yaml
EOF
ok "k8s/base/kustomization.yaml criado"

# ── Ingress corrigido (nome do service + TLS) ─────────────────────────────────
cat > "$K8S/overlays/production/ingress.yaml" << 'EOF'
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: hericarealtor
  namespace: hericarealtor
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
spec:
  tls:
    - hosts:
        - hericarealtor.com
      secretName: hericarealtor-tls
  rules:
    - host: hericarealtor.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: hericarealtor
                port:
                  number: 9000
EOF
ok "k8s/overlays/production/ingress.yaml corrigido (nome do service + TLS)"

# ── kustomization overlay production ─────────────────────────────────────────
if [[ ! -f "$K8S/overlays/production/kustomization.yaml" ]]; then
    cat > "$K8S/overlays/production/kustomization.yaml" << 'EOF'
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: hericarealtor
resources:
  - ../../base
  - ingress.yaml
  - secrets.yaml
EOF
    ok "k8s/overlays/production/kustomization.yaml criado"
fi

# ── secrets template (se não existir) ────────────────────────────────────────
if [[ ! -f "$K8S/overlays/production/secrets.yaml" ]]; then
    cat > "$K8S/overlays/production/secrets.yaml" << 'EOF'
# Preencha e aplique com: kubectl apply -f secrets.yaml
# Ou use Sealed Secrets / External Secrets Operator em produção.
apiVersion: v1
kind: Secret
metadata:
  name: secrets
  namespace: hericarealtor
type: Opaque
stringData:
  APP_KEY: "REPLACE_ME"
  DB_PASSWORD: "REPLACE_ME"
  REDIS_PASSWORD: "REPLACE_ME"
  AWS_ACCESS_KEY_ID: "REPLACE_ME"
  AWS_SECRET_ACCESS_KEY: "REPLACE_ME"
  AWS_BUCKET: "REPLACE_ME"
EOF
    ok "k8s/overlays/production/secrets.yaml template criado"
fi

# ── 4. Corrigir docker-compose.yml ───────────────────────────────────────────
header "4. Adicionar listing-updater no docker-compose.yml"

COMPOSE="$LARAVEL_DIR/docker-compose.yml"

if grep -q "listing-updater" "$COMPOSE" 2>/dev/null; then
    ok "listing-updater já existe no docker-compose.yml"
else
    # Adiciona o serviço antes da linha "volumes:" de topo
    UPDATER_SERVICE='
  # Listing Updater (Python cron)
  listing-updater:
    build:
      context: ../listings-updater
      dockerfile: Dockerfile
    container_name: hericarealtor_listing_updater
    restart: unless-stopped
    environment:
      - STORAGE_BACKEND=postgres
      - DATA_DIR=/data
      - THROTTLE_MIN=0.5
      - THROTTLE_MAX=2.0
      - MAX_RETRIES=5
      - LOG_LEVEL=INFO
    env_file:
      - ../listings-updater/.env
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - listing_updater_data:/data
    networks:
      - hericarealtor-network
'

    # Insere antes de "^volumes:" no compose
    python3 - "$COMPOSE" "$UPDATER_SERVICE" << 'PYEOF'
import sys, re

compose_path = sys.argv[1]
new_service  = sys.argv[2]

with open(compose_path, 'r') as f:
    content = f.read()

# Insere o serviço antes da linha "volumes:" de nível raiz
pattern = r'(\nvolumes:)'
replacement = new_service + r'\1'
new_content = re.sub(pattern, replacement, content, count=1)

# Adiciona o volume listing_updater_data
new_content = new_content.replace(
    'volumes:\n  pgdata:',
    'volumes:\n  pgdata:\n  listing_updater_data:'
)

with open(compose_path, 'w') as f:
    f.write(new_content)

print("docker-compose.yml atualizado")
PYEOF
    ok "Serviço listing-updater adicionado ao docker-compose.yml"
fi

# Corrige porta interna do minio-mc (9010 → 9000)
if grep -q "http://minio:9010" "$COMPOSE" 2>/dev/null; then
    sed -i 's|http://minio:9010|http://minio:9000|g' "$COMPOSE"
    ok "minio-mc: porta interna corrigida (9010 → 9000)"
fi

# ── 5. .gitignore no updater ──────────────────────────────────────────────────
header "5. Garantir .gitignore no listings-updater"

GITIGNORE="$UPDATER_DIR/.gitignore"
if [[ ! -f "$GITIGNORE" ]]; then
    cat > "$GITIGNORE" << 'EOF'
.env
data/
*.log
__pycache__/
*.pyc
*.pyo
.venv/
venv/
.pytest_cache/
.mypy_cache/
dist/
build/
*.egg-info/
EOF
    ok ".gitignore criado no listings-updater"
else
    ok ".gitignore já existe"
fi

# ── Resumo final ──────────────────────────────────────────────────────────────
header "Resumo"

echo -e "
${GREEN}Concluído.${RESET} Próximos passos:

  1. Revise o docker-compose.yml e confirme o path ${BOLD}../listings-updater${RESET}
  2. Preencha ${BOLD}listings-updater/.env${RESET} com ZILLOW_ENCODED_ZUID e ZILLOW_PROFILE_SLUG
  3. Preencha ${BOLD}k8s/overlays/production/secrets.yaml${RESET} antes de aplicar no cluster
  4. Para subir tudo localmente:
     ${CYAN}cd $LARAVEL_DIR && docker compose up --build${RESET}
  5. Para aplicar no Kubernetes:
     ${CYAN}kubectl apply -k $K8S/overlays/production${RESET}
  6. Para aplicar só o updater:
     ${CYAN}kubectl apply -k $UPDATER_DIR/k8s${RESET}
"