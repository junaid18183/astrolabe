package controllers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	astrolabev1 "github.com/junaid18183/astrolabe/api/v1"
	corev1 "k8s.io/api/core/v1"
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"
)

// StackReconciler reconciles a Stack object
type StackReconciler struct {
	client.Client
	Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=astrolabe.io,resources=stacks,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=astrolabe.io,resources=stacks/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=astrolabe.io,resources=stacks/finalizers,verbs=update
// +kubebuilder:rbac:groups=astrolabe.io,resources=backendconfigs;credentials;modules,verbs=get;list;watch
// +kubebuilder:rbac:groups=core,resources=secrets,verbs=get;list;watch
func (r *StackReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	ctrl.Log.Info("Reconciling Stack", "name", req.NamespacedName)
	//
	var stack astrolabev1.Stack
	if err := r.Get(ctx, req.NamespacedName, &stack); err != nil {
		ctrl.Log.Info("Failed to get Stack resource", "error", err)
		if k8serrors.IsNotFound(err) {
			return ctrl.Result{}, nil
		}
		return ctrl.Result{}, err
	}

	// If the Stack is being deleted, skip all processing and status updates
	if stack.ObjectMeta.DeletionTimestamp != nil {
		ctrl.Log.Info("Stack is being deleted", "name", stack.Name)
		return r.handleDelete(ctx, &stack)
	}

	backendRef := stack.Spec.BackendRef.Name
	credentialRef := ""
	if stack.Spec.CredentialRef != nil {
		credentialRef = stack.Spec.CredentialRef.Name
	}

	moduleRefs := make([]string, len(stack.Spec.Modules))
	for i, m := range stack.Spec.Modules {
		moduleRefs[i] = m.Name
	}

	var backend astrolabev1.BackendConfig
	if err := r.Get(ctx, client.ObjectKey{Namespace: stack.Namespace, Name: backendRef}, &backend); err != nil {
		ctrl.Log.Info("Missing backend config", "backendRef", backendRef, "error", err)
		r.setStackError(ctx, &stack, "MissingBackendConfig", err.Error())
		return ctrl.Result{Requeue: true}, nil
	}

	var credSecret corev1.Secret
	if credentialRef != "" {
		if err := r.Get(ctx, client.ObjectKey{Namespace: stack.Namespace, Name: credentialRef}, &credSecret); err != nil {
			ctrl.Log.Info("Missing credential secret", "credentialRef", credentialRef, "error", err)
			r.setStackError(ctx, &stack, "MissingCredential", err.Error())
			return ctrl.Result{Requeue: true}, nil
		}
	}

	modules := make([]astrolabev1.Module, len(moduleRefs))
	for i, ref := range moduleRefs {
		var mod astrolabev1.Module
		if err := r.Get(ctx, client.ObjectKey{Namespace: stack.Namespace, Name: ref}, &mod); err != nil {
			ctrl.Log.Info("Missing module", "moduleRef", ref, "error", err)
			r.setStackError(ctx, &stack, "MissingModule", err.Error())
			return ctrl.Result{Requeue: true}, nil
		}
		if mod.Status.Inputs == nil {
			ctrl.Log.Info("Module status.inputs missing", "module", ref)
			r.setStackError(ctx, &stack, "ModuleUnpopulated", "Module status.inputs missing")
			return ctrl.Result{Requeue: true}, nil
		}
		modules[i] = mod
	}

	for i, mod := range modules {
		stackMod := stack.Spec.Modules[i]
		missingVars := []string{}
		var variables map[string]interface{}
		if stackMod.Variables.Raw != nil {
			_ = json.Unmarshal(stackMod.Variables.Raw, &variables)
		} else {
			variables = map[string]interface{}{}
		}
		for _, input := range mod.Status.Inputs {
			if _, ok := variables[input.Name]; !ok && input.Required {
				missingVars = append(missingVars, input.Name)
			}
		}
		if len(missingVars) > 0 {
			ctrl.Log.Info("Missing required module variables", "module", stackMod.Name, "missing", missingVars)
			r.setStackError(ctx, &stack, "MissingModuleVariables", "Missing variables: "+strings.Join(missingVars, ", "))
			return ctrl.Result{Requeue: true}, nil
		}
	}

	workDir := filepath.Join("/tmp", "astrolabe", stack.Namespace, stack.Name)
	os.MkdirAll(workDir, 0700)
	writeFile(filepath.Join(workDir, "backend.tf"), renderBackendTf(backend))
	writeFile(filepath.Join(workDir, "main.tf"), renderMainTf(stack, modules))

	for i, mod := range modules {
		stackMod := stack.Spec.Modules[i]
		varTf := renderVariablesTf(mod, stackMod)
		fname := mod.Name + ".variables.tf"
		if fname == ".variables.tf" && mod.Name != "" {
			fname = mod.Name + ".variables.tf"
		}
		if fname == ".variables.tf" {
			fname = stackMod.Name + ".variables.tf"
		}
		writeFile(filepath.Join(workDir, fname), varTf)
	}

	envVars := []string{}
	if credentialRef != "" {
		for k, v := range credSecret.Data {
			envVars = append(envVars, fmt.Sprintf("%s=%s", k, string(v)))
		}
	}

	// steps := []string{"init", "plan", "apply"}
	steps := []string{"init", "plan"}
	for _, step := range steps {
		phase := strings.Title(step)
		ctrl.Log.Info("Running terraform step", "step", step, "workDir", workDir)
		r.setStackPhase(ctx, &stack, phase)
		out, err := runTerraformStep(workDir, step, envVars)
		r.appendStackLog(ctx, &stack, step, out)
		if err != nil {
			ctrl.Log.Info("Terraform step failed", "step", step, "error", err)
			r.setStackError(ctx, &stack, "Terraform"+phase+"Error", err.Error())
			return ctrl.Result{Requeue: true}, nil
		}
	}

	outputs, resources, err := parseTerraformState(workDir)
	if err != nil {
		ctrl.Log.Info("Failed to parse terraform state", "error", err)
		r.setStackError(ctx, &stack, "TerraformStateParseError", err.Error())
		return ctrl.Result{Requeue: true}, nil
	}
	outputsJSON, _ := json.Marshal(outputs)
	stack.Status.Outputs = apiextensionsv1.JSON{Raw: outputsJSON}
	stack.Status.Resources = make([]astrolabev1.StackResource, len(resources))
	for i, rname := range resources {
		stack.Status.Resources[i] = astrolabev1.StackResource{Name: rname}
	}
	r.setStackPhase(ctx, &stack, "Applied")

	r.emitStackEvent(&stack, corev1.EventTypeNormal, "StackApplied", "Stack successfully applied and outputs/resources updated.")

	ctrl.Log.Info("Stack reconciliation complete", "name", stack.Name)
	return ctrl.Result{}, nil
}

func (r *StackReconciler) emitStackEvent(stack *astrolabev1.Stack, eventtype, reason, message string) {
	if r.Scheme == nil {
		return
	}
	recorder := ctrl.Log.WithName("event").WithValues("stack", stack.Name)
	recorder.Info("Event", "type", eventtype, "reason", reason, "message", message)
}

func parseTerraformState(workDir string) (map[string]interface{}, []string, error) {
	statePath := filepath.Join(workDir, "terraform.tfstate")
	data, err := os.ReadFile(statePath)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to read state: %w", err)
	}
	var state struct {
		Outputs   map[string]struct{ Value interface{} } `json:"outputs"`
		Resources []struct {
			Type      string `json:"type"`
			Name      string `json:"name"`
			Instances []struct {
				Attributes map[string]interface{} `json:"attributes"`
			} `json:"instances"`
		} `json:"resources"`
	}
	if err := json.Unmarshal(data, &state); err != nil {
		return nil, nil, fmt.Errorf("failed to parse state: %w", err)
	}
	outputs := make(map[string]interface{})
	for k, v := range state.Outputs {
		outputs[k] = v.Value
	}
	resources := []string{}
	for _, res := range state.Resources {
		resources = append(resources, fmt.Sprintf("%s.%s", res.Type, res.Name))
	}
	return outputs, resources, nil
}

func (r *StackReconciler) handleDelete(ctx context.Context, stack *astrolabev1.Stack) (ctrl.Result, error) {
	controllerutil.RemoveFinalizer(stack, "stack.finalizers.astrolabe.io")
	if err := r.Update(ctx, stack); err != nil {
		return ctrl.Result{}, err
	}
	return ctrl.Result{}, nil
}

func (r *StackReconciler) setStackError(ctx context.Context, stack *astrolabev1.Stack, reason, msg string) {
	stack.Status.Phase = "Error"
	stack.Status.Status = reason
	stack.Status.Summary = msg
	stack.Status.Events = append(stack.Status.Events, astrolabev1.StackEvent{
		Type:      "Error",
		Reason:    reason,
		Message:   msg,
		Timestamp: time.Now().UTC().Format("2006-01-02T15:04:05Z07:00"),
	})
	_ = r.Status().Update(ctx, stack)
}

func (r *StackReconciler) setStackPhase(ctx context.Context, stack *astrolabev1.Stack, phase string) {
	stack.Status.Phase = phase
	_ = r.Status().Update(ctx, stack)
}

func (r *StackReconciler) appendStackLog(ctx context.Context, stack *astrolabev1.Stack, step, logStr string) {
	if stack.Status.Logs == "" {
		stack.Status.Logs = step + ":\n" + logStr + "\n"
	} else {
		stack.Status.Logs += step + ":\n" + logStr + "\n"
	}
	_ = r.Status().Update(ctx, stack)
}

func runTerraformStep(workDir, step string, env []string) (string, error) {
	// Run terraform init or plan as a subprocess in workDir, with error handling
	var cmd *exec.Cmd
	if step == "init" {
		cmd = exec.Command("terraform", "init", "-input=false")
	} else if step == "plan" {
		cmd = exec.Command("terraform", "plan", "-input=false", "-no-color")
	} else {
		return "", fmt.Errorf("unsupported terraform step: %s", step)
	}
	cmd.Dir = workDir
	cmd.Env = append(os.Environ(), env...)
	var outBuf, errBuf bytes.Buffer
	cmd.Stdout = &outBuf
	cmd.Stderr = &errBuf
	err := cmd.Run()
	output := outBuf.String() + errBuf.String()
	if err != nil {
		var exitErr *exec.ExitError
		if errors.As(err, &exitErr) {
			return output, fmt.Errorf("terraform %s failed with exit code %d: %s", step, exitErr.ExitCode(), output)
		}
		return output, fmt.Errorf("terraform %s failed: %w\nOutput: %s", step, err, output)
	}
	return output, nil
}

func renderBackendTf(backend astrolabev1.BackendConfig) string {
	backendType := backend.Spec.Type
	settings := backend.Spec.Settings
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("terraform {\n  backend \"%s\" {\n", backendType))
	var settingsMap map[string]interface{}
	if settings.Raw != nil {
		_ = json.Unmarshal(settings.Raw, &settingsMap)
	} else {
		settingsMap = map[string]interface{}{}
	}
	for k, v := range settingsMap {
		// Render string values with quotes, bool/numeric as is
		switch val := v.(type) {
		case string:
			sb.WriteString(fmt.Sprintf("    %s = \"%s\"\n", k, val))
		case bool, int, int32, int64, float32, float64:
			sb.WriteString(fmt.Sprintf("    %s = %v\n", k, val))
		default:
			sb.WriteString(fmt.Sprintf("    %s = \"%v\"\n", k, val))
		}
	}
	sb.WriteString("  }\n}\n")
	return sb.String()
}

func renderMainTf(stack astrolabev1.Stack, modules []astrolabev1.Module) string {
	var sb strings.Builder
	for i, mod := range modules {
		stackMod := stack.Spec.Modules[i]
		sb.WriteString(fmt.Sprintf("module \"%s\" {\n", stackMod.Name))
		// Render source and version from mod.Spec.Source
		sb.WriteString(fmt.Sprintf("  source = \"%s\"\n", mod.Spec.Source.URL))
		if mod.Spec.Source.Version != "" {
			sb.WriteString(fmt.Sprintf("  version = \"%s\"\n", mod.Spec.Source.Version))
		}
		// Unmarshal variables JSON
		var variables map[string]interface{}
		if stackMod.Variables.Raw != nil {
			_ = json.Unmarshal(stackMod.Variables.Raw, &variables)
		} else {
			variables = map[string]interface{}{}
		}
		for k, v := range variables {
			switch val := v.(type) {
			case string:
				sb.WriteString(fmt.Sprintf("  %s = \"%s\"\n", k, val))
			case []interface{}:
				sb.WriteString(fmt.Sprintf("  %s = [", k))
				for j, item := range val {
					if j > 0 {
						sb.WriteString(", ")
					}
					sb.WriteString(fmt.Sprintf("\"%v\"", item))
				}
				sb.WriteString("]\n")
			case map[string]interface{}:
				sb.WriteString(fmt.Sprintf("  %s = {", k))
				first := true
				for mk, mv := range val {
					if !first {
						sb.WriteString(", ")
					}
					sb.WriteString(fmt.Sprintf("%q = \"%v\"", mk, mv))
					first = false
				}
				sb.WriteString("}\n")
			default:
				sb.WriteString(fmt.Sprintf("  %s = %v\n", k, v))
			}
		}
		if len(stackMod.DependsOn) > 0 {
			sb.WriteString("  depends_on = [")
			for j, dep := range stackMod.DependsOn {
				if j > 0 {
					sb.WriteString(", ")
				}
				sb.WriteString(fmt.Sprintf("module.%s", dep))
			}
			sb.WriteString("]\n")
		}
		sb.WriteString("}\n\n")
	}
	return sb.String()
}

func renderVariablesTf(module astrolabev1.Module, stackMod astrolabev1.StackModuleRef) string {
	var sb strings.Builder
	for _, input := range module.Status.Inputs {
		sb.WriteString(fmt.Sprintf("variable \"%s\" {\n  type = %s", input.Name, input.Type))
		if input.Default != nil {
			sb.WriteString(fmt.Sprintf("\n  default = %v", input.Default))
		}
		sb.WriteString("\n}\n\n")
	}
	return sb.String()
}

func writeFile(path, content string) error {
	return os.WriteFile(path, []byte(content), 0600)
}

func (r *StackReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&astrolabev1.Stack{}).
		Owns(&corev1.Secret{}).
		Complete(r)
}
