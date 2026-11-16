
# Runbook: Pod Crash Looping

## Alert Name
PodCrashLooping

## Severity
Warning

## Description
This alert fires when a container in the shop namespace restarts more than three times within one hour.

Frequent restarts can indicate application failures or configuration problems.

## Possible Causes
- Application startup errors.
- Invalid environment variables.
- Missing configuration.
- Out-of-memory termination.
- Failed health checks.
- Application process crashes.

## Investigation Steps

### 1. Identify restarting Pods

```powershell
kubectl get pods -n shop
```

Check the RESTARTS column.

### 2. Describe the affected Pod

```powershell
kubectl describe pod <pod-name> -n shop
```

Replace `<pod-name>` with the affected Pod name.

Inspect the Events section.

### 3. Check previous container logs

```powershell
kubectl logs <pod-name> -n shop --previous
```

The `--previous` option retrieves logs from the previous terminated container.

### 4. Check Deployment status

```powershell
kubectl get deployments -n shop
kubectl rollout status deployment/gateway -n shop
```

Repeat for the affected Deployment.

## Resolution
- Correct application startup errors.
- Fix invalid environment variables.
- Resolve missing configuration.
- Investigate memory limits if containers are being OOM-killed.
- Correct failing health checks when appropriate.

If a Deployment needs restarting after the underlying problem is fixed:

```powershell
kubectl rollout restart deployment/gateway -n shop
```

## Recovery Verification
- Pods return to Running.
- Restart counts stop increasing.
- Deployment replicas become available.
- The alert returns to inactive.

## Useful Commands

```powershell
kubectl get pods -n shop
kubectl describe pod <pod-name> -n shop
kubectl logs <pod-name> -n shop --previous
kubectl get events -n shop
```
