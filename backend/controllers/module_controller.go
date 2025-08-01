package controllers

import (
	"archive/zip"
	"compress/gzip"
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strings"
	"time"

	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/tools/record"

	astrolabev1 "github.com/junaid18183/astrolabe/api/v1"
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// ModuleReconciler reconciles a Module object
type ModuleReconciler struct {
	client.Client
	Scheme   *runtime.Scheme
	Recorder record.EventRecorder
}

//+kubebuilder:rbac:groups=astrolabe.io,resources=modules,verbs=get;list;watch;update;patch
//+kubebuilder:rbac:groups=astrolabe.io,resources=modules/status,verbs=get;update;patch

func (r *ModuleReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	var module astrolabev1.Module
	if err := r.Get(ctx, req.NamespacedName, &module); err != nil {
		ctrl.Log.Info("Failed to get Module resource", "error", err)
		if k8serrors.IsNotFound(err) {
			return ctrl.Result{}, nil
		}
		r.emitModuleEvent(&module, "Warning", "GetFailed", "Failed to get Module resource")
		return ctrl.Result{}, err
	}

	ctrl.Log.Info("Module resource loaded", "name", module.Name, "deletionTimestamp", module.ObjectMeta.DeletionTimestamp)

	// If the Module is being deleted, handle deletion logic FIRST
	if module.ObjectMeta.DeletionTimestamp != nil {
		ctrl.Log.Info("Module is being deleted, skipping status update and processing", "name", module.Name, "namespace", module.Namespace)
		r.emitModuleEvent(&module, "Normal", "Deleting", "Module is being deleted, skipping status update and processing")
		return ctrl.Result{}, nil
	}

	// Check for terminal state and skip reconciliation if true
	terminalStates := map[string]struct{}{
		"Ready": {},
	}
	isTerminal := false
	for _, cond := range module.Status.Conditions {
		if _, ok := terminalStates[cond.Type]; ok && cond.Status == "True" {
			isTerminal = true
			break
		}
	}
	if isTerminal {
		ctrl.Log.Info("Module is already in terminal state, skipping reconciliation", "name", module.Name)
		r.emitModuleEvent(&module, "Normal", "TerminalState", "Module is already in terminal state, skipping reconciliation")
		return ctrl.Result{}, nil
	}

	// Emit event: reconciliation started
	r.emitModuleEvent(&module, "Normal", "Reconciling", "Reconciling Module resource")
	ctrl.Log.Info("Reconciling Module resource", "name", module.Name)

	// Compute hash of type, url, version
	source := module.Spec.Source
	hashInput := source.Type + "|" + source.URL + "|" + source.Version
	hash := fmt.Sprintf("%x", sha256.Sum256([]byte(hashInput)))

	// Check if hash is already stored in status. If not, or if changed, proceed. Otherwise, skip reconcile.
	if module.Status.Conditions != nil {
		for _, cond := range module.Status.Conditions {
			if cond.Type == "SourceHash" && cond.Status == hash {
				ctrl.Log.Info("No change in type, url, or version; skipping reconciliation", "hash", hash)
				return ctrl.Result{}, nil
			}
		}
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
		// Special handling for SourceHash: always update or insert
		if condType == "SourceHash" {
			updated := false
			for i, cond := range module.Status.Conditions {
				if cond.Type == "SourceHash" {
					module.Status.Conditions[i].Status = status
					module.Status.Conditions[i].LastTransitionTime = now
					updated = true
					break
				}
			}
			if !updated {
				module.Status.Conditions = append(module.Status.Conditions, astrolabev1.ModuleCondition{
					Type:               "SourceHash",
					Status:             status,
					LastTransitionTime: now,
				})
			}
		}
	}

	// Fetch/clone the module source
	workDir := filepath.Join(os.TempDir(), "astrolabe-modules", module.Name+"-"+string(module.UID))
	os.RemoveAll(workDir)
	os.MkdirAll(workDir, 0755)

	var fetchErr error
	var moduleDir string = workDir
	switch module.Spec.Source.Type {
	case "git":
		ctrl.Log.Info("Cloning git repository", "url", module.Spec.Source.URL, "version", module.Spec.Source.Version)
		cmd := exec.Command("git", "clone", module.Spec.Source.URL, workDir)
		if module.Spec.Source.Version != "" {
			cmd = exec.Command("git", "clone", "--branch", module.Spec.Source.Version, module.Spec.Source.URL, workDir)
		}
		fetchErr = cmd.Run()
	case "http":
		ctrl.Log.Info("Downloading and extracting HTTP archive", "url", module.Spec.Source.URL)
		resp, err := http.Get(module.Spec.Source.URL)
		if err != nil {
			fetchErr = err
			break
		}
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			fetchErr = fmt.Errorf("failed to download file: %s", resp.Status)
			break
		}
		os.MkdirAll(workDir, 0755)
		tmpFile, err := ioutil.TempFile(workDir, "module-archive-*")
		if err != nil {
			fetchErr = err
			break
		}
		defer os.Remove(tmpFile.Name())
		_, err = io.Copy(tmpFile, resp.Body)
		if err != nil {
			fetchErr = err
			break
		}
		tmpFile.Close()
		ext := strings.ToLower(path.Ext(module.Spec.Source.URL))
		if ext == ".zip" {
			r, err := zip.OpenReader(tmpFile.Name())
			if err != nil {
				fetchErr = err
				break
			}
			defer r.Close()
			for _, f := range r.File {
				fpath := filepath.Join(workDir, f.Name)
				if f.FileInfo().IsDir() {
					os.MkdirAll(fpath, f.Mode())
					continue
				}
				if err := os.MkdirAll(filepath.Dir(fpath), 0755); err != nil {
					fetchErr = err
					break
				}
				outFile, err := os.OpenFile(fpath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
				if err != nil {
					fetchErr = err
					break
				}
				rc, err := f.Open()
				if err != nil {
					outFile.Close()
					fetchErr = err
					break
				}
				_, err = io.Copy(outFile, rc)
				outFile.Close()
				rc.Close()
				if err != nil {
					fetchErr = err
					break
				}
			}
			// Detect single subdirectory after extraction
			entries, err := ioutil.ReadDir(workDir)
			if err == nil {
				subdirs := []string{}
				for _, entry := range entries {
					if entry.IsDir() {
						subdirs = append(subdirs, entry.Name())
					}
				}
				if len(subdirs) == 1 {
					moduleDir = filepath.Join(workDir, subdirs[0])
					ctrl.Log.Info("Detected single subdirectory after extraction", "moduleDir", moduleDir)
				} else {
					ctrl.Log.Info("No single subdirectory detected after extraction", "dirs", subdirs)
				}
			}
		} else if ext == ".gz" || ext == ".tgz" {
			gz, err := os.Open(tmpFile.Name())
			if err != nil {
				fetchErr = err
				break
			}
			defer gz.Close()
			gzr, err := gzip.NewReader(gz)
			if err != nil {
				fetchErr = err
				break
			}
			defer gzr.Close()
			out, err := os.Create(filepath.Join(workDir, "main.tf"))
			if err != nil {
				fetchErr = err
				break
			}
			defer out.Close()
			_, err = io.Copy(out, gzr)
			if err != nil {
				fetchErr = err
				break
			}
		} else {
			fetchErr = fmt.Errorf("unsupported archive type: %s", ext)
		}
	case "local":
		ctrl.Log.Info("Local source type not implemented yet")
		fetchErr = nil
	default:
		ctrl.Log.Info("Unknown source type", "type", module.Spec.Source.Type)
		fetchErr = nil
	}

	if fetchErr != nil {
		setCondition("Ready", "False", "CloneFailed", "Failed to fetch module source")
		ctrl.Log.Error(fetchErr, "Failed to fetch module source")
		if module.ObjectMeta.DeletionTimestamp == nil {
			_ = r.Status().Update(ctx, &module)
		}
		return ctrl.Result{RequeueAfter: 1 * time.Minute}, nil
	}
	setCondition("Ready", "False", "Cloned", "Module source cloned successfully")
	// Store the new hash in status
	setCondition("SourceHash", hash, "", "")

	ctrl.Log.Info("Running terraform-docs", "dir", moduleDir)
	docsCmd := exec.Command("terraform-docs", "json", moduleDir)
	docsOut, err := docsCmd.Output()
	if err != nil {
		setCondition("Ready", "False", "ParseFailed", "Failed to run terraform-docs")
		ctrl.Log.Error(err, "Failed to run terraform-docs", "dir", moduleDir)
		if module.ObjectMeta.DeletionTimestamp == nil {
			_ = r.Status().Update(ctx, &module)
		}
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
		ctrl.Log.Error(err, "Failed to parse terraform-docs output")
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

	if module.ObjectMeta.DeletionTimestamp == nil {
		if err := r.Status().Update(ctx, &module); err != nil {
			// Ignore not found and precondition failed errors during deletion
			if k8serrors.IsNotFound(err) || isPreconditionFailed(err) || (err != nil && strings.Contains(err.Error(), "Precondition failed")) {
				ctrl.Log.Info("Ignoring status update error during deletion", "error", err)
				return ctrl.Result{}, nil
			}
			ctrl.Log.Error(err, "Failed to update Module status")
			return ctrl.Result{}, err
		}
	}

	return ctrl.Result{}, nil
}

// isPreconditionFailed checks if the error is a precondition failed error
func isPreconditionFailed(err error) bool {
	if statusErr, ok := err.(*k8serrors.StatusError); ok {
		return string(statusErr.ErrStatus.Reason) == "PreconditionFailed"
	}
	return false
}

func (r *ModuleReconciler) SetupWithManager(mgr ctrl.Manager) error {
	r.Recorder = mgr.GetEventRecorderFor("module-controller")
	return ctrl.NewControllerManagedBy(mgr).
		For(&astrolabev1.Module{}).
		Complete(r)
}

// emitModuleEvent emits a Kubernetes event for Module
func (r *ModuleReconciler) emitModuleEvent(module *astrolabev1.Module, eventtype, reason, message string) {
	if r.Recorder != nil {
		r.Recorder.Event(module, eventtype, reason, message)
	} else {
		ctrl.Log.WithName("event").WithValues("module", module.Name).Info("Event", "type", eventtype, "reason", reason, "message", message)
	}
}
