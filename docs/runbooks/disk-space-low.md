
# Runbook: Low Disk Space

## Alert Name
DiskSpaceLow

## Severity
Critical

## Description
This alert fires when the available space on the monitored filesystem falls below 10% for at least 5 minutes.

The current Docker Desktop implementation monitors the `/var` ext4 filesystem exposed by Node Exporter.

## Possible Causes
- Accumulation of container images.
- Large application logs.
- Temporary files.
- Container runtime storage growth.
- Insufficient disk capacity.

## Investigation Steps

### 1. Check filesystem metrics in Prometheus

Available bytes:

```promql
node_filesystem_avail_bytes{mountpoint="/var",fstype="ext4"}
```

Total bytes:

```promql
node_filesystem_size_bytes{mountpoint="/var",fstype="ext4"}
```

Available percentage:

```promql
100 *
node_filesystem_avail_bytes{mountpoint="/var",fstype="ext4"}
/
node_filesystem_size_bytes{mountpoint="/var",fstype="ext4"}
```

### 2. Inspect Docker disk usage

```powershell
docker system df
```

This shows Docker image, container, volume, and build-cache usage.

### 3. Inspect local Docker images

```powershell
docker images
```

Identify unused images.

### 4. Inspect Kubernetes workloads

```powershell
kubectl get pods -A
```

Check for unexpected workloads or repeatedly failing containers.

## Resolution
- Identify unnecessary Docker images and build cache.
- Review container log growth.
- Remove unused resources only after confirming they are not required.

For example, inspect unused images:

```powershell
docker image prune
```

This removes dangling images. Review the Docker command's confirmation prompt before proceeding.

Avoid deleting active containers, volumes, or important project images.

## Recovery Verification
- Filesystem availability rises above 10%.
- Prometheus reports sufficient available space.
- DiskSpaceLow returns to inactive.

## Environment Limitation
Docker Desktop exposes a virtualized node environment. The `/var` filesystem monitored by this project may not represent the entire Windows host disk.

For production Kubernetes clusters, configure Node Exporter to monitor the appropriate host filesystem and exclude pseudo-filesystems and container-only mounts.

## Useful Commands

```powershell
docker system df
docker images
kubectl get pods -A
```
