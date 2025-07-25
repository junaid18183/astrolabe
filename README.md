# Astrolabe
Astrolabe is a Kubernetes-native platform for managing and orchestrating Terraform/OpenTofu modules and infrastructure stacks using declarative custom resources.
Key features include module management, stack composition, backend and credentials abstraction, declarative automation, extensibility, and strong status/event reporting.
The technical architecture uses Kubernetes CRDs, a controller/operator, module parsing, and secure credential management.
Target users are platform, DevOps, SRE teams, and organizations adopting GitOps or Kubernetes-native automation.
The main goals are to enable IaC workflows, automate schema population/validation, empower modular and auditable automation, and separate backend/credential management for security and DRY principles.
