package expr

import (
	"encoding/json"
	"errors"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/services/datasources"
)

func TestGetSQLSchemas(t *testing.T) {
	dsQuery := func(refID string) Query {
		return Query{
			RefID: refID,
			DataSource: &datasources.DataSource{
				OrgID: 1,
				UID:   "test",
				Type:  "test",
			},
			JSON: json.RawMessage(`{ "datasource": { "uid": "1" }, "intervalMs": 1000, "maxDataPoints": 1000 }`),
			TimeRange: AbsoluteTimeRange{
				From: time.Time{},
				To:   time.Time{},
			},
		}
	}

	t.Run("partial success when one datasource errors", func(t *testing.T) {
		okFrame := data.NewFrame("",
			data.NewField("time", nil, []time.Time{time.Unix(1, 0)}),
			data.NewField("value", nil, []float64{2.0}),
		)
		s, req := newMockQueryService(map[string]backend.DataResponse{
			"A": {Frames: data.Frames{okFrame}},
			"B": {Error: errors.New("datasource B failed")},
		}, []Query{dsQuery("A"), dsQuery("B")})

		schemas, err := s.GetSQLSchemas(t.Context(), *req)
		require.NoError(t, err)
		require.Contains(t, schemas, "A")
		require.Contains(t, schemas, "B")

		require.Empty(t, schemas["A"].Error)
		require.Len(t, schemas["A"].Columns, 2)
		require.Equal(t, "time", schemas["A"].Columns[0].Name)
		require.Equal(t, "value", schemas["A"].Columns[1].Name)

		require.NotEmpty(t, schemas["B"].Error)
		require.Contains(t, schemas["B"].Error, "datasource B failed")
		require.Empty(t, schemas["B"].Columns)
	})

	t.Run("empty frames return no data error", func(t *testing.T) {
		s, req := newMockQueryService(map[string]backend.DataResponse{
			"A": {Frames: data.Frames{}},
		}, []Query{dsQuery("A")})

		schemas, err := s.GetSQLSchemas(t.Context(), *req)
		require.NoError(t, err)
		info := schemas["A"]
		require.Equal(t, "no data", info.Error)
		require.Empty(t, info.Columns)
		require.Empty(t, info.SampleRows.Values())
	})

	t.Run("sample rows are capped at 3", func(t *testing.T) {
		times := make([]time.Time, 5)
		values := make([]float64, 5)
		for i := range 5 {
			times[i] = time.Unix(int64(i+1), 0)
			values[i] = float64(i + 10)
		}
		frame := data.NewFrame("",
			data.NewField("time", nil, times),
			data.NewField("value", nil, values),
		)
		s, req := newMockQueryService(map[string]backend.DataResponse{
			"A": {Frames: data.Frames{frame}},
		}, []Query{dsQuery("A")})

		schemas, err := s.GetSQLSchemas(t.Context(), *req)
		require.NoError(t, err)
		info := schemas["A"]
		require.Empty(t, info.Error)
		rows := info.SampleRows.Values()
		require.Len(t, rows, 3)

		require.Equal(t, time.Unix(1, 0), rows[0][0])
		require.Equal(t, float64(10), rows[0][1])
		require.Equal(t, time.Unix(3, 0), rows[2][0])
		require.Equal(t, float64(12), rows[2][1])
	})
}
