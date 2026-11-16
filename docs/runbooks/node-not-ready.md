
# Runbook: Kubernetes Node Not Ready

## Alert Name
NodeNotReady

## Severity
Critical

## Description
This alert fires when a Kubernetes node remains in a NotReady state for at least 5 minutes.

A NotReady node may be unable to run application workloads correctly.

## Possible Causes
- Node resource exhaustion.
- Kubelet problems.
- Container runtime problems.
- Network communication problems.
- Node shutdown or failure.

## Investigation Steps

### 1. Check node status

```powershell
kubectl get nodes -o wide
```

Identify the node reporting NotReady.

### 2. Describe the affected node

```powershell
kubectl describe node <node-name>
```

Inspect Conditions and Events.

### 3. Check application Pods

```powershell
kubectl get pods -A -o wide
```

Look for Pods that are Pending, Unknown, or unexpectedly terminating.

### 4. Check resource usage

```powershell
kubectl top nodes
```

Look for CPU or memory pressure.

Note: Metrics Server must be available.

## Resolution
- Check Docker Desktop and its Kubernetes environment.
- Investigate node resource exhaustion.
- Check node networking and runtime health.
- Restart the affected local environment only when necessary.

For this learning environment, restarting Docker Desktop may be appropriate after collecting diagnostic information.

## Recovery Verification
- All Kubernetes nodes report Ready.
- Application Pods are healthy.
- The NodeNotReady alert returns to inactive.

## Useful Commands

```powershell
kubectl get nodes
kubectl describe node <node-name>
kubectl get pods -A -o wide
kubectl get events -A
kubectl top nodes
```
