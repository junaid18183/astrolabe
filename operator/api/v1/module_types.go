/*
Copyright 2025.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package v1

import (
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// EDIT THIS FILE!  THIS IS SCAFFOLDING FOR YOU TO OWN!
// NOTE: json tags are required.  Any new fields you add must have json tags for the fields to be serialized.

// ModuleSpec defines the desired state of Module.
type ModuleSpec struct {
	Source ModuleSource `json:"source"`
}

type ModuleSource struct {
	Type    string `json:"type"`
	URL     string `json:"url"`
	Version string `json:"version,omitempty"`
	Path    string `json:"path,omitempty"`
}

// ModuleStatus defines the observed state of Module.
type ModuleStatus struct {
	Description  string             `json:"description,omitempty"`
	Inputs       []ModuleInput      `json:"inputs"`
	Outputs      []ModuleOutput     `json:"outputs"`
	Providers    []ModuleProvider   `json:"providers"`
	Requirements ModuleRequirements `json:"requirements"`
	Resources    []ModuleResource   `json:"resources"`
	Submodules   []ModuleSubmodule  `json:"submodules"`
	Conditions   []ModuleCondition  `json:"conditions"`
	LastSynced   metav1.Time        `json:"lastSynced"`
}

type ModuleInput struct {
	Name        string                `json:"name"`
	Type        string                `json:"type"`
	Description string                `json:"description,omitempty"`
	Default     *apiextensionsv1.JSON `json:"default,omitempty"`
	Required    bool                  `json:"required"`
	Sensitive   bool                  `json:"sensitive"`
}

type ModuleOutput struct {
	Name        string `json:"name"`
	Type        string `json:"type"`
	Description string `json:"description,omitempty"`
	Sensitive   bool   `json:"sensitive"`
}

type ModuleProvider struct {
	Name    string `json:"name"`
	Version string `json:"version,omitempty"`
	Source  string `json:"source,omitempty"`
}

type ModuleRequirements struct {
	Terraform         ModuleTerraformRequirements `json:"terraform"`
	RequiredProviders map[string]string           `json:"required_providers"`
}

type ModuleTerraformRequirements struct {
	RequiredVersion string `json:"required_version,omitempty"`
}

type ModuleResource struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

type ModuleSubmodule struct {
	Name   string `json:"name"`
	Source string `json:"source"`
}

type ModuleCondition struct {
	Type               string      `json:"type"`
	Status             string      `json:"status"`
	LastTransitionTime metav1.Time `json:"lastTransitionTime"`
	Reason             string      `json:"reason,omitempty"`
	Message            string      `json:"message,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="SOURCETYPE",type=string,JSONPath=".spec.source.type"
// +kubebuilder:printcolumn:name="SOURCEURL",type=string,JSONPath=".spec.source.url"
// +kubebuilder:printcolumn:name="VERSION",type=string,JSONPath=".spec.source.version"
// +kubebuilder:printcolumn:name="READY",type=string,JSONPath=".status.conditions[?(@.type==\"Ready\")].status"

// Module is the Schema for the modules API.
type Module struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   ModuleSpec   `json:"spec,omitempty"`
	Status ModuleStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// ModuleList contains a list of Module.
type ModuleList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []Module `json:"items"`
}

func init() {
	SchemeBuilder.Register(&Module{}, &ModuleList{})
}
