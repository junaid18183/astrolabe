# Project Overview

Astrolabe is a Kubernetes-native platform for managing Terraform/OpenTofu modules and stacks via custom resources. Key features include module management, stack composition, backend/credential abstraction, declarative automation, extensibility, and strong status/event reporting. Technical architecture uses Kubernetes CRDs, a controller/operator, module source parsing, credential abstraction, and supports GitOps workflows. Target users are platform, DevOps, SRE teams, and cloud architects. Goals are to enable IaC workflows, automate module schema population/validation, empower modular cloud automation, and separate backend/credential management.

## Folder Structure

- `/operator`: Contains the operator code for the custom resorce(CRD).
- `/frontend`: Contains the frontend source code.
- `/docs`: Contains documentation for the project, including API specifications and user guides.

## Libraries and Frameworks

- React and Tailwind CSS for the frontend.
- Node.js and Express for the backend.
- MongoDB for data storage.

## Coding Standards

- Use semicolons at the end of each statement.
- Use single quotes for strings.
- Use function based components in React.
- Use arrow functions for callbacks.

## UI guidelines

- A toggle is provided to switch between light and dark mode.
- Application should have a modern and clean design.
- UI is based on headlamp plugin
