package v1

import (
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// BackendConfigSpec defines the desired state of BackendConfig
// Generated from OpenAPI backen_config_spec.yaml

type BackendConfigSpec struct {
	// Type is the Terraform backend type.
	// +kubebuilder:validation:Enum=local;s3;azurerm;gcs;consul;etcd;etcdv3;http;oss;artifactory;swift;pg;remote
	Type     string               `json:"type"`
	Settings apiextensionsv1.JSON `json:"settings"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="Type",type=string,JSONPath=`.spec.type`,description="Backend type"
// +kubebuilder:printcolumn:name="Ready",type=string,JSONPath=`.status.conditions[?(@.type=="Ready")].status`,description="Ready status"
// +kubebuilder:printcolumn:name="Message",type=string,JSONPath=`.status.conditions[?(@.type=="Ready")].message`,description="Status message"
type BackendConfig struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`
	Spec              BackendConfigSpec   `json:"spec,omitempty"`
	Status            BackendConfigStatus `json:"status,omitempty"`
}

// BackendConfigStatus holds observed state, including Ready condition and message
type BackendConfigStatus struct {
	Conditions []metav1.Condition `json:"conditions,omitempty"`
	Message    string             `json:"message,omitempty"`
}

// +kubebuilder:object:root=true
type BackendConfigList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []BackendConfig `json:"items"`
}
