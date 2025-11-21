terraform {
  required_version = ">= 1.0"

  required_providers {
    oci = {
      source  = "oracle/oci"
      version = ">= 6.0"
    }
  }
}

provider "oci" {
  region           = var.region
  tenancy_ocid     = var.tenancy_ocid
  user_ocid        = var.user_ocid
  fingerprint      = var.fingerprint
  private_key_path = var.private_key_path
}

# ============================================================================
# VCN (虚拟云网络) 和网络基础设施
# ============================================================================

resource "oci_core_vcn" "deepdive_vcn" {
  cidr_block     = "10.0.0.0/16"
  display_name   = "deepdive-vcn"
  compartment_id = var.compartment_ocid
  dns_label      = "deepdive"
}

# 互联网网关
resource "oci_core_internet_gateway" "igw" {
  vcn_id         = oci_core_vcn.deepdive_vcn.id
  display_name   = "deepdive-igw"
  compartment_id = var.compartment_ocid
  enabled        = true
}

# 公共子网
resource "oci_core_subnet" "public_subnet" {
  vcn_id                     = oci_core_vcn.deepdive_vcn.id
  cidr_block                 = "10.0.1.0/24"
  display_name               = "public-subnet"
  compartment_id             = var.compartment_ocid
  dns_label                  = "public"
  security_list_ids          = [oci_core_security_list.public_security_list.id]
  route_table_id             = oci_core_route_table.public_route_table.id
  prohibit_public_ip_on_vnic = false
}

# 私有子网
resource "oci_core_subnet" "private_subnet" {
  vcn_id            = oci_core_vcn.deepdive_vcn.id
  cidr_block        = "10.0.2.0/24"
  display_name      = "private-subnet"
  compartment_id    = var.compartment_ocid
  dns_label         = "private"
  security_list_ids = [oci_core_security_list.private_security_list.id]
  route_table_id    = oci_core_route_table.private_route_table.id

  provisioner "local-exec" {
    command = "echo 'Private subnet created: ${self.id}'"
  }
}

# 公共路由表
resource "oci_core_route_table" "public_route_table" {
  vcn_id         = oci_core_vcn.deepdive_vcn.id
  display_name   = "public-rt"
  compartment_id = var.compartment_ocid

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.igw.id
  }
}

# 私有路由表
resource "oci_core_route_table" "private_route_table" {
  vcn_id         = oci_core_vcn.deepdive_vcn.id
  display_name   = "private-rt"
  compartment_id = var.compartment_ocid

  # 注：私有路由表通常不需要互联网网关路由
  # 如需访问互联网，可添加 NAT 网关或代理
}

# ============================================================================
# 安全组
# ============================================================================

resource "oci_core_security_list" "public_security_list" {
  vcn_id         = oci_core_vcn.deepdive_vcn.id
  display_name   = "public-sl"
  compartment_id = var.compartment_ocid

  # HTTP 入站
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    description = "HTTP from anywhere"

    tcp_options {
      min = 80
      max = 80
    }
  }

  # HTTPS 入站
  ingress_security_rules {
    protocol    = "6"
    source      = "0.0.0.0/0"
    description = "HTTPS from anywhere"

    tcp_options {
      min = 443
      max = 443
    }
  }

  # SSH 入站
  ingress_security_rules {
    protocol    = "6"
    source      = "0.0.0.0/0"
    description = "SSH from anywhere"

    tcp_options {
      min = 22
      max = 22
    }
  }

  # 所有出站流量
  egress_security_rules {
    protocol         = "all"
    destination      = "0.0.0.0/0"
    destination_type = "CIDR_BLOCK"
  }
}

resource "oci_core_security_list" "private_security_list" {
  vcn_id         = oci_core_vcn.deepdive_vcn.id
  display_name   = "private-sl"
  compartment_id = var.compartment_ocid

  # 从公共子网的流量
  ingress_security_rules {
    protocol    = "all"
    source      = "10.0.1.0/24"
    description = "All traffic from public subnet"
  }

  # 出站流量
  egress_security_rules {
    protocol         = "all"
    destination      = "0.0.0.0/0"
    destination_type = "CIDR_BLOCK"
  }
}

# ============================================================================
# 计算实例
# ============================================================================

# 动态获取 Ubuntu image
data "oci_core_images" "ubuntu_images" {
  compartment_id           = var.compartment_ocid
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "22.04"
  shape                    = "VM.Standard.A1.Flex"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

# 动态获取 availability domains
data "oci_identity_availability_domains" "ads" {
  compartment_id = var.tenancy_ocid
}

locals {
  # 使用第一个可用的 availability domain
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name

  # 使用最新的 Ubuntu 22.04 LTS image
  ubuntu_image_id = data.oci_core_images.ubuntu_images.images[0].id
}

# 前端实例
resource "oci_core_instance" "frontend" {
  availability_domain = local.availability_domain
  compartment_id      = var.compartment_ocid
  display_name        = "deepdive-frontend"
  shape               = "VM.Standard.A1.Flex"

  shape_config {
    ocpus         = 1
    memory_in_gbs = 6
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.public_subnet.id
    assign_public_ip = true
  }

  source_details {
    source_type = "IMAGE"
    source_id   = local.ubuntu_image_id
  }
}

# 后端实例
resource "oci_core_instance" "backend" {
  availability_domain = local.availability_domain
  compartment_id      = var.compartment_ocid
  display_name        = "deepdive-backend"
  shape               = "VM.Standard.A1.Flex"

  shape_config {
    ocpus         = 1
    memory_in_gbs = 6
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.private_subnet.id
    assign_public_ip = false
  }

  source_details {
    source_type = "IMAGE"
    source_id   = local.ubuntu_image_id
  }
}

# AI 服务实例
resource "oci_core_instance" "ai_service" {
  availability_domain = local.availability_domain
  compartment_id      = var.compartment_ocid
  display_name        = "deepdive-ai"
  shape               = "VM.Standard.A1.Flex"

  shape_config {
    ocpus         = 1
    memory_in_gbs = 6
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.private_subnet.id
    assign_public_ip = false
  }

  source_details {
    source_type = "IMAGE"
    source_id   = local.ubuntu_image_id
  }
}

# ============================================================================
# 输出
# ============================================================================

output "frontend_public_ip" {
  value       = oci_core_instance.frontend.public_ip
  description = "Frontend instance public IP address"
}

output "backend_private_ip" {
  value       = oci_core_instance.backend.private_ip
  description = "Backend instance private IP address"
}

output "ai_private_ip" {
  value       = oci_core_instance.ai_service.private_ip
  description = "AI service instance private IP address"
}

output "vcn_id" {
  value       = oci_core_vcn.deepdive_vcn.id
  description = "VCN ID"
}

output "app_url" {
  value       = "http://${oci_core_instance.frontend.public_ip}"
  description = "Application access URL"
}

# ============================================================================
# 后端状态存储（本地）
# ============================================================================

terraform {
  backend "local" {
    path = "terraform.tfstate"
  }
}
