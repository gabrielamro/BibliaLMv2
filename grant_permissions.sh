#!/bin/bash
# Configurações do Projeto
PROJECT_ID="biblialm-ab748"
SECRET_NAME="API_KEY"
SERVICE_ACCOUNT="firebase-app-hosting-compute@${PROJECT_ID}.iam.gserviceaccount.com"
echo "🔐 Concedendo acesso ao segredo ${SECRET_NAME} para o App Hosting..."
gcloud secrets add-iam-policy-binding ${SECRET_NAME} \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor" \
    --project="${PROJECT_ID}"
echo "✅ Permissão concedida com sucesso!"
