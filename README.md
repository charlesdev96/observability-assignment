# Kubernetes Observability Platform for a Microservices Application

## 1. Project Overview

This project implements an observability platform for a containerized microservices application running on Kubernetes.

The platform demonstrates how engineers can monitor application performance, collect logs, gather infrastructure metrics, visualize system health, and investigate application issues using an integrated observability stack.

The application consists of three Node.js microservices:

- **Gateway Service:** Receives external requests and forwards checkout requests to the Orders service.
- **Orders Service:** Creates orders and communicates with the Payments service.
- **Payments Service:** Simulates payment processing.

A load generator continuously sends requests through the application to produce activity for monitoring.

The observability platform uses:

| Technology | Purpose |
|---|---|
| Docker | Containerizes the application |
| Kubernetes | Orchestrates the microservices |
| Helm | Deploys and manages observability components |
| Prometheus | Collects application and infrastructure metrics |
| Grafana | Visualizes metrics and logs |
| Loki | Stores and queries application logs |
| Grafana Alloy | Collects Kubernetes container logs and forwards them to Loki |
| Grafana Tempo | Provides distributed tracing infrastructure |

## 2. Architecture

The application and observability components are deployed into separate Kubernetes namespaces.

- `shop`: Contains the microservices and load generator.
- `monitoring`: Contains Prometheus, Grafana, Loki, Alloy and Tempo.

### Architecture diagram

```text
                    LOAD GENERATOR
                          |
                          v
                   GATEWAY SERVICE
                          |
                          v
                    ORDERS SERVICE
                          |
                          v
                   PAYMENTS SERVICE


              OBSERVABILITY PLATFORM

  APPLICATION METRICS
          |
          v
      PROMETHEUS
          |
          v
       GRAFANA


  APPLICATION LOGS
          |
          v
     GRAFANA ALLOY
          |
          v
         LOKI
          |
          v
       GRAFANA


  DISTRIBUTED TRACING
          |
          v
    OPENTELEMETRY
          |
          v
        TEMPO
          |
          v
       GRAFANA
```

**Implementation note:** The Prometheus and Loki pipelines were deployed and verified. Tempo was installed and its OTLP receivers were confirmed operational. However, the tracing-enabled application image was not successfully deployed to the Kubernetes nodes, so end-to-end trace ingestion remains unfinished.

## 3. Prerequisites

The project was developed and tested using:

- Windows 11
- Docker Desktop 4.99.0
- Docker Engine 29.9.3
- Kubernetes v1.36.1
- Helm v4.3.1
- Node.js 22 inside the Docker image
- PowerShell
- Visual Studio Code

Ensure Docker Desktop is running and Kubernetes is enabled.

Open PowerShell and verify the installations:

```powershell
docker --version
kubectl version
helm version
```

Check the Kubernetes nodes:

```powershell
kubectl get nodes
```

All nodes should report `Ready`.

The tested environment contained:

- `desktop-control-plane`
- `desktop-worker`
- `desktop-worker2`

## 4. Project Structure

The project directory is organized as follows:

```text
observability-platform-beginner/
│
├── app/
│   ├── src/
│   │   ├── common.js
│   │   ├── gateway.js
│   │   ├── orders.js
│   │   ├── payments.js
│   │   └── tracing.js
│   │
│   ├── Dockerfile
│   ├── package.json
│   └── package-lock.json
│
├── k8s/
│   ├── namespace.yaml
│   ├── monitoring-namespace.yaml
│   │
│   ├── app/
│   │   ├── gateway.yaml
│   │   ├── orders.yaml
│   │   ├── payments.yaml
│   │   └── loadgen.yaml
│   │
│   └── monitoring/
│       └── shop-servicemonitor.yaml
│
├── helm/
│   ├── monitoring-values.yaml
│   ├── loki-values.yaml
│   ├── alloy-values.yaml
│   └── tempo-values.yaml
│
├── alerts/
│   └── shop-alerts.yaml
│
├── dashboards/
│   └── service-overview.json
│
├── docs/
│   └── learning-notes.md
│
├── README.md
├── PROJECT-STRUCTURE.md
└── .gitignore
```

**Note:** The `tracing.js` file is present in the local source tree as experimental work. The working Kubernetes image remains `shop-app:1.0.0`, which does not contain this file.

## 5. Step-by-Step Installation and Deployment

All commands in this section are intended to be executed from the project root directory.

### Step 1: Start Docker Desktop

Open Docker Desktop and ensure its Kubernetes cluster is running.

Verify the cluster:

```powershell
kubectl get nodes
```

Expected result: all three nodes should be `Ready`.

### Step 2: Build the application Docker image

Build the application image:

```powershell
docker build -t shop-app:1.0.0 ./app
```

Verify the image:

```powershell
docker images shop-app
```

The image contains the three Node.js services and their shared dependencies.

The Dockerfile uses a multi-stage build to separate dependency preparation from the final runtime image.

### Step 3: Create the Kubernetes namespaces

Create the application namespace:

```powershell
kubectl apply -f k8s/namespace.yaml
```

Create the monitoring namespace:

```powershell
kubectl apply -f k8s/monitoring-namespace.yaml
```

Verify:

```powershell
kubectl get namespaces
```

The namespaces `shop` and `monitoring` should be present.

### Step 4: Deploy the microservices

Deploy the Gateway service:

```powershell
kubectl apply -f k8s/app/gateway.yaml
```

Deploy the Orders service:

```powershell
kubectl apply -f k8s/app/orders.yaml
```

Deploy the Payments service:

```powershell
kubectl apply -f k8s/app/payments.yaml
```

Deploy the load generator:

```powershell
kubectl apply -f k8s/app/loadgen.yaml
```

Check the application pods:

```powershell
kubectl get pods -n shop
```

Check the services:

```powershell
kubectl get services -n shop
```

The expected application deployment is:

| Component | Replicas |
|---|---:|
| Gateway | 2 |
| Orders | 1 |
| Payments | 2 |
| Load generator | 1 |

### Step 5: Verify application connectivity

Check the service endpoints:

```powershell
kubectl get endpoints -n shop
```

For a newer Kubernetes environment, EndpointSlices can also be inspected:

```powershell
kubectl get endpointslices -n shop
```

The application communicates internally using Kubernetes DNS:

- Gateway communicates with Orders using `http://orders:3002`.
- Orders communicates with Payments using `http://payments:3003`.

### Step 6: Test the application

Open a PowerShell terminal and forward the Gateway service:

```powershell
kubectl port-forward service/gateway 3001:3001 -n shop
```

Keep this terminal open.

Open another PowerShell terminal and test the health endpoint:

```powershell
Invoke-RestMethod http://localhost:3001/healthz
```

Test the application metrics endpoint:

```powershell
Invoke-WebRequest http://localhost:3001/metrics
```

Submit a checkout request:

```powershell
$body = @{
    item = "book"
    amount = 25
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri http://localhost:3001/api/checkout `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

The application should process the checkout through the Gateway, Orders and Payments services.

## 6. Deploy the Monitoring Stack

### Step 7: Add the Prometheus Helm repository

```powershell
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
```

Update Helm repositories:

```powershell
helm repo update
```

Check the chart:

```powershell
helm search repo prometheus-community/kube-prometheus-stack
```

### Step 8: Install Prometheus and Grafana

Install the monitoring stack:

```powershell
helm install monitoring prometheus-community/kube-prometheus-stack `
  --version 93.3.0 `
  --namespace monitoring `
  -f helm/monitoring-values.yaml
```

This installs:

- Prometheus
- Grafana
- Prometheus Operator
- Alertmanager
- Node Exporter
- Kube State Metrics

Verify the installation:

```powershell
helm list -n monitoring
```

Check the monitoring pods:

```powershell
kubectl get pods -n monitoring
```

Wait for the required pods to become ready.

### Step 9: Access Grafana

Forward the Grafana service:

```powershell
kubectl port-forward service/monitoring-grafana 3000:80 -n monitoring
```

Open a browser:

```text
http://localhost:3000
```

The configured local learning credentials are:

```text
Username: admin
Password: change-me-after-learning
```

The password is defined in `helm/monitoring-values.yaml`.

This is a demonstration credential and must be replaced before production use.

### Step 10: Configure Prometheus application scraping

Apply the ServiceMonitor:

```powershell
kubectl apply -f k8s/monitoring/shop-servicemonitor.yaml
```

Verify:

```powershell
kubectl get servicemonitor -n monitoring
```

The ServiceMonitor tells Prometheus to discover the application services and scrape their `/metrics` endpoints.

The configured scrape interval is 15 seconds.

The application exposes:

- `http_requests_total`
- `http_request_duration_seconds`
- Default Node.js process metrics

The HTTP metrics provide the foundation for the RED method:

- Rate: How many requests are being processed?
- Errors: How many requests are failing?
- Duration: How long are requests taking?

## 7. Deploy Loki for Log Aggregation

### Step 11: Add the Grafana Helm repository

```powershell
helm repo add grafana https://grafana.github.io/helm-charts
```

Update repositories:

```powershell
helm repo update
```

Check the Loki chart:

```powershell
helm search repo grafana/loki
```

### Step 12: Install Loki

Install Loki:

```powershell
helm install loki grafana/loki `
  --version 7.6.0 `
  --namespace monitoring `
  -f helm/loki-values.yaml
```

The configuration uses single-binary deployment mode with filesystem storage for the local learning environment.

Verify:

```powershell
helm list -n monitoring
```

Check Loki pods:

```powershell
kubectl get pods -n monitoring
```

### Step 13: Deploy Grafana Alloy

Alloy is responsible for collecting container logs from the Kubernetes nodes and forwarding them to Loki.

Install Alloy:

```powershell
helm install alloy grafana/alloy `
  --version 1.16.0 `
  --namespace monitoring `
  -f helm/alloy-values.yaml
```

Verify the deployment:

```powershell
kubectl get pods -n monitoring
```

Check Alloy logs:

```powershell
kubectl logs -n monitoring daemonset/alloy -c alloy --tail=30
```

The Alloy configuration discovers Kubernetes pods, collects their container logs, processes the CRI log format and forwards the logs to Loki.

### Step 14: Verify Loki

Forward the Loki service:

```powershell
kubectl port-forward -n monitoring service/loki 3101:3100
```

Keep this terminal open.

In another terminal, check Loki readiness:

```powershell
Invoke-RestMethod http://localhost:3101/ready
```

Expected response:

```text
ready
```

Query application logs:

```powershell
$query = '{namespace="shop"}'

$encodedQuery = [uri]::EscapeDataString($query)

Invoke-RestMethod "http://localhost:3101/loki/api/v1/query_range?query=$encodedQuery&limit=10"
```

A successful response should contain:

```text
status: success
```

To display the returned log entries:

```powershell
$result = Invoke-RestMethod "http://localhost:3101/loki/api/v1/query_range?query=$encodedQuery&limit=10"

$result.data.result | ForEach-Object {
    Write-Host "`nLabels:"
    $_.stream | Format-List

    Write-Host "Log entries:"
    $_.values | ForEach-Object {
        [PSCustomObject]@{
            Timestamp = [DateTimeOffset]::FromUnixTimeMilliseconds(
                [long]($_[0].Substring(0, 13))
            ).ToLocalTime().ToString("yyyy-MM-dd HH:mm:ss")

            Message = $_[1]
        }
    } | Format-Table -Wrap
}
```

The verified log pipeline successfully collected entries from:

- Gateway
- Orders
- Payments

## 8. Deploy Grafana Tempo

### Step 15: Install Tempo

Tempo provides the infrastructure for receiving, storing and querying distributed traces.

Install Tempo:

```powershell
helm install tempo grafana/tempo `
  --version 1.24.4 `
  --namespace monitoring `
  -f helm/tempo-values.yaml
```

Verify:

```powershell
kubectl get pods -n monitoring
```

Check Tempo's service:

```powershell
kubectl get service tempo -n monitoring
```

The configured receivers include:

| Port | Protocol |
|---|---|
| 4317 | OTLP gRPC |
| 4318 | OTLP HTTP |
| 3200 | Tempo HTTP API |

Check Tempo logs:

```powershell
kubectl logs tempo-0 -n monitoring --tail=40
```

The tested Tempo installation successfully started its OTLP receivers.

### Step 16: Check Tempo readiness

Forward Tempo's HTTP service:

```powershell
kubectl port-forward -n monitoring service/tempo 3200:3200
```

Keep the terminal open.

In another PowerShell terminal:

```powershell
Invoke-RestMethod http://localhost:3200/ready
```

Expected response:

```text
ready
```

### Step 17: Search Tempo for traces

Run:

```powershell
Invoke-RestMethod "http://localhost:3200/api/search?limit=20"
```

The tracing-enabled application image was not successfully deployed to the Kubernetes nodes during this implementation.

Therefore, the absence of trace records in Tempo should not be interpreted as successful end-to-end distributed tracing.

## 9. Alert Rules

The project includes a PrometheusRule manifest:

```text
alerts/shop-alerts.yaml
```

It contains application alert definitions for:

- High error rate
- High latency

The original rules use the application's HTTP metrics.

Apply the rules:

```powershell
kubectl apply -f alerts/shop-alerts.yaml
```

Verify:

```powershell
kubectl get prometheusrule -n monitoring
```

**Important:** The original rules are a partial implementation of the assignment's alert requirements. They use a two-minute pending duration and the latency rule currently uses p95 rather than the required p99. The remaining crash-loop, node-readiness and disk-space alerts, along with complete routing and runbooks, must be implemented and tested before claiming full compliance.

## 10. Grafana Dashboards

The project includes an application dashboard:

```text
dashboards/service-overview.json
```

It is intended to provide visibility into the service's RED metrics.

The three dashboard areas required by the assignment are:

1. Service overview: request rate, error rate and latency.
2. Infrastructure: node CPU, memory, disk and network.
3. Application logs: error count, log volume and recent errors.

The Prometheus and Loki data pipelines have been verified. The existence of a dashboard JSON file alone does not establish that all three required dashboards have been imported and validated.

## 11. Useful Kubernetes Commands

Check all application pods:

```powershell
kubectl get pods -n shop
```

Check monitoring pods:

```powershell
kubectl get pods -n monitoring
```

Check services:

```powershell
kubectl get services -n shop
kubectl get services -n monitoring
```

Check deployments:

```powershell
kubectl get deployments -n shop
kubectl get deployments -n monitoring
```

Check application logs:

```powershell
kubectl logs deployment/gateway -n shop --tail=30
```

```powershell
kubectl logs deployment/orders -n shop --tail=30
```

```powershell
kubectl logs deployment/payments -n shop --tail=30
```

Check rollout status:

```powershell
kubectl rollout status deployment/gateway -n shop
kubectl rollout status deployment/orders -n shop
kubectl rollout status deployment/payments -n shop
```

Describe a pod when troubleshooting:

```powershell
kubectl describe pod POD_NAME -n shop
```

Check persistent volumes:

```powershell
kubectl get pvc -n monitoring
```

Check Helm releases:

```powershell
helm list -n monitoring
```

## 12. Troubleshooting

### Problem 1: Pods are not starting

Check:

```powershell
kubectl get pods -n shop
```

Describe the affected pod:

```powershell
kubectl describe pod POD_NAME -n shop
```

Inspect its logs:

```powershell
kubectl logs POD_NAME -n shop
```

### Problem 2: Prometheus is not scraping application metrics

Check the ServiceMonitor:

```powershell
kubectl get servicemonitor -n monitoring
```

Check the application services:

```powershell
kubectl get services -n shop
```

Check the metrics endpoint using port forwarding:

```powershell
kubectl port-forward service/gateway 3001:3001 -n shop
```

Then:

```powershell
Invoke-WebRequest http://localhost:3001/metrics
```

### Problem 3: Loki is not returning logs

Check Alloy:

```powershell
kubectl get pods -n monitoring
```

Inspect Alloy logs:

```powershell
kubectl logs -n monitoring daemonset/alloy -c alloy --tail=50
```

Check Loki:

```powershell
kubectl logs loki-0 -n monitoring --tail=50
```

Check Loki readiness:

```powershell
Invoke-RestMethod http://localhost:3101/ready
```

### Problem 4: Grafana is inaccessible

Check the Grafana pod:

```powershell
kubectl get pods -n monitoring
```

Forward its service again:

```powershell
kubectl port-forward service/monitoring-grafana 3000:80 -n monitoring
```

### Problem 5: Docker image is not available to Kubernetes

Check the local Docker image:

```powershell
docker images shop-app
```

Check the Kubernetes pod's image:

```powershell
kubectl describe pod POD_NAME -n shop
```

Docker Desktop's Kubernetes nodes use containerd. A locally built Docker image is not necessarily available in every Kubernetes node's image store.

Do not assume that rebuilding an image or changing its tag automatically distributes it to the worker nodes.

## 13. Cleaning Up the Environment

Only execute these commands when you want to remove the project resources.

Remove the application:

```powershell
kubectl delete namespace shop
```

Remove the Helm releases:

```powershell
helm uninstall alloy -n monitoring
helm uninstall tempo -n monitoring
helm uninstall loki -n monitoring
helm uninstall monitoring -n monitoring
```

Remove the monitoring namespace:

```powershell
kubectl delete namespace monitoring
```

**Warning:** Deleting the monitoring namespace also removes its namespaced resources and may remove persistent volume claims. Check your storage and backup requirements before cleanup.

## 14. Implementation Results

The following components were successfully deployed and verified during development:

| Component | Result |
|---|---|
| Dockerized Node.js application | Successful |
| Kubernetes namespaces | Successful |
| Gateway service | Successful |
| Orders service | Successful |
| Payments service | Successful |
| Load generator | Successful |
| Prometheus | Installed and running |
| Grafana | Installed and running |
| Application ServiceMonitor | Applied |
| Loki | Installed and operational |
| Grafana Alloy | Installed and collecting logs |
| Log ingestion into Loki | Verified |
| Tempo | Installed and ready

## 15. Conclusion

This project demonstrates the deployment of an observability platform for a containerized microservices application using Kubernetes.

Prometheus provides metrics collection, Grafana provides visualization, Loki provides centralized log storage, and Grafana Alloy collects application logs from Kubernetes workloads.

The implementation establishes the foundation for monitoring application performance, investigating errors and observing infrastructure health.

Tempo was also deployed to provide distributed tracing infrastructure. However, application-level trace delivery remains an area for further development.

The project demonstrates practical knowledge of Docker, Kubernetes, Helm, Prometheus, Grafana, Loki and log collection using Grafana Alloy.

