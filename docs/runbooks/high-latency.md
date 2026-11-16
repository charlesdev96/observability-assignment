
# Runbook: High Latency

## Alert Name
HighLatency

## Severity
Warning

## Description
This alert fires when the 99th percentile request duration exceeds one second for at least 5 minutes.

P99 means that 99% of requests complete within the reported duration.

## Possible Causes
- High CPU or memory usage.
- Slow application processing.
- Slow communication between microservices.
- An overloaded service.
- Slow external dependencies.

## Investigation Steps

### 1. Check application Pods

```powershell
kubectl get pods -n shop
```

Check whether any Pods are restarting or experiencing readiness problems.

### 2. Inspect resource consumption

```powershell
kubectl top pods -n shop
kubectl top nodes
```

Look for unusually high CPU or memory usage.

Note: Metrics Server must be available for these commands.

### 3. Inspect application logs

```powershell
kubectl logs deployment/gateway -n shop
kubectl logs deployment/orders -n shop
kubectl logs deployment/payments -n shop
```

Look for slow operations, timeouts, and connection failures.

### 4. Check P99 latency in Prometheus

```promql
histogram_quantile(
  0.99,
  sum by (le) (
    rate(http_request_duration_seconds_bucket{namespace="shop"}[5m])
  )
)
```

## Resolution
- Identify the service responsible for increased latency.
- Investigate CPU and memory constraints.
- Check communication between Gateway, Orders, and Payments.
- Optimize slow application operations.
- Consider increasing replicas if the workload requires it.

Example:

```powershell
kubectl scale deployment gateway --replicas=3 -n shop
```

Only scale after investigating the bottleneck.

## Recovery Verification
- P99 latency falls below one second.
- Application Pods remain healthy.
- The HighLatency alert returns to inactive.

## Useful Commands

```powershell
kubectl get pods -n shop
kubectl top pods -n shop
kubectl top nodes
kubectl logs deployment/gateway -n shop
```
