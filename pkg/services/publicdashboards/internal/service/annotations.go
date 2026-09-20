package service

import (
	"encoding/json"

	"github.com/grafana/grafana/pkg/components/simplejson"
	"github.com/grafana/grafana/pkg/kinds/dashboard"
	"github.com/grafana/grafana/pkg/services/publicdashboards/internal/models"
	"github.com/grafana/grafana/pkg/tsdb/grafanads"
)

func UnmarshalDashboardAnnotations(sj *simplejson.Json) (*models.AnnotationsDto, error) {
	normalized, err := normalizeAnnotationDatasources(sj)
	if err != nil {
		return nil, err
	}
	bytes, err := normalized.MarshalJSON()
	if err != nil {
		return nil, err
	}
	dto := &models.AnnotationsDto{}
	err = json.Unmarshal(bytes, dto)
	if err != nil {
		return nil, err
	}

	return dto, err
}

// normalizeAnnotationDatasources rewrites legacy string datasources
// (e.g. "-- Grafana --") into {uid} objects so encoding/json can unmarshal
// AnnotationQuery.Datasource. Many persisted / imported dashboards still use
// the pre-object form.
func normalizeAnnotationDatasources(sj *simplejson.Json) (*simplejson.Json, error) {
	bytes, err := sj.MarshalJSON()
	if err != nil {
		return nil, err
	}
	clone, err := simplejson.NewJson(bytes)
	if err != nil {
		return nil, err
	}

	for _, item := range clone.GetPath("annotations", "list").MustArray() {
		anno, ok := item.(map[string]any)
		if !ok {
			continue
		}
		raw, exists := anno["datasource"]
		if !exists || raw == nil {
			continue
		}
		s, ok := raw.(string)
		if !ok {
			continue
		}
		if s == "" {
			delete(anno, "datasource")
			continue
		}
		anno["datasource"] = map[string]any{"uid": s}
	}

	return clone, nil
}

// isGrafanaAnnotation reports whether the annotation should be served from
// Grafana's annotation store. Public dashboards only execute Grafana-native
// annotation queries; plugin datasources are skipped.
//
// Built-in "Annotations & Alerts" entries often omit datasource.uid (or only
// set type / builtIn / type:"dashboard"). Dereferencing Uid in that case
// panics, so missing identity is treated as Grafana when those markers are set.
func isGrafanaAnnotation(anno dashboard.AnnotationQuery) bool {
	if anno.Datasource.Uid != nil && *anno.Datasource.Uid != "" {
		uid := *anno.Datasource.Uid
		return uid == grafanads.DatasourceUID || uid == grafanads.DatasourceName
	}
	if anno.Datasource.Type != nil && *anno.Datasource.Type != "" {
		dsType := *anno.Datasource.Type
		return dsType == "grafana" || dsType == grafanads.DatasourceName
	}
	if anno.BuiltIn != nil && *anno.BuiltIn == 1 {
		return true
	}
	if anno.Type != nil {
		t := *anno.Type
		return t == "dashboard" || t == "grafana"
	}
	return false
}
