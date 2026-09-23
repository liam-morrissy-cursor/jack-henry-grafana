package snapshot

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	authlib "github.com/grafana/authlib/types"
	dashv0 "github.com/grafana/grafana/apps/dashboard/pkg/apis/dashboard/v0alpha1"
	"github.com/grafana/grafana/pkg/components/simplejson"
	"github.com/grafana/grafana/pkg/services/dashboardsnapshots"
)

func newWrapperForSnapshot(t *testing.T, snap *dashboardsnapshots.DashboardSnapshot) *storageWrapper {
	t.Helper()
	mockService := dashboardsnapshots.NewMockService(t)
	mockService.On("GetDashboardSnapshot", mock.Anything, mock.Anything).Return(snap, nil)
	return &storageWrapper{
		inner: &SnapshotLegacyStore{
			ResourceInfo: dashv0.SnapshotResourceInfo,
			Service:      mockService,
			Namespacer:   authlib.OrgNamespaceFormatter,
		},
	}
}

func testDashboardSnapshot(expires time.Time) *dashboardsnapshots.DashboardSnapshot {
	return &dashboardsnapshots.DashboardSnapshot{
		Key:       "snap-1",
		DeleteKey: "secret-delete-key",
		OrgID:     1,
		Dashboard: simplejson.NewFromAny(map[string]any{"title": "panel data"}),
		Expires:   expires,
		Created:   time.Now().Add(-time.Hour),
		Updated:   time.Now().Add(-time.Hour),
	}
}

func TestStorageWrapper_Get_Expired(t *testing.T) {
	w := newWrapperForSnapshot(t, testDashboardSnapshot(time.Now().Add(-time.Hour)))

	obj, err := w.Get(ctxForOrg(1), "snap-1", &metav1.GetOptions{})
	require.Error(t, err)
	assert.True(t, apierrors.IsNotFound(err), "expected NotFound, got %v", err)
	assert.Nil(t, obj)
}

func TestStorageWrapper_Get_Unexpired(t *testing.T) {
	w := newWrapperForSnapshot(t, testDashboardSnapshot(time.Now().Add(time.Hour)))

	obj, err := w.Get(ctxForOrg(1), "snap-1", &metav1.GetOptions{})
	require.NoError(t, err)
	snap, ok := obj.(*dashv0.Snapshot)
	require.True(t, ok)
	assert.Equal(t, "snap-1", snap.Name)
	assert.Nil(t, snap.Spec.Dashboard, "wrapper must still strip dashboard from GET")
	assert.Nil(t, snap.Spec.DeleteKey, "wrapper must still strip deleteKey from GET")
}

func TestStorageWrapper_Get_NeverExpires(t *testing.T) {
	// Legacy create path stores ~50 years for "no expiry"; conversion drops Spec.Expires.
	w := newWrapperForSnapshot(t, testDashboardSnapshot(time.Now().Add(50*365*24*time.Hour)))

	obj, err := w.Get(ctxForOrg(1), "snap-1", &metav1.GetOptions{})
	require.NoError(t, err)
	require.NotNil(t, obj)
}

func TestSnapshotIsExpired(t *testing.T) {
	past := time.Now().Add(-time.Minute).UnixMilli()
	future := time.Now().Add(time.Minute).UnixMilli()
	zero := int64(0)

	assert.False(t, snapshotIsExpired(nil))
	assert.False(t, snapshotIsExpired(&dashv0.Snapshot{}))
	assert.False(t, snapshotIsExpired(&dashv0.Snapshot{Spec: dashv0.SnapshotSpec{Expires: &zero}}))
	assert.False(t, snapshotIsExpired(&dashv0.Snapshot{Spec: dashv0.SnapshotSpec{Expires: &future}}))
	assert.True(t, snapshotIsExpired(&dashv0.Snapshot{Spec: dashv0.SnapshotSpec{Expires: &past}}))
}
