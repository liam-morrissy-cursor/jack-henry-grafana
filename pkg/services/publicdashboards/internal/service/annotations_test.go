package service

import (
	"testing"

	"github.com/grafana/grafana/pkg/components/simplejson"
	"github.com/grafana/grafana/pkg/kinds/dashboard"
	"github.com/grafana/grafana/pkg/tsdb/grafanads"
	"github.com/stretchr/testify/require"
)

func TestUnmarshalDashboardAnnotations_legacyStringDatasource(t *testing.T) {
	data, err := simplejson.NewJson([]byte(`{
		"annotations": {
			"list": [
				{
					"builtIn": 1,
					"datasource": "-- Grafana --",
					"enable": true,
					"name": "Annotations & Alerts",
					"type": "dashboard"
				}
			]
		}
	}`))
	require.NoError(t, err)

	dto, err := UnmarshalDashboardAnnotations(data)
	require.NoError(t, err)
	require.Len(t, dto.Annotations.List, 1)
	require.NotNil(t, dto.Annotations.List[0].Datasource.Uid)
	require.Equal(t, grafanads.DatasourceName, *dto.Annotations.List[0].Datasource.Uid)
	require.True(t, isGrafanaAnnotation(dto.Annotations.List[0]))
}

func TestUnmarshalDashboardAnnotations_missingDatasourceDoesNotFail(t *testing.T) {
	data, err := simplejson.NewJson([]byte(`{
		"annotations": {
			"list": [
				{
					"builtIn": 1,
					"enable": true,
					"name": "Annotations & Alerts",
					"type": "dashboard"
				}
			]
		}
	}`))
	require.NoError(t, err)

	dto, err := UnmarshalDashboardAnnotations(data)
	require.NoError(t, err)
	require.Len(t, dto.Annotations.List, 1)
	require.Nil(t, dto.Annotations.List[0].Datasource.Uid)
	require.True(t, isGrafanaAnnotation(dto.Annotations.List[0]))
}

func TestIsGrafanaAnnotation(t *testing.T) {
	grafanaUID := grafanads.DatasourceUID
	grafanaName := grafanads.DatasourceName
	promUID := "abc123"
	grafanaType := "grafana"
	builtIn := 1.0
	dashboardType := "dashboard"

	t.Run("matches grafana uid or name", func(t *testing.T) {
		require.True(t, isGrafanaAnnotation(dashboard.AnnotationQuery{
			Datasource: dashboard.DataSourceRef{Uid: &grafanaUID},
		}))
		require.True(t, isGrafanaAnnotation(dashboard.AnnotationQuery{
			Datasource: dashboard.DataSourceRef{Uid: &grafanaName},
		}))
	})

	t.Run("skips plugin datasource even if built-in markers are set", func(t *testing.T) {
		require.False(t, isGrafanaAnnotation(dashboard.AnnotationQuery{
			Datasource: dashboard.DataSourceRef{Uid: &promUID},
			BuiltIn:    &builtIn,
			Type:       &dashboardType,
		}))
	})

	t.Run("treats missing uid with grafana type or built-in markers as grafana", func(t *testing.T) {
		require.True(t, isGrafanaAnnotation(dashboard.AnnotationQuery{
			Datasource: dashboard.DataSourceRef{Type: &grafanaType},
		}))
		require.True(t, isGrafanaAnnotation(dashboard.AnnotationQuery{
			BuiltIn: &builtIn,
		}))
		require.True(t, isGrafanaAnnotation(dashboard.AnnotationQuery{
			Type: &dashboardType,
		}))
	})

	t.Run("skips enable-only plugin-shaped annotations with no identity", func(t *testing.T) {
		require.False(t, isGrafanaAnnotation(dashboard.AnnotationQuery{Enable: true}))
	})
}
