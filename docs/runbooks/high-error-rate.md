
# Runbook: High Error Rate

## Alert Name
HighErrorRate

## Severity
Warning

## Description
This alert fires when more than 5% of HTTP requests to the shop application return HTTP 5xx responses for at least 5 minutes.

## Possible Causes
- Application bugs or unhandled exceptions.
- Orders or Payments service unavailable.
- Incorrect service configuration.
- Network communication problems between microservices.
- Insufficient CPU or memory resources.

## Investigation Steps

### 1. Check application Pods

```powershell
kubectl get pods -n shop
```

Check whether any Pods are failing or restarting.

### 2. Check application logs

```powershell
kubectl logs deployment/gateway -n shop
kubectl logs deployment/orders -n shop
kubectl logs deployment/payments -n shop
```

Look for exceptions, failed requests, and connection errors.

### 3. Check application Services

```powershell
kubectl get services -n shop
kubectl get endpoints -n shop
```

Confirm that each Service has available endpoints.

### 4. Check the error rate in Prometheus

```promql
sum(rate(http_requests_total{namespace="shop",status_code=~"5.."}[5m]))
/
clamp_min(sum(rate(http_requests_total{namespace="shop"}[5m])), 0.000001)
* 100
```

## Resolution
- Investigate the service returning HTTP 5xx responses.
- Correct application configuration or code errors.
- Restore unavailable dependent services.
- Restart a Deployment only after identifying and addressing the cause.

```powershell
kubectl rollout restart deployment/gateway -n shop
```

Repeat for Orders or Payments only when necessary.

## Recovery Verification
- Check that all application Pods are Running.
- Confirm that the error rate falls below 5%.
- Confirm that the alert returns to inactive.

## Useful Commands

```powershell
kubectl get pods -n shop
kubectl get services -n shop
kubectl logs deployment/gateway -n shop
kubectl describe pods -n shop
```
