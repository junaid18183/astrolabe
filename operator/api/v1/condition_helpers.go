package v1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// SetCondition sets or updates a condition in the conditions slice.
func SetCondition(conditions *[]metav1.Condition, newCond metav1.Condition) {
	if conditions == nil {
		return
	}
	for i, cond := range *conditions {
		if cond.Type == newCond.Type {
			(*conditions)[i] = newCond
			return
		}
	}
	*conditions = append(*conditions, newCond)
}

// FindCondition returns the condition with the given type, or nil if not found.
func FindCondition(conditions []metav1.Condition, condType string) *metav1.Condition {
	for i := range conditions {
		if conditions[i].Type == condType {
			return &conditions[i]
		}
	}
	return nil
}

// RemoveCondition removes a condition of the given type.
func RemoveCondition(conditions *[]metav1.Condition, condType string) {
	if conditions == nil {
		return
	}
	newConds := make([]metav1.Condition, 0, len(*conditions))
	for _, cond := range *conditions {
		if cond.Type != condType {
			newConds = append(newConds, cond)
		}
	}
	*conditions = newConds
}
