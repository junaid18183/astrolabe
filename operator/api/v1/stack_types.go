package v1

import (
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// StackSpec defines the desired state of Stack
type StackSpec struct {
	BackendRef    *StackBackendRef    `json:"backendRef"`
	CredentialRef *StackCredentialRef `json:"credentialRef"`
	Modules       []StackModule       `json:"modules"`
}

type StackModule struct {
	ModuleID  string               `json:"moduleId"`
	Name      string               `json:"name,omitempty"`
	Variables apiextensionsv1.JSON `json:"variables,omitempty"`
	DependsOn []string             `json:"dependsOn,omitempty"`
}

// StackBackendRef matches backendRef in stack.yaml
type StackBackendRef struct {
	Name string `json:"name"`
}

// StackCredentialRef matches CredentialRef in stack.yaml
type StackCredentialRef struct {
	Name string `json:"name"`
}

type LinkedInput struct {
	FromModuleID string `json:"fromModuleId"`
	ToVariable   string `json:"toVariable"`
	FromOutput   string `json:"fromOutput"`
}

// StackStatus defines the observed state of Stack
type StackStatus struct {
	Phase     string               `json:"phase,omitempty"`
	Outputs   apiextensionsv1.JSON `json:"outputs,omitempty"`
	Resources []StackResource      `json:"resources,omitempty"`
	Events    []StackEvent         `json:"events,omitempty"`
}

type StackResource struct {
	ID     string `json:"id"`
	Type   string `json:"type"`
	Name   string `json:"name"`
	Status string `json:"status"`
}

type StackPlanChange struct {
	Resource apiextensionsv1.JSON `json:"resource,omitempty"`
	Action   string               `json:"action,omitempty"`
}

type StackApply struct {
	Status  string `json:"status,omitempty"`
	Summary string `json:"summary,omitempty"`
	Logs    string `json:"logs,omitempty"`
}

type StackEvent struct {
	Type      string `json:"type"`
	Reason    string `json:"reason,omitempty"`
	Message   string `json:"message,omitempty"`
	Timestamp string `json:"timestamp,omitempty"`
}

// +kubebuilder:object:root=true
type Stack struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   StackSpec   `json:"spec,omitempty"`
	Status StackStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true
type StackList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []Stack `json:"items"`
}
