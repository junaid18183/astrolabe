package v1

import (
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// StackSpec defines the desired state of Stack
type StackSpec struct {
	BackendRef    *StackBackendRef    `json:"backendRef"`
	CredentialRef *StackCredentialRef `json:"credentialRef,omitempty"`
	Modules       []StackModuleRef    `json:"modules"`
}

type StackModuleRef struct {
	Name      string               `json:"name"`
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
	Status    string               `json:"status,omitempty"`
	Summary   string               `json:"summary,omitempty"`
	Outputs   apiextensionsv1.JSON `json:"outputs,omitempty"`
	Resources []StackResource      `json:"resources,omitempty"`
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

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="Phase",type=string,JSONPath=".status.phase",description="Stack phase"
// +kubebuilder:printcolumn:name="Status",type=string,JSONPath=".status.status",description="Stack status"
// +kubebuilder:printcolumn:name="Summary",type=string,JSONPath=".status.summary",description="Stack summary"
// +kubebuilder:printcolumn:name="Backend",type=string,JSONPath=".spec.backendRef.name",description="Backend reference name"
// +kubebuilder:printcolumn:name="Modules",type=integer,JSONPath=".spec.modules | length(@)",description="Number of modules"
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
