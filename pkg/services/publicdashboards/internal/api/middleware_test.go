package api

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"errors"

	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	publicdashboards "github.com/grafana/grafana/pkg/services/publicdashboards/internal"
	"github.com/grafana/grafana/pkg/services/publicdashboards/internal/service"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/web"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

var validAccessToken, _ = service.GenerateAccessToken()

func TestRequiresExistingAccessToken(t *testing.T) {
	tests := []struct {
		Name                 string
		Path                 string
		AccessTokenExists    bool
		AccessTokenExistsErr error
		AccessToken          string
		ExpectedResponseCode int
		// ExpectLookup is true when the middleware should call ExistsEnabledByAccessToken.
		// Missing/invalid tokens must stop before that lookup so a later 404/500 cannot overwrite a 400.
		ExpectLookup bool
	}{
		{
			Name:                 "Returns 200 when public dashboard with access token exists",
			Path:                 "/api/public/ma/events/myAccesstoken",
			AccessTokenExists:    true,
			AccessTokenExistsErr: nil,
			AccessToken:          validAccessToken,
			ExpectedResponseCode: http.StatusOK,
			ExpectLookup:         true,
		},
		{
			Name:                 "Returns 400 when access token is empty",
			Path:                 "/api/public/ma/events/",
			AccessTokenExists:    false,
			AccessTokenExistsErr: nil,
			AccessToken:          "",
			ExpectedResponseCode: http.StatusBadRequest,
			ExpectLookup:         false,
		},
		{
			Name:                 "Returns 400 when invalid access token",
			Path:                 "/api/public/ma/events/myAccesstoken",
			AccessTokenExists:    false,
			AccessTokenExistsErr: nil,
			AccessToken:          "invalidAccessToken",
			ExpectedResponseCode: http.StatusBadRequest,
			ExpectLookup:         false,
		},
		{
			Name:                 "Returns 404 when public dashboard with access token does not exist",
			Path:                 "/api/public/ma/events/myAccesstoken",
			AccessTokenExists:    false,
			AccessTokenExistsErr: nil,
			AccessToken:          validAccessToken,
			ExpectedResponseCode: http.StatusNotFound,
			ExpectLookup:         true,
		},
		{
			Name:                 "Returns 500 when public dashboard service gives an error",
			Path:                 "/api/public/ma/events/myAccesstoken",
			AccessTokenExists:    false,
			AccessTokenExistsErr: fmt.Errorf("error not found"),
			AccessToken:          validAccessToken,
			ExpectedResponseCode: http.StatusInternalServerError,
			ExpectLookup:         true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.Name, func(t *testing.T) {
			publicdashboardService := &publicdashboards.FakePublicDashboardService{}
			if tt.ExpectLookup {
				publicdashboardService.On("ExistsEnabledByAccessToken", mock.Anything, mock.Anything).
					Return(tt.AccessTokenExists, tt.AccessTokenExistsErr).Once()
			}
			params := map[string]string{":accessToken": tt.AccessToken}
			mw := RequiresExistingAccessToken(publicdashboardService)
			_, resp := runMw(t, nil, "GET", tt.Path, params, mw)
			require.Equal(t, tt.ExpectedResponseCode, resp.Code)
			if tt.ExpectLookup {
				publicdashboardService.AssertCalled(t, "ExistsEnabledByAccessToken", mock.Anything, mock.Anything)
			} else {
				publicdashboardService.AssertNotCalled(t, "ExistsEnabledByAccessToken", mock.Anything, mock.Anything)
			}
		})
	}
}

func TestSetPublicDashboardOrgIdOnContext(t *testing.T) {
	tests := []struct {
		Name          string
		AccessToken   string
		OrgIdResp     int64
		ErrorResp     error
		ExpectedOrgId int64
	}{
		{
			Name:          "Adds orgId for enabled public dashboard",
			AccessToken:   validAccessToken,
			OrgIdResp:     7,
			ErrorResp:     nil,
			ExpectedOrgId: 7,
		},
		{
			Name:          "Does not set orgId or fail with invalid accessToken",
			AccessToken:   "invalidAccessToken",
			OrgIdResp:     0,
			ErrorResp:     nil,
			ExpectedOrgId: 0,
		},
		{
			Name:          "Does not set orgId or fail with disabled public dashboard",
			AccessToken:   validAccessToken,
			OrgIdResp:     0,
			ErrorResp:     nil,
			ExpectedOrgId: 0,
		},
		{
			Name:          "Does not set orgId or fail with error querying public dashboard",
			AccessToken:   validAccessToken,
			OrgIdResp:     0,
			ErrorResp:     errors.New("database error of some sort"),
			ExpectedOrgId: 0,
		},
		{
			Name:          "Does not set orgId or fail with missing public dashboard",
			AccessToken:   validAccessToken,
			OrgIdResp:     0,
			ErrorResp:     nil,
			ExpectedOrgId: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.Name, func(t *testing.T) {
			publicdashboardService := &publicdashboards.FakePublicDashboardService{}
			publicdashboardService.On("GetOrgIdByAccessToken", mock.Anything, tt.AccessToken).Return(
				tt.OrgIdResp,
				tt.ErrorResp,
			)

			params := map[string]string{":accessToken": tt.AccessToken}
			mw := SetPublicDashboardOrgIdOnContext(publicdashboardService)
			ctx, _ := runMw(t, nil, "GET", "/public-dashboard/myaccesstoken", params, mw)
			assert.Equal(t, tt.ExpectedOrgId, ctx.OrgID)
		})
	}
}

func TestSetPublicDashboardFlag(t *testing.T) {
	t.Run("Adds context.PublicDashboardAccessToken to request", func(t *testing.T) {
		ctx := &contextmodel.ReqContext{Context: &web.Context{Req: web.SetURLParams(&http.Request{}, map[string]string{":accessToken": "asdfasdfasdfsadfasdfsfd"})}}
		SetPublicDashboardAccessToken(ctx)
		assert.NotEmpty(t, ctx.PublicDashboardAccessToken)
	})
}

// This is a helper to test middleware. It handles creating a
// proper contextmodel.ReqContext, setting web parameters, executing middleware, and
// returning a response. Response will default to result of
// httptest.NewRecorder() return value and will only change if modified by the
// middlware as this will no accept a handler method
func runMw(t *testing.T, ctx *contextmodel.ReqContext, httpmethod string, path string, webparams map[string]string, mw func(c *contextmodel.ReqContext)) (*contextmodel.ReqContext, *httptest.ResponseRecorder) {
	// create valid request context and set 0 values if they don't exist
	if ctx == nil {
		ctx = &contextmodel.ReqContext{}
	}
	if ctx.Context == nil {
		ctx.Context = &web.Context{}
	}
	if ctx.SignedInUser == nil {
		ctx.SignedInUser = &user.SignedInUser{}
	}

	// create request and add params
	request, err := http.NewRequest(httpmethod, path, nil)
	require.NoError(t, err)
	request = web.SetURLParams(request, webparams)
	ctx.Req = request

	// setup response recorder to return
	response := httptest.NewRecorder()
	ctx.Resp = web.NewResponseWriter("GET", response)

	// run middleware
	mw(ctx)

	// return result
	return ctx, response
}
