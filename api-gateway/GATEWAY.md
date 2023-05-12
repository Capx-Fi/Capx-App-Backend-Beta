# API Gateway Configuration

## Reference Material

- Install GCloud CLI - https://cloud.google.com/sdk/docs/quickstarts 
- API Gateway Setup - https://cloud.google.com/api-gateway/docs/secure-traffic-gcloud 

---
## Creating API

1.  Create an API on the API Gateway

```
gcloud beta api-gateway apis create capx-app
```

2. Describe the created API for it's current state

```
gcloud beta api-gateway apis describe capx-app
```

---

## Creating API Config

```
gcloud beta api-gateway api-configs create release-v1-config --api=capx-app --openapi-spec=api-config.yaml --backend-auth-service-account=sc-api-gateway@capx-app.iam.gserviceaccount.com
```

---
## Enable the created API

```
gcloud services enable capx-app-3h8v28mkcme9n.apigateway.capx-app.cloud.goog
```

---
## Create the API Gateway

```
gcloud beta api-gateway gateways create capx-gateway --api=capx-app --api-config=release-v1-config --location=us-central1
```

---
## Describe the created API Gateway

```
gcloud beta api-gateway gateways describe capx-gateway --location=us-central1
```

---
## Update the Config
```
gcloud beta api-gateway api-configs create reward-pool-config --api=capx-app --openapi-spec=api-config.yaml --backend-auth-service-account=sc-api-gateway@capx-app.iam.gserviceaccount.com
```

---
## Update the API Gateway configuration
```
gcloud beta api-gateway gateways update capx-gateway --api=capx-app --api-config=reward-pool-config --location=us-central1
```