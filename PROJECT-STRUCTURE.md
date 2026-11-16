# Project structure

```text
observability-platform-beginner/
├── app/
│   ├── src/
│   │   ├── common.js
│   │   ├── gateway.js
│   │   ├── orders.js
│   │   └── payments.js
│   └── Dockerfile
├── k8s/
│   ├── namespace.yaml
│   ├── monitoring-namespace.yaml
│   ├── app/
│   │   ├── gateway.yaml
│   │   ├── orders.yaml
│   │   ├── payments.yaml
│   │   └── loadgen.yaml
│   └── monitoring/
│       └── shop-servicemonitor.yaml
├── helm/
│   └── monitoring-values.yaml
├── alerts/
│   └── shop-alerts.yaml
├── dashboards/
│   └── service-overview.json
├── docs/
│   └── learning-notes.md
├── README.md
└── .gitignore
```

## What each folder is for

- `app`: the application code and the Docker image instructions.
- `k8s`: the Kubernetes resources that run the application.
- `helm`: settings for the monitoring tools installed with Helm.
- `alerts`: rules that tell Prometheus when something may be wrong.
- `dashboards`: a Grafana dashboard.
- `docs`: short notes about what I learned.
