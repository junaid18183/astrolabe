package v1

import (
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// BackendConfigSpec defines the desired state of BackendConfig
// Generated from OpenAPI backen_config_spec.yaml
type BackendConfigSpec struct {
	Type          string               `json:"type"`
	Settings      apiextensionsv1.JSON `json:"settings"`
	CredentialRef BackendCredentialRef `json:"credentialRef"`
}

type BackendCredentialRef struct {
	Name string `json:"name"`
}

// +kubebuilder:object:root=true
type BackendConfig struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec BackendConfigSpec `json:"spec,omitempty"`
}

// +kubebuilder:object:root=true
type BackendConfigList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []BackendConfig `json:"items"`
}
