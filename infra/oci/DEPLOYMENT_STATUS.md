# DeepDive Engine - Deployment Status

**Date**: 2025-11-20
**Status**: OCI Deployment Blocked, Local Deployment Ready

## Current Situation

### OCI Cloud Deployment (BLOCKED)

#### ca-toronto-1 Region

- **Status**: Out of Free Tier Capacity
- **Error**: `500-InternalError, Out of host capacity`
- **Details**: All 4 free instance slots in this region are currently allocated
- **Solution**:
  - Option 1: Wait for capacity to be released (unknown timeline)
  - Option 2: Switch to different region

#### us-ashburn-1 Region (Alternative)

- **Status**: Authentication Failed
- **Error**: `401-NotAuthenticated, The required information to complete authentication was not provided or was incorrect`
- **Details**: OCI provider cannot authenticate despite correct credentials in terraform.tfvars
- **Root Cause**: Likely API key permissions or tenancy configuration issue
- **Solution**: Contact OCI support or verify API key has sufficient permissions

### Network Infrastructure (CREATED)

The following resources were successfully created in ca-toronto-1 before compute instance failures:

```
✓ VCN (Virtual Cloud Network): ocid1.vcn.oc1.ca-toronto-1.amaaaaaazg637diahu5eguef2ndipj6vuzthfxyx3avimrw67ho5fwzlvsyq
✓ Public Subnet: ocid1.subnet.oc1.ca-toronto-1.aaaaaaaaw3e2hy42kt6j3nug4v374lzcnbso6n62x6xiwph24ubxorbmkeja
✓ Private Subnet: ocid1.subnet.oc1.ca-toronto-1.aaaaaaaaswkz7bw3v63r3prhscuk7hechu4tprxbspu45rvb2cuk743zvxla
✓ Internet Gateway, Route Tables, Security Lists (all created)
✗ Compute Instances (FAILED - region capacity exhausted)
```

## Free Tier Quota Summary

**Permanent Free Tier (Always Available)**:

- Ampere A1 Compute: 4 instances total, max 4vCPU + 24GB RAM
- Block Storage: 200GB
- Object Storage: 20GB
- Oracle Autonomous DB: 2 databases, 20GB total
- MySQL DB Service: 100GB each
- NoSQL Database: 25GB, 100M requests/month
- VCN: Unlimited
- Load Balancer: 1 instance, 10Mbps free
- Outbound Data Transfer: 10GB/month free

See `/infra/oci/FREE_TIER_QUOTA.md` for complete details.

## Available Deployment Options

### Option 1: Local Docker Deployment (RECOMMENDED - Ready Now)

**Status**: ✓ Fully Prepared
**Setup Time**: < 5 minutes
**Cost**: $0 (no cloud charges)

Prerequisites:

- Docker Desktop installed and running

Steps:

```bash
# Navigate to project root
cd D:\projects\deepdive

# Start all services
docker-compose up -d

# Verify services are running
docker-compose ps

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# PostgreSQL: localhost:5432
```

Services included:

- Frontend (React/Next.js on port 3000)
- Backend (NestJS on port 3001)
- PostgreSQL (port 5432)
- Redis (port 6379, if configured)

### Option 2: OCI Cloud Deployment (BLOCKED)

**Status**: ⚠️ Blocked - Capacity/Authentication Issues
**Setup Time**: Unknown (waiting for capacity or support resolution)

To retry when issues are resolved:

```bash
cd /d/projects/deepdive/infra/oci/terraform

# Use specific region environment variables
export OCI_USER_OCID="ocid1.user.oc1..aaaaaaaas7vm3r365jphuvgoxqvdw6l4sdericwhkinevtj5txqxrhh46ffq"
export OCI_TENANCY_OCID="ocid1.tenancy.oc1..aaaaaaaalp72vq523bbru7qtrnyix6s3aotkgf5q4nhsjzd6vtf6wbcqgdma"
export OCI_FINGERPRINT="e8:2f:2b:65:d6:21:06:4f:ac:4d:6f:7b:f7:05:72:03"
export OCI_KEY_FILE="C:/Users/dudugo/.oci/api-key/oci_api_key.pem"
export OCI_REGION="us-ashburn-1"  # or another region with capacity

terraform init
terraform apply -auto-approve
```

Available regions with Ampere A1 free instances:

- `us-ashburn-1` (Virginia, US)
- `us-phoenix-1` (Phoenix, US)
- `eu-frankfurt-1` (Frankfurt, EU)
- `ap-tokyo-1` (Tokyo, JP)
- `ap-singapore-1` (Singapore)
- `ca-toronto-1` (Toronto) - **FULL**
- Others - check OCI console

### Option 3: Manual OCI Portal Deployment

Create compute instances manually through OCI web console:

1. Log in to OCI Console
2. Compute > Instances > Create Instance
3. Select `Ampere A1` shape
4. Configure 1 vCPU, 6GB RAM per instance (to stay within free tier limits)
5. Use the userdata scripts from `/infra/oci/terraform/user_data/`

## Troubleshooting

### Docker Compose Won't Start

- Ensure Docker Desktop is running
- Check available disk space
- Run: `docker system prune` to clean up

### OCI Authentication Fails

- Verify API key exists: `C:/Users/dudugo/.oci/api-key/oci_api_key.pem`
- Verify fingerprint matches: `e8:2f:2b:65:d6:21:06:4f:ac:4d:6f:7b:f7:05:72:03`
- Check API key is active in OCI console
- Verify tenancy/user OCIDs are correct in `terraform.tfvars`

### OCI Region Capacity Issues

- Current capacity status: ca-toronto-1 (full), us-ashburn-1 (unknown)
- Monitor OCI console for capacity releases
- Consider alternative regions for immediate deployment

## Files & Documentation

- `/infra/oci/terraform/main.tf` - Complete IaC configuration
- `/infra/oci/terraform/terraform.tfvars` - Configuration (credentials)
- `/infra/oci/terraform/variables.tf` - Variable definitions
- `/infra/oci/terraform/user_data/` - Instance initialization scripts
- `/infra/oci/FREE_TIER_QUOTA.md` - Detailed OCI quota information
- `/docker-compose.yml` - Local deployment configuration

## Next Steps

**Immediate**: Use local Docker deployment to get DeepDive Engine running
**Later**: Retry OCI deployment once authentication/capacity issues are resolved

---

**Questions**?

- OCI issues → Check `/infra/oci/FREE_TIER_QUOTA.md`
- Local deployment → See docker-compose documentation
- Infrastructure details → Review `main.tf` with comments
