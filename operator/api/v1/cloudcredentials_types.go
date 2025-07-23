package v1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// CloudCredentialsSpec defines the desired state of CloudCredentials
// Generated from OpenAPI cloud_creds_spec.yaml
// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
type CloudCredentialsSpec struct {
	Type      string          `json:"type"`
	SecretRef SecretReference `json:"secretRef"`
}

type SecretReference struct {
	Name string `json:"name"`
}

// +kubebuilder:object:root=true
type CloudCredentials struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec CloudCredentialsSpec `json:"spec,omitempty"`
}

// +kubebuilder:object:root=true
type CloudCredentialsList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []CloudCredentials `json:"items"`
}
