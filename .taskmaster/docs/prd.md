# Astrolabe: Product Requirements Document (PRD)

## Overview

**Project Name:** Astrolabe
**Purpose:**
Astrolabe is a Kubernetes-native platform for discovering, managing, and orchestrating Terraform/OpenTofu modules and infrastructure stacks through declarative custom resources. It automates module schema introspection, stack orchestration, backend/credential management, and drives infrastructure reconciliation using a robust controller/operator.

## Target Users

- Platform, DevOps, and SRE teams
- Cloud architects managing Terraform/OpenTofu at scale
- Organizations adopting GitOps or Kubernetes-native infrastructure automation

## Goals & Objectives

- Enable infrastructure-as-code workflows via Kubernetes Custom Resources and reconciler logic
- Automate module schema population and validation with minimal manual input
- Empower modular, reusable, and auditable cloud automation
- Separate backend configuration and credential management for maximum security and DRY principles

## Key Features

### 1. Module Management

- **Module Custom Resource**:
    - Users declare only the module source (Git URL, Registry, etc.)
    - Astrolabe auto-populates all module metadata (inputs, outputs, providers, required resources, submodules) in the `status` field by parsing source using `terraform-docs` or HCL parsing
    - Enables real-time validation, documentation, and UI generation for consumers

### 2. Stack Composition

- **Stack Custom Resource**:
    - References one or more `Module` CRs via their logical name
    - Accepts input variable mappings for each attached module along with dependency (`dependsOn`) and linkage configuration
    - References a `BackendConfig` CR for state backend and a `CloudCredentials` CR for provider credentials
    - Reconciliation applies desired infrastructure state (plan/apply on create or update, destroy on deletion)

### 3. Backend and Credentials Abstraction

- **BackendConfig Custom Resource**:
    - Defines backend type and settings for remote state (S3, GCS, etc.)
    - References a `CloudCredentials` CR for authentication

- **CloudCredentials Custom Resource**:
    - Stores credential source (Kubernetes secrets) per provider
    - Supports rotation and fine-grained scoped access

### 4. Automation & Reconciliation

- Declarative, GitOps-friendly infra management: change module version, stack inputs, or backend by updating Kubernetes YAML
- Controller detects source/version changes, updates module metadata, and triggers safe reconciliation
- No imperative apply/destroy flags required; full lifecycle managed via resource presence and editing
- Robust status and event reporting via CR status fields

### 5. Extensibility & Integration

- New module sources (git, registry, http) and backends easily supported
- Powerful status fields drive UI/CLI/API design and validation
- Module CR change triggers stack reconciliation everywhere it is used

## Technical Architecture

| Layer       | Description                                                          |
|-------------|----------------------------------------------------------------------|
| CRDs        | Custom resources for Module, Stack, BackendConfig, CloudCredentials  |
| Controller  | Kubernetes operator parses modules, manages plans/applies/destroys   |
| Parsing     | Uses `terraform-docs` or HCL parser to populate module metadata      |
| Orchestration | Handles plan/apply/destroy lifecycle driven by Stack reconciliation|
| Security    | Credentials abstracted via references; all sensitive data in Secrets |

### Custom Resources

#### Module

| Field       | Populated By  | Description                         |
|-------------|--------------|-------------------------------------|
| spec.source | User         | Module repo/url, type, version      |
| status      | Controller   | Inputs/outputs, providers, etc.     |

#### Stack

| Field           | Populated By | Description                                           |
|-----------------|-------------|-------------------------------------------------------|
| spec.backendRef | User        | Reference to BackendConfig CR                         |
| spec.modules    | User        | List of module references, variable mappings, links   |

#### BackendConfig

| Field           | Populated By | Description                       |
|-----------------|-------------|-----------------------------------|
| spec.settings   | User        | Backend-specific config           |
| spec.credentialsRef | User    | Reference to CloudCredentials CR  |

#### CloudCredentials

| Field          | Populated By | Description                    |
|----------------|-------------|--------------------------------|
| spec.secretRef | User        | Reference to Kubernetes Secret |

## User Workflow

1. **Define CloudCredentials** for each provider (backed by Secrets)
2. **Create BackendConfig** that references credentials & backend settings
3. **Declare Module** resources with only minimal source info
4. **Astrolabe populates Module status** with full introspected schema
5. **Create Stack** resource referencing modules, backend, and variable values
6. **Astrolabe reconciles desired state** (plan+apply on create/update, destroy on deletion)
7. **Status/events are reported** in Stack CR; Stack outputs/resources are available in status

## Non-Functional Requirements

- **Scalability:** Supports numerous stacks/modules across namespaces
- **Resilience:** Automatic error handling, idempotent reconciliation
- **Security:** All secrets stored in Kubernetes; RBAC on CRs; audit trails via status/events
- **Extensibility:** New source types, providers, outputs easily added
- **Automation:** Supports CI/CD, GitOps, and UI-driven workflows

## Example Resource References

- **Module**:
  Define with only URL/version; status fields auto-populated
- **Stack**:
  Reference backendConfig, cloudCredentials, list of modules by name
- **BackendConfig**:
  Backend type/settings + reference to required CloudCredentials
- **CloudCredentials**:
  Reference a Secret for provider keys/tokens

## Implementation Notes

- No need for manual plan/apply flags—pure declarative reconciliation
- All validation and documentation is driven from status fields
- UI or CLI tools can leverage status for schema-driven forms and validation
- Any change in a module source/version triggers introspection and downstream stack reconciliation

Astrolabe enables modular, observable, and repeatable cloud automation—from module import to declarative, secure stack orchestration—centered around Kubernetes CRDs and controller best practices.
