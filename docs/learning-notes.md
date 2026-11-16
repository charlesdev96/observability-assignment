# What I learned

## Kubernetes

A Deployment tells Kubernetes how many copies of an application to run. A Service gives those Pods a stable name and network address.

## Monitoring

Prometheus collects metrics from the application. Grafana uses those metrics to create dashboards.

## Metrics endpoint

Each application service exposes a `/metrics` endpoint. Prometheus reads that endpoint at regular intervals.

## ServiceMonitor

The ServiceMonitor tells Prometheus which Kubernetes Services to monitor. It looks for Services with the label `app: shop`.

## Helm

Helm helps install applications on Kubernetes. In this project I use Helm to install the Prometheus and Grafana monitoring stack.

## Logs

For this first version, I can view application logs with `kubectl logs`. A separate log collection platform can be added after I understand metrics monitoring.
