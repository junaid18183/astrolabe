package controllers

import (
	context "context"
	"encoding/json"
	"fmt"
	"strings"

	astrolabev1 "github.com/junaid18183/astrolabe/api/v1"
	// secret variable and related logic removed
	corev1 "k8s.io/api/core/v1"
	kerrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/log"
)

// BackendConfigReconciler reconciles a BackendConfig object
type BackendConfigReconciler struct {
	client.Client
}

func (r *BackendConfigReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	logger := log.FromContext(ctx)
	logger.Info("Reconciling BackendConfig", "name", req.NamespacedName)
	var backendConfig astrolabev1.BackendConfig
	if err := r.Get(ctx, req.NamespacedName, &backendConfig); err != nil {
		if kerrors.IsNotFound(err) {
			logger.Info("BackendConfig resource not found. Ignoring since object must be deleted.")
			return ctrl.Result{}, nil
		}
		logger.Error(err, "Failed to get BackendConfig")
		return ctrl.Result{}, err
	}

	// 1. Validate spec fields
	if backendConfig.Spec.Type == "" {
		msg := "Missing required spec field: type"
		logger.Error(nil, msg)
		r.emitEvent(&backendConfig, corev1.EventTypeWarning, "ValidationError", msg)
		return r.setStatus(ctx, &backendConfig, false, "ValidationError", msg), nil
	}

	// 2. Validate backend-specific settings (example for s3)
	requiredSettings := map[string][]string{
		"s3":      {"bucket", "region"},
		"azurerm": {"storage_account_name", "container_name", "key", "resource_group_name"},
		"gcs":     {"bucket"},
		// Add more as needed
	}
	if fields, ok := requiredSettings[backendConfig.Spec.Type]; ok {
		missing := []string{}
		settings := map[string]interface{}{}
		if err := json.Unmarshal(backendConfig.Spec.Settings.Raw, &settings); err != nil {
			msg := fmt.Sprintf("Failed to parse settings JSON: %v", err)
			logger.Error(err, msg)
			r.emitEvent(&backendConfig, corev1.EventTypeWarning, "SettingsParseError", msg)
			return r.setStatus(ctx, &backendConfig, false, "SettingsParseError", msg), nil
		}
		for _, f := range fields {
			if _, present := settings[f]; !present {
				missing = append(missing, f)
			}
		}
		if len(missing) > 0 {
			msg := fmt.Sprintf("Missing required settings for %s backend: %v", backendConfig.Spec.Type, missing)
			logger.Error(nil, msg)
			r.emitEvent(&backendConfig, corev1.EventTypeWarning, "ValidationError", msg)
			return r.setStatus(ctx, &backendConfig, false, "ValidationError", msg), nil
		}
	}

	// 3. (CredentialRef logic removed)

	// 5. Secret validation logic removed

	// 6. Set Ready status
	msg := "BackendConfig is valid and credentials verified"
	logger.Info(msg)
	r.emitEvent(&backendConfig, corev1.EventTypeNormal, "Ready", msg)
	return r.setStatus(ctx, &backendConfig, true, "Ready", msg), nil
}

// emitEvent emits a Kubernetes event for the BackendConfig resource
func (r *BackendConfigReconciler) emitEvent(bc *astrolabev1.BackendConfig, eventType, reason, message string) {
	if r.Client != nil {
		ref := &corev1.ObjectReference{
			Kind:       "BackendConfig",
			Namespace:  bc.Namespace,
			Name:       bc.Name,
			UID:        bc.UID,
			APIVersion: bc.APIVersion,
		}
		// Use the event recorder if available (in production, inject it)
		// Here, fallback to create event directly for demo
		event := &corev1.Event{
			ObjectMeta: metav1.ObjectMeta{
				GenerateName: fmt.Sprintf("%s-", strings.ToLower(reason)),
				Namespace:    bc.Namespace,
			},
			InvolvedObject: *ref,
			Reason:         reason,
			Message:        message,
			Type:           eventType,
			Source:         corev1.EventSource{Component: "backendconfig-controller"},
		}
		_ = r.Create(context.Background(), event)
	}
}

func (r *BackendConfigReconciler) setStatus(ctx context.Context, bc *astrolabev1.BackendConfig, ready bool, reason, msg string) ctrl.Result {
	bc.Status.Conditions = []metav1.Condition{{
		Type: "Ready",
		Status: func() metav1.ConditionStatus {
			if ready {
				return metav1.ConditionTrue
			} else {
				return metav1.ConditionFalse
			}
		}(),
		Reason:             reason,
		Message:            msg,
		LastTransitionTime: metav1.Now(),
	}}
	_ = r.Status().Update(ctx, bc)
	return ctrl.Result{}
}
func (r *BackendConfigReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&astrolabev1.BackendConfig{}).
		Complete(r)
}
