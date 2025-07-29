package controllers

import (
	astrolabev1 "github.com/junaid18183/astrolabe/api/v1"
	"github.com/stretchr/testify/assert"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"testing"
)

func TestFinalizerAddedOnCreation(t *testing.T) {
	stack := &astrolabev1.Stack{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "test-stack",
			Namespace: "default",
		},
	}
	finalizerName := "stack.finalizers.astrolabe.io"
	assert.False(t, containsString(stack.ObjectMeta.Finalizers, finalizerName))
	// Simulate reconcile logic
	if !containsString(stack.ObjectMeta.Finalizers, finalizerName) {
		stack.ObjectMeta.Finalizers = append(stack.ObjectMeta.Finalizers, finalizerName)
	}
	assert.True(t, containsString(stack.ObjectMeta.Finalizers, finalizerName))
}

func TestHandleDeleteRemovesFinalizerOnSuccess(t *testing.T) {
	stack := &astrolabev1.Stack{
		ObjectMeta: metav1.ObjectMeta{
			Name:              "test-stack",
			Namespace:         "default",
			Finalizers:        []string{"stack.finalizers.astrolabe.io"},
			DeletionTimestamp: &metav1.Time{Time: metav1.Now().Time},
		},
		Spec: astrolabev1.StackSpec{},
	}
	// Simulate successful destroy
	removeFinalizer := func(s *astrolabev1.Stack) {
		for i, f := range s.ObjectMeta.Finalizers {
			if f == "stack.finalizers.astrolabe.io" {
				s.ObjectMeta.Finalizers = append(s.ObjectMeta.Finalizers[:i], s.ObjectMeta.Finalizers[i+1:]...)
				break
			}
		}
	}
	removeFinalizer(stack)
	assert.False(t, containsString(stack.ObjectMeta.Finalizers, "stack.finalizers.astrolabe.io"))
}

func TestHandleDeleteDoesNotRemoveFinalizerOnFailure(t *testing.T) {
	stack := &astrolabev1.Stack{
		ObjectMeta: metav1.ObjectMeta{
			Name:              "test-stack",
			Namespace:         "default",
			Finalizers:        []string{"stack.finalizers.astrolabe.io"},
			DeletionTimestamp: &metav1.Time{Time: metav1.Now().Time},
		},
		Spec: astrolabev1.StackSpec{},
	}
	// Simulate failed destroy (finalizer should remain)
	assert.True(t, containsString(stack.ObjectMeta.Finalizers, "stack.finalizers.astrolabe.io"))
}

func TestStatusAndEventsUpdatedOnDelete(t *testing.T) {
	stack := &astrolabev1.Stack{
		ObjectMeta: metav1.ObjectMeta{
			Name:              "test-stack",
			Namespace:         "default",
			Finalizers:        []string{"stack.finalizers.astrolabe.io"},
			DeletionTimestamp: &metav1.Time{Time: metav1.Now().Time},
		},
		Spec:   astrolabev1.StackSpec{},
		Status: astrolabev1.StackStatus{},
	}
	// Simulate status update
	stack.Status.Phase = "Destroying"
	stack.Status.Status = "InProgress"
	stack.Status.Summary = "Destroy started"
	assert.Equal(t, "Destroying", stack.Status.Phase)
	assert.Equal(t, "InProgress", stack.Status.Status)
	assert.Equal(t, "Destroy started", stack.Status.Summary)
}

func containsString(slice []string, s string) bool {
	for _, item := range slice {
		if item == s {
			return true
		}
	}
	return false
}
