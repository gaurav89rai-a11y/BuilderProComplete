#!/bin/bash
# ============================================================
#  BuilderPro — Azure Deployment Script (Bash / Linux / Mac)
#  Usage: chmod +x deploy-azure.sh && ./deploy-azure.sh
# ============================================================

set -e

RESOURCE_GROUP="builderpro-rg"
LOCATION="centralindia"
APP_NAME="builderpro-api"
FRONTEND_APP="builderpro-web"
SQL_SERVER="builderproserver$(date +%s | tail -c 5)"   # unique suffix
SQL_DATABASE="BuilderProDB"
SQL_ADMIN="builderadmin"
SQL_PASSWORD="BuilderPro@2024!"
APP_PLAN="builderpro-plan"

GREEN="\033[0;32m"
YELLOW="\033[1;33m"
CYAN="\033[0;36m"
RED="\033[0;31m"
NC="\033[0m"

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║      BuilderPro Azure Deployment — Starting          ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# ── 0. Check prerequisites ──────────────────────────────────
echo -e "${YELLOW}► Checking prerequisites...${NC}"
command -v az >/dev/null 2>&1 || { echo -e "${RED}✗ Azure CLI not found. Install: https://aka.ms/installazurecli${NC}"; exit 1; }
command -v dotnet >/dev/null 2>&1 || { echo -e "${RED}✗ .NET 8 SDK not found. Install: https://dotnet.microsoft.com/download${NC}"; exit 1; }
command -v node >/dev/null 2>&1 || { echo -e "${RED}✗ Node.js not found. Install: https://nodejs.org${NC}"; exit 1; }
echo -e "${GREEN}✓ All prerequisites found${NC}"

# ── 1. Login ────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}► Logging in to Azure...${NC}"
az login --output none
echo -e "${GREEN}✓ Logged in${NC}"

# ── 2. Resource Group ───────────────────────────────────────
echo ""
echo -e "${YELLOW}► Creating Resource Group...${NC}"
az group create --name $RESOURCE_GROUP --location $LOCATION --output none
echo -e "${GREEN}✓ Resource group: $RESOURCE_GROUP${NC}"

# ── 3. SQL Server ───────────────────────────────────────────
echo ""
echo -e "${YELLOW}► Creating Azure SQL Server '$SQL_SERVER'...${NC}"
az sql server create \
    --name $SQL_SERVER \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --admin-user $SQL_ADMIN \
    --admin-password $SQL_PASSWORD \
    --output none

az sql server firewall-rule create \
    --resource-group $RESOURCE_GROUP \
    --server $SQL_SERVER \
    --name AllowAzureServices \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0 \
    --output none

az sql server firewall-rule create \
    --resource-group $RESOURCE_GROUP \
    --server $SQL_SERVER \
    --name AllowAll \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 255.255.255.255 \
    --output none

echo -e "${GREEN}✓ SQL Server ready${NC}"

# ── 4. SQL Database ─────────────────────────────────────────
echo ""
echo -e "${YELLOW}► Creating SQL Database '$SQL_DATABASE'...${NC}"
az sql db create \
    --resource-group $RESOURCE_GROUP \
    --server $SQL_SERVER \
    --name $SQL_DATABASE \
    --service-objective Basic \
    --output none
echo -e "${GREEN}✓ Database created${NC}"

# ── 5. App Service Plan ─────────────────────────────────────
echo ""
echo -e "${YELLOW}► Creating App Service Plan (B1)...${NC}"
az appservice plan create \
    --name $APP_PLAN \
    --resource-group $RESOURCE_GROUP \
    --sku B1 \
    --is-linux \
    --output none
echo -e "${GREEN}✓ App Service Plan ready${NC}"

# ── 6. .NET API Web App ─────────────────────────────────────
echo ""
echo -e "${YELLOW}► Creating .NET 8 Web App '$APP_NAME'...${NC}"
az webapp create \
    --resource-group $RESOURCE_GROUP \
    --plan $APP_PLAN \
    --name $APP_NAME \
    --runtime "DOTNETCORE:8.0" \
    --output none

CONN_STR="Server=tcp:${SQL_SERVER}.database.windows.net,1433;Initial Catalog=${SQL_DATABASE};User ID=${SQL_ADMIN};Password=${SQL_PASSWORD};Encrypt=True;"
az webapp config connection-string set \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --connection-string-type SQLAzure \
    --settings DefaultConnection="$CONN_STR" \
    --output none

az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --settings ASPNETCORE_ENVIRONMENT=Production \
    --output none

echo -e "${GREEN}✓ API Web App created: https://${APP_NAME}.azurewebsites.net${NC}"

# ── 7. Build & Publish .NET API ─────────────────────────────
echo ""
echo -e "${YELLOW}► Building .NET API...${NC}"
cd BuilderProAPI
dotnet publish -c Release -o ./publish
cd ..

echo -e "${YELLOW}► Packaging API...${NC}"
cd BuilderProAPI/publish && zip -r ../../builderpro-api.zip . && cd ../..

echo -e "${YELLOW}► Deploying API to Azure...${NC}"
az webapp deploy \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --src-path builderpro-api.zip \
    --type zip \
    --output none
echo -e "${GREEN}✓ API deployed${NC}"

# ── 8. Create Static Web App ────────────────────────────────
echo ""
echo -e "${YELLOW}► Creating Azure Static Web App...${NC}"
az staticwebapp create \
    --name $FRONTEND_APP \
    --resource-group $RESOURCE_GROUP \
    --location "centralus" \
    --output none

DEPLOY_TOKEN=$(az staticwebapp secrets list \
    --name $FRONTEND_APP \
    --resource-group $RESOURCE_GROUP \
    --query "properties.apiKey" -o tsv)
echo -e "${GREEN}✓ Static Web App created${NC}"

# ── 9. Build & Deploy React Frontend ────────────────────────
echo ""
echo -e "${YELLOW}► Building React frontend...${NC}"
cd buildercrm-updated

API_URL="https://${APP_NAME}.azurewebsites.net/api"
echo "VITE_API_URL=${API_URL}" > .env.production

npm install --silent
npm run build

echo -e "${YELLOW}► Deploying frontend...${NC}"
npx @azure/static-web-apps-cli deploy ./dist \
    --deployment-token "$DEPLOY_TOKEN" \
    --env production 2>/dev/null || true

cd ..
echo -e "${GREEN}✓ Frontend deployed${NC}"

# ── 10. Wait and health-check ───────────────────────────────
echo ""
echo -e "${YELLOW}► Waiting 40 seconds for services to start...${NC}"
sleep 40

echo -e "${YELLOW}► Health checking API...${NC}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://${APP_NAME}.azurewebsites.net/health" 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ API is healthy (HTTP 200)${NC}"
else
    echo -e "${YELLOW}⚠ API returning HTTP $HTTP_STATUS (may still be starting up, check in ~2 min)${NC}"
fi

# ── 11. Get Frontend URL and print summary ──────────────────
FRONTEND_URL=$(az staticwebapp show \
    --name $FRONTEND_APP \
    --resource-group $RESOURCE_GROUP \
    --query "defaultHostname" -o tsv 2>/dev/null || echo "${FRONTEND_APP}.azurestaticapps.net")

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                  🎉 DEPLOYMENT COMPLETE!                     ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}║  🌐 FRONTEND (React App):                                    ║${NC}"
echo -e "${CYAN}║     https://${FRONTEND_URL}${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}║  ⚙️  BACKEND API:                                             ║${NC}"
echo -e "${CYAN}║     https://${APP_NAME}.azurewebsites.net${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}║  📚 API DOCS (Swagger):                                      ║${NC}"
echo -e "${CYAN}║     https://${APP_NAME}.azurewebsites.net/swagger${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}║  🗄️  DATABASE:                                                ║${NC}"
echo -e "${CYAN}║     ${SQL_SERVER}.database.windows.net / ${SQL_DATABASE}${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"

# Save to file
cat > deployment-info.txt << INFOEOF
BUILDERPRO DEPLOYMENT INFO
===========================
Date      : $(date)
Frontend  : https://${FRONTEND_URL}
Backend   : https://${APP_NAME}.azurewebsites.net
Swagger   : https://${APP_NAME}.azurewebsites.net/swagger
SQL Server: ${SQL_SERVER}.database.windows.net
Database  : ${SQL_DATABASE}
SQL User  : ${SQL_ADMIN}
SQL Pass  : ${SQL_PASSWORD}
Res Group : ${RESOURCE_GROUP}
INFOEOF

echo ""
echo -e "${GREEN}✓ Deployment info saved to: deployment-info.txt${NC}"
