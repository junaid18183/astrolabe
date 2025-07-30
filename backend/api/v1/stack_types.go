package v1

import (
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// StackSpec defines the desired state of Stack
type StackSpec struct {
	BackendConfig BackendConfigSpec   `json:"backendConfig"`
	CredentialRef *StackCredentialRef `json:"credentialRef,omitempty"`
	Modules       []StackModuleRef    `json:"modules"`
}

// BackendConfigSpec defines the desired state of BackendConfig (inlined for Stack)
type BackendConfigSpec struct {
	Type     string               `json:"type"`
	Settings apiextensionsv1.JSON `json:"settings"`
}
type StackModuleRef struct {
	Name      string               `json:"name"`
	Variables apiextensionsv1.JSON `json:"variables,omitempty"`
	DependsOn []string             `json:"dependsOn,omitempty"`
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
	Ready     bool                 `json:"ready,omitempty"`
	// Conditions represent the latest available observations of an object's state
	Conditions []metav1.Condition `json:"conditions,omitempty" patchStrategy:"merge" patchMergeKey:"type"`
}

type StackResource struct {
	Name string `json:"name"`
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
// +kubebuilder:printcolumn:name="NAME",type=string,JSONPath=".metadata.name",description="Name of the stack"
// +kubebuilder:printcolumn:name="MODULES",type=string,JSONPath=".spec.modules[*].name",description="Module names (comma-separated)"
// +kubebuilder:printcolumn:name="PHASE",type=string,JSONPath=".status.phase",description="Stack phase"
// +kubebuilder:printcolumn:name="STATUS",type=string,JSONPath=".status.status",description="Stack status"
// +kubebuilder:printcolumn:name="READY",type=boolean,JSONPath=".status.ready",description="Stack is applied and synced"
// +kubebuilder:printcolumn:name="AGE",type=date,JSONPath=".metadata.creationTimestamp",description="Age of the stack"
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
