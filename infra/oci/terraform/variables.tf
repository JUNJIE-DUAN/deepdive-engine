variable "compartment_ocid" {
  description = "OCI Compartment OCID"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "OCI Region"
  type        = string
  default     = "ca-toronto-1"
}

variable "tenancy_ocid" {
  description = "OCI Tenancy OCID"
  type        = string
  sensitive   = true
}

variable "user_ocid" {
  description = "OCI User OCID"
  type        = string
  sensitive   = true
}

variable "fingerprint" {
  description = "OCI API Key Fingerprint"
  type        = string
  sensitive   = true
}

variable "private_key_path" {
  description = "Path to OCI private key file"
  type        = string
  sensitive   = true
}

variable "ssh_public_key" {
  description = "SSH public key for instance access"
  type        = string
  sensitive   = true
}

variable "oci_registry_namespace" {
  description = "OCI Container Registry namespace"
  type        = string
  default     = "deepdive"
}
