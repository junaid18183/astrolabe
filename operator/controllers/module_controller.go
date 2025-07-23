package controllers

import (
	"context"
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"k8s.io/apimachinery/pkg/runtime"

	astrolabev1 "github.com/junaid18183/astrolabe/api/v1"
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/log"
)

// ModuleReconciler reconciles a Module object
type ModuleReconciler struct {
	client.Client
	Scheme *runtime.Scheme
}

//+kubebuilder:rbac:groups=astrolabe.io,resources=modules,verbs=get;list;watch;update;patch
//+kubebuilder:rbac:groups=astrolabe.io,resources=modules/status,verbs=get;update;patch

func (r *ModuleReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	logger := log.FromContext(ctx)

	var module astrolabev1.Module
	if err := r.Get(ctx, req.NamespacedName, &module); err != nil {
		if errors.IsNotFound(err) {
			return ctrl.Result{}, nil
		}
		return ctrl.Result{}, err
	}

	setCondition := func(condType, status, reason, message string) {
		now := metav1.Now()
		found := false
		for i, cond := range module.Status.Conditions {
			if cond.Type == condType {
				if cond.Status != status || cond.Reason != reason || cond.Message != message {
					module.Status.Conditions[i].Status = status
					module.Status.Conditions[i].Reason = reason
					module.Status.Conditions[i].Message = message
					module.Status.Conditions[i].LastTransitionTime = now
				}
				found = true
				break
			}
		}
		if !found {
			module.Status.Conditions = append(module.Status.Conditions, astrolabev1.ModuleCondition{
				Type:               condType,
				Status:             status,
				Reason:             reason,
				Message:            message,
				LastTransitionTime: now,
			})
		}
	}

	// Fetch/clone the module source
	workDir := filepath.Join(os.TempDir(), "astrolabe-modules", module.Name+"-"+string(module.UID))
	os.RemoveAll(workDir)
	os.MkdirAll(workDir, 0755)

	var fetchErr error
	switch module.Spec.Source.Type {
	case "git":
		cmd := exec.Command("git", "clone", module.Spec.Source.URL, workDir)
		if module.Spec.Source.Version != "" {
			cmd = exec.Command("git", "clone", "--branch", module.Spec.Source.Version, module.Spec.Source.URL, workDir)
		}
		fetchErr = cmd.Run()
	case "http":
		// TODO: implement HTTP fetch
		fetchErr = nil
	case "local":
		// TODO: implement local path copy
		fetchErr = nil
	default:
		fetchErr = nil
	}

	if fetchErr != nil {
		setCondition("Ready", "False", "CloneFailed", "Failed to fetch module source")
		logger.Error(fetchErr, "Failed to fetch module source")
		_ = r.Status().Update(ctx, &module)
		return ctrl.Result{RequeueAfter: 1 * time.Minute}, nil
	}
	setCondition("Ready", "False", "Cloned", "Module source cloned successfully")

	// Run terraform-docs json .
	docsCmd := exec.Command("terraform-docs", "json", workDir)
	docsOut, err := docsCmd.Output()
	if err != nil {
		setCondition("Ready", "False", "ParseFailed", "Failed to run terraform-docs")
		logger.Error(err, "Failed to run terraform-docs")
		_ = r.Status().Update(ctx, &module)
		return ctrl.Result{RequeueAfter: 1 * time.Minute}, nil
	}
	setCondition("Ready", "False", "Parsed", "terraform-docs output parsed successfully")

	// Parse terraform-docs output (JSON) and update status
	type tfDocs struct {
		Inputs []struct {
			Name        string      `json:"name"`
			Type        string      `json:"type"`
			Description string      `json:"description"`
			Default     interface{} `json:"default"`
			Required    bool        `json:"required"`
			Sensitive   bool        `json:"sensitive"`
		} `json:"inputs"`
		Outputs []struct {
			Name        string `json:"name"`
			Description string `json:"description"`
			Sensitive   bool   `json:"sensitive"`
			Type        string `json:"type"`
		} `json:"outputs"`
		Providers []struct {
			Name    string `json:"name"`
			Source  string `json:"source"`
			Version string `json:"version"`
		} `json:"providers"`
		Requirements json.RawMessage `json:"requirements"`
		Resources    []struct {
			Name string `json:"name"`
			Type string `json:"type"`
		} `json:"resources"`
		Modules []struct {
			Name   string `json:"name"`
			Source string `json:"source"`
		} `json:"modules"`
		Description string `json:"description"`
	}

	var docs tfDocs
	if err := json.Unmarshal(docsOut, &docs); err != nil {
		logger.Error(err, "Failed to parse terraform-docs output")
		return ctrl.Result{RequeueAfter: 1 * time.Minute}, nil
	}

	// Handle requirements as object or array
	reqObj := struct {
		Terraform struct {
			RequiredVersion string `json:"required_version"`
		} `json:"terraform"`
		RequiredProviders map[string]string `json:"required_providers"`
	}{}
	if len(docs.Requirements) > 0 && docs.Requirements[0] == '{' {
		_ = json.Unmarshal(docs.Requirements, &reqObj)
	}

	module.Status.Description = docs.Description
	module.Status.Inputs = make([]astrolabev1.ModuleInput, len(docs.Inputs))
	for i, in := range docs.Inputs {
		var def *apiextensionsv1.JSON
		if in.Default != nil {
			defBytes, _ := json.Marshal(in.Default)
			def = &apiextensionsv1.JSON{Raw: defBytes}
		}
		module.Status.Inputs[i] = astrolabev1.ModuleInput{
			Name:        in.Name,
			Type:        in.Type,
			Description: in.Description,
			Default:     def,
			Required:    in.Required,
			Sensitive:   in.Sensitive,
		}
	}
	module.Status.Outputs = make([]astrolabev1.ModuleOutput, len(docs.Outputs))
	for i, out := range docs.Outputs {
		module.Status.Outputs[i] = astrolabev1.ModuleOutput{
			Name:        out.Name,
			Type:        out.Type,
			Description: out.Description,
			Sensitive:   out.Sensitive,
		}
	}
	module.Status.Providers = make([]astrolabev1.ModuleProvider, len(docs.Providers))
	for i, p := range docs.Providers {
		module.Status.Providers[i] = astrolabev1.ModuleProvider{
			Name:    p.Name,
			Source:  p.Source,
			Version: p.Version,
		}
	}
	module.Status.Requirements = astrolabev1.ModuleRequirements{
		Terraform: astrolabev1.ModuleTerraformRequirements{
			RequiredVersion: reqObj.Terraform.RequiredVersion,
		},
		RequiredProviders: reqObj.RequiredProviders,
	}
	module.Status.Resources = make([]astrolabev1.ModuleResource, len(docs.Resources))
	for i, r := range docs.Resources {
		module.Status.Resources[i] = astrolabev1.ModuleResource{
			Name: r.Name,
			Type: r.Type,
		}
	}
	module.Status.Submodules = make([]astrolabev1.ModuleSubmodule, len(docs.Modules))
	for i, m := range docs.Modules {
		module.Status.Submodules[i] = astrolabev1.ModuleSubmodule{
			Name:   m.Name,
			Source: m.Source,
		}
	}
	module.Status.LastSynced = metav1.Now()
	setCondition("Ready", "True", "Synced", "Module successfully parsed and status updated")

	// Ensure required fields are always set
	if module.Status.Conditions == nil {
		module.Status.Conditions = []astrolabev1.ModuleCondition{}
	}
	if module.Status.Requirements.RequiredProviders == nil {
		module.Status.Requirements.RequiredProviders = map[string]string{}
	}

	if err := r.Status().Update(ctx, &module); err != nil {
		logger.Error(err, "Failed to update Module status")
		return ctrl.Result{}, err
	}

	return ctrl.Result{}, nil
}

func (r *ModuleReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&astrolabev1.Module{}).
		Complete(r)
}
