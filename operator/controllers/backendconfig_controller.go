package controllers

import (
	context "context"
	"fmt"
	"reflect"

	astrolabev1 "github.com/junaid18183/astrolabe/operator/api/v1"
	corev1 "k8s.io/api/core/v1"
	kerrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"
	"sigs.k8s.io/controller-runtime/pkg/log"
)

// BackendConfigReconciler reconciles a BackendConfig object
type BackendConfigReconciler struct {
	client.Client
}

func (r *BackendConfigReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	logger := log.FromContext(ctx)
	var backendConfig astrolabev1.BackendConfig
	if err := r.Get(ctx, req.NamespacedName, &backendConfig); err != nil {
		if kerrors.IsNotFound(err) {
			return ctrl.Result{}, nil
		}
		return ctrl.Result{}, err
	}

	// 1. Validate spec fields
	if backendConfig.Spec.Type == "" || backendConfig.Spec.CredentialRef.Name == "" {
		return r.setStatus(ctx, &backendConfig, false, "ValidationError", "Missing required spec fields: type or credentialRef.name"), nil
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
		_ = backendConfig.Spec.Settings.Unmarshal(&settings)
		for _, f := range fields {
			if _, present := settings[f]; !present {
				missing = append(missing, f)
			}
		}
		if len(missing) > 0 {
			msg := fmt.Sprintf("Missing required settings for %s backend: %v", backendConfig.Spec.Type, missing)
			return r.setStatus(ctx, &backendConfig, false, "ValidationError", msg), nil
		}
	}

	// 3. Resolve credentialRef (CloudCredentials CR)
	var cloudCreds astrolabev1.CloudCredentials
	if err := r.Get(ctx, types.NamespacedName{Name: backendConfig.Spec.CredentialRef.Name, Namespace: backendConfig.Namespace}, &cloudCreds); err != nil {
		if kerrors.IsNotFound(err) {
			msg := fmt.Sprintf("CloudCredentials '%s' not found", backendConfig.Spec.CredentialRef.Name)
			return r.setStatus(ctx, &backendConfig, false, "CredentialNotFound", msg), nil
		}
		return ctrl.Result{}, err
	}

	// 4. Sync Secrets
	var secret corev1.Secret
	if err := r.Get(ctx, types.NamespacedName{Name: cloudCreds.Spec.SecretRef.Name, Namespace: backendConfig.Namespace}, &secret); err != nil {
		if kerrors.IsNotFound(err) {
			msg := fmt.Sprintf("Secret '%s' not found for CloudCredentials", cloudCreds.Spec.SecretRef.Name)
			return r.setStatus(ctx, &backendConfig, false, "SecretNotFound", msg), nil
		}
		return ctrl.Result{}, err
	}

	// 5. Validate Secret Content (example for s3)
	requiredSecretKeys := map[string][]string{
		"s3":      {"aws_access_key_id", "aws_secret_access_key"},
		"azurerm": {"client_id", "client_secret", "tenant_id", "subscription_id"},
		"gcs":     {"service_account.json"},
		// Add more as needed
	}
	if keys, ok := requiredSecretKeys[backendConfig.Spec.Type]; ok {
		missing := []string{}
		for _, k := range keys {
			if _, present := secret.Data[k]; !present {
				missing = append(missing, k)
			}
		}
		if len(missing) > 0 {
			msg := fmt.Sprintf("Missing required secret keys for %s backend: %v", backendConfig.Spec.Type, missing)
			return r.setStatus(ctx, &backendConfig, false, "SecretValidationError", msg), nil
		}
	}

	// 6. Set Ready status
	return r.setStatus(ctx, &backendConfig, true, "Ready", "BackendConfig is valid and credentials verified"), nil
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
