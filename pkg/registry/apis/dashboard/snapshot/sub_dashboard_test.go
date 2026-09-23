package snapshot

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	apierrors "k8s.io/apimachinery/pkg/api/errors"

	authlib "github.com/grafana/authlib/types"
	dashv0 "github.com/grafana/grafana/apps/dashboard/pkg/apis/dashboard/v0alpha1"
	"github.com/grafana/grafana/pkg/services/dashboardsnapshots"
)

func newDashboardREST(t *testing.T, snap *dashboardsnapshots.DashboardSnapshot) *dashboardREST {
	t.Helper()
	mockService := dashboardsnapshots.NewMockService(t)
	mockService.On("GetDashboardSnapshot", mock.Anything, mock.Anything).Return(snap, nil)
	return &dashboardREST{
		getter: &SnapshotLegacyStore{
			ResourceInfo: dashv0.SnapshotResourceInfo,
			Service:      mockService,
			Namespacer:   authlib.OrgNamespaceFormatter,
		},
	}
}

func TestDashboardREST_Connect_Expired(t *testing.T) {
	r := newDashboardREST(t, testDashboardSnapshot(time.Now().Add(-time.Hour)))
	responder := &capturingResponder{}

	handler, err := r.Connect(ctxForOrg(1), "snap-1", nil, responder)
	require.Error(t, err)
	assert.True(t, apierrors.IsNotFound(err), "expected NotFound, got %v", err)
	assert.Nil(t, handler)
	assert.Nil(t, responder.obj)
}

func TestDashboardREST_Connect_Unexpired(t *testing.T) {
	r := newDashboardREST(t, testDashboardSnapshot(time.Now().Add(time.Hour)))
	responder := &capturingResponder{}

	handler, err := r.Connect(ctxForOrg(1), "snap-1", nil, responder)
	require.NoError(t, err)
	require.NotNil(t, handler)

	handler.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/", nil))
	require.NoError(t, responder.err)

	dash, ok := responder.obj.(*dashv0.Dashboard)
	require.True(t, ok, "expected Dashboard, got %T", responder.obj)
	assert.Equal(t, "panel data", dash.Spec.Object["title"])
}
